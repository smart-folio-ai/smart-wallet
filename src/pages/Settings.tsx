import React, {useRef, useState} from 'react';
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {PrivacySettings} from '@/components/settings/PrivacySettings';
import {z} from 'zod';
import Profile from '@/services/profile';
import Address from '@/services/address';
import {api, profileService} from '@/server/api/api';
import {IUserProfileResponse, UserSettings} from '@/interface/users';
import {AddressResponse} from '@/interface/address';
import useAppToast from '@/hooks/use-app-toast';
import {jwtDecode} from 'jwt-decode';
import {useSubscription} from '@/hooks/useSubscription';
import {formatCurrency, formatDate} from '@/utils';

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

const inputStyle: React.CSSProperties = {
  width: '100%',
  border: '1px solid var(--hair)',
  borderRadius: 8,
  background: 'var(--surf-3)',
  color: 'inherit',
  padding: '8px 12px',
  fontSize: 13,
  outline: 'none',
  boxSizing: 'border-box',
};

const labelStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 500,
  color: 'var(--color-neutral-500)',
  display: 'block',
  marginBottom: 4,
};

function NkSwitch({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => !disabled && onChange(!checked)}
      style={{
        width: 44,
        height: 24,
        borderRadius: 12,
        padding: 2,
        cursor: disabled ? 'not-allowed' : 'pointer',
        background: checked ? 'var(--ac)' : 'var(--surf-3)',
        border: '1px solid var(--hair)',
        transition: 'background 0.2s',
        display: 'inline-flex',
        alignItems: 'center',
        opacity: disabled ? 0.5 : 1,
        flexShrink: 0,
      }}>
      <div
        style={{
          width: 18,
          height: 18,
          borderRadius: '50%',
          background: '#fff',
          transform: checked ? 'translateX(20px)' : 'translateX(0)',
          transition: 'transform 0.2s',
        }}
      />
    </button>
  );
}

