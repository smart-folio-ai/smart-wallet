/**
 * Regras de senha exibidas na tela de Segurança.
 *
 * O backend (UpdatePasswordDto) continua sendo a validação real: mínimo de 8,
 * maiúscula, minúscula, número e caractere especial, além da checagem de
 * senhas vazadas. Aqui a exigência de tamanho é 10, como pede o handoff — mais
 * rígida que o server, então nada que passa aqui é recusado por tamanho lá.
 */
export const MIN_PASSWORD_LENGTH = 10;
const STRONG_PASSWORD_LENGTH = 14;

export interface PasswordRule {
  id: 'length' | 'case' | 'digit-symbol' | 'different';
  label: string;
  ok: boolean;
}

export type StrengthLevel = 'empty' | 'weak' | 'fair' | 'good' | 'strong';

export interface PasswordStrength {
  /** Quantos dos 4 segmentos do medidor ficam acesos. */
  score: 0 | 1 | 2 | 3 | 4;
  level: StrengthLevel;
  label: string;
}

const hasUpperAndLower = (value: string) =>
  /[A-Z]/.test(value) && /[a-z]/.test(value);
const hasDigitAndSymbol = (value: string) =>
  /\d/.test(value) && /[^A-Za-z0-9]/.test(value);

export function evaluatePasswordRules(
  newPassword: string,
  currentPassword: string,
): PasswordRule[] {
  return [
    {
      id: 'length',
      label: `${MIN_PASSWORD_LENGTH} caracteres ou mais`,
      ok: newPassword.length >= MIN_PASSWORD_LENGTH,
    },
    {id: 'case', label: 'Letra maiúscula e minúscula', ok: hasUpperAndLower(newPassword)},
    {id: 'digit-symbol', label: 'Número e símbolo', ok: hasDigitAndSymbol(newPassword)},
    {
      id: 'different',
      label: 'Diferente da senha atual',
      ok: newPassword.length > 0 && newPassword !== currentPassword,
    },
  ];
}

const LEVEL_NAMES: Record<Exclude<StrengthLevel, 'empty'>, string> = {
  weak: 'fraca',
  fair: 'média',
  good: 'boa',
  strong: 'forte',
};

function describeComposition(value: string): string {
  const parts: string[] = [];
  if (/[A-Z]/.test(value)) parts.push('maiúsculas');
  if (/\d/.test(value)) parts.push('números');
  if (/[^A-Za-z0-9]/.test(value)) parts.push('símbolo');
  const size = `${value.length} ${value.length === 1 ? 'caractere' : 'caracteres'}`;
  if (parts.length === 0) return size;
  const last = parts.pop();
  const list = parts.length ? `${parts.join(', ')} e ${last}` : last;
  return `${size}, ${list}`;
}

export function evaluatePasswordStrength(value: string): PasswordStrength {
  if (!value) {
    return {score: 0, level: 'empty', label: 'Força: — · digite a nova senha'};
  }
  const points = [
    value.length >= MIN_PASSWORD_LENGTH,
    hasUpperAndLower(value),
    hasDigitAndSymbol(value),
    value.length >= STRONG_PASSWORD_LENGTH,
  ].filter(Boolean).length;
  // Mesmo sem cumprir nenhuma regra, uma senha digitada acende 1 segmento.
  const score = Math.max(1, points) as PasswordStrength['score'];
  const level: Exclude<StrengthLevel, 'empty'> =
    score === 4 ? 'strong' : score === 3 ? 'good' : score === 2 ? 'fair' : 'weak';
  return {
    score,
    level,
    label: `Força: ${LEVEL_NAMES[level]} · ${describeComposition(value)}`,
  };
}

export function isPasswordAcceptable(rules: PasswordRule[]): boolean {
  return rules.every((rule) => rule.ok);
}
