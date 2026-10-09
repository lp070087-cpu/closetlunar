'use client';

import { AccountShell } from '@/components/cliente/account-shell';

/**
 * A casca cliente da area da cliente.
 *
 * Ela existe pelo mesmo motivo que a do admin existe: a saudacao vem pronta do
 * Server Component, e o que precisa de navegador (`usePathname`, o aviso de
 * saida, o estado do drawer) fica deste lado. Se a casca fosse Server
 * Component, `usePathname` nao existiria e a casca teria que receber a rota por
 * prop — que e exatamente o que a `AdminLayoutClient` evita.
 */
export function AccountLayoutClient({
  saudacao,
  children,
}: {
  saudacao: string;
  children: React.ReactNode;
}) {
  return <AccountShell saudacao={saudacao}>{children}</AccountShell>;
}
