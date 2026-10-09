'use client';

import { useState } from 'react';
import { PieceConfigPanel } from './piece-config';
import { ProductPicker } from './product-picker';
import { newPieceConfigFromDefaults } from '@/lib/provador/metrics';
import type { Category, Product } from '@/lib/produtos/types';
import type { PieceConfig, PieceDefaults, PiecePosition } from '@/lib/provador/types';

/**
 * O PAR `SELETOR + CONFIGURAÇÃO` — usado por DUAS abas de DUAS telas.
 *
 *   /admin/avatar-virtual    aba `VINCULAR PRODUTOS`   (adm-041/042)
 *   /admin/provador-virtual  aba `IMAGENS DAS PEÇAS`   (adm-043/046)
 *
 * ================== POR QUE ELE E UM COMPONENTE, E NAO CODIGO EM CADA TELA ==================
 *
 * O que as duas abas compartilham NAO e so o visual: e o ESTADO. Escolher um
 * produto cria a config (`categoryId` vindo do proprio produto), trocar de produto
 * guarda o rascunho do anterior, e voltar restaura em vez de recomecar do zero.
 *
 * Escrito duas vezes, esse estado divergiria — e divergiria em silencio, porque
 * nenhuma das duas telas quebraria: elas so passariam a se comportar diferente.
 * E o mesmo motivo pelo qual as tres telas deste modulo dividem um diretorio em
 * `lib/`, aplicado um nivel acima.
 */
export function PieceWorkspace({
  products,
  categories,
  pieceDefaults,
  positionOptions,
}: {
  products: Product[];
  categories: Category[];
  pieceDefaults: PieceDefaults;
  positionOptions: { value: PiecePosition; label: string }[];
}) {
  /**
   * O ESTADO NASCE SEM PRODUTO ESCOLHIDO — adm-040 mostra exatamente isso: a lista
   * cheia a esquerda e, a direita, a seta `← Selecione um produto para
   * configurar.` Abrir com um produto ja selecionado mostraria um estado que o
   * material nao tem.
   */
  const [config, setConfig] = useState<PieceConfig | null>(null);

  /**
   * O RASCUNHO POR PRODUTO — o que a tela lembra enquanto esta aberta. NAO e
   * persistencia: e rascunho de sessao, e some ao recarregar (`data.ts`,
   * `WriteResult`). Sem ele, trocar de produto e voltar apagaria o que foi
   * digitado.
   */
  const [rascunhos, setRascunhos] = useState<Record<string, PieceConfig>>({});

  const produto = products.find((item) => item.id === config?.productId) ?? null;

  function escolherProduto(product: Product) {
    /**
     * A MONTAGEM SAIU DAQUI E VIROU `newPieceConfigFromDefaults` (`metrics.ts`).
     *
     * Este bloco montava o objeto inline, e o spread na ordem errada sobrescrevia
     * `categoryId` com o do repouso — o `tsc` pegou (TS2783). A correcao definitiva
     * nao foi so trocar a ordem: foi TIRAR `productId` e `categoryId` do repouso
     * (`PieceDefaults`) e mover a juncao para uma funcao pura, onde a bancada
     * consegue provar que a categoria sai do produto. A historia completa esta em
     * `metrics.ts`.
     */
    setConfig(rascunhos[product.id] ?? newPieceConfigFromDefaults(product, pieceDefaults));
  }

  function atualizar(proxima: PieceConfig) {
    setConfig(proxima);
    setRascunhos((atual) => ({ ...atual, [proxima.productId]: proxima }));
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[20rem_minmax(0,1fr)]">
      <ProductPicker
        products={products}
        selectedId={config?.productId ?? null}
        onSelect={escolherProduto}
      />
      <PieceConfigPanel
        config={config}
        product={produto}
        categories={categories}
        positionOptions={positionOptions}
        onChange={atualizar}
        onClear={() => setConfig(null)}
      />
    </div>
  );
}
