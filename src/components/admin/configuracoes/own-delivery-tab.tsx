'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  TableWrap,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import {
  groupByCity,
  neighborhoodCountLabel,
  neighborhoodLabel,
  parsePrice,
  priceLabel,
  zoneStatusLabel,
} from '@/lib/configuracoes/metrics';
import type { DeliveryZone } from '@/lib/configuracoes/types';

/**
 * A aba `ENTREGA PRÓPRIA` — adm-075, adm-101, adm-115, adm-123 e adm-130.
 *
 * ================== O QUE O PRINT MOSTRA, E O QUE ELE NÃO MOSTRA ==================
 *
 * Mostra: a frase de ajuda à esquerda, os botões `Salvar alterações` (sage) e
 * `+ Adicionar cidade` (preto) à direita, e um BLOCO POR CIDADE com o cabeçalho
 * recolhível (`Jaboatão dos Guararapes / PE` + `(11 bairros)`), os links
 * `+ Adicionar bairro` e `Excluir cidade`, e a tabela de cinco colunas: Bairro ·
 * Valor · Prazo · Status · (Editar/Excluir).
 *
 * NÃO mostra: o formulário de bairro. Nenhuma captura abre `+ Adicionar bairro`
 * ou `Editar`. O formulário existe no original (`LocalZoneForm`) e está
 * reconstruído em `zone-form.tsx`, com os campos de lá.
 *
 * ================== O PREÇO É EDITÁVEL NA PRÓPRIA CÉLULA ==================
 *
 * O print mostra o valor dentro de uma CAIXA com borda (`R$ [25,00]`) — não é
 * texto, é um campo. Por isso este componente guarda as edições em `priceEdits` e
 * o `Salvar alterações` fica desabilitado até haver alguma: o print mostra o botão
 * sage APAGADO, e é isso que "nada para salvar" significa.
 *
 * A coluna `Valor` é a única editável. O resto da linha é leitura — trocar o
 * status é clique no selo, e `Editar`/`Excluir` abrem o formulário.
 */
