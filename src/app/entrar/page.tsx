import Link from 'next/link';
import { redirect } from 'next/navigation';
import { CustomerLogin } from '@/components/cliente/customer-login';
import { StoreHeader } from '@/components/cliente/store-header';
import { StoreFooter } from '@/components/cliente/store-footer';
import { usuarioAtual } from '@/lib/auth/acoes';
import { temBanco } from '@/lib/db';

export const metadata = { title: 'Entrar', robots: { index: false, follow: false } };

/** Fora dos layouts protegidos: o redirecionamento nunca retorna ao proprio portao. */
export default async function EntrarPage({ searchParams }: { searchParams: Promise<{ area?: string }> }) {
  const admin = (await searchParams).area === 'admin';
  const usuario = await usuarioAtual();
  if (usuario && (!admin || usuario.papel === 'admin')) redirect(admin ? '/admin' : '/conta');
  const demo = !temBanco() && process.env.NODE_ENV !== 'production';
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <StoreHeader />
      <main className="flex-1">
        <CustomerLogin admin={admin} />
        {!temBanco() && <p role="status" className="mx-auto mb-6 max-w-md px-4 text-center text-sm text-muted-foreground">O acesso real aguarda a conexão do banco de dados. Nenhuma credencial será aceita enquanto ela estiver indisponível.</p>}
        {demo && <p className="mb-10 text-center text-sm"><Link className="underline" href={admin ? '/admin' : '/conta'}>Abrir demonstração de desenvolvimento</Link></p>}
      </main>
      <StoreFooter />
    </div>
  );
}
