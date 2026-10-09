'use client';

import { ArrowLeft, ImagePlus, Trash2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Field, Input, Select } from '@/components/ui/form';
import { cn } from '@/lib/utils';
import {
  PIECE_PENDING_LABEL,
  PIECE_SECTION_DESCRIPTION,
  PIECE_SECTION_TITLE,
  PIECE_TIP,
} from '@/lib/provador/demo';
import type { Category, Product } from '@/lib/produtos/types';
import { PIECE_VIEWS } from '@/lib/provador/types';
import type { PieceConfig, PiecePosition, PieceView } from '@/lib/provador/types';

/**
 * A CONFIGURACAO DE UMA PECA — o bloco `Provador Virtual — Imagens das peças`.
 *
 * ================== ELE E O MESMO COMPONENTE EM DUAS TELAS ==================
 *
 * O bloco aparece em DUAS rotas, com o texto literalmente igual:
 *
 *   /admin/avatar-virtual    aba `VINCULAR PRODUTOS`   (adm-042)
 *   /admin/provador-virtual  aba `IMAGENS DAS PEÇAS`   (adm-043/046)
 *
 * Mesma busca, mesmos campos (`CATEGORIA DA PEÇA`, `CAMADA (ORDEM)`, `POSIÇÃO`),
 * mesmas tres colunas (`FRENTE`, `LADO`, `COSTAS`), mesma dica no rodape. E por
 * isso que as tres telas deste modulo dividem um diretorio em `lib/`: duas copias
 * divergiriam no primeiro ajuste.
 *
 * ================== O CABECALHO TEM TITULO E DESCRICAO PROPRIOS ==================
 *
 * Ele NAO e o titulo da pagina: e o cabecalho DESTA SECAO, com o titulo serifado
 * `Provador Virtual — Imagens das peças` e a descricao do PNG. Conferido em
 * `235547.png` e `235557.png`.
 *
 * ================== O QUE ELE NAO FAZ ==================
 *
 * NAO faz upload. O `ENVIAR PNG TRANSPARENTE` do print precisa de um bucket, que
 * esta fora do escopo desta fase — entao ele fica DESABILITADO e explica por que.
 * O campo `ou cole uma URL` abaixo dele E funcional: colar um endereco mostra a
 * imagem na hora, que e o que este componente consegue honrar hoje.
 */
