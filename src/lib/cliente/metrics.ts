/**
 * As contas da area da cliente. Tudo aqui e PURO.
 *
 * "Puro" quer dizer duas coisas concretas, e as duas importam para a bancada:
 *
 * 1. **Nada le o relogio por conta propria.** Toda funcao que depende de "hoje"
 *    recebe a data — `expirou(cupom, agora)`. Se ela chamasse `new Date()`, o
 *    resultado mudaria conforme o dia em que a bancada roda, e um cupom que
 *    expira amanha passaria hoje e falhasse amanha. Com o relogio por parametro,
 *    a bancada pode testar a virada do dia dos dois lados.
 *
 * 2. **Nada muda a entrada.** `resumirPedidos` devolve uma lista NOVA via
 *    `[...pedidos].sort(...)`; ordenar o array recebido reordenaria a
 *    demonstracao global do modulo para as proximas chamadas.
 *
 * ================== O QUE NAO EXISTE AQUI, E POR QUE ==================
 *
 * Nao ha `cuponsValidos`. Existiu, e foi REMOVIDO por ser invencao: filtrar o
 * cartao do dashboard por validade parecia obvio e nao esta em fonte nenhuma.
 * O original le `coupons.is_active = true` e pronto — sem olhar `expires_at`.
 * O print prova isso: `004603` mostra o `CLOSET10` no cartao `Cupons ativos` e
 * `004841` mostra o MESMO cupom escurecido como `EXPIRADO`, na mesma sessao.
 * Um filtro por validade nao consegue produzir os dois; o nome do cartao diz
 * "ativos" no sentido de `is_active`, e nao de "dentro da validade".
 */

import { buildOrderCode } from '@/lib/pedidos/metrics';
import type { Order, OrderStatus } from '@/lib/pedidos/types';
import { formatBRL } from '@/lib/utils';
import type { ContaCliente, CupomCliente, MovimentoPontos, NivelClube, PedidoCliente, ResumoAfiliada, VendaAfiliada } from './types';

/**
 * A saudacao do cabecalho — `Olá, lp070087@gmail.com`.
 *
 * A REGRA E A DO ORIGINAL, e vale reproduzir o motivo dela: primeiro nome
 * quando existe nome, e-mail quando nao existe. O original escreve
 * `(full_name ?? email).split(" ")[0]`, e o e-mail nao tem espaco — entao o
 * e-mail sai INTERIO, como o print `cli-001` mostra.
 *
 * Fazer `split(" ")` num e-mail nao parece natural, e e justamente por isso que
 * a linha esta aqui comentada: o comportamento correto PARECE um defeito. Quem
 * vier depois nao deve "consertar" isso para um tratamento de e-mail, porque o
 * material mostra o e-mail inteiro.
 */
export function saudacao(conta: ContaCliente): string {
  const bruto = conta.nomeCompleto ?? conta.email ?? '';
  return `Olá, ${bruto.split(' ')[0] || 'Olá'}`;
}

/**
 * O pedido do admin, reduzido ao que esta area imprime.
 *
 * Nao ha aqui nenhuma decisao que o admin ja nao tenha tomado: o `id`, o
 * `code` e o `status` sao os MESMOS. O codigo inclusive e o que o pedido ja
 * traz; so quando ele falta e que `buildOrderCode` (do admin, importado) o
 * deriva do id — uma regra, um lugar. O que muda e o FORMATO: a area da cliente
 * mostra o frete pelo nome e o item com tamanho e cor na mesma linha.
 */
