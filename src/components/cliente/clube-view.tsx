'use client';

import { useEffect, useState } from 'react';
import { ArrowRight, Gift, History, Sparkles, Trophy } from 'lucide-react';
import { getClube, resgatarRecompensa } from '@/lib/cliente/data';
import { dataCurta, magnitudePontos, movimentoEntra } from '@/lib/cliente/metrics';
import type { MovimentoPontos, ResumoClube } from '@/lib/cliente/types';
import { ClienteToast, type TomAviso } from './cliente-toast';

/**
 * `Clube VIP & Cashback` — `/conta/pontos`, os prints `cli-012` (`004801`),
 * `cli-013` (`004819`) e `cli-014` (`004830`).
 *
 * ================== O CABECALHO DESTA TELA TAMBEM E PROPRIO ==================
 *
 * Pelo MESMO motivo de `Endereços` e `Minhas Medidas`: o original declara o
 * `<header>` como o primeiro filho de um `space-y-8`, sem margem propria, e o
 * `ClientPageHeader` carrega `mb-6` — reusar somaria 24 px aos 32 do container.
 * Aqui, porem, o cabecalho e IDENTICO ao do componente por dentro (titulo
 * `text-3xl` serifado + descricao `mt-1 text-sm text-muted-foreground`), e a
 * unica coisa que impede o reuso e o espaco. Está medido: a tinta da descricao
 * tem 15 px de altura como a de `Minhas Medidas`, e nao os 19 px do titulo.
 *
 * ================== `h1` NO ORIGINAL, `h2` AQUI ==================
 *
 * Este e o UNICO print da area da cliente em que o titulo da tela e um `<h1>`
 * (o Dashboard nao tem cabecalho nenhum, e a casca ja gasta um `<h1>` na
 * saudacao). O projeto usa `<h2>` no `ClientPageHeader` e em todas as outras
 * telas desta area. Como `/conta/pontos` e `/conta` nunca aparecem juntas, nao
 * ha dois `<h1>` na mesma pagina em nenhum momento — e manter o nivel do titulo
 * igual ao do resto da area vale mais do que transcrever a tag de um arquivo
 * que declara `h1` isolado. E uma divergencia de TAG, sem efeito no pixel.
 *
 * ================== A BARRA DE PROGRESSO ESTA VAZIA, E ISSO E O MATERIAL ==================
 *
 * Hoje o saldo e 0, entao a barra sai com 0% de largura. O print `cli-012`
 * mostra exatamente a faixa escura vazia, com `0 / 1000 PTS` a direita. Nao e
 * um bug de layout: e a conta do original (`totalEarned / nextTier.min_points`),
 * que mede o quanto do CAMINHO ATE O PROXIMO NIVEL ja foi andado, e nao "quanto
 * falta do degrau anterior". Com 0 ponto, 0%.
 *
 * ================== O RESGATE NAO GRAVA — E DIZ ISSO ==================
 *
 * `Resgatar Agora` chama `resgatarRecompensa()`, que devolve `{ ok: false,
 * reason }`, e a tela mostra o motivo. Duas notas:
 *
 * 1. **No material os tres botoes estao BLOQUEADOS** (`Faltam N pontos`), porque
 *    o saldo e 0. O ramo `Resgatar Agora` existe no original, mas nao aparece em
 *    print nenhum. Ele entra porque o estado existe no codigo e a bancada o
 *    exercita; o aviso honesto e o mesmo das outras escritas desta area.
 * 2. **O original NAO liga `onClick` neste botao** — ele so declara
 *    `disabled={!canAfford}`. Transcrever essa omissao deixaria um botao que
 *    parece acionavel e nao faz nada, que e o defeito que esta fase inteira
 *    existe para nao repetir. A divergencia fica registrada.
 *
 * O resgate real sao DUAS escritas (o debito e o cupom) numa transacao — ver
 * `resgatarRecompensa` em `data.ts`.
 */

