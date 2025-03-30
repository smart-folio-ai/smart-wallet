
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
import {Checkbox} from "@/components/ui/checkbox";
import {AppLogo} from '@/components/AppLogo';
import {toast} from 'sonner';

const formSchema = z.object({
  name: z.string().min(2, 'O nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Digite um email válido'),
  password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres'),
  confirmPassword: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres'),
  acceptTerms: z.boolean().refine(value => value === true, {
    message: 'Você precisa aceitar os termos para continuar',
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não correspondem",
  path: ["confirmPassword"],
});

type FormValues = z.infer<typeof formSchema>;

export default function Register() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      acceptTerms: false,
    },
  });

  const onSubmit = (data: FormValues) => {
    // In a real app, you would register with a server here
    console.log('Form submitted:', data);

    // For demonstration purposes, we'll simulate a successful registration
    setTimeout(() => {
      toast.success('Conta criada com sucesso!');
      navigate('/login');
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
              Criar uma conta
            </CardTitle>
            <CardDescription className="text-center">
              Preencha os dados abaixo para se cadastrar
            </CardDescription>
          </CardHeader>

          <CardContent className="relative space-y-4">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({field}) => (
                    <FormItem>
                      <FormLabel>Nome completo</FormLabel>
                      <div className="relative">
                        <FormControl>
                          <Input
                            placeholder="Seu nome completo"
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
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                          {showConfirmPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                          <span className="sr-only">
                            {showConfirmPassword ? 'Esconder senha' : 'Mostrar senha'}
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
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className="data-[state=checked]:bg-primary"
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="font-normal text-sm">
                          Eu aceito os <a href="#" className="text-primary hover:underline">Termos de Serviço</a> e <a href="#" className="text-primary hover:underline">Política de Privacidade</a>
                        </FormLabel>
                      </div>
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full success-gradient border-0"
                  size="lg">
                  Criar conta
                </Button>
              </form>
            </Form>
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
              onClick={() => navigate('/login')}>
              Já tenho uma conta
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
