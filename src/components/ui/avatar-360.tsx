'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { RotateCw } from 'lucide-react';

/**
 * AVATAR 360° — giro livre e suave com dedo/mouse.
 *
 * Usa as 4 vistas (frente, direita, costas, esquerda), uma a cada 90°. Entre duas
 * vistas o quadro mistura as imagens com peso pelo angulo e aplica uma leve
 * rotacao 3D, o que da a sensacao de corpo girando — sem "trocar" de foto.
 *
 * - Arrasto acompanha o dedo 1:1 (0,6° por pixel), com inercia ao soltar.
 * - Giro infinito nos dois sentidos; atalhos Frente / Lado / Costas e setas do teclado.
 * - Sem as 4 vistas, mostra a frente com um balanco leve (sem giro falso).
 */
export interface VistasAvatar {
  frente: string | null;
  direita?: string | null;
  costas?: string | null;
  esquerda?: string | null;
}

const GRAUS_POR_PIXEL = 0.6;
const ATRITO = 0.92;

function suave(t: number) {
  return t * t * (3 - 2 * t);
}

export function Avatar360({ vistas, alt, className = '' }: { vistas: VistasAvatar; alt: string; className?: string }) {
  const lista = [vistas.frente, vistas.direita, vistas.costas, vistas.esquerda];
  const completo = lista.every(Boolean);
  const imagens = completo ? (lista as string[]) : [vistas.frente ?? '', vistas.frente ?? '', vistas.frente ?? '', vistas.frente ?? ''];

  const [angulo, setAngulo] = useState(0);
  const alvo = useRef(0);
  const atual = useRef(0);
  const velocidade = useRef(0);
  const arrastando = useRef<{ x: number; t: number } | null>(null);
  const raf = useRef<number | null>(null);
  const [dica, setDica] = useState(true);

  // Pre-carrega as 4 imagens para nao piscar no primeiro giro.
  useEffect(() => {
    imagens.forEach((src) => {
      if (src) {
        const i = new Image();
        i.src = src;
      }
    });
  }, [imagens.join('|')]); // eslint-disable-line react-hooks/exhaustive-deps

  const laco = useCallback(() => {
    if (!arrastando.current && Math.abs(velocidade.current) > 0.02) {
      alvo.current += velocidade.current;
      velocidade.current *= ATRITO;
    }
    atual.current += (alvo.current - atual.current) * 0.22;
    setAngulo(atual.current);
    if (arrastando.current || Math.abs(alvo.current - atual.current) > 0.05 || Math.abs(velocidade.current) > 0.02) {
      raf.current = requestAnimationFrame(laco);
    } else {
      raf.current = null;
    }
  }, []);

  const animar = useCallback(() => {
    if (raf.current == null) raf.current = requestAnimationFrame(laco);
  }, [laco]);

  useEffect(() => () => {
    if (raf.current) cancelAnimationFrame(raf.current);
  }, []);

  function irPara(graus: number) {
    // menor caminho ate o angulo pedido
    const base = Math.round((alvo.current - graus) / 360) * 360;
    alvo.current = graus + base;
    velocidade.current = 0;
    setDica(false);
    animar();
  }

  const onDown = (e: React.PointerEvent) => {
    if (!completo) return;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    arrastando.current = { x: e.clientX, t: performance.now() };
    velocidade.current = 0;
    setDica(false);
    animar();
  };
  const onMove = (e: React.PointerEvent) => {
    const a = arrastando.current;
    if (!a) return;
    const dx = e.clientX - a.x;
    const agora = performance.now();
    const delta = -dx * GRAUS_POR_PIXEL;
    alvo.current += delta;
    velocidade.current = (delta / Math.max(1, agora - a.t)) * 16;
    arrastando.current = { x: e.clientX, t: agora };
  };
  const onUp = () => {
    arrastando.current = null;
    animar();
  };

  // Mistura das duas vistas vizinhas
  const norm = ((angulo % 360) + 360) % 360;
  const seg = Math.floor(norm / 90) % 4;
  const t = (norm - seg * 90) / 90;
  const peso = suave(t);
  const a = imagens[seg];
  const b = imagens[(seg + 1) % 4];

  const balanco = completo ? 0 : Math.sin(angulo / 40) * 4;

  return (
    <div className={`relative select-none ${className}`}>
      <div
        role="img"
        aria-label={`${alt} — arraste para girar`}
        tabIndex={0}
        onKeyDown={(e) => {
          if (!completo) return;
          if (e.key === 'ArrowLeft') irPara(Math.round(alvo.current / 90) * 90 - 90);
          if (e.key === 'ArrowRight') irPara(Math.round(alvo.current / 90) * 90 + 90);
        }}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        className={`relative mx-auto aspect-[2/3] h-full max-h-full w-auto touch-pan-y outline-none ${completo ? 'cursor-grab active:cursor-grabbing' : ''}`}
        style={{ perspective: '1200px' }}
      >
        {a ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={a}
            alt=""
            draggable={false}
            className="pointer-events-none absolute inset-0 size-full object-contain"
            style={{
              opacity: completo ? 1 - peso : 1,
              transform: `rotateY(${completo ? -peso * 28 : balanco}deg) scaleX(${completo ? 1 - peso * 0.06 : 1})`,
              willChange: 'transform, opacity',
            }}
          />
        ) : null}
        {completo && b ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={b}
            alt=""
            draggable={false}
            className="pointer-events-none absolute inset-0 size-full object-contain"
            style={{
              opacity: peso,
              transform: `rotateY(${(1 - peso) * 28}deg) scaleX(${1 - (1 - peso) * 0.06})`,
              willChange: 'transform, opacity',
            }}
          />
        ) : null}
        <span className="pointer-events-none absolute inset-x-[18%] bottom-[1%] h-[3%] rounded-[50%] bg-black/15 blur-md" />
      </div>

      {completo ? (
        <>
          {dica ? (
            <span className="pointer-events-none absolute left-1/2 top-3 inline-flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-background/90 px-3 py-1 text-[11px] text-muted-foreground shadow-soft">
              <RotateCw className="size-3.5" aria-hidden /> Arraste para girar 360°
            </span>
          ) : null}
          <div className="mt-3 flex justify-center gap-1.5">
            {[
              ['Frente', 0],
              ['Lado', 90],
              ['Costas', 180],
              ['Outro lado', 270],
            ].map(([rotulo, g]) => {
              const ativo = Math.round(((norm + 45) % 360) / 90) % 4 === (g as number) / 90;
              return (
                <button
                  key={rotulo as string}
                  type="button"
                  onClick={() => irPara(g as number)}
                  className={`rounded-full px-3 py-1.5 text-[11px] font-medium transition ${ativo ? 'bg-foreground text-background' : 'bg-secondary text-muted-foreground hover:text-foreground'}`}
                >
                  {rotulo as string}
                </button>
              );
            })}
          </div>
        </>
      ) : null}
    </div>
  );
}
