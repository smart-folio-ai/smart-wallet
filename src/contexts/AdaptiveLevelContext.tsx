import {createContext, useContext, useState, type ReactNode} from 'react';

export type AdaptiveLevel = 'iniciante' | 'intermediario' | 'avancado';

const STORAGE_KEY = 'adaptive-level';
const VALID_LEVELS: AdaptiveLevel[] = ['iniciante', 'intermediario', 'avancado'];
const DEFAULT_LEVEL: AdaptiveLevel = 'intermediario';

interface AdaptiveLevelContextValue {
  level: AdaptiveLevel;
  setLevel: (level: AdaptiveLevel) => void;
}

const AdaptiveLevelContext = createContext<
  AdaptiveLevelContextValue | undefined
>(undefined);

function readStoredLevel(): AdaptiveLevel {
  if (typeof window === 'undefined') return DEFAULT_LEVEL;
  const stored = localStorage.getItem(STORAGE_KEY);
  return VALID_LEVELS.includes(stored as AdaptiveLevel)
    ? (stored as AdaptiveLevel)
    : DEFAULT_LEVEL;
}

export function AdaptiveLevelProvider({children}: {children: ReactNode}) {
  const [level, setLevelState] = useState<AdaptiveLevel>(readStoredLevel);

  const setLevel = (next: AdaptiveLevel) => {
    localStorage.setItem(STORAGE_KEY, next);
    setLevelState(next);
  };

  return (
    <AdaptiveLevelContext.Provider value={{level, setLevel}}>
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
