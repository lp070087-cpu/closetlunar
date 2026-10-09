'use client';

import { useEffect, useMemo, useState } from 'react';
import { SectionHeader } from '@/components/ui/card';
import { PENDING_REASON, listTickets, updateTicketStatus } from '@/lib/atendimento/data';
import { applyStatusChange, countTickets, filterTickets } from '@/lib/atendimento/metrics';
import type { Ticket, TicketFilter, TicketStatus } from '@/lib/atendimento/types';
import { AtendimentoFilterTabs, AtendimentoStats } from './atendimento-tabs';
import { TicketModal } from './ticket-modal';
import { TicketsList } from './tickets-list';

/**
 * A tela de Atendimento (`/admin/atendimento`) — adm-074.
 *
 * ================== A ORDEM DO PRINT ==================
 *
 * Cabeçalho (`Atendimento` / `Tickets e mensagens recebidas dos clientes.`), os
 * quatro indicadores, a faixa de pílulas do filtro, e a caixa da lista. Quando não
 * há atendimento, a caixa é uma faixa branca com uma linha de texto centrada —
 * `Nenhum atendimento recebido ainda.`
 *
 * ================== O QUE O PRINT NÃO MOSTRA ==================
 *
 * A fila está vazia, então NÃO há linha desenhada, NÃO há badge de status à vista e
 * NÃO há modal aberto. Os três existem porque o original os tem e porque um botão
 * `Ver detalhes` sem destino seria pior — mas estão marcados como reconstruídos do
 * original, não como copiados de um print. A lista vazia em si vem dos dados: a
 * demonstração é `[]` de propósito.
 *
 * ================== NÃO INVENTADO ==================
 *
 * Nada de canal, assunto, responsável, tempo de espera, busca, ordenação, chat,
 * automação ou integração — o placeholder prometia "canal, assunto, responsável e
 * tempo de espera" e o print não mostra NADA disso. Foi removido em vez de
 * inventado. Não há também o bloco `Módulo de atendimento ainda não está
 * disponível.` do original: aquilo era o aviso de tabela faltando no Supabase, e
 * aqui a demonstração é vazia por decisão, não por erro de banco.
 */
export function AtendimentoView() {
  const [tickets, setTickets] = useState<Ticket[] | null>(null);
  const [filter, setFilter] = useState<TicketFilter>('all');
  const [selecionado, setSelecionado] = useState<Ticket | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  useEffect(() => {
    let ativo = true;
    listTickets().then((resultado) => {
      if (ativo) setTickets(resultado.data);
    });
    return () => {
      ativo = false;
    };
  }, []);

  const counts = useMemo(() => countTickets(tickets ?? []), [tickets]);
  const visiveis = useMemo(() => filterTickets(tickets ?? [], filter), [tickets, filter]);

  async function trocarStatus(id: string, status: TicketStatus) {
    const resultado = await updateTicketStatus(id, status);
    setTickets((atual) => (atual ? applyStatusChange(atual, id, status) : atual));
    setSelecionado((atual) => (atual && atual.id === id ? { ...atual, status } : atual));
    setAviso(resultado.persisted ? 'Status atualizado.' : PENDING_REASON);
  }

  const carregando = tickets === null;

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Atendimento"
        description="Tickets e mensagens recebidas dos clientes."
      />

      <AtendimentoStats counts={counts} />

      <AtendimentoFilterTabs filter={filter} counts={counts} onChange={setFilter} />

      <TicketsList tickets={visiveis} loading={carregando} onOpen={setSelecionado} />

      <TicketModal
        ticket={selecionado}
        onClose={() => setSelecionado(null)}
        onStatusChange={trocarStatus}
        aviso={aviso}
      />
    </div>
  );
}
