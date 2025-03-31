import React, {useEffect} from 'react';
import {useNavigate} from 'react-router-dom';
import {Loader} from 'lucide-react';
import {toast} from 'sonner';
import AuthenticationService from '../services/authentication';

const SignOut = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Simula o processo de logout
    const logoutProcess = async () => {
      try {
        const response = await AuthenticationService.logout();
        if (!response) {
          toast.error('Erro ao realizar logout. Tente novamente.');
          return;
        }

        toast.success('Você saiu com sucesso!');

        setTimeout(() => {
          navigate('/');
        }, 500);
      } catch (error) {
        toast.error('Ocorreu um erro ao tentar sair');
        navigate('/');
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
