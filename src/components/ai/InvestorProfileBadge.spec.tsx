import {describe, it, expect, vi} from 'vitest';
import {render, screen, fireEvent} from '@testing-library/react';
import {InvestorProfileBadge} from './InvestorProfileBadge';

describe('InvestorProfileBadge', () => {
  it('nao renderiza nada quando profile e null', () => {
    const {container} = render(
      <InvestorProfileBadge profile={null} onOverride={vi.fn()} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('mostra o rotulo do nivel calculado', () => {
    render(
      <InvestorProfileBadge
        profile={{
          sophistication: 'intermediate',
          riskTolerance: 'moderate',
          confidence: 0.9,
          signals: {},
          source: 'inferred',
        }}
        onOverride={vi.fn()}
      />,
    );
    expect(screen.getByText('Perfil: Intermediário')).toBeInTheDocument();
  });

  it('marca como sugerido quando confidence e baixa', () => {
    render(
      <InvestorProfileBadge
        profile={{
          sophistication: 'beginner',
          riskTolerance: 'conservative',
          confidence: 0.3,
          signals: {},
          source: 'inferred',
        }}
        onOverride={vi.fn()}
      />,
    );
    expect(screen.getByText('Perfil: Iniciante (sugerido)')).toBeInTheDocument();
  });

  it('chama onOverride ao escolher outro nivel no popover', () => {
    const onOverride = vi.fn();
    render(
      <InvestorProfileBadge
        profile={{
          sophistication: 'intermediate',
          riskTolerance: 'moderate',
          confidence: 0.9,
          signals: {},
          source: 'inferred',
        }}
        onOverride={onOverride}
      />,
    );
    fireEvent.click(screen.getByText('Perfil: Intermediário'));
    fireEvent.click(screen.getByText('Experiente'));
    expect(onOverride).toHaveBeenCalledWith({sophistication: 'experienced'});
  });
});
