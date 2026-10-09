/**
 * Os tipos de Abrir Loja — reconstruídos de adm-087 a adm-089.
 *
 * O original (`src/components/admin/ProductionChecklist.tsx`) tem NOVE itens fixos,
 * cada um com um título, uma descrição e uma verificação própria no banco. Nada
 * além disso existe: não há botão de publicar, não há interruptor de loja aberta,
 * não há confirmação, e o título não é clicável.
 *
 * ================== O QUE O PLACEHOLDER PROMETIA E NÃO EXISTE ==================
 *
 * O placeholder listava três blocos. Ele acerta o Progresso e o Checklist, mas:
 *
 *   "Nove itens verificáveis, marcados MANUALMENTE conforme são concluídos" —
 *   ERRADO. Nenhum item é marcado à mão. Cada item é VERIFICADO NO BANCO: o
 *   original consulta `products`, `categories`, `banners`, `settings` e decide
 *   sozinho. O subtítulo do print diz isso com todas as letras — "Verificações
 *   reais no banco de dados. Cada item só fica verde quando o dado existe." Não
 *   há caixa de marcar em lugar nenhum.
 *
 *   "Confirmação: aviso ao atualizar o checklist, no formato do toast da
 *   referência" — o original mostra `toast.success('Checklist atualizado')`, e o
 *   print adm-089 flagra esse aviso no canto. O projeto NÃO tem biblioteca de
 *   toast; ver a decisão em `data.ts` sobre como o aviso aparece.
 */

/** As nove chaves, na ordem do print. */
export type ChecklistId =
  | 'products'
  | 'categories'
  | 'stock'
  | 'banner'
  | 'instagram'
  | 'whatsapp'
  | 'policy'
  | 'shipping'
  | 'payment';

/**
 * Os quatro estados. `pending` é o estado de partida (antes de qualquer
 * verificação), `checking` é a verificação em curso, e os dois finais são `ok` e
 * `fail`. O print só mostra os dois últimos porque a captura foi tirada depois da
 * verificação terminar.
 */
export type CheckStatus = 'pending' | 'checking' | 'ok' | 'fail';

/** Um item do checklist: a definição fixa mais o resultado da verificação. */
export interface ChecklistItem {
  id: ChecklistId;
  /** O título, fixo. */
  title: string;
  /** A descrição do critério, fixa. */
  description: string;
  /** O resultado da verificação, quando ela já rodou. */
  detail?: string;
  /** Em que pé está a verificação. */
  status: CheckStatus;
}

/**
 * O que a verificação devolveu, guardado só como TEXTO e como estado.
 *
 * FUTURO (Neon): cada item é uma contagem ou uma leitura de `settings`. Este é o
 * formato que a tela consome, seja qual for a consulta por trás.
 */
export interface CheckOutcome {
  status: CheckStatus;
  detail?: string;
}
