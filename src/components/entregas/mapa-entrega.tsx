'use client';

import { useEffect, useRef } from 'react';
import 'leaflet/dist/leaflet.css';

/**
 * Mapa da entrega (Leaflet + OpenStreetMap).
 * A moto desliza suavemente ate cada nova posicao (animacao de ~1,5 s), a trilha
 * mostra o caminho feito e a casinha marca o destino. O mapa enquadra moto + destino.
 */
type LL = { lat: number; lng: number };

const iconeMoto = `
<div style="width:46px;height:46px;border-radius:9999px;background:#1d1715;display:grid;place-items:center;box-shadow:0 6px 18px rgba(0,0,0,.35);border:3px solid #fff">
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="5.5" cy="17" r="3"/><circle cx="18.5" cy="17" r="3"/><path d="M8.5 17h6l2.5-6h-4l-2-4H9"/><path d="M15 6h2.5l1 3"/></svg>
</div>`;
const iconeCasa = `
<div style="width:38px;height:38px;border-radius:9999px;background:#C2185B;display:grid;place-items:center;box-shadow:0 6px 16px rgba(194,24,91,.4);border:3px solid #fff">
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/></svg>
</div>`;

export function MapaEntrega({
  posicao,
  destino,
  trilha,
  className = '',
}: {
  posicao: LL | null;
  destino: LL | null;
  trilha: [number, number][];
  className?: string;
}) {
  const caixa = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const L = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapa = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const moto = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const casa = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const linha = useRef<any>(null);
  const anim = useRef<number | null>(null);
  const enquadrado = useRef(false);

  // cria o mapa uma vez
  useEffect(() => {
    let vivo = true;
    (async () => {
      const leaflet = (await import('leaflet')).default;
      if (!vivo || !caixa.current || mapa.current) return;
      L.current = leaflet;
      const centro = posicao ?? destino ?? { lat: -8.0, lng: -34.88 };
      mapa.current = leaflet
        .map(caixa.current, { zoomControl: true, attributionControl: true })
        .setView([centro.lat, centro.lng], 15);
      leaflet
        .tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '&copy; OpenStreetMap',
        })
        .addTo(mapa.current);
      linha.current = leaflet.polyline([], { color: '#1d1715', weight: 4, opacity: 0.55, dashArray: '6 8' }).addTo(mapa.current);
      atualizar(true);
    })();
    return () => {
      vivo = false;
      if (anim.current) cancelAnimationFrame(anim.current);
      mapa.current?.remove();
      mapa.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function atualizar(primeira = false) {
    const leaflet = L.current;
    const m = mapa.current;
    if (!leaflet || !m) return;

    if (destino) {
      if (!casa.current) {
        casa.current = leaflet
          .marker([destino.lat, destino.lng], {
            icon: leaflet.divIcon({ html: iconeCasa, className: '', iconSize: [38, 38], iconAnchor: [19, 19] }),
          })
          .addTo(m);
      } else casa.current.setLatLng([destino.lat, destino.lng]);
    }

    linha.current?.setLatLngs(trilha);

    if (posicao) {
      if (!moto.current) {
        moto.current = leaflet
          .marker([posicao.lat, posicao.lng], {
            icon: leaflet.divIcon({ html: iconeMoto, className: '', iconSize: [46, 46], iconAnchor: [23, 23] }),
            zIndexOffset: 1000,
          })
          .addTo(m);
      } else {
        // desliza da posicao atual ate a nova
        const de = moto.current.getLatLng();
        const ate = { lat: posicao.lat, lng: posicao.lng };
        const inicio = performance.now();
        const dur = primeira ? 0 : 1500;
        if (anim.current) cancelAnimationFrame(anim.current);
        const passo = (agora: number) => {
          const t = dur ? Math.min(1, (agora - inicio) / dur) : 1;
          const e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
          moto.current.setLatLng([de.lat + (ate.lat - de.lat) * e, de.lng + (ate.lng - de.lng) * e]);
          if (t < 1) anim.current = requestAnimationFrame(passo);
        };
        anim.current = requestAnimationFrame(passo);
      }
      if (!enquadrado.current) {
        enquadrado.current = true;
        if (destino) m.fitBounds([[posicao.lat, posicao.lng], [destino.lat, destino.lng]], { padding: [60, 60], maxZoom: 16 });
        else m.setView([posicao.lat, posicao.lng], 16);
      } else if (!m.getBounds().pad(-0.15).contains([posicao.lat, posicao.lng])) {
        m.panTo([posicao.lat, posicao.lng], { animate: true, duration: 1 });
      }
    } else if (destino && primeira) {
      m.setView([destino.lat, destino.lng], 15);
    }
  }

  useEffect(() => {
    atualizar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [posicao?.lat, posicao?.lng, destino?.lat, destino?.lng, trilha.length]);

  return <div ref={caixa} className={`z-0 overflow-hidden rounded-2xl ${className}`} />;
}

