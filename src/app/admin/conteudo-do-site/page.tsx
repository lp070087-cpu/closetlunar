import type { Metadata } from 'next';
import { ConteudoView } from '@/components/admin/conteudo/conteudo-view';
import { listCategories } from '@/lib/categorias/data';
import {
  getFooter,
  getInstagram,
  listBenefits,
  listHeroSlides,
  listHomeSections,
  listPromoBanners,
} from '@/lib/conteudo/data';

export const metadata: Metadata = { title: 'Conteúdo do Site' };

/**
 * `/admin/conteudo-do-site` — reconstruida de adm-053 a adm-059 (as SETE abas).
 *
 * ================== DEFEITO DO PLACEHOLDER ANTERIOR: `references` ERRADO ==================
 *
 * Esta rota era servida pelo `ModulePage` com `references="adm-063 a adm-070"`. O
 * intervalo esta ERRADO por inteiro — nenhum dos oito e desta tela:
 *
 *   adm-053 a adm-059  sao as SETE abas desta tela  <- o certo
 *   adm-060            `Personalizar Loja`           (outra rota)
 *   adm-061 / adm-062  `Looks` (lista e modal)       (outra rota)
 *   adm-063 a adm-070  o grupo `Insights e Comunicação`, que NAO tem nada a ver
 *
 * O erro e o MESMO tipo de `banners/page.tsx` (que dizia `adm-059 a adm-062`) e de
 * `fidelidade/page.tsx`: o `references` foi escrito pelo TITULO da tela, nao conferido
 * contra a faixa de abas de cada captura. E sobreviveu porque `references` e um atributo
 * de exibicao — nao aponta para arquivo, entao um numero errado nunca quebrou nada.
 *
 * ================== AS DESCRICOES DOS BLOCOS TAMBEM ERAM IMPRECISAS ==================
 *
 * O placeholder dizia "Rodapé — Colunas de links e políticas editáveis". O print de
 * adm-059 mostra `Políticas` e `Links` como DUAS listas com `+ Adicionar`, e as duas
 * VAZIAS — nao "colunas". A descricao "Editores por seção" tambem e generica demais:
 * cinco das sete abas sao LISTAS, nao editores de texto.
 *
 * ================== A PAGINA CARREGA TUDO NO SERVIDOR, DE UMA VEZ ==================
 *
 * As cinco listas + a config do Instagram + o rodape. A aba `Categorias` e um JOIN em
 * `lib/categorias` (a MESMA entidade de `/admin/categorias`), e por isso carrega a
 * `Category` completa — o formulario reusado precisa dos campos de SEO que a linha nao
 * desenha. Ver `listSiteCategories` (que existe, mas nao e usada aqui) e a nota em
 * `categorias-panel.tsx`.
 */
export default async function ConteudoDoSite_Page() {
  const [
    hero,
    categories,
    sections,
    promos,
    benefits,
    instagram,
    footer,
  ] = await Promise.all([
    listHeroSlides(),
    listCategories(),
    listHomeSections(),
    listPromoBanners(),
    listBenefits(),
    getInstagram(),
    getFooter(),
  ]);

  return (
    <ConteudoView
      hero={hero.data}
      categories={categories.data}
      sections={sections.data}
      promos={promos.data}
      benefits={benefits.data}
      instagram={instagram.data}
      footer={footer.data}
    />
  );
}
