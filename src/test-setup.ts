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

// jsdom também não implementa Element.scrollIntoView — o cmdk (usado pelo
// CommandPalette) chama isso ao montar/realçar itens. Stub vazio global,
// mesmo padrão do scrollTo acima.
if (typeof HTMLElement !== 'undefined' && !HTMLElement.prototype.scrollIntoView) {
  HTMLElement.prototype.scrollIntoView = () => {};
}

afterEach(() => {
  cleanup();
});
