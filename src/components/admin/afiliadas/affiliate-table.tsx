import { Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyRow } from '@/components/ui/states';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  TableWrap,
} from '@/components/ui/table';
import {
  affiliateStatusLabel,
  affiliateStatusTone,
  formatCommission,
  formatReferral,
  toggleActionLabel,
} from '@/lib/afiliadas/metrics';
import type { Affiliate } from '@/lib/afiliadas/types';

/**
 * A tabela de afiliadas — adm-021.
 *
 * CINCO COLUNAS, na ordem exata do print:
 *
 *   NOME / E-MAIL · CUPOM / LINK · COMISSAO · STATUS · ACOES
 *
 * O CABECALHO DAS QUATRO PRIMEIRAS E A ESQUERDA. `STATUS` e a unica que o
 * original centraliza (`text-center`) — e o print confirma: a pilula `ACTIVE`
 * fica no meio da coluna, com espaco dos dois lados. `ACOES` e a direita.
 * Inventar centralizacao nas outras, ou alinhar `STATUS` a esquerda, seriam dois
 * erros na mesma celula.
 *
 * A COLUNA NOME / E-MAIL TEM DUAS LINHAS: o nome em destaque serifado e, abaixo,
 * em cinza pequeno, o e-mail. E o `TablePrimaryCell` do design system, com o
 * par `{af.name}` / `{af.email}` do original.
 *
 * A COLUNA CUPOM / LINK TAMBEM TEM DUAS: o cupom em MONO NEGRITO (o original usa
 * `font-mono text-xs font-bold`) e, abaixo, o caminho de indicacao em cinza
 * `[10px]`. Ver `formatReferral` para a barra sozinha — ela NAO e um link.
 *
 * O SELO DE STATUS NAO E UM BOTAO AQUI, ao contrario do de Cupons. No original,
 * o selo de afiliada e um `<span>`; o de cupom e um `<button onClick={toggle}>`.
 * A diferenca e do material e foi mantida — a acao de suspender mora na coluna
 * ACOES, como o print mostra.
 *
 * A COLUNA ACOES TEM OS DOIS LINKS DO PRINT, sublinhados: `Editar` em tinta e
 * `Suspender` em rosa `#DE3C36`. O segundo texto vem de `toggleActionLabel`, e
 * ele diz o que o clique VAI FAZER (`Suspender` numa ativa, `Ativar` numa
 * suspensa). Ver `metrics.ts`.
 */
export function AffiliateTable({
  rows,
  onEdit,
  onToggle,
}: {
  rows: Affiliate[];
  onEdit: (affiliate: Affiliate) => void;
  onToggle: (affiliate: Affiliate) => void;
}) {
  return (
    <div className="surface overflow-hidden">
      <TableWrap>
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Nome / E-mail</TableHeaderCell>
              <TableHeaderCell>Cupom / Link</TableHeaderCell>
              <TableHeaderCell>Comissão</TableHeaderCell>
              {/* A UNICA coluna centralizada — ver o cabecalho. */}
              <TableHeaderCell align="center">Status</TableHeaderCell>
              <TableHeaderCell align="right">Ações</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.length === 0 ? (
              /**
               * O ORIGINAL NAO TEM ESTADO VAZIO: ele renderiza `{affiliates.map()}`
               * e, com a lista vazia, a tabela fica so com o cabecalho — sem
               * mensagem nenhuma. Diferente de Cupons, onde a frase existe no
               * codigo, aqui NAO HA frase para copiar.
               *
               * A linha abaixo e uma ADICAO DECLARADA, e nao um texto do
               * material: uma tabela vazia e silenciosa e o unico lugar do
               * painel onde "nao ha dado" e "nao carregou" ficam indistinguiveis.
               * O `EmptyRow` e o componente que o resto do painel ja usa para
               * isso. O texto segue a forma dos outros ("Nenhuma campanha ativa
               * no momento."), e NAO inventa uma acao.
               */
              <EmptyRow colSpan={5} title="Nenhuma afiliada cadastrada." icon={Users} />
            ) : (
              rows.map((affiliate) => (
                <TableRow key={affiliate.id}>
                  <TableCell>
                    <div className="flex flex-col leading-tight">
                      <span className="font-serif text-base text-foreground">
                        {affiliate.name}
                      </span>
                      <span className="text-xs text-muted-foreground">{affiliate.email}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col leading-tight">
                      <span className="font-mono text-xs font-bold">{affiliate.couponCode}</span>
                      {/* A barra sozinha e o estado real do dado — ver
                          `formatReferral`. E um `<div>`, e nao um `<a>`: nao ha
                          destino quando o slug esta vazio, e um link para a
                          raiz seria pior que o texto. */}
                      <span className="max-w-[150px] truncate text-[10px] text-muted-foreground">
                        {formatReferral(affiliate)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs">
                    {formatCommission(affiliate)}
                  </TableCell>
                  <TableCell align="center">
                    <Badge variant={affiliateStatusTone(affiliate.status)} size="sm">
                      {affiliateStatusLabel(affiliate.status)}
                    </Badge>
                  </TableCell>
                  <TableCell align="right">
                    <div className="flex items-center justify-end gap-3">
                      <Button variant="link" size="sm" onClick={() => onEdit(affiliate)}>
                        Editar
                      </Button>
                      <Button
                        variant="link"
                        size="sm"
                        className="text-danger hover:text-danger/80"
                        onClick={() => onToggle(affiliate)}
                      >
                        {toggleActionLabel(affiliate.status)}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableWrap>
    </div>
  );
}