export function projetarPedido(pedido: Order): PedidoCliente {
  return {
    id: pedido.id,
    codigo: pedido.code || buildOrderCode(pedido.id),
    feitoEm: pedido.placedAt,
    status: pedido.status,
    /*
      O FRETE E O IDENTIFICADOR CRU, e nao o nome da transportadora.

      O print `cli-004` (`004649`) mostra `me:1` na linha do caminhao de um
      pedido cuja transportadora e `Correios`, e `own:341d5a3a-8603-…` nos
      outros. Ou seja: a tela escreve `o.shipping_method`, sem traduzir — o nome
      `Correios` nao aparece na area da cliente.

      Por isso a fonte aqui e `shipmentMethod` (a coluna crua de `orders`), e
      nao `carrier` (o campo que o admin derivou para a PROPRIA tela). Sem
      `shipmentMethod` guardado, `kind` sozinho nao distinguiria `me:1` de
      `own:<uuid>` — os dois sao `transportadora` ou `propria`, e o print mostra
      valores diferentes.

      A linha some quando o campo e nulo, como no original (`{o.shipping_method && …}`).
    */
    frete: pedido.shipping.shipmentMethod,
    subtotal: pedido.payment.subtotal,
    desconto: pedido.payment.discount,
    freteValor: pedido.payment.shippingPrice,
    total: pedido.payment.total,
    itens: pedido.items.map((item) => ({
      id: item.id,
      nome: item.productName,
      tamanho: item.size,
      cor: item.color,
      quantidade: item.quantity,
      precoUnitario: item.unitPrice,
    })),
  };
}

/**
 * Do mais recente para o mais antigo.
 *
 * A comparacao e por STRING ISO, e nao por `new Date(...)`: as datas do projeto
 * sao ISO 8601 com hora, e nesse formato a ordem lexicografica e a cronologica.
 * Trazer `Date` para dentro traria o fuso junto, sem necessidade. O `[...]`
 * protege a lista de entrada — ordenar o array recebido reordenaria a
 * demonstracao global do modulo para as proximas chamadas.
 */
export function resumirPedidos(pedidos: readonly PedidoCliente[]): PedidoCliente[] {
  return [...pedidos].sort((a, b) => (a.feitoEm < b.feitoEm ? 1 : a.feitoEm > b.feitoEm ? -1 : 0));
}

/**
 * O singular/plural do original, na mesma frase do print:
 * `1 item no pedido` / `N itens no pedido`.
 *
 * A CONTAGEM e passada de fora de proposito. O original conta LINHAS
 * (`orderItems.length`), e o admin conta PECAS (`totalItems` soma `quantity`).
 * Sao numeros diferentes no mesmo pedido, e a decisao de qual usar pertence a
 * tela que escreve a frase — nao a esta funcao, que so cuida do singular.
 */
export function rotuloItens(quantidade: number): string {
  return `${quantidade} ${quantidade === 1 ? 'item' : 'itens'} no pedido`;
}

/** Um cupom ja venceu em relacao a `agora`? */
export function expirou(cupom: CupomCliente, agora: Date): boolean {
  if (!cupom.expiraEm) return false;
  const fim = new Date(cupom.expiraEm);
  if (Number.isNaN(fim.getTime())) return false;
  return fim.getTime() < agora.getTime();
}

/**
 * O cupom ja nao vale — por validade OU por esgotamento.
 *
 * As DUAS causas sao as do original (`disabled = expired || exhausted`), e e
 * este veredito que decide o cartao escurecido em `/conta/cupons`.
 *
 * NAO use isto para MONTAR a lista do cartao do dashboard: ali o criterio e
 * `is_active`, e nao a validade — o `CLOSET10` do print aparece nos dois
 * lugares ao mesmo tempo. Ver a nota do topo do arquivo.
 */
export function cupomFechado(cupom: CupomCliente, agora: Date): boolean {
  return cupom.esgotado || expirou(cupom, agora);
}

/**
 * O valor do desconto, do jeito que o cartao de cupom escreve.
 *
 * `10% OFF` ou `R$ 20,00 OFF` — o original trata os dois tipos
 * (`c.kind === "percent" ? ... : ${formatBRL(...)} OFF`). O espaco entre
 * numero e unidade e o do original.
 */
export function rotuloCupom(cupom: CupomCliente): string {
  return cupom.kind === 'percent'
    ? `${cupom.value}% OFF`
    : `${formatBRL(cupom.value)} OFF`;
}

/**
 * A data de validade como o cartao a escreve: `20/08/2026`.
 *
 * Feita aqui, sem `toLocaleDateString`, para nao depender do fuso do servidor:
 * a data vem de um ISO com hora, e `new Date('2026-08-20T23:59:59')` no fuso de
 * Sao Paulo e ainda o dia 20 — mas em outro fuso poderia virar 21. Recortar os
 * campos do proprio texto ISO elimina a duvida.
 */
