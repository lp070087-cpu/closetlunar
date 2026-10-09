/**
 * Dados demonstrativos do grupo CONTEUDO.
 *
 * ================== A REGRA DESTE ARQUIVO ==================
 *
 * SO ENTRA AQUI O QUE ESTA NO PRINT. Onde o material mostra uma lista preenchida,
 * ela e transcrita. Onde ele mostra a lista VAZIA, o array fica vazio — e a tela
 * desenha o estado vazio, que tambem esta no print.
 *
 * As duas metades importam igualmente. Uma lista de exemplo inventada numa tela que
 * o print mostra vazia faria a tela PARECER pronta e esconderia justamente o
 * trabalho que falta; um array vazio numa tela que o print mostra cheia deixaria a
 * tela em branco sem motivo.
 *
 * ================== O QUE E TRANSCRITO, TELA A TELA ==================
 *
 *   Banners (adm-051)             3 slides, com titulo, subtitulo, ordem e ativo
 *   Hero Banner (adm-053)         os MESMOS 3 — e a mesma entidade; ver a nota
 *   Categorias (adm-054)          NAO E TRANSCRITA AQUI — ver a nota abaixo
 *   Secoes da Home (adm-055)      2 secoes
 *   Banners Promocionais (adm-056) VAZIA — `Nenhum banner promocional.`
 *   Beneficios (adm-057)          5 beneficios
 *   Instagram (adm-058)           1 URL e o checkbox marcado
 *   Rodape (adm-059)              2 valores, 2 listas vazias
 *   Personalizar Loja (adm-060)   3 temas
 *   Looks (adm-061)               VAZIA — `Nenhum look cadastrado ainda.`
 *
 * ================== ESTA TABELA ESTEVE DESLOCADA EM CINCO LINHAS ==================
 *
 * As abas de `Conteudo do Site` (adm-053 a adm-059) estavam cada uma com o numero da
 * SEGUINTE: Hero Banner impresso como 054, Categorias como 055, Secoes como 056,
 * Banners Promocionais como 057, Beneficios como 058. O erro nao aparecia porque
 * numeros nao apontam para arquivo nenhum — so a leitura da faixa de abas desfaz.
 *
 * A CORRECAO VEM DO PIXEL, nao de uma deducao: em cada captura a pilula ACESA da
 * faixa de abas diz qual tela e. Lidas assim, `235737` tem `Hero Banner` acesa,
 * `235745` tem `Categorias`, `235750` tem `Secoes da Home`, `235757` tem
 * `Banners Promocionais`, `235804` tem `Beneficios`, `235810` tem `Instagram` e
 * `235816` tem `Rodape`. E `235711` — que a lista de midia nao numerava — e
 * `IA de Looks`, do modulo ANTERIOR, e nao pertence a este grupo.
 *
 * (O erro de leitura tinha uma causa reconhecivel: a faixa de abas tem SETE pilulas
 * e eu contei os arquivos em vez de ler os rotulos. Contar arquivos nao identifica
 * tela quando o modulo comeca no meio de um bloco de capturas.)
 *
 * ================== `Closet Lunar` — DUAS GRAFIAS, E AS DUAS SAO REAIS ==================
 *
 * O print escreve `Closet LUNAR` no logo da sidebar e no rodape da home, e
 * `Closet LUNNAR` no placeholder `Ex: Closet Lunar / ClosetLunnar` e numa das
 * descricoes. Nenhuma das duas e erro de leitura: sao dois lugares do material, e
 * as duas foram transcritas como estao. A grafia canonica do projeto e `Lunnar`
 * (ver `project_closet_lunnar_fase2_produtos`); a divergencia fica registrada no
 * relatorio final, como as outras deste painel.
 *
 * ================== E A TERCEIRA GRAFIA: O `@` DO INSTAGRAM ==================
 *
 * Alem do nome da loja, o PERFIL tambem aparece de duas formas no material, e nao
 * do jeito que eu tinha escrito: a aba `Instagram` (adm-058) diz `@closetlunar`
 * (um `n`) e o `Rodape` (adm-059) diz `@closetlunnar` (dois). Eu havia normalizado
 * os dois para a grafia do projeto — um conserto do material que a regra proibe.
 * Ver `DEMO_INSTAGRAM` abaixo; as duas ficam como estao.
 */

