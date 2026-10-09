import { ClubeView } from '@/components/cliente/clube-view';

/**
 * `/conta/pontos` — o endereco da rota `Clube VIP & Cashback` do menu lateral.
 *
 * A pagina NAO escreve titulo proprio, pelo mesmo motivo de `Endereços` e
 * `Minhas Medidas`: o cabecalho desta tela e proprio (ele esta dentro do
 * `space-y-8` do container, sem margem), e por isso vive dentro de `ClubeView`.
 * Ver a nota do topo de `clube-view.tsx`.
 */
export default function ContaPontosPage() {
  return <ClubeView />;
}
