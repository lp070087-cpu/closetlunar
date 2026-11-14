'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { CheckCircle2, Clock, Loader2, XCircle } from 'lucide-react';
import { useSacola } from '@/lib/site/carrinho';
import { formatBRL } from '@/lib/utils';
import { mensagemDoGatilho, useContatoLoja, whatsappLinkFor } from '@/lib/site/whatsapp';

interface Estado {
  ok: boolean;
  code?: string;
  pago?: boolean;
  status?: string;
  paymentStatus?: string;
  total?: number;
}

/**
 * Acompanha o pagamento do pedido:
 *  - voltou da InfinitePay com transaction_nsu + slug -> POST (servidor confere e libera);
 *  - sem esses dados (fechou a aba e reabriu) -> GET (le o banco; o webhook ja pode ter liberado);
 *  - tenta a cada 3 s por ~45 s; depois oferece "Verificar de novo".
 */
export function StatusPagamento({
  pedidoId,
  transactionNsu,
  slug,
  receiptUrl,
}: {
  pedidoId: string;
  transactionNsu: string;
  slug: string;
  receiptUrl: string;
}) {
  const sacola = useSacola();
  const [estado, setEstado] = useState<Estado | null>(null);
  const [esgotou, setEsgotou] = useState(false);
  const tentativas = useRef(0);
  const limpou = useRef(false);

  const consultar = useCallback(async (): Promise<Estado | null> => {
    try {
      const temRetorno = !!(transactionNsu && slug);
      const r = await fetch(`/api/pedidos/${encodeURIComponent(pedidoId)}`, {
        method: temRetorno ? 'POST' : 'GET',
        headers: temRetorno ? { 'Content-Type': 'application/json' } : undefined,
        body: temRetorno
          ? JSON.stringify({ transaction_nsu: transactionNsu, slug, receipt_url: receiptUrl })
          : undefined,
        cache: 'no-store',
      });
      const j = (await r.json()) as Estado;
      setEstado(j);
      return j;
    } catch {
      return null;
    }
  }, [pedidoId, transactionNsu, slug, receiptUrl]);

  useEffect(() => {
    let vivo = true;
    let timer: ReturnType<typeof setTimeout>;
    const ciclo = async () => {
      const e = await consultar();
      if (!vivo) return;
      if (e?.pago || e?.ok === false || e?.status === 'cancelado') return;
      tentativas.current += 1;
      if (tentativas.current >= 15) {
        setEsgotou(true);
        return;
      }
      timer = setTimeout(ciclo, 3000);
    };
    ciclo();
    return () => {
      vivo = false;
      clearTimeout(timer);
    };
  }, [consultar]);

  // Pago: esvazia a sacola uma vez e limpa os parametros da URL.
  useEffect(() => {
    if (estado?.pago && sacola?.pronto && !limpou.current) {
      limpou.current = true;
      sacola.limpar();
      try {
        localStorage.removeItem('closet-lunar-ultimo-pedido');
        window.history.replaceState(null, '', `/pedido-confirmado/${pedidoId}`);
      } catch {
        /* ignora */
      }
    }
  }, [estado?.pago, sacola, pedidoId]);

  const contato = useContatoLoja();
  const wa =
    whatsappLinkFor(
      contato.telefone,
      mensagemDoGatilho(contato.modelos, 'order_query', 'Olá! Vim pelo site da Closet Lunar e gostaria de falar sobre meu pedido.', { pedido: estado?.code }),
    ) ?? null;

  if (estado && estado.ok === false) {
    return (
      <>
        <Icone tipo="erro" />
        <h1 className="font-serif text-3xl">Pedido não encontrado</h1>
        <p className="mt-3 text-sm text-muted-foreground">Confira o link ou fale com a gente.</p>
        <Acoes wa={wa} />
      </>
    );
  }

  if (estado?.pago) {
    return (
      <>
        <Icone tipo="ok" />
        <h1 className="font-serif text-3xl">Pagamento confirmado!</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Pedido <span className="font-mono font-medium">#{estado.code}</span>
          {typeof estado.total === 'number' ? <> · {formatBRL(estado.total)}</> : null}
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Recebemos seu pagamento e já estamos separando suas peças. Você vai receber o código de rastreio assim que o
          pedido for postado.
        </p>
        {receiptUrl ? (
          <a href={receiptUrl} target="_blank" rel="noreferrer" className="mt-4 inline-block text-xs underline">
            Ver comprovante
          </a>
        ) : null}
        <Acoes wa={wa} />
      </>
    );
  }

  if (estado?.status === 'cancelado') {
    return (
      <>
        <Icone tipo="erro" />
        <h1 className="font-serif text-3xl">Pedido cancelado</h1>
        <p className="mt-3 text-sm text-muted-foreground">Esse pedido não foi pago. Você pode tentar de novo pela sacola.</p>
        <Acoes wa={wa} />
      </>
    );
  }

  return (
    <>
      <Icone tipo={esgotou ? 'espera' : 'carregando'} />
      <h1 className="font-serif text-3xl">{esgotou ? 'Aguardando pagamento' : 'Confirmando seu pagamento...'}</h1>
      {estado?.code ? (
        <p className="mt-3 text-sm text-muted-foreground">
          Pedido <span className="font-mono">#{estado.code}</span>
          {typeof estado.total === 'number' ? <> · {formatBRL(estado.total)}</> : null}
        </p>
      ) : null}
      <p className="mt-2 text-sm text-muted-foreground">
        {esgotou
          ? 'Ainda não recebemos a confirmação. Se você já pagou, aguarde um instante — a liberação é automática.'
          : 'Estamos verificando seu pagamento automaticamente.'}
      </p>
      {esgotou ? (
        <button
          type="button"
          onClick={() => {
            tentativas.current = 0;
            setEsgotou(false);
            consultar();
          }}
          className="mt-6 rounded-full bg-foreground px-6 py-3 text-xs uppercase tracking-[0.18em] text-background"
        >
          Verificar de novo
        </button>
      ) : null}
      <Acoes wa={wa} />
    </>
  );
}

function Icone({ tipo }: { tipo: 'ok' | 'erro' | 'espera' | 'carregando' }) {
  const I = tipo === 'ok' ? CheckCircle2 : tipo === 'erro' ? XCircle : tipo === 'espera' ? Clock : Loader2;
  return (
    <div className="mx-auto mb-4 grid size-16 place-items-center rounded-full bg-foreground text-background">
      <I className={`size-7 ${tipo === 'carregando' ? 'animate-spin' : ''}`} aria-hidden />
    </div>
  );
}

function Acoes({ wa }: { wa: string | null }) {
  return (
    <div className="mt-8 flex justify-center gap-6">
      <Link href="/" className="text-xs uppercase tracking-wider underline">
        Voltar à loja
      </Link>
      {wa ? (
        <a href={wa} target="_blank" rel="noreferrer" className="text-xs uppercase tracking-wider underline">
          Falar no WhatsApp
        </a>
      ) : null}
    </div>
  );
}