import type {
  Benefit,
  HeroSlide,
  HomeSection,
  InstagramConfig,
  Look,
  SiteCategory,
  SiteFooter,
  StoreTheme,
} from './types';

/* ============================ Banners / Hero ============================ */

/**
 * OS TRES SLIDES.
 *
 * `Banners` (adm-051) e a aba `Hero Banner` de `Conteudo do Site` (adm-053) sao A
 * MESMA COISA em duas telas: os titulos, os subtitulos e a ordem batem linha a
 * linha. E o mesmo caso de `Avatar Virtual` / `Provador Virtual`, que dividem a
 * secao `Provador Virtual — Imagens das peças`. Por isso os dois leem ESTA
 * constante, e nao um array cada um.
 *
 * A TELA BANNERS MOSTRA A IMAGEM; A ABA MOSTRA A MINIATURA. O resto — titulo,
 * subtitulo, ordem, status — e identico, e por isso nao ha um segundo array.
 *
 * `imageDesktopUrl` e `imageMobileUrl` sao `null` pelo mesmo motivo do avatar: as
 * fotos do print sao um bucket do painel ORIGINAL, de outra conta, e copiar a URL
 * daria uma tela que parece pronta e quebra quando aquela conta mudar. Nao ha
 * storage deste projeto ainda. O ESPACO da imagem existe e e desenhado — o que
 * nao se faz e gravar foto de terceiro como se fosse nossa.
 */
export const DEMO_HERO_SLIDES: HeroSlide[] = [
  {
    id: 'slide-01',
    title: 'Nova coleção fitness',
    eyebrow: 'Closet Lunar',
    subtitle: 'Conforto, estilo e performance em peças pensadas para o seu movimento.',
    linkUrl: '/categoria/novidades',
    ctaText: 'Ver coleção',
    imageDesktopUrl: null,
    imageMobileUrl: null,
    sortOrder: 1,
    isActive: true,
  },
  {
    id: 'slide-02',
    title: 'Conjuntos com 20% OFF',
    eyebrow: 'Closet Lunar',
    subtitle: 'Looks completos para treinar e arrasar fora da academia.',
    linkUrl: '',
    ctaText: '',
    imageDesktopUrl: null,
    imageMobileUrl: null,
    sortOrder: 2,
    isActive: true,
  },
  {
    id: 'slide-03',
    title: 'Frete grátis acima de R$299',
    eyebrow: 'Closet Lunar',
    subtitle: 'Para todo o Brasil, com primeira troca grátis em até 7 dias.',
    linkUrl: '',
    ctaText: '',
    imageDesktopUrl: null,
    imageMobileUrl: null,
    sortOrder: 3,
    isActive: true,
  },
];

/**
 * O REPOUSO DO FORMULARIO `Novo Banner` — adm-052.
 *
 * Todos os campos vazios, `ordem` em `0` e `Banner Ativo` MARCADO, que e o estado
 * que o print de fato mostra.
 *
 * O `eyebrow` NAO nasce `Closet Lunar`: o print mostra `Closet Lunar` na posicao do
 * VALOR do campo, e a captura do modal e a unica prova de que existe um valor de
 * repouso digitado. Ele fica aqui para a tela abrir igual ao material, e o custo
 * esta declarado — no banco, um slide novo nasceria com o `eyebrow` que o formulario
 * enviou, e nao com este.
 */
export const DEMO_HERO_DEFAULTS = {
  eyebrow: 'Closet Lunar',
  sortOrder: 0,
  isActive: true,
} as const;

/* ============================== Categorias ============================== */

