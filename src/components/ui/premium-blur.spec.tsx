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

describe('PremiumBlur', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('mostra a faixa e mantém o conteúdo borrado por trás', () => {
    const {container} = renderBlur();

    expect(screen.getByText('Recurso X')).toBeInTheDocument();
    expect(screen.getByText('conteúdo bloqueado')).toBeInTheDocument();
    expect(container.querySelector('.blur-sm')).not.toBeNull();
  });

  it('some ao fechar, mantendo o conteúdo borrado', () => {
    const {container} = renderBlur();

    fireEvent.click(screen.getByRole('button', {name: /fechar/i}));

    expect(screen.queryByText('Recurso X')).not.toBeInTheDocument();
    expect(screen.getByText('conteúdo bloqueado')).toBeInTheDocument();
    expect(container.querySelector('.blur-sm')).not.toBeNull();
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

  it('com locked=false não borra nem mostra faixa', () => {
    const {container} = renderBlur({locked: false});

    expect(screen.getByText('conteúdo bloqueado')).toBeInTheDocument();
    expect(screen.queryByText('Recurso X')).not.toBeInTheDocument();
    expect(container.querySelector('.blur-sm')).toBeNull();
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
