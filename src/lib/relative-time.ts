import {format} from 'date-fns';
import {ptBR} from 'date-fns/locale';

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;

/**
 * TRA-136 — tempo relativo compacto em pt-BR ("agora", "há 5 min", "há 2 h",
 * "há 3 d"). Acima de uma semana cai para data absoluta curta, que lê melhor
 * do que "há 43 d".
 */
export function formatRelativeTime(
  iso: string,
  now: number = Date.now(),
): string {
  const timestamp = new Date(iso).getTime();
  if (Number.isNaN(timestamp)) return '';

  const diff = now - timestamp;
  if (diff < MINUTE) return 'agora';
  if (diff < HOUR) return `há ${Math.floor(diff / MINUTE)} min`;
  if (diff < DAY) return `há ${Math.floor(diff / HOUR)} h`;
  if (diff < WEEK) return `há ${Math.floor(diff / DAY)} d`;

  return format(new Date(timestamp), "d 'de' MMM", {locale: ptBR});
}
