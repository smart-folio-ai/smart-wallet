import React, {useState, useEffect} from 'react';
import {useNavigate, useLocation} from 'react-router-dom';
import {zodResolver} from '@hookform/resolvers/zod';
import {useForm} from 'react-hook-form';
import * as z from 'zod';
import {Eye, EyeOff, ArrowRight} from 'lucide-react';
import {Input} from '@/components/ui/input';
import {Button} from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {Checkbox} from '@/components/ui/checkbox';
import {toast} from 'sonner';
import AuthenticationService from '../services/authentication';
import WalletLoadingScreen from '@/components/WalletLoadingScreen';
import {AppLogo} from '@/components/AppLogo';
import {googleClientId} from '@/utils/env';

const formSchema = z.object({
  email: z
    .string()
    .email('Digite um email válido')
    .max(254, 'E-mail muito longo'),
  password: z
    .string()
    .min(6, 'A senha deve ter pelo menos 6 caracteres')
    .max(128, 'Senha muito longa'),
  keepConnect: z.boolean().optional().default(false),
});

type FormValues = z.infer<typeof formSchema>;

const TypingEffect = ({text, speed = 100}: {text: string; speed?: number}) => {
  const [displayedText, setDisplayedText] = useState('');
  useEffect(() => {
    let i = 0;
    const timer = setInterval(() => {
      setDisplayedText(text.substring(0, i + 1));
      i++;
      if (i >= text.length) clearInterval(timer);
    }, speed);
    return () => clearInterval(timer);
  }, [text, speed]);
  return <>{displayedText}</>;
};

const CountUp = ({
  end,
  decimals = 0,
  duration = 110000,
  prefix = '',
  suffix = '',
}: {
  end: number;
  decimals?: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
}) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let startTimestamp: number | null = null;
    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      setCount(progress * end);
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };
    window.requestAnimationFrame(step);
  }, [end, duration]);

  return (
    <>
      {prefix}
      {count.toFixed(decimals)}
      {suffix}
    </>
  );
};

