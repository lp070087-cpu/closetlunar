'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { TableSkeleton } from '@/components/ui/states';
import {
  addReward,
  getLoyaltyRules,
  listMovements,
  listRewards,
  listTiers,
  saveRewards,
  saveRules,
  saveTiers,
} from '@/lib/fidelidade/data';
import {
  draftToReward,
  draftToRules,
  draftToTier,
  localId,
  newReward,
  rewardToDraft,
  rulesToDraft,
  tiersToDrafts,
  validateTierDrafts,
} from '@/lib/fidelidade/form';
import type {
  LoyaltyMovement,
  LoyaltyReward,
  LoyaltyTier,
  RewardDraft,
  RulesDraft,
  TierDraft,
  TierJsonError,
} from '@/lib/fidelidade/types';
import type { LoyaltyTab } from '@/lib/fidelidade/metrics';
import { UnsavedNotice } from './fidelidade-notice';
import { LoyaltyMovementsTable } from './loyalty-movements-table';
import { LoyaltyRewardsCard } from './loyalty-rewards-card';
import { LoyaltyRulesCard } from './loyalty-rules-card';
import { LoyaltyTabs } from './loyalty-tabs';
import { LoyaltyTierGrid } from './loyalty-tier-grid';

/**
 * Tela de Fidelidade (`/admin/fidelidade`) — reconstruida de adm-018, adm-019 e
 * adm-020.
 *
 * UMA ROTA, TRES ABAS, e a primeira abre por padrao:
 *
 *   adm-018  `Configurações & Resgates`  dois cartoes lado a lado + abas
 *   adm-019  `Níveis Clube VIP`          quatro cartoes numa grade de quatro
 *   adm-020  `Histórico de Pontos`       um cartao com tabela de cinco colunas
 *
 * ================== O QUE ESTA TELA **NAO** TEM — E POR QUE ==================
 *
 * Nao ha nivel de "Cliente Bronze" calculado, saldo, extrato por cliente,
 * cashback, ranking, indicacao com link, expiracao de pontos, meta, meta de
 * resgate nem gamificacao. NADA DISSO APARECE em adm-018/019/020. O modulo tem
 * tres prints e so — e o mais POBRE de referencia do painel inteiro. Por isso ele
 * e o mais tentador a "completar", e por isso o registro fica aqui: o que nao esta
 * nos prints nao foi inventado.
 *
 * O `tipo` das movimentacoes, por exemplo, so aparece como COLUNA de uma tabela
 * VAZIA (adm-020). Nao ha um print com uma linha sequer, entao a cor do selo e a
 * forma do sinal vieram do CODIGO de referencia (`LoyaltyAdmin`), que e a unica
 * fonte que existe — e nao de uma suposicao sobre como deveria ser.
 *
 * ================== O TITULO DO CORPO NAO EXISTE AQUI ==================
 *
 * CRM, Carrinho Abandonado, Cupons e Campanhas tem um `SectionHeader` no corpo
 * (`CRM` + descricao) porque o print deles mostra esse par. FIDELIDADE NAO MOSTRA.
 * Olhando adm-018 linha a linha, o que vem depois da topbar e a linha das abas —
 * nao ha `Fidelidade` serifado nem a frase "Configure o clube de pontos e
 * acompanhe os resgates." em lugar nenhum. E o MESMO padrao de Pedidos.
 *
 * Isso NAO e um esquecimento, e a decisao e POR MODULO: uma tela que ganhasse um
 * titulo que o print nao tem deixaria de ser fiel, que e o criterio numero um
 * deste projeto. O nome da tela ja aparece na sidebar e no `h1` da topbar (`ver
 * admin-shell.tsx`); repeti-lo aqui seria acrescentar.
 *
 * ================== OS TRES ESTADOS DE CARREGAMENTO ==================
 *
 * Cada aba tem o seu, e eles NAO sao iguais:
 *
 *   config   `TableSkeleton` no lugar dos dois cartoes (o print nao mostra texto
 *            de carregamento aqui, e o esqueleto e o mesmo tratamento de
 *            Campanhas)
 *   tiers    `TableSkeleton` no lugar da grade de quatro
 *   logs     `TableSkeleton` dentro do cartao, mantendo o cabecalho
 *
 * A leitura de tudo acontece UMA VEZ, em `Promise.all` das quatro partes. Se
 * qualquer uma falhar, a tela inteira cai no erro: as quatro sao do mesmo modulo
 * e da mesma tela. E o contrario de Campanhas, onde a leitura de Cupons tem o
 * proprio `try` por ser de OUTRO modulo.
 */
