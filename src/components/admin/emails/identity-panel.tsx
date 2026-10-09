'use client';

import { Check } from 'lucide-react';
import type { EmailIdentity, EmailLog } from '@/lib/emails/types';

/**
 * A COLUNA DA DIREITA — o painel escuro `Identidade Visual` e o `Envios Recentes`.
 *
 * ================== O PAINEL É ESCURO, E O PRETO É O `foreground` ==================
 *
 * O `Identidade Visual` tem fundo `bg-foreground` e texto `text-background` — o
 * mesmo par invertido que o painel usa no botão ativo das abas e no `SALVAR
 * CONFIGURAÇÕES`. Não é um "card escuro" novo: é a tinta da marca usada como
 * superfície, com as linhas separadas por `border-background/10`.
 *
 * ================== A BOLINHA DA COR É A COR ==================
 *
 * A cor principal aparece DUAS vezes: a bolinha (`bg-[#FF4D8D]`) e o hex em mono.
 * O hex NÃO pode virar `bg-[var(--accent)]` — o ponto do card é mostrar o valor
 * literal que a marca usa nos e-mails, e ele é um dado (vem da identidade), não
 * uma classe fixa. Por isso o `style` inline, e não uma classe do sistema.
 */
export function IdentityPanel({
  identity,
  logs,
}: {
  identity: EmailIdentity;
  logs: EmailLog[];
}) {
  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-foreground p-6 text-background shadow-elegant">
        <h3 className="mb-4 font-serif text-xl">Identidade Visual</h3>

        <div className="space-y-4 text-sm opacity-90">
          <div className="flex items-center justify-between border-b border-background/10 py-2">
            <span>Logo da Marca</span>
            <span className="font-bold">{identity.brandName}</span>
          </div>

          <div className="flex items-center justify-between border-b border-background/10 py-2">
            <span>Cor Principal</span>
            <span className="flex items-center gap-2">
              <span
                aria-hidden
                className="size-3 rounded-full"
                style={{ backgroundColor: identity.primaryColor }}
              />
              <span className="font-mono text-xs">{identity.primaryColor}</span>
            </span>
          </div>

          <div className="flex items-center justify-between py-2">
            <span>Rodapé Customizado</span>
            <span className="font-bold">{identity.customFooter ? 'Sim' : 'Não'}</span>
          </div>
        </div>

        <div className="mt-6 rounded-2xl bg-background/10 p-4 text-[10px] italic leading-relaxed">
          &quot;{identity.note}&quot;
        </div>
      </div>

      <section className="space-y-3">
        <h3 className="font-serif text-xl">Envios Recentes</h3>
        {logs.length === 0 ? (
          <p className="py-4 text-center text-xs text-muted-foreground">
            Nenhum e-mail enviado recentemente.
          </p>
        ) : (
          logs.map((log) => (
            <div
              key={log.id}
              className="flex items-center gap-3 rounded-xl border border-border/30 bg-secondary/40 p-3"
            >
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-background">
                <Check className="size-3 text-success" aria-hidden />
              </span>
              <div className="min-w-0">
                <p className="truncate text-xs font-bold">{log.email}</p>
                <p className="text-[10px] uppercase text-muted-foreground">
                  {log.templateName}
                </p>
              </div>
            </div>
          ))
        )}
      </section>
    </div>
  );
}
