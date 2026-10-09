'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

/**
 * A SACOLA do site — o estado que o original guarda em `localStorage`.
 *
 * ================== POR QUE ESTE E O UNICO ESTADO DO SITE ==================
 *
 * A Fase 3 manteve quase tudo em Componentes de Servidor. A sacola e a excecao,
 * por um motivo concreto: ela e do VISITANTE, e nao do banco. Um carrinho que
 * so vivesse no servidor exigiria sessao (que a Fase 4 traz) — e ate la, o
 * visitante anonimo precisa poder montar a sacola. O `localStorage` faz isso sem
 * login, e e o que o original usa (`closet-lunar-cart`).
 *
 * ================== O QUE ESTA AQUI, E O QUE NAO ESTA ==================
 *
 * O `CartContext` do original tem **itens, cupom, frete, desconto e total**. Aqui
 * estao os ITENS, o SUBTOTAL e a CONTAGEM.
 *
 * **Nao ha cupom nem frete.** Aplicar um cupom exige a regra de validade de
 * `lib/cupons` (e o calculo do desconto), e o frete exige um provedor de
 * cotacao. Nenhum dos dois tem fonte nesta fase. Inventar um "desconto de 10%"
 * ou um "frete de R$ 19,90" seria um numero que o checkout nao pode honrar — e o
 * checkout esta marcado `GATEWAY A DEFINIR` justamente porque nao ha como cobrar.
 *
 * **Nao ha `add` automatico.** O `adicionar()` recebe a variacao (tamanho e cor)
 * escolhida; quem chama garante que ela existe. A sacola nao adivinha tamanho.
 *
 * ================== A CHAVE DE CADA LINHA ==================
 *
 * `produto + tamanho + cor`, como no original. Duas cores da mesma peca sao duas
 * linhas; a mesma cor duas vezes soma a quantidade. E o que faz o contador da
 * sacola bater com o numero de linhas visiveis.
 */
export interface ItemSacola {
  /** `id-tamanho-cor`, a chave do original. */
  id: string;
  produtoId: string;
  slug: string;
  nome: string;
  imagem: string;
  /** Preco unitario praticado (o efetivo, com promo ja aplicada). */
  preco: number;
  tamanho: string;
  cor: string;
  quantidade: number;
}

interface Sacola {
  itens: ItemSacola[];
  aberta: boolean;
  pronto: boolean;
  abrir: () => void;
  fechar: () => void;
  adicionar: (item: Omit<ItemSacola, 'id'>) => void;
  remover: (id: string) => void;
  definirQuantidade: (id: string, quantidade: number) => void;
  limpar: () => void;
  subtotal: number;
  contagem: number;
}

const CHAVE = 'closet-lunar-cart';

const Contexto = createContext<Sacola | null>(null);

export function SacolaProvider({ children }: { children: ReactNode }) {
  const [itens, setItens] = useState<ItemSacola[]>([]);
  const [aberta, setAberta] = useState(false);
  /*
    `pronto` separa "ainda nao li o disco" de "a sacola esta vazia". Sem ele, a
    primeira renderizacao mostraria `0` e a cliente veria o contador piscar — e um
    carrinho cheio pareceria vazio por um instante.
  */
  const [pronto, setPronto] = useState(false);

  useEffect(() => {
    try {
      const bruto = window.localStorage.getItem(CHAVE);
      if (bruto) {
        const lido = JSON.parse(bruto) as unknown;
        if (Array.isArray(lido)) setItens(lido.filter(ehItemValido));
      }
    } catch {
      /* disco cheio ou JSON corrompido: a sacola comeca vazia. */
    }
    setPronto(true);
  }, []);

  useEffect(() => {
    if (!pronto) return;
    try {
      window.localStorage.setItem(CHAVE, JSON.stringify(itens));
    } catch {
      /* sessao privada pode recusar a escrita; a sacola segue em memoria. */
    }
  }, [itens, pronto]);

  const adicionar = useCallback((item: Omit<ItemSacola, 'id'>) => {
    const id = `${item.produtoId}-${item.tamanho}-${item.cor}`;
    setItens((atual) => {
      const jaTem = atual.find((i) => i.id === id);
      if (jaTem) {
        return atual.map((i) =>
          i.id === id ? { ...i, quantidade: i.quantidade + item.quantidade } : i,
        );
      }
      return [...atual, { ...item, id }];
    });
    setAberta(true);
  }, []);

  const remover = useCallback((id: string) => {
    setItens((atual) => atual.filter((i) => i.id !== id));
  }, []);

  const definirQuantidade = useCallback((id: string, quantidade: number) => {
    // Quantidade minima 1: `0` e o `remover`, e nao um item invisivel na sacola.
    const q = Math.max(1, Math.floor(quantidade));
    setItens((atual) => atual.map((i) => (i.id === id ? { ...i, quantidade: q } : i)));
  }, []);

  const limpar = useCallback(() => setItens([]), []);

  const valor = useMemo<Sacola>(() => {
    const subtotal = itens.reduce((s, i) => s + i.preco * i.quantidade, 0);
    const contagem = itens.reduce((s, i) => s + i.quantidade, 0);
    return {
      itens,
      aberta,
      pronto,
      abrir: () => setAberta(true),
      fechar: () => setAberta(false),
      adicionar,
      remover,
      definirQuantidade,
      limpar,
      subtotal: Math.round(subtotal * 100) / 100,
      contagem,
    };
  }, [itens, aberta, pronto, adicionar, remover, definirQuantidade, limpar]);

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

/** A sacola. Fora do provedor devolve `null` — quem chama trata. */
export function useSacola(): Sacola | null {
  return useContext(Contexto);
}

/**
 * A leitura do disco e de um dado que o usuario pode ter editado. Uma linha sem
 * o formato certo e DESCARTADA, e nao propagada: um `preco` textual viraria
 * `NaN` no subtotal, e o subtotal inteiro iria com ele. Ver
 * `feedback_null_vira_zero` — o mesmo cuidado do `derived-metrics`.
 */
function ehItemValido(v: unknown): v is ItemSacola {
  if (!v || typeof v !== 'object') return false;
  const i = v as Record<string, unknown>;
  return (
    typeof i.id === 'string' &&
    typeof i.produtoId === 'string' &&
    typeof i.slug === 'string' &&
    typeof i.nome === 'string' &&
    typeof i.preco === 'number' &&
    Number.isFinite(i.preco) &&
    typeof i.quantidade === 'number' &&
    Number.isFinite(i.quantidade) &&
    i.quantidade > 0
  );
}

export const ITEM_SACOLA_VAZIO: Omit<ItemSacola, 'id'> = {
  produtoId: '',
  slug: '',
  nome: '',
  imagem: '',
  preco: 0,
  tamanho: '',
  cor: '',
  quantidade: 1,
};
