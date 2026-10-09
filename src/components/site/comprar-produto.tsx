'use client';

import { Check, MessageCircle } from 'lucide-react';
import { useState } from 'react';
import { useSacola } from '@/lib/site/carrinho';
import { effectivePrice } from '@/lib/produtos/metrics';
import type { Product } from '@/lib/produtos/types';
import { formatBRL } from '@/lib/utils';

/**
 * A compra da pagina do produto: escolher tamanho e cor, quantidade, e as duas
 * saidas.
 *
 * ================== ELE E A OUTRA METADE DO `BotaoComprar` ==================
 *
 * No cartao, o botao NAO escolhe a variacao — ele manda para ca. Aqui a escolha
 * acontece, e so entao a peca entra na sacola. E a divisao que o original faz
 * entre o cartao (que abre um modal) e a PDP (que tem os seletores na pagina).
 *
 * ================== O QUE ELE NAO DEIXA PASSAR ==================
 *
 * **Peca com variacao e sem tamanho escolhido nao entra na sacola.** O botao
 * fica desabilitado e diz `Escolha o tamanho`. Adicionar com um tamanho padrao
 * seria a sacola decidindo pela cliente — e o tamanho e exatamente o dado que
 * faz a peca servir ou nao.
 *
 * **A cor e pre-selecionada quando so ha uma.** Nao ha escolha a fazer nesse
 * caso, e exigir um clique num unico circulo seria atrito sem decisao. Com duas
 * ou mais cores, nenhuma vem marcada e o botao exige a escolha.
 *
 * **Quantidade respeita o estoque.** O `+` para no estoque da peca. Vender mais
 * do que existe e o defeito que o checkout nao teria como desfazer.
 */
export function ComprarProduto({ product }: { product: Product }) {
  const sacola = useSacola();

  const umaCor = product.colors.length === 1 ? product.colors[0].name : '';
  const [tamanho, setTamanho] = useState(product.sizes.length === 1 ? product.sizes[0] : '');
  const [cor, setCor] = useState(umaCor);
  const [quantidade, setQuantidade] = useState(1);
  const [adicionado, setAdicionado] = useState(false);

  const preco = effectivePrice(product);
  const esgotado = product.stock <= 0;
  const precisaTamanho = product.sizes.length > 0 && !tamanho;
  const precisaCor = product.colors.length > 1 && !cor;
  const podeComprar = !esgotado && !precisaTamanho && !precisaCor;
  const maximo = Math.max(1, product.stock);

  function adicionar() {
    if (!sacola || !podeComprar) return;
    sacola.adicionar({
      produtoId: product.id,
      slug: product.slug,
      nome: product.name,
      imagem: product.images[0]?.url ?? '',
      preco,
      tamanho: tamanho || 'Único',
      cor,
      quantidade,
    });
    setAdicionado(true);
    setTimeout(() => setAdicionado(false), 1200);
  }

  const textoWhats = encodeURIComponent(
    [
      `Olá! Tenho interesse no produto: ${product.name}`,
      tamanho ? `Tamanho: ${tamanho}` : null,
      cor ? `Cor: ${cor}` : null,
      `Quantidade: ${quantidade}`,
      `Valor: ${formatBRL(preco * quantidade)}`,
    ]
      .filter(Boolean)
      .join('\n'),
  );

  return (
    <>
      {product.colors.length > 0 && (
        <div className="mt-6">
          <div className="mb-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
            Cor: <span className="normal-case tracking-normal text-foreground">{cor || '—'}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {product.colors.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setCor(c.name)}
                title={c.name}
                aria-label={`Cor ${c.name}`}
                aria-pressed={cor === c.name}
                className={
                  'relative size-10 rounded-full border-2 transition ' +
                  (cor === c.name ? 'border-foreground' : 'border-transparent hover:border-foreground/40')
                }
              >
                <span
                  className="absolute inset-1 rounded-full ring-1 ring-border"
                  style={{ backgroundColor: c.hex }}
                />
              </button>
            ))}
          </div>
        </div>
      )}

      {product.sizes.length > 0 && (
        <div className="mt-6">
          <div className="mb-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">Tamanho</div>
          <div className="flex flex-wrap gap-2">
            {product.sizes.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTamanho(t)}
                aria-pressed={tamanho === t}
                className={
                  'grid h-11 min-w-[3rem] place-items-center rounded-full border px-3 text-sm font-medium tracking-wide transition ' +
                  (tamanho === t
                    ? 'border-foreground bg-foreground text-background'
                    : 'border-border hover:border-foreground/60')
                }
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mt-5">
        <div className="mb-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">Quantidade</div>
        <div className="inline-flex rounded border border-border">
          <button
            type="button"
            aria-label="Diminuir"
            onClick={() => setQuantidade((q) => Math.max(1, q - 1))}
            className="focus-ring px-3 py-2"
          >
            −
          </button>
          <span className="border-x border-border px-5 py-2">{quantidade}</span>
          <button
            type="button"
            aria-label="Aumentar"
            onClick={() => setQuantidade((q) => Math.min(maximo, q + 1))}
            disabled={quantidade >= maximo}
            className="focus-ring px-3 py-2 disabled:opacity-30"
          >
            +
          </button>
        </div>
      </div>

      <div className="mt-6 space-y-2">
        <button
          type="button"
          onClick={adicionar}
          disabled={!podeComprar}
          className="flex w-full items-center justify-center gap-2 rounded bg-foreground py-3 text-sm font-medium tracking-wider text-background disabled:opacity-50"
        >
          {adicionado && <Check className="size-4" aria-hidden />}
          {esgotado
            ? 'PRODUTO ESGOTADO'
            : adicionado
              ? 'ADICIONADO À SACOLA'
              : precisaTamanho
                ? 'ESCOLHA O TAMANHO'
                : precisaCor
                  ? 'ESCOLHA A COR'
                  : 'ADICIONAR AO CARRINHO'}
        </button>
        <a
          href={`https://wa.me/?text=${textoWhats}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex w-full items-center justify-center gap-2 rounded border border-[#25D366] py-3 text-sm font-medium text-[#25D366]"
        >
          <MessageCircle className="size-4" aria-hidden /> Comprar pelo WhatsApp
        </a>
      </div>
    </>
  );
}
