'use client';

import { useEffect, useState } from 'react';
import { Check, DollarSign, Link as LinkIcon, TrendingUp, Users } from 'lucide-react';
import { formatCommission } from '@/lib/afiliadas/metrics';
import { getAfiliada } from '@/lib/cliente/data';
import {
  dataVenda,
  idCurtoPedido,
  linkDivulgacao,
  rotuloVenda,
  vendaPaga,
} from '@/lib/cliente/metrics';
import type { ContaAfiliada, VendaAfiliada } from '@/lib/cliente/types';
import { formatBRL } from '@/lib/utils';
import { ClienteToast, type TomAviso } from './cliente-toast';

/**
 * `Afiliada` — `/conta/afiliada`.
 *
 * ================== ESTA TELA NAO TEM PRINT PROPRIO, E ISSO MUDA A REGRA ==================
 *
 * Das treze telas da area, esta e a unica em que a regra de prioridade da
 * referencia (PRINT > ORIGINAL > ESTRUTURA > INFERENCIA) **nao tem o primeiro
 * termo**. Os vinte prints do material cobrem dez telas; `Afiliada` nao e uma
 * delas. O que a referencia prova desta tela e apenas o ITEM: o atalho
 * `Afiliada` na grade de oito cartoes do `cli-001`, que aponta para ca.
 *
 * Entao a fonte e `conta.afiliada.tsx` — o original — e nada mais. Nao ha print
 * para medir geometria, para desempatar um rotulo ou para corrigir um espaco.
 * Onde este arquivo escolhe uma medida, ela vem das CLASSES do original, e nao
 * de uma leitura de pixel. Esta e a diferenca de metodo em relacao aos outros
 * doze modulos, e ela esta escrita aqui para que ninguem procure o print que
 * nao existe.
 *
 * ================== OS DOIS ESTADOS, E POR QUE A DEMONSTRACAO ENTREGA O VAZIO ==================
 *
 * O original tem dois, e a condicional e `if (!profile)`:
 *
 *   sem perfil  ->  `Seja uma Afiliada Closet Lunar` + o convite + o botao
 *   com perfil  ->  o `Painel de Afiliada`: quatro numeros, o link, o cupom e
 *                   o historico
 *
 * A conta dos prints (`lp070087@gmail.com`) NAO esta em `DEMO_AFFILIATES` (a
 * unica afiliada la e `lucasmuniz19w@gmail.com`), entao a demonstracao cai no
 * CONVITE. Ver a nota de `getAfiliada()` em `data.ts`: `perfil: null` nao e
 * "carregando" nem "erro", e "esta conta ainda nao e afiliada".
 *
 * Os DOIS estados existem no codigo, e a bancada prova os dois — o preenchido
 * com um perfil injetado por prop. O que a tela MOSTRA na demonstracao e o
 * convite, porque e o que a referencia mostra.
 *
 * ================== O QUE NAO FOI FEITO ==================
 *
 * **Nada de `window`.** O original monta o link com
 * `${window.location.origin}/?ref=${slug}`. `window` nao existe em Node, e
 * chama-lo derrubaria a bancada com `ReferenceError`. A origem entra por PROP, e
 * a demonstracao passa `''` — que produz o caminho relativo `/?ref=<slug>`, e
 * nao um dominio inventado. Ver `linkDivulgacao()` em `metrics.ts`.
 *
 * **Nada de `clipboard`.** O original copia de verdade (`navigator.clipboard`) e
 * troca o rotulo por um `Check` por 2 segundos. Nesta fase nao ha o que copiar
 * de util (o link nao aponta para um site que exista) e o `setTimeout` de 2s nao
 * e verificavel por bancada. O botao `Copiar` existe, e AVISA que a copia ainda
 * nao esta ligada — em vez de dizer "copiado!" sem ter copiado nada.
 *
 * **Nada de cadastro.** O botao `Quero me cadastrar agora` nao tem `onClick`, como
 * os botoes de rastreio de `Meus Pedidos` e o `VER NO AVATAR 3D` de `Minhas
 * Medidas`: ele liga numa escrita que entra na fase de integracao. Um botao que
 * finge cadastrar seria a promessa que esta fase nao pode fazer.
 */

/** O convite — o estado em que a conta ainda NAO e afiliada. */
export const TITULO_CONVITE = 'Seja uma Afiliada Closet Lunar';

