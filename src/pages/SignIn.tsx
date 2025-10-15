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
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-info/40 via-primary/30 to-secondary/50">
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <AppLogo size="lg" />
        </div>

        <Card className="w-full card-gradient border-0 shadow-lg overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-info/10 opacity-50 pointer-events-none" />

          <CardHeader className="relative">
            <CardTitle className="text-2xl font-bold text-center">
              Bem-vindo ao Trakker
            </CardTitle>
            <CardDescription className="text-center">
              Entre com suas credenciais para acessar sua conta
            </CardDescription>
          </CardHeader>

          <CardContent className="relative space-y-4">
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
                            {showPassword ? 'Esconder senha' : 'Mostrar senha'}
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
                  className="w-full success-gradient border-0"
                  size="lg">
                  {loading ? 'Entrando...' : 'Entrar'}
                </Button>
              </form>
            </Form>

            <div className="text-center">
              <a
                href="/forgot-password"
                className="text-sm text-primary hover:underline">
                Esqueceu sua senha?
              </a>
            </div>
          </CardContent>

          <CardFooter className="relative flex flex-col space-y-4 pt-0">
            <div className="relative flex items-center w-full">
              <div className="flex-grow border-t border-border"></div>
              <span className="mx-4 text-xs text-muted-foreground">OU</span>
              <div className="flex-grow border-t border-border"></div>
            </div>

            <Button
              variant="outline"
              className="w-full"
              onClick={() => navigate('/register')}>
              Criar uma conta
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              Ao entrar, você concorda com nossos{' '}
              <a href="#" className="text-primary hover:underline">
                Termos de Serviço
              </a>{' '}
              e{' '}
              <a href="#" className="text-primary hover:underline">
                Política de Privacidade
              </a>
              .
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
