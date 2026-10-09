/**
 * A camada de dados da AREA DA CLIENTE — o UNICO ponto de contato com dado.
 *
 * Nenhum componente desta area importa `demo.ts` nem conhece Prisma. Quando o
 * Neon entrar, e ESTE arquivo que muda: as assinaturas continuam as mesmas e
 * nenhuma tela precisa ser tocada.
 *
 * ================== A PONTE COM O ADMIN ==================
 *
 * O pedido desta area NAO e um pedido novo: e a MESMA linha de `orders` que o
 * admin ja le, vista pela cliente. Por isso a lista de pedidos vem de
 * `@/lib/pedidos/demo` — o mesmo array do admin — e nao de uma copia local.
 * Copiar os cinco pedidos para dentro de `cliente/demo.ts` criaria duas fontes
 * do mesmo dado, que divergem no primeiro dia em que um preco mudar.
 *
 * Do pedido do admin para o `PedidoCliente` so ha PROJECAO: os campos que a
 * area da cliente imprime. `frete` sai de `shipping.carrier`, e o `status` e o
 * MESMO enum — `novo` continua `novo`, e quem escolhe o rotulo e a tela
 * (`AGUARDANDO PAGAMENTO` aqui, conforme o print; `NOVO` no admin). Ver a
 * divergencia registrada em `PAINEL-CLIENTE-STATUS.md`.
 *
 * A filtragem por CLIENTE usa `customer.email`, que e a chave que o CRM do
 * admin ja usa para dizer que duas linhas sao a mesma pessoa (`customerKey`).
 * Enquanto nao ha login, a conta e a de demonstracao — a mesma que o admin
 * pinta como `lp070087@gmail.com` em `DEMO_CUSTOMERS`.
 *

 * ================== O QUE ESTE ARQUIVO NAO FAZ ==================
 *
 * Nao grava. Nao ha `save*` aqui: as telas que ainda vao existir (enderecos,
 * medidas, dados) trazem a escrita junto com a interface delas, como manda o
 * protocolo — escrever agora um `saveEndereco` que tela nenhuma chama seria
 * codigo morto com cara de planejamento. O que ja nasce e a LEITURA, porque a
 * casca e o Dashboard a usam hoje.
 */

import { getSession } from '@/lib/access';
import { DEMO_AFFILIATES } from '@/lib/afiliadas/demo';
import { DEMO_ORDERS_PEDIDOS } from '@/lib/pedidos/demo';
import type { Order } from '@/lib/pedidos/types';
import {
  DEMO_CASHBACK,
  DEMO_CUPONS_CLIENTE,
  DEMO_ENDERECOS_CLIENTE,
  DEMO_FAVORITOS_CLIENTE,
  DEMO_HISTORICO_MEDIDAS,
  DEMO_NIVEL_CLUBE,
  DEMO_NIVEIS_CLUBE,
  DEMO_PERFIL_MEDIDAS,
  DEMO_PONTOS_CLUBE,
  DEMO_RECOMPENSAS_CLUBE,
  DEMO_REGRAS_CLUBE,
} from './demo';
import {
  nivelAtual,
  pontosAcumulados,
  progressoClube,
  projetarPedido,
  resumirPedidos,
  resumoAfiliada,
  saldoPontosDoExtrato,
} from './metrics';
import type {
  AcessoConta,
  ContaAfiliada,
  ContaCliente,
  CupomCliente,
  EnderecoCliente,
  FavoritoCliente,
  MedidaHistorico,
  PedidoCliente,
  PerfilMedidas,
  ResumoCliente,
  ResumoClube,
} from './types';

/**
 * O motivo padrao de toda escrita que ainda nao grava. Um texto so, reusado
 * pelas telas, para o aviso nao virar tres redacoes diferentes.
 */
export const PENDING_REASON =
  'Persistência ainda não conectada: o banco (Neon/PostgreSQL) entra na fase de integração.';

