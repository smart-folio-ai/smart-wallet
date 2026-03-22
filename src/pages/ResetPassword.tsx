import React, {useState, useEffect} from 'react';
import {useNavigate, useSearchParams} from 'react-router-dom';
import {zodResolver} from '@hookform/resolvers/zod';
import {useForm} from 'react-hook-form';
import * as z from 'zod';
import apiClient from '@/server/api/api';
import {ArrowLeft, Lock, ShieldCheck} from 'lucide-react';
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
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";

const formSchema = z
  .object({
    password: z.string().min(8, 'A senha deve ter no mínimo 8 caracteres'),
    confirmPassword: z.string(),
    code: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas não coincidem',
    path: ['confirmPassword'],
  });

type FormValues = z.infer<typeof formSchema>;

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  
  const [isValidating, setIsValidating] = useState(true);
  const [isValidToken, setIsValidToken] = useState(false);
  const [requiresMfa, setRequiresMfa] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!token) {
      setIsValidating(false);
      return;
    }

    const validateToken = async () => {
      try {
        const response = await apiClient.get(`/auth/reset-password/${token}`);
        setIsValidToken(true);
        setRequiresMfa(response.data.twoFactorEnabled);
      } catch (error) {
        setIsValidToken(false);
      } finally {
        setIsValidating(false);
      }
    };

    validateToken();
  }, [token]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
      code: '',
    },
  });

  const onSubmit = async (data: FormValues) => {
    if (!token) return;
    
    setIsSubmitting(true);
    try {
      await apiClient.post('/auth/reset-password', {
        token,
        newPassword: data.password,
        code: data.code,
      });
      
      toast.success('Senha alterada com sucesso! Faça login para continuar.');
      navigate('/');
    } catch (error: any) {
      toast.error(
        'Não foi possível redefinir sua senha agora. Verifique o código informado e tente novamente.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isValidating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (!token || !isValidToken) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md text-center space-y-6">
          <div className="mx-auto flex justify-center">
            <AppLogo size="lg" />
          </div>
          <Card className="border shadow-xl">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-red-600">Link Inválido ou Expirado</CardTitle>
              <CardDescription>
                O link para redefinição de senha não é válido ou já expirou. 
                Por favor, solicite a recuperação de senha novamente.
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <Button className="w-full" onClick={() => navigate('/forgot-password')}>
                Solicitar novo link
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Decorative Side */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-amber-600 via-orange-700 to-red-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMSkiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-20" />
        
        <div className="absolute top-10 left-10 right-10 flex items-center gap-3">
          <div className="w-10 h-10 bg-white/10 backdrop-blur-lg rounded-lg flex items-center justify-center">
            <AppLogo size="sm" />
          </div>
          <span className="text-white text-xl font-bold">Trackerr</span>
        </div>

        <div className="relative z-10 flex flex-col items-center justify-center w-full p-16 text-white text-center">
          <div className="bg-white/10 backdrop-blur-lg rounded-full p-6 mb-8 border border-white/20">
            <ShieldCheck className="w-16 h-16" />
          </div>
          <h1 className="text-4xl font-bold leading-tight mb-4">
            Quase lá!
          </h1>
          <p className="text-lg text-amber-100 max-w-md">
            Crie uma nova senha forte e exclusiva para proteger sua conta.
          </p>
        </div>
      </div>

      {/* Form Side */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden flex justify-center">
            <AppLogo size="lg" />
          </div>

          <Card className="w-full border shadow-xl">
            <CardHeader>
              <CardTitle className="text-3xl font-bold">Nova Senha</CardTitle>
              <CardDescription>
                Digite sua nova senha abaixo.
                {requiresMfa && " Você também precisará informar seu código de Autenticação em Duas Etapas (2FA)."}
              </CardDescription>
            </CardHeader>

            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  
                  {requiresMfa && (
                    <FormField
                      control={form.control}
                      name="code"
                      render={({field}) => (
                        <FormItem className="mb-6 flex flex-col items-center">
                          <FormLabel className="w-full text-left font-semibold">
                            Código de Autenticação (2FA)
                          </FormLabel>
                          <FormControl>
                            <InputOTP maxLength={6} {...field}>
                              <InputOTPGroup className="gap-2">
                                {[...Array(6)].map((_, index) => (
                                  <InputOTPSlot
                                    key={index}
                                    index={index}
                                    className="w-12 h-14 text-lg border-2 border-muted-foreground/20 rounded-md bg-background focus-visible:ring-primary focus-visible:border-primary transition-all duration-200"
                                  />
                                ))}
                              </InputOTPGroup>
                            </InputOTP>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  <FormField
                    control={form.control}
                    name="password"
                    render={({field}) => (
                      <FormItem>
                        <FormLabel>Nova senha</FormLabel>
                        <div className="relative">
                          <FormControl>
                            <Input
                              type="password"
                              placeholder="********"
                              {...field}
                              className="pl-10"
                            />
                          </FormControl>
                          <Lock className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
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
                        <FormLabel>Confirme a nova senha</FormLabel>
                        <div className="relative">
                          <FormControl>
                            <Input
                              type="password"
                              placeholder="********"
                              {...field}
                              className="pl-10"
                            />
                          </FormControl>
                          <Lock className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-medium mt-6"
                    size="lg">
                    {isSubmitting ? 'Alterando senha...' : 'Salvar Nova Senha'}
                  </Button>
                </form>
              </Form>
            </CardContent>

            <CardFooter className="flex justify-center pt-2 pb-6">
              <button
                onClick={() => navigate('/')}
                className="text-sm text-muted-foreground hover:text-primary">
                Voltar para o login
              </button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
