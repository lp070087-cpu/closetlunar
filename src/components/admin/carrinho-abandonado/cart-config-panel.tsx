'use client';

import { useState } from 'react';
import { AlertTriangle, Check } from 'lucide-react';
import type { CartConfig } from '@/lib/carrinho-abandonado/types';
import { saveCartConfig } from '@/lib/carrinho-abandonado/data';

/**
 * O painel `Configuracoes` de adm-009.
 *
 * OS QUATRO DISPAROS, O CUPOM, O FRETE E O BOTAO DE SALVAR.
 *
 * ESTE E O UNICO COMPONENTE DO PAINEL COM ESTADO DE ESCRITA, porque esta e a
 * unica tela cujo print mostra um botao que grava (`SALVAR CONFIGURACOES`).
 *
 * O BOTAO NAO MENTE. Ao salvar, a tela chama `saveCartConfig`, que devolve
 * `persisted: false` enquanto nao ha banco. A resposta NAO e um "Salvo!" verde:
 * e um aviso ambar dizendo que as configuracoes valem so nesta sessao e somem ao
 * recarregar. Fingir a gravacao seria o defeito mais facil de cometer aqui — o
 * botao existe, o usuario clica, e a confirmacao falsa passa despercebida ate o
 * dia em que a configuracao realmente se perde.
 *
 * O ESTADO LOCAL NASCE DA CONFIGURACAO CARREGADA. O componente recebe `initial`
 * e copia para `draft` uma vez; dali em diante quem manda no formulario e o
 * `draft`. Sem isso, o primeiro clique num checkbox nao apareceria, porque o
 * valor viria de uma prop que a tela nao pode mudar.
 *
 * O `key` DO COMPONENTE NA TELA e o que reinicia o rascunho quando os dados
 * chegam: o `draft` e copiado na montagem, e o componente so monta depois que a
 * leitura terminou. Ver `cart-view.tsx`.
 */
export function CartConfigPanel({ initial }: { initial: CartConfig }) {
  const [draft, setDraft] = useState<CartConfig>(initial);
  const [saving, setSaving] = useState(false);
  const [outcome, setOutcome] = useState<'none' | 'unsaved'>('none');

  async function handleSave() {
    setSaving(true);
    const result = await saveCartConfig(draft);
    setSaving(false);
    // O resultado vem SEMPRE com `persisted: false` nesta fase. O ramo existe
    // para o dia do Neon: quando a camada de dados gravar de verdade, e so ele
    // que muda de valor, e a tela ja trata os dois casos.
    setOutcome(result.persisted ? 'none' : 'unsaved');
  }

  function toggleDelay(key: string) {
    setDraft((current) => ({
      ...current,
      delays: current.delays.map((delay) =>
        delay.key === key ? { ...delay, active: !delay.active } : delay,
      ),
    }));
    setOutcome('none');
  }

  function editTemplate(key: string, template: string) {
    setDraft((current) => ({
      ...current,
      delays: current.delays.map((delay) =>
        delay.key === key ? { ...delay, template } : delay,
      ),
    }));
    setOutcome('none');
  }

  return (
    <div className="surface space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h3 className="font-serif text-lg">Configurações</h3>
        <label className="flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            checked={draft.isActive}
            onChange={(event) => {
              setDraft((current) => ({ ...current, isActive: event.target.checked }));
              setOutcome('none');
            }}
            className="size-4 accent-accent"
          />
          <span className="text-sm font-medium">Ativo</span>
        </label>
      </div>

      <div className="space-y-4">
        {draft.delays.map((delay) => (
          <div key={delay.key} className="space-y-3 rounded-2xl border border-border/70 p-3">
            <label className="flex cursor-pointer items-center justify-between text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">
              <span>{delay.label}</span>
              <input
                type="checkbox"
                checked={delay.active}
                onChange={() => toggleDelay(delay.key)}
                className="size-4 accent-accent"
              />
            </label>
            <textarea
              value={delay.template}
              onChange={(event) => editTemplate(delay.key, event.target.value)}
              rows={3}
              aria-label={`Mensagem de ${delay.label}`}
              className="focus-ring w-full rounded-xl border border-border/70 bg-secondary/20 p-2 text-xs"
            />
          </div>
        ))}
      </div>

      <div className="space-y-4 border-t border-border/60 pt-4">
        <label className="block space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
            Cupom Automático
          </span>
          <input
            value={draft.couponToSend}
            onChange={(event) => {
              setDraft((current) => ({ ...current, couponToSend: event.target.value }));
              setOutcome('none');
            }}
            placeholder="EX: VOLTA10"
            className="focus-ring w-full rounded-xl border border-border/70 bg-background px-3 py-2 text-sm uppercase"
          />
        </label>

        <label className="flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            checked={draft.freeShippingIncentive}
            onChange={(event) => {
              setDraft((current) => ({ ...current, freeShippingIncentive: event.target.checked }));
              setOutcome('none');
            }}
            className="size-4 accent-accent"
          />
          <span className="text-sm">Incentivo de Frete Grátis</span>
        </label>
      </div>

      {outcome === 'unsaved' ? (
        <div
          role="status"
          className="flex items-start gap-3 rounded-2xl border border-warning/40 bg-warning-surface/50 p-3 text-xs"
        >
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning-foreground" aria-hidden />
          <p className="text-warning-foreground">
            Configurações aplicadas apenas nesta sessão. A gravação no banco entra na fase
            de integração com o Neon — ao recarregar a página, os valores voltam ao padrão.
          </p>
        </div>
      ) : null}

      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="focus-ring inline-flex w-full items-center justify-center gap-2 rounded-full bg-foreground py-3 text-xs font-bold uppercase tracking-[0.16em] text-background transition-opacity disabled:opacity-50"
      >
        {saving ? 'Salvando...' : 'Salvar Configurações'}
      </button>
    </div>
  );
}
