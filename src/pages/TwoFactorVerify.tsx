import React, {useState, useRef} from 'react';
import {useNavigate} from 'react-router-dom';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {Loader2, ShieldCheck, ArrowLeft} from 'lucide-react';
import {api} from '@/server/api/api';
import useAppToast from '@/hooks/use-app-toast';

export default function TwoFactorVerify() {
  const navigate = useNavigate();
  const toast = useAppToast();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const tempToken =
    new URLSearchParams(window.location.search).get('tempToken') ||
    sessionStorage.getItem('2fa_temp_token') ||
    '';

  const handleVerify = async () => {
    if (code.length !== 6) {
      toast.error(
        'Código inválido',
        'Digite os 6 dígitos do seu aplicativo autenticador.',
      );
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/auth/2fa/authenticate', {
        tempToken,
        code,
      });

      const {accessToken, refreshToken} = response.data;
      localStorage.setItem('access_token', accessToken);
      localStorage.setItem('refresh_token', refreshToken);
      sessionStorage.removeItem('2fa_temp_token');

      toast.success('Autenticação concluída!', 'Bem-vindo ao Trackerr.');
      navigate('/dashboard', {replace: true});
    } catch {
      toast.error(
        'Não foi possível validar o código',
        'Confira os 6 dígitos do app autenticador e tente novamente.',
      );
      setCode('');
      inputRef.current?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleVerify();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-6 animate-in fade-in slide-in-from-bottom-4">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <ShieldCheck className="h-8 w-8 text-primary" />
            </div>
          </div>
          <h1 className="text-2xl font-bold">Verificação em Dois Fatores</h1>
          <p className="text-muted-foreground text-sm">
            Abra seu aplicativo autenticador e insira o código de 6 dígitos
          </p>
        </div>

        <Card className="card-gradient border-primary/20">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-base">Código de verificação</CardTitle>
            <CardDescription>
              Google Authenticator, Authy ou similar
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="code">Código de 6 dígitos</Label>
              <Input
                ref={inputRef}
                id="code"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                placeholder="000000"
                value={code}
                onChange={(e) =>
                  setCode(e.target.value.replace(/\D/g, '').slice(0, 6))
                }
                onKeyDown={handleKeyDown}
                className="text-center text-2xl tracking-widest font-mono h-14"
                autoFocus
                autoComplete="one-time-code"
              />
            </div>
          </CardContent>
          <CardFooter className="flex-col gap-3">
            <Button
              onClick={handleVerify}
              disabled={loading || code.length !== 6}
              className="w-full">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Verificando...
                </>
              ) : (
                'Verificar Código'
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/login')}
              className="text-muted-foreground">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Voltar para o login
            </Button>
          </CardFooter>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          Não tem acesso ao seu aplicativo?{' '}
          <a
            href="mailto:suporte@trackerr.com.br"
            className="text-primary hover:underline">
            Contate o suporte
          </a>
        </p>
      </div>
    </div>
  );
}
