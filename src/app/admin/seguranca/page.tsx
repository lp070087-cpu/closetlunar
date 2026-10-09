import type { Metadata } from 'next';
import { SegurancaView } from '@/components/admin/seguranca/seguranca-view';

export const metadata: Metadata = { title: 'Segurança & Backup' };

/**
 * `/admin/seguranca` — reconstruída de adm-086.
 *
 * A PÁGINA É UM COMPONENTE DE SERVIDOR e só monta a tela; o estado (os logs, os
 * backups e o limite de tentativas) vive em `SegurancaView`.
 *
 * ================== A FAIXA DE PRINTS ESTAVA ERRADA ==================
 *
 * O placeholder registrava `adm-087`. Segurança & Backup é **adm-086**
 * (2026-09-28 000247); `adm-087` é Abrir Loja. É o mesmo deslize de faixa já
 * corrigido em `seo` (dizia adm-083 a adm-084) e `usuarios` (dizia adm-085 a
 * adm-086) — o placeholder foi escrito deslocado e nunca conferido contra o
 * MAPA-ADMIN.
 *
 * ================== O QUE O PLACEHOLDER PROMETIA ==================
 *
 *   "Sessões ativas"       NÃO existe. Nenhum print mostra lista de sessões,
 *                          dispositivo, local ou encerramento remoto.
 *   "Backup"               existe, mas é BOTÃO — `Executar Backup Agora` no
 *                          cabeçalho — mais o cartão `Último Backup`, um selo e
 *                          a tabela `Histórico de Backups`. Não há tela de
 *                          configuração de backup.
 *   "Histórico"            existe, e é a tabela `Logs de Auditoria Recentes`. O
 *                          placeholder dizia "acessos e alterações relevantes";
 *                          o que se registra são ENTRADAS E SAÍDAS — `Login de
 *                          cliente`, `Login administrativo realizado`, `Logout
 *                          de cliente`. Não há tipo de ação além dessas.
 *
 * ================== O QUE NÃO MUDOU ==================
 *
 * A rota continua `/admin/seguranca` e o item de menu o mesmo. Nada aqui conecta
 * o Neon — ver `lib/seguranca/data.ts`.
 */
export default function Seguranca_Page() {
  return <SegurancaView />;
}
