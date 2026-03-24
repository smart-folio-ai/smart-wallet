import {useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {zodResolver} from '@hookform/resolvers/zod';
import {useForm} from 'react-hook-form';
import apiClient from '@/server/api/api';
import {useMutation} from '@tanstack/react-query';
import * as z from 'zod';
import {
  ArrowLeft,
  Loader2,
  TrendingUp,
  Mail,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';
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
      style={{fontFamily: 'Inter, sans-serif'}}>
      {/* Painel esquerdo - editorial */}
      <div
        className="hidden lg:flex lg:w-1/2 relative overflow-hidden flex-col justify-between p-14"
        style={{backgroundColor: '#060d20'}}>
        {/* Glow ambiental */}
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
            Recupere seu acesso com segurança.
          </h1>
          <p
            className="leading-relaxed"
            style={{
              color: 'rgba(195,197,216,0.75)',
              fontSize: '1rem',
              lineHeight: '1.7',
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
                className="flex items-start gap-4 rounded-xl p-4 transition-colors hover:bg-[#1a253d]"
                style={{backgroundColor: '#131b2e'}}>
                <span
                  className="text-xs font-bold mt-0.5"
                  style={{color: '#2665fd', fontFamily: 'Manrope, sans-serif'}}>
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

        {/* Rodapé */}
        <p
          className="text-xs relative z-10"
          style={{color: 'rgba(195,197,216,0.4)'}}>
          © 2025 Trackerr. Terminal de inteligência financeira.
        </p>
      </div>

      {/* Painel direito - formulário (BRANCO) */}
      <div
        className="flex-1 flex items-center justify-center p-8"
        style={{backgroundColor: '#ffffff'}}>
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
              style={{color: '#060d20', fontFamily: 'Manrope, sans-serif'}}>
              Trackerr
            </span>
          </div>

          {!isSubmitted ? (
            <>
              {/* Botão Voltar */}
              <button
                id="forgot-password-back"
                onClick={() => navigate('/')}
                className="flex items-center gap-2 mb-8 text-sm font-medium transition-colors hover:text-[#2665fd]"
                style={{color: '#64748b'}}>
                <ArrowLeft className="h-4 w-4" />
                Voltar para o login
              </button>

              {/* Cabeçalho do form */}
              <div className="mb-8">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                  style={{backgroundColor: 'rgba(38,101,253,0.08)'}}>
                  <Mail className="h-6 w-6" style={{color: '#2665fd'}} />
                </div>
                <h2
                  className="font-bold mb-2"
                  style={{
                    color: '#060d20',
                    fontSize: '1.875rem',
                    fontFamily: 'Manrope, sans-serif',
                    letterSpacing: '-0.02em',
                  }}>
                  Esqueceu a senha?
                </h2>
                <p style={{color: '#64748b', fontSize: '0.9rem'}}>
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
                          className="uppercase tracking-widest text-xs font-bold"
                          style={{color: '#64748b', letterSpacing: '0.1em'}}>
                          E-mail cadastrado
                        </FormLabel>
                        <FormControl>
                          <Input
                            id="forgot-password-email"
                            placeholder="seu@email.com"
                            {...field}
                            className="h-12 border border-slate-200 text-sm focus-visible:ring-1 focus-visible:ring-[#2665fd] bg-slate-50/50"
                            style={{color: '#060d20'}}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    id="forgot-password-submit"
                    type="submit"
                    className="w-full h-12 font-bold text-sm gap-2 transition-all duration-200 shadow-lg shadow-blue-500/20"
                    style={{
                      background: 'linear-gradient(135deg, #2665fd, #0050e1)',
                      color: '#f9f7ff',
                    }}
                    disabled={isPending}>
                    {isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
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
                style={{backgroundColor: 'rgba(16,185,129,0.08)'}}>
                <CheckCircle2 className="h-8 w-8 text-emerald-500" />
              </div>
              <h2
                className="font-bold mb-3"
                style={{
                  color: '#060d20',
                  fontSize: '1.875rem',
                  fontFamily: 'Manrope, sans-serif',
                  letterSpacing: '-0.02em',
                }}>
                E-mail enviado!
              </h2>
              <p className="mb-8" style={{color: '#64748b', lineHeight: '1.6'}}>
                Enviamos as instruções de recuperação para{' '}
                <span className="font-semibold text-[#060d20]">
                  {form.getValues().email}
                </span>
                . Por favor, verifique sua caixa de entrada e spam.
              </p>

              <div
                className="rounded-xl p-4 mb-8 text-left border border-slate-100"
                style={{backgroundColor: '#f8fafc'}}>
                <p
                  className="text-xs leading-relaxed"
                  style={{color: '#64748b'}}>
                  <strong>Aviso:</strong> O link de recuperação enviado expira
                  em 30 minutos por motivos de segurança.
                </p>
              </div>

              <Button
                id="forgot-password-retry"
                variant="outline"
                className="w-full h-12 font-semibold text-sm border-slate-200 hover:bg-slate-50 transition-colors"
                onClick={() => setIsSubmitted(false)}>
                Tentar outro e-mail
              </Button>

              <button
                onClick={() => navigate('/')}
                className="mt-6 text-sm font-medium transition-colors hover:text-[#2665fd]"
                style={{color: '#64748b'}}>
                Voltar para o login
              </button>
            </div>
          )}

          {/* Rodapé */}
          <p className="text-xs text-center mt-12" style={{color: '#94a3b8'}}>
            Copyright © 2025 Trackerr. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </div>
  );
}
