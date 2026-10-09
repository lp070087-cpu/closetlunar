'use client';

import { Gift, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/form';
import type { RewardDraft } from '@/lib/fidelidade/types';

/**
 * O cartao `Resgates` — a metade direita de adm-018.
 *
 * CADA LINHA E UMA FAIXA CINZA COM DOIS CAMPOS E A UNIDADE:
 *
 *   [ R$ 10 de desconto ....................... ] [ 500 ] PTS
 *
 * A faixa cinza e o `bg-muted/30` do original, e a unidade `PTS` fica FORA do
 * campo, a direita — nao e sufixo dentro do input. O campo dos pontos e ESTREITO
 * (~5rem) e monoespaçado, e o do rotulo ocupa o resto.
 *
 * O BOTAO `+ ADICIONAR RECOMPENSA` E UM TEXTO, e nao um botao com borda: no print
 * ele e caixa alta cinza, pequeno, alinhado a esquerda. Ele ADICIONA UMA LINHA
 * VAZIA NA LISTA e NAO GRAVA NADA — quem grava e `SALVAR RECOMPENSAS`, no fim do
 * cartao. Por isso os dois existem separados aqui: `onAdd` mexe na lista local e
 * `onSave` e a gravacao.
 *
 * UMA LINHA NOVA E INDISTINGUIVEL DE UMA ANTIGA, de proposito — e o aviso de que
 * nada foi gravado NAO mora por linha, e sim em um bloco unico acima dos cartoes
 * (ver `UnsavedNotice` em `fidelidade-view.tsx`). A razao de nao marcar a linha: o
 * print nao marca, e uma marca por linha teria que se apagar sozinha depois da
 * gravacao — dois estados visuais a mais para uma informacao que ja esta dita, uma
 * vez, no lugar certo.
 *
 * NAO HA BOTAO DE REMOVER NENHUMA LINHA. O original nao tem, e nenhum print mostra
 * um — inventar um `x` por linha seria acrescentar uma acao que a referencia nao
 * tem. (Isso e uma falta real do original, e nao um erro deste modulo; fica
 * registrado como tal.)
 */
export function LoyaltyRewardsCard({
  rows,
  saving,
  onChange,
  onAdd,
  onSave,
}: {
  rows: RewardDraft[];
  saving: boolean;
  onChange: (next: RewardDraft[]) => void;
  onAdd: () => void;
  onSave: () => void;
}) {
  function patchRow(index: number, fields: Partial<RewardDraft>) {
    onChange(rows.map((row, i) => (i === index ? { ...row, ...fields } : row)));
  }

  return (
    <div className="surface space-y-6 p-6 sm:p-8">
      <h3 className="flex items-center gap-3 font-serif text-lg">
        <Gift className="size-5 shrink-0 text-muted-foreground" aria-hidden />
        Resgates
      </h3>

      <div className="space-y-3">
        {rows.map((row, index) => (
          <div
            key={row.id}
            className="flex flex-col gap-2 rounded-xl bg-muted/30 p-3 sm:flex-row sm:items-center"
          >
            {/*
              O rotulo NAO usa `Field`: o `Field` desenharia um rotulo em caixa alta
              acima do campo, e a faixa do print nao tem rotulo nenhum — o
              `placeholder` faz esse papel. Por isso o `Input` vai com
              `aria-label`, para nao ficar um campo sem nome para quem usa leitor
              de tela.
            */}
            <Input
              className="h-9 flex-1 text-xs sm:text-sm"
              value={row.label}
              placeholder="Ex: R$ 50 de Desconto"
              aria-label="Descrição da recompensa"
              onChange={(event) => patchRow(index, { label: event.target.value })}
            />

            {/* O campo dos pontos nao muda: o `Input` ja aceita `type`. */}
            <div className="flex items-center gap-2">
              <Input
                className="h-9 w-24 font-mono text-xs sm:text-sm"
                type="number"
                min={0}
                value={row.points}
                placeholder="Pontos"
                aria-label="Pontos necessários"
                onChange={(event) => patchRow(index, { points: event.target.value })}
              />
              <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                PTS
              </span>
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={onAdd}
        className="focus-ring inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground transition-colors hover:text-foreground"
      >
        <Plus className="size-3.5" aria-hidden />
        Adicionar Recompensa
      </button>

      <Button type="button" className="w-full" loading={saving} onClick={onSave}>
        Salvar Recompensas
      </Button>
    </div>
  );
}
