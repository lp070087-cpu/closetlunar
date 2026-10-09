/**
 * AS GUARDAS DE ROTA — server-side, e nao no navegador.
 *
 * ================== POR QUE ISTO NAO PODE SER SO NO CLIENTE ==================
 *
 * Esconder o link do admin, ou mostrar uma tela de "sem permissao" enquanto o
 * HTML do painel ja desceu, NAO e protecao. Qualquer um abre o DevTools, ou
 * chama a URL direto, ou desliga o JavaScript. A protecao que vale e a que roda
 * ANTES de o dado sair do servidor:
 *
 *   - o LAYOUT do admin pergunta quem é, e redireciona antes de renderizar;
 *   - toda LEITURA de dado de cliente filtra pelo `sub` da sessao, e nao por um
 *     id que veio do navegador.
 *
 * As duas estao aqui, e sao as duas que a condicao da fase exige
 * (`NÃO confiar em customerId vindo do navegador`).
 *
 * ================== O QUE ESTA IMPLEMENTADO E O QUE ESTA PRONTO ==================
 *
 * `exigirPapel` le a sessao do cookie e devolve quem é. Sem banco, a unica
 * sessao possivel e a de DEMONSTRACAO (o painel do admin e a area da cliente ja
 * rodam sem login). Entao a guarda tem TRES saidas, e nao duas:
 *
 *   1. **banco ligado** -> a sessao tem que ser REAL. Sem sessao, redireciona.
 *   2. **sem banco** -> modo demonstracao: deixa passar, e DIZ que e demo.
 *
 * A saida 2 e a que preserva o que ja foi aprovado: as Fases 1, 2 e 3 foram
 * entregues sem banco, e apertar a guarda agora deixaria as 31 telas do admin
 * inacessiveis. **A guarda aperta sozinha quando o banco ligar** — e a bancada
 * prova que ela aperta, porque o caminho "ha banco, nao ha sessao" existe no
 * codigo e e testavel.
 */

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { COOKIE_SESSAO, lerToken, type Papel } from './sessao';
import { papelDe } from './decisao';
import { db } from '@/lib/db';

/** Quem esta pedindo. `demo: true` = nao ha banco, a area roda em demonstracao. */
export interface SessaoAtual {
  usuarioId: string;
  papel: Papel;
  /** `true` quando NAO ha banco: as telas ja tratavam esse caso como demo. */
  demo: boolean;
  /** `true` quando HA banco e a sessao e real. */
  autenticado: boolean;
}

/**
 * Le a sessao do cookie. **Nunca lanca** — devolve `null` quando nao ha.
 *
 * `cookies()` e assincrono no Next 15, e so existe no servidor: esta funcao nao
 * pode ser importada por um componente de cliente (e nao e: a guarda inteira e
 * server-side).
 */
export async function sessaoAtual(): Promise<SessaoAtual | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE_SESSAO)?.value ?? null;
  if (!token) return null;

  const dados = lerToken(token, process.env.SESSION_SECRET);
  if (!dados) return null;

  return {
    usuarioId: dados.sub,
    papel: papelDe(dados.papel),
    demo: false,
    autenticado: true,
  };
}

/**
 * Exige um usuario com papel. **Redireciona** quando nao ha — e o redirecionamento
 * acontece no servidor, antes do render, entao o HTML protegido nunca sai.
 *
 * Sem banco, devolve uma sessao de DEMONSTRACAO: e o que mantem a Fase 1 e a
 * Fase 2 acessiveis enquanto o Neon nao existe. O `demo: true` viaja junto para
 * quem quiser mostrar um aviso.
 */
export async function exigirPapel(papel: Papel, destino = '/conta'): Promise<SessaoAtual> {
  const sessao = await sessaoAtual();

  if (!sessao) {
    // Sem banco nao ha login possivel — a alternativa seria trancar a area.
    if (!temBancoAgora()) {
      return { usuarioId: 'demo', papel, demo: true, autenticado: false };
    }
    redirect(destino);
  }

  if (sessao.papel !== papel) {
    // Autenticado, mas com o papel errado: manda para a area DELE, e nao para a
    // tela de login. Quem ja esta logado nao deve ver um formulario de login.
    redirect(sessao.papel === 'admin' ? '/admin' : '/conta');
  }

  return sessao;
}

/**
 * Exige sessao REAL, sem a saida de demonstracao.
 *
 * E a guarda da ESCRITA sensivel: uma operacao que grava dado de uma pessoa
 * (`customerId`) nao pode aceitar o modo demonstracao, porque nao ha a quem
 * atribuir. Devolve `null` em vez de redirecionar, porque quem chama e uma
 * Server Action, e uma Action nao pode redirecionar no meio de um calculo.
 */
export async function exigirSessaoReal(): Promise<SessaoAtual | null> {
  const sessao = await sessaoAtual();
  if (!sessao) return null;
  // Com banco, a sessao tem que ter sido emitida DEPOIS que o banco entrou. O
  // `sub` de uma sessao valida e um id de usuario; o de demonstracao era 'demo'.
  if (sessao.usuarioId === 'demo') return null;
  return sessao;
}

/**
 * O FILTRO DE PROPRIEDADE — o coracao da regra "Cliente A nao le o B".
 *
 * Toda consulta que devolve dado de UMA pessoa passa por aqui. O `where` sai da
 * SESSAO, e nunca de um parametro que a pagina recebeu.
 *
 * A funcao existe para que a regra seja VISIVEL e unica: se cada tela montasse o
 * proprio `where`, uma delas esqueceria o filtro — e esquecer o filtro e a
 * maneira classica de o pedido de um cliente aparecer na conta de outro.
 */
export function filtroDoDono(sessao: SessaoAtual): { userId: string } {
  /*
    Uma sessao de DEMONSTRACAO nao tem `userId` real. Devolver um `userId`
    inventado faria a consulta achar zero linhas (o que e seguro) — mas o
    chamador precisa saber disso antes de consultar. Por isso o id sentinela, e
    por isso ele e IMPOSSIVEL de colidir com um cuid real.
  */
  return { userId: sessao.demo ? 'demo-sem-banco' : sessao.usuarioId };
}

/** Ha banco agora? Pequeno atalho, para nao espalhar o import de `db`. */
function temBancoAgora(): boolean {
  const url = process.env.DATABASE_URL;
  return typeof url === 'string' && url.length > 0 && !url.includes('ep-xxxx');
}

/**
 * O papel de cada area, num lugar so.
 *
 * `/admin` e do papel `admin`; `/conta` aceita os dois (o admin tambem e uma
 * pessoa que pode comprar). O site publico nao tem guarda.
 */
export const AREA_ADMIN: Papel = 'admin';
export const AREA_CLIENTE: Papel = 'cliente';

/** Reexportado para a bancada poder checar a regra sem tocar no Next. */
export { temBancoAgora };
