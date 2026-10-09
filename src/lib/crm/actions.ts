/**
 * As acoes que a coluna ACOES EXIBE — e as que ela nao tem.
 *
 * Mesmo padrao adotado em Pedidos (Fase 6): declarar a acao e marca-la
 * indisponivel, em vez de desenhar uma interface que a referencia nao tem.
 *
 * O QUE O MATERIAL SUSTENTA
 *
 *   adm-005  `Ver Perfil ›` na linha da cliente — a acao EXISTE visualmente
 *   adm-010  um icone de envelope — `mailto:` para o e-mail do lead
 *   adm-010  um icone de conversa — so aparece quando ha WhatsApp
 *
 * O QUE ELE NAO SUSTENTA
 *
 * O DESTINO de `Ver Perfil`. O original tem um `CustomerProfile` (perfil com
 * pedidos, wishlist e medidas) montado por um `useEffect` que consulta tres
 * tabelas — mas NENHUM dos prints do CRM mostra essa tela. Ela existe no codigo
 * de referencia e nao em imagem nenhuma.
 *
 * Por isso `Ver Perfil` fica DECLARADA e INDISPONIVEL: a linha tem a acao, como
 * no print, e ela nao abre uma tela inventada. Desenhar o perfil seria construir
 * a partir do codigo o que nunca foi visto — e o codigo de referencia tem varias
 * telas que nunca entraram em print.
 *
 * As duas acoes de lead SAO reais e nao precisam de permissao: `mailto:` e um
 * link de WhatsApp sao URLs, nao uma tela deste painel. As duas aparecem quando o
 * dado existe, exatamente como no original.
 */

/** Uma acao declarada que a tela mostra mas nao executa. */
export interface DeclaredAction {
  /** Rotulo exibido, igual ao print. */
  label: string;
  /**
   * `false` enquanto nao houver destino comprovado. A tela desenha a acao e
   * desabilita — ver o comentario de cada uma.
   */
  available: boolean;
  /** Por que esta indisponivel. Vai para o `title` do botao, para nao virar misterio. */
  reason: string;
}

/**
 * A unica acao de linha da aba Clientes.
 *
 * `available: false` porque o destino nao tem print. Se um dia o perfil entrar
 * como referencia, troca-se para `true` e a tela passa a navegar — a assinatura
 * nao muda.
 */
export const CUSTOMER_ACTIONS: DeclaredAction[] = [
  {
    label: 'Ver Perfil',
    available: false,
    reason: 'Sem referência visual: nenhum print mostra a tela de perfil da cliente.',
  },
];

/**
 * As acoes de linha da aba Leads.
 *
 * As duas sao URL, entao as duas funcionam. `available` fica `true` e o que
 * decide se aparecem e o dado: sem WhatsApp nao ha conversa para abrir, e o
 * original esconde o icone nesse caso (`{l.whatsapp && (...)}`).
 */
export const LEAD_ACTIONS: DeclaredAction[] = [
  {
    label: 'Enviar e-mail',
    available: true,
    reason: 'Abre o cliente de e-mail com o endereço do lead.',
  },
  {
    label: 'Conversar no WhatsApp',
    available: true,
    reason: 'Abre a conversa — só aparece quando o lead tem WhatsApp.',
  },
];

/**
 * A mensagem que o botao de WhatsApp do original ja pre-preenche.
 *
 * Ela e literal do codigo de referencia e cita a loja. A grafia fica a do
 * MATERIAL DE REFERENCIA e nao a do projeto: o CRM do original diz
 * "Closet Lunar", e o pedido de escopo proibe alterar arquivos de referencia
 * para acertar o nome. Reescrever a frase aqui para "Lunnar" seria nossa
 * invencao; copiar com o nome do original manteria um nome que nao e o da loja.
 *
 * Por isso a mensagem NAO e reescrita nem copiada: ela e montada com o nome que
 * o projeto ja usa no painel. O que se preserva e a INTENCAO da frase, nao as
 * palavras — e a diferenca esta declarada aqui em vez de escondida.
 */
export function whatsappLeadMessage(name: string): string {
  return `Olá ${name}, notamos seu interesse pela Closet Lunnar. Posso ajudar a finalizar sua compra?`;
}

/**
 * O link de conversa. `wa.me` com o numero so em digitos.
 *
 * Devolve `null` quando nao ha numero — e a tela usa esse `null` para esconder o
 * icone, que e o comportamento do original.
 */
export function whatsappLeadUrl(whatsapp: string | null, name: string): string | null {
  const digits = (whatsapp ?? '').replace(/\D/g, '');
  if (!digits) return null;
  return `https://wa.me/${digits}?text=${encodeURIComponent(whatsappLeadMessage(name))}`;
}

/** O `mailto:` do lead. `null` quando nao ha e-mail. */
export function mailtoLeadUrl(email: string | null): string | null {
  const clean = (email ?? '').trim();
  return clean ? `mailto:${clean}` : null;
}
