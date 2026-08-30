import {useState, useEffect} from 'react';
import {Link} from 'react-router-dom';
import {Shield, FileText, Download, Trash2} from '@/components/ui/icons';
import {Button} from '@/components/ui/button';
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card';
import {Switch} from '@/components/ui/switch';
import {Label} from '@/components/ui/label';
import {useConsent} from '@/contexts/ConsentContext';
import {useAppToast} from '@/hooks/use-app-toast';

export const PrivacySettings = () => {
  const {consent, updateConsent} = useConsent();
  const toast = useAppToast();
  const [preferences, setPreferences] = useState({
    functional: true,
    analytics: false,
    marketing: false,
  });

  useEffect(() => {
    if (consent) {
      setPreferences({
        functional: consent.functional,
        analytics: consent.analytics,
        marketing: consent.marketing,
      });
    }
  }, [consent]);

  const handleSave = () => {
    updateConsent(preferences);
    toast.success(
      'Preferências salvas',
      'Suas preferências de privacidade foram atualizadas.',
    );
  };

  const handleDownloadData = () => {
    toast.info(
      'Solicitação enviada',
      'Você receberá um e-mail com seus dados em até 15 dias.',
    );
  };

  const handleDeleteAccount = () => {
    toast.info(
      'Funcionalidade em breve',
      'A exclusão de conta estará disponível em breve.',
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Privacidade</h3>
        <p className="text-sm text-muted-foreground">
          Gerencie suas preferências de privacidade e cookies.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Gerenciar Consentimento
          </CardTitle>
          <CardDescription>
            Escolha quais tipos de cookies você deseja aceitar.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between space-x-2">
              <div className="flex-1">
                <Label className="font-medium">Essenciais</Label>
                <p className="text-sm text-muted-foreground">
                  Sempre ativo (necessário para funcionar)
                </p>
              </div>
              <Switch checked disabled />
            </div>
            <div className="flex items-center justify-between space-x-2">
              <div className="flex-1">
                <Label className="font-medium">Funcionais</Label>
                <p className="text-sm text-muted-foreground">Melhoram sua experiência</p>
              </div>
              <Switch
                checked={preferences.functional}
                onCheckedChange={(checked) =>
                  setPreferences((prev) => ({...prev, functional: checked}))
                }
              />
            </div>
            <div className="flex items-center justify-between space-x-2">
              <div className="flex-1">
                <Label className="font-medium">Analytics</Label>
                <p className="text-sm text-muted-foreground">
                  Nos ajudam a melhorar o produto
                </p>
              </div>
              <Switch
                checked={preferences.analytics}
                onCheckedChange={(checked) =>
                  setPreferences((prev) => ({...prev, analytics: checked}))
                }
              />
            </div>
            <div className="flex items-center justify-between space-x-2">
              <div className="flex-1">
                <Label className="font-medium">Marketing</Label>
                <p className="text-sm text-muted-foreground">Publicidade personalizada</p>
              </div>
              <Switch
                checked={preferences.marketing}
                onCheckedChange={(checked) =>
                  setPreferences((prev) => ({...prev, marketing: checked}))
                }
              />
            </div>
          </div>
          <Button onClick={handleSave}>Salvar Preferências</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Meus Dados</CardTitle>
          <CardDescription>Gerencie seus dados pessoais.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={handleDownloadData}>
              <Download className="h-4 w-4 mr-2" />
              Baixar Meus Dados
            </Button>
            <Button variant="destructive" onClick={handleDeleteAccount}>
              <Trash2 className="h-4 w-4 mr-2" />
              Deletar Minha Conta
            </Button>
          </div>
        </CardContent>
      </Card>

      {consent && (
        <p className="text-sm text-muted-foreground">
          Última atualização: {new Date(consent.timestamp).toLocaleDateString('pt-BR')}
        </p>
      )}

      <div className="flex items-center gap-4 text-sm">
        <Link to="/privacy" className="flex items-center gap-1 text-primary hover:underline">
          <FileText className="h-4 w-4" />
          Política de Privacidade
        </Link>
      </div>
    </div>
  );
};