export function FidelidadeView() {
  const [tab, setTab] = useState<LoyaltyTab>('config');

  const [rules, setRules] = useState<RulesDraft | null>(null);
  const [rewards, setRewards] = useState<RewardDraft[]>([]);
  const [tiers, setTiers] = useState<TierDraft[]>([]);
  const [movements, setMovements] = useState<LoyaltyMovement[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const [saving, setSaving] = useState<null | 'rules' | 'rewards' | 'tiers'>(null);
  const [outcome, setOutcome] = useState<null | 'rules' | 'rewards' | 'tiers'>(null);
  const [tierErrors, setTierErrors] = useState<TierJsonError>({});

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        // AS QUATRO LEITURAS EM PARALELO. Ver o cabecalho: sao do mesmo modulo e
        // da mesma tela, entao uma falha derruba a tela — e nao ha `try` por
        // parte.
        const [r, rw, tr, mv] = await Promise.all([
          getLoyaltyRules(),
          listRewards(),
          listTiers(),
          listMovements(),
        ]);
        if (!alive) return;
        setRules(rulesToDraft(r.data));
        setRewards(rw.data.map(rewardToDraft));
        setTiers(tiersToDrafts(tr.data));
        setMovements(mv.data);
        // Qualquer edicao anterior morre no recarregamento, e com ela o aviso:
        // a lista da tela e a lista do banco de novo.
        setOutcome(null);
        setTierErrors({});
      } catch {
        if (alive) setError('Não foi possível carregar o programa de fidelidade.');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [reloadKey]);

  /**
   * Toda edicao APAGA o aviso daquela metade.
   *
   * O aviso diz "o que voce fez nao foi gravado". No instante em que a pessoa
   * volta a mexer, ele continua verdadeiro mas deixa de ser sobre o que esta na
   * tela — e o caminho certo e ele reaparecer so depois do proximo clique em
   * salvar. Cada metade tem o seu: editar uma recompensa nao apaga o aviso das
   * regras, que continua sendo sobre uma mudanca ainda pendente.
   */
  function clearOutcome(kind: 'rules' | 'rewards' | 'tiers') {
    setOutcome((current) => (current === kind ? null : current));
  }

  function changeRules(next: RulesDraft) {
    setRules(next);
    clearOutcome('rules');
  }

  function changeRewards(next: RewardDraft[]) {
    setRewards(next);
    clearOutcome('rewards');
  }

  function changeTiers(next: TierDraft[]) {
    setTiers(next);
    setTierErrors({});
    clearOutcome('tiers');
  }

  async function submitRules() {
    if (!rules) return;
    setSaving('rules');
    const result = await saveRules(draftToRules(rules));
    setSaving(null);
    setOutcome(result.persisted ? null : 'rules');
  }

  async function submitRewards() {
    setSaving('rewards');
    // O rascunho vira recompensa na hora da gravacao, e nao deixa: o
    // `discountValue` e derivado do rotulo por `draftToReward`, e derivar a cada
    // tecla faria o campo de valor mudar de dono sem necessidade.
    const payload: LoyaltyReward[] = rewards.map((row) => draftToReward(row));
    const result = await saveRewards(payload);
    setSaving(null);
    if (!result.persisted) {
      // A LISTA LOCAL SO MUDA SE NAO PERSISTIU. Com o Neon ligado, quem manda na
      // lista e a releitura do banco. Um rascunho vazio que nunca chegou a ser
      // preenchido nao entra na lista — senao a tela criaria uma recompensa em
      // branco so por causa de um clique em `+ Adicionar Recompensa`.
      setRewards(result.data.filter((row) => row.label.trim() !== '').map(rewardToDraft));
    }
    setOutcome(result.persisted ? null : 'rewards');
  }

  async function submitTiers() {
    // O JSON de TODOS os cartoes e validado de uma vez, e o salvamento PARA se
    // qualquer um estiver torto. Ver `validateTierDrafts`: o original descartava
    // o cartao invalido em silencio e gravava os outros.
    const { errors, parsed } = validateTierDrafts(tiers);
    setTierErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSaving('tiers');
    const payload: LoyaltyTier[] = tiers.map((draft) => draftToTier(draft, parsed[draft.id]));
    const result = await saveTiers(payload);
    setSaving(null);
    if (!result.persisted) setTiers(tiersToDrafts(result.data));
    setOutcome(result.persisted ? null : 'tiers');
  }

  async function appendReward() {
    const blank = newReward(localId());
    // Passa pela camada de dados mesmo sem gravar, para que o dia em que o Neon
    // entrar o `appendReward` ja seja o ponto de contato — e nao um `setRewards`
    // solto que ninguem lembraria de trocar.
    const result = await addReward(blank);
    setRewards((current) => [...current, rewardToDraft(result.data)]);
    clearOutcome('rewards');
  }

  if (loading) {
    return (
      <div className="space-y-6 motion-safe:animate-fade-in">
        <LoyaltyTabs value={tab} onChange={setTab} />
        {tab === 'logs' ? (
          <div className="surface overflow-hidden">
            <div className="h-[4.75rem] border-b border-border/60" />
            <TableSkeleton rows={3} columns={5} />
          </div>
        ) : (
          <div className="surface p-6 sm:p-8">
            <TableSkeleton rows={tab === 'tiers' ? 2 : 3} columns={2} />
          </div>
        )}
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <LoyaltyTabs value={tab} onChange={setTab} />
        <div
          role="alert"
          className="flex flex-col items-center justify-center gap-4 rounded-3xl border border-dashed border-danger/40 bg-danger-surface/40 px-6 py-12 text-center"
        >
          <span className="grid size-12 place-items-center rounded-2xl bg-danger-surface text-danger-foreground">
            <AlertTriangle className="size-5" aria-hidden />
          </span>
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
    <div className="space-y-6 motion-safe:animate-fade-up">
      <LoyaltyTabs value={tab} onChange={setTab} />

      {tab === 'config' ? (
        <div className="space-y-6">
          <UnsavedNotice kind="rules" visible={outcome === 'rules'} />
          <UnsavedNotice kind="rewards" visible={outcome === 'rewards'} />

          {/*
            DUAS COLUNAS IGUAIS em `lg`, empilhadas abaixo disso. No print os dois
            cartoes tem exatamente a mesma largura (748px cada, com 36px entre
            eles), e as alturas terminam juntas — `items-stretch` e o padrao da
            grade, entao o cartao da esquerda, que tem menos conteudo, fica com a
            altura do da direita. E o que o print mostra.
          */}
          <div className="grid gap-6 lg:grid-cols-2">
            {rules ? (
              <LoyaltyRulesCard
                rules={rules}
                saving={saving === 'rules'}
                onChange={changeRules}
                onSave={submitRules}
              />
            ) : null}
            <LoyaltyRewardsCard
              rows={rewards}
              saving={saving === 'rewards'}
              onChange={changeRewards}
              onAdd={appendReward}
              onSave={submitRewards}
            />
          </div>
        </div>
      ) : null}

      {tab === 'tiers' ? (
        <div className="space-y-6">
          <UnsavedNotice kind="tiers" visible={outcome === 'tiers'} />
          <LoyaltyTierGrid
            drafts={tiers}
            errors={tierErrors}
            saving={saving === 'tiers'}
            onChange={changeTiers}
            onSave={submitTiers}
          />
        </div>
      ) : null}

      {tab === 'logs' ? <LoyaltyMovementsTable rows={movements} /> : null}
    </div>
  );
}
