'use client';

import type { ProductRuleRow as RuleRow, ProductSizeRule } from '@/lib/tamanhos/types';
import { PanelSection } from './panel-section';
import { ProductRuleRow } from './product-rule-row';

/**
 * Bloco 2 — Regras por Produto (adm-034 a adm-037).
 *
 * MEDIDO NO PRINT: as linhas ficam dentro de um cartao proprio, e o espaco
 * INTERNO e bege (`secondary/10`) enquanto cada linha tem fundo claro — as
 * linhas se separam por uma hairline, e nao por respiro como na lista de
 * Categorias. Vale registrar: as duas telas usam cartoes, mas a separacao e
 * diferente, e "cartao" nao quer dizer "o mesmo cartao".
 *
 * O estado vazio existe aqui porque a referencia do projeto o tem
 * (`Nenhum produto cadastrado.`); nao e um print, mas e o comportamento
 * correto quando a lista chega vazia, e deixar a caixa em branco seria pior.
 */
export function RuleSection({
  rules,
  savingProductId,
  onSave,
}: {
  rules: RuleRow[];
  savingProductId: string | null;
  onSave: (rule: ProductSizeRule) => void;
}) {
  return (
    <PanelSection
      title="Regras por Produto"
      subtitle="Personalize como cada peça se comporta no provador virtual."
    >
      {rules.length === 0 ? (
        <div className="rounded-2xl border border-border/40 bg-secondary/10 p-12 text-center">
          <p className="text-sm font-medium text-muted-foreground">Nenhum produto cadastrado.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border/40 bg-secondary/10">
          <div className="divide-y divide-border/20">
            {rules.map((row) => (
              <ProductRuleRow
                key={row.productId}
                row={row}
                saving={savingProductId === row.productId}
                onSave={onSave}
              />
            ))}
          </div>
        </div>
      )}
    </PanelSection>
  );
}
