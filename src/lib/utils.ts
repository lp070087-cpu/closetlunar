import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Junta classes resolvendo conflitos do Tailwind. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Moeda brasileira. Numeros nulos viram zero, nunca "R$ NaN". */
export function formatBRL(value: number | null | undefined): string {
  const n = typeof value === 'number' && Number.isFinite(value) ? value : 0;
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

/** Numero com separador de milhar pt-BR. */
export function formatNumber(value: number | null | undefined): string {
  const n = typeof value === 'number' && Number.isFinite(value) ? value : 0;
  return n.toLocaleString('pt-BR');
}

/** Data curta: 16/06/2026. */
export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return '—';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('pt-BR');
}

/** Data e hora: 16/06/2026, 14:56:54. Usada na lista de pedidos. */
export function formatDateTime(value: string | Date | null | undefined): string {
  if (!value) return '—';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

/** Porcentagem inteira. */
export function formatPercent(value: number | null | undefined): string {
  const n = typeof value === 'number' && Number.isFinite(value) ? value : 0;
  return `${Math.round(n)}%`;
}

/**
 * Iniciais para avatar. Limita a 2 caracteres para nao quebrar o circulo.
 * O painel usa apenas a primeira letra do e-mail.
 */
export function initials(source: string | null | undefined, max = 2): string {
  const text = (source ?? '').trim();
  if (!text) return '?';
  const parts = text.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, max).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).slice(0, max).toUpperCase();
}

/** Primeira letra do e-mail, como no topbar do painel. */
export function avatarLetter(email: string | null | undefined): string {
  return (email?.trim()?.[0] ?? '?').toUpperCase();
}

/** Slug estavel para URLs e chaves de lista. */
export function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Trunca preservando palavra inteira quando possivel. */
export function truncate(value: string, max: number): string {
  if (value.length <= max) return value;
  const cut = value.slice(0, max);
  const lastSpace = cut.lastIndexOf(' ');
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
}

/** Opcoes de select no formato usado pelos formularios do painel. */
export interface SelectOption<T extends string = string> {
  value: T;
  label: string;
}
