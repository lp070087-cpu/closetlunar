import { AccountView } from '@/components/cliente/account-view';

/**
 * `/conta/dados` — o endereco da rota `Dados da Conta` do menu lateral.
 *
 * O padrao das outras telas da area: a pagina e uma CASCA de servidor, e a view
 * (`'use client'`) e que le o dado e desenha. A pagina nao passa prop nenhuma
 * porque nao ha o que parametrizar — a conta e sempre a da sessao.
 */
export default function ContaDadosPage() {
  return <AccountView />;
}
