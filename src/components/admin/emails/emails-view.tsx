'use client';

import { useEffect, useState } from 'react';
import { Mail } from 'lucide-react';
import { SectionHeader } from '@/components/ui/card';
import { getIdentity, listEmailLogs, listTemplates, saveTemplate } from '@/lib/emails/data';
import type { EmailIdentity, EmailLog, EmailTemplate } from '@/lib/emails/types';
import { IdentityPanel } from './identity-panel';
import { TemplateEditor } from './template-editor';
import { TemplateList } from './template-list';

/**
 * A tela de E-mails (`/admin/emails`).
 *
 * ================== adm-072 E adm-073 SÃO A MESMA PÁGINA ==================
 *
 * As duas capturas mostram a MESMA tela: adm-072 é o topo (a lista começa em
 * `Cart Recovery` e vai até `Payment Approved` cortado) e adm-073 é a mesma tela
 * rolada, com `Welcome` aparecendo no fim. NÃO há uma segunda tela — o placeholder
 * registrava `adm-072 e adm-073` como se fossem duas páginas e inventava uma
 * "Edição" separada. É UMA página, e a "edição" é o painel que abre ao clicar na
 * paleta de um card.
 *
 * ================== A COLUNA DA ESQUERDA É LARGA, A DA DIREITA É ESTREITA ==================
 *
 * O grid é `lg:grid-cols-3` com a esquerda em `lg:col-span-2` — os seis cards
 * ocupam dois terços e o painel escuro um terço, como no print. As alturas não se
 * equilibram: a esquerda é muito mais alta, e é o que o print mostra (a direita
 * termina bem antes).
 *
 * ================== O EDITOR ABRE ABAIXO DA LISTA ==================
 *
 * Clicar na paleta de um card abre o editor logo abaixo, dentro do MESMO painel
 * `Templates de E-mail` — o original faz assim. Um modelo por vez (`editing`), e
 * o card aberto fica marcado.
 */
export function EmailsView() {
  const [templates, setTemplates] = useState<EmailTemplate[] | null>(null);
  const [identity, setIdentity] = useState<EmailIdentity | null>(null);
  const [logs, setLogs] = useState<EmailLog[] | null>(null);
  const [editing, setEditing] = useState<EmailTemplate | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);

  useEffect(() => {
    let ativo = true;
    Promise.all([listTemplates(), getIdentity(), listEmailLogs()]).then(([t, i, l]) => {
      if (!ativo) return;
      setTemplates(t.data);
      setIdentity(i.data);
      setLogs(l.data);
    });
    return () => {
      ativo = false;
    };
  }, []);

  function abrirEditor(template: EmailTemplate) {
    setEditing({ ...template });
    setAviso(null);
  }

  function editar(patch: Partial<EmailTemplate>) {
    setEditing((atual) => (atual ? { ...atual, ...patch } : atual));
    setAviso(null);
  }

  async function salvar() {
    if (!editing) return;
    setSalvando(true);
    const resultado = await saveTemplate(editing);
    setSalvando(false);
    setAviso(
      resultado.persisted
        ? 'Template atualizado!'
        : 'O template não foi gravado: o banco (Neon) ainda não está conectado.',
    );
  }

  const carregando = templates === null || identity === null || logs === null;

  return (
    <div className="space-y-8">
      <SectionHeader
        title="E-mails Transacionais"
        description="Gerencie a comunicação automática da Closet Lunar"
        action={
          <span className="flex items-center gap-2 rounded-full border border-border bg-secondary px-4 py-2">
            <Mail className="size-4 text-accent" aria-hidden />
            <span className="text-xs font-medium">Servidor de E-mail: Ativo</span>
          </span>
        }
      />

      {carregando ? (
        <p className="text-sm text-muted-foreground">Carregando e-mails...</p>
      ) : (
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <h3 className="font-serif text-2xl">Templates de E-mail</h3>

            <TemplateList
              templates={templates}
              onEdit={abrirEditor}
              editingId={editing ? editing.id : null}
            />

            {editing ? (
              <TemplateEditor
                template={editing}
                onChange={editar}
                onCancel={() => setEditing(null)}
                onSave={salvar}
                saving={salvando}
                aviso={aviso}
              />
            ) : null}
          </div>

          <IdentityPanel identity={identity} logs={logs} />
        </div>
      )}
    </div>
  );
}
