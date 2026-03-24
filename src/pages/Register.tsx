import React, {useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {zodResolver} from '@hookform/resolvers/zod';
import {useForm} from 'react-hook-form';
import * as z from 'zod';
import {Eye, EyeOff, ArrowRight, TrendingUp, BarChart3, Cpu, ShieldCheck} from 'lucide-react';
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
import Loader from '@/components/loader';
import {AxiosError} from 'axios';

const formSchema = z
  .object({
    firstname: z.string().min(2, 'O nome deve ter pelo menos 2 caracteres'),
    lastname: z.string().min(2, 'O sobrenome deve ter pelo menos 2 caracteres'),
    email: z.string().email('Digite um email válido'),
    password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres'),
    confirmPassword: z
      .string()
      .min(6, 'A senha deve ter pelo menos 6 caracteres'),
    acceptTerms: z.boolean().refine((value) => value === true, {
      message: 'Você precisa aceitar os termos para continuar',
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas não correspondem',
    path: ['confirmPassword'],
  });

type FormValues = z.infer<typeof formSchema>;

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
      } else {
        toast.error('Não foi possível criar sua conta agora. Tente novamente.');
      }
    }
  };

  return (
    <div
      id="register-page"
      className="min-h-screen flex"
      style={{fontFamily: 'Inter, sans-serif'}}
    >
      {/* Painel esquerdo - editorial */}
      <div
        className="hidden lg:flex lg:w-1/2 relative overflow-hidden flex-col justify-between p-14"
        style={{backgroundColor: '#060d20'}}
      >
        {/* Glow ambiental */}
        <div
          className="absolute top-0 right-0 w-96 h-96 rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(circle, rgba(38,101,253,0.07) 0%, transparent 70%)',
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
              Nova Conta
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
            Comece sua jornada de investimentos hoje.
          </h1>
          <p
            className="leading-relaxed"
            style={{color: 'rgba(195,197,216,0.75)', fontSize: '1rem', lineHeight: '1.7'}}
          >
            Crie sua conta em menos de 2 minutos. Acesso imediato ao terminal completo, análises em tempo real e inteligência artificial para impulsionar seus resultados.
          </p>

          {/* Features */}
          <div className="mt-10 space-y-4">
            {[
              {icon: <BarChart3 className="w-5 h-5" />, title: 'Dashboard completo', desc: 'Visão consolidada do seu portfólio'},
              {icon: <Cpu className="w-5 h-5" />, title: 'IA integrada', desc: 'Insights inteligentes sobre seus ativos'},
              {icon: <ShieldCheck className="w-5 h-5" />, title: 'Segurança avançada', desc: 'Autenticação de dois fatores inclusa'},
            ].map((item, index) => (
              <div
                key={index}
                className="flex items-start gap-4 rounded-xl p-4 transition-colors hover:bg-[#1a253d]"
                style={{backgroundColor: '#131b2e'}}
              >
                <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-[#2665fd]/10 text-[#2665fd]">
                  {item.icon}
                </div>
                <div>
                  <div
                    className="font-semibold text-sm mb-0.5"
                    style={{color: '#dbe2fd', fontFamily: 'Manrope, sans-serif'}}
                  >
                    {item.title}
                  </div>
                  <div className="text-xs" style={{color: 'rgba(195,197,216,0.6)'}}>
                    {item.desc}
                  </div>
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

      {/* Painel direito - formulário (BRANCO) */}
      <div
        className="flex-1 flex items-center justify-center p-8 overflow-y-auto"
        style={{backgroundColor: '#ffffff'}}
      >
        <div className="w-full max-w-md my-8">
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
              style={{color: '#060d20', fontFamily: 'Manrope, sans-serif'}}
            >
              Trackerr
            </span>
          </div>

          {/* Cabeçalho do form */}
          <div className="mb-8">
            <h2
              className="font-bold mb-2"
              style={{
                color: '#060d20',
                fontSize: '1.875rem',
                fontFamily: 'Manrope, sans-serif',
                letterSpacing: '-0.02em',
              }}
            >
              Criar conta
            </h2>
            <p style={{color: '#64748b', fontSize: '0.9rem'}}>
              Já possui uma conta?{' '}
              <button
                id="register-goto-signin"
                onClick={() => navigate('/')}
                className="font-semibold transition-colors decoration-primary/30 underline-offset-4 hover:underline"
                style={{color: '#2665fd'}}
              >
                Faça login
              </button>
            </p>
          </div>

          {/* Formulário */}
          <Form {...form}>
            <form
              id="register-form"
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-5"
            >
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstname"
                  render={({field}) => (
                    <FormItem>
                      <FormLabel
                        className="uppercase tracking-widest text-xs font-bold"
                        style={{color: '#64748b', letterSpacing: '0.1em'}}
                      >
                        Nome
                      </FormLabel>
                      <FormControl>
                        <Input
                          id="register-firstname"
                          placeholder="João"
                          {...field}
                          className="h-12 border border-slate-200 text-sm focus-visible:ring-1 focus-visible:ring-[#2665fd] bg-slate-50/50"
                          style={{color: '#060d20'}}
                        />
                      </FormControl>
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
                        className="uppercase tracking-widest text-xs font-bold"
                        style={{color: '#64748b', letterSpacing: '0.1em'}}
                      >
                        Sobrenome
                      </FormLabel>
                      <FormControl>
                        <Input
                          id="register-lastname"
                          placeholder="Silva"
                          {...field}
                          className="h-12 border border-slate-200 text-sm focus-visible:ring-1 focus-visible:ring-[#2665fd] bg-slate-50/50"
                          style={{color: '#060d20'}}
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
                      className="uppercase tracking-widest text-xs font-bold"
                      style={{color: '#64748b', letterSpacing: '0.1em'}}
                    >
                      E-mail
                    </FormLabel>
                    <FormControl>
                      <Input
                        id="register-email"
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

              <FormField
                control={form.control}
                name="password"
                render={({field}) => (
                  <FormItem>
                    <FormLabel
                      className="uppercase tracking-widest text-xs font-bold"
                      style={{color: '#64748b', letterSpacing: '0.1em'}}
                    >
                      Senha
                    </FormLabel>
                    <div className="relative">
                      <FormControl>
                        <Input
                          id="register-password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="••••••••"
                          {...field}
                          className="h-12 border border-slate-200 pr-12 text-sm focus-visible:ring-1 focus-visible:ring-[#2665fd] bg-slate-50/50"
                          style={{color: '#060d20'}}
                        />
                      </FormControl>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1 h-10 w-10 hover:bg-transparent"
                        style={{color: '#94a3b8'}}
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

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({field}) => (
                  <FormItem>
                    <FormLabel
                      className="uppercase tracking-widest text-xs font-bold"
                      style={{color: '#64748b', letterSpacing: '0.1em'}}
                    >
                      Confirmar Senha
                    </FormLabel>
                    <div className="relative">
                      <FormControl>
                        <Input
                          id="register-confirm-password"
                          type={showConfirmPassword ? 'text' : 'password'}
                          placeholder="••••••••"
                          {...field}
                          className="h-12 border border-slate-200 pr-12 text-sm focus-visible:ring-1 focus-visible:ring-[#2665fd] bg-slate-50/50"
                          style={{color: '#060d20'}}
                        />
                      </FormControl>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1 h-10 w-10 hover:bg-transparent"
                        style={{color: '#94a3b8'}}
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
                        className="mt-0.5 border-slate-300 data-[state=checked]:bg-[#2665fd] data-[state=checked]:border-[#2665fd]"
                        required
                      />
                    </FormControl>
                    <FormLabel
                      className="font-medium text-sm leading-snug cursor-pointer"
                      style={{color: '#475569'}}
                    >
                      Eu li e concordo com os{' '}
                      <a href="#" className="font-semibold text-[#2665fd] hover:underline underline-offset-4 decoration-primary/30 transition-colors">
                        Termos de Uso
                      </a>{' '}
                      e{' '}
                      <a href="#" className="font-semibold text-[#2665fd] hover:underline underline-offset-4 decoration-primary/30 transition-colors">
                        Política de Privacidade
                      </a>
                    </FormLabel>
                  </FormItem>
                )}
              />

              {loading && (
                <Loader text="Estamos criando sua conta, por favor aguarde..." />
              )}

              <Button
                id="register-submit"
                type="submit"
                className="w-full h-12 font-bold text-sm gap-2 transition-all duration-200 shadow-lg shadow-blue-500/20"
                style={{
                  background: 'linear-gradient(135deg, #2665fd, #0050e1)',
                  color: '#f9f7ff',
                }}
                disabled={loading}
              >
                {loading ? 'Criando Conta...' : (
                  <>
                    Criar Conta no Terminal
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </form>
          </Form>

          {/* Rodapé */}
          <p
            className="text-xs text-center mt-8"
            style={{color: '#94a3b8'}}
          >
            Copyright © 2025 Trackerr. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </div>
  );
}
