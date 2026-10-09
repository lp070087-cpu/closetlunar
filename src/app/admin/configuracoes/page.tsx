import type { Metadata } from 'next';
import { ConfiguracoesView } from '@/components/admin/configuracoes/configuracoes-view';

export const metadata: Metadata = { title: 'Configurações' };

/**
 * `/admin/configuracoes` — reconstruída de adm-075 a adm-083.
 *
 * A PÁGINA É UM COMPONENTE DE SERVIDOR e só monta a tela; o estado (as quatro
 * abas, as zonas de entrega, a configuração do Melhor Envio, a conexão OAuth e as
 * credenciais de pagamento) vive em `ConfiguracoesView`.
 *
 * ================== A FAIXA DE PRINTS ESTAVA ERRADA ==================
 *
 * O placeholder registrava `adm-075 a adm-078` — quatro prints. A faixa correta é
 * `adm-075 a adm-083`, nove prints, e eles cobrem as QUATRO abas:
 *
 *   adm-075 (000052)  Entrega própria — Jaboatão e Olinda, topo
 *   adm-076..078      Entrega própria rolada (Olinda, Paulista, Recife)
 *   adm-079 (000130)  Recife, fim da lista
 *   adm-080 (000139)  Melhor Envio — cartão com os campos e os botões
 *   adm-081 (000144)  Melhor Envio — a mesma seção, outra rolagem
 *   adm-082 (000212)  Integração transportadoras — MESMA seção, pílula diferente
 *   adm-083 (000223)  Pagamentos — InfinitePay
 *
 * ================== O QUE O PLACEHOLDER DIZIA E NÃO SE CONFIRMOU ==================
 *
 * O placeholder descrevia o bloco `Melhor Envio` como "Client ID, secret, redirect
 * e ambiente de integração". O print mostra SETE campos (Client ID, Client Secret,
 * CEP de origem, Nome do remetente, Documento, Telefone e Endereço de origem) e um
 * par de checkboxes (`Sandbox`/`Ativo`) — não há "redirect" nenhum, o que existe é
 * a `Callback URL` (que a loja registra no Melhor Envio, não configura aqui). O
 * placeholder também prometia "Seleção do provedor" em `Integração`, o que de fato
 * aparece — mas na MESMA tela do Melhor Envio, não numa quinta tela.
 *
 * ================== O QUE NÃO MUDOU ==================
 *
 * A rota continua `/admin/configuracoes`, o item de menu o mesmo, e nada aqui
 * conecta o Neon — ver `lib/configuracoes/data.ts`.
 */
export default function Configuracoes_Page() {
  return <ConfiguracoesView />;
}