export function validadeCurta(expiraEm: string | null): string | null {
  if (!expiraEm) return null;
  const partes = /^(\d{4})-(\d{2})-(\d{2})/.exec(expiraEm);
  if (!partes) return null;
  return `${partes[3]}/${partes[2]}/${partes[1]}`;
}

/**
 * Uma data ISO para `DD/MM/AAAA`.
 *
 * E a MESMA operacao de `validadeCurta`, e por isso mora aqui ao lado dela, e
 * nao no componente: o cartao `Ultima recomendacao` de `Minhas Medidas` escreve
 * `Atualizado em DD/MM/AAAA` a partir de `updated_at`, e a tabela do historico
 * escreve `Data` a partir de `created_at`. Sao dois campos diferentes com a
 * mesma regra de formatacao — escrever a regra duas vezes deixaria uma delas
 * para tras no primeiro ajuste.
 *
 * Sem `toLocaleDateString`, pelo mesmo motivo anotado em `validadeCurta`: o fuso
 * do servidor nao pode decidir que dia a cliente salvou a medida. O recorte do
 * texto ISO devolve o dia QUE ESTA ESCRITO nele, em qualquer fuso.
 */
export function dataCurta(iso: string | null): string | null {
  return validadeCurta(iso);
}

/**
 * ================== OS DOIS MAPAS DE ROTULO — UM DELES DIVERGE DO ADMIN ==================
 *
 * ================== O ROTULO DO STATUS ==================
 *
 * `novo` aqui e **`Aguardando pagamento`**. No painel admin ele e `Novo`. Nao e
 * descuido: os dois paineis mostram a mesma linha de `orders`, e o material de
 * cada um escreve o rotulo do seu jeito. O mapa esta transcrito de
 * `conta.pedidos.tsx` (linhas 13 a 20 do original), e nao do admin.
 *
 * O `Record<OrderStatus, ...>` NAO e decorativo: ele obriga os SEIS estados a
 * existirem. Se o enum do admin ganhar um estado novo, o typecheck quebra aqui
 * em vez de a tela imprimir `undefined`. Foi por isso que a chave e o tipo do
 * admin, importado — um mapa com chave `string` calaria o defeito.
 *
 * O TOM. O original declara tons de Tailwind (`bg-amber-100 text-amber-800`).
 * O projeto nao usa a paleta crua do Tailwind: usa os tokens `--warning`,
 * `--success`, `--info`, `--danger`, que foram medidos nos prints do admin. Os
 * tokens abaixo sao o equivalente de cada par, e nao uma cor nova.
 */
export const ROTULO_STATUS_CLIENTE: Record<OrderStatus, { label: string; tom: string }> = {
  novo: { label: 'Aguardando pagamento', tom: 'bg-warning-surface text-warning-foreground' },
  pago: { label: 'Pago', tom: 'bg-success-surface text-success-foreground' },
  separacao: { label: 'Separação', tom: 'bg-info-surface text-info' },
  enviado: { label: 'Enviado', tom: 'bg-info-surface text-info' },
  entregue: { label: 'Entregue', tom: 'bg-success-surface text-success-foreground' },
  cancelado: { label: 'Cancelado', tom: 'bg-danger-surface text-danger-foreground' },
};

/** O rotulo do status do pedido, como o PAINEL DO CLIENTE o escreve. */
export function rotuloStatus(status: OrderStatus): string {
  return ROTULO_STATUS_CLIENTE[status].label;
}

/**
 * O tom do selo de status, pelas cores do projeto.
 *
 * Ele nao e o mesmo mapa do rotulo porque nem toda tela quer os dois: o cartao
 * de `Ultimo pedido` do dashboard mostra so a cor, sem o texto do rotulo longo.
 */
export function tomStatus(status: OrderStatus): string {
  return ROTULO_STATUS_CLIENTE[status].tom;
}

