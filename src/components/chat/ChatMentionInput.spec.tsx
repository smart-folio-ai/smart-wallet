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

  it('moves the highlight with ArrowDown/ArrowUp among suggestions', async () => {
    (autocompleteRiAssets as any).mockResolvedValue([
      {ticker: 'WEGE3', company: 'WEG S.A.'},
      {ticker: 'WEGA4', company: 'WEG Alt'},
      {ticker: 'WEGB3', company: 'WEG B'},
    ]);

    render(
      <ChatMentionInput value="" onValueChange={() => {}} onEnter={() => {}} />,
    );
    const input = screen.getByRole('textbox');
    fireEvent.change(input, {target: {value: '@weg'}});
    await waitFor(() => expect(screen.getByText('WEGE3')).toBeInTheDocument());

    // First suggestion is highlighted by default.
    expect(screen.getByText('WEGE3').closest('button')).toHaveClass('bg-accent');

    fireEvent.keyDown(input, {key: 'ArrowDown'});
    expect(screen.getByText('WEGA4').closest('button')).toHaveClass('bg-accent');
    expect(screen.getByText('WEGE3').closest('button')).not.toHaveClass('bg-accent');

    fireEvent.keyDown(input, {key: 'ArrowDown'});
    expect(screen.getByText('WEGB3').closest('button')).toHaveClass('bg-accent');

    // Clamped at the last suggestion.
    fireEvent.keyDown(input, {key: 'ArrowDown'});
    expect(screen.getByText('WEGB3').closest('button')).toHaveClass('bg-accent');

    fireEvent.keyDown(input, {key: 'ArrowUp'});
    expect(screen.getByText('WEGA4').closest('button')).toHaveClass('bg-accent');
  });

  it('selects the highlighted suggestion on Enter and does not call onEnter', async () => {
    (autocompleteRiAssets as any).mockResolvedValue([
      {ticker: 'WEGE3', company: 'WEG S.A.'},
      {ticker: 'WEGA4', company: 'WEG Alt'},
    ]);

    const handleChange = vi.fn();
    const handleEnter = vi.fn();
    render(
      <ChatMentionInput
        value=""
        onValueChange={handleChange}
        onEnter={handleEnter}
      />,
    );
    const input = screen.getByRole('textbox');
    fireEvent.change(input, {target: {value: 'analise @weg'}});
    await waitFor(() => expect(screen.getByText('WEGE3')).toBeInTheDocument());

    fireEvent.keyDown(input, {key: 'ArrowDown'});
    fireEvent.keyDown(input, {key: 'Enter'});

    expect(handleChange).toHaveBeenCalledWith('analise @WEGA4 ');
    expect(handleEnter).not.toHaveBeenCalled();
  });

  it('still calls onEnter when Enter is pressed and the dropdown is closed (regression)', () => {
    const handleEnter = vi.fn();
    render(
      <ChatMentionInput value="pergunta" onValueChange={() => {}} onEnter={handleEnter} />,
    );
    const input = screen.getByRole('textbox');
    fireEvent.keyDown(input, {key: 'Enter'});
    expect(handleEnter).toHaveBeenCalledTimes(1);
  });

  it('returns focus to the input after selecting a suggestion by click', async () => {
    (autocompleteRiAssets as any).mockResolvedValue([
      {ticker: 'WEGE3', company: 'WEG S.A.'},
    ]);

    render(
      <ChatMentionInput value="" onValueChange={() => {}} onEnter={() => {}} />,
    );
    const input = screen.getByRole('textbox') as HTMLInputElement;
    fireEvent.change(input, {target: {value: '@weg'}});
    await waitFor(() => expect(screen.getByText('WEGE3')).toBeInTheDocument());

    fireEvent.click(screen.getByText('WEGE3'));

    await waitFor(() => expect(input).toHaveFocus());
  });
});
