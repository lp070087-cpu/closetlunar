import type { Metadata } from 'next';
import { EmailsView } from '@/components/admin/emails/emails-view';

export const metadata: Metadata = {
  title: 'E-mails',
};

/**
 * `/admin/emails` — reconstruída de adm-072 e adm-073.
 *
 * A PÁGINA É UM COMPONENTE DE SERVIDOR e só monta a tela; o estado (modelos,
 * identidade, histórico, o modelo em edição e o aviso de salvamento) vive em
 * `EmailsView`.
 *
 * ================== AS DUAS CAPTURAS SÃO A MESMA PÁGINA ==================
 *
 * O placeholder registrava `adm-072 e adm-073` e listava três blocos — "E-mails
 * Transacionais", "Edição" e "Disparo" — como se fossem partes de uma tela que
 * ainda seria construída. A leitura das duas capturas mostra outra coisa:
 *
 *   adm-072 (2026-09-28 000025)   o TOPO — header, os seis cards a partir de
 *                                 `Cart Recovery` até `Payment Approved` cortado,
 *                                 e o painel `Identidade Visual` com o
 *                                 `Envios Recentes` vazio;
 *   adm-073 (2026-09-28 000032)   a MESMA tela ROLADA — `Welcome` aparece no fim
 *                                 da lista, e o `Envios Recentes` segue vazio.
 *
 * NÃO há segunda tela. A "Edição" do placeholder não tem captura: nenhum print
 * abre o editor de um modelo. O editor existe no código original (`EmailsAdmin`)
 * e foi reconstruído pela estrutura dele — está anotado em `template-editor.tsx`.
 * O "Disparo" do placeholder não existe em lugar nenhum: nem no print, nem no
 * original. Foi removido em vez de inventado.
 *
 * ================== A FAIXA DE PRINTS ESTAVA CERTA AQUI ==================
 *
 * `adm-072 e adm-073` está CORRETO — são dois prints, e a conjunção "e" é a
 * certa. (O defeito de `references` que apareceu em Favoritos, Busca e WhatsApp
 * era a faixa ERRADA; aqui ela acertou.)
 *
 * ================== O QUE NÃO MUDOU ==================
 *
 * A rota continua `/admin/emails`, o item de menu o mesmo, e nada aqui conecta o
 * Neon — ver `lib/emails/data.ts`.
 */
export default function Emails_Page() {
  return <EmailsView />;
}
