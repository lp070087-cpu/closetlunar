'use client';

import { createContext, useContext, useState } from 'react';
import { usePathname } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { SIGN_OUT_LABEL } from '@/lib/cliente/nav';
import { AccountMobileNav } from './account-mobile-nav';
import { AccountSidebar } from './account-sidebar';
import { CustomerLogin } from './customer-login';
import { StoreFooter } from './store-footer';
import { StoreHeader } from './store-header';

/**
 * A CASCA da area da cliente: cabecalho da loja, saudacao, coluna de navegacao,
 * painel de conteudo e faixa final.
 *
 * ================== AS MEDIDAS, E DE ONDE CADA UMA VEM ==================
 *
 * Nenhuma medida aqui foi escolhida no olho. A captura de `cli-019` foi lida
 * pixel a pixel, e a SOMA FECHA na largura da imagem:
 *
 *   recuo lateral esquerdo        x 0..12      ->   12 px
 *   coluna de navegacao        x 12..272      ->  260 px  (original: `260px`)
 *   vao entre coluna e painel x 272..312      ->   40 px  (original: `lg:gap-10` = 40px)
 *   painel de conteudo        x 312..2524     -> 2212 px  (original: `1fr`)
 *   recuo lateral direito     x 2524..2536    ->   12 px
 *                                             ----------
 *                                  total       2536 px  = largura exata do print
 *
 * A prova e a SOMA. As bordas dos dois cartoes foram encontradas pela cor
 * `--border` — (233,227,223), amostrada em x=10, 269, 310 e 2522 — e as quatro
 * posicoes produzem, com o `12` das pontas, exatamente a largura da captura.
 * Nao ha folga para um recuo maior.
 *
 * ================== POR QUE NAO HA TETO DE LARGURA ==================
 *
 * A casca NAO tem `max-w-*`. O recuo lateral e o `container mx-auto px-3
 * sm:px-4` do original (ver `AccountLayout.tsx`, linha 48: `container mx-auto
 * px-3 sm:px-4 py-6 md:py-14 max-w-full overflow-x-hidden`), e `max-w-full` e
 * literal. Um teto proprio — `max-w-shell`, por exemplo — deslocaria a coluna
 * de navegacao para dentro assim que a janela passasse de 1600 px, e o print
 * nao mostra deslocamento nenhum: nesta largura a coluna comeca no primeiro
 * pixel do recuo.
 *
 * A captura e de ~2536 px de largura e ~1268 px de CSS (captura em 2x). O
 * `container` padrao do Tailwind so passa a limitar acima do breakpoint `2xl`,
 * que e mais largo do que qualquer coisa que o material mostre — entao usa-lo e
 * reproduzir o print.
 *
 * ================== O QUE A CASCA NAO FAZ ==================
 *
 * Nao decide o que aparece dentro do painel: ela recebe `children`. Assim as
 * nove telas compartilham a mesma moldura sem que a moldura conheca nenhuma
 * delas.
 *
 * Tambem nao monta o cabecalho de cada tela. O titulo do PAINEL (`Favoritos`,
 * `Meus Pedidos`) pertence a tela, e nao a casca — em `cli-017` ele tem uma
 * linha de apoio que as outras telas nao tem, e esse e o tipo de diferenca que
 * se perde quando a moldura tenta adivinhar.
 *
 * ================== MAS ELA DECIDE SE A AREA APARECE ==================
 *
 * A casca e TAMBEM o portao da area: sem sessao, ela troca o painel inteiro pelo
 * formulario de entrada. E o comportamento do original, que faz isso no layout
 * do cliente (`AccountLayout.tsx`, linha 42), e nao numa rota propria. Ver a nota
 * de `dentro`, abaixo.
 */
