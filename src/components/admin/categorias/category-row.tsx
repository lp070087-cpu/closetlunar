'use client';

import { ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Category } from '@/lib/categorias/types';

/**
 * Linha da lista de categorias (adm-030 / adm-031).
 *
 * MEDIDO NO PRINT, nao inferido:
 *
 * - A linha e um CARD BRANCO proprio, com respiro entre um e outro — nao e uma
 *   linha de tabela com hairline. O fundo bege do painel aparece entre elas.
 * - A miniatura e CIRCULAR (`rounded-full`), ~48px. As linhas de `Tops` e
 *   `Conjuntos` tem foto; as outras quatro tem o circulo vazio.
 * - O NOME e serifado (`font-serif`), ~18px.
 * - A META e sans, minuscula, cinza: `/slug · ordem N · ativo`. O separador e
 *   o ponto medio `·` (U+00B7), exatamente como o catalogo transcreve.
 * - As duas primeiras acoes sao TEXTO SUBLINHADO; `Excluir` e vermelho e NAO e
 *   sublinhado. A diferenca e visivel no print e por isso esta aqui.
 * - Na categoria inativa a primeira acao vira `Ativar` — o verbo muda com o
 *   estado, nao so a cor.
 *
 * O QUE O PRINT NAO MOSTRA e por isso NAO esta aqui: badge de status, contagem
 * de produtos por linha, botao de arrastar. A contagem aparece no resumo acima
 * da lista, que e onde o pedido a colocou sem inventar coluna que a referencia
 * nao tem.
 */

export function CategoryRow({
  category,
  onEdit,
  onToggle,
  onDelete,
}: {
  category: Category;
  onEdit: (category: Category) => void;
  onToggle: (category: Category) => void;
  onDelete: (category: Category) => void;
}) {
  const status = category.isActive ? 'ativo' : 'inativo';

  return (
    <li className="surface-flat flex items-center gap-4 px-4 py-3.5 sm:gap-5 sm:px-6 sm:py-4">
      <Thumbnail category={category} />

      <div className="min-w-0 flex-1">
        <p className="truncate font-serif text-lg leading-tight text-foreground">{category.name}</p>
        {/*
          A meta inteira fala em voz baixa e so os numeros e o estado se
          destacam — igual ao print, onde `/tops` e `ordem 1` sao cinza e
          `ativo` tambem, mas o conjunto e lido de relance porque o nome acima
          carrega o peso.
        */}
        <p className="mt-0.5 truncate text-xs text-muted-foreground">
          <span>/{category.slug}</span>
          <span aria-hidden className="px-1.5">
            ·
          </span>
          <span>ordem {category.sortOrder}</span>
          <span aria-hidden className="px-1.5">
            ·
          </span>
          <span>{status}</span>
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-3 sm:gap-4">
        <button
          type="button"
          onClick={() => onToggle(category)}
          className="focus-ring rounded-md text-xs text-foreground underline underline-offset-4 transition-colors hover:text-muted-foreground"
        >
          {category.isActive ? 'Desativar' : 'Ativar'}
        </button>
        <button
          type="button"
          onClick={() => onEdit(category)}
          className="focus-ring rounded-md text-xs text-foreground underline underline-offset-4 transition-colors hover:text-muted-foreground"
        >
          Editar
        </button>
        <button
          type="button"
          onClick={() => onDelete(category)}
          aria-label={`Excluir ${category.name}`}
          className={cn(
            'focus-ring rounded-md text-xs text-danger transition-colors',
            'hover:brightness-90',
          )}
        >
          Excluir
        </button>
      </div>
    </li>
  );
}

/**
 * Miniatura circular de 48px.
 *
 * Sem imagem, o circulo fica com o fundo `secondary` e um icone bem apagado —
 * e o "espaco vazio/bege" que o catalogo descreve nas quatro linhas do print.
 * Nao inventamos foto de categoria: como em Produtos, as capas de demonstracao
 * sao marcadores `data:` e nao fingem ser fotos.
 */
function Thumbnail({ category }: { category: Category }) {
  return (
    <div className="size-12 shrink-0 overflow-hidden rounded-full border border-border/50 bg-secondary">
      {category.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={category.image.url}
          alt={category.image.alt}
          className="size-full object-cover"
          loading="lazy"
        />
      ) : (
        <div className="grid size-full place-items-center text-muted-foreground/40">
          <ImageIcon className="size-5" aria-hidden />
        </div>
      )}
    </div>
  );
}
