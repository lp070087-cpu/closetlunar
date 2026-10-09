'use client';

import { useRef, useState, type ChangeEvent, type DragEvent } from 'react';
import { Upload } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * O CAMPO DE IMAGEM dos formularios deste grupo — o modal `Novo Banner` (adm-052)
 * e o `Novo look` (adm-062).
 *
 * ================== MEDIDO NO PRINT ==================
 *
 * Os dois modais usam a MESMA peca: uma caixa de borda TRACEJADA, alta, com um icone
 * de upload no meio e a legenda `CLIQUE PARA ENVIAR` (caixa alta, minuscula, espacada).
 * Abaixo, FORA da caixa, o texto `Ou cole a URL`.
 *
 *   caixa desktop   largura ~ do campo, altura ~70px
 *   legenda         ~10px, caixa alta, `muted-foreground`
 *   rotulo acima    `IMAGEM DESKTOP (PRINCIPAL)` / `IMAGEM MOBILE (OPCIONAL)`
 *
 * Concluido tambem: quando HA imagem, a caixa mostra a PREVIA no lugar do icone e
 * ganha `Trocar`; o print inicial mostra os dois campos vazios, entao essa parte e a
 * continuacao natural do mesmo desenho, e nao um desenho novo. O que NAO se inventou
 * foi botao de remover com texto proprio — o `Trocar`/`Remover` fica no mesmo lugar
 * da legenda, como os outros campos do painel fazem.
 *
 * ================== O QUE ESTE COMPONENTE NAO E ==================
 *
 * Nao e o `ImageUpload` de Produtos. Aquele e uma GALERIA (`ProductImage[]`, com
 * reordenacao por setas, selo `Principal` e varios rotulos) e serve a outro print.
 * Reaproveita-lo aqui exigiria passar uma lista de um item e esconder os controles de
 * ordem — mudar o componente para servir a duas telas, que e o que o Provador recusou.
 *
 * NADA E ENVIADO A SERVIDOR. O arquivo vira `data:` e vive no estado, exatamente como
 * em Produtos e Categorias. O ponto de troca, quando o storage existir, e `readAsDataUrl`.
 */

const ACCEPTED = ['image/png', 'image/jpeg', 'image/webp'];
const MAX_BYTES = 4 * 1024 * 1024;

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Falha ao ler o arquivo.'));
    reader.readAsDataURL(file);
  });
}

export function ImageDropField({
  label,
  value,
  onChange,
  onError,
  cta = 'CLIQUE PARA ENVIAR',
}: {
  label: string;
  /** Data-URL ou URL; string vazia = vazio. */
  value: string;
  onChange: (url: string) => void;
  onError: (message: string) => void;
  cta?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  async function accept(file: File | undefined) {
    if (!file) return;
    if (!ACCEPTED.includes(file.type)) {
      onError('Formato não aceito. Use PNG, JPG, JPEG ou WEBP.');
      return;
    }
    if (file.size > MAX_BYTES) {
      onError('A imagem passa de 4 MB.');
      return;
    }
    try {
      onChange(await readAsDataUrl(file));
    } catch {
      onError('Falha ao ler o arquivo.');
    }
  }

  function handleInput(event: ChangeEvent<HTMLInputElement>) {
    void accept(event.target.files?.[0]);
    // Permite escolher o MESMO arquivo duas vezes: sem limpar o valor, o segundo
    // `change` nao dispara e o botao parece morto.
    event.target.value = '';
  }

  function handleDrop(event: DragEvent<HTMLButtonElement>) {
    event.preventDefault();
    setDragging(false);
    void accept(event.dataTransfer.files?.[0]);
  }

  const filled = value.trim() !== '';

  return (
    <div className="flex flex-col gap-1.5">
      <span className="label-caps">{label}</span>

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={cn(
          'focus-ring flex h-16 items-center justify-center gap-2 overflow-hidden rounded-xl border border-dashed transition-colors',
          dragging ? 'border-foreground bg-secondary/50' : 'border-border bg-background hover:bg-secondary/40',
        )}
      >
        {filled ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="" className="size-full object-cover" />
        ) : (
          <span className="flex flex-col items-center gap-1 text-muted-foreground">
            <Upload className="size-4" aria-hidden />
            <span className="text-[10px] font-semibold tracking-[0.14em]">{cta}</span>
          </span>
        )}
      </button>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED.join(',')}
        onChange={handleInput}
        className="sr-only"
        tabIndex={-1}
        aria-hidden
      />

      <ImageUrlField
        hint="Ou cole a URL"
        value={value.startsWith('data:') ? '' : value}
        onChange={onChange}
      />

      {filled ? (
        <button
          type="button"
          onClick={() => onChange('')}
          className="focus-ring self-start rounded-md text-[11px] text-muted-foreground underline underline-offset-4 transition-colors hover:text-foreground"
        >
          Remover imagem
        </button>
      ) : null}
    </div>
  );
}

/**
 * O CAMPO `Ou cole a URL` — um input comum.
 *
 * ================== POR QUE A URL NAO APARECE QUANDO HA ARQUIVO ==================
 *
 * A imagem enviada vira uma data-URL de alguns milhares de caracteres. Jogar isso
 * dentro do input faz o campo mostrar um paredao de texto base64, e a pessoa perde a
 * referencia do que digitou.
 *
 * Entao quando `value` e `data:`, o input aparece VAZIO com o placeholder `Ou cole a
 * URL` — que e exatamente o que o print mostra em repouso. E a mesma escolha do
 * campo de upload de Produtos, e a razao esta registrada aqui porque nao e obvia.
 */
export function ImageUrlField({
  value,
  onChange,
  hint,
}: {
  value: string;
  onChange: (url: string) => void;
  hint: string;
}) {
  return (
    <input
      type="url"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={hint}
      aria-label={hint}
      className="focus-ring h-9 rounded-lg border border-input bg-background px-3 text-xs text-foreground transition-colors placeholder:text-muted-foreground/70 hover:border-border"
    />
  );
}
