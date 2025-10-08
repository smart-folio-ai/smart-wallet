
import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Bell, Save } from 'lucide-react';
import { UserSettings } from '@/interface/users';

interface NotificationsTabProps {
  settings: UserSettings;
  setSettings: (settings: UserSettings) => void;
  handleSettingsSave: () => void;
}

export function NotificationsTab({
  settings,
  setSettings,
  handleSettingsSave,
}: NotificationsTabProps) {
  return (
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
              <Label htmlFor="push-notifications">Notificações Push</Label>
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
        <Button onClick={handleSettingsSave} className="ml-auto">
          <Save className="h-4 w-4 mr-2" />
          Salvar Configurações
        </Button>
      </CardFooter>
    </Card>
  );
}
