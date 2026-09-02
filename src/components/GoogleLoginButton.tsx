import {useState, useEffect, useCallback} from 'react';
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
    if (isGoogleLoaded && window.google) {
      window.google.accounts.id.initialize({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        callback: handleGoogleLogin,
      });
    }
  }, [isGoogleLoaded, handleGoogleLogin]);

  const handleClick = () => {
    if (window.google) {
      window.google.accounts.id.signIn();
    }
  };

  return (
    <>
      <WalletLoadingScreen isLoading={isLoading} loadingText="Conectando com Google..." />
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
