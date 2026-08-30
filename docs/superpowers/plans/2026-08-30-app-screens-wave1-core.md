# App Screens Wave 1 — Core Financial Screens Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rewrite the JSX of 6 core financial screens (Dashboard, Portfolio, Dividendos, Asset Detail, Transações, Adicionar Ativo) to match the Nocturne handoff pixel-for-pixel, preserving 100% of existing logic.

**Architecture:** One preparatory task (CSS tokens + shared components) followed by one task per screen. All logic (hooks, react-query, utils, services) is untouched — only the JSX returned by each component changes. Shared primitives are extracted first to avoid duplication across screens.

**Tech Stack:** React 18, TypeScript, Tailwind CSS v3, shadcn/ui, Phosphor Icons (`@phosphor-icons/web`), react-query, react-router-dom, Recharts (existing charts preserved where convenient, replaced with inline SVG where handoff diverges significantly).

## Global Constraints

- **Zero hardcoded colors** outside of `rgba(145,132,217,…)` violet values documented in handoff
- **Phosphor icons only** in new/rewritten JSX (`ph ph-*`, `ph-fill ph-*`); existing Lucide imports untouched if logic stays
- **`font-variant-numeric: tabular-nums`** on every financial number
- **`font-family: var(--font-heading)`** on headings and large values
- **Logic untouched:** no new hooks, no new API calls, no new react-query queries — only JSX changes
- **No `useEffect` added** — use react-query staleTime/refetch instead
- All Nocturne tokens used via CSS vars, never hardcoded
- `npm run type-check` passes before every commit
- `npm run lint` passes before every commit
- `npm run test:unit` passes before every commit
- `npm run build` passes at end of each task
- Full Playwright suite runs after Task 8 — fix any broken selectors before PR

---

### Task 1: CSS Token Bridge + Shared Primitive Components

**Files:**
- Modify: `src/index.css`
- Create: `src/components/shared/KpiCard.tsx`
- Create: `src/components/shared/SectionHeader.tsx`
- Create: `src/components/shared/AiInsightBanner.tsx`
- Create: `src/components/shared/PeriodSelector.tsx`
- Create: `src/components/shared/DataTable.tsx`
- Create: `src/components/shared/index.ts`
- Create: `src/components/shared/KpiCard.spec.tsx`
- Create: `src/components/shared/SectionHeader.spec.tsx`
- Create: `src/components/shared/AiInsightBanner.spec.tsx`

**Interfaces:**
- Produces: all 5 shared components, importable via `@/components/shared`
- Produces: all Nocturne CSS tokens available globally via `var(--pos)`, `var(--neg)`, `var(--grad-violet)`, etc.

---

- [ ] **Step 1: Add Nocturne raw tokens to `src/index.css`**

  Add after the last existing `:root { … }` block (after `--chart-5`), BEFORE the `.dark { … }` block:

  ```css
  /* ──────────────────────────────────────────────────────────────
   * Nocturne raw design tokens (light mode values)
   * These power handoff-style components alongside shadcn tokens.
   * ────────────────────────────────────────────────────────────── */
  :root {
    --pos: #0e9873;
    --neg: #cf1e42;
    --warn: #9a6a06;
    --cy: #1a7ba6;
    --ac: #6f5ed9;
    --ac-soft: #5d5294;
    --ac-strong: #6f5ed9;
    --rgb-bg: 236,237,245;
    --rgb-surf: 255,255,255;
    --rgb-surf-2: 253,253,255;
    --rgb-line: 26,27,36;
    --rgb-accent-deep: 209,203,247;
    --rgb-deep: 32,33,45;
    --surf: #fdfdff;
    --surf-2: #f7f7fc;
    --surf-3: #f1f1f8;
    --surf-4: #fafaff;
    --sunk: #ebecf3;
    --bg-solid: #f4f4f9;
    --neb-1: #e6e2f8;
    --neb-2: #e3e7fb;
    --nk-card: linear-gradient(180deg, var(--surf) 0%, var(--surf-2) 100%);
    --grad-aurora: linear-gradient(120deg, var(--ac) 0%, var(--cy) 58%, var(--pos) 100%);
    --grad-violet: linear-gradient(140deg, var(--ac-strong) 0%, var(--ac-soft) 100%);
    --grad-ember: linear-gradient(120deg, var(--warn) 0%, var(--neg) 100%);
    --hair: rgba(var(--rgb-line),0.13);
    --hair-soft: rgba(var(--rgb-line),0.07);
    --shadow-lg: 0 16px 48px rgba(0,0,0,0.15);
    --color-bg: #f4f4f9;
    --color-text: #1a1b24;
    --color-neutral-100: #292b31;
    --color-neutral-200: #3f424d;
    --color-neutral-300: #595d6c;
    --color-neutral-400: #6b6f81;
    --color-neutral-500: #7d8194;
    --color-neutral-600: #8b8fa2;
    --color-neutral-700: #b2b6ca;
    --color-accent: #6f5ed9;
    --color-accent-100: #2b2741;
    --color-accent-200: #423a6a;
    --color-accent-300: #5d5294;
    --color-accent-400: #796cbf;
    --color-accent-600: #b5abfc;
    --color-accent-700: rgba(111,94,217,0.25);
    --color-accent-800: rgba(111,94,217,0.15);
  }
  ```

  Add inside the existing `.dark { … }` block (append before closing `}`):

  ```css
    /* Nocturne raw design tokens (dark mode values) */
    --pos: #2fd6a3;
    --neg: #f2506b;
    --warn: #f0b32e;
    --cy: #4cc9f0;
    --ac: #9184d9;
    --ac-soft: #b5abfc;
    --ac-strong: #6f5ed9;
    --rgb-bg: 22,24,38;
    --rgb-surf: 35,37,50;
    --rgb-surf-2: 30,32,48;
    --rgb-line: 233,233,237;
    --rgb-accent-deep: 66,58,106;
    --rgb-deep: 12,13,22;
    --surf: #232532;
    --surf-2: #1e2030;
    --surf-3: #1c1e2c;
    --surf-4: #20222f;
    --sunk: #14161f;
    --bg-solid: #161826;
    --neb-1: #2b2741;
    --neb-2: #232752;
    --nk-card: linear-gradient(180deg, var(--surf) 0%, var(--surf-2) 100%);
    --grad-aurora: linear-gradient(120deg, var(--ac) 0%, var(--cy) 58%, var(--pos) 100%);
    --grad-violet: linear-gradient(140deg, var(--ac-strong) 0%, var(--ac-soft) 100%);
    --grad-ember: linear-gradient(120deg, var(--warn) 0%, var(--neg) 100%);
    --hair: rgba(var(--rgb-line),0.10);
    --hair-soft: rgba(var(--rgb-line),0.06);
    --shadow-lg: 0 16px 48px rgba(0,0,0,0.38);
    --color-bg: #161826;
    --color-text: #e8e9f2;
    --color-neutral-100: #e8e9f2;
    --color-neutral-200: #c8cad8;
    --color-neutral-300: #a5a8bc;
    --color-neutral-400: #7e8199;
    --color-neutral-500: #5e6175;
    --color-neutral-600: #464959;
    --color-neutral-700: #333548;
    --color-accent: #9184d9;
    --color-accent-100: #c5c0f8;
    --color-accent-200: #b5abfc;
    --color-accent-300: #9a8ef5;
    --color-accent-400: #8578e8;
    --color-accent-600: #5244c0;
    --color-accent-700: rgba(145,132,217,0.25);
    --color-accent-800: rgba(145,132,217,0.15);
  ```