/** De onde os dados vieram. A tela usa isso para nao apresentar exemplo como real. */
export interface Dataset<T> {
  data: T;
  source: 'demo' | 'database';
  reason?: string;
}

/**
 * A conta logada.
 *
 * Enquanto nao ha login real, vem da sessao de demonstracao do admin —
 * `getSession()` —, de forma que a area da cliente e o painel apontem para a
 * MESMA pessoa. Quando o login existir, troca-se so o corpo desta funcao.
 *
 * O `nomeCompleto` fica `null`: e o estado da conta dos prints, e e por isso
 * que o cabecalho escreve `Ola, lp070087@gmail.com` em vez de um nome.
 */
export async function getConta(): Promise<Dataset<ContaCliente>> {
  const sessao = getSession();
  return {
    data: { id: 'cliente-demo', email: sessao.email, nomeCompleto: null, telefone: null },
    source: 'demo',
    reason: PENDING_REASON,
  };
}

/** Os pedidos do admin que sao DESTA cliente, mais recente primeiro. */
function pedidosDaConta(email: string): PedidoCliente[] {
  const meus: Order[] = DEMO_ORDERS_PEDIDOS.filter(
    (pedido) => pedido.customer.email === email,
  );
  return resumirPedidos(meus.map(projetarPedido));
}

/** Os pedidos desta cliente, mais recente primeiro. */
export async function listPedidos(): Promise<Dataset<PedidoCliente[]>> {
  const { data: conta } = await getConta();
  return { data: pedidosDaConta(conta.email), source: 'demo', reason: PENDING_REASON };
}

/**
 * Os favoritos da cliente.
 *
 * O print (`cli-006`) mostra a tela VAZIA, e e assim que ela nasce: a
 * demonstracao nao inventa produtos salvos. A lista existe para o dia em que o
 * banco tiver linha; ver a nota em `demo.ts`.
 */
export async function listFavoritos(): Promise<Dataset<FavoritoCliente[]>> {
  return {
    data: DEMO_FAVORITOS_CLIENTE.map((favorito) => ({ ...favorito })),
    source: 'demo',
    reason: PENDING_REASON,
  };
}

/**
 * A caderneta de enderecos da cliente, principal primeiro.
 *
 * O print (`cli-007`) mostra a tela VAZIA, e e assim que ela nasce — ver a nota
 * de `DEMO_ENDERECOS_CLIENTE`. A ORDEM e a do original:
 * `.order("is_default", { ascending: false }).order("created_at", …)`. O
 * principal vem primeiro; a lista vazia ordena sozinha.
 */
export async function listEnderecos(): Promise<Dataset<EnderecoCliente[]>> {
  return {
    data: [...DEMO_ENDERECOS_CLIENTE]
      .sort((a, b) => Number(b.is_default) - Number(a.is_default))
      .map((endereco) => ({ ...endereco })),
    source: 'demo',
    reason: PENDING_REASON,
  };
}

/**
 * ================== A ESCRITA NAO GRAVA — E DIZ ISSO ==================
 *
 * `salvarEndereco`, `excluirEndereco`, `marcarEnderecoPrincipal` e
 * `salvarPerfilMedidas` existem para a tela poder ser HONESTA: quando a cliente
 * preenche um formulario e clica em salvar, alguma resposta precisa aparecer — e
 * a resposta certa nesta fase e "ainda nao grava", com o motivo, e nao um
 * `toast.success("Endereço salvo")` que mentiria.
 *
 * O ORIGINAL grava de verdade (Supabase, `insert`/`update`/`delete` + `toast`,
 * ver `conta.enderecos.tsx`). Aqui nao ha banco, entao TODAS devolvem
 * `{ ok: false, reason }` e a tela mostra o `reason`. Elas NAO sao codigo morto:
 * sao a superficie que muda quando o Neon entrar — o corpo vira a chamada ao
 * Prisma e a assinatura fica igual.
 *
 * POR QUE EXISTEM AQUI, E NAO COMO `if` NO COMPONENTE: a regra "isto nao grava"
 * e uma regra de DADOS, nao de interface. Se ela vivesse no componente, a tela
 * teria uma condicional de persistencia — exatamente o que `data.ts` existe para
 * centralizar. Nenhuma exigencia do protocolo foi afrouxada: nenhuma tela ainda
 * le esta escrita, e ela nasce junto com a tela que a usa, como manda o modulo.
 */
