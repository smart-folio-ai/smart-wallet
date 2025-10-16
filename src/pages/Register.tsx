import React, {useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {zodResolver} from '@hookform/resolvers/zod';
import {useForm} from 'react-hook-form';
import * as z from 'zod';
import {Eye, EyeOff, LogIn, Mail, User} from 'lucide-react';
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
import {ICreateUser} from '@/interface/authentication';
import AuthenticationService from '../services/authentication';
import Loader from '@/components/loader';
import {AxiosError} from 'axios';

const formSchema = z
  .object({
    firstname: z.string().min(2, 'O nome deve ter pelo menos 2 caracteres'),
    lastname: z.string().min(2, 'O sobrenome deve ter pelo menos 2 caracteres'),
    email: z.string().email('Digite um email válido'),
    password: z.string().min(6, 'A senha deve ter pelo menos 8 caracteres'),
    confirmPassword: z
      .string()
      .min(6, 'A senha deve ter pelo menos 8 caracteres'),
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
    } catch (error) {
      setLoading(false);
      toast.error(error.message || 'Erro desconhecido. Tente novamente.');
    }
  };
  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-emerald-600 via-green-700 to-teal-900 relative overflow-hidden">
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
          className="absolute top-40 left-40 w-32 h-32 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-full opacity-60 blur-2xl animate-pulse"
          style={{animationDelay: '1s'}}
        />
        <div
          className="absolute bottom-40 right-40 w-28 h-28 bg-gradient-to-br from-emerald-400 to-green-500 rounded-full opacity-60 blur-2xl animate-pulse"
          style={{animationDelay: '2s'}}
        />

        <div className="relative z-10 flex flex-col items-center justify-center w-full p-16 text-white">
          <div className="max-w-lg text-center space-y-6">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 via-teal-500 to-green-600 blur-3xl opacity-50 animate-pulse" />
              <div className="relative bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20">
                <svg
                  className="w-48 h-48 mx-auto"
                  viewBox="0 0 200 200"
                  fill="none">
                  <circle cx="100" cy="100" r="60" fill="white" opacity="0.1" />
                  <circle cx="100" cy="100" r="45" fill="white" opacity="0.2" />
                  <circle cx="100" cy="100" r="30" fill="white" opacity="0.3" />
                  <path
                    d="M 100 40 L 100 160 M 40 100 L 160 100"
                    stroke="white"
                    strokeWidth="4"
                    opacity="0.5"
                  />
                  <circle cx="100" cy="40" r="8" fill="#10B981" />
                  <circle cx="160" cy="100" r="8" fill="#F59E0B" />
                  <circle cx="100" cy="160" r="8" fill="#3B82F6" />
                  <circle cx="40" cy="100" r="8" fill="#EF4444" />
                  <path
                    d="M 70 70 L 130 70 L 130 130 L 70 130 Z"
                    fill="url(#chart-gradient)"
                    opacity="0.6"
                  />
                  <path
                    d="M 70 100 L 90 80 L 110 95 L 130 70"
                    stroke="#10B981"
                    strokeWidth="3"
                    fill="none"
                  />
                  <defs>
                    <linearGradient
                      id="chart-gradient"
                      x1="0%"
                      y1="0%"
                      x2="0%"
                      y2="100%">
                      <stop offset="0%" stopColor="#10B981" stopOpacity="0.8" />
                      <stop
                        offset="100%"
                        stopColor="#10B981"
                        stopOpacity="0.2"
                      />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
            </div>
            <h1 className="text-4xl font-bold leading-tight">
              Comece sua jornada de investimentos hoje
            </h1>
            <p className="text-lg text-emerald-100">
              Junte-se a milhares de investidores que já estão otimizando seus
              portfólios com nossa plataforma.
            </p>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-teal-900/50 to-transparent" />
      </div>

      <div className="flex-1 flex items-center justify-center p-8 bg-background overflow-y-auto">
        <div className="w-full max-w-md my-8">
          <div className="mb-8 lg:hidden flex justify-center">
            <AppLogo size="lg" />
          </div>

          <Card className="w-full border shadow-xl">
            <CardHeader>
              <CardTitle className="text-3xl font-bold">Criar conta</CardTitle>
              <CardDescription>
                Já tem uma conta?{' '}
                <button
                  onClick={() => navigate('/')}
                  className="text-primary hover:underline font-medium">
                  Faça login agora
                </button>
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="firstname"
                      render={({field}) => (
                        <FormItem>
                          <FormLabel>Nome</FormLabel>
                          <FormControl>
                            <Input placeholder="Nome" {...field} />
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
                          <FormLabel>Sobrenome</FormLabel>
                          <FormControl>
                            <Input placeholder="Sobrenome" {...field} />
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
                        <FormLabel>E-mail</FormLabel>
                        <div className="relative">
                          <FormControl>
                            <Input
                              placeholder="seu@email.com"
                              {...field}
                              className="pl-10"
                            />
                          </FormControl>
                          <Mail className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
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
                    name="confirmPassword"
                    render={({field}) => (
                      <FormItem>
                        <FormLabel>Confirmar senha</FormLabel>
                        <div className="relative">
                          <FormControl>
                            <Input
                              type={showConfirmPassword ? 'text' : 'password'}
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
                    name="acceptTerms"
                    render={({field}) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            className="data-[state=checked]:bg-primary mt-1"
                            required
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel className="font-normal text-sm">
                            Eu aceito os{' '}
                            <a
                              href="#"
                              className="text-primary hover:underline">
                              Termos de Serviço
                            </a>{' '}
                            e{' '}
                            <a
                              href="#"
                              className="text-primary hover:underline">
                              Política de Privacidade
                            </a>
                          </FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />

                  {loading && (
                    <Loader text="Estamos Criando sua Conta, Por favor aguarde..." />
                  )}
                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-medium"
                    size="lg"
                    disabled={loading}>
                    {loading ? 'Criando Conta...' : 'Criar Conta'}
                  </Button>
                </form>
              </Form>
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
