import { AlertCircle, CheckCircle2, ClipboardCheck, RefreshCw, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
  PAGE_DESCRIPTION,
  PAGE_TITLE,
  RECHECK_LABEL,
  isReady,
  okCount,
  progressLabel,
  progressPercent,
  readyMessage,
} from '@/lib/abrir-loja/metrics';
import type { ChecklistItem } from '@/lib/abrir-loja/types';

/**
 * O cartão do topo de Abrir Loja (adm-087) — título, botão, contagem, barra e aviso.
 *
 * ================== A BARRA NÃO É O `Progress` DO ORIGINAL ==================
 *
 * O original importa `Progress` de uma biblioteca de UI que este projeto não tem.
 * A barra aqui é um `div` com `width` em porcentagem: o trilho cinza e o
 * preenchimento preto, como o print mostra. `role="progressbar"` com os valores
 * certos deixa o leitor de tela anunciar o mesmo que a barra desenha.
 *
 * ================== O AVISO TEM DUAS CORES, UMA FRASE CADA ==================
 *
 * Pronta: verde, com visto, "Loja pronta para produção."
 * Pendente: âmbar, com o círculo de exclamação, "Finalize os itens pendentes
 * antes de abrir." — a frase do print.
 *
 * O `Button` do projeto: enquanto a verificação roda, o ícone vira um `RefreshCw`
 * girando e o botão fica desabilitado, como o original.
 */
export function ChecklistCard({
  items,
  running,
  onRecheck,
}: {
  items: ChecklistItem[];
  running: boolean;
  onRecheck: () => void;
}) {
  const pronto = isReady(items);
  const pct = progressPercent(items);

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div className="min-w-0">
            <h2 className="flex items-center gap-2 font-serif text-2xl tracking-tight">
              <ShieldCheck className="size-6 shrink-0" aria-hidden />
              {PAGE_TITLE}
            </h2>
            <p className="mt-1 text-sm font-medium text-muted-foreground">{PAGE_DESCRIPTION}</p>
          </div>
          <Button
            variant="primary"
            size="md"
            className="shrink-0"
            disabled={running}
            onClick={onRecheck}
          >
            {running ? (
              <RefreshCw className="size-4 animate-spin" aria-hidden />
            ) : (
              <ClipboardCheck className="size-4" aria-hidden />
            )}
            {RECHECK_LABEL}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-center justify-between text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">
          <span>{progressLabel(items)}</span>
          <span>{pct}%</span>
        </div>
        <div
          role="progressbar"
          aria-valuenow={okCount(items)}
          aria-valuemin={0}
          aria-valuemax={items.length}
          className="h-2 w-full overflow-hidden rounded-full bg-secondary"
        >
          <div className="h-full rounded-full bg-foreground transition-all" style={{ width: `${pct}%` }} />
        </div>
        <div
          className={
            pronto
              ? 'mt-3 flex items-center gap-2 rounded-2xl border border-success/30 bg-success-surface px-3 py-2 text-sm text-success-foreground'
              : 'mt-3 flex items-center gap-2 rounded-2xl border border-warning/40 bg-warning-surface px-3 py-2 text-sm text-warning-foreground'
          }
        >
          {pronto ? (
            <CheckCircle2 className="size-4 shrink-0" aria-hidden />
          ) : (
            <AlertCircle className="size-4 shrink-0" aria-hidden />
          )}
          {readyMessage(items)}
        </div>
      </CardContent>
    </Card>
  );
}
