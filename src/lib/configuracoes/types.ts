/**
 * Tipos de Configurações (`/admin/configuracoes`) — adm-075 a adm-083.
 *
 * ================== QUATRO ABAS, E O QUE CADA UMA É ==================
 *
 *   ENTREGA PRÓPRIA             a lista de cidades/bairros com valor, prazo e status
 *   MELHOR ENVIO                as credenciais e o remetente do Melhor Envio
 *   INTEGRAÇÃO TRANSPORTADORAS  o seletor de transportadora + o mesmo formulário
 *   PAGAMENTOS                  as credenciais da InfinitePay
 *
 * ================== O QUE O PRINT NÃO TEM ==================
 *
 * O bloco `Disparo` do placeholder não existe aqui — não havia nenhum. O que o
 * placeholder tinha era a faixa de prints ERRADA (`adm-075 a adm-078`) e uma
 * descrição que só citava três das quatro abas. A faixa correta é `adm-075 a
 * adm-083`, e as quatro abas estão listadas acima.
 *
 * ================== NÃO INVENTADO ==================
 *
 * Não há quinta aba, não há "Configurações Gerais", não há loja/moeda/tema. O
 * original tem exatamente estas quatro.
 */

/** Os valores das quatro pílulas, na ordem do print. */
export type ConfigTab = 'entrega_propria' | 'melhor_envio' | 'integracao' | 'pagamentos';

/** O nome do arquivo é `LocalZone` no original — mantido para bater com o banco. */
export interface DeliveryZone {
  id: string;
  /** UF. No banco é duas letras maiúsculas; aqui já chega normalizado. */
  state: string;
  city: string;
  /** Vazio/vazio é o registro de "atende a cidade toda" — o print escreve `toda a cidade`. */
  neighborhood: string;
  price: number;
  /** O texto do prazo como a loja escreve: `Mesmo dia / 24h`. */
  etaLabel: string;
  daysMin: number;
  daysMax: number;
  isActive: boolean;
}

/** Uma cidade agrupada, com os bairros dela — o bloco recolhível do print. */
export interface DeliveryCityGroup {
  state: string;
  city: string;
  zones: DeliveryZone[];
}

/**
 * O rascunho do formulário de bairro.
 *
 * ================== POR QUE ISTO É UM TIPO DE DOMÍNIO, E NÃO DO FORMULÁRIO ==================
 *
 * `metrics.ts` precisa montar `DeliveryZone` a partir disto (`zoneFromDraft`), e
 * `metrics` é PURO: não pode importar de um `.tsx` de componente. Então o tipo mora
 * aqui, no domínio, e tanto o formulário quanto a conversão o usam.
 *
 * O `price` é STRING porque é o que o usuário digita e o que o campo mostra —
 * `"25,00"`, com vírgula. A conversão para número é do `parsePrice`.
 * `id` nulo significa criação; um id existente significa edição.
 */
export interface ZoneDraft {
  id: string | null;
  state: string;
  city: string;
  neighborhood: string;
  price: string;
  etaLabel: string;
  isActive: boolean;
}

/**
 * Os campos do formulário do Melhor Envio — os SETE que o print mostra, um por um.
 *
 * ================== O QUE O PRINT TEM, E O QUE ELE NÃO TEM ==================
 *
 * adm-143/144 (aba `MELHOR ENVIO`) mostra, em duas colunas: `CLIENT ID` ·
 * `CLIENT SECRET`, `CEP DE ORIGEM` · `NOME DO REMETENTE`, `DOCUMENTO (CPF/CNPJ)` ·
 * `TELEFONE`, e `ENDEREÇO DE ORIGEM` ocupando a linha inteira. No topo do cartão,
 * os dois checkboxes `Sandbox` e `Ativo`.
 *
 * NÃO há peso, altura, largura, comprimento, seguro, AR ou mão própria. Uma versão
 * anterior deste arquivo tinha esses campos — eram do `MelhorEnvioAdmin` do
 * original, mas NENHUM deles aparece em captura alguma, então saíram. Ficam só os
 * sete que o print prova.
 */
export interface MelhorEnvioConfig {
  /** O OAuth token vai no banco, nunca no print — aqui fica vazio. */
  token: string;
  /** `Sandbox` — checkbox do topo do cartão. */
  sandbox: boolean;
  /** `Ativo` — o segundo checkbox do topo, separado do `Sandbox`. */
  active: boolean;
  clientId: string;
  clientSecret: string;
  originCep: string;
  senderName: string;
  /** `DOCUMENTO (CPF/CNPJ)` — o rótulo do print cobre os dois. */
  document: string;
  phone: string;
  /** `ENDEREÇO DE ORIGEM` — linha inteira. */
  originAddress: string;
}

/**
 * O estado da conexão OAuth, como o cartão verde do print mostra.
 *
 * A única linha do cartão é
 * `Melhor Envio conectado · NOME · E-MAIL - desde DATA`, com o link `Desconectar`
 * embaixo. O projeto guarda o nome, o e-mail e a data; o ponto verde da frente é
 * decoração do estado `ok`.
 */
export interface ConnectionInfo {
  status: ConnectionStatus;
  accountName: string;
  accountEmail: string;
  connectedAt: string;
}

/**
 * As transportadoras do seletor — com os rótulos EXATOS do print, incluindo o
 * `(EM BREVE)` das cinco indisponíveis. Hoje só o Melhor Envio está `available`.
 */
export type ShippingProvider =
  | 'melhor_envio'
  | 'correios'
  | 'jadlog'
  | 'azul_cargo'
  | 'loggi'
  | 'total_express';

/**
 * O estado da conexão OAuth do Melhor Envio.
 *
 * O print mostra o cartão verde `Melhor Envio conectado` com o nome, o e-mail e a
 * data. Quando não há conexão, o cartão vira `Melhor Envio não conectado` e o
 * botão `Conectar`. Três estados, como no original: `ok`, `off` e `error`.
 */
export type ConnectionStatus = 'ok' | 'off' | 'error';

export interface PaymentConfig {
  apiKey: string;
  clientId: string;
  clientSecret: string;
  webhookSecret: string;
  sandbox: boolean;
  isActive: boolean;
}
