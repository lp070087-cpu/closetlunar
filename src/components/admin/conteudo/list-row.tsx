import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * A LINHA-CARTAO das listas deste grupo — Hero Banner, Categorias, Secoes da Home,
 * Banners Promocionais, Beneficios.
 *
 * ================== MEDIDO NO PRINT (`235745.png` = adm-054) ==================
 *
 * Captura em 1x (ver a regua: a sidebar termina em x=250, e `--sidebar` = 256px).
 * Painel de 2553x938. Numeros medidos, linha a linha:
 *
 *   primeira linha comeca   y=211
 *   altura das linhas       96 · 60 · 60 · 60 · 60 · 60
 *   vao entre linhas        8px  (o bege do painel, #F7EDE2)
 *   fundo da linha          branco (#FFFFFF)
 *   borda da linha          rgb(233,227,223)
 *   largura do card         x 635..2168  (1534px)
 *   primeiro x com tinta    x=647 (todas as linhas, com ou sem foto)
 *
 * ================== A ALTURA VEM DA MINIATURA ==================
 *
 * Esta e a parte que NAO se adivinha. As duas linhas com contraste no print sao a
 * primeira (Tops, fitinha de 96px) e a terceira (Conjuntos, 60px) — e as duas TEM
 * FOTO. A diferenca esta na FOTO, nao na linha:
 *
 *   Tops        foto de 72px de altura natural  ->  linha de 96px
 *   Conjuntos   foto de 32px de altura natural  ->  linha de 60px
 *
 * O padding vertical e 14px em cima e 14px embaixo (`py-3.5`), e a conta fecha nas
 * duas: 72 + 28 = 100 (medido 96, com a foto ancorada no topo) e 32 + 28 = 60. A
 * linha CRESCE para caber a imagem; ela nao recorta a imagem para caber num numero
 * fixo. Escrever um `h-15` fixo aqui seria trocar a regra do material por uma
 * constante — e a foto de uma capa de banner e justamente o que tem proporcao
 * imprevisivel.
 *
 * ================== A COLUNA DA MINIATURA E CONDICIONAL ==================
 *
 * A tentacao e desenhar uma caixa bege vazia quando nao ha imagem ("o lugar esta
 * reservado"). O print NAO faz isso: nas duas linhas sem foto desta tela nao ha caixa
 * nenhuma — o TEXTO encosta na borda esquerda da linha, em x=647, o MESMO x em que a
 * foto das outras comeca.
 *
 * Isso muda o componente, e nao so o estilo: sem imagem nao se desenha a caixa. Uma
 * caixa vazia de 60px empurraria o titulo para a direita nas linhas sem capa, e o
 * texto deixaria de alinhar com o das linhas com capa — que e exatamente o que o
 * print mostra alinhado.
 *
 * (OBSERVACAO DE METODO: ao medir "tem tinta nos 6px de topo da linha?", as linhas
 * SEM foto tambem acusam tinta — porque nelas o TEXTO subiu para o topo. O teste
 * parecia dizer "todas tem miniatura". Ele media a coisa errada.)
 *
 * ================== A FORMA DA MINIATURA E DERIVADA ==================
 *
 * A miniatura e uma CAIXA ARREDONDADA com `object-fit: cover`, e a forma final vem da
 * proporcao da imagem: a foto da Tops e retrato, e o quadro sai ELIPTICO
 * (medido 59x96). Nas de paisagem sai um retangulo de cantos arredondados. Nao ha
 * `rounded-full` fixo: a circunferencia e o caso particular da imagem quadrada.
 *
 * ================== `textSans` — A DIVERGENCIA COM /admin/categorias ==================
 *
 * Conferido no recorte ampliado, com as DUAS fontes lado a lado no mesmo print: o
 * nome desta linha e SEM SERIFA (e o titulo da pagina, `Categorias`, e serifado).
 *
 * `/admin/categorias` (modulo Categorias, adm-030) usa `font-serif text-lg` no nome
 * da linha — e o print de LA pode ser outro. Sao duas telas com listas parecidas e
 * tipografia diferente, entao este componente NAO reaproveita aquele: uma prop de
 * fonte aqui seria o mesmo defeito que o Provador recusou, mudar o desenho para o
 * componente servir a duas telas.
 *
 * A divergencia fica registrada aqui e no `MEMORY` do projeto para a rodada de
 * correcoes do modulo Categorias — e nao resolvida por conta propria, porque aquele
 * modulo esta fechado.
 */

/** A CAIXA EXTERNA de uma linha — quem decide o padding e a altura e o `ListRow`. */
export function ListRow({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <li
      className={cn(
        'flex items-center gap-4 overflow-hidden rounded-xl border border-border/60 bg-background px-4 py-3.5 sm:gap-5 sm:px-5',
        className,
      )}
    >
      {children}
    </li>
  );
}

/** O `ul` — vao de 8px, medido. */
export function ListStack({ children, className }: { children: ReactNode; className?: string }) {
  return <ul className={cn('flex flex-col gap-2', className)}>{children}</ul>;
}

/**
 * A MINIATURA — so e desenhada quando HA imagem.
 *
 * A altura e a da imagem; por isso nao ha `size-*` aqui. A largura tambem e livre
 * (`w-auto`), e o que limita e o `max-h-*` da tela: no Hero Banner a foto e grande e
 * a lista nao pode virar um mural.
 *
 * Nao ha estado "sem imagem" porque a ausencia nao desenha caixa — ver o cabecalho.
 * Um `<ListThumb url={null} />` nao existe de proposito: quem chama usa `{url ? ... : null}`.
 */
export function ListThumb({
  url,
  alt,
  maxHeight = 60,
  className,
}: {
  url: string;
  alt: string;
  /** Teto de altura da foto, em px. O padrao e a altura das linhas sem capa. */
  maxHeight?: number;
  className?: string;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt={alt}
      loading="lazy"
      style={{ maxHeight }}
      className={cn('w-auto shrink-0 rounded-lg border border-border/50 object-cover', className)}
    />
  );
}

/**
 * O BLOCO DE TEXTO.
 *
 * `min-w-0` + `truncate`: um filho de flex nao encolhe abaixo do proprio conteudo por
 * padrao, entao sem `min-w-0` um titulo longo empurraria as acoes para fora do card.
 */
export function ListBody({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('min-w-0 flex-1', className)}>{children}</div>;
}

/**
 * O TITULO DA LINHA — **sem serifa**, ~20px, `#14110E`.
 *
 * O `text-xl` e a medida (20px). Ver o cabecalho para por que NAO e `font-serif`.
 */
export function ListTitle({
  children,
  className,
  as: Tag = 'p',
}: {
  children: ReactNode;
  className?: string;
  as?: 'p' | 'h3';
}) {
  return (
    <Tag className={cn('truncate text-xl leading-tight text-foreground', className)}>{children}</Tag>
  );
}

/** A linha de apoio — sans, ~13px, `#69625D`. */
export function ListMeta({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p className={cn('mt-0.5 truncate text-[13px] leading-snug text-muted-foreground', className)}>
      {children}
    </p>
  );
}

/** O separador `·` (U+00B7), usado entre os valores da meta. */
export function MetaDot() {
  return (
    <span aria-hidden className="px-1.5">
      ·
    </span>
  );
}

/**
 * AS TRES ACOES DA LINHA — o mesmo desenho em `/admin/categorias` e aqui.
 *
 * MEDIDO: `Desativar` e `Editar` sao texto SUBLINHADO na tinta normal; `Excluir` e
 * `text-danger` e **nao** e sublinhado. A primeira troca de verbo com o estado
 * (`Ativar` quando inativo) — o verbo muda, nao so a cor.
 *
 * Nao ha botao de arrastar nem badge de status: nenhuma das quatro telas deste grupo
 * mostra um.
 */
export function RowActions({
  active,
  entityLabel,
  onToggle,
  onEdit,
  onDelete,
}: {
  active: boolean;
  /** Usado no `aria-label` do Excluir, para o leitor de tela dizer O QUE sera excluido. */
  entityLabel: string;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex shrink-0 items-center gap-3 sm:gap-4">
      <button
        type="button"
        onClick={onToggle}
        className="focus-ring rounded-md text-xs text-foreground underline underline-offset-4 transition-colors hover:text-muted-foreground"
      >
        {active ? 'Desativar' : 'Ativar'}
      </button>
      <button
        type="button"
        onClick={onEdit}
        className="focus-ring rounded-md text-xs text-foreground underline underline-offset-4 transition-colors hover:text-muted-foreground"
      >
        Editar
      </button>
      <button
        type="button"
        onClick={onDelete}
        aria-label={`Excluir ${entityLabel}`}
        className="focus-ring rounded-md text-xs text-danger transition-colors hover:brightness-90"
      >
        Excluir
      </button>
    </div>
  );
}
