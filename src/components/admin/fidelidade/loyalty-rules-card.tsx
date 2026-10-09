'use client';

import { Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Field, FieldGrid, Input, Checkbox } from '@/components/ui/form';
import type { RulesDraft } from '@/lib/fidelidade/types';

/**
 * O cartao `Regras Gerais` — a metade esquerda de adm-018.
 *
 * TRES CAMPOS NUMERICOS E UM QUADRO DE MARCAR, na ordem do print:
 *
 *   PONTOS POR R$ 1,00 ....... | BÔNUS INDICAÇÃO
 *   BÔNUS AVALIAÇÃO .......... | [x] Programa Ativo
 *
 * O QUADRO `Programa Ativo` NAO TEM ROTULO DE CAMPO ACIMA. No print ele fica na
 * SEGUNDA COLUNA DA SEGUNDA LINHA, alinhado com `BÔNUS AVALIAÇÃO` — que ocupa a
 * primeira coluna. Por isso ele nao entra num `<Field>`: um `Field` desenharia um
 * rotulo em caixa alta acima dele, e o print nao tem rotulo nenhum ali. O `pt-6`
 * do original existe para empurrar a caixa para a linha de baixo, mas aqui a
 * grade `FieldGrid` ja faz esse alinhamento sozinha, e o valor foi lido do print
 * — a caixa esta CENTRADA na altura do campo vizinho, e nao no topo dele.
 *
 * O BOTAO E DE LARGURA INTEIRA e fica FORA da grade, como no print: `SALVAR REGRAS`
 * atravessa o cartao todo. E o unico botao do cartao. O `LoyaltyRewardsCard` ao
 * lado tem DOIS (o `+ Adicionar Recompensa` e o `Salvar Recompensas`), e a
 * diferenca e do material, nao uma escolha de padronizacao.
 *
 * OS CAMPOS SEGURAM TEXTO, e nao numero. Ver `RulesDraft` e `toNumber`: guardar
 * `Number(e.target.value)` a cada tecla — que e o que o original faz — escreve um
 * `0` no campo no instante em que a pessoa seleciona tudo e comeca a digitar
 * outro valor. Aqui isso pesa mais do que nos outros campos do painel, porque
 * `Pontos por R$ 1,00` e o numero que decide o acumulo da loja inteira: um zero
 * acidental nao e um campo vazio, e o programa desligado na pratica.
 */
export function LoyaltyRulesCard({
  rules,
  saving,
  onChange,
  onSave,
}: {
  rules: RulesDraft;
  saving: boolean;
  onChange: (next: RulesDraft) => void;
  onSave: () => void;
}) {
  const patch = (fields: Partial<RulesDraft>) => onChange({ ...rules, ...fields });

  return (
    <div className="surface space-y-6 p-6 sm:p-8">
      <h3 className="flex items-center gap-3 font-serif text-lg">
        <Settings className="size-5 shrink-0 text-muted-foreground" aria-hidden />
        Regras Gerais
      </h3>

      <FieldGrid columns={2}>
        <Field label="Pontos por R$ 1,00" htmlFor="fid-pontos-real">
          <Input
            id="fid-pontos-real"
            type="number"
            min={0}
            value={rules.pointsPerReal}
            onChange={(event) => patch({ pointsPerReal: event.target.value })}
          />
        </Field>

        <Field label="Bônus Indicação" htmlFor="fid-bonus-indicacao">
          <Input
            id="fid-bonus-indicacao"
            type="number"
            min={0}
            value={rules.pointsForReferral}
            onChange={(event) => patch({ pointsForReferral: event.target.value })}
          />
        </Field>

        <Field label="Bônus Avaliação" htmlFor="fid-bonus-avaliacao">
          <Input
            id="fid-bonus-avaliacao"
            type="number"
            min={0}
            value={rules.pointsForReview}
            onChange={(event) => patch({ pointsForReview: event.target.value })}
          />
        </Field>

        {/*
          A caixa fica na celula da segunda coluna, sem rotulo — e `self-center`
          para nao herdar o `stretch` da grade, que a esticaria na altura toda da
          linha e desalinharia a caixa do campo ao lado.
        */}
        <div className="flex items-center self-center">
          <Checkbox
            id="fid-programa-ativo"
            checked={rules.isEnabled}
            onChange={(event) => patch({ isEnabled: event.target.checked })}
            label="Programa Ativo"
          />
        </div>
      </FieldGrid>

      <Button type="button" className="w-full" loading={saving} onClick={onSave}>
        Salvar Regras
      </Button>
    </div>
  );
}
