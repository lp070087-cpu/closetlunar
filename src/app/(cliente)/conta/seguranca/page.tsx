import { SegurancaView } from '@/components/cliente/seguranca-view';

/**
 * `/conta/seguranca` — o endereco da rota `Segurança` do menu lateral.
 *
 * O padrao das outras telas da area: a pagina e uma casca de servidor, e a view
 * (`'use client'`) le o dado e desenha.
 *
 * A pagina NAO passa prop nenhuma — e isso mudou neste modulo. O `LOGOUT` do
 * rodape precisa do `sair` da casca, e passá-lo por prop exigiria que a pagina o
 * recebesse primeiro, o que ela nao faz: ela e Server Component, e nao tem sessao
 * para encerrar. A view le o portao por CONTEXTO, publicado pela casca. Ver a
 * nota longa de `PortaoDaConta` em `account-shell.tsx`.
 */
export default function ContaSegurancaPage() {
  return <SegurancaView />;
}
