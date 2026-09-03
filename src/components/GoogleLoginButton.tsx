import {useState, useEffect, useCallback, useRef} from 'react';
import {useNavigate} from 'react-router-dom';
import {Loader2} from '@/components/ui/icons';
import WalletLoadingScreen from '@/components/WalletLoadingScreen';
import AuthenticationService from '@/services/authentication';
import {useAppToast} from '@/hooks/use-app-toast';

interface GoogleLoginButtonProps {
  keepConnected?: boolean;
}

declare global {
  interface Window {
    google: any;
  }
}

export const GoogleLoginButton = ({keepConnected = false}: GoogleLoginButtonProps) => {
  const navigate = useNavigate();
  const {error: showError} = useAppToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoaded, setIsGoogleLoaded] = useState(false);
  const hiddenButtonRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => setIsGoogleLoaded(true);
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handleGoogleLogin = useCallback(
    async (response: any) => {
      setIsLoading(true);
      try {
        const idToken = response.credential;
        const result = await AuthenticationService.authenticateWithGoogle(idToken, keepConnected);

        if (!result || !result.success) {
          showError(
            'Erro ao entrar com Google',
            'Não foi possível concluir o login. Tente novamente.'
          );
          setIsLoading(false);
          return;
        }

        if (result.requires2FA) {
          navigate('/2fa-verify');
          return;
        }

        navigate('/dashboard');
      } catch (error: any) {
        showError(
          'Erro ao entrar com Google',
          error.message || 'Tente novamente mais tarde.'
        );
        setIsLoading(false);
      }
    },
    [keepConnected, navigate, showError]
  );

  useEffect(() => {
    if (isGoogleLoaded && window.google && hiddenButtonRef.current) {
      window.google.accounts.id.initialize({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        callback: handleGoogleLogin,
      });

      // O Google Identity Services não expõe um "signIn()" programático real
      // (accounts.id.signIn não existe na API; accounts.id.prompt() é o One
      // Tap automático, não confiável quando disparado por clique). A forma
      // suportada de abrir o fluxo a partir de um clique é o botão que o
      // próprio SDK renderiza — por isso ele é renderizado aqui, escondido, e
      // o botão visível (estilizado Nocturne) só encaminha o clique pra ele.
      window.google.accounts.id.renderButton(hiddenButtonRef.current, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
      });
    }
  }, [isGoogleLoaded, handleGoogleLogin]);

  const handleClick = () => {
    const realButton = hiddenButtonRef.current?.querySelector<HTMLElement>(
      'div[role="button"]'
    );
    if (realButton) {
      realButton.click();
      return;
    }
    showError(
      'Erro ao entrar com Google',
      'Não foi possível iniciar o login com Google. Recarregue a página e tente novamente.'
    );
  };

  return (
    <>
      <WalletLoadingScreen isLoading={isLoading} loadingText="Conectando com Google..." />
      {/* Botão real do Google, fora da vista mas clicável — é o único
          disparador confiável do fluxo OAuth (ver comentário acima). */}
      <div
        ref={hiddenButtonRef}
        aria-hidden="true"
        style={{position: 'absolute', width: 1, height: 1, overflow: 'hidden', opacity: 0, pointerEvents: 'none'}}
      />
      {!isGoogleLoaded ? (
        <button
          disabled
          style={{
            height: 40,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            border: '1px solid var(--hair)',
            borderRadius: 8,
            background: 'transparent',
            color: 'var(--color-neutral-400)',
            fontFamily: 'var(--font-body)',
            fontSize: 13,
            fontWeight: 500,
            cursor: 'not-allowed',
            opacity: 0.5,
          }}>
          <Loader2 className="h-4 w-4 animate-spin" />
          Carregando Google...
        </button>
      ) : (
        <button
          onClick={handleClick}
          disabled={isLoading}
          style={{
            height: 40,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            border: '1px solid var(--hair)',
            borderRadius: 8,
            background: 'transparent',
            color: 'var(--color-neutral-400)',
            fontFamily: 'var(--font-body)',
            fontSize: 13,
            fontWeight: 500,
            cursor: isLoading ? 'not-allowed' : 'pointer',
            opacity: isLoading ? 0.7 : 1,
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            if (!isLoading) {
              e.currentTarget.style.background = 'rgba(145,132,217,0.08)';
              e.currentTarget.style.borderColor = 'var(--ac)';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.borderColor = 'var(--hair)';
          }}>
          <i className="ph ph-google-logo" style={{fontSize: 15}} />
          Entrar com Google
        </button>
      )}
    </>
  );
};
