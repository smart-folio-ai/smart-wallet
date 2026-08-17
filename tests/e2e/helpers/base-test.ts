import {test as base, expect} from '@playwright/test';

// Mesma STORAGE_KEY e shape que `ConsentContext` usa (src/types/consent.ts).
// Sem isso, todo teste começa com o banner de consentimento LGPD cobrindo o
// topo da UI — localStorage limpo é o estado padrão de um contexto de teste.
const CONSENT_STORAGE_KEY = 'lgpd_consent';
const ALL_ACCEPTED_CONSENT = {
  essential: true,
  functional: true,
  analytics: true,
  marketing: true,
  timestamp: new Date(0).toISOString(),
  version: '1.0',
};

export const test = base.extend({
  page: async ({page}, use) => {
    await page.addInitScript(
      ([key, value]) => {
        window.localStorage.setItem(key, value);
      },
      [CONSENT_STORAGE_KEY, JSON.stringify(ALL_ACCEPTED_CONSENT)] as [
        string,
        string,
      ],
    );
    await use(page);
  },
});

export {expect};
