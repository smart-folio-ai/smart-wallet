import * as React from 'react';
import {cn} from '@/lib/utils';

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    value: string | number;
    name?: string;
    dataKey?: string;
    color?: string;
  }>;
  label?: string;
  className?: string;
  formatter?: (value: string | number, name: string) => [string, string];
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
        'relative min-w-[170px] rounded-2xl border border-white/10 bg-slate-900/88 px-4 py-3 text-sm font-medium text-slate-100 shadow-2xl backdrop-blur-xl',
        'before:absolute before:left-1/2 before:top-full before:-translate-x-1/2 before:border-[7px] before:border-transparent before:border-t-slate-900/85',
        className
      )}
      style={{
        boxShadow: '0 14px 28px rgba(2, 6, 23, 0.45)',
      }}>
      {label && (
        <p className="mb-2 border-b border-white/10 pb-2 text-base font-semibold text-white">
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
                  className="h-2.5 w-2.5 rounded-full border border-white/20"
                  style={{backgroundColor: entry.color}}
                />
                <span className="text-xs text-slate-300">
                  {formattedName}
                </span>
              </div>
              <span className="font-semibold text-white">
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
