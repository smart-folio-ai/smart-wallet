import z from 'zod';

const envSchema = z.object({
  DEV_MODE: z.string().url(),
  VITE_API_URL_DEVELOPMENT: z.string(),
  VITE_API_URL_PRODUCTION: z.string(),
});

// Parse the environment variables
const env = envSchema.safeParse(import.meta.env);
if (!env.success) {
  console.error('Invalid environment variables:', env.error.format());
}

// export const apiUrlDevelopment: string = env.data.VITE_API_URL_DEVELOPMENT;
// export const apiUrlProduction: string = env.data.VITE_API_URL_PRODUCTION;
