'use client';

import { useRef, useState, type ChangeEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox, Field, FieldGrid, Input } from '@/components/ui/form';
import { Modal } from '@/components/ui/modal';
import { applyName, applySlug } from '@/lib/categorias/form';
import type { Category, CategoryDraft, CategoryFieldErrors } from '@/lib/categorias/types';

/**
 * Formulario de categoria — reconstrucao do modal `Nova categoria` (adm-031).
 *
 * MEDIDO NO PRINT, nao inferido:
 *
 * - O modal NAO tem `X` de fechar. O de Produtos tem (adm-026); este nao.
 *   Por isso `hideHeader` + um titulo proprio em serif, sem a barra de fita
 *   que o `Modal` desenha quando tem cabecalho.
 * - TITULO: `Nova categoria` / `Editar categoria`, serif, alinhado a esquerda.
 * - TRES CAMPOS empilhados, o primeiro SEM rotulo visivel: so o placeholder
 *   `Nome`. O segundo so o placeholder `Slug (url)`. O terceiro com rotulo
 *   `Imagem (círculo)` e, na mesma linha, o campo `URL da imagem` + botao
 *   branco `Upload`.
 * - QUARTA LINHA: rotulo `Ordem` a esquerda do campo numerico estreito (com
 *   `7` no print) e um checkbox MARCADO + `Ativo` ao lado.
 * - RODAPE sem barra separadora: `Cancelar` como texto e `Salvar` como pill
 *   preta, os dois encostados a direita.
 *
 * O QUE O PRINT NAO MOSTRA e por isso vive atras de um bloco recolhivel:
 * descricao, titulo de SEO, descricao de SEO e texto de introducao. A
 * referencia do projeto guarda esses tres ultimos por categoria, entao eles
 * precisam EXISTIR para nao termos que mudar o schema depois — mas abrir o
 * modal com sete campos quando o print mostra quatro seria trocar a fidelidade
 * pelo schema. Recolhidos por padrao, e com o aviso de que nao estao no print.
 */

const ACCEPTED = ['image/png', 'image/jpeg', 'image/webp'];
const MAX_BYTES = 4 * 1024 * 1024;

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Falha ao ler o arquivo.'));
    reader.readAsDataURL(file);
  });
}

export interface CategoryFormProps {
  open: boolean;
  onClose: () => void;
  draft: CategoryDraft;
  onDraftChange: (draft: CategoryDraft) => void;
  editing: boolean;
  saving?: boolean;
  onSubmit: () => void;
  errors: CategoryFieldErrors;
}