export interface ResultadoEscrita {
  ok: boolean;
  /** Por que nao gravou. Ausente quando `ok`. */
  reason?: string;
}

/** Salvar (criar ou editar) um endereco. NAO GRAVA — ver a nota acima. */
export async function salvarEndereco(): Promise<ResultadoEscrita> {
  return { ok: false, reason: PENDING_REASON };
}

/** Excluir um endereco. NAO GRAVA — ver a nota acima. */
export async function excluirEndereco(): Promise<ResultadoEscrita> {
  return { ok: false, reason: PENDING_REASON };
}

/** Tornar um endereco o principal. NAO GRAVA — ver a nota acima. */
export async function marcarEnderecoPrincipal(): Promise<ResultadoEscrita> {
  return { ok: false, reason: PENDING_REASON };
}

/**
 * O perfil de medidas da cliente.
 *
 * O print `cli-010` mostra o formulario PREENCHIDO (altura 165, peso 59, idade
 * 28), e e isso que a demonstracao devolve — ver `DEMO_PERFIL_MEDIDAS`. O
 * `upsert` do original tem `onConflict: "user_id"`, ou seja, UMA linha por
 * cliente: por isso a leitura devolve um OBJETO, e nao uma lista.
 *
 * Quando o Neon entrar e a cliente for nova, `maybeSingle()` do original
 * devolve `null` — e a tela escreve `Complete seu perfil`. Este ramo existe no
 * tipo (`PerfilMedidas | null`) e a bancada o exercita; hoje o `null` nao
 * acontece porque a conta dos prints TEM perfil.
 */
export async function getPerfilMedidas(): Promise<Dataset<PerfilMedidas | null>> {
  return {
    data: { ...DEMO_PERFIL_MEDIDAS },
    source: 'demo',
    reason: PENDING_REASON,
  };
}

/**
 * O historico de medidas, mais recente primeiro.
 *
 * O print `cli-011` (`004753`) mostra `Nenhum registro anterior encontrado.` — e
 * por isso a demonstracao nasce vazia. A ORDEM e a do original:
 * `.order("created_at", { ascending: false })`.
 */
export async function listHistoricoMedidas(): Promise<Dataset<MedidaHistorico[]>> {
  return {
    data: [...DEMO_HISTORICO_MEDIDAS]
      .sort((a, b) => (a.created_at < b.created_at ? 1 : a.created_at > b.created_at ? -1 : 0))
      .map((registro) => ({ ...registro })),
    source: 'demo',
    reason: PENDING_REASON,
  };
}

/**
 * Salvar o perfil de medidas. NAO GRAVA — ver a nota de `ResultadoEscrita`.
 *
 * Ainda mais que as escritas de endereco, esta e a que o original trata como
 * DUAS: o `save()` de `conta.medidas.tsx` faz um `upsert` no perfil E um
 * `insert` no historico. Quando o Neon entrar, as duas tem que caber na mesma
 * transacao — se o `insert` falhar depois do `upsert`, o historico perde a
 * versao e o perfil fica com um estado que nenhuma linha registra. Fica
 * anotado aqui para nao se perder: **a assinatura e uma, o efeito e duplo.**
 */
export async function salvarPerfilMedidas(): Promise<ResultadoEscrita> {
  return { ok: false, reason: PENDING_REASON };
}

