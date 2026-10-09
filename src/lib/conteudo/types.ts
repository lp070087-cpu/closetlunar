/**
 * Tipos do grupo CONTEUDO — quatro telas, um diretorio.
 *
 *   Banners            adm-051 / adm-052
 *   Conteudo do Site   adm-053 a adm-059   (sete abas)
 *   Personalizar Loja  adm-060
 *   Looks              adm-061 / adm-062
 *
 * ================== POR QUE OS QUATRO MORAM JUNTOS ==================
 *
 * `lib/` do painel tem um diretorio por MODULO DE MENU (`campanhas`, `cupons`,
 * `fidelidade`, ...). O grupo Conteudo tem QUATRO itens de menu, e os quatro
 * dividem o mesmo assunto — o que a loja mostra. Separar em quatro diretorios
 * faria `HeroSlide` (que e a aba `Hero Banner` de Conteudo do Site E o que a tela
 * Banners alimenta) precisar escolher um dono, e o outro importar do primeiro.
 *
 * O `FormResult`, o `Dataset` e o `WriteResult` sao os mesmos do resto do painel:
 * este modulo nao inaugura contrato novo.
 *
 * ================== O QUE NAO ESTA AQUI, E POR QUE ==================
 *
 * Nao ha tipo para `theme` de verdade. O print de adm-060 mostra tres CARTOES de
 * tema, com nome, descricao, tres amostras de cor e o estado ativo — e nada mais.
 * Nao ha print de editor de cores, de tipografia, de preview nem de publicacao, e
 * o proprio subtitulo da tela diz que essas partes "chegam nas proximas etapas".
 * O tipo guarda exatamente o que o cartao precisa, e nao um "tema completo"
 * inventado para justificar um editor que o material nao mostra.
 */

/* =============================== Banners =============================== */

/**
 * O banner do topo da home — a tela `Banners` e a aba `Hero Banner`.
 *
 * AS QUATRO COLUNAS DA LISTA, medidas em adm-051: a imagem, o titulo, o subtitulo,
 * e o `ORDEM: n`. O selo `ATIVO` fica sobre a imagem.
 *
 * ================== O QUE O PRINT MOSTRA E O QUE ELE NAO MOSTRA ==================
 *
 * Mostra: `Nova coleção fitness` / `Conforto, estilo e performance em peças
 * pensadas para o seu...` (truncado com reticencia), `ORDEM: 1`, o selo `ATIVO`,
 * e as tres acoes `EDITAR`, `DESATIVAR`, lixeira.
 *
 * NAO mostra — e o formulario de adm-052 prova que existe:
 *   `eyebrow`       o campo `EYEBROW (TEXTO SUPERIOR)` com `Closet Lunar`
 *   `ctaText`       o campo `TEXTO DO BOTÃO (CTA)` com `Ver coleção`
 *   `linkUrl`       o campo `LINK DO BANNER (URL)` com `/categoria/novidades`
 *   `imageDesktopUrl` / `imageMobileUrl`
 *
 * E NAO mostra nenhum campo de VALIDADE. O placeholder antigo desta rota
 * (`banners/page.tsx`) dizia `Banner, posição, validade e status com ações` — tres
 * afirmacoes, e as tres estao erradas contra o material: nao ha coluna de posicao,
 * nao ha validade em print nenhum, e o formulario nao tem campo de posicao nem de
 * data. O unico dos tres que se sustenta e `status` (o selo `ATIVO` + `DESATIVAR`).
 */
export interface HeroSlide {
  id: string;
  /** `TÍTULO PRINCIPAL`. Ex.: `Nova coleção fitness`. */
  title: string;
  /** `EYEBROW (TEXTO SUPERIOR)`. Ex.: `Closet Lunar`. */
  eyebrow: string;
  /** `SUBTÍTULO`. Ex.: `Breve descrição do banner`. */
  subtitle: string;
  /** `LINK DO BANNER (URL)`. Aceita caminho interno (`/categoria/novidades`). */
  linkUrl: string;
  /** `TEXTO DO BOTÃO (CTA)`. Ex.: `Ver coleção`. */
  ctaText: string;
  /** `IMAGEM DESKTOP (PRINCIPAL)`. `null` = nenhuma imagem enviada. */
  imageDesktopUrl: string | null;
  /** `IMAGEM MOBILE (OPCIONAL)`. `null` = a home usa a versao desktop. */
  imageMobileUrl: string | null;
  /**
   * `ORDEM DE EXIBIÇÃO` — o numero, e nao a posicao.
   *
   * O valor de repouso do formulario e `0` (adm-052), e o que a lista mostra e
   * `ORDEM: 1..3` — ou seja, cadastro e exibicao divergem no material. A ordem de
   * exibicao e DERIVADA no `metrics.ts` (`positionOf`), e nao gravada: gravar um
   * contador de posicao cria a chance de ele divergir da lista, que e o mesmo
   * motivo pelo qual `Category.productCount` e contado na leitura.
   */
  sortOrder: number;
  /** `Banner Ativo`. O selo `ATIVO` da lista e o verbo `DESATIVAR` saem daqui. */
  isActive: boolean;
}

