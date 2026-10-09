import Link from 'next/link';
import { ChevronRight, Ticket } from 'lucide-react';
import { rotuloCupom } from '@/lib/cliente/metrics';
import type { CupomCliente } from '@/lib/cliente/types';
import { ContaSectionCard } from './conta-section-card';

/**
 * O cartao `Cupons ativos` do Dashboard.
 *
 * ================== NO MAXIMO TRES ==================
 *
 * O original faz `coupons.slice(0, 3)`. O limite e do material e nao do
 * espaco: o dashboard e um resumo, e a lista inteira mora em `/conta/cupons`,
 * para onde o rodape do cartao aponta. Mostrar todos aqui transformaria o
 * resumo numa segunda tela de cupons.
 *
 * ================== O BOTAO NAO COPIA AINDA — E ISSO E DELIBERADO ==================
 *
 * No original a seta copia o codigo (`navigator.clipboard.writeText`) e dispara
 * um toast. Aqui ela NAO copia. Copiar seria a unica parte desta tela que
 * "funciona" de verdade, e o aviso que confirma a copia (`Cupom copiado!`) e o
 * mesmo tipo de mensagem que o toast de sessao — pertence ao fluxo, e nao ao
 * cartao. Prometer a copia sem poder confirmar seria pior do que nao prometer.
 *
 * A seta continua sendo o alvo do clique e continua levando para a lista de
 * cupons, que e onde o codigo pode ser lido por inteiro. Registrado como
 * pendencia no STATUS.
 */
export interface CuponsAtivosCardProps {
  cupons: readonly CupomCliente[];
}

export function CuponsAtivosCard({ cupons }: CuponsAtivosCardProps) {
  return (
    <ContaSectionCard titulo="Cupons ativos">
      {cupons.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border py-8 text-center">
          <Ticket className="mx-auto mb-3 size-8 text-muted-foreground/30" aria-hidden />
          <p className="text-sm text-muted-foreground">Nenhum cupom disponível.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {cupons.slice(0, 3).map((cupom) => (
            <Link
              key={cupom.id}
              href="/conta/cupons"
              className="focus-ring flex items-center justify-between rounded-2xl border border-border bg-background p-4 transition-all hover:border-foreground/20"
            >
              <span className="min-w-0">
                <span className="block truncate font-mono text-sm font-bold tracking-widest">
                  {cupom.code}
                </span>
                <span className="mt-0.5 block text-[10px] uppercase tracking-wider text-muted-foreground">
                  {rotuloCupom(cupom)}
                </span>
              </span>
              <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
            </Link>
          ))}

          <Link
            href="/conta/cupons"
            className="focus-ring block pt-2 text-center text-[10px] font-bold uppercase tracking-widest text-muted-foreground transition-colors hover:text-foreground"
          >
            Ver todos os cupons
          </Link>
        </div>
      )}
    </ContaSectionCard>
  );
}
