import {describe, it, expect, vi} from 'vitest';
import {render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {MemoryRouter} from 'react-router-dom';
import {CommandPalette} from './CommandPalette';

vi.mock('@/components/ThemeToggle', () => ({
  useThemeToggle: () => ({toggleTheme: vi.fn()}),
}));

function renderPalette(open = true) {
  const onOpenChange = vi.fn();
  render(
    <MemoryRouter>
      <CommandPalette open={open} onOpenChange={onOpenChange} />
    </MemoryRouter>,
  );
  return {onOpenChange};
}

describe('CommandPalette', () => {
  it('lista os itens de "Ir para" quando aberto', () => {
    renderPalette();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Portfólio')).toBeInTheDocument();
    expect(screen.getByText('Configurações')).toBeInTheDocument();
  });

  it('filtra por texto digitado', async () => {
    const user = userEvent.setup();
    renderPalette();
    const input = screen.getByRole('combobox');
    await user.type(input, 'fiscal');
    expect(screen.getByText('Fiscal')).toBeInTheDocument();
    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
  });

  it('lista a ação "Alternar tema" no grupo Ações', () => {
    renderPalette();
    expect(screen.getByText('Alternar tema')).toBeInTheDocument();
  });
});
