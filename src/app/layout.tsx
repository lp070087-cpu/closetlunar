import type { Metadata, Viewport } from 'next';
import { Cormorant_Garamond, Inter } from 'next/font/google';
import './globals.css';

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

export const metadata: Metadata = {
  title: {
    default: 'Closet Lunna',
    template: '%s · Closet Lunna',
  },
  description:
    'Closet Lunna — moda fitness feminina. Loja online, área da cliente e painel administrativo.',
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: '#F7EDE2',
  width: 'device-width',
  initialScale: 1,
  // Nao bloqueia o zoom: acessibilidade acima de preferencia estetica.
  maximumScale: 5,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${serif.variable} ${sans.variable}`}>
      <body>{children}</body>
    </html>
  );
}
