import React, {useState} from 'react';
import {useNavigate, useLocation} from 'react-router-dom';
import {zodResolver} from '@hookform/resolvers/zod';
import {useForm} from 'react-hook-form';
import * as z from 'zod';
import {Eye, EyeOff, ArrowRight, TrendingUp} from 'lucide-react';
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

const formSchema = z.object({
  email: z.string().email('Digite um email válido'),
  password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres'),
  keepConnect: z.boolean().optional().default(false),
});

type FormValues = z.infer<typeof formSchema>;

export default function SignIn() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
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
    setLoading(true);
    const response = await AuthenticationService.authenticate(
      data.email,
      data.password,
      data.keepConnect,
    );
    if (!response || !response.success) {
      toast.error(
        'Erro ao realizar login. Verifique suas credenciais e tente novamente.',
      );
      setLoading(false);
      return;
    }

    if (response.requires2FA) {
      toast.info('Código 2FA necessário');
      navigate('/2fa-verify', {replace: true});
      return;
    }

    setTimeout(() => {
      toast.success('Login realizado com sucesso!');
      navigate(from, {replace: true});
    }, 1000);
  };

  return (
    <>
      <WalletLoadingScreen isLoading={loading} loadingText="Entrando..." />
      <div
        id="signin-page"
        className="min-h-screen flex"
        style={{backgroundColor: '#0b1326', fontFamily: 'Inter, sans-serif'}}
      >
        {/* Painel esquerdo - editorial */}
        <div
          className="hidden lg:flex lg:w-1/2 relative overflow-hidden flex-col justify-between p-14"
          style={{backgroundColor: '#060d20'}}
        >
          {/* Glow ambiental */}
          <div
            className="absolute top-0 left-0 w-96 h-96 rounded-full pointer-events-none"
            style={{
              background: 'radial-gradient(circle, rgba(38,101,253,0.08) 0%, transparent 70%)',
            }}
          />
          <div
            className="absolute bottom-0 right-0 w-80 h-80 rounded-full pointer-events-none"
            style={{
              background: 'radial-gradient(circle, rgba(38,101,253,0.05) 0%, transparent 70%)',
            }}
          />

          {/* Logo */}
          <div className="flex items-center gap-3 relative z-10">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center"
              style={{backgroundColor: '#2665fd'}}
            >
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <span
              className="text-xl font-bold tracking-tight"
              style={{color: '#dbe2fd', fontFamily: 'Manrope, sans-serif'}}
            >
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
                }}
              >
                Terminal Financeiro
              </span>
            </div>
            <h1
              className="font-bold leading-tight mb-5"
              style={{
                color: '#dbe2fd',
                fontSize: '2.75rem',
                fontFamily: 'Manrope, sans-serif',
                letterSpacing: '-0.02em',
              }}
            >
              Precisão institucional para o seu patrimônio.
            </h1>
            <p
              className="leading-relaxed"
              style={{color: 'rgba(195,197,216,0.75)', fontSize: '1rem', lineHeight: '1.7'}}
            >
              Acompanhe seu portfólio com análises em tempo real, insights inteligentes e uma interface construída para quem leva investimentos a sério.
            </p>

            {/* Métricas */}
            <div className="mt-10 grid grid-cols-3 gap-4">
              {[
                {value: 'R$ 2.4B', label: 'Patrimônio monitorado'},
                {value: '12k+', label: 'Investidores ativos'},
                {value: '99.9%', label: 'Uptime do sistema'},
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-xl p-4"
                  style={{backgroundColor: '#131b2e'}}
                >
                  <div
                    className="font-bold text-lg mb-1"
                    style={{color: '#b5c4ff', fontFamily: 'Manrope, sans-serif'}}
                  >
                    {item.value}
                  </div>
                  <div className="text-xs" style={{color: 'rgba(195,197,216,0.6)'}}>
                    {item.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Rodapé */}
          <p className="text-xs relative z-10" style={{color: 'rgba(195,197,216,0.4)'}}>
            © 2025 Trackerr. Plataforma de análise de investimentos.
          </p>
        </div>

        {/* Painel direito - formulário */}
        <div
          className="flex-1 flex items-center justify-center p-8"
          style={{backgroundColor: '#0b1326'}}
        >
          <div className="w-full max-w-md">
            {/* Logo mobile */}
            <div className="mb-8 lg:hidden flex items-center gap-3 justify-center">
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center"
                style={{backgroundColor: '#2665fd'}}
              >
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <span
                className="text-xl font-bold"
                style={{color: '#dbe2fd', fontFamily: 'Manrope, sans-serif'}}
              >
                Trackerr
              </span>
            </div>

            {/* Cabeçalho do form */}
            <div className="mb-8">
              <h2
                className="font-bold mb-2"
                style={{
                  color: '#dbe2fd',
                  fontSize: '1.875rem',
                  fontFamily: 'Manrope, sans-serif',
                  letterSpacing: '-0.02em',
                }}
              >
                Entrar no Terminal
              </h2>
              <p style={{color: 'rgba(195,197,216,0.6)', fontSize: '0.9rem'}}>
                Não tem uma conta?{' '}
                <button
                  id="signin-goto-register"
                  onClick={() => navigate('/register')}
                  className="font-medium transition-colors"
                  style={{color: '#b5c4ff'}}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#2665fd')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = '#b5c4ff')}
                >
                  Criar conta agora
                </button>
              </p>
            </div>

            {/* Formulário */}
            <Form {...form}>
              <form
                id="signin-form"
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-5"
              >
                <FormField
                  control={form.control}
                  name="email"
                  render={({field}) => (
                    <FormItem>
                      <FormLabel
                        className="uppercase tracking-widest text-xs"
                        style={{color: 'rgba(195,197,216,0.7)', letterSpacing: '0.1em'}}
                      >
                        E-mail
                      </FormLabel>
                      <FormControl>
                        <Input
                          id="signin-email"
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

                <FormField
                  control={form.control}
                  name="password"
                  render={({field}) => (
                    <FormItem>
                      <div className="flex items-center justify-between">
                        <FormLabel
                          className="uppercase tracking-widest text-xs"
                          style={{color: 'rgba(195,197,216,0.7)', letterSpacing: '0.1em'}}
                        >
                          Senha
                        </FormLabel>
                        <a
                          href="/forgot-password"
                          className="text-xs transition-colors"
                          style={{color: '#b5c4ff'}}
                        >
                          Esqueceu a senha?
                        </a>
                      </div>
                      <div className="relative">
                        <FormControl>
                          <Input
                            id="signin-password"
                            type={showPassword ? 'text' : 'password'}
                            placeholder="••••••••"
                            {...field}
                            className="h-12 border-0 pr-12 text-sm focus-visible:ring-1 focus-visible:ring-[#2665fd]"
                            style={{
                              backgroundColor: '#2d3449',
                              color: '#dbe2fd',
                            }}
                          />
                        </FormControl>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-1 top-1 h-10 w-10 hover:bg-transparent"
                          style={{color: 'rgba(195,197,216,0.6)'}}
                          onClick={() => setShowPassword(!showPassword)}
                        >
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
                          className="border-[#434655] data-[state=checked]:bg-[#2665fd] data-[state=checked]:border-[#2665fd]"
                        />
                      </FormControl>
                      <FormLabel
                        className="font-normal text-sm cursor-pointer"
                        style={{color: 'rgba(195,197,216,0.7)'}}
                      >
                        Manter conectado
                      </FormLabel>
                    </FormItem>
                  )}
                />

                <Button
                  id="signin-submit"
                  type="submit"
                  className="w-full h-12 font-semibold text-sm gap-2 transition-all duration-200"
                  style={{
                    background: 'linear-gradient(135deg, #2665fd, #0050e1)',
                    color: '#f9f7ff',
                  }}
                  disabled={loading}
                >
                  {loading ? 'Entrando...' : (
                    <>
                      Entrar
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>
            </Form>

            {/* Rodapé */}
            <p
              className="text-xs text-center mt-8"
              style={{color: 'rgba(195,197,216,0.3)'}}
            >
              Copyright © 2025 Trackerr. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
