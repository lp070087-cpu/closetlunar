'use client';

import { Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Field, Input, Textarea } from '@/components/ui/form';
import { ComingSoon } from '@/components/ui/states';
import { tierColor } from '@/lib/fidelidade/metrics';
import type { TierDraft, TierJsonError } from '@/lib/fidelidade/types';

/**
 * A aba `Níveis Clube VIP` — adm-019, inteira.
 *
 * QUATRO CARTOES NUMA GRADE DE QUATRO COLUNAS, e cada um e um formulario:
 *
 *   PONTOS MÍNIMOS
 *   MULTIPLICADOR PONTOS
 *   BENEFÍCIOS (JSON)
 *
 * A TARJA COLORIDA DO TOPO NAO E UM `border-top`: e uma tarja de 4px com a COR DO
 * NIVEL, que vem do DADO e nao de uma tabela fixa aqui — ver `tierColor`. O nome
 * do nivel tambem sai na cor, e o trofeu ao lado direito e o mesmo icone em tamanho
 * menor, tambem colorido. As quatro cores foram medidas no pixel do print:
 * #CD7F32, #C0C0C0, #FFD700 e #B9F2FF.
 *
 * O `<textarea>` DOS BENEFICIOS E JSON EM TEXTO PURO, como no original. E a decisao
 * mais discutivel do modulo e a que mais precisa de explicacao: editar JSON a mao e
 * hostil. Ela fica porque (a) e o que o print mostra, (b) o dado e uma LISTA DE
 * TEXTO, e nao uma estrutura com campos — nao ha o que um formulario de linhas
 * ganharia em clareza alem do que um `["a","b"]` ja diz, e (c) trocar por um editor
 * de lista mudaria a forma do dado gravado, que e o contrato com o Neon.
 *
 * O QUE MUDA EM RELACAO AO ORIGINAL, e por que: o `catch(e) {}` do original
 * DESCARTA em silencio uma lista digitada com uma virgula a mais — a pessoa ve o
 * texto na tela, salva, e o beneficio nao foi. Aqui o erro sobe para o campo
 * (`errors[id]`) e o salvamento para enquanto houver qualquer um. Ver
 * `parseBenefits`.
 *
 * O BOTAO E UNICO PARA OS QUATRO CARTOES e fica alinhado a DIREITA, abaixo da
 * grade — e o que o print mostra. Um botao por cartao gravaria os niveis de um em
 * um, que e justamente o `for` de updates independentes que `saveTiers` recusa.
 */
export function LoyaltyTierGrid({
  drafts,
  errors,
  saving,
  onChange,
  onSave,
}: {
  drafts: TierDraft[];
  /** Erro de JSON por id de nivel. Ver `validateTierDrafts`. */
  errors: TierJsonError;
  saving: boolean;
  onChange: (next: TierDraft[]) => void;
  onSave: () => void;
}) {
  function patchTier(index: number, fields: Partial<TierDraft>) {
    onChange(drafts.map((draft, i) => (i === index ? { ...draft, ...fields } : draft)));
  }

  // LISTA VAZIA: o programa pode nao ter nivel nenhum cadastrado. O estado vazio
  // fica no lugar da grade, e nao um cartao em branco.
  if (drafts.length === 0) {
    return (
      <div className="surface overflow-hidden">
        <ComingSoon
          icon={Trophy}
          text="Nenhum nível do Clube VIP cadastrado. Os níveis aparecem aqui quando existirem no banco."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Quatro colunas em tela larga, duas no tablet, uma no celular. O print e
          uma grade de quatro; abaixo de `lg` ela precisa caber sem cortar campo. */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {drafts.map((draft, index) => {
          const cor = tierColor(draft);
          const erro = errors[draft.id];
          return (
            <div
              key={draft.id}
              className="surface space-y-5 p-5 sm:p-6"
              /*
                A TARJA DO TOPO. Precisa de dois estilos inline porque a cor e
                DADO, e nao classe: o Tailwind nao gera utilitaria para um hexa que
                so existe no banco. O `borderTop` e o do original.
              */
              style={{ borderTop: `4px solid ${cor}` }}
            >
              <div className="flex items-center justify-between gap-3">
                {/* O NOME DO NIVEL NAO E EDITAVEL. O original tambem nao tem campo
                    para ele — nenhum input de nome aparece em adm-019, e por isso
                    nao foi inventado um. O `name` e preservado do dado. */}
                <h4 className="font-serif text-lg" style={{ color: cor }}>
                  {draft.name}
                </h4>
                <Trophy className="size-4 shrink-0" style={{ color: cor }} aria-hidden />
              </div>

              <div className="space-y-4">
                <Field label="Pontos Mínimos" htmlFor={`fid-min-${draft.id}`}>
                  <Input
                    id={`fid-min-${draft.id}`}
                    className="h-9 font-mono text-xs"
                    type="number"
                    min={0}
                    value={draft.minPoints}
                    onChange={(event) => patchTier(index, { minPoints: event.target.value })}
                  />
                </Field>

                {/*
                  O `step` de 0,1 e do original (`step="0.1"`), e e o unico campo do
                  painel que aceita decimal. O print mostra `1,2` e `1,5` — que e o
                  NAVEGADOR escrevendo a virgula; o valor por tras e `1.2` e `1.5`.
                  Ver a nota em `metrics.ts`: nao ha formatador a escrever aqui.
                */}
                <Field label="Multiplicador Pontos" htmlFor={`fid-mult-${draft.id}`}>
                  <Input
                    id={`fid-mult-${draft.id}`}
                    className="h-9 font-mono text-xs"
                    type="number"
                    step={0.1}
                    min={0}
                    value={draft.multiplier}
                    onChange={(event) => patchTier(index, { multiplier: event.target.value })}
                  />
                </Field>

                <Field
                  label="Benefícios (JSON)"
                  htmlFor={`fid-ben-${draft.id}`}
                  error={erro}
                  hint={erro ? undefined : 'Uma lista de textos, ex.: ["Frete grátis"]'}
                >
                  <Textarea
                    id={`fid-ben-${draft.id}`}
                    className="min-h-20 font-mono text-[10px]"
                    rows={3}
                    value={draft.benefitsText}
                    aria-invalid={erro ? true : undefined}
                    onChange={(event) => patchTier(index, { benefitsText: event.target.value })}
                  />
                </Field>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex justify-end">
        <Button type="button" size="lg" loading={saving} onClick={onSave}>
          Salvar Configuração do Clube VIP
        </Button>
      </div>
    </div>
  );
}