/**
 * ================== O NIVEL VIP ==================
 *
 * O nivel atual e o de MAIOR `minimoPontos` que a cliente ja alcancou.
 *
 * A COMPARACAO E POR PONTOS ACUMULADOS, e nao por saldo — e essa a diferenca
 * que quase passa: o original calcula `totalEarned` (so o que entrou) para
 * achar o nivel, e `pointsBalance` (o que entrou menos o que saiu) para mostrar
 * `Meus Pontos`. Sao dois numeros diferentes do mesmo extrato, e usar o saldo
 * para o nivel faria a cliente CAIR de nivel ao resgatar uma recompensa. O
 * parametro se chama `pontosAcumulados` por isso.
 *
 * A lista pode vir em qualquer ordem: o original ordena por `min_points` e
 * depois INVERTE para achar o primeiro que cabe. Aqui a escolha e pelo maior
 * que cabe, que da o mesmo resultado sem depender da ordem de entrada.
 *
 * Sem niveis cadastrados devolve `null` — e o ramo em que o dashboard troca o
 * cartao escuro pelo atalho de `Afiliada`.
 */
export function nivelAtual(niveis: readonly NivelClube[], pontosAcumulados: number): NivelClube | null {
  let atual: NivelClube | null = null;
  for (const nivel of niveis) {
    if (pontosAcumulados >= nivel.minimoPontos && (atual === null || nivel.minimoPontos > atual.minimoPontos)) {
      atual = nivel;
    }
  }
  return atual;
}

/**
 * ================== O SALDO E O ACUMULADO SAO DOIS NUMEROS, E CONFUNDI-LOS E O ERRO ==================
 *
 * As duas funcoes abaixo leem o MESMO extrato (`loyalty_points`) e devolvem
 * numeros DIFERENTES:
 *
 *   `saldoPontosDoExtrato`  ->  o que a cliente pode GASTAR. Entra `earn`/`bonus`
 *                               e o `adjustment` positivo; SAI o `redeem` e o
 *                               `adjustment` negativo. Este e o `Seu Saldo` do
 *                               cartao escuro.
 *   `pontosAcumulados`      ->  o que a cliente JA CONQUISTOU: so o que entrou
 *                               (`earn`/`bonus`). Este e o numero que decide o
 *                               NIVEL e o progresso.
 *
 * O original faz a mesma separacao (`currentBalance` e `totalEarned`), e a razao
 * e concreta: sem ela, resgatar uma recompensa DERRUBARIA o nivel da cliente. O
 * que foi conquistado nao diminui quando se troca por um premio — o que diminui e
 * o saldo. Estar no tipo (e nao numa conta solta no componente) e o que garante
 * que as duas telas que mostram pontos usem a mesma definicao.
 */
export function saldoPontosDoExtrato(extrato: readonly MovimentoPontos[]): number {
  let saldo = 0;
  for (const m of extrato) {
    const valor = magnitudePontos(m);
    saldo += movimentoEntra(m) ? valor : -valor;
  }
  return saldo;
}

/**
 * ================== O SINAL: POR QUE EXISTE UM `Math.abs` AQUI ==================
 *
 * `MovimentoPontos.pontos` NAO e sempre positivo. Em `earn`, `bonus` e `redeem`
 * ele e o valor absoluto (o sinal vem do tipo), mas em `adjustment` o sinal VEM
 * NO PROPRIO NUMERO — e a prova e a linha do original:
 *
 *     (p.type === 'adjustment' && p.points > 0)
 *
 * Se `points` fosse sempre positivo, esse `> 0` nunca seria falso e o teste nao
 * existiria. Ele existe porque um ajuste para BAIXO chega com `points`
 * NEGATIVO.
 *
 * ================== E O ORIGINAL ERRA ESSE CASO ==================
 *
 * O saldo do original faz `acc + (entra ? p.points : -p.points)`. Para um ajuste
 * de `-50`, `entra` e `false` e a expressao vira `-(-50)` = **+50**: o ajuste
 * que devia TIRAR pontos ACRESCENTA. E um duplo negativo, e o defeito passa
 * calado porque o unico extrato do material esta vazio.
 *
 * A regra correta e a que esta aqui: o TIPO decide se entra, e a MAGNITUDE
 * (sempre positiva) decide quanto. Sem o `Math.abs`, o sinal seria aplicado duas
 * vezes.
 *
 * A linha do extrato na tela usa as MESMAS duas funcoes — se ela usasse so
 * `m.pontos`, imprimiria `+50` verde para um ajuste negativo enquanto o saldo
 * caia: a lista e o cartao do saldo contariam historias diferentes.
 */