- [ ] **Step 2: Create `src/components/shared/KpiCard.tsx`**

  ```tsx
  import {useState} from 'react';

  interface KpiTooltip {
    title: string;
    body: string;
    formula?: string;
    side?: string;
  }

  export interface KpiCardProps {
    label: string;
    value: string;
    delta?: string;
    deltaStyle?: React.CSSProperties;
    sub?: string;
    tooltip?: KpiTooltip;
  }

  export function KpiCard({label, value, delta, deltaStyle, sub, tooltip}: KpiCardProps) {
    const [tipOpen, setTipOpen] = useState(false);
    return (
      <div style={{border: '1px solid var(--hair)', borderRadius: 8, padding: '14px 16.8px', background: 'var(--nk-card)', position: 'relative'}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 5.6}}>
          <span style={{fontSize: 10.5, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-neutral-600)'}}>
            {label}
          </span>
          {tooltip && (
            <button
              type="button"
              onMouseEnter={() => setTipOpen(true)}
              onMouseLeave={() => setTipOpen(false)}
              onFocus={() => setTipOpen(true)}
              onBlur={() => setTipOpen(false)}
              onClick={() => setTipOpen((v) => !v)}
              aria-label="O que é isso?"
              style={{width: 15, height: 15, flexShrink: 0, borderRadius: 4, border: '1px solid var(--hair)', background: 'transparent', color: 'var(--color-neutral-500)', cursor: 'help', display: 'grid', placeItems: 'center', padding: 0}}
            >
              <i className="ph-fill ph-info" style={{fontSize: 10}} />
            </button>
          )}
        </div>
        {tooltip && tipOpen && (
          <div style={{position: 'absolute', top: 34, left: tooltip.side === 'right' ? 'auto' : 0, right: tooltip.side === 'right' ? 0 : 'auto', zIndex: 60, width: 292, maxWidth: 'calc(100vw - 300px)', border: '1px solid rgba(145,132,217,0.35)', borderRadius: 8, background: 'var(--surf-4)', boxShadow: 'var(--shadow-lg)', padding: '11.2px 14px'}}>
            <div style={{fontSize: 12.5, fontWeight: 600, color: 'var(--color-neutral-100)'}}>{tooltip.title}</div>
            <div style={{fontSize: 12, color: 'var(--color-neutral-400)', lineHeight: 1.55, marginTop: 5.6}}>{tooltip.body}</div>
            {tooltip.formula && (
              <div style={{fontSize: 11, color: 'var(--color-accent-300)', marginTop: 8.4, paddingTop: 8.4, borderTop: '1px solid var(--hair-soft)', lineHeight: 1.45}}>
                {tooltip.formula}
              </div>
            )}
          </div>
        )}
        <div style={{fontFamily: 'var(--font-heading)', fontSize: 23, fontWeight: 600, letterSpacing: '-0.02em', marginTop: 8.4, fontVariantNumeric: 'tabular-nums'}}>
          {value}
        </div>
        {(delta || sub) && (
          <div style={{display: 'flex', alignItems: 'center', gap: 5.6, marginTop: 5.6, fontSize: 11.5}}>
            {delta && <span style={deltaStyle}>{delta}</span>}
            {sub && <span style={{color: 'var(--color-neutral-600)'}}>{sub}</span>}
          </div>
        )}
      </div>
    );
  }
  ```

- [ ] **Step 3: Create `src/components/shared/SectionHeader.tsx`**

  ```tsx
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
  ```

- [ ] **Step 4: Create `src/components/shared/AiInsightBanner.tsx`**

  ```tsx
  export interface AiInsightBannerProps {
    text: string;
    meta?: string;
    actionLabel?: string;
    onAction?: () => void;
  }

  export function AiInsightBanner({text, meta, actionLabel, onAction}: AiInsightBannerProps) {
    return (
      <div style={{display: 'flex', alignItems: 'flex-start', gap: 11.2, border: '1px solid rgba(145,132,217,0.28)', borderRadius: 8, padding: '11.2px 16.8px', background: 'linear-gradient(100deg, rgba(var(--rgb-accent-deep),0.42), rgba(var(--rgb-surf),0.30))'}}>
        <i className="ph-fill ph-sparkle" style={{fontSize: 16, color: 'var(--color-accent-300)', marginTop: 1, flexShrink: 0}} />
        <div style={{flex: 1, minWidth: 0}}>
          <div style={{fontSize: 12.5, color: 'var(--color-neutral-200)', lineHeight: 1.5}}>{text}</div>
          {meta && <div style={{fontSize: 11, color: 'var(--color-neutral-500)', marginTop: 2.8}}>{meta}</div>}
        </div>
        {actionLabel && onAction && (
          <button
            type="button"
            onClick={onAction}
            style={{height: 26, padding: '0 8.4px', border: '1px solid var(--hair)', borderRadius: 6, background: 'transparent', color: 'var(--color-neutral-400)', fontSize: 11, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'var(--font-body)'}}
          >
            {actionLabel}
          </button>
        )}
      </div>
    );
  }
  ```

- [ ] **Step 5: Create `src/components/shared/PeriodSelector.tsx`**

  ```tsx
  export interface PeriodOption {
    label: string;
    value: string;
  }

  export interface PeriodSelectorProps {
    periods: PeriodOption[];
    value: string;
    onChange: (v: string) => void;
  }

  export function PeriodSelector({periods, value, onChange}: PeriodSelectorProps) {
    return (
      <div style={{display: 'flex', padding: 2.8, gap: 2.8, border: '1px solid var(--hair)', borderRadius: 8}}>
        {periods.map((p) => (
          <button
            key={p.value}
            type="button"
            onClick={() => onChange(p.value)}
            style={value === p.value
              ? {height: 28, padding: '0 10px', fontSize: 12, border: 'none', borderRadius: 6, background: 'var(--nk-card)', color: 'var(--color-neutral-100)', boxShadow: '0 1px 3px rgba(0,0,0,0.18)', cursor: 'pointer', fontFamily: 'var(--font-body)'}
              : {height: 28, padding: '0 10px', fontSize: 12, border: 'none', borderRadius: 6, background: 'transparent', color: 'var(--color-neutral-500)', cursor: 'pointer', fontFamily: 'var(--font-body)'}}
          >
            {p.label}
          </button>
        ))}
      </div>
    );
  }
  ```

- [ ] **Step 6: Create `src/components/shared/DataTable.tsx`**

  ```tsx
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
  ```

- [ ] **Step 7: Create `src/components/shared/index.ts`**

  ```ts
  export {KpiCard} from './KpiCard';
  export type {KpiCardProps} from './KpiCard';
  export {SectionHeader} from './SectionHeader';
  export type {SectionHeaderProps} from './SectionHeader';
  export {AiInsightBanner} from './AiInsightBanner';
  export type {AiInsightBannerProps} from './AiInsightBanner';
  export {PeriodSelector} from './PeriodSelector';
  export type {PeriodSelectorProps, PeriodOption} from './PeriodSelector';
  export {DataTable, TD_STYLE, TD_RIGHT} from './DataTable';
  export type {DataTableProps, DataTableColumn} from './DataTable';
  ```

- [ ] **Step 8: Write failing tests in `src/components/shared/KpiCard.spec.tsx`**

  ```tsx
  import {render, screen, fireEvent} from '@testing-library/react';
  import {KpiCard} from './KpiCard';

  test('renders label and value', () => {
    render(<KpiCard label="Patrimônio" value="R$ 100.000" />);
    expect(screen.getByText('Patrimônio')).toBeInTheDocument();
    expect(screen.getByText('R$ 100.000')).toBeInTheDocument();
  });

  test('renders delta and sub when provided', () => {
    render(<KpiCard label="P&L" value="+R$ 5.000" delta="+12,3%" sub="no período" />);
    expect(screen.getByText('+12,3%')).toBeInTheDocument();
    expect(screen.getByText('no período')).toBeInTheDocument();
  });

  test('tooltip shows on hover', () => {
    render(<KpiCard label="Beta" value="0,82" tooltip={{title: 'Beta', body: 'Medida de volatilidade'}} />);
    const btn = screen.getByRole('button', {name: 'O que é isso?'});
    fireEvent.mouseEnter(btn);
    expect(screen.getByText('Medida de volatilidade')).toBeInTheDocument();
    fireEvent.mouseLeave(btn);
    expect(screen.queryByText('Medida de volatilidade')).not.toBeInTheDocument();
  });
  ```

- [ ] **Step 9: Write tests for SectionHeader and AiInsightBanner in `src/components/shared/SectionHeader.spec.tsx`**

  ```tsx
  import {render, screen, fireEvent} from '@testing-library/react';
  import {SectionHeader} from './SectionHeader';
  import {AiInsightBanner} from './AiInsightBanner';

  test('SectionHeader renders title and subtitle', () => {
    render(<SectionHeader title="Evolução" subtitle="Base 100" />);
    expect(screen.getByText('Evolução')).toBeInTheDocument();
    expect(screen.getByText('Base 100')).toBeInTheDocument();
  });

  test('SectionHeader renders action slot', () => {
    render(<SectionHeader title="X" action={<button>Filtrar</button>} />);
    expect(screen.getByRole('button', {name: 'Filtrar'})).toBeInTheDocument();
  });

  test('AiInsightBanner renders text and action button', () => {
    const onAction = vi.fn();
    render(<AiInsightBanner text="Cobertura 41%" actionLabel="Abrir planejamento" onAction={onAction} />);
    expect(screen.getByText('Cobertura 41%')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', {name: 'Abrir planejamento'}));
    expect(onAction).toHaveBeenCalledOnce();
  });
  ```

