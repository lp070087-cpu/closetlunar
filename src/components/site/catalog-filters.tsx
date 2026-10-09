import type { Product } from '@/lib/produtos/types';
import { effectivePrice } from '@/lib/produtos/metrics';

/**
 * O filtro e a ordenacao do catalogo — a coluna de `260px` que o original monta
 * em `CatalogFilters.tsx`.
 *
 * ================== O QUE ESTE MODULO FAZ: A CONTA, E NAO A TELA ==================
 *
 * A tela de filtros (checkboxes, chips, a folha inferior do celular) precisa de
 * ESTADO — e o `CatalogFilters` do original e um componente de cliente com
 * `useState` para tamanho, cor, faixa de preco, disponibilidade e ordem.
 *
 * Este modulo isola o que pode ser provado sem estado: **os valores que a tela
 * oferece** e **o resultado de aplicar um filtro**. Assim a bancada prova a
 * regra (`Em promoção` = `compareAtPrice > price`, `Ultimas pecas` = `stock<=3`,
 * a ordenacao por desconto) contra o original, e nao apenas que um checkbox
 * existe. A tela consome estas funcoes quando o estado entrar — o carrinho ja
 * vai exigir `'use client'`, e ela entra junto.
 *
 * ================== A MODELAGEM NAO ENTRA ==================
 *
 * O original tem um filtro `Modelagem` (`justa`/`normal`/`confortavel`) que le a
 * tabela `product_size_rules` do Supabase. Nesta fase essa leitura e o `fetch`
 * por produto — e o filtro so faz sentido com ela. Fica de fora, registrado.
 */

/** A ordem de exibicao canonica. */
export const ORDEM_TAMANHOS = ['PP', 'P', 'M', 'G', 'GG', 'XG'] as const;

export interface Filtros {
  tamanhos: string[];
  cores: string[];
  precoMin: number;
  precoMax: number;
  emEstoque: boolean;
  ultimasPecas: boolean;
  emPromocao: boolean;
}

export const FILTROS_VAZIOS: Filtros = {
  tamanhos: [],
  cores: [],
  precoMin: 0,
  precoMax: 0,
  emEstoque: false,
  ultimasPecas: false,
  emPromocao: false,
};

/** As ordens do seletor do print, com o `default` do original: `recent`. */
export type Ordem = 'recent' | 'best' | 'price-asc' | 'price-desc' | 'discount' | 'favorites';

export const ORDENS: { value: Ordem; label: string }[] = [
  { value: 'recent', label: 'Mais recentes' },
  { value: 'best', label: 'Mais vendidos' },
  { value: 'price-asc', label: 'Menor preço' },
  { value: 'price-desc', label: 'Maior preço' },
  { value: 'discount', label: 'Maior desconto' },
  { value: 'favorites', label: 'Mais favoritados' },
];

/** Os tamanhos que EXISTEM na lista — um que ninguem vende nao vira botao. */
export function tamanhosDisponiveis(produtos: readonly Product[]): string[] {
  const set = new Set<string>();
  for (const p of produtos) for (const s of p.sizes) set.add(s);
  return ORDEM_TAMANHOS.filter((s) => set.has(s));
}

/**
 * As cores que existem na lista, com o nome e o hex da primeira ocorrencia.
 *
 * A comparacao de cor do original e por NOME normalizado
 * (`colorMatches`, case-insensitive), e nao por hex: duas pecas podem ter o
 * mesmo `Preto` em hex levemente diferentes. Aqui a chave e o nome em minusculas,
 * e o hex exibido e o da primeira peca que trouxe aquele nome.
 */
export function coresDisponiveis(
  produtos: readonly Product[],
): { nome: string; hex: string }[] {
  const porNome = new Map<string, string>();
  for (const p of produtos) {
    for (const c of p.colors) {
      const chave = c.name.trim().toLowerCase();
      if (chave && !porNome.has(chave)) porNome.set(chave, c.hex);
    }
  }
  return [...porNome.entries()].map(([nome, hex]) => ({ nome, hex }));
}

/** O teto da faixa de preco — o original usa no minimo `100` e o maior preco. */
export function tetoDePreco(produtos: readonly Product[]): number {
  return Math.max(100, ...produtos.map((p) => effectivePrice(p)));
}

/** Um produto passa nos filtros? `true` quando nenhum filtro esta ligado. */
export function passaNosFiltros(p: Product, f: Filtros): boolean {
  const preco = effectivePrice(p);
  if (f.precoMin > 0 && preco < f.precoMin) return false;
  if (f.precoMax > 0 && preco > f.precoMax) return false;
  if (f.tamanhos.length > 0 && !f.tamanhos.some((t) => p.sizes.includes(t))) return false;
  if (f.cores.length > 0) {
    const nomes = p.colors.map((c) => c.name.trim().toLowerCase());
    if (!f.cores.some((c) => nomes.includes(c.trim().toLowerCase()))) return false;
  }
  if (f.emEstoque && p.stock <= 0) return false;
  if (f.ultimasPecas && !(p.stock > 0 && p.stock <= 3)) return false;
  if (f.emPromocao && !emPromocao(p)) return false;
  return true;
}

/** `Em promoção` — o preco antigo existe E e maior que o praticado. */
export function emPromocao(p: Pick<Product, 'price' | 'compareAtPrice'>): boolean {
  return p.compareAtPrice !== null && p.compareAtPrice > p.price;
}

/**
 * Aplica os filtros e a ordem.
 *
 * As seis ordens sao as do original (`CatalogFilters.tsx`, linhas 124-140).
 * `best` e `favorites` ordenam pelo MESMO criterio (`featured` decrescente) —
 * nao porque sao a mesma coisa, mas porque e o que o original escreve: sem uma
 * tabela de favoritos no servidor, os dois caem no destaque. Estar aqui e o que
 * garante que a tela possa oferecer as duas opcoes sem inventar um dado.
 */
export function aplicarFiltros(produtos: readonly Product[], f: Filtros, ordem: Ordem): Product[] {
  const lista = produtos.filter((p) => passaNosFiltros(p, f));
  switch (ordem) {
    case 'price-asc':
      return [...lista].sort((a, b) => effectivePrice(a) - effectivePrice(b));
    case 'price-desc':
      return [...lista].sort((a, b) => effectivePrice(b) - effectivePrice(a));
    case 'discount':
      return [...lista].sort((a, b) => descontoRelativo(b) - descontoRelativo(a));
    case 'best':
    case 'favorites':
      return [...lista].sort((a, b) => Number(b.featured) - Number(a.featured));
    default:
      // `recent` — a leitura ja devolve os mais recentes primeiro.
      return [...lista];
  }
}

/** O desconto como Fracao (0 a 1), para ordenar. Sem preco antigo, zero. */
function descontoRelativo(p: Pick<Product, 'price' | 'compareAtPrice'>): number {
  if (!emPromocao(p)) return 0;
  return 1 - p.price / (p.compareAtPrice as number);
}
