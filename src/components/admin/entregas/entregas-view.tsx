'use client';

import { useEffect, useState } from 'react';
import { Bike, CheckCircle2, Copy, ExternalLink, MessageCircle } from 'lucide-react';
import { SectionHeader } from '@/components/ui/card';

interface PedidoEntrega {
  id: string;
  code: string;
  cliente: string;
  telefone: string;
  endereco: string;
  metodo: string | null;
  status: string;
  entrega: { status: 'aguardando' | 'a_caminho' | 'entregue'; token: string; entregador: string } | null;
}

const ROTULO = { aguardando: 'Aguardando saída', a_caminho: 'A caminho', entregue: 'Entregue' } as const;

/**
 * ENTREGAS LOCAIS — pedidos pagos com entrega propria ou retirada.
 * Gera o link do entregador (abre no celular dele, sem login) e manda o link de
 * acompanhamento para a cliente pelo WhatsApp.
 */
export function EntregasView() {
  const [pedidos, setPedidos] = useState<PedidoEntrega[] | null>(null);
  const [entregador, setEntregador] = useState<Record<string, string>>({});
  const [aviso, setAviso] = useState<string | null>(null);
  const [origem, setOrigem] = useState('');

  async function carregar() {
    const r = await fetch('/api/admin/entregas', { cache: 'no-store' }).catch(() => null);
    const j = r?.ok ? await r.json() : { pedidos: [] };
    setPedidos(j.pedidos ?? []);
  }

  useEffect(() => {
    setOrigem(window.location.origin);
    void carregar();
    const t = setInterval(carregar, 15000);
    return () => clearInterval(t);
  }, []);

  async function gerar(p: PedidoEntrega) {
    const r = await fetch('/api/admin/entregas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId: p.id, entregador: entregador[p.id] ?? p.entrega?.entregador ?? '' }),
    });
    const j = await r.json().catch(() => ({}));
    if (!j.ok) return setAviso('Não foi possível gerar o link.');
    if (!j.temDestino) setAviso('Link gerado. O endereço não foi localizado no mapa — o rastreio mostra só a moto.');
    await carregar();
    return j.token as string;
  }

  function copiar(texto: string) {
    void navigator.clipboard?.writeText(texto).then(() => setAviso('Link copiado.'));
  }

  const linkEntregador = (t: string) => `${origem}/entregador/${t}`;
  const linkCliente = (id: string) => `${origem}/pedido/${id}/rastreio`;
  const wa = (tel: string, msg: string) => `https://wa.me/55${tel.replace(/\D/g, '').replace(/^55/, '')}?text=${encodeURIComponent(msg)}`;

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Entregas locais"
        description="Gere o link do entregador e acompanhe a moto em tempo real junto com a cliente."
      />

      {aviso ? <p role="status" className="rounded-xl bg-secondary/60 p-3 text-xs">{aviso}</p> : null}

      {pedidos === null ? (
        <p className="surface p-10 text-center text-sm text-muted-foreground">Carregando…</p>
      ) : pedidos.length === 0 ? (
        <p className="surface p-10 text-center text-sm text-muted-foreground">
          Nenhum pedido pago com entrega própria nos últimos 60 dias.
        </p>
      ) : (
        <ul className="grid gap-4 lg:grid-cols-2">
          {pedidos.map((p) => (
            <li key={p.id} className="rounded-2xl border border-border bg-background p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">#{p.code}</p>
                  <p className="font-medium">{p.cliente}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{p.endereco}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{p.metodo}</p>
                </div>
                <span
                  className={
                    'inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium ' +
                    (p.entrega?.status === 'entregue'
                      ? 'bg-emerald-50 text-emerald-700'
                      : p.entrega?.status === 'a_caminho'
                        ? 'bg-amber-50 text-amber-700'
                        : 'bg-secondary text-muted-foreground')
                  }
                >
                  {p.entrega?.status === 'entregue' ? <CheckCircle2 className="size-3.5" /> : <Bike className="size-3.5" />}
                  {p.entrega ? ROTULO[p.entrega.status] : 'Sem entregador'}
                </span>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <input
                  value={entregador[p.id] ?? p.entrega?.entregador ?? ''}
                  onChange={(e) => setEntregador((x) => ({ ...x, [p.id]: e.target.value }))}
                  placeholder="Nome do entregador"
                  className="h-10 min-w-0 flex-1 rounded-xl border border-border bg-background px-3 text-sm"
                />
                <button
                  type="button"
                  onClick={() => void gerar(p)}
                  className="h-10 rounded-full bg-foreground px-4 text-[11px] font-medium uppercase tracking-[0.14em] text-background"
                >
                  {p.entrega ? 'Atualizar' : 'Gerar link'}
                </button>
              </div>

              {p.entrega ? (
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  <button type="button" onClick={() => copiar(linkEntregador(p.entrega!.token))} className="flex items-center justify-center gap-1.5 rounded-xl border border-border py-2 text-xs">
                    <Copy className="size-3.5" /> Copiar link do entregador
                  </button>
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(`Entrega #${p.code} — ${p.cliente}\n${p.endereco}\nAbra e toque em "Iniciar entrega": ${linkEntregador(p.entrega.token)}`)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center gap-1.5 rounded-xl border border-border py-2 text-xs"
                  >
                    <MessageCircle className="size-3.5" /> Enviar ao entregador
                  </a>
                  <a
                    href={wa(p.telefone, `Oi, ${p.cliente.split(' ')[0]}! Seu pedido #${p.code} da Closet Lunar vai sair para entrega. Acompanhe a moto em tempo real: ${linkCliente(p.id)}`)}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center gap-1.5 rounded-xl bg-[#25D366]/10 py-2 text-xs text-[#128C7E]"
                  >
                    <MessageCircle className="size-3.5" /> Avisar a cliente
                  </a>
                  <a href={linkCliente(p.id)} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-1.5 rounded-xl border border-border py-2 text-xs">
                    <ExternalLink className="size-3.5" /> Ver rastreio
                  </a>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
