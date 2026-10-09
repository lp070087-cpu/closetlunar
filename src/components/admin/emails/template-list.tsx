'use client';

import { Mail, Palette } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { templateStatusLabel, updatedLabel } from '@/lib/emails/metrics';
import type { EmailTemplate } from '@/lib/emails/types';

/**
 * OS SEIS CARDS DE MODELO — a coluna da esquerda de adm-072/adm-073.
 *
 * Cada card é: ícone de envelope num quadrado branco, o título em SANS bold
 * (`Cart Recovery` — não é a serifada do painel), o ASSUNTO em cinza logo abaixo,
 * e a linha de baixo com o badge `Ativo` (verde) e o `Atualizado em ...`. À
 * direita, o botão da paleta que abre o editor.
 *
 * ================== O ASSUNTO É A SEGUNDA LINHA, NÃO UM TÍTULO ==================
 *
 * No original o assunto ocupa o lugar onde normalmente ficaria um subtítulo
 * corrido, e é assim que o print o mostra: `Esqueceu algo lindo no carrinho? 🛒`
 * em uma linha, cortada com reticências se passar (`line-clamp-1`) — os textos
 * são longos e o print não deixa nenhum quebrar em duas linhas.
 *
 * ================== O BOTÃO ABRE O EDITOR, E SÓ ISSO ==================
 *
 * O ícone é o `Palette` (paleta de pintura), confirmado no zoom — não é o mesmo
 * ícone do envelope do card. Ele não navega para lugar nenhum: liga o `onEdit`,
 * que abre o editor ABAIXO da lista, como no original `EmailsAdmin`.
 */
export function TemplateList({
  templates,
  onEdit,
  editingId,
}: {
  templates: EmailTemplate[];
  onEdit: (template: EmailTemplate) => void;
  /** O modelo aberto no editor, se houver — o card dele fica marcado. */
  editingId: string | null;
}) {
  return (
    <div className="grid gap-4">
      {templates.map((template) => {
        const aberto = template.id === editingId;
        return (
          <div
            key={template.id}
            className={
              'rounded-2xl border p-5 transition-colors ' +
              (aberto
                ? 'border-accent/50 bg-secondary/60'
                : 'border-border/60 bg-secondary/40 hover:bg-secondary/60')
            }
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex min-w-0 gap-4">
                <div className="grid size-12 shrink-0 place-items-center rounded-xl border border-border bg-background">
                  <Mail className="size-5 text-accent" aria-hidden />
                </div>

                <div className="min-w-0">
                  <h4 className="font-bold text-foreground">{template.title}</h4>
                  <p className="line-clamp-1 text-sm text-muted-foreground">{template.subject}</p>

                  <div className="mt-2 flex items-center gap-3">
                    <Badge variant={template.active ? 'success' : 'neutral'} size="sm">
                      {templateStatusLabel(template.active)}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground">
                      {updatedLabel(template.updatedAt)}
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onEdit(template)}
                aria-label={`Editar o modelo ${template.title}`}
                aria-expanded={aberto}
                className="focus-ring grid size-10 shrink-0 place-items-center rounded-xl border border-border bg-background transition-colors hover:bg-secondary"
              >
                <Palette className="size-4" aria-hidden />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
