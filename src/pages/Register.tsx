import React, {useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {zodResolver} from '@hookform/resolvers/zod';
import {useForm} from 'react-hook-form';
import * as z from 'zod';
import {
  ArrowRight,
  Buildings,
  Eye,
  EyeOff,
  LockSimple,
  MailSimple,
  Receipt,
  Sparkles,
  Stack,
  User,
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
import {ICreateUser} from '@/interface/authentication';
import AuthenticationService from '../services/authentication';
import {AxiosError} from 'axios';
import {AppLogo} from '@/components/AppLogo';
import WalletLoadingScreen from '@/components/WalletLoadingScreen';
import {GoogleLoginButton} from '@/components/GoogleLoginButton';
import {AuthTabs} from '@/components/auth/AuthTabs';
import {ThemeToggle} from '@/components/ThemeToggle';

const formSchema = z
  .object({
    firstname: z.string().min(2, 'O nome deve ter pelo menos 2 caracteres'),
    lastname: z.string().min(2, 'O sobrenome deve ter pelo menos 2 caracteres'),
    email: z.string().email('Digite um email válido'),
    password: z
      .string()
      .min(8, 'A senha deve ter pelo menos 8 caracteres')
      .regex(/[A-Z]/, 'A senha deve conter pelo menos 1 letra maiúscula')
      .regex(/[a-z]/, 'A senha deve conter pelo menos 1 letra minúscula')
      .regex(/\d/, 'A senha deve conter pelo menos 1 número')
      .regex(
        /[^A-Za-z0-9]/,
        'A senha deve conter pelo menos 1 caractere especial',
      ),
    confirmPassword: z
      .string()
      .min(8, 'A senha deve ter pelo menos 8 caracteres'),
    acceptTerms: z.boolean().refine((value) => value === true, {
      message: 'Você precisa aceitar os termos para continuar',
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas não correspondem',
    path: ['confirmPassword'],
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

const panelGradient = {
  backgroundImage:
    'linear-gradient(140deg, rgba(111,94,217,0.42) 0%, rgba(76,201,240,0.16) 46%, transparent 100%)',
  backgroundColor: 'var(--surf-2)',
};

export default function Register() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstname: '',
      lastname: '',
      email: '',
      password: '',
      confirmPassword: '',
      acceptTerms: false,
    },
  });
  const passwordValue = form.watch('password') || '';
  const confirmPasswordValue = form.watch('confirmPassword') || '';
  const hasMinLength = passwordValue.length >= 8;
  const hasUppercase = /[A-Z]/.test(passwordValue);
  const hasLowercase = /[a-z]/.test(passwordValue);
  const hasNumber = /\d/.test(passwordValue);
  const hasSpecial = /[^A-Za-z0-9]/.test(passwordValue);
  const passwordsMatch =
    confirmPasswordValue.length > 0 && confirmPasswordValue === passwordValue;

  const onSubmit = async (data: FormValues) => {
    try {
      setLoading(true);
      const newUser: ICreateUser = {
        firstName: data.firstname,
        lastName: data.lastname,
        email: data.email,
        password: data.password,
        confirmPassword: data.confirmPassword,
      };

      const success = await AuthenticationService.register(newUser);
      if (!success) {
        throw new Error('Erro ao criar conta. Tente novamente.');
      }
      toast.success('Conta criada com sucesso!', {duration: 2000});
      setLoading(false);
      navigate('/dashboard');
    } catch (error: unknown) {
      setLoading(false);
      if (error instanceof AxiosError && error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else if (error instanceof Error && error.message) {
        toast.error(error.message);
      } else {
        toast.error('Não foi possível criar sua conta agora. Tente novamente.');
      }
    }
  };

  return (
    <div
      id="register-page"
      className="relative min-h-screen flex"
      style={{fontFamily: 'var(--font-body)'}}>
      <div className="fixed right-4 top-4 z-50">
        <ThemeToggle />
      </div>

      {/* Painel esquerdo - editorial */}
      <div
        className="hidden lg:flex lg:w-1/2 relative overflow-hidden flex-col justify-between p-14"
        style={panelGradient}>
        {/* Glow ambiental */}
        <div
          aria-hidden
          className="pointer-events-none absolute"
          style={{
            left: '14%',
            top: '8%',
            width: 720,
            height: 380,
            transform: 'translate(-50%, -50%)',
            background:
              'radial-gradient(circle, rgba(111,94,217,0.34) 0%, transparent 66%)',
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute"
          style={{
            left: '88%',
            top: '96%',
            width: 620,
            height: 340,
            transform: 'translate(-50%, -50%)',
            background:
              'radial-gradient(circle, rgba(47,214,163,0.20) 0%, transparent 66%)',
          }}
        />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-2.5">
          <AppLogo variant="icon" size="md" />
          <div className="flex flex-col">
            <span
              className="font-heading text-lg font-semibold tracking-tight"
              style={{color: 'inherit'}}>
              Trackerr
            </span>
            <span
              className="text-[10px] font-semibold uppercase tracking-[0.14em]"
              style={{color: 'var(--color-neutral-500)'}}>
              Enterprise Wealth Intelligence
            </span>
          </div>
        </div>

        {/* Conteúdo central */}
        <div className="relative z-10 flex-1 flex flex-col justify-center">
          <h1
            className="font-bold leading-tight mb-5"
            style={{
              fontSize: '2.75rem',
              fontFamily: 'var(--font-heading)',
              letterSpacing: '-0.02em',
            }}>
            A carteira inteira,
            <br />
            <span
              style={{
                background:
                  'linear-gradient(120deg, var(--ac) 0%, var(--cy) 58%, var(--pos) 100%)',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                color: 'transparent',
              }}>
              lida por uma IA que explica.
            </span>
          </h1>
          <p
            className="leading-relaxed"
            style={{
              fontSize: '1rem',
              lineHeight: '1.7',
              color: 'var(--color-neutral-500)',
            }}>
            Consolidação multi-corretora, risco quantitativo e apuração
            fiscal em uma leitura só — na profundidade certa para o seu
            nível de investidor.
          </p>

          {/* Prova social */}
          <div className="mt-8 flex flex-col gap-4">
            {proofPoints.map((item) => (
              <div key={item.title} className="flex items-start gap-3">
                <span
                  aria-hidden
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                  style={{
                    background: 'rgba(145,132,217,0.15)',
                    color: 'var(--ac)',
                  }}>
                  <item.icon className="h-4 w-4" weight="fill" />
                </span>
                <div>
                  <div className="text-sm font-semibold">{item.title}</div>
                  <div
                    className="mt-0.5 text-xs leading-relaxed"
                    style={{color: 'var(--color-neutral-500)'}}>
                    {item.body}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Rodapé de confiança */}
        <div
          className="relative z-10 flex flex-wrap items-center gap-6 pt-5"
          style={{borderTop: '1px solid var(--hair)'}}>
          {trustStats.map((stat) => (
            <div key={stat.label}>
              <div
                className="font-semibold text-sm"
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontVariantNumeric: 'tabular-nums',
                }}>
                {stat.value}
              </div>
              <div
                className="mt-0.5 text-[10.5px]"
                style={{color: 'var(--color-neutral-500)'}}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Painel direito - formulário */}
      <div className="relative flex-1 flex items-center justify-center overflow-y-auto p-8">
        <div className="w-full max-w-md my-8">
          {/* Logo mobile */}
          <div className="mb-8 flex justify-center lg:hidden">
            <AppLogo size="lg" />
          </div>

          <AuthTabs active="register" />

          {/* Cabeçalho do form */}
          <div className="mb-6 mt-6">
            <h2
              className="font-bold mb-2"
              style={{
                fontSize: '1.5rem',
                fontFamily: 'var(--font-heading)',
                letterSpacing: '-0.02em',
              }}>
              Comece em minutos
            </h2>
            <p className="text-sm" style={{color: 'var(--color-neutral-500)'}}>
              Crie a conta, conecte uma corretora e receba a primeira leitura
              de risco e concentração.
            </p>
          </div>

          {/* SSO */}
          <div className="flex flex-col gap-3">
            <GoogleLoginButton />
            <Button
              type="button"
              variant="outline"
              className="w-full justify-center gap-2"
              style={{color: 'var(--color-neutral-500)'}}
              onClick={() =>
                toast.info(
                  'SSO corporativo (SAML) em breve. Fale com o time comercial para o piloto Enterprise.',
                )
              }>
              <Buildings className="h-4 w-4" />
              Criar conta com SSO corporativo
            </Button>
          </div>

          <div className="my-6 flex items-center gap-3">
            <span className="h-px flex-1" style={{background: 'var(--hair)'}} />
            <span
              className="text-[10.5px] uppercase tracking-[0.1em]"
              style={{color: 'var(--color-neutral-500)'}}>
              Ou com e-mail
            </span>
            <span className="h-px flex-1" style={{background: 'var(--hair)'}} />
          </div>

          {/* Formulário */}
          <Form {...form}>
            <form
              id="register-form"
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstname"
                  render={({field}) => (
                    <FormItem>
                      <FormLabel
                        htmlFor="register-firstname"
                        className="text-xs font-medium"
                        style={{color: 'var(--color-neutral-500)'}}>
                        Nome
                      </FormLabel>
                      <div className="relative">
                        <User
                          aria-hidden
                          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
                          style={{color: 'var(--color-neutral-500)'}}
                        />
                        <FormControl>
                          <Input
                            id="register-firstname"
                            placeholder="João"
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
                  name="lastname"
                  render={({field}) => (
                    <FormItem>
                      <FormLabel
                        htmlFor="register-lastname"
                        className="text-xs font-medium"
                        style={{color: 'var(--color-neutral-500)'}}>
                        Sobrenome
                      </FormLabel>
                      <FormControl>
                        <Input
                          id="register-lastname"
                          placeholder="Silva"
                          {...field}
                          className="h-11 text-sm"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="email"
                render={({field}) => (
                  <FormItem>
                    <FormLabel
                      htmlFor="register-email"
                      className="text-xs font-medium"
                      style={{color: 'var(--color-neutral-500)'}}>
                      E-mail
                    </FormLabel>
                    <div className="relative">
                      <MailSimple
                        aria-hidden
                        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
                        style={{color: 'var(--color-neutral-500)'}}
                      />
                      <FormControl>
                        <Input
                          id="register-email"
                          placeholder="voce@empresa.com"
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
                    <FormLabel
                      htmlFor="register-password"
                      className="text-xs font-medium"
                      style={{color: 'var(--color-neutral-500)'}}>
                      Senha
                    </FormLabel>
                    <div className="relative">
                      <LockSimple
                        aria-hidden
                        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
                        style={{color: 'var(--color-neutral-500)'}}
                      />
                      <FormControl>
                        <Input
                          id="register-password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="mínimo 8 caracteres"
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
                name="confirmPassword"
                render={({field}) => (
                  <FormItem>
                    <FormLabel
                      htmlFor="register-confirm-password"
                      className="text-xs font-medium"
                      style={{color: 'var(--color-neutral-500)'}}>
                      Confirmar senha
                    </FormLabel>
                    <div className="relative">
                      <LockSimple
                        aria-hidden
                        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
                        style={{color: 'var(--color-neutral-500)'}}
                      />
                      <FormControl>
                        <Input
                          id="register-confirm-password"
                          type={showConfirmPassword ? 'text' : 'password'}
                          placeholder="repita a senha"
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
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }>
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                        <span className="sr-only">
                          {showConfirmPassword
                            ? 'Ocultar senha'
                            : 'Mostrar senha'}
                        </span>
                      </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div
                className="rounded-xl border p-3 text-xs"
                style={{
                  background: 'var(--surf-3)',
                  borderColor: 'var(--hair)',
                  color: 'var(--color-neutral-500)',
                }}>
                <p className="mb-2 font-semibold" style={{color: 'inherit'}}>
                  Regras da senha
                </p>
                <p style={{color: hasMinLength ? 'var(--pos)' : 'var(--color-neutral-500)'}}>
                  • Mínimo de 8 caracteres
                </p>
                <p style={{color: hasUppercase ? 'var(--pos)' : 'var(--color-neutral-500)'}}>
                  • Pelo menos 1 letra maiúscula
                </p>
                <p style={{color: hasLowercase ? 'var(--pos)' : 'var(--color-neutral-500)'}}>
                  • Pelo menos 1 letra minúscula
                </p>
                <p style={{color: hasNumber ? 'var(--pos)' : 'var(--color-neutral-500)'}}>
                  • Pelo menos 1 número
                </p>
                <p style={{color: hasSpecial ? 'var(--pos)' : 'var(--color-neutral-500)'}}>
                  • Pelo menos 1 caractere especial
                </p>
                <p style={{color: passwordsMatch ? 'var(--pos)' : 'var(--color-neutral-500)'}}>
                  • A confirmação deve ser igual à senha
                </p>
              </div>

              <FormField
                control={form.control}
                name="acceptTerms"
                render={({field}) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        id="register-accept-terms"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        className="mt-0.5 data-[state=checked]:bg-[var(--ac)] data-[state=checked]:border-[var(--ac)]"
                        required
                      />
                    </FormControl>
                    <FormLabel
                      htmlFor="register-accept-terms"
                      className="font-medium text-sm leading-snug cursor-pointer"
                      style={{color: 'var(--color-neutral-500)'}}>
                      Eu li e concordo com os{' '}
                      <a
                        href="#"
                        className="font-semibold underline-offset-4 hover:underline transition-colors"
                        style={{color: 'var(--ac)'}}>
                        Termos de Uso
                      </a>{' '}
                      e{' '}
                      <a
                        href="#"
                        className="font-semibold underline-offset-4 hover:underline transition-colors"
                        style={{color: 'var(--ac)'}}>
                        Política de Privacidade
                      </a>
                      . O Trackerr não é consultoria de investimento e não
                      recomenda ativos.
                    </FormLabel>
                  </FormItem>
                )}
              />

              {loading && (
                <WalletLoadingScreen
                  isLoading
                  loadingText="Estamos criando sua conta, por favor aguarde..."
                />
              )}

              <Button
                id="register-submit"
                type="submit"
                className="w-full h-11 font-semibold text-sm gap-2 transition-all duration-200"
                style={{background: 'var(--grad-violet)', color: '#fff'}}
                disabled={loading}>
                {loading ? (
                  'Criando conta...'
                ) : (
                  <>
                    Criar minha conta
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </form>
          </Form>

          <p
            className="mt-6 text-center text-xs"
            style={{color: 'var(--color-neutral-500)'}}>
            Já possui uma conta?{' '}
            <button
              id="register-goto-signin"
              onClick={() => navigate('/signin')}
              className="font-semibold transition-colors underline-offset-4 hover:underline"
              style={{color: 'var(--ac)'}}>
              Faça login
            </button>
          </p>

          <p
            className="mt-2 text-center text-xs"
            style={{color: 'var(--color-neutral-500)', opacity: 0.7}}>
            Grátis até 10 ativos. Sem cartão de crédito para começar.
          </p>

          {/* Rodapé de confiança */}
          <div
            className="mt-8 flex items-center justify-center gap-2 pt-6 text-[11px]"
            style={{
              borderTop: '1px solid var(--hair)',
              color: 'var(--color-neutral-500)',
            }}>
            <LockSimple
              aria-hidden
              className="h-3.5 w-3.5"
              style={{color: 'var(--pos)'}}
            />
            <span>Conexão cifrada · 2FA disponível · SOC 2 Type II · LGPD</span>
          </div>
        </div>
      </div>
    </div>
  );
}
