'use client';

import type { Benefit, HomeSection, SiteCategory } from '@/lib/conteudo/types';

/**
 * AS QUATRO LINHAS das abas de `Conteudo do Site`.
 *
 * Elas compartilham a MOLDURA (`ListRow` + `ListStack` em `list-row.tsx`) e o desenho
 * das ACOES (`RowActions`), e diferem no que fica no meio. Por isso moram juntas: quem
 * for mexer no respiro entre titulo e meta precisa ver que sao a mesma peca usada
 * quatro vezes, e nao quatro telas parecidas por coincidencia.
 *
 * ================== O QUE MUDA DE UMA PARA A OUTRA ==================
 *
 *   Hero Banner        foto + TITULO + subtitulo + `Ordem N · ativo`   2 acoes
 *   Categorias         foto + TITULO + `/slug · ordem N · ativo`       3 acoes
 *   Secoes da Home     (sem foto) `TITULO (kind)` + `fonte: … · N itens · ordem N · ativo`  2 acoes
 *   Beneficios         chip com o nome do icone + TITULO + `descricao · ordem N`            3 acoes
 *
 * ================== HERO E SECOES TEM DUAS ACOES, E ISSO E DO PRINT ==================
 *
 * As duas abas NAO tem o botao de ativar/desativar por linha: em adm-053 (Hero Banner) e
 * adm-055 (Secoes da Home) a unica acao visivel a direita e `Editar` e `Excluir`. Ja
 * Categorias (adm-054) e Beneficios (adm-057) tem tres, com `Desativar` na frente.
 *
 * Reproduzir a diferenca e o ponto: um componente unico com `onToggle` opcional deixaria
 * a divergencia a cargo de quem chama, e a proxima tela a nascer herdaria tres acoes por
 * padrao sem que ninguem tivesse decidido isso.
 *
 * (O estado `ativo/inativo` do Hero Banner EXISTE — a lista imprime `ativo` na meta, e o
 * modal tem `Banner Ativo`. O que nao existe na aba e o ATALHO de trocar pela lista. Ele
 * se troca pelo modal, que e o unico lugar onde o material oferece o campo.)
 */

/* ============================== Hero Banner ============================== */

export function HeroSlideRow({
  title,
  subtitle,
  order,
  active,
  onEdit,
  onDelete,
}: {
  title: string;
  subtitle: string;
  order: number;
  active: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <>
      <div className="min-w-0 flex-1">
        <p className="truncate text-base font-semibold leading-tight text-foreground">{title}</p>
        <p className="mt-1 truncate text-[13px] leading-snug text-muted-foreground">{subtitle}</p>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">
          Ordem {order} · {active ? 'ativo' : 'inativo'}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-4">
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
          aria-label={`Excluir ${title}`}
          className="focus-ring rounded-md text-xs text-danger transition-colors hover:brightness-90"
        >
          Excluir
        </button>
      </div>
    </>
  );
}

/* ============================== Categorias ============================== */

/**
 * A linha de `Categorias` da aba (adm-054).
 *
 * O nome vem de `SiteCategory`, que e um CORTE de `Category` feito em `metrics.ts` — a
 * categoria e a mesma entidade de `/admin/categorias`. Ver `listSiteCategories`.
 *
 * A miniatura e CONDICIONAL: o print mostra foto nas duas primeiras linhas e NENHUMA
 * caixa nas outras quatro — o texto encosta na borda esquerda. Por isso nao ha
 * `ListThumb` quando `imageUrl` e nulo (ver a nota em `list-row.tsx`).
 */
export function SiteCategoryRow({
  category,
  imageUrl,
  onEdit,
  onToggle,
  onDelete,
}: {
  category: SiteCategory;
  imageUrl: string | null;
  onEdit: () => void;
  onToggle: () => void;
  onDelete: () => void;
}) {
  return (
    <>
      {imageUrl ? <SiteCategoryThumb url={imageUrl} alt={category.name} /> : null}

      <div className="min-w-0 flex-1">
        <p className="truncate text-xl leading-tight text-foreground">{category.name}</p>
        <p className="mt-0.5 truncate text-[13px] leading-snug text-muted-foreground">
          /{category.slug} · ordem {category.sortOrder} · {category.isActive ? 'ativo' : 'inativo'}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-3 sm:gap-4">
        <button
          type="button"
          onClick={onToggle}
          className="focus-ring rounded-md text-xs text-foreground underline underline-offset-4 transition-colors hover:text-muted-foreground"
        >
          {category.isActive ? 'Desativar' : 'Ativar'}
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
          aria-label={`Excluir ${category.name}`}
          className="focus-ring rounded-md text-xs text-danger transition-colors hover:brightness-90"
        >
          Excluir
        </button>
      </div>
    </>
  );
}

/**
 * A FOTO DA CATEGORIA — a forma acompanha a imagem.
 *
 * Conferido no recorte ampliado: a foto da linha `Tops` e um RETRATO, e o quadro sai
 * ELIPTICO (medido 59x96) — nao um circulo recortando a foto. As de paisagem saem
 * retangulares. Ou seja: a forma e `border-radius` na caixa e `object-cover`, e a
 * circunferencia/elipse e consequencia da proporcao, nao uma escolha.
 *
 * `/admin/categorias` usa `rounded-full` fixo. As duas telas divergem aqui e a
 * divergencia fica registrada: nao se muda a outra tela por conta propria.
 */
