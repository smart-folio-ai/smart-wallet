import * as React from 'react';
import {cn} from '@/lib/utils';

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
  className?: string;
  formatter?: (value: any, name: string) => [string, string];
  labelFormatter?: (label: string) => string;
}

export const CustomTooltip = React.forwardRef<
  HTMLDivElement,
  CustomTooltipProps
>(({active, payload, label, className, formatter, labelFormatter}, ref) => {
  if (!active || !payload || !payload.length) {
    return null;
  }

  return (
    <div
      ref={ref}
      className={cn(
        'bg-background/95 backdrop-blur-sm border border-border/50 rounded-xl shadow-lg px-4 py-3 text-sm font-medium text-foreground min-w-[120px]',
        'before:absolute before:top-full before:left-1/2 before:-translate-x-1/2 before:border-4 before:border-transparent before:border-t-background/95',
        className
      )}
      style={{
        filter: 'drop-shadow(0 4px 6px rgb(0 0 0 / 0.1))',
      }}>
      {label && (
        <p className="font-semibold text-base mb-2 text-foreground border-b border-border/30 pb-2">
          {labelFormatter ? labelFormatter(label) : label}
        </p>
      )}
      <div className="space-y-1">
        {payload.map((entry, index) => {
          const [formattedValue, formattedName] = formatter
            ? formatter(entry.value, entry.name || entry.dataKey)
            : [entry.value, entry.name || entry.dataKey];

          return (
            <div
              key={index}
              className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full border border-white/20"
                  style={{backgroundColor: entry.color}}
                />
                <span className="text-muted-foreground text-xs">
                  {formattedName}
                </span>
              </div>
              <span className="font-semibold text-foreground">
                {formattedValue}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
});

CustomTooltip.displayName = 'CustomTooltip';
