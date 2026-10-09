'use client';

import { ChevronRight, Truck } from 'lucide-react';
import { formatBRL, formatDate } from '@/lib/utils';
import { rotuloItens, rotuloStatus, tomStatus } from '@/lib/cliente/metrics';
import type { PedidoCliente } from '@/lib/cliente/types';

/**
 * UM CARTAO DE `Meus Pedidos` — o accordion do print `cli-004`/`cli-005`.
 *
 * ================== A ESTRUTURA, NA LINHA DO PRINT ==================
 *
 * Cada cartao tem DUAS partes: a linha sempre visivel (o botao que abre) e o
 * painel que so existe quando o cartao esta aberto.
 *
 * A linha visivel, na ordem que o print mostra (`cli-004`, zoom do primeiro
 * cartao):
 *
 *   `#ff3048c9`   16/06/2026        <- pilula cinza + data, na MESMA linha
 *   `0 itens no pedido`             <- serifada, ~18px
 *   `[caminhao] me:1`               <- o metodo CRU, sem traduzir
 *
 *   ... e a direita, alinhado a direita:
 *
 *   `STATUS` / `[ AGUARDANDO PAGAMENTO ]`      <- rotulo 10px + pilula ambar
 *   `TOTAL`  / `R$ 506,95`                     <- rotulo 10px + serifada 18px
 *   `>`                                        <- seta, so no desktop
 *
 * Os rotulos `STATUS` e `TOTAL` sao escritos ACIMA do valor, e nao ao lado —
 * e a coluna estreita do print, e nao uma escolha de layout.
 *
 * ================== A LINHA DO FRETE ESCREVE O IDENTIFICADOR CRU ==================
 *
 * `me:1` e `own:341d5a3a-8603-4a60-9903-72b8f529d0e0` NAO sao nomes de
 * transportadora: sao a coluna `shipping_method` impressa como esta. O nome
 * `Correios` nao aparece nesta tela. Ver `projetarPedido` em `metrics.ts` e a
 * nota de `shipmentMethod` em `lib/pedidos/types.ts`.
 *
 * ================== O QUE NAO ESTA AQUI — OS DOIS BLOCOS DE RASTREIO ==================
 *
 * O original (`conta.pedidos.tsx`) desenha, ENTRE a linha visivel e o painel,
 * dois blocos de acompanhamento:
 *
 *   isOwnDelivery  -> caixa com `delivery_status` e o link `Acompanhar entregador`
 *   isMelhorEnvio  -> caixa com `carrier` — `código {tracking_code}` e `Rastrear pedido`
 *
 * Nenhum dos dois esta aqui, e a razao e uma DESCOBERTA, nao uma omissao:
 *
 *     isOwnDelivery = (shipping_method ?? "").toLowerCase().includes("propria")
 *                  || ...includes("própria") || ...includes("local")
 *     isMelhorEnvio = (shipping_method ?? "").toLowerCase().includes("melhor")
 *
 * As duas buscas procuram PALAVRAS. O dado que a propria tela recebe — e que o
 * print mostra — e `me:1` e `own:341d5a3a-…`: nenhuma das duas strings contem
 * `melhor`, `propria` ou `local`. Ou seja: no material, as duas condicoes sao
 * FALSAS, e por isso os dois blocos simplesmente nao aparecem. Nao e que o
 * print os tenha cortado — com o dado que ele exibe, o codigo do original nao
 * os desenha.
 *
 * Reproduzir as duas condicoes AO PE DA LETRA seria escrever um ramo que nunca
 * executa. Corrigi-las para `me:` / `own:` seria INFERIR o formato do
 * identificador a partir de duas amostras — e a instrucao desta fase e explicita:
 * sem referencia que comprove, nao se inventa. Alem disso os blocos precisam de
 * tres campos que o modelo compartilhado nao tem (`tracking_url`,
 * `delivery_status`, `delivery_tracker_url`), e criar um segundo modelo so para
 * eles e exatamente o que a Fase 4 proibe.
 *
 * Entao o cartao mostra o que a referencia MOSTRA (a linha do caminhao com o
 * identificador) e o que ela DECLARA sem depender de campo nenhum (o painel
 * aberto e os dois botoes, que no original tambem nao tem `onClick` — ver
 * abaixo). Os dois blocos ficam registrados como divergencia no STATUS, com a
 * condicao que os governa transcrita, para quando o banco tiver os campos.
 *
 * ================== OS DOIS BOTOES DO PAINEL NAO FAZEM NADA — COMO NO ORIGINAL ==================
 *
 * `Acompanhar entrega` e `Preciso de ajuda` sao `<button>` sem `onClick` no
 * proprio original: estao la como alvo, nao como fluxo. Transcrever um botao
 * assim e fiel; dar a ele um `href` inventado (`/ajuda`, um link de
 * transportadora) seria pior, porque a tela passaria a levar a lugar nenhum de
 * verdade. Eles ficam identicos ao original e sao anotados como pendencia.
 *
 * ================== `aria-expanded` E UMA ADICAO DE ACESSIBILIDADE ==================
 *
 * O original nao declara `aria-expanded` no botao que abre o cartao. Aqui ele
 * existe: o botao controla uma regiao, e o atributo e o que diz isso a quem nao
 * ve a seta girar. Nao muda um pixel — o `className` e o mesmo.
 */
