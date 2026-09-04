import {describe, it, expect} from 'vitest';
import {render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {DataTable} from './DataTable';

describe('DataTable header tooltips', () => {
  it('renders a tooltip button only for columns that declare one', () => {
    render(
      <DataTable
        columns={[
          {label: 'Ativo'},
          {
            label: 'Peso',
            align: 'right',
            tooltip: {
              title: 'Peso na carteira',
              body: 'Percentual do valor total.',
              formula: 'valor ÷ total',
            },
          },
        ]}>
        <tr>
          <td>PETR4</td>
          <td>10%</td>
        </tr>
      </DataTable>,
    );

    expect(screen.getByLabelText('O que é Peso?')).toBeInTheDocument();
    expect(screen.queryByLabelText('O que é Ativo?')).not.toBeInTheDocument();
    expect(screen.queryByText('Peso na carteira')).not.toBeInTheDocument();
  });

  it('opens the info popover on click and shows title, body and formula', async () => {
    const user = userEvent.setup();
    render(
      <DataTable
        columns={[
          {
            label: 'DY',
            align: 'right',
            tooltip: {
              title: 'Dividend Yield',
              body: 'Proventos 12m ÷ preço médio.',
              formula: 'proventos 12m ÷ preço médio',
            },
          },
        ]}>
        <tr>
          <td>—</td>
        </tr>
      </DataTable>,
    );

    await user.hover(screen.getByLabelText('O que é DY?'));
    expect(screen.getByText('Dividend Yield')).toBeInTheDocument();
    expect(screen.getByText('Proventos 12m ÷ preço médio.')).toBeInTheDocument();
    expect(screen.getByText('proventos 12m ÷ preço médio')).toBeInTheDocument();
  });
});
