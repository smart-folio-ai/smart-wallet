import {describe, it, expect, vi} from 'vitest';
import {render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {B3ImportGuideModal} from './B3ImportGuideModal';

describe('B3ImportGuideModal', () => {
  it('nomeia os três arquivos da B3 e onde encontrar cada um', () => {
    render(<B3ImportGuideModal open onOpenChange={() => {}} />);

    // Cada nome aparece no cartão e de novo na ordem recomendada.
    expect(screen.getAllByText('Relatório consolidado').length).toBe(2);
    expect(screen.getAllByText('Extrato de negociação').length).toBe(2);
    expect(screen.getAllByText('Extrato de movimentação').length).toBe(2);

    expect(
      screen.getByText('Extratos › Relatório consolidado'),
    ).toBeInTheDocument();
    expect(screen.getByText('Extratos › Negociação')).toBeInTheDocument();
    expect(screen.getByText('Extratos › Movimentação')).toBeInTheDocument();
  });

  it('diz que o PDF não funciona', () => {
    render(<B3ImportGuideModal open onOpenChange={() => {}} />);
    expect(screen.getByText(/o pdf do mesmo extrato não funciona/i)).toBeVisible();
  });

  it('responde a dúvida de precisar recriar a carteira', () => {
    render(<B3ImportGuideModal open onOpenChange={() => {}} />);
    expect(
      screen.getByText(/não precisa criar uma carteira nova nem apagar a atual/i),
    ).toBeVisible();
  });

  it('avisa que o consolidado não traz a data dos proventos', () => {
    render(<B3ImportGuideModal open onOpenChange={() => {}} />);
    expect(
      screen.getByText(/o arquivo não tem coluna de data/i),
    ).toBeInTheDocument();
  });

  it('dispara as ações de importar quando os callbacks existem', async () => {
    const onImportReport = vi.fn();
    const onGoToTransactions = vi.fn();
    render(
      <B3ImportGuideModal
        open
        onOpenChange={() => {}}
        onImportReport={onImportReport}
        onGoToTransactions={onGoToTransactions}
      />,
    );

    await userEvent.click(
      screen.getByRole('button', {name: /importar relatório ou movimentação/i}),
    );
    expect(onImportReport).toHaveBeenCalledTimes(1);

    await userEvent.click(
      screen.getByRole('button', {name: /importar negociações/i}),
    );
    expect(onGoToTransactions).toHaveBeenCalledTimes(1);
  });

  it('diz que o extrato de movimentação entra pelo mesmo botão do relatório', () => {
    render(<B3ImportGuideModal open onOpenChange={() => {}} />);

    // Sem isto o usuário procura um botão "Importar movimentação" que não
    // existe e conclui que o app não aceita o arquivo.
    expect(
      screen.getAllByText('Importar relatório').length,
    ).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText('Importar negociações').length).toBeGreaterThan(
      0,
    );
  });

  it('o botão principal nomeia os dois arquivos que aceita', async () => {
    const onImportReport = vi.fn();
    render(
      <B3ImportGuideModal
        open
        onOpenChange={() => {}}
        onImportReport={onImportReport}
      />,
    );

    await userEvent.click(
      screen.getByRole('button', {name: /importar relatório ou movimentação/i}),
    );
    expect(onImportReport).toHaveBeenCalledTimes(1);
  });

  it('não renderiza nada quando fechado', () => {
    render(<B3ImportGuideModal open={false} onOpenChange={() => {}} />);
    expect(screen.queryByText('Relatório consolidado')).not.toBeInTheDocument();
  });
});
