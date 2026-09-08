import React, {useState} from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import {Checkbox} from '@/components/ui/checkbox';
import {
  AlertTriangle,
  Check,
  Copy,
  Download,
  KeyRound,
} from '@/components/ui/icons';
import useAppToast from '@/hooks/use-app-toast';
import {copyRecoveryCodes, downloadRecoveryCodes} from '@/utils/recovery-codes';

export interface RecoveryCodesDialogProps {
  open: boolean;
  codes: string[];
  generatedAt: string;
  /** `true` quando substitui uma lista anterior, que deixa de valer agora. */
  isRegeneration?: boolean;
  /** Só é chamado pelo botão de confirmação, depois do aceite explícito. */
  onAcknowledge: () => void;
}

const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 60,
  background: 'rgba(6,8,15,0.82)',
  backdropFilter: 'blur(2px)',
};

const contentStyle: React.CSSProperties = {
  position: 'fixed',
  left: '50%',
  top: '50%',
  transform: 'translate(-50%, -50%)',
  zIndex: 61,
  width: 'calc(100vw - 32px)',
  maxWidth: 520,
  maxHeight: 'calc(100vh - 48px)',
  overflowY: 'auto',
  border: '1px solid var(--hair)',
  borderRadius: 14,
  background: 'var(--nk-card)',
  boxShadow: 'var(--shadow-lg, 0 24px 64px rgba(0,0,0,0.45))',
  padding: 24,
  display: 'flex',
  flexDirection: 'column',
  gap: 18,
  boxSizing: 'border-box',
};

const secondaryButtonStyle: React.CSSProperties = {
  flex: 1,
  height: 38,
  borderRadius: 8,
  border: '1px solid var(--hair)',
  background: 'transparent',
  color: 'var(--color-neutral-200, inherit)',
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 6,
};

/**
 * Tela de exibição única dos códigos de recuperação.
 *
 * Não é fechável por backdrop, Escape ou botão "X": a única saída é marcar o
 * aceite e confirmar. Se o usuário sair sem guardar, os códigos somem para
 * sempre — o backend não os devolve em nenhuma outra rota.
 */