export function PieceConfigPanel({
  config,
  product,
  categories,
  positionOptions,
  onChange,
  onClear,
  className,
}: {
  config: PieceConfig | null;
  product: Product | null;
  categories: Category[];
  positionOptions: { value: PiecePosition; label: string }[];
  onChange: (config: PieceConfig) => void;
  onClear: () => void;
  className?: string;
}) {
  if (!config) {
    return (
      <div
        className={cn(
          'surface-flat flex flex-col items-center justify-center gap-3 px-6 py-20 text-center',
          className,
        )}
      >
        <span className="text-muted-foreground">
          <ArrowLeft className="size-5" aria-hidden />
        </span>
        <p className="text-sm font-medium text-muted-foreground">
          Selecione um produto para configurar.
        </p>
      </div>
    );
  }

  const atualizar = (patch: Partial<PieceConfig>) => onChange({ ...config, ...patch });

  return (
    <div className={cn('surface-flat flex flex-col', className)}>
      <header className="border-b border-border/60 px-6 py-5">
        <h3 className="font-serif text-xl leading-tight">{PIECE_SECTION_TITLE}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{PIECE_SECTION_DESCRIPTION}</p>
      </header>

      <div className="flex flex-col gap-6 px-6 py-5">
        {/**
         * O PRODUTO DE PARTIDA — o nome da peca em destaque. O print o mostra
         * selecionado na lista da esquerda E o cabecalho da secao confirma qual e.
         */}
        <div className="flex items-center justify-between gap-3 rounded-xl bg-secondary/50 px-4 py-3">
          <span className="min-w-0 truncate text-sm font-bold">{product?.name ?? '—'}</span>
          <Button variant="ghost" size="sm" onClick={onClear} className="shrink-0 text-[10px]">
            <Trash2 className="size-3.5" aria-hidden />
            Fechar
          </Button>
        </div>

        <div className="grid gap-x-6 gap-y-5 sm:grid-cols-3">
          <Select
            label="Categoria da peça"
            value={config.categoryId}
            onChange={(event) => atualizar({ categoryId: event.target.value })}
            options={categories.map((category) => ({ value: category.id, label: category.name }))}
          />
          {/**
           * `CAMADA (ORDEM)` E NUMERO, e nao texto: `type="number"` com `min` 1.
           * O print mostra `3`. Camada `0` nao significa nada — a peca ou esta
           * acima de alguma coisa, ou e a primeira.
           */}
          <Input
            label="Camada (ordem)"
            type="number"
            min={1}
            inputMode="numeric"
            value={config.layer}
            onChange={(event) => atualizar({ layer: Number(event.target.value) })}
          />
          <Select
            label="Posição"
            value={config.position}
            onChange={(event) => atualizar({ position: event.target.value as PiecePosition })}
            options={positionOptions.map((option) => ({
              value: option.value,
              label: option.label,
            }))}
          />
        </div>

        {/**
         * AS TRES VISTAS — as colunas `FRENTE`, `LADO`, `COSTAS`.
         *
         * O estado vazio NAO e um vazio comum: dentro de cada quadro aparece o
         * aviso `IMAGEM DO PROVADOR PENDENTE`. Ele fica escrito UMA vez em
         * `demo.ts` e serve as tres colunas — tres copias divergiriam.
         */}
        <div className="grid gap-5 sm:grid-cols-3">
          {PIECE_VIEWS.map((view) => (
            <ViewSlot
              key={view}
              view={view}
              url={config.views[view]}
              onChange={(url) => atualizar({ views: { ...config.views, [view]: url } })}
            />
          ))}
        </div>

        {/**
         * OS DOIS BOTOES DO RODAPE — `SALVAR IMAGENS` (tinta) e `REMOVER CATEGORIA`
         * (contorno vermelho). Conferido em `235547.png`.
         *
         * `SALVAR IMAGENS` fica HABILITADO, e a gravacao nao acontece: a tela usa o
         * valor e avisa que ele nao foi persistido (`data.ts`, `WriteResult`).
         * DESABILITAR esconderia a acao central de um modulo cujo trabalho E
         * preencher as imagens — a pessoa nao teria como nem ver o efeito.
         */}
        <div className="flex flex-wrap items-center gap-3">
          <Button size="md" onClick={() => onChange(config)}>
            Salvar imagens
          </Button>
          <Button variant="outline" size="md" onClick={onClear} className="border-danger/40 text-danger hover:bg-danger-surface/60">
            Remover categoria
          </Button>
        </div>

        <p className="rounded-xl bg-secondary/40 px-4 py-3 text-xs leading-relaxed text-muted-foreground">
          <span className="font-bold text-foreground">Dica: </span>
          {PIECE_TIP.replace(/^Dica:\s*/, '')}
        </p>
      </div>
    </div>
  );
}

/**
 * UMA DAS TRES VISTAS — quadro da imagem + `ENVIAR PNG TRANSPARENTE` + URL.
 *
 * A ORDEM VERTICAL E A DO PRINT (`235547.png`): quadro grande, depois o botao de
 * envio ocupando a largura, e por ultimo o campo `ou cole uma URL`.
 */
function ViewSlot({
  view,
  url,
  onChange,
}: {
  view: PieceView;
  url: string;
  onChange: (url: string) => void;
}) {
  const preenchida = url.trim().length > 0;
  return (
    <div className="flex flex-col">
      <span className="label-caps mb-2">{view}</span>

      <div className="grid aspect-[3/4] place-items-center overflow-hidden rounded-t-2xl border border-b-0 border-border bg-muted/40 px-3 text-center">
        {preenchida ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={url} alt={`Peça — vista ${view}`} className="max-h-full object-contain" />
        ) : (
          <span className="flex flex-col items-center gap-2 text-muted-foreground">
            <ImagePlus className="size-5" aria-hidden />
            <span className="text-[11px] font-bold uppercase leading-tight tracking-[0.1em]">
              {PIECE_PENDING_LABEL}
            </span>
          </span>
        )}
      </div>

      {/**
       * O BOTAO OCUPA A LARGURA TODA e fica COLADO ao quadro (por isso o
       * `border-b-0` acima): no print os dois formam um bloco so, com o botao
       * funcionando como a barra de acao daquela vista.
       *
       * ELE FICA DESABILITADO: precisa do storage, que esta fora do escopo. Um
       * botao de envio que abre o seletor de arquivo e nao envia nada seria pior
       * que um botao apagado.
       */}
      <button
        type="button"
        disabled
        title="O envio depende do storage, que ainda não está conectado nesta fase."
        className="flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-b-2xl border border-border bg-secondary/50 px-3 py-2.5 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground/70"
      >
        <Upload className="size-3.5" aria-hidden />
        Enviar PNG transparente
      </button>

      <Field className="mt-2">
        <Input
          value={url}
          onChange={(event) => onChange(event.target.value)}
          placeholder="ou cole uma URL"
          aria-label={`URL da imagem — vista ${view}`}
          className="h-9 px-3 text-xs"
        />
      </Field>
    </div>
  );
}