function SiteCategoryThumb({ url, alt }: { url: string; alt: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt={alt}
      loading="lazy"
      style={{ maxHeight: 60 }}
      className="w-auto shrink-0 rounded-lg border border-border/50 object-cover"
    />
  );
}

/* ============================ Secoes da Home ============================ */

/**
 * A linha de `Secoes da Home` (adm-055).
 *
 * (Este e o unico dos quatro que ja estava com o numero certo — o deslocamento de uma
 * posicao comecava em `Hero Banner` e terminava aqui. Ver `demo.ts`.)
 *
 * ================== O `kind` IMPRESSO ENTRE PARENTESES ==================
 *
 * O titulo e seguido do slug tecnico entre parenteses: `As mais amadas (best_sellers)`.
 * E o unico lugar do painel que imprime um enum cru para o lojista, e e o que o material
 * faz — entao e reproduzido, com o mesmo `text-base` do titulo.
 *
 * ================== A DIVERGENCIA INTERNA DO PRINT ==================
 *
 * Na PRIMEIRA linha o titulo diz `(best_sellers)` e a meta logo abaixo diz
 * `fonte: featured`. Os dois discordam. Na SEGUNDA linha (`latest` / `fonte: latest`) eles
 * concordam, e nao ha terceira linha para arbitrar.
 *
 * As duas foram transcritas COMO ESTAO. Escolher um dos dois valores para "consertar" a
 * primeira linha seria inventar um dado: nao se sabe se o erro e o rotulo ou a fonte. E
 * `kind` e `source` sao campos DIFERENTES no tipo por causa disso — se fossem um so, a
 * discordancia seria impossivel de representar e teria sido apagada sem registro.
 */
export function HomeSectionRow({
  section,
  order,
  onEdit,
  onDelete,
}: {
  section: HomeSection;
  order: number;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <>
      <div className="min-w-0 flex-1">
        <p className="truncate text-base font-semibold leading-tight text-foreground">
          {section.title} <span className="font-normal text-muted-foreground">({section.kind})</span>
        </p>
        <p className="mt-1 truncate text-[13px] leading-snug text-muted-foreground">
          fonte: {section.source} · {section.itemCount} itens · ordem {order} ·{' '}
          {section.isActive ? 'ativo' : 'inativo'}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-4">
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
          aria-label={`Excluir ${section.title}`}
          className="focus-ring rounded-md text-xs text-danger transition-colors hover:brightness-90"
        >
          Excluir
        </button>
      </div>
    </>
  );
}

/* =============================== Beneficios =============================== */

/**
 * A linha de `Beneficios` (adm-057).
 *
 * (O numero esta certo desde a primeira escrita: a aba `Beneficios` e adm-057, e o que
 * estava deslocado era a vizinhanca — as outras quatro abas tinham o numero da
 * seguinte. Ver a tabela corrigida no cabecalho de `demo.ts`.)
 *
 * ================== O CHIP IMPRIME O NOME DO ICONE, E ISSO E UM DEFEITO DO ORIGINAL ==================
 *
 * Onde deveria estar o DESENHO do icone, o original imprime o NOME dele como texto: um
 * chip claro com `Truck`, `CreditCard`, `ShieldCheck`, `RefreshCw`, `MessageCircle`.
 *
 * E um defeito de referencia — o dado `iconName` foi escrito direto no JSX. Ele e
 * REPRODUZIDO, porque a instrucao do projeto e fidelidade ao print, e nao correcao do
 * original. O campo continua guardando o NOME (e nao um componente), que e como o
 * formulario do original o grava — ver `types.ts`.
 *
 * A CORRECAO, quando vier, e desenhar o icone a partir do nome. O lugar e este componente,
 * e o dado ja esta pronto para isso: `iconName` e o mesmo vocabulario do lucide.
 */
export function BenefitRow({
  benefit,
  order,
  onEdit,
  onToggle,
  onDelete,
}: {
  benefit: Benefit;
  order: number;
  onEdit: () => void;
  onToggle: () => void;
  onDelete: () => void;
}) {
  return (
    <>
      <span className="shrink-0 rounded-md bg-secondary px-2.5 py-1 font-mono text-[11px] text-foreground">
        {benefit.iconName}
      </span>

      <div className="min-w-0 flex-1">
        <p className="truncate text-base font-semibold leading-tight text-foreground">
          {benefit.title}
        </p>
        <p className="mt-0.5 truncate text-[13px] leading-snug text-muted-foreground">
          {benefit.description} · ordem {order}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-3 sm:gap-4">
        <button
          type="button"
          onClick={onToggle}
          className="focus-ring rounded-md text-xs text-foreground underline underline-offset-4 transition-colors hover:text-muted-foreground"
        >
          {benefit.isActive ? 'Desativar' : 'Ativar'}
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
          aria-label={`Excluir ${benefit.title}`}
          className="focus-ring rounded-md text-xs text-danger transition-colors hover:brightness-90"
        >
          Excluir
        </button>
      </div>
    </>
  );
}
