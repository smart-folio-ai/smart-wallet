import React, {useReducer} from 'react';
import {
  isRunningLowOnRecoveryCodes,
  LOW_RECOVERY_CODES_THRESHOLD,
  useGenerateRecoveryCodes,
  useRecoveryCodesStatus,
} from '@/hooks/useRecoveryCodes';
import {GeneratedRecoveryCodes} from '@/interface/two-factor';
import {RecoveryCodesError} from '@/services/two-factor/recovery-codes';
import RecoveryCodesDialog from '@/components/security/RecoveryCodesDialog';

export interface RecoveryCodesSectionProps {
  /** Só faz sentido com o 2FA ativo — sem ele não há o que recuperar. */
  twoFactorEnabled: boolean;
}

interface SectionState {
  /** Formulário de TOTP aberto (o gate da geração). */
  formOpen: boolean;
  totpCode: string;
  error: {title: string; description: string} | null;
  /** Códigos em texto puro. Vivem só aqui, enquanto o diálogo está aberto. */
  issued: GeneratedRecoveryCodes | null;
  /** `true` quando a lista exibida substituiu uma anterior. */
  replacedPrevious: boolean;
}

type SectionAction =
  | {type: 'open-form'}
  | {type: 'close-form'}
  | {type: 'set-code'; value: string}
  | {type: 'fail'; title: string; description: string}
  | {type: 'issued'; codes: GeneratedRecoveryCodes; replacedPrevious: boolean}
  | {type: 'acknowledge'};

const initialState: SectionState = {
  formOpen: false,
  totpCode: '',
  error: null,
  issued: null,
  replacedPrevious: false,
};

function reducer(state: SectionState, action: SectionAction): SectionState {
  switch (action.type) {
    case 'open-form':
      return {...state, formOpen: true, totpCode: '', error: null};
    case 'close-form':
      return {...state, formOpen: false, totpCode: '', error: null};
    case 'set-code':
      return {...state, totpCode: action.value, error: null};
    case 'fail':
      return {
        ...state,
        totpCode: '',
        error: {title: action.title, description: action.description},
      };
    case 'issued':
      return {
        formOpen: false,
        totpCode: '',
        error: null,
        issued: action.codes,
        replacedPrevious: action.replacedPrevious,
      };
    case 'acknowledge':
      // Descartar os códigos da memória é parte do contrato da tela de
      // exibição única: depois do aceite nada mais os tem.
      return {...initialState};
    default:
      return state;
  }
}

const cardStyle: React.CSSProperties = {
  padding: 16,
  background: 'var(--surf-3)',
  borderRadius: 10,
  border: '1px solid var(--hair)',
};

/**
 * Status e regeneração dos códigos de recuperação, para a aba de Segurança.
 *
 * Nunca exibe código nenhum: a única superfície onde texto puro aparece é o
 * `RecoveryCodesDialog`, alimentado pelo retorno da geração.
 */
