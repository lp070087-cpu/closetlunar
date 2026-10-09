import type { Metadata } from 'next';
import { LooksView } from '@/components/admin/conteudo/looks-view';
import { listLooks } from '@/lib/conteudo/data';
import { listProducts } from '@/lib/produtos/data';

export const metadata: Metadata = { title: 'Looks' };

/**
 * `/admin/looks` — reconstruida de adm-061 (a lista) e adm-062 (o modal).
 *
 * ================== DEFEITO DO PLACEHOLDER ANTERIOR: `references` INCOMPLETO ==================
 *
 * Esta rota era servida pelo `ModulePage` com `references="adm-061"` — que acerta a
 * lista e OMITE o modal. O `Neo look` (adm-062) e a segunda metade da tela, e sem
 * ele o `Novo look` ficaria sem referencia. O intervalo certo e `adm-061 / adm-062`.
 *
 * ================== AS DESCRICOES DOS BLOCOS TINHAM DOIS CAMPOS INVENTADOS ==================
 *
 *   "Lista de looks — Nome, peças vinculadas, status e compartilhamentos"  ->  NAO ha
 *       `compartilhamentos`. O material nao mostra, em nenhum lugar, um numero ou botao
 *       de compartilhar. Foi inventado — o mesmo tipo de inferencia que quase criou um
 *       `discountPercent` no tipo `LookPiece` (ver `types.ts`).
 *   "Publicação — Exibir o look na loja e gerar link compartilhável"       ->  NAO ha
 *       "gerar link" no material. `Exibir o look na loja` corresponde ao campo `Ativo`
 *       do modal (adm-062); o resto e inventado.
 *
 * O que o material PROVA: `Nome`, `Subtítulo`, `Descrição`, `URL da imagem de capa`,
 * `Ordem` + `Ativo`, e a seleção de pecas do catalogo. Nada alem disso.
 *
 * ================== A PAGINA CARREGA OS LOOKS *E* OS PRODUTOS ==================
 *
 * Os dez cartoes de adm-062 nao sao transcritos: sao o catalogo de `lib/produtos`, pelo
 * mesmo JOIN do modulo Provador. A lista de looks esta VAZIA (`DEMO_LOOKS`), mas a de
 * produtos nao — e o modal precisa dela para desenhar a grade e para somar o `Total`.
 * `listProducts` e a mesma funcao de `/admin/produtos`, com o mesmo filtro opcional.
 */
export default async function Looks_Page() {
  const [looks, products] = await Promise.all([listLooks(), listProducts()]);
  return <LooksView initial={looks.data} products={products.data} />;
}
