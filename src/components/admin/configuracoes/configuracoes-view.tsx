'use client';

import { useEffect, useState } from 'react';
import { SectionHeader } from '@/components/ui/card';
import {
  applyPriceChange,
  removeCity,
  removeZone,
  toggleZoneActive,
  upsertZone,
  zoneFromDraft,
} from '@/lib/configuracoes/metrics';
import {
  getConnection,
  getMelhorEnvio,
  getPayments,
  listDeliveryZones,
  saveMelhorEnvio,
  savePayments,
  saveZonePrices,
} from '@/lib/configuracoes/data';
import type {
  ConfigTab,
  ConnectionInfo,
  DeliveryZone,
  MelhorEnvioConfig,
  PaymentConfig,
  ZoneDraft,
} from '@/lib/configuracoes/types';
import { ConfiguracoesTabs } from './configuracoes-tabs';
import { ShippingSection } from './melhor-envio-tab';
import { OwnDeliveryTab } from './own-delivery-tab';
import { PaymentsTab } from './payments-tab';
import { ZoneForm, draftFromZone, draftNewCity } from './zone-form';

/**
 * A tela de Configurações (`/admin/configuracoes`) — adm-075 a adm-083.
 *
 * ================== UM ESTADO POR RECURSO, CARREGADOS JUNTOS ==================
 *
 * `zones`, `melhorEnvio`, `connection` e `payments` vêm do `data.ts` num único
 * efeito. Como tudo é demonstração local, não há espera real; mas a tela passa
 * pelo MESMO caminho assíncrono que o Neon vai usar, para que a troca de camada
 * não mude nada aqui.
 *
 * ================== A ESCRITA NÃO PERSISTE — E A TELA DIZ ISSO ==================
 *
 * Cada gravação devolve `persisted: false`. O `aviso` mostra o `reason` do
 * envelope (o "Neon ainda não conectado") em vez de fingir que salvou. A lista em
 * memória continua mudando, para a tela responder ao clique; o que ela não faz é
 * alegar persistência.
 *
 * ================== O `id` NOVO VEM DAQUI, NÃO DO `metrics` ==================
 *
 * `zoneFromDraft` é pura e não pode sortear id. Quem sorteia é este componente,
 * com um contador que só cresce. Assim dois bairros adicionados na mesma sessão
 * nunca colidem, e nada em `metrics` deixa de ser puro.
 */
export function ConfiguracoesView() {
  const [aba, setAba] = useState<ConfigTab>('entrega_propria');

  const [zones, setZones] = useState<DeliveryZone[] | null>(null);
  const [melhorEnvio, setMelhorEnvio] = useState<MelhorEnvioConfig | null>(null);
  const [connection, setConnection] = useState<ConnectionInfo | null>(null);
  const [payments, setPayments] = useState<PaymentConfig | null>(null);

  const [salvando, setSalvando] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);

  const [draft, setDraft] = useState<ZoneDraft | null>(null);
  const [formAberto, setFormAberto] = useState(false);
  const [proximoId, setProximoId] = useState(1);

  useEffect(() => {
    let vivo = true;
    Promise.all([listDeliveryZones(), getMelhorEnvio(), getConnection(), getPayments()]).then(
      ([z, m, c, p]) => {
        if (!vivo) return;
        setZones(z.data);
        setMelhorEnvio(m.data);
        setConnection(c.data);
        setPayments(p.data);
      },
    );
    return () => {
      vivo = false;
    };
  }, []);

  function abrirCriacao(city = '', state = '') {
    setDraft(draftNewCity(city, state));
    setFormAberto(true);
  }

  function abrirEdicao(zona: DeliveryZone) {
    setDraft(draftFromZone(zona));
    setFormAberto(true);
  }

  function fecharForm() {
    setFormAberto(false);
    setDraft(null);
  }

  function salvarZona(d: ZoneDraft) {
    const id = `novo-${proximoId}`;
    setProximoId((n) => n + 1);
    const zona = zoneFromDraft(d, id);
    setZones((atual) => (atual ? upsertZone(atual, zona) : atual));
    fecharForm();
    setAviso('Alteração aplicada em memória. O banco ainda não está conectado.');
  }

  function salvarPrecos(precos: { id: string; price: number }[]) {
    setSalvando(true);
    saveZonePrices(precos).then((res) => {
      setZones((atual) => {
        if (!atual) return atual;
        return precos.reduce((lista, p) => applyPriceChange(lista, p.id, p.price), atual);
      });
      setSalvando(false);
      setAviso(res.reason);
    });
  }

  function salvarMelhorEnvio(config: MelhorEnvioConfig) {
    setSalvando(true);
    saveMelhorEnvio(config).then((res) => {
      setMelhorEnvio(res.data);
      setSalvando(false);
      setAviso(res.reason);
    });
  }

  function salvarPagamentos(config: PaymentConfig) {
    setSalvando(true);
    savePayments(config).then((res) => {
      setPayments(res.data);
      setSalvando(false);
      setAviso(res.reason);
    });
  }

  /**
   * O `Testar conexão` e o `Testar frete` NÃO fazem chamada de rede — não há
   * credencial real nem servidor de frete. O que eles fazem é devolver o mesmo
   * aviso de indisponibilidade, para não fabricar um resultado falso.
   */
  function avisarNaoConectado() {
    setAviso(
      'Teste indisponível: a integração real ainda não está conectada. Nada foi chamado.',
    );
  }

  const carregando = zones === null || melhorEnvio === null || connection === null || payments === null;

  return (
    <div className="space-y-6">
      <SectionHeader title="Configurações" description="Preferências gerais da loja." />

      <ConfiguracoesTabs value={aba} onChange={setAba} />

      {carregando ? (
        <p className="surface p-10 text-center text-sm text-muted-foreground">Carregando…</p>
      ) : aba === 'entrega_propria' ? (
        <OwnDeliveryTab
          zones={zones}
          onChangePrice={(id, price) =>
            setZones((atual) => (atual ? applyPriceChange(atual, id, price) : atual))
          }
          onSave={salvarPrecos}
          saving={salvando}
          aviso={aviso}
          onAddCity={() => abrirCriacao()}
          onAddNeighborhood={(city, state) => abrirCriacao(city, state)}
          onEdit={abrirEdicao}
          onToggleActive={(zona) =>
            setZones((atual) => (atual ? toggleZoneActive(atual, zona.id) : atual))
          }
          onRemoveZone={(zona) =>
            setZones((atual) => (atual ? removeZone(atual, zona.id) : atual))
          }
          onRemoveCity={(state, city) =>
            setZones((atual) => (atual ? removeCity(atual, state, city) : atual))
          }
        />
      ) : aba === 'melhor_envio' || aba === 'integracao' ? (
        <ShippingSection
          config={melhorEnvio}
          connection={connection}
          saving={salvando}
          aviso={aviso}
          onSave={salvarMelhorEnvio}
          onDisconnect={() =>
            setConnection({ ...connection, status: 'off', accountName: '', accountEmail: '', connectedAt: '' })
          }
          onTest={avisarNaoConectado}
        />
      ) : (
        <PaymentsTab
          config={payments}
          saving={salvando}
          aviso={aviso}
          onSave={salvarPagamentos}
          onTest={avisarNaoConectado}
        />
      )}

      <ZoneForm
        draft={draft}
        open={formAberto}
        saving={salvando}
        onClose={fecharForm}
        onSave={salvarZona}
      />
    </div>
  );
}
