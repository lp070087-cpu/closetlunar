'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox, Field, FieldGrid, Input } from '@/components/ui/form';
import { providerLabel, SHIPPING_PROVIDERS } from '@/lib/configuracoes/metrics';
import type {
  ConnectionInfo,
  MelhorEnvioConfig,
  ShippingProvider,
} from '@/lib/configuracoes/types';

/** O lugar onde a loja registra o callback — o endereço que o print mostra. */
export const CALLBACK_URL = 'https://closetlunar.lovable.app/api/melhor-envio/callback';

/**
 * A seção de transportadoras — as DUAS abas `MELHOR ENVIO` (adm-143/144) e
 * `INTEGRAÇÃO TRANSPORTADORAS` (adm-212) desenham exatamente isto.
 *
 * ================== AS DUAS ABAS MOSTRAM A MESMA COISA, E ISSO É O PRINT ==================
 *
 * Comparadas lado a lado, adm-144 e adm-212 têm a MESMA fileira de chips
 * (`MELHOR ENVIO` ativo, `CORREIOS (EM BREVE)`, `JADLOG (EM BREVE)`, `AZUL CARGO
 * (EM BREVE)`, `LOGGI (EM BREVE)`, `TOTAL EXPRESS (EM BREVE)`) e o MESMO cartão
 * `Melhor Envio` embaixo. A única diferença é qual das QUATRO pílulas do topo está
 * preta (`MELHOR ENVIO` numa, `INTEGRAÇÃO TRANSPORTADORAS` na outra).
 *
 * Por isso este componente serve às duas: a aba só decide o título da seção, o
 * conteúdo é o mesmo. Inventar um conteúdo diferente para `Integração` seria
 * inventar uma tela que nenhum print mostra.
 *
 * ================== OS CINCO `(EM BREVE)` SÃO CHIPS DESABILITADOS ==================
 *
 * O print escreve o sufixo no próprio rótulo e apaga o texto. Só o Melhor Envio é
 * clicável; os outros cinco não trocam nada — `providerLabel` junta o sufixo e o
 * `disabled` do botão os deixa apagados.
 */