/** Rascunho: `sortOrder` fica TEXTO enquanto se digita, como todos os numeros do painel. */
export interface HeroSlideDraft {
  title: string;
  eyebrow: string;
  subtitle: string;
  linkUrl: string;
  ctaText: string;
  imageDesktopUrl: string;
  imageMobileUrl: string;
  sortOrder: string;
  isActive: boolean;
}

export interface HeroSlideFieldErrors {
  title?: string;
  sortOrder?: string;
}

/* ========================== Conteudo do Site ========================== */

/**
 * AS SETE ABAS DE `Conteudo do Site`.
 *
 * O union e escrito A MAO em vez de derivado de `CONTEUDO_TABS` (`typeof TABS[number]['value']`)
 * por um motivo pratico: `demo.ts` importa estes tipos, e derivar o tipo de uma
 * constante de `demo.ts` fecharia um ciclo (`types` -> `demo` -> `types`). O preco e
 * manter as duas listas em sincronia — e a bancada confere as duas contra o print,
 * que e o que impede a dessincronizacao de passar despercebida.
 */
export type ConteudoTabValue =
  | 'hero'
  | 'categorias'
  | 'secoes'
  | 'promo'
  | 'beneficios'
  | 'instagram'
  | 'rodape';

/**
 * UMA CATEGORIA NA ABA `Categorias` — adm-054.
 *
 * ================== A MINIATURA EXISTE, E UMA NOTA MINHA DISSE QUE NAO ==================
 *
 * A versao anterior deste tipo nao tinha campo de imagem, justificado assim:
 *
 *     "esta aba nao mostra imagem nenhuma — a linha de adm-055 comeca direto no nome"
 *
 * **AS DUAS METADES ESTAO ERRADAS**, e o erro tem nome: eu li a aba errada.
 *
 *   `adm-055` NAO E Categorias — e `Secoes da Home`. A aba `Categorias` e **adm-054**,
 *   e o que a identifica e a PILULA `Categorias` acesa na faixa de abas.
 *
 *   `Categorias` NAO "comeca direto no nome" em todas as linhas. Medido no recorte de
 *   `235745.png` (a faixa das linhas): `Conjuntos` tem FOTO — um retangulo com borda a
 *   esquerda do nome — e `Shorts`, `Atacado` e `Leggings` NAO tem. As duas coisas na
 *   mesma tela. O que e verdade e mais estreito: a linha SEM imagem comeca no nome.
 *
 * A distincao importa porque muda o componente. "A lista nao exibe imagem" pede uma
 * lista sem coluna de miniatura; "a lista exibe a imagem QUANDO EXISTE" pede uma coluna
 * CONDICIONAL, em que a ausencia nao desenha caixa nenhuma. Sao desenhos diferentes, e
 * o segundo e o do print.
 *
 * ================== POR QUE O CAMPO NAO E DERIVADO COMO `productCount` ==================
 *
 * `productCount` e contado na leitura (`metrics.ts`) porque a contagem e sempre
 * recalculavel. A imagem nao e: ela e um dado da categoria, entao o corte a CARREGA de
 * `Category.image` (que e onde ela mora de verdade) em vez de contar quantas existem.
 */
export interface SiteCategory {
  id: string;
  name: string;
  /** URL amigavel, exibida com barra na frente: `/tops`. */
  slug: string;
  /**
   * A miniatura da linha, ou `null` quando a categoria nao tem imagem.
   *
   * `null` NAO e um estado de erro: e o que faz `SiteCategoryRow` nao desenhar caixa
   * nenhuma. Ver a nota do componente em `conteudo-rows.tsx`.
   */
  imageUrl: string | null;
  /** `ordem N` da terceira linha da meta. */
  sortOrder: number;
  isActive: boolean;
}

