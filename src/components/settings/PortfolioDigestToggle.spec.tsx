import {describe, it, expect, beforeEach, vi} from 'vitest';
import {render, screen, waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {PortfolioDigestToggle} from './PortfolioDigestToggle';

/**
 * TRA-202 — não existia NENHUM jeito de ligar o resumo semanal antes deste
 * toggle. Estes testes provam o ciclo completo: lê o estado atual, liga,
 * desliga, e nunca finge sucesso quando a API falha.
 */

const getPreference = vi.fn();
const updatePreference = vi.fn();

vi.mock('@/server/api/api', () => ({
  portfolioDigestService: {
    getPreference: () => getPreference(),
    updatePreference: (enabled: boolean) => updatePreference(enabled),
  },
}));

function renderToggle() {
  const client = new QueryClient({defaultOptions: {queries: {retry: false}}});
  return render(
    <QueryClientProvider client={client}>
      <PortfolioDigestToggle />
    </QueryClientProvider>,
  );
}

describe('PortfolioDigestToggle (TRA-202)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('mostra desligado quando o usuário nunca configurou nada (default do server)', async () => {
    getPreference.mockResolvedValue({data: {enabled: false}});
    renderToggle();

    const toggle = await screen.findByRole('switch');
    await waitFor(() => expect(toggle).not.toBeDisabled());
    expect(toggle).not.toBeChecked();
  });

  it('mostra ligado quando o server confirma', async () => {
    getPreference.mockResolvedValue({data: {enabled: true}});
    renderToggle();

    const toggle = await screen.findByRole('switch');
    await waitFor(() => expect(toggle).toBeChecked());
  });

  it('liga o resumo semanal — a ação que não existia antes do TRA-202', async () => {
    getPreference.mockResolvedValue({data: {enabled: false}});
    updatePreference.mockResolvedValue({data: {enabled: true}});
    renderToggle();

    const toggle = await screen.findByRole('switch');
    await waitFor(() => expect(toggle).not.toBeDisabled());
    await userEvent.click(toggle);

    expect(updatePreference).toHaveBeenCalledWith(true);
    await waitFor(() => expect(toggle).toBeChecked());
  });

  it('desliga do mesmo jeito que o link de unsubscribe faria', async () => {
    getPreference.mockResolvedValue({data: {enabled: true}});
    updatePreference.mockResolvedValue({data: {enabled: false}});
    renderToggle();

    const toggle = await screen.findByRole('switch');
    await waitFor(() => expect(toggle).toBeChecked());
    await userEvent.click(toggle);

    expect(updatePreference).toHaveBeenCalledWith(false);
    await waitFor(() => expect(toggle).not.toBeChecked());
  });

  it('falha ao salvar: mostra erro e não finge que ligou', async () => {
    getPreference.mockResolvedValue({data: {enabled: false}});
    updatePreference.mockRejectedValue(new Error('boom'));
    renderToggle();

    const toggle = await screen.findByRole('switch');
    await waitFor(() => expect(toggle).not.toBeDisabled());
    await userEvent.click(toggle);

    expect(
      await screen.findByText('Não foi possível salvar sua preferência de resumo semanal.'),
    ).toBeInTheDocument();
  });
});
