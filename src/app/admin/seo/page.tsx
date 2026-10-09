import type { Metadata } from 'next';
import { SeoView } from '@/components/admin/seo/seo-view';

export const metadata: Metadata = { title: 'SEO & Google' };

/**
 * `/admin/seo` — reconstruída de adm-084.
 *
 * A PÁGINA É UM COMPONENTE DE SERVIDOR e só monta a tela; o estado (os oito campos
 * de SEO) vive em `SeoView`.
 *
 * ================== A FAIXA DE PRINTS ESTAVA ERRADA ==================
 *
 * O placeholder registrava `adm-083 a adm-084` — dois prints. SEO é UMA tela só, e
 * ela é **adm-084** (2026-09-28 000232). `adm-083` (000223) é a aba `Pagamentos` de
 * Configurações, não SEO. A faixa certa é `adm-084`.
 *
 * ================== O QUE O PLACEHOLDER PROMETIA E NÃO EXISTE ==================
 *
 * O placeholder listava quatro blocos: "Título e descrição", "Pixels", "Indexação"
 * e "Dados estruturados". Só o primeiro tem campos no print.
 *
 *   "Pixels"               NÃO existe. Nenhum campo de pixel (Facebook, TikTok)
 *                          aparece em adm-084, e o original também não os tem.
 *                          Não foi inventado.
 *   "Indexação"            não tem campo próprio. O que existe é o `Google Search
 *                          Console (Código de Verificação)`, dentro de `Integrações
 *                          Google`, e o cartão informativo `SEO Técnico Ativo`.
 *   "Dados estruturados"   NÃO existe. Nenhum campo de schema/JSON-LD no print nem
 *                          no original.
 *
 * O que sobrou é a tela real: `Meta Tags Globais`, `Redes Sociais (Open Graph)`,
 * `Integrações Google`, o cartão `SEO Técnico Ativo` e o botão `SALVAR SEO`.
 *
 * ================== A GRAFIA DA LOJA ==================
 *
 * O print adm-084 escreve `Closet Lunar` (um `n`) no subtítulo, como várias outras
 * capturas. O nome já está fixado no painel como **Closet Lunna** (`layout.tsx`), e
 * a convenção do projeto é preservar as OUTRAS ocorrências como o print mostra —
 * ver `personalizar-view.tsx`. Aqui o subtítulo usa `Closet Lunna`, que é o nome
 * oficial da loja; `Closet Lunar` do print é divergência de digitação, não conteúdo.
 *
 * ================== O QUE NÃO MUDOU ==================
 *
 * A rota continua `/admin/seo`, o item de menu o mesmo, e nada aqui conecta o
 * Neon — ver `lib/seo/data.ts`.
 */
export default function Seo_Page() {
  return <SeoView />;
}
