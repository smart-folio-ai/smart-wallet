import React, {useState} from 'react';
import {useNavigate, useLocation} from 'react-router-dom';
import {zodResolver} from '@hookform/resolvers/zod';
import {useForm} from 'react-hook-form';
import * as z from 'zod';
import {Eye, EyeOff, LogIn, User} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
import {AppLogo} from '@/components/AppLogo';
import {toast} from 'sonner';
import AuthenticationService from '../services/authentication';
import Loader from '@/components/loader';

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

  // Pega a página de onde o usuário veio (se foi redirecionado)
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
    const response: boolean = await AuthenticationService.authenticate(
      data.email,
      data.password,
      data.keepConnect
    );
    if (!response) {
      toast.error(
        'Erro ao realizar login. Verifique suas credenciais e tente novamente.'
      );
      setLoading(false);
      return;
    }

    setTimeout(() => {
      toast.success('Login realizado com sucesso!');
      navigate(from, {replace: true});
    }, 1000);
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMSkiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-20" />

        <div className="absolute top-10 left-10 right-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/10 backdrop-blur-lg rounded-lg flex items-center justify-center">
              <AppLogo size="sm" />
            </div>
            <span className="text-white text-xl font-bold">Trakker</span>
          </div>
        </div>

        <div className="absolute top-20 right-20 w-24 h-24 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full opacity-60 blur-2xl animate-pulse" />
        <div
          className="absolute top-40 left-40 w-32 h-32 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-full opacity-60 blur-2xl animate-pulse"
          style={{animationDelay: '1s'}}
        />
        <div
          className="absolute bottom-40 right-40 w-28 h-28 bg-gradient-to-br from-emerald-400 to-green-500 rounded-full opacity-60 blur-2xl animate-pulse"
          style={{animationDelay: '2s'}}
        />

        <div className="relative z-10 flex flex-col items-center justify-center w-full p-16 text-white">
          <div className="max-w-lg text-center space-y-6">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-orange-500 to-yellow-600 blur-3xl opacity-50 animate-pulse" />
              <div className="relative bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20">
                <svg
                  className="w-48 h-48 mx-auto"
                  viewBox="0 0 200 200"
                  fill="none">
                  <circle cx="100" cy="140" r="50" fill="white" opacity="0.9" />
                  <circle cx="80" cy="140" r="35" fill="white" opacity="0.7" />
                  <circle cx="130" cy="140" r="30" fill="white" opacity="0.6" />
                  <path
                    d="M 100 60 L 70 100 L 100 140 L 130 100 Z"
                    fill="url(#rocket-gradient)"
                  />
                  <rect
                    x="95"
                    y="100"
                    width="10"
                    height="40"
                    fill="white"
                    opacity="0.8"
                  />
                  <circle cx="100" cy="50" r="12" fill="#3B82F6" />
                  <circle cx="100" cy="50" r="8" fill="white" />
                  <defs>
                    <linearGradient
                      id="rocket-gradient"
                      x1="0%"
                      y1="0%"
                      x2="0%"
                      y2="100%">
                      <stop offset="0%" stopColor="#FBBF24" />
                      <stop offset="50%" stopColor="#F59E0B" />
                      <stop offset="100%" stopColor="#EF4444" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
            </div>
            <h1 className="text-4xl font-bold leading-tight">
              Gerencie seus investimentos de forma inteligente
            </h1>
            <p className="text-lg text-blue-100">
              Acompanhe seu portfólio, analise tendências e tome decisões
              informadas com insights em tempo real.
            </p>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-blue-900/50 to-transparent" />
      </div>

      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden flex justify-center">
            <AppLogo size="lg" />
          </div>

          <Card className="w-full border shadow-xl">
            <CardHeader>
              <CardTitle className="text-3xl font-bold">Login</CardTitle>
              <CardDescription>
                Não tem uma conta?{' '}
                <button
                  onClick={() => navigate('/register')}
                  className="text-primary hover:underline font-medium">
                  Criar conta agora
                </button>
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({field}) => (
                      <FormItem>
                        <FormLabel>E-mail</FormLabel>
                        <div className="relative">
                          <FormControl>
                            <Input
                              placeholder="seu@email.com"
                              {...field}
                              className="pl-10"
                            />
                          </FormControl>
                          <User className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
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
                        <FormLabel>Senha</FormLabel>
                        <div className="relative">
                          <FormControl>
                            <Input
                              type={showPassword ? 'text' : 'password'}
                              placeholder="••••••••"
                              {...field}
                              className="pl-10"
                            />
                          </FormControl>
                          <LogIn className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-1 top-1 h-8 w-8"
                            onClick={() => setShowPassword(!showPassword)}>
                            {showPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                            <span className="sr-only">
                              {showPassword
                                ? 'Esconder senha'
                                : 'Mostrar senha'}
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
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        {loading && <Loader text="Entrando..." />}
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            className="data-[state=checked]:bg-primary"
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel className="font-normal text-sm">
                            Manter conectado
                          </FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-medium"
                    size="lg"
                    disabled={loading}>
                    {loading ? 'Entrando...' : 'Log In'}
                  </Button>
                </form>
              </Form>

              <div className="text-center">
                <a
                  href="/forgot-password"
                  className="text-sm text-orange-600 hover:text-orange-700 hover:underline font-medium">
                  Esqueceu sua senha?
                </a>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col space-y-4 pt-0">
              <p className="text-xs text-center text-muted-foreground">
                Copyright © 2025 Trakker, LLC.{' '}
                <a href="#" className="text-primary hover:underline">
                  Trakker™
                </a>{' '}
                é uma marca registrada da Trakker, LLC.
              </p>
              <div className="flex justify-center gap-4 text-xs">
                <a
                  href="#"
                  className="text-muted-foreground hover:text-primary">
                  Termos de Serviço
                </a>
                <span className="text-muted-foreground">|</span>
                <a
                  href="#"
                  className="text-muted-foreground hover:text-primary">
                  Política de Privacidade
                </a>
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
