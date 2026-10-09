'use client';

import { useEffect, useState } from 'react';
import { listFavorites } from '@/lib/favoritos/data';
import { sortByCount } from '@/lib/favoritos/metrics';
import type { FavoriteRow } from '@/lib/favoritos/types';
import { FavoritesList } from './favorites-list';

/**
 * A tela de Favoritos.
 *
 * ================== A TELA INTEIRA É UMA LISTA E UM TÍTULO ==================
 *
 * O print adm-067 tem duas coisas: o título serif `Produtos mais favoritados` e
 * uma caixa. Nada de KPI, nada de abas, nada de painel lateral. O placeholder da
 * rota descrevia duas seções — `Lista de favoritos` e `Oportunidades` — e a
 * segunda NÃO EXISTE em print nenhum: era um bloco inventado a partir do nome da
 * tela, do mesmo jeito que o `Produtos (detalhado)` inventado em Relatórios.
 *
 * ================== O TÍTULO NÃO É O `SectionHeader` DO PAINEL ==================
 *
 * O shell já desenha o `Favoritos` do topo, e o print repete o título em serif no
 * corpo. Ele está aqui como `<h2>` e NÃO como `SectionHeader`, porque o
 * `SectionHeader` põe uma DESCRIÇÃO ao lado do título e o print não tem uma —
 * acrescentá-la seria escrever uma frase que ninguém pediu.
 *
 * ================== POR QUE A ORDEM É REFEITA NO CLIENTE ==================
 *
 * `listFavorites` devolve a leitura; a ordenação por contagem é uma REGRA, e
 * regra mora em `metrics.ts` (`sortByCount`), não no JSX. A tela chama a função —
 * não reimplementa o `sort`.
 */
export function FavoritosView() {
  const [rows, setRows] = useState<FavoriteRow[] | null>(null);

  useEffect(() => {
    let ativo = true;
    listFavorites().then((resultado) => {
      if (ativo) setRows(sortByCount(resultado.data));
    });
    return () => {
      ativo = false;
    };
  }, []);

  return (
    <div className="space-y-4">
      <h2 className="font-serif text-2xl">Produtos mais favoritados</h2>

      {/*
        Enquanto a leitura não volta, a caixa vazia do print ainda não pode ser
        desenhada: mostrar `Nenhum favorito registrado ainda.` antes de ler seria
        afirmar um vazio que ainda não foi medido.
      */}
      {rows === null ? (
        <p className="text-sm text-muted-foreground">Carregando...</p>
      ) : rows.length === 0 ? (
        <div className="rounded border border-border bg-card p-6 text-sm text-muted-foreground">
          Nenhum favorito registrado ainda.
        </div>
      ) : (
        <FavoritesList items={rows} />
      )}
    </div>
  );
}
