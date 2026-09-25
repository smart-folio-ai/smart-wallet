import {Switch} from '@/components/ui/switch';
import {Label} from '@/components/ui/label';
import {Loader2} from '@/components/ui/icons';
import {cn} from '@/lib/utils';
import {
  usePortfolioDigestPreference,
  useSavePortfolioDigestPreference,
} from '@/hooks/usePortfolioDigest';

/**
 * Resumo semanal de carteira por e-mail (TRA-202).
 *
 * Não existia NENHUM jeito de ligar essa preferência antes deste toggle —
 * só o link de descadastro no rodapé do próprio e-mail. Layout segue o
 * mesmo padrão do `PushNotificationToggle` (rótulo + descrição + Switch),
 * que também não está no handoff.
 */
export function PortfolioDigestToggle() {
  const {data: enabled, isLoading} = usePortfolioDigestPreference();
  const save = useSavePortfolioDigestPreference();

  // Enquanto salva, mostra o valor pedido em vez de esperar o refetch.
  const checked = save.isPending ? save.variables : (enabled ?? false);
  const disabled = isLoading || save.isPending;

  return (
    <div data-testid="portfolio-digest-toggle">
      <div className="flex items-center justify-between">
        <div className="pr-4">
          <Label
            htmlFor="portfolio-digest"
            className={cn(
              'text-[12.5px] font-normal text-[color:var(--color-neutral-200)]',
              disabled && 'opacity-70',
            )}>
            Resumo semanal da carteira
          </Label>
          <p className="mt-0.5 text-[10.5px] leading-snug text-[color:var(--color-neutral-600)]">
            Toda segunda de manhã, um e-mail com o que mudou na sua carteira na
            semana.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {save.isPending ? (
            <Loader2
              data-testid="portfolio-digest-toggle-spinner"
              aria-hidden="true"
              className="h-4 w-4 animate-spin text-muted-foreground"
            />
          ) : null}
          <Switch
            id="portfolio-digest"
            checked={checked}
            disabled={disabled}
            onCheckedChange={(next) => save.mutate(next)}
          />
        </div>
      </div>

      {save.isError ? (
        <p role="alert" className="mt-2 text-[12px] leading-snug text-destructive">
          Não foi possível salvar sua preferência de resumo semanal.
        </p>
      ) : null}
    </div>
  );
}

export default PortfolioDigestToggle;
