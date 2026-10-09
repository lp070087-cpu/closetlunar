'use client';

import { useEffect, useState } from 'react';
import { Copy, Ticket } from 'lucide-react';
import { listCupons } from '@/lib/cliente/data';
import { cupomFechado, expirou, rotuloCupom, validadeCurta } from '@/lib/cliente/metrics';
import { formatBRL } from '@/lib/utils';
import type { CupomCliente } from '@/lib/cliente/types';
import { ClienteToast, type TomAviso } from './cliente-toast';

/**
 * `Cupons` — `/conta/cupons`, o print `cli-015` (`004841`).
 *
 * ================== O CABECALHO DESTA TELA E PROPRIO ==================
 *
 * Como em `Endereços`, `Minhas Medidas` e `Clube VIP & Cashback`, o cabecalho
 * NAO usa o `ClientPageHeader`: o original o declara como o PRIMEIRO filho de um
 * `space-y-8`, e o componente compartilhado carrega `mb-6` — que somado ao
 * `space-y-8` daria 56 px entre o titulo e a grade, onde o print mostra 32.
 * Ver a nota longa em `addresses-view.tsx`, que e onde a decisao foi tomada.
 *
 * ================== O TITULO DIZ `Meus Cupons`, E A COLUNA DIZ `Cupons` ==================
 *
 * O `<h2>` do original e `Meus Cupons`; o item do menu lateral e `Cupons`. Os
 * dois convivem desde o modulo 1 (`nav.ts` guarda as duas listas justamente por
 * isso, e o atalho do rodape usa `Meus Cupons`). Nada a reconciliar.
 *
 * ================== A CONSULTA E POR `is_active`, E O ESCURECIMENTO E POR VALIDADE ==================
 *
 * Sao duas perguntas diferentes, e o material responde as duas:
 *
 *   `.eq("is_active", true)`  ->  o que ENTRA na lista. E o mesmo filtro do
 *                                 cartao `Cupons ativos` do dashboard.
 *   `expired || exhausted`    ->  o que fica `opacity-60 grayscale`.
 *
 * O `CLOSET10` do material passa pelo primeiro filtro e cai no segundo: ele
 * aparece no dashboard (`004603`) E escurecido aqui (`004841`), com dois minutos
 * de diferenca entre as capturas. Um filtro por validade nao produziria os dois
 * estados. Ver a nota de `cupomFechado` em `metrics.ts`.
 *
 * ================== O RELOGIO E O DO NAVEGADOR, E ELE E O UNICO DO MODULO ==================
 *
 * `cupomFechado` recebe `agora` por parametro — a regra e pura. Quem le o
 * relogio e ESTA tela, num `useEffect`, e nao `new Date()` no corpo do
 * componente: ler o relogio durante a renderizacao faria o HTML do servidor e o
 * do cliente discordarem sobre o que ja venceu, que e a divergencia de
 * hidratacao classica. Ver a nota no topo de `metrics.ts`.
 *
 * ================== AS TINTAS `beige` — A MESMA CONVERSAO DOS OUTROS MODULOS ==================
 *
 * O original pinta QUATRO pontos de beige aqui: a caixa vazia (`bg-beige/5`), o
 * circulo do icone (`bg-beige/20`), o quadrado do cartao (`bg-beige/30`) e o
 * quadrado do codigo (`bg-beige/20`, o de borda tracejada). O token `beige` NAO
 * EXISTE neste projeto, e a tinta real e quase invisivel — o `Favoritos` mediu
 * 5% e 20% de `oklch(0.95 0.018 70)` sobre branco como (255,254,254) /
 * (253,251,249), ou seja 1 a 2 unidades.
 *
 * A conversao e a que a area ja usa, e nao uma nova:
 *
 *   caixa vazia (`bg-beige/5`)      ->  SEM fundo (o `Pedidos` mantem `secondary/5`)
 *   circulo (`bg-beige/20`)         ->  `bg-secondary/40`
 *   quadrado do cartao (`bg-beige/30`)  ->  `bg-secondary/30`
 *   quadrado do codigo (`bg-beige/20`)  ->  `bg-secondary/20`
 *
 * Os quatro estao em `PAINEL-CLIENTE-STATUS.md`, com a medicao de origem.
 *
 * ================== A COPIA COPIA DE VERDADE, E POR QUE AQUI SIM ==================
 *
 * No cartao do dashboard a seta NAO copia, e a nota de `cupons-ativos-card.tsx`
 * diz por que: la a seta leva para uma lista, e a copia daquele cartao nao tem
 * confirmacao propria.
 *
 * Aqui e diferente, e a diferenca e concreta: o original declara um botao com
 * `aria-label="Copiar"` e `onClick={() => copy(c.code)}`, e a funcao `copy`
 * chama `navigator.clipboard.writeText`. **Nao ha banco nessa operacao.** A area
 * proibe INVENTAR persistencia; ela nao proibe uma API do navegador que existe e
 * faz exatamente o que o botao promete. Copiar o codigo para a area de
 * transferencia funciona hoje, sem Neon, e o aviso `Cupom CLOSET10 copiado`
 * confirma um fato que aconteceu — diferente do `Endereço salvo`, que afirmaria
 * uma gravacao que nao houve.
 *
 * O `void` antes da chamada, e nao um `await`: o original tambem nao espera, e a
 * promessa do `writeText` pode ser rejeitada em contexto nao seguro (http). Um
 * `catch` mudo evita que a rejeicao vire erro nao tratado; o aviso continua
 * saindo, porque a intencao de copiar foi cumprida.
 *
 * O botao de copiar continua com `disabled={fechado}` e `disabled:hidden`, como
 * o original: no cartao vencido ele simplesmente nao aparece, e e por isso que o
 * print `cli-015` nao o mostra.
 *
 * ================== O QUE NAO FOI TRANSCRITO, E NAO E INVENCAO ==================
 *
 * O `Mínimo:` da linha de meta NAO aparece no print — verificado por medida: a
 * linha de tinta do `EXPIRA EM: 20/08/2026   EXPIRADO` comeca em x=383 e termina
 * em x=598, dentro de um cartao que vai de x=350 a x=1404. Nao ha espaco nem
 * tinta para um terceiro termo. O ramo existe no codigo porque `min_subtotal` e
 * uma coluna real de `coupons` e o admin a edita; ele desenha quando o valor e
 * maior que zero. No material ele e ZERO.
 *
 * E a razao de ele ser zero esta no PROPRIO original: o formulario de cupom do
 * admin abre com `min_subtotal: 0` (linha 4139 de `admin.tsx`), a tabela do
 * admin imprime `—` para zero (linha 4345), e `formatMinSubtotal` existe
 * exatamente para isso. Dois zeros na mesma sessao de captura e o que o material
 * mostra; um `R$ 150,00` nao esta em fonte nenhuma.
 */

