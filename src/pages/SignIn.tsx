import React, {useState} from 'react';
import {useNavigate, useLocation} from 'react-router-dom';
import {zodResolver} from '@hookform/resolvers/zod';
import {useForm} from 'react-hook-form';
import * as z from 'zod';
import {
  ArrowRight,
  Eye,
  EyeOff,
  LockSimple,
  MailSimple,
  Receipt,
  Sparkles,
  Stack,
} from '@/components/ui/icons';
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
import {GoogleLoginButton} from '@/components/GoogleLoginButton';
import {AuthTabs} from '@/components/auth/AuthTabs';
import {ThemeToggle} from '@/components/ThemeToggle';

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

const proofPoints = [
  {
    icon: Stack,
    title: 'Consolidação multi-corretora',
    body: 'B3, corretoras nacionais e cripto em um único patrimônio, sem planilha.',
  },
  {
    icon: Sparkles,
    title: 'Copiloto com trilha de auditoria',
    body: 'Cada insight traz fonte, janela de dados e nível de confiança do modelo.',
  },
  {
    icon: Receipt,
    title: 'Fiscal calculado, não estimado',
    body: 'Apuração mensal, prejuízo compensado e DARF com o valor a pagar.',
  },
];

const trustStats = [
  {value: '99,98%', label: 'uptime 12 meses'},
  {value: 'AES-256', label: 'dados cifrados'},
  {value: 'SOC 2', label: 'Type II'},
  {value: 'LGPD', label: 'conformidade'},
];

