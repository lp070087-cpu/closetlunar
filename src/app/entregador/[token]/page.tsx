import type { Metadata, Viewport } from 'next';
import { PainelEntregador } from '@/components/entregas/painel-entregador';

export const metadata: Metadata = {
  title: 'Entregador',
  robots: { index: false, follow: false },
};

export const viewport: Viewport = { themeColor: '#1d1715' };

export default async function EntregadorPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <PainelEntregador token={token} />;
}
