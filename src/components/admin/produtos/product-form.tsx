'use client';

import { useMemo, useState } from 'react';
import { Calculator, Plus, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Field, Input, Select, Switch, Textarea } from '@/components/ui/form';
import { ImageUpload } from '@/components/ui/image-upload';
import { Modal } from '@/components/ui/modal';
import { applyDiscount, localId } from '@/lib/produtos/form';
import { effectivePrice, grossProfit, profitMargin, toNumber } from '@/lib/produtos/metrics';
import type { Category, ProductColor, ProductDraft, ProductFieldErrors } from '@/lib/produtos/types';
import { formatBRL } from '@/lib/utils';
import { ColorRow } from './color-row';

/**
 * Formulario de produto — reconstrucao do modal `Novo Produto` (adm-026/adm-027).
 *
 * ORDEM DOS BLOCOS, identica ao print:
 *   1. titulo `Novo Produto` + X
 *   2. NOME DO PRODUTO
 *   3. URL AMIGAVEL (SLUG) — meia largura, com a linha de apoio
 *   4. CATEGORIA (select)
 *   5. VALORES — 5 campos lado a lado, com `PRECO DE CUSTO` em vermelho
 *   6. Bloco de calculo: LUCRO BRUTO + MARGEM DE LUCRO
 *   7. GALERIA DE IMAGENS
 *   8. Aviso tracejado de variacoes
 *   9. DESCRICAO
 *  10. rodape: `Cancelar` + `+ Criar Produto`
 *
 * Os campos de valores usam `inputMode="decimal"` em vez de `type="number"`:
 * o campo numerico do navegador aceita a roda do mouse e muda o preco sem
 * querer, e recusa virgula. Aqui a virgula e aceita e convertida.
 */

/** Campo monetario com o mesmo envelope dos demais. */
function MoneyInput({
  value,
  onChange,
  placeholder = 'R$ 0,00',
  disabled,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}) {
  return (
    <Input
      inputMode="decimal"
      value={value}
      disabled={disabled}
      placeholder={placeholder}
      onChange={(event) => onChange(event.target.value.replace(/[^\d.,-]/g, ''))}
      className="h-11 font-medium tabular-nums"
    />
  );
}

export interface ProductFormProps {
  open: boolean;
  onClose: () => void;
  draft: ProductDraft;
  onDraftChange: (draft: ProductDraft) => void;
  categories: Category[];
  editing: boolean;
  saving?: boolean;
  onSubmit: () => void;
  errors: ProductFieldErrors;
}

