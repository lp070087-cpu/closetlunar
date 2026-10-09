'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { SectionHeader } from '@/components/ui/card';
import { ConfirmModal } from '@/components/ui/modal';
import { PENDING_REASON, saveBenefit } from '@/lib/conteudo/data';
import { positionOf } from '@/lib/conteudo/metrics';
import { ListRow, ListStack } from './list-row';
import { EmptyLine } from './empty-line';
import { BenefitRow } from './conteudo-rows';
import type { Benefit } from '@/lib/conteudo/types';

/**
 * A ABA `Benefícios` — adm-057.
 *
 * ================== TRES ACOES, E O `Desativar` NA FRENTE ==================
 *
 * Ao contrario de Hero e Seções, esta lista TEM o atalho de ativar/desativar por
 * linha: `Desativar` `Editar` `Excluir`. A diferenca e do print e esta em
 * `conteudo-rows.tsx`.
 *
 * ================== O CHIP IMPRIME O NOME DO ICONE ==================
 *
 * `Truck`, `CreditCard`, `ShieldCheck`, `RefreshCw`, `MessageCircle` — os nomes crus,
 * como texto. E um defeito da referencia, reproduzido de proposito. Ver a nota em
 * `BenefitRow` e em `Benefit` (`types.ts`).
 *
 * ================== O BOTAO `+ Novo` NAO ABRE MODAL ==================
 *
 * Nao ha captura do formulario de beneficio. Mesma classificacao de `Secoes da Home` e
 * `Banners Promocionais`: REFERENCIA INSUFICIENTE, com o botao avisando em vez de
 * inventar cinco campos.
 */
export function Beneficios({ initial }: { initial: Benefit[] }) {
  const [benefits, setBenefits] = useState<Benefit[]>(initial);
  const [notice, setNotice] = useState('');
  const [confirming, setConfirming] = useState<Benefit | null>(null);

  async function toggle(benefit: Benefit) {
    const next = { ...benefit, isActive: !benefit.isActive };
    const result = await saveBenefit(next);
    setBenefits((current) => current.map((c) => (c.id === next.id ? next : c)));
    setNotice(result.persisted ? '' : result.reason ?? PENDING_REASON);
  }

  async function remove() {
    if (!confirming) return;
    setBenefits((current) => current.filter((c) => c.id !== confirming.id));
    setNotice(PENDING_REASON);
    setConfirming(null);
  }

  return (
    <div className="space-y-4">
      <SectionHeader
        title="Benefícios"
        action={
          <Button
            onClick={() =>
              setNotice(
                'O formulário de novo benefício não está nas capturas deste módulo — a criação fica pendente até haver referência.',
              )
            }
            className="uppercase tracking-[0.12em]"
          >
            + Novo
          </Button>
        }
      />

      {notice ? (
        <p
          role="status"
          className="rounded-xl border border-warning/40 bg-warning-surface px-4 py-3 text-xs text-foreground"
        >
          {notice}
        </p>
      ) : null}

      {benefits.length === 0 ? (
        <EmptyLine text="Nenhum benefício cadastrado ainda." />
      ) : (
        <ListStack>
          {benefits.map((benefit) => (
            <ListRow key={benefit.id}>
              <BenefitRow
                benefit={benefit}
                order={positionOf(benefits, benefit)}
                onEdit={() =>
                  setNotice(
                    'O formulário de edição de benefício não está nas capturas deste módulo.',
                  )
                }
                onToggle={() => void toggle(benefit)}
                onDelete={() => setConfirming(benefit)}
              />
            </ListRow>
          ))}
        </ListStack>
      )}

      <ConfirmModal
        open={confirming !== null}
        onClose={() => setConfirming(null)}
        onConfirm={() => void remove()}
        title="Excluir benefício"
        description={
          confirming
            ? `O benefício “${confirming.title}” sai da lista. Esta ação não pode ser desfeita.`
            : undefined
        }
        confirmLabel="Excluir"
        destructive
      />
    </div>
  );
}
