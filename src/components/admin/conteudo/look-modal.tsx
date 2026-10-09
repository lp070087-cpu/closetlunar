'use client';

import { useRef, useState, type ChangeEvent } from 'react';
import { Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox, Input, Textarea } from '@/components/ui/form';
import { Modal } from '@/components/ui/modal';
import { cn } from '@/lib/utils';
import { formatBRL, lookPreview, lookPreviewName } from '@/lib/conteudo/metrics';
import { toggleLookPiece } from '@/lib/conteudo/form';
import { LOOK_PIECES_LABEL } from '@/lib/conteudo/demo';
import type { LookDraft, LookFieldErrors } from '@/lib/conteudo/types';
import type { Product } from '@/lib/produtos/types';

/**
 * O MODAL `Novo look` — adm-062.
 *
 * ================== O QUE O PRINT MOSTRA, DE CIMA PARA BAIXO ==================
 *
 *   `Nome do look (ex: Look Lunar Noite)`     input
 *   `Subtítulo`                               input
 *   `Descrição completa do look`              textarea
 *   `URL da imagem de capa`  |  `Enviar arquivo`   input + botao de arquivo
 *   `0`  |  `☑ Ativo`                          input curto + checkbox
 *   `PRODUTOS DO LOOK (0 SELECIONADOS)`       grade de cartoes de produto
 *   `PREVIEW DO LOOK`                         `Sem nome` / `0 peças` / `Total: R$ 0,00`
 *                                             `COMPRAR LOOK COMPLETO`
 *   ----------------------------------------  rodape: `Cancelar`  `Salvar`
 *
 * ================== O CAMPO DE CAPA NAO E A CAIXA TRACEJADA ==================
 *
 * Em adm-052 (`Novo Banner`) o campo de imagem e a caixa tracejada `CLIQUE PARA ENVIAR`.
 * AQUI NAO: o print deste modal mostra um INPUT de texto (`URL da imagem de capa`) com
 * um botao `Enviar arquivo` ao lado. Sao dois desenhos diferentes na mesma familia de
 * modal, e por isso `ImageDropField` NAO e reaproveitado — o `Enviar arquivo` abre o
 * seletor de arquivo e a URL vira `data:`, mas o desenho e o do print.
 *
 * ================== O `(0 SELECIONADOS)` CONTA A LISTA, NAO AS CAIXAS ==================
 *
 * O rotulo imprime `PRODUTOS DO LOOK (0 SELECIONADOS)`. O `0` e o comprimento de
 * `pieces`, e nao o numero de cartoes desenhados (que sao dez). Separar as duas coisas e
 * o que faz o contador acompanhar a marcacao — a bancada prova o `0`, o `1` e o texto no
 * plural.
 *
 * ================== A GRADE ESTA EM ORDEM ALFABETICA ==================
 *
 * `Conjunto Glow Nude`, `Cropped Urban Fit`, `Jaqueta Corta Vento Fit`, `Kit Nike`,
 * `Legging Modeladora Pre...`, `Macaquinho`, `Macaquinho costas nuas`, `Short Fitness
 * Energy`, `top`, `Top Essential Sustentação` — a ordem do print e a alfabetica do
 * catalogo. Nao ha ordenacao por preco nem por destaque: `top` (minusculo) aparece
 * depois de `Short` e antes de `Top`, o que so acontece numa ordenacao sensivel a caixa
 * — que e a ordenacao de strings do catalogo, reproduzida aqui.
 */

const MAX_BYTES = 4 * 1024 * 1024;
const ACCEPTED = ['image/png', 'image/jpeg', 'image/webp'];

export function LookModal({
  open,
  onClose,
  draft,
  onDraftChange,
  products,
  editing,
  saving,
  errors,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  draft: LookDraft;
  onDraftChange: (draft: LookDraft) => void;
  products: readonly Product[];
  editing: boolean;
  saving: boolean;
  errors: LookFieldErrors;
  onSubmit: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [fileError, setFileError] = useState('');

  const ordered = [...products].sort((a, b) => a.name.localeCompare(b.name));
  const preview = lookPreview(draft.pieces, products);
  const previewName = lookPreviewName(draft.name);

  function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!ACCEPTED.includes(file.type)) {
      setFileError('Formato não aceito. Use PNG, JPG, JPEG ou WEBP.');
      return;
    }
    if (file.size > MAX_BYTES) {
      setFileError('A imagem passa de 4 MB.');
      return;
    }
    setFileError('');
    const reader = new FileReader();
    reader.onload = () => onDraftChange({ ...draft, coverUrl: String(reader.result) });
    reader.onerror = () => setFileError('Falha ao ler o arquivo.');
    reader.readAsDataURL(file);
  }

  const footer = (
    <>
      <button
        type="button"
        onClick={onClose}
        className="focus-ring h-11 rounded-full px-6 text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground transition-colors hover:text-foreground"
      >
        Cancelar
      </button>
      <Button
        onClick={onSubmit}
        loading={saving}
        className="uppercase tracking-[0.12em]"
      >
        Salvar
      </Button>
    </>
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? 'Editar look' : 'Novo look'}
      size="md"
      footer={footer}
    >
      <div className="space-y-4">
        <Input
          label="Nome do look (ex: Look Lunar Noite)"
          value={draft.name}
          error={errors.name}
          onChange={(event) => onDraftChange({ ...draft, name: event.target.value })}
        />
        <Input
          label="Subtítulo"
          value={draft.subtitle}
          onChange={(event) => onDraftChange({ ...draft, subtitle: event.target.value })}
        />
        <Textarea
          label="Descrição completa do look"
          rows={4}
          value={draft.description}
          onChange={(event) => onDraftChange({ ...draft, description: event.target.value })}
        />

        <div className="flex flex-col gap-1.5">
          <span className="label-caps">URL da imagem de capa</span>
          <div className="flex items-center gap-3">
            <input
              type="url"
              value={draft.coverUrl.startsWith('data:') ? '' : draft.coverUrl}
              placeholder="URL da imagem de capa"
              aria-label="URL da imagem de capa"
              onChange={(event) => onDraftChange({ ...draft, coverUrl: event.target.value })}
              className="focus-ring h-11 min-w-0 flex-1 rounded-lg border border-input bg-background px-3 text-sm text-foreground transition-colors placeholder:text-muted-foreground/70 hover:border-border"
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="focus-ring shrink-0 rounded-md text-xs text-foreground underline underline-offset-4 transition-colors hover:text-muted-foreground"
            >
              Enviar arquivo
            </button>
            <input
              ref={fileRef}
              type="file"
              accept={ACCEPTED.join(',')}
              onChange={handleFile}
              className="sr-only"
              tabIndex={-1}
              aria-hidden
            />
          </div>
          {fileError ? <p className="text-xs text-danger">{fileError}</p> : null}
        </div>

        <div className="flex items-center gap-4">
          <Input
            aria-label="Ordem de exibição"
            className="h-11 w-24"
            value={draft.sortOrder}
            error={errors.sortOrder}
            onChange={(event) => onDraftChange({ ...draft, sortOrder: event.target.value })}
          />
          <Checkbox
            checked={draft.isActive}
            label="Ativo"
            className="accent-auto"
            onChange={(event) => onDraftChange({ ...draft, isActive: event.target.checked })}
          />
        </div>

        <LookPicker
          products={ordered}
          selected={draft.pieces.map((piece) => piece.productId)}
          onToggle={(productId) =>
            onDraftChange({ ...draft, pieces: toggleLookPiece(draft.pieces, productId) })
          }
        />

        <LookPreview
          name={previewName}
          countLabel={preview.pieceCountLabel}
          totalLabel={preview.totalLabel}
          rows={preview.rows}
        />
      </div>
    </Modal>
  );
}

