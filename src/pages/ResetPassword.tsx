import React, {useState, useEffect} from 'react';
import {useNavigate, useSearchParams} from 'react-router-dom';
import {zodResolver} from '@hookform/resolvers/zod';
import {useForm} from 'react-hook-form';
import * as z from 'zod';
import apiClient from '@/server/api/api';
import {AxiosError} from 'axios';
import {Eye, EyeOff, ArrowLeft, ShieldCheck, Loader2, KeyRound, CheckCircle2, AlertCircle} from 'lucide-react';
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
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from '@/components/ui/input-otp';
import {toast} from 'sonner';
import {AppLogo} from '@/components/AppLogo';

const formSchema = z
  .object({
    password: z
      .string()
      .min(8, 'A senha deve ter no mínimo 8 caracteres')
      .regex(/[A-Z]/, 'A senha deve conter pelo menos 1 letra maiúscula')
      .regex(/[a-z]/, 'A senha deve conter pelo menos 1 letra minúscula')
      .regex(/\d/, 'A senha deve conter pelo menos 1 número')
      .regex(/[^A-Za-z0-9]/, 'A senha deve conter pelo menos 1 caractere especial'),
    confirmPassword: z.string(),
    code: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas não coincidem',
    path: ['confirmPassword'],
  });

type FormValues = z.infer<typeof formSchema>;

// ─── Estado: Validando token ────────────────────────────────────────────────

function LoadingState() {
  return (
    <div
      id="reset-password-loading"
      data-testid="reset-password-loading"
      className="min-h-screen flex items-center justify-center"
      style={{backgroundColor: 'var(--auth-bg)'}}
    >
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-10 h-10 animate-spin" style={{color: 'var(--auth-brand)'}} />
        <p className="text-sm" style={{color: 'var(--auth-text-muted)'}}>
          Validando link de recuperação...
        </p>
      </div>
    </div>
  );
}

// ─── Estado: Token inválido ──────────────────────────────────────────────────

function InvalidTokenState({
  onRetry,
  title,
  description,
}: {
  onRetry: () => void;
  title: string;
  description: string;
}) {
  return (
    <div
      id="reset-password-invalid"
      data-testid="reset-password-invalid"
      className="min-h-screen flex items-center justify-center p-8"
      style={{backgroundColor: 'var(--auth-bg)'}}
    >
      <div className="w-full max-w-md text-center">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
          style={{backgroundColor: 'var(--auth-danger-soft)'}}
        >
          <AlertCircle className="w-8 h-8" style={{color: '#ffb59a'}} />
        </div>
        <h2
          className="font-bold mb-3"
          style={{
            color: 'var(--auth-text-main)',
            fontSize: '1.75rem',
            fontFamily: 'var(--font-heading)',
            letterSpacing: '-0.02em',
          }}
        >
          {title}
        </h2>
        <p
          className="mb-8 leading-relaxed"
          style={{color: 'var(--auth-text-muted)', fontSize: '0.9rem'}}
        >
          {description}
        </p>
        <Button
          id="reset-password-request-new"
          onClick={onRetry}
          className="w-full h-12 font-semibold text-sm"
          style={{
            background: 'linear-gradient(135deg, var(--auth-brand), var(--auth-brand-strong))',
            color: '#f9f7ff',
          }}
        >
          Solicitar novo link
        </Button>
      </div>
    </div>
  );
}

