import type { Metadata } from 'next';
import { FavoritosView } from '@/components/admin/favoritos/favoritos-view';

export const metadata: Metadata = {
  title: 'Favoritos',
};

/**
 * `/admin/favoritos` — reconstruída de adm-067.
 *
 * A PÁGINA É UM COMPONENTE DE SERVIDOR e só monta a tela; o estado (a lista
 * carregada) vive em `FavoritosView`. Uma página de servidor não guarda estado
 * entre interações.
 *
 * ================== DÉCIMA OCORRÊNCIA DO DEFEITO DE `references` ==================
 *
 * A rota era servida pelo `ModulePage` com DUAS coisas erradas:
 *
 *   FAIXA. Dizia `adm-066`; o certo é `adm-067`. O `adm-066` é a aba `Categorias`
 *   de Relatórios — o mesmo material que o módulo de cima reivindica. É o defeito
 *   de sempre: cada módulo empurrando o próprio primeiro print para o de cima, e
 *   aqui ele ainda apontava para o print de OUTRO módulo. CONFERIDO na pasta:
 *   `235929` é o print de Favoritos.
 *
 *   BLOCOS. O placeholder listava duas seções, e a segunda — `Oportunidades`,
 *   "peças muito salvas e pouco vendidas" — NÃO EXISTE em print nenhum. Foi
 *   inventada a partir do nome da tela: um relatório de cruzamento favoritos ×
 *   vendas não está em captura alguma, e a tela real é só uma lista.
 *
 * ================== O QUE NÃO MUDOU ==================
 *
 * A rota continua `/admin/favoritos`, o item de menu continua o mesmo e o módulo
 * não ganhou I/O de banco — ver `lib/favoritos/data.ts` e a nota do que o Neon
 * vai fazer.
 */
export default function Favoritos_Page() {
  return <FavoritosView />;
}
