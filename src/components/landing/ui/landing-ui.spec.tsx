import {describe, it, expect} from 'vitest';
import {render, screen} from '@testing-library/react';
import {Section} from './Section';
import {Eyebrow} from './Eyebrow';
import {GlassPanel} from './GlassPanel';
import {GridBackdrop} from './GridBackdrop';

describe('primitivos da landing', () => {
  it('Section renderiza um section com id e o conteúdo dentro do container', () => {
    const {container} = render(
      <Section id="planos">
        <p>conteudo</p>
      </Section>,
    );

    const section = container.querySelector('section');
    expect(section).not.toBeNull();
    expect(section?.id).toBe('planos');
    expect(screen.getByText('conteudo')).toBeInTheDocument();
  });

  it('Eyebrow renderiza o texto', () => {
    render(<Eyebrow>Gestão de carteira com IA</Eyebrow>);
    expect(screen.getByText('Gestão de carteira com IA')).toBeInTheDocument();
  });

  it('GlassPanel repassa className e children', () => {
    const {container} = render(
      <GlassPanel className="minha-classe">
        <span>painel</span>
      </GlassPanel>,
    );

    expect(screen.getByText('painel')).toBeInTheDocument();
    expect(container.firstElementChild?.className).toContain('minha-classe');
  });

  it('GridBackdrop é decorativo e escondido de leitores de tela', () => {
    const {container} = render(<GridBackdrop />);
    expect(container.firstElementChild?.getAttribute('aria-hidden')).toBe(
      'true',
    );
  });
});
