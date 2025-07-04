import z from 'zod';

const envSchema = z.object({
  VITE_DEV_MODE: z.string().url(),
  VITE_API_URL_DEVELOPMENT: z.string(),
  VITE_API_URL_PRODUCTION: z.string(),
  VITE_STRIPE_PUBLIC_API_KEY: z.string(),
  VITE_STRIPE_PRIVATE_API_KEY: z.string(),
});

export const apiUrlDevelopment = import.meta.env.VITE_API_URL_DEVELOPMENT;
export const apiUrlProduction = import.meta.env.VITE_API_URL_PRODUCTION;
export const stripePublicApiKey = import.meta.env.VITE_STRIPE_PUBLIC_API_KEY;
export const stripPrivateApiKey = import.meta.env.VITE_STRIPE_PRIVATE_API_KEY;
export const isDev = import.meta.env.VITE_DEV_MODE === 'true';
