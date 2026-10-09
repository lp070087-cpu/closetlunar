'use client';

import { AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { statusLabel, statusTone } from '@/lib/abrir-loja/metrics';
import type { ChecklistItem } from '@/lib/abrir-loja/types';

/**
 * A lista dos nove itens (adm-087/088) — um cartão com linhas `divide-y`.
 *
 * ================== CADA LINHA TEM TRÊS PEÇAS ==================
 *
 * Título + ícone de estado, a descrição, e o `detail` embaixo; à direita, o selo
 * e o botão de revalidar SÓ AQUELE item, com o `RefreshCw`. Não há caixa de
 * marcar: o ícone verde/vermelho ao lado do título é RESULTADO, não controle.
 *
 * O selo sai em caixa baixa (`normal-case`) com as cores do print — verde `OK`,
 * vermelho `Pendente` —, porque o `Badge` do projeto é versalete por padrão e o
 * print escreve `OK` e `Pendente` assim mesmo.
 */
export function ChecklistList({
  items,
  onRecheckItem,
}: {
  items: ChecklistItem[];
  onRecheckItem: (id: string) => void;
}) {
  return (
    <Card>
      <CardContent className="divide-y divide-border/40 p-0">
        {items.map((item) => {
          const tom = statusTone(item.status);
          return (
            <div key={item.id} className="flex items-center justify-between gap-3 p-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-sm font-medium">
                  {item.title}
                  {item.status === 'ok' ? (
                    <CheckCircle2 className="size-4 shrink-0 text-success" aria-hidden />
                  ) : null}
                  {item.status === 'fail' ? (
                    <AlertCircle className="size-4 shrink-0 text-danger" aria-hidden />
                  ) : null}
                </div>
                <p className="text-xs text-muted-foreground">{item.description}</p>
                {item.detail ? (
                  <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{item.detail}</p>
                ) : null}
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {item.status === 'checking' ? (
                  <RefreshCw className="size-4 animate-spin text-muted-foreground" aria-hidden />
                ) : null}
                <Badge
                  variant={tom === 'ok' ? 'success' : tom === 'fail' ? 'danger' : 'neutral'}
                  size="sm"
                  className="normal-case tracking-normal"
                >
                  {statusLabel(item.status)}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label={`Revalidar ${item.title}`}
                  onClick={() => onRecheckItem(item.id)}
                >
                  <RefreshCw className="size-3.5" aria-hidden />
                </Button>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
