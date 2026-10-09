import { Ruler, Sparkles } from 'lucide-react';

/**
 * `CLOSET LUNAR IA — Descubra seu tamanho ideal` (print `004027`).
 *
 * ================== O BLOCO E O MESMO DO PAINEL DO CLIENTE, E NAO UMA COPIA ==================
 *
 * Este e o MESMO provador que a Fase 2 entregou em `Minhas Medidas` e nas tres
 * telas de `Provador e IA` — o `lib/provador` ja existe, com `tela` e os
 * `DEMO_*`. Aqui ele aparece como CHAMARISCO, no site: um cartao que convida a
 * cliente a entrar. **Nao ha um segundo provador**: o bloco leva ao que existe.
 *
 * ================== O TEXTO E LITERAL DO ORIGINAL ==================
 *
 * O `SizeFinderSection.tsx` escreve `Closet Lunar IA` (a pilula), `Provador
 * Virtual Inteligente` (o eyebrow), `Descubra seu tamanho ideal` (o titulo, com
 * a quebra depois de `seu`), o paragrafo, `INICIAR PROVADOR`, `100% Privado` e
 * `Análise em Tempo Real`. Transcricao literal, e ela bate com o print.
 *
 * ================== A COR: O ORIGINAL USA HEX CRU, AQUI E TOKEN ==================
 *
 * O original escreve `#FDFBF7`, `#4A3F35`, `#8B7E74` em colchetes. O projeto usa
 * os tokens (`background`, `foreground`, `muted-foreground`) — a mesma conversao
 * da Fase 2. O `#4A3F35` (marrom escuro) do botao e do titulo vira `foreground`;
 * o `#8B7E74` vira `muted-foreground`.
 *
 * ================== O BOTAO NAO ABRE NADA ==================
 *
 * No original ele chama `open()` do `FittingRoomContext`, que monta o provador
 * flutuante. Nesta fase o provador do site ainda nao foi ligado (ele depende do
 * avatar 3D e da camera, que sao a Fase 6 do comando mestre). O botao existe e
 * AVISA — em vez de fingir abrir. Ver a pendencia registrada no STATUS.
 */
export function ProvadorIa({ imagem = '/site/avatar-provador.png' }: { imagem?: string }) {
  return (
    <section className="container mx-auto px-4 py-12 md:py-20">
      <div className="grid items-center gap-8 overflow-hidden rounded-[1.5rem] border border-border/30 bg-background shadow-elegant md:grid-cols-2 md:gap-14 md:rounded-[2.5rem]">
        <div className="relative flex h-full min-h-[350px] items-center justify-center overflow-visible p-6 sm:min-h-[450px] md:min-h-[600px]">
          <div className="relative z-10 flex size-full max-w-[450px] items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imagem}
              alt="Avatar oficial Closet Lunar"
              className="h-[80%] w-full max-h-full object-contain drop-shadow-2xl"
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-br from-secondary to-transparent opacity-50" />

          <div className="absolute left-8 top-8 flex items-center gap-2.5 rounded-full border border-border bg-background/40 px-5 py-2.5 text-[10px] uppercase tracking-[0.3em] text-muted-foreground backdrop-blur-md">
            <Sparkles className="size-3.5" aria-hidden /> Closet Lunar IA
          </div>
        </div>

        <div className="p-8 text-center md:p-14 md:text-left lg:p-20">
          <div className="inline-flex items-center gap-2.5 text-[10px] uppercase tracking-[0.4em] text-muted-foreground/60">
            <Ruler className="size-3.5" aria-hidden /> Provador Virtual Inteligente
          </div>

          <h2 className="mt-4 font-serif text-3xl italic leading-[1.1] text-foreground md:mt-6 md:text-5xl lg:text-6xl">
            Descubra seu
            <br className="hidden md:block" /> tamanho ideal
          </h2>

          <p className="mx-auto mt-8 max-w-md text-base leading-relaxed text-muted-foreground md:mx-0 md:text-lg">
            Informe suas medidas e descubra quais peças combinam melhor com você. Nossa
            inteligência garante o caimento perfeito.
          </p>

          <button
            type="button"
            className="mt-8 inline-flex w-full items-center justify-center gap-3 rounded-full bg-foreground px-10 py-4 text-[10px] font-bold uppercase tracking-[0.25em] text-background shadow-xl transition-all hover:bg-foreground/90 active:scale-95 md:mt-12 md:w-auto md:px-12 md:py-5 md:text-[11px]"
          >
            Iniciar provador <Sparkles className="size-4" aria-hidden />
          </button>

          <div className="mt-10 flex flex-wrap justify-center gap-6 opacity-60 md:justify-start">
            <div className="flex items-center gap-2 text-[9px] uppercase tracking-widest text-muted-foreground">
              <div className="size-1.5 rounded-full bg-muted-foreground" /> 100% Privado
            </div>
            <div className="flex items-center gap-2 text-[9px] uppercase tracking-widest text-muted-foreground">
              <div className="size-1.5 rounded-full bg-muted-foreground" /> Análise em Tempo Real
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
