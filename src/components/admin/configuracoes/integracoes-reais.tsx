'use client';

import { mascaraMoeda } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { CheckCircle2, Loader2, XCircle } from 'lucide-react';
import {
  lerPainelIntegracoes,
  salvarMelhorEnvio,
  salvarPagamento,
  testarFrete,
  testarInfinitePay,
  type PainelIntegracoes,
} from '@/lib/integracoes/acoes';

const campo =
  'w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-foreground';
const rotulo = 'mb-1 block text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground';
const botao =
  'inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-xs font-medium uppercase tracking-[0.14em] text-background disabled:opacity-60';
const botaoSec =
  'inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-xs font-medium uppercase tracking-[0.14em] disabled:opacity-60';

function usePainel() {
  const [painel, setPainel] = useState<PainelIntegracoes | null | undefined>(undefined);
  useEffect(() => {
    lerPainelIntegracoes()
      .then(setPainel)
      .catch(() => setPainel(null));
  }, []);
  return [painel, setPainel] as const;
}

function Resultado({ r }: { r: { ok: boolean; mensagem: string } | null }) {
  if (!r) return null;
  const I = r.ok ? CheckCircle2 : XCircle;
  return (
    <p
      role="status"
      className={`mt-4 flex items-start gap-2 rounded-xl p-3 text-xs ${r.ok ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-700'}`}
    >
      <I className="mt-0.5 size-4 shrink-0" aria-hidden />
      <span>{r.mensagem}</span>
    </p>
  );
}

function SemAcesso({ painel }: { painel: PainelIntegracoes | null | undefined }) {
  if (painel === undefined)
    return <p className="surface p-10 text-center text-sm text-muted-foreground">Carregando…</p>;
  return (
    <p className="surface p-10 text-center text-sm text-muted-foreground">
      Entre com a conta de administradora para editar as integrações.
    </p>
  );
}

/* ============================== INFINITEPAY ============================== */

export function InfinitePayConfig() {
  const [painel] = usePainel();
  const [handle, setHandle] = useState('');
  const [ativo, setAtivo] = useState(true);
  const [ocupado, setOcupado] = useState(false);
  const [res, setRes] = useState<{ ok: boolean; mensagem: string } | null>(null);
  const [origem, setOrigem] = useState('');

  useEffect(() => {
    setOrigem(window.location.origin);
  }, []);
  useEffect(() => {
    if (painel) {
      setHandle(painel.handle);
      setAtivo(painel.pagamentoAtivo);
    }
  }, [painel]);

  if (!painel) return <SemAcesso painel={painel} />;

  return (
    <div className="max-w-2xl space-y-5">
      <div className="rounded-2xl border border-border bg-background p-5">
        <h3 className="text-sm font-bold">InfinitePay — Checkout Integrado</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">
          A cliente paga por Pix ou cartão na página segura da InfinitePay. O pedido é liberado automaticamente quando o
          pagamento é confirmado no servidor da InfinitePay.
        </p>

        <label className="mt-5 block">
          <span className={rotulo}>InfiniteTag (sem o $)</span>
          <input className={campo} value={handle} onChange={(e) => setHandle(e.target.value)} placeholder="sua-tag" />
          <span className="mt-1 block text-[11px] text-muted-foreground">
            Fica no app InfinitePay, no seu perfil (ex.: $minhaloja → minhaloja). Não é necessária chave de API.
          </span>
        </label>

        <label className="mt-4 flex items-center gap-2 text-sm">
          <input type="checkbox" checked={ativo} onChange={(e) => setAtivo(e.target.checked)} className="accent-foreground" />
          Pagamento ativo no checkout
        </label>

        <div className="mt-5 rounded-xl bg-secondary/40 p-3">
          <span className={rotulo}>Webhook (configurado automaticamente em cada cobrança)</span>
          <code className="block break-all text-xs">{origem}/api/pagamentos/infinitepay/webhook</code>
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            className={botao}
            disabled={ocupado}
            onClick={async () => {
              setOcupado(true);
              setRes(await salvarPagamento({ handle, ativo }));
              setOcupado(false);
            }}
          >
            {ocupado ? <Loader2 className="size-4 animate-spin" /> : null} Salvar
          </button>
          <button
            type="button"
            className={botaoSec}
            disabled={ocupado}
            onClick={async () => {
              setOcupado(true);
              setRes(await testarInfinitePay(origem));
              setOcupado(false);
            }}
          >
            Testar conexão
          </button>
        </div>
        <Resultado r={res} />
      </div>

      <div className="rounded-2xl border border-border bg-background p-5 text-xs leading-relaxed text-muted-foreground">
        <p className="font-bold text-foreground">Como funciona</p>
        <ol className="mt-2 list-decimal space-y-1 pl-4">
          <li>A cliente finaliza a sacola → o pedido é criado como “pendente”.</li>
          <li>Ela paga na InfinitePay (Pix ou cartão).</li>
          <li>A InfinitePay avisa o site (webhook) e a cliente volta para a tela do pedido.</li>
          <li>O site confere o pagamento direto na InfinitePay e só então marca “pago”, baixa o estoque e avisa.</li>
        </ol>
      </div>
    </div>
  );
}

