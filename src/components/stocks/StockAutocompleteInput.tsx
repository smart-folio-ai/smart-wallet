import {useEffect, useMemo, useRef, useState} from 'react';
import {Input} from '@/components/ui/input';
import {Button} from '@/components/ui/button';
import {TrendingUp, X} from 'lucide-react';
import {formatCurrency} from '@/utils/formatters';
import {filterAndSortStockSuggestions} from '@/components/stocks/stock-autocomplete.utils';

export type StockAutocompleteItem = {
  stock: string;
  name: string;
  close: number;
  change: number;
  logo?: string;
  type?: string;
};

type Props = {
  value: string;
  stocks: StockAutocompleteItem[];
  placeholder?: string;
  onValueChange: (value: string) => void;
  onSelect: (stock: StockAutocompleteItem) => void;
  onEnter?: () => void;
};

export function StockAutocompleteInput({
  value,
  stocks,
  placeholder,
  onValueChange,
  onSelect,
  onEnter,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const normalized = String(value || '').toUpperCase();

  const suggestions = useMemo(
    () => filterAndSortStockSuggestions(stocks, normalized, 7),
    [stocks, normalized],
  );

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <Input
        value={normalized}
        placeholder={placeholder}
        onChange={(e) => {
          onValueChange(e.target.value.toUpperCase());
          setShowSuggestions(true);
        }}
        onFocus={() => normalized && setShowSuggestions(true)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && onEnter) {
            e.preventDefault();
            onEnter();
          }
        }}
      />
      {normalized ? (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute right-1 top-1 h-8 w-8"
          onClick={() => {
            onValueChange('');
            setShowSuggestions(false);
          }}>
          <X className="h-3.5 w-3.5" />
        </Button>
      ) : null}

      {showSuggestions && suggestions.length > 0 ? (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-border bg-card shadow-xl overflow-hidden">
          {suggestions.map((item) => (
            <button
              key={item.stock}
              type="button"
              className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-primary/10 transition-colors text-left"
              onMouseDown={() => {
                onSelect(item);
                setShowSuggestions(false);
              }}>
              {item.logo ? (
                <img
                  src={item.logo}
                  alt={item.stock}
                  className="h-7 w-7 rounded-full object-cover border border-border"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="h-3.5 w-3.5 text-primary" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">{item.stock}</p>
                <p className="text-xs text-muted-foreground truncate">{item.name}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-xs font-medium">{formatCurrency(item.close || 0)}</p>
                <p className={`text-xs ${item.change >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                  {item.change >= 0 ? '+' : ''}
                  {(item.change || 0).toFixed(2)}%
                </p>
              </div>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
