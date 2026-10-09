/**
 * Métricas, agrupamento e formatação de Configurações.
 *
 * PURO: sem React, sem I/O, sem `Date.now()`.
 */

import type {
  ConfigTab,
  DeliveryCityGroup,
  DeliveryZone,
  ShippingProvider,
  ZoneDraft,
} from './types';

/**
 * As seis transportadoras do seletor, com os rótulos EXATOS do print — inclusive
 * o `(EM BREVE)` das cinco indisponíveis. Só o Melhor Envio está `available`.
 *
 * Mora aqui (e não na demonstração) porque NÃO é dado: é a lista fixa de opções
 * que a tela oferece, como os rótulos das pílulas. Uma transportadora nova só
 * aparece aqui quando existir de verdade — e nenhuma das cinco `(EM BREVE)` tem
 * captura de tela conectada.
 */
export const SHIPPING_PROVIDERS: {
  value: ShippingProvider;
  label: string;
  available: boolean;
}[] = [
  { value: 'melhor_envio', label: 'Melhor Envio', available: true },
  { value: 'correios', label: 'Correios', available: false },
  { value: 'jadlog', label: 'Jadlog', available: false },
  { value: 'azul_cargo', label: 'Azul Cargo', available: false },
  { value: 'loggi', label: 'Loggi', available: false },
  { value: 'total_express', label: 'Total Express', available: false },
];

const TABS: { value: ConfigTab; label: string }[] = [
  { value: 'entrega_propria', label: 'Entrega própria' },
  { value: 'melhor_envio', label: 'Melhor Envio' },
  { value: 'integracao', label: 'Integração transportadoras' },
  { value: 'pagamentos', label: 'Pagamentos' },
];

/**
 * Os rótulos das quatro pílulas.
 *
 * O print escreve as quatro em CAIXA ALTA, mas isso é `text-transform` do CSS,
 * não o texto — e o projeto já foi mordido por essa diferença (a memória da
 * bancada registra que medir a caixa alta no HTML bruto dá falso negativo). Aqui
 * o texto vai em caixa normal e quem sobe a caixa é o componente, como em todas
 * as pílulas do painel.
 */
export function configTabs(): { value: ConfigTab; label: string }[] {
  return TABS.map((aba) => ({ ...aba }));
}

/** O rótulo de uma transportadora já com o `(EM BREVE)` quando indisponível. */
export function providerLabel(label: string, available: boolean): string {
  return available ? label : `${label} (EM BREVE)`;
}

/**
 * ================== AGRUPA E ORDENA — E A ORDEM É A DO PRINT ==================
 *
 * `state` e depois `city`, como o `ORDER BY` do original. As quatro cidades do
 * print são todas `PE`, então na prática quem manda é o nome — e é assim que os
 * blocos aparecem nas capturas.
 *
 * O agrupamento NÃO usa `Map` de objeto porque a chave precisa juntar estado e
 * cidade sem colisão (`PE` + `Recife` não pode virar `PERecife` e casar com
 * `PE` + `R`ecife de outro jeito). O separador `\u0000` não aparece em nome de
 * lugar nenhum.
 */
export function groupByCity(zones: DeliveryZone[]): DeliveryCityGroup[] {
  const mapa = new Map<string, DeliveryCityGroup>();
  for (const zona of zones) {
    const chave = `${zona.state}\u0000${zona.city}`;
    const atual = mapa.get(chave);
    if (atual) atual.zones.push(zona);
    else mapa.set(chave, { state: zona.state, city: zona.city, zones: [zona] });
  }
  return [...mapa.values()].sort(
    (a, b) => a.state.localeCompare(b.state, 'pt-BR') || a.city.localeCompare(b.city, 'pt-BR'),
  );
}

/** `11 bairros` / `1 bairro` — o contador do cabeçalho do bloco. */
export function neighborhoodCountLabel(total: number): string {
  return `${total} ${total === 1 ? 'bairro' : 'bairros'}`;
}

/**
 * O valor da entrega como a tabela mostra.
 *
 * O print escreve `25,00` — vírgula, sem o `R$` colado (o símbolo fica fora, como
 * um `span` a parte). Por isso nada de `formatBRL` aqui: ele devolveria
 * `R$ 25,00` inteiro, e o `R$` apareceria duas vezes.
 */
export function priceLabel(price: number): string {
  return price.toFixed(2).replace('.', ',');
}