/**
 * ================== O `Clube VIP & Cashback` — tudo o que a tela le ==================
 *
 * Uma leitura so, como `getResumo()`: a tela NAO soma pontos, NAO acha o nivel e
 * NAO calcula o progresso. Tudo isso e regra de negocio, e regra de negocio mora
 * em `metrics.ts`, chamada daqui. A tela recebe numeros prontos.
 *
 * A ORDEM dos niveis e por `minimoPontos` CRESCENTE — a lista lateral do print
 * mostra `BRONZE, PRATA, OURO, DIAMANTE`, e a barra de progresso precisa do
 * proximo degrau. O extrato vem mais recente primeiro
 * (`.order("created_at", { ascending: false })` do original).
 */
export async function getClube(): Promise<Dataset<ResumoClube>> {
  const acumulado = pontosAcumulados(DEMO_PONTOS_CLUBE);
  const { nivel, proximoNivel, progressoPct, faltamProximo } = progressoClube(DEMO_NIVEIS_CLUBE, acumulado);
  return {
    data: {
      saldo: saldoPontosDoExtrato(DEMO_PONTOS_CLUBE),
      acumulado,
      nivel,
      proximoNivel,
      progressoPct,
      faltamProximo,
      extrato: [...DEMO_PONTOS_CLUBE]
        .sort((a, b) => (a.criadoEm < b.criadoEm ? 1 : a.criadoEm > b.criadoEm ? -1 : 0))
        .map((m) => ({ ...m })),
      recompensas: DEMO_RECOMPENSAS_CLUBE.map((r) => ({ ...r })),
      niveis: [...DEMO_NIVEIS_CLUBE].sort((a, b) => a.minimoPontos - b.minimoPontos).map((n) => ({ ...n })),
      regras: { ...DEMO_REGRAS_CLUBE },
    },
    source: 'demo',
    reason: PENDING_REASON,
  };
}

/**
 * Resgatar uma recompensa. NAO GRAVA — ver a nota de `ResultadoEscrita`.
 *
 * O original gera um CUPOM de uso unico e debita os pontos (`insert` em
 * `loyalty_points` com `type: 'redeem'`). Sao DUAS escritas — o resgate e o
 * cupom —, e as duas tem que caber na MESMA transacao: se o cupom falhar depois
 * do debito, a cliente perde os pontos sem receber nada. A assinatura aqui e uma
 * so; o efeito e duplo, como em `salvarPerfilMedidas`.
 */
export async function resgatarRecompensa(): Promise<ResultadoEscrita> {
  return { ok: false, reason: PENDING_REASON };
}

/**
 * Salvar os dados da conta (nome, telefone, e-mail). NAO GRAVA — ver a nota de
 * `ResultadoEscrita`.
 *
 * ================== ESTA ESCRITA TEM UMA DIFERENCA DAS OUTRAS ==================
 *
 * O original NAO escreve numa tabela: ele chama `supabase.auth.updateUser`, que
 * grava no `auth.users` (o e-mail, com confirmacao por link) e no
 * `user_metadata` (o nome e o telefone). O `name`/`phone` **nao sao colunas de
 * `customers`** — sao metadados da CONTA.
 *
 * A consequencia pratica e que este `update` nao pode virar um `update` de
 * tabela quando o Neon entrar: ele troca de dono (o provedor de auth), e nao de
 * forma. A assinatura fica igual, como nas outras; o CORPO e que vai chamar o
 * provedor, e nao o Prisma. Por isso a nota esta aqui, e nao so no STATUS.
 *
 * ================== E O E-MAIL TEM UM EFEITO QUE OS OUTROS NAO TEM ==================
 *
 * Trocar o e-mail NAO troca o e-mail na hora: o Supabase manda um link de
 * confirmacao para o endereco NOVO, e a conta continua ativa com o antigo ate a
 * confirmacao. E o que o cartao `Segurança do E-mail` da propria tela explica, e
 * e por isso que o aviso do original muda de texto quando o e-mail muda
 * (`Confirme o novo e-mail…` em vez de `Dados atualizados`). Reproduzir isso e
 * obrigatorio: um `Dados atualizados` depois de trocar o e-mail seria uma
 * mentira — o e-mail ainda e o antigo.
 */
