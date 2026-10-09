/**
 * Dados demonstrativos do cluster Provador e IA.
 *
 * ================== A REGRA DE OURO DESTE DIRETORIO ==================
 *
 * **NENHUMA LISTA DE PRODUTOS E TRANSCRITA AQUI.** O seletor de produto das tres
 * telas e um JOIN sobre `lib/produtos`, que e o dono da lista.
 *
 * Isso NAO e preferencia de arquitetura: e uma decisao JA VALIDADA na Fase 4
 * (Tamanhos), e ela existe porque um print contradiz os outros. O print do
 * seletor desta tela lista `Conjunto Glow Nude`, que NAO existe em
 * `lib/produtos` — o mesmo produto fantasma de adm-034. O JOIN esta em
 * `metrics.ts`, com a nota completa e o que ele implica para a contagem.
 */

import type { AiSettings, AvatarSettings, AvatarSlotKey, PieceDefaults, PiecePosition, PiecePositionOption, PieceView, ProvadorUsage } from './types';

/* ================================ Avatar ================================ */

/**
 * AS CINCO IMAGENS, COM `url: null`.
 *
 * O print de adm-038/039 mostra as cinco preenchidas, apontando para
 * `https://eqodkhsejnhqgynquvkl.supabase.co/storage/v1/object/public/site-content/avatar/...`.
 *
 * Esse bucket NAO e deste projeto: e o storage do painel ORIGINAL (Lovable), de
 * outra conta. Copiar a URL para o codigo daria uma tela que parece pronta e
 * quebra assim que aquela conta mudar — e o projeto nao tem storage nosso ainda
 * (o storage de producao esta FORA do escopo desta fase, por instrucao).
 *
 * `null` e o estado honesto: `AVATAR FRENTE` com o quadrado vazio, e a tela
 * pronta para receber a URL quando o storage existir. O que NAO se faz e gravar
 * a URL de terceiro como se fosse nossa.
 *
 * A ORDEM e a do print: frente, lado DIREITO, costas, lado ESQUERDO, 360. Nao e
 * alfabetica nem "frente/lado/costas": e a ordem de cadastro do painel, e o
 * print a mostra assim (`AVATAR COSTAS` vem ANTES de `AVATAR LADO ESQUERDO`).
 */
export const DEMO_AVATAR: AvatarSettings = {
  slots: [
    { key: 'frente', label: 'Avatar Frente', url: null },
    { key: 'direita', label: 'Avatar Lado Direito', url: null },
    { key: 'costas', label: 'Avatar Costas', url: null },
    { key: 'esquerda', label: 'Avatar Lado Esquerdo', url: null },
    { key: 'g360', label: 'Avatar 360°', url: null },
  ],
  /**
   * AS TRES MEDIDAS DO PAINEL PRETO — os unicos numeros do modulo, e eles estao
   * escritos no PRINT (adm-038 e adm-039): `BUSTO 88 cm`, `CINTURA 68 cm`,
   * `QUADRIL 94 cm`.
   *
   * Elas sao transcritas porque sao dado do material e nao existe outra fonte: o
   * avatar e um manequim de configuracao, e nao uma cliente. O que o material NAO
   * mostra e onde elas se editam — nao ha print de formulario de medida —, entao
   * a tela as EXIBE sobrepostas ao preview, como no print, e nao oferece edicao.
   */
  measures: [
    { key: 'busto', label: 'Busto', value: 88, unit: 'cm' },
    { key: 'cintura', label: 'Cintura', value: 68, unit: 'cm' },
    { key: 'quadril', label: 'Quadril', value: 94, unit: 'cm' },
  ],
};

/**
 * OS ROTULOS CURTOS DAS QUATRO VISTAS DO PREVIEW — os botoes do painel preto.
 *
 *   adm-039   `FRENTE` `DIREITA` `COSTAS` `ESQUERDA`
 *
 * ================== POR QUE ELES NAO SAEM DO ROTULO DO CADASTRO ==================
 *
 * O cadastro e o preview escrevem a MESMA vista de dois jeitos, e os dois jeitos
 * estao no material. Em adm-038/039, a lista de imagens diz `AVATAR LADO DIREITO`;
 * os botoes do painel dizem `DIREITA`. Derivar um do outro
 * (`.replace('Avatar ', '')`) produzia `LADO DIREITO` no botao — texto que nao
 * existe em print nenhum.
 *
 * Nao e inconsistencia do material: sao dois lugares com dois espacos. A lista tem
 * largura para a palavra `LADO`; o botao, dentro do painel, nao tem. Transcrever os
 * dois e o que mantem a tela fiel — deduzir um do outro era o defeito.
 */