/**
 * A ABA `CATEGORIAS` NAO TEM LISTA PROPRIA — e a decisao mais importante deste
 * arquivo, e a que quase foi tomada errado.
 *
 * ================== O QUE QUASE FOI ESCRITO AQUI ==================
 *
 * A primeira versao deste arquivo tinha uma constante com SEIS ids de categoria
 * (`cat-tops`, `cat-macaquinhos`, ...), transcrita da lista de adm-054, e o
 * `metrics.ts` ia traduzir id -> nome por join. Parecia razoavel: a lista do print
 * tem seis linhas e eu escrevi as seis.
 *
 * Olhando de novo, isso e o MESMO DEFEITO que o projeto ja corrigiu duas vezes —
 * criar um SEGUNDO DONO para uma lista que ja tem dono. `lib/categorias` e o dono
 * das categorias; guardar seis ids aqui faz a lista desta aba divergir silenciosamente
 * da lista de `/admin/categorias` no dia em que alguem criar, renomear, reordenar
 * ou desativar uma categoria.
 *
 * E a divergencia JA EXISTE. O catalogo `lib/categorias` tem OITO categorias: as
 * seis do print mais `Streetwear` e `Croppeds`, que a Fase 2 precisou criar porque
 * os produtos de demonstracao (`Jaqueta Corta Vento Fit` e `Cropped Urban Fit`)
 * apontam para elas, e uma categoria apagada deixaria aqueles produtos orfaos.
 * O print de adm-054 e anterior a elas e mostra seis.
 *
 * ================== A DECISAO, E POR QUE ELA E A MESMA DO PROVADOR ==================
 *
 * A lista desta aba e um JOIN sobre `lib/categorias`, e NAO uma constante. E a
 * mesma decisao ja VALIDADA no modulo Provador (201/201) e em Tamanhos (73/73):
 * quando o print mostra uma lista e o catalogo mostra outra, a lista e DERIVADA do
 * dono e a bancada DECLARA os itens ausentes pelo nome — aqui, `Streetwear` e
 * `Croppeds`.
 *
 * O que isso custa, e fica registrado: a aba mostra OITO, e o print mostra SEIS.
 * As duas linhas a mais sao visiveis contra o material, aceitas de proposito. A
 * alternativa — transcrever os seis — produziria uma tela que fica certa so
 * enquanto ninguem mexer em Categorias.
 *
 * UMA DIFERENCA VISIVEL QUE **E** DO PRINT: a miniatura da linha e CONDICIONAL. Em
 * adm-054, `Conjuntos` tem foto e `Shorts`, `Atacado` e `Leggings` nao tem — a linha
 * sem imagem comeca direto no nome. Por isso `SiteCategory` carrega `imageUrl` e o
 * componente nao desenha caixa nenhuma quando ele e `null`.
 *
 * (A versao anterior desta nota dizia o oposto — que a aba "nao mostra imagem
 * nenhuma" — e atribuia isso a `adm-055`, que e `Secoes da Home`. Ver o cabecalho de
 * `SiteCategory` em `types.ts` para o registro do erro.)
 *
 * O `toSiteCategories()` esta em `metrics.ts`, onde o join acontece.
 */

/**
 * ================== UM BUG DE DOCUMENTACAO DESTE PROPRIO ARQUIVO ==================
 *
 * O cabecalho de `demo.ts` prometia uma linha por tela:
 *
 *     Categorias (adm-055)   6 categorias, com slug, ordem e status
 *
 * Isso descrevia o `DEMO_SITE_CATEGORY_IDS` que existia aqui e foi removido — a
 * constante com seis ids. Com ela fora, a promessa ficou orfa: nenhuma categoria e
 * transcrita neste arquivo, porque a lista e derivada de `lib/categorias`.
 *
 * A linha do cabecalho foi corrigida junto com a remocao, em vez de o cabecalho
 * ficar dizendo uma coisa que o arquivo nao faz mais. Documentacao que envelhece em
 * silencio e pior que documentacao nenhuma: quem chega depois procura a constante
 * porque o comentario garante que ela existe.
 */