export default function SignIn() {
  const [showPassword, setShowPassword] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [authenticating, setAuthenticating] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
      keepConnect: false,
    },
  });

  const onSubmit = async (data: FormValues) => {
    setAuthenticating(true);
    const response = await AuthenticationService.authenticate(
      data.email,
      data.password,
      data.keepConnect,
    );

    if (!response || !response.success) {
      toast.error(
        'Erro ao realizar login. Verifique suas credenciais e tente novamente.',
      );
      setAuthenticating(false);
      return;
    }

    if (response.requires2FA) {
      toast.info('Código 2FA necessário');
      navigate('/2fa-verify', {replace: true});
      return;
    }

    setAuthenticating(false);
    setIsSyncing(true);

    setTimeout(() => {
      toast.success('Login realizado com sucesso!');
      setIsSyncing(false);
      navigate(from, {replace: true});
    }, 2000);
  };

  const handleGoogleLogin = async () => {
    if (!googleClientId) {
      toast.error('Google Login não configurado no ambiente.');
      return;
    }
    setGoogleLoading(true);
    try {
      const scriptId = 'google-identity-script';
      const hasScript = document.getElementById(scriptId);
      if (!hasScript) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement('script');
          script.id = scriptId;
          script.src = 'https://accounts.google.com/gsi/client';
          script.async = true;
          script.defer = true;
          script.onload = () => resolve();
          script.onerror = () =>
            reject(new Error('Falha ao carregar o script do Google'));
          document.head.appendChild(script);
        });
      }

      const googleApi = (window as any)?.google;
      if (!googleApi?.accounts?.id) {
        throw new Error('Google Identity indisponível');
      }

      await new Promise<void>((resolve, reject) => {
        googleApi.accounts.id.initialize({
          client_id: googleClientId,
          callback: async (response: any) => {
            try {
              const idToken = String(response?.credential || '');
              if (!idToken) {
                reject(new Error('Credencial Google inválida'));
                return;
              }
              const keepConnected = Boolean(form.getValues('keepConnect'));
              const login = await AuthenticationService.authenticateWithGoogle(
                idToken,
                keepConnected,
              );
              if (!login || !login.success) {
                reject(new Error('Falha ao autenticar com Google'));
                return;
              }
              if (login.requires2FA) {
                toast.info('Código 2FA necessário');
                navigate('/2fa-verify', {replace: true});
                resolve();
                return;
              }
              toast.success('Login com Google realizado com sucesso!');
              navigate(from, {replace: true});
              resolve();
            } catch (error) {
              reject(error);
            }
          },
        });
        googleApi.accounts.id.prompt();
      });
    } catch (error) {
      toast.error('Não foi possível autenticar com Google no momento.');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <>
      <WalletLoadingScreen
        isLoading={isSyncing}
        loadingText="Sincronizando sua carteira..."
      />
      <div
        id="signin-page"
        className="min-h-screen flex"
        style={{fontFamily: 'var(--font-body)'}}>
        {/* Painel esquerdo - editorial */}
        <div
          className="hidden lg:flex lg:w-1/2 relative overflow-hidden flex-col justify-between p-14"
          style={{backgroundColor: 'var(--auth-panel)'}}>
          {/* Glow ambiental */}
          <div
            className="absolute top-0 left-0 w-96 h-96 rounded-full pointer-events-none"
            style={{
              background:
                'radial-gradient(circle, var(--auth-highlight-soft) 0%, transparent 70%)',
            }}
          />
          <div
            className="absolute bottom-0 right-0 w-80 h-80 rounded-full pointer-events-none"
            style={{
              background:
                'radial-gradient(circle, var(--auth-highlight-subtle) 0%, transparent 70%)',
            }}
          />

          {/* Logo */}
          <div className="relative z-10 ml-2">
            <AppLogo size="lg" />
          </div>

          {/* Conteúdo central */}
          <div className="relative z-10 flex-1 flex flex-col justify-center">
            <div className="mb-6 inline-flex">
              <span
                className="text-xs font-medium uppercase tracking-widest px-3 py-1 rounded-full"
                style={{
                  color: 'var(--auth-text-accent)',
                  backgroundColor: 'var(--auth-highlight)',
                  fontFamily: 'var(--font-body)',
                  letterSpacing: '0.12em',
                }}>
                Terminal Financeiro
              </span>
            </div>
            <h1
              className="font-bold leading-tight mb-5"
              style={{
                color: 'var(--auth-text-main)',
                fontSize: '2.75rem',
                fontFamily: 'var(--font-heading)',
                letterSpacing: '-0.02em',
                minHeight: '2.5em',
              }}>
              <TypingEffect text="Precisão institucional para o seu patrimônio." />
            </h1>
            <p
              className="leading-relaxed"
              style={{
                color: 'var(--auth-text-body)',
                fontSize: '1rem',
                lineHeight: '1.7',
              }}>
              Acompanhe seu portfólio com análises em tempo real, insights
              inteligentes e uma interface construída para quem leva
              investimentos a sério.
            </p>

            {/* Métricas */}
            <div className="mt-10 grid grid-cols-3 gap-4">
              {[
                {
                  value: (
                    <CountUp end={2.4} decimals={1} prefix="R$ " suffix="M" />
                  ),
                  label: 'Patrimônio monitorado',
                },
                {
                  value: <CountUp end={2} decimals={1} suffix="k+" />,
                  label: 'Investidores ativos',
                },
                {
                  value: '99.9%',
                  label: 'Uptime do sistema',
                },
              ].map((item, index) => (
                <div
                  key={index}
                  className="rounded-xl p-4"
                  style={{backgroundColor: 'var(--auth-surface)'}}>
                  <div
                    className="font-bold text-lg mb-1"
                    style={{
                      color: 'var(--auth-text-accent)',
                      fontFamily: 'var(--font-heading)',
                    }}>
                    {item.value}
                  </div>
                  <div
                    className="text-xs"
                    style={{color: 'var(--auth-text-muted)'}}>
                    {item.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Rodapé */}
          <p
            className="text-xs relative z-10"
            style={{color: 'var(--auth-text-soft)'}}>
            © 2025 Trackerr. Plataforma de análise de investimentos.
          </p>
        </div>

        {/* Painel direito - formulário */}
        <div
          className="flex-1 flex items-center justify-center p-8"
          style={{backgroundColor: '#ffffff'}}>
          <div className="w-full max-w-md">
            {/* Logo mobile */}
            <div className="mb-8 flex justify-center lg:hidden">
              <AppLogo size="lg" />
            </div>

            {/* Cabeçalho do form */}
            <div className="mb-8">
              <h2
                className="font-bold mb-2"
                style={{
                  color: 'var(--auth-panel)',
                  fontSize: '1.875rem',
                  fontFamily: 'var(--font-heading)',
                  letterSpacing: '-0.02em',
                }}>
                Entrar no Terminal
              </h2>
              <p
                style={{
                  color: 'var(--auth-text-secondary)',
                  fontSize: '0.9rem',
                }}>
                Não tem uma conta?{' '}
                <button
                  id="signin-goto-register"
                  onClick={() => navigate('/register')}
                  className="font-semibold transition-colors decoration-primary/30 underline-offset-4 hover:underline"
                  style={{color: 'var(--auth-brand)'}}>
                  Criar conta agora
                </button>
              </p>
            </div>

            {/* Formulário */}
            <Form {...form}>
              <form
                id="signin-form"
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-5">
                <FormField
                  control={form.control}
                  name="email"
                  render={({field}) => (
                    <FormItem>
                      <FormLabel
                        htmlFor="signin-email"
                        className="uppercase tracking-widest text-xs font-bold"
                        style={{
                          color: 'var(--auth-text-secondary)',
                          letterSpacing: '0.1em',
                        }}>
                        E-mail
                      </FormLabel>
                      <FormControl>
                        <Input
                          id="signin-email"
                          placeholder="seu@email.com"
                          maxLength={254}
                          {...field}
                          className="h-12 border border-slate-200 text-sm focus-visible:ring-1 focus-visible:ring-[var(--auth-brand)] bg-slate-50/50"
                          style={{color: 'var(--auth-panel)'}}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({field}) => (
                    <FormItem>
                      <div className="flex items-center justify-between">
                        <FormLabel
                          htmlFor="signin-password"
                          className="uppercase tracking-widest text-xs font-bold"
                          style={{
                            color: 'var(--auth-text-secondary)',
                            letterSpacing: '0.1em',
                          }}>
                          Senha
                        </FormLabel>
                        <a
                          href="/forgot-password"
                          className="text-xs font-medium transition-colors hover:text-primary"
                          style={{color: 'var(--auth-brand)'}}>
                          Esqueceu a senha?
                        </a>
                      </div>
                      <div className="relative">
                        <FormControl>
                          <Input
                            id="signin-password"
                            type={showPassword ? 'text' : 'password'}
                            placeholder="••••••••"
                            maxLength={128}
                            {...field}
                            className="h-12 border border-slate-200 pr-12 text-sm focus-visible:ring-1 focus-visible:ring-[var(--auth-brand)] bg-slate-50/50"
                            style={{color: 'var(--auth-panel)'}}
                          />
                        </FormControl>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-1 top-1 h-10 w-10 hover:bg-transparent"
                          style={{color: '#94a3b8'}}
                          onClick={() => setShowPassword(!showPassword)}>
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                          <span className="sr-only">
                            {showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                          </span>
                        </Button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="keepConnect"
                  render={({field}) => (
                    <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          id="signin-keep-connected"
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className="border-slate-300 data-[state=checked]:bg-[var(--auth-brand)] data-[state=checked]:border-[var(--auth-brand)]"
                        />
                      </FormControl>
                      <FormLabel
                        className="font-medium text-sm cursor-pointer"
                        style={{color: '#475569'}}>
                        Manter conectado
                      </FormLabel>
                    </FormItem>
                  )}
                />

                <Button
                  id="signin-submit"
                  type="submit"
                  className="w-full h-12 font-bold text-sm gap-2 transition-all duration-200 shadow-lg shadow-blue-500/20"
                  style={{
                    background:
                      'linear-gradient(135deg, var(--auth-brand), var(--auth-brand-strong))',
                    color: '#f9f7ff',
                  }}
                  disabled={authenticating || isSyncing}>
                  {authenticating ? (
                    'Verificando...'
                  ) : (
                    <>
                      Entrar no Terminal
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>

                <Button
                  id="signin-google"
                  type="button"
                  variant="outline"
                  className="w-full h-12 font-semibold"
                  onClick={handleGoogleLogin}
                  disabled={authenticating || isSyncing || googleLoading}>
                  {googleLoading ? 'Conectando com Google...' : 'Entrar com Google'}
                </Button>
              </form>
            </Form>

            {/* Rodapé externo */}
            <p className="text-xs text-center mt-8" style={{color: '#94a3b8'}}>
              Copyright © 2025 Trackerr. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
