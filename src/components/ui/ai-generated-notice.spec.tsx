import {describe, it, expect} from 'vitest';
import {render, screen} from '@testing-library/react';
import {
  AiGeneratedNotice,
  AI_GENERATED_NOTICE_TEXT,
} from './ai-generated-notice';

describe('AiGeneratedNotice', () => {
  it('renderiza a frase de transparência exata', () => {
    render(<AiGeneratedNotice />);

    expect(
      screen.getByText(
        'Esse texto foi gerado com o auxílio de inteligência artificial.',
      ),
    ).toBeInTheDocument();
  });

  it('exporta a mesma frase que renderiza', () => {
    render(<AiGeneratedNotice />);

    expect(screen.getByText(AI_GENERATED_NOTICE_TEXT)).toBeInTheDocument();
  });

  it('aceita className adicional sem perder as classes próprias', () => {
    const {container} = render(<AiGeneratedNotice className="mt-8" />);
    const el = container.firstElementChild as HTMLElement;

    expect(el.className).toContain('mt-8');
    expect(el.className).toContain('text-muted-foreground');
  });
});