/**
 * Uma linha do extrato: a data, o motivo e o valor COM SINAL.
 *
 * ================== O SINAL DA LINHA E O MESMO DO SALDO ==================
 *
 * `pontos` NAO e sempre positivo: em `adjustment` o sinal vem no proprio numero
 * (ver `movimentoEntra`/`magnitudePontos` em `metrics.ts`). O original faz a
 * decisao do sinal DUAS vezes, e as duas nao concordam:
 *
 *   a COR e o `+`/`-` da linha:  `type === 'earn' || type === 'bonus'`
 *   o SALDO:                     `type === 'earn' || type === 'bonus' || (type === 'adjustment' && points > 0)`
 *
 * Ou seja: um `adjustment` NEGATIVO aparece como entrada verde `+N` na lista e
 * como subtracao no saldo. Sao dois vereditos para o mesmo lancamento, e o
 * defeito e do original — nao do print (o extrato do material e vazio e nao
 * exercita o caso).
 *
 * Aqui a linha chama as MESMAS duas funcoes que o saldo
 * (`movimentoEntra`/`magnitudePontos`), porque uma lista que diz `+500` ao lado
 * de um `Seu Saldo` que contou `-500` esta mentindo em um dos dois lugares. A
 * divergencia com o original fica registrada.
 */
export function LinhaExtrato({ movimento }: { movimento: MovimentoPontos }) {
  const entra = movimentoEntra(movimento);
  return (
    <div className="flex items-center justify-between p-4 transition-colors hover:bg-muted/30">
      <div className="min-w-0">
        <p className="truncate text-xs font-bold">{movimento.descricao || 'Movimentação'}</p>
        <p className="text-[9px] uppercase tracking-widest text-muted-foreground">
          {dataCurta(movimento.criadoEm)}
        </p>
      </div>
      <span className={`font-mono text-xs font-black ${entra ? 'text-success' : 'text-danger'}`}>
        {entra ? '+' : '-'}
        {magnitudePontos(movimento)}
      </span>
    </div>
  );
}

/**
 * O movimento ENTRA ou SAI?
 *
 * Reexportado de `metrics.ts` de proposito — e NAO reescrito aqui. A linha do
 * extrato e o saldo tem que dar o mesmo veredito para o mesmo lancamento, e a
 * unica forma de garantir isso e haver UMA funcao. Duas copias da mesma condicao
 * divergem no primeiro ajuste que uma receber.
 */
export const entradaDePontos = movimentoEntra;

/**
 * O CARTAO DE RECOMPENSA — os dois estados do print, num componente.
 *
 * Ele esta exportado para a bancada poder MONTA-LO: os tres cartoes do material
 * saem todos no estado BLOQUEADO (saldo 0), e o outro ramo — `Resgatar Agora`,
 * borda `border-foreground` — nao aparece em print nenhum. Sem poder renderizar
 * os dois, o ramo nao provado seria justamente o que ninguem nunca viu.
 *
 * O `disabled` e uma prop, e nao uma conta feita aqui dentro: quem decide se a
 * cliente pode resgatar e o SALDO, e ele vem de `data.ts`. O componente so
 * desenha o veredito.
 */
export interface CartaoRecompensaProps {
  rotulo: string;
  pontos: number;
  /** `true` quando o saldo cobre o custo. */
  podeResgatar: boolean;
  /** Quantos pontos faltam. Ignorado quando `podeResgatar`. */
  faltam: number;
  onResgatar: () => void;
}

export function CartaoRecompensa({
  rotulo,
  pontos,
  podeResgatar,
  faltam,
  onResgatar,
}: CartaoRecompensaProps) {
  return (
    <div
      className={`group relative overflow-hidden rounded-2xl border p-6 transition-all duration-300 ${
        podeResgatar
          ? 'border-foreground bg-card hover:shadow-elegant'
          : 'border-border bg-muted/30 opacity-70'
      }`}
    >
      <div className="mb-4 flex items-start justify-between">
        <div className="flex size-10 items-center justify-center rounded-full bg-secondary">
          <Trophy
            className={`size-5 ${podeResgatar ? 'text-accent' : 'text-muted-foreground'}`}
            aria-hidden
          />
        </div>
        <span className="rounded-full bg-foreground px-3 py-1 font-mono text-[10px] font-black text-background">
          {pontos} PTS
        </span>
      </div>
      <h4 className="mb-1 font-serif text-xl">{rotulo}</h4>
      <p className="mb-6 text-[10px] uppercase tracking-widest text-muted-foreground">
        Uso único em todo o site
      </p>
      <button
        type="button"
        disabled={!podeResgatar}
        onClick={onResgatar}
        className={`w-full rounded-xl py-3 text-[10px] font-black uppercase tracking-[0.2em] transition-all ${
          podeResgatar
            ? 'bg-foreground text-background hover:scale-[1.02] active:scale-95'
            : 'cursor-not-allowed bg-border text-muted-foreground'
        }`}
      >
        {podeResgatar ? 'Resgatar Agora' : `Faltam ${faltam} pontos`}
      </button>
    </div>
  );
}

