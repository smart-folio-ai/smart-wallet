import {describe, it, expect} from 'vitest';
import {render, screen} from '@testing-library/react';
import {HowItWorksSection} from './HowItWorksSection';
import {TrustSection} from './TrustSection';

describe('HowItWorksSection', () => {
  it('ancora em #como-funciona e lista os três passos', () => {
    const {container} = render(<HowItWorksSection />);
    expect(container.querySelector('#como-funciona')).not.toBeNull();
    expect(screen.getByText('Conecte sua carteira')).toBeInTheDocument();
    expect(screen.getByText('A IA lê o contexto')).toBeInTheDocument();
    expect(screen.getByText('Decida com prioridade')).toBeInTheDocument();
  });
});

describe('TrustSection', () => {
  it('mostra os sinais de credibilidade', () => {
    render(<TrustSection />);
    expect(screen.getByText('B3 + NYSE')).toBeInTheDocument();
    expect(screen.getByText('AES-256')).toBeInTheDocument();
  });
});