/* ============================ Secoes da Home ============================ */

/**
 * AS DUAS SECOES — adm-055.
 *
 * ================== A LINHA 1 TEM UMA INCONSISTENCIA INTERNA ==================
 *
 * Lida no pixel, a linha 1 diz `As mais amadas (best_sellers)` no titulo e
 * `fonte: featured · 8 itens · ordem 1 · ativo` na linha de baixo. O tipo
 * (`best_sellers`) e a fonte (`featured`) sao valores DIFERENTES.
 *
 * A linha 2 diz `Recém-chegadas (latest)` e `fonte: latest` — os dois casam. Ou
 * seja: a inconsistencia existe em UMA das duas linhas, e nao ha terceira linha
 * para decidir qual das duas formas e a regra.
 *
 * AS DUAS FORMAS FORAM TRANSCRITAS COMO ESTAO. Ver o cabecalho de `HomeSection` em
 * `types.ts`: trocar `featured` por `best_sellers` (ou o contrario) para a linha
 * "fazer sentido" apagaria a evidencia do material, e o projeto ja decidiu, no
 * modulo Tamanhos, que transcrever a divergencia e mais barato que arbitrar.
 *
 * O `RECÉM-CHEGADAS` USA ACENTO AGUDO — conferido no pixel, e `Recém`, com acento
 * agudo no primeiro `e`, e nao `Récém` nem `Recem`.
 */
export const DEMO_HOME_SECTIONS: HomeSection[] = [
  {
    id: 'sec-01',
    title: 'As mais amadas',
    kind: 'best_sellers',
    source: 'featured',
    itemCount: 8,
    sortOrder: 1,
    isActive: true,
  },
  {
    id: 'sec-02',
    title: 'Recém-chegadas',
    kind: 'latest',
    source: 'latest',
    itemCount: 8,
    sortOrder: 2,
    isActive: true,
  },
];

/**
 * OS SEIS TIPOS do seletor `Tipo`.
 *
 * O print mostra os dois que estao em uso (`(best_sellers)` e `(latest)`) e o modal
 * `Nova seção` nao aparece em captura nenhuma. Os outros quatro sao os nomes que o
 * resto do projeto ja usa para "secao da home" (`featured`, `category`, `promo`,
 * `custom`) — declarados em `types.ts` como uniao fechada para que um valor fora da
 * lista seja recusado, e nao impresso cru na tela.
 */
export const SECTION_KIND_OPTIONS = [
  { value: 'best_sellers', label: 'best_sellers' },
  { value: 'latest', label: 'latest' },
  { value: 'featured', label: 'featured' },
  { value: 'category', label: 'category' },
  { value: 'promo', label: 'promo' },
  { value: 'custom', label: 'custom' },
] as const;

/* ========================== Banners Promocionais ========================== */

/**
 * VAZIO — e o print mostra exatamente isso.
 *
 * adm-056 e uma tela com o titulo `Banners Promocionais`, o botao `+ Novo banner` e
 * uma unica linha de texto: `Nenhum banner promocional.` Nao ha linha, nao ha card,
 * nao ha imagem. A lista de exemplo seria invencao pura.
 */
export const DEMO_PROMO_BANNERS: never[] = [];

/* ================================ Beneficios ================================ */

