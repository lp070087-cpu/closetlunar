'use client';

import { useRef, useState, type ChangeEvent, type DragEvent } from 'react';
import { ArrowLeft, ArrowRight, ImagePlus, Star, Trash2, Upload } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './button';
import { localId } from '@/lib/produtos/form';
import type { ProductImage } from '@/lib/produtos/types';

/**
 * Galeria de imagens do produto (adm-026 / adm-027).
 *
 * O print mostra: titulo `GALERIA DE IMAGENS`, botao claro `Enviar Imagem` com
 * icone de upload a direita, e a linha de apoio "Aceita PNG, JPG, JPEG e WEBP.
 * A primeira imagem e a principal — arraste com as setas para reordenar."
 *
 * Comportamento implementado:
 * - arrastar e soltar arquivos sobre a area, ou clicar para escolher;
 * - reordenar com as SETAS, exatamente como o texto promete (nao com drag);
 * - a primeira imagem recebe o selo `Principal`;
 * - ler arquivos como `data:` e local, entao funciona sem servidor de upload.
 *
 * LIMITE HONESTO: nada e enviado para servidor. Quando o storage existir, o
 * ponto de troca e `readFileAsDataUrl` -> upload e guardar a URL publica.
 */

const ACCEPTED = ['image/png', 'image/jpeg', 'image/webp'];
const MAX_BYTES = 4 * 1024 * 1024;
const LABELS = ['Principal', 'Secundária', 'Costas', 'Lateral', 'Detalhe'];

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Falha ao ler o arquivo.'));
    reader.readAsDataURL(file);
  });
}

export interface ImageUploadProps {
  images: ProductImage[];
  onChange: (images: ProductImage[]) => void;
  /** Texto de apoio opcional (o aviso de variacoes usa o mesmo slot). */
  disabled?: boolean;
  label?: string;
  className?: string;
}

export function ImageUpload({
  images,
  onChange,
  disabled,
  label = 'Galeria de imagens',
  className,
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function ingest(files: File[]) {
    if (files.length === 0) return;
    setError(null);

    const rejected: string[] = [];
    const accepted = files.filter((file) => {
      if (!ACCEPTED.includes(file.type)) {
        rejected.push(file.name);
        return false;
      }
      if (file.size > MAX_BYTES) {
        rejected.push(file.name);
        return false;
      }
      return true;
    });

    if (rejected.length > 0) {
      setError(`Ignorado(s) por formato ou tamanho: ${rejected.join(', ')}.`);
    }
    if (accepted.length === 0) return;

    setBusy(true);
    try {
      const next: ProductImage[] = [];
      for (const file of accepted) {
        const url = await readFileAsDataUrl(file);
        next.push({ id: localId('img'), url, alt: file.name });
      }
      onChange([...images, ...next]);
    } catch {
      setError('Não foi possível ler um dos arquivos.');
    } finally {
      setBusy(false);
    }
  }

  function handleInput(event: ChangeEvent<HTMLInputElement>) {
    void ingest(Array.from(event.target.files ?? []));
    event.target.value = '';
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    if (disabled) return;
    void ingest(Array.from(event.dataTransfer.files ?? []));
  }

  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= images.length) return;
    const next = [...images];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="label-caps">{label}</p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            Aceita PNG, JPG, JPEG e WEBP. A primeira imagem é a principal — use as setas para
            reordenar.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled || busy}
          onClick={() => inputRef.current?.click()}
          className="shrink-0"
        >
          <Upload className="size-3.5" aria-hidden />
          {busy ? 'Lendo…' : 'Enviar Imagem'}
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          multiple
          className="sr-only"
          onChange={handleInput}
        />
      </div>

      <div
        onDragOver={(event) => {
          event.preventDefault();
          if (!disabled) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={cn(
          'rounded-2xl border border-dashed p-3 transition-colors',
          dragging ? 'border-foreground/40 bg-secondary/60' : 'border-border bg-secondary/20',
          disabled && 'opacity-60',
        )}
      >
        {images.length === 0 ? (
          <button
            type="button"
            disabled={disabled}
            onClick={() => inputRef.current?.click()}
            className="focus-ring flex w-full flex-col items-center justify-center gap-2 rounded-xl px-4 py-8 text-center transition-colors hover:bg-background/60"
          >
            <ImagePlus className="size-5 text-muted-foreground" aria-hidden />
            <span className="text-xs text-muted-foreground">
              Arraste imagens aqui ou clique para escolher.
            </span>
          </button>
        ) : (
          <ul className="flex flex-wrap gap-3">
            {images.map((image, index) => (
              <li key={image.id} className="group relative">
                <div className="relative size-24 overflow-hidden rounded-xl border border-border bg-background">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={image.url}
                    alt={image.alt}
                    className="size-full object-cover"
                    loading="lazy"
                  />
                  {index === 0 ? (
                    <span className="absolute left-1 top-1 inline-flex items-center gap-0.5 rounded-full bg-foreground/85 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-background">
                      <Star className="size-2.5" aria-hidden />
                      Principal
                    </span>
                  ) : null}
                </div>

                <div className="mt-1.5 flex items-center justify-between gap-1">
                  <div className="flex items-center gap-0.5">
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => move(index, -1)}
                      aria-label={`Mover ${LABELS[index] ?? image.alt} para a esquerda`}
                      className="focus-ring grid size-6 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-secondary disabled:opacity-30"
                    >
                      <ArrowLeft className="size-3" aria-hidden />
                    </button>
                    <button
                      type="button"
                      disabled={index === images.length - 1}
                      onClick={() => move(index, 1)}
                      aria-label={`Mover ${LABELS[index] ?? image.alt} para a direita`}
                      className="focus-ring grid size-6 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-secondary disabled:opacity-30"
                    >
                      <ArrowRight className="size-3" aria-hidden />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => onChange(images.filter((item) => item.id !== image.id))}
                    aria-label={`Remover ${image.alt}`}
                    className="focus-ring grid size-6 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-danger-surface hover:text-danger"
                  >
                    <Trash2 className="size-3" aria-hidden />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {error ? (
        <p role="alert" className="text-xs font-medium text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