/** Passa a data pela regra pura e devolve o veredito do cartao. */
export function cartaoFechado(cupom: CupomCliente, agora: Date): boolean {
  return cupomFechado(cupom, agora);
}

/**
 * O CARTAO DE CUPOM — um cupom, com os dois estados num componente so.
 *
 * Ele esta exportado para a bancada poder MONTA-LO. E importante por um motivo
 * de material: o print `cli-015` so mostra o estado FECHADO (o cupom vencido,
 * escurecido, sem botao de copiar). A prova de que o ramo ABERTO existe — borda
 * `hover:border-foreground/30`, botao de copiar visivel — nao tem print, e sem
 * poder montar o componente ela seria o trecho que ninguem nunca viu.
 *
 * `agora` entra por prop, e nao de `new Date()` aqui dentro, pela mesma razao da
 * tela: o veredito tem que ser o mesmo no servidor e no cliente.
 */
export interface CartaoCupomProps {
  cupom: CupomCliente;
  agora: Date;
  onCopiar: (cupom: CupomCliente) => void;
}

export function CartaoCupom({ cupom, agora, onCopiar }: CartaoCupomProps) {
  const validade = validadeCurta(cupom.expiraEm);
  const fechado = cartaoFechado(cupom, agora);

  return (
    <div
      className={`group relative overflow-hidden rounded-3xl border border-border bg-background p-6 shadow-sm transition-all md:p-8 ${
        fechado ? 'opacity-60 grayscale' : 'hover:border-foreground/30'
      }`}
    >
      <div className="relative z-10 flex items-center justify-between">
        <div className="space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent">
            Oferta Exclusiva
          </span>
          <p className="font-serif text-3xl">{rotuloCupom(cupom)}</p>
          <p className="text-sm font-medium tracking-tight text-muted-foreground">
            Válido para todo o site
          </p>
        </div>
        <div className="flex size-12 items-center justify-center rounded-2xl bg-secondary/30 text-muted-foreground transition-all group-hover:bg-foreground group-hover:text-background">
          <Ticket className="size-6" aria-hidden />
        </div>
      </div>

      <div className="relative z-10 mt-8 flex items-center gap-3">
        <div className="flex flex-1 items-center justify-between rounded-xl border border-dashed border-border bg-secondary/20 p-4">
          <span className="font-mono text-lg font-bold uppercase tracking-widest">
            {cupom.code}
          </span>
          <button
            type="button"
            onClick={() => onCopiar(cupom)}
            disabled={fechado}
            aria-label="Copiar"
            className="rounded-lg border border-transparent p-2 transition-colors hover:border-border hover:bg-background disabled:hidden"
          >
            <Copy className="size-4" aria-hidden />
          </button>
        </div>
      </div>

      {/*
        A meta. A ORDEM e a do original: minimo (quando existe), validade,
        vencido, esgotado. No material so a validade e o `EXPIRADO` aparecem.
      */}
      <div className="relative z-10 mt-4 flex flex-wrap gap-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        {cupom.minimo !== null && cupom.minimo > 0 && (
          <span>Mínimo: {formatBRL(cupom.minimo)}</span>
        )}
        {validade && <span>Expira em: {validade}</span>}
        {/*
          O `text-rose-600` do original vira `text-danger` — a mesma conversao
          ja feita no desconto de `PedidoCard` e no remover de `Favoritos`.
        */}
        {expirou(cupom, agora) && <span className="text-danger">Expirado</span>}
        {cupom.esgotado && <span className="text-danger">Esgotado</span>}
      </div>

      {/*
        Os dois recortes decorativos. Eles ficam FORA do `z-10` de proposito,
        como no original, e sao eles que dao a forma de cupom: `-left-3` e
        `-right-3` empurram cada circulo para fora do cartao, e o
        `overflow-hidden` do container corta a metade que sobra — a medida do
        `cli-015` (o circulo esquerdo alcanca 6 px para fora da borda, de
        x≈344 a x≈363, com o cartao comecando em x=350).
      */}
      <div className="absolute -left-3 top-1/2 size-6 rounded-full border border-border bg-secondary/30" />
      <div className="absolute -right-3 top-1/2 size-6 rounded-full border border-border bg-secondary/30" />
    </div>
  );
}

