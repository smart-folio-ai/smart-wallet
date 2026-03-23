import {useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {zodResolver} from '@hookform/resolvers/zod';
import {useForm} from 'react-hook-form';
import apiClient from '@/server/api/api';
import {useMutation} from '@tanstack/react-query';
import * as z from 'zod';
import {ArrowLeft, Loader2, TrendingUp, Mail, CheckCircle2} from 'lucide-react';
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
      style={{backgroundColor: '#0b1326', fontFamily: 'Inter, sans-serif'}}>
      {/* Painel esquerdo */}
      <div
        className="hidden lg:flex lg:w-1/2 relative overflow-hidden flex-col justify-between p-14"
        style={{backgroundColor: '#060d20'}}>
        <div
          className="absolute top-0 left-0 w-96 h-96 rounded-full pointer-events-none"
          style={{
            background:
              'radial-gradient(circle, rgba(38,101,253,0.08) 0%, transparent 70%)',
          }}
        />

        {/* Logo */}
        <div className="flex items-center gap-3 relative z-10">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center"
            style={{backgroundColor: '#2665fd'}}>
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <span
            className="text-xl font-bold tracking-tight"
            style={{color: '#dbe2fd', fontFamily: 'Manrope, sans-serif'}}>
            Trackerr
          </span>
        </div>

        {/* Conteúdo central */}
        <div className="relative z-10 flex-1 flex flex-col justify-center">
          <div className="mb-6 inline-flex">
            <span
              className="text-xs font-medium uppercase tracking-widest px-3 py-1 rounded-full"
              style={{
                color: '#b5c4ff',
                backgroundColor: 'rgba(38,101,253,0.12)',
                fontFamily: 'Inter, sans-serif',
                letterSpacing: '0.12em',
              }}>
              Recuperação de Acesso
            </span>
          </div>
          <h1
            className="font-bold leading-tight mb-5"
            style={{
              color: '#dbe2fd',
              fontSize: '2.75rem',
              fontFamily: 'Manrope, sans-serif',
              letterSpacing: '-0.02em',
            }}>
            Recupere seu acesso de forma rápida e segura.
          </h1>
          <p
            className="leading-relaxed"
            style={{
              color: 'rgba(195,197,216,0.75)',
              fontSize: '1rem',
              lineHeight: '1.7',
            }}>
            Acontece com os melhores. Informe seu e-mail cadastrado e enviaremos
            as instruções de recuperação em instantes.
          </p>

          {/* Steps */}
          <div className="mt-10 space-y-4">
            {[
              {
                step: '01',
                title: 'Informe seu e-mail',
                desc: 'Digite o e-mail vinculado à sua conta',
              },
              {
                step: '02',
                title: 'Verifique sua caixa de entrada',
                desc: 'Enviaremos um link de recuperação seguro',
              },
              {
                step: '03',
                title: 'Redefina sua senha',
                desc: 'Crie uma nova senha e acesse o terminal',
              },
            ].map((item) => (
              <div
                key={item.step}
                className="flex items-start gap-4 rounded-xl p-4"
                style={{backgroundColor: '#131b2e'}}>
                <span
                  className="text-xs font-bold tabular-nums mt-0.5"
                  style={{
                    color: '#2665fd',
                    fontFamily: 'Manrope, sans-serif',
                    minWidth: '1.5rem',
                  }}>
                  {item.step}
                </span>
                <div>
                  <div
                    className="font-semibold text-sm mb-0.5"
                    style={{
                      color: '#dbe2fd',
                      fontFamily: 'Manrope, sans-serif',
                    }}>
                    {item.title}
                  </div>
                  <div
                    className="text-xs"
                    style={{color: 'rgba(195,197,216,0.6)'}}>
                    {item.desc}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p
          className="text-xs relative z-10"
          style={{color: 'rgba(195,197,216,0.4)'}}>
          © 2025 Trackerr. Plataforma de análise de investimentos.
        </p>
      </div>

      {/* Painel direito */}
      <div
        className="flex-1 flex items-center justify-center p-8"
        style={{backgroundColor: '#0b1326'}}>
        <div className="w-full max-w-md">
          {/* Logo mobile */}
          <div className="mb-8 lg:hidden flex items-center gap-3 justify-center">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center"
              style={{backgroundColor: '#2665fd'}}>
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <span
              className="text-xl font-bold"
              style={{color: '#dbe2fd', fontFamily: 'Manrope, sans-serif'}}>
              Trackerr
            </span>
          </div>

          {/* Botão Voltar */}
          <button
            id="forgot-password-back"
            onClick={() => navigate('/')}
            className="flex items-center gap-2 mb-8 text-sm transition-colors"
            style={{color: 'rgba(195,197,216,0.6)'}}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#b5c4ff')}
            onMouseLeave={(e) =>
              (e.currentTarget.style.color = 'rgba(195,197,216,0.6)')
            }>
            <ArrowLeft className="h-4 w-4" />
            Voltar para o login
          </button>

          {!isSubmitted ? (
            <>
              {/* Cabeçalho */}
              <div className="mb-8">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                  style={{backgroundColor: 'rgba(38,101,253,0.12)'}}>
                  <Mail className="h-6 w-6" style={{color: '#2665fd'}} />
                </div>
                <h2
                  className="font-bold mb-2"
                  style={{
                    color: '#dbe2fd',
                    fontSize: '1.875rem',
                    fontFamily: 'Manrope, sans-serif',
                    letterSpacing: '-0.02em',
                  }}>
                  Esqueceu sua senha?
                </h2>
                <p style={{color: 'rgba(195,197,216,0.6)', fontSize: '0.9rem'}}>
                  Informe seu e-mail e enviaremos as instruções para a
                  recuperação.
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
                          className="uppercase tracking-widest text-xs"
                          style={{
                            color: 'rgba(195,197,216,0.7)',
                            letterSpacing: '0.1em',
                          }}>
                          E-mail
                        </FormLabel>
                        <FormControl>
                          <Input
                            id="forgot-password-email"
                            placeholder="seu@email.com"
                            {...field}
                            className="h-12 border-0 text-sm focus-visible:ring-1 focus-visible:ring-[#2665fd]"
                            style={{
                              backgroundColor: '#2d3449',
                              color: '#dbe2fd',
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    id="forgot-password-submit"
                    type="submit"
                    disabled={isPending}
                    className="w-full h-12 font-semibold text-sm gap-2 transition-all duration-200"
                    style={{
                      background: 'linear-gradient(135deg, #2665fd, #0050e1)',
                      color: '#f9f7ff',
                    }}>
                    {isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      'Enviar Instruções'
                    )}
                  </Button>
                </form>
              </Form>
            </>
          ) : (
            <div id="forgot-password-success">
              {/* Estado de sucesso */}
              <div className="mb-8">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                  style={{backgroundColor: 'rgba(38,101,253,0.12)'}}>
                  <CheckCircle2
                    className="h-6 w-6"
                    style={{color: '#b5c4ff'}}
                  />
                </div>
                <h2
                  className="font-bold mb-2"
                  style={{
                    color: '#dbe2fd',
                    fontSize: '1.875rem',
                    fontFamily: 'Manrope, sans-serif',
                    letterSpacing: '-0.02em',
                  }}>
                  Email enviado!
                </h2>
                <p
                  style={{
                    color: 'rgba(195,197,216,0.6)',
                    fontSize: '0.9rem',
                    lineHeight: '1.6',
                  }}>
                  Enviamos as instruções de recuperação para{' '}
                  <span style={{color: '#b5c4ff', fontWeight: 600}}>
                    {form.getValues().email}
                  </span>
                  . Verifique sua caixa de entrada e a pasta de spam.
                </p>
              </div>

              <div
                className="rounded-xl p-4 mb-6"
                style={{backgroundColor: '#131b2e'}}>
                <p className="text-sm" style={{color: 'rgba(195,197,216,0.7)'}}>
                  O link de recuperação expira em{' '}
                  <strong style={{color: '#b5c4ff'}}>30 minutos</strong>. Caso
                  não receba o e-mail, tente novamente.
                </p>
              </div>

              <Button
                id="forgot-password-retry"
                variant="outline"
                className="w-full h-12 font-semibold text-sm border-0 transition-all duration-200"
                style={{
                  backgroundColor: '#2d3449',
                  color: '#dbe2fd',
                }}
                onClick={() => setIsSubmitted(false)}>
                Tentar outro e-mail
              </Button>
            </div>
          )}

          <p
            className="text-xs text-center mt-8"
            style={{color: 'rgba(195,197,216,0.3)'}}>
            Copyright © 2025 Trackerr. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </div>
  );
}
