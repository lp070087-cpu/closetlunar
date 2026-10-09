/**
 * Tipos de SEO & Google (`/admin/seo`) — adm-084.
 *
 * ================== A TELA TEM DUAS COLUNAS, E OS CAMPOS SÃO ESTES ==================
 *
 *   ESQUERDA  Meta Tags Globais (título · descrição · palavras-chave)
 *             Redes Sociais (Open Graph) — a imagem de compartilhamento
 *   DIREITA   Integrações Google (GA4 · GTM · Search Console)
 *             o cartão verde `SEO Técnico Ativo` e o botão `SALVAR SEO`
 *
 * ================== O QUE O PLACEHOLDER PROMETIA E NÃO EXISTE ==================
 *
 * O placeholder listava quatro blocos: "Título e descrição", "Pixels", "Indexação"
 * e "Dados estruturados". Só o primeiro se confirma. NÃO há tela de "Pixels"
 * (Facebook Pixel, TikTok Pixel) — nenhum campo de pixel aparece em adm-084, e o
 * original também não tem. "Indexação" e "Dados estruturados" também não têm
 * campos: o que existe é o cartão informativo `SEO Técnico Ativo`, que apenas DIZ
 * que sitemap, robots.txt, URLs amigáveis e canonical já estão no ar.
 */

/**
 * A configuração de SEO.
 *
 * ================== POR QUE HÁ DOIS CAMPOS DE IMAGEM ==================
 *
 * O print mostra DOIS campos empilhados sob `IMAGEM DE COMPARTILHAMENTO (OG IMAGE)`:
 * o de cima com o `placeholder` `URL da imagem (1200×630px)`, e o de baixo, com a
 * mesma aparência dos outros campos, com o `placeholder` `URL da imagem` e um botão
 * `Upload` à direita. O original escreve os DOIS em `config.og_image` — ou seja,
 * são dois caminhos para o mesmo valor (colar a URL ou enviar um arquivo).
 *
 * Aqui eles ficam SEPARADOS (`ogImageUrl` e `ogImageUpload`) porque quem digita num
 * deles não deve apagar o outro silenciosamente. Qual dos dois vence na hora de
 * montar a meta tag é decisão da integração com o Neon, não da tela — e a tela
 * deixa isso explícito em vez de escolher por conta própria.
 */
export interface SeoConfig {
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string;
  /** O campo de cima, com o placeholder `URL da imagem (1200×630px)`. */
  ogImageUrl: string;
  /** O campo de baixo, com o botão `Upload`. */
  ogImageUpload: string;
  /** `Google Analytics 4 (GA ID)` — ex.: `G-XXXXXXXXXX`. */
  gaId: string;
  /** `Google Tag Manager (GTM ID)` — ex.: `GTM-XXXXXXX`. */
  gtmId: string;
  /** `Google Search Console` — o código da meta tag. */
  gscVerification: string;
}