/**
 * A GRADE DE PRODUTOS DO LOOK.
 *
 * ================== A MARCACAO NAO TEM CAIXINHA VISIVEL ==================
 *
 * O print nao mostra um quadradinho de marcar em cada cartao — so a miniatura, o nome e
 * o preco. Entao o cartao INTEIRO e clicavel, e o estado marcado aparece na BORDA. A
 * caixa de selecao existe (`sr-only`), para que o teclado e o leitor de tela tenham o
 * que acionar, mas ela nao e desenhada.
 */
function LookPicker({
  products,
  selected,
  onToggle,
}: {
  products: readonly Product[];
  selected: readonly string[];
  onToggle: (productId: string) => void;
}) {
  return (
    <fieldset className="space-y-2">
      <legend className="label-caps">
        {LOOK_PIECES_LABEL} ({selected.length} selecionados)
      </legend>
      <div className="grid max-h-72 grid-cols-1 gap-3 overflow-y-auto pr-1 sm:grid-cols-3">
        {products.map((product) => {
          const checked = selected.includes(product.id);
          const thumb = product.images[0]?.url;
          return (
            <label
              key={product.id}
              className={cn(
                'flex cursor-pointer items-center gap-3 rounded-xl border bg-background p-2.5 transition-colors',
                checked
                  ? 'border-foreground/70 ring-1 ring-foreground/15'
                  : 'border-border/60 hover:border-border',
              )}
            >
              <input
                type="checkbox"
                className="sr-only"
                checked={checked}
                onChange={() => onToggle(product.id)}
              />
              {thumb ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={thumb}
                  alt=""
                  loading="lazy"
                  className="size-10 shrink-0 rounded-lg border border-border/50 object-cover"
                />
              ) : (
                <span aria-hidden className="size-10 shrink-0 rounded-lg bg-secondary" />
              )}
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] leading-tight text-foreground">
                  {product.name}
                </span>
                <span className="block text-[12px] text-muted-foreground">
                  {formatBRL(product.price)}
                </span>
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

/**
 * O `PREVIEW DO LOOK` — o espelho do que a loja mostraria.
 *
 * O `COMPRAR LOOK COMPLETO` e um `<span>` e nao um `<button>`: ele e o BOTAO DA LOJA
 * desenhado dentro da previa, e nao uma acao deste modal. Transforma-lo num botao que
 * nao faz nada seria pior que desenha-lo como parte da imagem.
 */
function LookPreview({
  name,
  countLabel,
  totalLabel,
  rows,
}: {
  name: string;
  countLabel: string;
  totalLabel: string;
  rows: { productId: string; name: string; price: number }[];
}) {
  return (
    <section className="space-y-2 rounded-xl border border-border/60 bg-secondary/30 p-4">
      <p className="label-caps">Preview do look</p>
      <p className="font-serif text-xl leading-tight text-foreground">{name}</p>

      {rows.length > 0 ? (
        <ul className="space-y-1 pt-1">
          {rows.map((row) => (
            <li key={row.productId} className="flex items-center justify-between gap-4 text-[13px]">
              <span className="min-w-0 truncate text-foreground">{row.name}</span>
              <span className="shrink-0 text-muted-foreground">{formatBRL(row.price)}</span>
            </li>
          ))}
        </ul>
      ) : null}

      <p className="pt-1 text-[13px] text-muted-foreground">{countLabel}</p>
      <p className="text-[13px] font-semibold text-foreground">{totalLabel}</p>

      <span className="mt-1 inline-flex h-9 items-center rounded-full bg-foreground px-5 text-[10px] font-bold uppercase tracking-[0.16em] text-background">
        Comprar look completo
      </span>
    </section>
  );
}
