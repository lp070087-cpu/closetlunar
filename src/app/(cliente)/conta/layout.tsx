import { AccountLayoutClient } from './layout-client';
import { getConta } from '@/lib/cliente/data';
import { saudacao } from '@/lib/cliente/metrics';

/**
 * Layout da AREA DA CLIENTE.
 *
 * Fica em `(cliente)` — um GRUPO de rota, que nao entra na URL. `/conta`,
 * `/conta/pedidos` e as outras sete continuam com o mesmo endereco; o grupo
 * existe para dar a esta area um layout proprio sem tocar no layout raiz, que o
 * admin tambem usa e que esta encerrado.
 *
 * Server Component, como o layout do admin: e aqui que a conta sera resolvida
 * no servidor quando houver login real. Hoje `getConta()` devolve a conta de
 * demonstracao, e a SAUDACAO ja sai pronta daqui — o componente cliente nao
 * monta texto.
 */
export const metadata = {
  title: 'Minha Conta',
};

export default async function ContaLayout({ children }: { children: React.ReactNode }) {
  const { data: conta } = await getConta();
  const texto = saudacao(conta);

  return <AccountLayoutClient saudacao={texto}>{children}</AccountLayoutClient>;
}