export function ProductForm({
  open,
  onClose,
  draft,
  onDraftChange,
  categories,
  editing,
  saving = false,
  onSubmit,
  errors,
}: ProductFormProps) {
  const [colorName, setColorName] = useState('');
  const [colorHex, setColorHex] = useState('#C9A18E');
  const [showColors, setShowColors] = useState(false);

  /**
   * As duas caixas de calculo do modal.
   *
   * O lucro sai do PRECO EFETIVO, nao do cheio: `effectivePrice` devolve o
   * promocional quando ele existe e e menor. O print do modal deixa os dois
   * campos na mesma tela justamente para a pessoa ver o efeito do desconto —
   * se o card continuasse no preco cheio, digitar um promocional mudaria a
   * receita sem mudar o lucro, e as duas contas do mesmo produto divergiriam
   * do que a tabela e o cartao mostram.
   */
  const effective = useMemo(
    () => effectivePrice({ price: draft.price, promoPrice: draft.promoPrice }),
    [draft.price, draft.promoPrice],
  );
  const profit = useMemo(
    () => grossProfit(effective, draft.costPrice),
    [effective, draft.costPrice],
  );
  const margin = useMemo(
    () => profitMargin(effective, draft.costPrice),
    [effective, draft.costPrice],
  );

  const set = <K extends keyof ProductDraft>(key: K, value: ProductDraft[K]) =>
    onDraftChange({ ...draft, [key]: value });

  function addColor() {
    const name = colorName.trim();
    if (!name) return;
    const color: ProductColor = { id: localId('cor'), name, hex: colorHex, images: [], stock: null };
    set('colors', [...draft.colors, color]);
    setColorName('');
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? 'Editar Produto' : 'Novo Produto'}
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={onSubmit} loading={saving}>
            {!saving ? <Plus className="size-4" aria-hidden /> : null}
            {editing ? 'Salvar Produto' : 'Criar Produto'}
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        <Field
          label="Nome do Produto"
          htmlFor="produto-nome"
          error={errors.name}
          required
        >
          <Input
            id="produto-nome"
            value={draft.name}
            placeholder="Ex: Vestido Midi Floral"
            onChange={(event) => {
              const name = event.target.value;
              const next: ProductDraft = { ...draft, name };
              if (!draft.slugTouched) next.slug = name;
              onDraftChange(next);
            }}
            onBlur={() => {
              if (!draft.slugTouched) {
                onDraftChange({ ...draft, slug: normalizeSlugInput(draft.name) });
              }
            }}
          />
        </Field>

        <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
          <Field
            label="URL Amigável (Slug)"
            htmlFor="produto-slug"
            hint="Gerado automaticamente a partir do nome"
            error={errors.slug}
          >
            <Input
              id="produto-slug"
              value={draft.slug}
              placeholder="vestido-midi-floral"
              onChange={(event) => set('slug', normalizeSlugInput(event.target.value))}
            />
          </Field>

          <Field label="Categoria" htmlFor="produto-categoria">
            <Select
              id="produto-categoria"
              value={draft.categoryId}
              onChange={(event) => set('categoryId', event.target.value)}
            >
              <option value="">— Sem categoria —</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        {/* VALORES — 5 colunas no desktop, 2 no mobile (o print e uma fileira) */}
        <fieldset className="space-y-3">
          <legend className="label-caps">Valores</legend>
          <div className="grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-3 lg:grid-cols-5">
            <Field label="Preço de Venda" hint="Valor que a cliente paga">
              <MoneyInput value={draft.price} onChange={(value) => set('price', value)} />
            </Field>

            <Field
              label="Preço de Custo"
              hint="Valor que você pagou"
              labelClassName="text-danger"
            >
              <MoneyInput value={draft.costPrice} onChange={(value) => set('costPrice', value)} />
            </Field>

            <Field
              label="Desconto %"
              labelClassName="text-warning-foreground"
              hint={
                draft.promoPrice
                  ? `Promocional: ${formatBRL(toNumber(draft.promoPrice))}`
                  : 'Atualiza promo'
              }
            >
              <Input
                inputMode="decimal"
                value={discountValue(draft)}
                placeholder="0"
                onChange={(event) => onDraftChange(applyDiscount(draft, event.target.value))}
                className="h-11 tabular-nums"
              />
            </Field>

            <Field label="Promocional" hint="Opcional">
              <MoneyInput
                value={draft.promoPrice}
                onChange={(value) => onDraftChange({ ...draft, promoPrice: value })}
              />
            </Field>

            <Field label="Riscado (antigo)" hint="Para preço riscado">
              <MoneyInput
                value={draft.compareAtPrice}
                onChange={(value) => set('compareAtPrice', value)}
              />
            </Field>
          </div>
        </fieldset>

        {/* Bloco de calculo: caixas com chip de icone, como no print */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-4 rounded-2xl border border-border/60 bg-secondary/20 p-4">
          <div className="flex items-center gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-success-surface text-success-foreground">
              <Calculator className="size-5" aria-hidden />
            </span>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground/80">
                Lucro Bruto
              </div>
              <div className="font-serif text-lg font-medium text-success-foreground tabular-nums">
                {formatBRL(profit)}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 border-border/60 sm:border-l sm:pl-6">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-warning-surface text-warning-foreground">
              <TrendingUp className="size-5" aria-hidden />
            </span>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground/80">
                Margem de Lucro
              </div>
              <div className="font-serif text-lg font-medium text-warning-foreground tabular-nums">
                {margin.toFixed(2)}%
              </div>
            </div>
          </div>
        </div>

        <ImageUpload images={draft.images} onChange={(images) => set('images', images)} />

        {/*
          Aviso tracejado do print. Na referencia ele aparece porque o produto
          ainda nao foi salvo; aqui ele some assim que o produto tem id, e da
          lugar ao editor de variacoes de cor.
        */}
        {!editing ? (
          <p className="rounded-2xl border border-dashed border-border px-4 py-4 text-xs leading-relaxed text-muted-foreground">
            Salve o produto primeiro para gerar variações de cor com fotos e estoque próprios.
          </p>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="label-caps">Variações de Cor</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Cada cor tem fotos e estoque próprios.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowColors((current) => !current)}
              >
                {showColors ? 'Ocultar' : 'Gerenciar'}
              </Button>
            </div>

            {showColors ? (
              <div className="space-y-3 rounded-2xl border border-border/60 p-4">
                {draft.colors.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Nenhuma cor cadastrada.</p>
                ) : (
                  <ul className="space-y-3">
                    {draft.colors.map((color) => (
                      <li key={color.id}>
                        <ColorRow
                          color={color}
                          onChange={(patch) =>
                            onDraftChange({
                              ...draft,
                              colors: draft.colors.map((item) =>
                                item.id === color.id ? { ...item, ...patch } : item,
                              ),
                            })
                          }
                          onRemove={() =>
                            onDraftChange({
                              ...draft,
                              colors: draft.colors.filter((item) => item.id !== color.id),
                            })
                          }
                        />
                      </li>
                    ))}
                  </ul>
                )}

                <div className="flex flex-wrap items-end gap-3 border-t border-border/60 pt-3">
                  <label className="flex flex-col gap-1.5">
                    <span className="label-caps">Nova cor</span>
                    <Input
                      value={colorName}
                      placeholder="Ex: Nude"
                      onChange={(event) => setColorName(event.target.value)}
                      className="h-10 w-40"
                    />
                  </label>
                  <label className="flex flex-col gap-1.5">
                    <span className="label-caps">Tom</span>
                    <input
                      type="color"
                      value={colorHex}
                      onChange={(event) => setColorHex(event.target.value)}
                      aria-label="Cor da variação"
                      className="focus-ring h-10 w-14 cursor-pointer rounded-xl border border-input bg-background p-1"
                    />
                  </label>
                  <Button type="button" variant="soft" size="sm" onClick={addColor}>
                    <Plus className="size-3.5" aria-hidden />
                    Adicionar
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        )}

        <SizesField draft={draft} onDraftChange={onDraftChange} />

        <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
          <Field label="Estoque" hint="Usado quando a cor não tem estoque próprio">
            <Input
              inputMode="numeric"
              value={draft.stock}
              placeholder="0"
              onChange={(event) => set('stock', event.target.value.replace(/\D/g, ''))}
              className="h-11 tabular-nums"
            />
          </Field>
          <div className="flex items-end pb-1">
            <Switch
              checked={draft.featured}
              onCheckedChange={(checked) => set('featured', checked)}
              label="Destacar na vitrine"
              description="Aparece nos destaques da loja"
            />
          </div>
        </div>

        <Field label="Descrição" htmlFor="produto-descricao">
          <Textarea
            id="produto-descricao"
            value={draft.description}
            rows={4}
            placeholder="Descreva o produto, composição, caimento..."
            onChange={(event) => set('description', event.target.value)}
          />
        </Field>
      </div>
    </Modal>
  );
}

