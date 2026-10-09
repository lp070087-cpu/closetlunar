import type { LucideIcon } from 'lucide-react';
import { Activity, Database, Lock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  LAST_BACKUP_CARD,
  LOGIN_ATTEMPTS_CARD,
  SYSTEM_STATUS_CARD,
  loginAttemptsValue,
} from '@/lib/seguranca/metrics';

/**
 * Os três cartões do topo de Segurança & Backup (adm-086).
 *
 * ================== NÃO É O `StatCard` DO PROJETO ==================
 *
 * O `StatCard` do painel desenha o ícone num QUADRADO ARREDONDADO GRANDE à direita
 * (48px, com fundo). O print mostra o oposto: um ícone PEQUENO, solto, sem fundo,
 * e cada um numa COR diferente (verde, azul, roxo). Usar o `StatCard` pintaria
 * três quadrados que nenhum pixel mostra — por isso este cartão próprio.
 *
 * As cores vêm do print: verde no `Status do Sistema`, azul nas `Tentativas de
 * Login`, roxo no `Último Backup`. São cores de ÍCONE, não de estado — por isso
 * são passadas como classe, e não como tom semântico.
 */

function SecurityCard({
  label,
  icon: Icon,
  iconClassName,
  value,
  hint,
  badge,
}: {
  label: string;
  icon: LucideIcon;
  iconClassName: string;
  value: string;
  hint?: string;
  badge?: string;
}) {
  return (
    <div className="surface flex flex-col gap-3 p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <span className="text-sm font-semibold">{label}</span>
        <Icon className={cn('size-4 shrink-0', iconClassName)} aria-hidden />
      </div>
      <div className="font-serif text-3xl tracking-tight">{value}</div>
      {hint ? <p className="text-xs font-medium text-muted-foreground">{hint}</p> : null}
      {badge ? (
        <div>
          <Badge variant="outline" size="sm" className="normal-case tracking-normal">
            {badge}
          </Badge>
        </div>
      ) : null}
    </div>
  );
}

/** `Status do Sistema` — sempre `Protegido`, com o rabisco verde. */
export function SystemStatusCard() {
  return (
    <SecurityCard
      label={SYSTEM_STATUS_CARD.label}
      icon={Activity}
      iconClassName="text-success"
      value={SYSTEM_STATUS_CARD.value}
      hint={SYSTEM_STATUS_CARD.hint}
    />
  );
}

/** `Tentativas de Login` — o limite vindo do estado, com o cadeado azul. */
export function LoginAttemptsCard({ limit }: { limit: number }) {
  return (
    <SecurityCard
      label={LOGIN_ATTEMPTS_CARD.label}
      icon={Lock}
      iconClassName="text-[#3B82F6]"
      value={loginAttemptsValue(limit)}
      hint={LOGIN_ATTEMPTS_CARD.hint}
    />
  );
}

/**
 * `Último Backup` — a data do mais recente, ou `Pendente`. Com o banco de dados
 * roxo e o selo `Automático Diário`, que é o único lugar da tela com badge
 * CAIXA BAIXA (o `Badge` do projeto é versalete por padrão).
 */
export function LastBackupCard({ value, badge }: { value: string; badge: string }) {
  return (
    <SecurityCard
      label={LAST_BACKUP_CARD.label}
      icon={Database}
      iconClassName="text-[#A855F7]"
      value={value}
      badge={badge}
    />
  );
}