export async function salvarDadosConta(): Promise<ResultadoEscrita> {
  return { ok: false, reason: PENDING_REASON };
}

/**
 * O estado de ACESSO da conta — o `last_sign_in_at` e nada mais.
 *
 * ================== POR QUE ISTO E UMA LEITURA SEPARADA DE `getConta` ==================
 *
 * `getConta` devolve o que a tela `Dados da Conta` edita: e-mail, nome, telefone.
 * O ultimo acesso NAO e editavel e nao pertence aquele formulario — ele e
 * somente-leitura, e o original o le de `user.last_sign_in_at` no mesmo objeto de
 * sessao. Manter as duas leituras separadas segue a regra da area (cada tela le o
 * que desenha) e evita que `ContaCliente` carregue um campo que nenhuma tela de
 * edicao usa.
 *
 * ================== HOJE DEVOLVE `null`, E ISSO E A VERDADE ==================
 *
 * A sessao desta fase e de demonstracao e NAO passa por login real; nao existe
 * `last_sign_in_at` para ler. Devolver a data de agora seria a pior das opcoes:
 * a tela afirmaria um acesso que nunca aconteceu. Com `null`, ela escreve `—` —
 * que e exatamente o que o original escreve quando o campo falta.
 */
export async function getAcesso(): Promise<Dataset<AcessoConta>> {
  return { data: { ultimoAcessoEm: null }, source: 'demo', reason: PENDING_REASON };
}

/**
 * Trocar a senha. NAO GRAVA — ver a nota de `ResultadoEscrita`.
 *
 * ================== A SENHA NAO ENTRA NESTA ASSINATURA, E ISSO E DE PROPOSITO ==================
 *
 * O original le `pw`/`pw2` do formulario e chama
 * `supabase.auth.updateUser({ password: pw })`. Nenhuma das duas senhas passa por
 * um tipo do dominio: elas vivem no estado do React, vao direto para o provedor e
 * morrem ali. Nao ha campo de senha em `types.ts`, e nao ha — este e o ponto —
 * nenhum lugar onde uma senha possa ser logada, serializada ou esquecida.
 *
 * Quando o provedor entrar, esta funcao vai receber a senha JA VALIDADA pela tela
 * e repassa-la. Manter a assinatura sem ela agora documenta a decisao em vez de
 * deixar um parametro morto que alguem pode se sentir tentado a persistir.
 *
 * ================== AS DUAS VALIDACOES QUE SAO DA TELA, E NAO DAQUI ==================
 *
 * `Mínimo 6 caracteres` e `Senhas não conferem` sao checagens de FORMULARIO: elas
 * comparam dois campos que so existem no formulario e nao consultam o banco. Por
 * isso elas moram na view (e a bancada as prova la), e nao nesta camada — que so
 * fala com o provedor.
 */
export async function salvarSenha(): Promise<ResultadoEscrita> {
  return { ok: false, reason: PENDING_REASON };
}

/**
 * Encerrar TODAS as sessoes. NAO GRAVA — ver a nota de `ResultadoEscrita`.
 *
 * ================== ESTA ESCRITA NAO ESCREVE: ELA DESTROI ==================
 *
 * O original chama `supabase.auth.signOut({ scope: "global" })` — o `global` e o
 * que a distingue do `signOut()` do botao `Sair da conta`: um encerra as sessoes
 * de TODOS os aparelhos, o outro so a desta aba. Sao duas operacoes diferentes, e
 * por isso sao duas funcoes: `sairDaConta` (aba) e `encerrarSessoes` (todas).
 *
 * No Neon isto nao vira um `delete` de tabela: o provedor de auth e quem guarda
 * as sessoes, e o corpo vai chamar o provedor. A assinatura fica igual.
 */
