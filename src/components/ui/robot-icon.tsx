import {cn} from '@/lib/utils';

// Ícone estático: sinaliza que o texto ao lado veio de um modelo. Sem
// animação — o papel é indicar origem, não performar.
export function RobotIcon({className}: {className?: string}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={cn('h-5 w-5', className)}>
      <rect
        x="4"
        y="7.5"
        width="16"
        height="12"
        rx="3.5"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path d="M12 4.5v3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="12" cy="3.6" r="1.2" fill="currentColor" />
      <circle cx="9.2" cy="12.6" r="1.35" fill="currentColor" />
      <circle cx="14.8" cy="12.6" r="1.35" fill="currentColor" />
      <path
        d="M9.5 16.2h5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M2.2 11.5v4M21.8 11.5v4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}