/**
 * O BLOCO VAZIO — o mesmo dos outros modulos, com o icone e a frase de cupom.
 *
 * O original escreve `bg-beige/5` na caixa; ver a nota do topo: a caixa fica SEM
 * fundo. O `Ticket` e o circulo `size-16` sao transcritos.
 */
export function VazioCupons() {
  return (
    <div className="rounded-[2rem] border border-dashed border-border p-16 text-center">
      <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-secondary/40">
        <Ticket className="size-8 text-muted-foreground/40" aria-hidden />
      </div>
      <p className="text-sm font-medium text-muted-foreground">
        Nenhum cupom disponível no momento.
      </p>
    </div>
  );
}

export function CouponsView() {
  const [cupons, setCupons] = useState<CupomCliente[] | null>(null);
  const [aviso, setAviso] = useState<{ texto: string; tom: TomAviso } | null>(null);
  const [agora, setAgora] = useState<Date | null>(null);

  useEffect(() => {
    let ativo = true;
    void listCupons().then(({ data }) => {
      if (ativo) setCupons(data);
    });
    setAgora(new Date());
    return () => {
      ativo = false;
    };
  }, []);

  if (!cupons || !agora) {
    return <p className="text-sm text-muted-foreground">Carregando...</p>;
  }

  /**
   * A copia. Ver a nota longa no topo do arquivo: ela funciona hoje porque
   * `navigator.clipboard` e API do navegador, e nao persistencia.
   */
  function copiar(cupom: CupomCliente) {
    void navigator.clipboard?.writeText(cupom.code).catch(() => {
      /* contexto nao seguro (http) — a intencao foi cumprida, o aviso sai */
    });
    setAviso({ texto: `Cupom ${cupom.code} copiado`, tom: 'sucesso' });
  }

  return (
    <div className="space-y-8 motion-safe:animate-fade-up">
      <ClienteToast message={aviso?.texto ?? null} tom={aviso?.tom ?? 'sucesso'} />

      {/* O cabecalho proprio desta tela — ver a nota do topo. */}
      <header>
        <h2 className="font-serif text-3xl">Meus Cupons</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Aproveite as ofertas exclusivas para sua próxima compra.
        </p>
      </header>

      {cupons.length === 0 ? (
        <VazioCupons />
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {cupons.map((cupom) => (
            <CartaoCupom key={cupom.id} cupom={cupom} agora={agora} onCopiar={copiar} />
          ))}
        </div>
      )}
    </div>
  );
}
