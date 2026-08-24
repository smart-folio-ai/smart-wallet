import {useState, useEffect} from 'react';
import {Link} from 'react-router-dom';
import {Cookie, Shield, FileText} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle} from '@/components/ui/card';
import {Switch} from '@/components/ui/switch';
import {Label} from '@/components/ui/label';
import {useConsent} from '@/contexts/ConsentContext';

export const CookieConsentBanner = () => {
  const {consent, hasConsented, acceptAll, rejectAll, updateConsent} = useConsent();
  const [isVisible, setIsVisible] = useState(false);
  const [preferences, setPreferences] = useState({
    functional: true,
    analytics: false,
    marketing: false,
  });

  useEffect(() => {
    if (!hasConsented) {
      const timer = setTimeout(() => setIsVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, [hasConsented]);

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
    setIsVisible(false);
  };

  const handleAcceptAll = () => {
    acceptAll();
    setIsVisible(false);
  };

  const handleRejectAll = () => {
    rejectAll();
    setIsVisible(false);
  };

  if (!isVisible || hasConsented) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t">
      <Card className="max-w-4xl mx-auto">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Cookie className="h-5 w-5" />
            Utilizamos cookies para melhorar sua experiência
          </CardTitle>
          <CardDescription>
            Utilizamos cookies para garantir o funcionamento do site, melhorar sua experiência e
            analisar o tráfego. Você pode personalizar suas preferências abaixo.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center justify-between space-x-2">
              <div className="flex-1">
                <Label className="font-medium">Essenciais</Label>
                <p className="text-sm text-muted-foreground">Necessários para o funcionamento</p>
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
                <p className="text-sm text-muted-foreground">Nos ajudam a melhorar</p>
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
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <Link to="/privacidade" className="flex items-center gap-1 hover:underline">
              <Shield className="h-4 w-4" />
              Política de Privacidade
            </Link>
            <Link to="/termos" className="flex items-center gap-1 hover:underline">
              <FileText className="h-4 w-4" />
              Termos de Uso
            </Link>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row gap-2 justify-end">
          <Button variant="outline" onClick={handleRejectAll}>
            Rejeitar Todos
          </Button>
          <Button variant="outline" onClick={handleSave}>
            Salvar Preferências
          </Button>
          <Button onClick={handleAcceptAll}>Aceitar Todos</Button>
        </CardFooter>
      </Card>
    </div>
  );
};