- [ ] **Step 10: Run tests**

  ```bash
  npm run test:unit -- --reporter=verbose src/components/shared
  ```

  Expected: all 6 tests pass.

- [ ] **Step 11: Type-check and lint**

  ```bash
  npm run type-check && npm run lint
  ```

- [ ] **Step 12: Commit**

  ```bash
  git add src/index.css src/components/shared/
  git commit -m "feat(web): add Nocturne CSS token bridge and shared primitive components"
  ```

---

### Task 2: Dashboard Rewrite (`src/pages/Index.tsx`)

**Files:**
- Modify: `src/pages/Index.tsx`

**Interfaces:**
- Consumes: `KpiCard`, `SectionHeader`, `AiInsightBanner`, `PeriodSelector`, `DataTable` from `@/components/shared`
- Consumes: `useAdaptiveLevel` from `@/contexts/AdaptiveLevelContext` (existing)
- Consumes: `useDashboardSummary`-equivalent query via `portfolioService` (existing pattern)
- Preserves: all existing imports for data/logic; removes all Recharts/shadcn UI imports only if replaced

**Key layout (replace the return JSX, keep all hooks/logic above):**

```tsx
return (
  <div style={{display: 'flex', flexDirection: 'column', gap: 16.8}}>
    {/* 1. Adaptive level banner */}
    <AiInsightBanner
      text={levelHint}
      meta={levelMeta}
      actionLabel="Como a IA decidiu"
      onAction={() => {/* existing handler or no-op */}}
    />

    {/* 2. 4 KPI cards */}
    <div style={{display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: 11.2}}>
      <KpiCard label="Patrimônio total" value={formatCurrency(summary.totalValue)} delta={...} sub="total investido" />
      <KpiCard label="P&L do período" value={...} delta={...} sub="desde preço médio" tooltip={{title:'P&L', body:'Ganho/perda realizado + não realizado', formula:'(Cotação - PM) × Qtd'}} />
      <KpiCard label="Dividendos recebidos" value={...} delta={...} sub="últimos 12 meses" />
      <KpiCard label="Beta da carteira" value={...} sub="vs IBOV" tooltip={{title:'Beta', body:'Sensibilidade da carteira ao índice de referência', formula:'β = Cov(carteira, IBOV) / Var(IBOV)'}} />
    </div>

    {/* 3. Quant bar (intermediário/avançado only) */}
    {level !== 'iniciante' && (
      <div style={{display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0,1fr))', gap: 1, border: '1px solid var(--hair)', borderRadius: 8, background: 'var(--hair-soft)', overflow: 'hidden'}}>
        {quantMetrics.map((q) => (
          <div key={q.label} style={{padding: '11.2px 16.8px', background: 'var(--surf-3)'}}>
            <div style={{fontSize: 10.5, color: 'var(--color-neutral-600)', letterSpacing: '0.08em', textTransform: 'uppercase'}}>{q.label}</div>
            <div style={{fontSize: 16, fontWeight: 600, marginTop: 5.6, fontVariantNumeric: 'tabular-nums', color: 'var(--color-neutral-100)'}}>{q.value}</div>
            <div style={{fontSize: 10.5, color: 'var(--color-neutral-600)', marginTop: 2.8}}>{q.note}</div>
          </div>
        ))}
      </div>
    )}

    {/* 4. Evolução + Alocação */}
    <div style={{display: 'grid', gridTemplateColumns: 'minmax(0,1.9fr) minmax(0,1fr)', gap: 16.8}}>
      <section style={{border: '1px solid var(--hair)', borderRadius: 8, background: 'var(--nk-card)', display: 'flex', flexDirection: 'column'}}>
        <SectionHeader
          title="Evolução patrimonial"
          subtitle="Base 100 · carteira vs IBOV vs CDI · 12 meses"
          action={<PeriodSelector periods={PERIODS} value={period} onChange={setPeriod} />}
        />
        <div style={{padding: 16.8}}>
          {/* Chart legend */}
          <div style={{display: 'flex', gap: 16.8, marginBottom: 11.2}}>
            {chartLegend.map((l) => (
              <div key={l.label} style={{display: 'flex', alignItems: 'center', gap: 5.6, fontSize: 11, color: 'var(--color-neutral-400)'}}>
                <span style={{width: 8, height: 8, borderRadius: '50%', background: l.color, flexShrink: 0}} />
                <span>{l.label}</span>
                <span style={{color: l.positive ? 'var(--pos)' : 'var(--neg)'}}>{l.value}</span>
              </div>
            ))}
          </div>
          {/* Keep existing Recharts chart or replace with SVG polyline — preserve data source */}
          <ResponsiveContainer width="100%" height={200}>
            {/* existing chart JSX preserved, only colors updated to use Nocturne tokens */}
          </ResponsiveContainer>
        </div>
      </section>

      <section style={{border: '1px solid var(--hair)', borderRadius: 8, background: 'var(--nk-card)', display: 'flex', flexDirection: 'column'}}>
        <SectionHeader title="Alocação" subtitle={allocSub} />
        <div style={{padding: 16.8, display: 'flex', flexDirection: 'column', gap: 16.8}}>
          {/* existing donut chart preserved */}
          {/* allocation list */}
          <div style={{display: 'flex', flexDirection: 'column', gap: 8.4}}>
            {allocation.map((a) => (
              <div key={a.label} style={{display: 'flex', alignItems: 'center', gap: 8.4, fontSize: 12}}>
                <span style={{width: 8, height: 8, borderRadius: 2, background: a.color, flexShrink: 0}} />
                <span style={{flex: 1, color: 'var(--color-neutral-400)'}}>{a.label}</span>
                <span style={{fontVariantNumeric: 'tabular-nums', color: 'var(--color-neutral-300)'}}>{a.pct}</span>
                <span style={{fontVariantNumeric: 'tabular-nums', color: 'var(--color-neutral-500)'}}>{a.value}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>

    {/* 5. IA Insights */}
    <section style={{border: '1px solid var(--hair)', borderRadius: 8, background: 'var(--nk-card)'}}>
      <SectionHeader title="IA Insights" subtitle="Gerado pela análise da sua carteira" />
      <div style={{display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: 1, background: 'var(--hair-soft)'}}>
        {insights.map((ins) => (
          <div key={ins.id} style={{padding: '14px 16.8px', background: 'var(--nk-card)'}}>
            <div style={{display: 'flex', alignItems: 'center', gap: 8.4, marginBottom: 8.4}}>
              <i className={ins.icon} style={{fontSize: 15, color: 'var(--color-accent-300)'}} />
              <span style={{fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--color-accent-300)'}}>{ins.tag}</span>
            </div>
            <div style={{fontSize: 13, fontWeight: 600, color: 'var(--color-neutral-200)', lineHeight: 1.4}}>{ins.title}</div>
            <div style={{fontSize: 11.5, color: 'var(--color-neutral-500)', lineHeight: 1.5, marginTop: 5.6}}>{ins.body}</div>
          </div>
        ))}
      </div>
    </section>

    {/* 6. Próximos dividendos */}
    <section style={{border: '1px solid var(--hair)', borderRadius: 8, background: 'var(--nk-card)'}}>
      <SectionHeader title="Dividendos próximos" subtitle="Próximos 30 dias" />
      <div style={{display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: 1, background: 'var(--hair-soft)'}}>
        {upcomingDividends.map((d) => (
          <div key={d.symbol} style={{padding: '14px 16.8px', background: 'var(--nk-card)'}}>
            <div style={{fontWeight: 600, fontSize: 14}}>{d.symbol}</div>
            <div style={{fontSize: 11, color: 'var(--color-neutral-500)', marginTop: 2}}>{d.type} · {d.comDate}</div>
            <div style={{fontSize: 18, fontWeight: 600, color: 'var(--pos)', marginTop: 8.4, fontVariantNumeric: 'tabular-nums'}}>{d.value}</div>
            <div style={{fontSize: 10.5, color: 'var(--color-neutral-600)', marginTop: 2}}>{d.perShare} por ação</div>
          </div>
        ))}
      </div>
    </section>

    {/* 7. Posições em destaque */}
    <section style={{border: '1px solid var(--hair)', borderRadius: 8, background: 'var(--nk-card)'}}>
      <SectionHeader
        title="Posições em destaque"
        action={<a href="/portfolio" style={{fontSize: 11.5, color: 'var(--color-accent-300)'}}>Ver portfólio completo →</a>}
      />
      <DataTable
        minWidth={700}
        columns={[
          {label: 'Ativo'}, {label: 'Classe'}, {label: 'Cotação', align: 'right'},
          {label: 'P&L R$', align: 'right'}, {label: 'P&L %', align: 'right'},
          {label: 'Peso', align: 'right'}, {label: 'DY', align: 'right'},
        ]}
      >
        {topPositions.slice(0, 6).map((p) => (
          <tr key={p.symbol} style={{borderTop: '1px solid var(--hair-soft)'}} className="hover:bg-[rgba(145,132,217,0.06)]">
            <td style={{padding: '9.8px 16.8px', fontWeight: 600}}>{p.symbol}</td>
            <td style={{padding: '9.8px 16.8px', color: 'var(--color-neutral-500)', fontSize: 11.5}}>{p.class}</td>
            <td style={{padding: '9.8px 16.8px', textAlign: 'right', fontVariantNumeric: 'tabular-nums'}}>{p.price}</td>
            <td style={{padding: '9.8px 16.8px', textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: p.pnl >= 0 ? 'var(--pos)' : 'var(--neg)', fontWeight: 600}}>{p.pnlFormatted}</td>
            <td style={{padding: '9.8px 16.8px', textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: p.pnl >= 0 ? 'var(--pos)' : 'var(--neg)'}}>{p.pnlPct}</td>
            <td style={{padding: '9.8px 16.8px', textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: 'var(--color-neutral-400)'}}>{p.weight}</td>
            <td style={{padding: '9.8px 16.8px', textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: 'var(--color-neutral-300)'}}>{p.dy}</td>
          </tr>
        ))}
      </DataTable>
    </section>
  </div>
);
```

