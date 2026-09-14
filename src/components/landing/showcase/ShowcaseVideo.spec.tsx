import {afterEach, describe, expect, it, vi} from 'vitest';
import {act, render, screen} from '@testing-library/react';
import {ShowcaseVideo} from './ShowcaseVideo';
import {SHOWCASE_TIMELINE, warpTime} from './timeline';

function mockMatchMedia(reduced: boolean) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn((query: string) => ({
      matches: reduced && query.includes('prefers-reduced-motion'),
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  );
}

describe('ShowcaseVideo', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('renderiza sem quebrar e começa tocando', () => {
    mockMatchMedia(false);
    render(<ShowcaseVideo />);
    const video = screen.getByRole('img', {name: /demonstração do trackerr/i});
    expect(video).toHaveAttribute('data-state', 'playing');
  });

  it('com prefers-reduced-motion exibe o quadro estático da Carteira sem animar', () => {
    mockMatchMedia(true);
    const raf = vi.spyOn(window, 'requestAnimationFrame');
    render(<ShowcaseVideo />);
    expect(screen.getByRole('img')).toHaveAttribute('data-state', 'static');
    expect(screen.getByText('Patrimônio', {exact: false})).toBeInTheDocument();
    expect(screen.getByText(/R\$\s1\.284\.930/)).toBeInTheDocument();
    expect(screen.getByText('Toda a carteira, em um só lugar.')).toBeInTheDocument();
    expect(raf).not.toHaveBeenCalled();
  });

  it('cancela o requestAnimationFrame ao desmontar', () => {
    mockMatchMedia(false);
    let nextId = 0;
    const raf = vi.spyOn(window, 'requestAnimationFrame').mockImplementation(() => ++nextId);
    const caf = vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});
    const {unmount} = render(<ShowcaseVideo />);
    expect(raf).toHaveBeenCalled();
    const lastId = nextId;
    unmount();
    expect(caf).toHaveBeenCalledWith(lastId);
  });

  it('não agenda frames quando pausado', () => {
    mockMatchMedia(false);
    const raf = vi.spyOn(window, 'requestAnimationFrame');
    render(<ShowcaseVideo paused />);
    expect(screen.getByRole('img')).toHaveAttribute('data-state', 'paused');
    expect(raf).not.toHaveBeenCalled();
  });

  it('avança o tempo pelos frames e dá loop', () => {
    mockMatchMedia(false);
    const callbacks: FrameRequestCallback[] = [];
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      callbacks.push(cb);
      return callbacks.length;
    });
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});
    render(<ShowcaseVideo />);
    const tick = (ts: number) => act(() => callbacks[callbacks.length - 1](ts));
    tick(0);
    tick(4000); // 4s de reprodução -> dentro da cena Carteira (acelerada 2x)
    expect(screen.getByText('Toda a carteira, em um só lugar.')).toBeInTheDocument();
    tick(4000 + SHOWCASE_TIMELINE.total * 1000); // uma volta completa depois
    expect(screen.getByText('Toda a carteira, em um só lugar.')).toBeInTheDocument();
  });
});

describe('timeline', () => {
  it('deriva cues autorais e o warp respeita o campo nat', () => {
    expect(SHOWCASE_TIMELINE.total).toBeCloseTo(19.1);
    expect(SHOWCASE_TIMELINE.authoredTotal).toBeCloseTo(25.4);
    expect(SHOWCASE_TIMELINE.cues).toMatchObject({
      Abertura: 0,
      Carteira: 2.6,
      Graficos: 7.8,
      Copiloto: 12.8,
      RI: 17.8,
      Encerramento: 22.4,
    });
    // meio da Carteira em reprodução (2.6 + 1.3) -> meio autoral (2.6 + 2.6)
    expect(warpTime(SHOWCASE_TIMELINE, 3.9)).toBeCloseTo(5.2);
  });
});