export function ClubeView() {
  const [resumo, setResumo] = useState<ResumoClube | null>(null);
  const [aviso, setAviso] = useState<{ texto: string; tom: TomAviso } | null>(null);

  useEffect(() => {
    let ativo = true;
    void getClube().then(({ data }) => {
      if (ativo) setResumo(data);
    });
    return () => {
      ativo = false;
    };
  }, []);

  if (!resumo) {
    return <p className="text-sm text-muted-foreground">Carregando...</p>;
  }

  const { saldo, acumulado, nivel, proximoNivel, progressoPct, faltamProximo } = resumo;
  const cor = nivel?.cor ?? 'white';

  async function tentarResgatar(rotulo: string) {
    const { ok, reason } = await resgatarRecompensa();
    setAviso(
      ok
        ? { texto: `${rotulo} resgatada`, tom: 'sucesso' }
        : { texto: reason ?? 'Ainda não foi possível resgatar.', tom: 'erro' },
    );
  }

  return (
    <div className="space-y-8 pb-20 motion-safe:animate-fade-up">
      <ClienteToast message={aviso?.texto ?? null} tom={aviso?.tom ?? 'sucesso'} />

      {/* O cabecalho proprio desta tela — ver a nota do topo. */}
      <header>
        <h2 className="font-serif text-3xl">Clube VIP Closet Lunar</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Quanto mais você compra, mais benefícios exclusivos você ganha.
        </p>
      </header>

      {/* ============ O CARTAO ESCURO DO NIVEL ============ */}
      {nivel && (
        <div
          className="relative overflow-hidden rounded-2xl bg-foreground p-8 text-background shadow-elegant"
          style={{ borderTop: `8px solid ${cor}` }}
        >
          {/*
            A FAIXA DO TOPO E UMA BORDA, E NAO UM ELEMENTO.

            O original escreve `borderTop: 8px solid currentTier.color` sobre um
            cartao `overflow-hidden`. A faixa do print tem 8 px de altura cheia
            (medidos no `cli-012`: 414 a 421), e e a COR DO NIVEL que ela pinta —
            a mesma do trofeu e do nome. Foi esta faixa, e nao a tinta da palavra
            `BRONZE`, que deu a medida limpa de `#CD7F32`; ver `DEMO_NIVEIS_CLUBE`.
          */}
          <div className="relative z-10 flex flex-col justify-between items-center gap-8 md:flex-row">
            <div className="space-y-2 text-center md:text-left">
              <div className="flex items-center justify-center gap-3 md:justify-start">
                <Trophy className="size-8" style={{ color: cor }} aria-hidden />
                <p
                  className="font-serif text-4xl uppercase tracking-widest"
                  style={{ color: cor }}
                >
                  {nivel.nome}
                </p>
              </div>
              <p className="text-sm tracking-wider opacity-70">
                Você faz parte do nosso Clube VIP!
              </p>
            </div>

            <div className="flex flex-col items-center gap-1 md:items-end">
              {/* `Seu Saldo` com as duas iniciais em caixa alta, como o original
                  escreve — e o `uppercase` da classe que sobe a caixa toda. */}
              <p className="text-[10px] uppercase tracking-[0.2em] opacity-60">Seu Saldo</p>
              <div className="flex items-baseline gap-2">
                <span className="font-serif text-5xl">{saldo}</span>
                <span className="text-sm opacity-70">pontos</span>
              </div>
            </div>
          </div>

          <div className="mt-8 border-t border-background/10 pt-8">
            <div className="mb-2 flex items-end justify-between text-xs font-bold uppercase tracking-widest">
              <span>Progresso para o próximo nível</span>
              {proximoNivel ? (
                <span>
                  {acumulado} / {proximoNivel.minimoPontos} pts
                </span>
              ) : (
                <span>Nível Máximo Atingido!</span>
              )}
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-background/10">
              <div
                className="h-full transition-all duration-1000 ease-out"
                style={{ width: `${progressoPct}%`, backgroundColor: cor }}
              />
            </div>
            {proximoNivel && (
              <p className="mt-3 text-center text-[10px] uppercase italic tracking-widest opacity-60 md:text-left">
                Faltam {faltamProximo} pontos para você se tornar{' '}
                <span className="font-bold" style={{ color: proximoNivel.cor }}>
                  {proximoNivel.nome}
                </span>
              </p>
            )}
          </div>
        </div>
      )}

      {/* ============ BENEFICIOS E RECOMPENSAS ============ */}
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="space-y-8 lg:col-span-2">
          {/* Seus beneficios */}
          {nivel && (
            <section className="space-y-4">
              <h3 className="flex items-center gap-2 font-serif text-xl uppercase tracking-wider">
                <Sparkles className="size-5 text-accent" aria-hidden />
                Seus Benefícios {nivel.nome}
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                {nivel.beneficios.map((beneficio, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 rounded-xl border border-border bg-card p-4"
                  >
                    <div className="size-2 rounded-full" style={{ backgroundColor: cor }} />
                    <span className="text-sm font-medium">{String(beneficio)}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Trocar por recompensas */}
          <section className="space-y-4">
            <h3 className="flex items-center gap-2 font-serif text-xl uppercase tracking-wider">
              <Gift className="size-5 text-accent" aria-hidden />
              Trocar por Recompensas
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              {resumo.recompensas.map((recompensa) => (
                <CartaoRecompensa
                  key={recompensa.id}
                  rotulo={recompensa.rotulo}
                  pontos={recompensa.pontos}
                  podeResgatar={saldo >= recompensa.pontos}
                  faltam={recompensa.pontos - saldo}
                  onResgatar={() => {
                    void tentarResgatar(recompensa.rotulo);
                  }}
                />
              ))}
            </div>
          </section>
        </div>

        {/* Coluna lateral: historico e niveis */}
        <aside className="space-y-8">
          <section className="space-y-4">
            <h3 className="flex items-center gap-2 font-serif text-xl uppercase tracking-wider">
              <History className="size-5" aria-hidden />
              Histórico
            </h3>
            {/*
              ESTE CARTAO NAO E O `ContaSectionCard`.

              La o cartao tem titulo dentro e `p-6 md:p-8`; aqui o titulo esta
              FORA (e um `<h3>` da secao) e o cartao e uma moldura de linhas
              divididas, com `overflow-hidden` para o `divide-y` nao escapar do
              canto arredondado. Sao duas formas diferentes, e usar o componente
              compartilhado forcaria uma das duas a mudar.
            */}
            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
              {resumo.extrato.length > 0 ? (
                <div className="divide-y divide-border">
                  {resumo.extrato.map((movimento) => (
                    <LinhaExtrato key={movimento.id} movimento={movimento} />
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center">
                  <p className="text-xs uppercase italic tracking-widest text-muted-foreground">
                    Nenhuma movimentação.
                  </p>
                </div>
              )}
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="flex items-center gap-2 font-serif text-xl uppercase tracking-wider">
              <Trophy className="size-5" aria-hidden />
              Níveis do Clube
            </h3>
            <div className="space-y-3">
              {resumo.niveis.map((t) => (
                <div
                  key={t.id}
                  className={`flex items-center justify-between rounded-xl border p-4 ${
                    nivel?.id === t.id
                      ? 'border-foreground bg-secondary/30 ring-1 ring-foreground'
                      : 'border-border bg-card'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Trophy className="size-4" style={{ color: t.cor }} aria-hidden />
                    <span className="text-xs font-bold uppercase tracking-widest">{t.nome}</span>
                  </div>
                  <span className="font-mono text-[10px] opacity-60">{t.minimoPontos}+ pts</span>
                </div>
              ))}
            </div>
          </section>
        </aside>
      </div>

      {/* ============ REGRAS DO PROGRAMA ============ */}
      <section className="rounded-2xl border border-background/10 bg-foreground p-8 text-background">
        <h3 className="mb-6 font-serif text-2xl uppercase tracking-widest">Regras do Programa</h3>
        <ul className="grid gap-6 text-[10px] font-medium uppercase tracking-[0.2em] opacity-80 md:grid-cols-2">
          <li className="flex items-start gap-3">
            <ArrowRight className="mt-0.5 size-4 shrink-0" aria-hidden />
            <span>Os pontos expiram em 12 meses após a data de ganho.</span>
          </li>
          <li className="flex items-start gap-3">
            <ArrowRight className="mt-0.5 size-4 shrink-0" aria-hidden />
            <span>O resgate gera um cupom de desconto de uso único.</span>
          </li>
          <li className="flex items-start gap-3">
            <ArrowRight className="mt-0.5 size-4 shrink-0" aria-hidden />
            <span>
              Indique uma amiga: ganhe {resumo.regras.pontosIndicacao} pontos após a primeira compra.
            </span>
          </li>
          <li className="flex items-start gap-3">
            <ArrowRight className="mt-0.5 size-4 shrink-0" aria-hidden />
            <span>
              Avalie seus produtos: ganhe {resumo.regras.pontosAvaliacao} pontos por cada avaliação.
            </span>
          </li>
        </ul>
      </section>
    </div>
  );
}
