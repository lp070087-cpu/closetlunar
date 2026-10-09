'use client';

import { useEffect, useState } from 'react';
import { getConta, salvarDadosConta } from '@/lib/cliente/data';
import type { ContaCliente } from '@/lib/cliente/types';
import { ClienteToast, type TomAviso } from './cliente-toast';

/**
 * `Dados da Conta` — `/conta/dados`, os prints `cli-017` (`004857`) e `cli-018`
 * (`004905`).
 *
 * ================== O CABECALHO DESTA TELA E PROPRIO ==================
 *
 * O mesmo caso de `Endereços`, `Minhas Medidas`, `Clube VIP & Cashback` e
 * `Cupons`: o original declara o cabecalho como o PRIMEIRO filho de um
 * `space-y-8`, e o `ClientPageHeader` carrega `mb-6`, que somado ao `space-y-8`
 * daria 56 px onde o print mostra 32. Ver a nota longa em `addresses-view.tsx`,
 * que e onde a decisao foi tomada.
 *
 * ================== O FORMULARIO E DO ORIGINAL — E O PRINT CONFIRMA CAMPO A CAMPO ==================
 *
 * Diferente do formulario de `Endereços` (que so existe no original), ESTE
 * aparece nos dois prints, e os dois batem:
 *
 *   - o campo `NOME COMPLETO` ocupa as DUAS colunas (o `sm:col-span-2` do
 *     original), e o print o mostra sozinho numa linha de largura cheia;
 *   - `TELEFONE / WHATSAPP` e `E-MAIL DE ACESSO` ficam lado a lado, com o
 *     telefone VAZIO (mostrando o `placeholder (00) 00000-0000`) e o e-mail
 *     PREENCHIDO com o endereco da conta;
 *   - o botao escuro `SALVAR ALTERAÇÕES` fica no canto ESQUERDO, depois de uma
 *     linha divisoria.
 *
 * A largura do botao foi medida: 222 px de tinta num cartao de 1x, que e o
 * `px-10` (40 + 40) mais a largura do texto em `text-[10px]` com
 * `tracking-[0.2em]` — o `w-full md:w-auto` do original, no ramo `md:`.
 *
 * ================== O QUE SAIU DO ORIGINAL, E POR QUE ==================
 *
 * O estado `saving` do original (`setSaving(true)` … `finally
 * setSaving(false)`) existe porque a chamada de rede PODE demorar, e o botao
 * troca para `SALVANDO...` enquanto isso. Aqui a escrita nao vai a lugar nenhum:
 * ela devolve `{ ok: false, reason }` no MESMO tique. Um estado de "salvando"
 * que dura zero milissegundos nunca aparece na tela — ele seria codigo morto
 * desenhando um spinner que ninguem ve. O botao NAO tem `disabled`, e o texto e
 * sempre `SALVAR ALTERAÇÕES`.
 *
 * O `disabled:opacity-50` do original fica na classe de proposito: quando o
 * provedor de auth entrar e o `saving` voltar, a classe ja esta no lugar. O que
 * falta e o ESTADO, nao a aparencia.
 *
 * ================== AS TINTAS `beige` — A MESMA CONVERSAO DE SEMPRE ==================
 *
 * O original pinta DOIS pontos de beige: o cartao `Segurança do E-mail`
 * (`bg-beige/10`) e os quatro campos (`bg-beige/10`, no `Field`). O token
 * `beige` NAO EXISTE neste projeto e a tinta e praticamente invisivel — a mesma
 * medicao de `Favoritos` (a 5% e 20% o material mostra (255,254,254) e
 * (253,251,249)).
 *
 * A conversao aqui e um pouco diferente da das outras telas, e a razao esta
 * medida: os campos usam `bg-secondary/30` (o que `Minhas Medidas` ja faz nos
 * campos de la, o mesmo papel) e o cartao de aviso fica com `bg-secondary/10`,
 * que e o `/10` do original na familia `secondary`. Nao e uma tinta nova: e o
 * MESMO `/10` do original, no token que existe.
 *
 * O cartao `Privacidade` do original e `bg-background` — sem tinta nenhuma. Ele
 * fica como esta.
 */

/** O formulario de dados da conta — `Field` do original. */
export interface CampoDadosProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}

/**
 * O CAMPO DO FORMULARIO.
 *
 * Exportado para a bancada poder MONTA-LO. Ele e o pedaco que carrega o
 * `placeholder` do telefone e o `type="email"` do e-mail — as duas declaracoes
 * que o print confirma — e monta-lo e a unica forma de provar que o
 * `placeholder` sai no HTML sem depender da view inteira (que espera efeito).
 */
export function CampoDados({ label, value, onChange, type = 'text', placeholder }: CampoDadosProps) {
  return (
    <label className="block">
      <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
        {label}
      </span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1.5 h-12 w-full rounded-xl border border-border bg-secondary/30 px-4 text-sm font-medium transition-all placeholder:text-placeholder hover:bg-secondary/50 focus:bg-background focus:ring-2 focus:ring-foreground/5"
      />
    </label>
  );
}

/**
 * Os dois cartoes de aviso da coluna lateral.
 *
 * Eles sao TEXTO PURO — nao ha estado, nem acao, nem dado. Por isso sao um
 * componente com dois filhos, e nao dois blocos copiados: os dois tem a mesma
 * forma (`rounded-3xl border border-border p-6 bg-background shadow-soft` +
 * `h4` serif + paragrafo `text-xs leading-relaxed`), e so trocam o titulo, o
 * corpo e o fundo.
 *
 * O `Segurança do E-mail` e o unico dos dois com fundo (`bg-beige/10` no
 * original -> `bg-secondary/10`). Ver a nota do topo.
 */
