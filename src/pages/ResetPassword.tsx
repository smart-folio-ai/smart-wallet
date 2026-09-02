import React, {useState, useEffect} from 'react';
import {useNavigate, useSearchParams} from 'react-router-dom';
import {zodResolver} from '@hookform/resolvers/zod';
import {useForm} from 'react-hook-form';
import * as z from 'zod';
import apiClient from '@/server/api/api';
import {AxiosError} from 'axios';
import {
  Eye,
  EyeOff,
  ArrowLeft,
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
import {InputOTP, InputOTPGroup, InputOTPSlot} from '@/components/ui/input-otp';
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
      .regex(
        /[^A-Za-z0-9]/,
        'A senha deve conter pelo menos 1 caractere especial',
      ),
    confirmPassword: z.string(),
    code: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas não coincidem',
    path: ['confirmPassword'],
  });

type FormValues = z.infer<typeof formSchema>;

function LoadingState() {
  return (
    <div
      id="reset-password-loading"
      data-testid="reset-password-loading"
      className="min-h-screen flex items-center justify-center"
      style={{background: 'var(--surf-1)'}}>
      <div className="flex flex-col items-center gap-4">
        <i
          className="ph-fill ph-spinner"
          style={{fontSize: 40, color: 'var(--ac)', animation: 'spin 0.8s linear infinite'}}
        />
        <p className="text-sm" style={{color: 'var(--color-neutral-500)'}}>
          Validando link de recuperação...
        </p>
      </div>
    </div>
  );
}

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
      style={{background: 'var(--surf-1)'}}>
      <div className="w-full max-w-md text-center">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
          style={{background: 'var(--badge-neg-bg)'}}>
          <i className="ph-fill ph-x-circle" style={{fontSize: 32, color: 'var(--neg)'}} />
        </div>
        <h2
          className="font-bold mb-3"
          style={{
            fontSize: '1.75rem',
            fontFamily: 'var(--font-heading)',
            letterSpacing: '-0.02em',
          }}>
          {title}
        </h2>
        <p
          className="mb-8 leading-relaxed"
          style={{fontSize: '0.9rem', color: 'var(--color-neutral-500)'}}>
          {description}
        </p>
        <Button
          id="reset-password-request-new"
          onClick={onRetry}
          className="w-full h-12 font-semibold text-sm"
          style={{background: 'var(--grad-violet)', color: '#fff'}}>
          Solicitar novo link
        </Button>
      </div>
    </div>
  );
}

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [isValidating, setIsValidating] = useState(true);
  const [isValidToken, setIsValidToken] = useState(false);
  const [tokenErrorType, setTokenErrorType] = useState<'invalid' | 'expired'>(
    'invalid',
  );
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
        const normalizedMessage = Array.isArray(message)
          ? message.join(' ')
          : String(message || '');
        setTokenErrorType(
          normalizedMessage.toLowerCase().includes('expirad')
            ? 'expired'
            : 'invalid',
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
      const normalizedMessage = Array.isArray(message)
        ? message.join('\n')
        : message;
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
    const title =
      tokenErrorType === 'expired' ? 'Link expirado' : 'Link inválido';
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
    <>
      <style>{'@keyframes spin{to{transform:rotate(360deg)}}'}</style>
      <div
        id="reset-password-page"
        className="min-h-screen flex"
        style={{fontFamily: 'var(--font-body)'}}>
        {/* Painel esquerdo */}
        <div
          className="hidden lg:flex lg:w-1/2 relative overflow-hidden flex-col justify-between p-14"
          style={{
            borderRight: '1px solid var(--hair)',
            background: 'linear-gradient(140deg, rgba(111,94,217,0.42) 0%, rgba(76,201,240,0.16) 46%, transparent 100%), var(--sunk)',
          }}>
          <div
            className="absolute top-0 left-0 w-96 h-96 rounded-full pointer-events-none"
            style={{
              background:
                'radial-gradient(circle, rgba(111,94,217,0.08) 0%, transparent 70%)',
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
                  fontFamily: 'var(--font-body)',
                  letterSpacing: '0.12em',
                  color: 'var(--ac)',
                  background: 'rgba(145,132,217,0.15)',
                }}>
                Redefinição de Senha
              </span>
            </div>
            <h1
              className="font-bold leading-tight mb-5"
              style={{
                fontSize: '2.75rem',
                fontFamily: 'var(--font-heading)',
                letterSpacing: '-0.02em',
              }}>
              Quase lá. Crie uma nova senha segura.
            </h1>
            <p
              className="leading-relaxed"
              style={{
                fontSize: '1rem',
                lineHeight: '1.7',
                color: 'var(--color-neutral-500)',
              }}>
              Escolha uma senha forte e exclusiva para proteger o acesso ao seu
              terminal financeiro.
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
                  style={{background: 'var(--surf-3)'}}>
                  <i
                    className="ph-fill ph-shield-check"
                    style={{fontSize: 16, color: 'var(--ac)', flexShrink: 0}}
                  />
                  <span
                    className="text-sm"
                    style={{color: 'var(--color-neutral-500)'}}>
                    {tip}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <p
            className="text-xs relative z-10"
            style={{color: 'var(--color-neutral-500)', opacity: 0.4}}>
            © 2025 Trackerr. Plataforma de análise de investimentos.
          </p>
        </div>

        {/* Painel direito */}
        <div
          className="flex-1 flex items-center justify-center p-8"
          style={{background: 'radial-gradient(680px 420px at 78% -10%, rgba(111,94,217,0.24) 0%, transparent 60%), var(--surf-1)'}}>
          <div className="w-full max-w-md">
            {/* Logo mobile */}
            <div className="mb-8 flex justify-center lg:hidden">
              <AppLogo size="lg" />
            </div>

            {/* Botão voltar */}
            <button
              id="reset-password-back"
              onClick={() => navigate('/signin')}
              className="flex items-center gap-2 mb-8 text-sm transition-colors"
              style={{color: 'var(--color-neutral-500)'}}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--ac)')}
              onMouseLeave={(e) =>
                (e.currentTarget.style.color = 'var(--color-neutral-500)')
              }>
              <ArrowLeft className="h-4 w-4" />
              Voltar para o login
            </button>

            {isSuccess ? (
              /* ── Estado de sucesso ── */
              <div
                id="reset-password-success"
                data-testid="reset-password-success">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                  style={{background: 'rgba(145,132,217,0.15)'}}>
                  <i className="ph-fill ph-check-circle" style={{fontSize: 24, color: 'var(--ac)'}} />
                </div>
                <h2
                  className="font-bold mb-2"
                  style={{
                    fontSize: '1.875rem',
                    fontFamily: 'var(--font-heading)',
                    letterSpacing: '-0.02em',
                  }}>
                  Senha redefinida!
                </h2>
                <p
                  className="mb-8"
                  style={{
                    fontSize: '0.9rem',
                    lineHeight: '1.6',
                    color: 'var(--color-neutral-500)',
                  }}>
                  Sua senha foi alterada com sucesso. Você já pode acessar o
                  terminal com suas novas credenciais.
                </p>
                <Button
                  id="reset-password-goto-login"
                  onClick={() => navigate('/')}
                  className="w-full h-12 font-semibold text-sm"
                  style={{background: 'var(--grad-violet)', color: '#fff'}}>
                  Ir para o Login
                </Button>
              </div>
            ) : (
              /* ── Formulário ── */
              <>
                <div className="mb-8">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                    style={{background: 'rgba(145,132,217,0.15)'}}>
                    <i className="ph-fill ph-key" style={{fontSize: 24, color: 'var(--ac)'}} />
                  </div>
                  <h2
                    className="font-bold mb-2"
                    style={{
                      fontSize: '1.875rem',
                      fontFamily: 'var(--font-heading)',
                      letterSpacing: '-0.02em',
                    }}>
                    Nova senha
                  </h2>
                  <p style={{fontSize: '0.9rem', color: 'var(--color-neutral-500)'}}>
                    Digite sua nova senha abaixo.
                    {requiresMfa &&
                      ' Você também precisará informar seu código de Autenticação em Duas Etapas (2FA).'}
                  </p>
                </div>

                <Form {...form}>
                  <form
                    id="reset-password-form"
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-5">
                    {/* Campo 2FA (condicional) */}
                    {requiresMfa && (
                      <FormField
                        control={form.control}
                        name="code"
                        render={({field}) => (
                          <FormItem>
                            <FormLabel
                              className="uppercase tracking-widest text-xs"
                              style={{
                                letterSpacing: '0.1em',
                                color: 'var(--color-neutral-500)',
                              }}>
                              Código de Autenticação (2FA)
                            </FormLabel>
                            <FormControl>
                              <InputOTP maxLength={6} {...field}>
                                <InputOTPGroup className="gap-2">
                                  {[...Array(6)].map((_, index) => (
                                    <InputOTPSlot
                                      key={index}
                                      index={index}
                                      className="w-11 h-13 text-base border rounded-lg"
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
                            style={{
                              letterSpacing: '0.1em',
                              color: 'var(--color-neutral-500)',
                            }}>
                            Nova Senha
                          </FormLabel>
                          <div className="relative">
                            <FormControl>
                              <Input
                                id="reset-password-new"
                                type={showPassword ? 'text' : 'password'}
                                placeholder="••••••••"
                                {...field}
                                className="h-12 pr-12 text-sm"
                              />
                            </FormControl>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="absolute right-1 top-1 h-10 w-10 hover:bg-transparent"
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

                    {/* Confirmar senha */}
                    <FormField
                      control={form.control}
                      name="confirmPassword"
                      render={({field}) => (
                        <FormItem>
                          <FormLabel
                            className="uppercase tracking-widest text-xs"
                            style={{
                              letterSpacing: '0.1em',
                              color: 'var(--color-neutral-500)',
                            }}>
                            Confirmar Nova Senha
                          </FormLabel>
                          <div className="relative">
                            <FormControl>
                              <Input
                                id="reset-password-confirm"
                                type={showConfirmPassword ? 'text' : 'password'}
                                placeholder="••••••••"
                                {...field}
                                className="h-12 pr-12 text-sm"
                              />
                            </FormControl>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="absolute right-1 top-1 h-10 w-10 hover:bg-transparent"
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
                        Regras para criar a senha
                      </p>
                      <div className="space-y-1.5">
                        <p
                          className="flex items-center gap-2"
                          style={{color: hasMinLength ? 'var(--pos)' : 'var(--color-neutral-500)'}}>
                          <i className={`ph-fill ${hasMinLength ? 'ph-check-circle' : 'ph-warning-circle'}`} style={{fontSize: 14}} />
                          Mínimo de 8 caracteres
                        </p>
                        <p
                          className="flex items-center gap-2"
                          style={{color: hasUppercase ? 'var(--pos)' : 'var(--color-neutral-500)'}}>
                          <i className={`ph-fill ${hasUppercase ? 'ph-check-circle' : 'ph-warning-circle'}`} style={{fontSize: 14}} />
                          Pelo menos 1 letra maiúscula
                        </p>
                        <p
                          className="flex items-center gap-2"
                          style={{color: hasLowercase ? 'var(--pos)' : 'var(--color-neutral-500)'}}>
                          <i className={`ph-fill ${hasLowercase ? 'ph-check-circle' : 'ph-warning-circle'}`} style={{fontSize: 14}} />
                          Pelo menos 1 letra minúscula
                        </p>
                        <p
                          className="flex items-center gap-2"
                          style={{color: hasNumber ? 'var(--pos)' : 'var(--color-neutral-500)'}}>
                          <i className={`ph-fill ${hasNumber ? 'ph-check-circle' : 'ph-warning-circle'}`} style={{fontSize: 14}} />
                          Pelo menos 1 número
                        </p>
                        <p
                          className="flex items-center gap-2"
                          style={{color: hasSpecial ? 'var(--pos)' : 'var(--color-neutral-500)'}}>
                          <i className={`ph-fill ${hasSpecial ? 'ph-check-circle' : 'ph-warning-circle'}`} style={{fontSize: 14}} />
                          Pelo menos 1 caractere especial
                        </p>
                        <p
                          className="flex items-center gap-2"
                          style={{color: passwordsMatch ? 'var(--pos)' : 'var(--color-neutral-500)'}}>
                          <i className={`ph-fill ${passwordsMatch ? 'ph-check-circle' : 'ph-warning-circle'}`} style={{fontSize: 14}} />
                          A confirmação deve ser igual à nova senha
                        </p>
                      </div>
                    </div>

                    <Button
                      id="reset-password-submit"
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full h-12 font-semibold text-sm gap-2 transition-all duration-200"
                      style={{background: 'var(--grad-violet)', color: '#fff'}}>
                      {isSubmitting ? (
                        <>
                          <i className="ph-fill ph-spinner" style={{fontSize: 16, animation: 'spin 0.8s linear infinite'}} />
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
              style={{color: 'rgba(195,197,216,0.3)'}}>
              Copyright © 2025 Trackerr. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
