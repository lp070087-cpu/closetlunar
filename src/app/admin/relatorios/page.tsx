import type { Metadata } from 'next';
import { RelatoriosView } from '@/components/admin/relatorios/relatorios-view';

export const metadata: Metadata = {
  title: 'Relatórios',
};

/**
 * `/admin/relatorios` — reconstruída de adm-063 a adm-066.
 *
 * A PÁGINA É UM COMPONENTE DE SERVIDOR e não faz nada além de montar a tela. O
 * estado (aba, período, datas personalizadas, filtro de categoria, dados) vive no
 * cliente, dentro de `RelatoriosView`: uma página de servidor não guarda estado
 * entre interações, e mover o relatório para cá seria trocar a arquitetura do
 * painel inteiro por nada.
 *
 * ================== NONA OCORRÊNCIA DO DEFEITO DE `references` ==================
 *
 * Esta rota era servida pelo `ModulePage` com a faixa ERRADA, e com blocos
 * INVENTADOS. As duas coisas foram corrigidas ao reconstruir a tela.
 *
 *   FAIXA. Dizia `adm-062 a adm-065`; o certo é `adm-063 a adm-066`. Errada pelas
 *   duas pontas — o primeiro print do módulo (adm-063) ficava de fora e o último
 *   (adm-066) também. CONFERIDO na pasta: `235851` é adm-063 (aba `Produtos`),
 *   `235859` adm-064, `235911` adm-065 (`Clientes`), `235919` adm-066
 *   (`Categorias`). O `adm-062` é o último print de Conteúdo do Site, e é o
 *   MESMO defeito de sempre: cada módulo empurrando o próprio primeiro print
 *   para o módulo de cima.
 *
 *   BLOCOS. O placeholder listava QUATRO blocos, incluindo um
 *   `Produtos (detalhado)` que NÃO EXISTE em print nenhum — foi inventado a
 *   partir do nome da tela. As abas reais são TRÊS: `Produtos`, `Clientes` e
 *   `Categorias`, e é o que a tela agora tem. Ver `types.ts`.
 *
 * ================== O QUE NÃO MUDOU ==================
 *
 * A rota continua `/admin/relatorios`, o item de menu continua o mesmo e o módulo
 * não ganhou I/O de banco. Nada aqui conecta o Neon — ver `lib/relatorios/data.ts`
 * e a nota "o que vai depender do Neon" no mesmo arquivo.
 */
export default function Relatorios_Page() {
  return <RelatoriosView />;
}