export default function Settings() {
  const queryClient = useQueryClient();
  const toast = useAppToast();
  const [isEditing, setIsEditing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    'profile' | 'subscription' | 'notifications' | 'security' | 'privacy'
  >('profile');

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
  const {
    isLoading: subLoading,
    displayPlanName,
    planName,
    status: subscriptionStatus,
    currentPeriodEnd,
    features: subscriptionFeatures,
  } = useSubscription();

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
            notifications:
              typeof myProfile.preferences.notifications === 'object' &&
              myProfile.preferences.notifications !== null
                ? {
                    email: myProfile.preferences.notifications.email ?? true,
                    push: myProfile.preferences.notifications.push ?? false,
                    marketAlerts:
                      myProfile.preferences.notifications.marketAlerts ?? true,
                    portfolioUpdates:
                      myProfile.preferences.notifications.portfolioUpdates ??
                      true,
                  }
                : {
                    email: myProfile.preferences.notifications !== false,
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
          notifications: {
            email: settings.notifications.email,
            push: settings.notifications.push,
            marketAlerts: settings.notifications.marketAlerts,
            portfolioUpdates: settings.notifications.portfolioUpdates,
          },
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
      await api.post(
        '/addresses',
        {
          userId,
          street: data.address.street,
          number: data.address.number,
          complement: data.address.complement,
          city: data.address.city,
          state: data.address.state,
          zipCode: data.address.zipCode,
        },
        {headers: {Authorization: `Bearer ${tokenLocal}`}},
      );
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
            notifications: {
              email: settings.notifications.email,
              push: settings.notifications.push,
              marketAlerts: settings.notifications.marketAlerts,
              portfolioUpdates: settings.notifications.portfolioUpdates,
            },
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
          notifications: {
            email: settings.notifications.email,
            push: settings.notifications.push,
            marketAlerts: settings.notifications.marketAlerts,
            portfolioUpdates: settings.notifications.portfolioUpdates,
          },
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
        {headers: {Authorization: `Bearer ${token}`}},
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

  const formatDateLocal = (dateString: Date | string) => {
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

      await api.post('/profile/avatar', formData, {
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

  const tabs = [
    {id: 'profile', label: 'Perfil'},
    {id: 'subscription', label: 'Assinatura'},
    {id: 'notifications', label: 'Notificações'},
    {id: 'security', label: 'Segurança'},
    {id: 'privacy', label: 'Privacidade'},
  ] as const;

  return (
    <div style={{maxWidth: 900, margin: '0 auto', padding: '32px 16px'}}>
      <style>{`@keyframes nk-spin{to{transform:rotate(360deg)}}`}</style>

      <div style={{marginBottom: 32}}>
        <h1
          style={{
            fontSize: 28,
            fontWeight: 700,
            fontFamily: 'var(--font-heading)',
            margin: 0,
          }}>
          Configurações
        </h1>
        <p style={{color: 'var(--color-neutral-400)', marginTop: 6, fontSize: 14}}>
          Gerencie suas preferências e informações da conta
        </p>
      </div>

      {/* Custom pill tabs */}
      <div
        style={{
          display: 'flex',
          gap: 4,
          background: 'var(--surf-3)',
          borderRadius: 10,
          padding: 4,
          width: 'fit-content',
          flexWrap: 'wrap',
          marginBottom: 24,
        }}>
        {tabs.map(({id, label}) => (
          <button
            key={id}
            type="button"
            onClick={() => setActiveTab(id)}
            style={{
              padding: '7px 16px',
              borderRadius: 7,
              border: 'none',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 500,
              background: activeTab === id ? 'var(--ac)' : 'transparent',
              color:
                activeTab === id ? '#fff' : 'var(--color-neutral-400)',
            }}>
            {label}
          </button>
        ))}
      </div>

      {/* ── Perfil ── */}
      {activeTab === 'profile' && (
        <div
          style={{
            border: '1px solid var(--hair)',
            borderRadius: 14,
            background: 'var(--nk-card)',
            overflow: 'hidden',
          }}>
          {/* CardHeader */}
          <div
            style={{
              padding: '16px 20px',
              borderBottom: '1px solid var(--hair-soft)',
            }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
              <div style={{display: 'flex', alignItems: 'center', gap: 16}}>
                {isLoading ? (
                  <div
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: '50%',
                      background: 'var(--surf-3)',
                    }}
                  />
                ) : (
                  <div style={{position: 'relative'}}>
                    {/* Avatar */}
                    <div
                      style={{
                        width: 64,
                        height: 64,
                        borderRadius: '50%',
                        background: 'var(--surf-3)',
                        border: '2px solid var(--hair)',
                        overflow: 'hidden',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}>
                      {avatarPreview ? (
                        <img
                          src={avatarPreview}
                          alt=""
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                          }}
                          onError={(e) => {
                            (
                              e.target as HTMLImageElement
                            ).style.display = 'none';
                          }}
                        />
                      ) : (
                        <span
                          style={{
                            fontSize: 22,
                            fontWeight: 700,
                            color: 'var(--ac)',
                            fontFamily: 'var(--font-heading)',
                          }}>
                          {initials}
                        </span>
                      )}
                    </div>
                    {/* Camera overlay */}
                    <button
                      type="button"
                      onClick={() => avatarInputRef.current?.click()}
                      disabled={avatarUploading}
                      style={{
                        position: 'absolute',
                        inset: 0,
                        borderRadius: '50%',
                        background: 'rgba(0,0,0,0.55)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: 0,
                        cursor: avatarUploading ? 'not-allowed' : 'pointer',
                        border: 'none',
                        transition: 'opacity 0.2s',
                      }}
                      onMouseEnter={(e) =>
                        ((e.currentTarget as HTMLButtonElement).style.opacity =
                          '1')
                      }
                      onMouseLeave={(e) =>
                        ((e.currentTarget as HTMLButtonElement).style.opacity =
                          '0')
                      }>
                      {avatarUploading ? (
                        <i
                          className="ph-fill ph-spinner"
                          style={{
                            fontSize: 20,
                            color: '#fff',
                            animation: 'nk-spin 0.8s linear infinite',
                          }}
                        />
                      ) : (
                        <i
                          className="ph-fill ph-camera"
                          style={{fontSize: 20, color: '#fff'}}
                        />
                      )}
                    </button>
                    <input
                      ref={avatarInputRef}
                      type="file"
                      accept="image/jpg,image/jpeg,image/png,image/webp"
                      style={{display: 'none'}}
                      onChange={handleAvatarChange}
                    />
                  </div>
                )}
                <div>
                  <div
                    style={{
                      fontSize: 16,
                      fontWeight: 600,
                      fontFamily: 'var(--font-heading)',
                    }}>
                    Informações do Perfil
                  </div>
                  <div style={{color: 'var(--color-neutral-400)', fontSize: 13, marginTop: 2}}>
                    {isLoading ? (
                      <div
                        style={{
                          height: 14,
                          width: 160,
                          borderRadius: 6,
                          background: 'var(--surf-3)',
                          marginTop: 4,
                        }}
                      />
                    ) : (
                      user && `Membro desde ${formatDateLocal(user.createdAt)}`
                    )}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditing(!isEditing)}
                style={{
                  height: 34,
                  padding: '0 14px',
                  borderRadius: 8,
                  border: '1px solid var(--hair)',
                  background: 'transparent',
                  color: 'inherit',
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}>
                {isEditing ? (
                  <i className="ph-fill ph-x" style={{fontSize: 14}} />
                ) : (
                  <i
                    className="ph-fill ph-pencil-simple"
                    style={{fontSize: 14}}
                  />
                )}
                {isEditing ? 'Cancelar' : 'Editar'}
              </button>
            </div>
          </div>

          {/* CardContent */}
          <div style={{padding: '20px'}}>
            {/* Dados Pessoais */}
            <div style={{marginBottom: 28}}>
              <h3 style={{fontSize: 15, fontWeight: 600, marginBottom: 16, marginTop: 0}}>
                Dados Pessoais
              </h3>
              {isLoading ? (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 12,
                  }}>
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      style={{
                        height: 40,
                        borderRadius: 6,
                        background: 'var(--surf-3)',
                      }}
                    />
                  ))}
                </div>
              ) : (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                    gap: 12,
                  }}>
                  <div>
                    <label htmlFor="name" style={labelStyle}>
                      Nome
                    </label>
                    <input
                      id="name"
                      style={{
                        ...inputStyle,
                        opacity: !isEditing ? 0.6 : 1,
                      }}
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
                  <div>
                    <label htmlFor="lastName" style={labelStyle}>
                      Sobrenome
                    </label>
                    <input
                      id="lastName"
                      style={{
                        ...inputStyle,
                        opacity: !isEditing ? 0.6 : 1,
                      }}
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
                  <div>
                    <label htmlFor="email" style={labelStyle}>
                      Email
                    </label>
                    <input
                      id="email"
                      type="email"
                      style={{
                        ...inputStyle,
                        opacity: !isEditing ? 0.6 : 1,
                      }}
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
                  <div>
                    <label htmlFor="cpf" style={labelStyle}>
                      CPF
                    </label>
                    <input
                      id="cpf"
                      style={{
                        ...inputStyle,
                        opacity: !isEditing ? 0.6 : 1,
                      }}
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
              <h3 style={{fontSize: 15, fontWeight: 600, marginBottom: 16, marginTop: 0}}>
                Endereço
              </h3>
              {isLoading ? (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 12,
                  }}>
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      style={{
                        height: 40,
                        borderRadius: 6,
                        background: 'var(--surf-3)',
                      }}
                    />
                  ))}
                </div>
              ) : (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                    gap: 12,
                  }}>
                  <div style={{gridColumn: '1 / -1'}}>
                    <label htmlFor="street" style={labelStyle}>
                      Rua
                    </label>
                    <input
                      id="street"
                      style={{
                        ...inputStyle,
                        opacity: !isEditing ? 0.6 : 1,
                      }}
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
                  <div>
                    <label htmlFor="number" style={labelStyle}>
                      Número
                    </label>
                    <input
                      id="number"
                      style={{
                        ...inputStyle,
                        opacity: !isEditing ? 0.6 : 1,
                      }}
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
                  <div>
                    <label htmlFor="complement" style={labelStyle}>
                      Complemento
                    </label>
                    <input
                      id="complement"
                      style={{
                        ...inputStyle,
                        opacity: !isEditing ? 0.6 : 1,
                      }}
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
                  <div>
                    <label htmlFor="city" style={labelStyle}>
                      Cidade
                    </label>
                    <input
                      id="city"
                      style={{
                        ...inputStyle,
                        opacity: !isEditing ? 0.6 : 1,
                      }}
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
                  <div>
                    <label htmlFor="state" style={labelStyle}>
                      Estado
                    </label>
                    <input
                      id="state"
                      style={{
                        ...inputStyle,
                        opacity: !isEditing ? 0.6 : 1,
                      }}
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
                  <div>
                    <label htmlFor="zipCode" style={labelStyle}>
                      CEP
                    </label>
                    <input
                      id="zipCode"
                      style={{
                        ...inputStyle,
                        opacity: !isEditing ? 0.6 : 1,
                      }}
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
          </div>

          {/* CardFooter */}
          {isEditing && (
            <div
              style={{
                padding: '12px 20px',
                borderTop: '1px solid var(--hair-soft)',
                display: 'flex',
                justifyContent: 'flex-end',
              }}>
              <button
                type="button"
                onClick={() => saveProfileMutation.mutate(profileData)}
                disabled={saveProfileMutation.isPending}
                style={{
                  height: 36,
                  padding: '0 16px',
                  borderRadius: 8,
                  border: 'none',
                  background: 'var(--grad-violet)',
                  color: '#fff',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: saveProfileMutation.isPending
                    ? 'not-allowed'
                    : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  opacity: saveProfileMutation.isPending ? 0.5 : 1,
                }}>
                {saveProfileMutation.isPending ? (
                  <i
                    className="ph-fill ph-spinner"
                    style={{
                      fontSize: 14,
                      animation: 'nk-spin 0.8s linear infinite',
                    }}
                  />
                ) : (
                  <i className="ph-fill ph-floppy-disk" style={{fontSize: 14}} />
                )}
                {saveProfileMutation.isPending ? 'Salvando...' : 'Salvar Alterações'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Assinatura ── */}
      {activeTab === 'subscription' && (
        <div
          style={{
            border: '1px solid var(--hair)',
            borderRadius: 14,
            background: 'var(--nk-card)',
            overflow: 'hidden',
          }}>
          <div
            style={{
              padding: '16px 20px',
              borderBottom: '1px solid var(--hair-soft)',
            }}>
            <div style={{display: 'flex', alignItems: 'center', gap: 8}}>
              <i className="ph-fill ph-crown" style={{fontSize: 18, color: 'var(--ac)'}} />
              <span
                style={{
                  fontSize: 16,
                  fontWeight: 600,
                  fontFamily: 'var(--font-heading)',
                }}>
                Plano Atual
              </span>
            </div>
          </div>
          <div style={{padding: '20px'}}>
            {subLoading ? (
              <div style={{display: 'flex', flexDirection: 'column', gap: 10}}>
                <div
                  style={{height: 32, width: 160, borderRadius: 6, background: 'var(--surf-3)'}}
                />
                <div
                  style={{height: 20, width: 96, borderRadius: 6, background: 'var(--surf-3)'}}
                />
                <div
                  style={{height: 16, width: 224, borderRadius: 6, background: 'var(--surf-3)'}}
                />
              </div>
            ) : (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 12,
                }}>
                <div>
                  <h3 style={{fontSize: 20, fontWeight: 600, margin: '0 0 6px 0'}}>
                    {displayPlanName ||
                      (planName
                        ? planName.replace(/\b\w/g, (c) => c.toUpperCase())
                        : 'Free')}
                  </h3>
                  <p style={{margin: '0 0 4px 0', fontSize: 13, color: 'var(--color-neutral-400)'}}>
                    Status:{' '}
                    <span
                      style={{
                        padding: '3px 10px',
                        borderRadius: 6,
                        fontSize: 11.5,
                        fontWeight: 600,
                        background:
                          subscriptionStatus === 'active' ||
                          subscriptionStatus === 'trialing'
                            ? 'var(--badge-pos-bg)'
                            : 'var(--surf-3)',
                        color:
                          subscriptionStatus === 'active' ||
                          subscriptionStatus === 'trialing'
                            ? 'var(--pos)'
                            : 'var(--color-neutral-400)',
                      }}>
                      {subscriptionStatus === 'active' ||
                      subscriptionStatus === 'trialing'
                        ? 'Ativo'
                        : 'Inativo'}
                    </span>
                  </p>
                  {currentPeriodEnd && (
                    <p style={{margin: 0, fontSize: 13, color: 'var(--color-neutral-400)'}}>
                      Expira em: {formatDate(currentPeriodEnd)}
                    </p>
                  )}
                </div>
                <a
                  href="/subscription"
                  style={{
                    height: 36,
                    padding: '0 16px',
                    borderRadius: 8,
                    border: 'none',
                    background: 'var(--grad-violet)',
                    color: '#fff',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    textDecoration: 'none',
                  }}>
                  Gerenciar Plano
                </a>
              </div>
            )}

            {subscriptionFeatures && subscriptionFeatures.length > 0 && (
              <div
                style={{
                  borderTop: '1px solid var(--hair-soft)',
                  marginTop: 16,
                  paddingTop: 16,
                }}>
                <h4 style={{fontSize: 14, fontWeight: 600, margin: '0 0 8px 0'}}>
                  Recursos inclusos:
                </h4>
                <ul style={{listStyle: 'none', padding: 0, margin: 0}}>
                  {subscriptionFeatures.map((feature, index) => (
                    <li
                      key={index}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        marginBottom: 4,
                        fontSize: 13,
                      }}>
                      <i
                        className="ph-fill ph-check"
                        style={{fontSize: 14, color: 'var(--pos)', flexShrink: 0}}
                      />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Notificações ── */}
      {activeTab === 'notifications' && (
        <div
          style={{
            border: '1px solid var(--hair)',
            borderRadius: 14,
            background: 'var(--nk-card)',
            overflow: 'hidden',
          }}>
          <div
            style={{
              padding: '16px 20px',
              borderBottom: '1px solid var(--hair-soft)',
            }}>
            <div style={{display: 'flex', alignItems: 'center', gap: 8}}>
              <i className="ph-fill ph-bell" style={{fontSize: 18}} />
              <span
                style={{
                  fontSize: 16,
                  fontWeight: 600,
                  fontFamily: 'var(--font-heading)',
                }}>
                Notificações
              </span>
            </div>
            <p style={{fontSize: 13, color: 'var(--color-neutral-400)', margin: '4px 0 0 0'}}>
              Configure como você deseja receber atualizações
            </p>
          </div>

          <div style={{padding: '20px'}}>
            <div style={{display: 'flex', flexDirection: 'column', gap: 20}}>
              {/* Email notifications */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                }}>
                <div>
                  <label style={{...labelStyle, fontSize: 13, color: 'inherit'}}>
                    Notificações por Email
                  </label>
                  <p style={{margin: 0, fontSize: 12, color: 'var(--color-neutral-400)'}}>
                    Receba resumos e atualizações importantes por email
                  </p>
                </div>
                <NkSwitch
                  checked={settings.notifications.email}
                  onChange={(checked) =>
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

              {/* Push notifications */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                }}>
                <div>
                  <label style={{...labelStyle, fontSize: 13, color: 'inherit'}}>
                    Notificações Push
                  </label>
                  <p style={{margin: 0, fontSize: 12, color: 'var(--color-neutral-400)'}}>
                    Receba notificações em tempo real no navegador
                  </p>
                </div>
                <NkSwitch
                  checked={settings.notifications.push}
                  onChange={(checked) =>
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

              {/* Market alerts */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                }}>
                <div>
                  <label style={{...labelStyle, fontSize: 13, color: 'inherit'}}>
                    Alertas de Mercado
                  </label>
                  <p style={{margin: 0, fontSize: 12, color: 'var(--color-neutral-400)'}}>
                    Notificações sobre mudanças significativas no mercado
                  </p>
                </div>
                <NkSwitch
                  checked={settings.notifications.marketAlerts}
                  onChange={(checked) =>
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

              {/* Portfolio updates */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                }}>
                <div>
                  <label style={{...labelStyle, fontSize: 13, color: 'inherit'}}>
                    Atualizações de Portfólio
                  </label>
                  <p style={{margin: 0, fontSize: 12, color: 'var(--color-neutral-400)'}}>
                    Notificações sobre mudanças na sua carteira
                  </p>
                </div>
                <NkSwitch
                  checked={settings.notifications.portfolioUpdates}
                  onChange={(checked) =>
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
          </div>

          <div
            style={{
              padding: '12px 20px',
              borderTop: '1px solid var(--hair-soft)',
              display: 'flex',
              justifyContent: 'flex-end',
            }}>
            <button
              type="button"
              onClick={() => saveSettingsMutation.mutate()}
              disabled={saveSettingsMutation.isPending}
              style={{
                height: 36,
                padding: '0 16px',
                borderRadius: 8,
                border: 'none',
                background: 'var(--grad-violet)',
                color: '#fff',
                fontSize: 13,
                fontWeight: 600,
                cursor: saveSettingsMutation.isPending
                  ? 'not-allowed'
                  : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                opacity: saveSettingsMutation.isPending ? 0.5 : 1,
              }}>
              {saveSettingsMutation.isPending ? (
                <i
                  className="ph-fill ph-spinner"
                  style={{
                    fontSize: 14,
                    animation: 'nk-spin 0.8s linear infinite',
                  }}
                />
              ) : (
                <i className="ph-fill ph-floppy-disk" style={{fontSize: 14}} />
              )}
              {saveSettingsMutation.isPending ? 'Salvando...' : 'Salvar Configurações'}
            </button>
          </div>
        </div>
      )}

      {/* ── Segurança ── */}
      {activeTab === 'security' && (
        <div
          style={{
            border: '1px solid var(--hair)',
            borderRadius: 14,
            background: 'var(--nk-card)',
            overflow: 'hidden',
          }}>
          <div
            style={{
              padding: '16px 20px',
              borderBottom: '1px solid var(--hair-soft)',
            }}>
            <div style={{display: 'flex', alignItems: 'center', gap: 8}}>
              <i className="ph-fill ph-shield" style={{fontSize: 18}} />
              <span
                style={{
                  fontSize: 16,
                  fontWeight: 600,
                  fontFamily: 'var(--font-heading)',
                }}>
                Segurança
              </span>
            </div>
            <p style={{fontSize: 13, color: 'var(--color-neutral-400)', margin: '4px 0 0 0'}}>
              Mantenha sua conta segura
            </p>
          </div>

          <div style={{padding: '20px'}}>
            <div style={{display: 'flex', flexDirection: 'column', gap: 24}}>
              {/* 2FA section */}
              <div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    gap: 12,
                    marginBottom: 12,
                  }}>
                  <div>
                    <div style={{fontSize: 14, fontWeight: 600, marginBottom: 4}}>
                      Autenticação de Dois Fatores (2FA)
                    </div>
                    <p style={{fontSize: 13, color: 'var(--color-neutral-400)', margin: 0}}>
                      Proteja sua conta exigindo um código adicional do seu
                      aplicativo autenticador ao fazer login.
                    </p>
                  </div>
                  {settings.security.twoFactorEnabled ? (
                    <span
                      style={{
                        padding: '3px 10px',
                        borderRadius: 6,
                        fontSize: 11.5,
                        fontWeight: 600,
                        background: 'var(--badge-pos-bg)',
                        color: 'var(--pos)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        whiteSpace: 'nowrap',
                      }}>
                      <i className="ph-fill ph-shield-check" style={{fontSize: 12}} />
                      Habilitado
                    </span>
                  ) : (
                    <span
                      style={{
                        padding: '3px 10px',
                        borderRadius: 6,
                        fontSize: 11.5,
                        fontWeight: 600,
                        background: 'var(--surf-3)',
                        color: 'var(--color-neutral-400)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        whiteSpace: 'nowrap',
                      }}>
                      <i className="ph-fill ph-shield-slash" style={{fontSize: 12}} />
                      Desabilitado
                    </span>
                  )}
                </div>

                {!settings.security.twoFactorEnabled && !twoFASetup && (
                  <button
                    type="button"
                    onClick={setup2FA}
                    disabled={twoFALoading}
                    style={{
                      height: 36,
                      padding: '0 16px',
                      borderRadius: 8,
                      border: 'none',
                      background: 'var(--grad-violet)',
                      color: '#fff',
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: twoFALoading ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      opacity: twoFALoading ? 0.5 : 1,
                    }}>
                    {twoFALoading && (
                      <i
                        className="ph-fill ph-spinner"
                        style={{
                          fontSize: 14,
                          animation: 'nk-spin 0.8s linear infinite',
                        }}
                      />
                    )}
                    <i className="ph-fill ph-qr-code" style={{fontSize: 14}} />
                    Configurar 2FA
                  </button>
                )}

                {twoFASetup && (
                  <div
                    style={{
                      padding: 16,
                      background: 'var(--surf-3)',
                      borderRadius: 10,
                      border: '1px solid var(--hair)',
                    }}>
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'row',
                        flexWrap: 'wrap',
                        alignItems: 'center',
                        gap: 24,
                      }}>
                      <div
                        style={{
                          background: '#fff',
                          padding: 8,
                          borderRadius: 8,
                        }}>
                        <img
                          src={twoFASetup.qrCodeDataUrl}
                          alt="QR Code 2FA"
                          style={{width: 160, height: 160, display: 'block'}}
                        />
                      </div>
                      <div style={{flex: 1, minWidth: 200}}>
                        <h4 style={{fontSize: 14, fontWeight: 600, margin: '0 0 6px 0'}}>
                          1. Escaneie o QR Code
                        </h4>
                        <p
                          style={{
                            fontSize: 13,
                            color: 'var(--color-neutral-400)',
                            margin: '0 0 8px 0',
                          }}>
                          Use o Google Authenticator, Authy ou similar. Se não
                          puder escanear, use a chave abaixo:
                        </p>
                        <code
                          style={{
                            background: 'var(--sunk)',
                            padding: '2px 8px',
                            borderRadius: 4,
                            fontSize: 11,
                            userSelect: 'all',
                            display: 'inline-block',
                            marginBottom: 12,
                          }}>
                          {twoFASetup.secret}
                        </code>

                        <h4 style={{fontSize: 14, fontWeight: 600, margin: '0 0 8px 0'}}>
                          2. Insira o código
                        </h4>
                        <div style={{display: 'flex', gap: 8}}>
                          <input
                            placeholder="000000"
                            value={twoFACode}
                            onChange={(e) =>
                              setTwoFACode(
                                e.target.value.replace(/\D/g, '').slice(0, 6),
                              )
                            }
                            maxLength={6}
                            style={{
                              ...inputStyle,
                              width: 128,
                              textAlign: 'center',
                              letterSpacing: '0.2em',
                              fontFamily: 'monospace',
                            }}
                          />
                          <button
                            type="button"
                            onClick={verify2FA}
                            disabled={twoFACode.length !== 6 || twoFALoading}
                            style={{
                              height: 36,
                              padding: '0 14px',
                              borderRadius: 8,
                              border: 'none',
                              background: 'var(--grad-violet)',
                              color: '#fff',
                              fontSize: 13,
                              fontWeight: 600,
                              cursor:
                                twoFACode.length !== 6 || twoFALoading
                                  ? 'not-allowed'
                                  : 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 6,
                              opacity:
                                twoFACode.length !== 6 || twoFALoading ? 0.5 : 1,
                              whiteSpace: 'nowrap',
                            }}>
                            {twoFALoading ? (
                              <i
                                className="ph-fill ph-spinner"
                                style={{
                                  fontSize: 14,
                                  animation: 'nk-spin 0.8s linear infinite',
                                }}
                              />
                            ) : (
                              'Verificar e Ativar'
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {settings.security.twoFactorEnabled && (
                  <div
                    style={{
                      padding: 16,
                      background: 'var(--badge-neg-bg)',
                      borderRadius: 10,
                      border: '1px solid var(--neg)',
                    }}>
                    <h4
                      style={{
                        fontSize: 14,
                        fontWeight: 600,
                        color: 'var(--neg)',
                        margin: '0 0 6px 0',
                      }}>
                      Desativar 2FA
                    </h4>
                    <p style={{fontSize: 13, color: 'var(--color-neutral-400)', margin: '0 0 10px 0'}}>
                      Para desativar a autenticação em dois fatores, insira o
                      código atual do seu aplicativo.
                    </p>
                    <div style={{display: 'flex', gap: 8}}>
                      <input
                        placeholder="000000"
                        value={disable2FACode}
                        onChange={(e) =>
                          setDisable2FACode(
                            e.target.value.replace(/\D/g, '').slice(0, 6),
                          )
                        }
                        maxLength={6}
                        style={{
                          ...inputStyle,
                          width: 128,
                          textAlign: 'center',
                          letterSpacing: '0.2em',
                          fontFamily: 'monospace',
                        }}
                      />
                      <button
                        type="button"
                        onClick={disable2FA}
                        disabled={disable2FACode.length !== 6 || disabling2FA}
                        style={{
                          height: 36,
                          padding: '0 14px',
                          borderRadius: 8,
                          border: 'none',
                          background: 'var(--neg)',
                          color: '#fff',
                          fontSize: 13,
                          fontWeight: 600,
                          cursor:
                            disable2FACode.length !== 6 || disabling2FA
                              ? 'not-allowed'
                              : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          opacity:
                            disable2FACode.length !== 6 || disabling2FA ? 0.5 : 1,
                        }}>
                        {disabling2FA ? (
                          <i
                            className="ph-fill ph-spinner"
                            style={{
                              fontSize: 14,
                              animation: 'nk-spin 0.8s linear infinite',
                            }}
                          />
                        ) : (
                          'Desativar 2FA'
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Password section */}
              <div>
                <label style={{...labelStyle, fontSize: 14, color: 'inherit', fontWeight: 600}}>
                  Alterar Senha
                </label>
                <div style={{display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8}}>
                  <div style={{position: 'relative'}}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Senha atual"
                      value={passwordData.currentPassword}
                      onChange={(e) =>
                        setPasswordData({
                          ...passwordData,
                          currentPassword: e.target.value,
                        })
                      }
                      style={{...inputStyle, paddingRight: 40}}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: 'absolute',
                        right: 10,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--color-neutral-400)',
                        display: 'flex',
                        alignItems: 'center',
                        padding: 0,
                      }}>
                      {showPassword ? (
                        <i className="ph-fill ph-eye-slash" style={{fontSize: 16}} />
                      ) : (
                        <i className="ph-fill ph-eye" style={{fontSize: 16}} />
                      )}
                    </button>
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Nova senha"
                    value={passwordData.newPassword}
                    onChange={(e) =>
                      setPasswordData({
                        ...passwordData,
                        newPassword: e.target.value,
                      })
                    }
                    style={inputStyle}
                  />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Confirmar nova senha"
                    value={passwordData.confirmPassword}
                    onChange={(e) =>
                      setPasswordData({
                        ...passwordData,
                        confirmPassword: e.target.value,
                      })
                    }
                    style={inputStyle}
                  />
                  <button
                    type="button"
                    onClick={() => updatePasswordMutation.mutate()}
                    disabled={
                      updatePasswordMutation.isPending ||
                      !passwordData.currentPassword ||
                      !passwordData.newPassword
                    }
                    style={{
                      height: 34,
                      padding: '0 14px',
                      borderRadius: 8,
                      border: '1px solid var(--hair)',
                      background: 'transparent',
                      color: 'inherit',
                      fontSize: 13,
                      fontWeight: 500,
                      cursor:
                        updatePasswordMutation.isPending ||
                        !passwordData.currentPassword ||
                        !passwordData.newPassword
                          ? 'not-allowed'
                          : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      width: 'fit-content',
                      opacity:
                        updatePasswordMutation.isPending ||
                        !passwordData.currentPassword ||
                        !passwordData.newPassword
                          ? 0.5
                          : 1,
                    }}>
                    {updatePasswordMutation.isPending ? (
                      <i
                        className="ph-fill ph-spinner"
                        style={{
                          fontSize: 14,
                          animation: 'nk-spin 0.8s linear infinite',
                        }}
                      />
                    ) : (
                      'Alterar Senha'
                    )}
                  </button>
                </div>
              </div>

              {/* Session timeout */}
              <div>
                <label htmlFor="session-timeout" style={{...labelStyle, fontSize: 14, color: 'inherit', fontWeight: 600}}>
                  Timeout de Sessão (minutos)
                </label>
                <input
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
                  style={{...inputStyle, marginTop: 6}}
                />
              </div>

              {/* Language preference */}
              <div>
                <label
                  style={{
                    ...labelStyle,
                    fontSize: 14,
                    color: 'inherit',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}>
                  <i className="ph-fill ph-globe" style={{fontSize: 16}} />
                  Idioma
                </label>
                <select
                  style={{
                    ...inputStyle,
                    marginTop: 6,
                    appearance: 'auto',
                  }}
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
            </div>
          </div>

          <div
            style={{
              padding: '12px 20px',
              borderTop: '1px solid var(--hair-soft)',
              display: 'flex',
              justifyContent: 'flex-end',
            }}>
            <button
              type="button"
              onClick={() => saveSettingsMutation.mutate()}
              disabled={saveSettingsMutation.isPending}
              style={{
                height: 36,
                padding: '0 16px',
                borderRadius: 8,
                border: 'none',
                background: 'var(--grad-violet)',
                color: '#fff',
                fontSize: 13,
                fontWeight: 600,
                cursor: saveSettingsMutation.isPending
                  ? 'not-allowed'
                  : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                opacity: saveSettingsMutation.isPending ? 0.5 : 1,
              }}>
              {saveSettingsMutation.isPending ? (
                <i
                  className="ph-fill ph-spinner"
                  style={{
                    fontSize: 14,
                    animation: 'nk-spin 0.8s linear infinite',
                  }}
                />
              ) : (
                <i className="ph-fill ph-floppy-disk" style={{fontSize: 14}} />
              )}
              {saveSettingsMutation.isPending
                ? 'Salvando...'
                : 'Salvar Configurações'}
            </button>
          </div>
        </div>
      )}

      {/* ── Privacidade ── */}
      {activeTab === 'privacy' && (
        <div
          style={{
            border: '1px solid var(--hair)',
            borderRadius: 14,
            background: 'var(--nk-card)',
            overflow: 'hidden',
          }}>
          <div style={{padding: '20px'}}>
            <PrivacySettings />
          </div>
        </div>
      )}
    </div>
  );
}