export function movimentoEntra(m: MovimentoPontos): boolean {
  return m.tipo === 'earn' || m.tipo === 'bonus' || (m.tipo === 'adjustment' && m.pontos > 0);
}

/** O quanto a movimentacao vale, sem sinal. Ver a nota de `movimentoEntra`. */
export function magnitudePontos(m: MovimentoPontos): number {
  return Math.abs(m.pontos);
}

/** Os pontos ACUMULADOS — so o que entrou. Ver a nota acima. */
export function pontosAcumulados(extrato: readonly MovimentoPontos[]): number {
  let total = 0;
  for (const m of extrato) {
    if (m.tipo === 'earn' || m.tipo === 'bonus') total += magnitudePontos(m);
  }
  return total;
}

/** O que o cartao escuro precisa para desenhar a barra de progresso. */
export interface ProgressoClube {
  nivel: NivelClube | null;
  proximoNivel: NivelClube | null;
  progressoPct: number;
  faltamProximo: number;
}

/**
 * O nivel atual, o proximo, a porcentagem e o quanto falta — em uma conta so.
 *
 * O PROXIMO NIVEL e o de MENOR `minimoPontos` acima do acumulado (nao o proximo
 * da lista, que pode vir em qualquer ordem). E o `?? null` cobre o topo da
 * escada: quem alcancou o ultimo nivel nao tem proximo, e a barra fica cheia
 * (`progressoPct` 100) com a frase `Nivel Máximo Atingido!`.
 *
 * A PORCENTAGEM e `acumulado / minimoPontos`, e nao "quanto falta do degrau
 * anterior" — e o que o original faz (`totalEarned / nextTier.min_points`), e e
 * por isso que com 0 ponto a barra aparece VAZIA (0 / 1000) em vez de quase cheia.
 * O `Math.min(100, …)` protege o arredondamento quando o acumulado passa por
 * pouco o limiar do proximo (que ja seria o atual, mas a rede fica).
 */
export function progressoClube(niveis: readonly NivelClube[], acumulado: number): ProgressoClube {
  const nivel = nivelAtual(niveis, acumulado);
  const proximoNivel =
    [...niveis]
      .filter((n) => n.minimoPontos > acumulado)
      .sort((a, b) => a.minimoPontos - b.minimoPontos)[0] ?? null;
  const progressoPct = proximoNivel ? Math.min(100, (acumulado / proximoNivel.minimoPontos) * 100) : 100;
  const faltamProximo = proximoNivel ? proximoNivel.minimoPontos - acumulado : 0;
  return { nivel, proximoNivel, progressoPct, faltamProximo };
}