/**
 * OS CINCO BENEFICIOS — adm-057.
 *
 * ================== O `iconName` E UM DEFEITO DA REFERENCIA, REPRODUZIDO ==================
 *
 * A coluna da esquerda mostra O NOME CRU DE UM ICONE, como texto:
 * `Truck`, `CreditCard`, `ShieldCheck`, `RefreshCw`, `MessageCircle`. Sao cinco
 * nomes exatos de icones do lucide-react — o original tinha um mapa
 * `{ Truck, CreditCard, ... }` e o que chegou a tela foi a CHAVE do mapa, nao o
 * componente.
 *
 * POR QUE ISSO NAO FOI "CORRIGIDO": o projeto tem uma regra que ja vale nas outras
 * telas — o print e a fonte de verdade, e um defeito do material nao e uma licenca
 * para melhorar. Se eu desenhasse o caminhao, a tela ficaria mais bonita que o
 * print e deixaria de ser a tela dele. O texto vai impresso como esta, e o
 * componente `benefit-row.tsx` ESCOLHE o icone a partir do nome, num lugar so, para
 * que a correcao (o dia em que alguem decidir que a tela deve desenhar o icone)
 * seja uma troca local.
 *
 * O segundo item tem uma leitura de pixel que muda o dado: o original escreveria
 * `Pague em até 6x`, e o que o print mostra e `Pague em até 6x` com `s/ juros` na
 * linha de baixo — conferido, e `sem juros`, em minusculas, na segunda linha.
 */
export const DEMO_BENEFITS: Benefit[] = [
  {
    id: 'ben-01',
    iconName: 'Truck',
    title: 'Frete grátis',
    description: 'acima de R$299',
    sortOrder: 1,
    isActive: true,
  },
  {
    id: 'ben-02',
    iconName: 'CreditCard',
    title: 'Pague em até 6x',
    description: 'sem juros',
    sortOrder: 2,
    isActive: true,
  },
  {
    id: 'ben-03',
    iconName: 'ShieldCheck',
    title: 'Compra segura',
    description: 'dados protegidos',
    sortOrder: 3,
    isActive: true,
  },
  {
    id: 'ben-04',
    iconName: 'RefreshCw',
    title: 'Primeira troca grátis',
    description: 'em até 7 dias',
    sortOrder: 4,
    isActive: true,
  },
  {
    id: 'ben-05',
    iconName: 'MessageCircle',
    title: 'Atendimento',
    description: 'via WhatsApp',
    sortOrder: 5,
    isActive: true,
  },
];

/* ================================ Instagram ================================ */

/**
 * adm-058, aba `Instagram`. A URL digitada, o usuario derivado e o checkbox marcado.
 *
 * ================== `closetlunar` — UM N, E NAO DOIS ==================
 *
 * A URL tem **um** `n` depois de `closetlu`, e o `Usuário detectado:` logo abaixo
 * repete a mesma grafia: `@closetlunar`. As duas linhas da MESMA tela concordam.
 *
 * A versao anterior deste arquivo escrevia `closetlunnar` (dois `n`) — a grafia
 * canonica do projeto. Foi um "conserto" silencioso do material para casar com o
 * nome do projeto, que e exatamente o que a regra de fidelidade proibe. O teste
 * decisivo foi um recorte das duas telas no MESMO aumento:
 *
 *   adm-058 `Usuário detectado:`  ->  `@closetlunar`    (um n)
 *   adm-059 rodape                ->  `@closetlunnar`   (dois n)
 *
 * ================== AS DUAS TELAS DIVERGEM, E FICA REGISTRADO ==================
 *
 * Nao e erro de leitura: `Instagram` (adm-058) e `Rodape` (adm-059) escrevem o mesmo
 * perfil de dois jeitos. Sao DOIS campos de DUAS telas, e cada um e transcrito como
 * esta — `DEMO_INSTAGRAM.url` com um `n`, `DEMO_SITE_FOOTER.instagram` com dois.
 *
 * Escolher uma das duas grafias para "alinhar o painel" apagaria a evidencia, e o
 * efeito pratico seria pior que a inconsistencia: a loja passaria a publicar um
 * perfil que pode nao existir. A divergencia vai para o relatorio final.
 */
export const DEMO_INSTAGRAM: InstagramConfig = {
  url: 'https://instagram.com/closetlunar',
  showOnHome: true,
};

/* ================================= Rodape ================================= */

