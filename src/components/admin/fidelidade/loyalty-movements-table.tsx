'use client';

import { History } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow, TableWrap } from '@/components/ui/table';
import { EmptyRow } from '@/components/ui/states';
import { formatDate } from '@/lib/utils';
import { formatMovementPoints, movementTypeLabel } from '@/lib/fidelidade/metrics';
import type { LoyaltyMovement } from '@/lib/fidelidade/types';

/**
 * A aba `Histórico de Pontos` — adm-020.
 *
 * O CARD TEM CABECALHO PROPRIO (`Últimas Movimentações`) e a tabela abaixo, com
 * CINCO colunas:
 *
 *   CLIENTE | DATA | DESCRIÇÃO | TIPO | PONTOS
 *
 * O ALINHAMENTO DAS COLUNAS E DO PRINT, e ele nao e uniforme: `TIPO` e CENTRADA e
 * `PONTOS` e a direita; as tres primeiras sao a esquerda. E o que o original faz
 * (`text-center` no TIPO, `text-right` nos PONTOS) e o que o print mostra. Por isso
 * as celulas usam o `align` do design system em vez de deixar tudo a esquerda.
 *
 * O `TIPO` E UM SELO COLORIDO, e a COR VEM DO TIPO, nao de uma classe escrita aqui:
 * `earn` e verde, o resto e vermelho. A regra e FALSAVEL (qualquer coisa que nao
 * seja `earn` cai no vermelho) porque e assim no original e porque a coluna `type`
 * e texto livre no banco — ver `movementTypeLabel`.
 *
 * OS PONTOS SAEM COM SINAL, e o sinal vem do TIPO e nao do numero: `+100` para
 * ganho, `-100` para resgate. Ver `formatMovementPoints` para a consequencia disso
 * num dado torto.
 *
 * O TEXTO VAZIO. O original NAO TEM estado vazio nesta tabela — ele renderiza o
 * `tbody` vazio e nada mais, o que faz a tabela sumir sem explicacao. Aqui entra a
 * mensagem de lista vazia do design system, que e o mesmo tratamento de Cupons e
 * Campanhas. E a unica diferenca deliberada em relacao ao original, e ela nao
 * inventa conteudo: a coluna continua a mesma, so diz que nao ha linha.
 *
 * O PRINT DE adm-020 MOSTRA A TABELA VAZIA — so o cabecalho. Esse e um ESTADO
 * LEGITIMO e comprovado, e nao um placeholder: a loja nao tem movimentacao de
 * pontos ainda. Nao confundir com tela nao construida.
 */
export function LoyaltyMovementsTable({ rows }: { rows: LoyaltyMovement[] }) {
  return (
    <div className="surface overflow-hidden">
      <div className="border-b border-border/60 px-6 py-5">
        <h3 className="flex items-center gap-3 font-serif text-lg">
          <History className="size-5 shrink-0 text-muted-foreground" aria-hidden />
          Últimas Movimentações
        </h3>
      </div>

      <TableWrap>
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Cliente</TableHeaderCell>
              <TableHeaderCell>Data</TableHeaderCell>
              <TableHeaderCell>Descrição</TableHeaderCell>
              <TableHeaderCell align="center">Tipo</TableHeaderCell>
              <TableHeaderCell align="right">Pontos</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.length === 0 ? (
              <EmptyRow colSpan={5} title="Nenhuma movimentação de pontos registrada." />
            ) : (
              rows.map((row) => {
                const ganho = row.type === 'earn';
                return (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">{row.customerEmail}</TableCell>
                    {/* A DATA usa o formatador do painel, que e `toLocaleDateString('pt-BR')`
                        como o original — o print nao mostra linha, entao o formato
                        vem do codigo de referencia e nao de uma suposicao. */}
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDate(row.createdAt)}
                    </TableCell>
                    <TableCell className="text-xs">{row.description}</TableCell>
                    <TableCell align="center">
                      <Badge variant={ganho ? 'success' : 'danger'} size="sm">
                        {movementTypeLabel(row.type)}
                      </Badge>
                    </TableCell>
                    <TableCell
                      align="right"
                      className={`font-mono font-bold ${ganho ? 'text-success-foreground' : 'text-danger-foreground'}`}
                    >
                      {formatMovementPoints(row)}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableWrap>
    </div>
  );
}