/**
 * UMA SECAO DA HOME — a aba `Seções da Home`.
 *
 * A LINHA DO PRINT TEM TRES COISAS, e a segunda e a que manda no desenho:
 *
 *   `As mais amadas (best_sellers)`   o titulo, e o SLUG DO TIPO entre parenteses
 *   `fonte: featured · 8 itens · ordem 1 · ativo`
 *   `Editar` `Excluir`
 *
 * `kind` e o slug do parenteses. Ele NAO e o titulo: `As mais amadas` veio de
 * `best_sellers`, e a segunda linha veio de `latest`. Ou seja, o titulo e livre e
 * o tipo e o que decide a regra — e por isso sao dois campos.
 *
 * ================== A DIVERGENCIA INTERNA DO PROPRIO PRINT ==================
 *
 * Em adm-055 a linha 1 diz, no titulo, **`(best_sellers)`**, e na linha de baixo
 * diz **`fonte: featured`**. Os dois valores apontam para coisas diferentes — o
 * slug do tipo e a fonte de dados — e no print eles nao casam. Nao ha segunda
 * linha do mesmo tipo para comparar (a linha 2 diz `(latest)` e `fonte: latest`,
 * que casam), entao nao da para saber se o certo seria `best_sellers · fonte:
 * best_sellers` ou `featured · fonte: featured`.
 *
 * AS DUAS FONTES FICAM GRAVADAS, e a tela mostra as duas exatamente como o print:
 * `kind = 'best_sellers'` e `source = 'featured'`. Escolher um dos dois lados para
 * "arrumar" a linha apagaria a evidencia — e a decisao do modulo Tamanhos ja
 * mostrou que transcrever a divergencia e mais barato que arbitrar sem base.
 * A divergencia vai no relatorio final.
 *
 * ================== `itemCount` E GRAVADO, E ISSO E DELIBERADO ==================
 *
 * Diferente de `Category.productCount` (contado na leitura) e de `positionOf`
 * (derivado), `itemCount` do print — `8 itens` — e um NUMERO DE CONFIGURACAO: a
 * secao mostra "os N primeiros" de uma fonte. Nao ha como derivar 8 de nada sem
 * inventar a regra de corte.
 */
export type SiteSectionKind =
  | 'best_sellers'
  | 'latest'
  | 'featured'
  | 'category'
  | 'promo'
  | 'custom';

export interface HomeSection {
  id: string;
  /** O titulo livre, ex.: `As mais amadas`. */
  title: string;
  /** O slug do tipo, exibido entre parenteses. */
  kind: SiteSectionKind;
  /** O que aparece depois de `fonte:`. */
  source: string;
  /** `N itens` — quantos itens a secao mostra. */
  itemCount: number;
  sortOrder: number;
  isActive: boolean;
}

/** A aba `Banners Promocionais`. Lista vazia no print — ver `demo.ts`. */
export interface PromoBanner {
  id: string;
  title: string;
  subtitle: string;
  imageUrl: string | null;
  linkUrl: string;
  sortOrder: number;
  isActive: boolean;
}

/**
 * UM BENEFICIO — a aba `Benefícios`.
 *
 * ================== O ICONE DO PRINT E UM BUG DA REFERENCIA, E ELE FICA ==================
 *
 * Nas cinco linhas de adm-057, o lugar do icone mostra O NOME CRU DO ICONE como
 * texto: `Truck`, `CreditCard`, `ShieldCheck`, `RefreshCw`, `MessageCircle` — os
 * nomes exatos de cinco icones do lucide-react. Nao e um icone desenhado; e a
 * string que deveria ter virado componente e nao virou (o original monta o mapa
 * `{ Truck, CreditCard, ... }` e o que aparece na tela e a chave).
 *
 * `iconName` guarda esse texto, e a tela o IMPRIME — nao troca por um icone
 * bonito. Reproduzir o defeito e o que mantem a tela fiel: se eu desenhasse o
 * caminhao, a tela ficaria mais bonita e deixaria de ser a tela do print. O que a
 * tela FAZ e escolher o icone certo a partir do nome (`BENEFIT_ICONS`), para que
 * o dia da correcao seja trocar o texto pelo componente, num lugar so.
 */
export interface Benefit {
  id: string;
  /** O nome cru do icone, como o print o imprime. */
  iconName: string;
  /** O titulo, ex.: `Frete grátis`. */
  title: string;
  /** A segunda linha, ex.: `acima de R$299`. */
  description: string;
  sortOrder: number;
  isActive: boolean;
}

