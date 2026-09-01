import {useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {zodResolver} from '@hookform/resolvers/zod';
import {useForm} from 'react-hook-form';
import apiClient from '@/server/api/api';
import {useMutation} from '@tanstack/react-query';
import * as z from 'zod';
import {ArrowLeft, ArrowRight} from '@/components/ui/icons';
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
import {toast} from 'sonner';
import {AppLogo} from '@/components/AppLogo';

const formSchema = z.object({
  email: z.string().email('Digite um email válido'),
});

type FormValues = z.infer<typeof formSchema>;

export default function ForgotPassword() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const navigate = useNavigate();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
    },
  });

  const {mutate: forgotPassword, isPending} = useMutation({
    mutationFn: async (data: FormValues) => {
      const response = await apiClient.post('/auth/forgot-password', data);
      return response.data;
    },
    onSuccess: () => {
      setIsSubmitted(true);
      toast.success('Email de recuperação enviado com sucesso!');
    },
    onError: () => {
      toast.error(
        'Não conseguimos enviar o e-mail de recuperação agora. Tente novamente.',
      );
    },
  });

  const onSubmit = (data: FormValues) => {
    forgotPassword(data);
  };

  return (
    <div
      id="forgot-password-page"
      className="min-h-screen flex"
      style={{fontFamily: 'var(--font-body)'}}>
      {/* Painel esquerdo - editorial */}
      <div
        className="hidden lg:flex lg:w-1/2 relative overflow-hidden flex-col justify-between p-14"
        style={{background: 'var(--surf-2)'}}>
        {/* Glow ambiental */}
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
              Recuperação de Acesso
            </span>
          </div>
          <h1
            className="font-bold leading-tight mb-5"
            style={{
              fontSize: '2.75rem',
              fontFamily: 'var(--font-heading)',
              letterSpacing: '-0.02em',
            }}>
            Recupere seu acesso com segurança.
          </h1>
          <p
            className="leading-relaxed"
            style={{
              fontSize: '1rem',
              lineHeight: '1.7',
              color: 'var(--color-neutral-500)',
            }}>
            Acontece com os melhores. Informe seu e-mail cadastrado e enviaremos
            as instruções de recuperação em instantes para que você volte ao
            terminal.
          </p>

          {/* Passos */}
          <div className="mt-10 space-y-4">
            {[
              {
                step: '01',
                title: 'Identificação',
                desc: 'Informe seu e-mail de acesso',
              },
              {
                step: '02',
                title: 'Verificação',
                desc: 'Enviaremos um link seguro para você',
              },
              {
                step: '03',
                title: 'Redefinição',
                desc: 'Escolha uma nova senha forte',
              },
            ].map((item) => (
              <div
                key={item.step}
                className="flex items-start gap-4 rounded-xl p-4 transition-colors"
                style={{background: 'var(--surf-3)'}}>
                <span
                  className="text-xs font-bold mt-0.5"
                  style={{
                    fontFamily: 'var(--font-heading)',
                    color: 'var(--ac)',
                  }}>
                  {item.step}
                </span>
                <div>
                  <div
                    className="font-semibold text-sm mb-0.5"
                    style={{fontFamily: 'var(--font-heading)'}}>
                    {item.title}
                  </div>
                  <div
                    className="text-xs"
                    style={{color: 'var(--color-neutral-500)'}}>
                    {item.desc}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Rodapé */}
        <p
          className="text-xs relative z-10"
          style={{color: 'var(--color-neutral-500)', opacity: 0.5}}>
          © 2025 Trackerr. Terminal de inteligência financeira.
        </p>
      </div>

      {/* Painel direito - formulário */}
      <div
        className="flex-1 flex items-center justify-center p-8"
        style={{background: 'var(--surf-1)'}}>
        <div className="w-full max-w-md">
          {/* Logo mobile */}
          <div className="mb-8 flex justify-center lg:hidden">
            <AppLogo size="lg" />
          </div>

          {!isSubmitted ? (
            <>
              {/* Botão Voltar */}
              <button
                id="forgot-password-back"
                onClick={() => navigate('/')}
                className="flex items-center gap-2 mb-8 text-sm font-medium transition-colors"
                style={{color: 'var(--color-neutral-500)'}}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--ac)')}
                onMouseLeave={(e) =>
                  (e.currentTarget.style.color = 'var(--color-neutral-500)')
                }>
                <ArrowLeft className="h-4 w-4" />
                Voltar para o login
              </button>

              {/* Cabeçalho do form */}
              <div className="mb-8">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                  style={{background: 'rgba(145,132,217,0.15)'}}>
                  <i className="ph-fill ph-envelope" style={{fontSize: 24, color: 'var(--ac)'}} />
                </div>
                <h2
                  className="font-bold mb-2"
                  style={{
                    fontSize: '1.875rem',
                    fontFamily: 'var(--font-heading)',
                    letterSpacing: '-0.02em',
                  }}>
                  Esqueceu a senha?
                </h2>
                <p style={{fontSize: '0.9rem', color: 'var(--color-neutral-500)'}}>
                  Não se preocupe, vamos te ajudar a recuperar o acesso ao seu
                  terminal financeiro.
                </p>
              </div>

              {/* Formulário */}
              <Form {...form}>
                <form
                  id="forgot-password-form"
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-5">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({field}) => (
                      <FormItem>
                        <FormLabel
                          htmlFor="forgot-password-email"
                          className="uppercase tracking-widest text-xs font-bold"
                          style={{
                            letterSpacing: '0.1em',
                            color: 'var(--color-neutral-500)',
                          }}>
                          E-mail cadastrado
                        </FormLabel>
                        <FormControl>
                          <Input
                            id="forgot-password-email"
                            placeholder="seu@email.com"
                            {...field}
                            className="h-12 text-sm"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    id="forgot-password-submit"
                    type="submit"
                    className="w-full h-12 font-bold text-sm gap-2 transition-all duration-200"
                    style={{background: 'var(--grad-violet)', color: '#fff'}}
                    disabled={isPending}>
                    {isPending ? (
                      <>
                        <i className="ph-fill ph-spinner" style={{fontSize: 16, animation: 'spin 0.8s linear infinite'}} />
                        Enviando...
                      </>
                    ) : (
                      <>
                        Enviar Instruções
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </>
          ) : (
            <div id="forgot-password-success" className="text-center">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
                style={{background: 'rgba(47,214,163,0.20)'}}>
                <i className="ph-fill ph-check-circle" style={{fontSize: 32, color: 'var(--pos)'}} />
              </div>
              <h2
                className="font-bold mb-3"
                style={{
                  fontSize: '1.875rem',
                  fontFamily: 'var(--font-heading)',
                  letterSpacing: '-0.02em',
                }}>
                E-mail enviado!
              </h2>
              <p
                className="mb-8"
                style={{lineHeight: '1.6', color: 'var(--color-neutral-500)'}}>
                Enviamos as instruções de recuperação para{' '}
                <span className="font-semibold" style={{color: 'inherit'}}>
                  {form.getValues().email}
                </span>
                . Por favor, verifique sua caixa de entrada e spam.
              </p>

              <div
                className="rounded-xl p-4 mb-8 text-left"
                style={{
                  background: 'var(--surf-3)',
                  border: '1px solid var(--hair)',
                }}>
                <p className="text-xs leading-relaxed" style={{color: 'var(--color-neutral-500)'}}>
                  <strong>Aviso:</strong> O link de recuperação enviado expira
                  em 30 minutos por motivos de segurança.
                </p>
              </div>

              <Button
                id="forgot-password-retry"
                variant="outline"
                className="w-full h-12 font-semibold text-sm transition-colors"
                onClick={() => setIsSubmitted(false)}>
                Tentar outro e-mail
              </Button>

              <button
                onClick={() => navigate('/')}
                className="mt-6 text-sm font-medium transition-colors"
                style={{color: 'var(--color-neutral-500)'}}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--ac)')}
                onMouseLeave={(e) =>
                  (e.currentTarget.style.color = 'var(--color-neutral-500)')
                }>
                Voltar para o login
              </button>
            </div>
          )}

          {/* Rodapé */}
          <p
            className="text-xs text-center mt-12"
            style={{color: 'var(--color-neutral-500)', opacity: 0.4}}>
            Copyright © 2025 Trackerr. Todos os direitos reservados.
          </p>
        </div>
      </div>
      <style>{'@keyframes spin{to{transform:rotate(360deg)}}'}</style>
    </div>
  );
}
