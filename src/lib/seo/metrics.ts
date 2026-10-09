/**
 * Listas e conversões de SEO & Google.
 *
 * PURO: sem React, sem I/O, sem `Date.now()`.
 *
 * Esta tela não tem NÚMERO nenhum para calcular — nem total, nem percentual, nem
 * valor. O que ela tem são duas listas fixas (o checklist técnico e os limites de
 * caractere recomendados) e a troca de UM campo por vez. Inventar uma "métrica" de
 * SEO aqui seria inventar conteúdo.
 */

import type { SeoConfig } from './types';

/**
 * ================== OS QUATRO ITENS DO CARTÃO VERDE ==================
 *
 * São afirmações FIXAS do original — não dependem de nenhum campo, não têm cursor
 * nem estado. O cartão diz o que a loja JÁ tem, não o que falta. Por isso a lista
 * é constante e não há "item pendente": os quatro aparecem sempre, em verde.
 *
 * O `•` de cada linha é do próprio texto no original (ele escreve `• Sitemap...`).
 * Aqui o marcador sai separado do texto, para o componente desenhar a lista como
 * lista — o que a tela mostra é idêntico.
 */
export const SEO_CHECKLIST: string[] = [
  'Sitemap automático gerado em /sitemap.xml',
  'Arquivo Robots.txt configurado em /robots.txt',
  'URLs amigáveis para produtos e categorias',
  'Canonical tags implementadas em todas as páginas',
];

/**
 * As duas recomendações de tamanho, como o print escreve.
 *
 * O print NÃO mostra um contador ao vivo — só a frase fixa embaixo de cada campo.
 * Um "38/60" seria invenção: nenhum pixel mostra isso.
 */
export const SEO_LIMITS = {
  title: 'Recomendado: até 60 caracteres.',
  description: 'Recomendado: entre 120 e 160 caracteres.',
} as const;

/** Troca UM campo, devolvendo um objeto NOVO — a tela edita sem mutar a demo. */
export function applySeoChange<K extends keyof SeoConfig>(
  config: SeoConfig,
  campo: K,
  valor: SeoConfig[K],
): SeoConfig {
  return { ...config, [campo]: valor };
}

/**
 * O que o botão `Upload` faz com o que voltou do seletor de arquivo.
 *
 * Não há upload real (sem storage — fora de escopo). O que existe é o caminho local
 * do arquivo escolhido virando o valor do campo de baixo, que é o que o original
 * faz quando o `ImageField` resolve. Sem arquivo, nada muda.
 */
export function ogImageFromFile(escolhido: string | null): string | null {
  if (escolhido === null) return null;
  const limpo = escolhido.trim();
  return limpo === '' ? null : limpo;
}
