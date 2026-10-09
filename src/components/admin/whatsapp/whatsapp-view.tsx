'use client';

import { useEffect, useState } from 'react';
import { SectionHeader } from '@/components/ui/card';
import { getConfig, listTickets, saveConfig } from '@/lib/whatsapp/data';
import type { Ticket, WhatsAppConfig } from '@/lib/whatsapp/types';
import { ConfigTab } from './config-tab';
import { TicketsTab } from './tickets-tab';
import { WhatsAppTabs, type WhatsAppTab } from './whatsapp-tabs';

/**
 * A tela de WhatsApp (`/admin/whatsapp`).
 *
 * ================== A FAIXA DE ABAS É UM SEGMENTADO, NÃO PÍLULAS SOLTAS ==================
 *
 * No print adm-069, `Atendimentos` e `Configurações` vivem DENTRO de uma faixa
 * única com borda (`Atendimentos` preenchido de preto, `Configurações` sem borda
 * própria) — é o `SegmentedTabs` do painel. É DIFERENTE das pílulas de status da
 * tabela, que têm borda cada uma e espaço entre elas (`PillTabs`). Dois
 * componentes de aba no mesmo módulo, cada um pelo desenho do print.
 *
 * ================== O TÍTULO TRAZ A DESCRIÇÃO AO LADO ==================
 *
 * `WhatsApp Inteligente` com `Configure seu vendedor virtual e mensagens
 * automáticas` embaixo — o par do `SectionHeader`. A faixa de abas fica na mesma
 * linha, à direita (`action`), como no print.
 *
 * ================== A ABA `tickets` NÃO GRAVA, E ISSO ESTÁ DITO NA TELA ==================
 *
 * A configuração carrega junto com os atendimentos, mesmo com a aba `tickets`
 * ativa — são duas leituras baratas e a aba `config` já abre pronta. O aviso de
 * salvamento vive aqui, no topo do estado, e desce para a aba: a aba não precisa
 * saber que o banco não está ligado, ela só mostra o que recebe.
 */
export function WhatsAppView() {
  const [tab, setTab] = useState<WhatsAppTab>('tickets');
  const [tickets, setTickets] = useState<Ticket[] | null>(null);
  const [config, setConfig] = useState<WhatsAppConfig | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);

  useEffect(() => {
    let ativo = true;
    Promise.all([listTickets(), getConfig()]).then(([t, c]) => {
      if (!ativo) return;
      setTickets(t.data);
      setConfig(c.data);
    });
    return () => {
      ativo = false;
    };
  }, []);

  function editarConfig(patch: Partial<WhatsAppConfig>) {
    setConfig((atual) => (atual ? { ...atual, ...patch } : atual));
    // Any edit invalidates the previous save warning.
    setAviso(null);
  }

  async function salvar() {
    if (!config) return;
    setSalvando(true);
    const resultado = await saveConfig(config);
    setSalvando(false);
    setAviso(
      resultado.persisted
        ? 'Configurações salvas!'
        : 'Configurações não foram gravadas: o banco (Neon) ainda não está conectado.',
    );
  }

  const carregando = tickets === null || config === null;

  return (
    <div className="space-y-6">
      <SectionHeader
        title="WhatsApp Inteligente"
        description="Configure seu vendedor virtual e mensagens automáticas"
        action={<WhatsAppTabs value={tab} onChange={setTab} />}
      />

      {carregando ? (
        <p className="text-sm text-muted-foreground">Carregando...</p>
      ) : tab === 'tickets' ? (
        <TicketsTab tickets={tickets} />
      ) : (
        <ConfigTab
          config={config}
          onChange={editarConfig}
          onSave={salvar}
          saving={salvando}
          aviso={aviso}
        />
      )}
    </div>
  );
}