/**
 * O RODAPE — adm-059.
 *
 * A TELA TEM QUATRO INPUTS, EM GRADE 2x2:
 *
 *   `5581998871397`      `@closetlunnar`     <- os dois preenchidos
 *   `E-mail`             `Endereço`          <- os dois so com placeholder
 *
 * O `5581...` e o WhatsApp sem formatacao, como o campo guarda. O `@closetlunnar`
 * tem **DOIS n**, ao contrario do `@closetlunar` (um n) da aba `Instagram`. Ver a
 * nota de `DEMO_INSTAGRAM`: as duas telas divergem, e as duas sao transcritas como
 * estao.
 *
 * `email` e `address` entram VAZIOS — e nao por omissao: o print mostra as duas
 * caixas sem conteudo, e `E-mail`/`Endereço` sao o placeholder delas, nao o valor.
 * (Uma nota anterior deste arquivo dizia que as duas caixas eram linhas de lista
 * vazia; o recorte ampliado mostrou quatro caixas iguais. Ver `types.ts`.)
 *
 * `5551988192266` e o outro telefone que aparece no material (no perfil da conta,
 * fora desta tela) — NAO e o valor deste campo.
 *
 * AS DUAS LISTAS ESTAO VAZIAS, e os `+ Adicionar` de `Politicas` e `Links` so
 * existem com lista vazia — nao ha print de politica nem de link cadastrado, nem do
 * formulario que os cria.
 */
export const DEMO_SITE_FOOTER: SiteFooter = {
  whatsapp: '5581998871397',
  instagram: '@closetlunnar',
  email: '',
  address: '',
  policies: [],
  links: [],
};

/* ============================ Personalizar Loja ============================ */

/**
 * OS TRES TEMAS — adm-060.
 *
 * As tres cores de cada paleta e as duas pontas do gradiente foram LIDAS NO PIXEL
 * do cartao, e nao escolhidas: a amostra da esquerda do tema claro e um branco
 * quase puro, a do meio e o preto do painel e a da direita e um nude; o tema
 * `Fashion` vai do branco ao magenta; o `Premium Black` mostra os dois circulos
 * INTERNOS (branco e dourado) porque o preenchimento do meio e escuro e sumiria
 * sobre a tarja escura — no print esse circulo aparece com um anel claro em volta.
 *
 * O `Elegant` e o ativo: e o unico com o selo `ATIVO` e o unico cujo botao diz
 * `Tema atual`; os outros dois dizem `Aplicar tema`.
 */
export const DEMO_STORE_THEMES: StoreTheme[] = [
  {
    id: 'theme-elegant',
    name: 'Elegant',
    description: 'Boutique clássico — neutros quentes e serifa refinada.',
    previewFrom: '#F4E9DA',
    previewTo: '#B08A5C',
    palette: ['#F7F3EC', '#14110E', '#C4A484'],
  },
  {
    id: 'theme-fashion',
    name: 'Fashion',
    description: 'Vibrante e moderno — rosa magenta e tipografia ousada.',
    previewFrom: '#FBD9EC',
    previewTo: '#EC2E8B',
    palette: ['#FFFFFF', '#14110E', '#E21C7E'],
  },
  {
    id: 'theme-premium',
    name: 'Premium Black',
    description: 'Luxo escuro — preto profundo com detalhes em dourado.',
    previewFrom: '#1A1A1A',
    previewTo: '#8A7320',
    palette: ['#F5F0E6', '#14110E', '#D4AF37'],
  },
];

/* ================================== Looks ================================== */

/**
 * VAZIO — adm-061 mostra a lista sem NENHUM look, e o proprio estado vazio esta
 * escrito no print: `Nenhum look cadastrado ainda.`
 *
 * A LISTA ESTA VAZIA MAS OS PRODUTOS DO MODAL NAO: o `PRODUTOS DO LOOK (0
 * SELECIONADOS)` de adm-062 lista NOVE produtos. Eles NAO sao transcritos aqui —
 * sao o catalogo de `lib/produtos`, pelo mesmo JOIN do modulo Provador. Ver
 * `metrics.ts`, bloco `O DONO DA LISTA DE PRODUTOS`.
 */
