'use client';

import { Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/form';
import { ImageUpload } from '@/components/ui/image-upload';
import type { ProductColor } from '@/lib/produtos/types';

/**
 * Uma variacao de cor dentro do formulario de produto.
 *
 * Os prints adm-026/027 mostram apenas o AVISO de que as variacoes existem
 * ("Salve o produto primeiro para gerar variacoes de cor com fotos e estoque
 * proprios") — a tela de edicao das variacoes nao aparece em nenhum print.
 *
 * Portanto: a ESTRUTURA segue exatamente o que o aviso promete (nome, tom,
 * fotos proprias, estoque proprio) e o desenho reutiliza os componentes que os
 * prints ja mostraram (rotulo em caixa alta, input claro, galeria de imagens).
 * Nada de campo inventado alem dos quatro que o proprio texto do print cita.
 */

export interface ColorRowProps {
  color: ProductColor;
  onChange: (patch: Partial<Omit<ProductColor, 'id'>>) => void;
  onRemove: () => void;
}

export function ColorRow({ color, onChange, onRemove }: ColorRowProps) {
  const ownStock = color.stock !== null;

  return (
    <div className="rounded-2xl border border-border/60 bg-background p-4">
      <div className="flex flex-wrap items-end gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="label-caps">Cor</span>
          <Input
            value={color.name}
            placeholder="Ex: Preto"
            onChange={(event) => onChange({ name: event.target.value })}
            className="h-10 w-36"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="label-caps">Tom</span>
          <input
            type="color"
            value={color.hex}
            onChange={(event) => onChange({ hex: event.target.value })}
            aria-label={`Tom da cor ${color.name}`}
            className="focus-ring h-10 w-14 cursor-pointer rounded-xl border border-input bg-background p-1"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="label-caps">Estoque da cor</span>
          <Input
            inputMode="numeric"
            value={ownStock ? String(color.stock) : ''}
            placeholder="usa o geral"
            disabled={!ownStock}
            onChange={(event) => onChange({ stock: Number(event.target.value) || 0 })}
            className="h-10 w-32 tabular-nums"
          />
        </label>

        <label className="flex items-center gap-2 pb-2.5 text-xs text-muted-foreground">
          <input
            type="checkbox"
            checked={ownStock}
            onChange={(event) => onChange({ stock: event.target.checked ? 0 : null })}
            className="focus-ring size-4 cursor-pointer rounded border-input accent-foreground"
          />
          Estoque próprio
        </label>

        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remover a cor ${color.name}`}
          className="focus-ring ml-auto grid size-9 place-items-center rounded-xl border border-border text-muted-foreground transition-colors hover:border-danger/30 hover:bg-danger-surface hover:text-danger"
        >
          <Trash2 className="size-4" aria-hidden />
        </button>
      </div>

      <div className="mt-4">
        <ImageUpload
          label="Fotos desta cor"
          images={color.images}
          onChange={(images) => onChange({ images })}
        />
      </div>
    </div>
  );
}
