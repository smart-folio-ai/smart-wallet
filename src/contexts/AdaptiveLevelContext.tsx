import {createContext, useContext, useMemo, type ReactNode} from 'react';
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {
  getInvestorProfile,
  setInvestorProfileOverride,
  type InvestorProfileResponse,
} from '@/services/ai/investorProfile';
import {
  DEFAULT_LEVEL,
  isAdaptiveLevel,
  toAdaptiveLevel,
  toSophistication,
  type AdaptiveLevel,
} from './adaptive-level.mapping';

export type {AdaptiveLevel} from './adaptive-level.mapping';
export {ADAPTIVE_LEVELS, DEFAULT_LEVEL} from './adaptive-level.mapping';

/**
 * Cache anti-flash, NÃO fonte de verdade (TRA-142).
 *
 * A fonte de verdade é o `InvestorProfileService` no servidor, que infere o
 * nível diariamente a partir de sinais reais e guarda o override manual do
 * usuário. Antes o nível vivia só aqui, nunca saía do navegador, e por isso a
 * IA gerava todo texto sem saber com quem estava falando.
 *
 * O valor local serve só para a primeira pintura não piscar no default
 * enquanto a requisição não volta. Toda escrita vai para o servidor.
 */
const CACHE_KEY = 'adaptive-level';

export const INVESTOR_PROFILE_QUERY_KEY = ['investor-profile'] as const;

interface AdaptiveLevelContextValue {
  level: AdaptiveLevel;
  setLevel: (level: AdaptiveLevel) => void;
  /**
   * Limpa a escolha manual e devolve o nível ao valor inferido pelo servidor.
   * Sem isso o override é uma porta de mão única: o usuário testa "avançado"
   * uma vez e nunca mais volta a acompanhar a própria evolução.
   */
  clearOverride: () => void;
  /**
   * Perfil bruto do servidor, para quem precisa de mais que o nível —
   * `riskTolerance`, `signals`. Existe para não haver uma segunda busca do
   * mesmo recurso em outra tela.
   */
  profile: InvestorProfileResponse | null;
  /** Confiança da inferência (0.1 a 1). `null` enquanto o perfil não chegou. */
  confidence: number | null;
  /** `user_override` quando o usuário escolheu manualmente. */
  source: InvestorProfileResponse['source'] | null;
  isLoading: boolean;
}

const AdaptiveLevelContext = createContext<
  AdaptiveLevelContextValue | undefined
>(undefined);

function readCachedLevel(): AdaptiveLevel {
  if (typeof window === 'undefined') return DEFAULT_LEVEL;
  try {
    const stored = localStorage.getItem(CACHE_KEY);
    return isAdaptiveLevel(stored) ? stored : DEFAULT_LEVEL;
  } catch {
    // Safari em modo privado, storage cheio: seguir com o default.
    return DEFAULT_LEVEL;
  }
}

function writeCachedLevel(level: AdaptiveLevel): void {
  try {
    localStorage.setItem(CACHE_KEY, level);
  } catch {
    // Cache é otimização, não requisito. Falhar aqui não muda o comportamento.
  }
}

export function AdaptiveLevelProvider({children}: {children: ReactNode}) {
  const queryClient = useQueryClient();

  const {data: profile, isLoading} = useQuery({
    queryKey: INVESTOR_PROFILE_QUERY_KEY,
    queryFn: getInvestorProfile,
    // O perfil é recalculado uma vez por dia no servidor; não faz sentido
    // revalidar a cada foco de janela.
    staleTime: 5 * 60 * 1000,
    // Sem perfil a página ainda funciona no default. Repetir uma requisição
    // que falhou só atrasa a primeira pintura.
    retry: false,
  });

  // `null` explícito limpa o override no servidor e devolve o valor inferido;
  // um nível grava a escolha manual. O contrato de PUT /ai/investor-profile já
  // distingue os dois casos.
  const {mutate: persistLevel} = useMutation({
    mutationFn: (level: AdaptiveLevel | null) =>
      setInvestorProfileOverride({
        sophistication: level === null ? null : toSophistication(level),
      }),
    onSuccess: (updated) => {
      queryClient.setQueryData(INVESTOR_PROFILE_QUERY_KEY, updated);
      writeCachedLevel(toAdaptiveLevel(updated.sophistication));
    },
    onError: () => {
      // Desfaz o otimismo: volta ao que o servidor tem de fato.
      queryClient.invalidateQueries({queryKey: INVESTOR_PROFILE_QUERY_KEY});
    },
  });

  const level = profile ? toAdaptiveLevel(profile.sophistication) : readCachedLevel();

  const value = useMemo<AdaptiveLevelContextValue>(
    () => ({
      level,
      setLevel: (next: AdaptiveLevel) => {
        // Otimista: a troca de nível é uma preferência de exibição e precisa
        // responder na hora, como respondia quando era só localStorage.
        queryClient.setQueryData<InvestorProfileResponse>(
          INVESTOR_PROFILE_QUERY_KEY,
          (current) =>
            current
              ? {
                  ...current,
                  sophistication: toSophistication(next),
                  source: 'user_override',
                }
              : current,
        );
        writeCachedLevel(next);
        persistLevel(next);
      },
      clearOverride: () => {
        // Sem otimismo aqui: o nível inferido só o servidor conhece, e chutar
        // um valor faria a interface piscar em um nível que pode não ser o que
        // volta. Melhor esperar a resposta.
        persistLevel(null);
      },
      profile: profile ?? null,
      confidence: profile?.confidence ?? null,
      source: profile?.source ?? null,
      isLoading,
    }),
    [level, profile, isLoading, persistLevel, queryClient],
  );

  return (
    <AdaptiveLevelContext.Provider value={value}>
      {children}
    </AdaptiveLevelContext.Provider>
  );
}

export function useAdaptiveLevel(): AdaptiveLevelContextValue {
  const context = useContext(AdaptiveLevelContext);
  if (!context) {
    throw new Error(
      'useAdaptiveLevel must be used within an AdaptiveLevelProvider',
    );
  }
  return context;
}
