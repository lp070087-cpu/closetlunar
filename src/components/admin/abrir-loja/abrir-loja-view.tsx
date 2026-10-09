'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { LoadingState } from '@/components/ui/states';
import { CHECKLIST_UPDATED_MESSAGE, checkAll, checkItem, listChecklist } from '@/lib/abrir-loja/data';
import { applyOutcome, markChecking, resetAll } from '@/lib/abrir-loja/metrics';
import type { ChecklistId, ChecklistItem } from '@/lib/abrir-loja/types';
import { ChecklistCard } from './checklist-card';
import { ChecklistList } from './checklist-list';
import { ChecklistToast } from './checklist-toast';

/**
 * A tela de Abrir Loja (`/admin/abrir-loja`) — adm-087 a adm-089.
 *
 * ================== A RODADA É SEQUENCIAL, COMO O ORIGINAL ==================
 *
 * O original roda as nove verificações UMA ATRÁS DA OUTRA (`for … await check`), e
 * é por isso que a barra sobe de pouco em pouco em vez de saltar. Aqui é igual: o
 * laço espera cada `checkItem` antes de aplicar o resultado e seguir. Aplicar
 * todos de uma vez seria mais rápido e desenharia outra animação — a que o print
 * não mostra.
 *
 * ================== NADA É MARCADO À MÃO ==================
 *
 * Não há caixa de marcar nesta tela. Cada item é uma CONSULTA ao banco; o
 * resultado é que o pinta. Ver `lib/abrir-loja/data.ts`.
 */
export function AbrirLojaView() {
  const [items, setItems] = useState<ChecklistItem[] | null>(null);
  const [running, setRunning] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const avisoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const mostrarAviso = useCallback((texto: string) => {
    setAviso(texto);
    if (avisoTimer.current) clearTimeout(avisoTimer.current);
    avisoTimer.current = setTimeout(() => setAviso(null), 3200);
  }, []);

  /** A rodada completa: zera tudo, verifica uma a uma, e avisa no fim. */
  const revalidar = useCallback(
    async (base: ChecklistItem[]) => {
      setRunning(true);
      const zerado = resetAll(base);
      setItems(zerado);
      let atual = zerado;
      const { data } = await checkAll(base);
      for (const passo of data) {
        atual = markChecking(atual, passo.id);
        setItems(atual);
        atual = applyOutcome(atual, passo.id, passo.outcome);
        setItems(atual);
      }
      setRunning(false);
      mostrarAviso(CHECKLIST_UPDATED_MESSAGE);
    },
    [mostrarAviso],
  );

  useEffect(() => {
    let vivo = true;
    listChecklist().then((res) => {
      if (!vivo) return;
      void revalidar(res.data);
    });
    return () => {
      vivo = false;
      if (avisoTimer.current) clearTimeout(avisoTimer.current);
    };
    // Roda uma vez, na montagem — como o `useEffect(..., [])` do original.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Revalidar UM item só — o botão de cada linha. */
  async function revalidarItem(id: string) {
    setItems((prev) => (prev ? markChecking(prev, id) : prev));
    const { data } = await checkItem(id as ChecklistId);
    setItems((prev) => (prev ? applyOutcome(prev, id, data) : prev));
  }

  /**
   * Enquanto a lista não chegou, a tela mostra CARREGANDO — e não `0 de 0 itens
   * prontos`. Mostrar a contagem zerada antes de a leitura responder afirmaria um
   * fato falso ("nenhum item pronto") só porque a resposta ainda não veio, e o
   * aviso âmbar "Finalize os itens pendentes antes de abrir" apareceria por um
   * instante sem que nada tivesse sido verificado ainda.
   */
  if (items === null) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <LoadingState />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <ChecklistToast message={aviso} />
      <ChecklistCard
        items={items}
        running={running}
        onRecheck={() => void revalidar(items)}
      />
      <ChecklistList items={items} onRecheckItem={revalidarItem} />
    </div>
  );
}
