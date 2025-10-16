import React, {useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {zodResolver} from '@hookform/resolvers/zod';
import {useForm} from 'react-hook-form';
import * as z from 'zod';
import {ArrowLeft, Mail} from 'lucide-react';
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
import {AppLogo} from '@/components/AppLogo';
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

  const onSubmit = (data: FormValues) => {
    // In a real app, you would send a password reset email here
    console.log('Form submitted:', data);

    // For demonstration purposes, we'll simulate a successful submission
    setTimeout(() => {
      setIsSubmitted(true);
      toast.success('Email de recuperação enviado com sucesso!');
    }, 1000);
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-amber-600 via-orange-700 to-red-900 relative overflow-hidden">
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
          className="absolute top-40 left-40 w-32 h-32 bg-gradient-to-br from-orange-400 to-red-500 rounded-full opacity-60 blur-2xl animate-pulse"
          style={{animationDelay: '1s'}}
        />
        <div
          className="absolute bottom-40 right-40 w-28 h-28 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-full opacity-60 blur-2xl animate-pulse"
          style={{animationDelay: '2s'}}
        />

        <div className="relative z-10 flex flex-col items-center justify-center w-full p-16 text-white">
          <div className="max-w-lg text-center space-y-6">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-amber-400 via-orange-500 to-red-600 blur-3xl opacity-50 animate-pulse" />
              <div className="relative bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20">
                <svg
                  className="w-48 h-48 mx-auto"
                  viewBox="0 0 200 200"
                  fill="none">
                  <circle
                    cx="100"
                    cy="100"
                    r="70"
                    stroke="white"
                    strokeWidth="4"
                    opacity="0.3"
                  />
                  <circle
                    cx="100"
                    cy="100"
                    r="55"
                    stroke="white"
                    strokeWidth="3"
                    opacity="0.4"
                  />
                  <circle
                    cx="100"
                    cy="100"
                    r="40"
                    stroke="white"
                    strokeWidth="2"
                    opacity="0.5"
                  />
                  <path
                    d="M 100 30 L 100 70"
                    stroke="white"
                    strokeWidth="6"
                    strokeLinecap="round"
                    opacity="0.8"
                  />
                  <path
                    d="M 100 100 L 100 130"
                    stroke="white"
                    strokeWidth="6"
                    strokeLinecap="round"
                    opacity="0.8"
                  />
                  <circle cx="100" cy="100" r="12" fill="white" opacity="0.9" />
                  <path
                    d="M 50 100 A 50 50 0 0 1 100 50"
                    stroke="url(#lock-gradient)"
                    strokeWidth="8"
                    strokeLinecap="round"
                    fill="none"
                  />
                  <path
                    d="M 85 85 L 100 100 L 125 75"
                    stroke="#F59E0B"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                    opacity="0.8"
                  />
                  <defs>
                    <linearGradient
                      id="lock-gradient"
                      x1="0%"
                      y1="0%"
                      x2="100%"
                      y2="100%">
                      <stop offset="0%" stopColor="#FBBF24" />
                      <stop offset="100%" stopColor="#F59E0B" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
            </div>
            <h1 className="text-4xl font-bold leading-tight">
              Não se preocupe, estamos aqui para ajudar
            </h1>
            <p className="text-lg text-amber-100">
              Recupere o acesso à sua conta de forma rápida e segura. Enviaremos
              instruções para o seu e-mail.
            </p>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-red-900/50 to-transparent" />
      </div>

      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden flex justify-center">
            <AppLogo size="lg" />
          </div>

          <Card className="w-full border shadow-xl">
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate('/')}>
                  <ArrowLeft className="h-5 w-5" />
                  <span className="sr-only">Voltar</span>
                </Button>
              </div>
              <CardTitle className="text-3xl font-bold">
                Recuperar senha
              </CardTitle>
              <CardDescription>
                {!isSubmitted
                  ? 'Digite seu e-mail para receber instruções de recuperação de senha'
                  : 'Verifique seu email para instruções de recuperação de senha'}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {!isSubmitted ? (
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
                            <Mail className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button
                      type="submit"
                      className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-medium"
                      size="lg">
                      Enviar instruções
                    </Button>
                  </form>
                </Form>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 rounded-lg">
                    <div className="flex items-start gap-3">
                      <svg
                        className="w-6 h-6 mt-0.5 flex-shrink-0"
                        fill="currentColor"
                        viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <div>
                        <p className="font-medium mb-1">
                          Email enviado com sucesso!
                        </p>
                        <p className="text-sm">
                          Um email foi enviado para{' '}
                          <strong>{form.getValues().email}</strong> com
                          instruções para recuperar sua senha.
                        </p>
                      </div>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    className="w-full"
                    size="lg"
                    onClick={() => setIsSubmitted(false)}>
                    Tentar outro email
                  </Button>
                </div>
              )}
            </CardContent>

            <CardFooter className="flex flex-col space-y-4 pt-0">
              <div className="text-center">
                <button
                  onClick={() => navigate('/')}
                  className="text-sm text-muted-foreground hover:text-primary">
                  Voltar para o login
                </button>
              </div>

              <p className="text-xs text-center text-muted-foreground">
                Copyright © 2025 Trakker, LLC.{' '}
                <a href="#" className="text-primary hover:underline">
                  Trakker™
                </a>{' '}
                é uma marca registrada da Trakker, LLC.
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
