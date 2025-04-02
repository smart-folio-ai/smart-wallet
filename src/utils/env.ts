import z from 'zod';

const envSchema = z.object({
  VITE_DEV_MODE: z.string().url(),
  VITE_API_URL_DEVELOPMENT: z.string(),
  VITE_API_URL_PRODUCTION: z.string(),
});

export const apiUrlDevelopment = import.meta.env.VITE_API_URL_DEVELOPMENT;
export const apiUrlProduction = import.meta.env.VITE_API_URL_PRODUCTION;
export const isDev = import.meta.env.VITE_DEV_MODE === true;
