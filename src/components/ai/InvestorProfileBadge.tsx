import {Pencil} from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {cn} from '@/lib/utils';
import {
  InvestorProfileResponse,
  SophisticationLevel,
} from '@/services/ai/investorProfile';

const SOPHISTICATION_LABEL: Record<SophisticationLevel, string> = {
  beginner: 'Iniciante',
  intermediate: 'Intermediário',
  experienced: 'Experiente',
};

const CONFIDENCE_THRESHOLD = 0.5;

export interface InvestorProfileBadgeProps {
  profile: InvestorProfileResponse | null;
  onOverride: (override: {sophistication?: SophisticationLevel}) => void;
}

export function InvestorProfileBadge({
  profile,
  onOverride,
}: InvestorProfileBadgeProps) {
  if (!profile) return null;

  const isSuggested = profile.confidence < CONFIDENCE_THRESHOLD;
  const label = `Perfil: ${SOPHISTICATION_LABEL[profile.sophistication]}${
    isSuggested ? ' (sugerido)' : ''
  }`;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border border-border/60 hover:bg-muted/10 transition-colors">
          {label}
          <Pencil className="h-3 w-3 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-56 space-y-1" align="end">
        <p className="text-xs font-bold text-muted-foreground px-2 pb-1">
          Ajustar perfil manualmente
        </p>
        {(Object.keys(SOPHISTICATION_LABEL) as SophisticationLevel[]).map(
          (level) => (
            <button
              key={level}
              type="button"
              onClick={() => onOverride({sophistication: level})}
              className={cn(
                'w-full text-left text-sm px-2 py-1.5 rounded-lg hover:bg-muted/10 transition-colors',
                profile.sophistication === level && 'font-bold text-primary',
              )}>
              {SOPHISTICATION_LABEL[level]}
            </button>
          ),
        )}
      </PopoverContent>
    </Popover>
  );
}
