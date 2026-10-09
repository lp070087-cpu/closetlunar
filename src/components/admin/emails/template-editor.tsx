'use client';

import { Check, Palette, X } from 'lucide-react';
import { Input, Textarea } from '@/components/ui/form';
import type { EmailTemplate } from '@/lib/emails/types';

/**
 * O EDITOR DE UM MODELO — o painel que abre ao clicar na paleta.
 *
 * ================== ELE NÃO ESTÁ EM PRINT NENHUM ==================
 *
 * O print adm-072 termina nos seis cards; nenhuma captura abre a edição. O
 * editor existe no código original (`EmailsAdmin`), com a estrutura abaixo:
 * assunto, corpo HTML em mono, o checkbox `Template Ativado`, e os botões
 * `Cancelar` / `Salvar Alterações`. Como o PRINT é a referência e ele não mostra
 * esta tela, quem manda é o ORIGINAL — e a estrutura dele é a que está aqui.
 *
 * ================== O QUE O PRINT MANDA, MESMO SEM EDITOR ==================
 *
 * O botão da paleta está nos seis cards, então a edição PRECISA existir — um
 * botão que não abre nada seria pior que um editor sem print. E o `Corpo HTML`
 * só faz sentido como texto: é HTML de e-mail com estilo embutido, não um
 * formulário de campos. Por isso a `Textarea` em `font-mono`, como no original.
 *
 * ================== A ESCRITA AINDA NÃO GRAVA ==================
 *
 * `Salvar Alterações` chama a escrita, que devolve `persisted: false` e um aviso.
 * A tela mostra o aviso em vez de dizer "salvo" — o mesmo comportamento do
 * WhatsApp e do resto do painel enquanto o Neon não está ligado.
 */
export function TemplateEditor({
  template,
  onChange,
  onCancel,
  onSave,
  saving,
  aviso,
}: {
  template: EmailTemplate;
  onChange: (patch: Partial<EmailTemplate>) => void;
  onCancel: () => void;
  onSave: () => void;
  saving: boolean;
  /** O aviso do salvamento — `null` enquanto nenhum foi tentado. */
  aviso: string | null;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-accent/30 bg-background shadow-elegant">
      <div className="flex items-center justify-between border-b border-accent/10 bg-accent/5 px-6 py-4">
        <h3 className="flex items-center gap-2 font-bold">
          <Palette className="size-4 text-accent" aria-hidden />
          Editando Template: {template.title}
        </h3>
        <button
          type="button"
          onClick={onCancel}
          aria-label="Fechar o editor"
          className="focus-ring rounded-lg p-1 transition-colors hover:bg-secondary"
        >
          <X className="size-4" aria-hidden />
        </button>
      </div>

      <div className="space-y-4 p-6">
        <div className="grid gap-1.5">
          <label htmlFor="tpl-assunto" className="label-caps">
            Assunto do E-mail
          </label>
          <Input
            id="tpl-assunto"
            value={template.subject}
            onChange={(event) => onChange({ subject: event.target.value })}
          />
        </div>

        <div className="grid gap-1.5">
          <label htmlFor="tpl-corpo" className="label-caps">
            Corpo HTML (Identity Closet Lunar)
          </label>
          <Textarea
            id="tpl-corpo"
            rows={12}
            value={template.bodyHtml}
            onChange={(event) => onChange({ bodyHtml: event.target.value })}
            className="font-mono text-xs"
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="tpl-active"
            checked={template.active}
            onChange={(event) => onChange({ active: event.target.checked })}
            className="focus-ring size-4 rounded border-border accent-foreground"
          />
          <label htmlFor="tpl-active" className="text-sm font-medium">
            Template Ativado
          </label>
        </div>

        <div className="flex flex-col items-end gap-3 pt-4">
          {aviso ? (
            <p role="status" className="text-xs text-warning">
              {aviso}
            </p>
          ) : null}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="focus-ring rounded-xl border border-border px-6 py-3 text-sm font-bold transition-colors hover:bg-secondary"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={onSave}
              disabled={saving}
              className="focus-ring inline-flex items-center gap-2 rounded-xl bg-foreground px-6 py-3 text-sm font-bold text-background transition-transform hover:scale-[1.02] active:scale-95 disabled:opacity-50"
            >
              <Check className="size-4" aria-hidden />
              Salvar Alterações
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
