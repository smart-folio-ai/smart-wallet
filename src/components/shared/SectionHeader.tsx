export interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export function SectionHeader({title, subtitle, action}: SectionHeaderProps) {
  return (
    <div style={{padding: '14px 16.8px', borderBottom: '1px solid var(--hair-soft)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 11.2}}>
      <div>
        <div style={{fontFamily: 'var(--font-heading)', fontSize: 14, fontWeight: 600}}>{title}</div>
        {subtitle && <div style={{fontSize: 11, color: 'var(--color-neutral-600)', marginTop: 2}}>{subtitle}</div>}
      </div>
      {action}
    </div>
  );
}
