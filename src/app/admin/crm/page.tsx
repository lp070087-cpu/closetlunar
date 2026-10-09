import type { Metadata } from 'next';
import { CrmView } from '@/components/admin/crm/crm-view';

export const metadata: Metadata = { title: 'CRM' };

/**
 * CRM — reconstruido de adm-005, adm-010 e adm-011.
 *
 * UMA TELA, TRES ABAS, que e como o material a apresenta:
 *
 *   adm-005   aba `Clientes`    tabela de seis colunas
 *             CLIENTE (nome + e-mail) · LOCALIZACAO · PEDIDOS ·
 *             TOTAL INVESTIDO · ULTIMA COMPRA · ACOES (`Ver Perfil ›`)
 *
 *   adm-010   aba `Leads`       tabela de cinco colunas
 *             NOME / IDENTIFICACAO · CONTATO (e-mail + WhatsApp) ·
 *             ORIGEM (pilula `CARRINHO_ABANDONADO`) · DATA · ACOES (e-mail, WhatsApp)
 *
 *   adm-011   aba `Segmentos`   oito cards com icone colorido a esquerda e o
 *             numero a direita: Novas Clientes 0 · Recorrentes 1 · VIP 1 ·
 *             Inativas 1 · Carrinho Abandonado 3 · Interesse (Wishlist) 0 ·
 *             Usaram Provador 0 · Recife / Olinda / Jabatao 1
 *
 * A REFERENCIA DO PLACEHOLDER ANTERIOR ESTAVA ERRADA.
 *
 * Ele anunciava `references="adm-009 a adm-011"`. O mapa do painel
 * (`MAPA-ADMIN.md`) atribui ao CRM **adm-005, adm-010 e adm-011** — e adm-009 e
 * do CARRINHO ABANDONADO, um modulo diferente. Era o mesmo defeito das fases
 * anteriores: uma faixa larga cobrindo dois modulos, com o print do vizinho
 * entrando pela borda.
 *
 * O QUE O PLACEHOLDER ACERTOU
 *
 * As tres abas (`Clientes / Leads / Segmentos`), o campo de busca
 * ("Buscar por nome, e-mail ou telefone...") e as seis colunas da tabela de
 * clientes. Esses tres pontos vieram do print e estao reproduzidos.
 *
 * ELE TAMBEM PROMETIA O QUE NAO EXISTE
 *
 * Os blocos "Leads — Origem, data de captura e status de contato" e
 * "Segmentos — Agrupamentos por comportamento de compra para campanhas" foram
 * escritos SEM print. `status de contato` nao aparece em lugar nenhum: adm-010
 * tem ORIGEM e DATA, e nada de status. E `agrupamentos para campanhas` descreve
 * um Segmentos que o adm-011 nao e — os oito cards sao CONTAGENS, e nao
 * agrupamentos que se montam ou se salvam. Nenhum dos dois foi implementado:
 * desenhar um status de contato que nao existe seria criar uma coluna, e criar
 * agrupamento editavel seria inventar a tela inteira.
 *
 * DIVERGENCIAS REGISTRADAS, NAO RESOLVIDAS
 *
 *   1. `Rio de Janeiro - RJ` aparece em adm-005 e o dado NAO EXISTE. Os cinco
 *      pedidos de demonstracao (adm-003) nao transcreveram endereco, porque o
 *      print de Pedidos nao mostra endereco. O original le `city`/`state` da
 *      tabela `orders`, e e de la que o texto vem. A coluna LOCALIZACAO ficaria
 *      vazia — entao ela mostra a cidade quando houver, e o dado nao foi
 *      fabricado para preencher a celula. Registrado em `lib/crm/data.ts`.
 *
 *   2. `3` carrinhos no segmento e `1` lead na lista NAO sao contradicao: o
 *      original filtra diferente nos dois lugares (`todos` no segmento,
 *      `email IS NOT NULL` na lista). As duas regras foram reproduzidas.
 *
 *   3. `Ver Perfil` existe no print e o DESTINO nao tem print nenhum. A acao
 *      esta declarada e indisponivel — nenhuma tela de perfil foi desenhada,
 *      ainda que o codigo de referencia tenha uma.
 *
 * A tela e um componente cliente porque tem estado de aba e de busca. A pagina
 * fica como Server Component para poder, mais adiante, resolver a sessao e
 * buscar a primeira pagina no servidor.
 */
export default function CrmPage() {
  return <CrmView />;
}
