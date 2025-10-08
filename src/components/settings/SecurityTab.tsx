import React, {useState} from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Switch} from '@/components/ui/switch';
import {Label} from '@/components/ui/label';
import {Input} from '@/components/ui/input';
import {Shield, Save, Eye, EyeOff} from 'lucide-react';
import {UserSettings} from '@/interface/users';

interface SecurityTabProps {
  settings: UserSettings;
  setSettings: (settings: UserSettings) => void;
  handleSettingsSave: () => void;
  password: {newPassword: string; confirmPassword: string};
  setPassword: (password: {
    newPassword: string;
    confirmPassword: string;
  }) => void;
  handlePasswordChange: () => void;
}

export function SecurityTab({
  settings,
  setSettings,
  handleSettingsSave,
  password,
  setPassword,
  handlePasswordChange,
}: SecurityTabProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center space-x-2">
          <Shield className="h-5 w-5" />
          <CardTitle>Segurança</CardTitle>
        </div>
        <CardDescription>Mantenha sua conta segura</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="two-factor">Autenticação de Dois Fatores</Label>
            <p className="text-sm text-muted-foreground">
              Adicione uma camada extra de segurança à sua conta
            </p>
          </div>
          <Switch
            id="two-factor"
            checked={settings.security.twoFactorEnabled}
            onCheckedChange={(checked) =>
              setSettings({
                ...settings,
                security: {
                  ...settings.security,
                  twoFactorEnabled: checked,
                },
              })
            }
          />
        </div>

        <div className="space-y-2">
          <Label>Alterar Senha</Label>
          <div className="space-y-2">
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="Nova senha"
                value={password.newPassword}
                onChange={(e) =>
                  setPassword({...password, newPassword: e.target.value})
                }
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
              type="password"
              placeholder="Confirmar nova senha"
              value={password.confirmPassword}
              onChange={(e) =>
                setPassword({...password, confirmPassword: e.target.value})
              }
            />
            <Button variant="outline" size="sm" onClick={handlePasswordChange}>
              Alterar Senha
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="session-timeout">Timeout de Sessão (minutos)</Label>
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
      </CardContent>
      <CardFooter>
        <Button onClick={handleSettingsSave} className="ml-auto">
          <Save className="h-4 w-4 mr-2" />
          Salvar Configurações
        </Button>
      </CardFooter>
    </Card>
  );
}
