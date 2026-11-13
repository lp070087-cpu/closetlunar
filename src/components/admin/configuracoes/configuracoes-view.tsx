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
  saveZones,
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
import { InfinitePayConfig, MelhorEnvioConfig as MelhorEnvioPainel } from './integracoes-reais';
import { OwnDeliveryTab } from './own-delivery-tab';
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
  const [erro, setErro] = useState<string | null>(null);

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
    ).catch(() => { if (vivo) setErro('Não foi possível carregar as configurações. Recarregue a página.'); });
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

  function persistir<T extends DeliveryZone[] | null>(lista: T): T {
    if (lista) void saveZones(lista).then((r) => setAviso(r.persisted ? 'Zonas de entrega salvas.' : r.reason ?? 'Não foi possível salvar.'));
    return lista;
  }

  function salvarZona(d: ZoneDraft) {
    const id = `novo-${proximoId}`;
    setProximoId((n) => n + 1);
    const zona = zoneFromDraft(d, id);
    setZones((atual) => {
      const nova = atual ? upsertZone(atual, zona) : atual;
      if (nova) void saveZones(nova).then((r) => setAviso(r.persisted ? 'Zona de entrega salva.' : r.reason ?? 'Não foi possível salvar.'));
      return nova;
    });
    fecharForm();
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
    }).catch(() => { setAviso('Não foi possível salvar. Nenhuma alteração foi confirmada.'); }).finally(() => setSalvando(false));
  }

  function salvarMelhorEnvio(config: MelhorEnvioConfig) {
    setSalvando(true);
    saveMelhorEnvio(config).then((res) => {
      setMelhorEnvio(res.data);
      setSalvando(false);
      setAviso(res.reason);
    }).catch(() => { setAviso('Não foi possível salvar. Nenhuma alteração foi confirmada.'); }).finally(() => setSalvando(false));
  }

  function salvarPagamentos(config: PaymentConfig) {
    setSalvando(true);
    savePayments(config).then((res) => {
      setPayments(res.data);
      setSalvando(false);
      setAviso(res.reason);
    }).catch(() => { setAviso('Não foi possível salvar. Nenhuma alteração foi confirmada.'); }).finally(() => setSalvando(false));
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

      <p className="rounded-xl border border-border bg-secondary/30 p-3 text-xs text-muted-foreground">Pagamentos (InfinitePay) e frete (Melhor Envio) são gravados no banco. A aba Entrega própria ainda é uma prévia local.</p>
      <ConfiguracoesTabs value={aba} onChange={setAba} />

      {erro ? <p role="alert" className="text-sm text-danger">{erro}</p> : carregando ? (
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
            setZones((atual) => persistir(atual ? toggleZoneActive(atual, zona.id) : atual))
          }
          onRemoveZone={(zona) =>
            setZones((atual) => persistir(atual ? removeZone(atual, zona.id) : atual))
          }
          onRemoveCity={(state, city) =>
            setZones((atual) => persistir(atual ? removeCity(atual, state, city) : atual))
          }
        />
      ) : aba === 'melhor_envio' || aba === 'integracao' ? (
        <MelhorEnvioPainel />
      ) : (
        <InfinitePayConfig />
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
