/**
 * A sessao da AREA DA CLIENTE.
 *
 * ================== POR QUE ISTO NAO E AUTENTICACAO ==================
 *
 * Nesta fase NAO existe login real: nenhum provedor esta conectado, nenhum
 * cookie e assinado, nenhuma senha e conferida. O que existe e a EXPERIENCIA
 * comprovada pela referencia (`CustomerLogin.tsx`): os campos, o olho da senha,
 * o `Manter conectado`, as duas mensagens de retorno e o estado de erro.
 *
 * O que este arquivo entrega e a MESMA COISA que `lib/access.ts` entrega ao
 * admin: um unico ponto de troca. Quando o login real entrar, troca-se o corpo
 * de `getContaSessao()` e nenhuma tela muda.
 *
 * ATENCAO, e vale escrever: NADA AQUI E BARREIRA DE SEGURANCA. Um `boolean` no
 * cliente nao protege rota nenhuma. A protecao real vai em middleware e no
 * banco, na fase de integracao.
 *
 * ================== POR QUE O ESTADO VIVE EM MEMORIA ==================
 *
 * O `localStorage` existe no original (`customer-session-only`), mas aqui ele
 * seria mentira por dois motivos: a area inteira ja assume a conta de
 * demonstracao, e uma sessao que "gruda" no navegador faria a proxima abertura
 * parecer autenticada sem que nada tenha sido conferido. Enquanto nao ha
 * provedor, o estado morre com a aba — e o comportamento assume isso.
 */

/**
 * A preferencia de "Manter conectado neste dispositivo".
 *
 * So o ESTADO, sem persistencia (ver a nota acima). O original nasce com `true`
 * (`useState(true)`), e o print do formulario mostra a caixa marcada — entao e
 * `true` que a demonstracao entrega.
 */
export const MANTER_CONECTADO_PADRAO = true;

/** As duas mensagens de sucesso do original, na letra dele. */
export const MENSAGEM_ENTROU = 'Bem-vinda de volta!';
export const MENSAGEM_CONTA_CRIADA = 'Conta criada! Verifique seu e-mail para confirmar.';
export const MENSAGEM_RECUPERACAO = 'Enviamos um e-mail de recuperação.';

/**
 * O erro de credencial, na letra do original
 * (`"E-mail ou senha incorretos. Tente novamente."`).
 *
 * Ele NAO nasce de nenhuma verificacao — nao ha o que verificar. A tela o
 * mostra quando o formulario e enviado VAZIO, que e a unica condicao que esta
 * fase consegue provar de verdade.
 */
export const ERRO_CREDENCIAL = 'E-mail ou senha incorretos. Tente novamente.';

/** O modo do formulario. Os dois do original: `"login" | "signup"`. */
export type ModoConta = 'login' | 'signup';