/**
 * ================== O PORTAO PRECISA DE UMA PORTA — E A CASCA NAO A TINHA ==================
 *
 * O estado de sessao (`dentro`) mora aqui, e ate o modulo `Segurança` ninguem de
 * fora precisava dele: os dois botoes que fecham a conta (o da coluna, no
 * desktop, e o de largura total, no celular) sao filhos DESTE componente e
 * recebem `sair` por prop.
 *
 * A tela `Segurança` quebra isso. O print `cli-020` mostra, no rodape tracejado,
 * um `LOGOUT` — e o original o liga no MESMO `signOut()` dos outros dois. So que
 * a tela chega aqui como `children`, e `children` sao elementos que a PAGINA ja
 * criou. A pagina nao tem `sair`: ela e um Server Component. Entao a tela nao
 * alcancava o portao por prop nenhuma.
 *
 * ================== A SAIDA ERRADA, E POR QUE FOI DESCARTADA ==================
 *
 * A tentacao obvia e a tela ter o proprio `useState(false)`. Seria um SEGUNDO
 * portao: o `LOGOUT` fecharia a copia da tela e a casca continuaria mostrando a
 * conta. Duas verdades de sessao na mesma arvore e exatamente o que a regra
 * "NAO crie um login paralelo" proibe — e o defeito seria silencioso, porque as
 * duas metades ficariam cada uma coerente consigo mesma.
 *
 * ================== POR QUE CONTEXTO, E NAO CLONAR O FILHO ==================
 *
 * A alternativa era a casca ler `children` e injetar `onSair` no filho
 * (`cloneElement`). Ela funciona, mas tem duas arestas: descobrir QUEM precisa
 * da prop exige ou uma lista de tipos (que envelhece) ou uma varredura em que
 * todo `<div>` recebe um `onSair` que o React denuncia como prop desconhecida.
 *
 * O contexto nao tem esse problema, e a razao e sutil: o contexto vale por
 * POSICAO NA ARVORE, e nao por quem criou o elemento. Mesmo que a pagina tenha
 * criado `<SegurancaView />` antes, no momento em que a casca o RENDERIZA dentro
 * do provedor, a tela passa a ser descendente dele — e enxerga `sair`.
 *
 * ================== E O PADRAO NAO E UM ERRO ==================
 *
 * O valor padrao e um `async () => {}`. Ele e o que a bancada usa: montar a tela
 * sem casca tem que ser possivel, e uma tela de seguranca sem casca nao tem
 * conta para encerrar. O botao fica na tela e nao faz nada, em vez de derrubar a
 * renderizacao — que e o que um `throw` no padrao faria.
 *
 * `async` porque encerrar sessao um dia vai ao servidor. Hoje nao vai (ver
 * `sair`), e o tipo ja esta pronto para quando for.
 */
export type Sair = () => Promise<void>;

export const PortaoDaConta = createContext<Sair>(async () => {});

/** O portao, visto de dentro do painel de conteudo. */
export function usePortaoDaConta(): Sair {
  return useContext(PortaoDaConta);
}

export interface AccountShellProps {
  /** Saudacao ja resolvida (`Olá, lp070087@gmail.com`). Ver `saudacao()`. */
  saudacao: string;
  children: React.ReactNode;
}