/** A aba `Instagram`. */
export interface InstagramConfig {
  /** `URL completa do Instagram`. */
  url: string;
  /** `Exibir feed na Home`. O quadradinho do print chega MARCADO. */
  showOnHome: boolean;
}

/**
 * A aba `Rodapé` — adm-059.
 *
 * ================== SAO QUATRO INPUTS, E UMA NOTA MINHA DISSE QUE ERAM DOIS ==================
 *
 * A versao anterior deste comentario afirmava que `E-mail` e `Endereço` NAO eram
 * campos: "medem ~`#D5D5D5`, mais claros que o cinza de placeholder, sao o texto de
 * apoio de uma lista vazia". **A MEDIDA estava errada.**
 *
 * O recorte ampliado de `235816.png` mostra as QUATRO caixas do mesmo tamanho, na
 * mesma grade 2x2, com a MESMA borda e o mesmo fundo claro. A diferenca entre a
 * primeira caixa e a segunda nao e a presenca do campo — e o CONTEUDO: `55819988717397`
 * esta digitado (`#14110E`, quase preto) e `E-mail` e o PLACEHOLDER (`~#7E7E7E`, a
 * mesma familia de `Breve descrição do banner`). Ou seja: quatro `<input>`, dois
 * preenchidos e dois so com placeholder.
 *
 * O erro foi amostrar o pixel ERRADO — uma linha clara entre os glifos, e nao o
 * proprio texto — e entao construir uma explicacao (a dele "lista vazia") para a
 * medida. Medir de novo, no glifo, desfez a explicacao. Ver
 * `feedback_medida_numerica_nao_decide_fonte`: numero sem recorte nao decide nada.
 *
 * ================== AS DUAS LISTAS ==================
 *
 * `Politicas` e `Links` sao listas de verdade, com `+ Adicionar` — mas as duas estao
 * VAZIAS no print, e nao ha captura do item cadastrado nem do formulario que o cria.
 * Mesma classificacao de `Secoes da Home` e `Banners Promocionais`: REFERENCIA
 * INSUFICIENTE, com o `+ Adicionar` avisando em vez de inventar campos.
 */
export interface FooterLink {
  id: string;
  label: string;
  url: string;
}

export interface FooterPolicy {
  id: string;
  label: string;
  url: string;
}

export interface SiteFooter {
  /** `5581998871397` no print — o digito cru, sem `+` e sem formatacao. */
  whatsapp: string;
  /**
   * `@closetlunnar` no print — com DOIS `n`.
   *
   * AO CONTRARIO da aba `Instagram` (adm-058), que escreve `@closetlunar` com UM.
   * As duas telas do material divergem sobre o mesmo perfil, e as duas grafias sao
   * transcritas como estao. Ver `DEMO_INSTAGRAM` em `demo.ts`.
   */
  instagram: string;
  /**
   * `E-mail` — VAZIO no print. A caixa existe e o placeholder diz o que ela espera;
   * o valor de repouso e `''`, como o dos outros campos em branco do painel.
   */
  email: string;
  /** `Endereço` — vazio no print, pela mesma razao do `email`. */
  address: string;
  policies: FooterPolicy[];
  links: FooterLink[];
}

/* =========================== Personalizar Loja =========================== */

/**
 * UM TEMA — o cartao de adm-060.
 *
 * O cartao e: uma tarja de previa no topo (gradiente), a amostra tipografica `Aa`,
 * a paleta de tres cores, o nome, a descricao, e um botao que e `Aplicar tema`
 * quando o tema esta inativo e `Tema atual` quando esta ativo.
 *
 * A AMOSTRA TIPOGRAFICA FAZ PARTE DA PREVIA, e nao e um dado: o tema claro mostra
 * `Aa` em serifada e os dois escuros em serifada tambem — a diferenca visivel
 * entre os tres esta na TARJA e nas TRES CORES. Por isso o tipo guarda `preview`
 * (as duas pontas do gradiente) e `palette` (as tres cores), e nao um "nome de
 * fonte", que o print nao permite distinguir.
 */
export interface StoreTheme {
  id: string;
  name: string;
  /** A descricao de uma linha, ex.: `Boutique clássico — neutros quentes...`. */
  description: string;
  /** Cor inicial do gradiente da tarja. */
  previewFrom: string;
  /** Cor final do gradiente da tarja. */
  previewTo: string;
  /**
   * As TRES amostras de cor, na ordem do print: esquerda, meio, direita.
   *
   * Na terceira amostra o print traca um ANEL (a cor do meio do tema escuro
   * aparece com um contorno, porque o preenchimento e escuro sobre tarja escura) —
   * e uma decisao do componente, e nao um quarto dado.
   */
  palette: [string, string, string];
}

