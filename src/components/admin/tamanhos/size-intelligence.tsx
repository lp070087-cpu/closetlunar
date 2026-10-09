'use client';

import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SizeLearningEntry } from '@/lib/tamanhos/types';

/**
 * Inteligencia de Tamanho (adm-036 e adm-037).
 *
 * MEDIDO NO PRINT:
 *
 * - O titulo tem um icone de brilho ANTES do texto, e o conjunto fica na cor
 *   de destaque — nao e um titulo serifado como os outros dois blocos. E a
 *   unica secao com esse tratamento nas seis telas.
 * - Subtitulo: `Log de aprendizado do sistema baseado em compras e devoluções
 *   reais`.
 * - Cabecalho da tabela com cinco colunas: `Data`, `Categoria`, `Produto`,
 *   `Tamanho`, `Status/Feedback`.
 * - ESTADO VAZIO: `Nenhum dado de aprendizado registrado ainda.` — em italico,
 *   centralizado, sem icone e sem botao.
 *
 * O estado vazio e o UNICO estado que os prints mostram — e e por isso que o
 * demo entrega a lista vazia em vez de linhas de exemplo. Nao ha dado de
 * aprendizado antes de haver compra e devolucao real, e inventar linhas aqui
 * seria apresentar dado de exemplo como se fosse medicao do sistema.
 */

const COLUMNS = ['Data', 'Categoria', 'Produto', 'Tamanho', 'Status/Feedback'] as const;

export function SizeIntelligence({ entries }: { entries: SizeLearningEntry[] }) {
  return (
    <section className="surface p-6 sm:p-8 lg:p-10">
      <div className="mb-8">
        <h2 className="flex items-center gap-3 font-serif text-xl text-foreground sm:text-2xl">
          <Sparkles className="size-5 shrink-0 text-accent" aria-hidden />
          Inteligência de Tamanho
        </h2>
        <p className="mt-1 text-sm font-medium text-muted-foreground">
          Log de aprendizado do sistema baseado em compras e devoluções reais
        </p>
      </div>

      <div className="table-scroll">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-border/40">
              {COLUMNS.map((column) => (
                <th
                  key={column}
                  scope="col"
                  className={cn(
                    'px-4 py-3 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/70',
                    // `Tamanho` e estreito e fica ao centro no print; as outras
                    // colunas sao texto corrido alinhado a esquerda.
                    column === 'Tamanho' ? 'text-center' : 'text-left',
                  )}
                >
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {entries.length === 0 ? (
              <tr>
                <td
                  colSpan={COLUMNS.length}
                  className="px-4 py-12 text-center text-sm italic text-muted-foreground"
                >
                  Nenhum dado de aprendizado registrado ainda.
                </td>
              </tr>
            ) : (
              entries.map((entry) => (
                <tr key={entry.id} className="border-b border-border/20 last:border-0">
                  <td className="px-4 py-3 tabular-nums text-muted-foreground">{entry.date}</td>
                  <td className="px-4 py-3 text-foreground">{entry.categoryName}</td>
                  <td className="px-4 py-3 font-serif text-foreground">{entry.productName}</td>
                  <td className="px-4 py-3 text-center font-serif text-foreground">
                    {entry.sizeLabel}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{entry.feedback}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