/* ============================== MELHOR ENVIO ============================== */

export function MelhorEnvioConfig() {
  const [painel] = usePainel();
  const [f, setF] = useState({
    token: '',
    sandbox: false,
    cepOrigem: '',
    pesoKg: 0.3,
    alturaCm: 4,
    larguraCm: 20,
    comprimentoCm: 25,
    freteGratisAcima: 299,
    diasManuseio: 1,
    freteFixo: 0,
    freteFixoPrazo: 10,
    retiradaAtiva: true,
  });
  const [cepTeste, setCepTeste] = useState('01310-100');
  const [ocupado, setOcupado] = useState(false);
  const [res, setRes] = useState<{ ok: boolean; mensagem: string } | null>(null);
  const [detalhes, setDetalhes] = useState<string[]>([]);

  useEffect(() => {
    if (painel)
      setF((x) => ({
        ...x,
        sandbox: painel.meSandbox,
        cepOrigem: painel.cepOrigem,
        pesoKg: painel.pesoKg,
        alturaCm: painel.alturaCm,
        larguraCm: painel.larguraCm,
        comprimentoCm: painel.comprimentoCm,
        freteGratisAcima: painel.freteGratisAcima,
        diasManuseio: painel.diasManuseio,
        freteFixo: painel.freteFixo,
        freteFixoPrazo: painel.freteFixoPrazo,
        retiradaAtiva: painel.retiradaAtiva,
      }));
  }, [painel]);

  if (!painel) return <SemAcesso painel={painel} />;

  const num = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setF((x) => ({ ...x, [k]: Number(e.target.value.replace(',', '.')) }));

  return (
    <div className="max-w-3xl space-y-5">
      <div className="rounded-2xl border border-border bg-background p-5">
        <h3 className="text-sm font-bold">Melhor Envio — cálculo de frete no checkout</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Status:{' '}
          {painel.meTemToken ? (
            <b className="text-emerald-700">token salvo ({painel.meTokenMascarado})</b>
          ) : (
            <b className="text-red-700">sem token — o checkout não consegue calcular frete</b>
          )}
        </p>

        <label className="mt-5 block">
          <span className={rotulo}>Token de acesso {painel.meTemToken ? '(deixe vazio para manter o atual)' : ''}</span>
          <textarea
            rows={3}
            className={campo}
            value={f.token}
            onChange={(e) => setF((x) => ({ ...x, token: e.target.value }))}
            placeholder="Cole aqui o token gerado no Melhor Envio"
          />
          <span className="mt-1 block text-[11px] text-muted-foreground">
            No Melhor Envio: menu Integrações → Permissões de acesso → Gerar novo token (marque todas as permissões de
            frete/envio) → copie e cole aqui.
          </span>
        </label>

        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <label>
            <span className={rotulo}>CEP de origem (da loja)</span>
            <input className={campo} value={f.cepOrigem} onChange={(e) => setF((x) => ({ ...x, cepOrigem: e.target.value }))} />
          </label>
          <label>
            <span className={rotulo}>Frete grátis acima de (R$)</span>
            <input className={campo} inputMode="numeric" value={f.freteGratisAcima ? f.freteGratisAcima.toFixed(2).replace('.', ',') : ''} onChange={(e) => setF((x) => ({ ...x, freteGratisAcima: Number(mascaraMoeda(e.target.value).replace(',', '.')) || 0 }))} />
          </label>
          <label>
            <span className={rotulo}>Dias de manuseio</span>
            <input className={campo} inputMode="numeric" value={f.diasManuseio} onChange={num('diasManuseio')} />
          </label>
        </div>

        <p className={`${rotulo} mt-5`}>Pacote padrão por peça</p>
        <div className="grid gap-4 sm:grid-cols-4">
          <label>
            <span className="text-[11px] text-muted-foreground">Peso (kg)</span>
            <input className={campo} inputMode="decimal" value={f.pesoKg} onChange={num('pesoKg')} />
          </label>
          <label>
            <span className="text-[11px] text-muted-foreground">Altura (cm)</span>
            <input className={campo} inputMode="decimal" value={f.alturaCm} onChange={num('alturaCm')} />
          </label>
          <label>
            <span className="text-[11px] text-muted-foreground">Largura (cm)</span>
            <input className={campo} inputMode="decimal" value={f.larguraCm} onChange={num('larguraCm')} />
          </label>
          <label>
            <span className="text-[11px] text-muted-foreground">Comprimento (cm)</span>
            <input className={campo} inputMode="decimal" value={f.comprimentoCm} onChange={num('comprimentoCm')} />
          </label>
        </div>

        <p className={`${rotulo} mt-5`}>Frete fixo de contingência (usado só se o Melhor Envio não responder)</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <label>
            <span className="text-[11px] text-muted-foreground">Valor (R$) — 0 desliga</span>
            <input className={campo} inputMode="numeric" value={f.freteFixo ? f.freteFixo.toFixed(2).replace('.', ',') : ''} onChange={(e) => setF((x) => ({ ...x, freteFixo: Number(mascaraMoeda(e.target.value).replace(',', '.')) || 0 }))} />
          </label>
          <label>
            <span className="text-[11px] text-muted-foreground">Prazo máximo (dias úteis)</span>
            <input className={campo} inputMode="numeric" value={f.freteFixoPrazo} onChange={num('freteFixoPrazo')} />
          </label>
        </div>

        <label className="mt-4 flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={f.retiradaAtiva}
            onChange={(e) => setF((x) => ({ ...x, retiradaAtiva: e.target.checked }))}
            className="accent-foreground"
          />
          Oferecer &quot;Retirar na loja&quot; (grátis) — Rua das Meninas, 27, Águas Compridas
        </label>

        <label className="mt-4 flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={f.sandbox}
            onChange={(e) => setF((x) => ({ ...x, sandbox: e.target.checked }))}
            className="accent-foreground"
          />
          Usar ambiente de testes (sandbox) do Melhor Envio
        </label>

        <div className="mt-5 flex flex-wrap items-end gap-3">
          <button
            type="button"
            className={botao}
            disabled={ocupado}
            onClick={async () => {
              setOcupado(true);
              const r = await salvarMelhorEnvio(f);
              setRes(r);
              if (r.ok) setF((x) => ({ ...x, token: '' }));
              setOcupado(false);
            }}
          >
            {ocupado ? <Loader2 className="size-4 animate-spin" /> : null} Salvar
          </button>
          <label>
            <span className="text-[11px] text-muted-foreground">CEP para teste</span>
            <input className={`${campo} w-36`} value={cepTeste} onChange={(e) => setCepTeste(e.target.value)} />
          </label>
          <button
            type="button"
            className={botaoSec}
            disabled={ocupado}
            onClick={async () => {
              setOcupado(true);
              const r = await testarFrete(cepTeste);
              setRes(r);
              setDetalhes(r.detalhes ?? []);
              setOcupado(false);
            }}
          >
            Testar cotação
          </button>
        </div>
        <Resultado r={res} />
        {detalhes.length ? (
          <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
            {detalhes.map((d) => (
              <li key={d}>• {d}</li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  );
}
