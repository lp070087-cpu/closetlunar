/**
 * Demonstração de SEO & Google — adm-084.
 *
 * ================== TUDO VAZIO, COMO O PRINT ==================
 *
 * Na captura adm-084 os OITO campos estão em branco e mostram o `placeholder`:
 * `Ex: Closet Lunna — Moda Fitness e Streetwear Feminino`, `Descreva sua loja em
 * poucas frases...`, `Ex: moda fitness, academia, legging, tops, streetwear`,
 * `URL da imagem (1200×630px)`, `URL da imagem`, `Ex: G-XXXXXXXXXX`,
 * `Ex: GTM-XXXXXXX` e `O código de verificação da meta tag`.
 *
 * Ou seja: a loja AINDA NÃO preencheu nada. Inventar um título, uma descrição ou
 * um GA ID faria a tela parecer configurada quando não está — e o placeholder já
 * carrega o exemplo, que é onde ele deve ficar.
 */

import type { SeoConfig } from './types';

export const DEMO_SEO: SeoConfig = {
  seoTitle: '',
  seoDescription: '',
  seoKeywords: '',
  ogImageUrl: '',
  ogImageUpload: '',
  gaId: '',
  gtmId: '',
  gscVerification: '',
};
