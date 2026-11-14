'use client';

import dynamic from 'next/dynamic';
import { useCallback, useEffect, useRef, useState } from 'react';
import { CheckCircle2, MapPin, Navigation, Phone, Radio } from 'lucide-react';

const MapaEntrega = dynamic(() => import('./mapa-entrega').then((m) => m.MapaEntrega), { ssr: false });

interface DadosEntregador {
  pedido: { code: string; cliente: string; telefone: string; endereco: string; bairro: string; cep: string; itens: string[] };
  entrega: { status: 'aguardando' | 'a_caminho' | 'entregue'; destino: { lat: number; lng: number } | null };
}

/**
 * PAINEL DO ENTREGADOR (link unico por pedido, sem login).
 * "Iniciar entrega" liga o GPS do celular e envia a posicao a cada ~4 s;
 * a tela fica acesa (Wake Lock) enquanto compartilha. "Entreguei" encerra.
 */
export function PainelEntregador({ token }: { token: string }) {
  const [d, setD] = useState<DadosEntregador | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [compartilhando, setCompartilhando] = useState(false);
  const [posicao, setPosicao] = useState<{ lat: number; lng: number } | null>(null);
  const [trilha, setTrilha] = useState<[number, number][]>([]);
  const [status, setStatus] = useState<DadosEntregador['entrega']['status']>('aguardando');
  const vigia = useRef<number | null>(null);
  const ultimoEnvio = useRef(0);
  const trava = useRef<{ release: () => Promise<void> } | null>(null);

  useEffect(() => {
    fetch(`/api/entrega/${encodeURIComponent(token)}`, { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((j: DadosEntregador) => {
        setD(j);
        setStatus(j.entrega.status);
      })
      .catch(() => setErro('Link de entrega inválido ou expirado.'));
  }, [token]);

  const enviar = useCallback(
    (lat: number, lng: number, precisao: number) => {
      const agora = Date.now();
      if (agora - ultimoEnvio.current < 3500) return;
      ultimoEnvio.current = agora;
      void fetch(`/api/entrega/${encodeURIComponent(token)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lat, lng, precisao }),
        keepalive: true,
      })
        .then((r) => r.json())
        .then((j) => j?.status && setStatus(j.status))
        .catch(() => undefined);
    },
    [token],
  );

  async function iniciar() {
    setErro(null);
    if (!('geolocation' in navigator)) {
      setErro('Este celular não permite localização pelo navegador.');
      return;
    }
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      trava.current = await (navigator as any).wakeLock?.request('screen');
    } catch {
      /* sem wake lock: segue */
    }
    vigia.current = navigator.geolocation.watchPosition(
      (p) => {
        const { latitude: lat, longitude: lng, accuracy } = p.coords;
        setPosicao({ lat, lng });
        setTrilha((t) => [...t, [lat, lng] as [number, number]].slice(-300));
        setCompartilhando(true);
        enviar(lat, lng, accuracy);
      },
      (e) =>
        setErro(
          e.code === 1
            ? 'Permita o acesso à localização (ícone de cadeado ao lado do endereço do site) e toque de novo.'
            : 'Não foi possível obter a localização. Verifique se o GPS está ligado.',
        ),
      { enableHighAccuracy: true, maximumAge: 2000, timeout: 20000 },
    );
  }

  function parar() {
    if (vigia.current != null) navigator.geolocation.clearWatch(vigia.current);
    vigia.current = null;
    setCompartilhando(false);
    void trava.current?.release().catch(() => undefined);
  }

  async function entregue() {
    if (!confirm('Confirmar que o pedido foi entregue?')) return;
    parar();
    const r = await fetch(`/api/entrega/${encodeURIComponent(token)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ acao: 'entregue' }),
    }).catch(() => null);
    if (r?.ok) setStatus('entregue');
    else setErro('Não foi possível confirmar. Tente de novo.');
  }

  useEffect(() => () => parar(), []); // eslint-disable-line react-hooks/exhaustive-deps

  if (erro && !d) return <Tela><p className="text-center text-sm text-white/70">{erro}</p></Tela>;
  if (!d) return <Tela><p className="text-center text-sm text-white/60">Carregando…</p></Tela>;

  const p = d.pedido;
  const destinoMaps = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${p.endereco}, ${p.bairro}`)}&travelmode=driving`;

  return (
    <Tela>
      <header className="mb-4">
        <p className="text-[11px] uppercase tracking-[0.25em] text-white/60">Closet Lunar · Entrega</p>
        <h1 className="font-serif text-3xl">Pedido #{p.code}</h1>
      </header>

      <section className="rounded-2xl bg-white/10 p-4">
        <p className="text-sm font-medium">{p.cliente}</p>
        <p className="mt-1 flex items-start gap-1.5 text-sm text-white/80">
          <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>
            {p.endereco}
            <br />
            {p.bairro} · CEP {p.cep}
          </span>
        </p>
        <ul className="mt-2 list-disc pl-5 text-xs text-white/60">
          {p.itens.map((i) => (
            <li key={i}>{i}</li>
          ))}
        </ul>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <a href={destinoMaps} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-1.5 rounded-xl bg-white/15 py-2.5 text-xs font-medium">
            <Navigation className="size-4" aria-hidden /> Abrir rota
          </a>
          <a href={`tel:+55${p.telefone.replace(/\D/g, '').replace(/^55/, '')}`} className="flex items-center justify-center gap-1.5 rounded-xl bg-white/15 py-2.5 text-xs font-medium">
            <Phone className="size-4" aria-hidden /> Ligar
          </a>
        </div>
      </section>

      {(posicao || d.entrega.destino) && status !== 'entregue' ? (
        <MapaEntrega posicao={posicao} destino={d.entrega.destino} trilha={trilha} className="mt-4 h-[38vh] w-full" />
      ) : null}

      {erro ? <p className="mt-3 rounded-xl bg-red-500/20 p-3 text-xs text-red-100">{erro}</p> : null}

      <div className="mt-4 space-y-2">
        {status === 'entregue' ? (
          <p className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-500/20 p-4 text-sm text-emerald-100">
            <CheckCircle2 className="size-5" aria-hidden /> Entrega concluída. Obrigado!
          </p>
        ) : !compartilhando ? (
          <button type="button" onClick={iniciar} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-white py-4 text-sm font-semibold uppercase tracking-[0.12em] text-[#1d1715]">
            <Radio className="size-5" aria-hidden /> {status === 'a_caminho' ? 'Retomar localização' : 'Iniciar entrega e compartilhar localização'}
          </button>
        ) : (
          <p className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-500/15 p-3 text-xs text-emerald-100">
            <span className="size-2 animate-pulse rounded-full bg-emerald-400" /> Compartilhando sua localização com a cliente. Mantenha esta tela aberta.
          </p>
        )}
        {status !== 'entregue' ? (
          <button type="button" onClick={entregue} className="w-full rounded-2xl border border-white/30 py-3.5 text-sm font-medium">
            Entreguei o pedido
          </button>
        ) : null}
      </div>
    </Tela>
  );
}

function Tela({ children }: { children: React.ReactNode }) {
  return <main className="min-h-dvh bg-[#1d1715] px-4 py-6 text-white">{<div className="mx-auto max-w-md">{children}</div>}</main>;
}
