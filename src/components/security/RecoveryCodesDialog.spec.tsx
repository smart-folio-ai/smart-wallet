import {describe, it, expect, vi, beforeEach, afterEach} from 'vitest';
import {render, screen, waitFor, fireEvent} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RecoveryCodesDialog from './RecoveryCodesDialog';

vi.mock('@/hooks/use-app-toast', () => ({
  default: () => ({success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn()}),
  useAppToast: () => ({success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn()}),
}));

const CODES = ['A1B2-C3D4', 'E5F6-G7H8', 'I9J0-K1L2'];
const GENERATED_AT = '2026-09-07T12:00:00.000Z';

const renderDialog = (onAcknowledge = vi.fn()) => {
  render(
    <RecoveryCodesDialog
      open
      codes={CODES}
      generatedAt={GENERATED_AT}
      onAcknowledge={onAcknowledge}
    />,
  );
  return onAcknowledge;
};

describe('RecoveryCodesDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('mostra os códigos e avisa que é a única exibição', () => {
    renderDialog();
    CODES.forEach((code) => expect(screen.getByText(code)).toBeInTheDocument());
    expect(
      screen.getByText(/única vez que mostramos estes códigos/i),
    ).toBeInTheDocument();
  });

  it('não pode ser dispensado sem o aceite explícito', async () => {
    const onAcknowledge = renderDialog();
    const confirm = screen.getByRole('button', {name: /concluir/i});

    // Escape e clique no backdrop não fecham nada.
    fireEvent.keyDown(document, {key: 'Escape', code: 'Escape'});
    fireEvent.pointerDown(document.body);

    expect(screen.getByText(CODES[0])).toBeInTheDocument();
    expect(confirm).toBeDisabled();
    expect(onAcknowledge).not.toHaveBeenCalled();

    // Só o checkbox libera a saída.
    await userEvent.click(screen.getByRole('checkbox'));
    expect(confirm).toBeEnabled();
    await userEvent.click(confirm);
    expect(onAcknowledge).toHaveBeenCalledTimes(1);
  });

  it('copia todos os códigos para a área de transferência', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', {...navigator, clipboard: {writeText}});

    renderDialog();
    fireEvent.click(screen.getByRole('button', {name: /copiar todos/i}));

    await waitFor(() => expect(writeText).toHaveBeenCalledTimes(1));
    expect(writeText).toHaveBeenCalledWith(CODES.join('\n'));
  });

  it('baixa um .txt contendo os códigos e revoga a object URL', async () => {
    const blobs: Blob[] = [];
    const createObjectURL = vi.fn((blob: Blob) => {
      blobs.push(blob);
      return 'blob:mock-url';
    });
    const revokeObjectURL = vi.fn();
    vi.stubGlobal('URL', {...URL, createObjectURL, revokeObjectURL});

    const clicks: HTMLAnchorElement[] = [];
    const clickSpy = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(function (this: HTMLAnchorElement) {
        clicks.push(this);
      });

    renderDialog();
    fireEvent.click(screen.getByRole('button', {name: /baixar \.txt/i}));

    expect(createObjectURL).toHaveBeenCalledTimes(1);
    expect(clicks[0].download).toMatch(/^trackerr-codigos-recuperacao-.*\.txt$/);
    expect(clicks[0].href).toBe('blob:mock-url');

    // O Blob do jsdom não implementa `.text()`; FileReader lê o conteúdo real.
    const content = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error);
      reader.readAsText(blobs[0]);
    });
    CODES.forEach((code) => expect(content).toContain(code));
    expect(blobs[0].type).toContain('text/plain');

    // A URL não pode ficar viva depois do download.
    await waitFor(() => expect(revokeObjectURL).toHaveBeenCalledWith('blob:mock-url'));

    clickSpy.mockRestore();
  });

  it('avisa que a lista anterior parou de funcionar ao regerar', () => {
    render(
      <RecoveryCodesDialog
        open
        codes={CODES}
        generatedAt={GENERATED_AT}
        isRegeneration
        onAcknowledge={vi.fn()}
      />,
    );
    expect(
      screen.getByText(/gerados anteriormente deixaram de funcionar/i),
    ).toBeInTheDocument();
  });
});
