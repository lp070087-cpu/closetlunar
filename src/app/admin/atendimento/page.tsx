import type { Metadata } from 'next';
import { AtendimentoView } from '@/components/admin/atendimento/atendimento-view';

export const metadata: Metadata = {
  title: 'Atendimento',
};

/**
 * `/admin/atendimento` — reconstruída de adm-074.
 *
 * A PÁGINA É UM COMPONENTE DE SERVIDOR e só monta a tela; o estado (a fila, o
 * filtro, o atendimento aberto e o aviso de escrita) vive em `AtendimentoView`.
 *
 * ================== O PLACEHOLDER PROMETIA MAIS DO QUE O PRINT MOSTRA ==================
 *
 * O `ModulePage` listava três blocos: "Indicadores", "Filtro por status" e "Lista
 * de atendimentos" — este último com "Cliente, canal, assunto, responsável e tempo
 * de espera". O print adm-074 mostra os DOIS primeiros exatamente como descritos, e
 * o terceiro VAZIO. Dos cinco campos prometidos, só `Cliente` e o texto da mensagem
 * têm lastro — `canal`, `assunto`, `responsável` e `tempo de espera` não aparecem em
 * captura nenhuma e NÃO foram inventados.
 *
 * ================== A FAIXA DE PRINTS ==================
 *
 * `references="adm-074"` estava CERTO — é um print só, e é este.
 *
 * ================== O AVISO DE TABELA FALTANDO NÃO VEIO ==================
 *
 * O original mostrava `Módulo de atendimento ainda não está disponível.` quando o
 * Supabase recusava a tabela. Aqui não existe Supabase e a demonstração é vazia por
 * decisão; o estado vazio legítimo é o do print. Quando o Neon entrar, uma falha de
 * leitura vira erro de verdade — não este texto.
 */
export default function Atendimento_Page() {
  return <AtendimentoView />;
}
