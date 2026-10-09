import { CartDrawer } from '@/components/site/cart-drawer';
import { SiteFooter } from '@/components/site/site-footer';
import { SiteHeader } from '@/components/site/site-header';
import { WhatsappFlutuante } from '@/components/site/whatsapp-flutuante';
import { SacolaProvider } from '@/lib/site/carrinho';

/**
 * O layout do SITE PUBLICO.
 *
 * ================== POR QUE UM GRUPO `(site)`, E NAO A RAIZ ==================
 *
 * O original poe o `Header`/`Footer` no `__root.tsx`, que envolve TODAS as rotas
 * — inclusive `/conta` e `/admin`. Aqui isso seria errado por um motivo
 * concreto: o painel do admin e a area da cliente tem o proprio cromo, e ja
 * estao validados na Fase 1 e na Fase 2. Envolver os dois no cabecalho da loja
 * mudaria telas aprovadas — o que o primeiro principio da Fase 4 proibe
 * ("NAO redesenhe telas aprovadas").
 *
 * O grupo `(site)` faz o mesmo do `__root` para as rotas do site, e deixa as
 * outras areas com o cromo delas. A URL nao muda: `(site)` e um grupo de rota,
 * e nao um segmento de caminho.
 *
 * ================== O `SacolaProvider` ENVOLVE A ARVORE INTEIRA ==================
 *
 * Ele fica AQUI, e nao num componente isolado, porque o contador do cabecalho e
 * a gaveta sao IRMAOS na arvore — os dois leem o mesmo contexto. Um provedor
 * dentro de um deles deixaria o outro sem o dado.
 *
 * `CartDrawer` e um cliente montado no layout: ele nao desenha nada enquanto a
 * gaveta esta fechada, e por isso nao custa nada nas paginas que a nao usam.
 */
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <SacolaProvider>
      <div className="flex min-h-dvh flex-col">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
        <WhatsappFlutuante />
        <CartDrawer />
      </div>
    </SacolaProvider>
  );
}
