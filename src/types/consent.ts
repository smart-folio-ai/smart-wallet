export interface ConsentPreferences {
  essential: true;
  functional: boolean;
  analytics: boolean;
  marketing: boolean;
  timestamp: string;
  version: string;
}

export interface ConsentContextType {
  consent: ConsentPreferences | null;
  hasConsented: boolean;
  updateConsent: (prefs: Partial<ConsentPreferences>) => void;
  acceptAll: () => void;
  rejectAll: () => void;
  resetConsent: () => void;
}

export const CONSENT_VERSION = '1.0';

export const DEFAULT_CONSENT: ConsentPreferences = {
  essential: true,
  functional: true,
  analytics: false,
  marketing: false,
  timestamp: new Date().toISOString(),
  version: CONSENT_VERSION,
};

export const ALL_ACCEPTED_CONSENT: ConsentPreferences = {
  essential: true,
  functional: true,
  analytics: true,
  marketing: true,
  timestamp: new Date().toISOString(),
  version: CONSENT_VERSION,
};

export const ALL_REJECTED_CONSENT: ConsentPreferences = {
  essential: true,
  functional: false,
  analytics: false,
  marketing: false,
  timestamp: new Date().toISOString(),
  version: CONSENT_VERSION,
};

export const STORAGE_KEY = 'lgpd_consent';