export async function encerrarSessoes(): Promise<ResultadoEscrita> {
  return { ok: false, reason: PENDING_REASON };
}

/**
 * ================== O PERFIL DE AFILIADA VEM DO MESMO LUGAR QUE O DO ADMIN ==================
 *
 * Aqui esta a decisao central deste modulo, e ela e a mesma familia de
 * `pedidosDaConta` (acima), que filtra `DEMO_ORDERS_PEDIDOS` — o dado do admin —
 * pelo e-mail da sessao.
 *
 * O painel `/admin/afiliadas` ja tem `DEMO_AFFILIATES`. Esta funcao NAO declara
 * uma afiliada propria: ela procura a cliente logada NAQUELA lista. Se o admin
 * marcar a Carinna como `suspended`, esta tela reflete; se o admin mudar a
 * comissao de `5` para `10`, esta tela reflete. Duas declaracoes divergiriam no
 * primeiro ajuste que uma recebesse — e e exatamente o que a Fase 4 proibe ao
 * exigir que os paineis representem os MESMOS registros.
 *
 * Foi essa mesma decisao que fez `AddressesView`, `ClubeView` e `CouponsView`
 * importarem `lib/pedidos`/`lib/conteudo` em vez de recriarem o dado.
 *
 * ================== E A CONTA DOS PRINTS NAO E AFILIADA — DE PROPOSITO ==================
 *
 * `DEMO_AFFILIATES` tem UMA afiliada, `Carinna`, com o e-mail
 * `lucasmuniz19w@gmail.com`. A sessao da demonstracao e `lp070087@gmail.com`
 * (o e-mail do print `cli-001`). Os dois NAO casam — entao `perfil` e `null`, e a
 * tela entrega o CONVITE (`Seja uma Afiliada Closet Lunar`), que e um dos dois
 * estados que o original trata.
 *
 * Isto nao e um buraco: NENHUM print mostra o `Painel de Afiliada` preenchido. A
 * conta do material simplesmente nao e afiliada. Inventar um `DEMO_AFFILIATE`
 * com o e-mail da sessao faria a tela mostrar uma comissao que ninguem tem — uma
 * afirmacao mais forte do que o material sustenta. O estado preenchido existe no
 * codigo e a bancada o prova com uma afiliada injetada; o que a DEMONSTRACAO
 * entrega e o estado que a referencia entrega.
 *
 * ================== AS VENDAS SAO VAZIAS, E A TELA TEM O ESTADO ==================
 *
 * Nao existe `DEMO_AFFILIATE_SALES`: a tabela nao tem dado de demonstracao, e o
 * original ja trata a lista vazia (`As vendas realizadas aparecerão aqui.`). Uma
 * venda inventada aqui seria um numero que o admin nao pode conferir. A bancada
 * prova o estado vazio E o preenchido (com venda injetada), porque o codigo tem
 * os dois.
 *
 * Os cliques tambem sao `0`: `affiliate_referrals` nao tem demonstracao.
 */
export async function getAfiliada(): Promise<Dataset<ContaAfiliada>> {
  const sessao = getSession();
  const perfil =
    DEMO_AFFILIATES.find((a) => a.email.toLowerCase() === sessao.email.toLowerCase()) ?? null;
  /*
    SEM PERFIL, o resumo e zerado — mas o `resumo` continua sendo um objeto
    completo, e nao `undefined`. A tela le os quatro campos sem precisar de
    guarda, e uma afiliada sem perfil nao mostra `R$ NaN`.
  */
  return {
    data: { perfil, vendas: [], resumo: resumoAfiliada(0, []) },
    source: 'demo',
    reason: PENDING_REASON,
  };
}

/** Os cupons da cliente, validos e nao validos — a tela decide o que escurecer. */
export async function listCupons(): Promise<Dataset<CupomCliente[]>> {
  return {
    data: DEMO_CUPONS_CLIENTE.map((cupom) => ({ ...cupom })),
    source: 'demo',
    reason: PENDING_REASON,
  };
}