export const DEMO_LOOKS: Look[] = [];

/** O repouso do modal `Novo look`: nome/subtitulo/descricao vazios, ordem `0`, `Ativo` marcado. */
export const DEMO_LOOK_DEFAULTS = {
  sortOrder: 0,
  isActive: true,
} as const;

/* ============================== textos fixos ============================== */

/**
 * OS TEXTOS QUE A TELA REPETE e que o print escreve uma vez. Ficam aqui, e nao no
 * componente, para que a bancada possa conferi-los sem renderizar.
 */

/** O estado vazio de adm-056 — a unica linha daquela tela. */
export const PROMO_EMPTY_TEXT = 'Nenhum banner promocional.';

/** O estado vazio de adm-061. */
export const LOOKS_EMPTY_TEXT = 'Nenhum look cadastrado ainda.';

/** O prefixo do campo `(N SELECIONADOS)` de adm-062. */
export const LOOK_PIECES_LABEL = 'Produtos do look';

/** Os rotulos dos botoes de lista das tres telas que os tem. */
export const DASH = '—';

/**
 * AS SETE ABAS DE `Conteudo do Site`, na ordem do print — com o numero do print.
 *
 * ================== POR QUE ISTO E DADO, E NAO UM ARRAY NO COMPONENTE ==================
 *
 * O mapeamento aba -> print foi a coisa que este modulo errou, e errou em CINCO das
 * sete linhas de uma vez (cada aba estava com o numero da seguinte). Nao apareceu
 * porque um numero de print nao aponta para arquivo nenhum: nada quebra, nada acusa.
 *
 * Enquanto o mapa mora num `const` dentro do componente, ele so pode ser conferido
 * lendo o componente. Aqui ele e dado, e a BANCADA o confere contra a evidencia: cada
 * `adm` foi lido na PILULA ACESA da faixa de abas da captura correspondente — a unica
 * identificacao confiavel de tela (ver `feedback_numero_adm_nao_identifica_tela`).
 *
 * `value` e o id interno da aba; `label` e o texto do print; `adm` e a prova.
 */
export const CONTEUDO_TABS = [
  { value: 'hero', label: 'Hero Banner', adm: 'adm-053', print: '235737' },
  { value: 'categorias', label: 'Categorias', adm: 'adm-054', print: '235745' },
  { value: 'secoes', label: 'Seções da Home', adm: 'adm-055', print: '235750' },
  { value: 'promo', label: 'Banners Promocionais', adm: 'adm-056', print: '235757' },
  { value: 'beneficios', label: 'Benefícios', adm: 'adm-057', print: '235804' },
  { value: 'instagram', label: 'Instagram', adm: 'adm-058', print: '235810' },
  { value: 'rodape', label: 'Rodapé', adm: 'adm-059', print: '235816' },
] as const;

/**
 * O BOTAO DE CABECALHO DE CADA ABA — lido na captura, um a um.
 *
 * Sao QUATRO botoes de criacao (um por aba de lista) e DUAS abas de formulario, que
 * terminam em `Salvar` em vez de `+ Novo`. A tabela existe pelo mesmo motivo da de
 * abas: um rotulo de botao inventado nao quebra nada e nao aparece em revisao.
 *
 *   Hero Banner           `+ Novo slide`
 *   Categorias            `+ Nova categoria`
 *   Secoes da Home        `+ Nova seção`
 *   Banners Promocionais  `+ Novo banner`
 *   Beneficios            `+ Novo`
 *   Instagram             `Salvar`          (formulario)
 *   Rodape                `Salvar`          (formulario)
 */
export const CONTEUDO_ACTIONS: Record<string, string> = {
  hero: 'Novo slide',
  categorias: 'Nova categoria',
  secoes: 'Nova seção',
  promo: 'Novo banner',
  beneficios: 'Novo',
  instagram: 'Salvar',
  rodape: 'Salvar',
};
