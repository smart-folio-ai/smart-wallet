import {AxiosError} from 'axios';
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {authService, twoFactorService} from '@/server/api/api';
import {useCurrentUserProfile} from '@/hooks/useCurrentUserProfile';
import {RECOVERY_CODES_STATUS_KEY} from '@/hooks/useRecoveryCodes';

const CURRENT_USER_KEY = ['current-user-profile'] as const;
export const TWO_FACTOR_SETUP_KEY = ['two-factor', 'setup'] as const;

export interface TwoFactorSetup {
  secret: string;
  qrCodeDataUrl: string;
}

export interface FriendlyError {
  title: string;
  description: string;
}

/**
 * Estado real do 2FA. Vem de `users/:id` (campo `twoFactorEnabled` do User),
 * que é o que o login consulta — o espelho em `profile.preferences` não é
 * atualizado pelo fluxo de verify/disable.
 */
export function useTwoFactorStatus() {
  const query = useCurrentUserProfile();
  const data = query.data as {twoFactorEnabled?: boolean} | undefined;
  return {
    enabled: data?.twoFactorEnabled === true,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}

/**
 * Gera o segredo + QR assim que sabemos que o 2FA está desligado, para a tela
 * já abrir com o QR como no handoff.
 *
 * Nunca pode rodar com o 2FA ativo: o setup do server grava
 * `twoFactorEnabled: false` junto com o segredo novo. O cache é descartado ao
 * sair da tela (gcTime 0) para o segredo não sobreviver em memória.
 */
export function useTwoFactorSetup(shouldGenerate: boolean) {
  return useQuery<TwoFactorSetup>({
    queryKey: TWO_FACTOR_SETUP_KEY,
    queryFn: async () => (await twoFactorService.setup()).data,
    enabled: shouldGenerate,
    staleTime: Infinity,
    gcTime: 0,
    retry: false,
    refetchOnWindowFocus: false,
  });
}

export function useVerifyTwoFactor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (code: string) => twoFactorService.verify(code),
    onSuccess: async () => {
      queryClient.removeQueries({queryKey: TWO_FACTOR_SETUP_KEY});
      await queryClient.invalidateQueries({queryKey: CURRENT_USER_KEY});
      queryClient.invalidateQueries({queryKey: RECOVERY_CODES_STATUS_KEY});
    },
  });
}

export function useDisableTwoFactor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (code: string) => twoFactorService.disable(code),
    onSuccess: () =>
      queryClient.invalidateQueries({queryKey: CURRENT_USER_KEY}),
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (payload: {oldPassword: string; newPassword: string}) =>
      authService.changePassword(payload),
  });
}

function serverMessage(error: unknown): string | undefined {
  if (!(error instanceof AxiosError)) return undefined;
  const message = (error.response?.data as {message?: string | string[]})
    ?.message;
  return Array.isArray(message) ? message[0] : message;
}

export function describePasswordError(error: unknown): FriendlyError {
  const status = error instanceof AxiosError ? error.response?.status : undefined;
  const message = serverMessage(error);

  // Contas criadas só com Google não têm senha local: o server responde 500
  // com esta mensagem em vez de um 4xx.
  if (message?.includes('Senha não configurada')) {
    return {
      title: 'Sua conta não tem senha',
      description:
        'Você entra com o Google. Para criar uma senha, use "Esqueci minha senha" na tela de login.',
    };
  }
  if (status === 401) {
    return {
      title: 'Senha atual incorreta',
      description: 'Confira a senha que você usa hoje e tente novamente.',
    };
  }
  if (status === 400 && message) {
    return {title: 'Não foi possível alterar a senha', description: message};
  }
  return {
    title: 'Não foi possível alterar a senha',
    description: 'Tente novamente em instantes. Se persistir, fale com o suporte.',
  };
}
