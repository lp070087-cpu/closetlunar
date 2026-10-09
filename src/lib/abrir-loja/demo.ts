/**
 * A demonstração de Abrir Loja — os nove itens com os resultados do print.
 *
 * ================== OS RESULTADOS SÃO OS DA CAPTURA ==================
 *
 * Os nove itens são fixos; o que muda por loja é o RESULTADO de cada um. A captura
 * adm-087/089 foi tirada com seis verdes e três vermelhos, e é essa a fotografia
 * que a demonstração guarda:
 *
 *   OK        Produtos (9 ativos) · Categorias (6) · Estoque (9 com estoque) ·
 *             Banner (3 ativos) · WhatsApp (5581998871397) · Frete (3 métodos)
 *   PENDENTE  Instagram (não configurado) · Política (0) · Pagamento (nenhum
 *             gateway ativo)
 *
 * ================== OS NÚMEROS VÊM DO MATERIAL DA LOJA ==================
 *
 * `9 produto(s) ativo(s)`, `6 categoria(s)`, `3 banner(s) ativo(s)` e `3 método(s)`
 * são os números que o print mostra. O WhatsApp é o mesmo que a loja já guarda em
 * `conteudo`, sem formatação — o print mostra ele cru, só os dígitos. Ver
 * `lib/conteudo/demo.ts` (`DEMO_SITE_FOOTER.whatsapp`).
 *
 * ================== O QUE FICA DE FORA ==================
 *
 * Não há Gateway, não há URL de Instagram: os dois itens pendentes aparecem com o
 * texto de "não configurado" que o original escreve, e a demonstração não inventa
 * um valor para deixá-los verdes. Deixar a loja "pronta para produção" na
 * demonstração seria mentir sobre o estado real dela.
 */

import type { ChecklistId, ChecklistItem, CheckOutcome } from './types';

/** As nove definições fixas — título e critério, na ordem do print. */
const DEFINICOES: { id: ChecklistId; title: string; description: string }[] = [
  {
    id: 'products',
    title: 'Produtos cadastrados',
    description: 'Pelo menos 1 produto ativo no catálogo.',
  },
  {
    id: 'categories',
    title: 'Categorias cadastradas',
    description: 'Pelo menos 1 categoria criada.',
  },
  {
    id: 'stock',
    title: 'Estoque válido',
    description: 'Pelo menos 1 produto ativo com estoque > 0.',
  },
  {
    id: 'banner',
    title: 'Banner ativo',
    description: 'Pelo menos 1 banner marcado como ativo.',
  },
  {
    id: 'instagram',
    title: 'Instagram configurado',
    description: 'URL ou usuário do Instagram salvo nas configurações.',
  },
  {
    id: 'whatsapp',
    title: 'WhatsApp configurado',
    description: 'Número de WhatsApp salvo nas configurações.',
  },
  {
    id: 'policy',
    title: 'Política cadastrada',
    description: 'Ao menos uma política no rodapé.',
  },
  {
    id: 'shipping',
    title: 'Frete configurado',
    description: 'Ao menos um método de frete em configurações.',
  },
  {
    id: 'payment',
    title: 'Pagamento configurado',
    description: 'Stripe, Paddle ou outro gateway ativo.',
  },
];

/** Os resultados da captura — seis verdes, três vermelhos. */
const RESULTADOS: Record<ChecklistId, CheckOutcome> = {
  products: { status: 'ok', detail: '9 produto(s) ativo(s)' },
  categories: { status: 'ok', detail: '6 categoria(s)' },
  stock: { status: 'ok', detail: '9 produto(s) com estoque' },
  banner: { status: 'ok', detail: '3 banner(s) ativo(s)' },
  instagram: { status: 'fail', detail: 'Não configurado' },
  whatsapp: { status: 'ok', detail: '5581998871397' },
  policy: { status: 'fail', detail: '0 política(s)' },
  shipping: { status: 'ok', detail: '3 método(s)' },
  payment: { status: 'fail', detail: 'Nenhum gateway ativo' },
};

/**
 * As nove definições, já com o estado de partida (`pending`).
 *
 * `pending` — e não já o resultado — porque é assim que o original começa: a tela
 * abre com tudo cinza, roda as verificações e vai pintando. Guardar os resultados
 * já no estado inicial faria a tela nascer "pronta" e nunca exercitar a passagem
 * por `checking`.
 */
export const DEMO_CHECKLIST: ChecklistItem[] = DEFINICOES.map((d) => ({ ...d, status: 'pending' }));

/** O resultado de cada item, como se viesse do banco. */
export const DEMO_OUTCOMES: Record<ChecklistId, CheckOutcome> = RESULTADOS;