/**
 * ================== A UNICA COISA QUE ESTA TELA CALCULA: O ULTIMO ACESSO ==================
 *
 * O original faz, numa linha so:
 *
 *     const lastSignIn = user?.last_sign_in_at
 *       ? new Date(user.last_sign_in_at).toLocaleString("pt-BR")
 *       : "—";
 *
 * Duas decisoes estao embutidas ali, e as duas importam:
 *
 *   1. AUSENTE VIRA `—`, e nao uma data falsa. Uma conta de demonstracao nao tem
 *      `last_sign_in_at`; escrever a data de hoje faria a tela afirmar um acesso
 *      que nunca houve.
 *
 *   2. O FORMATO E LOCAL, e nao ISO. O print imprime `28/09/2026, 00:45:51` —
 *      `DD/MM/AAAA, HH:MM:SS`, com virgula. `toLocaleString("pt-BR")` produz
 *      exatamente isso; uma data ISO na tela seria legivel mas nao seria o
 *      material.
 *
 * ================== E O FORMATO E ESCRITO A MAO, E NAO COM `toLocaleString` ==================
 *
 * `toLocaleString` depende do ICU do runtime: o mesmo codigo pode imprimir
 * `28/09/2026, 00:45:51` no Node com ICU completo e outra coisa num runtime
 * reduzido — e o projeto ja registrou (`feedback_data_iso_e_utc_meia_noite`) que
 * data e um lugar onde o ambiente decide o resultado. Como o formato aqui e FIXO
 * (`DD/MM/AAAA, HH:MM:SS`), monta-lo com `padStart` da o mesmo texto em qualquer
 * runtime, e o separador deixa de ser uma suposicao.
 *
 * ================== E O FUSO. A ARMADILHA DO DIA ERRADO ==================
 *
 * `new Date(iso)` seguido de `getDate()` usa o fuso LOCAL DO RUNTIME. O projeto
 * ja levou uma mordida dessa exata armadilha (`feedback_data_iso_e_utc_meia_noite`:
 * `new Date('2026-06-01')` e meia-noite UTC, e em BRT volta um dia). Aqui o
 * risco existe e e real: `last_sign_in_at` do Supabase vem em UTC com `Z`.
 *
 * Mas as duas opcoes erram de um jeito diferente, e a escolha e explicita:
 *
 *   `getDate()` (o fuso do RUNTIME)   erra se o servidor estiver em UTC e a
 *                                     cliente em BRT — mostraria um acesso de
 *                                     23h de ontem como hoje.
 *   `getUTCDate()` (o fuso do BANCO)  erra SEMPRE, e sempre para a cliente: um
 *                                     acesso as 22h em BRT aparece como 01h do
 *                                     dia seguinte.
 *
 * O material e a tela de uma cliente brasileira, e o horario que ela reconhece e
 * o dela. Fica o fuso do runtime — com a ressalva registrada: quando o provedor
 * entrar, o certo e formatar com um fuso EXPLICITO (`America/Sao_Paulo`), e nao
 * confiar em onde o servidor estiver. Ver as PENDENCIAS NEON.
 */
