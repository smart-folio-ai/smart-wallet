import {cn} from '@/lib/utils';

interface AppLogoProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'full' | 'icon';
  className?: string;
  tagline?: string;
}

const ICON_PX = {sm: 24, md: 28, lg: 34};
const TEXT_CLASS = {sm: 'text-base', md: 'text-lg', lg: 'text-2xl'};

/**
 * Único lugar que desenha a marca.
 *
 * O ícone é SVG inline, e não um arquivo: assim o anel de fundo usa
 * currentColor e acompanha o tema sozinho, sem precisar de uma versão para
 * fundo claro e outra para escuro, e sem uma requisição de imagem.
 *
 * A palavra "Trackerr" é texto de verdade, na fonte do app. O lockup em SVG
 * embute a fonte Space Grotesk, que não é carregada aqui — e um SVG dentro de
 * <img> não enxerga fontes do documento, então a palavra sairia diferente em
 * cada máquina. Como texto, ela também fica selecionável e legível por leitor
 * de tela, o que dispensa o alt.
 */
export function AppLogo({
  size = 'md',
  variant = 'full',
  className,
  tagline,
}: AppLogoProps) {
  const px = ICON_PX[size];

  const icone = (
    <svg
      width={px}
      height={px}
      viewBox="0 0 120 120"
      aria-hidden="true"
      focusable="false"
      className="shrink-0">
      <circle
        cx="60"
        cy="60"
        r="24"
        fill="none"
        stroke="currentColor"
        strokeOpacity="0.2"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <path
        d="M 60 22 A 38 38 0 0 1 98 60"
        fill="none"
        stroke="hsl(var(--brand))"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <circle cx="60" cy="60" r="7" fill="hsl(var(--brand))" />
    </svg>
  );

  if (variant === 'icon') {
    return <span className={cn('inline-flex', className)}>{icone}</span>;
  }

  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      {icone}
      <span className="flex flex-col leading-none">
        <span
          className={cn(
            'font-heading font-semibold tracking-tight',
            TEXT_CLASS[size],
          )}>
          Trackerr
        </span>
        {tagline ? (
          <span className="mt-1 text-[10px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
            {tagline}
          </span>
        ) : null}
      </span>
    </span>
  );
}

export default AppLogo;
