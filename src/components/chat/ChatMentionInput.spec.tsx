import {describe, it, expect, vi, beforeEach} from 'vitest';
import {render, screen, fireEvent, waitFor} from '@testing-library/react';
import {ChatMentionInput} from './ChatMentionInput';
import {autocompleteRiAssets} from '@/services/ri-intelligence';

vi.mock('@/services/ri-intelligence', () => ({
  autocompleteRiAssets: vi.fn(),
}));

describe('ChatMentionInput', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the current value in the input', () => {
    render(
      <ChatMentionInput value="olá" onValueChange={() => {}} onEnter={() => {}} />,
    );
    expect(screen.getByRole('textbox')).toHaveValue('olá');
  });

  it('shows a suggestion dropdown when typing @ followed by a query', async () => {
    (autocompleteRiAssets as any).mockResolvedValue([
      {ticker: 'WEGE3', company: 'WEG S.A.'},
      {ticker: 'WEGA4', company: 'WEG Alt'},
    ]);

    const handleChange = vi.fn();
    render(
      <ChatMentionInput value="" onValueChange={handleChange} onEnter={() => {}} />,
    );
    const input = screen.getByRole('textbox');
    fireEvent.change(input, {target: {value: '@weg'}});

    await waitFor(() => {
      expect(autocompleteRiAssets).toHaveBeenCalledWith('weg', expect.any(Number));
    });
    await waitFor(() => {
      expect(screen.getByText('WEGE3')).toBeInTheDocument();
      expect(screen.getByText('WEGA4')).toBeInTheDocument();
    });
  });

  it('inserts @TICKER at the cursor position when a suggestion is selected', async () => {
    (autocompleteRiAssets as any).mockResolvedValue([
      {ticker: 'WEGE3', company: 'WEG S.A.'},
    ]);

    const handleChange = vi.fn();
    render(
      <ChatMentionInput value="" onValueChange={handleChange} onEnter={() => {}} />,
    );
    const input = screen.getByRole('textbox') as HTMLInputElement;
    fireEvent.change(input, {target: {value: 'analise @weg'}});

    await waitFor(() => expect(screen.getByText('WEGE3')).toBeInTheDocument());
    fireEvent.click(screen.getByText('WEGE3'));

    expect(handleChange).toHaveBeenCalledWith('analise @WEGE3 ');
  });

  it('does not show a dropdown when there is no @ in the text', () => {
    render(
      <ChatMentionInput value="" onValueChange={() => {}} onEnter={() => {}} />,
    );
    const input = screen.getByRole('textbox');
    fireEvent.change(input, {target: {value: 'pergunta normal'}});
    expect(autocompleteRiAssets).not.toHaveBeenCalled();
  });

  it('calls onEnter when Enter is pressed', () => {
    const handleEnter = vi.fn();
    render(
      <ChatMentionInput value="pergunta" onValueChange={() => {}} onEnter={handleEnter} />,
    );
    fireEvent.keyDown(screen.getByRole('textbox'), {key: 'Enter'});
    expect(handleEnter).toHaveBeenCalled();
  });
});
