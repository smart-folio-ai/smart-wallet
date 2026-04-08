import React, {useEffect} from 'react';
import {useNavigate} from 'react-router-dom';
import {toast} from 'sonner';
import AuthenticationService from '../services/authentication';
import Loader from '@/components/loader';
import WalletLoadingScreen from '@/components/WalletLoadingScreen';

const SignOut = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const logoutProcess = async () => {
      try {
        const response = await AuthenticationService.logout();
        if (!response) {
          toast.error('Erro ao realizar logout. Tente novamente.');
          return;
        }

        toast.success('Você saiu com sucesso!');

        setTimeout(() => {
          navigate('/signin', {replace: true});
        }, 500);
      } catch (error) {
        toast.error('Ocorreu um erro ao tentar sair');
        navigate('/signin', {replace: true});
      }
    };

    logoutProcess();
  }, [navigate]);

  return <WalletLoadingScreen isLoading={true} loadingText="Saindo..." />;
};

export default SignOut;