/**
 * Tudo o que o Dashboard mostra, em uma leitura.
 *
 * O Dashboard do print nao faz cinco requisicoes: ele mostra tres numeros, o
 * ultimo pedido e os cupons. Devolver o resumo ja montado mantem a regra de
 * negocio fora do componente.
 *
 * ================== NAO HA RELOGIO NESTA ASSINATURA, E ISSO E DE PROPOSITO ==================
 *
 * Ela ja teve um parametro `agora`, e ele saiu. Parecia certo: `Cupons ativos`
 * depende de validade, e passar a data mantem a funcao pura. So que o criterio
 * da lista NAO E validade — e `is_active`, igual ao original:
 *
 *     .from("coupons").select("*").eq("is_active", true)   // conta.index.tsx
 *
 * Nao ha `expires_at` nessa consulta. E o print prova: `004603` mostra o
 * `CLOSET10` no cartao `Cupons ativos` do dashboard e `004841` mostra o MESMO
 * cupom escurecido como `EXPIRADO`, dois minutos depois, na mesma sessao. Um
 * filtro por validade nao consegue produzir os dois estados; `is_active` sim.
 *
 * Com o relogio fora, quem le o resumo nao precisa de data nenhuma — e o
 * efeito da tela para de depender do fuso do navegador. Quem precisa do relogio
 * e `/conta/cupons`, que escurece o cartao vencido (`cupomFechado`).
 */
export async function getResumo(): Promise<Dataset<ResumoCliente>> {
  const { data: conta } = await getConta();
  const pedidos = pedidosDaConta(conta.email);
  const favoritos = DEMO_FAVORITOS_CLIENTE;
  /*
    O `Meus Pontos` do dashboard E O SALDO — o que a cliente pode gastar. Ele e
    derivado do extrato, e nao mais um `saldoPontos()` fixo: ver
    `saldoPontosDoExtrato`. Alias, a partir deste modulo as duas telas que falam
    de pontos (o dashboard e o clube) leem o MESMO extrato, entao o numero do
    cartao `MEUS PONTOS` e o `SEU SALDO` do clube nao podem divergir.
  */
  const pontos = saldoPontosDoExtrato(DEMO_PONTOS_CLUBE);

  return {
    data: {
      pedidos: pedidos.length,
      cashback: DEMO_CASHBACK,
      pontos,
      favoritos: favoritos.length,
      ultimoPedido: pedidos[0] ?? null,
      cuponsAtivos: DEMO_CUPONS_CLIENTE.map((cupom) => ({ ...cupom })),
      /*
        O NIVEL usa pontos ACUMULADOS, e nao o saldo.

        Os dois numeros sao 0 hoje, e por isso a escolha nao muda nada AGORA —
        mas muda no primeiro resgate. Uma recompensa trocada derruba o saldo sem
        diminuir o que foi conquistado, e o nivel tem que seguir o que foi
        conquistado. Ver a nota de `nivelAtual`.

        A LISTA. Antes ela tinha UM item (`[DEMO_NIVEL_CLUBE]`) porque so o
        `BRONZE` estava em cena. Agora sao os QUATRO de `DEMO_NIVEIS_CLUBE`, os
        do print `cli-013` — mas o resultado do dashboard NAO muda: com 0 ponto
        acumulado, `nivelAtual` devolve o `BRONZE` de qualquer jeito, porque e o
        unico nivel de limiar 0. A lista completa entra porque `nivelAtual` foi
        feita para receber TODOS os niveis — passar so o piso funcionava por
        acidente enquanto havia so um.
      */
      nivel: nivelAtual(DEMO_NIVEIS_CLUBE, pontosAcumulados(DEMO_PONTOS_CLUBE)),
    },
    source: 'demo',
    reason: PENDING_REASON,
  };
}
