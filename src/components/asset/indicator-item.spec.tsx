import {describe, it, expect} from 'vitest';
import {render, screen} from '@testing-library/react';
import {
  IndicatorItem,
  INDICATOR_UNAVAILABLE_TEXT,
  INDICATOR_NOT_APPLICABLE_TEXT,
} from './indicator-item';

describe('IndicatorItem', () => {
  it('renderiza zero como valor, nao como ausencia', () => {
    render(
      <IndicatorItem
        label="MARGEM LÍQUIDA"
        status="ok"
        value={0}
        formatter={(v) => `${v.toFixed(1)}%`}
      />,
    );
    expect(screen.getByText('0.0%')).toBeInTheDocument();
    expect(screen.queryByText(INDICATOR_UNAVAILABLE_TEXT)).not.toBeInTheDocument();
  });

  it('mostra o traco quando o dado nao veio', () => {
    render(<IndicatorItem label="ROIC" status="unavailable" value={null} />);
    expect(screen.getByText(INDICATOR_UNAVAILABLE_TEXT)).toBeInTheDocument();
  });

  it('mostra "Não se aplica" quando o indicador nao existe no setor', () => {
    render(<IndicatorItem label="ROIC" status="not_applicable" value={null} />);
    expect(screen.getByText(INDICATOR_NOT_APPLICABLE_TEXT)).toBeInTheDocument();
    expect(screen.queryByText(INDICATOR_UNAVAILABLE_TEXT)).not.toBeInTheDocument();
  });

  it('distingue os dois textos de ausencia', () => {
    expect(INDICATOR_UNAVAILABLE_TEXT).not.toBe(INDICATOR_NOT_APPLICABLE_TEXT);
  });

  it('exibe a origem quando ha valor', () => {
    render(
      <IndicatorItem
        label="ROIC"
        status="ok"
        value={24.3}
        source="fundamentus"
        formatter={(v) => `${v.toFixed(1)}%`}
      />,
    );
    expect(screen.getByText(/fundamentus/i)).toBeInTheDocument();
  });

  it('nao exibe origem quando nao ha valor', () => {
    render(
      <IndicatorItem
        label="ROIC"
        status="unavailable"
        value={null}
        source="fundamentus"
      />,
    );
    expect(screen.queryByText(/fundamentus/i)).not.toBeInTheDocument();
  });

  it('o estado restrito vence os demais', () => {
    render(
      <IndicatorItem label="ROIC" status="ok" value={24.3} isRestricted />,
    );
    expect(screen.queryByText('24.3%')).not.toBeInTheDocument();
    expect(screen.queryByText('24.3')).not.toBeInTheDocument();
    expect(screen.getByText('EM BREVE')).toBeInTheDocument();
  });
});
