
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader } from 'lucide-react';
import { toast } from 'sonner';

const SignOut = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Simula o processo de logout
    const logoutProcess = async () => {
      try {
        // Aqui seria a chamada real para a API de logout
        // authService.logout()
        
        // Simulando uma chamada de API com um timeout
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Limpa qualquer dado local de autenticação
        localStorage.removeItem('auth_token');
        
        // Exibe mensagem de sucesso
        toast.success('Você saiu com sucesso!');
        
        // Redireciona para a página de login após um pequeno delay
        setTimeout(() => {
          navigate('/login');
        }, 500);
      } catch (error) {
        console.error('Erro ao fazer logout:', error);
        toast.error('Ocorreu um erro ao tentar sair');
        
        // Mesmo em caso de erro, redireciona para login
        setTimeout(() => {
          navigate('/login');
        }, 1000);
      }
    };

    logoutProcess();
  }, [navigate]);

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-background/95 backdrop-blur-sm z-50">
      <div className="flex flex-col items-center justify-center space-y-6">
        <div className="relative">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-16 w-16 rounded-full border-4 border-primary/30 opacity-75"></div>
          </div>
          <Loader className="h-16 w-16 animate-spin text-primary" />
        </div>
        <h2 className="text-xl font-medium text-foreground animate-pulse">
          Saindo...
        </h2>
      </div>
    </div>
  );
};

export default SignOut;
