/**
 * Dados de demonstracao do CRM.
 *
 * AQUI NAO HA NENHUMA LINHA DE CLIENTE.
 *
 * A aba `Clientes` nao tem dado proprio: ela e DERIVADA dos pedidos, e os
 * pedidos de demonstracao moram em `lib/pedidos/demo.ts` — que e de Pedidos, nao
 * deste modulo. `data.ts` faz a agregacao. Escrever clientes aqui seria criar uma
 * segunda fonte para a mesma pessoa, e as duas divergiriam na primeira mudanca:
 * exatamente o defeito que a Fase 6 deixou registrado.
 *
 * OS NUMEROS DE adm-011 TAMBEM NAO ESTAO AQUI. Eles sao derivados em `metrics.ts`
 * a partir destes dados. Se ficassem como constante, a bancada conferiria a
 * constante contra ela mesma e passaria sempre — o teste artificial que nao vale
 * nada.
 *
 * O QUE ESTE ARQUIVO GUARDA, E POR QUE
 *
 *   1. os CARRINHOS ABANDONADOS — so RE-EXPORTADOS, porque a lista e de
 *      `lib/carrinho-abandonado` desde a Fase 8 (ver abaixo);
 *   2. os LEADS DE FORMULARIO — vazio, e explicado abaixo;
 *   3. WISHLIST e PROVADOR — zero, e explicado abaixo.
 *
 * A ASIMETRIA 3 x 1 (E O ACHADO DESTA FASE)
 *
 * O print adm-010 mostra UM lead; o print adm-011 mostra `CARRINHO ABANDONADO 3`.
 * Nao e contradicao: o ORIGINAL filtra diferente nos dois lugares.
 *
 *   segmento   `from("abandoned_carts").select("email, created_at")`
 *              -> TODOS os carrinhos
 *   leads      `from("abandoned_carts").select("*").not("email","is",null)`
 *              -> so os carrinhos QUE TEM E-MAIL
 *
 * Entao tres carrinhos com um e-mail so davam, ao mesmo tempo, `3` no segmento e
 * `1` na lista de leads. Reproduzimos a assimetria em vez de "consertar" um dos
 * dois lados: e ela que existe na referencia, e apagá-la faria os dois numeros
 * baterem por invencao. Ver `abandonedCartsWithEmail` em `types.ts`.
 *
 * UMA DIVERGENCIA REGISTRADA, NAO RESOLVIDA
 *
 * Duas linhas da tabela de Pedidos tem o MESMO telefone e a MESMA cidade vazia
 * que as do CRM aqui embaixo nao ajudam a separar: a agregacao do original usa
 * e-mail, depois TELEFONE, depois nome. Como os cinco pedidos de demonstracao
 * NAO TEM e-mail, quem separa as pessoas e o telefone. Ver a bancada, que prova
 * o caso em que dois nomes diferentes dividem o mesmo telefone.
 */

import { DEMO_ABANDONED_CARTS as DEMO_CARTS } from '@/lib/carrinho-abandonado/demo';
import type { AbandonedCartRecord, FormLeadRecord } from './metrics';

/**
 * Os tres carrinhos abandonados — AGORA MORAM EM OUTRO MODULO.
 *
 * Ate a Fase 7 eles estavam escritos aqui. Naquela altura o CRM era o unico
 * modulo que precisava deles, entao guarda-los aqui nao duplicava nada.
 *
 * COM A FASE 8 ISSO DEIXOU DE SER VERDADE: /admin/carrinho-abandonado e a tela
 * que EXISTE para esses carrinhos (adm-008 e adm-009), e o dono natural da lista
 * passou a ser `lib/carrinho-abandonado`. Este arquivo nao guarda mais as linhas
 * — ele as RE-EXPORTA, ja no formato que o CRM consome.
 *
 * POR QUE NAO DEIXAR AS DUAS. Se cada modulo tivesse a sua copia, o dia em que
 * um carrinho fosse marcado como recuperado numa tela ele continuaria pendente
 * na outra — duas telas discordando sobre o mesmo carrinho, sem nada acusando.
 * Uma lista, um dono.
 *
 * A CONVERSAO `AbandonedCart` -> `AbandonedCartRecord` FICA AQUI, num lugar so.
 * O CRM nao precisa saber que um carrinho tem valor, status e data de criacao:
 * para montar lead, o que importa e `id`, `email`, `whatsapp` e `createdAt`. A
 * fronteira entre os dois modulos e estreita de proposito — o CRM le o minimo, e
 * mudar a forma do carrinho nao vaza para dentro dele.
 *
 * A ASIMETRIA 3 x 1 CONTINUA VALENDO, e agora tem uma prova melhor: ela nasce do
 * DADO (`contactEmail` nulo em dois dos tres), e nao de uma lista escrita a mao
 * aqui. Ver `countIdentifiedCarts` em `lib/carrinho-abandonado/metrics.ts`.
 */
export const DEMO_ABANDONED_CARTS: AbandonedCartRecord[] = DEMO_CARTS.map((cart) => ({
  id: cart.id,
  email: cart.contactEmail,
  whatsapp: null,
  createdAt: cart.createdAt,
}));

/**
 * Os leads de formulario: NENHUM.
 *
 * O original tem uma tabela `leads` para quem se cadastrou sem comprar, e o CRM
 * a EXIBE junto com os carrinhos. Mas o material nao tem nenhum registro dela: o
 * print adm-010 mostra uma linha so, e essa linha e um carrinho abandonado.
 *
 * Entao a lista fica vazia em vez de preenchida com gente que ninguem cadastrou.
 * Consequencia: a aba Leads mostra exatamente o que o print mostra, e nao um
 * painel mais cheio do que a referencia. O tipo `LeadSource` mantem
 * `formulario` porque a origem existe na fonte — so nao tem dado.
 */
export const DEMO_FORM_LEADS: FormLeadRecord[] = [];

/**
 * Wishlist e Provador: zero, e NAO por falta de dado de demonstracao.
 *
 * O print adm-011 mostra `INTERESSE (WISHLIST) 0` e `USARAM PROVADOR 0`. Nao ha
 * o que inventar: o material diz zero.
 *
 * Estes dois numeros NAO sao de cliente. Wishlist conta ITENS de lista de
 * desejos e o provador conta EVENTOS de prova virtual — sinais que pertencem aos
 * modulos daqueles recursos. O CRM so os exibe, e por isso eles entram em
 * `buildSegments` como parametro, e nao como parte da agregacao de clientes.
 */
export const DEMO_WISHLIST_COUNT = 0;
export const DEMO_TRYON_EVENT_COUNT = 0;
