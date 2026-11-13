'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { Loader2, Lock, Truck } from 'lucide-react';
import { useSacola } from '@/lib/site/carrinho';
import { formatBRL } from '@/lib/utils';
import { AVISO_GATEWAY } from '@/lib/pagamento/provider';

/**
 * CHECKOUT — dados da cliente, endereco, frete (Melhor Envio) e pagamento
 * (InfinitePay Checkout Integrado: Pix ou cartao).
 *
 * Os valores mostrados aqui sao uma PREVIA. O servidor recalcula tudo (precos,
 * estoque, frete e cupom) em `/api/checkout` antes de criar a cobranca.
 */

interface OpcaoFrete {
  id: string;
  nome: string;
  empresa: string;
  preco: number;
  precoOriginal: number;
  prazoMin: number;
  prazoMax: number;
  gratis: boolean;
}

const CHAVE_DADOS = 'closet-lunar-checkout-dados';
export const CHAVE_ULTIMO_PEDIDO = 'closet-lunar-ultimo-pedido';

const so = (s: string) => s.replace(/\D/g, '');

function mascaraCep(v: string) {
  const d = so(v).slice(0, 8);
  return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
}
function mascaraTel(v: string) {
  const d = so(v).slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, d.length - 4)}-${d.slice(-4)}`;
}

const campo =
  'w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-foreground';
const rotulo = 'mb-1 block text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground';

export function CheckoutView() {
  const sacola = useSacola();

  const [dados, setDados] = useState({
    nome: '',
    email: '',
    telefone: '',
    cep: '',
    rua: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    uf: '',
  });
  const [cupom, setCupom] = useState('');
  const [opcoes, setOpcoes] = useState<OpcaoFrete[]>([]);
  const [freteId, setFreteId] = useState('');
  const [freteMsg, setFreteMsg] = useState('');
  const [cotando, setCotando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');

  // Lembra os dados da cliente neste navegador (conveniencia).
  useEffect(() => {
    try {
      const salvo = localStorage.getItem(CHAVE_DADOS);
      if (salvo) setDados((d) => ({ ...d, ...JSON.parse(salvo) }));
    } catch {
      /* armazenamento bloqueado */
    }
  }, []);

  const set = (k: keyof typeof dados) => (e: React.ChangeEvent<HTMLInputElement>) => {
    let v = e.target.value;
    if (k === 'cep') v = mascaraCep(v);
    if (k === 'telefone') v = mascaraTel(v);
    if (k === 'uf') v = v.toUpperCase().slice(0, 2);
    setDados((d) => ({ ...d, [k]: v }));
    if (k === 'cep') {
      setOpcoes([]);
      setFreteId('');
    }
  };

  const itensFrete = useMemo(
    () => (sacola?.itens ?? []).map((i) => ({ produtoId: i.produtoId, quantidade: i.quantidade })),
    [sacola?.itens],
  );
  const chaveItens = JSON.stringify(itensFrete);

  // CEP completo -> ViaCEP preenche o endereco e cota o frete.
  useEffect(() => {
    const cep = so(dados.cep);
    if (cep.length !== 8 || itensFrete.length === 0) return;
    let vivo = true;
    (async () => {
      try {
        const r = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
        const j = await r.json();
        if (vivo && j && !j.erro) {
          setDados((d) => ({
            ...d,
            rua: d.rua || j.logradouro || '',
            bairro: d.bairro || j.bairro || '',
            cidade: j.localidade || d.cidade,
            uf: j.uf || d.uf,
          }));
        }
      } catch {
        /* ViaCEP fora do ar: a cliente digita */
      }
      if (!vivo) return;
      setCotando(true);
      setFreteMsg('');
      try {
        const r = await fetch('/api/frete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cep, itens: itensFrete }),
        });
        const j = await r.json();
        if (!vivo) return;
        setOpcoes(j.opcoes ?? []);
        setFreteId(j.opcoes?.[0]?.id ?? '');
        setFreteMsg(j.ok ? '' : j.mensagem ?? 'Frete indisponível.');
      } catch {
        if (vivo) setFreteMsg('Não foi possível calcular o frete.');
      } finally {
        if (vivo) setCotando(false);
      }
    })();
    return () => {
      vivo = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dados.cep, chaveItens]);

  if (!sacola || !sacola.pronto) {
    return <p className="py-20 text-center text-sm text-muted-foreground">Carregando...</p>;
  }

  const { itens, subtotal, contagem } = sacola;

  if (itens.length === 0) {
    return (
      <div className="mx-auto max-w-md rounded-2xl border border-dashed border-border py-20 text-center">
        <p className="text-sm text-muted-foreground">Sua sacola está vazia.</p>
        <Link
          href="/"
          className="mt-6 inline-flex rounded-full bg-foreground px-6 py-3 text-xs uppercase tracking-[0.18em] text-background"
        >
          Explorar coleção
        </Link>
      </div>
    );
  }

  const frete = opcoes.find((o) => o.id === freteId) ?? null;
  const total = subtotal + (frete?.preco ?? 0);

  async function pagar(e: React.FormEvent) {
    e.preventDefault();
    setErro('');
    if (!frete) {
      setErro('Informe o CEP e escolha a forma de entrega.');
      return;
    }
    setEnviando(true);
    try {
      try {
        const { nome, email, telefone, cep, rua, numero, complemento, bairro, cidade, uf } = dados;
        localStorage.setItem(
          CHAVE_DADOS,
          JSON.stringify({ nome, email, telefone, cep, rua, numero, complemento, bairro, cidade, uf }),
        );
      } catch {
        /* ignora */
      }
      const r = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cliente: { nome: dados.nome, email: dados.email, telefone: dados.telefone },
          endereco: {
            cep: dados.cep,
            rua: dados.rua,
            numero: dados.numero,
            complemento: dados.complemento,
            bairro: dados.bairro,
            cidade: dados.cidade,
            uf: dados.uf,
          },
          itens: itens.map((i) => ({
            produtoId: i.produtoId,
            tamanho: i.tamanho,
            cor: i.cor,
            quantidade: i.quantidade,
          })),
          servicoFreteId: frete.id,
          cupom: cupom.trim() || undefined,
        }),
      });
      const j = await r.json();
      if (!j.ok) {
        setErro(j.erro ?? 'Não foi possível finalizar.');
        setEnviando(false);
        return;
      }
      try {
        localStorage.setItem(CHAVE_ULTIMO_PEDIDO, j.pedidoId);
      } catch {
        /* ignora */
      }
      window.location.href = j.url;
    } catch {
      setErro('Falha de conexão. Tente novamente.');
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={pagar} className="grid gap-10 lg:grid-cols-[1fr_400px]">
      <div className="space-y-10">
        <section>
          <h2 className="font-serif text-2xl italic">Seus dados</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="sm:col-span-2">
              <span className={rotulo}>Nome completo</span>
              <input required autoComplete="name" className={campo} value={dados.nome} onChange={set('nome')} />
            </label>
            <label>
              <span className={rotulo}>E-mail</span>
              <input required type="email" autoComplete="email" className={campo} value={dados.email} onChange={set('email')} />
            </label>
            <label>
              <span className={rotulo}>WhatsApp</span>
              <input
                required
                inputMode="tel"
                autoComplete="tel"
                placeholder="(81) 99999-9999"
                className={campo}
                value={dados.telefone}
                onChange={set('telefone')}
              />
            </label>
          </div>
        </section>

        <section>
          <h2 className="font-serif text-2xl italic">Entrega</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-6">
            <label className="sm:col-span-2">
              <span className={rotulo}>CEP</span>
              <input
                required
                inputMode="numeric"
                autoComplete="postal-code"
                placeholder="00000-000"
                className={campo}
                value={dados.cep}
                onChange={set('cep')}
              />
            </label>
            <label className="sm:col-span-4">
              <span className={rotulo}>Rua</span>
              <input required autoComplete="address-line1" className={campo} value={dados.rua} onChange={set('rua')} />
            </label>
            <label className="sm:col-span-2">
              <span className={rotulo}>Número</span>
              <input required className={campo} value={dados.numero} onChange={set('numero')} />
            </label>
            <label className="sm:col-span-4">
              <span className={rotulo}>Complemento</span>
              <input className={campo} value={dados.complemento} onChange={set('complemento')} />
            </label>
            <label className="sm:col-span-3">
              <span className={rotulo}>Bairro</span>
              <input required className={campo} value={dados.bairro} onChange={set('bairro')} />
            </label>
            <label className="sm:col-span-2">
              <span className={rotulo}>Cidade</span>
              <input required className={campo} value={dados.cidade} onChange={set('cidade')} />
            </label>
            <label className="sm:col-span-1">
              <span className={rotulo}>UF</span>
              <input required className={campo} value={dados.uf} onChange={set('uf')} />
            </label>
          </div>

          <div className="mt-6" aria-live="polite">
            {cotando ? (
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" aria-hidden /> Calculando frete...
              </p>
            ) : opcoes.length > 0 ? (
              <fieldset className="space-y-2">
                <legend className={rotulo}>Forma de entrega</legend>
                {opcoes.map((o) => (
                  <label
                    key={o.id}
                    className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 text-sm transition ${
                      freteId === o.id ? 'border-foreground bg-secondary/40' : 'border-border'
                    }`}
                  >
                    <input
                      type="radio"
                      name="frete"
                      value={o.id}
                      checked={freteId === o.id}
                      onChange={() => setFreteId(o.id)}
                      className="accent-foreground"
                    />
                    <Truck className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                    <span className="flex-1">
                      <span className="font-medium">
                        {o.empresa} {o.nome}
                      </span>
                      <span className="block text-[11px] text-muted-foreground">
                        {o.prazoMin === o.prazoMax ? o.prazoMax : `${o.prazoMin} a ${o.prazoMax}`} dias úteis
                      </span>
                    </span>
                    <span className="font-medium">
                      {o.gratis ? (
                        <>
                          <s className="mr-1 text-xs text-muted-foreground">{formatBRL(o.precoOriginal)}</s>Grátis
                        </>
                      ) : (
                        formatBRL(o.preco)
                      )}
                    </span>
                  </label>
                ))}
              </fieldset>
            ) : freteMsg ? (
              <p className="rounded-xl bg-secondary/50 p-4 text-sm text-muted-foreground">{freteMsg}</p>
            ) : (
              <p className="text-xs text-muted-foreground">Digite o CEP para ver as opções de entrega.</p>
            )}
          </div>
        </section>

        <section>
          <h2 className="font-serif text-2xl italic">Seus itens</h2>
          <ul className="mt-5 divide-y divide-border/40 rounded-2xl border border-border/60">
            {itens.map((i) => (
              <li key={i.id} className="flex items-center gap-4 p-4">
                <Link
                  href={`/produto/${i.slug}`}
                  className="block size-16 shrink-0 overflow-hidden rounded-lg bg-secondary"
                >
                  {i.imagem ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={i.imagem} alt={i.nome} className="size-full object-cover" />
                  ) : null}
                </Link>
                <div className="min-w-0 flex-1">
                  <Link href={`/produto/${i.slug}`} className="text-sm font-medium hover:text-accent">
                    {i.nome}
                  </Link>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    {[i.tamanho, i.cor].filter(Boolean).join(' · ')} · {i.quantidade}x
                  </p>
                </div>
                <span className="text-sm font-medium">{formatBRL(i.preco * i.quantidade)}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <aside className="h-fit rounded-2xl border border-border/60 bg-secondary/30 p-6 lg:sticky lg:top-28">
        <h2 className="font-serif text-xl">Resumo</h2>
        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">
              Subtotal ({contagem} {contagem === 1 ? 'item' : 'itens'})
            </dt>
            <dd className="font-medium">{formatBRL(subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Frete</dt>
            <dd className={frete ? 'font-medium' : 'text-muted-foreground'}>
              {frete ? (frete.gratis ? 'Grátis' : formatBRL(frete.preco)) : 'informe o CEP'}
            </dd>
          </div>
        </dl>

        <label className="mt-4 block">
          <span className={rotulo}>Cupom de desconto</span>
          <input
            className={campo}
            value={cupom}
            onChange={(e) => setCupom(e.target.value.toUpperCase())}
            placeholder="Opcional"
          />
          <span className="mt-1 block text-[11px] text-muted-foreground">O desconto é aplicado na tela de pagamento.</span>
        </label>

        <div className="mt-4 flex justify-between border-t border-border pt-4">
          <span className="font-medium">Total</span>
          <span className="font-serif text-2xl">{formatBRL(total)}</span>
        </div>

        {erro ? (
          <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-xs text-red-700">
            {erro}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={enviando || cotando}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-foreground py-3.5 text-xs font-medium uppercase tracking-[0.18em] text-background transition disabled:opacity-60"
        >
          {enviando ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Lock className="size-4" aria-hidden />}
          {enviando ? 'Abrindo pagamento...' : 'Ir para o pagamento'}
        </button>

        <p className="mt-3 text-center text-[11px] leading-relaxed text-muted-foreground">
          {AVISO_GATEWAY} Pix com liberação automática em segundos.
        </p>

        <Link
          href="/"
          className="mt-4 block text-center text-xs text-muted-foreground underline transition-colors hover:text-foreground"
        >
          Continuar comprando
        </Link>
      </aside>
    </form>
  );
}
