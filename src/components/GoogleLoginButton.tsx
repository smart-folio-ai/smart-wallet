import {useState, useEffect, useCallback} from 'react';
import {useNavigate} from 'react-router-dom';
import {Loader2} from 'lucide-react';
import {Button} from '@/components/ui/button';
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
  const {toast} = useAppToast();
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

        if (result.requiresTwoFactor) {
          sessionStorage.setItem('2fa_temp_token', result.tempToken);
          navigate('/2fa-verify');
          return;
        }

        localStorage.setItem('access_token', result.accessToken);
        localStorage.setItem('refresh_token', result.refreshToken);
        if (keepConnected) {
          localStorage.setItem('keepConnected', 'true');
        }
        window.dispatchEvent(new Event('auth:login'));
        navigate('/dashboard');
      } catch (error: any) {
        toast({
          title: 'Erro ao entrar com Google',
          description: error.message || 'Tente novamente mais tarde.',
          variant: 'destructive',
        });
        setIsLoading(false);
      }
    },
    [keepConnected, navigate, toast]
  );

  useEffect(() => {
    if (isGoogleLoaded && window.google) {
      window.google.accounts.id.initialize({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        callback: handleGoogleLogin,
      });

      window.google.accounts.id.renderButton(
        document.getElementById('google-signin-button'),
        {
          theme: 'outline',
          size: 'large',
          width: '100%',
          text: 'continue_with',
          locale: 'pt_BR',
        }
      );
    }
  }, [isGoogleLoaded, handleGoogleLogin]);

  return (
    <>
      <WalletLoadingScreen isLoading={isLoading} loadingText="Conectando com Google..." />
      <div className="relative w-full">
        <div id="google-signin-button" className="w-full" />
        {!isGoogleLoaded && (
          <Button variant="outline" className="w-full" disabled>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Carregando Google...
          </Button>
        )}
      </div>
    </>
  );
};
