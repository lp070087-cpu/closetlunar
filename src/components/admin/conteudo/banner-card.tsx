'use client';

import { Trash2 } from 'lucide-react';
import type { HeroSlide } from '@/lib/conteudo/types';

/**
 * O CARD DE BANNER (`/admin/banners`, adm-051).
 *
 * ================== A TELA NAO E UMA LISTA — E UMA GRADE ==================
 *
 * As outras quatro telas deste grupo sao linhas empilhadas. Esta e uma GRADE de TRES
 * colunas, e o numero esta medido: os cards vao de x=635 a x=1130 (496px), de x=1155 a
 * x=1650 e de x=1675 a x=2170 — ou seja, **496px de card com 25px de vao**, tres vezes.
 *
 * ================== MEDIDO NO PRINT ==================
 *
 *   card        496px de largura, raio 12, borda clara, FUNDO BRANCO
 *   imagem      ocupa o topo inteiro, sangrando ate as bordas do card (sem margem)
 *   selo        `ATIVO` — pilula VERDE no canto SUPERIOR DIREITO, SOBRE a imagem
 *   titulo      SERIF, ~19px, `#14110E`
 *   descricao   sans, ~13px, cinza — UMA linha, com reticencias
 *   rodape      separado do texto por uma hairline que atravessa o card
 *   rodape      `ORDEM: 1` a esquerda (caixa alta, minusculo); acoes a direita
 *   acoes       `EDITAR` (tinta) · `DESATIVAR` (vermelho) · lixeira (cinza)
 *
 * ================== A TIPOGRAFIA ACONTECE DENTRO DO CARD ==================
 *
 * Duas coisas corroboram que o card e um CONTEXTO proprio, e nao uma variacao da
 * linha das abas:
 *
 * 1. o titulo aqui e **SERIF** — na linha da aba Categorias e **SANS** (conferido no
 *    recorte ampliado); e o mesmo par do titulo da pagina;
 * 2. as acoes sao **CAIXA ALTA, SEM SUBLINHADO** e com a lixeira no lugar da palavra
 *    `Excluir`; na linha da aba sao caixa baixa E SUBLINHADAS, sem icone.
 *
 * As duas ocorrencias convivem nos prints, em telas do mesmo grupo. Reproduzir as duas
 * e a unica leitura que nao apaga uma delas — por isso o card NAO usa o `ListRow`.
 *
 * ================== A HAIRLINE DO RODAPE ==================
 *
 * Ela atravessa o card de ponta a ponta, encostando nas bordas — e nao tem recuo
 * lateral. A distancia entre o texto e a hairline e bem maior que a de baixo dela; por
 * isso o rodape usa `mt` maior em cima e `pt` menor embaixo, e nao um `py` simetrico.
 */
export function BannerCard({
  slide,
  order,
  onEdit,
  onToggle,
  onDelete,
}: {
  slide: HeroSlide;
  /** A POSICAO na lista (1, 2, 3…) — nao o `sortOrder` gravado. Ver `positionOf`. */
  order: number;
  onEdit: () => void;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const image = slide.imageDesktopUrl ?? slide.imageMobileUrl;

  return (
    <li className="flex flex-col overflow-hidden rounded-xl border border-border/60 bg-background">
      <div className="relative h-[190px] w-full bg-secondary">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt="" className="size-full object-cover" loading="lazy" />
        ) : null}

        {slide.isActive ? (
          <span className="absolute right-2.5 top-2.5 rounded-full bg-success px-2.5 py-1 text-[9px] font-bold tracking-[0.12em] text-white">
            ATIVO
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col px-4 pt-3.5">
        <p className="truncate font-serif text-[19px] leading-tight text-foreground">{slide.title}</p>
        {/*
          A descricao e TRUNCADA em uma linha com reticencias, e o print prova: o texto
          termina em `...para o seu...` — a frase continua no dado e nao cabe no card.
          `truncate` faz exatamente isso; `line-clamp-2` mostraria duas linhas.
        */}
        <p className="mt-1 truncate text-[13px] leading-snug text-muted-foreground">
          {slide.subtitle}
        </p>
      </div>

      <div className="mt-3.5 flex items-center justify-between border-t border-border/60 px-4 pb-3 pt-2.5">
        <span className="text-[10px] font-semibold tracking-[0.12em] text-muted-foreground">
          ORDEM: {order}
        </span>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onEdit}
            className="focus-ring rounded-md text-[10px] font-bold tracking-[0.12em] text-foreground transition-colors hover:text-muted-foreground"
          >
            EDITAR
          </button>
          <button
            type="button"
            onClick={onToggle}
            className="focus-ring rounded-md text-[10px] font-bold tracking-[0.12em] text-danger transition-colors hover:brightness-90"
          >
            {slide.isActive ? 'DESATIVAR' : 'ATIVAR'}
          </button>
          <button
            type="button"
            onClick={onDelete}
            aria-label={`Excluir ${slide.title}`}
            className="focus-ring rounded-md p-0.5 text-muted-foreground transition-colors hover:text-danger"
          >
            <Trash2 className="size-4" aria-hidden />
          </button>
        </div>
      </div>
    </li>
  );
}
