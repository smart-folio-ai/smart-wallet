import {marketTape} from '../landing-data';
import {useMarquee} from '../motion/useMarquee';

/**
 * Fita de cotações. A lista é duplicada no DOM porque useMarquee desloca o
 * trilho por metade da largura — sem a duplicata apareceria vazio no meio.
 */
export function MarketTape() {
  const trackRef = useMarquee<HTMLDivElement>(55);
  const items = [...marketTape, ...marketTape];

  return (
    <div className="relative overflow-hidden border-y border-surface-hairline/[0.07] bg-surface-panel/60 py-5">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-0 z-10 w-32 bg-gradient-to-r from-surface-panel to-transparent"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 right-0 z-10 w-32 bg-gradient-to-l from-surface-panel to-transparent"
      />

      <div ref={trackRef} className="flex w-max gap-12">
        {items.map((item, index) => (
          <div
            key={`${item.symbol}-${index}`}
            className="flex items-center gap-3 whitespace-nowrap">
            <span className="font-heading text-sm font-semibold text-on-surface">
              {item.symbol}
            </span>
            <span className="text-sm tabular-nums text-on-surface-muted/60">
              {item.price}
            </span>
            <span
              className={`text-sm font-medium tabular-nums ${
                item.up ? 'text-positive' : 'text-negative'
              }`}>
              {item.change}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default MarketTape;
