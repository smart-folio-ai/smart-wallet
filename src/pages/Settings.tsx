import React, {useEffect, useRef, useState} from 'react';
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {
  Bell,
  Camera,
  Check,
  Crown,
  Edit,
  Eye,
  EyeOff,
  Globe,
  Loader2,
  QrCode,
  Save,
  Shield,
  ShieldCheck,
  ShieldOff,
  User,
  X,
} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {Badge} from '@/components/ui/badge';
import {Switch} from '@/components/ui/switch';
import {Label} from '@/components/ui/label';
import {Input} from '@/components/ui/input';
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs';
import {Avatar, AvatarFallback, AvatarImage} from '@/components/ui/avatar';
import {Skeleton} from '@/components/ui/skeleton';
import {z} from 'zod';
import Profile from '@/services/profile';
import Address from '@/services/address';
import {api, profileService, subscriptionService} from '@/server/api/api';
import {IUserProfileResponse, UserSettings} from '@/interface/users';
import {AddressResponse} from '@/interface/address';
import useAppToast from '@/hooks/use-app-toast';
import {jwtDecode} from 'jwt-decode';

interface Subscription {
  planId: string;
  planName: string;
  status: string;
  expiresAt?: string;
  features: string[];
}

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

export default function Settings() {
  const queryClient = useQueryClient();
  const toast = useAppToast();
  const [isEditing, setIsEditing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [profileId, setProfileId] = useState<string | null>(null);

  // Avatar state
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // 2FA state
  const [twoFAEnabled, setTwoFAEnabled] = useState(false);
  const [twoFASetup, setTwoFASetup] = useState<{
    qrCodeDataUrl: string;
    secret: string;
  } | null>(null);
  const [twoFACode, setTwoFACode] = useState('');
  const [twoFALoading, setTwoFALoading] = useState(false);
  const [disabling2FA, setDisabling2FA] = useState(false);
  const [disable2FACode, setDisable2FACode] = useState('');

  // Password state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

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

  // Busca o perfil estendido (phone, preferences, endereço via profile service)
  const fetchProfileUser = async () => {
    const userProfile: IUserProfileResponse = await Profile.getProfile();
    return userProfile;
  };

  const fetchGetAddressByUser = async () => {
    const getUserId = await fetchProfileUser();
    const userAddress: AddressResponse = await Address.getAddressByUser(
      getUserId._id,
    );
    return userAddress;
  };

  // Query principal consolidada
  const {data: user, isLoading: userLoading} = useQuery({
    queryKey: ['user-profile'],
    queryFn: async (): Promise<IUserProfileResponse> => {
      const userProfile = await fetchProfileUser();
      let userAddress: AddressResponse | null = null;
      try {
        userAddress = await fetchGetAddressByUser();
      } catch {
        // Endereço pode não existir ainda
      }

      // Tenta buscar o perfil no novo endpoint para obter ID e preferências
      try {
        const myProfileRes = await profileService.getMyProfile();
        const myProfile = myProfileRes.data;
        setProfileId(myProfile?.id || myProfile?._id || null);
        if (myProfile?.preferences) {
          setSettings((prev) => ({
            ...prev,
            notifications: {
              email: myProfile.preferences.notifications ?? true,
              push: prev.notifications.push,
              marketAlerts: prev.notifications.marketAlerts,
              portfolioUpdates: prev.notifications.portfolioUpdates,
            },
            security: {
              twoFactorEnabled: myProfile.preferences.twoFactorEnabled ?? false,
              sessionTimeout: prev.security.sessionTimeout,
            },
            preferences: {
              language: myProfile.preferences.language || 'pt-BR',
              currency: prev.preferences.currency,
              theme: myProfile.preferences.theme || 'system',
            },
          }));
        }
      } catch {
        // Perfil pode não existir ainda
      }

      return {
        _id: userProfile._id,
        user: userProfile.user,
        firstName: userProfile.firstName,
        lastName: userProfile.lastName,
        email: userProfile.email,
        cpf: userProfile.cpf,
        address: userAddress
          ? {
              street: userAddress.street,
              number: userAddress.number,
              complement: userAddress.complement,
              city: userAddress.city,
              state: userAddress.state,
              zipCode: userAddress.zipCode,
            }
          : undefined,
        createdAt: userProfile.createdAt,
      };
    },
  });

  // Query de assinatura — busca API real
  const {data: subscription, isLoading: subLoading} = useQuery({
    queryKey: ['current-subscription'],
    queryFn: async (): Promise<Subscription> => {
      try {
        const res = await subscriptionService.getCurrentPlan();
        const data = res.data;
        return {
          planId: data.planId || data._id || 'free',
          planName: data.planName || data.name || 'Free',
          status: data.status || 'active',
          expiresAt: data.expiresAt || data.currentPeriodEnd,
          features: data.features || [],
        };
      } catch {
        return {
          planId: 'free',
          planName: 'Free',
          status: 'active',
          features: [],
        };
      }
    },
  });

  // Mutation para salvar dados do perfil (usuário + perfil estendido)
  const saveProfileMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const token = localStorage.getItem('access_token');
      if (!token) throw new Error('Sessão expirada');
      const decoded = jwtDecode<{userId: string}>(token);
      const userId = decoded.userId;

      // Atualiza dados do usuário (nome, email)
      await profileService.updateUser(userId, {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
      });

      // Atualiza ou cria o perfil estendido com as preferências e endereço
      const profilePayload = {
        phone: undefined,
        preferences: {
          language: settings.preferences.language,
          theme: settings.preferences.theme,
          notifications: settings.notifications.email,
          twoFactorEnabled: settings.security.twoFactorEnabled,
        },
      };

      if (profileId) {
        await profileService.updateProfile(profileId, profilePayload);
      } else {
        // Cria o perfil se não existir
        await profileService.createProfile(userId, {
          userId,
          ...profilePayload,
        });
      }

      // Atualiza ou cria Endereço Separadamente usando a camada de Api 
      // (ajustando para um POST ou PUT no /address associando ao user)
      const tokenLocal = localStorage.getItem('access_token');
      await api.post('/address/create', { 
         userId,
         street: data.address.street,
         number: data.address.number,
         complement: data.address.complement,
         city: data.address.city,
         state: data.address.state,
         zipCode: data.address.zipCode
      }, { headers: { Authorization: `Bearer ${tokenLocal}` }});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['user-profile']});
      toast.success(
        'Perfil atualizado!',
        'Suas informações foram salvas com sucesso.',
      );
      setIsEditing(false);
    },
    onError: () => {
      toast.error(
        'Não foi possível salvar o perfil',
        'Revise os dados informados e tente novamente.',
      );
    },
  });

  // Mutation para salvar configurações de segurança e notificações
  const saveSettingsMutation = useMutation({
    mutationFn: async () => {
      if (!profileId) {
        // Tenta criar o perfil com as configurações
        const token = localStorage.getItem('access_token');
        if (!token) throw new Error('Sessão expirada');
        const decoded = jwtDecode<{userId: string}>(token);
        await profileService.createProfile(decoded.userId, {
          userId: decoded.userId,
          preferences: {
            language: settings.preferences.language,
            theme: settings.preferences.theme,
            notifications: settings.notifications.email,
            twoFactorEnabled: settings.security.twoFactorEnabled,
            sessionTimeout: settings.security.sessionTimeout,
          },
        });
        return;
      }

      await profileService.updateProfile(profileId, {
        preferences: {
          language: settings.preferences.language,
          theme: settings.preferences.theme,
          notifications: settings.notifications.email,
          twoFactorEnabled: settings.security.twoFactorEnabled,
          sessionTimeout: settings.security.sessionTimeout,
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['user-profile']});
      toast.success(
        'Configurações salvas!',
        'Suas preferências foram atualizadas.',
      );
    },
    onError: () => {
      toast.error(
        'Não foi possível salvar as configurações',
        'Tente novamente em alguns instantes.',
      );
    },
  });

  const updatePasswordMutation = useMutation({
    mutationFn: async () => {
      if (passwordData.newPassword !== passwordData.confirmPassword) {
        throw new Error('A nova senha e a confirmação não coincidem.');
      }
      if (passwordData.newPassword.length < 6) {
        throw new Error('A nova senha deve ter pelo menos 6 caracteres.');
      }
      const token = localStorage.getItem('access_token');
      await api.patch(
        '/auth/update-password',
        {
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    },
    onSuccess: () => {
      toast.success('Senha atualizada', 'Sua senha foi alterada com sucesso.');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setShowPassword(false);
    },
    onError: () => {
      toast.error(
        'Não foi possível alterar a senha',
        'Confirme sua senha atual e tente novamente.',
      );
    },
  });

  const formatDate = (dateString: Date | string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

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

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Arquivo muito grande', 'A imagem deve ter no máximo 5MB.');
      return;
    }

    setAvatarPreview(URL.createObjectURL(file));
    setAvatarUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await api.post('/profile/avatar', formData, {
        headers: {'Content-Type': 'multipart/form-data'},
      });

      toast.success(
        'Foto atualizada',
        'Sua foto de perfil foi salva com sucesso.',
      );
      queryClient.invalidateQueries({queryKey: ['user-profile']});
    } catch (error) {
      toast.error('Erro no upload', 'Falha ao salvar a foto de perfil.');
      setAvatarPreview(null);
    } finally {
      setAvatarUploading(false);
    }
  };

  const setup2FA = async () => {
    try {
      setTwoFALoading(true);
      const res = await api.post('/auth/2fa/setup');
      setTwoFASetup(res.data);
    } catch (error) {
      toast.error('Erro', 'Falha ao iniciar configuração do 2FA.');
    } finally {
      setTwoFALoading(false);
    }
  };

  const verify2FA = async () => {
    if (twoFACode.length !== 6) return;
    try {
      setTwoFALoading(true);
      await api.post('/auth/2fa/verify', {code: twoFACode});
      setTwoFAEnabled(true);
      setTwoFASetup(null);
      setSettings({
        ...settings,
        security: {...settings.security, twoFactorEnabled: true},
      });
      toast.success('2FA Ativado', 'Sua conta agora está mais segura.');
    } catch (error) {
      toast.error('Erro na verificação', 'Código inválido ou expirado.');
    } finally {
      setTwoFALoading(false);
    }
  };

  const disable2FA = async () => {
    if (disable2FACode.length !== 6) return;
    try {
      setDisabling2FA(true);
      await api.delete('/auth/2fa/disable', {data: {code: disable2FACode}});
      setTwoFAEnabled(false);
      setSettings({
        ...settings,
        security: {...settings.security, twoFactorEnabled: false},
      });
      setDisable2FACode('');
      toast.success(
        '2FA Desativado',
        'A autenticação em dois fatores foi removida.',
      );
    } catch (error) {
      toast.error('Erro', 'Código inválido. Não foi possível desativar.');
    } finally {
      setDisabling2FA(false);
    }
  };

  const initials = user
    ? `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`
    : '?';

  React.useEffect(() => {
    if (user) {
      setProfileData({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        cpf: user.cpf,
        address: {
          street: user.address?.street || '',
          number: user.address?.number || '',
          complement: user.address?.complement || '',
          city: user.address?.city || '',
          state: user.address?.state || '',
          zipCode: user.address?.zipCode || '',
        },
      });
    }
  }, [user]);

  const isLoading = userLoading;

  return (
    <div className="container py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Configurações</h1>
        <p className="text-muted-foreground">
          Gerencie suas preferências e informações da conta
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile">Perfil</TabsTrigger>
          <TabsTrigger value="subscription">Assinatura</TabsTrigger>
          <TabsTrigger value="notifications">Notificações</TabsTrigger>
          <TabsTrigger value="security">Segurança</TabsTrigger>
        </TabsList>

        {/* ── Perfil ── */}
        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  {isLoading ? (
                    <Skeleton className="h-16 w-16 rounded-full" />
                  ) : (
                    <div className="relative group">
                      <Avatar className="h-16 w-16">
                        {avatarPreview ? (
                          <AvatarImage
                            src={avatarPreview}
                            alt="Foto de perfil"
                          />
                        ) : (
                          <AvatarFallback className="text-xl font-bold bg-primary/10 text-primary">
                            {initials}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <button
                        type="button"
                        onClick={() => avatarInputRef.current?.click()}
                        disabled={avatarUploading}
                        className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                        {avatarUploading ? (
                          <Loader2 className="h-5 w-5 text-white animate-spin" />
                        ) : (
                          <Camera className="h-5 w-5 text-white" />
                        )}
                      </button>
                      <input
                        ref={avatarInputRef}
                        type="file"
                        accept="image/jpg,image/jpeg,image/png,image/webp"
                        className="hidden"
                        onChange={handleAvatarChange}
                      />
                    </div>
                  )}
                  <div>
                    <CardTitle>Informações do Perfil</CardTitle>
                    <CardDescription>
                      {isLoading ? (
                        <Skeleton className="h-4 w-40 mt-1" />
                      ) : (
                        user && `Membro desde ${formatDate(user.createdAt)}`
                      )}
                    </CardDescription>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(!isEditing)}>
                  {isEditing ? (
                    <X className="h-4 w-4" />
                  ) : (
                    <Edit className="h-4 w-4" />
                  )}
                  {isEditing ? 'Cancelar' : 'Editar'}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Dados Pessoais */}
              <div>
                <h3 className="text-lg font-medium mb-4">Dados Pessoais</h3>
                {isLoading ? (
                  <div className="grid grid-cols-2 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                      <Skeleton key={i} className="h-10" />
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nome</Label>
                      <Input
                        id="name"
                        value={profileData.firstName}
                        onChange={(e) =>
                          setProfileData({
                            ...profileData,
                            firstName: e.target.value,
                          })
                        }
                        disabled={!isEditing}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Sobrenome</Label>
                      <Input
                        id="lastName"
                        value={profileData.lastName}
                        onChange={(e) =>
                          setProfileData({
                            ...profileData,
                            lastName: e.target.value,
                          })
                        }
                        disabled={!isEditing}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={profileData.email}
                        onChange={(e) =>
                          setProfileData({
                            ...profileData,
                            email: e.target.value,
                          })
                        }
                        disabled={!isEditing}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cpf">CPF</Label>
                      <Input
                        id="cpf"
                        value={profileData.cpf}
                        onChange={(e) =>
                          setProfileData({
                            ...profileData,
                            cpf: formatCPF(e.target.value),
                          })
                        }
                        disabled={!isEditing}
                        maxLength={14}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Endereço */}
              <div>
                <h3 className="text-lg font-medium mb-4">Endereço</h3>
                {isLoading ? (
                  <div className="grid grid-cols-2 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                      <Skeleton key={i} className="h-10" />
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="street">Rua</Label>
                      <Input
                        id="street"
                        value={profileData.address.street}
                        onChange={(e) =>
                          setProfileData({
                            ...profileData,
                            address: {
                              ...profileData.address,
                              street: e.target.value,
                            },
                          })
                        }
                        disabled={!isEditing}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="number">Número</Label>
                      <Input
                        id="number"
                        value={profileData.address.number}
                        onChange={(e) =>
                          setProfileData({
                            ...profileData,
                            address: {
                              ...profileData.address,
                              number: e.target.value,
                            },
                          })
                        }
                        disabled={!isEditing}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="complement">Complemento</Label>
                      <Input
                        id="complement"
                        value={profileData.address.complement}
                        onChange={(e) =>
                          setProfileData({
                            ...profileData,
                            address: {
                              ...profileData.address,
                              complement: e.target.value,
                            },
                          })
                        }
                        disabled={!isEditing}
                        placeholder="Opcional"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="city">Cidade</Label>
                      <Input
                        id="city"
                        value={profileData.address.city}
                        onChange={(e) =>
                          setProfileData({
                            ...profileData,
                            address: {
                              ...profileData.address,
                              city: e.target.value,
                            },
                          })
                        }
                        disabled={!isEditing}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="state">Estado</Label>
                      <Input
                        id="state"
                        value={profileData.address.state}
                        onChange={(e) =>
                          setProfileData({
                            ...profileData,
                            address: {
                              ...profileData.address,
                              state: e.target.value.toUpperCase(),
                            },
                          })
                        }
                        disabled={!isEditing}
                        maxLength={2}
                        placeholder="SP"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="zipCode">CEP</Label>
                      <Input
                        id="zipCode"
                        value={profileData.address.zipCode}
                        onChange={(e) =>
                          setProfileData({
                            ...profileData,
                            address: {
                              ...profileData.address,
                              zipCode: formatZipCode(e.target.value),
                            },
                          })
                        }
                        disabled={!isEditing}
                        maxLength={9}
                      />
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
            {isEditing && (
              <CardFooter>
                <Button
                  onClick={() => saveProfileMutation.mutate(profileData)}
                  disabled={saveProfileMutation.isPending}
                  className="ml-auto">
                  <Save className="h-4 w-4 mr-2" />
                  {saveProfileMutation.isPending
                    ? 'Salvando...'
                    : 'Salvar Alterações'}
                </Button>
              </CardFooter>
            )}
          </Card>
        </TabsContent>

        {/* ── Assinatura ── */}
        <TabsContent value="subscription" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Crown className="h-5 w-5 text-primary" />
                <CardTitle>Plano Atual</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {subLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-8 w-40" />
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-4 w-56" />
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-semibold">
                      {subscription?.planName || 'Free'}
                    </h3>
                    <p className="text-muted-foreground">
                      Status:{' '}
                      <Badge variant="default">
                        {subscription?.status === 'active'
                          ? 'Ativo'
                          : 'Inativo'}
                      </Badge>
                    </p>
                    {subscription?.expiresAt && (
                      <p className="text-sm text-muted-foreground">
                        Expira em: {formatDate(subscription.expiresAt)}
                      </p>
                    )}
                  </div>
                  <Button asChild>
                    <a href="/subscription">Gerenciar Plano</a>
                  </Button>
                </div>
              )}

              {subscription?.features && subscription.features.length > 0 && (
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-2">Recursos inclusos:</h4>
                  <ul className="space-y-1">
                    {subscription.features.map((feature, index) => (
                      <li key={index} className="flex items-center space-x-2">
                        <Check className="h-4 w-4 text-primary" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Notificações ── */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Bell className="h-5 w-5" />
                <CardTitle>Notificações</CardTitle>
              </div>
              <CardDescription>
                Configure como você deseja receber atualizações
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="email-notifications">
                      Notificações por Email
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Receba resumos e atualizações importantes por email
                    </p>
                  </div>
                  <Switch
                    id="email-notifications"
                    checked={settings.notifications.email}
                    onCheckedChange={(checked) =>
                      setSettings({
                        ...settings,
                        notifications: {
                          ...settings.notifications,
                          email: checked,
                        },
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="push-notifications">
                      Notificações Push
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Receba notificações em tempo real no navegador
                    </p>
                  </div>
                  <Switch
                    id="push-notifications"
                    checked={settings.notifications.push}
                    onCheckedChange={(checked) =>
                      setSettings({
                        ...settings,
                        notifications: {
                          ...settings.notifications,
                          push: checked,
                        },
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="market-alerts">Alertas de Mercado</Label>
                    <p className="text-sm text-muted-foreground">
                      Notificações sobre mudanças significativas no mercado
                    </p>
                  </div>
                  <Switch
                    id="market-alerts"
                    checked={settings.notifications.marketAlerts}
                    onCheckedChange={(checked) =>
                      setSettings({
                        ...settings,
                        notifications: {
                          ...settings.notifications,
                          marketAlerts: checked,
                        },
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="portfolio-updates">
                      Atualizações de Portfólio
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Notificações sobre mudanças na sua carteira
                    </p>
                  </div>
                  <Switch
                    id="portfolio-updates"
                    checked={settings.notifications.portfolioUpdates}
                    onCheckedChange={(checked) =>
                      setSettings({
                        ...settings,
                        notifications: {
                          ...settings.notifications,
                          portfolioUpdates: checked,
                        },
                      })
                    }
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                onClick={() => saveSettingsMutation.mutate()}
                disabled={saveSettingsMutation.isPending}
                className="ml-auto">
                <Save className="h-4 w-4 mr-2" />
                {saveSettingsMutation.isPending
                  ? 'Salvando...'
                  : 'Salvar Configurações'}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* ── Segurança ── */}
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Shield className="h-5 w-5" />
                <CardTitle>Segurança</CardTitle>
              </div>
              <CardDescription>Mantenha sua conta segura</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <Label className="text-base">
                      Autenticação de Dois Fatores (2FA)
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      Proteja sua conta exigindo um código adicional do seu
                      aplicativo autenticador ao fazer login.
                    </p>
                  </div>
                  {settings.security.twoFactorEnabled ? (
                    <Badge
                      variant="default"
                      className="bg-success text-success-foreground">
                      <ShieldCheck className="h-3 w-3 mr-1" /> Habilitado
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-muted-foreground">
                      <ShieldOff className="h-3 w-3 mr-1" /> Desabilitado
                    </Badge>
                  )}
                </div>

                {!settings.security.twoFactorEnabled && !twoFASetup && (
                  <Button onClick={setup2FA} disabled={twoFALoading}>
                    {twoFALoading && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    <QrCode className="mr-2 h-4 w-4" />
                    Configurar 2FA
                  </Button>
                )}

                {twoFASetup && (
                  <div className="p-4 bg-muted/50 rounded-lg space-y-4 border border-border">
                    <div className="flex flex-col sm:flex-row items-center gap-6">
                      <div className="bg-white p-2 rounded-lg">
                        <img
                          src={twoFASetup.qrCodeDataUrl}
                          alt="QR Code 2FA"
                          className="w-40 h-40"
                        />
                      </div>
                      <div className="space-y-2 flex-1">
                        <h4 className="font-medium">1. Escaneie o QR Code</h4>
                        <p className="text-sm text-muted-foreground">
                          Use o Google Authenticator, Authy ou similar. Se não
                          puder escanear, use a chave abaixo:
                        </p>
                        <code className="bg-background px-2 py-1 rounded text-xs select-all">
                          {twoFASetup.secret}
                        </code>

                        <div className="pt-2 space-y-2">
                          <h4 className="font-medium">2. Insira o código</h4>
                          <div className="flex gap-2">
                            <Input
                              placeholder="000000"
                              value={twoFACode}
                              onChange={(e) =>
                                setTwoFACode(
                                  e.target.value.replace(/\D/g, '').slice(0, 6),
                                )
                              }
                              maxLength={6}
                              className="w-32 text-center tracking-widest font-mono"
                            />
                            <Button
                              onClick={verify2FA}
                              disabled={twoFACode.length !== 6 || twoFALoading}>
                              {twoFALoading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                'Verificar e Ativar'
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {settings.security.twoFactorEnabled && (
                  <div className="p-4 bg-destructive/10 rounded-lg border border-destructive/20 space-y-3">
                    <h4 className="font-medium text-destructive">
                      Desativar 2FA
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Para desativar a autenticação em dois fatores, insira o
                      código atual do seu aplicativo.
                    </p>
                    <div className="flex gap-2">
                      <Input
                        placeholder="000000"
                        value={disable2FACode}
                        onChange={(e) =>
                          setDisable2FACode(
                            e.target.value.replace(/\D/g, '').slice(0, 6),
                          )
                        }
                        maxLength={6}
                        className="w-32 text-center tracking-widest font-mono"
                      />
                      <Button
                        variant="destructive"
                        onClick={disable2FA}
                        disabled={disable2FACode.length !== 6 || disabling2FA}>
                        {disabling2FA ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          'Desativar 2FA'
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Alterar Senha</Label>
                <div className="space-y-2">
                  <div className="relative">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Senha atual"
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <Input 
                    type={showPassword ? 'text' : 'password'} 
                    placeholder="Nova senha" 
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                  />
                  <Input 
                    type={showPassword ? 'text' : 'password'} 
                    placeholder="Confirmar nova senha" 
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                  />
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => updatePasswordMutation.mutate()}
                    disabled={updatePasswordMutation.isPending || !passwordData.currentPassword || !passwordData.newPassword}
                  >
                    {updatePasswordMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Alterar Senha'}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="session-timeout">
                  Timeout de Sessão (minutos)
                </Label>
                <Input
                  id="session-timeout"
                  type="number"
                  value={settings.security.sessionTimeout}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      security: {
                        ...settings.security,
                        sessionTimeout: parseInt(e.target.value),
                      },
                    })
                  }
                />
              </div>

              {/* Preferências de idioma */}
              <div className="space-y-2">
                <Label>
                  <Globe className="inline h-4 w-4 mr-1" />
                  Idioma
                </Label>
                <select
                  className="border rounded-md px-3 py-2 text-sm bg-background w-full"
                  value={settings.preferences.language}
                  onChange={(e) =>
                    setSettings((p) => ({
                      ...p,
                      preferences: {
                        ...p.preferences,
                        language: e.target.value,
                      },
                    }))
                  }>
                  <option value="pt-BR">Português (BR)</option>
                  <option value="en-US">English (US)</option>
                  <option value="es-ES">Español</option>
                </select>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                onClick={() => saveSettingsMutation.mutate()}
                disabled={saveSettingsMutation.isPending}
                className="ml-auto">
                <Save className="h-4 w-4 mr-2" />
                {saveSettingsMutation.isPending
                  ? 'Salvando...'
                  : 'Salvar Configurações'}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
