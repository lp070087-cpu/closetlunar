import type { Metadata } from 'next';
import { WhatsAppView } from '@/components/admin/whatsapp/whatsapp-view';

export const metadata: Metadata = {
  title: 'WhatsApp',
};

/**
 * `/admin/whatsapp` — reconstruída de adm-069 a adm-071.
 *
 * A PÁGINA É UM COMPONENTE DE SERVIDOR e só monta a tela; o estado (aba,
 * atendimentos, configuração, aviso de salvamento) vive em `WhatsAppView`.
 *
 * ================== O DEFEITO DE `references` — UMA VARIAÇÃO ==================
 *
 * O placeholder registrava `adm-069 e adm-071` — cobrindo três prints com duas
 * pontas e pulando o do meio. O certo é **`adm-069 a adm-071`**: `235950`
 * (adm-069, a aba `Atendimentos`), `000001` (adm-070, o topo das `Configurações`)
 * e `000010` (adm-071, o resto). Não é o defeito do print de cima nem o de baixo
 * desta vez — é a faixa escrita à mão que deixou o print do meio de fora, embora
 * os três sejam o MESMO módulo.
 *
 * ================== AS DIVERGÊNCIAS ENTRE O PRINT E O CÓDIGO ORIGINAL ==================
 *
 * O material e o código do Lovable divergem em dois pontos, e o PRINT venceu nos
 * dois (regra: PRINT > ORIGINAL):
 *
 *   GATILHOS  o código tem SETE (`order_approved`, `order_shipped`,
 *             `order_delivered`, `abandoned_cart`, `shipping_query`,
 *             `general_query`, `product_query`); o print mostra QUATRO —
 *             `order_query`, `general_query`, `product_query`, `shipping_query`.
 *             A chave `order_query` NÃO existe no original. As quatro do print
 *             são as da tela.
 *
 *   TEXTOS    `Atendimento Geral` e `Dúvida de Produto` têm, no material, o MESMO
 *             texto. Parece erro de cadastro, mas é o que os dois prints mostram —
 *             "corrigir" seria inventar. Fica como está.
 *
 * Ambas estão anotadas em `lib/whatsapp/demo.ts` e `lib/whatsapp/metrics.ts`.
 *
 * ================== O QUE NÃO MUDOU ==================
 *
 * A rota continua `/admin/whatsapp`, o item de menu o mesmo, e nada aqui conecta o
 * Neon — ver `lib/whatsapp/data.ts`.
 */
export default function Whatsapp_Page() {
  return <WhatsAppView />;
}