export const VIEW_SHORT_LABELS: Record<AvatarSlotKey, string> = {
  frente: 'FRENTE',
  direita: 'DIREITA',
  costas: 'COSTAS',
  esquerda: 'ESQUERDA',
  g360: '360°',
};

/* ============================== Provador ============================== */
/**
 * AS QUATRO OPCOES DO `POSIÇÃO`, na ordem do dropdown aberto de adm-046.
 *
 * `Automática` e o valor de repouso — o print de adm-042/043/046 mostra ela
 * selecionada, e o mesmo dropdown a marca como atual.
 */
export const DEMO_POSITION_OPTIONS: PiecePositionOption[] = [
  { value: 'automatica', label: 'Automática' },
  { value: 'superior', label: 'Superior' },
  { value: 'inferior', label: 'Inferior' },
  { value: 'corpo-inteiro', label: 'Corpo inteiro' },
];

/** O rotulo de cada posicao — para a tabela e para o `aria-label` do select. */
export const POSITION_LABELS: Record<PiecePosition, string> = {
  automatica: 'Automática',
  superior: 'Superior',
  inferior: 'Inferior',
  'corpo-inteiro': 'Corpo inteiro',
};

/** As vistas sem imagem. O mesmo `Record` vazio para toda config nova. */
export const EMPTY_VIEWS: Record<PieceView, string> = { frente: '', lado: '', costas: '' };

/**
 * O QUE O PRINT MOSTRA DA PECA SELECIONADA, campo a campo (adm-042 e adm-046):
 *
 *   CATEGORIA DA PEÇA   Top
 *   CAMADA (ORDEM)      3
 *   POSIÇÃO             Automática
 *   FRENTE / LADO / COSTAS   as tres pendentes
 *
 * Estes tres valores sao transcritos porque sao o ESTADO DE UM FORMULARIO na
 * tela, e nao uma lista de catalogo: nao ha outra fonte para eles, e um
 * formulario em branco nao reproduziria print nenhum.
 *
 * O PRODUTO E A CATEGORIA NAO VEM DAQUI, e agora o TIPO garante isso:
 * `PieceDefaults` e `Omit<PieceConfig, 'productId' | 'categoryId'>` (ver a nota
 * em `types.ts`). Os dois saem do produto escolhido — `product.id` e
 * `product.categoryId` —, e nao de um valor de repouso. Amarrar `cat-tops` aqui
 * fazia toda peca nascer como top; o `Omit` faz o compilador recusar a escrita.
 *
 * O `categoryId` que aparecia nesta constante era o do print (o produto base do
 * material era um top), e NAO um padrao — por isso ele nao pode morar num
 * "repouso". A `CAMADA (ORDEM) 3` e a `POSIÇÃO Automática` ficam: essas duas sao
 * estado de formulario do print, e nao dado do produto.
 */
export const DEMO_PIECE: PieceDefaults = {
  layer: 3,
  position: 'automatica',
  views: { ...EMPTY_VIEWS },
};

/* ============================= IA de Looks ============================= */

/**
 * A TABELA DE SUGESTOES MANUAIS ESTA VAZIA — e o print tambem.
 *
 * adm-047/048/049 mostram os quatro cabecalhos (`PRODUTO BASE`, `SUGERIDO`,
 * `PRIORIDADE`, `AÇÕES`) e NENHUMA linha, e — detalhe que importa — **sem
 * mensagem de vazio**. Nao ha `Nenhuma sugestão ainda.` no material; a tabela
 * simplesmente nao tem corpo. A tela reproduz isso: cabecalho e nada.
 */
export const DEMO_SUGGESTIONS: never[] = [];

/** A prioridade com que o formulario nasce — o `0` do campo de adm-047. */
export const DEMO_PRIORITY_MIN = 0;
export const DEMO_PRIORITY_MAX = 100;

/**
 * AS CONFIGURACOES DA IA — adm-050.
 *
 * As DUAS opcoes chegam MARCADAS no print, e o maximo e `8`. Transcritos: e o
 * estado de um formulario, e o print e a unica fonte.
 */
