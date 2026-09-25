import type {PixCharge, PixCheckoutErrorKind} from '@/services/pix';

/**
 * Máquina de estados do modal de PIX (TRA-195), separada do componente para
 * ser testada sem DOM. Um `useReducer` em vez de vários `useState` (CLAUDE.md
 * §6.2): as transições são poucas, mas misturá-las em flags soltas é como se
 * chega em "QR na tela e erro ao mesmo tempo".
 */
export type PixStep =
  | {kind: 'creating'}
  | {kind: 'cpf'; error?: string}
  | {kind: 'awaiting'; charge: PixCharge}
  | {kind: 'paid'; charge: PixCharge}
  | {kind: 'expired'}
  | {kind: 'error'; errorKind: Exclude<PixCheckoutErrorKind, 'cpf_required'>; message: string};

export type PixAction =
  | {type: 'restart'}
  | {type: 'charge_created'; charge: PixCharge}
  | {type: 'checkout_failed'; errorKind: PixCheckoutErrorKind; message: string}
  | {type: 'charge_updated'; charge: PixCharge}
  | {type: 'expired'};

export function pixReducer(state: PixStep, action: PixAction): PixStep {
  switch (action.type) {
    case 'restart':
      return {kind: 'creating'};
    case 'charge_created':
      return action.charge.status === 'paid'
        ? {kind: 'paid', charge: action.charge}
        : {kind: 'awaiting', charge: action.charge};
    case 'checkout_failed':
      if (action.errorKind === 'cpf_required') {
        // Já estava pedindo CPF: o server recusou o que foi digitado.
        return {kind: 'cpf', error: state.kind === 'cpf' ? action.message : undefined};
      }
      return {kind: 'error', errorKind: action.errorKind, message: action.message};
    case 'charge_updated':
      if (state.kind !== 'awaiting') return state;
      if (action.charge.status === 'paid') return {kind: 'paid', charge: action.charge};
      if (action.charge.status === 'expired') return {kind: 'expired'};
      if (action.charge.status === 'pending') return {kind: 'awaiting', charge: action.charge};
      return {
        kind: 'error',
        errorKind: 'generic',
        message: 'O pagamento não pôde ser confirmado automaticamente. Nossa equipe vai verificar e entrar em contato.',
      };
    case 'expired':
      return state.kind === 'awaiting' ? {kind: 'expired'} : state;
    default:
      return state;
  }
}

/** Máscara progressiva: 52998224725 → 529.982.247-25. */
export function maskCpf(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 11);
  return digits
    .replace(/^(\d{3})(\d)/, '$1.$2')
    .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d{1,2})$/, '.$1-$2');
}

/** "14:59" — minutos e segundos até expirar; "0:00" quando já passou. */
export function formatCountdown(expiresAt: string | undefined, now: number): string {
  if (!expiresAt) return '—';
  const remaining = Math.max(0, new Date(expiresAt).getTime() - now);
  const totalSeconds = Math.floor(remaining / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = String(totalSeconds % 60).padStart(2, '0');
  return hours > 0 ? `${hours}h${String(minutes).padStart(2, '0')}` : `${minutes}:${seconds}`;
}
