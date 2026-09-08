/**
 * Ponto único de estabelecimento de sessão depois do segundo fator.
 *
 * Extraído de `TwoFactorVerify` sem mudança de comportamento, para que o
 * caminho do código de recuperação use exatamente os mesmos passos do caminho
 * TOTP em vez de duplicar a gravação de tokens.
 */
export interface SessionTokens {
  accessToken: string;
  refreshToken: string;
}

export const TEMP_TOKEN_STORAGE_KEY = '2fa_temp_token';

export function establishSession({accessToken, refreshToken}: SessionTokens): void {
  localStorage.setItem('access_token', accessToken);
  localStorage.setItem('refresh_token', refreshToken);
  sessionStorage.removeItem(TEMP_TOKEN_STORAGE_KEY);
}

/**
 * Lê o tempToken do passo de 2FA. Mantém o fallback por query string que já
 * existia em `TwoFactorVerify` para não quebrar links em uso; o caminho normal
 * é o sessionStorage gravado no login.
 */
export function readTempToken(): string {
  return (
    new URLSearchParams(window.location.search).get('tempToken') ||
    sessionStorage.getItem(TEMP_TOKEN_STORAGE_KEY) ||
    ''
  );
}
