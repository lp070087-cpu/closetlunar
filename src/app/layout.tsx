import type { Metadata, Viewport } from 'next';
import { Cormorant_Garamond, Inter } from 'next/font/google';
import Script from 'next/script';
import './globals.css';
import { getSeoConfig } from '@/lib/seo/data';
import type { SeoConfig } from '@/lib/seo/types';

/**
 * Tipografia da marca: serifada elegante para titulos e numeros, sans neutra
 * para interface. E o mesmo par do projeto de referencia (Cormorant Garamond +
 * Inter), o que mantem a identidade coerente entre painel e loja.
 */
const serif = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-serif',
});

const sans = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-sans',
});

const SITE = process.env.NEXT_PUBLIC_APP_URL || 'https://closetlunar.vercel.app';

/** Metadados globais vindos de Admin → SEO & Google (com padrao da loja). */
export async function generateMetadata(): Promise<Metadata> {
  const { data: seo } = await getSeoConfig().catch(() => ({ data: null as SeoConfig | null }));
  const titulo = seo?.seoTitle || 'Closet Lunar — Moda Fitness Feminina';
  const descricao =
    seo?.seoDescription ||
    'Conjuntos fitness, tops, short-saia e calças flare. Compre no Pix ou em 3x sem juros.';
  const imagem = seo?.ogImageUpload || seo?.ogImageUrl || `${SITE}/site/og-closet-lunar.jpg`;
  return {
    metadataBase: new URL(SITE),
    title: { default: titulo, template: '%s · Closet Lunar' },
    description: descricao,
    keywords: seo?.seoKeywords ? seo.seoKeywords.split(',').map((k) => k.trim()).filter(Boolean) : undefined,
    robots: { index: true, follow: true },
    openGraph: {
      type: 'website',
      locale: 'pt_BR',
      siteName: 'Closet Lunar',
      title: titulo,
      description: descricao,
      images: [{ url: imagem, width: 1200, height: 630, alt: 'Closet Lunar — moda fitness feminina' }],
    },
    twitter: { card: 'summary_large_image', title: titulo, description: descricao, images: [imagem] },
    verification: seo?.gscVerification ? { google: seo.gscVerification } : undefined,
    alternates: { canonical: '/' },
  };
}

export const viewport: Viewport = {
  themeColor: '#F7EDE2',
  width: 'device-width',
  initialScale: 1,
  // Nao bloqueia o zoom: acessibilidade acima de preferencia estetica.
  maximumScale: 5,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { data: seo } = await getSeoConfig().catch(() => ({ data: null as SeoConfig | null }));
  const ga = /^G-[A-Z0-9]+$/.test(seo?.gaId ?? '') ? seo!.gaId : '';
  const gtm = /^GTM-[A-Z0-9]+$/.test(seo?.gtmId ?? '') ? seo!.gtmId : '';
  return (
    <html lang="pt-BR" className={`${serif.variable} ${sans.variable}`}>
      <body>
        {children}
        {ga ? (
          <>
            <Script src={`https://www.googletagmanager.com/gtag/js?id=${ga}`} strategy="afterInteractive" />
            <Script id="ga4" strategy="afterInteractive">
              {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${ga}');`}
            </Script>
          </>
        ) : null}
        {gtm ? (
          <Script id="gtm" strategy="afterInteractive">
            {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${gtm}');`}
          </Script>
        ) : null}
      </body>
    </html>
  );
}