export function RecoveryCodesDialog({
  open,
  codes,
  generatedAt,
  isRegeneration = false,
  onAcknowledge,
}: RecoveryCodesDialogProps) {
  const toast = useAppToast();
  const [acknowledged, setAcknowledged] = useState(false);
  const [copied, setCopied] = useState(false);

  const preventDismiss = (event: {preventDefault: () => void}) =>
    event.preventDefault();

  const handleCopy = async () => {
    try {
      await copyRecoveryCodes(codes);
      setCopied(true);
      toast.success(
        'Códigos copiados',
        'Cole em seu gerenciador de senhas antes de fechar esta tela.',
      );
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error(
        'Não foi possível copiar',
        'Baixe o arquivo .txt ou anote os códigos manualmente.',
      );
    }
  };

  const handleDownload = () => {
    try {
      downloadRecoveryCodes(codes, generatedAt);
      toast.success(
        'Arquivo gerado',
        'Guarde o .txt em um local seguro, como faria com uma senha.',
      );
    } catch {
      toast.error(
        'Não foi possível baixar',
        'Copie os códigos ou anote-os manualmente antes de sair.',
      );
    }
  };

  return (
    <DialogPrimitive.Root open={open}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay style={overlayStyle} />
        <DialogPrimitive.Content
          style={contentStyle}
          // Sem fechar sem querer: nem Escape, nem clique fora, nem foco fora.
          onEscapeKeyDown={preventDismiss}
          onPointerDownOutside={preventDismiss}
          onInteractOutside={preventDismiss}>
          <div style={{display: 'flex', alignItems: 'flex-start', gap: 12}}>
            <span
              aria-hidden
              style={{
                width: 40,
                height: 40,
                flexShrink: 0,
                borderRadius: 10,
                background: 'rgba(145,132,217,0.15)',
                display: 'grid',
                placeItems: 'center',
              }}>
              <KeyRound
                className="h-5 w-5"
                style={{color: 'var(--ac)'} as React.CSSProperties}
              />
            </span>
            <div>
              <DialogPrimitive.Title
                style={{
                  fontSize: 17,
                  fontWeight: 700,
                  fontFamily: 'var(--font-heading)',
                  margin: 0,
                }}>
                Seus códigos de recuperação
              </DialogPrimitive.Title>
              <DialogPrimitive.Description
                style={{
                  fontSize: 13,
                  color: 'var(--color-neutral-400)',
                  margin: '6px 0 0',
                  lineHeight: 1.5,
                }}>
                Use um destes códigos para entrar se perder o acesso ao seu
                aplicativo autenticador. Cada código funciona{' '}
                <strong>uma única vez</strong>.
              </DialogPrimitive.Description>
            </div>
          </div>

          {/* Aviso de exibição única — o ponto mais importante da tela */}
          <div
            role="alert"
            style={{
              display: 'flex',
              gap: 10,
              padding: 12,
              borderRadius: 10,
              background: 'var(--badge-neg-bg)',
              border: '1px solid var(--neg)',
            }}>
            <AlertTriangle
              aria-hidden
              className="h-4 w-4"
              style={{
                color: 'var(--neg)',
                flexShrink: 0,
                marginTop: 2,
              } as React.CSSProperties}
            />
            <div style={{fontSize: 12.5, lineHeight: 1.5}}>
              <strong style={{color: 'var(--neg)'}}>
                Esta é a única vez que mostramos estes códigos.
              </strong>{' '}
              Ao fechar esta tela eles não poderão ser recuperados — nem por
              você, nem pelo suporte. Trate-os como sua senha: quem tiver estes
              códigos entra na sua conta.
              {isRegeneration && (
                <>
                  {' '}
                  <strong>
                    Os códigos gerados anteriormente deixaram de funcionar agora.
                  </strong>
                </>
              )}
            </div>
          </div>

          {/* Os códigos */}
          <ul
            aria-label="Códigos de recuperação"
            style={{
              listStyle: 'none',
              margin: 0,
              padding: 14,
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
              gap: 8,
              borderRadius: 10,
              background: 'var(--surf-3)',
              border: '1px solid var(--hair)',
            }}>
            {codes.map((code) => (
              <li
                key={code}
                style={{
                  fontFamily: 'monospace',
                  fontSize: 14.5,
                  letterSpacing: '0.06em',
                  textAlign: 'center',
                  padding: '7px 4px',
                  borderRadius: 6,
                  background: 'var(--sunk)',
                  userSelect: 'all',
                }}>
                {code}
              </li>
            ))}
          </ul>

          <div style={{display: 'flex', gap: 8}}>
            <button type="button" onClick={handleCopy} style={secondaryButtonStyle}>
              {copied ? (
                <Check
                  aria-hidden
                  className="h-4 w-4"
                  style={{color: 'var(--pos)'} as React.CSSProperties}
                />
              ) : (
                <Copy aria-hidden className="h-4 w-4" />
              )}
              {copied ? 'Copiado' : 'Copiar todos'}
            </button>
            <button
              type="button"
              onClick={handleDownload}
              style={secondaryButtonStyle}>
              <Download aria-hidden className="h-4 w-4" />
              Baixar .txt
            </button>
          </div>

          <label
            htmlFor="recovery-codes-ack"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '12px 14px',
              borderRadius: 10,
              border: '1px solid var(--hair)',
              background: 'var(--surf-3)',
              cursor: 'pointer',
              fontSize: 13,
              lineHeight: 1.45,
            }}>
            <Checkbox
              id="recovery-codes-ack"
              checked={acknowledged}
              onCheckedChange={(checked) => setAcknowledged(checked === true)}
              className="data-[state=checked]:bg-[var(--ac)] data-[state=checked]:border-[var(--ac)]"
            />
            Guardei meus códigos em local seguro
          </label>

          <button
            type="button"
            onClick={onAcknowledge}
            disabled={!acknowledged}
            style={{
              height: 44,
              borderRadius: 8,
              border: 'none',
              background: acknowledged ? 'var(--grad-violet)' : 'var(--surf-3)',
              color: acknowledged ? '#fff' : 'var(--color-neutral-500)',
              fontSize: 14,
              fontWeight: 600,
              cursor: acknowledged ? 'pointer' : 'not-allowed',
            }}>
            Concluir
          </button>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

export default RecoveryCodesDialog;
