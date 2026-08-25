import {cva, type VariantProps} from 'class-variance-authority';
import {cn} from '@/lib/utils';

/**
 * ALTA/MÉDIA/BAIXA — o vocabulário de severidade que a Trackerr IA já usa
 * (radar anti-erro, otimizador fiscal). Reaproveita os tokens semânticos
 * existentes (--destructive/--warning/--success) em vez de inventar cores
 * novas: severidade de insight e "ação perigosa" já significam vermelho
 * pelo mesmo motivo — chamar atenção — então compartilhar o tom é
 * intencional, não coincidência.
 */
const severityVariants = cva(
  'inline-flex shrink-0 items-center rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide',
  {
    variants: {
      severity: {
        alta: 'bg-destructive/15 text-destructive',
        media: 'bg-warning/15 text-warning',
        baixa: 'bg-success/15 text-success',
      },
    },
    defaultVariants: {
      severity: 'media',
    },
  }
);

const SEVERITY_LABEL: Record<'alta' | 'media' | 'baixa', string> = {
  alta: 'Alta',
  media: 'Média',
  baixa: 'Baixa',
};

interface SeverityBadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof severityVariants> {}

export function SeverityBadge({
  severity = 'media',
  className,
  ...props
}: SeverityBadgeProps) {
  return (
    <span
      className={cn(severityVariants({severity}), className)}
      {...props}>
      {SEVERITY_LABEL[severity ?? 'media']}
    </span>
  );
}

export default SeverityBadge;