export interface PedidoCardProps {
  pedido: PedidoCliente;
  /** O painel de itens esta aberto? Controlado de fora — ver `OrdersView`. */
  aberto: boolean;
  onAlternar: () => void;
}

export function PedidoCard({ pedido, aberto, onAlternar }: PedidoCardProps) {
  return (
    <div className="overflow-hidden rounded-3xl border border-border bg-background shadow-sm transition-all hover:border-foreground/20">
      {/*
        O botao ocupa o cartao inteiro: no print nao ha area morta em volta da
        linha, e o `text-left` e necessario porque `<button>` centraliza o texto
        por padrao — sem ele a coluna da esquerda sairia centrada.
      */}
      <button
        type="button"
        onClick={onAlternar}
        aria-expanded={aberto}
        className="focus-ring flex w-full flex-col gap-4 p-5 text-left md:flex-row md:items-center md:p-6"
      >
        <div className="flex-1">
          <div className="mb-1 flex items-center gap-3">
            {/*
              A pilula do codigo. O `codigo` ja vem com `#` (ver `buildOrderCode`),
              entao a tela NAO escreve outro — o print mostra um `#` so.
            */}
            <span className="rounded bg-secondary/60 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              {pedido.codigo}
            </span>
            {/*
              A data sai de `formatDate` (o mesmo `toLocaleDateString('pt-BR')` do
              original). O valor e um ISO com HORA, e nao uma data seca: com hora,
              o JavaScript interpreta no fuso local e o dia nao vira. E o caso que
              a nota de `validadeCurta` descreve ao contrario.
            */}
            <span className="text-xs text-muted-foreground">{formatDate(pedido.feitoEm)}</span>
          </div>

          {/*
            A contagem e de LINHAS (`pedido.itens.length`), como no original — e
            nao de pecas. O pedido `#ff3048c9` do print tem zero linhas e escreve
            `0 itens no pedido`; somar `quantity` daria o mesmo aqui, mas nao daria
            no primeiro pedido com `quantity: 2`.
          */}
          <p className="font-serif text-lg">{rotuloItens(pedido.itens.length)}</p>

          {/*
            A linha some quando o campo e nulo — o print mostra os cinco cartoes
            COM ela, e o original so a desenha sob a condicao `{o.shipping_method && …}`.
          */}
          {pedido.frete && (
            <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Truck className="size-3" aria-hidden /> {pedido.frete}
            </p>
          )}
        </div>

        {/*
          O bloco da direita. No celular ele desce para uma segunda linha, com um
          fio acima; no desktop ele encosta na direita. As duas classes de
          borda/padding (`border-t md:border-t-0`, `pt-3 md:pt-0`) sao o que troca
          de um arranjo para o outro.
        */}
        <div className="flex w-full items-center justify-between gap-6 border-t border-border/50 pt-3 md:w-auto md:justify-end md:border-t-0 md:pt-0">
          <div className="flex flex-col md:items-end">
            <p className="mb-1 text-[10px] uppercase tracking-widest text-muted-foreground">Status</p>
            <span
              className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${tomStatus(pedido.status)}`}
            >
              {rotuloStatus(pedido.status)}
            </span>
          </div>

          <div className="flex min-w-[100px] flex-col md:items-end">
            <p className="mb-1 text-[10px] uppercase tracking-widest text-muted-foreground">Total</p>
            <span className="font-serif text-lg leading-none">{formatBRL(pedido.total)}</span>
          </div>

          {/*
            A seta gira para baixo quando o cartao abre. `hidden md:block` e do
            original: no celular ela nao aparece, e o proprio fio horizontal ja
            separa a linha de baixo.
          */}
          <ChevronRight
            className={`hidden size-5 text-muted-foreground transition-transform md:block ${aberto ? 'rotate-90' : ''}`}
            aria-hidden
          />
        </div>
      </button>

      {aberto && (
        <div className="border-t border-border/50 bg-secondary/5 px-6 py-6">
          <h4 className="mb-4 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
            Itens do pedido
          </h4>

          <div className="space-y-4">
            {pedido.itens.length === 0 ? (
              /*
                O caso do `#ff3048c9`: o print mostra `0 itens no pedido` na linha
                fechada, e o original imprime esta frase quando o painel abre com
                a lista vazia. E um estado legitimo, e nao um erro.
              */
              <p className="text-xs text-muted-foreground">Sem itens registrados.</p>
            ) : (
              pedido.itens.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-4 border-b border-border/30 py-2 last:border-0"
                >
                  <div className="flex items-center gap-4">
                    {/*
                      O quadradinho com a INICIAL. O original escreve
                      `it.product_name?.charAt(0)` — a primeira letra do nome, e
                      nao uma miniatura. Nao ha imagem de produto neste modelo.
                    */}
                    <div className="flex size-12 items-center justify-center rounded-lg border border-border bg-background text-[10px] font-bold text-muted-foreground">
                      {item.nome.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-bold tracking-tight">{item.nome}</p>
                      {/*
                        A linha de variacao, com a forma exata do original:
                        `Tam: M` · `· Cor: Preto` · `· Qtd: 1` — os separadores
                        sao do material, e a `Unico` aparece quando a peca nao tem
                        cor (ver `OrderItem.color` em `lib/pedidos/types.ts`).
                      */}
                      <p className="mt-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                        {item.tamanho && `Tam: ${item.tamanho}`} {item.cor && `· Cor: ${item.cor}`} · Qtd: {item.quantidade}
                      </p>
                    </div>
                  </div>
                  {/*
                    O valor da linha e `precoUnitario * quantidade` — o total dela,
                    e nao o preco unitario. O original faz a multiplicacao na tela.
                  */}
                  <span className="text-sm font-medium">
                    {formatBRL(item.precoUnitario * item.quantidade)}
                  </span>
                </div>
              ))
            )}
          </div>

          <div className="mt-8 flex flex-col justify-between gap-6 border-t border-border pt-6 md:flex-row">
            <div className="space-y-1">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Resumo de valores
              </p>
              <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-xs">
                <span className="text-muted-foreground">Subtotal:</span>
                <span className="text-right font-medium">{formatBRL(pedido.subtotal)}</span>

                {/*
                  As duas linhas condicionais sao do original: desconto e frete so
                  aparecem quando existem. Um pedido sem cupom nao escreve
                  `Desconto: R$ 0,00` — a linha simplesmente nao existe.

                  A COR DO DESCONTO. O original declara `text-rose-600` (a paleta
                  crua do Tailwind, que este projeto nao usa). O token adotado e
                  `--danger`, que e a MESMA conversao que o projeto ja fez para
                  esta paleta: em `lib/pedidos/demo.ts`, o status `cancelado` do
                  original (`bg-rose-100 text-rose-800`) tambem virou `danger`. Um
                  segundo mapeamento para o mesmo rosa seria a divergencia, nao a
                  fidelidade.
                */}
                {pedido.desconto > 0 && (
                  <>
                    <span className="font-medium text-danger">Desconto:</span>
                    <span className="text-right font-medium text-danger">
                      -{formatBRL(pedido.desconto)}
                    </span>
                  </>
                )}

                {pedido.freteValor > 0 && (
                  <>
                    <span className="text-muted-foreground">Frete:</span>
                    <span className="text-right font-medium">{formatBRL(pedido.freteValor)}</span>
                  </>
                )}

                <div className="col-span-2 my-2 border-t border-border" />

                <span className="text-sm font-bold">Total:</span>
                <span className="text-right font-serif text-xl font-bold leading-none">
                  {formatBRL(pedido.total)}
                </span>
              </div>
            </div>

            {/*
              Os dois botoes, transcritos do original — inclusive o fato de NAO
              terem `onClick` la. Ver a nota do topo do arquivo.
            */}
            <div className="flex flex-col gap-2">
              <button
                type="button"
                className="rounded-xl border border-border px-6 py-3 text-[10px] font-bold uppercase tracking-widest transition-colors hover:bg-background"
              >
                Acompanhar entrega
              </button>
              <button
                type="button"
                className="rounded-xl bg-foreground px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-background transition-colors hover:opacity-90"
              >
                Preciso de ajuda
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
