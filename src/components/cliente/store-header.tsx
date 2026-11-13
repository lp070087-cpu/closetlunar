import { SiteHeader } from '@/components/site/site-header';

/** The account uses the same working navigation and search as the storefront. */
export function StoreHeader() {
  return <SiteHeader cartHref="/checkout" />;
}
