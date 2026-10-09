'use client';

import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Plus } from 'lucide-react';
import { SectionHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TableSkeleton } from '@/components/ui/states';
import { listCoupons } from '@/lib/cupons/data';
import { topUsedCoupons } from '@/lib/cupons/metrics';
import type { Coupon } from '@/lib/cupons/types';
import { createCampaign, listCampaignPerformance, listCampaigns, updateCampaign } from '@/lib/campanhas/data';
import { sortCampaigns, topCampaignsByRevenue } from '@/lib/campanhas/metrics';
import {
  draftFromCampaign,
  draftToCampaign,
  emptyDraft,
  hasErrors,
  localId,
  validateDraft,
} from '@/lib/campanhas/form';
import type { Campaign, CampaignDraft, CampaignFieldErrors, CampaignPerformance } from '@/lib/campanhas/types';
import { CampaignForm, UnsavedNotice } from './campaign-form';
import { CampaignReport, CouponReport } from './campaign-reports';
import { CampaignTable } from './campaign-table';

/**
 * Tela de Campanhas (`/admin/campanhas`) — reconstruida de adm-006, adm-015,
 * adm-016 e adm-017.
 *
 * E UMA TELA SO, EM QUATRO ESTADOS:
 *
 *   adm-006   `0 campanha(s)`, tabela so com o cabecalho, os dois cards vazios
 *   adm-015   a lista CARREGADA: a tabela com `Nenhuma campanha ativa no
 *             momento.` e o card `Cupons mais usados` com `CLOSET10 · 0 usos`
 *   adm-016   o bloco `Nova Campanha` ABERTO entre o contador e a tabela
 *   adm-017   a mesma tela rolada, com os dois cards no fim
 *
 * A DIFERENCA ENTRE adm-006 E adm-015 E O ESTADO DE CARREGAMENTO, e ela e fina:
 * em adm-006 a tabela mostra o cabecalho e mais NADA — sem a mensagem de vazio —
 * e os dois cards dizem que nao ha dado. Em adm-015 aparece a mensagem de lista
 * vazia na tabela e o cupom preenchido no card. Ou seja: adm-006 e a leitura em
 * andamento (a lista ainda nao chegou, o cupom ainda nao chegou) e adm-015 e a
 * leitura concluida com listas vazias.
 *
 * ISSO E O CONTRARIO DE CUPONS, onde o print do carregamento mostra
 * `Carregando...` escrito. Aqui nao ha texto de carregamento: o que distingue e a
 * AUSENCIA da mensagem de vazio na tabela, com o esqueleto do cabecalho no lugar.
 * A tela reproduz exatamente essa distincao.
 *
 * O TITULO VEM DAQUI, e nao da casca. `Marketing & Campanhas` e "Gerencie
 * promoções automáticas, frete grátis e banners promocionais." sao o par do
 * print — e o mesmo defeito que CRM e Carrinho Abandonado tinham. O `AdminShell`
 * desenha so o eyebrow e o `h1` do topbar; a `description` do `nav.ts` NAO e lida
 * em lugar nenhum. O texto da `description` do `nav.ts` coincide com o do print
 * aqui, mas a semelhanca e coincidencia, nao heranca.
 *
 * O TITULO DA TELA NAO E O ROTULO DA SIDEBAR: a sidebar diz `Campanhas`, o corpo
 * diz `Marketing & Campanhas`. A casca mostra o da sidebar no topbar, e o corpo
 * mostra o do print. Os dois convivem, como em Carrinho Abandonado.
 *
 * ================== A UNIAO COM CUPONS ==================
 *
 * O card `Cupons mais usados` LE DO MODULO CUPONS: `listCoupons` +
 * `topUsedCoupons` de `lib/cupons/`. Este modulo NAO tem uma copia da logica de
 * cupons, e o card nao faz query propria — o `CouponReport` do original fazia, e
 * reproduzir isso criaria um SEGUNDO dono para o mesmo numero. A faixa de
 * `topUsedCoupons` (5) e a ordem (uso decrescente, empate pelo codigo) moram la, e
 * estao provadas pela bancada de Cupons.
 *
 * AS DUAS LEITURAS SAO INDEPENDENTES. Se a de cupons falhar, a tela continua: o
 * card de cupons cai para o estado vazio (`Sem cupons usados.`) e a pagina de
 * campanhas nao quebra por causa de outro modulo. Por isso sao dois `try`
 * separados, e nao uma leitura so.
 */