export function ConviteAfiliada() {
  return (
    <div className="mx-auto max-w-2xl space-y-8 py-20 text-center motion-safe:animate-fade-up">
      <div className="mx-auto grid size-24 place-items-center rounded-full bg-secondary text-foreground shadow-elegant">
        <Users className="size-10" aria-hidden />
      </div>
      <div>
        <h2 className="font-serif text-3xl md:text-4xl">{TITULO_CONVITE}</h2>
        <p className="mt-4 leading-relaxed text-muted-foreground">
          Compartilhe seu estilo e ganhe comissões exclusivas por cada venda realizada através do
          seu link ou cupom personalizado. Junte-se ao nosso time de influenciadoras!
        </p>
      </div>
      <div className="pt-4">
        <button
          type="button"
          className="rounded-full bg-foreground px-12 py-4 text-xs font-bold uppercase tracking-[0.15em] text-background shadow-lg transition-all hover:opacity-90 active:scale-95"
        >
          Quero me cadastrar agora
        </button>
      </div>
    </div>
  );
}

/**
 * ================== OS NUMEROS QUE O ORIGINAL PINTA COM A PALETA CRUA ==================
 *
 * O original escreve `text-emerald-600` no `Saldo Total` e `text-amber-600` no
 * `A Receber`, e monta os selos com `bg-emerald-50`/`bg-amber-100`. O projeto
 * nao usa a paleta crua do Tailwind: usa os tokens `--success` e `--warning`,
 * que a area inteira (e o admin) ja usa para os mesmos dois papeis. E a mesma
 * conversao da divergencia 30 do modulo `Segurança` — a FORMA do original, a cor
 * do projeto. Por isso o tom entra por CLASSE e nao por um `color="#..."`.
 */
export interface CartaoMetricaProps {
  label: string;
  valor: string;
  /** Classe de tinta do valor. Sem ela, o numero sai na tinta padrao. */
  tom?: string;
  children: React.ReactNode;
}

export function CartaoMetrica({ label, valor, tom, children }: CartaoMetricaProps) {
  return (
    <div className="group flex flex-col gap-4 rounded-3xl border border-border bg-background p-5 shadow-soft transition-all hover:border-foreground/20 md:p-6">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
          {label}
        </span>
        <div className="flex size-10 items-center justify-center rounded-xl bg-secondary/30 text-muted-foreground transition-all group-hover:bg-foreground group-hover:text-background">
          {children}
        </div>
      </div>
      <div className={`font-serif text-2xl leading-none md:text-3xl ${tom ?? 'text-foreground'}`}>
        {valor}
      </div>
    </div>
  );
}

/**
 * Uma linha do `Histórico de Vendas`.
 *
 * O `+` da comissao e do ORIGINAL (`+{formatBRL(...)}`) e nao decoracao: a
 * comissao e um credito. O `#` tambem e do original, e o `idCurtoPedido` corta
 * os oito primeiros caracteres.
 */
export function LinhaVenda({ venda }: { venda: VendaAfiliada }) {
  const paga = vendaPaga(venda);
  return (
    <div className="flex items-center justify-between p-4 transition-colors hover:bg-background md:p-5">
      <div className="min-w-0">
        <p className="text-sm font-bold tracking-tight">Pedido #{idCurtoPedido(venda.orderId)}</p>
        <p className="mt-0.5 text-[10px] uppercase tracking-widest text-muted-foreground">
          {dataVenda(venda.criadaEm)}
        </p>
      </div>
      <div className="text-right">
        <p className="font-serif text-lg text-success-foreground">
          +{formatBRL(venda.commissionAmount)}
        </p>
        <span
          className={
            paga
              ? 'rounded-full bg-success-surface px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.15em] text-success-foreground'
              : 'rounded-full bg-warning-surface px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.15em] text-warning-foreground'
          }
        >
          {rotuloVenda(venda)}
        </span>
      </div>
    </div>
  );
}

/** O vazio do historico — o estado da demonstracao, e um estado do original. */
export function VazioVendas() {
  return (
    <div className="p-16 text-center">
      <TrendingUp className="mx-auto mb-4 size-10 text-muted-foreground/30" aria-hidden />
      <p className="text-sm italic text-muted-foreground">
        As vendas realizadas aparecerão aqui.
      </p>
    </div>
  );
}

