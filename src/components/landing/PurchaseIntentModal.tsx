import {useEffect, useRef, useState} from 'react';
import {Link} from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {Checkbox} from '@/components/ui/checkbox';
import {Button} from '@/components/ui/button';
import {useAppToast} from '@/hooks/use-app-toast';
import {leadsService} from '@/server/api/api';

type PurchaseIntentModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  planName: string;
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function PurchaseIntentModal({
  open,
  onOpenChange,
  planName,
}: PurchaseIntentModalProps) {
  const {error: showError} = useAppToast();
  const [email, setEmail] = useState('');
  const [consented, setConsented] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const isEmailValid = EMAIL_REGEX.test(email.trim());
  const canSubmit = isEmailValid && consented && !submitting;

  // Tracks the current "session" of the modal. It is bumped whenever the
  // modal is (re)opened, closed, or a new submit is attempted, so that a
  // late-resolving promise from an abandoned request can detect it is
  // stale and avoid writing into a newer session's state.
  const requestIdRef = useRef(0);

  useEffect(() => {
    if (open) {
      requestIdRef.current += 1;
      setEmail('');
      setConsented(false);
      setSubmitted(false);
      setSubmitting(false);
    }
  }, [open]);

  async function handleSubmit() {
    if (!canSubmit) return;
    const currentRequestId = ++requestIdRef.current;
    setSubmitting(true);
    try {
      await leadsService.capturePurchaseIntent(email.trim(), planName);
      if (requestIdRef.current !== currentRequestId) return;
      setSubmitted(true);
    } catch {
      if (requestIdRef.current !== currentRequestId) return;
      showError(
        'Não foi possível registrar seu interesse',
        'Verifique sua conexão e tente novamente.'
      );
    } finally {
      if (requestIdRef.current === currentRequestId) {
        setSubmitting(false);
      }
    }
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      requestIdRef.current += 1;
      setEmail('');
      setConsented(false);
      setSubmitted(false);
    }
    onOpenChange(nextOpen);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        {submitted ? (
          <div className="space-y-3 py-2">
            <DialogTitle>Interesse registrado!</DialogTitle>
            <DialogDescription>
              Estamos finalizando os acessos para o seu setor. Você vai
              receber o convite no e-mail informado em breve.
            </DialogDescription>
            <Button className="w-full" onClick={() => handleOpenChange(false)}>
              Fechar
            </Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Quero o plano {planName}</DialogTitle>
              <DialogDescription>
                Deixe seu e-mail para receber o convite assim que os acessos
                forem liberados.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="purchase-intent-email">E-mail</Label>
                <Input
                  id="purchase-intent-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="voce@empresa.com"
                />
              </div>
              <div className="flex items-start gap-2">
                <Checkbox
                  id="purchase-intent-consent"
                  checked={consented}
                  onCheckedChange={(checked) => setConsented(checked === true)}
                />
                <Label
                  htmlFor="purchase-intent-consent"
                  className="text-xs font-normal leading-relaxed text-on-surface-muted">
                  Concordo em receber comunicações do Trackerr no endereço
                  informado sobre a liberação do acesso e novidades do
                  produto, conforme a{' '}
                  <Link
                    to="/privacidade"
                    className="underline hover:text-on-surface">
                    Política de Privacidade
                  </Link>
                  .
                </Label>
              </div>
              <Button className="w-full" disabled={!canSubmit} onClick={handleSubmit}>
                {submitting ? 'Enviando...' : 'Confirmar interesse'}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default PurchaseIntentModal;
