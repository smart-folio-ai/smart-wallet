import '@testing-library/jest-dom';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

if (!globalThis.ResizeObserver) {
  globalThis.ResizeObserver = ResizeObserverMock as unknown as typeof ResizeObserver;
}

// jsdom expõe window.scrollTo mas não implementa de verdade — chamá-la
// (o ScrollTrigger do GSAP chama) loga "Error: Not implemented" no console
// a cada teste. Stub vazio só para silenciar o ruído, sem afetar nenhuma
// asserção.
if (typeof window !== 'undefined') {
  window.scrollTo = () => {};
}

afterEach(() => {
  cleanup();
});
