import React, {useReducer, useRef} from 'react';
import {useNavigate} from 'react-router-dom';
import {api} from '@/server/api/api';
import useAppToast from '@/hooks/use-app-toast';
import {
  establishSession,
  readTempToken,
  SessionTokens,
} from '@/services/authentication/session';
import {recoveryCodesService, RecoveryCodesError} from '@/services/two-factor/recovery-codes';
import {ADMIN_HOSTNAME} from '@/components/AdminHostRedirect';
import {AuthLayout} from '@/components/auth/AuthLayout';
import {
  hasRecoveryCodeContent,
  prepareRecoveryCodeForSubmit,
} from '@/utils/recovery-codes';

type VerifyMode = 'totp' | 'recovery';

interface VerifyError {
  title: string;
  description: string;
  /** `true` quando a única saída é refazer o login (tempToken morto). */
  requiresRestart: boolean;
}

interface VerifyState {
  mode: VerifyMode;
  totpCode: string;
  recoveryCode: string;
  loading: boolean;
  error: VerifyError | null;
}

type VerifyAction =
  | {type: 'set-mode'; mode: VerifyMode}
  | {type: 'set-totp'; value: string}
  | {type: 'set-recovery'; value: string}
  | {type: 'submit'}
  | {type: 'fail'; error: VerifyError};

const initialState: VerifyState = {
  mode: 'totp',
  totpCode: '',
  recoveryCode: '',
  loading: false,
  error: null,
};

/**
 * O passo de segundo fator tem dois caminhos, campos distintos e erros que
 * mudam o que a tela permite fazer. Um reducer mantém essas transições em um
 * lugar só em vez de espalhar meia dúzia de `useState` correlacionados.
 */
function reducer(state: VerifyState, action: VerifyAction): VerifyState {
  switch (action.type) {
    case 'set-mode':
      // Trocar de caminho limpa o campo do outro: nada de carregar um código
      // digitado pela metade de um modo para o outro.
      return {
        ...state,
        mode: action.mode,
        totpCode: '',
        recoveryCode: '',
        error: null,
      };
    case 'set-totp':
      return {...state, totpCode: action.value, error: null};
    case 'set-recovery':
      return {...state, recoveryCode: action.value, error: null};
    case 'submit':
      return {...state, loading: true, error: null};
    case 'fail':
      return {
        ...state,
        loading: false,
        error: action.error,
        // Depois de um erro o campo é limpo para a pessoa digitar de novo sem
        // apagar manualmente — e para não deixar um código de recuperação
        // gasto visível na tela.
        totpCode: state.mode === 'totp' ? '' : state.totpCode,
        recoveryCode: state.mode === 'recovery' ? '' : state.recoveryCode,
      };
    default:
      return state;
  }
}

