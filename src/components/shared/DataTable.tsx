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

export function DataTable({columns, children, minWidth = 600}: DataTableProps) {
  return (
    <div style={{overflowX: 'auto'}}>
      <table style={{width: '100%', minWidth, borderCollapse: 'collapse', fontSize: 12.5}}>
        <thead>
          <tr>
            {columns.map((c, i) => (
              <th key={i} style={{...TH_STYLE, textAlign: c.align ?? 'left'}}>{c.label}</th>
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
