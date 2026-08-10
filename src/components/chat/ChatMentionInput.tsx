import {useEffect, useRef, useState} from 'react';
import {Input} from '@/components/ui/input';
import {autocompleteRiAssets} from '@/services/ri-intelligence';
import {RiAssetSuggestion} from '@/interface/ri-intelligence';

type ChatMentionInputProps = {
  value: string;
  onValueChange: (value: string) => void;
  onEnter: () => void;
  placeholder?: string;
  disabled?: boolean;
};

function findActiveMention(
  text: string,
  cursorIndex: number,
): {start: number; query: string} | null {
  const upToCursor = text.slice(0, cursorIndex);
  const atIndex = upToCursor.lastIndexOf('@');
  if (atIndex === -1) return null;

  const afterAt = upToCursor.slice(atIndex + 1);
  // A space (or another @) between the last @ and the cursor means we're no
  // longer inside a mention being typed.
  if (/[\s@]/.test(afterAt)) return null;

  return {start: atIndex, query: afterAt};
}

export function ChatMentionInput({
  value,
  onValueChange,
  onEnter,
  placeholder,
  disabled,
}: ChatMentionInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const requestSeqRef = useRef(0);
  const [text, setText] = useState(value);
  const [suggestions, setSuggestions] = useState<RiAssetSuggestion[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [mentionStart, setMentionStart] = useState<number | null>(null);

  // Keep the local, immediately-editable text in sync with the controlled
  // `value` prop whenever the parent updates it (including externally, e.g.
  // when the parent clears the input after sending a message).
  useEffect(() => {
    setText(value);
  }, [value]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const newValue = e.target.value;
    const cursor = e.target.selectionStart ?? newValue.length;
    setText(newValue);
    onValueChange(newValue);

    const mention = findActiveMention(newValue, cursor);
    if (!mention) {
      requestSeqRef.current += 1;
      setShowDropdown(false);
      setSuggestions([]);
      setMentionStart(null);
      return;
    }
    setMentionStart(mention.start);
    const requestId = ++requestSeqRef.current;
    autocompleteRiAssets(mention.query, 8).then((results) => {
      // Ignore stale responses from a previous, since-superseded keystroke.
      if (requestId !== requestSeqRef.current) return;
      setSuggestions(results);
      setShowDropdown(results.length > 0);
    });
  }

  function selectSuggestion(suggestion: RiAssetSuggestion) {
    if (mentionStart === null) return;
    const cursor = inputRef.current?.selectionStart ?? text.length;
    const before = text.slice(0, mentionStart);
    const after = text.slice(cursor);
    const inserted = `@${suggestion.ticker} `;
    const updated = `${before}${inserted}${after}`;
    setText(updated);
    onValueChange(updated);
    setShowDropdown(false);
  }

  return (
    <div ref={containerRef} className="relative flex-1">
      <Input
        ref={inputRef}
        value={text}
        placeholder={placeholder}
        disabled={disabled}
        onChange={handleChange}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !showDropdown) {
            e.preventDefault();
            onEnter();
          }
          if (e.key === 'Escape') {
            setShowDropdown(false);
          }
        }}
        aria-label="Pergunta do chat"
      />
      {showDropdown && (
        <div className="absolute bottom-full left-0 z-10 mb-1 w-72 rounded-md border border-border bg-popover shadow-md">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion.ticker}
              type="button"
              className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-accent"
              onClick={() => selectSuggestion(suggestion)}>
              <span className="font-medium">{suggestion.ticker}</span>
              <span className="ml-2 truncate text-xs text-muted-foreground">
                {suggestion.company}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