export function ultimoAcesso(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  const p = (n: number) => String(n).padStart(2, '0');
  return (
    `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()}, ` +
    `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
  );
}

/* ================== AFILIADA ================== */

/**
 * A venda esta PAGA?
 *
 * O original faz `s.status === 'paid'` tres vezes (no selo, no par de textos e na
 * soma). A pergunta e binaria e o teste e um literal unico. Tratar "nao pago"
 * como "pendente" e a leitura do original: ele testa UM valor e cai no outro
 * ramo para todo o resto — nao ha terceiro estado.
 *
 * `=== 'paid'` e NAO `!== 'pending'`: com um status inesperado vindo do banco
 * (`'cancelled'`, por exemplo), as duas formas concordariam HOJE, mas a segunda
 * diria que uma venda cancelada foi paga. A primeira erra para o lado de mostrar
 * `Pendente`, que e o lado conservador — o mesmo que a regra de honestidade do
 * projeto pede.
 */
export function vendaPaga(venda: VendaAfiliada): boolean {
  return venda.status === 'paid';
}

/** O rotulo do selo de uma venda. Um par, e nao um mapa — so ha dois. */
export function rotuloVenda(venda: VendaAfiliada): string {
  return vendaPaga(venda) ? 'Pago' : 'Pendente';
}

/**
 * ================== AS DUAS SOMAS — E POR QUE UMA DELAS E UMA ARMADILHA ==================
 *
 * O original:
 *
 *     const totalCommission = sales.reduce((a, s) => a + Number(s.commission_amount), 0);
 *     const pendingCommission = sales.filter((s) => s.status === 'pending')
 *                                    .reduce((a, s) => a + Number(s.commission_amount), 0);
 *
 * O `totalCommission` soma TUDO; o `pendingCommission` soma SO as pendentes.
 * Como o selo pinta `Pago` para `paid` e `Pendente` para todo o resto, a
 * identidade que TEM que valer e:
 *
 *     comissaoAReceber === soma das comissoes das vendas NAO pagas
 *
 * e a bancada prova essa identidade contra a soma feita a mao. Uma funcao que
 * somasse as pagas no lugar das pendentes daria um numero plausivel, e o total
 * continuaria certo — por isso a prova nao e "o numero e maior que zero", e sim
 * a igualdade com o filtro.
 *
 * O `Number()` do original existe porque a coluna `numeric` chega como TEXTO no
 * driver. Aqui o tipo ja e `number`, entao o `Number()` virou um guarda contra
 * `NaN` — uma venda com valor invalido e IGNORADA, e nao envenena a soma inteira
 * (um unico `NaN` levaria o total a `NaN`, e a tela imprimiria `R$ NaN`).
 */
export function resumirVendas(vendas: readonly VendaAfiliada[]): Omit<ResumoAfiliada, 'cliques' | 'vendas'> {
  let comissaoTotal = 0;
  let comissaoAReceber = 0;
  for (const v of vendas) {
    const valor = Number(v.commissionAmount);
    if (!Number.isFinite(valor)) continue;
    comissaoTotal += valor;
    if (!vendaPaga(v)) comissaoAReceber += valor;
  }
  return { comissaoTotal, comissaoAReceber };
}

/**
 * O resumo inteiro, a partir das contagens e das vendas.
 *
 * `cliques` e `vendas` (a contagem) chegam do banco; as duas comissoes saem das
 * vendas. Manter as quatro num objeto so evita que a tela monte o resumo pela
 * metade — que e como um total e uma contagem de fontes diferentes acabam
 * divergindo.
 */
export function resumoAfiliada(cliques: number, vendas: readonly VendaAfiliada[]): ResumoAfiliada {
  return { cliques, vendas: vendas.length, ...resumirVendas(vendas) };
}

/**
 * ================== O LINK DE DIVULGACAO E O CUPOM ==================
 *
 * O LINK. O original: `` `${window.location.origin}/?ref=${profile.referral_slug}` ``.
 * `window` NAO EXISTE em Node — chamar isso numa bancada derrubaria o processo
 * com `ReferenceError`, e nenhum print prova o dominio (a tela nunca aparece em
 * print). Entao a origem entra por PARAMETRO, e nao de `window`: a bancada passa
 * `https://exemplo.com`, e a tela passa `''` hoje.
 *
 * COM ORIGEM VAZIA, o resultado e `/?ref=<slug>` — um caminho relativo, e nao
 * uma URL quebrada. Isso e de proposito: a tela nao pode inventar
 * `https://closetlunnar.com.br` (seria uma credencial de dominio inventada), e um
 * caminho relativo e a unica coisa verdadeira que se pode escrever antes de saber
 * o dominio. Quando o site existir, a origem entra e o link vira absoluto.
 *
 * O SLUG VAZIO. O admin tem `formatReferral` que devolve `/` sozinho — mas AQUI o
 * slug vazio nao pode virar `/?ref=`, que e um parametro sem valor. A condicional
 * e explicita: sem slug, o link e `?ref=` mesmo assim? NAO — sem slug, o
 * `?ref=` nao existe, porque um link de indicacao que nao identifica ninguem nao
 * e um link de indicacao. A bancada prova os dois ramos.
 */
export function linkDivulgacao(referralSlug: string, origem: string): string {
  const slug = String(referralSlug ?? '').trim();
  if (!slug) return origem ? `${origem}/` : '/';
  return `${origem}/?ref=${slug}`;
}

/** Os 8 primeiros caracteres do id do pedido — o `#` fica com a tela. */
export function idCurtoPedido(orderId: string): string {
  return String(orderId ?? '').slice(0, 8);
}

/**
 * A data de uma venda, no formato do historico.
 *
 * O original usa `new Date(s.created_at).toLocaleDateString('pt-BR')` — que
 * depende do fuso do runtime e faz um ISO de meia-noite UTC voltar um dia atras
 * em BRT (ver `feedback_data_iso_e_utc_meia_noite`). Aqui o dia e RECORTADO do
 * texto ISO, como `dataCurta` faz: o dia que esta escrito no dado e o dia que a
 * tela mostra, em qualquer fuso.
 *
 * `null`/invalido -> `—`, e nao uma data falsa.
 */
export function dataVenda(iso: string | null): string {
  if (!iso) return '—';
  const m = String(iso).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return '—';
  return `${m[3]}/${m[2]}/${m[1]}`;
}
