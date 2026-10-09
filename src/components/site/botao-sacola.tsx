'use client';

import { ShoppingBag } from 'lucide-react';
import { useSacola } from '@/lib/site/carrinho';

/**
 * O icone da sacola no cabecalho, com o CONTADOR.
 *
 * ================== ELE PRECISA DE ESTADO, E POR ISSO E CLIENTE ==================
 *
 * o numero sobre a sacola e a contagem da sacola. O cabecalho e um Componente de
 * Servidor (le as categorias), entao este botao e a ilha de cliente que ele
 * monta — o `.tsx` separado existe para o cabecalho inteiro nao virar cliente so
 * por causa de um numero.
 *
 * O contador so aparece com a sacola cheia: um `0` sobre o icone e ruido, e o
 * original tambem o esconde (`count > 0 &&`).
 */
export function BotaoSacola() {
  const sacola = useSacola();
  const contagem = sacola?.contagem ?? 0;

  return (
    <button
      type="button"
      onClick={() => sacola?.abrir()}
      aria-label={contagem > 0 ? `Sacola, ${contagem} item${contagem > 1 ? 's' : ''}` : 'Sacola'}
      className="focus-ring relative rounded-full p-2"
    >
      <ShoppingBag className="size-5" aria-hidden />
      {contagem > 0 && (
        <span className="absolute right-0.5 top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-accent px-1 text-[10px] text-accent-foreground">
          {contagem}
        </span>
      )}
    </button>
  );
}