export function CampanhasView() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [performance, setPerformance] = useState<CampaignPerformance[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const [draft, setDraft] = useState<CampaignDraft | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [errors, setErrors] = useState<CampaignFieldErrors>({});
  const [saving, setSaving] = useState(false);
  const [outcome, setOutcome] = useState<'none' | 'unsaved'>('none');

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [listed, perf] = await Promise.all([listCampaigns(), listCampaignPerformance()]);
        // A leitura de cupons tem o proprio `try`: e dado de OUTRO modulo, e uma
        // falha la nao pode derrubar esta tela.
        let couponRows: Coupon[] = [];
        try {
          couponRows = (await listCoupons()).data;
        } catch {
          couponRows = [];
        }
        if (!alive) return;
        setCampaigns(listed.data);
        setPerformance(perf.data);
        setCoupons(couponRows);
      } catch {
        if (alive) setError('Não foi possível carregar as campanhas.');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [reloadKey]);

  const visible = useMemo(() => sortCampaigns(campaigns), [campaigns]);
  const topCampaigns = useMemo(() => topCampaignsByRevenue(performance), [performance]);
  const topCoupons = useMemo(() => topUsedCoupons(coupons), [coupons]);

  function openNew() {
    setEditingId(null);
    setErrors({});
    setOutcome('none');
    // A data de inicio entra preenchida com o dia de hoje — o print mostra a data
    // da captura nesse campo. O `toISOString().slice(0,10)` da o dia em UTC, que
    // num fuso a oeste pode ser o dia SEGUINTE; por isso o dia local e montado a
    // mao.
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    setDraft(emptyDraft(today));
  }

  function openEdit(campaign: Campaign) {
    setEditingId(campaign.id);
    setErrors({});
    setOutcome('none');
    setDraft(draftFromCampaign(campaign));
  }

  function closeForm() {
    setDraft(null);
    setEditingId(null);
    setErrors({});
  }

  async function submit() {
    if (!draft) return;
    const found = validateDraft(draft);
    setErrors(found);
    if (hasErrors(found)) return;

    setSaving(true);
    const existing = editingId ? campaigns.find((row) => row.id === editingId) : undefined;
    const campaign = draftToCampaign(draft, {
      id: existing?.id ?? localId(),
      createdAt: existing?.createdAt ?? new Date().toISOString(),
      // Campos fora do formulario: preservados do que ja existia, e vazios numa
      // campanha nova. Ver `form.ts`.
      description: existing?.description ?? '',
      bannerUrl: existing?.bannerUrl ?? '',
      bannerUrlMobile: existing?.bannerUrlMobile ?? '',
      targetIds: existing?.targetIds ?? [],
      rules: existing?.rules ?? {},
    });

    const result = existing ? await updateCampaign(campaign) : await createCampaign(campaign);
    setSaving(false);

    // A LISTA LOCAL SO MUDA SE NAO PERSISTIU. Com o Neon ligado, quem manda na
    // lista e a releitura do banco.
    if (!result.persisted) {
      setCampaigns((current) =>
        existing
          ? current.map((row) => (row.id === campaign.id ? campaign : row))
          : [campaign, ...current],
      );
    }

    setOutcome(result.persisted ? 'none' : 'unsaved');
    // O FORMULARIO FECHA, como no original (`setCreating(false)`). O aviso de que
    // nada foi gravado NAO mora dentro dele — ver `UnsavedNotice`.
    closeForm();
    if (result.persisted) setReloadKey((key) => key + 1);
  }

  if (loading) {
    return (
      <div className="space-y-6 lg:space-y-8">
        <SectionHeader
          title="Marketing & Campanhas"
          description="Gerencie promoções automáticas, frete grátis e banners promocionais."
        />
        <div className="flex items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">0 campanha(s)</p>
        </div>
        {/* O ESQUELETO DA TABELA, e nao a mensagem de lista vazia: e o que adm-006
            mostra — o cabecalho e nada mais. */}
        <div className="surface p-6 sm:p-8">
          <TableSkeleton rows={2} columns={6} />
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <CampaignReport rows={[]} />
          <CouponReport rows={[]} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6 lg:space-y-8">
        <SectionHeader
          title="Marketing & Campanhas"
          description="Gerencie promoções automáticas, frete grátis e banners promocionais."
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
      <SectionHeader
        title="Marketing & Campanhas"
        description="Gerencie promoções automáticas, frete grátis e banners promocionais."
      />

      {/*
        A LINHA DO CONTADOR. O `0 campanha(s)` e CALCULADO da lista, e nao escrito:
        com duas campanhas o mesmo codigo escreve `2 campanha(s)`. Ele conta TODAS,
        ativas e pausadas — `countActive` responde outra pergunta e nao vive aqui.
      */}
      <div className="flex items-center justify-between gap-4">
        <p className="text-xs text-muted-foreground">{visible.length} campanha(s)</p>
        <Button type="button" size="sm" onClick={openNew}>
          <Plus className="size-3.5" aria-hidden />
          Nova Campanha
        </Button>
      </div>

      <UnsavedNotice visible={outcome === 'unsaved'} />

      {draft ? (
        <CampaignForm
          draft={draft}
          errors={errors}
          editingName={editingId ? (campaigns.find((row) => row.id === editingId)?.name ?? '') : null}
          saving={saving}
          outcome={outcome}
          onChange={setDraft}
          onCancel={closeForm}
          onSubmit={submit}
        />
      ) : null}

      <CampaignTable rows={visible} onEdit={openEdit} />

      <div className="grid gap-6 md:grid-cols-2">
        <CampaignReport rows={topCampaigns} />
        <CouponReport rows={topCoupons} />
      </div>
    </div>
  );
}
