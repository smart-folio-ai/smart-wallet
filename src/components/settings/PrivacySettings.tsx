import {useReducer, useState} from 'react';
import {Link, useNavigate} from 'react-router-dom';
import {useMutation} from '@tanstack/react-query';
import {Label} from '@/components/ui/label';
import {Input} from '@/components/ui/input';
import {Switch} from '@/components/ui/switch';
import {ConfirmDialog} from '@/components/ConfirmDialog';
import {useConsent} from '@/contexts/ConsentContext';
import {useAppToast} from '@/hooks/use-app-toast';
import {useAuth} from '@/hooks/useAuth';
import {privacyService} from '@/server/api/api';
import type {ConsentPreferences} from '@/types/consent';
import {
  CARD_STYLE,
  OUTLINE_BUTTON_CLASS,
  OUTLINE_BUTTON_STYLE,
  SettingsCardHeader,
} from './settings-ui';

const DELETE_CONFIRMATION_WORD = 'APAGAR';

type CookieCategory = 'functional' | 'analytics' | 'marketing';
type CookiePreferences = Pick<ConsentPreferences, CookieCategory>;

const COOKIE_ROWS: {id: CookieCategory | 'essential'; label: string; description: string}[] = [
  {id: 'essential', label: 'Essenciais', description: 'Sempre ativo (necessário para funcionar)'},
  {id: 'functional', label: 'Funcionais', description: 'Melhoram sua experiência'},
  {id: 'analytics', label: 'Analytics', description: 'Nos ajudam a melhorar o produto'},
  {id: 'marketing', label: 'Marketing', description: 'Publicidade personalizada'},
];

function cookieReducer(
  state: CookiePreferences,
  action: {category: CookieCategory; value: boolean},
): CookiePreferences {
  return {...state, [action.category]: action.value};
}

function CookieConsentForm({initial}: {initial: CookiePreferences}) {
  const {updateConsent} = useConsent();
  const toast = useAppToast();
  const [preferences, dispatch] = useReducer(cookieReducer, initial);

  const handleSave = () => {
    updateConsent(preferences);
    toast.success('Preferências salvas', 'Suas preferências de privacidade foram atualizadas.');
  };

  return (
    <div style={{display: 'flex', flexDirection: 'column', gap: 11.2}}>
      <div style={{fontSize: 11.5, color: 'var(--color-neutral-400)', fontWeight: 600}}>Gerenciar consentimento de cookies</div>
      {COOKIE_ROWS.map((row) => (
        <div key={row.id} style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 11.2}}>
          <div>
            <Label htmlFor={`cookie-${row.id}`} className="text-[12.5px] font-normal text-[color:var(--color-neutral-200)]">
              {row.label}
            </Label>
            <div style={{fontSize: 10.5, color: 'var(--color-neutral-600)', marginTop: 2}}>{row.description}</div>
          </div>
          {row.id === 'essential' ? (
            <Switch id="cookie-essential" checked disabled />
          ) : (
            <Switch
              id={`cookie-${row.id}`}
              checked={preferences[row.id as CookieCategory]}
              onCheckedChange={(value) => dispatch({category: row.id as CookieCategory, value})}
            />
          )}
        </div>
      ))}
      <button type="button" onClick={handleSave} className={OUTLINE_BUTTON_CLASS} style={OUTLINE_BUTTON_STYLE}>
        Salvar preferências
      </button>
    </div>
  );
}

function triggerJsonDownload(data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'});
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `meus-dados-trackerr-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/** Card "Dados e privacidade" (LGPD, TRA-122) no desenho do handoff. */
export const PrivacySettings = () => {
  const {consent} = useConsent();
  const toast = useAppToast();
  const navigate = useNavigate();
  const {logout} = useAuth();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');

  const exportDataMutation = useMutation({
    mutationFn: async () => (await privacyService.exportMyData()).data,
    onSuccess: (data) => {
      triggerJsonDownload(data);
      toast.success('Download iniciado', 'Seus dados foram exportados em um arquivo JSON.');
    },
    onError: () => {
      toast.error(
        'Erro ao exportar dados',
        'Não foi possível gerar sua exportação agora. Tente novamente em instantes.',
      );
    },
  });

  const deleteAccountMutation = useMutation({
    mutationFn: () => privacyService.deleteMyAccount(),
    onSuccess: () => {
      toast.success('Conta removida', 'Sua conta e seus dados de autenticação foram apagados.');
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

  const cookieInitial: CookiePreferences = {
    functional: consent?.functional ?? true,
    analytics: consent?.analytics ?? false,
    marketing: consent?.marketing ?? false,
  };

  return (
    <section style={CARD_STYLE}>
      <SettingsCardHeader title="Dados e privacidade" />
      <div style={{padding: 16.8, display: 'flex', flexDirection: 'column', gap: 11.2}}>
        <div style={{fontSize: 12, color: 'var(--color-neutral-400)', lineHeight: 1.55}}>
          Tratamento conforme a LGPD. Você pode exportar tudo ou apagar sua conta sem falar com o suporte.
        </div>
        <button
          type="button"
          onClick={() => exportDataMutation.mutate()}
          disabled={exportDataMutation.isPending}
          className={OUTLINE_BUTTON_CLASS}
          style={{...OUTLINE_BUTTON_STYLE, color: undefined}}>
          {exportDataMutation.isPending ? 'Gerando exportação…' : 'Exportar meus dados (JSON)'}
        </button>
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
                Essa ação é <strong>permanente</strong> e não pode ser desfeita. Sua conta e seus
                dados de autenticação serão removidos.
              </p>
              <div className="space-y-1.5">
                <Label htmlFor="delete-account-confirmation">
                  Digite <strong>{DELETE_CONFIRMATION_WORD}</strong> para confirmar
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
            <button
              type="button"
              className="bg-transparent hover:bg-[rgba(242,80,107,0.10)]"
              style={{
                height: 34,
                borderRadius: 8,
                border: '1px solid rgba(242,80,107,0.40)',
                color: 'var(--neg)',
                fontFamily: 'var(--font-body)',
                fontSize: 12.5,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 5.6,
              }}>
              <i className="ph ph-trash" aria-hidden="true" style={{fontSize: 14}} />
              Apagar conta e dados
            </button>
          }
          confirmLabel="Apagar conta"
          cancelLabel="Cancelar"
          confirmVariant="destructive"
          loading={deleteAccountMutation.isPending}
          disabled={deleteConfirmationText !== DELETE_CONFIRMATION_WORD}
          onConfirm={() => deleteAccountMutation.mutate()}
        />

        <div style={{borderTop: '1px solid var(--hair-soft)', margin: '5.6px 0 0', paddingTop: 14}}>
          <CookieConsentForm key={consent?.timestamp ?? 'default'} initial={cookieInitial} />
        </div>

        <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8.4, flexWrap: 'wrap', fontSize: 10.5, color: 'var(--color-neutral-600)'}}>
          <Link to="/privacidade" style={{color: 'var(--color-accent-200)', textDecoration: 'none'}}>
            Política de Privacidade
          </Link>
          {consent ? <span>Consentimento atualizado em {new Date(consent.timestamp).toLocaleDateString('pt-BR')}</span> : null}
        </div>
      </div>
    </section>
  );
};
