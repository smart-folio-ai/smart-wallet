import z from 'zod';

export const apiUrlDevelopment = import.meta.env.VITE_API_URL_DEVELOPMENT;
export const apiUrlProduction = import.meta.env.VITE_API_URL_PRODUCTION;
export const stripePublicApiKey = import.meta.env.VITE_STRIPE_PUBLIC_API_KEY;
export const stripPrivateApiKey = import.meta.env.VITE_STRIPE_PRIVATE_API_KEY;
export const successUrl = import.meta.env.VITE_SUCCESS_URL;
export const cancelUrl = import.meta.env.VITE_CANCEL_URL;
export const urlLocalhost = import.meta.env.VITE_URL_LOCALHOST;
export const urlWebProduction = import.meta.env.VITE_URL_WEB;
export const isDev = import.meta.env.VITE_DEV_MODE === 'true';