export function OwnDeliveryTab({
  zones,
  onChangePrice,
  onSave,
  saving,
  aviso,
  onAddCity,
  onAddNeighborhood,
  onEdit,
  onToggleActive,
  onRemoveZone,
  onRemoveCity,
}: {
  zones: DeliveryZone[];
  onChangePrice: (id: string, price: number) => void;
  onSave: (prices: { id: string; price: number }[]) => void;
  saving: boolean;
  aviso: string | null;
  onAddCity: () => void;
  onAddNeighborhood: (city: string, state: string) => void;
  onEdit: (zone: DeliveryZone) => void;
  onToggleActive: (zone: DeliveryZone) => void;
  onRemoveZone: (zone: DeliveryZone) => void;
  onRemoveCity: (state: string, city: string) => void;
}) {
  const [recolhidas, setRecolhidas] = useState<Record<string, boolean>>({});
  const [edicoes, setEdicoes] = useState<Record<string, string>>({});
  const grupos = groupByCity(zones);

  /** Só os que MUDARAM de verdade contam — digitar o mesmo valor não é alteração. */
  const sujos = Object.keys(edicoes).filter((id) => {
    const zona = zones.find((z) => z.id === id);
    const novo = parsePrice(edicoes[id]);
    return zona && novo !== null && novo !== zona.price;
  });

  function mudar(id: string, bruto: string) {
    setEdicoes((atual) => ({ ...atual, [id]: bruto }));
    const novo = parsePrice(bruto);
    if (novo !== null) onChangePrice(id, novo);
  }

  function salvar() {
    const precos = sujos
      .map((id) => ({ id, price: parsePrice(edicoes[id]) as number }))
      .filter((p) => p.price !== null);
    if (precos.length === 0) return;
    onSave(precos);
    setEdicoes({});
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-2xl text-sm text-muted-foreground">
          Cadastre as cidades e bairros atendidos pela entrega própria. O checkout casa automaticamente
          cidade + bairro do endereço.
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={salvar}
            disabled={sujos.length === 0 || saving}
            className="focus-ring rounded-xl bg-[#94CBB1] px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#94CBB1]/90 disabled:opacity-40"
          >
            {saving ? 'Salvando…' : `Salvar alterações${sujos.length ? ` (${sujos.length})` : ''}`}
          </button>
          <button
            type="button"
            onClick={onAddCity}
            className="focus-ring rounded-xl bg-foreground px-5 py-2.5 text-sm font-bold text-background transition-transform hover:scale-[1.02] active:scale-95"
          >
            + Adicionar cidade
          </button>
        </div>
      </div>

      {aviso ? (
        <p role="status" className="text-xs text-warning">
          {aviso}
        </p>
      ) : null}

      {grupos.length === 0 ? (
        <p className="surface p-10 text-center text-sm text-muted-foreground">
          Nenhuma cidade cadastrada ainda.
        </p>
      ) : (
        <div className="space-y-3">
          {grupos.map((grupo) => {
            const chave = `${grupo.state}\u0000${grupo.city}`;
            const aberto = !recolhidas[chave];
            return (
              <div key={chave} className="overflow-hidden rounded-2xl border border-border bg-background">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 bg-secondary/40 px-4 py-3">
                  <button
                    type="button"
                    onClick={() => setRecolhidas((c) => ({ ...c, [chave]: aberto }))}
                    aria-expanded={aberto}
                    className="focus-ring flex items-center gap-2 rounded-lg text-left"
                  >
                    {aberto ? (
                      <ChevronDown className="size-4 shrink-0" aria-hidden />
                    ) : (
                      <ChevronRight className="size-4 shrink-0" aria-hidden />
                    )}
                    <span className="text-sm font-bold">
                      {grupo.city} / {grupo.state}
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      ({neighborhoodCountLabel(grupo.zones.length)})
                    </span>
                  </button>

                  <div className="flex items-center gap-4">
                    <button
                      type="button"
                      onClick={() => onAddNeighborhood(grupo.city, grupo.state)}
                      className="focus-ring rounded text-xs font-medium underline underline-offset-4"
                    >
                      + Adicionar bairro
                    </button>
                    <button
                      type="button"
                      onClick={() => onRemoveCity(grupo.state, grupo.city)}
                      className="focus-ring rounded text-xs font-medium text-danger underline underline-offset-4"
                    >
                      Excluir cidade
                    </button>
                  </div>
                </div>

                {aberto ? (
                  <TableWrap>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableHeaderCell>Bairro</TableHeaderCell>
                          <TableHeaderCell align="right">Valor</TableHeaderCell>
                          <TableHeaderCell>Prazo</TableHeaderCell>
                          <TableHeaderCell align="center">Status</TableHeaderCell>
                          <TableHeaderCell align="right">{''}</TableHeaderCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {grupo.zones.map((zona) => {
                          const bruto = edicoes[zona.id] ?? priceLabel(zona.price);
                          const sujo = sujos.includes(zona.id);
                          return (
                            <TableRow key={zona.id}>
                              <TableCell>
                                {zona.neighborhood.trim() === '' ? (
                                  <span className="italic text-muted-foreground">
                                    {neighborhoodLabel(zona.neighborhood)}
                                  </span>
                                ) : (
                                  neighborhoodLabel(zona.neighborhood)
                                )}
                              </TableCell>

                              <TableCell align="right">
                                <span className="inline-flex items-center gap-1.5">
                                  <span className="text-[11px] text-muted-foreground">R$</span>
                                  <input
                                    inputMode="decimal"
                                    aria-label={`Valor da entrega para ${neighborhoodLabel(zona.neighborhood)}`}
                                    value={bruto}
                                    onChange={(event) => mudar(zona.id, event.target.value)}
                                    className={cn(
                                      'focus-ring w-24 rounded-lg border px-2 py-1 text-right text-sm tabular-nums',
                                      sujo ? 'border-success bg-success-surface' : 'border-border',
                                    )}
                                  />
                                </span>
                              </TableCell>

                              <TableCell>{zona.etaLabel}</TableCell>

                              <TableCell align="center">
                                <button
                                  type="button"
                                  onClick={() => onToggleActive(zona)}
                                  className={cn(
                                    'focus-ring rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider',
                                    zona.isActive
                                      ? 'bg-success-surface text-success-foreground'
                                      : 'bg-secondary text-muted-foreground',
                                  )}
                                >
                                  {zoneStatusLabel(zona.isActive)}
                                </button>
                              </TableCell>

                              <TableCell align="right">
                                <span className="inline-flex items-center gap-3 whitespace-nowrap">
                                  <button
                                    type="button"
                                    onClick={() => onEdit(zona)}
                                    className="focus-ring rounded text-xs font-medium underline underline-offset-4"
                                  >
                                    Editar
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => onRemoveZone(zona)}
                                    className="focus-ring rounded text-xs font-medium text-danger underline underline-offset-4"
                                  >
                                    Excluir
                                  </button>
                                </span>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableWrap>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
