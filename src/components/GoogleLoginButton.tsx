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
  const containerRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

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
    if (!isGoogleLoaded || !window.google || !overlayRef.current || !containerRef.current) {
      return;
    }

    window.google.accounts.id.initialize({
      client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
      callback: handleGoogleLogin,
    });

    // O Google Identity Services não expõe estilização própria além de
    // theme/size/shape, e o botão que ele desenha é um <iframe> de
    // accounts.google.com — não um <div role="button"> no DOM da página.
    // Um clique sintético nunca alcança conteúdo cross-origin dentro de um
    // iframe (é a mesma barreira que o Same-Origin Policy impõe a
    // postMessage/DOM); tentar `querySelector('div[role="button"]').click()`
    // nunca encontra nada e é isso que fazia TODO clique em "Entrar com
    // Google" cair no fallback de erro.
    //
    // A saída suportada é a técnica de overlay: desenhar o botão oficial do
    // Google exatamente do tamanho do botão visual e sobrepô-lo com
    // opacidade zero. O clique do usuário sempre acerta o iframe real —
    // nenhum JS precisa encaminhar nada.
    window.google.accounts.id.renderButton(overlayRef.current, {
      type: 'standard',
      theme: 'outline',
      size: 'large',
      width: containerRef.current.offsetWidth,
    });
  }, [isGoogleLoaded, handleGoogleLogin]);

  return (
    <>
      <WalletLoadingScreen isLoading={isLoading} loadingText="Conectando com Google..." />
      <div
        ref={containerRef}
        style={{position: 'relative', height: 40}}
        // O botão decorativo tem pointer-events: none (o clique de verdade
        // vai pro overlay do Google por cima), então ele nunca recebe
        // mouseenter/mouseleave — o hover precisa ser lido aqui, no
        // container, que continua same-origin mesmo com o iframe do Google
        // dentro dele.
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}>
        {!isGoogleLoaded ? (
          <button
            disabled
            style={{
              width: '100%',
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
            type="button"
            aria-hidden="true"
            tabIndex={-1}
            disabled={isLoading}
            style={{
              width: '100%',
              height: 40,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              border: `1px solid ${isHovered && !isLoading ? 'var(--ac)' : 'var(--hair)'}`,
              borderRadius: 8,
              background:
                isHovered && !isLoading ? 'rgba(145,132,217,0.08)' : 'transparent',
              color: 'var(--color-neutral-400)',
              fontFamily: 'var(--font-body)',
              fontSize: 13,
              fontWeight: 500,
              // Decorativo: o clique de verdade é capturado pelo iframe real
              // do Google, sobreposto por cima (ver overlayRef abaixo). O
              // hover em si é controlado pelo container (isHovered), não por
              // :hover CSS, porque este elemento nunca recebe o mouse.
              pointerEvents: 'none',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.7 : 1,
              transition: 'all 0.15s ease',
            }}>
            <i className="ph ph-google-logo" style={{fontSize: 15}} />
            Entrar com Google
          </button>
        )}
        {/* Botão real do Google, invisível e por cima do decorativo — é
            um iframe cross-origin, então precisa RECEBER o clique
            diretamente; nenhum forwarding via querySelector funciona nele. */}
        <div
          ref={overlayRef}
          style={{
            position: 'absolute',
            inset: 0,
            overflow: 'hidden',
            opacity: 0,
            display: isLoading ? 'none' : 'block',
          }}
        />
      </div>
    </>
  );
};
