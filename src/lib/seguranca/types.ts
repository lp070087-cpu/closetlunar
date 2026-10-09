/**
 * Os tipos de Segurança & Backup — reconstruídos de adm-086.
 *
 * O original (`src/components/admin/SecurityPanel.tsx`) lê TRÊS fontes: `audit_logs`
 * (10 últimos), `backups` (5 últimos) e `security_config` (chave/valor). Só as duas
 * primeiras aparecem como lista no print; a terceira alimenta UMA palavra do cartão
 * do meio — o limite de tentativas de login.
 *
 * NADA aqui além disso existe. Não há sessões ativas, endereço de IP, dispositivo,
 * usuário ou duração; o painel não desenha nenhum desses campos.
 *
 * ================== A DATA VIAJA CRUA, A TELA É QUE FORMATA ==================
 *
 * Os dois tipos guardam `createdAt` como o banco devolve — um instante ISO, não um
 * texto pronto. A formatação mora em `metrics.ts`, que é onde ela pode ser provada.
 * Se a demonstração já trouxesse `27/09/2026, 23:26:00` escrito à mão, a conversão
 * de fuso nunca seria exercitada e uma data errada entraria no Neon sem ninguém ver.
 */

/** Uma linha de log de auditoria. O print mostra 10 destas. */
export interface AuditLogRow {
  id: string;
  /** A ação, por extenso: `Login de cliente`, `Login administrativo realizado`, `Logout de cliente`. */
  action: string;
  /** O instante, como o banco devolve. */
  createdAt: string;
}

/** Uma linha do histórico de backups. O print mostra a tabela vazia. */
export interface BackupRow {
  id: string;
  /** `automatico` | `manual` — o original escreve em minúscula e exibe capitalizado. */
  type: string;
  /** `completed` | `pending` | qualquer outra coisa = falha, como o original. */
  status: string;
  /** O instante, como o banco devolve. */
  createdAt: string;
}

/**
 * O que vem de `security_config` — e SÓ isso.
 *
 * O limite de tentativas de login é o único valor que o painel lê dessa tabela.
 * O `5` de fallback mora em `metrics.ts` (`DEFAULT_LOGIN_ATTEMPT_LIMIT`), porque
 * é regra de exibição, não dado; e o selo `Automático Diário` também é tela.
 */
export interface SecurityState {
  /** O limite de tentativas de login. O original usa 5 quando a configuração está vazia. */
  loginAttemptLimit: number;
}
