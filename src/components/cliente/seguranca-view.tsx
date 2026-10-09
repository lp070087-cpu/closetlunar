'use client';

import { useEffect, useState } from 'react';
import { LogOut, Shield } from 'lucide-react';
import { encerrarSessoes, getAcesso, salvarSenha } from '@/lib/cliente/data';
import { ultimoAcesso } from '@/lib/cliente/metrics';
import type { AcessoConta } from '@/lib/cliente/types';
import { usePortaoDaConta } from './account-shell';
import { ClienteToast, type TomAviso } from './cliente-toast';

/**
 * `Segurança` — `/conta/seguranca`, os prints `cli-019` (`004914`) e `cli-020`
 * (`004922`).
 *
 * ================== O QUE ESTA TELA TEM DE DIFERENTE DAS OUTRAS ONZE ==================
 *
 * As outras telas da area LEEM dado e, no maximo, tentam escrever. Esta le dado,
 * tenta escrever, e tem **DUAS ACOES QUE NAO PASSAM PELO BANCO NENHUM**: o
 * `confirm()` que antecede o encerramento das sessoes, e o `Sair` do rodape
 * tracejado. As duas tem comportamento real nesta fase, e elas sao a parte da
 * tela que mais se parece com o original — justamente porque nao dependem do
 * banco para existir.
 *
 * ================== O CABECALHO E PROPRIO, PELA SEXTA VEZ ==================
 *
 * `space-y-8` com o `<header>` como primeiro filho, e nao o `ClientPageHeader`
 * (que carrega `mb-6` e somaria 56 px onde o print mostra 32). Ver
 * `addresses-view.tsx`, onde a decisao foi tomada.
 *
 * ================== A GEOMETRIA FOI MEDIDA, E ELA CONFIRMA O ORIGINAL ==================
 *
 * Este print tem a particularidade de ser o primeiro da area em que os DOIS
 * cartoes da linha `md:grid-cols-2` aparecem, e o recorte entre as duas capturas
 * cai bem no gap de 32 px — o que permitiu medir as duas colunas de uma vez:
 *
 *   coluna esquerda   x 355..1404   (1050 px)
 *   coluna direita    x 1437..2485  (1049 px)
 *   gap entre as duas 32 px         ->  `gap-8`, no ramo `md:`
 *   recuo do painel   41 px         ->  `lg:p-10` (da casca, nao desta tela)
 *   recuo dos cartoes 41 px         ->  `md:p-10` (o esquerdo) e `p-6`… ver abaixo
 *   botao escuro      48 px de altura, 968 px de largura
 *
 * ================== A ALTURA DAS DUAS COLUNAS DIVERGE DO ORIGINAL, E O PRINT MOSTRA ==================
 *
 * O original faz `grid md:grid-cols-2` — duas colunas de altura propria. Mas o
 * card da esquerda termina em y=779 e o da direita em y=786: a direita e **7 px
 * mais alta**. Isso e o que um `grid` faz quando um item estica, e nao e um erro
 * de medida: os dois cartoes tem conteudo diferente.
 *
 * (A explicacao de por que essas duas capturas parecem deslocadas uma em relacao
 * a outra — o print `cli-019` comeca em y=88 e o `cli-020` em y=86, e o painel de
 * conteudo aparece com 14 px de diferenca — esta registrada como divergencia: e
 * MANIPULACAO DO PRINT, e nao do original. Ver `PAINEL-CLIENTE-STATUS.md`.)
 *
 * ================== O QUE SAIU, E POR QUE ==================
 *
 * **1. O `saving` — pela MESMA razao do modulo `Dados da Conta`.** A escrita
 * devolve `{ ok: false }` no mesmo tique; um estado de "salvando" que dura zero
 * milissegundos nunca aparece na tela. A CLASSE `disabled:opacity-50` fica.
 *
 * **2. O `confirm()` do original NAO virou `window.confirm`.** O original escreve
 * `if (!confirm("Encerrar todas as sessões? Você precisará entrar novamente."))`.
 * Reproduzir isso aqui seria uma armadilha concreta: a bancada roda em Node, onde
 * `confirm` NAO EXISTE — chamar a funcao de encerramento derrubaria o processo com
 * `ReferenceError: confirm is not defined`, e a tela ficaria intestavel. Pior: um
 * `confirm` bloqueante nao e verificavel por nenhum instrumento desta fase.
 *
 * A confirmacao fica em ESTADO, e o desenho do estado e do proprio original —
 * `Encerrar todas as sessões? Você precisará entrar novamente.` e o texto que ele
 * escreve. A diferenca e que aqui ele aparece numa faixa dentro do cartao, e nao
 * numa caixa do sistema operacional. Ver a divergencia registrada.
 *
 * **3. O `Logout` do rodape FECHA A CONTA — de verdade.** Este e o unico controle
 * desta tela que faz algo real hoje. Ver a nota de `sair` abaixo.
 */

