import { CheckCircle2 } from 'lucide-react';

/**
 * O aviso "Checklist atualizado" (adm-089) — no canto superior direito.
 *
 * ================== POR QUE ELE EXISTE, E POR QUE NÃO MENTE ==================
 *
 * O original chama `toast.success('Checklist atualizado')` ao fim da rodada, e o
 * print adm-089 flagra o aviso verde no canto. O projeto não tem biblioteca de
 * toast, então ele é desenhado aqui.
 *
 * A frase é VERDADEIRA: a rodada de verificação realmente aconteceu. É diferente
 * de um "salvo com sucesso" de escrita — este módulo NÃO grava nada, só consulta.
 * Por isso não há aqui nenhum aviso de "não foi gravado": verificar não grava. Os
 * avisos de escrita não-gravada do projeto (`fidelidade-notice`) protegem BOTÕES
 * DE SALVAR; não há botão de salvar nesta tela.
 *
 * ================== ELE SOME SOZINHO ==================
 *
 * Toast que fica para sempre vira ruído. O original some depois de alguns
 * segundos, e é o que este faz — o `useEffect` em `abrir-loja-view.tsx` limpa a
 * mensagem. Como a bancada lê o DOM no instante em que o aviso está visível, o
 * relógio não interfere na prova.
 */
export function ChecklistToast({ message }: { message: string | null }) {
  if (!message) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed right-4 top-4 z-50 flex items-center gap-2 rounded-2xl border border-success/30 bg-success-surface px-4 py-3 text-sm font-medium text-success-foreground shadow-elegant"
    >
      <CheckCircle2 className="size-4 shrink-0" aria-hidden />
      {message}
    </div>
  );
}
