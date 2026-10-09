import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ComingSoon } from '@/components/ui/states';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  TableWrap,
} from '@/components/ui/table';
import { formatDate } from '@/lib/utils';
import {
  campaignStatusLabel,
  campaignStatusTone,
  campaignTypeLabel,
  formatCampaignDiscount,
  formatCampaignValidity,
} from '@/lib/campanhas/metrics';
import type { Campaign } from '@/lib/campanhas/types';

/**
 * A tabela de campanhas — adm-006, adm-015, adm-016 e adm-017.
 *
 * CINCO COLUNAS MAIS A COLUNA DE ACOES, na ordem do print:
 *
 *   CAMPANHA · TIPO · DESCONTO · VALIDADE · STATUS · (acoes)
 *
 * O `CABEÇALHO` DE TODAS ELAS E A ESQUERDA, inclusive `DESCONTO`, `VALIDADE` e
 * `STATUS` — nao ha nenhuma coluna de numero com o titulo a direita. E o que o
 * print mostra, e e o mesmo padrao de Cupons.
 *
 * A COLUNA CAMPANHA TEM DUAS LINHAS: o nome em destaque e, abaixo, em cinza
 * pequeno, o `badge_text` ou a palavra `Sem selo` quando ele esta vazio. Isso e
 * do original (`{r.badge_text || "Sem selo"}`) e nenhum print desmente, porque
 * nenhum print tem uma linha preenchida — so os estados vazios.
 *
 * O SELO DE STATUS NAO E UM BOTAO AQUI, ao contrario do de Cupons. No original,
 * o selo de campanha e um `<span>`; o de cupom e um `<button onClick={toggle}>`.
 * A diferenca e do material e foi mantida: o modulo nao ganhou uma acao rapida
 * que a referencia nao tem.
 *
 * AS DUAS PALAVRAS SAO `Ativa` E `Pausada` — e nao `Ativo`/`Inativo`, que e o que
 * Cupons usa. As duas grafias convivem no material, e unifica-las seria criar
 * consistencia que nao existe. Ver `metrics.ts`.
 */
export function CampaignTable({
  rows,
  onEdit,
}: {
  rows: Campaign[];
  onEdit: (campaign: Campaign) => void;
}) {
  if (rows.length === 0) {
    /**
     * A MENSAGEM E A DO ORIGINAL, palavra por palavra: `Nenhuma campanha ativa no
     * momento.` Ela e a que aparece em adm-015, adm-016 e adm-017.
     *
     * O TEXTO DIZ "ATIVA" E O ESTADO E "NENHUMA" — nao ha contradicao: a frase e
     * a do material, e e ela que fica. Reescrever para "Nenhuma campanha
     * cadastrada." seria corrigir o original num lugar onde o print manda.
     */
    return (
      <div className="surface p-6 sm:p-8">
        <ComingSoon icon={Sparkles} text="Nenhuma campanha ativa no momento." />
      </div>
    );
  }

  return (
    <div className="surface overflow-hidden">
      <TableWrap>
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Campanha</TableHeaderCell>
              <TableHeaderCell>Tipo</TableHeaderCell>
              <TableHeaderCell>Desconto</TableHeaderCell>
              <TableHeaderCell>Validade</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
              {/* Coluna sem titulo: e o espaco do link de acao. So `Editar` — o
                  original nao tem `Excluir` em campanha, e inventar um botao de
                  apagar aqui seria acrescentar uma acao que o material nao tem. */}
              <TableHeaderCell>
                <span className="sr-only">Ações</span>
              </TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((campaign) => (
              <TableRow key={campaign.id}>
                <TableCell>
                  <div className="font-medium">{campaign.name}</div>
                  <div className="text-[10px] text-muted-foreground">
                    {campaign.badgeText || 'Sem selo'}
                  </div>
                </TableCell>
                {/* O TIPO EM CAIXA ALTA, como o original faz por CSS
                    (`uppercase text-[10px]`), mas em portugues — ver
                    `campaignTypeLabel`. */}
                <TableCell className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  {campaignTypeLabel(campaign.type)}
                </TableCell>
                <TableCell className="font-mono">{formatCampaignDiscount(campaign)}</TableCell>
                <TableCell className="text-xs">
                  {formatCampaignValidity(campaign, formatDate)}
                </TableCell>
                <TableCell>
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${campaignStatusTone(campaign.isActive)}`}
                  >
                    {campaignStatusLabel(campaign.isActive)}
                  </span>
                </TableCell>
                <TableCell align="right">
                  <Button variant="link" size="sm" onClick={() => onEdit(campaign)}>
                    Editar
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
