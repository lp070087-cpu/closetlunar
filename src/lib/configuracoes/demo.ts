/**
 * Dados de demonstração de Configurações — adm-075 a adm-083.
 *
 * ================== AS QUATRO CIDADES SÃO REAIS, E ESTÃO COMPLETAS ==================
 *
 * Os prints mostram a aba `ENTREGA PRÓPRIA` rolada em quatro blocos, e em cada um
 * o contador do cabeçalho diz quantos bairros existem: Jaboatão dos Guararapes
 * (11), Olinda (22), Paulista (12) e Recife (22). Aqui estão os 67 — os 11 de
 * Jaboatão vêm inteiros de adm-052, e os outros três de adm-101, adm-115, adm-123
 * e adm-130. Não é amostra: é a lista toda, com o valor de cada bairro como o
 * print mostra.
 *
 * A ordem é `state` e depois `city` — o mesmo `ORDER BY` do original. Como as
 * quatro são `PE`, o que decide é o nome da cidade, e é a ordem em que os blocos
 * aparecem nas capturas: Jaboatão dos Guararapes · Olinda · Paulista · Recife.
 *
 * Os valores não são todos iguais: Jaboatão cobra 25 em todos os bairros, e as
 * outras três têm tabela por bairro (Águas Compridas 7, Boa Viagem 20, Centro 19,
 * Janga 20...). O print mostra essa diferença e ela foi preservada — uniformizar
 * seria inventar.
 *
 * ================== POR QUE `neighborhood` NUNCA VEM VAZIO AQUI ==================
 *
 * O original permite um registro com `neighborhood` nulo, que significa "atende a
 * cidade toda" e a tabela escreve `toda a cidade` em itálico. Nas quatro cidades
 * do print TODOS os registros têm bairro, então nenhuma linha cai nesse caso — mas
 * a tela sabe desenhá-lo, porque é o único jeito de o botão `+ Adicionar cidade`
 * fazer sentido (a cidade inteira de uma vez).
 */

import type { ConnectionInfo, DeliveryZone, MelhorEnvioConfig, PaymentConfig } from './types';

let sequencia = 0;
function zona(
  state: string,
  city: string,
  neighborhood: string,
  price: number,
): DeliveryZone {
  sequencia += 1;
  return {
    id: `z${String(sequencia).padStart(3, '0')}`,
    state,
    city,
    neighborhood,
    price,
    etaLabel: 'Mesmo dia / 24h',
    daysMin: 0,
    daysMax: 1,
    isActive: true,
  };
}

export const DEMO_DELIVERY_ZONES: DeliveryZone[] = [
  // ---- Jaboatão dos Guararapes / PE — 11 bairros (adm-052) — 25,00 em todos ----
  zona('PE', 'Jaboatão dos Guararapes', 'Prazeres', 25),
  zona('PE', 'Jaboatão dos Guararapes', 'Socorro', 25),
  zona('PE', 'Jaboatão dos Guararapes', 'Marcos Freire', 25),
  zona('PE', 'Jaboatão dos Guararapes', 'Cajueiro Seco', 25),
  zona('PE', 'Jaboatão dos Guararapes', 'Curado', 25),
  zona('PE', 'Jaboatão dos Guararapes', 'Muribeca', 25),
  zona('PE', 'Jaboatão dos Guararapes', 'Jaboatão Centro', 25),
  zona('PE', 'Jaboatão dos Guararapes', 'Cavaleiro', 25),
  zona('PE', 'Jaboatão dos Guararapes', 'Barra de Jangada', 25),
  zona('PE', 'Jaboatão dos Guararapes', 'Candeias', 25),
  zona('PE', 'Jaboatão dos Guararapes', 'Piedade', 25),

  // ---- Olinda / PE — 22 bairros (adm-101 e adm-115) ----
  zona('PE', 'Olinda', 'Jardim Atlântico', 20),
  zona('PE', 'Olinda', 'Ouro Preto', 15),
  zona('PE', 'Olinda', 'Fragoso', 17),
  zona('PE', 'Olinda', 'Tabajara', 16),
  zona('PE', 'Olinda', 'Guadalupe', 15),
  zona('PE', 'Olinda', 'Carmo', 18),
  zona('PE', 'Olinda', 'Varadouro', 17),
  zona('PE', 'Olinda', 'Amaro Branco', 17),
  zona('PE', 'Olinda', 'Bonsucesso', 18),
  zona('PE', 'Olinda', 'Amparo', 16),
  zona('PE', 'Olinda', 'Cidade Tabajara', 18),
  zona('PE', 'Olinda', 'Águas Compridas', 7),
  zona('PE', 'Olinda', 'Peixinhos', 10),
  zona('PE', 'Olinda', "Caixa D'Água", 10),
  zona('PE', 'Olinda', 'Alto da Bondade', 7),
  zona('PE', 'Olinda', 'Alto da Conquista', 7),
  zona('PE', 'Olinda', 'Passarinho', 10),
  zona('PE', 'Olinda', 'Sapucaia', 7),
  zona('PE', 'Olinda', 'Bultrins', 12),
  zona('PE', 'Olinda', 'Bairro Novo', 15),
  zona('PE', 'Olinda', 'Casa Caiada', 15),
  zona('PE', 'Olinda', 'Rio Doce', 20),

  // ---- Paulista / PE — 12 bairros (adm-115 e adm-123) ----
  zona('PE', 'Paulista', 'Arthur Lundgren II', 17),
  zona('PE', 'Paulista', 'Centro', 19),
  zona('PE', 'Paulista', 'Jardim Paulista', 15),
  zona('PE', 'Paulista', 'Paratibe', 17),
  zona('PE', 'Paulista', 'Maranguape I', 18),
  zona('PE', 'Paulista', 'Maranguape II', 19),
  zona('PE', 'Paulista', 'Janga', 20),
  zona('PE', 'Paulista', 'Pau Amarelo', 20),
  zona('PE', 'Paulista', 'Nossa Senhora do Ó', 20),
  zona('PE', 'Paulista', 'Maria Farinha', 20),
  zona('PE', 'Paulista', 'Conceição', 20),
  zona('PE', 'Paulista', 'Arthur Lundgren I', 17),

  // ---- Recife / PE — 22 bairros (adm-123 e adm-130) ----
  zona('PE', 'Recife', 'Boa Vista', 17),
  zona('PE', 'Recife', 'Derby', 20),
  zona('PE', 'Recife', 'Graças', 20),
  zona('PE', 'Recife', 'Espinheiro', 20),
  zona('PE', 'Recife', 'Encruzilhada', 20),
  zona('PE', 'Recife', 'Casa Amarela', 17),
  zona('PE', 'Recife', 'Arruda', 15),
  zona('PE', 'Recife', 'Água Fria', 12),
  zona('PE', 'Recife', 'Dois Unidos', 10),
  zona('PE', 'Recife', 'Linha do Tiro', 10),
  zona('PE', 'Recife', 'Beberibe', 7),
  zona('PE', 'Recife', 'Recife Antigo', 18),
  zona('PE', 'Recife', 'Afogados', 18),
  zona('PE', 'Recife', 'Pina', 20),
  zona('PE', 'Recife', 'Boa Viagem', 20),
  zona('PE', 'Recife', 'Imbiribeira', 20),
  zona('PE', 'Recife', 'Iputinga', 20),
  zona('PE', 'Recife', 'Torre', 20),
  zona('PE', 'Recife', 'Madalena', 15),
  zona('PE', 'Recife', 'Cordeiro', 20),
  zona('PE', 'Recife', 'Várzea', 20),
  zona('PE', 'Recife', 'Santo Amaro', 15),
];

