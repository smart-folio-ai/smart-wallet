
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { ArrowLeft, Mail } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { AppLogo } from '@/components/AppLogo';
import { toast } from 'sonner';

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
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-info/40 via-primary/30 to-secondary/50">
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <AppLogo size="lg" />
        </div>

        <Card className="w-full card-gradient border-0 shadow-lg overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-info/10 opacity-50 pointer-events-none" />

          <CardHeader className="relative">
            <Button 
              variant="ghost" 
              size="icon" 
              className="absolute left-2 top-2"
              onClick={() => navigate('/login')}
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="sr-only">Voltar</span>
            </Button>
            
            <CardTitle className="text-2xl font-bold text-center">
              Recuperar senha
            </CardTitle>
            <CardDescription className="text-center">
              {!isSubmitted 
                ? "Digite seu e-mail para receber instruções de recuperação de senha" 
                : "Verifique seu email para instruções de recuperação de senha"}
            </CardDescription>
          </CardHeader>

          <CardContent className="relative space-y-4">
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
                    className="w-full success-gradient border-0"
                    size="lg">
                    Enviar instruções
                  </Button>
                </form>
              </Form>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-green-50 text-green-700 rounded-md">
                  <p>Um email foi enviado para <strong>{form.getValues().email}</strong> com instruções para recuperar sua senha.</p>
                </div>
                
                <Button
                  className="w-full info-gradient border-0"
                  size="lg"
                  onClick={() => setIsSubmitted(false)}>
                  Tentar outro email
                </Button>
              </div>
            )}
          </CardContent>

          <CardFooter className="relative flex flex-col space-y-4 pt-0">
            <Button
              variant="ghost"
              className="w-full"
              onClick={() => navigate('/login')}>
              Voltar para o login
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
