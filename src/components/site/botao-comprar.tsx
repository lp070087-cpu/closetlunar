'use client';

import { Check, Loader2, ShoppingBag } from 'lucide-react';
import { useState } from 'react';
import { useSacola } from '@/lib/site/carrinho';
import type { Product } from '@/lib/produtos/types';
import { effectivePrice } from '@/lib/produtos/metrics';

/**
 * O `COMPRAR` do cartao e da pagina do produto.
 *
 * ================== ELE ESCOLHE A VARIACAO, E NAO A ADIVINHA ==================
 *
 * O original tem duas estradas: quando a peca tem UMA variacao, ele adiciona
 * direto; quando tem varias, abre um modal para escolher. Aqui vale a mesma
 * regra, com um criterio explicito:
 *
 *   - **sem tamanhos E sem cores** -> adiciona direto, com o rotulo `Único`;
 *   - **com variacoes** -> NAO adiciona. O botao mostra `Escolher tamanho` e
 *     leva para a pagina do produto, que e onde a escolha acontece.
 *
 * A segunda metade e a decisao que importa: adicionar uma peca com `P` escolhido
 * por conta propria seria a sacola decidindo pela cliente — e o `P` poderia ser
 * justamente o que nao serve. O original abre um modal; aqui o modal entra junto
 * com o resto, e ate la o botao DIZ o que falta fazer em vez de escolher sozinho.
 *
 * ================== O ESTADO E DE CURTO PRAZO ==================
 *
 * O `adicionando` existe para o retorno visual (o mesmo `Check` do original por
 * ~0,3 s). Nao e um estado de rede: `adicionar` escreve no `localStorage` na
 * hora. Se um dia a sacola for do servidor, este e o unico lugar que muda.
 */
export function BotaoComprar({
  product,
  className = '',
}: {
  product: Product;
  className?: string;
}) {
  const sacola = useSacola();
  const [adicionando, setAdicionando] = useState(false);

  const esgotado = product.stock <= 0;
  const temVariacoes = product.sizes.length > 0 || product.colors.length > 0;
  const preco = effectivePrice(product);

  function comprar() {
    if (!sacola || esgotado) return;
    if (temVariacoes) {
      // A escolha e da cliente. A pagina do produto e onde ela acontece.
      window.location.href = `/produto/${product.slug}`;
      return;
    }
    sacola.adicionar({
      produtoId: product.id,
      slug: product.slug,
      nome: product.name,
      imagem: product.images[0]?.url ?? '',
      preco,
      tamanho: 'Único',
      cor: '',
      quantidade: 1,
    });
    setAdicionando(true);
    setTimeout(() => setAdicionando(false), 300);
  }

  const rotulo = esgotado
    ? 'Indisponível'
    : adicionando
      ? 'Adicionado'
      : temVariacoes
        ? 'Escolher tamanho'
        : 'Comprar';

  return (
    <button
      type="button"
      onClick={comprar}
      disabled={esgotado}
      className={
        'inline-flex min-w-0 items-center justify-center gap-2 whitespace-nowrap rounded-full bg-foreground py-2.5 text-[10px] font-medium uppercase tracking-[0.1em] text-background shadow-sm transition-all hover:bg-foreground/90 disabled:cursor-not-allowed disabled:opacity-40 md:py-3 md:text-xs md:tracking-[0.18em] ' +
        className
      }
    >
      {adicionando ? (
        <Check className="size-3.5 shrink-0" aria-hidden />
      ) : esgotado ? (
        <Loader2 className="size-3.5 shrink-0 opacity-0" aria-hidden />
      ) : (
        <ShoppingBag className="size-3.5 shrink-0" aria-hidden />
      )}
      <span className="truncate">{rotulo}</span>
    </button>
  );
}
