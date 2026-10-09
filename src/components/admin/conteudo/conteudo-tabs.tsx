'use client';

import { PillTabs } from '@/components/ui/tabs';
import { CONTEUDO_TABS } from '@/lib/conteudo/demo';
import type { ConteudoTabValue } from '@/lib/conteudo/types';

const ITEMS = CONTEUDO_TABS.map((tab) => ({ value: tab.value, label: tab.label }));

/**
 * A FAIXA DE SETE PILULAS — so isso.
 *
 * ================== POR QUE `PillTabs` E NAO `SegmentedTabs` ==================
 *
 * O print de adm-053 mostra sete pilulas CADA UMA com borda propria e um vao entre
 * elas, sem trilho em volta. Ver o cabecalho de `PillTabs` em `ui/tabs.tsx` — a
 * decisao foi tomada la, e esta tela e o motivo pelo qual aquele componente existe.
 *
 * ================== DEFEITO CORRIGIDO: O TITULO ESTAVA DUPLICADO ==================
 *
 * A versao anterior desenhava um `SectionHeader title="Conteúdo do Site"` ACIMA das
 * pilulas, com a justificativa de que "o titulo fica no cabecalho em todas as sete".
 * Essa justificativa confundia duas coisas diferentes:
 *
 *   Cabecalho do TOPO .... `Conteúdo do Site`  <- desenhado pelo `AdminShell`
 *                                                (`layout-client.tsx` ->
 *                                                `findNavItemBySegments`), a partir
 *                                                do rotulo do item de menu.
 *   Corpo da tela ........ SETE PILULAS, e so depois o titulo da SECAO ativa
 *                                                (`Hero Banner`, `Categorias`, ...),
 *                                                que vive em cada painel.
 *
 * O `235737.png` prova a ausencia do segundo titulo: depois do `Conteúdo do Site` do
 * topo vem DIRETO a faixa de pilulas; o proximo texto serifado e `Hero Banner`. Nao
 * ha um segundo `Conteúdo do Site` no corpo. O componente estava, portanto, imprimindo
 * o titulo duas vezes na mesma tela — o exato defeito que `cart-view.tsx` documenta ter
 * evitado ("Repetir um `SectionHeader` aqui seria o titulo duas vezes").
 *
 * A correcao segue a convencao do resto do painel: o titulo do corpo e o do PROPRIO
 * item de menu, e este componente nao redesenha o da casca. A prova esta na bancada
 * (secao do titulo de adm-053), que conta as ocorrencias de `Conteúdo do Site` no HTML
 * de um lado so — a faixa.
 */
export function ConteudoTabs({
  value,
  onChange,
}: {
  value: ConteudoTabValue;
  onChange: (value: ConteudoTabValue) => void;
}) {
  return <PillTabs items={ITEMS} value={value} onChange={onChange} />;
}