**Data bridging notes (adapt existing data to JSX above):**
- `levelHint` / `levelMeta`: derive from `useAdaptiveLevel().level` — map `'iniciante'` → "Modo Iniciante: exibindo métricas essenciais", etc.
- `quantMetrics`: derive Sharpe/Volatilidade/MaxDD/Alfa/VaR from `summary` (use existing calculations or display `"—"` if not available)
- `PERIODS`: `[{label:'1M',value:'1M'},{label:'3M',value:'3M'},{label:'6M',value:'6M'},{label:'1A',value:'1A'},{label:'2A',value:'2A'}]`
- `chartLegend`: `[{label:'Carteira',color:'var(--ac)',value:'+14,2%',positive:true},{label:'IBOV',color:'var(--cy)',value:'+8,1%',positive:true},{label:'CDI',color:'var(--color-neutral-500)',value:'+12,3%',positive:true}]` — values from `summary`
- `topPositions`: `summary.assets.slice(0,6)` sorted by weight desc

- [ ] **Step 1: Read the current `src/pages/Index.tsx` fully** to understand all data variables available from existing hooks.

- [ ] **Step 2: Identify variable mapping** — write comments at top of file listing which existing variables map to `summary.totalValue`, `summary.totalPnl`, etc.

- [ ] **Step 3: Replace the return JSX** with the layout above. Keep all hook/logic code untouched above the return.

- [ ] **Step 4: Remove unused imports** (shadcn Card, CardHeader, etc. if replaced; keep Recharts if chart preserved).

- [ ] **Step 5: Run existing tests**

  ```bash
  npm run test:unit -- src/pages/Index.spec.tsx src/pages/dashboard-summary.utils.spec.ts
  ```

  Expected: all pass (logic unchanged).

- [ ] **Step 6: Type-check**

  ```bash
  npm run type-check
  ```

- [ ] **Step 7: Visual check** — open `http://localhost:8080/dashboard` in browser, compare against handoff. Verify 4 KPI cards, quant bar, two-col chart+donut, insights, dividends, positions table.

- [ ] **Step 8: Commit**

  ```bash
  git add src/pages/Index.tsx
  git commit -m "feat(web): rewrite Dashboard JSX to match Nocturne handoff"
  ```

---

### Task 3: Portfolio Rewrite (`src/pages/Portfolio.tsx`)

**Files:**
- Modify: `src/pages/Portfolio.tsx`

**Interfaces:**
- Consumes: `SectionHeader`, `DataTable`, `TD_STYLE`, `TD_RIGHT` from `@/components/shared`
- Preserves: `useQuery(portfolioService…)`, `useNavigate`, `useSubscription`, all existing hooks and data

**Key layout:**

```tsx
return (
  <div style={{display: 'flex', flexDirection: 'column', gap: 16.8}}>

    {/* 1. Group tabs */}
    <div style={{display: 'flex', padding: 2.8, gap: 2.8, border: '1px solid var(--hair)', borderRadius: 8, alignSelf: 'flex-start'}}>
      {['Todos', 'Renda Variável', 'Renda Fixa', 'FIIs'].map((tab) => (
        <button
          key={tab}
          type="button"
          onClick={() => setGroupTab(tab)}
          style={groupTab === tab
            ? {height: 32, padding: '0 14px', fontSize: 12.5, border: 'none', borderRadius: 6, background: 'var(--nk-card)', color: 'var(--color-neutral-100)', boxShadow: '0 1px 3px rgba(0,0,0,0.18)', cursor: 'pointer', fontFamily: 'var(--font-body)'}
            : {height: 32, padding: '0 14px', fontSize: 12.5, border: 'none', borderRadius: 6, background: 'transparent', color: 'var(--color-neutral-500)', cursor: 'pointer', fontFamily: 'var(--font-body)'}}
        >
          {tab}
        </button>
      ))}
    </div>

    {/* 2. Filter pills */}
    <div style={{display: 'flex', gap: 5.6, flexWrap: 'wrap'}}>
      {filterPills.map((f) => (
        <span
          key={f.label}
          onClick={() => setFilter(f.value)}
          style={activeFilter === f.value
            ? {padding: '4px 11.2px', borderRadius: 20, fontSize: 12, cursor: 'pointer', background: 'rgba(145,132,217,0.18)', color: 'var(--color-accent-100)', border: '1px solid rgba(145,132,217,0.45)'}
            : {padding: '4px 11.2px', borderRadius: 20, fontSize: 12, cursor: 'pointer', background: 'transparent', color: 'var(--color-neutral-500)', border: '1px solid var(--hair)'}}
        >
          {f.label}
        </span>
      ))}
    </div>

    {/* 3. Risk bar */}
    <div style={{border: '1px solid var(--hair)', borderRadius: 8, overflow: 'hidden'}}>
      <div style={{display: 'flex'}}>
        {riskBuckets.map((b) => (
          <div
            key={b.label}
            style={{flex: b.pct, padding: '9.8px 14px', background: b.bg, borderRight: '1px solid var(--hair)'}}>
            <div style={{fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: b.textColor}}>{b.label}</div>
            <div style={{fontSize: 14, fontWeight: 600, marginTop: 2, fontVariantNumeric: 'tabular-nums', color: b.textColor}}>{b.pct}%</div>
          </div>
        ))}
      </div>
    </div>

    {/* 4. Table */}
    <section style={{border: '1px solid var(--hair)', borderRadius: 8, background: 'var(--nk-card)'}}>
      <SectionHeader
        title="Carteira"
        subtitle={`${filteredAssets.length} ativos`}
        action={<ColumnConfigurator visibleCols={visibleCols} onToggle={toggleCol} />}
      />
      <DataTable
        minWidth={900}
        columns={activeColumns}
      >
        {filteredAssets.map((asset) => (
          <tr
            key={asset.symbol}
            onClick={() => navigate(`/portfolio/asset/${asset.symbol}`)}
            style={{borderTop: '1px solid var(--hair-soft)', cursor: 'pointer'}}
            className="hover:bg-[rgba(145,132,217,0.06)]"
          >
            <td style={{padding: '9.8px 16.8px', fontWeight: 600}}>{asset.symbol}</td>
            {visibleCols.class && <td style={{padding: '9.8px 16.8px', color: 'var(--color-neutral-500)', fontSize: 11.5}}>{asset.type}</td>}
            {visibleCols.qty && <td style={TD_RIGHT}>{asset.quantity}</td>}
            {visibleCols.avgPrice && <td style={TD_RIGHT}>{formatCurrency(asset.averagePrice)}</td>}
            {visibleCols.price && <td style={TD_RIGHT}>{formatCurrency(asset.currentPrice)}</td>}
            {visibleCols.pnl && <td style={{...TD_RIGHT, color: asset.pnl >= 0 ? 'var(--pos)' : 'var(--neg)', fontWeight: 600}}>{formatCurrency(asset.pnl)}</td>}
            {visibleCols.dy && <td style={TD_RIGHT}>{asset.dy ? `${asset.dy.toFixed(1)}%` : '—'}</td>}
            {visibleCols.weight && <td style={{...TD_RIGHT, color: 'var(--color-neutral-400)'}}>{asset.weight?.toFixed(1)}%</td>}
          </tr>
        ))}
      </DataTable>
    </section>
  </div>
);
```

