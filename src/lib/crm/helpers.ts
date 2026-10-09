/**
 * Formatacao propria do CRM.
 *
 * POR QUE NAO USAR O `formatDateTime` DE `lib/utils.ts`
 *
 * A coluna DATA da tabela de Leads mostra `13/06/2026, 00:31` — data, hora e
 * MINUTO. O `formatDateTime` compartilhado acrescenta SEGUNDOS
 * (`13/06/2026, 00:31:00`), que e o formato usado na lista de Pedidos — e la
 * esta certo, porque aquele print tem segundos.
 *
 * Este print nao tem. Entao o CRM precisa de um formatador com precisao de
 * minuto, e ele mora aqui em vez de virar mais um parametro do util
 * compartilhado: `formatDateTime` e usado por modulos JA VALIDADOS (Pedidos,
 * Estoque), e mexer nele por causa do CRM arriscaria mudar a tela de Pedidos em
 * silencio. Alteracao compartilhada so quando for realmente necessaria — e aqui
 * nao e: sao dois formatos diferentes, e os dois continuam existindo.
 *
 * O separador e a virgula, e nao o `as 00:31` que o `dateStyle`/`timeStyle` do
 * `toLocaleString` produziria. O print tem virgula.
 */

/**
 * Data e hora com precisao de MINUTO:`13/06/2026, 00:31`.
 *
 * Devolve `—` para valor ausente ou invalido, igual ao resto do painel — a tela
 * nunca mostra `Invalid Date`.
 */
export function formatDateTimeShort(value: string | Date | null | undefined): string {
  if (!value) return '—';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '—';

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');

  return `${day}/${month}/${year}, ${hour}:${minute}`;
}