export interface CartaoAvisoProps {
  titulo: string;
  children: string;
  /** `true` no cartao que tem fundo. O `Privacidade` do original nao tem. */
  comFundo?: boolean;
}

export function CartaoAviso({ titulo, children, comFundo = false }: CartaoAvisoProps) {
  return (
    <div
      className={`rounded-3xl border border-border p-6 shadow-soft ${
        comFundo ? 'bg-secondary/10' : 'bg-background'
      }`}
    >
      <h4 className="mb-3 font-serif text-lg">{titulo}</h4>
      <p className="text-xs leading-relaxed text-muted-foreground">{children}</p>
    </div>
  );
}

export function AccountView() {
  const [conta, setConta] = useState<ContaCliente | null>(null);
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [email, setEmail] = useState('');
  const [aviso, setAviso] = useState<{ texto: string; tom: TomAviso } | null>(null);

  useEffect(() => {
    let ativo = true;
    void getConta().then(({ data }) => {
      if (!ativo) return;
      setConta(data);
      /*
        O formulario nasce do DADO, como o `useEffect` do original
        (`setName(user_metadata.full_name ?? "")`). Os campos ficam em estado
        proprio porque a cliente os EDITA — copiar o dado para o formulario e o
        que permite editar sem escrever por cima da conta antes de salvar.
      */
      setNome(data.nomeCompleto ?? '');
      setTelefone(data.telefone ?? '');
      setEmail(data.email);
    });
    return () => {
      ativo = false;
    };
  }, []);

  if (!conta) {
    return <p className="text-sm text-muted-foreground">Carregando...</p>;
  }

  /**
   * Salvar. NAO GRAVA — e a tela diz isso, como todas as outras desta fase.
   *
   * O E-MAIL TROCADO TEM UM AVISO PROPRIO. O original escreve
   * `Confirme o novo e-mail na sua caixa de entrada.` quando o endereco mudou, e
   * `Dados atualizados` quando nao mudou — porque trocar o e-mail NAO troca o
   * e-mail: ele manda um link de confirmacao e a conta segue com o antigo ate a
   * confirmacao. Aqui, como nada grava, o aviso e sempre o `reason`; mas o
   * cartao `Segurança do E-mail` ao lado ja explica a regra, e o ramo do
   * sucesso (quando o provedor entrar) esta escrito abaixo, comentado, para a
   * proxima fase nao ter que redescobrir a diferenca.
   */
  async function salvar() {
    const { ok, reason } = await salvarDadosConta();
    setAviso(
      ok
        ? {
            // Trocar o e-mail NAO confirma na hora — o aviso muda, como no original.
            texto:
              email !== conta?.email
                ? 'Confirme o novo e-mail na sua caixa de entrada.'
                : 'Dados atualizados',
            tom: 'sucesso',
          }
        : { texto: reason ?? 'Ainda não foi possível salvar.', tom: 'erro' },
    );
    /*
      ATENCAO para a proxima fase: o `nome`/`telefone` do formulario NAO voltam
      para `conta` aqui. Enquanto a escrita nao grava, atualizar o `conta` faria
      a tela mostrar como SALVO um valor que nao foi — e o proximo `salvar`
      compararia o e-mail contra o valor ja "aceito", calando o aviso de
      confirmacao. Quando o provedor entrar, e este ponto que muda.
    */
  }

  return (
    <div className="space-y-8 motion-safe:animate-fade-up">
      <ClienteToast message={aviso?.texto ?? null} tom={aviso?.tom ?? 'sucesso'} />

      {/* O cabecalho proprio desta tela — ver a nota do topo. */}
      <header>
        <h2 className="font-serif text-3xl">Dados da Conta</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Gerencie suas informações pessoais de contato e acesso.
        </p>
      </header>

      {/*
        A GRADE. `lg:grid-cols-[1fr_320px]` — a coluna do formulario flexivel e
        a lateral FIXA de 320 px, como o original. Medida no `cli-017`: oito
        colunas na escala 1x, cartao principal de x=352 a x=2130 (1779 px) e
        lateral de x=2160 a x=2482 (323 px), com o `gap-8` (32 px) entre os dois.
      */}
      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void salvar();
          }}
          className="space-y-6 rounded-[2rem] border border-border bg-background p-6 shadow-elegant md:p-10"
        >
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <CampoDados label="Nome Completo" value={nome} onChange={setNome} />
            </div>
            <CampoDados
              label="Telefone / WhatsApp"
              value={telefone}
              onChange={setTelefone}
              placeholder="(00) 00000-0000"
            />
            <CampoDados
              label="E-mail de acesso"
              type="email"
              value={email}
              onChange={setEmail}
            />
          </div>

          <div className="border-t border-border/50 pt-6">
            {/*
              `disabled:opacity-50` fica: quando o `saving` voltar, a aparencia
              ja esta pronta. Ver a nota do topo sobre o estado que saiu.
            */}
            <button
              type="submit"
              className="h-12 w-full rounded-xl bg-foreground px-10 text-[10px] font-bold uppercase tracking-[0.2em] text-background shadow-lg transition-all hover:opacity-90 active:scale-95 disabled:opacity-50 md:w-auto"
            >
              SALVAR ALTERAÇÕES
            </button>
          </div>
        </form>

        <div className="space-y-6">
          <CartaoAviso titulo="Segurança do E-mail" comFundo>
            {'Ao alterar seu e-mail, você precisará confirmar a mudança através de um link enviado para o novo endereço. Sua conta permanecerá ativa com o e-mail atual até a confirmação.'}
          </CartaoAviso>
          <CartaoAviso titulo="Privacidade">
            {'Seus dados são utilizados exclusivamente para processamento de pedidos e melhoria da sua experiência na Closet Lunar.'}
          </CartaoAviso>
        </div>
      </div>
    </div>
  );
}
