'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Bike, CheckCircle2, Clock, MapPin, PackageCheck } from 'lucide-react';
import { distanciaKm } from './distancia';

const MapaEntrega = dynamic(() => import('./mapa-entrega').then((m) => m.MapaEntrega), {
  ssr: false,
  loading: () => <div className="grid h-[52vh] place-items-center rounded-2xl bg-secondary text-sm text-muted-foreground">Carregando mapa…</div>,
});

interface Dados {
  pedido: { code: string; status: string; local: boolean; metodo: string | null };
  entrega: {
    status: 'aguardando' | 'a_caminho' | 'entregue';
    destino: { lat: number; lng: number } | null;
    posicao: { lat: number; lng: number; em: string } | null;
    trilha: [number, number][];
    iniciadoEm: string | null;
    entregueEm: string | null;
    entregador: string;
  } | null;
}

const ETAPAS = [
  { chave: 'pago', rotulo: 'Pedido confirmado', icone: PackageCheck },
  { chave: 'a_caminho', rotulo: 'Saiu para entrega', icone: Bike },
  { chave: 'entregue', rotulo: 'Entregue', icone: CheckCircle2 },
];

export function RastreioCliente({ pedidoId }: { pedidoId: string }) {
  const [d, setD] = useState<Dados | null>(null);
  const [erro, setErro] = useState(false);

  useEffect(() => {
    let vivo = true;
    let timer: ReturnType<typeof setTimeout>;
    const buscar = async () => {
      try {
        const r = await fetch(`/api/rastreio/${encodeURIComponent(pedidoId)}`, { cache: 'no-store' });
        if (!r.ok) throw new Error();
        const j = (await r.json()) as Dados;
        if (!vivo) return;
        setD(j);
        if (j.entrega?.status === 'entregue') return;
      } catch {
        if (vivo) setErro(true);
      }
      if (vivo) timer = setTimeout(buscar, 4000);
    };
    buscar();
    return () => {
      vivo = false;
      clearTimeout(timer);
    };
  }, [pedidoId]);

  if (erro && !d) return <p className="py-20 text-center text-sm text-muted-foreground">Pedido não encontrado.</p>;
  if (!d) return <p className="py-20 text-center text-sm text-muted-foreground">Carregando…</p>;

  const e = d.entrega;
  const etapa = e?.status === 'entregue' ? 2 : e?.status === 'a_caminho' ? 1 : 0;
  const km = e?.posicao && e.destino ? distanciaKm(e.posicao, e.destino) : null;
  const minutos = km != null ? Math.max(1, Math.round((km / 25) * 60)) : null;
  const atualizado = e?.posicao ? Math.round((Date.now() - new Date(e.posicao.em).getTime()) / 1000) : null;

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground">Pedido #{d.pedido.code}</p>
          <h1 className="font-serif text-3xl md:text-4xl">
            {etapa === 2 ? 'Pedido entregue!' : etapa === 1 ? 'Sua entrega está a caminho' : 'Preparando sua entrega'}
          </h1>
        </div>
        {etapa === 1 && minutos != null ? (
          <div className="rounded-2xl bg-foreground px-4 py-2 text-background">
            <span className="block text-[10px] uppercase tracking-[0.2em] text-background/70">Chega em cerca de</span>
            <span className="font-serif text-2xl">{minutos} min</span>
          </div>
        ) : null}
      </div>

      <ol className="mb-5 grid grid-cols-3 gap-2">
        {ETAPAS.map((s, i) => {
          const I = s.icone;
          const feito = i <= etapa;
          return (
            <li key={s.chave} className={`flex flex-col items-center gap-1.5 rounded-2xl p-3 text-center text-[11px] ${feito ? 'bg-foreground text-background' : 'bg-secondary text-muted-foreground'}`}>
              <I className="size-5" aria-hidden />
              {s.rotulo}
            </li>
          );
        })}
      </ol>

      {d.pedido.local ? (
        e && (e.posicao || e.destino) ? (
          <>
            <MapaEntrega
              posicao={e.status === 'entregue' ? null : e.posicao}
              destino={e.destino}
              trilha={e.trilha}
              className="h-[52vh] min-h-[320px] w-full ring-1 ring-border"
            />
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="size-3.5" aria-hidden />
                {km != null ? `${km < 1 ? Math.round(km * 1000) + ' m' : km.toFixed(1) + ' km'} até você` : e.status === 'aguardando' ? 'O entregador ainda não saiu' : ''}
                {e.entregador ? ` · Entregador: ${e.entregador}` : ''}
              </span>
              {atualizado != null && e.status === 'a_caminho' ? (
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="size-3.5" aria-hidden /> atualizado há {atualizado < 60 ? `${atualizado}s` : `${Math.round(atualizado / 60)} min`}
                </span>
              ) : null}
            </div>
          </>
        ) : (
          <p className="rounded-2xl bg-secondary/60 p-6 text-sm text-muted-foreground">
            Assim que o entregador sair, o mapa aparece aqui com a moto em tempo real. Esta página atualiza sozinha.
          </p>
        )
      ) : (
        <p className="rounded-2xl bg-secondary/60 p-6 text-sm text-muted-foreground">
          Este pedido vai pela transportadora ({d.pedido.metodo ?? 'Melhor Envio'}). O código de rastreio aparece em Minha Conta → Pedidos assim que for postado.
        </p>
      )}

      <div className="mt-8 text-center">
        <Link href="/" className="text-xs uppercase tracking-wider underline">
          Voltar à loja
        </Link>
      </div>
    </div>
  );
}
