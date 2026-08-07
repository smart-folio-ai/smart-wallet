import {describe, it, expect, beforeEach, afterEach, vi} from 'vitest';
import {render, screen} from '@testing-library/react';
import gsap from 'gsap';
import {Ticker} from './Ticker';

describe('Ticker', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('com prefers-reduced-motion ativo, renderiza o valor final e não anima', () => {
    // Quando prefers-reduced-motion é reduzido, o hook useCountUp bailout em sua guard,
    // então o valor renderizado pelo React permanece sem mudanças.
    vi.stubGlobal(
      'matchMedia',
      vi.fn().mockImplementation((query) => ({
        matches: query.includes('prefers-reduced-motion'),
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    );

    render(<Ticker value={284930} format={(n) => `R$ ${Math.round(n)}`} />);
    expect(screen.getByText('R$ 284930')).toBeInTheDocument();
  });

  it('usa tabular-nums para o número não dançar ao animar', () => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn().mockImplementation(() => ({
        matches: false,
        media: '',
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    );

    const {container} = render(<Ticker value={12} />);
    expect(container.firstElementChild?.className).toContain('tabular-nums');
  });

  it('com motion permitido, o hook conta até o valor final e o deixa lá', () => {
    // Mock matchMedia para permitir motion
    vi.stubGlobal(
      'matchMedia',
      vi.fn().mockImplementation(() => ({
        matches: false,
        media: '',
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    );

    // Capture a chamada para gsap.to e interceptar os callbacks
    let capturedConfig: any = null;
    const originalGsapTo = gsap.to;
    vi.spyOn(gsap, 'to').mockImplementation((target, config) => {
      capturedConfig = config;
      // Retornar uma timeline mock
      return {
        kill: vi.fn(),
        pause: vi.fn(),
        resume: vi.fn(),
        progress: vi.fn(),
      } as any;
    });

    const value = 284930;
    const format = (n: number) => `R$ ${Math.round(n)}`;

    render(<Ticker value={value} format={format} />);

    // Verificar que gsap.to foi chamado
    expect(gsap.to).toHaveBeenCalled();
    expect(capturedConfig).toBeDefined();

    // Invocar os callbacks em ordem: onEnter, onUpdate, onComplete
    if (capturedConfig?.scrollTrigger?.onEnter) {
      capturedConfig.scrollTrigger.onEnter();
    }

    // Simular animação completando
    if (capturedConfig?.onComplete) {
      capturedConfig.onComplete();
    }

    // Após onComplete, o valor final deve estar visível
    const span = screen.getByText(format(value));
    expect(span.textContent).toBe(format(value));

    // Restaurar gsap.to original
    gsap.to = originalGsapTo;
  });
});