export interface PainelAfiliadaProps {
  conta: ContaAfiliada;
  /**
   * A origem do link de divulgacao. `''` na demonstracao — ver `linkDivulgacao`.
   *
   * Vem por prop, e nao de `window`, pelo motivo da nota do topo. Quando o site
   * publico existir (Fase 3), a origem entra aqui e o link vira absoluto.
   */
  origem?: string;
  /** O aviso do `Copiar`. Ver a nota do topo: a copia nao esta ligada ainda. */
  aoCopiar?: (o_que: string) => void;
}

/** O `Painel de Afiliada` — o estado em que a conta E afiliada. */
export function PainelAfiliada({ conta, origem = '', aoCopiar }: PainelAfiliadaProps) {
  /*
    `perfil` nulo nao chega aqui — quem decide entre convite e painel e a VIEW.
    Mas o componente nao confia nisso para se desenhar: sem perfil ele nao tem o
    que mostrar, entao devolve o convite em vez de quebrar. E o `ConviteAfiliada`
    como rede, e nao como plano.
  */
  if (!conta.perfil) return <ConviteAfiliada />;

  const { perfil, vendas, resumo } = conta;
  const ativa = perfil.status === 'active';
  const link = linkDivulgacao(perfil.referralSlug, origem);

  return (
    <div className="space-y-10 motion-safe:animate-fade-up">
      <header className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h2 className="font-serif text-3xl md:text-4xl">Painel de Afiliada</h2>
          <p className="mt-2 text-muted-foreground">
            Olá, <span className="font-bold text-foreground">{perfil.name}</span>! Veja como está
            seu desempenho hoje.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/*
            O SELO DE STATUS. O original usa verde/ambar crus; aqui sao os tokens.
            O texto e `Conta: Ativa` / `Conta: Pendente` — literal do original, e
            nao o `ACTIVE` cru da tabela do ADMIN (que e outra tela, com outra
            referencia).
          */}
          <span
            className={
              ativa
                ? 'rounded-full border border-success/20 bg-success-surface px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-success-foreground shadow-sm'
                : 'rounded-full border border-warning/20 bg-warning-surface px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-warning-foreground shadow-sm'
            }
          >
            Conta: {ativa ? 'Ativa' : 'Pendente'}
          </span>
        </div>
      </header>

      {/* Os quatro numeros. `grid-cols-2` no celular, `lg:grid-cols-4` no desktop. */}
      <div className="grid grid-cols-2 gap-4 md:gap-6 lg:grid-cols-4">
        <CartaoMetrica label="Cliques" valor={String(resumo.cliques)}>
          <TrendingUp className="size-5" aria-hidden />
        </CartaoMetrica>
        <CartaoMetrica label="Vendas" valor={String(resumo.vendas)}>
          <Users className="size-5" aria-hidden />
        </CartaoMetrica>
        <CartaoMetrica label="Saldo Total" valor={formatBRL(resumo.comissaoTotal)} tom="text-success-foreground">
          <DollarSign className="size-5" aria-hidden />
        </CartaoMetrica>
        <CartaoMetrica label="A Receber" valor={formatBRL(resumo.comissaoAReceber)} tom="text-warning-foreground">
          <TrendingUp className="size-5" aria-hidden />
        </CartaoMetrica>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-6">
          {/* O LINK DE DIVULGACAO. */}
          <section className="space-y-6 rounded-[2rem] border border-border bg-background p-6 shadow-elegant md:p-8">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-secondary/30 text-muted-foreground">
                <LinkIcon className="size-5" aria-hidden />
              </div>
              <h3 className="font-serif text-xl">Link de Divulgação</h3>
            </div>

            <div className="flex gap-2 rounded-2xl border border-border bg-secondary/10 p-2">
              <div className="flex-1 truncate px-4 py-3 font-mono text-sm text-muted-foreground selection:bg-foreground selection:text-background">
                {link}
              </div>
              <button
                type="button"
                onClick={() => aoCopiar?.('Link')}
                className="rounded-xl bg-foreground px-6 text-[10px] font-bold uppercase tracking-widest text-background transition-all hover:opacity-90 active:scale-95"
              >
                Copiar
              </button>
            </div>
            <p className="text-xs italic text-muted-foreground">
              * Divulgue este link em suas redes sociais para rastrear suas indicações.
            </p>
          </section>

          {/*
            O CUPOM EXCLUSIVO — o cartao ESCURO. `bg-foreground text-background`,
            com o `DollarSign` gigante em marca d'agua no canto. O original declara
            `group-hover:rotate-0` no icone (ele nasce `-rotate-12`): a rotacao
            inteira depende do `group` no cartao, e o desenho e o mesmo.
          */}
          <section className="group relative space-y-6 overflow-hidden rounded-[2rem] border border-foreground/10 bg-foreground p-6 text-background shadow-elegant md:p-8">
            <div className="relative z-10">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-background/10 text-background/70">
                  <DollarSign className="size-5" aria-hidden />
                </div>
                <h3 className="font-serif text-xl">Seu Cupom Exclusivo</h3>
              </div>

              <div className="flex gap-2">
                <div className="flex-1 rounded-2xl border border-background/20 bg-background px-4 py-4 text-center font-mono text-2xl font-bold tracking-[0.3em] text-foreground shadow-inner">
                  {perfil.couponCode}
                </div>
                <button
                  type="button"
                  onClick={() => aoCopiar?.('Cupom')}
                  className="rounded-2xl bg-accent px-6 text-[10px] font-bold uppercase tracking-widest text-accent-foreground transition-all hover:opacity-90 active:scale-95"
                >
                  Copiar
                </button>
              </div>

              <div className="mt-6 rounded-xl border border-background/5 bg-background/10 p-4">
                <p className="text-center text-xs font-medium tracking-wide">
                  Comissão:{' '}
                  <span className="text-accent">{formatCommission(perfil)}</span> por cada venda
                  finalizada.
                </p>
              </div>
            </div>
            <DollarSign
              className="absolute -bottom-8 -right-8 size-48 -rotate-12 opacity-5 transition-transform duration-700 group-hover:rotate-0"
              aria-hidden
            />
          </section>
        </div>

        {/* O HISTORICO DE VENDAS. */}
        <section className="space-y-6 rounded-[2rem] border border-border bg-background p-6 shadow-elegant md:p-8">
          <h3 className="font-serif text-2xl">Histórico de Vendas</h3>
          <div className="overflow-hidden rounded-2xl border border-border/50 bg-secondary/5">
            {vendas.length > 0 ? (
              <div className="divide-y divide-border/30">
                {vendas.slice(0, 6).map((v) => (
                  <LinhaVenda key={v.id} venda={v} />
                ))}
              </div>
            ) : (
              <VazioVendas />
            )}
          </div>
          {/*
            `sales.length > 6` — o original mostra o botao SO quando ha mais de
            seis, porque ele recorta em `.slice(0, 6)`. Com seis ou menos, o botao
            seria uma promessa de uma lista que nao existe. A condicao e a mesma, e
            o botao tambem nao tem `onClick` (a rota das vendas nao existe).
          */}
          {vendas.length > 6 && (
            <button
              type="button"
              className="w-full pt-2 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground transition-all hover:text-foreground"
            >
              Ver todas as vendas
            </button>
          )}
        </section>
      </div>
    </div>
  );
}

