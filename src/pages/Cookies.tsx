import {useEffect, useState} from 'react';
import {Card, CardContent} from '@/components/ui/card';
import {Switch} from '@/components/ui/switch';
import {Label} from '@/components/ui/label';
import {Button} from '@/components/ui/button';
import {CheckCircle2} from '@/components/ui/icons';
import {useConsent} from '@/contexts/ConsentContext';
import {LegalDocLayout, LegalSection} from '@/components/legal/LegalDocLayout';

const sections: LegalSection[] = [
  {
    id: 'o-que-sao',
    title: '1. O que são cookies',
    paragraphs: [
      'Cookies são pequenos arquivos armazenados no seu navegador que permitem lembrar preferências, manter sua sessão autenticada e entender como a plataforma é usada.',
    ],
  },
  {
    id: 'categorias',
    title: '2. Categorias que usamos',
    paragraphs: [
      'Classificamos os cookies em quatro categorias, detalhadas abaixo. Você controla as opcionais a qualquer momento; os necessários mantêm a plataforma funcionando e não podem ser desativados.',
    ],
  },
];

/**
 * Painel de preferências da página standalone de cookies.
 *
 * Reaproveita a mesma lógica/estado de src/contexts/ConsentContext.tsx que
 * já alimenta o CookieConsentBanner e o PrivacySettings — não duplicamos a
 * lógica de consentimento, só a apresentação em versão expandida, como
 * pedido no handoff (Trackerr Legal.dc.html).
 */
function CookiePreferencesWidget() {
  const {consent, updateConsent, acceptAll, rejectAll} = useConsent();
  const [preferences, setPreferences] = useState({
    functional: true,
    analytics: false,
    marketing: false,
  });
  const [savedMessage, setSavedMessage] = useState(false);

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
    setSavedMessage(true);
  };

  const handleRejectOptional = () => {
    rejectAll();
    setPreferences({functional: false, analytics: false, marketing: false});
    setSavedMessage(true);
  };

  const handleAcceptAll = () => {
    acceptAll();
    setPreferences({functional: true, analytics: true, marketing: true});
    setSavedMessage(true);
  };

  return (
    <div className="mt-2">
      <Card className="overflow-hidden border-surface-hairline/[0.12] bg-surface-panel">
        <CardContent className="divide-y divide-surface-hairline/[0.08] p-0">
          <div className="flex items-start justify-between gap-4 p-4">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Label className="font-medium text-on-surface">Necessários</Label>
                <span className="rounded px-1.5 py-0.5 text-[9.5px] font-semibold uppercase tracking-wide text-on-surface-muted/60 ring-1 ring-inset ring-surface-hairline/[0.15]">
                  Sempre ativo
                </span>
              </div>
              <p className="mt-1 text-sm text-on-surface-muted/70">
                Autenticação, segurança de sessão e balanceamento de carga.
                Essenciais para o funcionamento da plataforma.
              </p>
            </div>
            <Switch checked disabled />
          </div>

          <div className="flex items-start justify-between gap-4 p-4">
            <div className="flex-1">
              <Label className="font-medium text-on-surface">Personalização</Label>
              <p className="mt-1 text-sm text-on-surface-muted/70">
                Lembram seu nível de profundidade, tema e preferências de
                exibição entre sessões.
              </p>
            </div>
            <Switch
              checked={preferences.functional}
              onCheckedChange={(checked) =>
                setPreferences((prev) => ({...prev, functional: checked}))
              }
            />
          </div>

          <div className="flex items-start justify-between gap-4 p-4">
            <div className="flex-1">
              <Label className="font-medium text-on-surface">Analíticos</Label>
              <p className="mt-1 text-sm text-on-surface-muted/70">
                Medem uso agregado de telas e recursos para priorizarmos
                melhorias no produto.
              </p>
            </div>
            <Switch
              checked={preferences.analytics}
              onCheckedChange={(checked) =>
                setPreferences((prev) => ({...prev, analytics: checked}))
              }
            />
          </div>

          <div className="flex items-start justify-between gap-4 p-4">
            <div className="flex-1">
              <Label className="font-medium text-on-surface">Marketing</Label>
              <p className="mt-1 text-sm text-on-surface-muted/70">
                Medem eficácia de campanhas de aquisição. Não vendemos esses
                dados a terceiros.
              </p>
            </div>
            <Switch
              checked={preferences.marketing}
              onCheckedChange={(checked) =>
                setPreferences((prev) => ({...prev, marketing: checked}))
              }
            />
          </div>

          <div className="flex flex-col-reverse items-stretch justify-end gap-2 bg-surface-hairline/[0.03] p-4 sm:flex-row sm:items-center">
            <Button variant="outline" onClick={handleRejectOptional}>
              Rejeitar opcionais
            </Button>
            <Button variant="outline" onClick={handleSave}>
              Salvar preferências
            </Button>
            <Button onClick={handleAcceptAll}>Aceitar todos</Button>
          </div>
        </CardContent>
      </Card>

      {savedMessage && (
        <div className="mt-3 flex items-center gap-1.5 text-sm text-positive">
          <CheckCircle2 className="h-4 w-4" weight="fill" />
          <span>Preferências de cookies salvas.</span>
        </div>
      )}
    </div>
  );
}

export default function Cookies() {
  return (
    <LegalDocLayout
      title="Política de cookies"
      updatedLabel="Última atualização em 2 de setembro de 2026 · rascunho"
      sections={sections}>
      <CookiePreferencesWidget />
    </LegalDocLayout>
  );
}
