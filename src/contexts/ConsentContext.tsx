import {createContext, useContext, useState, useCallback, useEffect, ReactNode} from 'react';
import {
  ConsentPreferences,
  ConsentContextType,
  STORAGE_KEY,
  DEFAULT_CONSENT,
  ALL_ACCEPTED_CONSENT,
  ALL_REJECTED_CONSENT,
} from '@/types/consent';

const ConsentContext = createContext<ConsentContextType | undefined>(undefined);

export const ConsentProvider = ({children}: {children: ReactNode}) => {
  const [consent, setConsent] = useState<ConsentPreferences | null>(() => {
    if (typeof window === 'undefined') return null;
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return null;
      }
    }
    return null;
  });

  const hasConsented = consent !== null;

  const dispatchConsentEvent = useCallback(() => {
    window.dispatchEvent(new Event('consent:updated'));
  }, []);

  const acceptAll = useCallback(() => {
    const newConsent = {...ALL_ACCEPTED_CONSENT, timestamp: new Date().toISOString()};
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newConsent));
    setConsent(newConsent);
    dispatchConsentEvent();
  }, [dispatchConsentEvent]);

  const rejectAll = useCallback(() => {
    const newConsent = {...ALL_REJECTED_CONSENT, timestamp: new Date().toISOString()};
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newConsent));
    setConsent(newConsent);
    dispatchConsentEvent();
  }, [dispatchConsentEvent]);

  const updateConsent = useCallback(
    (prefs: Partial<ConsentPreferences>) => {
      const newConsent = {
        ...DEFAULT_CONSENT,
        ...consent,
        ...prefs,
        essential: true,
        timestamp: new Date().toISOString(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newConsent));
      setConsent(newConsent);
      dispatchConsentEvent();
    },
    [consent, dispatchConsentEvent]
  );

  const resetConsent = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setConsent(null);
    dispatchConsentEvent();
  }, [dispatchConsentEvent]);

  return (
    <ConsentContext.Provider
      value={{consent, hasConsented, updateConsent, acceptAll, rejectAll, resetConsent}}
    >
      {children}
    </ConsentContext.Provider>
  );
};

export const useConsent = (): ConsentContextType => {
  const context = useContext(ConsentContext);
  if (!context) {
    throw new Error('useConsent must be used within a ConsentProvider');
  }
  return context;
};
