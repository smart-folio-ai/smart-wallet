/**
 * Contratos dos códigos de recuperação do 2FA (backend: smart-app#149).
 *
 * Os códigos em texto puro só existem no retorno de
 * `POST /auth/2fa/recovery-codes/generate`. Nenhuma outra rota devolve os
 * códigos, e eles nunca devem ser persistidos, logados ou colocados em URL.
 */

/** Resposta de `GET /auth/2fa/recovery-codes/status`. Nunca contém códigos. */
export interface RecoveryCodesStatus {
  total: number;
  remaining: number;
  /** `null` quando o usuário ainda nunca gerou códigos. */
  generatedAt: string | null;
}

/** Resposta de `POST /auth/2fa/recovery-codes/generate`. Exibida uma única vez. */
export interface GeneratedRecoveryCodes {
  codes: string[];
  generatedAt: string;
}

/**
 * Categorias de falha que a UI precisa distinguir para dar uma mensagem
 * honesta ao usuário em vez de um erro genérico.
 */
export type RecoveryCodesErrorKind =
  | 'invalid-totp'
  | 'invalid-recovery-code'
  | 'rate-limited'
  | 'session-expired'
  | 'network'
  | 'unknown';
