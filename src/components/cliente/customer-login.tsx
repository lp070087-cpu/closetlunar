'use client';

import { useState } from 'react';
import { Eye, EyeOff, Sparkles } from 'lucide-react';
import { ERRO_CREDENCIAL, MANTER_CONECTADO_PADRAO, MENSAGEM_ENTROU, MENSAGEM_RECUPERACAO, type ModoConta } from '@/lib/cliente/sessao';
import { SENHA_MINIMA, validarLogin } from '@/lib/cliente/login';
import { ClienteToast, type TomAviso } from './cliente-toast';

/**
 * O formulario de entrada da area da cliente.
 *
 * ================== ESTA E A UNICA TELA DA FASE 2 SEM PRINT ==================
 *
 * As outras nove telas tem captura. Esta nao: o material do cliente comeca com a
 * cliente JA DENTRO — a prova e o proprio print `cli-001`, que mostra o
 * Dashboard e, no canto, o aviso `Bem-vinda de volta!`, que e o que a entrada
 * acabou de produzir. O unico vestigio da tela de entrada no material e o EFEITO
 * dela.
 *
 * Por isso a estrutura inteira vem do ORIGINAL
 * (`components/site/account/CustomerLogin.tsx`), e nao de um print: campos,
 * ordem, o olho da senha, o `Manter conectado`, os textos dos botoes e a
 * alternancia entre `Entrar` e `Criar conta`. Onde o original nao escreve, nao
 * se escreve — ver `lib/cliente/login.ts`.
 *
 * ================== ELE NAO E UMA ROTA ==================
 *
 * No original esta tela nao tem endereco: `AccountLayout.tsx` faz
 * `if (!user) return <CustomerLogin />;` — ela SUBSTITUI a area inteira quando
 * nao ha sessao. E um PORTAO, e nao uma pagina. Aqui e igual: quem decide e
 * `account-shell.tsx`, e nao o roteador. Inventar `/conta/login` seria criar uma
 * URL que o material nao tem e um segundo caminho para a mesma coisa.
 *
 * ================== O ENVIO NAO AUTENTICA ==================
 *
 * Ver `lib/cliente/login.ts` e `lib/cliente/sessao.ts`: nao ha provedor. O envio
 * bem-sucedido aqui liga a sessao de demonstracao da casca — e a sessao morre
 * com a aba, porque nao ha persistencia (e a nota em `sessao.ts` explica por
 * que gravar no navegador seria mentira nesta fase).
 */
export interface CustomerLoginProps {
  /**
   * Chamado quando o formulario passa na validacao. E o que a casca usa para
   * trocar o portao pela area.
   */
  onEntrar: () => void;
}

export function CustomerLogin({ onEntrar }: CustomerLoginProps) {
  const [modo, setModo] = useState<ModoConta>('login');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [nome, setNome] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [manterConectado, setManterConectado] = useState(MANTER_CONECTADO_PADRAO);
  const [aviso, setAviso] = useState<{ texto: string; tom: TomAviso } | null>(null);

  /** Aplica o veredito da validacao e, se passou, entra. */
  function enviar(evento: React.FormEvent) {
    evento.preventDefault();
    const { valido, motivo } = validarLogin({ email, senha });

    if (!valido) {
      setAviso({ texto: motivo ?? ERRO_CREDENCIAL, tom: 'erro' });
      return;
    }

    // Demonstracao: nao ha credencial para conferir. Ver o topo do arquivo.
    setAviso({ texto: MENSAGEM_ENTROU, tom: 'sucesso' });
    onEntrar();
  }

  /*
    `Esqueci minha senha` no original depende de e-mail preenchido — sem ele,
    `toast.error('Informe seu e-mail primeiro')`. A frase e do original e nao
    nasce aqui; a recuperacao em si precisaria de provedor, que esta fase nao
    tem, entao o botao AVISA em vez de fingir que mandou o e-mail.
  */
  function esqueci() {
    if (email.trim() === '') {
      setAviso({ texto: 'Informe seu e-mail primeiro', tom: 'erro' });
      return;
    }
    setAviso({ texto: MENSAGEM_RECUPERACAO, tom: 'sucesso' });
  }

  const entrada = modo === 'login';

  return (
    <div className="container mx-auto max-w-md px-4 py-16">
      <ClienteToast message={aviso?.texto ?? null} tom={aviso?.tom ?? 'sucesso'} />

      <div className="mb-8 text-center">
        <div className="mb-4 inline-flex size-12 items-center justify-center rounded-full bg-foreground text-background">
          <Sparkles className="size-5" aria-hidden />
        </div>
        <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Minha Conta</p>
        <h1 className="mt-1 font-serif text-3xl">{entrada ? 'Entrar' : 'Criar conta'}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {entrada ? 'Acesse seu universo Closet Lunar' : 'Sua nova experiência fashion começa aqui'}
        </p>
      </div>

      <form onSubmit={enviar} className="space-y-3 rounded-2xl border border-border bg-card p-6">
        {!entrada && (
          <>
            <input
              required
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Nome completo"
              className="focus-ring h-11 w-full rounded-xl border border-border bg-background px-4 text-sm"
            />
            <input
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              placeholder="WhatsApp (opcional)"
              className="focus-ring h-11 w-full rounded-xl border border-border bg-background px-4 text-sm"
            />
          </>
        )}

        <input
          required
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="E-mail"
          className="focus-ring h-11 w-full rounded-xl border border-border bg-background px-4 text-sm"
        />

        <div className="relative">
          <input
            required
            type={mostrarSenha ? 'text' : 'password'}
            minLength={SENHA_MINIMA}
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            placeholder="Senha"
            className="focus-ring h-11 w-full rounded-xl border border-border bg-background px-4 pr-11 text-sm"
          />
          <button
            type="button"
            onClick={() => setMostrarSenha((s) => !s)}
            aria-label={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
            className="focus-ring absolute right-3 top-1/2 -translate-y-1/2 rounded text-muted-foreground hover:text-foreground"
          >
            {mostrarSenha ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
          </button>
        </div>

        {entrada && (
          <label className="flex cursor-pointer select-none items-center gap-2 text-xs text-muted-foreground">
            <input
              type="checkbox"
              checked={manterConectado}
              onChange={(e) => setManterConectado(e.target.checked)}
              className="size-4 rounded border-border"
            />
            Manter conectado neste dispositivo
          </label>
        )}

        <button
          type="submit"
          className="focus-ring h-11 w-full rounded-xl bg-foreground text-sm tracking-[0.12em] text-background"
        >
          {entrada ? 'ENTRAR' : 'CRIAR CONTA'}
        </button>

        {entrada && (
          <button
            type="button"
            onClick={esqueci}
            className="focus-ring w-full rounded text-xs text-muted-foreground hover:text-foreground"
          >
            Esqueci minha senha
          </button>
        )}
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        {entrada ? 'Ainda não tem conta?' : 'Já tem conta?'}{' '}
        <button
          type="button"
          onClick={() => setModo(entrada ? 'signup' : 'login')}
          className="focus-ring rounded text-foreground underline-offset-4 hover:underline"
        >
          {entrada ? 'Criar agora' : 'Entrar'}
        </button>
      </p>
    </div>
  );
}
