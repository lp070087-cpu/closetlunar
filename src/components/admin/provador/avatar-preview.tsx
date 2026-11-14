'use client';

import { CheckCircle2, CircleDashed } from 'lucide-react';
import { Avatar360 } from '@/components/ui/avatar-360';
import type { AvatarSettings } from '@/lib/provador/types';

/**
 * Previa do avatar no painel — o MESMO visualizador 360° que a cliente usa.
 * Mostra quais das 4 vistas ja foram enviadas (sem as 4, o giro fica travado na frente).
 */
const VISTAS: { key: string; label: string }[] = [
  { key: 'frente', label: 'Frente' },
  { key: 'direita', label: 'Lado direito' },
  { key: 'costas', label: 'Costas' },
  { key: 'esquerda', label: 'Lado esquerdo' },
];

export function AvatarPreview({ avatar }: { avatar: AvatarSettings }) {
  const url = (k: string) => avatar.slots.find((s) => s.key === k)?.url || null;
  const vistas = {
    frente: url('frente') || '/site/avatar-provador.png',
    direita: url('direita'),
    costas: url('costas'),
    esquerda: url('esquerda'),
  };
  const faltam = VISTAS.filter((v) => v.key !== 'frente' && !url(v.key));

  return (
    <div className="flex min-h-[34rem] flex-col overflow-hidden rounded-3xl border border-border bg-gradient-to-b from-secondary to-background">
      <div className="flex flex-1 flex-col px-4 pt-6">
        <Avatar360 vistas={vistas} alt="Avatar Closet Lunar" className="flex h-[26rem] w-full flex-col" />
      </div>

      <div className="space-y-3 border-t border-border/60 px-5 py-4">
        <ul className="grid grid-cols-2 gap-2 text-xs">
          {VISTAS.map((v) => {
            const ok = v.key === 'frente' ? true : !!url(v.key);
            return (
              <li key={v.key} className="flex items-center gap-1.5">
                {ok ? (
                  <CheckCircle2 className="size-3.5 text-success" aria-hidden />
                ) : (
                  <CircleDashed className="size-3.5 text-muted-foreground" aria-hidden />
                )}
                <span className={ok ? 'text-foreground' : 'text-muted-foreground'}>{v.label}</span>
              </li>
            );
          })}
        </ul>
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          {faltam.length
            ? `Para liberar o giro 360°, envie: ${faltam.map((v) => v.label.toLowerCase()).join(', ')} (PNG, mesmo enquadramento e altura da frente).`
            : 'Giro 360° ativo — arraste o avatar para testar.'}
        </p>
      </div>
    </div>
  );
}
