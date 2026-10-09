import type { Metadata } from 'next';
import { CuponsView } from '@/components/admin/cupons/cupons-view';

export const metadata: Metadata = { title: 'Cupons' };

/**
 * Cupons — reconstruida de adm-012 e adm-013.
 *
 * UMA TELA, DOIS ESTADOS. O material mostra a mesma pagina duas vezes:
 *
 *   adm-012   a lista: `1 cupom(s) cadastrados`, o botao `NOVO CUPOM` e a
 *             tabela de sete colunas (CODIGO, DESCONTO, MIN., USOS, VALIDADE,
 *             STATUS e as acoes Editar/Excluir)
 *
 *   adm-013   a mesma tela com o bloco `Novo cupom` ABERTO entre o contador e a
 *             tabela — INLINE, e nao em modal, com a tabela visivel por baixo
 *
 * A REFERENCIA DO PLACEHOLDER ANTERIOR ESTAVA ERRADA.
 *
 * Ele anunciava `references="adm-012 a adm-013"`. O mapa do painel
 * (`MAPA-ADMIN.md`) atribui **adm-007, adm-012, adm-013 e adm-014** a Cupons:
 *
 *   adm-007   a tela com `0 cupom(s) cadastrados` e a lista em `Carregando...`
 *   adm-012   a lista com um cupom
 *   adm-013   o formulario aberto
 *   adm-014   a tela de CAMPANHAS — e o card `Cupons mais usados` dela mostra
 *             `CLOSET10 · 0 usos`, que e dado DESTE modulo
 *
 * Ou seja: faltavam dois prints, e a faixa errada excluia justamente o print que
 * prova o estado de carregamento. Era o mesmo defeito do CRM e do Carrinho
 * Abandonado — uma faixa larga cobrindo so parte dos prints do modulo.
 *
 * O QUE O PLACEHOLDER ACERTOU: os tres blocos (Novo cupom, Contador, Lista).
 * Os tres vieram do print e os tres existem.
 *
 * ESTA TELA NAO E UM CRUD GENERICO DE CUPOM. Ela tem exatamente o que adm-012 e
 * adm-013 mostram: uma tabela e um formulario. Nao ha aba, nao ha filtro de
 * status, nao ha campo de busca, nao ha paginacao — nenhum print mostra nada
 * disso, e a lista do material tem UM cupom. O que a tela faz alem do print e
 * apenas o que o print EXIGE e nao mostra: os estados de carregamento (adm-007),
 * de lista vazia e de erro, e o aviso de que nada foi gravado.
 *
 * `adm-014` NAO VIRA TELA AQUI. O card `Cupons mais usados` pertence a
 * Campanhas; o que vem deste modulo e o DADO, e ele sai por
 * `topUsedCoupons` em `lib/cupons/metrics.ts`, que a tela de Campanhas vai
 * chamar quando entrar. Nenhuma tela de Campanhas foi criada nesta fase.
 *
 * A tela e um componente cliente porque tem estado de formulario. A pagina fica
 * como Server Component para poder, mais adiante, resolver a sessao e buscar a
 * primeira pagina no servidor.
 */
export default function CuponsPage() {
  return <CuponsView />;
}
