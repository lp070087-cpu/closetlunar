'use client';

import { useEffect, useRef, useState, type ElementType, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * Revelacao no scroll.
 *
 * A referencia tecnica (vivence-joias-main) faz TODAS as animacoes em CSS puro
 * e so usa um listener de `scrollY` no cabecalho — nao tem biblioteca de
 * animacao, e o projeto novo tambem nao precisa de uma.
 *
 * Aqui a unica coisa que CSS sozinho nao resolve e "animar quando entra na
 * tela": isso exige observar o elemento. Entao o `IntersectionObserver` vive
 * neste componente, e todo o movimento em si continua em CSS (`.ap-reveal`).
 *
 * Detalhes que evitam defeitos conhecidos:
 * - `data-visible` e atributo, nao classe: CSS decide o que fazer com ele;
 * - o elemento e observado UMA vez e o observer e desligado, senao a animacao
 *   dispara de novo a cada rolagem para cima e para baixo;
 * - sem `IntersectionObserver` no ambiente, o conteudo aparece direto, em vez
 *   de ficar invisivel para sempre.
 */

export interface RevealProps {
  children: ReactNode;
  /** Direcao do movimento de entrada. */
  variant?: 'up' | 'left' | 'right' | 'scale';
  /** Atraso em ms, para escalonar itens de uma lista. */
  delay?: number;
  /** Elemento HTML a renderizar. Padrao: `div`. */
  as?: ElementType;
  className?: string;
  id?: string;
}

export function Reveal({
  children,
  variant = 'up',
  delay = 0,
  as: Tag = 'div',
  className,
  id,
}: RevealProps) {
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    if (typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.disconnect();
          }
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag
      ref={ref}
      id={id}
      data-visible={visible ? 'true' : 'false'}
      style={{ '--ap-delay': `${delay}ms` } as React.CSSProperties}
      className={cn(
        'ap-reveal',
        variant === 'left' && 'ap-reveal--left',
        variant === 'right' && 'ap-reveal--right',
        variant === 'scale' && 'ap-reveal--scale',
        className,
      )}
    >
      {children}
    </Tag>
  );
}

/**
 * Numero que sobe ate o valor quando entra na tela.
 *
 * Usa `requestAnimationFrame` com easing, nao `setInterval`: o intervalo de
 * timer e impreciso e o numero "trava" quando a aba perde o foco. E nao roda em
 * quem pediu menos movimento no sistema — nesse caso o valor final aparece
 * direto.
 */
export function CountUp({
  value,
  duration = 1400,
  decimals = 0,
  prefix = '',
  suffix = '',
  className,
}: {
  value: number;
  duration?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [shown, setShown] = useState(0);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node || typeof IntersectionObserver === 'undefined') {
      setShown(value);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setStarted(true);
            observer.disconnect();
          }
        }
      },
      { threshold: 0.4 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [value]);

  useEffect(() => {
    if (!started) return;

    const reduced =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduced) {
      setShown(value);
      return;
    }

    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      // Ease-out cubico: rapido no comeco, assentando no fim.
      const eased = 1 - Math.pow(1 - progress, 3);
      setShown(value * eased);
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [started, value, duration]);

  return (
    <span ref={ref} className={cn('tabular-nums', className)}>
      {prefix}
      {shown.toLocaleString('pt-BR', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}
      {suffix}
    </span>
  );
}
