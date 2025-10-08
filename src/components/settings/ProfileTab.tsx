
import React from 'react';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Save, User, Edit, X } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { IUserProfileResponse } from '@/interface/users';

interface ProfileTabProps {
  user: IUserProfileResponse | undefined;
  isEditing: boolean;
  setIsEditing: (isEditing: boolean) => void;
  profileData: any;
  setProfileData: (data: any) => void;
  handleProfileSave: () => void;
  formatCPF: (value: string) => string;
  formatZipCode: (value: string) => string;
  formatDate: (date: string | Date) => string;
}

export function ProfileTab({
  user,
  isEditing,
  setIsEditing,
  profileData,
  setProfileData,
  handleProfileSave,
  formatCPF,
  formatZipCode,
  formatDate,
}: ProfileTabProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={user?.avatar} />
              <AvatarFallback>
                <User className="h-8 w-8" />
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-xl font-bold">Informações do Perfil</h2>
              <p className="text-muted-foreground">
                Membro desde {user && formatDate(user.createdAt)}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditing(!isEditing)}
          >
            {isEditing ? (
              <X className="h-4 w-4 mr-2" />
            ) : (
              <Edit className="h-4 w-4 mr-2" />
            )}
            {isEditing ? 'Cancelar' : 'Editar'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h3 className="text-lg font-medium mb-4">Dados Pessoais</h3>
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
                  setProfileData({ ...profileData, email: e.target.value })
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
        </div>

        <div>
          <h3 className="text-lg font-medium mb-4">Endereço</h3>
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
                      state: e.target.value,
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
        </div>
      </CardContent>
      {isEditing && (
        <CardFooter>
          <Button onClick={handleProfileSave} className="ml-auto">
            <Save className="h-4 w-4 mr-2" />
            Salvar Alterações
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
