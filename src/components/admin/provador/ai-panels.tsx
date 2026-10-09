'use client';

import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox, Field, Input, Select } from '@/components/ui/form';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  TableWrap,
} from '@/components/ui/table';
import { clampMaxSuggestions, isValidPriority } from '@/lib/provador/metrics';
import type { Product } from '@/lib/produtos/types';
import type { AiSettings, ManualSuggestion } from '@/lib/provador/types';

/**
 * OS DOIS PAINEIS DE `IA de Looks`, um por aba.
 *
 * ================== POR QUE ELES SAO ARQUIVOS PROPIOS ==================
 *
 * As duas abas de `IA de Looks` (adm-047/048/049 e adm-050) sao telas inteiras,
 * com formulario e tabela cada uma. Escritas dentro de `ia-looks-view.tsx`, elas
 * ficariam presas atras do clique da aba: o unico jeito de ver o painel da aba 2
 * seria a aba estar trocada.
 *
 * Separadas, cada painel e a sua propria tela — e a `IALooksView` fica sendo o que
 * ela de fato e: a faixa de abas e a escolha entre as duas. E o mesmo desenho de
 * `PieceWorkspace`/`PieceConfigPanel`/`ProductPicker` no resto deste diretorio, e a
 * mesma razao: parte que tem estado proprio e corpo proprio vira arquivo proprio.
 *
 * NENHUMA CONTA MUDOU NA SEPARACAO. O estado dos dois `select` e da prioridade
 * subiu junto com o formulario, e e dele — nao da view.
 */

/**
 * ABA 1 — `SUGESTOES MANUAIS` (adm-047/048/049).
 *
 * A LISTA DOS DOIS `SELECT` VEM DO CATALOGO, por prop. E o mesmo JOIN do resto do
 * modulo: o dropdown da IA e um DOS DOIS prints que discordam sobre qual e a nona
 * peca — ver `O DONO DA LISTA` em `metrics.ts`.
 */
export function AiSuggestionsPanel({
  products,
  suggestions,
}: {
  products: Product[];
  suggestions: ManualSuggestion[];
}) {
  const [baseId, setBaseId] = useState('');
  const [targetId, setTargetId] = useState('');
  const [prioridade, setPrioridade] = useState(0);

  const opcoes = [
    { value: '', label: 'Selecione...' },
    ...products.map((product) => ({ value: product.id, label: product.name })),
  ];

  return (
    <div className="grid gap-6 lg:grid-cols-[20rem_minmax(0,1fr)] lg:items-start">
      <div className="surface-flat flex flex-col gap-4 p-5">
        <h3 className="font-serif text-lg leading-tight">Nova Sugestão Manual</h3>

        <Select
          label="Produto base"
          value={baseId}
          onChange={(event) => setBaseId(event.target.value)}
          options={opcoes}
        />
        <Select
          label="Produto sugerido"
          value={targetId}
          onChange={(event) => setTargetId(event.target.value)}
          options={opcoes}
        />
        {/**
         * `PRIORIDADE (0-100)` NASCE EM `0` — nao em vazio. O print mostra o campo
         * preenchido com zero, e `0` e um valor valido (nao pode ser confundido com
         * "nao preenchido"), pelo mesmo motivo dos custos de Financeiro. A validacao
         * esta em `isValidPriority`.
         */}
        <Field label="Prioridade (0-100)">
          <Input
            type="number"
            min={0}
            max={100}
            inputMode="numeric"
            value={prioridade}
            onChange={(event) => setPrioridade(Number(event.target.value))}
            aria-invalid={!isValidPriority(prioridade) ? true : undefined}
            error={!isValidPriority(prioridade) ? 'A prioridade deve ficar entre 0 e 100.' : undefined}
          />
        </Field>

        {/**
         * `Adicionar Relação` — pilula PRETA ocupando a largura toda, como no print
         * (e nao alinhada a direita como o `Button` faz por padrao).
         */}
        <Button className="w-full" disabled={!baseId || !targetId || !isValidPriority(prioridade)}>
          Adicionar Relação
        </Button>
      </div>

      {/**
       * A TABELA — os quatro cabecalhos e NENHUMA linha, sem mensagem de vazio
       * (adm-047/048/049). Nao existe `Nenhuma sugestão ainda.` no material: a
       * tabela simplesmente nao tem corpo. O `corpo` vazio reproduz isso.
       *
       * A tabela NAO usa `EmptyRow` de proposito: `EmptyRow` imprime uma frase no
       * lugar do corpo, que e exatamente o que o print nao tem.
       */}
      <TableWrap>
        <Table>
          <TableHead>
            <tr>
              <TableHeaderCell>Produto base</TableHeaderCell>
              <TableHeaderCell>Sugerido</TableHeaderCell>
              <TableHeaderCell>Prioridade</TableHeaderCell>
              <TableHeaderCell align="right">Ações</TableHeaderCell>
            </tr>
          </TableHead>
          <TableBody>
            {suggestions.map((row) => (
              <TableRow key={row.id}>
                <TableCell>{products.find((p) => p.id === row.baseId)?.name ?? '—'}</TableCell>
                <TableCell>{products.find((p) => p.id === row.targetId)?.name ?? '—'}</TableCell>
                <TableCell className="tabular-nums">{row.priority}</TableCell>
                <TableCell align="right">
                  <Button variant="ghost" size="icon" aria-label="Remover relação">
                    <Trash2 className="size-4" aria-hidden />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableWrap>
    </div>
  );
}

/**
 * ABA 2 — `CONFIGURACOES DA IA` (adm-050).
 *
 * AS DUAS MARCACOES — `Priorizar mesma coleção` e `Harmonia de Cores`, com as
 * descricoes do print. As duas chegam MARCADAS de `AiSettings`, e o vinculo entre
 * o rotulo e a caixa e do proprio `Checkbox` (ele gera o `htmlFor`), por isso o
 * rotulo nao precisa de id a mao.
 *
 * OS CAMPOS NAO SAO EDITAVEIS NESTA FASE, e a razao esta em `data.ts`: gravar
 * depende do Neon. Os `Checkbox` recebem `onChange` vazio em vez de `readOnly`
 * porque `CheckboxProps` nao estende `readOnly` — e um `<input checked>` sem
 * `onChange` faz o React avisar no console.
 */
export function AiSettingsPanel({ settings }: { settings: AiSettings }) {
  return (
    <div className="max-w-2xl">
      <div className="surface-flat flex flex-col gap-5 p-6">
        <h3 className="font-serif text-lg leading-tight">Prioridades da Consultora Virtual</h3>

        <Checkbox
          label="Priorizar mesma coleção"
          description="Sugerir peças que fazem parte da mesma coleção do produto visualizado"
          checked={settings.sameCollection}
          onChange={() => {}}
        />
        <Checkbox
          label="Harmonia de Cores"
          description="Utilizar IA para sugerir cores complementares e análogas"
          checked={settings.colorHarmony}
          onChange={() => {}}
        />

        <Field label="Máximo de sugestões por seção">
          <Input
            type="number"
            min={1}
            max={20}
            inputMode="numeric"
            defaultValue={clampMaxSuggestions(settings.maxSuggestions)}
            aria-label="Máximo de sugestões por seção"
          />
        </Field>

        <Button className="w-full">Salvar Configurações</Button>
      </div>
    </div>
  );
}
