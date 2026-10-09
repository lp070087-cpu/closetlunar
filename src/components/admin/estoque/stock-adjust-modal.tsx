'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Field, Input, Select } from '@/components/ui/form';
import { Modal } from '@/components/ui/modal';
import { DEFAULT_REASON } from '@/lib/estoque/demo';
import type { MovementType, ReasonOption, StockAdjustment, StockRow } from '@/lib/estoque/types';

/**
 * Formulario de ajuste de estoque, aberto pelo `Ajuste Geral` da tabela.
 *
 * ============================ DIVERGENCIA ============================
 *
 * ESTE FORMULARIO NAO ESTA EM PRINT NENHUM.
 *
 * A tela de Estoque de adm-028/adm-029 mostra o link `Ajuste Geral` em todas as
 * linhas, mas nenhum dos 89 prints do painel tem o modal que ele abre. Nao ha
 * campo, nao ha rotulo e nao ha botao de salvar para copiar.
 *
 * O que foi feito, entao, foi o MINIMO que respeita os dois lados:
 *
 * - o link virou clicavel (um link morto nao e fidelidade, e um defeito);
 * - o formulario so oferece o que JA existe nos materiais — as cores que a
 *   propria linha mostra, os motivos que os chips do adm-029 listam, e um campo
 *   de quantidade;
 * - o que ele NAO faz e declarado na tela: nao ha gravacao (o aviso do rodape
 *   diz isso), e o ajuste nao inventa um "delta" nem uma direcao.
 *
 * A ALTERNATIVA DESCARTADA foi desenhar um modal cheio de campos plausiveis
 * (fornecedor, nota fiscal, lote, custo unitario). Isso produziria uma tela que
 * PARECE a referencia e nao e — e, pior, daria a entender que existem dados que
 * ninguem tem. Fica relatado como pendencia ate existir o print do modal.
 * ====================================================================
 *
 * O CAMPO MOTIVO lista os SEIS chips do print, e nao um enum inventado. O motivo
 * escolhido vira o TIPO da linha no historico — e a coluna TIPO do print so
 * mostra `Ajuste` porque so ha um lancamento.
 *
 * O ALVO do ajuste comeca no estoque GERAL do produto, que e o caso de todas as
 * dez linhas do print (a coluna COR do historico mostra `—`). Quando a peca tem
 * cor, o seletor troca para a cor — e o estoque geral some, porque ajustar
 * "geral" uma peca que tem cores proprias nao mudaria total nenhum (o total e a
 * soma das cores; ver `totalStock`).
 */
export function StockAdjustModal({
  open,
  row,
  reasons,
  onClose,
  onSubmit,
}: {
  open: boolean;
  row: StockRow | null;
  reasons: ReasonOption[];
  onClose: () => void;
  onSubmit: (adjustment: StockAdjustment) => void;
}) {
  const [quantity, setQuantity] = useState('0');
  const [colorId, setColorId] = useState<string | null>(null);
  const [type, setType] = useState<MovementType>(DEFAULT_REASON.value as MovementType);
  const [note, setNote] = useState('');

  /**
   * Reinicia o formulario a cada abertura.
   *
   * Sem isto, o segundo ajuste abriria com a quantidade do primeiro ja digitada —
   * e como o campo comeca com o valor atual da peca, `Ajuste Geral` na proxima
   * linha viria preenchido com o estoque de OUTRA peca. E o tipo de erro que
   * passa despercebido e grava o numero errado.
   */
  useEffect(() => {
    if (!open || !row) return;
    const firstColor = row.variations[0]?.colorId ?? null;
    setQuantity(String(firstColor ? (row.variations[0]?.quantity ?? 0) : row.total));
    setColorId(firstColor);
    setType(DEFAULT_REASON.value as MovementType);
    setNote('');
  }, [open, row]);

  if (!row) return null;

  const hasColors = row.variations.length > 0;

  function changeColor(nextColorId: string) {
    setColorId(nextColorId);
    const variation = row?.variations.find((item) => item.colorId === nextColorId);
    setQuantity(String(variation ? variation.quantity : (row?.total ?? 0)));
  }

  const parsed = Number(quantity.trim().replace(',', '.'));
  const invalid = quantity.trim() === '' || !Number.isFinite(parsed) || parsed < 0;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Ajuste de estoque"
      description={row.name}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            disabled={invalid}
            onClick={() =>
              onSubmit({
                productId: row.productId,
                colorId: hasColors ? colorId : null,
                quantity: Math.round(parsed),
                type,
                note: note.trim(),
              })
            }
          >
            Aplicar ajuste
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        {hasColors ? (
          <Field label="Cor" htmlFor="ajuste-cor">
            <Select
              id="ajuste-cor"
              value={colorId ?? ''}
              onChange={(event) => changeColor(event.target.value)}
            >
              {row.variations.map((variation) => (
                <option key={variation.colorId} value={variation.colorId}>
                  {variation.name}
                </option>
              ))}
            </Select>
          </Field>
        ) : (
          <p className="text-xs text-muted-foreground">
            Esta peça não tem variações de cor: o ajuste é no estoque geral.
          </p>
        )}

        <Field
          label="Nova quantidade"
          htmlFor="ajuste-quantidade"
          hint={hasColors ? undefined : 'Ajuste define o valor — não soma nem subtrai.'}
          error={invalid ? 'Informe uma quantidade de zero para cima.' : undefined}
        >
          <Input
            id="ajuste-quantidade"
            type="number"
            min={0}
            inputMode="numeric"
            value={quantity}
            onChange={(event) => setQuantity(event.target.value)}
            className="tabular-nums"
          />
        </Field>

        <Field label="Motivo" htmlFor="ajuste-motivo">
          <Select
            id="ajuste-motivo"
            value={type}
            onChange={(event) => setType(event.target.value as MovementType)}
          >
            {reasons.map((reason) => (
              <option key={reason.value} value={reason.value}>
                {reason.label}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Observação" htmlFor="ajuste-observacao">
          <Input
            id="ajuste-observacao"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Opcional"
          />
        </Field>

        <p className="rounded-2xl border border-warning-surface bg-warning-surface/50 px-4 py-3 text-xs font-medium text-warning-foreground">
          O ajuste entra no histórico desta sessão. A gravação no banco entra na fase de integração.
        </p>
      </div>
    </Modal>
  );
}