export function AccountShell({ saudacao, children }: AccountShellProps) {
  const pathname = usePathname();
  const [dentro, setDentro] = useState(true);

  /**
   * ================== O PORTAO: A ENTRADA VIVE AQUI, E NAO NUMA ROTA ==================
   *
   * O original decide a area inteira dentro do layout do cliente:
   *
   *     if (!user) return <CustomerLogin />;   // AccountLayout.tsx, linha 42
   *
   * Nao ha `/conta/login`. O formulario SUBSTITUI a area quando nao ha sessao, e
   * e um PORTAO, nao uma pagina. Reproduzir isso aqui — e nao criar uma rota —
   * mantem a URL identica a do material e evita um segundo caminho para a mesma
   * coisa.
   *
   * POR QUE O ESTADO NASCE `true`. A sessao de demonstracao ja existe
   * (`getConta()`, em `data.ts`, devolve a conta dos prints), e o material
   * COMECA com a cliente ja dentro: o print `cli-001` e o Dashboard, nao a tela
   * de entrada. Abrir no portao faria a area contradizer o unico estado que os
   * prints provam. Entao a casca nasce DENTRO, como o material — e o portao
   * aparece quando `Sair da conta` e clicado, que e o unico gesto que produz o
   * estado "sem sessao".
   *
   * ISTO NAO E SEGURANCA. Um booleano no cliente nao protege rota nenhuma; a
   * protecao real vai em middleware e no banco, na fase de integracao. Ver a nota
   * em `lib/cliente/sessao.ts`.
   */

  /**
   * SAIR ABRE O PORTAO — e nao finge um logout REAL.
   *
   * Nao ha sessao no servidor para encerrar (ver `lib/cliente/sessao.ts`); o que
   * existe e o estado desta aba. Entao `Sair` faz a unica coisa verdadeira que
   * pode fazer: devolve a tela de entrada, deixando claro que a persistencia so
   * entra na fase de integracao. Um redirecionamento para um provedor tambem
   * mentiria — e pior, porque pareceria um logout de verdade.
   */
  async function sair() {
    setDentro(false);
  }

  function entrar() {
    setDentro(true);
  }

  /*
    ================== O PORTAO, COM O AVISO DE HONESTIDADE ==================

    A tela de entrada aparece DENTRO do cabecalho e do rodape da loja, como no
    original (o `CustomerLogin` do original e montado dentro do `__root.tsx`, que
    injeta `Header` e `Footer` em toda rota).

    A linha abaixo do formulario e o aviso registrado na bancada: `Sair` e o
    `Entrar` desta fase NAO criam sessao no servidor — a persistencia entra na
    fase de integracao. Sem ela, o botao `ENTRAR` pareceria autenticar de
    verdade, que e justamente a promessa que esta fase nao pode fazer.
  */
  if (!dentro) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <StoreHeader />
        <main className="flex-1">
          <CustomerLogin onEntrar={entrar} />
          <p className="mx-auto mb-10 max-w-md px-4 text-center text-xs text-muted-foreground">
            Entrar ainda não encerra sessão nem cria uma: a autenticação real entra na fase de integração.
          </p>
        </main>
        <StoreFooter />
      </div>
    );
  }

  return (
    /*
      `data-cliente-area` e o MESMO atributo do projeto original
      (`<div data-account-area ...>`) e NAO e decorativo: ele e a raiz do escopo
      desta area, para que um dia uma regra so do cliente possa ser escrita sem
      alcancar o admin. Hoje nao ha nenhuma.
    */
    <div data-cliente-area className="flex min-h-screen flex-col bg-background">
      <StoreHeader />

      {/*
        `overflow-x-clip` — e NAO `overflow-x-hidden`.

        O original declara `overflow-x-hidden` aqui, mas o que ele recorta e o
        estouro horizontal, e `hidden` faria isso criando um container de
        rolagem. O efeito colateral passa calado: TODO `position: sticky` de
        dentro deixa de colar — e a coluna de navegacao e `sticky top-28`. A
        coluna simplesmente pararia de acompanhar a rolagem, sem erro nenhum.

        `clip` recorta igual e NAO cria container de rolagem. E a conversao
        correta da intencao, e nao um desvio dela.
      */}
      <div className="mx-auto w-full max-w-full flex-1 overflow-x-clip px-3 py-6 sm:px-4 md:py-14">
        {/* Cabecalho da area: `MINHA CONTA` + `Ola, ...` */}
        <div className="mb-6 flex flex-col justify-between gap-4 md:mb-10 md:flex-row md:items-end">
          <div className="min-w-0">
            <p className="mb-1 text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
              Minha Conta
            </p>
            {/*
              `truncate` vem do original, e o print justifica: o e-mail e longo
              e a saudacao tem que caber numa linha so. Sem ele, um e-mail maior
              quebraria o alinhamento com a coluna de navegacao.
            */}
            <h1 className="truncate font-serif text-2xl sm:text-3xl md:text-5xl">{saudacao}</h1>
          </div>

          {/*
            O botao de sair em largura total ACIMA do conteudo existe SO no
            celular — no desktop ele e o ultimo item da coluna. E o que o
            original faz (`md:hidden`), e e o que evita uma saida inalcancavel
            quando a coluna esta escondida.
          */}
          <button
            type="button"
            onClick={sair}
            className="focus-ring flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-background px-6 py-3 text-sm font-medium text-danger shadow-soft md:hidden"
          >
            <LogOut className="size-4" aria-hidden />
            {SIGN_OUT_LABEL}
          </button>
        </div>

        <div className="grid gap-6 lg:grid-cols-[260px_1fr] lg:gap-10">
          <AccountMobileNav pathname={pathname} />

          <aside className="hidden lg:block">
            <AccountSidebar pathname={pathname} onSignOut={sair} />
          </aside>

          <main className="min-w-0 pb-16">
            {/*
              O painel de conteudo: `rounded-[2.5rem]` e `lg:p-10` no desktop,
              `rounded-2xl` e `p-4` no celular — literalmente as classes do
              original. `overflow-hidden` garante que uma imagem ou tabela larga
              nao escape do canto arredondado.
            */}
            <div className="overflow-hidden rounded-2xl border border-border bg-background p-4 shadow-sm sm:p-6 lg:rounded-[2.5rem] lg:p-10 lg:shadow-elegant">
              {/*
                O PROVEDOR DO PORTAO envolve o painel, e nao a casca inteira: o
                estado que ele distribui (`sair`) so interessa a quem esta DENTRO
                do painel. Ver a nota longa de `PortaoDaConta`.
              */}
              <PortaoDaConta.Provider value={sair}>{children}</PortaoDaConta.Provider>
            </div>
          </main>
        </div>
      </div>

      <StoreFooter />
    </div>
  );
}