export function AfiliadaView() {
  const [conta, setConta] = useState<ContaAfiliada | null>(null);
  const [aviso, setAviso] = useState<{ texto: string; tom: TomAviso } | null>(null);

  useEffect(() => {
    let ativo = true;
    void getAfiliada().then(({ data }) => {
      if (ativo) setConta(data);
    });
    return () => {
      ativo = false;
    };
  }, []);

  if (!conta) {
    return <p className="text-sm text-muted-foreground">Carregando...</p>;
  }

  /*
    ================== O AVISO DA COPIA DIZ A VERDADE ==================

    O original faz `navigator.clipboard.writeText` e mostra `<tipo> copiado!`. Aqui
    a copia NAO esta ligada (ver a nota do topo): nao ha area de transferencia na
    bancada, e o link ainda nao aponta para um site real. Entao o aviso diz o que
    aconteceu de verdade — que a copia entra na fase de integracao — em vez de
    afirmar uma copia que nao houve. E a mesma escolha de `salvarDadosConta` e
    `encerrarSessoes`, que devolvem `ok: false` com motivo em vez de um sucesso
    falso.
  */
  function copiar(o_que: string) {
    setAviso({
      texto: `${o_que}: a cópia automática entra na fase de integração.`,
      tom: 'erro',
    });
  }

  return (
    <>
      <ClienteToast message={aviso?.texto ?? null} tom={aviso?.tom ?? 'erro'} />
      {conta.perfil ? (
        <PainelAfiliada conta={conta} aoCopiar={copiar} />
      ) : (
        <ConviteAfiliada />
      )}
    </>
  );
}