export const DEMO_AI_SETTINGS: AiSettings = {
  sameCollection: true,
  colorHarmony: true,
  maxSuggestions: 8,
};

/* ============================== Insights ============================== */

/**
 * ZERO EM TUDO — e o print.
 *
 * adm-044 e adm-045 estao inteiramente zeradas: a loja de demonstracao do
 * original nao tinha nenhum look salvo. Como nao ha numero nenhum para
 * transcrever, nao ha o que inventar: a tela desenha os cards em `0` e as listas
 * no estado vazio, que e o que o material mostra.
 */
export const DEMO_USAGE: ProvadorUsage = {
  looksCreated: 0,
  uniqueCombos: 0,
  cartAdds: 0,
  productsUsed: 0,
  clientsWhoSaved: 0,
  shares: 0,
};

/* ========================== textos do material ========================== */

/**
 * OS TEXTOS QUE SE REPETEM ENTRE MAIS DE UMA TELA ficam aqui, e nao no
 * componente — porque sao o MESMO texto lido de dois prints, e duas copias
 * divergem.
 *
 *   ADM-042 e ADM-043   a secao `Provador Virtual — Imagens das peças`, com a
 *                       descricao de PNG. E literalmente a mesma secao: em
 *                       Avatar Virtual ela e a aba `VINCULAR PRODUTOS`, e em
 *                       Provador Virtual ela e a aba `IMAGENS DAS PEÇAS`. Ver
 *                       `piece-config.tsx`.
 */
export const PIECE_SECTION_TITLE = 'Provador Virtual — Imagens das peças';
export const PIECE_SECTION_DESCRIPTION =
  'Cadastre imagens (PNG transparente recomendado) que serão sobrepostas ao avatar nas vistas frente, lado e costas.';
export const PIECE_TIP =
  'Dica: use PNG com fundo transparente, alinhado ao corpo do avatar (mesmas proporções). Peças sem imagem não quebram o avatar — simplesmente não aparecem.';

/**
 * A MENSAGEM DE "PENDENTE" DE CADA VISTA — `IMAGEM DO PROVADOR PENDENTE`,
 * dentro do quadro de cada coluna. E ela que ocupa o lugar da imagem.
 */
export const PIECE_PENDING_LABEL = 'Imagem do provador pendente';

/**
 * O ROTULO DO PRODUTO NO SELETOR — a segunda linha de cada item da lista.
 *
 * `Imagem do provador pendente` aparece em OITO dos nove produtos. O nono,
 * `Jaqueta Corta Vento Fit`, NAO tem status nenhum — e isso e do print (adm-041,
 * adm-042, adm-043, adm-046), conferido no pixel. Nao e omissao: e um estado
 * diferente (a peca existe, mas a pendencia nao foi marcada), e o componente o
 * desenha como ausencia de linha.
 *
 * O QUE NAO SE FAZ: inventar o status para os nove ficarem iguais. O material
 * mostra oito com e um sem.
 */
/**
 * O CORRECAO DE UMA LEITURA ERRADA MINHA, REGISTRADA.
 *
 * Eu havia escrito, num rascunho anterior deste arquivo, que `Jaqueta Corta Vento
 * Fit` era a EXCECAO: que ela nao teria linha de status nenhuma nos prints, e que
 * isso significaria que ela ja tinha imagem de provador. A bancada chegaria a
 * conferir a "excecao" pelo id.
 *
 * **ERADO.** Lido no pixel em `235547.png` (adm-041), `235557.png` (adm-043) e
 * `235613.png`, os NOVE produtos mostram `Imagem do provador pendente`, incluindo
 * `Jaqueta Corta Vento Fit`. Nao ha excecao nenhuma, e nao ha nada a marcar por
 * id. A regra certa e a mais simples: a lista esta INTEIRAMENTE pendente, porque
 * nenhuma das nove pecas tem imagem de provador — que e exatamente o que o
 * trabalho desta tela e resolver.
 *
 * O texto fica em vez de ser apagado em silencio porque o rascunho errado quase
 * virou codigo: um `DEMO_IMAGED_PIECE_IDS = ['p-07']` chegou a ser escrito, e
 * desfaze-lo sozinho teria escondido que a leitura foi feita de memoria em vez
 * de no arquivo. A licao e a que ja esta em `feedback_letras_folha_contato`:
 * rotulo e anotacao nao sao fonte — o print e.
 */
export const PIECE_PENDING_STATUS = 'Imagem do provador pendente';