/* ================================ Looks ================================ */

/**
 * UMA PECA DENTRO DE UM LOOK — so o produto, e nada mais.
 *
 * ================== UM CAMPO QUE FOI ESCRITO E REMOVIDO ==================
 *
 * A primeira versao deste tipo tinha `discountPercent`, justificado assim: "o
 * `PREVIEW DO LOOK` imprime uma coluna `Discount` e uma linha `Discount`".
 *
 * **ISSO ERA FALSO.** Fui conferir o preview no pixel (`235840.png`, a faixa
 * `PREVIEW DO LOOK`) e ele imprime QUATRO coisas, nesta ordem:
 *
 *     PREVIEW DO LOOK
 *     Sem nome
 *     0 peças
 *     Total: R$ 0,00
 *     COMPRAR LOOK COMPLETO
 *
 * Nao ha coluna `Discount`, nao ha linha `Discount`, nao ha desconto em lugar
 * nenhum do material. O campo foi inventado — e o jeito de ele ter entrado e
 * reconhecivel: `Total` num carrinho sugere desconto, e a sugestao virou dado sem
 * passar por print nenhum.
 *
 * O CAMPO FOI REMOVIDO, e nao "deixado com valor zero". Um campo de desconto com
 * valor zero nao custa nada hoje e custa caro amanha: ele aparece no tipo, o tipo
 * aparece no formulario, e alguem procura o print que pediu aquilo. O `Total` do
 * preview volta a ser o que ele E — a soma dos precos das pecas escolhidas —, que
 * e uma conta que se prova.
 *
 * O registro fica porque a licao vale mais que a linha: "o print mostra um total"
 * nao autoriza "portanto existe desconto". Quem escreveu este tipo quase deixou um
 * campo fantasma no dado por causa de uma inferencia, e a unica coisa que separou
 * as duas foi abrir a imagem.
 */
export interface LookPiece {
  productId: string;
}

/**
 * UM LOOK — a entidade da tela `Looks`.
 *
 * O FORMULARIO DE adm-062 PROVA OS CAMPOS, um a um:
 *
 *   `Nome do look (ex: Look Lunar Noite)`   -> `name`, com o exemplo literal
 *   `Subtítulo`                             -> `subtitle`
 *   `Descrição completa do look`            -> `description`
 *   `URL da imagem de capa` + `Enviar arquivo` -> `coverUrl`
 *   `0` ao lado de `Ativo`                  -> `sortOrder` (mesmo campo de Banners)
 *   `PRODUTOS DO LOOK (0 SELECIONADOS)`     -> `pieces`
 *   `PREVIEW DO LOOK`                       -> derivado, ver `metrics.ts`
 *
 * O QUE NAO ESTA AQUI: preco do look, selo, categoria, colecao, data de
 * publicacao, SEO. Nenhum deles aparece no formulario nem na lista.
 */
export interface Look {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  coverUrl: string | null;
  sortOrder: number;
  isActive: boolean;
  pieces: LookPiece[];
}

/**
 * Rascunho do look.
 *
 * `sortOrder` fica TEXTO enquanto se digita, como todos os numeros do painel — o
 * campo precisa poder ficar VAZIO sem virar `0`.
 *
 * `pieces` guarda os ids NA ORDEM EM QUE FORAM MARCADOS, e `selectedIds` existe
 * separado por um motivo que a bancada prova: o contador do rotulo
 * (`PRODUTOS DO LOOK (0 SELECIONADOS)`) conta a LISTA, e o `0` do print e o
 * comprimento dela — nao o numero de caixas desenhadas. Ver `metrics.ts`.
 */
export interface LookDraft {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  coverUrl: string;
  sortOrder: string;
  isActive: boolean;
  pieces: LookPiece[];
}

export interface LookFieldErrors {
  name?: string;
  sortOrder?: string;
}

/* ============================ Resultado comum ============================ */

/**
 * O que `listLooks` devolveu. Igual ao `Dataset` do resto do painel: a tela
 * precisa saber se o dado e de exemplo antes de chama-lo de real.
 */
export interface Dataset<T> {
  data: T;
  source: 'demo' | 'database';
}

/** Escrita que NAO grava — o contrato de todas as telas desta fase. */
export interface WriteResult<T> {
  data: T;
  persisted: boolean;
  reason?: string;
}
