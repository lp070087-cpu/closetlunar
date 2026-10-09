'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox, Field, FieldGrid, Input } from '@/components/ui/form';
import type { PaymentConfig } from '@/lib/configuracoes/types';

/** O endereço que a loja cola no painel da InfinitePay. */
export const WEBHOOK_URL = 'https://closetlunar.lovable.app/api/public/infinitepay/webhook';

/**
 * A aba `PAGAMENTOS` — adm-223.
 *
 * ================== O CARTÃO É ESTREITO, E ISSO É O PRINT ==================
 *
 * Enquanto `Entrega própria` e `Integração` ocupam a largura toda, o cartão da
 * InfinitePay para na metade. O print mostra o campo `CLIENT ID` começando no meio
 * da tela e a coluna da direita vazia — é `max-w-2xl`, não um grid de duas colunas
 * de largura cheia.
 *
 * ================== O QUE O PRINT MOSTRA E O QUE ELE NÃO MOSTRA ==================
 *
 * Mostra: os quatro campos (`API KEY / TOKEN`, `CLIENT ID`, `CLIENT SECRET`,
 * `WEBHOOK SECRET`), o par de checkboxes (`Modo teste (sandbox)` MARCADO, `Ativo no
 * checkout` desmarcado), o bloco `WEBHOOK URL` com o endereço e a instrução de
 * colar no painel, e os dois botões `SALVAR CONFIGURAÇÕES` e `TESTAR CONEXÃO`.
 *
 * NÃO mostra: nenhum campo preenchido. Todos os quatro estão em branco em adm-223 —
 * por isso a demonstração também vem vazia, e não há segredo nenhum para inventar.
 *
 * Os rótulos dos botões vêm em CAIXA ALTA no print, mas é `text-transform` do CSS
 * (`Button` já sobe a caixa das variantes `primary`/`outline`) — o texto aqui vai
 * em caixa normal, como em todos os outros botões do painel.
 */
export function PaymentsTab({
  config,
  saving,
  aviso,
  onSave,
  onTest,
}: {
  config: PaymentConfig;
  saving: boolean;
  aviso: string | null;
  onSave: (config: PaymentConfig) => void;
  onTest: () => void;
}) {
  const [form, setForm] = useState<PaymentConfig>(config);

  useEffect(() => {
    setForm(config);
  }, [config]);

  return (
    <div className="max-w-2xl">
      <div className="rounded-2xl border border-border bg-background p-5">
        <h3 className="text-sm font-bold">InfinitePay</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Configure as credenciais para receber PIX e cartão na loja.
        </p>

        <div className="mt-5">
          <FieldGrid columns={2}>
            <Field label="API Key / Token">
              <Input
                type="password"
                value={form.apiKey}
                onChange={(event) => setForm({ ...form, apiKey: event.target.value })}
                placeholder="••••••••"
              />
            </Field>
            <Field label="Client ID">
              <Input
                value={form.clientId}
                onChange={(event) => setForm({ ...form, clientId: event.target.value })}
                placeholder="00000"
              />
            </Field>
          </FieldGrid>
        </div>

        <div className="mt-5">
          <FieldGrid columns={2}>
            <Field label="Client Secret">
              <Input
                type="password"
                value={form.clientSecret}
                onChange={(event) => setForm({ ...form, clientSecret: event.target.value })}
                placeholder="••••••••"
              />
            </Field>
            <Field label="Webhook Secret">
              <Input
                type="password"
                value={form.webhookSecret}
                onChange={(event) => setForm({ ...form, webhookSecret: event.target.value })}
                placeholder="••••••••"
              />
            </Field>
          </FieldGrid>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-6">
          <Checkbox
            checked={form.sandbox}
            onChange={(event) => setForm({ ...form, sandbox: event.target.checked })}
            label="Modo teste (sandbox)"
          />
          <Checkbox
            checked={form.isActive}
            onChange={(event) => setForm({ ...form, isActive: event.target.checked })}
            label="Ativo no checkout"
          />
        </div>

        <div className="mt-5 rounded-xl border border-border bg-secondary/30 px-4 py-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
            Webhook URL
          </p>
          <code className="mt-1 block break-all text-xs">{WEBHOOK_URL}</code>
          <p className="mt-1.5 text-[11px] text-muted-foreground">
            Cole esta URL no painel InfinitePay (notificações/webhooks).
          </p>
        </div>

        {aviso ? (
          <p role="status" className="mt-4 text-xs text-warning">
            {aviso}
          </p>
        ) : null}

        <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-border pt-4">
          <Button variant="primary" disabled={saving} onClick={() => onSave(form)}>
            {saving ? 'Salvando…' : 'Salvar configurações'}
          </Button>
          <Button variant="outline" onClick={onTest}>
            Testar conexão
          </Button>
        </div>
      </div>
    </div>
  );
}
