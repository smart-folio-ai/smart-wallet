import {cn} from '@/lib/utils';

interface GridBackdropProps {
  className?: string;
}

/**
 * Malha de fundo decorativa. As linhas vêm de um gradiente repetido e a
 * máscara radial faz o grid sumir nas bordas, evitando a borda dura.
 */
export function GridBackdrop({className}: GridBackdropProps) {
  return (
    <div
      aria-hidden="true"
      className={cn('pointer-events-none absolute inset-0', className)}
      style={{
        backgroundImage:
          'linear-gradient(to right, hsl(var(--surface-hairline) / 0.04) 1px, transparent 1px), linear-gradient(to bottom, hsl(var(--surface-hairline) / 0.04) 1px, transparent 1px)',
        backgroundSize: '64px 64px',
        maskImage:
          'radial-gradient(ellipse 70% 60% at 50% 30%, black 0%, transparent 100%)',
        WebkitMaskImage:
          'radial-gradient(ellipse 70% 60% at 50% 30%, black 0%, transparent 100%)',
      }}
    />
  );
}

export default GridBackdrop;