export default function TwoFactorVerify() {
  const navigate = useNavigate();
  const toast = useAppToast();
  const [state, dispatch] = useReducer(reducer, initialState);
  const totpInputRef = useRef<HTMLInputElement>(null);
  const recoveryInputRef = useRef<HTMLInputElement>(null);

  const tempToken = readTempToken();

  const isRecovery = state.mode === 'recovery';
  const canSubmit = isRecovery
    ? hasRecoveryCodeContent(state.recoveryCode)
    : state.totpCode.length === 6;
  const blocked = state.error?.requiresRestart === true;

  const finish = () => {
    toast.success('Autenticação concluída!', 'Bem-vindo ao Trackerr.');
    // O host admin serve só `/admin*`: mandar para /dashboard ali fazia o
    // AdminHostRedirect tratar a rota como inválida e devolver ao /signin,
    // logo depois de o segundo fator ter passado. Editor é corrigido para
    // /admin/grants pelo próprio AdminHostRedirect.
    const isAdminHost = window.location.hostname === ADMIN_HOSTNAME;
    navigate(isAdminHost ? '/admin' : '/dashboard', {replace: true});
  };

  const handleVerifyTotp = async () => {
    if (state.totpCode.length !== 6) return;

    dispatch({type: 'submit'});
    try {
      const response = await api.post('/auth/2fa/authenticate', {
        tempToken,
        code: state.totpCode,
      });
      establishSession(response.data as SessionTokens);
      finish();
    } catch {
      dispatch({
        type: 'fail',
        error: {
          title: 'Não foi possível validar o código',
          description:
            'Confira os 6 dígitos do app autenticador e tente novamente.',
          requiresRestart: false,
        },
      });
      totpInputRef.current?.focus();
    }
  };

  const handleVerifyRecovery = async () => {
    if (!hasRecoveryCodeContent(state.recoveryCode)) return;

    dispatch({type: 'submit'});
    try {
      // A sessão é criada dentro do service, pelo mesmo `establishSession`
      // usado no caminho TOTP acima.
      await recoveryCodesService.consume(
        tempToken,
        prepareRecoveryCodeForSubmit(state.recoveryCode),
      );
      finish();
    } catch (error) {
      const known = error instanceof RecoveryCodesError ? error : null;
      dispatch({
        type: 'fail',
        error: {
          title: known?.message ?? 'Não foi possível validar o código',
          description:
            known?.description ??
            'Tente novamente em instantes. Se persistir, fale com o suporte.',
          requiresRestart:
            known?.kind === 'rate-limited' || known?.kind === 'session-expired',
        },
      });
      recoveryInputRef.current?.focus();
    }
  };

  const handleSubmit = isRecovery ? handleVerifyRecovery : handleVerifyTotp;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSubmit();
  };

  const switchMode = (mode: VerifyMode) => dispatch({type: 'set-mode', mode});

  const disabled = state.loading || !canSubmit || blocked;

  // Caixas de dígito do handoff: espelham o que está no input, que continua
  // sendo o campo real (um input por dígito quebraria colar o código e o
  // preenchimento automático do `one-time-code`).
  const codeDigits = Array.from({length: 6}, (_, index) => ({
    value: state.totpCode[index] ?? '',
    filled: index < state.totpCode.length,
  }));

  return (
    <AuthLayout>
      <style>{'@keyframes spin{to{transform:rotate(360deg)}}'}</style>

      <div>
        <h2
          style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 24,
            fontWeight: 600,
            letterSpacing: '-0.025em',
            margin: 0,
          }}>
          Verificação em duas etapas
        </h2>
        <p style={{fontSize: 13, color: 'var(--color-neutral-500)', margin: '8.4px 0 0', lineHeight: 1.55}}>
          {isRecovery
            ? 'Digite um dos códigos de recuperação que você guardou. Cada um funciona uma única vez.'
            : 'Abra seu aplicativo autenticador e digite o código de 6 dígitos. Ele muda a cada 30 segundos.'}
        </p>
      </div>

      <div style={{marginTop: 22.4}}>
        {isRecovery ? (
          <label style={{display: 'flex', flexDirection: 'column', gap: 5.6}}>
            <span style={{fontSize: 11.5, color: 'var(--color-neutral-400)'}}>Código de recuperação</span>
            <input
              ref={recoveryInputRef}
              id="recovery-code"
              type="text"
              maxLength={32}
              placeholder="XXXX-XXXX"
              value={state.recoveryCode}
              onChange={(e) => dispatch({type: 'set-recovery', value: e.target.value})}
              onKeyDown={handleKeyDown}
              disabled={blocked}
              autoFocus
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
              style={{width: '100%', height: 42, textAlign: 'center', letterSpacing: '0.16em', border: '1px solid var(--hair)', borderRadius: 8, background: 'rgba(var(--rgb-bg),0.65)', color: 'var(--color-text)', fontFamily: 'var(--font-body)', fontSize: 15, boxSizing: 'border-box'}}
            />
          </label>
        ) : (
          <>
            <div aria-hidden style={{display: 'flex', gap: 8.4, justifyContent: 'space-between'}}>
              {codeDigits.map((digit, index) => (
                <div
                  key={index}
                  style={{
                    width: 46,
                    height: 52,
                    border: `1px solid ${digit.filled ? 'var(--color-accent-600)' : 'var(--hair)'}`,
                    borderRadius: 8,
                    background: 'rgba(var(--rgb-bg),0.65)',
                    display: 'grid',
                    placeItems: 'center',
                    fontFamily: 'var(--font-heading)',
                    fontSize: 21,
                    fontWeight: 600,
                  }}>
                  {digit.value}
                </div>
              ))}
            </div>
            <label htmlFor="code" className="sr-only">
              Código de 6 dígitos
            </label>
            <input
              ref={totpInputRef}
              id="code"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              placeholder="Digite o código de 6 dígitos"
              value={state.totpCode}
              onChange={(e) => dispatch({type: 'set-totp', value: e.target.value.replace(/\D/g, '').slice(0, 6)})}
              onKeyDown={handleKeyDown}
              disabled={blocked}
              autoFocus
              autoComplete="one-time-code"
              style={{marginTop: 11.2, width: '100%', height: 42, textAlign: 'center', letterSpacing: '0.3em', border: '1px solid var(--hair)', borderRadius: 8, background: 'rgba(var(--rgb-bg),0.65)', color: 'var(--color-text)', fontFamily: 'var(--font-body)', fontSize: 15, boxSizing: 'border-box'}}
            />
          </>
        )}

        {state.error && (
          <div
            role="alert"
            style={{display: 'flex', gap: 8, padding: '10px 12px', borderRadius: 8, background: 'var(--badge-neg-bg)', border: '1px solid var(--neg)', marginTop: 14}}>
            <i className="ph-fill ph-warning-circle" style={{fontSize: 15, color: 'var(--neg)', flexShrink: 0, marginTop: 1}} />
            <div style={{fontSize: 12.5, lineHeight: 1.45}}>
              <strong style={{color: 'var(--neg)'}}>{state.error.title}</strong>
              <div style={{color: 'var(--color-neutral-400)', marginTop: 2}}>{state.error.description}</div>
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={handleSubmit}
          disabled={disabled}
          className="hover:brightness-[1.08] disabled:cursor-not-allowed"
          style={{marginTop: 14, width: '100%', height: 44, borderRadius: 8, border: 'none', background: disabled ? 'var(--surf-3)' : 'var(--grad-violet)', color: disabled ? 'var(--color-neutral-500)' : 'var(--sunk)', fontFamily: 'var(--font-body)', fontSize: 13.5, fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer', boxShadow: disabled ? 'none' : '0 8px 28px rgba(152,160,171,0.26)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8.4}}>
          {state.loading ? (
            <>
              <i className="ph-fill ph-spinner" style={{fontSize: 15, animation: 'spin 0.8s linear infinite'}} />
              Verificando...
            </>
          ) : (
            <>
              {isRecovery ? 'Entrar com código de recuperação' : 'Verificar e entrar'}
              <i className="ph ph-arrow-right" style={{fontSize: 15}} />
            </>
          )}
        </button>

        {!blocked && (
          <div style={{display: 'flex', alignItems: 'center', justifyContent: 'flex-end', marginTop: 16.8, fontSize: 12}}>
            <button
              type="button"
              onClick={() => switchMode(isRecovery ? 'totp' : 'recovery')}
              style={{border: 'none', background: 'none', padding: 0, color: 'var(--color-neutral-500)', fontFamily: 'var(--font-body)', fontSize: 12, cursor: 'pointer'}}>
              {isRecovery ? 'Voltar para o código do autenticador' : 'Usar um código de recuperação'}
            </button>
          </div>
        )}

        <button
          type="button"
          onClick={() => navigate('/signin')}
          style={{display: 'flex', alignItems: 'center', gap: 5.6, border: 'none', background: 'none', padding: 0, marginTop: 22.4, color: 'var(--color-neutral-500)', fontFamily: 'var(--font-body)', fontSize: 12, cursor: 'pointer'}}>
          <i className="ph ph-arrow-left" style={{fontSize: 13}} />
          <span>Voltar para o login</span>
        </button>

        <p style={{fontSize: 11.5, color: 'var(--color-neutral-500)', marginTop: 22.4, lineHeight: 1.5}}>
          Não tem acesso ao autenticador nem aos códigos?{' '}
          <a href="mailto:suporte@trackerr.com.br" style={{color: 'var(--color-accent-300)'}}>
            Contate o suporte
          </a>
        </p>
      </div>
    </AuthLayout>
  );
}