**`ColumnConfigurator`** (inline component in same file):
```tsx
function ColumnConfigurator({visibleCols, onToggle}: {visibleCols: Record<string,boolean>; onToggle: (col: string) => void}) {
  const [open, setOpen] = useState(false);
  const cols = ['class','qty','avgPrice','price','pnl','dy','weight'];
  const labels: Record<string,string> = {class:'Classe',qty:'Qtd',avgPrice:'Preço Médio',price:'Cotação',pnl:'P&L R$',dy:'DY',weight:'Peso'};
  return (
    <div style={{position: 'relative'}}>
      <button type="button" onClick={() => setOpen((v) => !v)} style={{height: 30, padding: '0 11.2px', border: '1px solid var(--hair)', borderRadius: 8, background: 'transparent', color: 'var(--color-neutral-400)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5.6}}>
        <i className="ph ph-sliders" style={{fontSize: 14}} /> Colunas
      </button>
      {open && (
        <div style={{position: 'absolute', right: 0, top: 36, zIndex: 50, width: 180, border: '1px solid var(--hair)', borderRadius: 8, background: 'var(--surf-4)', boxShadow: 'var(--shadow-lg)', padding: '8px 0'}}>
          {cols.map((c) => (
            <label key={c} style={{display: 'flex', alignItems: 'center', gap: 8.4, padding: '6px 14px', fontSize: 12.5, cursor: 'pointer'}}>
              <input type="checkbox" checked={visibleCols[c] ?? true} onChange={() => onToggle(c)} style={{accentColor: 'var(--ac)'}} />
              {labels[c]}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 1: Read `src/pages/Portfolio.tsx` fully** — identify all existing state, queries, computed lists.

- [ ] **Step 2: Add missing state** — `groupTab`, `filterPills`, `activeFilter`, `visibleCols`, `toggleCol` (if not already present).

- [ ] **Step 3: Replace return JSX** with layout above.

- [ ] **Step 4: Run tests**

  ```bash
  npm run test:unit
  ```

- [ ] **Step 5: Type-check**

  ```bash
  npm run type-check
  ```

- [ ] **Step 6: Commit**

  ```bash
  git add src/pages/Portfolio.tsx
  git commit -m "feat(web): rewrite Portfolio JSX to match Nocturne handoff"
  ```

---

### Task 4: Dividendos Rewrite (`src/pages/Dividends.tsx`)

**Files:**
- Modify: `src/pages/Dividends.tsx`

**Interfaces:**
- Consumes: `KpiCard`, `SectionHeader`, `AiInsightBanner`, `DataTable`, `TD_STYLE`, `TD_RIGHT` from `@/components/shared`
- Preserves: all existing queries and data from `portfolioService`

**Key layout:**

```tsx
return (
  <div style={{display: 'flex', flexDirection: 'column', gap: 16.8}}>

    {/* 1. KPI cards */}
    <div style={{display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: 11.2}}>
      <KpiCard label="DY médio" value={avgDY} sub="ponderado por posição" />
      <KpiCard label="Proventos 12m" value={formatCurrency(total12m)} delta={growth12m} sub="vs ano anterior" deltaStyle={{color: growth >= 0 ? 'var(--pos)' : 'var(--neg)'}} />
      <KpiCard label="Yield on Cost" value={yoc} sub="sobre preço médio pago" tooltip={{title:'Yield on Cost', body:'Rendimento sobre o custo histórico de aquisição', formula:'YoC = Proventos acumulados / Custo médio total × 100'}} />
      <KpiCard label="Próximo provento" value={nextDiv.value} sub={`${nextDiv.symbol} · pag. ${nextDiv.payDate}`} />
    </div>

    {/* 2. Bar chart — Proventos por mês */}
    <section style={{border: '1px solid var(--hair)', borderRadius: 8, background: 'var(--nk-card)'}}>
      <SectionHeader
        title="Proventos recebidos por mês"
        subtitle={chartSubtitle}
        action={
          <div style={{display: 'flex', gap: 14}}>
            <div style={{display: 'flex', alignItems: 'center', gap: 5.6, fontSize: 11, color: 'var(--color-neutral-400)'}}>
              <span style={{width: 10, height: 10, borderRadius: 2, background: 'var(--pos)', display: 'inline-block'}} /> recebido
            </div>
            <div style={{display: 'flex', alignItems: 'center', gap: 5.6, fontSize: 11, color: 'var(--color-neutral-400)'}}>
              <span style={{width: 10, height: 10, borderRadius: 2, background: 'rgba(145,132,217,0.45)', border: '1px dashed var(--color-accent-400)', display: 'inline-block'}} /> previsto
            </div>
          </div>
        }
      />
      <div style={{padding: 16.8}}>
        {/* 12-bar CSS grid chart */}
        <div style={{display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 8.4, alignItems: 'end', height: 168}}>
          {monthlyData.map((m) => (
            <div key={m.label} style={{display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', height: '100%', gap: 5.6}}>
              <span style={{fontSize: 10, color: 'var(--color-neutral-500)', textAlign: 'center', fontVariantNumeric: 'tabular-nums'}}>{m.label === currentMonth ? formatCurrency(m.value, true) : ''}</span>
              <div style={{background: m.projected ? 'rgba(145,132,217,0.45)' : 'var(--pos)', borderRadius: '3px 3px 0 0', height: `${(m.value / maxMonthValue) * 100}%`, border: m.projected ? '1px dashed var(--color-accent-400)' : 'none'}} />
            </div>
          ))}
        </div>
        <div style={{display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 8.4, marginTop: 8.4}}>
          {monthlyData.map((m) => (
            <span key={m.label} style={{fontSize: 10.5, color: 'var(--color-neutral-600)', textAlign: 'center'}}>{m.label}</span>
          ))}
        </div>
      </div>
    </section>

    {/* 3. Agenda + Renda por ativo */}
    <div style={{display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1.2fr)', gap: 16.8, alignItems: 'start'}}>
      <section style={{border: '1px solid var(--hair)', borderRadius: 8, background: 'var(--nk-card)'}}>
        <SectionHeader title="Agenda · próximos 45 dias" subtitle="Data-com, pagamento e valor líquido previsto" />
        <div style={{padding: '5.6px 0'}}>
          {agenda.map((d) => (
            <div key={`${d.symbol}-${d.comDate}`} style={{display: 'flex', alignItems: 'center', gap: 11.2, padding: '9.8px 16.8px'}}>
              <div style={{width: 38, flexShrink: 0, textAlign: 'center', border: '1px solid var(--hair)', borderRadius: 6, padding: '4px 0', background: 'rgba(var(--rgb-bg),0.6)'}}>
                <div style={{fontSize: 13, fontWeight: 600, lineHeight: 1, fontVariantNumeric: 'tabular-nums'}}>{d.day}</div>
                <div style={{fontSize: 9, color: 'var(--color-neutral-600)', textTransform: 'uppercase', letterSpacing: '0.06em'}}>{d.month}</div>
              </div>
              <div style={{flex: 1, minWidth: 0}}>
                <div style={{fontSize: 12.5, fontWeight: 600}}>{d.symbol}</div>
                <div style={{fontSize: 10.5, color: 'var(--color-neutral-600)'}}>{d.type} · data-com {d.comDate}</div>
              </div>
              <div style={{textAlign: 'right'}}>
                <div style={{fontSize: 12.5, fontWeight: 600, color: 'var(--pos)', fontVariantNumeric: 'tabular-nums'}}>{d.value}</div>
                <div style={{fontSize: 10.5, color: 'var(--color-neutral-600)', fontVariantNumeric: 'tabular-nums'}}>{d.perShare}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section style={{border: '1px solid var(--hair)', borderRadius: 8, background: 'var(--nk-card)'}}>
        <SectionHeader
          title="Renda por ativo · 12 meses"
          subtitle={tableSubtitle}
          action={
            <button type="button" style={{height: 30, padding: '0 11.2px', border: '1px solid var(--color-accent-700)', borderRadius: 8, background: 'transparent', color: 'var(--color-accent-200)', fontSize: 11.5, cursor: 'pointer', fontFamily: 'var(--font-body)'}}>
              Informe de rendimentos
            </button>
          }
        />
        <DataTable
          minWidth={560}
          columns={[
            {label: 'Ativo'}, {label: 'Total R$', align: 'right'}, {label: 'DY', align: 'right'},
            {label: 'YoC', align: 'right'}, {label: 'Nº', align: 'right'},
          ]}
        >
          {incomeByAsset.map((r) => (
            <tr key={r.symbol} style={{borderTop: '1px solid var(--hair-soft)'}} className="hover:bg-[rgba(145,132,217,0.06)]">
              <td style={{padding: '9.8px 16.8px', fontWeight: 600}}>{r.symbol}</td>
              <td style={TD_RIGHT}>{formatCurrency(r.total)}</td>
              <td style={TD_RIGHT}>{r.dy}</td>
              <td style={{...TD_RIGHT, fontWeight: 600, color: 'var(--pos)'}}>{r.yoc}</td>
              <td style={{...TD_RIGHT, color: 'var(--color-neutral-500)'}}>{r.count}</td>
            </tr>
          ))}
        </DataTable>
      </section>
    </div>

    {/* 4. AI banner */}
    {showAdvancedInsight && (
      <AiInsightBanner
        text={passiveIncomeInsight.text}
        actionLabel="Abrir planejamento"
        onAction={() => navigate('/planning')}
      />
    )}
  </div>
);
```

- [ ] **Step 1: Read `src/pages/Dividends.tsx` fully** — identify existing data shape for `dividends`, `upcomingDividends`, monthly aggregations.

- [ ] **Step 2: Build `monthlyData` array** from existing dividends data: `{label: 'jan', value: number, projected: boolean}[]` for 12 months.

- [ ] **Step 3: Build `agenda` array** — upcoming 45 days events from existing service data.

- [ ] **Step 4: Build `incomeByAsset` array** — group dividends by symbol, compute total/dy/yoc.

- [ ] **Step 5: Replace return JSX.**

- [ ] **Step 6: Run tests and type-check**

  ```bash
  npm run test:unit && npm run type-check
  ```

- [ ] **Step 7: Commit**

  ```bash
  git add src/pages/Dividends.tsx
  git commit -m "feat(web): rewrite Dividends JSX to match Nocturne handoff"
  ```

---

### Task 5: Asset Detail Rewrite (`src/pages/AssetDetail.tsx`)

**Files:**
- Modify: `src/pages/AssetDetail.tsx`

**Interfaces:**
- Consumes: `SectionHeader`, `DataTable`, `TD_STYLE`, `TD_RIGHT` from `@/components/shared`
- Preserves: all existing hooks (`useAssetFundamentals`, `useAssetDividends`, `stockServices`, etc.)

**Key layout (hero + tabs):**

```tsx
return (
  <div style={{display: 'flex', flexDirection: 'column', gap: 16.8}}>

    {/* Hero */}
    <section style={{position: 'relative', border: '1px solid rgba(145,132,217,0.30)', borderRadius: 8, overflow: 'hidden', background: 'linear-gradient(115deg, rgba(111,94,217,0.34) 0%, rgba(76,201,240,0.16) 48%, rgba(var(--rgb-surf-2),0.85) 100%), var(--surf-2)'}}>
      <div style={{position: 'absolute', inset: 0, background: 'radial-gradient(520px 240px at 88% -20%, rgba(47,214,163,0.20), rgba(47,214,163,0) 70%)', pointerEvents: 'none'}} />
      <div style={{position: 'relative', padding: 22.4, display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 340px', gap: 22.4, alignItems: 'center'}}>
        {/* Left: identity + price */}
        <div>
          <div style={{display: 'flex', alignItems: 'center', gap: 11.2}}>
            <div style={{width: 40, height: 40, borderRadius: 8, background: 'var(--grad-violet)', display: 'grid', placeItems: 'center', fontSize: 12, fontWeight: 700, color: 'var(--sunk)', boxShadow: '0 0 24px rgba(145,132,217,0.40)'}}>
              {symbol.slice(0, 4)}
            </div>
            <div>
              <div style={{display: 'flex', alignItems: 'center', gap: 8.4}}>
                <span style={{fontFamily: 'var(--font-heading)', fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em'}}>{symbol}</span>
                <span style={{fontSize: 10.5, color: 'var(--color-accent-100)', border: '1px solid rgba(145,132,217,0.45)', borderRadius: 6, padding: '2px 7px', background: 'rgba(145,132,217,0.16)'}}>{sector}</span>
              </div>
              <div style={{fontSize: 12, color: 'var(--color-neutral-400)', marginTop: 3}}>{name} · B3 · lote padrão</div>
            </div>
          </div>
          <div style={{display: 'flex', alignItems: 'flex-end', gap: 16.8, marginTop: 16.8, flexWrap: 'wrap'}}>
            <div>
              <div style={{fontFamily: 'var(--font-heading)', fontSize: 34, fontWeight: 600, letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums', lineHeight: 1}}>
                {formatCurrency(currentPrice)}
              </div>
              <div style={{display: 'flex', alignItems: 'center', gap: 8.4, marginTop: 5.6, fontSize: 12.5}}>
                <span style={{color: priceChange >= 0 ? 'var(--pos)' : 'var(--neg)'}}>{priceChange >= 0 ? '+' : ''}{priceChangePct}%</span>
                <span style={{color: 'var(--color-neutral-500)'}}>hoje · {formatCurrency(priceChange)}</span>
              </div>
            </div>
            <div style={{display: 'flex', gap: 22.4, paddingLeft: 22.4, borderLeft: '1px solid var(--hair)'}}>
              {heroStats.map((s) => (
                <div key={s.label}>
                  <div style={{fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-neutral-500)'}}>{s.label}</div>
                  <div style={{fontSize: 15, fontWeight: 600, marginTop: 4, fontVariantNumeric: 'tabular-nums', color: s.color ?? 'var(--color-neutral-200)'}}>{s.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: position mini-card */}
        <div style={{border: '1px solid rgba(var(--rgb-line),0.14)', borderRadius: 8, background: 'rgba(var(--rgb-bg),0.62)', backdropFilter: 'blur(8px)', padding: '14px 16.8px'}}>
          <div style={{fontSize: 10.5, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-neutral-500)'}}>Sua posição</div>
          <div style={{display: 'flex', flexDirection: 'column', gap: 8.4, marginTop: 11.2}}>
            {positionStats.map((p) => (
              <div key={p.label} style={{display: 'flex', alignItems: 'baseline', gap: 11.2, fontSize: 12.5}}>
                <span style={{flex: 1, color: 'var(--color-neutral-500)'}}>{p.label}</span>
                <span style={{fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: p.color ?? 'var(--color-neutral-200)'}}>{p.value}</span>
              </div>
            ))}
          </div>
          <div style={{display: 'flex', gap: 8.4, marginTop: 14}}>
            <button type="button" onClick={onRegisterOp} style={{flex: 1, height: 32, borderRadius: 8, border: 'none', background: 'var(--grad-violet)', color: 'var(--sunk)', fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600, cursor: 'pointer'}}>
              Registrar operação
            </button>
            <button type="button" style={{height: 32, padding: '0 11.2px', borderRadius: 8, border: '1px solid var(--hair)', background: 'transparent', color: 'var(--color-neutral-300)', fontFamily: 'var(--font-body)', fontSize: 12, cursor: 'pointer'}}>
              Alertas
            </button>
          </div>
        </div>
      </div>
    </section>

    {/* Tab bar */}
    <div style={{display: 'flex', alignItems: 'center', gap: 11.2, flexWrap: 'wrap', borderBottom: '1px solid var(--hair)', paddingBottom: 11.2}}>
      <div style={{display: 'flex', gap: 2.8, padding: 2.8, border: '1px solid var(--hair)', borderRadius: 8, background: 'rgba(var(--rgb-bg),0.8)'}}>
        {ASSET_TABS.map((t) => (
          <button key={t.id} type="button" onClick={() => setActiveTab(t.id)}
            style={activeTab === t.id
              ? {height: 30, padding: '0 14px', fontSize: 12.5, border: 'none', borderRadius: 6, background: 'var(--nk-card)', color: 'var(--color-neutral-100)', boxShadow: '0 1px 3px rgba(0,0,0,0.18)', cursor: 'pointer', fontFamily: 'var(--font-body)'}
              : {height: 30, padding: '0 14px', fontSize: 12.5, border: 'none', borderRadius: 6, background: 'transparent', color: 'var(--color-neutral-500)', cursor: 'pointer', fontFamily: 'var(--font-body)'}}>
            {t.label}
          </button>
        ))}
      </div>
    </div>

    {/* Tab content — preserve existing tab content components, only update styling */}
    {activeTab === 'overview' && <AssetOverviewTab asset={asset} />}
    {activeTab === 'fundamentals' && <AssetFundamentalsTab asset={asset} />}
    {activeTab === 'balance' && <AssetBalanceTab asset={asset} />}
    {activeTab === 'results' && <AssetResultsTab asset={asset} />}
    {activeTab === 'dividends' && <AssetDividendsTab asset={asset} />}
    {activeTab === 'about' && <AssetAboutTab asset={asset} />}
  </div>
);
```

`ASSET_TABS`: `[{id:'overview',label:'Visão geral'},{id:'fundamentals',label:'Indicadores'},{id:'balance',label:'Balanço'},{id:'results',label:'Resultados'},{id:'dividends',label:'Dividendos'},{id:'about',label:'Sobre'}]`

`heroStats` (3 items): Qtd de ações, P&L total, Peso na carteira.
`positionStats` (5 rows): Qtd, Preço médio, Valor investido, Valor atual, P&L total.

- [ ] **Step 1: Read `src/pages/AssetDetail.tsx` fully** — identify existing tab components or tab rendering.

- [ ] **Step 2: Extract each tab into a local function** if not already extracted (e.g., `AssetOverviewTab`, `AssetFundamentalsTab`). Keep all logic inside.

- [ ] **Step 3: Replace return JSX** with hero + tab bar + tab content switcher.

- [ ] **Step 4: Update tab content styling** inside each tab function to use Nocturne tokens (borders, colors, tables). Use `SectionHeader` and `DataTable` for consistency.

- [ ] **Step 5: Run existing tests**

  ```bash
  npm run test:unit -- src/pages/AssetDetail
  ```

- [ ] **Step 6: Type-check**

  ```bash
  npm run type-check
  ```

- [ ] **Step 7: Commit**

  ```bash
  git add src/pages/AssetDetail.tsx
  git commit -m "feat(web): rewrite AssetDetail JSX to match Nocturne handoff"
  ```

---

### Task 6: Transações + Adicionar Ativo Rewrite

**Files:**
- Modify: `src/pages/Transactions.tsx`
- Modify: `src/pages/AddAsset.tsx`

**Interfaces:**
- Consumes: `KpiCard`, `SectionHeader`, `DataTable`, `TD_STYLE`, `TD_RIGHT` from `@/components/shared`
- Preserves: all existing queries, mutations, form logic

**Transactions layout:**

```tsx
// Transactions return JSX
return (
  <div style={{display: 'flex', flexDirection: 'column', gap: 16.8}}>

    {/* Stats */}
    <div style={{display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: 11.2}}>
      <KpiCard label="Compras totais" value={formatCurrency(stats.totalBought)} sub={`${stats.buyCount} operações`} />
      <KpiCard label="Vendas totais" value={formatCurrency(stats.totalSold)} sub={`${stats.sellCount} operações`} />
      <KpiCard label="Proventos" value={formatCurrency(stats.totalDividends)} sub="recebidos no período" />
      <KpiCard
        label="Saldo líquido"
        value={formatCurrency(stats.netBalance)}
        deltaStyle={{color: stats.netBalance >= 0 ? 'var(--pos)' : 'var(--neg)'}}
        sub="compras - vendas + proventos"
      />
    </div>

    {/* Table */}
    <section style={{border: '1px solid var(--hair)', borderRadius: 8, background: 'var(--nk-card)'}}>
      <SectionHeader
        title="Todas as movimentações"
        subtitle={`${transactions.length} lançamentos · ${accounts.length} contas · ${period}`}
        action={
          <div style={{display: 'flex', gap: 8.4, flexWrap: 'wrap', alignItems: 'center'}}>
            {TX_FILTERS.map((f) => (
              <span key={f.value} onClick={() => setTxFilter(f.value)}
                style={txFilter === f.value
                  ? {padding: '3px 10px', borderRadius: 20, fontSize: 11.5, cursor: 'pointer', background: 'rgba(145,132,217,0.18)', color: 'var(--color-accent-100)', border: '1px solid rgba(145,132,217,0.45)'}
                  : {padding: '3px 10px', borderRadius: 20, fontSize: 11.5, cursor: 'pointer', background: 'transparent', color: 'var(--color-neutral-500)', border: '1px solid var(--hair)'}}>
                {f.label}
              </span>
            ))}
            <button type="button" onClick={openImportModal} style={{height: 30, padding: '0 11.2px', borderRadius: 8, border: '1px solid var(--color-accent-700)', background: 'transparent', color: 'var(--color-accent-200)', fontSize: 11.5, cursor: 'pointer', fontFamily: 'var(--font-body)'}}>
              Importar arquivo
            </button>
          </div>
        }
      />
      <DataTable
        minWidth={820}
        columns={[
          {label: 'Data'}, {label: 'Tipo'}, {label: 'Ativo'}, {label: 'Conta'},
          {label: 'Qtd', align: 'right'}, {label: 'Preço', align: 'right'},
          {label: 'Total', align: 'right'}, {label: 'Origem', align: 'right'},
        ]}
      >
        {filteredTx.map((t) => (
          <tr key={t._id} style={{borderTop: '1px solid var(--hair-soft)'}} className="hover:bg-[rgba(145,132,217,0.06)]">
            <td style={{padding: '9.8px 16.8px', color: 'var(--color-neutral-400)', fontVariantNumeric: 'tabular-nums'}}>{formatDate(t.date)}</td>
            <td style={{padding: '9.8px 16.8px'}}>
              <span style={TX_KIND_STYLE[t.type]}>{TX_KIND_LABEL[t.type]}</span>
            </td>
            <td style={{padding: '9.8px 16.8px', fontWeight: 600}}>{t.symbol}</td>
            <td style={{padding: '9.8px 16.8px', color: 'var(--color-neutral-500)', fontSize: 11.5}}>{t.account ?? '—'}</td>
            <td style={TD_RIGHT}>{t.quantity}</td>
            <td style={TD_RIGHT}>{formatCurrency(t.price)}</td>
            <td style={{...TD_RIGHT, fontWeight: 600, color: t.type === 'buy' ? 'var(--neg)' : 'var(--pos)'}}>{formatCurrency(t.total)}</td>
            <td style={{...TD_RIGHT}}>
              <span style={TX_ORIGIN_STYLE[t.provider ?? 'manual']}>{t.provider ?? 'Manual'}</span>
            </td>
          </tr>
        ))}
      </DataTable>
    </section>
  </div>
);
```

Type badge styles (define near top of file):
```tsx
const TX_KIND_STYLE: Record<string, React.CSSProperties> = {
  buy: {padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: 'rgba(47,214,163,0.15)', color: 'var(--pos)'},
  sell: {padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: 'rgba(242,80,107,0.15)', color: 'var(--neg)'},
  dividend: {padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: 'rgba(145,132,217,0.15)', color: 'var(--color-accent-200)'},
};
const TX_KIND_LABEL: Record<string, string> = {buy: 'Compra', sell: 'Venda', dividend: 'Provento'};
const TX_ORIGIN_STYLE: Record<string, React.CSSProperties> = {
  manual: {padding: '2px 8px', borderRadius: 6, fontSize: 11, background: 'rgba(var(--rgb-line),0.08)', color: 'var(--color-neutral-400)'},
  b3: {padding: '2px 8px', borderRadius: 6, fontSize: 11, background: 'rgba(76,201,240,0.12)', color: 'var(--cy)'},
  import: {padding: '2px 8px', borderRadius: 6, fontSize: 11, background: 'rgba(145,132,217,0.12)', color: 'var(--color-accent-200)'},
};
const TX_FILTERS = [
  {label: 'Todos', value: 'all'}, {label: 'Compra', value: 'buy'},
  {label: 'Venda', value: 'sell'}, {label: 'Provento', value: 'dividend'},
  {label: 'Bonificação', value: 'bonus'},
];
```

**AddAsset layout:**

```tsx
return (
  <div style={{display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1.15fr)', gap: 16.8, alignItems: 'start'}}>

    {/* Manual form */}
    <section style={{border: '1px solid var(--hair)', borderRadius: 8, background: 'var(--nk-card)'}}>
      <SectionHeader title="Lançar manualmente" subtitle="Para ativos fora da B3 ou operações antigas" />
      <div style={{padding: 16.8, display: 'flex', flexDirection: 'column', gap: 14}}>
        {/* Preserve existing form fields — only update input styling */}
        {formFields.map((f) => (
          <label key={f.name} style={{display: 'flex', flexDirection: 'column', gap: 5.6}}>
            <span style={{fontSize: 11.5, color: 'var(--color-neutral-400)'}}>{f.label}</span>
            <input
              {...f.inputProps}
              style={{height: 36, padding: '0 11.2px', border: '1px solid var(--hair)', borderRadius: 8, background: 'rgba(var(--rgb-bg),0.6)', color: 'var(--color-text)', fontFamily: 'var(--font-body)', fontSize: 13, fontVariantNumeric: 'tabular-nums', outline: 'none', width: '100%', boxSizing: 'border-box'}}
            />
          </label>
        ))}
        <div style={{display: 'flex', gap: 8.4}}>
          <button type="submit" style={{flex: 1, height: 38, borderRadius: 8, border: 'none', background: 'var(--grad-violet)', color: 'var(--sunk)', fontFamily: 'var(--font-body)', fontSize: 12.5, fontWeight: 600, cursor: 'pointer'}}>
            Salvar ativo
          </button>
          <button type="button" onClick={saveAndNew} style={{height: 38, padding: '0 14px', borderRadius: 8, border: '1px solid var(--hair)', background: 'transparent', color: 'var(--color-neutral-300)', fontFamily: 'var(--font-body)', fontSize: 12.5, cursor: 'pointer'}}>
            Salvar e adicionar outro
          </button>
        </div>
      </div>
    </section>

    {/* Right: upload + recent imports */}
    <div style={{display: 'flex', flexDirection: 'column', gap: 16.8}}>
      {/* Dropzone */}
      <section style={{position: 'relative', border: '1px dashed rgba(145,132,217,0.45)', borderRadius: 8, overflow: 'hidden', background: 'linear-gradient(122deg, rgba(111,94,217,0.24) 0%, rgba(76,201,240,0.10) 58%, rgba(var(--rgb-surf-2),0.86) 100%), var(--surf-2)'}}>
        <div style={{padding: '28px 22.4px', textAlign: 'center'}}>
          <div style={{width: 44, height: 44, margin: '0 auto', borderRadius: 8, background: 'var(--grad-aurora)', display: 'grid', placeItems: 'center', boxShadow: '0 0 28px rgba(76,201,240,0.30)'}}>
            <i className="ph-fill ph-upload-simple" style={{fontSize: 21, color: 'var(--sunk)'}} />
          </div>
          <div style={{fontFamily: 'var(--font-heading)', fontSize: 17, fontWeight: 600, marginTop: 14}}>Arraste seus arquivos aqui</div>
          <div style={{fontSize: 12.5, color: 'var(--color-neutral-400)', marginTop: 5.6, lineHeight: 1.55, maxWidth: 420, margin: '5.6px auto 0'}}>
            PDF, CSV ou XLSX. Reconhecemos nota de corretagem, extrato de movimentação e relatório consolidado da B3 automaticamente.
          </div>
          <div style={{display: 'flex', gap: 8.4, justifyContent: 'center', marginTop: 16.8}}>
            <button type="button" onClick={chooseFiles} style={{height: 36, padding: '0 16.8px', borderRadius: 8, border: '1px solid var(--color-accent)', background: 'rgba(145,132,217,0.14)', color: 'var(--color-accent-100)', fontFamily: 'var(--font-body)', fontSize: 12.5, fontWeight: 500, cursor: 'pointer'}}>
              Escolher arquivos
            </button>
            <button type="button" onClick={openImportGuide} style={{height: 36, padding: '0 16.8px', borderRadius: 8, border: '1px solid var(--hair)', background: 'transparent', color: 'var(--color-neutral-200)', fontFamily: 'var(--font-body)', fontSize: 12.5, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5.6}}>
              <i className="ph-fill ph-question" style={{fontSize: 14}} /> Qual arquivo eu preciso?
            </button>
          </div>
        </div>
      </section>

      {/* Recent imports */}
      <section style={{border: '1px solid var(--hair)', borderRadius: 8, background: 'var(--nk-card)'}}>
        <SectionHeader title="Importações recentes" />
        <div style={{padding: '5.6px 0'}}>
          {recentImports.map((imp) => (
            <div key={imp.id} style={{display: 'flex', alignItems: 'center', gap: 11.2, padding: '9.8px 16.8px'}}>
              <i className={imp.icon} style={{fontSize: 16, color: imp.color}} />
              <div style={{flex: 1, minWidth: 0}}>
                <div style={{fontSize: 12.5, color: 'var(--color-neutral-200)'}}>{imp.label}</div>
                <div style={{fontSize: 10.5, color: 'var(--color-neutral-600)', marginTop: 2}}>{imp.meta}</div>
              </div>
              <span style={IMPORT_STATUS_STYLE[imp.status]}>{imp.statusLabel}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  </div>
);
```

```tsx
const IMPORT_STATUS_STYLE: Record<string, React.CSSProperties> = {
  success: {padding: '2px 8px', borderRadius: 6, fontSize: 11, background: 'rgba(47,214,163,0.15)', color: 'var(--pos)'},
  error: {padding: '2px 8px', borderRadius: 6, fontSize: 11, background: 'rgba(242,80,107,0.15)', color: 'var(--neg)'},
  pending: {padding: '2px 8px', borderRadius: 6, fontSize: 11, background: 'rgba(240,179,46,0.15)', color: 'var(--warn)'},
};
```

- [ ] **Step 1: Read `src/pages/Transactions.tsx` fully.** Identify existing transaction data shape, filter state, import modal trigger.

- [ ] **Step 2: Read `src/pages/AddAsset.tsx` fully.** Identify form fields, submit handler, upload handler, recent imports data.

- [ ] **Step 3: Rewrite `Transactions.tsx`** — add badge/filter constants, replace return JSX, keep all logic.

- [ ] **Step 4: Rewrite `AddAsset.tsx`** — replace return JSX, keep form handlers and upload logic.

- [ ] **Step 5: Run tests**

  ```bash
  npm run test:unit
  ```

- [ ] **Step 6: Type-check**

  ```bash
  npm run type-check
  ```

- [ ] **Step 7: Build check**

  ```bash
  npm run build
  ```

- [ ] **Step 8: Commit**

  ```bash
  git add src/pages/Transactions.tsx src/pages/AddAsset.tsx
  git commit -m "feat(web): rewrite Transactions and AddAsset JSX to match Nocturne handoff"
  ```

---

### Task 7: E2E Verification + Selector Fixes

**Files:**
- Modify: any `tests/e2e/*.spec.ts` that break due to selector changes
- Modify: any `src/pages/*.spec.tsx` that break due to text/heading changes

**Interfaces:**
- Consumes: all rewritten pages
- Produces: green Playwright suite

- [ ] **Step 1: Run full E2E suite**

  ```bash
  npx playwright test --reporter=list 2>&1 | head -100
  ```

- [ ] **Step 2: For each failing test**, open the spec file and update selectors that changed:
  - Heading text changes (e.g., old "Dashboard" title → new heading)
  - Button labels that changed
  - Table column headers that changed
  - IDs that moved or were removed

  **Do not change the test intent — only update selectors to match new markup.**

- [ ] **Step 3: Re-run failing tests**

  ```bash
  npx playwright test --reporter=list
  ```

  Expected: all tests green.

- [ ] **Step 4: Visual verification** — open each of the 6 screens in browser (dark mode + light mode), compare against handoff side by side:
  - Dashboard: banner, 4 KPIs, quant bar, chart, donut, insights, dividends, positions
  - Portfolio: tabs, filters, risk bar, table, column configurator
  - Dividendos: KPIs, bar chart, agenda, income table, AI banner
  - Asset detail: hero gradient, tabs, each tab content
  - Transações: KPIs, filter pills, badge types, table
  - Adicionar Ativo: form, dropzone gradient, imports list

- [ ] **Step 5: Commit fixes**

  ```bash
  git add tests/
  git commit -m "fix(web): update E2E selectors for Wave 1 screen rewrites"
  ```

---

## Summary of files changed

| File | Action |
|---|---|
| `src/index.css` | Modified — Nocturne CSS token bridge |
| `src/components/shared/KpiCard.tsx` | Created |
| `src/components/shared/SectionHeader.tsx` | Created |
| `src/components/shared/AiInsightBanner.tsx` | Created |
| `src/components/shared/PeriodSelector.tsx` | Created |
| `src/components/shared/DataTable.tsx` | Created |
| `src/components/shared/index.ts` | Created |
| `src/components/shared/*.spec.tsx` | Created (tests) |
| `src/pages/Index.tsx` | Modified — full JSX rewrite |
| `src/pages/Portfolio.tsx` | Modified — full JSX rewrite |
| `src/pages/Dividends.tsx` | Modified — full JSX rewrite |
| `src/pages/AssetDetail.tsx` | Modified — full JSX rewrite |
| `src/pages/Transactions.tsx` | Modified — full JSX rewrite |
| `src/pages/AddAsset.tsx` | Modified — full JSX rewrite |
| `tests/e2e/*.spec.ts` | Modified — selector fixes |
