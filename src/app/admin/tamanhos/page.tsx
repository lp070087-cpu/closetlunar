import type { Metadata } from 'next';
import { SizeGuideView } from '@/components/admin/tamanhos/size-guide-view';

export const metadata: Metadata = { title: 'Tamanhos' };

/**
 * Tamanhos — reconstruida dos prints adm-032 a adm-037.
 *
 * adm-032 = a Tabela de Medidas com o tipo de peça `Top` preenchido; adm-033 =
 * o mesmo com o seletor de tipo de peça aberto (Top, Short, Legging, Conjunto,
 * Macaquinho, Cropped); adm-034 a adm-036 = `Regras por Produto` (as nove
 * peças, com os seletores de modelagem e elasticidade, o campo de observação e
 * o botão `SALVAR`) mais `Inteligência de Tamanho` com o estado vazio;
 * adm-037 = os seletores abertos (`Modelagem pequena/normal/grande` e
 * `Pouca/Média/Alta elasticidade`).
 *
 * O placeholder anterior desta rota citava `adm-045 a adm-048`, que são do
 * Provador Virtual — referência errada, corrigida aqui — e descrevia a matriz
 * com os eixos trocados ("tamanhos nas colunas, medidas nas linhas"); o print
 * mostra o contrário.
 *
 * A tela é um componente cliente porque tem seletor, campos editáveis e
 * estado. A página fica como Server Component para poder, mais adiante,
 * resolver a sessão e buscar a primeira página no servidor.
 */
export default function TamanhosPage() {
  return <SizeGuideView />;
}
