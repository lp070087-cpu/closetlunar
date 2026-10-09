import { MeasuresView } from '@/components/cliente/measures-view';

/**
 * `/conta/medidas` — o endereco da rota `Minhas Medidas` do menu lateral.
 *
 * A pagina NAO escreve titulo proprio: como em `Endereços`, o cabecalho desta
 * tela e proprio (tem a descricao com o trecho destacado e o botao `VER NO
 * AVATAR 3D`), e por isso vive dentro de `MeasuresView`, e nao no
 * `AccountShell`. Ver a nota do topo de `measures-view.tsx`.
 */
export default function ContaMedidasPage() {
  return <MeasuresView />;
}
