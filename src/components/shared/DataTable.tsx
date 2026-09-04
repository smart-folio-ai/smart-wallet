import {useState} from 'react';
import {Info} from '@/components/ui/icons';

export interface DataTableColumn {
  label: string;
  align?: 'left' | 'right' | 'center';
  tooltip?: {title: string; body: string; formula?: string};
}

export interface DataTableProps {
  columns: DataTableColumn[];
  children: React.ReactNode;
  minWidth?: number;
}

const TH_STYLE: React.CSSProperties = {
  padding: '9.8px 16.8px',
  fontSize: 10.5,
  fontWeight: 500,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: 'var(--color-neutral-600)',
  whiteSpace: 'nowrap',
  borderBottom: '1px solid var(--hair-soft)',
};

function HeaderCell({column, index, total}: {column: DataTableColumn; index: number; total: number}) {
  const [open, setOpen] = useState(false);
  const align = column.align ?? 'left';
  const side = index >= total - 2 ? {right: 0} : {left: 0};

  const label = (
    <span style={{display: 'inline-flex', alignItems: 'center', gap: 5.6}}>
      {column.label}
      {column.tooltip ? (
        <button
          type="button"
          aria-label={`O que é ${column.label}?`}
          onMouseEnter={() => setOpen(true)}
          onMouseLeave={() => setOpen(false)}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          onClick={(e) => {
            e.stopPropagation();
            setOpen((v) => !v);
          }}
          style={{
            width: 14,
            height: 14,
            borderRadius: 4,
            border: '1px solid var(--hair)',
            background: 'transparent',
            color: 'var(--color-neutral-500)',
            cursor: 'help',
            display: 'grid',
            placeItems: 'center',
            padding: 0,
          }}>
          <Info style={{width: 9, height: 9}} weight="fill" />
        </button>
      ) : null}
    </span>
  );

  return (
    <th style={{...TH_STYLE, textAlign: align, position: 'relative'}}>
      {label}
      {open && column.tooltip ? (
        <div
          style={{
            position: 'absolute',
            top: 28,
            zIndex: 60,
            width: 284,
            border: '1px solid rgba(145,132,217,0.35)',
            borderRadius: 8,
            background: 'var(--surf-4, var(--nk-card))',
            boxShadow: 'var(--shadow-lg, 0 20px 40px rgba(0,0,0,0.35))',
            padding: '11.2px 14px',
            textTransform: 'none',
            letterSpacing: 0,
            fontWeight: 400,
            ...side,
          }}>
          <div style={{fontSize: 12.5, fontWeight: 600, color: 'var(--color-neutral-100)'}}>{column.tooltip.title}</div>
          <div style={{fontSize: 12, color: 'var(--color-neutral-400)', lineHeight: 1.55, marginTop: 5.6}}>
            {column.tooltip.body}
          </div>
          {column.tooltip.formula ? (
            <div
              style={{
                fontSize: 11,
                color: 'var(--color-accent-300, var(--brand))',
                marginTop: 8.4,
                paddingTop: 8.4,
                borderTop: '1px solid var(--hair-soft)',
                lineHeight: 1.45,
              }}>
              {column.tooltip.formula}
            </div>
          ) : null}
        </div>
      ) : null}
    </th>
  );
}

export function DataTable({columns, children, minWidth = 600}: DataTableProps) {
  return (
    <div style={{overflowX: 'auto'}}>
      <table style={{width: '100%', minWidth, borderCollapse: 'collapse', fontSize: 12.5}}>
        <thead>
          <tr>
            {columns.map((c, i) => (
              <HeaderCell key={i} column={c} index={i} total={columns.length} />
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

export const TR_HOVER_STYLE = 'border-top: 1px solid var(--hair-soft);';
export const TD_STYLE: React.CSSProperties = {padding: '9.8px 16.8px'};
export const TD_RIGHT: React.CSSProperties = {padding: '9.8px 16.8px', textAlign: 'right', fontVariantNumeric: 'tabular-nums'};
