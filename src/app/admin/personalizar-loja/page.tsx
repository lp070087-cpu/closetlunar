import type { Metadata } from 'next';
import { PersonalizarView } from '@/components/admin/conteudo/personalizar-view';
import { getActiveThemeId, listThemes } from '@/lib/conteudo/data';

export const metadata: Metadata = { title: 'Personalizar Loja' };

/**
 * `/admin/personalizar-loja` — reconstruida de adm-060.
 *
 * ================== DEFEITO DO PLACEHOLDER ANTERIOR: `references` ERRADO ==================
 *
 * Esta rota era servida pelo `ModulePage` com `references="adm-071"`. adm-071 NAO e
 * desta tela — esta tela e **adm-060**, `Personalizar Loja`. O `adm-071` cai no grupo
 * `Insights e Comunicação`, tres telas adiante. E o mesmo defeito de
 * `banners/page.tsx` e `conteudo-do-site/page.tsx`.
 *
 * ================== AS DESCRICOES DOS BLOCOS ERAM INVENTADAS ==================
 *
 * O placeholder descrevia tres blocos, e DOIS nao existem no material:
 *
 *   "Cores da marca — Cor principal, cor de apoio e cor de destaque"  ->  NAO. Esse
 *       editor de tres cores nao esta em print nenhum. O que existe sao TRES AMOSTRAS
 *       de cor DENTRO de cada cartao de tema (a paleta do tema), nao um editor.
 *   "Aplicação — Publicação do tema para a loja online"               ->  NAO. O
 *       subtitulo da propria tela diz que `publicação` chega numa proxima etapa.
 *   "Temas prontos — Galeria de temas com pré-visualização"           ->  parcialmente
 *       certo: sao tres CARTOES, e cada um traz a previa (tarja + `Aa` + paleta).
 *
 * Escrever "publicação" como um bloco existente promete uma tela que o material diz que
 * ainda nao existe — e o `references` errado foi quem criou a folga para inventar.
 */
export default async function PersonalizarLoja_Page() {
  const [themes, active] = await Promise.all([listThemes(), getActiveThemeId()]);
  return <PersonalizarView initial={themes.data} initialActiveId={active.data} />;
}
