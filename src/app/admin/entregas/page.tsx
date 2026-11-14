import type { Metadata } from 'next';
import { EntregasView } from '@/components/admin/entregas/entregas-view';

export const metadata: Metadata = { title: 'Entregas' };

export default function EntregasPage() {
  return <EntregasView />;
}