/** Tamanhos como pills de marcar/desmarcar. */
function SizesField({
  draft,
  onDraftChange,
}: {
  draft: ProductDraft;
  onDraftChange: (draft: ProductDraft) => void;
}) {
  const all = ['PP', 'P', 'M', 'G', 'GG', 'XG'];
  return (
    <fieldset className="space-y-3">
      <legend className="label-caps">Tamanhos</legend>
      <div className="flex flex-wrap gap-2">
        {all.map((size) => {
          const active = draft.sizes.includes(size);
          return (
            <button
              key={size}
              type="button"
              aria-pressed={active}
              onClick={() => {
                const sizes = active
                  ? draft.sizes.filter((item) => item !== size)
                  : [...draft.sizes, size];
                onDraftChange({ ...draft, sizes });
              }}
              className={cn(
                'focus-ring min-w-11 rounded-full border px-3.5 py-2 text-xs font-bold uppercase tracking-wider transition-all duration-200',
                active
                  ? 'border-foreground bg-foreground text-background shadow-soft'
                  : 'border-border bg-background text-muted-foreground hover:border-foreground/30 hover:text-foreground',
              )}
            >
              {size}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

/**
 * Slugs na tela sao sempre normalizados, inclusive quando colados.
 *
 * Nao usa `slugify` de `utils` de proposito: aquele remove o hifen final, o que
 * atrapalha enquanto a pessoa digita "top-essential". Aqui o hifen final fica.
 * A remocao de acentos usa escapes (`̀-ͯ`), nunca os caracteres
 * literais, para nao depender da codificacao do arquivo.
 */
function normalizeSlugInput(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+/g, '');
}

/** O campo `DESCONTO %` e derivado; guarda-lo no rascunho duplicaria a verdade. */
function discountValue(draft: ProductDraft): string {
  const price = toNumber(draft.price);
  const promo = toNumber(draft.promoPrice);
  if (price <= 0 || promo <= 0 || promo >= price) return '';
  return String(Math.round((1 - promo / price) * 100));
}

export { normalizeSlugInput };
