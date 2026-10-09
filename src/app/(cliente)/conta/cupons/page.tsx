import { CouponsView } from '@/components/cliente/coupons-view';

/**
 * `/conta/cupons` — o endereco da rota `Cupons` do menu lateral.
 *
 * A pagina NAO escreve titulo proprio, pelo mesmo motivo de `Endereços`,
 * `Minhas Medidas` e `Clube VIP & Cashback`: o cabecalho desta tela e proprio
 * (ele esta dentro do `space-y-8` do container, sem margem), e por isso vive
 * dentro de `CouponsView`. Ver a nota do topo de `coupons-view.tsx`.
 */
export default function ContaCuponsPage() {
  return <CouponsView />;
}
