import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import useAppToast from '@/hooks/use-app-toast';
import {
  ACCOUNT_SETTINGS_QUERY_KEY,
  fetchAccountSettings,
  saveEmailNotifications,
  savePersonalData,
  uploadAvatar,
  type AccountSettings,
  type PersonalData,
} from '@/services/settings/account-settings';

export function useAccountSettings() {
  return useQuery<AccountSettings>({
    queryKey: ACCOUNT_SETTINGS_QUERY_KEY,
    queryFn: fetchAccountSettings,
    staleTime: 60 * 1000,
    retry: false,
  });
}

export function useSavePersonalData() {
  const queryClient = useQueryClient();
  const toast = useAppToast();

  return useMutation({
    mutationFn: (data: PersonalData) => savePersonalData(data),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ACCOUNT_SETTINGS_QUERY_KEY});
      toast.success(
        'Perfil atualizado!',
        'Suas informações foram salvas com sucesso.',
      );
    },
    onError: () => {
      toast.error(
        'Não foi possível salvar o perfil',
        'Revise os dados informados e tente novamente.',
      );
    },
  });
}

export function useUploadAvatar() {
  const queryClient = useQueryClient();
  const toast = useAppToast();

  return useMutation({
    mutationFn: (file: File) => uploadAvatar(file),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ACCOUNT_SETTINGS_QUERY_KEY});
      toast.success('Foto atualizada', 'Sua foto de perfil foi salva com sucesso.');
    },
    onError: () => {
      toast.error('Erro no upload', 'Falha ao salvar a foto de perfil.');
    },
  });
}

export function useSaveEmailNotifications() {
  const queryClient = useQueryClient();
  const toast = useAppToast();

  return useMutation({
    mutationFn: ({
      settings,
      enabled,
    }: {
      settings: Pick<AccountSettings, 'profileId' | 'storedPreferences'>;
      enabled: boolean;
    }) => saveEmailNotifications(settings, enabled),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ACCOUNT_SETTINGS_QUERY_KEY});
      toast.success('Configurações salvas!', 'Suas preferências foram atualizadas.');
    },
    onError: () => {
      toast.error(
        'Não foi possível salvar as configurações',
        'Tente novamente em alguns instantes.',
      );
    },
  });
}
