import {useState, useEffect} from 'react';
import {useQuery} from '@tanstack/react-query';
import {toast} from 'sonner';
import {z} from 'zod';
import Profile from '@/services/profile';
import Address from '@/services/address';
import {IUserProfileResponse, UserSettings} from '@/interface/users';
import {AddressResponse} from '@/interface/address';

const formSchema = z.object({
  firstName: z.string().min(3, 'Digite um nome válido'),
  lastName: z.string().min(3, 'Digite um sobrenome válido'),
  email: z.string().email('Digite um email válido'),
  cpf: z.string().min(11, 'Digite um CPF válido'),
  address: z.object({
    street: z.string().min(3, 'Digite uma rua válida'),
    number: z.string().min(1, 'Digite um número válido'),
    complement: z.string().optional(),
    city: z.string().min(3, 'Digite uma cidade válida'),
    state: z.string().min(2, 'Digite um estado válido'),
    zipCode: z.string().min(8, 'Digite um CEP válido'),
  }),
});

type FormValues = z.infer<typeof formSchema>;

interface Subscription {
  planId: string;
  planName: string;
  status: string;
  expiresAt?: string;
  features: string[];
}

export function useSettings() {
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState<FormValues>({
    firstName: '',
    lastName: '',
    email: '',
    cpf: '',
    address: {
      street: '',
      number: '',
      complement: '',
      city: '',
      state: '',
      zipCode: '',
    },
  });
  const [settings, setSettings] = useState<UserSettings>({
    notifications: {
      email: true,
      push: false,
      marketAlerts: true,
      portfolioUpdates: true,
    },
    security: {
      twoFactorEnabled: false,
      sessionTimeout: 30,
    },
    preferences: {
      language: 'pt-BR',
      currency: 'BRL',
      theme: 'system',
    },
  });

  const fetchProfileUser = async () => {
    const userProfile: IUserProfileResponse = await Profile.getProfile();
    return userProfile;
  };

  const fetchGetAddressByUser = async () => {
    const getUserId = await fetchProfileUser();
    const userAddress: AddressResponse = await Address.getAddressByUser(
      getUserId._id
    );
    return userAddress;
  };

  const {data: user} = useQuery({
    queryKey: ['user-profile'],
    queryFn: async (): Promise<IUserProfileResponse> => {
      const userProfile = await fetchProfileUser();
      const userAddress = await fetchGetAddressByUser();

      return {
        _id: userProfile._id,
        user: userProfile.user,
        firstName: userProfile.firstName,
        lastName: userProfile.lastName,
        email: userProfile.email,
        cpf: userProfile.cpf,
        address: {
          street: userAddress.street,
          number: userAddress.number,
          complement: userAddress.complement,
          city: userAddress.city,
          state: userAddress.state,
          zipCode: userAddress.zipCode,
        },
        createdAt: userProfile.createdAt,
        avatar: userProfile.avatar,
      };
    },
  });

  const {data: subscription} = useQuery({
    queryKey: ['current-subscription'],
    queryFn: async (): Promise<Subscription> => {
      // await subscriptionService.getCurrentPlan();
      return {
        planId: 'pro',
        planName: 'Investidor Pro',
        status: 'active',
        expiresAt: '2024-12-15T10:00:00Z',
        features: [
          'Sincronização automática com B3',
          'Insights de IA para ativos B3',
          'Preço teto e suporte por ativo',
          'Recomendações de compra/venda',
        ],
      };
    },
  });

  const handleProfileSave = async () => {
    try {
      // await authService.updateProfile(profileData);
      toast.success('Perfil atualizado com sucesso!');
      setIsEditing(false);
    } catch (error) {
      toast.error('Erro ao atualizar perfil');
    }
  };

  const handleSettingsSave = async () => {
    try {
      // await settingsService.updateSettings(settings);
      toast.success('Configurações salvas com sucesso!');
    } catch (error) {
      toast.error('Erro ao salvar configurações');
    }
  };

  useEffect(() => {
    if (user) {
      setProfileData({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        cpf: user.cpf,
        address: {
          street: user.address.street,
          number: user.address.number,
          complement: user.address.complement,
          city: user.address.city,
          state: user.address.state,
          zipCode: user.address.zipCode,
        },
      });
    }
  }, [user]);

  const formatCPF = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1');
  };

  const formatZipCode = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .replace(/(-\d{3})\d+?$/, '$1');
  };

  const formatDate = (dateString: Date | string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return {
    isEditing,
    setIsEditing,
    profileData,
    setProfileData,
    settings,
    setSettings,
    user,
    subscription,
    handleProfileSave,
    handleSettingsSave,
    formatCPF,
    formatZipCode,
    formatDate,
  };
}
