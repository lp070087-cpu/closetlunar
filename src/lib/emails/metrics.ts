/**
 * As regras de apresentação de E-mails — PURAS.
 *
 * Sem React, sem I/O, sem relógio: `formatUpdatedAt` recebe a string ISO e devolve
 * texto; não lê `new Date()` sem argumento em lugar nenhum.
 */

import type { EmailTemplate } from './types';

/**
 * A DATA DO CARD — `Atualizado em 10/06/2026`.
 *
 * ================== POR QUE NÃO PASSA PELO `Date` ==================
 *
 * O valor guardado é `2026-06-10` (só o dia). `new Date('2026-06-10')` o
 * interpreta como MEIA-NOITE UTC — e às 21h do dia 09/06 em BRT, ou seja, o card
 * mostraria o DIA ANTERIOR. É o defeito registrado na memória `data-iso-vira-utc`,
 * e o mesmo que a bancada de Relatórios pegou num filtro de período.
 *
 * Aqui a data é lida por FATIA (`split('-')`), sem `Date`, porque o dado já é um
 * dia — não um instante a ser convertido. A formatação `DD/MM/AAAA` é a única
 * transformação, e é determinística.
 *
 * Uma string fora do formato `AAAA-MM-DD` devolve `—`, e não `Invalid Date` na
 * tela.
 */
export function formatUpdatedAt(updatedAt: string): string {
  const partes = updatedAt.split('-');
  if (partes.length !== 3) return '—';
  const [ano, mes, dia] = partes;
  if (ano.length !== 4 || mes.length !== 2 || dia.length !== 2) return '—';
  return `${dia}/${mes}/${ano}`;
}

/** O texto inteiro do card — `Atualizado em 10/06/2026`. */
export function updatedLabel(updatedAt: string): string {
  return `Atualizado em ${formatUpdatedAt(updatedAt)}`;
}

/**
 * O rótulo do badge — `Ativo` ou `Inativo`.
 *
 * O print mostra `Ativo` nos seis. O `Inativo` existe porque o campo é um
 * booleano e o formulário de edição o desliga — mas o valor da demonstração é
 * `true` em todos, que é o que o print mostra.
 */
export function templateStatusLabel(active: boolean): string {
  return active ? 'Ativo' : 'Inativo';
}

/**
 * Aplica uma edição a um modelo, devolvendo uma lista NOVA.
 *
 * Fica aqui (e não no componente) para a bancada provar que editar um modelo não
 * muta os outros nem a lista de origem — a edição é o único ponto do módulo onde
 * um objeto de demonstração poderia ser alterado por engano.
 */
export function applyTemplateEdit(
  templates: EmailTemplate[],
  id: string,
  patch: Partial<EmailTemplate>,
): EmailTemplate[] {
  return templates.map((template) =>
    template.id === id ? { ...template, ...patch } : template,
  );
}
