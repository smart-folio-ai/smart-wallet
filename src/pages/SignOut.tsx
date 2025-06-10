import React, {useEffect} from 'react';
import {useNavigate} from 'react-router-dom';
import {toast} from 'sonner';
import AuthenticationService from '../services/authentication';
import Loader from '@/components/loader';

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

  return <Loader text="Saindo..." />;
};

export default SignOut;
