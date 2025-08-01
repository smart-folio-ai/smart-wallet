import {
  apiUrlDevelopment,
  apiUrlProduction,
  isDev,
  urlLocalhost,
  urlWebProduction,
} from '@/utils/env';

export const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export const styleToast = () => ({
  success: {
    background: 'linear-gradient(90deg, #00FFC8 0%, #00C853 100%)',
  },
  error: {
    background: 'linear-gradient(90deg, #FF4D4F 0%, #FF1616 100%)',
  },
  info: {
    background: 'linear-gradient(90deg, #FFC107 0%, #FF9800 100%)',
  },
});

export const configUrlStripePaymentSuccessOrCancel = (url: string) => {
  if (isDev) {
    return `${urlLocalhost + url}`;
  }
  return `${urlWebProduction + url}`;
};
