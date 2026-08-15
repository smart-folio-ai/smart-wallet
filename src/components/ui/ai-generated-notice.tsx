import {cn} from '@/lib/utils';

// Uma frase, um lugar. Repetida em quatro telas ela divergiria com o tempo,
// e versões diferentes de um aviso de transparência sugerem que significam
// coisas diferentes.
export const AI_GENERATED_NOTICE_TEXT =
  'Esse texto foi gerado com o auxílio de inteligência artificial.';

export function AiGeneratedNotice({className}: {className?: string}) {
  return (
    <p className={cn('text-[11px] leading-relaxed text-muted-foreground/70', className)}>
      {AI_GENERATED_NOTICE_TEXT}
    </p>
  );
}