/**
 * O nome do bairro, com o caso "cidade toda" do original.
 *
 * Um registro sem bairro significa atender a cidade inteira; a tabela escreve o
 * texto em itálico no lugar do nome. Nenhuma das quatro cidades do print cai
 * nesse caso, mas o botão `+ Adicionar cidade` cria exatamente um assim.
 */
export function neighborhoodLabel(neighborhood: string): string {
  const texto = neighborhood.trim();
  return texto === '' ? 'toda a cidade' : texto;
}

/** O rótulo do selo de status da linha. */
export function zoneStatusLabel(isActive: boolean): string {
  return isActive ? 'Ativo' : 'Inativo';
}

/** Os quatro totais do cabeçalho do bloco. */
export function cityTotals(zones: DeliveryZone[]): { cities: number; neighborhoods: number } {
  return { cities: groupByCity(zones).length, neighborhoods: zones.length };
}

/** Aplica uma troca de preço a UM registro, devolvendo uma lista NOVA. */
export function applyPriceChange(zones: DeliveryZone[], id: string, price: number): DeliveryZone[] {
  return zones.map((zona) => (zona.id === id ? { ...zona, price } : zona));
}

/** Liga/desliga UM bairro, sem tocar nos outros. */
export function toggleZoneActive(zones: DeliveryZone[], id: string): DeliveryZone[] {
  return zones.map((zona) => (zona.id === id ? { ...zona, isActive: !zona.isActive } : zona));
}

/** Tira UM bairro da lista. */
export function removeZone(zones: DeliveryZone[], id: string): DeliveryZone[] {
  return zones.filter((zona) => zona.id !== id);
}

/** Tira TODOS os bairros de uma cidade — o `Excluir cidade` do bloco. */
export function removeCity(zones: DeliveryZone[], state: string, city: string): DeliveryZone[] {
  return zones.filter((zona) => !(zona.state === state && zona.city === city));
}

/**
 * Insere ou substitui um bairro pelo `id`.
 *
 * `zone.id === null` não existe: quem chama já resolveu o id antes — um id novo
 * para a criação, o id da linha para a edição. Devolve lista NOVA nos dois casos.
 */
export function upsertZone(zones: DeliveryZone[], zone: DeliveryZone): DeliveryZone[] {
  const existe = zones.some((zona) => zona.id === zone.id);
  return existe ? zones.map((zona) => (zona.id === zone.id ? zone : zona)) : [...zones, zone];
}

/**
 * Converte o que o usuário digitou em preço. Aceita `25`, `25,50` e `25.50`.
 *
 * ================== O CAMPO VAZIO NÃO É ZERO ==================
 *
 * A limpeza joga fora o que não é dígito nem ponto — é o que faz `R$ 25,00` virar
 * `25.00`. Mas isso, sozinho, transforma QUALQUER coisa sem dígito em `Number('')`,
 * que é `0`: o campo apagado virava preço zero, e `"abc"` também. `null` é a
 * resposta certa para "não há um preço aqui", e é o que quem chama testa antes de
 * aplicar (`if (novo !== null)`).
 *
 * O sinal de menos é recusado de propósito: a limpeza o descartaria, e `-5` viraria
 * `5` — um valor negativo silenciosamente invertido é pior do que um `null`.
 */
export function parsePrice(input: string): number | null {
  const bruto = input.trim();
  if (bruto === '' || bruto.includes('-')) return null;
  const limpo = bruto.replace(',', '.').replace(/[^\d.]/g, '');
  if (!/\d/.test(limpo)) return null;
  const numero = Number(limpo);
  return Number.isFinite(numero) && numero >= 0 ? Number(numero.toFixed(2)) : null;
}

/**
 * Monta o `DeliveryZone` a partir do rascunho do formulário, em memória.
 *
 * O `id` NULO do rascunho (criação) vira um id novo — recebido de fora, porque
 * esta função é PURA e não pode chamar `Date.now()` nem `Math.random()`. Quem
 * chama decide o id. O rascunho de EDIÇÃO já traz o id da linha.
 */
export function zoneFromDraft(draft: ZoneDraft, id: string): DeliveryZone {
  const price = parsePrice(draft.price) ?? 0;
  const prazo = draft.etaLabel.trim();
  return {
    id: draft.id ?? id,
    state: draft.state.trim().toUpperCase(),
    city: draft.city.trim(),
    neighborhood: draft.neighborhood.trim(),
    price,
    etaLabel: prazo === '' ? 'Mesmo dia / 24h' : prazo,
    daysMin: 0,
    daysMax: 1,
    isActive: draft.isActive,
  };
}