// ─── Componente principal ────────────────────────────────────────────────────

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [isValidating, setIsValidating] = useState(true);
  const [isValidToken, setIsValidToken] = useState(false);
  const [tokenErrorType, setTokenErrorType] = useState<'invalid' | 'expired'>('invalid');
  const [requiresMfa, setRequiresMfa] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (!token) {
      setIsValidating(false);
      return;
    }

    const validateToken = async () => {
      try {
        const response = await apiClient.get(`/auth/reset-password/${token}`);
        setIsValidToken(true);
        setRequiresMfa(Boolean(response.data?.requiresMfa));
      } catch (error) {
        const apiError = error as AxiosError<{message?: string | string[]}>;
        const message = apiError.response?.data?.message;
        const normalizedMessage = Array.isArray(message) ? message.join(' ') : String(message || '');
        setTokenErrorType(
          normalizedMessage.toLowerCase().includes('expirad') ? 'expired' : 'invalid',
        );
        setIsValidToken(false);
      } finally {
        setIsValidating(false);
      }
    };

    validateToken();
  }, [token]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
      code: '',
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
    confirmPasswordValue.length > 0 && passwordValue === confirmPasswordValue;

  const onSubmit = async (data: FormValues) => {
    if (!token) return;

    setIsSubmitting(true);
    try {
      await apiClient.post('/auth/reset-password', {
        token,
        newPassword: data.password,
        confirmPassword: data.confirmPassword,
        tfCode: data.code,
      });

      setIsSuccess(true);
      toast.success('Senha alterada com sucesso!');
    } catch (error) {
      const apiError = error as AxiosError<{message?: string | string[]}>;
      const message = apiError.response?.data?.message;
      const normalizedMessage = Array.isArray(message) ? message.join('\n') : message;
      toast.error(
        normalizedMessage ||
          'Não foi possível redefinir sua senha. Verifique os dados informados e tente novamente.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isValidating) return <LoadingState />;
  if (!token || !isValidToken) {
    const title = tokenErrorType === 'expired' ? 'Link expirado' : 'Link inválido';
    const description =
      tokenErrorType === 'expired'
        ? 'O link para redefinição expirou. Solicite um novo link para continuar.'
        : 'O link para redefinição não é válido. Solicite um novo link de recuperação.';
    return (
      <InvalidTokenState
        onRetry={() => navigate('/forgot-password')}
        title={title}
        description={description}
      />
    );
  }

  return (
    <div
      id="reset-password-page"
      className="min-h-screen flex"
      style={{backgroundColor: 'var(--auth-bg)', fontFamily: 'var(--font-body)'}}
    >
      {/* Painel esquerdo */}
      <div
        className="hidden lg:flex lg:w-1/2 relative overflow-hidden flex-col justify-between p-14"
        style={{backgroundColor: 'var(--auth-panel)'}}
      >
        <div
          className="absolute top-0 left-0 w-96 h-96 rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(circle, var(--auth-highlight-soft) 0%, transparent 70%)',
          }}
        />

        {/* Logo */}
        <div className="relative z-10">
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
              }}
            >
              Redefinição de Senha
            </span>
          </div>
          <h1
            className="font-bold leading-tight mb-5"
            style={{
              color: 'var(--auth-text-main)',
              fontSize: '2.75rem',
              fontFamily: 'var(--font-heading)',
              letterSpacing: '-0.02em',
            }}
          >
            Quase lá. Crie uma nova senha segura.
          </h1>
          <p
            className="leading-relaxed"
            style={{color: 'var(--auth-text-body)', fontSize: '1rem', lineHeight: '1.7'}}
          >
            Escolha uma senha forte e exclusiva para proteger o acesso ao seu terminal financeiro.
          </p>

          {/* Dicas de segurança */}
          <div className="mt-10 space-y-3">
            {[
              'Mínimo de 8 caracteres',
              'Use letras maiúsculas, minúsculas e números',
              'Evite senhas reutilizadas de outros serviços',
            ].map((tip) => (
              <div
                key={tip}
                className="flex items-center gap-3 rounded-xl p-4"
                style={{backgroundColor: 'var(--auth-surface)'}}
              >
                <ShieldCheck className="w-4 h-4 flex-shrink-0" style={{color: 'var(--auth-brand)'}} />
                <span className="text-sm" style={{color: 'var(--auth-text-body-strong)'}}>
                  {tip}
                </span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs relative z-10" style={{color: 'var(--auth-text-soft)'}}>
          © 2025 Trackerr. Plataforma de análise de investimentos.
        </p>
      </div>

      {/* Painel direito */}
      <div
        className="flex-1 flex items-center justify-center p-8"
        style={{backgroundColor: 'var(--auth-bg)'}}
      >
        <div className="w-full max-w-md">
          {/* Logo mobile */}
          <div className="mb-8 flex justify-center lg:hidden">
            <AppLogo size="lg" />
          </div>

          {/* Botão voltar */}
          <button
            id="reset-password-back"
            onClick={() => navigate('/')}
            className="flex items-center gap-2 mb-8 text-sm transition-colors"
            style={{color: 'var(--auth-text-muted)'}}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--auth-text-accent)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--auth-text-muted)')}
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para o login
          </button>

          {isSuccess ? (
            /* ── Estado de sucesso ── */
            <div id="reset-password-success" data-testid="reset-password-success">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                style={{backgroundColor: 'var(--auth-highlight)'}}
              >
                <CheckCircle2 className="h-6 w-6" style={{color: 'var(--auth-text-accent)'}} />
              </div>
              <h2
                className="font-bold mb-2"
                style={{
                  color: 'var(--auth-text-main)',
                  fontSize: '1.875rem',
                  fontFamily: 'var(--font-heading)',
                  letterSpacing: '-0.02em',
                }}
              >
                Senha redefinida!
              </h2>
              <p
                className="mb-8"
                style={{color: 'var(--auth-text-muted)', fontSize: '0.9rem', lineHeight: '1.6'}}
              >
                Sua senha foi alterada com sucesso. Você já pode acessar o terminal com suas novas credenciais.
              </p>
              <Button
                id="reset-password-goto-login"
                onClick={() => navigate('/')}
                className="w-full h-12 font-semibold text-sm"
                style={{
                  background: 'linear-gradient(135deg, var(--auth-brand), var(--auth-brand-strong))',
                  color: '#f9f7ff',
                }}
              >
                Ir para o Login
              </Button>
            </div>
          ) : (
            /* ── Formulário ── */
            <>
              <div className="mb-8">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                  style={{backgroundColor: 'var(--auth-highlight)'}}
                >
                  <KeyRound className="h-6 w-6" style={{color: 'var(--auth-brand)'}} />
                </div>
                <h2
                  className="font-bold mb-2"
                  style={{
                    color: 'var(--auth-text-main)',
                    fontSize: '1.875rem',
                    fontFamily: 'var(--font-heading)',
                    letterSpacing: '-0.02em',
                  }}
                >
                  Nova senha
                </h2>
                <p style={{color: 'var(--auth-text-muted)', fontSize: '0.9rem'}}>
                  Digite sua nova senha abaixo.
                  {requiresMfa && ' Você também precisará informar seu código de Autenticação em Duas Etapas (2FA).'}
                </p>
              </div>

              <Form {...form}>
                <form
                  id="reset-password-form"
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-5"
                >
                  {/* Campo 2FA (condicional) */}
                  {requiresMfa && (
                    <FormField
                      control={form.control}
                      name="code"
                      render={({field}) => (
                        <FormItem>
                          <FormLabel
                            className="uppercase tracking-widest text-xs"
                            style={{color: 'var(--auth-text-body-strong)', letterSpacing: '0.1em'}}
                          >
                            Código de Autenticação (2FA)
                          </FormLabel>
                          <FormControl>
                            <InputOTP maxLength={6} {...field}>
                              <InputOTPGroup className="gap-2">
                                {[...Array(6)].map((_, index) => (
                                  <InputOTPSlot
                                    key={index}
                                    index={index}
                                    className="w-11 h-13 text-base border-0 rounded-lg focus-visible:ring-1 focus-visible:ring-[var(--auth-brand)]"
                                    style={{
                                      backgroundColor: 'var(--auth-input)',
                                      color: 'var(--auth-text-main)',
                                    }}
                                  />
                                ))}
                              </InputOTPGroup>
                            </InputOTP>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {/* Nova senha */}
                  <FormField
                    control={form.control}
                    name="password"
                    render={({field}) => (
                      <FormItem>
                        <FormLabel
                          className="uppercase tracking-widest text-xs"
                          style={{color: 'var(--auth-text-body-strong)', letterSpacing: '0.1em'}}
                        >
                          Nova Senha
                        </FormLabel>
                        <div className="relative">
                          <FormControl>
                            <Input
                              id="reset-password-new"
                              type={showPassword ? 'text' : 'password'}
                              placeholder="••••••••"
                              {...field}
                              className="h-12 border-0 pr-12 text-sm focus-visible:ring-1 focus-visible:ring-[var(--auth-brand)]"
                              style={{backgroundColor: 'var(--auth-input)', color: 'var(--auth-text-main)'}}
                            />
                          </FormControl>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-1 top-1 h-10 w-10 hover:bg-transparent"
                            style={{color: 'var(--auth-text-muted)'}}
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            <span className="sr-only">
                              {showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                            </span>
                          </Button>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Confirmar senha */}
                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({field}) => (
                      <FormItem>
                        <FormLabel
                          className="uppercase tracking-widest text-xs"
                          style={{color: 'var(--auth-text-body-strong)', letterSpacing: '0.1em'}}
                        >
                          Confirmar Nova Senha
                        </FormLabel>
                        <div className="relative">
                          <FormControl>
                            <Input
                              id="reset-password-confirm"
                              type={showConfirmPassword ? 'text' : 'password'}
                              placeholder="••••••••"
                              {...field}
                              className="h-12 border-0 pr-12 text-sm focus-visible:ring-1 focus-visible:ring-[var(--auth-brand)]"
                              style={{backgroundColor: 'var(--auth-input)', color: 'var(--auth-text-main)'}}
                            />
                          </FormControl>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-1 top-1 h-10 w-10 hover:bg-transparent"
                            style={{color: 'var(--auth-text-muted)'}}
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          >
                            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            <span className="sr-only">
                              {showConfirmPassword ? 'Ocultar senha' : 'Mostrar senha'}
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
                      backgroundColor: 'var(--auth-surface)',
                      borderColor: 'var(--auth-highlight)',
                      color: 'var(--auth-text-muted)',
                    }}>
                    <p className="mb-2 font-semibold" style={{color: 'var(--auth-text-body-strong)'}}>
                      Regras para criar a senha
                    </p>
                    <div className="space-y-1.5">
                      <p
                        className="flex items-center gap-2"
                        style={{color: hasMinLength ? '#34d399' : 'var(--auth-text-muted)'}}>
                        {hasMinLength ? (
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        ) : (
                          <AlertCircle className="h-3.5 w-3.5" />
                        )}
                        Mínimo de 8 caracteres
                      </p>
                      <p
                        className="flex items-center gap-2"
                        style={{color: hasUppercase ? '#34d399' : 'var(--auth-text-muted)'}}>
                        {hasUppercase ? (
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        ) : (
                          <AlertCircle className="h-3.5 w-3.5" />
                        )}
                        Pelo menos 1 letra maiúscula
                      </p>
                      <p
                        className="flex items-center gap-2"
                        style={{color: hasLowercase ? '#34d399' : 'var(--auth-text-muted)'}}>
                        {hasLowercase ? (
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        ) : (
                          <AlertCircle className="h-3.5 w-3.5" />
                        )}
                        Pelo menos 1 letra minúscula
                      </p>
                      <p
                        className="flex items-center gap-2"
                        style={{color: hasNumber ? '#34d399' : 'var(--auth-text-muted)'}}>
                        {hasNumber ? (
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        ) : (
                          <AlertCircle className="h-3.5 w-3.5" />
                        )}
                        Pelo menos 1 número
                      </p>
                      <p
                        className="flex items-center gap-2"
                        style={{color: hasSpecial ? '#34d399' : 'var(--auth-text-muted)'}}>
                        {hasSpecial ? (
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        ) : (
                          <AlertCircle className="h-3.5 w-3.5" />
                        )}
                        Pelo menos 1 caractere especial
                      </p>
                      <p
                        className="flex items-center gap-2"
                        style={{color: passwordsMatch ? '#34d399' : 'var(--auth-text-muted)'}}>
                        {passwordsMatch ? (
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        ) : (
                          <AlertCircle className="h-3.5 w-3.5" />
                        )}
                        A confirmação deve ser igual à nova senha
                      </p>
                    </div>
                  </div>

                  <Button
                    id="reset-password-submit"
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full h-12 font-semibold text-sm gap-2 transition-all duration-200"
                    style={{
                      background: 'linear-gradient(135deg, var(--auth-brand), var(--auth-brand-strong))',
                      color: '#f9f7ff',
                    }}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      'Salvar Nova Senha'
                    )}
                  </Button>
                </form>
              </Form>
            </>
          )}

          <p
            className="text-xs text-center mt-8"
            style={{color: 'rgba(195,197,216,0.3)'}}
          >
            Copyright © 2025 Trackerr. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </div>
  );
}
