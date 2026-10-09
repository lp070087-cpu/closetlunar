/**
 * As regras do formulario de entrada da AREA DA CLIENTE.
 *
 * ================== O QUE ESTE ARQUIVO NAO E ==================
 *
 * Nao e autenticacao. Nenhuma senha e conferida, nenhum hash existe, nenhum
 * token e emitido. Nao ha provedor nesta fase — a decisao registrada no comando
 * e explicita: nenhum provedor real ainda.
 *
 * O que existe aqui e a VALIDACAO DO FORMULARIO, e ela nao foi escolhida: sao
 * exatamente as regras que o HTML do original ja declara, transcritas do
 * `CustomerLogin.tsx`:
 *
 *     type="email"     no campo de e-mail
 *     required         nos dois campos
 *     minLength={6}    no campo de senha
 *
 * Nada alem disso. Inventar um "minimo de 8 com maiuscula e numero" seria criar
 * uma regra que nenhuma fonte mostra; inventar a FRASE da recusa seria pior
 * ainda, porque o original nao escreve frase nenhuma — quem escreve e o proprio
 * navegador, a partir dos atributos acima.
 *
 * ================== POR QUE ISTO NAO VIVE DENTRO DO COMPONENTE ==================
 *
 * Porque a bancada precisa provar a regra sem clicar. Um `if` dentro de um
 * `onSubmit` so se prova interagindo; uma funcao pura se prova chamando. O
 * componente continua sendo quem DECIDE o que fazer com o veredito — o texto do
 * erro, por exemplo, mora em `sessao.ts` e nao aqui.
 *
 * ================== POR QUE A UNICA MENSAGEM E A DE CREDENCIAL ==================
 *
 * `ERRO_CREDENCIAL` e a unica frase de recusa que alguma fonte desta fase
 * comprova: e o `toast.error` do original. Ela e devolvida em toda recusa, e a
 * nota em `sessao.ts` ja registra o motivo — nesta fase, enviar o formulario
 * vazio e a unica condicao de recusa que se pode PROVAR de verdade, ja que nao
 * ha provedor para recusar uma credencial.
 */

import { ERRO_CREDENCIAL, MENSAGEM_ENTROU } from './sessao';

/**
 * O comprimento minimo da senha — o `minLength={6}` do original.
 *
 * Ele existe UMA vez. E lido pelo atributo do `<input>` e por esta validacao;
 * com dois literais soltos, o dia em que um mudasse o outro continuaria
 * mentindo em silencio.
 */
export const SENHA_MINIMA = 6;

/** Os campos que a validacao le. Nome e telefone sao do cadastro, nao da entrada. */
export interface DadosLogin {
  email: string;
  senha: string;
}

/**
 * O veredito do formulario.
 *
 * `motivo` e `null` quando pode enviar; caso contrario, ja vem com o TEXTO que
 * a tela mostra — assim nao existem duas redacoes da mesma recusa.
 */
export interface ResultadoLogin {
  valido: boolean;
  motivo: string | null;
}

/**
 * As regras do original, na ordem do formulario.
 *
 * A forma do e-mail (tem `@`, tem dominio, o dominio tem ponto) e o que
 * `type="email"` verifica **sem** JavaScript, e por isso nao depende de rede nem
 * de entregabilidade — o proprio navegador nao valida isso, e tentar aqui seria
 * inventar uma checagem que a referencia nao pede.
 */
export function validarLogin({ email, senha }: DadosLogin): ResultadoLogin {
  const emailLimpo = email.trim();

  // `required` dos dois campos.
  if (emailLimpo === '' || senha === '') return { valido: false, motivo: ERRO_CREDENCIAL };

  // `type="email"`: forma minima, sem tentar validar entrega.
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailLimpo)) return { valido: false, motivo: ERRO_CREDENCIAL };

  // `minLength={6}`.
  if (senha.length < SENHA_MINIMA) return { valido: false, motivo: ERRO_CREDENCIAL };

  return { valido: true, motivo: null };
}

/**
 * O que o envio bem-sucedido faz, na demonstracao.
 *
 * Devolve a mensagem que o aviso mostra. Ela vem de `sessao.ts` e nao nasce
 * aqui: `MENSAGEM_ENTROU` e o texto do aviso do print, e a bancada o prende la.
 *
 * A FUNCAO EXISTE PARA QUE A TELA NAO DECIDA. Quando o provedor real entrar, e
 * aqui que uma credencial recusada vira erro — o componente nao muda.
 */
export function entrar(_dados: DadosLogin): { ok: true; mensagem: string } {
  return { ok: true, mensagem: MENSAGEM_ENTROU };
}
