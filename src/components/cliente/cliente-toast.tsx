import { AlertTriangle, CheckCircle2 } from 'lucide-react';

/**
 * O aviso flutuante da area da cliente — o `Bem-vinda de volta!` do print.
 *
 * ================== POR QUE ELE E DESENHADO A MAO ==================
 *
 * O original usa `sonner` (`toast.success` / `toast.error`), e o projeto nao
 * tem biblioteca de avisos. Este projeto ja resolveu isso duas vezes — o
 * `checklist-toast.tsx` (admin) e o `aviso` de `carrinho-abandonado` — sempre
 * desenhando o aviso. Aqui e a terceira, com a MESMA forma das outras duas,
 * para o aviso da area da cliente nao ter aparencia propria.
 *
 * ================== AS DUAS CORES, E POR QUE ESTA E UMA DIVERGENCIA ==================
 *
 * O aviso verde do print `cli-001` foi medido: fundo `(236,253,243)`, tinta
 * `(0,138,46)` — ou seja, matiz ~140°. O token de sucesso do projeto,
 * `--success`, e **162°** (`#00BC7D`, um verde-agua). Sao verdes DIFERENTES.
 *
 * A divergencia fica registrada em `PAINEL-CLIENTE-STATUS.md`, e a escolha e
 * usar o token: `--success` e o verde de sucesso que o projeto inteiro ja usa
 * (admin incluido), e inventar um segundo verde so para este aviso criaria uma
 * cor que existe em um lugar e em lugar nenhum mais. Trocar o token para casar
 * com este print mudaria o admin, que esta encerrado.
 *
 * ================== O ERRO USA A MESMA FORMA, COM `--danger` ==================
 *
 * O original tem `toast.error` para credencial recusada, com a mensagem
 * `ERRO_CREDENCIAL`. E o mesmo desenho, em vermelho — e nao um segundo
 * componente, pelo mesmo motivo de sempre: dois desenhos divergem no primeiro
 * ajuste que um receber.
 *
 * O icone do erro e `AlertTriangle`, que e o que `ui/states.tsx` (o estado de
 * erro do projeto inteiro) ja usa.
 */

/** O aviso pode ser de sucesso ou de erro — o original tem os dois. */
export type TomAviso = 'sucesso' | 'erro';

export interface ClienteToastProps {
  /** `null` esconde o aviso. */
  message: string | null;
  tom: TomAviso;
}

export function ClienteToast({ message, tom }: ClienteToastProps) {
  if (!message) return null;

  const sucesso = tom === 'sucesso';
  const Icone = sucesso ? CheckCircle2 : AlertTriangle;

  return (
    <div
      role="status"
      aria-live="polite"
      className={
        sucesso
          ? 'fixed right-4 top-4 z-50 flex items-center gap-2 rounded-2xl border border-success/30 bg-success-surface px-4 py-3 text-sm font-medium text-success-foreground shadow-elegant'
          : 'fixed right-4 top-4 z-50 flex items-center gap-2 rounded-2xl border border-danger/30 bg-danger-surface px-4 py-3 text-sm font-medium text-danger-foreground shadow-elegant'
      }
    >
      <Icone className="size-4 shrink-0" aria-hidden />
      {message}
    </div>
  );
}
