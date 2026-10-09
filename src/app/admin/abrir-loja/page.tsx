import type { Metadata } from 'next';
import { AbrirLojaView } from '@/components/admin/abrir-loja/abrir-loja-view';

export const metadata: Metadata = { title: 'Abrir Loja' };

/**
 * `/admin/abrir-loja` — reconstruída de adm-087 a adm-089.
 *
 * A PÁGINA É UM COMPONENTE DE SERVIDOR e só monta a tela; o estado (os nove itens
 * e o resultado de cada verificação) vive em `AbrirLojaView`.
 *
 * ================== A FAIXA DE PRINTS ESTAVA ERRADA ==================
 *
 * O placeholder registrava `adm-088 e adm-089`. Abrir Loja são TRÊS prints —
 * `adm-087`, `adm-088` e `adm-089` —, e o primeiro é o que traz a tela inteira.
 * É o quarto placeholder seguido com a faixa deslocada, depois de `seo`
 * (`adm-083 a adm-084`), `usuarios` (`adm-085 a adm-086`) e `seguranca` (`adm-087`).
 *
 * ================== O QUE O PLACEHOLDER PROMETIA ==================
 *
 *   "Progresso: `6 DE 9 ITENS PRONTOS / 67%`"   CONFIRMADO — é exatamente o que a
 *                                               tela mostra.
 *   "Checklist: nove itens verificáveis, marcados MANUALMENTE conforme são
 *   concluídos"                                 ERRADO. Nada é marcado à mão. Cada
 *                                               item é verificado NO BANCO, e o
 *                                               subtítulo do print diz isso: "Cada
 *                                               item só fica verde quando o dado
 *                                               existe". Não há caixa de marcar.
 *   "Confirmação: aviso no formato do toast"    CONFIRMADO — adm-089 mostra o
 *                                               "Checklist atualizado" no canto.
 *
 * ================== O QUE NÃO EXISTE ==================
 *
 * Não há botão de publicar, nem interruptor de "loja aberta", nem tela de
 * confirmação. O módulo é o checklist e só; abrir a loja de verdade é uma ação de
 * produção, fora do escopo do painel.
 *
 * ================== O QUE NÃO MUDOU ==================
 *
 * A rota continua `/admin/abrir-loja` e o item de menu o mesmo. Nada aqui conecta
 * o Neon — ver `lib/abrir-loja/data.ts`.
 */
export default function AbrirLoja_Page() {
  return <AbrirLojaView />;
}
