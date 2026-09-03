import {useState, useEffect} from 'react';
import {Link, useNavigate} from 'react-router-dom';
import {useMutation} from '@tanstack/react-query';
import {Shield, FileText, Download, Trash2, Loader2} from '@/components/ui/icons';
import {Button} from '@/components/ui/button';
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card';
import {Switch} from '@/components/ui/switch';
import {Label} from '@/components/ui/label';
import {Input} from '@/components/ui/input';
import {ConfirmDialog} from '@/components/ConfirmDialog';
import {useConsent} from '@/contexts/ConsentContext';
import {useAppToast} from '@/hooks/use-app-toast';
import {useAuth} from '@/hooks/useAuth';
import {privacyService} from '@/server/api/api';

const DELETE_CONFIRMATION_WORD = 'APAGAR';

export const PrivacySettings = () => {
  const {consent, updateConsent} = useConsent();
  const toast = useAppToast();
  const navigate = useNavigate();
  const {logout} = useAuth();
  const [preferences, setPreferences] = useState({
    functional: true,
    analytics: false,
    marketing: false,
  });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');

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

  const exportDataMutation = useMutation({
    mutationFn: async () => {
      const response = await privacyService.exportMyData();
      return response.data;
    },
    onSuccess: (data) => {
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const today = new Date().toISOString().slice(0, 10);
      link.href = url;
      link.download = `meus-dados-trackerr-${today}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success(
        'Download iniciado',
        'Seus dados foram exportados em um arquivo JSON.',
      );
    },
    onError: () => {
      toast.error(
        'Erro ao exportar dados',
        'Não foi possível gerar sua exportação agora. Tente novamente em instantes.',
      );
    },
  });

  const deleteAccountMutation = useMutation({
    mutationFn: async () => {
      await privacyService.deleteMyAccount();
    },
    onSuccess: () => {
      toast.success(
        'Conta removida',
        'Sua conta e seus dados de autenticação foram apagados.',
      );
      setDeleteDialogOpen(false);
      logout();
      navigate('/', {replace: true});
    },
    onError: () => {
      toast.error(
        'Erro ao apagar conta',
        'Não foi possível concluir a exclusão agora. Tente novamente em instantes.',
      );
    },
  });

  const handleDownloadData = () => {
    exportDataMutation.mutate();
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
            <Button
              variant="outline"
              onClick={handleDownloadData}
              disabled={exportDataMutation.isPending}
            >
              {exportDataMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              Baixar Meus Dados
            </Button>

            <ConfirmDialog
              open={deleteDialogOpen}
              onOpenChange={(open) => {
                setDeleteDialogOpen(open);
                if (!open) setDeleteConfirmationText('');
              }}
              title="Apagar sua conta?"
              description={
                <div className="space-y-3">
                  <p>
                    Essa ação é <strong>permanente</strong> e não pode ser
                    desfeita. Sua conta e seus dados de autenticação serão
                    removidos.
                  </p>
                  <div className="space-y-1.5">
                    <Label htmlFor="delete-account-confirmation">
                      Digite <strong>{DELETE_CONFIRMATION_WORD}</strong> para
                      confirmar
                    </Label>
                    <Input
                      id="delete-account-confirmation"
                      autoComplete="off"
                      value={deleteConfirmationText}
                      onChange={(e) => setDeleteConfirmationText(e.target.value)}
                      placeholder={DELETE_CONFIRMATION_WORD}
                    />
                  </div>
                </div>
              }
              trigger={
                <Button variant="destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Deletar Minha Conta
                </Button>
              }
              confirmLabel="Apagar conta"
              cancelLabel="Cancelar"
              confirmIcon={<Trash2 className="h-4 w-4 mr-2" />}
              confirmVariant="destructive"
              loading={deleteAccountMutation.isPending}
              disabled={deleteConfirmationText !== DELETE_CONFIRMATION_WORD}
              onConfirm={() => deleteAccountMutation.mutate()}
            />
          </div>
        </CardContent>
      </Card>

      {consent && (
        <p className="text-sm text-muted-foreground">
          Última atualização: {new Date(consent.timestamp).toLocaleDateString('pt-BR')}
        </p>
      )}

      <div className="flex items-center gap-4 text-sm">
        <Link to="/privacidade" className="flex items-center gap-1 text-primary hover:underline">
          <FileText className="h-4 w-4" />
          Política de Privacidade
        </Link>
      </div>
    </div>
  );
};
