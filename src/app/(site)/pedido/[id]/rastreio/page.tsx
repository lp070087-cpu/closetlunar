import type { Metadata } from 'next';
import { RastreioCliente } from '@/components/entregas/rastreio-cliente';

export const metadata: Metadata = {
  title: 'Acompanhar entrega',
  robots: { index: false, follow: false },
};

export default async function RastreioPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <div className="container mx-auto max-w-3xl px-4 py-8 md:py-12">
      <RastreioCliente pedidoId={id} />
    </div>
  );
}