export function ShippingSection({
  config,
  connection,
  saving,
  aviso,
  onSave,
  onDisconnect,
  onTest,
}: {
  config: MelhorEnvioConfig;
  connection: ConnectionInfo;
  saving: boolean;
  aviso: string | null;
  onSave: (config: MelhorEnvioConfig) => void;
  onDisconnect: () => void;
  onTest: (destino: string) => void;
}) {
  const [form, setForm] = useState<MelhorEnvioConfig>(config);
  const [provider, setProvider] = useState<ShippingProvider>('melhor_envio');
  const [destino, setDestino] = useState('');

  useEffect(() => {
    setForm(config);
  }, [config]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {SHIPPING_PROVIDERS.map((item) => {
          const ativo = item.available && item.value === provider;
          return (
            <button
              key={item.value}
              type="button"
              disabled={!item.available}
              onClick={() => setProvider(item.value)}
              className={
                ativo
                  ? 'focus-ring rounded-full bg-foreground px-4 py-2 text-[11px] font-bold uppercase tracking-[0.14em] text-background'
                  : item.available
                    ? 'focus-ring rounded-full border border-border bg-background px-4 py-2 text-[11px] font-bold uppercase tracking-[0.14em]'
                    : 'cursor-not-allowed rounded-full px-4 py-2 text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground/50'
              }
            >
              {providerLabel(item.label, item.available)}
            </button>
          );
        })}
      </div>

      {aviso ? (
        <p role="status" className="text-xs text-warning">
          {aviso}
        </p>
      ) : null}

      <div className="rounded-2xl border border-border bg-background p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold">Melhor Envio</h3>
            <p className="text-xs text-muted-foreground">
              Credenciais, remetente e conexão OAuth oficial.
            </p>
          </div>
          <div className="flex items-center gap-5">
            <Checkbox
              checked={form.sandbox}
              onChange={(event) => setForm({ ...form, sandbox: event.target.checked })}
              label="Sandbox"
            />
            <Checkbox
              checked={form.active}
              onChange={(event) => setForm({ ...form, active: event.target.checked })}
              label="Ativo"
            />
          </div>
        </div>

        {connection.status === 'ok' ? (
          <div className="mt-4 rounded-xl border border-success-foreground/20 bg-success-surface px-4 py-3">
            <p className="text-xs">
              <span className="mr-1.5 inline-block size-2 -translate-y-px rounded-full bg-success" />
              <span className="font-bold text-success-foreground">Melhor Envio conectado</span>
              <span className="text-muted-foreground">
                {' · '}
                {connection.accountName} · {connection.accountEmail} · desde{' '}
                {connection.connectedAt}
              </span>
            </p>
            <button
              type="button"
              onClick={onDisconnect}
              className="focus-ring mt-1 rounded text-xs font-bold text-success-foreground underline underline-offset-4"
            >
              Desconectar
            </button>
          </div>
        ) : (
          <div className="mt-4 rounded-xl border border-border bg-secondary/40 px-4 py-3">
            <p className="text-xs font-bold">Melhor Envio não conectado</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Conecte a conta para calcular frete no checkout.
            </p>
          </div>
        )}

        <div className="mt-5">
          <FieldGrid columns={2}>
            <Field label="Client ID">
              <Input
                value={form.clientId}
                onChange={(event) => setForm({ ...form, clientId: event.target.value })}
                placeholder="00000"
              />
            </Field>
            <Field label="Client Secret">
              <Input
                type="password"
                value={form.clientSecret}
                onChange={(event) => setForm({ ...form, clientSecret: event.target.value })}
                placeholder="••••••••"
              />
            </Field>
          </FieldGrid>
        </div>

        <div className="mt-5">
          <FieldGrid columns={2}>
            <Field label="CEP de origem">
              <Input
                value={form.originCep}
                onChange={(event) => setForm({ ...form, originCep: event.target.value })}
                placeholder="00000000"
              />
            </Field>
            <Field label="Nome do remetente">
              <Input
                value={form.senderName}
                onChange={(event) => setForm({ ...form, senderName: event.target.value })}
                placeholder="Closet Lunar"
              />
            </Field>
          </FieldGrid>
        </div>

        <div className="mt-5">
          <FieldGrid columns={2}>
            <Field label="Documento (CPF/CNPJ)">
              <Input
                value={form.document}
                onChange={(event) => setForm({ ...form, document: event.target.value })}
                placeholder="000.000.000-00"
              />
            </Field>
            <Field label="Telefone">
              <Input
                value={form.phone}
                onChange={(event) => setForm({ ...form, phone: event.target.value })}
                placeholder="(81) 90000-0000"
              />
            </Field>
          </FieldGrid>
        </div>

        <div className="mt-5">
          <Field label="Endereço de origem">
            <Input
              value={form.originAddress}
              onChange={(event) => setForm({ ...form, originAddress: event.target.value })}
              placeholder="Rua, número, bairro"
            />
          </Field>
        </div>

        <div className="mt-5 border-t border-border pt-4">
          <p className="text-[11px] text-muted-foreground">
            Callback URL (registre exatamente esta no Melhor Envio):
          </p>
          <code className="mt-1 block break-all text-[11px] text-muted-foreground">
            {CALLBACK_URL}
          </code>
        </div>

        <div className="mt-5 border-t border-border pt-4">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
            Testar frete
          </p>
          <div className="mt-2 flex flex-wrap items-end gap-3">
            <Field label="CEP de destino" className="min-w-[16rem] flex-1">
              <Input
                value={destino}
                onChange={(event) => setDestino(event.target.value)}
                placeholder="00000-000"
              />
            </Field>
            <Button variant="outline" onClick={() => onTest(destino)}>
              Testar Frete
            </Button>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-end gap-2 border-t border-border pt-4">
          <Button variant="outline" onClick={() => onTest('')}>
            Atualizar Token
          </Button>
          <Button variant="outline" onClick={() => onTest('')}>
            Testar Conexão
          </Button>
          <Button variant="outline" onClick={() => onTest('')}>
            Conectar Melhor Envio
          </Button>
          <Button
            variant="primary"
            disabled={saving}
            onClick={() => onSave(form)}
          >
            {saving ? 'Salvando…' : 'Salvar Configurações'}
          </Button>
        </div>
      </div>
    </div>
  );
}
