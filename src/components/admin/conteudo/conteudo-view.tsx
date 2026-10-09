'use client';

import { useState } from 'react';
import { ConteudoTabs } from './conteudo-tabs';
import { HeroList } from './hero-list';
import { SecoesDaHome } from './secoes-da-home';
import { PromoBanners } from './promo-banners';
import { Beneficios } from './beneficios';
import { InstagramPanel } from './instagram-panel';
import { FooterPanel } from './footer-panel';
import { CategoriasPanel } from './categorias-panel';
import type {
  Benefit,
  ConteudoTabValue,
  HeroSlide,
  HomeSection,
  InstagramConfig,
  PromoBanner,
  SiteFooter,
} from '@/lib/conteudo/types';
import type { Category } from '@/lib/categorias/types';

/**
 * `/admin/conteudo-do-site` — as sete abas de adm-053 a adm-059 num so lugar.
 *
 * ================== O TITULO E O DA CASCA, E NAO DESTA TELA ==================
 *
 * O `Conteúdo do Site` do topo do print NAO e um titulo desenhado por esta pagina: e o
 * rotulo do item de menu, desenhado pelo `AdminShell` (`layout-client.tsx`). Isso foi
 * conferido na captura — nos outros grupos o mesmo texto aparece na posicao da casca.
 * Por isso `ConteudoTabs` NAO desenha um `Conteúdo do Site` serifado: seria um titulo
 * duplicado. O que a tela desenha sao as SETE PILULAS e, abaixo, o cabecalho da aba
 * ativa.
 *
 * ================== UM ORQUESTRADOR, SETE PAINEIS ==================
 *
 * Cada aba e um componente proprio, com o proprio estado e o proprio botao de cabecalho
 * — e nao uma tela condicional gigante. A razao e a mesma que dividiu `Page` e `View`:
 * sete formularios com estado num so componente tornariam impossivel saber qual campo
 * pertence a qual aba.
 *
 * ================== O ESTADO DE CADA ABA SOBREVIVE A TROCA ==================
 *
 * Os paineis ficam MONTADOS, e a troca so alterna qual esta visivel. Se cada troca
 * desmontasse o painel, um rascunho nao salvo na aba `Instagram` sumiria ao espiar a
 * aba `Rodapé` — sem aviso, e sem ser culpa de quem clicou. Montado, o rascunho
 * continua ali.
 *
 * ================== OS DADOS SAO CARREGADOS DE UMA VEZ, NO SERVIDOR ==================
 *
 * A pagina carrega as cinco listas + a config do Instagram + o rodape no servidor e as
 * passa prontas. Nenhuma aba busca nada ao ser aberta — o painel inteiro deste modulo
 * funciona com uma ida a camada de dados.
 */
export function ConteudoView({
  hero,
  categories,
  sections,
  promos,
  benefits,
  instagram,
  footer,
}: {
  hero: HeroSlide[];
  categories: Category[];
  sections: HomeSection[];
  promos: PromoBanner[];
  benefits: Benefit[];
  instagram: InstagramConfig;
  footer: SiteFooter;
}) {
  const [tab, setTab] = useState<ConteudoTabValue>('hero');

  return (
    <div className="space-y-8 motion-safe:animate-fade-in">
      <ConteudoTabs value={tab} onChange={setTab} />

      <div className={tab === 'hero' ? '' : 'hidden'}>
        <HeroList initial={hero} />
      </div>
      <div className={tab === 'categorias' ? '' : 'hidden'}>
        <CategoriasPanel initial={categories} />
      </div>
      <div className={tab === 'secoes' ? '' : 'hidden'}>
        <SecoesDaHome initial={sections} />
      </div>
      <div className={tab === 'promo' ? '' : 'hidden'}>
        <PromoBanners initial={promos} />
      </div>
      <div className={tab === 'beneficios' ? '' : 'hidden'}>
        <Beneficios initial={benefits} />
      </div>
      <div className={tab === 'instagram' ? '' : 'hidden'}>
        <InstagramPanel initial={instagram} />
      </div>
      <div className={tab === 'rodape' ? '' : 'hidden'}>
        <FooterPanel initial={footer} />
      </div>
    </div>
  );
}
