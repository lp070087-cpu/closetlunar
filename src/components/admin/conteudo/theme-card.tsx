'use client';

import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { StoreTheme } from '@/lib/conteudo/types';

/**
 * O CARTAO DE TEMA — adm-060.
 *
 * ================== O QUE O CARTAO DESENHA, MEDIDO NO PRINT ==================
 *
 *   tarja        um retangulo de gradiente no TOPO, da cor `previewFrom` a `previewTo`
 *   `Aa`         a amostra tipografica, SERIFADA, no canto inferior esquerdo da tarja
 *   paleta       TRES circulos logo abaixo do `Aa`, ainda sobre a tarja
 *   selo `ATIVO` pilula escura no canto SUPERIOR direito, so no tema ativo
 *   corpo        fundo branco: o nome, a descricao de uma linha, e o botao
 *
 * ================== A COR DO TEXTO DA TARJA E DERIVADA ==================
 *
 * No tema claro (`Elegant`) o `Aa` e escuro; nos dois escuros (`Fashion` tem uma tarja
 * clara, `Premium Black` tem uma tarja quase preta) o `Aa` fica claro. A cor NAO e um
 * campo do tema: e a LUMINANCIA da tarja que decide. Por isso `isDarkStrip` — um dado a
 * menos para manter em sincronia, e a mesma escolha de derivar `productCount`.
 *
 * ================== O ANEL DO CICULO NAO E UM QUARTO DADO ==================
 *
 * Em `Premium Black` o circulo do meio e `#14110E` — virtualmente igual ao fundo da
 * tarja. No print ele nao some: aparece com um ANEL claro em volta. Isso nao e uma cor
 * extra; e o contorno que torna um circulo escuro visivel sobre uma tarja escura. O
 * componente troca a cor do anel junto com `isDarkStrip`, e `palette` continua com TRES
 * cores, como o tipo promete.
 */
export function ThemeCard({
  theme,
  active,
  onApply,
}: {
  theme: StoreTheme;
  active: boolean;
  onApply: () => void;
}) {
  const dark = isDarkStrip(theme.previewFrom);
  const ink = dark ? 'text-white' : 'text-foreground';

  return (
    <article
      className={cn(
        'overflow-hidden rounded-2xl border bg-background shadow-soft transition-shadow',
        active ? 'border-foreground/70 ring-1 ring-foreground/15' : 'border-border',
      )}
    >
      <div
        className="relative flex h-28 flex-col justify-end gap-2 px-5 pb-3"
        style={{
          backgroundImage: `linear-gradient(135deg, ${theme.previewFrom} 0%, ${theme.previewTo} 100%)`,
        }}
      >
        {active ? (
          <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-foreground px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-background">
            <Check className="size-3" aria-hidden />
            Ativo
          </span>
        ) : null}

        <span className={cn('font-serif text-3xl leading-none', ink)}>Aa</span>

        <div className="flex items-center gap-2">
          {theme.palette.map((color, index) => (
            <span
              key={`${theme.id}-${index}`}
              aria-hidden
              className={cn(
                'size-4 rounded-full',
                dark ? 'ring-1 ring-white/45' : 'ring-1 ring-black/10',
              )}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      </div>

      <div className="space-y-3 p-5">
        <div className="space-y-1">
          <h3 className="text-base font-semibold text-foreground">{theme.name}</h3>
          <p className="text-[13px] leading-snug text-muted-foreground">{theme.description}</p>
        </div>

        <button
          type="button"
          onClick={onApply}
          disabled={active}
          className={cn(
            'focus-ring h-10 w-full rounded-lg text-[11px] font-bold uppercase tracking-[0.14em] transition-colors',
            active
              ? 'cursor-default border border-border bg-secondary text-foreground'
              : 'bg-foreground text-background hover:bg-foreground/90',
          )}
        >
          {active ? 'Tema atual' : 'Aplicar tema'}
        </button>
      </div>
    </article>
  );
}

/**
 * A TARJA E ESCURA? — luminancia relativa do hex.
 *
 * `#F4E9DA` e claro, `#1A1A1A` e escuro, `#FBD9EC` e claro. A fronteira em `0.55` foi
 * escolhida olhando os tres temas do print, e o teste da bancada fixa os tres — nao o
 * numero magico solto.
 */
export function isDarkStrip(hex: string): boolean {
  const rgb = hexToRgb(hex);
  if (!rgb) return false;
  const [r, g, b] = rgb;
  // Luminancia perceptual (Rec. 601), normalizada para 0..1.
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 < 0.55;
}

function hexToRgb(hex: string): [number, number, number] | null {
  const match = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!match) return null;
  const value = Number.parseInt(match[1], 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}
