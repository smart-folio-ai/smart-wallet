import React, {useMemo, useReducer} from 'react';
import useAppToast from '@/hooks/use-app-toast';
import RecoveryCodesSection from '@/components/security/RecoveryCodesSection';
import {badgeStyle, type BadgeSeverity as Severity} from '@/components/shared/badge-style';
import {
  describePasswordError,
  useChangePassword,
  useDisableTwoFactor,
  useTwoFactorSetup,
  useTwoFactorStatus,
  useVerifyTwoFactor,
} from '@/hooks/useSecurity';
import {
  evaluatePasswordRules,
  evaluatePasswordStrength,
  isPasswordAcceptable,
  PasswordStrength,
} from '@/services/security/password-policy';

type PasswordField = 'current' | 'next' | 'confirm';

interface SecurityState {
  values: Record<PasswordField, string>;
  visible: Record<PasswordField, boolean>;
  totpCode: string;
  disableCode: string;
}

type SecurityAction =
  | {type: 'set-password'; field: PasswordField; value: string}
  | {type: 'toggle-visibility'; field: PasswordField}
  | {type: 'password-saved'}
  | {type: 'set-totp'; value: string}
  | {type: 'set-disable-code'; value: string};

const emptyPasswords: Record<PasswordField, string> = {current: '', next: '', confirm: ''};
const hiddenPasswords: Record<PasswordField, boolean> = {current: false, next: false, confirm: false};

const initialState: SecurityState = {
  values: emptyPasswords,
  visible: hiddenPasswords,
  totpCode: '',
  disableCode: '',
};

function reducer(state: SecurityState, action: SecurityAction): SecurityState {
  switch (action.type) {
    case 'set-password':
      return {...state, values: {...state.values, [action.field]: action.value}};
    case 'toggle-visibility':
      return {...state, visible: {...state.visible, [action.field]: !state.visible[action.field]}};
    case 'password-saved':
      return {...state, values: emptyPasswords, visible: hiddenPasswords};
    case 'set-totp':
      return {...state, totpCode: action.value};
    case 'set-disable-code':
      return {...state, disableCode: action.value};
    default:
      return state;
  }
}

const PASSWORD_FIELDS: {field: PasswordField; label: string; placeholder: string; autoComplete: string}[] = [
  {field: 'current', label: 'Senha atual', placeholder: 'sua senha de hoje', autoComplete: 'current-password'},
  {field: 'next', label: 'Nova senha', placeholder: 'mínimo 10 caracteres', autoComplete: 'new-password'},
  {field: 'confirm', label: 'Confirmar nova senha', placeholder: 'repita a nova senha', autoComplete: 'new-password'},
];

const onlyDigits = (value: string) => value.replace(/\D/g, '').slice(0, 6);

/** Agrupa o segredo base32 de 4 em 4, como a chave do handoff. */
const formatSecret = (secret: string) => secret.match(/.{1,4}/g)?.join(' ') ?? secret;

const strengthBarBackground = (strength: PasswordStrength, n: number) => {
  if (n > strength.score) return 'rgba(var(--rgb-line),0.10)';
  if (strength.level === 'weak') return 'var(--neg)';
  if (strength.level === 'fair') return 'var(--warn)';
  return 'linear-gradient(90deg, var(--pos), var(--cy))';
};

const strengthLabelColor = (strength: PasswordStrength) => {
  if (strength.level === 'empty') return 'var(--color-neutral-600)';
  if (strength.level === 'weak') return 'var(--neg)';
  if (strength.level === 'fair') return 'var(--warn)';
  return 'var(--pos)';
};

const codeInputStyle: React.CSSProperties = {
  width: 108,
  height: 38,
  padding: '0 11.2px',
  border: '1px solid var(--hair)',
  borderRadius: 8,
  background: 'rgba(var(--rgb-bg),0.65)',
  color: 'var(--color-text)',
  fontFamily: 'var(--font-body)',
  fontSize: 16,
  letterSpacing: '0.22em',
  textAlign: 'center',
  fontVariantNumeric: 'tabular-nums',
  outline: 'none',
};

