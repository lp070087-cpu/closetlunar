'use client';

import { useState } from 'react';
import { Layers, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { VIEW_SHORT_LABELS } from '@/lib/provador/demo';
import type { AvatarSettings, AvatarSlotKey } from '@/lib/provador/types';

/**
 * O PAINEL PRETO DE PREVIEW — a coluna direita de adm-038/039.
 *
 * A coluna inteira E a superficie escura: a foto, as medidas, o `ARRASTE PARA
 * GIRAR`, as quatro vistas e o selo de tempo real ficam TODOS dentro do mesmo
 * retangulo preto arredondado, e nao num cartao branco com um bloco preto dentro.
 *
 * ================== O QUE ELE MOSTRA QUANDO NAO HA IMAGEM ==================
 *
 * Nao ha imagem nenhuma (ver `demo.ts`: as URLs sao `null` porque nao existe
 * bucket nosso), e este e o estado desenhado. O QUE NAO SE FAZ: preencher com um
 * manequim generico para a tela parecer igual ao print. O print tem uma FOTO; um
 * desenho no lugar seria inventar um ativo, e quando a foto real entrasse ela
 * disputaria espaco com o desenho.
 *
 * No lugar fica o quadro vazio com o rotulo da vista — o mesmo vazio que a secao
 * Provador ja usa (`IMAGEM DO PROVADOR PENDENTE`). Um vazio so, com um nome so,
 * nas duas telas.
 *
 * ================== O QUE ELE NAO FAZ ==================
 *
 * NAO gira. `ARRASTE PARA GIRAR` e o convite do visualizador original, que rodava
 * um modelo 3D; o texto aparece porque esta no print, mas o painel troca de vista
 * por BOTAO — as quatro vistas cadastradas —, que e o que este componente sabe
 * fazer. Girar de verdade depende de um visualizador 3D, que nao existe nesta
 * fase.
 */
export function AvatarPreview({ avatar }: { avatar: AvatarSettings }) {
  const [vista, setVista] = useState<AvatarSlotKey>('frente');

  /**
   * AS QUATRO VISTAS DO PREVIEW SAO UM SUBCONJUNTO DOS CINCO SLOTS.
   *
   * `AVATAR 360°` existe no cadastro (adm-038) e NAO vira botao aqui: ele nao e um
   * angulo, e o conjunto dos angulos.
   *
   * ================== O ROTULO CURTO NAO E O DO CADASTRO ==================
   *
   * O cadastro e o preview escrevem o mesmo slot de dois jeitos, e os dois estao no
   * material: `AVATAR LADO DIREITO` em adm-038/039, e `DIREITA` no botao de
   * adm-039. Derivar o botao do rotulo do cadastro (`replace('Avatar ','')`) dava
   * `LADO DIREITO` — que nao esta em print nenhum. Os dois textos vao transcritos
   * em `VIEW_SHORT_LABELS`, longe daqui, e a bancada confere os quatro.
   */
  const vistas = avatar.slots
    .filter((slot) => slot.key !== 'g360')
    .map((slot) => ({ value: slot.key, label: VIEW_SHORT_LABELS[slot.key] ?? slot.key }));
  const slotAtual = avatar.slots.find((slot) => slot.key === vista) ?? avatar.slots[0];

  return (
    <div className="relative flex min-h-[34rem] flex-col overflow-hidden rounded-3xl bg-foreground">
      {/* A FOTO (ou o vazio dela). `flex-1` para o rodape ficar colado embaixo. */}
      <div className="relative grid flex-1 place-items-center px-6 py-10">
        {slotAtual?.url ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={slotAtual.url}
            alt={`Avatar — ${slotAtual.label}`}
            className="max-h-[26rem] w-auto object-contain"
          />
        ) : (
          <div className="flex flex-col items-center gap-3 text-center">
            <span className="grid size-14 place-items-center rounded-2xl bg-background/10 text-background/70">
              <Layers className="size-6" aria-hidden />
            </span>
            <p className="font-serif text-base text-background/85">{slotAtual?.label}</p>
            <p className="max-w-[16rem] text-xs leading-relaxed text-background/50">
              Nenhuma imagem cadastrada nesta vista.
            </p>
          </div>
        )}

        {/**
         * AS TRES MEDIDAS FLUTUAM SOBRE O QUADRO, cada uma no seu lugar, com uma
         * linha-guia ate o corpo — como no print, onde `BUSTO` fica alto a
         * direita, `CINTURA` no meio a esquerda e `QUADRIL` embaixo a direita.
         *
         * Elas NAO sao editaveis (ver `demo.ts`): o material mostra os numeros,
         * nao o formulario que os produz.
         */}
        <dl className="pointer-events-none absolute inset-0 hidden sm:block">
          {avatar.measures.map((medida, indice) => (
            <div
              key={medida.key}
              className={cn(
                'absolute flex items-baseline gap-2',
                indice === 0 && 'right-6 top-[26%] flex-col items-end',
                indice === 1 && 'left-6 top-[46%] flex-col items-start',
                indice === 2 && 'bottom-[22%] right-6 flex-col items-end',
              )}
            >
              <dt className="text-[10px] font-bold uppercase tracking-[0.2em] text-background/45">
                {medida.label}
              </dt>
              <dd className="font-serif text-lg tabular-nums text-background/90">
                {medida.value}
                <span className="ml-1 text-xs tracking-wide text-background/55">
                  {medida.unit}
                </span>
              </dd>
            </div>
          ))}
        </dl>

        {/**
         * A LISTA DE MEDIDAS PARA TELA ESTREITA — as posicoes absolutas acima
         * precisam de largura, e no celular elas se sobrepoem. Aqui os mesmos
         * dados saem em linha, no rodape do quadro.
         */}
        <dl className="absolute inset-x-6 bottom-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-1 sm:hidden">
          {avatar.measures.map((medida) => (
            <div key={medida.key} className="flex items-baseline gap-1.5">
              <dt className="text-[9px] font-bold uppercase tracking-[0.16em] text-background/45">
                {medida.label}
              </dt>
              <dd className="font-serif text-sm tabular-nums text-background/85">
                {medida.value} {medida.unit}
              </dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="flex flex-col items-center gap-4 px-6 pb-6">
        <span className="inline-flex items-center gap-2 rounded-full border border-background/15 px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-background/55">
          <RotateCcw className="size-3" aria-hidden />
          Arraste para girar
        </span>

        {/**
         * AS QUATRO VISTAS — pilulas claras sobre o preto. Ativa = preenchida de
         * branco; inativa = contorno claro. `aria-pressed` e o que a bancada le.
         */}
        <div role="group" className="flex flex-wrap items-center justify-center gap-2">
          {vistas.map((item) => {
            const ativo = item.value === vista;
            return (
              <button
                key={item.value}
                type="button"
                aria-pressed={ativo}
                onClick={() => setVista(item.value)}
                className={cn(
                  'focus-ring rounded-full px-4 py-2 text-[10px] font-bold uppercase tracking-[0.16em] transition-colors duration-200',
                  ativo
                    ? 'bg-background text-foreground'
                    : 'border border-background/20 text-background/60 hover:text-background',
                )}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        <span className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-background/45">
          <span className="size-1.5 rounded-full bg-success" aria-hidden />
          Preview em tempo real
        </span>
      </div>
    </div>
  );
}
