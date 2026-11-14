import { SiteHeader } from '@/components/site/site-header';

/**
 * Cabecalho da area da cliente: o MESMO do site. No celular, o menu (☰) traz
 * primeiro as secoes da conta e o "Sair" — um menu so, sem menu extra no meio da tela.
 */
export function StoreHeader({ onSair }: { onSair?: () => void } = {}) {
  return <SiteHeader cartHref="/checkout" onSair={onSair} />;
}