export default function SignIn() {
  const [showPassword, setShowPassword] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [authenticating, setAuthenticating] = useState(false);
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

  return (
    <>
      <WalletLoadingScreen
        isLoading={isSyncing}
        loadingText="Sincronizando sua carteira..."
      />
      <div
        id="signin-page"
        style={{
          minHeight: '100vh',
          display: 'grid',
          gridTemplateColumns: 'minmax(0,1.05fr) minmax(0,1fr)',
          fontFamily: 'var(--font-body)',
        }}>
        {/* Theme toggle */}
        <div style={{position: 'fixed', top: 17, right: 17, zIndex: 40}}>
          <ThemeToggle />
        </div>

        {/* Painel esquerdo */}
        <aside
          style={{
            position: 'relative',
            overflow: 'hidden',
            borderRight: '1px solid var(--hair)',
            background:
              'linear-gradient(140deg, rgba(111,94,217,0.42) 0%, rgba(76,201,240,0.16) 46%, transparent 100%), var(--sunk)',
          }}>
          {/* Glows */}
          <div
            aria-hidden
            style={{
              position: 'absolute',
              inset: 0,
              background:
                'radial-gradient(720px 380px at 14% 8%, rgba(145,132,217,0.34), rgba(145,132,217,0) 66%), radial-gradient(620px 340px at 88% 96%, rgba(47,214,163,0.20), rgba(47,214,163,0) 66%)',
              pointerEvents: 'none',
            }}
          />

          <div
            style={{
              position: 'relative',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              padding: '44px 48px',
            }}>
            {/* Logo */}
            <div style={{display: 'flex', alignItems: 'center', gap: 11}}>
              <AppLogo variant="icon" size="md" />
              <div>
                <div
                  style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: 17,
                    fontWeight: 600,
                    letterSpacing: '-0.015em',
                  }}>
                  Trackerr
                </div>
                <div
                  style={{
                    fontSize: 10,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: 'var(--color-neutral-500)',
                  }}>
                  Enterprise Wealth Intelligence
                </div>
              </div>
            </div>

            {/* Conteúdo central */}
            <div>
              <h1
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: 38,
                  lineHeight: 1.08,
                  fontWeight: 600,
                  letterSpacing: '-0.03em',
                  margin: 0,
                  maxWidth: 460,
                }}>
                A carteira inteira,
                <br />
                <span
                  style={{
                    background: 'var(--grad-aurora)',
                    WebkitBackgroundClip: 'text',
                    backgroundClip: 'text',
                    color: 'transparent',
                  }}>
                  lida por uma IA que explica.
                </span>
              </h1>
              <p
                style={{
                  fontSize: 14.5,
                  lineHeight: 1.65,
                  color: 'var(--color-neutral-400)',
                  maxWidth: 440,
                  margin: '17px 0 0',
                }}>
                Consolidação multi-corretora, risco quantitativo e apuração
                fiscal em uma leitura só — na profundidade certa para o seu
                nível de investidor.
              </p>

              {/* Prova social */}
              <div style={{display: 'flex', flexDirection: 'column', gap: 11, marginTop: 28}}>
                {proofPoints.map((item) => (
                  <div key={item.title} style={{display: 'flex', alignItems: 'flex-start', gap: 11}}>
                    <span
                      aria-hidden
                      style={{
                        width: 22,
                        height: 22,
                        flexShrink: 0,
                        borderRadius: 6,
                        background: 'var(--hair-soft)',
                        border: '1px solid var(--hair)',
                        display: 'grid',
                        placeItems: 'center',
                      }}>
                      <item.icon className="h-3 w-3" weight="fill" style={{color: 'var(--ac)'} as React.CSSProperties} />
                    </span>
                    <div>
                      <div style={{fontSize: 12.5, fontWeight: 600, color: 'var(--color-neutral-100)'}}>
                        {item.title}
                      </div>
                      <div style={{fontSize: 11.5, color: 'var(--color-neutral-400)', marginTop: 2, lineHeight: 1.45}}>
                        {item.body}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Rodapé de confiança */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 22,
                flexWrap: 'wrap',
                paddingTop: 22,
                borderTop: '1px solid var(--hair)',
              }}>
              {trustStats.map((stat) => (
                <div key={stat.label}>
                  <div
                    style={{
                      fontFamily: 'var(--font-heading)',
                      fontSize: 15,
                      fontWeight: 600,
                      color: 'var(--color-neutral-100)',
                      fontVariantNumeric: 'tabular-nums',
                    }}>
                    {stat.value}
                  </div>
                  <div style={{fontSize: 10.5, color: 'var(--color-neutral-500)', marginTop: 2}}>
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* Painel direito */}
        <main
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '44px 32px',
            background:
              'radial-gradient(680px 420px at 78% -10%, rgba(111,94,217,0.24) 0%, transparent 60%), var(--surf-1)',
          }}>
          <div style={{width: '100%', maxWidth: 404}}>
            {/* Logo mobile */}
            <div className="mb-8 flex justify-center lg:hidden">
              <AppLogo size="lg" />
            </div>

            <AuthTabs active="login" />

            {/* Cabeçalho do form */}
            <div style={{marginTop: 28}}>
              <h2
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: 24,
                  fontWeight: 600,
                  letterSpacing: '-0.025em',
                  margin: 0,
                }}>
                Bem-vindo de volta
              </h2>
              <p style={{fontSize: 13, color: 'var(--color-neutral-500)', margin: '8px 0 0', lineHeight: 1.55}}>
                Acesse sua carteira consolidada e os insights gerados desde o
                seu último acesso.
              </p>
            </div>

            {/* SSO */}
            <div style={{display: 'flex', flexDirection: 'column', gap: 11, marginTop: 22}}>
              <GoogleLoginButton keepConnected={form.getValues('keepConnect')} />
              <button
                type="button"
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
                  cursor: 'pointer',
                }}
                onClick={() =>
                  toast.info(
                    'SSO corporativo (SAML) em breve. Fale com o time comercial para o piloto Enterprise.',
                  )
                }>
                <i className="ph ph-buildings" style={{fontSize: 15}} />
                Entrar com SSO corporativo
              </button>
            </div>

            {/* Divisor */}
            <div style={{display: 'flex', alignItems: 'center', gap: 11, margin: '22px 0'}}>
              <span style={{flex: 1, height: 1, background: 'linear-gradient(90deg, transparent, var(--hair), transparent)'}} />
              <span style={{fontSize: 10.5, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-neutral-600)'}}>
                ou com e-mail
              </span>
              <span style={{flex: 1, height: 1, background: 'linear-gradient(90deg, transparent, var(--hair), transparent)'}} />
            </div>

            {/* Formulário */}
            <Form {...form}>
              <form
                id="signin-form"
                onSubmit={form.handleSubmit(onSubmit)}
                style={{display: 'flex', flexDirection: 'column', gap: 14}}>
                <FormField
                  control={form.control}
                  name="email"
                  render={({field}) => (
                    <FormItem>
                      <FormLabel
                        htmlFor="signin-email"
                        style={{fontSize: 11.5, color: 'var(--color-neutral-400)'}}>
                        E-mail
                      </FormLabel>
                      <div style={{position: 'relative'}}>
                        <MailSimple
                          aria-hidden
                          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
                          style={{color: 'var(--color-neutral-500)'} as React.CSSProperties}
                        />
                        <FormControl>
                          <Input
                            id="signin-email"
                            placeholder="voce@empresa.com"
                            maxLength={254}
                            {...field}
                            className="h-11 pl-10 text-sm"
                          />
                        </FormControl>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({field}) => (
                    <FormItem>
                      <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
                        <FormLabel
                          htmlFor="signin-password"
                          style={{fontSize: 11.5, color: 'var(--color-neutral-400)'}}>
                          Senha
                        </FormLabel>
                        <a
                          href="/forgot-password"
                          style={{fontSize: 12, color: 'var(--ac)'}}>
                          Esqueci a senha
                        </a>
                      </div>
                      <div style={{position: 'relative'}}>
                        <LockSimple
                          aria-hidden
                          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
                          style={{color: 'var(--color-neutral-500)'} as React.CSSProperties}
                        />
                        <FormControl>
                          <Input
                            id="signin-password"
                            type={showPassword ? 'text' : 'password'}
                            placeholder="••••••••••"
                            maxLength={128}
                            {...field}
                            className="h-11 pl-10 pr-12 text-sm"
                          />
                        </FormControl>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-1 top-1/2 h-9 w-9 -translate-y-1/2 hover:bg-transparent"
                          style={{color: 'var(--color-neutral-500)'}}
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
                          className="data-[state=checked]:bg-[var(--ac)] data-[state=checked]:border-[var(--ac)]"
                        />
                      </FormControl>
                      <FormLabel
                        htmlFor="signin-keep-connected"
                        style={{fontSize: 12, color: 'var(--color-neutral-400)', cursor: 'pointer', fontWeight: 400}}>
                        Manter conectado
                      </FormLabel>
                    </FormItem>
                  )}
                />

                <button
                  id="signin-submit"
                  type="submit"
                  disabled={authenticating || isSyncing}
                  style={{
                    height: 44,
                    borderRadius: 8,
                    border: 'none',
                    background: 'var(--grad-violet)',
                    color: '#fff',
                    fontFamily: 'var(--font-body)',
                    fontSize: 13.5,
                    fontWeight: 600,
                    cursor: authenticating || isSyncing ? 'not-allowed' : 'pointer',
                    opacity: authenticating || isSyncing ? 0.7 : 1,
                    boxShadow: '0 8px 28px rgba(145,132,217,0.26)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                  }}>
                  {authenticating ? (
                    'Verificando...'
                  ) : (
                    <>
                      Entrar na plataforma
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>

                <div style={{fontSize: 11.5, color: 'var(--color-neutral-500)', textAlign: 'center', lineHeight: 1.5}}>
                  Não tem uma conta?{' '}
                  <button
                    id="signin-goto-register"
                    type="button"
                    onClick={() => navigate('/register')}
                    style={{background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ac)', fontWeight: 600, fontSize: 11.5}}>
                    Criar conta agora
                  </button>
                </div>
              </form>
            </Form>

            <p style={{fontSize: 11.5, color: 'var(--color-neutral-500)', textAlign: 'center', marginTop: 6, lineHeight: 1.5, opacity: 0.7}}>
              Acesso corporativo com SSO/SAML disponível nos planos Enterprise.
            </p>

            {/* Rodapé de confiança */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                marginTop: 28,
                paddingTop: 22,
                borderTop: '1px solid var(--hair-soft)',
                fontSize: 11,
                color: 'var(--color-neutral-600)',
              }}>
              <LockSimple aria-hidden className="h-3.5 w-3.5" style={{color: 'var(--pos)'} as React.CSSProperties} />
              <span>Conexão cifrada · 2FA disponível · SOC 2 Type II · LGPD</span>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