/**
 * ================== OS CAMPOS VAZIOS DO MELHOR ENVIO SÃO UM ESTADO, NÃO UM ESQUECIMENTO ==================
 *
 * O print adm-143/144/212 mostra o formulário do Melhor Envio PREENCHIDO com dados
 * do titular da loja: nome, CPF, telefone e o endereço residencial de uma pessoa
 * física, mais o e-mail e o nome da conta conectada. Reproduzir esses valores
 * dentro do código-fonte não tem valor de produto — é dado pessoal que ficaria
 * versionado para sempre — e não muda nada do que a tela precisa desenhar.
 *
 * O que o print MANDA e está preservado: QUAIS campos existem, a ORDEM, os
 * RÓTULOS, o par de checkboxes `Sandbox` / `Ativo`, o cartão de conexão verde e os
 * quatro botões do rodapé. O que NÃO veio foram os VALORES pessoais.
 *
 * Os dois valores que ficam são os que não identificam ninguém: o `clientId`
 * (número do aplicativo, `26022`) e o CEP de origem — que é endereço comercial de
 * logística, não residencial. O resto sai vazio, que é a convenção dos outros
 * módulos e o estado em que adm-223 (Pagamentos) mostra todos os campos.
 */
export const DEMO_MELHOR_ENVIO: MelhorEnvioConfig = {
  token: '',
  sandbox: false,
  active: true,
  clientId: '26022',
  clientSecret: '',
  originCep: '53160010',
  senderName: '',
  document: '',
  phone: '',
  originAddress: '',
};

/** Pagamentos: todos os campos vazios, como o print adm-223 mostra. */
export const DEMO_PAYMENTS: PaymentConfig = {
  apiKey: '',
  clientId: '',
  clientSecret: '',
  webhookSecret: '',
  sandbox: true,
  isActive: false,
};

/**
 * ================== A CONTA CONECTADA É DE DEMONSTRAÇÃO ==================
 *
 * O cartão verde do print traz o nome completo e o e-mail de uma pessoa real, e a
 * data em que ela autorizou o aplicativo. Aqui o cartão mostra o estado `ok` —
 * que é o que a tela precisa saber desenhar — com o nome da LOJA no lugar do nome
 * da pessoa e o e-mail do domínio da loja. O nome do titular e o e-mail pessoal
 * não foram copiados, pelo mesmo motivo dos campos acima.
 */
export const DEMO_CONNECTION: ConnectionInfo = {
  status: 'ok',
  accountName: 'Closet Lunar',
  accountEmail: 'contato@closetlunar.com.br',
  connectedAt: '15/06/2026, 16:29:06',
};