/** O texto exato do `confirm()` do original — agora desenhado, e nao nativo. */
export const PERGUNTA_ENCERRAR = 'Encerrar todas as sessões? Você precisará entrar novamente.';

/** As duas frases de validacao do formulario, literais do original. */
export const ERRO_CURTA = 'Mínimo 6 caracteres';
export const ERRO_DIFERENTE = 'Senhas não conferem';

/**
 * ================== A VALIDACAO DA SENHA, COMO FUNCAO PURA ==================
 *
 * O original faz as duas checagens DENTRO do handler, na ordem:
 *
 *     if (pw.length < 6) return toast.error("Mínimo 6 caracteres");
 *     if (pw !== pw2) return toast.error("Senhas não conferem");
 *
 * Extrair para uma funcao pura e o que permite a bancada provar a ORDEM — e a
 * ordem importa: com as duas senhas curtas e iguais, o aviso tem que ser o da
 * CURTA; com a primeira curta e as duas diferentes, tambem. Uma inversao passaria
 * no typecheck sem reclamar (ver `feedback_condicao_booleana_invisivel`), e so a
 * bancada a pega.
 *
 * `null` = pode seguir. A funcao NAO decide se a senha e boa — decide se o
 * FORMULARIO pode ser enviado, que e outra coisa.
 */
export function validarSenha(senha: string, confirmacao: string): string | null {
  if (senha.length < 6) return ERRO_CURTA;
  if (senha !== confirmacao) return ERRO_DIFERENTE;
  return null;
}

/**
 * O campo de senha do formulario — a mesma forma de `CampoDados` do modulo
 * anterior, e pelo mesmo motivo: e o pedaco montavel.
 *
 * ================== O `type` NAO TEM PADRAO, E ISSO E A PROVA ==================
 *
 * `CampoDados` (em `account-view.tsx`) declara `type = 'text'`. Aqui NAO HA
 * padrao: o `type="password"` e obrigatorio na assinatura. Se ele tivesse um
 * padrao `text`, um esquecimento imprimiria a senha em claro na tela — e o unico
 * jeito de o compilador impedir isso e nao oferecer o padrao. E a diferenca entre
 * um campo de dado e um campo de segredo, escrita no tipo.
 */
export interface CampoSenhaProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}

export function CampoSenha({ label, value, onChange, placeholder }: CampoSenhaProps) {
  return (
    <label className="block">
      <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
        {label}
      </span>
      <input
        type="password"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1.5 h-12 w-full rounded-xl border border-border bg-secondary/30 px-4 text-sm transition-all placeholder:text-placeholder hover:bg-secondary/50 focus:bg-background focus:ring-2 focus:ring-foreground/5"
      />
    </label>
  );
}

/**
 * O quadradinho do icone — `size-10 rounded-xl bg-beige/30`.
 *
 * Ele aparece DUAS vezes nesta tela (nos dois cartoes), com o mesmo `Shield`.
 * Virou componente porque a repeticao e literal, e nao porque ha abstracao: um
 * `h-5 w-5` trocado num dos dois seria uma diferenca que nenhum print justifica.
 */
export function SeloIcone({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex size-10 items-center justify-center rounded-xl bg-secondary/30 text-muted-foreground">
      {children}
    </div>
  );
}

/**
 * O cabecalho de um dos dois cartoes: o quadrado do icone + o `h3` serifado.
 */
export function CabecalhoCartao({ icone, titulo, className }: { icone: React.ReactNode; titulo: string; className: string }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <SeloIcone>{icone}</SeloIcone>
      <h3 className="font-serif text-xl">{titulo}</h3>
    </div>
  );
}

