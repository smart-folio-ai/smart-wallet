import {describe, it, expect, beforeEach, vi} from 'vitest';
import {render, screen, fireEvent} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';
import {PremiumBlur} from './premium-blur';

function renderBlur(props: Partial<React.ComponentProps<typeof PremiumBlur>> = {}) {
  return render(
    <MemoryRouter>
      <PremiumBlur locked title="Recurso X" {...props}>
        <p>conteúdo bloqueado</p>
      </PremiumBlur>
    </MemoryRouter>,
  );
}

// O conteúdo bloqueado precisa ficar borrado E inerte. Só o blur é
// decoração: sem `pointer-events-none` o usuário free ainda clica na UI
// paga em telas que não têm segunda guarda em runtime (Comparator,
// MyAssetDetail, Index).
function expectBlockedAndInert(container: HTMLElement) {
  const blurred = container.querySelector('.blur-sm');
  expect(blurred).not.toBeNull();
  expect(blurred?.classList.contains('pointer-events-none')).toBe(true);
}

describe('PremiumBlur', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('mostra a faixa e mantém o conteúdo borrado por trás', () => {
    const {container} = renderBlur();

    expect(screen.getByText('Recurso X')).toBeInTheDocument();
    expect(screen.getByText('conteúdo bloqueado')).toBeInTheDocument();
    expectBlockedAndInert(container);
  });

  it('some ao fechar, mantendo o conteúdo borrado e sem interação', () => {
    const {container} = renderBlur();

    fireEvent.click(screen.getByRole('button', {name: /fechar/i}));

    expect(screen.queryByText('Recurso X')).not.toBeInTheDocument();
    expect(screen.getByText('conteúdo bloqueado')).toBeInTheDocument();
    expectBlockedAndInert(container);
  });

  it('não reaparece na mesma sessão depois de fechada', () => {
    const {unmount} = renderBlur();
    fireEvent.click(screen.getByRole('button', {name: /fechar/i}));
    unmount();

    renderBlur();

    expect(screen.queryByText('Recurso X')).not.toBeInTheDocument();
  });

  it('dispensa cada recurso separadamente', () => {
    const {unmount} = renderBlur({title: 'Recurso X'});
    fireEvent.click(screen.getByRole('button', {name: /fechar/i}));
    unmount();

    renderBlur({title: 'Recurso Y'});

    expect(screen.getByText('Recurso Y')).toBeInTheDocument();
  });

  it('com locked=false não borra, não trava interação nem mostra faixa', () => {
    const {container} = renderBlur({locked: false});

    expect(screen.getByText('conteúdo bloqueado')).toBeInTheDocument();
    expect(screen.queryByText('Recurso X')).not.toBeInTheDocument();
    expect(container.querySelector('.blur-sm')).toBeNull();
    expect(container.querySelector('.pointer-events-none')).toBeNull();
  });

  it('usa dismissKey em vez do title quando fornecido, evitando colisão entre titles iguais', () => {
    const {unmount} = renderBlur({title: 'Recurso Igual', dismissKey: 'feature-a'});
    fireEvent.click(screen.getByRole('button', {name: /fechar/i}));
    unmount();

    // Mesmo title, dismissKey diferente: não deve herdar a dispensa.
    renderBlur({title: 'Recurso Igual', dismissKey: 'feature-b'});

    expect(screen.getByText('Recurso Igual')).toBeInTheDocument();
  });

  it('renderiza normalmente quando sessionStorage lança', () => {
    const getItem = vi
      .spyOn(Storage.prototype, 'getItem')
      .mockImplementation(() => {
        throw new Error('storage disabled');
      });

    expect(() => renderBlur()).not.toThrow();
    expect(screen.getByText('Recurso X')).toBeInTheDocument();

    getItem.mockRestore();
  });
});
