import {describe, it, expect, beforeEach, afterEach, vi} from 'vitest';
import {act, fireEvent, render, screen} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';
import {OnboardingTutorial, TUTORIAL_SEEN_KEY, openTutorial} from './OnboardingTutorial';

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <OnboardingTutorial />
    </MemoryRouter>,
  );

describe('OnboardingTutorial', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
  });
  afterEach(() => vi.useRealTimers());

  it('opens by itself on the first Dashboard visit and walks the 4 steps', () => {
    renderAt('/dashboard');
    act(() => vi.advanceTimersByTime(1000));

    expect(screen.getByRole('dialog', {name: 'Bem-vindo ao Trackerr'})).toBeInTheDocument();
    expect(screen.getByText('Passo 1 de 4 · conheça o Trackerr')).toBeInTheDocument();
    expect(screen.queryByRole('button', {name: 'Voltar'})).not.toBeInTheDocument();

    for (const title of ['Copiloto de investimentos', 'RI Inteligente', 'Você está no controle']) {
      fireEvent.click(screen.getByRole('button', {name: 'Próximo'}));
      expect(screen.getByRole('heading', {name: title})).toBeInTheDocument();
    }
    fireEvent.click(screen.getByRole('button', {name: 'Concluir'}));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(localStorage.getItem(TUTORIAL_SEEN_KEY)).toBe('1');
  });

  it('comes back next time when "Não mostrar novamente" is unchecked', () => {
    renderAt('/dashboard');
    act(() => vi.advanceTimersByTime(1000));
    fireEvent.click(screen.getByLabelText('Não mostrar novamente'));
    fireEvent.click(screen.getByRole('button', {name: 'Fechar'}));

    expect(localStorage.getItem(TUTORIAL_SEEN_KEY)).toBeNull();
  });

  it('does not auto-open after being dismissed or outside the Dashboard, but the "?" reopens it', () => {
    localStorage.setItem(TUTORIAL_SEEN_KEY, '1');
    renderAt('/dashboard');
    act(() => vi.advanceTimersByTime(2000));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    act(() => openTutorial());
    expect(screen.getByRole('dialog', {name: 'Bem-vindo ao Trackerr'})).toBeInTheDocument();
  });

  it('never promises direct broker sync (Pro only)', () => {
    renderAt('/portfolio');
    act(() => openTutorial());
    for (let i = 0; i < 3; i++) fireEvent.click(screen.getByRole('button', {name: 'Próximo'}));

    expect(screen.queryByText(/corretora|conecte suas contas/i)).not.toBeInTheDocument();
  });
});
