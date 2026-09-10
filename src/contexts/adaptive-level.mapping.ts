/**
 * Ponte entre os dois vocabulários de nível do sistema (TRA-142).
 *
 * O backend é a fonte de verdade e fala `beginner | intermediate | experienced`
 * (`InvestorProfileService`, recalculado diariamente a partir de sinais reais).
 * A interface fala português para o usuário final.
 *
 * A tradução acontece SÓ aqui, na borda. Nenhuma outra parte do front deve
 * conhecer os dois vocabulários ao mesmo tempo.
 */

export type AdaptiveLevel = 'iniciante' | 'intermediario' | 'avancado';
export type SophisticationLevel = 'beginner' | 'intermediate' | 'experienced';

export const ADAPTIVE_LEVELS: readonly AdaptiveLevel[] = [
  'iniciante',
  'intermediario',
  'avancado',
] as const;

/**
 * Usado enquanto o perfil do servidor não chegou e quando ele falha. Escolhido
 * como meio-termo: mostrar demais para um iniciante confunde, mostrar de menos
 * para um avançado frustra — e o intermediário é recuperável nos dois sentidos.
 */
export const DEFAULT_LEVEL: AdaptiveLevel = 'intermediario';

const LEVEL_BY_SOPHISTICATION: Record<SophisticationLevel, AdaptiveLevel> = {
  beginner: 'iniciante',
  intermediate: 'intermediario',
  experienced: 'avancado',
};

const SOPHISTICATION_BY_LEVEL: Record<AdaptiveLevel, SophisticationLevel> = {
  iniciante: 'beginner',
  intermediario: 'intermediate',
  avancado: 'experienced',
};

export function isAdaptiveLevel(value: unknown): value is AdaptiveLevel {
  return ADAPTIVE_LEVELS.includes(value as AdaptiveLevel);
}

/** Backend para interface. Valor desconhecido cai no default em vez de quebrar. */
export function toAdaptiveLevel(
  sophistication: SophisticationLevel | string | null | undefined,
): AdaptiveLevel {
  if (!sophistication) return DEFAULT_LEVEL;
  return (
    LEVEL_BY_SOPHISTICATION[sophistication as SophisticationLevel] ??
    DEFAULT_LEVEL
  );
}

/** Interface para backend. */
export function toSophistication(level: AdaptiveLevel): SophisticationLevel {
  return SOPHISTICATION_BY_LEVEL[level];
}
