'use client';

import { Check, MessageCircle, Settings, Sparkles } from 'lucide-react';
import { Input, Textarea } from '@/components/ui/form';
import { TEMPLATE_LABELS, TEMPLATE_VARIABLES } from '@/lib/whatsapp/metrics';
import type { WhatsAppConfig } from '@/lib/whatsapp/types';

/**
 * A ABA `Configurações` — adm-070 (topo) e adm-071 (o resto).
 *
 * ================== DUAS COLUNAS, NA ORDEM DO PRINT ==================
 *
 *   ESQUERDA   `Configuração Geral` (número + horário) e, abaixo, `Gatilhos de
 *              Mensagem` com os quatro gatilhos.
 *   DIREITA    `Dicas de Conversão` (caixa verde), o card `Vendedor Virtual Ativo`
 *              e o botão `SALVAR CONFIGURAÇÕES`.
 *
 * As alturas não se equilibram — a coluna esquerda é bem mais alta — porque os
 * gatilhos são quatro blocos e a direita tem três peças curtas. É o que o print
 * mostra: a coluna direita termina muito antes.
 *
 * ================== O VERDE DO WHATSAPP É UM TOKEN, NÃO UM HEX SOLTO ==================
 *
 * O original usa `#25D366` cru em cinco lugares (o ícone, a borda da caixa verde,
 * o fundo do botão de dica). Aqui o verde é o `success` da paleta (`#00BC7D`), e o
 * fundo verde-claro é `success-surface` — o mesmo par usado em Relatórios. Um hex
 * escrito na tela não é ajustável com o resto da paleta, e o `#25D366` (da marca
 * do WhatsApp) destoaria do verde de sucesso do painel no mesmo canto de tela.
 *
 * ================== O NÚMERO É EDITÁVEL, O BOTÃO AINDA NÃO GRAVA ==================
 *
 * O campo do número e as quatro caixas de texto são EDITÁVEIS (o estado é local).
 * O botão `SALVAR CONFIGURAÇÕES` chama a escrita, que hoje devolve
 * `persisted: false` e um aviso — não finge gravar. Enquanto o banco não está
 * ligado, a tela diz a verdade.
 */
export function ConfigTab({
  config,
  onChange,
  onSave,
  saving,
  aviso,
}: {
  config: WhatsAppConfig;
  onChange: (patch: Partial<WhatsAppConfig>) => void;
  onSave: () => void;
  saving: boolean;
  /** O aviso do salvamento — `null` enquanto nenhum foi tentado. */
  aviso: string | null;
}) {
  function editarTemplate(key: string, body: string) {
    onChange({
      templates: config.templates.map((template) =>
        template.key === key ? { ...template, body } : template,
      ),
    });
  }

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      {/* ------------------------- coluna esquerda ------------------------- */}
      <div className="space-y-6">
        <section className="surface p-6">
          <h3 className="mb-4 flex items-center gap-2 font-serif text-lg">
            <MessageCircle className="h-5 w-5 text-success" />
            Configuração Geral
          </h3>

          <div className="space-y-4">
            <div className="grid gap-1.5">
              <label htmlFor="wpp-numero" className="label-caps">
                Número do WhatsApp
              </label>
              <Input
                id="wpp-numero"
                value={config.whatsapp}
                onChange={(event) => onChange({ whatsapp: event.target.value })}
                placeholder="Ex: 5551999999999"
              />
              <p className="text-[10px] text-muted-foreground">
                Inclua DDI (55) e DDD. Apenas números.
              </p>
            </div>

            <div className="grid gap-1.5">
              <label htmlFor="wpp-horario" className="label-caps">
                Horário de Atendimento
              </label>
              <Input
                id="wpp-horario"
                value={config.openingHours}
                onChange={(event) => onChange({ openingHours: event.target.value })}
                placeholder="Ex: Seg a Sex: 09h às 18h"
              />
            </div>
          </div>
        </section>

        <section className="surface p-6">
          <h3 className="mb-4 flex items-center gap-2 font-serif text-lg">
            <Settings className="h-5 w-5" />
            Gatilhos de Mensagem
          </h3>

          <div className="space-y-6">
            {config.templates.map((template) => (
              <div key={template.key} className="grid gap-2">
                <div className="flex items-center justify-between gap-3">
                  <label htmlFor={`wpp-${template.key}`} className="label-caps">
                    {TEMPLATE_LABELS[template.key]}
                  </label>
                  {/* A chave crua, em mono — é o identificador que o banco usa. */}
                  <span className="rounded-full bg-secondary px-2 py-0.5 font-mono text-[9px] text-muted-foreground">
                    {template.key}
                  </span>
                </div>

                <Textarea
                  id={`wpp-${template.key}`}
                  value={template.body}
                  onChange={(event) => editarTemplate(template.key, event.target.value)}
                  rows={3}
                />

                {TEMPLATE_VARIABLES[template.key].length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {TEMPLATE_VARIABLES[template.key].map((variavel) => (
                      <span key={variavel} className="font-mono text-[9px] text-accent">
                        {variavel}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* ------------------------- coluna direita ------------------------- */}
      <div className="space-y-6">
        <section className="rounded-3xl border border-success/20 bg-success-surface p-6">
          <h3 className="mb-2 flex items-center gap-2 font-serif text-lg">
            <Sparkles className="h-5 w-5 text-success" />
            Dicas de Conversão
          </h3>
          <ul className="space-y-3 text-sm text-foreground/80">
            <li className="flex gap-2">
              <span className="font-bold text-success">•</span>
              <span>Use gatilhos de urgência como &quot;Últimas peças&quot; ou &quot;Estoque limitado&quot;.</span>
            </li>
            <li className="flex gap-2">
              <span className="font-bold text-success">•</span>
              <span>
                Para carrinhos abandonados, oferecer um cupom exclusivo (ex: VOLTEI5) aumenta a
                conversão em até 30%.
              </span>
            </li>
            <li className="flex gap-2">
              <span className="font-bold text-success">•</span>
              <span>Mantenha o tom da marca: use emojis se fizer parte da identidade da Closet Lunar.</span>
            </li>
          </ul>
        </section>

        <section className="surface flex flex-col items-center gap-4 p-6 text-center">
          <div className="flex size-16 items-center justify-center rounded-full bg-success/10">
            <MessageCircle className="size-8 text-success" />
          </div>
          <div>
            <h4 className="font-bold">Vendedor Virtual Ativo</h4>
            <p className="mt-1 text-xs text-muted-foreground">
              O botão flutuante e os botões de dúvida nos produtos já estão configurados para usar
              essas mensagens.
            </p>
          </div>
        </section>

        <div className="flex flex-col items-end gap-3 pt-4">
          {aviso ? (
            <p role="status" className="text-xs text-warning">
              {aviso}
            </p>
          ) : null}
          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="focus-ring inline-flex items-center gap-2 rounded-xl bg-foreground px-8 py-4 text-xs font-bold uppercase tracking-widest text-background transition-transform hover:scale-[1.02] active:scale-95 disabled:opacity-50"
          >
            <Check className="size-4" />
            Salvar Configurações
          </button>
        </div>
      </div>
    </div>
  );
}
