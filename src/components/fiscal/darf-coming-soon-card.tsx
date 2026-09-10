// Ícone vem do barrel, não de `lucide-react`: o projeto migrou para
// @phosphor-icons/react e `src/components/ui/icons.tsx` é a camada de
// compatibilidade que preserva os nomes antigos. Importar o pacote direto
// reintroduz uma dependência que foi removida de propósito.
import {Sparkles} from '@/components/ui/icons';
import useAppToast from '@/hooks/use-app-toast';

/**
 * Teaser do DARF automático na página fiscal (TRA-99).
 *
 * Existe para medir interesse antes de comprometer as semanas que a emissão
 * real custaria. A emissão foi deliberadamente adiada: o código de barras de
 * arrecadação carrega uma referência emitida pela Receita, e gerá-la localmente
 * produz pagamento sem conciliação — ver TRA-93.
 *
 * PARA REMOVER: apague este arquivo e as duas linhas marcadas com
 * `TEASER DARF` em `src/pages/Fiscal.tsx` (o import e o `<DarfComingSoonCard />`).
 * Sem dependência nova, sem estilo global, sem entrada em config — o keyframe
 * da animação vive aqui dentro e some junto com o arquivo.
 */

const teaserStyles = `
@keyframes darf-teaser-sweep {
  0%   { transform: translateX(-140%); }
  100% { transform: translateX(320%); }
}
.darf-teaser-sweep { animation: darf-teaser-sweep 4s ease-in-out infinite; }
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
      'Você recebe um aviso assim que a emissão de DARF estiver disponível.',
    );
  };

  return (
    <>
      <style>{teaserStyles}</style>

      <div
        style={{
          position: 'relative',
          overflow: 'hidden',
          border: '1px solid var(--hair)',
          borderRadius: 12,
          background:
            'linear-gradient(135deg, rgba(139,92,246,0.12) 0%, var(--nk-card) 62%)',
          padding: 24,
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 20,
        }}>
        {/* brilho que atravessa o cartão */}
        <div
          aria-hidden="true"
          className="darf-teaser-sweep"
          style={{
            position: 'absolute',
            insetBlock: 0,
            left: 0,
            width: '28%',
            transform: 'skewX(-12deg)',
            background:
              'linear-gradient(90deg, transparent, rgba(139,92,246,0.16), transparent)',
            pointerEvents: 'none',
          }}
        />

        <div
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'flex-start',
            gap: 16,
            minWidth: 260,
            flex: '1 1 320px',
          }}>
          <div
            style={{
              flexShrink: 0,
              width: 42,
              height: 42,
              borderRadius: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(139,92,246,0.16)',
              border: '1px solid rgba(139,92,246,0.28)',
            }}>
            <Sparkles className="h-[19px] w-[19px]" />
          </div>

          <div style={{display: 'flex', flexDirection: 'column', gap: 6}}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 10,
              }}>
              <span
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: 15,
                  fontWeight: 600,
                }}>
                DARF automático
              </span>
              <span
                style={{
                  fontSize: 10.5,
                  fontWeight: 600,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  padding: '3px 8px',
                  borderRadius: 5,
                  background: 'rgba(139,92,246,0.18)',
                  border: '1px solid rgba(139,92,246,0.3)',
                  whiteSpace: 'nowrap',
                }}>
                Em breve
              </span>
            </div>

            <p
              style={{
                margin: 0,
                fontSize: 13,
                lineHeight: 1.55,
                color: 'var(--color-neutral-500)',
                maxWidth: '52ch',
              }}>
              Guia mensal com código de receita, vencimento e encargos já
              calculados — pronta para pagar, sem planilha e sem adivinhação.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleInterest}
          style={{
            position: 'relative',
            height: 38,
            padding: '0 18px',
            borderRadius: 8,
            border: '1px solid rgba(139,92,246,0.35)',
            background: 'transparent',
            fontSize: 13,
            fontWeight: 500,
            cursor: 'pointer',
            color: 'inherit',
            flexShrink: 0,
          }}>
          Quero ser avisado
        </button>
      </div>
    </>
  );
}
