import {beforeEach, describe, expect, it, vi} from 'vitest';
import {render, screen, fireEvent, waitFor} from '@testing-library/react';
import {RagAskPanel} from './RagAskPanel';

const {askMock} = vi.hoisted(() => ({askMock: vi.fn()}));
vi.mock('@/services/chat', () => ({
  askStructuredChat: (...args: unknown[]) => askMock(...args),
}));

describe('RagAskPanel (TRA-39)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('sends the typed question and shows the answer', async () => {
    askMock.mockResolvedValueOnce({
      message: 'PETR4 representa 22% da sua carteira.',
      deterministic: false,
      route: {type: 'synthesis_required'},
    });

    render(<RagAskPanel />);
    const textarea = screen.getByPlaceholderText(/pergunte algo/i);
    fireEvent.change(textarea, {target: {value: 'Quanto tenho de PETR4?'}});
    fireEvent.click(screen.getByLabelText('Enviar pergunta'));

    await waitFor(() =>
      expect(screen.getByText(/PETR4 representa 22%/)).toBeInTheDocument(),
    );
    expect(askMock).toHaveBeenCalledWith('Quanto tenho de PETR4?');
  });

  it('shows the AI-generated notice only for a model (non-deterministic) answer', async () => {
    askMock.mockResolvedValueOnce({
      message: 'Análise gerada pela IA.',
      deterministic: false,
      route: {type: 'synthesis_required'},
    });

    render(<RagAskPanel />);
    fireEvent.change(screen.getByPlaceholderText(/pergunte algo/i), {
      target: {value: 'Analise minha carteira'},
    });
    fireEvent.click(screen.getByLabelText('Enviar pergunta'));

    await waitFor(() =>
      expect(screen.getByText(/gerado com o auxílio/i)).toBeInTheDocument(),
    );
  });

  it('does NOT show the AI notice for a deterministic answer', async () => {
    // Resposta determinística do backend não pode exibir aviso de IA — o
    // texto não veio de modelo (mesma regra do ChatInteligente).
    askMock.mockResolvedValueOnce({
      message: 'PETR4: 22% da carteira.',
      deterministic: true,
      route: {type: 'deterministic_no_llm'},
    });

    render(<RagAskPanel />);
    fireEvent.change(screen.getByPlaceholderText(/pergunte algo/i), {
      target: {value: 'Peso de PETR4'},
    });
    fireEvent.click(screen.getByLabelText('Enviar pergunta'));

    await waitFor(() =>
      expect(screen.getByText(/PETR4: 22%/)).toBeInTheDocument(),
    );
    expect(screen.queryByText(/gerado com o auxílio/i)).not.toBeInTheDocument();
  });

  it('fires a quick prompt on click', async () => {
    askMock.mockResolvedValueOnce({message: 'Resposta.', deterministic: true});

    render(<RagAskPanel quickPrompts={['PETR4 faz sentido pra mim?']} />);
    fireEvent.click(screen.getByText('PETR4 faz sentido pra mim?'));

    await waitFor(() =>
      expect(askMock).toHaveBeenCalledWith('PETR4 faz sentido pra mim?'),
    );
  });

  it('shows an error with retry when the request fails, and retries', async () => {
    askMock.mockRejectedValueOnce(new Error('network'));

    render(<RagAskPanel />);
    fireEvent.change(screen.getByPlaceholderText(/pergunte algo/i), {
      target: {value: 'Qual meu risco?'},
    });
    fireEvent.click(screen.getByLabelText('Enviar pergunta'));

    await waitFor(() =>
      expect(screen.getByText(/não foi possível consultar/i)).toBeInTheDocument(),
    );

    askMock.mockResolvedValueOnce({message: 'Risco médio.', deterministic: true});
    fireEvent.click(screen.getByText(/tentar de novo/i));

    await waitFor(() =>
      expect(screen.getByText(/risco médio/i)).toBeInTheDocument(),
    );
    // O retry reenvia a MESMA pergunta, não uma vazia.
    expect(askMock).toHaveBeenLastCalledWith('Qual meu risco?');
  });

  it('does not send an empty question', () => {
    render(<RagAskPanel />);
    const button = screen.getByLabelText('Enviar pergunta');
    expect(button).toBeDisabled();
    fireEvent.click(button);
    expect(askMock).not.toHaveBeenCalled();
  });
});