export function RecoveryCodesSection({
  twoFactorEnabled,
}: RecoveryCodesSectionProps) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const {data: status, isLoading} = useRecoveryCodesStatus(twoFactorEnabled);
  const generate = useGenerateRecoveryCodes();

  if (!twoFactorEnabled) return null;

  const neverGenerated = !!status && status.generatedAt === null;
  const runningLow = isRunningLowOnRecoveryCodes(status);
  const exhausted = !!status && status.generatedAt !== null && status.remaining === 0;

  const handleGenerate = async () => {
    if (state.totpCode.length !== 6) return;
    try {
      const codes = await generate.mutateAsync(state.totpCode);
      dispatch({
        type: 'issued',
        codes,
        replacedPrevious: !neverGenerated,
      });
    } catch (error) {
      const known = error instanceof RecoveryCodesError ? error : null;
      dispatch({
        type: 'fail',
        title: known?.message ?? 'Não foi possível gerar os códigos',
        description:
          known?.description ??
          'Tente novamente em instantes. Se persistir, fale com o suporte.',
      });
    }
  };

  return (
    <div style={{marginTop: 16}}>
      <div style={{display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 10}}>
        <i className="ph-fill ph-key" style={{fontSize: 16, color: 'var(--ac)', marginTop: 2}} />
        <div>
          <div style={{fontSize: 14, fontWeight: 600, marginBottom: 4}}>
            Códigos de recuperação
          </div>
          <p style={{fontSize: 13, color: 'var(--color-neutral-400)', margin: 0}}>
            Entram no lugar do aplicativo autenticador se você perder o acesso a
            ele. Cada código funciona uma única vez.
          </p>
        </div>
      </div>

      {isLoading && (
        <div style={{...cardStyle, fontSize: 13, color: 'var(--color-neutral-400)'}}>
          Carregando status dos códigos...
        </div>
      )}

      {status && (
        <div
          style={{
            ...cardStyle,
            ...(neverGenerated || runningLow
              ? {
                  background: 'var(--badge-neg-bg)',
                  border: '1px solid var(--neg)',
                }
              : {}),
          }}>
          {neverGenerated ? (
            <div role="status" style={{fontSize: 13, lineHeight: 1.5}}>
              <strong style={{color: 'var(--neg)'}}>
                Você ainda não tem códigos de recuperação.
              </strong>
              <div style={{color: 'var(--color-neutral-400)', marginTop: 4}}>
                Sem eles, perder o aplicativo autenticador significa perder o
                acesso à conta. Gere sua lista agora.
              </div>
            </div>
          ) : (
            <div style={{fontSize: 13, lineHeight: 1.5}}>
              <div style={{fontWeight: 600}}>
                <span data-testid="recovery-codes-count">
                  {status.remaining} de {status.total}
                </span>{' '}
                códigos ainda disponíveis
              </div>
              {exhausted ? (
                <div role="status" style={{color: 'var(--neg)', marginTop: 4}}>
                  Todos os seus códigos já foram usados. Gere uma nova lista
                  para não ficar sem alternativa ao autenticador.
                </div>
              ) : runningLow ? (
                <div role="status" style={{color: 'var(--neg)', marginTop: 4}}>
                  Restam poucos códigos ({LOW_RECOVERY_CODES_THRESHOLD} ou
                  menos). Gere uma nova lista enquanto seu autenticador ainda
                  funciona.
                </div>
              ) : null}
            </div>
          )}

          {!state.formOpen && (
            <button
              type="button"
              onClick={() => dispatch({type: 'open-form'})}
              style={{
                marginTop: 12,
                height: 36,
                padding: '0 16px',
                borderRadius: 8,
                border: 'none',
                background: 'var(--grad-violet)',
                color: '#fff',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
              }}>
              {neverGenerated ? 'Gerar códigos de recuperação' : 'Gerar novos códigos'}
            </button>
          )}

          {state.formOpen && (
            <div style={{marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8}}>
              <p style={{fontSize: 12.5, color: 'var(--color-neutral-400)', margin: 0, lineHeight: 1.5}}>
                Confirme com o código de 6 dígitos do seu aplicativo
                autenticador.
                {!neverGenerated && (
                  <>
                    {' '}
                    <strong>
                      Os códigos atuais deixarão de funcionar assim que a nova
                      lista for gerada.
                    </strong>
                  </>
                )}
              </p>
              <div style={{display: 'flex', gap: 8, flexWrap: 'wrap'}}>
                <label htmlFor="recovery-totp" style={{position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap'}}>
                  Código do autenticador
                </label>
                <input
                  id="recovery-totp"
                  placeholder="000000"
                  value={state.totpCode}
                  maxLength={6}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  onChange={(e) =>
                    dispatch({
                      type: 'set-code',
                      value: e.target.value.replace(/\D/g, '').slice(0, 6),
                    })
                  }
                  style={{
                    width: 120,
                    height: 36,
                    padding: '0 12px',
                    textAlign: 'center',
                    fontFamily: 'monospace',
                    fontSize: 16,
                    letterSpacing: '0.18em',
                    border: '1px solid var(--hair)',
                    borderRadius: 8,
                    background: 'var(--sunk)',
                    color: 'inherit',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={state.totpCode.length !== 6 || generate.isPending}
                  style={{
                    height: 36,
                    padding: '0 16px',
                    borderRadius: 8,
                    border: 'none',
                    background:
                      state.totpCode.length !== 6 || generate.isPending
                        ? 'var(--surf-3)'
                        : 'var(--grad-violet)',
                    color:
                      state.totpCode.length !== 6 || generate.isPending
                        ? 'var(--color-neutral-500)'
                        : '#fff',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor:
                      state.totpCode.length !== 6 || generate.isPending
                        ? 'not-allowed'
                        : 'pointer',
                  }}>
                  {generate.isPending ? 'Gerando...' : 'Confirmar e gerar'}
                </button>
                <button
                  type="button"
                  onClick={() => dispatch({type: 'close-form'})}
                  style={{
                    height: 36,
                    padding: '0 12px',
                    borderRadius: 8,
                    border: '1px solid var(--hair)',
                    background: 'transparent',
                    color: 'var(--color-neutral-400)',
                    fontSize: 13,
                    cursor: 'pointer',
                  }}>
                  Cancelar
                </button>
              </div>

              {state.error && (
                <div role="alert" style={{fontSize: 12.5, lineHeight: 1.45}}>
                  <strong style={{color: 'var(--neg)'}}>{state.error.title}</strong>
                  <div style={{color: 'var(--color-neutral-400)', marginTop: 2}}>
                    {state.error.description}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {state.issued && (
        <RecoveryCodesDialog
          open
          codes={state.issued.codes}
          generatedAt={state.issued.generatedAt}
          isRegeneration={state.replacedPrevious}
          onAcknowledge={() => {
            dispatch({type: 'acknowledge'});
            // O react-query guarda o resultado da mutation em cache próprio.
            // Sem o reset os códigos continuariam em memória depois da tela.
            generate.reset();
          }}
        />
      )}
    </div>
  );
}

export default RecoveryCodesSection;
