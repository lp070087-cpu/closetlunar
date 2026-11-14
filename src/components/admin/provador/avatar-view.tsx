'use client';

import { useState } from 'react';
import { CircleAlert, ImagePlus, Lightbulb, Save, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, SectionHeader } from '@/components/ui/card';
import { SegmentedTabs } from '@/components/ui/tabs';
import { AvatarPreview } from './avatar-preview';
import { PieceWorkspace } from './piece-workspace';
import { shortUrl } from '@/lib/provador/metrics';
import { saveAvatar } from '@/lib/provador/data';
import { ACCEPT_IMAGEM, enviarImagem } from '@/lib/site/upload';
import type { Category, Product } from '@/lib/produtos/types';
import type { AvatarSettings, PieceDefaults, PiecePosition } from '@/lib/provador/types';

type Aba = 'imagens' | 'vincular';

/**
 * AS DUAS ABAS DE `Avatar Virtual` — adm-038/039 (imagens) e adm-041/042 (vinculo).
 *
 * ================== AS ABAS SAO `SegmentedTabs` ==================
 *
 * Conferido no pixel (`235503.png`): trilho claro arredondado com `IMAGENS DO
 * AVATAR` em pilula PRETA e `VINCULAR PRODUTOS` em texto solto dentro do trilho,
 * sem borda propria. E exatamente o `SegmentedTabs` de `components/ui/tabs.tsx` —
 * o componente compartilhado, e nao um novo.
 *
 * ================== A ABA 2 E O MESMO COMPONENTE DE `Provador Virtual` ==================
 *
 * `VINCULAR PRODUTOS` aqui e `IMAGENS DAS PEÇAS` la: mesma secao, mesmos campos,
 * mesmas tres colunas. As duas telas usam `PieceConfigPanel` — ver a nota nele, e
 * a razao de as tres telas deste modulo dividirem um diretorio em `lib/`.
 *
 * ================== A DESCRICAO VEM DO PRINT ==================
 *
 *   `Identidade visual oficial e gerenciamento de peças do avatar Closet Lunar.`
 *
 * Com `Lunar`, e nao `Lunnar`. E a grafia do material, e o material manda — o
 * placeholder dizia `Configure o avatar usado no provador virtual.`, que nao esta
 * em print nenhum.
 */
