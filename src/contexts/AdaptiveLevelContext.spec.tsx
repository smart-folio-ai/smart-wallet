import {describe, it, expect, beforeEach} from 'vitest';
import {render, screen, renderHook} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  AdaptiveLevelProvider,
  useAdaptiveLevel,
} from './AdaptiveLevelContext';

const STORAGE_KEY = 'adaptive-level';

function TestConsumer() {
  const {level, setLevel} = useAdaptiveLevel();
  return (
    <div>
      <span>nível: {level}</span>
      <button onClick={() => setLevel('avancado')}>ir pra avançado</button>
    </div>
  );
}

describe('AdaptiveLevelContext', () => {
  beforeEach(() => {
    localStorage.removeItem(STORAGE_KEY);
  });

  it('usa intermediario como default quando não há valor salvo', () => {
    render(
      <AdaptiveLevelProvider>
        <TestConsumer />
      </AdaptiveLevelProvider>,
    );
    expect(screen.getByText('nível: intermediario')).toBeInTheDocument();
  });

  it('persiste o nível em localStorage ao trocar', async () => {
    const user = userEvent.setup();
    render(
      <AdaptiveLevelProvider>
        <TestConsumer />
      </AdaptiveLevelProvider>,
    );
    await user.click(screen.getByText('ir pra avançado'));
    expect(screen.getByText('nível: avancado')).toBeInTheDocument();
    expect(localStorage.getItem(STORAGE_KEY)).toBe('avancado');
  });

  it('lê o nível salvo em localStorage no mount', () => {
    localStorage.setItem(STORAGE_KEY, 'iniciante');
    render(
      <AdaptiveLevelProvider>
        <TestConsumer />
      </AdaptiveLevelProvider>,
    );
    expect(screen.getByText('nível: iniciante')).toBeInTheDocument();
  });

  it('lança erro quando usado fora do provider', () => {
    const {result} = renderHook(() => {
      try {
        return useAdaptiveLevel();
      } catch (e) {
        return e as Error;
      }
    });
    expect(result.current).toBeInstanceOf(Error);
    expect((result.current as Error).message).toMatch(
      /AdaptiveLevelProvider/,
    );
  });
});
