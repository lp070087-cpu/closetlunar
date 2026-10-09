'use client';

import { useEffect, useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { SectionHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ConfirmModal } from '@/components/ui/modal';
import { TableSkeleton } from '@/components/ui/states';
import {
  createCoupon,
  deleteCoupon,
  listCoupons,
  toggleCoupon,
  updateCoupon,
} from '@/lib/cupons/data';
import { countActive, sortCoupons, totalUses } from '@/lib/cupons/metrics';
import {
  applyCode,
  draftFromCoupon,
  draftToCoupon,
  emptyDraft,
  hasErrors,
  localId,
  validateDraft,
} from '@/lib/cupons/form';
import type { Coupon, CouponDraft, CouponFieldErrors } from '@/lib/cupons/types';
import { CouponForm, UnsavedNotice } from './coupon-form';
import { CouponTable } from './coupon-table';

/**
 * Tela de Cupons (`/admin/cupons`) — reconstruida de adm-012 e adm-013.
 *
 * OS DOIS PRINTS SAO A MESMA TELA. Nao ha abas, e nao ha duas rotas:
 *
 *   adm-012   a lista, com o contador `1 cupom(s) cadastrados`, o botao
 *             `NOVO CUPOM` a direita e a tabela de sete colunas
 *
 *   adm-013   a mesma tela com o bloco `Novo cupom` ABERTO ENTRE o contador e a
 *             tabela — inline, e nao em modal, e com a tabela visivel por baixo
 *
 * O CABECALHO VEM DAQUI, e nao da casca. O `AdminShell` desenha o rotulo
 * `Cupons` pequeno no topbar; o titulo serifado grande `Cupons` e a descricao
 * `Crie códigos promocionais para impulsionar suas vendas.` sao desta tela, e o
 * `SectionHeader` do design system ja desenha exatamente esse par — e o que
 * `Pedidos` faz.
 *
 * O `1 cupom(s) cadastrados` E CALCULADO da lista, e nao escrito. Ele diz
 * `1 cupom(s)` no print porque a lista tem um; com dois, o mesmo codigo escreve
 * `2 cupom(s)`.
 *
 * A LINHA DE BAIXO DO PRINT (adm-012) NAO TEM TITULO DE PAGINA NENHUM. O
 * `console` engana: `Painel administrativo / Cupons` no topo e o eyebrow do
 * topbar. O titulo grande fica no corpo, como em todas as telas do painel.
 */
export function CuponsView() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const [draft, setDraft] = useState<CouponDraft | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [errors, setErrors] = useState<CouponFieldErrors>({});
  const [saving, setSaving] = useState(false);
  const [outcome, setOutcome] = useState<'none' | 'unsaved'>('none');
  const [pendingDelete, setPendingDelete] = useState<Coupon | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await listCoupons();
        if (!alive) return;
        setCoupons(result.data);
      } catch {
        if (alive) setError('Não foi possível carregar os cupons.');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [reloadKey]);

  /**
   * A LISTA COMO ELA E EXIBIDA.
   *
   * `sortCoupons` ordena no cliente mesmo com `listCoupons` ja ordenando: e o
   * que faz a lista continuar na ordem certa depois que um cupom NOVO entra
   * pelo topo do array sem passar pela camada de dados. Sem isso, o cupom
   * recem-criado apareceria no fim por acidente da ordem de insercao, e nao no
   * topo como o `created_at desc` do original manda.
   */
  const visible = useMemo(() => sortCoupons(coupons), [coupons]);

  /**
   * O RESUMO. Duas perguntas diferentes, e a segunda NAO e o `length`.
   *
   * O contador do print conta CUPONS CADASTRADOS — todos, ativos e inativos.
   * `countActive` responde outra pergunta (`quantos valem hoje`), e ela nao
   * aparece na tela; existe para a bancada provar que as duas nao sao a mesma
   * coisa, que e o erro facil de cometer quando se escreve `coupons.length` nos
   * dois lugares.
   */
  const totals = useMemo(
    () => ({ total: visible.length, active: countActive(visible), uses: totalUses(visible) }),
    [visible],
  );

  function openNew() {
    setEditingId(null);
    setErrors({});
    setOutcome('none');
    setDraft(emptyDraft());
  }

  function openEdit(coupon: Coupon) {
    setEditingId(coupon.id);
    setErrors({});
    setOutcome('none');
    setDraft(draftFromCoupon(coupon));
  }

  function closeForm() {
    setDraft(null);
    setEditingId(null);
    setErrors({});
  }

  async function submit() {
    if (!draft) return;
    // O codigo ja subiu em `applyCode` a cada tecla; o `trim` fica aqui porque
    // cortar espaco a cada tecla impediria de digitar `CLOSET 10`.
    const normalized = applyCode(draft, draft.code.trim());
    const found = validateDraft(normalized, coupons, editingId ?? undefined);
    setErrors(found);
    if (hasErrors(found)) return;

    setSaving(true);
    const existing = editingId ? coupons.find((row) => row.id === editingId) : undefined;
    const coupon = draftToCoupon(normalized, {
      id: existing?.id ?? localId(),
      createdAt: existing?.createdAt ?? new Date().toISOString(),
      // Usos e descricao NAO sao campos do formulario: preservados do que ja
      // existia, e zero/vazio num cupom novo.
      usesCount: existing?.usesCount ?? 0,
      description: existing?.description ?? '',
    });

    const result = existing ? await updateCoupon(coupon) : await createCoupon(coupon);
    setSaving(false);

    // A LISTA LOCAL SO MUDA SE NAO PERSISTIU. Com o Neon ligado, quem manda na
    // lista e a releitura do banco, e aplicar a mudanca aqui mostraria um
    // estado que o servidor ainda nao confirmou.
    if (!result.persisted) {
      setCoupons((current) =>
        existing
          ? current.map((row) => (row.id === coupon.id ? coupon : row))
          : [coupon, ...current],
      );
    }

    setOutcome(result.persisted ? 'none' : 'unsaved');
    // O FORMULARIO FECHA, como no original (`cancel()` no fim de `save()`). O
    // aviso de que nada foi gravado NAO mora dentro dele — ver `UnsavedNotice`.
    closeForm();
    if (result.persisted) setReloadKey((key) => key + 1);
  }

  async function confirmDelete() {
    const target = pendingDelete;
    if (!target) return;
    const result = await deleteCoupon(target.id);
    if (!result.persisted) {
      // Fechar a linha da lista sem apagar no banco seria a mentira pior: o
      // cupom voltaria no proximo carregamento. A lista local so cai junto com
      // o aviso, para o usuario ver os dois ao mesmo tempo.
      setCoupons((current) => current.filter((row) => row.id !== target.id));
      setOutcome('unsaved');
    }
    setPendingDelete(null);
  }

  async function toggle(coupon: Coupon) {
    const result = await toggleCoupon(coupon, !coupon.isActive);
    if (!result.persisted) {
      setCoupons((current) =>
        current.map((row) => (row.id === coupon.id ? { ...row, isActive: !row.isActive } : row)),
      );
      setOutcome('unsaved');
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 lg:space-y-8">
        <SectionHeader
          title="Cupons"
          description="Crie códigos promocionais para impulsionar suas vendas."
        />
        <div className="surface p-6 sm:p-8">
          <TableSkeleton rows={3} columns={7} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6 lg:space-y-8">
        <SectionHeader
          title="Cupons"
          description="Crie códigos promocionais para impulsionar suas vendas."
        />
        <div
          role="alert"
          className="flex flex-col items-center justify-center gap-4 rounded-3xl border border-dashed border-danger/40 bg-danger-surface/40 px-6 py-12 text-center"
        >
          <div>
            <p className="font-serif text-lg">{error}</p>
            <p className="mt-1 max-w-md text-sm text-muted-foreground">
              Tente novamente em instantes. Se persistir, verifique a conexão com o banco de dados.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setReloadKey((key) => key + 1)}
            className="focus-ring rounded-full border border-border bg-background px-4 py-2 text-[10px] font-bold uppercase tracking-[0.16em]"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 lg:space-y-8 motion-safe:animate-fade-up">
      {/*
        O TITULO VAI SEM ACAO. O `SectionHeader` aceita `action` e o levaria
        para a direita do TITULO — e o print NAO faz isso: o botao `NOVO CUPOM`
        fica na LINHA DO CONTADOR, abaixo da descricao, alinhado a direita.
        (Pedidos usa `action` porque o print dele poe as abas ali; Cupons nao.)
      */}
      <SectionHeader
        title="Cupons"
        description="Crie códigos promocionais para impulsionar suas vendas."
      />

      {/*
        A LINHA DO CONTADOR, com o botao a direita, como adm-012.
        O `1 cupom(s) cadastrados` e CALCULADO: com dois cupons o mesmo codigo
        escreve `2 cupom(s) cadastrados`.
      */}
      <div className="flex items-center justify-between gap-4">
        <p className="text-xs text-muted-foreground">{totals.total} cupom(s) cadastrados</p>
        <Button type="button" size="sm" onClick={openNew}>
          <Plus className="size-3.5" aria-hidden />
          Novo cupom
        </Button>
      </div>

      <UnsavedNotice visible={outcome === 'unsaved'} />

      {draft ? (
        <CouponForm
          draft={draft}
          errors={errors}
          editingCode={editingId ? (coupons.find((row) => row.id === editingId)?.code ?? '') : null}
          saving={saving}
          outcome={outcome}
          onChange={setDraft}
          onCancel={closeForm}
          onSubmit={submit}
        />
      ) : null}

      <CouponTable
        rows={visible}
        // Nao ha campo de busca nos prints de Cupons; a lista vazia so pode ser
        // "nao ha cupom". O parametro existe para o dia em que a busca entrar.
        hasFilter={false}
        onEdit={openEdit}
        onDelete={setPendingDelete}
        onToggle={toggle}
      />

      <ConfirmModal
        open={pendingDelete !== null}
        onClose={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
        title={pendingDelete ? `Excluir cupom ${pendingDelete.code}?` : 'Excluir cupom?'}
        description="Esta ação não pode ser desfeita. O cupom deixa de valer na loja imediatamente."
        confirmLabel="Excluir"
      />
    </div>
  );
}