export function AvatarView({
  avatar,
  products,
  categories,
  pieceDefaults,
  positionOptions,
}: {
  avatar: AvatarSettings;
  products: Product[];
  categories: Category[];
  pieceDefaults: PieceDefaults;
  positionOptions: { value: PiecePosition; label: string }[];
}) {
  const [aba, setAba] = useState<Aba>('imagens');
  const [av, setAv] = useState<AvatarSettings>(avatar);
  const [enviando, setEnviando] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const pendentes = av.slots.filter((slot) => !slot.url?.trim()).length;

  async function trocarSlot(key: string, url: string | null) {
    const novo = { ...av, slots: av.slots.map((s) => (s.key === key ? { ...s, url } : s)) };
    setAv(novo);
    const r = await saveAvatar(novo);
    setMsg(r.persisted ? (url ? 'Imagem do avatar salva.' : 'Imagem removida.') : r.reason ?? 'Não foi possível salvar.');
  }

  function escolherArquivo(key: string) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = ACCEPT_IMAGEM;
    input.onchange = async () => {
      const f = input.files?.[0];
      if (!f) return;
      setEnviando(key);
      try {
        await trocarSlot(key, await enviarImagem(f));
      } catch (e) {
        setMsg((e as Error).message);
      } finally {
        setEnviando(null);
      }
    };
    input.click();
  }

  return (
    <div className="flex flex-col gap-6">
      <SectionHeader
        title="Avatar Virtual"
        description="Identidade visual oficial e gerenciamento de peças do avatar Closet Lunar."
      />

      <SegmentedTabs
        items={[
          { value: 'imagens' as Aba, label: 'Imagens do avatar' },
          { value: 'vincular' as Aba, label: 'Vincular produtos' },
        ]}
        value={aba}
        onChange={setAba}
      />

      {aba === 'imagens' ? (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_26rem]">
          <Card className="p-6">
            <header className="mb-5">
              <h3 className="font-serif text-xl leading-tight">Gerenciador de Avatar</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Prévia ilustrativa em 2D. O envio e salvamento de imagens dependem do storage.
                A rotação 3D requer um modelo e um visualizador ainda não disponíveis.
              </p>
            </header>

            <ul className="flex flex-col gap-3">
              {msg ? <p role="status" className="rounded-xl bg-secondary/50 p-3 text-xs">{msg}</p> : null}
              {av.slots.map((slot) => (
                <li
                  key={slot.key}
                  className="flex flex-wrap items-center gap-4 rounded-2xl border border-border/70 bg-background px-4 py-3"
                >
                  <span className="grid size-12 shrink-0 place-items-center overflow-hidden rounded-xl border border-border/60 bg-muted/40">
                    {slot.url ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={slot.url} alt="" className="size-full object-cover" />
                    ) : (
                      <ImagePlus className="size-4 text-muted-foreground" aria-hidden />
                    )}
                  </span>
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="text-[11px] font-bold uppercase tracking-[0.14em]">
                      {slot.label}
                    </span>
                    {/**
                     * A URL E TEXTO, NAO CAMPO — e o print mostra por que: a linha
                     * traz a URL ja truncada com `...`, que e o que um `<input>`
                     * faria sozinho. Quem troca a imagem e o `SUBSTITUIR` ao lado,
                     * que abre o seletor de arquivo do storage.
                     */}
                    <span className="truncate text-[11px] text-muted-foreground">
                      {slot.url ? shortUrl(slot.url) : 'Nenhuma imagem cadastrada'}
                    </span>
                  </div>
                  {/**
                   * `SUBSTITUIR` FICA DESABILITADO — e sem o `onClick` que nao
                   * existe. Ele abriria o seletor de arquivo do storage, que esta
                   * fora do escopo desta fase; um botao que abre uma janela e nao
                   * envia nada seria pior que um botao apagado. O `title` diz por
                   * que, em vez de deixar a pessoa clicando no escuro.
                   */}
                  <Button size="sm" disabled={enviando === slot.key} onClick={() => escolherArquivo(slot.key)}>
                    {enviando === slot.key ? 'Enviando…' : slot.url ? 'Substituir' : 'Enviar PNG'}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    disabled={!slot.url}
                    onClick={() => void trocarSlot(slot.key, null)}
                    aria-label={`Remover ${slot.label}`}
                    className="text-danger"
                  >
                    <Trash2 className="size-4" aria-hidden />
                  </Button>
                </li>
              ))}
            </ul>

            {/**
             * A CAIXA AZUL — `Recomendamos o uso de imagens PNG com fundo
             * transparente para garantir um visual premium sobre o fundo escuro do
             * provador.` (adm-039), com o icone de lampada laranja.
             *
             * O azul e um token `info` novo no design system (ver `globals.css`):
             * nao existia — `warning` e ambar, `accent` e rosa, e ciano daria
             * verde. Escrito uma vez como padrao, para as outras telas de conteudo
             * usarem a mesma caixa.
             */}
            <p className="mt-5 flex items-start gap-3 rounded-2xl border border-info-border bg-info-surface px-4 py-3.5 text-xs leading-relaxed text-info-foreground">
              <Lightbulb className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden />
              Recomendamos o uso de imagens PNG com fundo transparente para garantir um visual
              premium sobre o fundo escuro do provador.
            </p>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-5">
              {/**
               * O AVISO DE PENDENCIA ACOMPANHA O DADO — o print tem os dois textos.
               *
               * O print (`235511.png`) mostra `Nenhuma alteração pendente` porque as
               * cinco imagens estao preenchidas. Aqui elas estao VAZIAS (nao ha
               * bucket nosso), e escrever "nenhuma alteracao" com cinco slots em
               * branco seria a tela mentindo sobre o proprio estado. Cada um dos
               * dois textos aparece quando e verdade.
               */}
              {pendentes > 0 ? (
                <span className="inline-flex items-center gap-2 text-[11px] font-medium text-warning-foreground">
                  <CircleAlert className="size-3.5 shrink-0" aria-hidden />
                  {pendentes} de {av.slots.length} imagens pendentes
                </span>
              ) : (
                <span className="text-[11px] font-medium text-muted-foreground">
                  Nenhuma alteração pendente
                </span>
              )}
              {/**
               * `SALVAR ALTERAÇÕES` FICA DESABILITADO — e o print concorda.
               *
               * adm-039 mostra o botao apagado, logo abaixo do aviso `Nenhuma
               * alteração pendente`: sem alteracao, nao ha o que salvar. Aqui ele
               * tambem esta apagado, e pelos dois motivos somados — sem bucket e
               * sem alteracao. Honesto nos dois sentidos: habilitado, prometeria
               * uma gravacao que nao existe.
               */}
              <Button size="md" disabled>
                <Save className="size-3.5" aria-hidden />
                Salvar alterações
              </Button>
            </div>
          </Card>

          <AvatarPreview avatar={av} />
        </div>
      ) : (
        <PieceWorkspace
          products={products}
          categories={categories}
          pieceDefaults={pieceDefaults}
          positionOptions={positionOptions}
        />
      )}
    </div>
  );
}
