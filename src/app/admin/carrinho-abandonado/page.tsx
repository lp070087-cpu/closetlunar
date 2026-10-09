import type { Metadata } from 'next';
import { CartView } from '@/components/admin/carrinho-abandonado/cart-view';

export const metadata: Metadata = { title: 'Carrinho Abandonado' };

/**
 * Carrinho Abandonado — reconstruido de adm-008 e adm-009.
 *
 * UMA TELA, DUAS ROLAGENS. O material apresenta a pagina em dois prints porque
 * ela nao cabe numa captura so:
 *
 *   adm-008   os quatro KPIs e a tabela `Historico de Carrinhos`, de cinco
 *             colunas: CLIENTE / EMAIL · VALOR · NOTIFICACOES · ULTIMO ENVIO ·
 *             STATUS
 *
 *   adm-009   a continuacao, ja rolada: o painel `Configuracoes` inteiro — os
 *             quatro disparos (1, 6, 24 e 48 horas) com os textos ja escritos, o
 *             campo `CUPOM AUTOMATICO`, o `Incentivo de Frete Gratis` e o botao
 *             `SALVAR CONFIGURACOES`
 *
 * A REFERENCIA DO PLACEHOLDER ANTERIOR ESTAVA ERRADA.
 *
 * Ele anunciava `references="adm-014 a adm-018"`. O mapa do painel
 * (`MAPA-ADMIN.md`) atribui **adm-008 e adm-009** — e aquela faixa pertence aos
 * modulos de Cupons e Fidelidade. Era o mesmo defeito do CRM e das fases
 * anteriores: uma faixa larga cobrindo os prints dos vizinhos.
 *
 * O QUE O PLACEHOLDER ACERTOU: os tres blocos (Indicadores, Historico,
 * Configuracoes). Os tres vieram do print e os tres existem.
 *
 * UMA DIVERGENCIA REGISTRADA, NAO RESOLVIDA
 *
 * O texto do placeholder diz "receita perdida" no bloco Indicadores, e o print
 * NAO tem esse cartao. Os quatro do adm-008 sao Total Abandonados, Recuperados,
 * Perdidos e Valor Recuperado. `Perdidos` e uma QUANTIDADE (0), e nao dinheiro —
 * nao ha nenhum indicador de valor perdido em print nenhum. O cartao nao foi
 * criado: desenha-lo seria inventar um quinto KPI que a referencia nao tem, e o
 * numero dele nao existiria em fonte alguma (o carrinho abandonado nao guarda
 * "quanto teria sido").
 *
 * ESTA TELA NAO TEM BOTAO DE RECUPERAR nem de marcar como perdido. Nenhum print
 * mostra acao na tabela — nao ha coluna ACOES em adm-008 — e o `status` de um
 * carrinho e escrito pelo checkout e pelo disparo automatico, nao a mao. A unica
 * escrita que a referencia sustenta e `SALVAR CONFIGURACOES`, e so ela existe.
 *
 * O CRM LE A LISTA DESTE MODULO.
 *
 * Os tres carrinhos moravam em `lib/crm/demo.ts` porque o CRM foi o primeiro a
 * precisar deles (a aba `Leads` de adm-010 mostra um lead de carrinho, e o card
 * de adm-011 conta os carrinhos). Com esta tela, a lista mudou para
 * `lib/carrinho-abandonado`, que e o dono natural, e `lib/crm/demo.ts` passou a
 * re-exporta-la. Nao ha duas listas — o dia em que um carrinho for recuperado
 * aqui, o CRM ve o mesmo estado.
 *
 * A tela e um componente cliente porque tem estado de formulario. A pagina fica
 * como Server Component para poder, mais adiante, resolver a sessao e buscar a
 * primeira pagina no servidor.
 */
export default function CarrinhoAbandonadoPage() {
  return <CartView />;
}
