import * as DialogPrimitive from '@radix-ui/react-dialog';
import useAppToast from '@/hooks/use-app-toast';

/**
 * "Sincronizar via CPF" ainda não existe — a B3 não oferece consulta de
 * custódia por CPF para terceiros hoje (ver `ConnectAccountModal.tsx`), só
 * para o próprio investidor logado no site dela. O CPF digitado aqui não é
 * enviado a lugar nenhum; o botão só abre este aviso.
 */
export function CpfSyncComingSoonModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const toast = useAppToast();

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          style={{position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(var(--rgb-deep),0.72)', backdropFilter: 'blur(6px)'}}
        />
        <div style={{position: 'fixed', inset: 0, zIndex: 201, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, pointerEvents: 'none'}}>
          <DialogPrimitive.Content
            aria-describedby="cpf-sync-coming-soon-description"
            style={{
              pointerEvents: 'auto',
              width: '100%',
              maxWidth: 420,
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 14,
              border: '1px solid var(--color-accent-700)',
              borderRadius: 8,
              background: 'linear-gradient(160deg, rgba(76,201,240,0.14) 0%, rgba(var(--rgb-surf-2),0.98) 46%), var(--surf-2)',
              boxShadow: 'var(--shadow-lg)',
              padding: '32px 28px',
              color: 'var(--color-text)',
              fontFamily: 'var(--font-body)',
            }}>
            <div
              aria-hidden
              style={{
                width: 56,
                height: 56,
                borderRadius: 8,
                background: 'linear-gradient(140deg, var(--cy), var(--pos))',
                display: 'grid',
                placeItems: 'center',
                boxShadow: '0 0 28px rgba(76,201,240,0.45)',
              }}>
              <i className="ph-fill ph-identification-card" style={{fontSize: 26, color: 'var(--sunk)'}} />
            </div>
            <div>
              <DialogPrimitive.Title
                style={{fontFamily: 'var(--font-heading)', fontSize: 18, fontWeight: 600, letterSpacing: '-0.01em', margin: 0}}>
                Sincronizar via CPF — em breve
              </DialogPrimitive.Title>
              <div
                id="cpf-sync-coming-soon-description"
                style={{fontSize: 12.5, color: 'var(--color-neutral-400)', marginTop: 8.4, lineHeight: 1.55}}>
                Estamos trabalhando para trazer a posição consolidada direto do seu CPF, sem precisar baixar e importar
                arquivo nenhum. Enquanto isso, a importação pela Área do Investidor da B3 traz os mesmos dados.
              </div>
            </div>
            <div style={{display: 'flex', gap: 8.4, marginTop: 4}}>
              <DialogPrimitive.Close
                className="hover:border-[color:var(--color-accent-400)] hover:text-[color:var(--color-neutral-100)]"
                style={{height: 34, padding: '0 14px', borderRadius: 8, border: '1px solid var(--hair)', background: 'transparent', color: 'var(--color-neutral-300)', fontFamily: 'var(--font-body)', fontSize: 12.5, cursor: 'pointer'}}>
                Fechar
              </DialogPrimitive.Close>
              <button
                type="button"
                onClick={() => {
                  toast.success('Anotado', 'Você será avisado assim que a sincronização via CPF for lançada.');
                  onOpenChange(false);
                }}
                className="hover:bg-[rgba(76,201,240,0.14)]"
                style={{height: 34, padding: '0 14px', borderRadius: 8, border: '1px solid var(--color-accent)', background: 'transparent', color: 'var(--color-accent-200)', fontFamily: 'var(--font-body)', fontSize: 12.5, fontWeight: 500, cursor: 'pointer'}}>
                Avise-me quando lançar
              </button>
            </div>
          </DialogPrimitive.Content>
        </div>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
