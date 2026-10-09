'use client';

import { useEffect, useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { SectionHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TableSkeleton } from '@/components/ui/states';
import { listAffiliates, saveAffiliate, setAffiliateStatus } from '@/lib/afiliadas/data';
import {
  countActive,
  nextStatus,
  sortAffiliates,
  toggleActionLabel,
} from '@/lib/afiliadas/metrics';
import {
  applyCouponCode,
  draftFromAffiliate,
  draftToAffiliate,
  emptyDraft,
  hasErrors,
  localId,
  validateDraft,
  type AffiliateFieldErrors,
} from '@/lib/afiliadas/form';
import type { Affiliate, AffiliateDraft } from '@/lib/afiliadas/types';
import { AffiliateForm } from './affiliate-form';
import { AffiliateTable } from './affiliate-table';

/**
 * Tela de Afiliadas (`/admin/afiliadas`) — reconstruida de adm-021 e adm-022.
 *
 * OS DOIS PRINTS SAO A MESMA TELA:
 *
 *   adm-021   a lista, com o titulo `Gerenciar Afiliadas` e o botao `+ Nova
 *             Afiliada` a DIREITA do titulo, na mesma linha
 *
 *   adm-022   a mesma tela com o modal `Nova Afiliada` ABERTO por cima
 *
 * O BOTAO FICA AO LADO DO TITULO, e nao numa linha de contador abaixo dele como
 * em Cupons. A diferenca e do material: em adm-021 nao ha contador nenhum, e o
 * `+ Nova Afiliada` esta na MESMA linha do `Gerenciar Afiliadas`, alinhado a
 * direita. Por isso o `SectionHeader` recebe `action` aqui — e o mesmo uso que
 * Pedidos faz — e NAO o par `flex justify-between` que Cupons usa.
 *
 * O TITULO E `Gerenciar Afiliadas`, e nao `Afiliadas`. O rotulo curto e o da
 * sidebar (`nav.ts`); o titulo serifado grande do corpo da tela e o do print, e
 * os dois convivem como em todo o painel. E o mesmo defeito ja registrado no
 * mapa para Carrinho Abandonado (`Carrinho Abandonado Automatico`): ler o titulo
 * do menu em vez do print.
 *
 * NAO HA DESCRICAO. O `nav.ts` traz uma (`Acompanhe quem divulga a loja e quanto
 * cada uma converteu.`), mas o print nao mostra linha nenhuma embaixo do titulo
 * — nem em adm-021, nem em adm-022. O `SectionHeader` aceita `description` e ela
 * fica de fora de proposito: o texto do menu e de outro contexto, e o print
 * manda. E o mesmo caso da descricao de Carrinho Abandonado.
 *
 * NAO HA CONTADOR. Cupons tem (`1 cupom(s) cadastrados`); Afiliadas nao tem
 * nenhum print com contador, e inventa-lo seria acrescentar interface. O
 * `countActive` continua existindo em `metrics.ts` para a bancada poder provar
 * que "cadastradas" e "ativas" nao sao a mesma pergunta — mas nao esta ligado a
 * nenhuma celula da tela.
 */
export function AffiliatesView() {
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const [draft, setDraft] = useState<AffiliateDraft | null>(null);
  const [errors, setErrors] = useState<AffiliateFieldErrors>({});
  const [saving, setSaving] = useState(false);
  const [outcome, setOutcome] = useState<'none' | 'unsaved'>('none');

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await listAffiliates();
        if (!alive) return;
        setAffiliates(result.data);
      } catch {
        if (alive) setError('Não foi possível carregar as afiliadas.');
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
   * `sortAffiliates` ordena no cliente mesmo com `listAffiliates` ja ordenando:
   * e o que faz a lista continuar na ordem certa depois que uma afiliada NOVA
   * entra pelo topo do array sem passar pela camada de dados. Sem isso, a
   * recem-criada apareceria no fim por acidente da ordem de insercao, e nao no
   * topo como o `created_at desc` do original manda.
   */
  const visible = useMemo(() => sortAffiliates(affiliates), [affiliates]);

  /**
   * O TOTAL DE ATIVAS — calculado, e nao exibido. Ver o cabecalho da tela.
   * Mantido numa variavel de proposito: e o que a bancada le para provar que
   * `countActive(visible) !== visible.length` quando ha uma suspensa.
   */
  const activeCount = useMemo(() => countActive(visible), [visible]);

  function openNew() {
    setErrors({});
    setOutcome('none');
    setDraft(emptyDraft());
  }

  function openEdit(affiliate: Affiliate) {
    setErrors({});
    setOutcome('none');
    setDraft(draftFromAffiliate(affiliate));
  }

  function closeForm() {
    setDraft(null);
    setErrors({});
  }

  async function submit() {
    if (!draft) return;
    // O cupom ja subiu em maiuscula a cada tecla; o `trim` fica aqui porque
    // cortar espaco a cada tecla impediria de digitar `LUNA 10`.
    const normalized = applyCouponCode(draft, draft.couponCode.trim());
    // `editingId` e `''` numa afiliada nova — e o MESMO campo que decide o
    // titulo do modal. Converter para `undefined` evita que a validacao trate
    // `''` como um id existente e acuse conflito com a propria linha.
    const editingId = normalized.id || undefined;
    const found = validateDraft(normalized, affiliates, editingId);
    setErrors(found);
    if (hasErrors(found)) return;

    setSaving(true);
    const existing = editingId
      ? affiliates.find((row) => row.id === editingId)
      : undefined;
    const now = new Date().toISOString();
    const affiliate = draftToAffiliate(normalized, {
      id: existing?.id ?? localId(),
      // O STATUS VEM DO REGISTRO EXISTENTE, e nao do rascunho: o formulario nao
      // edita status. Uma afiliada suspensa continua suspensa depois de editar o
      // nome. Ver `draftToAffiliate`.
      status: existing?.status ?? 'active',
      // Os quatro campos que o formulario nao toca. Ver o cabecalho de
      // `data.ts`: omiti-los apagaria a coluna no `upsert`.
      bankInfo: existing?.bankInfo ?? null,
      userId: existing?.userId ?? null,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    });

    const result = await saveAffiliate(affiliate);
    setSaving(false);

    // A LISTA LOCAL SO MUDA SE NAO PERSISTIU. Com o Neon ligado, quem manda na
    // lista e a releitura do banco, e aplicar a mudanca aqui mostraria um estado
    // que o servidor ainda nao confirmou.
    if (!result.persisted) {
      setAffiliates((current) =>
        existing
          ? current.map((row) => (row.id === affiliate.id ? affiliate : row))
          : [affiliate, ...current],
      );
    }

    setOutcome(result.persisted ? 'none' : 'unsaved');
    // O FORMULARIO FECHA, como no original (`onClose()` no fim de `save()`). O
    // aviso de que nada foi gravado aparece na TELA, fora do modal, porque o
    // modal ja nao existe quando o resultado chega.
    closeForm();
    if (result.persisted) setReloadKey((key) => key + 1);
  }

  async function toggle(affiliate: Affiliate) {
    const target = nextStatus(affiliate.status);
    const result = await setAffiliateStatus(affiliate, target);
    if (!result.persisted) {
      setAffiliates((current) =>
        current.map((row) => (row.id === affiliate.id ? { ...row, status: target } : row)),
      );
      setOutcome('unsaved');
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 lg:space-y-8">
        {/* SEM DESCRICAO — ver o cabecalho da tela. */}
        <SectionHeader
          title="Gerenciar Afiliadas"
          action={
            <Button type="button" disabled>
              <Plus className="size-3.5" aria-hidden />
              Nova Afiliada
            </Button>
          }
        />
        <div className="surface p-6 sm:p-8">
          <TableSkeleton rows={3} columns={5} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6 lg:space-y-8">
        <SectionHeader title="Gerenciar Afiliadas" />
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
        O BOTAO NA MESMA LINHA DO TITULO, como adm-021 — ver o cabecalho.
        `+ Nova Afiliada` e o texto literal do print, com o `+` como GLIFO e nao
        como parte do rotulo: um leitor de tela leria `mais Nova Afiliada`.
      */}
      <SectionHeader
        title="Gerenciar Afiliadas"
        action={
          <Button type="button" onClick={openNew}>
            <Plus className="size-3.5" aria-hidden />
            Nova Afiliada
          </Button>
        }
      />

      {/*
        O AVISO DE "NAO GRAVADO". Ele fica FORA do modal, na tela, porque o modal
        ja fechou quando o resultado da gravacao chega — por isso nao usa o aviso
        de dentro do `AffiliateForm`, e sim este bloco. O `activeCount` so entra
        no texto quando ha suspensas, para a frase nao afirmar um numero que a
        tela nao mostra em lugar nenhum.
      */}
      {outcome === 'unsaved' ? (
        <div
          role="status"
          className="flex items-start gap-3 rounded-2xl border border-warning/40 bg-warning-surface/50 p-4 text-xs"
        >
          <span className="mt-0.5 shrink-0 font-bold text-warning-foreground" aria-hidden>
            !
          </span>
          <p className="text-warning-foreground">
            A lista foi alterada somente nesta tela, mas não foi gravada no banco. Enquanto o Neon
            não estiver conectado, {activeCount === 1 ? 'a afiliada ativa' : 'as afiliadas ativas'}{' '}
            não {activeCount === 1 ? 'recebe' : 'recebem'} comissão nenhuma.
          </p>
        </div>
      ) : null}

      <AffiliateTable rows={visible} onEdit={openEdit} onToggle={toggle} />

      {draft ? (
        <AffiliateForm
          draft={draft}
          errors={errors}
          saving={saving}
          outcome={outcome}
          onChange={setDraft}
          onCancel={closeForm}
          onSubmit={submit}
        />
      ) : null}
    </div>
  );
}

/**
 * O TEXTO DO BOTAO DE ACOES, reexportado para a bancada.
 *
 * A bancada renderiza a TABELA, e nao a tela — `renderToStaticMarkup` nao roda
 * `useEffect`, e a tela carrega dentro de um efeito. Por isso a funcao que
 * decide `Suspender` / `Ativar` precisa ser alcancavel de fora do modulo de
 * componentes, e este reexport e o caminho curto. Ela mora em `metrics.ts`.
 */
export { toggleActionLabel };
