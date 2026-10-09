import type { Metadata } from 'next';
import { BannersView } from '@/components/admin/conteudo/banners-view';
import { listBanners } from '@/lib/conteudo/data';

export const metadata: Metadata = {
  title: 'Banners',
};

/**
 * `/admin/banners` — reconstruida de adm-051 (a grade) e adm-052 (o modal).
 *
 * A pagina e um COMPONENTE DE SERVIDOR e so carrega os dados; o estado da tela vive em
 * `BannersView`. Ver a nota em `/admin/fidelidade` para por que a divisao e essa.
 *
 * ================== DEFEITO DO PLACEHOLDER ANTERIOR: `references` ERRADO ==================
 *
 * Esta rota era servida pelo `ModulePage` com `references="adm-059 a adm-062"`. O
 * intervalo esta ERRADO — Banners sao adm-051 e adm-052.
 *
 * Nao e um erro de um numero: a faixa come o comeco do modulo seguinte e erra o proprio.
 *   adm-059 = `Rodapé`        (aba de Conteudo do Site)
 *   adm-060 = `Personalizar Loja`
 *   adm-061 = `Looks`         (lista)
 *   adm-062 = `Novo look`     (modal)
 * Nenhum desses quatro e desta tela. O `adm-051` e o `adm-052` ficaram de fora.
 *
 * ================== AS DESCRICOES DOS BLOCOS TAMBEM ERAM FALSAS ==================
 *
 * O placeholder descrevia tres blocos, e conferidos contra o material, DOIS nao existem:
 *
 *   "Banner, posição, validade e status"  ->  NAO. Nao ha coluna de posicao nem campo
 *                                              de validade em lugar nenhum. A grade
 *                                              mostra `ORDEM: n` (a posicao na lista,
 *                                              derivada) e o selo `ATIVO`; o modal tem
 *                                              `Ordem de exibição` e `Banner Ativo`.
 *   "Posições: Topo, meio e rodapé"       ->  NAO. Essa lista de tres posicoes nao existe
 *                                              no print nem no formulario. Foi inventada.
 *   "Imagem desktop, imagem mobile, link,
 *    posição, texto, botão e ordem"       ->  parcialmente certo: os campos reais sao
 *                                              titulo, eyebrow, subtitulo, as duas
 *                                              imagens, link, CTA, ordem e ativo.
 *
 * O registro fica em vez de a correcao ser silenciosa: e a mesma classe de defeito que
 * ja apareceu em seis outras rotas, e ela sempre nasce igual — o `references` e as
 * descricoes foram escritos pelo TITULO da tela, nao pela lista real de arquivos. Como
 * `references` e um atributo de exibicao (nao aponta para arquivo nenhum), um numero
 * errado ali nunca quebrou nada, e por isso sobreviveu a todas as fases.
 *
 * ================== O QUE NAO MUDOU ==================
 *
 * A rota continua `/admin/banners` e o item de menu continua o mesmo. Nada aqui conecta
 * o Neon — `listBanners` devolve dados de demonstracao e a tela diz que nao gravou.
 */
export default async function Banners_Page() {
  const { data } = await listBanners();
  return <BannersView initial={data} />;
}