export function CategoryForm({
  open,
  onClose,
  draft,
  onDraftChange,
  editing,
  saving = false,
  onSubmit,
  errors,
}: CategoryFormProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [showExtra, setShowExtra] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);

  const set = <K extends keyof CategoryDraft>(key: K, value: CategoryDraft[K]) =>
    onDraftChange({ ...draft, [key]: value });

  /**
   * `Upload` neste ponto NAO envia nada para servidor: le o arquivo como
   * `data:` e preenche o campo de URL. E o mesmo caminho de Produtos, e o ponto
   * de troca quando existir storage e o unico lugar que muda.
   */
  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setFileError(null);

    if (!ACCEPTED.includes(file.type) || file.size > MAX_BYTES) {
      setFileError('Aceita PNG, JPG ou WEBP até 4 MB.');
      return;
    }
    try {
      const url = await readFileAsDataUrl(file);
      set('imageUrl', url);
    } catch {
      setFileError('Não foi possível ler o arquivo.');
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? 'Editar categoria' : 'Nova categoria'}
      size="sm"
      hideHeader
    >
      <div className="flex flex-col gap-4">
        <h2 className="font-serif text-xl leading-tight tracking-tight">
          {editing ? 'Editar categoria' : 'Nova categoria'}
        </h2>

        {/* Campo 1 — sem rotulo visivel no print, so o placeholder `Nome`. */}
        <Input
          value={draft.name}
          onChange={(event) => onDraftChange(applyName(draft, event.target.value))}
          placeholder="Nome"
          aria-label="Nome"
          error={errors.name}
          className="h-12"
          autoFocus
        />

        {/* Campo 2 — placeholder `Slug (url)`. */}
        <Input
          value={draft.slug}
          onChange={(event) => onDraftChange(applySlug(draft, event.target.value))}
          placeholder="Slug (url)"
          aria-label="Slug (url)"
          error={errors.slug}
          className="h-12"
        />

        {/* Campo 3 — rotulo `Imagem (círculo)` + campo + botao `Upload`. */}
        <Field label="Imagem (círculo)">
          <div className="flex items-center gap-3">
            <Input
              value={draft.imageUrl}
              onChange={(event) => set('imageUrl', event.target.value)}
              placeholder="URL da imagem"
              className="h-12 flex-1"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => fileRef.current?.click()}
              className="h-12 shrink-0"
            >
              Upload
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="sr-only"
              onChange={handleFile}
            />
          </div>
        </Field>
        {fileError ? (
          <p role="alert" className="-mt-2 text-xs font-medium text-danger">
            {fileError}
          </p>
        ) : null}

        {/* Linha 4 — `Ordem` (estreito) + checkbox `Ativo`. */}
        <div className="flex flex-wrap items-end gap-x-6 gap-y-3">
          <label className="flex items-center gap-2">
            <span className="text-sm text-foreground">Ordem</span>
            <input
              inputMode="numeric"
              value={draft.sortOrder}
              onChange={(event) => set('sortOrder', event.target.value.replace(/[^\d]/g, ''))}
              aria-label="Ordem"
              aria-invalid={errors.sortOrder ? true : undefined}
              className="focus-ring h-11 w-20 rounded-xl border border-input bg-background px-3 text-sm tabular-nums transition-colors hover:border-border"
            />
          </label>

          <Checkbox
            checked={draft.isActive}
            onChange={(event) => set('isActive', event.target.checked)}
            label="Ativo"
            className="pb-3"
          />
        </div>
        {errors.sortOrder ? (
          <p className="-mt-2 text-xs font-medium text-danger">{errors.sortOrder}</p>
        ) : null}

        {/*
          Bloco recolhivel: campos que a referencia guarda mas o print nao
          mostra. Fechado por padrao para o modal abrir com os quatro campos do
          print; o aviso diz de onde eles vem para nao parecer invencao.
        */}
        <div className="rounded-2xl border border-dashed border-border bg-secondary/20 px-4 py-3">
          <button
            type="button"
            onClick={() => setShowExtra((current) => !current)}
            aria-expanded={showExtra}
            className="focus-ring rounded-md text-xs font-medium text-muted-foreground underline underline-offset-4 transition-colors hover:text-foreground"
          >
            {showExtra ? 'Ocultar' : 'Mostrar'} textos de SEO e descrição
          </button>
          <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground/80">
            Estes campos não aparecem no print do painel, mas a referência do projeto os guarda por
            categoria. Ficam aqui para o schema não mudar depois.
          </p>

          {showExtra ? (
            <div className="mt-4 flex flex-col gap-4">
              <FieldGrid columns={2}>
                <Field label="Título de SEO">
                  <Input
                    value={draft.metaTitle}
                    onChange={(event) => set('metaTitle', event.target.value)}
                    placeholder="Título para o Google"
                    className="h-11"
                  />
                </Field>
                <Field label="Descrição de SEO">
                  <Input
                    value={draft.metaDescription}
                    onChange={(event) => set('metaDescription', event.target.value)}
                    placeholder="Resumo para o Google"
                    className="h-11"
                  />
                </Field>
              </FieldGrid>
              <Field label="Texto de introdução" hint="Aparece no topo da página da categoria.">
                <textarea
                  value={draft.introText}
                  onChange={(event) => set('introText', event.target.value)}
                  rows={3}
                  placeholder="Descreva a categoria para a cliente..."
                  className="focus-ring w-full resize-y rounded-xl border border-input bg-background px-4 py-3 text-sm leading-relaxed transition-colors placeholder:text-muted-foreground/70 hover:border-border"
                />
              </Field>
            </div>
          ) : null}
        </div>

        {/* Rodape sem barra separadora — igual ao print. */}
        <div className="flex items-center justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="focus-ring rounded-lg px-3 py-2 text-sm text-foreground transition-colors hover:bg-secondary disabled:opacity-50"
          >
            Cancelar
          </button>
          <Button type="button" onClick={onSubmit} loading={saving}>
            Salvar
          </Button>
        </div>
      </div>
    </Modal>
  );
}
