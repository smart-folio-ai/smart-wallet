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
    navigate('/dashboard', {replace: true});
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

  return (
    <div style={{minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--surf-1)', padding:'0 16px'}}>
      <style>{'@keyframes spin{to{transform:rotate(360deg)}}'}</style>
      <div style={{width:'100%', maxWidth:420, display:'flex', flexDirection:'column', gap:24}}>
        {/* Icon + heading */}
        <div style={{textAlign:'center', display:'flex', flexDirection:'column', gap:8, alignItems:'center'}}>
          <div style={{width:64, height:64, borderRadius:16, background:'rgba(145,132,217,0.15)', display:'flex', alignItems:'center', justifyContent:'center'}}>
            <i className={isRecovery ? 'ph-fill ph-key' : 'ph-fill ph-shield-check'} style={{fontSize:32, color:'var(--ac)'}} />
          </div>
          <h1 style={{fontSize:22, fontWeight:700, fontFamily:'var(--font-heading)'}}>Verificação em Dois Fatores</h1>
          <p style={{fontSize:13, color:'var(--color-neutral-500)'}}>
            {isRecovery
              ? 'Digite um dos códigos de recuperação que você guardou'
              : 'Abra seu aplicativo autenticador e insira o código de 6 dígitos'}
          </p>
        </div>

        {/* Card */}
        <div style={{border:'1px solid var(--hair)', borderRadius:14, background:'var(--nk-card)', overflow:'hidden', boxShadow:'var(--shadow-sm)'}}>
          <div style={{padding:'20px 24px 12px', textAlign:'center', borderBottom:'1px solid var(--hair-soft)'}}>
            <p style={{fontWeight:600, fontSize:14}}>
              {isRecovery ? 'Código de recuperação' : 'Código de verificação'}
            </p>
            <p style={{fontSize:12, color:'var(--color-neutral-500)', marginTop:4}}>
              {isRecovery
                ? 'Cada código funciona uma única vez'
                : 'Google Authenticator, Authy ou similar'}
            </p>
          </div>
          <div style={{padding:'16px 24px', display:'flex', flexDirection:'column', gap:12}}>
            {isRecovery ? (
              <div style={{display:'flex', flexDirection:'column', gap:6}}>
                <label htmlFor="recovery-code" style={{fontSize:12, fontWeight:500, color:'var(--color-neutral-500)'}}>Código de recuperação</label>
                <input
                  ref={recoveryInputRef}
                  id="recovery-code"
                  type="text"
                  maxLength={32}
                  placeholder="XXXX-XXXX"
                  value={state.recoveryCode}
                  onChange={(e) => dispatch({type:'set-recovery', value: e.target.value})}
                  onKeyDown={handleKeyDown}
                  disabled={blocked}
                  autoFocus
                  autoComplete="off"
                  autoCapitalize="none"
                  spellCheck={false}
                  style={{width:'100%', height:54, textAlign:'center', fontSize:20, letterSpacing:'0.16em', fontFamily:'monospace', border:'1px solid var(--hair)', borderRadius:8, background:'var(--surf-3)', color:'inherit', outline:'none', boxSizing:'border-box' as const}}
                />
              </div>
            ) : (
              <div style={{display:'flex', flexDirection:'column', gap:6}}>
                <label htmlFor="code" style={{fontSize:12, fontWeight:500, color:'var(--color-neutral-500)'}}>Código de 6 dígitos</label>
                <input
                  ref={totpInputRef}
                  id="code"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  placeholder="000000"
                  value={state.totpCode}
                  onChange={(e) => dispatch({type:'set-totp', value: e.target.value.replace(/\D/g, '').slice(0, 6)})}
                  onKeyDown={handleKeyDown}
                  disabled={blocked}
                  autoFocus
                  autoComplete="one-time-code"
                  style={{width:'100%', height:54, textAlign:'center', fontSize:24, letterSpacing:'0.3em', fontFamily:'monospace', border:'1px solid var(--hair)', borderRadius:8, background:'var(--surf-3)', color:'inherit', outline:'none', boxSizing:'border-box' as const}}
                />
              </div>
            )}

            {state.error && (
              <div role="alert" style={{display:'flex', gap:8, padding:'10px 12px', borderRadius:8, background:'var(--badge-neg-bg)', border:'1px solid var(--neg)'}}>
                <i className="ph-fill ph-warning-circle" style={{fontSize:15, color:'var(--neg)', flexShrink:0, marginTop:1}} />
                <div style={{fontSize:12.5, lineHeight:1.45}}>
                  <strong style={{color:'var(--neg)'}}>{state.error.title}</strong>
                  <div style={{color:'var(--color-neutral-400)', marginTop:2}}>{state.error.description}</div>
                </div>
              </div>
            )}
          </div>
          <div style={{padding:'0 24px 20px', display:'flex', flexDirection:'column', gap:8}}>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={disabled}
              style={{width:'100%', height:44, borderRadius:8, border:'none', background: disabled ? 'var(--surf-3)' : 'var(--grad-violet)', color: disabled ? 'var(--color-neutral-500)' : '#fff', fontSize:14, fontWeight:600, cursor: disabled ? 'not-allowed' : 'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:6}}
            >
              {state.loading ? (
                <><i className="ph-fill ph-spinner" style={{fontSize:15, animation:'spin 0.8s linear infinite'}} />Verificando...</>
              ) : isRecovery ? 'Entrar com código de recuperação' : 'Verificar Código'}
            </button>

            {!blocked && (
              <button
                type="button"
                onClick={() => switchMode(isRecovery ? 'totp' : 'recovery')}
                style={{background:'none', border:'none', cursor:'pointer', fontSize:13, color:'var(--ac)', display:'flex', alignItems:'center', justifyContent:'center', gap:4, padding:'4px 0'}}
              >
                <i className={isRecovery ? 'ph-fill ph-device-mobile' : 'ph-fill ph-key'} style={{fontSize:14}} />
                {isRecovery
                  ? 'Voltar para o código do autenticador'
                  : 'Usar um código de recuperação'}
              </button>
            )}

            <button
              type="button"
              onClick={() => navigate('/login')}
              style={{background:'none', border:'none', cursor:'pointer', fontSize:13, color:'var(--color-neutral-500)', display:'flex', alignItems:'center', justifyContent:'center', gap:4, padding:'4px 0'}}
            >
              <i className="ph-fill ph-arrow-left" style={{fontSize:14}} />Voltar para o login
            </button>
          </div>
        </div>

        <p style={{textAlign:'center', fontSize:11.5, color:'var(--color-neutral-500)'}}>
          Não tem acesso ao seu aplicativo nem aos códigos?{' '}
          <a href="mailto:suporte@trackerr.com.br" style={{color:'var(--ac)'}}>Contate o suporte</a>
        </p>
      </div>
    </div>
  );
}
