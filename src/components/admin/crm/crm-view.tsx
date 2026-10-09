'use client';

import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { SectionHeader } from '@/components/ui/card';
import { SearchInput } from '@/components/ui/form';
import { TableSkeleton } from '@/components/ui/states';
import { listCrmDataset } from '@/lib/crm/data';
import { filterCustomers, filterLeads } from '@/lib/crm/metrics';
import type { CrmCustomer, CrmLead, CrmSegment, CrmTab } from '@/lib/crm/types';
import { CrmTabs } from './crm-tabs';
import { CustomersTable } from './customers-table';
import { LeadsTable } from './leads-table';
import { SegmentGrid } from './segment-grid';

/**
 * Tela de CRM (`/admin/crm`) — reconstruida de adm-005, adm-010 e adm-011.
 *
 * TRES ABAS, E SO TRES. Cada uma e uma LISTA:
 *
 *   Clientes    tabela de seis colunas   (adm-005)
 *   Leads       tabela de cinco colunas  (adm-010)
 *   Segmentos   oito cards               (adm-011)
 *
 * O QUE ESTA TELA NAO TEM, E POR QUE
 *
 * Nenhum dos tres prints mostra funil, Kanban, coluna de etapas, lead scoring,
 * tarefa, automacao, etiqueta ou historico de interacao. Nao ha um unico
 * elemento de arrastar. Por isso nada disso existe: um CRM generico caberia em
 * qualquer print e nao neste.
 *
 * O CABECALHO VEM DAQUI, e nao da casca — o que este comentario afirmava antes
 * estava ERRADO, e a correcao fica registrada.
 *
 * O comentario antigo dizia que `CRM` e "Gerencie o relacionamento com sua base
 * de clientes e leads." "ja vem da casca (`AdminShell`), que le `description` de
 * `nav.ts`". A casca NAO faz isso: `admin-shell.tsx` desenha apenas o eyebrow
 * `Painel Administrativo` e o `h1` do topbar com o `currentLabel` — a
 * `description` do `nav.ts` nao e lida em lugar nenhum. O resultado e que a tela
 * ficava SEM titulo nenhum no corpo, e o print adm-005 mostra os dois textos:
 *
 *   CRM
 *   Gerencie o relacionamento com sua base de clientes e leads.
 *
 * O `SectionHeader` do design system desenha exatamente esse par, e o texto sai
 * identico ao do `nav.ts` — mas a semelhanca e coincidencia, nao heranca. E o
 * que `Pedidos` faz. O mesmo defeito existia em Carrinho Abandonado.
 *
 * AS ABAS SAO PILULA ESCURA, E NAO SUBLINHADO.
 *
 * O componente `UnderlineTabs` existe e o comentario dele dizia ser este o caso
 * do CRM. Isso esta ERRADO: o print adm-005 mostra `Clientes` dentro de uma
 * pilula PRETA arredondada, com `Leads` e `Segmentos` em texto solto ao lado —
 * sem sublinhado em lugar nenhum. E o visual do `SegmentedTabs`. O comentario do
 * componente foi corrigido nesta fase; ver `components/ui/tabs.tsx`.
 *
 * ESTADO DE ABA, BUSCA E CARREGAMENTO FICAM AQUI. Os tres blocos de desenho sao
 * apresentacionais de proposito: e o que permite a bancada renderizar cada um
 * com dados e conferir cabecalho e celula sem navegador.
 *
 * `listCrmDataset` devolve as TRES partes numa leitura so. A contagem de clientes
 * alimenta os segmentos, e por isso as duas nao podem vir de chamadas separadas:
 * elas contariam coisas diferentes no dia em que os pedidos mudassem no meio.
 */
export function CrmView() {
  const [customers, setCustomers] = useState<CrmCustomer[]>([]);
  const [leads, setLeads] = useState<CrmLead[]>([]);
  const [segments, setSegments] = useState<CrmSegment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const [tab, setTab] = useState<CrmTab>('clientes');
  const [search, setSearch] = useState('');

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await listCrmDataset();
        if (!alive) return;
        setCustomers(result.data.customers);
        setLeads(result.data.leads);
        setSegments(result.data.segments);
      } catch {
        if (alive) setError('Não foi possível carregar o CRM.');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [reloadKey]);

  /**
   * A busca e UMA SO para as duas abas que tem tabela.
   *
   * Trocar de aba NAO limpa o campo — e o que o original faz: o `filter` fica no
   * componente da aba e cada aba tem o seu... exceto que as duas montam o mesmo
   * campo com o mesmo formato. Manter um estado unico evita que o texto some ao
   * alternar, o que pareceria a busca "perdendo" o que foi digitado.
   *
   * O placeholder MUDA por aba, porque o print muda: "Buscar por nome, e-mail ou
   * telefone..." em Clientes e "Buscar leads por nome, e-mail ou WhatsApp..." em
   * Leads. Segmentos nao tem campo de busca em adm-011.
   */
  const visibleCustomers = useMemo(() => filterCustomers(customers, search), [customers, search]);
  const visibleLeads = useMemo(() => filterLeads(leads, search), [leads, search]);

  const placeholder =
    tab === 'leads'
      ? 'Buscar leads por nome, e-mail ou WhatsApp...'
      : 'Buscar por nome, e-mail ou telefone...';

  if (loading) {
    return (
      <div className="space-y-6 lg:space-y-8">
        <SectionHeader
          title="CRM"
          description="Gerencie o relacionamento com sua base de clientes e leads."
        />
        <div className="flex flex-col gap-4">
          <CrmTabs value={tab} onChange={setTab} />
          <SearchInput value="" onValueChange={() => {}} placeholder={placeholder} />
        </div>
        <div className="surface p-6 sm:p-8 lg:p-10">
          <TableSkeleton rows={4} columns={6} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6 lg:space-y-8">
        <SectionHeader
          title="CRM"
          description="Gerencie o relacionamento com sua base de clientes e leads."
        />
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
    <div className="space-y-6 lg:space-y-8 motion-safe:animate-fade-up">
      <SectionHeader
        title="CRM"
        description="Gerencie o relacionamento com sua base de clientes e leads."
      />

      <div className="flex flex-col gap-4">
        <CrmTabs value={tab} onChange={setTab} />

        {/* Segmentos nao tem campo de busca em adm-011 — o print mostra os oito
            cards direto sob as abas, sem nada entre eles. */}
        {tab !== 'segmentos' ? (
          <SearchInput
            value={search}
            onValueChange={setSearch}
            placeholder={placeholder}
            aria-label={tab === 'leads' ? 'Buscar leads' : 'Buscar clientes'}
          />
        ) : null}
      </div>

      {tab === 'clientes' ? (
        <div className="surface overflow-hidden">
          <CustomersTable
            rows={visibleCustomers}
            hasFilter={search.trim().length > 0}
            onSelect={() => {
              /* Destino sem print: `Ver Perfil` fica declarado e indisponivel,
                 e o botao ja nasce desabilitado. O handler existe para a
                 assinatura nao mudar quando o perfil entrar como referencia. */
            }}
          />
        </div>
      ) : null}

      {tab === 'leads' ? (
        <div className="surface overflow-hidden">
          <LeadsTable rows={visibleLeads} hasFilter={search.trim().length > 0} />
        </div>
      ) : null}

      {tab === 'segmentos' ? <SegmentGrid segments={segments} /> : null}
    </div>
  );
}
