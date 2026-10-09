import { AddressesView } from '@/components/cliente/addresses-view';

/**
 * `/conta/enderecos` — o endereco da rota `Endereços` do menu lateral.
 *
 * A pagina NAO escreve titulo proprio: o cabecalho desta tela e proprio (tem o
 * botao `+ NOVO ENDEREÇO`), e por isso vive dentro de `AddressesView`, e nao no
 * `AccountShell`. Ver a nota do topo de `addresses-view.tsx`.
 */
export default function ContaEnderecosPage() {
  return <AddressesView />;
}
