'use client';

import type { Ticket } from '@/lib/atendimento/types';
import { TicketRow } from './ticket-row';

/**
 * A CAIXA DA FILA — o terceiro bloco do print.
 *
 * ================== POR QUE ELA É UM COMPONENTE, E NÃO UM `if` NA VIEW ==================
 *
 * O print mostra exatamente três estados desta caixa, e só um deles é visível na
 * captura: VAZIA, com a linha `Nenhum atendimento recebido ainda.` Os outros dois
 * — carregando e com linhas — existem no original e a tela precisa dos três.
 *
 * Escrever os três como um `if` dentro da view seria mais curto, mas os dois
 * estados que o print não mostra ficariam ATRÁS do `useEffect`: a tela só sai do
 * `null` quando a leitura resolve, e a bancada monta a árvore sem rodar efeito.
 * Ou seja, os dois estados ficariam sem prova — e um deles é justamente onde a
 * lista desenha.
 *
 * Recebendo `tickets` e `loading` por PROP, os três estados são função do que
 * entra e podem ser medidos. A view continua dona do estado; este componente só
 * desenha o que ela mandar.
 */
export function TicketsList({
  tickets,
  loading,
  onOpen,
}: {
  tickets: Ticket[];
  loading: boolean;
  onOpen: (ticket: Ticket) => void;
}) {
  return (
    <div className="surface overflow-hidden p-0">
      {loading ? (
        <p className="p-10 text-center text-sm text-muted-foreground">Carregando...</p>
      ) : tickets.length === 0 ? (
        <p className="p-10 text-center text-sm text-muted-foreground">
          Nenhum atendimento recebido ainda.
        </p>
      ) : (
        <div className="divide-y divide-border">
          {tickets.map((ticket) => (
            <TicketRow key={ticket.id} ticket={ticket} onOpen={onOpen} />
          ))}
        </div>
      )}
    </div>
  );
}
