import {jwtDecode} from 'jwt-decode';
import Profile from '@/services/profile';
import Address from '@/services/address';
import {api, profileService} from '@/server/api/api';
import type {IUserProfileResponse} from '@/interface/users';
import type {AddressResponse} from '@/interface/address';

export interface PersonalData {
  firstName: string;
  lastName: string;
  email: string;
  cpf: string;
  address: {
    street: string;
    number: string;
    complement: string;
    city: string;
    state: string;
    zipCode: string;
  };
}

/** Preferências guardadas no perfil estendido que esta tela não edita, mas não pode apagar. */
type StoredPreferences = Record<string, unknown>;

export interface AccountSettings {
  personalData: PersonalData;
  memberSince: string | null;
  twoFactorEnabled: boolean;
  profileId: string | null;
  /** `preferences.notifications` do perfil: o servidor guarda um único boolean. */
  emailNotifications: boolean;
  storedPreferences: StoredPreferences;
}

export const ACCOUNT_SETTINGS_QUERY_KEY = ['user-profile'] as const;

function currentUserId(): string {
  const token = localStorage.getItem('access_token');
  if (!token) throw new Error('Sessão expirada');
  return jwtDecode<{userId: string}>(token).userId;
}

export async function fetchAccountSettings(): Promise<AccountSettings> {
  const user = (await Profile.getProfile()) as IUserProfileResponse & {
    twoFactorEnabled?: boolean;
  };

  const [addressResult, profileResult] = await Promise.allSettled([
    Address.getAddressByUser(user._id) as Promise<AddressResponse | null>,
    profileService.getMyProfile(),
  ]);

  const address =
    addressResult.status === 'fulfilled' ? addressResult.value : null;
  const profile =
    profileResult.status === 'fulfilled' ? profileResult.value.data : null;
  const storedPreferences: StoredPreferences = profile?.preferences ?? {};

  return {
    personalData: {
      firstName: user.firstName ?? '',
      lastName: user.lastName ?? '',
      email: user.email ?? '',
      cpf: user.cpf ?? '',
      address: {
        street: address?.street ?? '',
        number: address?.number ?? '',
        complement: address?.complement ?? '',
        city: address?.city ?? '',
        state: address?.state ?? '',
        zipCode: address?.zipCode ?? '',
      },
    },
    memberSince: user.createdAt ?? null,
    twoFactorEnabled: Boolean(user.twoFactorEnabled),
    profileId: profile?.id ?? profile?._id ?? null,
    emailNotifications: storedPreferences.notifications !== false,
    storedPreferences,
  };
}

export async function savePersonalData(data: PersonalData): Promise<void> {
  const userId = currentUserId();

  await profileService.updateUser(userId, {
    firstName: data.firstName,
    lastName: data.lastName,
    email: data.email,
  });

  const {street, number, city, state, zipCode, complement} = data.address;
  if (street && number && city && state && zipCode) {
    await api.post('/addresses', {
      userId,
      street,
      number,
      complement,
      city,
      state,
      zipCode,
    });
  }
}

export async function saveEmailNotifications(
  settings: Pick<AccountSettings, 'profileId' | 'storedPreferences'>,
  enabled: boolean,
): Promise<void> {
  // O PATCH substitui o subdocumento `preferences` inteiro; sem reenviar os
  // demais campos, idioma e tema voltariam ao default do schema.
  const preferences = {...settings.storedPreferences, notifications: enabled};

  if (settings.profileId) {
    await profileService.updateProfile(settings.profileId, {preferences});
    return;
  }

  const userId = currentUserId();
  await profileService.createProfile(userId, {userId, preferences});
}

export async function uploadAvatar(file: File): Promise<void> {
  const formData = new FormData();
  formData.append('file', file);
  await api.post('/profile/avatar', formData, {
    headers: {'Content-Type': 'multipart/form-data'},
  });
}