export function SegurancaView() {
  /*
    ================== O `LOGOUT` FECHA A CONTA DE VERDADE ==================

    `usePortaoDaConta()` le o `sair` que a CASCA publica. Nao ha estado de sessao
    nesta tela, e nao deve haver: o portao e um so, e mora em `AccountShell`. Ver
    a nota longa de `PortaoDaConta` em `account-shell.tsx`, com a alternativa que
    foi descartada (um segundo `useState`) e a que nao foi usada (`cloneElement`).

    SEM CASCA, o contexto devolve o padrao — um `async` vazio. O botao continua
    desenhado e clicavel, e nao faz nada. E o que permite a bancada montar a tela
    sozinha, sem um provedor.
  */
  const sair = usePortaoDaConta();

  const [senha, setSenha] = useState('');
  const [confirmacao, setConfirmacao] = useState('');
  const [acesso, setAcesso] = useState<AcessoConta | null>(null);
  const [aviso, setAviso] = useState<{ texto: string; tom: TomAviso } | null>(null);
  /** `null` = nenhuma confirmacao aberta. `true` = a faixa do original esta na tela. */
  const [confirmando, setConfirmando] = useState(false);

  useEffect(() => {
    let ativo = true;
    void getAcesso().then(({ data }) => {
      if (ativo) setAcesso(data);
    });
    return () => {
      ativo = false;
    };
  }, []);

  if (!acesso) {
    return <p className="text-sm text-muted-foreground">Carregando...</p>;
  }

  /**
   * Trocar a senha. NAO GRAVA — e a tela diz isso.
   *
   * ORDEM DAS CHECAGENS: as duas validacoes ANTES de qualquer escrita, e nesta
   * ordem (`curta` antes de `diferente`), como o original. Se a escrita
   * acontecesse primeiro, um erro de digitacao mandaria uma senha truncada para o
   * provedor — e o `return` do original e justamente o que impede isso.
   */
  async function trocarSenha(e: React.FormEvent) {
    e.preventDefault();
    const erro = validarSenha(senha, confirmacao);
    if (erro) {
      setAviso({ texto: erro, tom: 'erro' });
      return;
    }
    const { ok, reason } = await salvarSenha();
    if (!ok) {
      setAviso({ texto: reason ?? 'Ainda não foi possível salvar.', tom: 'erro' });
      return;
    }
    /*
      O ramo de SUCESSO do original — `setPw(""); setPw2(""); toast.success("Senha
      alterada")` — nao e alcancavel sem provedor. Ele fica escrito aqui porque a
      LIMPEZA DOS CAMPOS e parte do comportamento: depois de trocar a senha, os
      campos nao podem continuar preenchidos. Quando o provedor entrar, e este
      ponto que passa a rodar.
    */
    setSenha('');
    setConfirmacao('');
    setAviso({ texto: 'Senha alterada', tom: 'sucesso' });
  }

  /**
   * Encerrar todas as sessoes — a primeira pergunta, depois a escrita.
   *
   * A pergunta vem de `confirmando`, um estado desenhado (ver a nota do topo), e
   * nao de um `confirm()` nativo.
   */
  async function encerrar() {
    setConfirmando(false);
    const { ok, reason } = await encerrarSessoes();
    setAviso(
      ok
        ? { texto: 'Sessões encerradas', tom: 'sucesso' }
        : { texto: reason ?? 'Ainda não foi possível encerrar.', tom: 'erro' },
    );
  }

  return (
    <div className="space-y-8 motion-safe:animate-fade-up">
      <ClienteToast message={aviso?.texto ?? null} tom={aviso?.tom ?? 'sucesso'} />

      {/* O cabecalho proprio desta tela — ver a nota do topo. */}
      <header>
        <h2 className="font-serif text-3xl">Segurança</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Proteja sua conta e gerencie suas sessões ativas.
        </p>
      </header>

      {/*
        A GRADE. `md:grid-cols-2` com `gap-8` — medido: as duas colunas tem 1050 e
        1049 px com um gap de 32 px entre elas.
      */}
      <div className="grid gap-8 md:grid-cols-2">
        <div className="space-y-6">
          <form
            onSubmit={trocarSenha}
            className="space-y-6 rounded-[2rem] border border-border bg-background p-6 shadow-elegant md:p-10"
          >
            <CabecalhoCartao icone={<Shield className="size-5" aria-hidden />} titulo="Alterar Senha" className="mb-2" />

            <div className="space-y-4">
              <CampoSenha
                label="Nova Senha"
                value={senha}
                onChange={setSenha}
                placeholder="Mínimo 6 caracteres"
              />
              <CampoSenha
                label="Confirmar Senha"
                value={confirmacao}
                onChange={setConfirmacao}
                placeholder="Repita a nova senha"
              />
            </div>

            {/*
              `disabled:opacity-50` fica: quando o `saving` voltar, a aparencia ja
              esta pronta. Ver a nota do topo.
            */}
            <button
              type="submit"
              className="h-12 w-full rounded-xl bg-foreground px-8 text-[10px] font-bold uppercase tracking-[0.2em] text-background shadow-lg transition-all hover:opacity-90 active:scale-95 disabled:opacity-50"
            >
              ATUALIZAR SENHA
            </button>
          </form>
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl border border-border bg-background p-6 shadow-soft">
            <CabecalhoCartao icone={<Shield className="size-5" aria-hidden />} titulo="Sessões & Acesso" className="mb-6" />

            <div className="space-y-6">
              {/* O ultimo acesso — `bg-beige/10` -> `bg-secondary/10`, e `border-border/50`. */}
              <div className="rounded-2xl border border-border/50 bg-secondary/10 p-4">
                <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Último Login
                </p>
                <p className="text-sm font-medium">{ultimoAcesso(acesso.ultimoAcessoEm)}</p>
              </div>

              <div className="space-y-3">
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Caso tenha acessado sua conta em um computador público ou compartilhado,
                  recomendamos encerrar todas as sessões ativas.
                </p>

                {/*
                  A FAIXA DE CONFIRMACAO. Ela so existe quando `confirmando`, e
                  ela e o `confirm()` do original desenhado em vez de nativo. As
                  duas respostas usam os rotulos do sistema — `Cancelar` e `OK` —
                  porque e isso que a caixa nativa oferecia; inventar outros
                  rotulos mudaria a decisao que a cliente toma.
                */}
                {confirmando && (
                  <div className="space-y-3 rounded-2xl border border-border bg-secondary/20 p-4">
                    <p className="text-xs font-medium">{PERGUNTA_ENCERRAR}</p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setConfirmando(false)}
                        className="h-10 flex-1 rounded-xl border border-border text-[10px] font-bold uppercase tracking-widest transition-colors hover:bg-background"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={() => void encerrar()}
                        className="h-10 flex-1 rounded-xl border border-danger/40 text-[10px] font-bold uppercase tracking-widest text-danger transition-colors hover:bg-danger/5"
                      >
                        OK
                      </button>
                    </div>
                  </div>
                )}

                {/*
                  O `hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200` do
                  original. As tres classes usam `danger`, que e o token do projeto
                  com o papel exato de "acao destrutiva" — o `--danger` mede
                  (222,60,54) e o `rose-600` do Tailwind mede (225,29,72). Nao sao
                  a mesma cor, e o projeto ja decidiu nao ter dois vermelhos com o
                  mesmo papel. A FORMA do hover (fundo claro + texto e borda
                  vermelhos) e a do original.
                */}
                <button
                  type="button"
                  onClick={() => setConfirmando(true)}
                  disabled={confirmando}
                  className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-border px-6 text-[10px] font-bold uppercase tracking-widest transition-all hover:border-danger/40 hover:bg-danger/5 hover:text-danger disabled:opacity-50"
                >
                  <LogOut className="size-4" aria-hidden /> Encerrar todas as sessões
                </button>
              </div>
            </div>
          </div>

          {/*
            O RODAPE TRACEJADO. O original: `p-6 bg-beige/5 rounded-3xl border
            border-dashed border-border flex items-center justify-between`. A tinta
            `beige/5` sai pelo mesmo motivo de sempre — e o print mede o interior
            em branco puro.
          */}
          <div className="flex items-center justify-between rounded-3xl border border-dashed border-border p-6">
            <span className="text-xs font-medium text-muted-foreground">
              Deseja sair da sua conta?
            </span>
            <button
              type="button"
              onClick={() => void sair()}
              className="text-[10px] font-bold uppercase tracking-[0.2em] text-foreground underline-offset-4 hover:underline"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