const qrFrameStyle: React.CSSProperties = {
  width: 132,
  height: 132,
  borderRadius: 8,
  background: 'var(--color-text)',
  display: 'grid',
  placeItems: 'center',
  padding: 8,
  boxSizing: 'border-box',
};

const RECOVERY_NOTE =
  'Guarde os códigos de recuperação em local seguro. Sem eles e sem o app, o acesso só volta por verificação de identidade com o suporte.';

export default function Security() {
  const toast = useAppToast();
  const [state, dispatch] = useReducer(reducer, initialState);

  const twoFactor = useTwoFactorStatus();
  const statusKnown = !twoFactor.isLoading && !twoFactor.isError;
  const setup = useTwoFactorSetup(statusKnown && !twoFactor.enabled);
  const verify = useVerifyTwoFactor();
  const disable = useDisableTwoFactor();
  const changePassword = useChangePassword();

  const {current: currentPassword, next: nextPassword} = state.values;
  const rules = useMemo(
    () => evaluatePasswordRules(nextPassword, currentPassword),
    [nextPassword, currentPassword],
  );
  const strength = useMemo(() => evaluatePasswordStrength(state.values.next), [state.values.next]);

  const handleSavePassword = () => {
    if (changePassword.isPending) return;
    const {current, next, confirm} = state.values;
    if (!current) {
      toast.error('Informe sua senha atual', 'Ela confirma que é você quem está trocando a senha.');
      return;
    }
    if (!isPasswordAcceptable(rules)) {
      toast.error('Nova senha fraca', 'Cumpra todos os requisitos listados abaixo do medidor.');
      return;
    }
    if (next !== confirm) {
      toast.error('As senhas não coincidem', 'A confirmação precisa ser igual à nova senha.');
      return;
    }
    changePassword.mutate(
      {oldPassword: current, newPassword: next},
      {
        onSuccess: () => {
          dispatch({type: 'password-saved'});
          toast.success('Senha alterada', 'Você foi desconectado dos outros dispositivos.');
        },
        onError: (error) => {
          const friendly = describePasswordError(error);
          toast.error(friendly.title, friendly.description);
        },
      },
    );
  };

  const handleVerify = () => {
    if (verify.isPending) return;
    if (state.totpCode.length !== 6) {
      toast.error('Código incompleto', 'Digite os 6 dígitos que aparecem no app autenticador.');
      return;
    }
    verify.mutate(state.totpCode, {
      onSuccess: () => {
        dispatch({type: 'set-totp', value: ''});
        toast.success('2FA ativada', 'Agora gere seus códigos de recuperação e guarde em local seguro.');
      },
      onError: () => {
        dispatch({type: 'set-totp', value: ''});
        toast.error('Código inválido', 'O código expirou ou não confere. Tente o próximo.');
      },
    });
  };

  const handleDisable = () => {
    if (disable.isPending) return;
    if (state.disableCode.length !== 6) {
      toast.error('Código incompleto', 'Digite os 6 dígitos do app autenticador para desativar.');
      return;
    }
    disable.mutate(state.disableCode, {
      onSuccess: () => {
        dispatch({type: 'set-disable-code', value: ''});
        toast.success('2FA desativada', 'Seu login volta a pedir só a senha.');
      },
      onError: () => {
        dispatch({type: 'set-disable-code', value: ''});
        toast.error('Não foi possível desativar', 'Código inválido ou expirado.');
      },
    });
  };

  const badge: {label: string; sev: Severity} = twoFactor.isLoading
    ? {label: 'Carregando…', sev: 'info'}
    : twoFactor.isError
      ? {label: 'Indisponível', sev: 'neg'}
      : twoFactor.enabled
        ? {label: 'Ativa', sev: 'ok'}
        : {label: 'Pendente', sev: 'warn'};

  const twoFaSteps = [
    {n: 1, title: 'Instale um app autenticador', body: 'Google Authenticator, 1Password, Authy ou o gerenciador que você já usa.'},
    {
      n: 2,
      title: 'Escaneie este QR code',
      body: setup.data
        ? `Ou digite a chave manualmente: ${formatSecret(setup.data.secret)}.`
        : 'Ou digite a chave manualmente assim que ela for gerada.',
    },
    {n: 3, title: 'Digite o código de 6 dígitos', body: 'Ele muda a cada 30 segundos. Depois de ativar, gere seus códigos de recuperação.'},
  ];

  const renderQrFrame = () => {
    if (twoFactor.enabled) {
      return (
        <div style={{...qrFrameStyle, background: 'rgba(47,214,163,0.10)', border: '1px solid rgba(47,214,163,0.34)'}}>
          <i className="ph-fill ph-shield-check" style={{fontSize: 44, color: 'var(--pos)'}} aria-hidden />
        </div>
      );
    }
    if (setup.data) {
      return (
        <div style={qrFrameStyle}>
          <img
            src={setup.data.qrCodeDataUrl}
            alt="QR code para configurar o app autenticador"
            style={{width: '100%', height: '100%', display: 'block', borderRadius: 1}}
          />
        </div>
      );
    }
    const failed = twoFactor.isError || setup.isError;
    return (
      <div style={qrFrameStyle} role={failed ? 'alert' : 'status'}>
        {failed ? (
          <button
            type="button"
            onClick={() => (twoFactor.isError ? twoFactor.refetch() : setup.refetch())}
            style={{border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5.6, color: 'var(--bg-solid)', fontFamily: 'var(--font-body)', fontSize: 11}}>
            <i className="ph ph-warning" style={{fontSize: 22, color: 'var(--neg)'}} aria-hidden />
            Tentar de novo
          </button>
        ) : (
          <i className="ph ph-circle-notch animate-spin" style={{fontSize: 24, color: 'var(--bg-solid)'}} aria-label="Gerando QR code" />
        )}
      </div>
    );
  };

  return (
    <div style={{display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 16.8, alignItems: 'start'}}>
      <section style={{border: '1px solid var(--hair)', borderRadius: 8, background: 'var(--nk-card)'}}>
        <div style={{padding: '14px 16.8px', borderBottom: '1px solid var(--hair-soft)'}}>
          <h2 style={{fontFamily: 'var(--font-heading)', fontSize: 14, fontWeight: 600, margin: 0}}>Trocar senha</h2>
          <div style={{fontSize: 11, color: 'var(--color-neutral-600)', marginTop: 2}}>Você será desconectado dos outros dispositivos</div>
        </div>
        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            handleSavePassword();
          }}
          style={{padding: 16.8, display: 'flex', flexDirection: 'column', gap: 14}}>
          {PASSWORD_FIELDS.map((f) => (
            <label key={f.field} style={{display: 'flex', flexDirection: 'column', gap: 5.6}}>
              <span style={{fontSize: 11.5, color: 'var(--color-neutral-400)'}}>{f.label}</span>
              <div style={{display: 'flex', alignItems: 'center', gap: 8.4, height: 38, padding: '0 11.2px', border: '1px solid var(--hair)', borderRadius: 8, background: 'rgba(var(--rgb-bg),0.6)'}}>
                <i className="ph ph-lock-simple" style={{fontSize: 15, color: 'var(--color-neutral-600)'}} aria-hidden />
                <input
                  type={state.visible[f.field] ? 'text' : 'password'}
                  placeholder={f.placeholder}
                  autoComplete={f.autoComplete}
                  value={state.values[f.field]}
                  onChange={(e) => dispatch({type: 'set-password', field: f.field, value: e.target.value})}
                  style={{flex: 1, minWidth: 0, border: 'none', background: 'transparent', color: 'var(--color-text)', fontFamily: 'var(--font-body)', fontSize: 13, outline: 'none'}}
                />
                <button
                  type="button"
                  onClick={() => dispatch({type: 'toggle-visibility', field: f.field})}
                  aria-label={state.visible[f.field] ? `Ocultar ${f.label.toLowerCase()}` : `Mostrar ${f.label.toLowerCase()}`}
                  aria-pressed={state.visible[f.field]}
                  style={{border: 'none', background: 'transparent', padding: 0, display: 'grid', placeItems: 'center', cursor: 'pointer'}}>
                  <i className={state.visible[f.field] ? 'ph ph-eye-slash' : 'ph ph-eye'} style={{fontSize: 15, color: 'var(--color-neutral-600)'}} aria-hidden />
                </button>
              </div>
            </label>
          ))}
          <div>
            <div style={{display: 'flex', gap: 4}} data-testid="password-strength-meter" data-score={strength.score}>
              {[1, 2, 3, 4].map((n) => (
                <div key={n} style={{flex: 1, height: 5, borderRadius: 2, background: strengthBarBackground(strength, n)}} />
              ))}
            </div>
            <div aria-live="polite" style={{fontSize: 11, color: strengthLabelColor(strength), marginTop: 5.6}}>{strength.label}</div>
          </div>
          <div style={{display: 'flex', flexDirection: 'column', gap: 5.6}}>
            {rules.map((r) => (
              <div key={r.id} data-ok={r.ok} style={{display: 'flex', alignItems: 'center', gap: 8.4, fontSize: 11.5, color: 'var(--color-neutral-400)'}}>
                <i className={r.ok ? 'ph-fill ph-check-circle' : 'ph ph-circle'} style={{fontSize: 13, color: r.ok ? 'var(--pos)' : 'var(--color-neutral-600)'}} aria-hidden />
                {r.label}
              </div>
            ))}
          </div>
          <button
            type="submit"
            aria-busy={changePassword.isPending}
            className="hover:brightness-[1.08]"
            style={{height: 38, borderRadius: 8, border: 'none', background: 'var(--grad-violet)', color: 'var(--sunk)', fontFamily: 'var(--font-body)', fontSize: 12.5, fontWeight: 600, cursor: changePassword.isPending ? 'progress' : 'pointer'}}>
            {changePassword.isPending ? 'Salvando…' : 'Salvar nova senha'}
          </button>
        </form>
      </section>

      <section style={{position: 'relative', border: '1px solid rgba(47,214,163,0.28)', borderRadius: 8, overflow: 'hidden', background: 'linear-gradient(122deg, rgba(47,214,163,0.16) 0%, rgba(76,201,240,0.10) 52%, rgba(var(--rgb-surf-2),0.92) 100%), var(--surf-2)'}}>
        <div style={{padding: '14px 16.8px', borderBottom: '1px solid var(--hair-soft)', display: 'flex', alignItems: 'center', gap: 8.4}}>
          <i className="ph-fill ph-fingerprint" style={{fontSize: 17, color: 'var(--pos)'}} aria-hidden />
          <div style={{flex: 1}}>
            <h2 style={{fontFamily: 'var(--font-heading)', fontSize: 14, fontWeight: 600, margin: 0}}>Autenticação em dois fatores</h2>
            <div style={{fontSize: 11, color: 'var(--color-neutral-500)', marginTop: 2}}>Exigida para exportações e troca de dados bancários</div>
          </div>
          <span style={badgeStyle(badge.sev)} data-testid="two-factor-badge">{badge.label}</span>
        </div>
        <div style={{padding: 16.8, display: 'grid', gridTemplateColumns: '132px minmax(0, 1fr)', gap: 16.8, alignItems: 'start'}}>
          {renderQrFrame()}
          <div style={{display: 'flex', flexDirection: 'column', gap: 11.2}}>
            {twoFactor.enabled ? (
              <>
                <div>
                  <div style={{fontSize: 12.5, color: 'var(--color-neutral-100)', fontWeight: 500}}>Dois fatores ativos</div>
                  <div style={{fontSize: 11.5, color: 'var(--color-neutral-400)', marginTop: 2, lineHeight: 1.45}}>
                    Seu login pede o código do app autenticador. Para desativar, confirme com o código atual.
                  </div>
                </div>
                <div style={{display: 'flex', gap: 8.4, alignItems: 'center', marginTop: 5.6}}>
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    aria-label="Código para desativar o 2FA"
                    placeholder="000000"
                    maxLength={6}
                    value={state.disableCode}
                    onChange={(e) => dispatch({type: 'set-disable-code', value: onlyDigits(e.target.value)})}
                    style={codeInputStyle}
                  />
                  <button
                    type="button"
                    onClick={handleDisable}
                    aria-busy={disable.isPending}
                    className="hover:brightness-[1.08]"
                    style={{height: 38, padding: '0 16.8px', borderRadius: 8, border: '1px solid rgba(242,80,107,0.35)', background: 'rgba(242,80,107,0.10)', color: 'var(--neg)', fontFamily: 'var(--font-body)', fontSize: 12.5, fontWeight: 600, cursor: disable.isPending ? 'progress' : 'pointer'}}>
                    {disable.isPending ? 'Desativando…' : 'Desativar 2FA'}
                  </button>
                </div>
              </>
            ) : (
              <>
                {twoFaSteps.map((s) => (
                  <div key={s.n} style={{display: 'flex', gap: 8.4}}>
                    <span style={{width: 17, height: 17, flexShrink: 0, borderRadius: 4, background: 'rgba(47,214,163,0.16)', border: '1px solid rgba(47,214,163,0.34)', color: 'var(--pos)', fontSize: 9.5, fontWeight: 700, display: 'grid', placeItems: 'center'}}>{s.n}</span>
                    <div>
                      <div style={{fontSize: 12.5, color: 'var(--color-neutral-100)', fontWeight: 500}}>{s.title}</div>
                      <div style={{fontSize: 11.5, color: 'var(--color-neutral-400)', marginTop: 2, lineHeight: 1.45, overflowWrap: 'anywhere'}}>{s.body}</div>
                    </div>
                  </div>
                ))}
                <div style={{display: 'flex', gap: 8.4, alignItems: 'center', marginTop: 5.6}}>
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    aria-label="Código de 6 dígitos do app autenticador"
                    placeholder="000000"
                    maxLength={6}
                    value={state.totpCode}
                    onChange={(e) => dispatch({type: 'set-totp', value: onlyDigits(e.target.value)})}
                    style={codeInputStyle}
                  />
                  <button
                    type="button"
                    onClick={handleVerify}
                    disabled={!setup.data}
                    aria-busy={verify.isPending}
                    className="hover:brightness-[1.08]"
                    style={{height: 38, padding: '0 16.8px', borderRadius: 8, border: 'none', background: 'linear-gradient(120deg, var(--pos), var(--cy))', color: '#10221c', fontFamily: 'var(--font-body)', fontSize: 12.5, fontWeight: 600, cursor: !setup.data ? 'not-allowed' : verify.isPending ? 'progress' : 'pointer', opacity: setup.data ? 1 : 0.6}}>
                    {verify.isPending ? 'Verificando…' : 'Ativar 2FA'}
                  </button>
                </div>
              </>
            )}
            {twoFactor.enabled && <RecoveryCodesSection twoFactorEnabled />}
            <div style={{fontSize: 10.5, color: 'var(--color-neutral-500)', lineHeight: 1.45, paddingTop: 8.4, borderTop: '1px solid var(--hair-soft)'}}>{RECOVERY_NOTE}</div>
          </div>
        </div>
      </section>
    </div>
  );
}
