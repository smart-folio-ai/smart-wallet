/**
 * Cartão de teaser do DARF automático.
 *
 * PARA REMOVER: apague este arquivo e as duas linhas correspondentes em
 * `web/src/pages/Fiscal.tsx` (o import e o `<DarfComingSoonCard />`).
 * Não há dependência nova, estilo global nem entrada em config — tudo o que
 * este recurso toca está contido aqui.
 */
import {Sparkles} from 'lucide-react';
import {Badge} from '@/components/ui/badge';
import {Button} from '@/components/ui/button';
import {Card, CardContent} from '@/components/ui/card';
import useAppToast from '@/hooks/use-app-toast';

const STYLE_ID = 'darf-teaser-style';

const teaserStyles = `
@keyframes darf-teaser-sweep {
  0%   { transform: translateX(-120%); }
  100% { transform: translateX(220%); }
}
.darf-teaser-sweep {
  animation: darf-teaser-sweep 3.6s ease-in-out infinite;
}
@media (prefers-reduced-motion: reduce) {
  .darf-teaser-sweep { animation: none; opacity: 0; }
}
`;

interface DarfComingSoonCardProps {
  /** Chamado quando o usuário demonstra interesse. Útil para medir demanda. */
  onInterest?: () => void;
}

export default function DarfComingSoonCard({
  onInterest,
}: DarfComingSoonCardProps) {
  const toast = useAppToast();

  const handleInterest = () => {
    onInterest?.();
    toast.success(
      'Avisaremos você',
      'Você receberá um aviso assim que a emissão de DARF estiver disponível.'
    );
  };

  return (
    <>
      <style id={STYLE_ID}>{teaserStyles}</style>

      <Card className="relative overflow-hidden rounded-2xl border-primary/25 bg-gradient-to-br from-primary/10 via-card to-card shadow-2xl shadow-primary/10">
        {/* brilho que atravessa o cartão */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-0 w-1/3 skew-x-12 bg-gradient-to-r from-transparent via-primary/15 to-transparent darf-teaser-sweep"
        />

        <CardContent className="relative flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary ring-1 ring-primary/25">
              <Sparkles className="h-5 w-5" />
            </div>

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-lg font-semibold leading-none">
                  DARF automático
                </h3>
                <Badge className="border-primary/30 bg-primary/15 text-primary hover:bg-primary/20">
                  Em breve
                </Badge>
              </div>

              <p className="max-w-prose text-sm text-muted-foreground">
                Guia mensal com código de receita, vencimento e encargos já
                calculados — pronta para pagamento, sem planilha e sem
                adivinhação.
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            className="shrink-0 border-primary/30 text-primary hover:bg-primary/10 hover:text-primary"
            onClick={handleInterest}>
            Quero ser avisado
          </Button>
        </CardContent>
      </Card>
    </>
  );
}
