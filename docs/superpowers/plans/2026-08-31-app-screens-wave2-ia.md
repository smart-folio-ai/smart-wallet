# Wave 2 — IA Screens Nocturne Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply the Nocturne design system to the 5 IA/Research screens: AIInsights, ChatInteligente, AssetSearch, Comparator, and RiInteligente — UI only, all logic and API calls unchanged.

**Architecture:** Each page is rewritten in-place: same file, same hooks/queries/state, new JSX and inline styles using Nocturne CSS tokens. Shared primitive components from `@/components/shared` (KpiCard, SectionHeader, AiInsightBanner, DataTable, PeriodSelector) are reused. RiInteligente has no handoff spec so receives a token-only cosmetic pass.

**Tech Stack:** React 18, TypeScript, Tailwind (class-based dark mode), Phosphor Icons (ph-fill ph-*), inline style objects with CSS custom properties, @tanstack/react-query (unchanged).

## Global Constraints

- **UI-only rule:** preserve every hook, useQuery, useState, useEffect, service call, navigation, and business-logic function. Only JSX structure and styling change.
- **Nocturne tokens only:** zero hardcoded colors except these allowed rgba values: `rgba(145,132,217,0.15)`, `rgba(145,132,217,0.35)`, `rgba(111,94,217,0.34)`, `rgba(76,201,240,0.16)`, `rgba(47,214,163,0.20)`, `rgba(47,214,163,0)`, `rgba(111,94,217,0.24)`, `rgba(76,201,240,0.10)`, `rgba(76,201,240,0.12)`, `rgba(76,201,240,0.30)`. All other color values must be CSS custom properties (`var(--pos)`, `var(--neg)`, `var(--warn)`, `var(--ac)`, `var(--cy)`, `var(--surf)`, `var(--surf-2)`, `var(--surf-3)`, `var(--surf-4)`, `var(--sunk)`, `var(--hair)`, `var(--hair-soft)`, `var(--nk-card)`, `var(--shadow-sm)`, `var(--shadow-lg)`, `var(--color-neutral-*)`, `var(--color-accent-*)`, `var(--badge-pos-bg)`, `var(--badge-neg-bg)`, `var(--badge-warn-bg)`, `var(--badge-cy-bg)`, `var(--risk-*)`, `var(--aurora-glow)`, `var(--grad-aurora)`, `var(--grad-violet)`, `var(--grad-ember)`).
- **Phosphor icons only:** remove all Lucide imports. Use `<i className="ph-fill ph-[name]" style={{fontSize: N}} />` everywhere. Common mappings: Sparkles→`ph-sparkle`, Search→`ph-magnifying-glass`, TrendingUp→`ph-trend-up`, TrendingDown→`ph-trend-down`, ArrowUp→`ph-arrow-up`, ArrowRight→`ph-arrow-right`, RefreshCw→`ph-arrows-clockwise`, Target→`ph-crosshair`, ShieldAlert→`ph-shield-warning`, Zap→`ph-lightning`, Activity→`ph-activity`, Shuffle→`ph-shuffle`, Info→`ph-info`, ChevronRight→`ph-caret-right`, PieChart→`ph-chart-pie`, GitCompare→`ph-git-diff`, Plus→`ph-plus`, X→`ph-x`, MessageSquare→`ph-chat-circle`, Send→`ph-paper-plane-right`, Bot→`ph-robot`, User2→`ph-user`, RotateCcw→`ph-arrow-counter-clockwise`, FileText→`ph-file-text`, FileSearch→`ph-file-magnifying-glass`, Loader2→`ph-spinner`, Building→`ph-buildings`, Coins→`ph-coins`, BarChart3→`ph-chart-bar`.
- **Shared components:** import from `@/components/shared`. Interfaces: `KpiCard({label, value, delta?, deltaStyle?, sub?, tooltip?})`, `SectionHeader({title, subtitle?, action?})`, `AiInsightBanner({text, cta?, onCta?})`, `DataTable({columns: DataTableColumn[], children, minWidth?})` + `TD_STYLE` + `TD_RIGHT`, `PeriodSelector({options: PeriodOption[], value, onChange})`.
- **No shadcn Card/CardHeader:** replace all `<Card>`, `<CardContent>`, `<CardHeader>`, `<CardTitle>`, `<CardDescription>` with `<section>` or `<div>` using inline styles with `var(--nk-card)` background, `1px solid var(--hair)` border, `border-radius: 8px`.
- **Tailwind background classes only for layout:** `flex`, `grid`, `col-span-*`, `gap-*`, `p-*`, `hidden`, `md:*`, `xl:*` classes are fine. Never use Tailwind color classes (`bg-card`, `text-primary`, `border-primary/20`, `bg-gradient-to-br`, `emerald-*`, `rose-*`, `indigo-*`, `sky-*`, `amber-*`).
- **Pre-existing test failure:** `src/lib/interceptors.spec.ts` fails due to 404 from axios-mock-adapter — exclude it. All other 456 unit tests must pass.
- **Test commands:** `npm run test:unit -- --run`, `npm run type-check`, `npm run lint`.
- **Worktree:** `web/.worktrees/feature/ui-nocturne-wave2` on branch `feature/ui-nocturne-wave2`.
- **Font tokens:** `var(--font-heading)` for numeric displays and section titles, body text uses inherited sans-serif.
- **Interactive controls accessibility:** every clickable `<div>` or `<span>` that acts as a button must be `<button type="button">` with `aria-pressed` where applicable.
- **Row borders in DataTable tbody:** use `borderTop: '1px solid var(--hair-soft)'` on each `<tr>`.

---

### Task 1: AIInsights rewrite (`src/pages/AIInsights.tsx`)

**Files:**
- Modify: `src/pages/AIInsights.tsx`

**Interfaces:**
- Consumes: all existing state and service results unchanged
- Produces: none (no downstream tasks depend on this page's exports)

The handoff defines a two-column layout: left `minmax(0, 1.55fr)` insight card feed, right `minmax(0, 1fr)` model explanation sidebar. Preserve every hook and computed value; only restructure JSX.

**Layout skeleton:**

```tsx
// Outer page wrapper
<div style={{maxWidth: 1200, margin: '0 auto', padding: '28px 16px', display: 'flex', flexDirection: 'column', gap: 20}}>
  {/* Page title */}
  <div style={{display: 'flex', alignItems: 'center', gap: 9}}>
    <i className="ph-fill ph-sparkle" style={{fontSize: 18, color: 'var(--ac)'}} />
    <span style={{fontFamily: 'var(--font-heading)', fontSize: 18, fontWeight: 600}}>IA Insights</span>
  </div>

  {/* Two-column grid */}
  <div style={{display: 'grid', gridTemplateColumns: 'minmax(0,1.55fr) minmax(0,1fr)', gap: 16, alignItems: 'start'}}>
    {/* LEFT — insight feed */}
    <div style={{display: 'flex', flexDirection: 'column', gap: 12}}>
      {/* Tab bar */}
      {/* Insight cards list */}
    </div>
    {/* RIGHT — model sidebar */}
    <div style={{display: 'flex', flexDirection: 'column', gap: 12}}>
      {/* Como a IA definiu seu nível */}
      {/* Ficha do modelo */}
    </div>
  </div>
</div>
```

**Tab bar** (pill-style, height 28px):

```tsx
const INSIGHT_TABS = ['Todos', 'Oportunidades', 'Alertas', 'Estratégias'] as const;
type InsightTab = typeof INSIGHT_TABS[number];
// keep existing viewMode state or add insightTab state if viewMode serves a different purpose
const [insightTab, setInsightTab] = useState<InsightTab>('Todos');

<div style={{display: 'flex', gap: 6, padding: '0 0 8px'}}>
  {INSIGHT_TABS.map(tab => (
    <button
      key={tab}
      type="button"
      aria-pressed={insightTab === tab}
      onClick={() => setInsightTab(tab)}
      style={{
        height: 28, padding: '0 12px', borderRadius: 14, fontSize: 11.5, fontWeight: 500, cursor: 'pointer', border: 'none',
        background: insightTab === tab ? 'var(--ac)' : 'var(--surf-3)',
        color: insightTab === tab ? '#fff' : 'var(--color-neutral-400)',
      }}
    >{tab}</button>
  ))}
</div>
```

**Insight card** — map over `analysisResult?.insights ?? []` (or appropriate field). Each card:

```tsx
// Priority badge: 'Alta' → var(--neg), 'Média' → var(--warn), 'Baixa' → var(--pos)
const PRIORITY_COLOR: Record<string, string> = {Alta: 'var(--neg)', Média: 'var(--warn)', Baixa: 'var(--pos)'};

<div style={{border: '1px solid var(--hair)', borderRadius: 8, background: 'var(--nk-card)', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 8}}>
  {/* Header row: priority badge + category */}
  <div style={{display: 'flex', alignItems: 'center', gap: 8}}>
    <span style={{fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 10, background: PRIORITY_COLOR[insight.priority ?? 'Média'] + '22', color: PRIORITY_COLOR[insight.priority ?? 'Média']}}>
      {insight.priority ?? 'Média'}
    </span>
    <span style={{fontSize: 10.5, color: 'var(--color-neutral-600)', marginLeft: 'auto'}}>{insight.category}</span>
  </div>
  {/* Title */}
  <div style={{fontFamily: 'var(--font-heading)', fontSize: 14.5, fontWeight: 600, lineHeight: 1.35}}>{insight.title}</div>
  {/* Body */}
  <div style={{fontSize: 12.5, color: 'var(--color-neutral-400)', lineHeight: 1.6}}>{insight.body ?? insight.text}</div>
  {/* Depth note (optional) */}
  {insight.note && (
    <div style={{borderLeft: '2px solid var(--color-accent-700)', paddingLeft: 10, fontSize: 11.5, color: 'var(--color-neutral-500)', lineHeight: 1.5}}>
      {insight.note}
    </div>
  )}
  {/* Footer: confidence + sources + when */}
  <div style={{display: 'flex', gap: 12, fontSize: 10.5, color: 'var(--color-neutral-600)', borderTop: '1px solid var(--hair-soft)', paddingTop: 8}}>
    {insight.confidence && <span>Confiança: {insight.confidence}%</span>}
    {insight.sources && <span>Fontes: {insight.sources}</span>}
    {insight.when && <span>{insight.when}</span>}
  </div>
  {/* Action buttons */}
  <div style={{display: 'flex', gap: 8}}>
    <button type="button" style={{flex: 1, height: 32, borderRadius: 6, border: '1px solid var(--hair)', background: 'transparent', fontSize: 11.5, color: 'var(--color-neutral-400)', cursor: 'pointer'}}>
      Trilha de auditoria
    </button>
    <button type="button" style={{flex: 1, height: 32, borderRadius: 6, border: '1px solid var(--color-accent-700)', background: 'transparent', fontSize: 11.5, color: 'var(--color-accent-300)', cursor: 'pointer'}}>
      Ver análise completa
    </button>
  </div>
</div>
```

**If `analysisResult` has no `.insights` array** (check the actual shape of `AiAnalysisResult`), adapt to use whichever top-level fields exist (`rebalancing`, `errorRadar?.alerts`, etc.) — the card structure above applies to each item. Map a minimum of 1 card; show the existing `UpgradeBanner` if plan is insufficient.

**Right sidebar — "Como a IA definiu seu nível" card:**

```tsx
<div style={{border: '1px solid var(--hair)', borderRadius: 8, background: 'var(--nk-card)'}}>
  <SectionHeader title="Como a IA definiu seu nível" />
  <div style={{padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 12}}>
    {/* Map over portfolioScore?.signals or derive from analysisResult */}
    {(portfolioScore?.score !== undefined ? [
      {label: 'Score geral', value: portfolioScore.score, max: 100},
      // add more signals if available on the type
    ] : []).map(sig => (
      <div key={sig.label} style={{display: 'flex', alignItems: 'center', gap: 8}}>
        <span style={{fontSize: 12, color: 'var(--color-neutral-400)', width: 120, flexShrink: 0}}>{sig.label}</span>
        <div style={{flex: 1, height: 6, borderRadius: 3, background: 'var(--sunk)', overflow: 'hidden'}}>
          <div style={{height: '100%', width: `${Math.min((sig.value / sig.max) * 100, 100)}%`, background: 'var(--ac)', borderRadius: 3}} />
        </div>
        <span style={{fontSize: 12, fontVariantNumeric: 'tabular-nums', width: 36, textAlign: 'right'}}>{sig.value}</span>
      </div>
    ))}
    <button type="button" style={{marginTop: 4, width: '100%', height: 32, borderRadius: 6, border: '1px solid var(--hair)', background: 'transparent', fontSize: 12, color: 'var(--color-neutral-400)', cursor: 'pointer'}}>
      Assumir controle manual
    </button>
  </div>
</div>
```

**Right sidebar — "Ficha do modelo" card:**

```tsx
<div style={{border: '1px solid var(--hair)', borderRadius: 8, background: 'var(--nk-card)'}}>
  <SectionHeader title="Ficha do modelo" />
  <div style={{padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8}}>
    {[
      {label: 'Modelo', value: 'Trackerr IA v2'},
      {label: 'Atualizado', value: 'Tempo real'},
      {label: 'Dados usados', value: 'Carteira, mercado, fundamentos'},
      {label: 'Regulatório', value: 'Não constitui consultoria de investimento'},
    ].map(row => (
      <div key={row.label} style={{display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 12}}>
        <span style={{color: 'var(--color-neutral-600)'}}>{row.label}</span>
        <span style={{color: 'var(--color-neutral-300)', textAlign: 'right', maxWidth: 200}}>{row.value}</span>
      </div>
    ))}
  </div>
</div>
```

**Loading guard:** keep existing `if (loading) return <div>…</div>` or equivalent.

**Keep:** `ScoreRow`, `BadgePremium`, `UpgradeBanner`, `InvestorProfileBadge`, `RagAskPanel`, `AiGeneratedNotice` imports — remove only if unused after the rewrite. The `RagAskPanel` can be placed at the bottom of the left column if there is no natural mapping to the handoff layout.

- [ ] **Step 1:** Read `src/pages/AIInsights.tsx` fully to understand the complete state shape and `AiAnalysisResult` type
- [ ] **Step 2:** Remove all Lucide icon imports; keep all service/hook/util imports
- [ ] **Step 3:** Replace all `<Card>` / `<CardContent>` / `<CardHeader>` with `<div>` / `<section>` using inline styles per the patterns above
- [ ] **Step 4:** Implement the two-column grid layout with tab bar, insight cards (mapped from real data), and right sidebar
- [ ] **Step 5:** Replace all Tailwind color classes (`emerald-*`, `rose-*`, `indigo-*`, `bg-gradient-to-br`) with Nocturne tokens
- [ ] **Step 6:** Run `npm run type-check` and `npm run lint` — fix all errors
- [ ] **Step 7:** Run `npm run test:unit -- --run` — confirm 456 pass, 1 pre-existing fail
- [ ] **Step 8:** Commit: `feat(web): nocturne redesign — AIInsights`

---

### Task 2: ChatInteligente rewrite (`src/pages/ChatInteligente.tsx`)

**Files:**
- Modify: `src/pages/ChatInteligente.tsx`

**Interfaces:**
- Consumes: existing `messages`, `question`, `sending`, `investorProfile` state; `askStructuredCopilotChat`; `ChatMentionInput`; `ResponseEvidence`; `AssistantStructuredBlocks`
- Produces: none

**Layout skeleton** — two-column grid:

```tsx
<div style={{maxWidth: 1200, margin: '0 auto', padding: '28px 16px'}}>
  <div style={{display: 'grid', gridTemplateColumns: 'minmax(0,1.6fr) minmax(0,1fr)', gap: 16, alignItems: 'start'}}>
    {/* LEFT — chat panel */}
    <section style={{border: '1px solid var(--hair)', borderRadius: 8, background: 'var(--nk-card)', minHeight: 620, display: 'flex', flexDirection: 'column'}}>
      {/* Header */}
      {/* Message area */}
      {/* Input area */}
    </section>
    {/* RIGHT — context + history */}
    <div style={{display: 'flex', flexDirection: 'column', gap: 12}}>
      {/* Contexto em uso */}
      {/* Histórico */}
    </div>
  </div>
</div>
```

**Chat panel header:**

```tsx
<div style={{padding: '12px 16px', borderBottom: '1px solid var(--hair-soft)', display: 'flex', alignItems: 'center', gap: 10}}>
  <i className="ph-fill ph-sparkle" style={{fontSize: 16, color: 'var(--ac)'}} />
  <div>
    <div style={{fontFamily: 'var(--font-heading)', fontSize: 14, fontWeight: 600}}>Copiloto Trackerr</div>
    <div style={{fontSize: 11, color: 'var(--color-neutral-600)'}}>Análise em tempo real da sua carteira</div>
  </div>
  <span style={{marginLeft: 'auto', fontSize: 10.5, padding: '2px 8px', borderRadius: 10, background: 'var(--badge-cy-bg)', color: 'var(--cy)'}}>
    contexto: carteira consolidada
  </span>
</div>
```

**Message area** (keep existing scroll logic and message rendering):

```tsx
<div ref={messagesEndRef} style={{flex: 1, overflowY: 'auto', padding: '16.8px', display: 'flex', flexDirection: 'column', gap: '16.8px'}}>
  {/* Empty state */}
  {messages.length === 0 && (
    <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, paddingTop: 40}}>
      <i className="ph-fill ph-sparkle" style={{fontSize: 32, color: 'var(--ac)'}} />
      <div style={{fontSize: 13, color: 'var(--color-neutral-500)', textAlign: 'center'}}>Como posso ajudar com sua carteira hoje?</div>
      <div style={{display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center'}}>
        {QUICK_PROMPTS.map(p => (
          <button key={p} type="button" onClick={() => setQuestion(p)}
            style={{height: 28, padding: '0 12px', borderRadius: 14, border: '1px solid var(--hair)', background: 'transparent', fontSize: 11.5, color: 'var(--color-neutral-400)', cursor: 'pointer'}}>
            {p}
          </button>
        ))}
      </div>
    </div>
  )}
  {/* Message bubbles */}
  {messages.map(msg => (
    <div key={msg.id} style={{display: 'flex', flexDirection: 'column', gap: 6, alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start'}}>
      {msg.role === 'assistant' && (
        <div style={{display: 'flex', alignItems: 'center', gap: 5}}>
          <i className="ph-fill ph-sparkle" style={{fontSize: 12, color: 'var(--ac)'}} />
          <span style={{fontSize: 9.5, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-neutral-600)'}}>Copiloto</span>
        </div>
      )}
      <div style={{
        maxWidth: '85%', padding: '10px 14px', borderRadius: 8, fontSize: 13, lineHeight: 1.6,
        background: msg.role === 'user' ? 'var(--ac)' : 'var(--surf-3)',
        color: msg.role === 'user' ? '#fff' : 'var(--color-neutral-200)',
        border: msg.role === 'assistant' ? '1px solid var(--hair)' : 'none',
      }}>
        {msg.text}
        {/* Keep ResponseEvidence and AssistantStructuredBlocks as-is — they are logic components */}
      </div>
    </div>
  ))}
</div>
```

**Input area:**

```tsx
<div style={{borderTop: '1px solid var(--hair-soft)', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 10}}>
  {/* Quick-prompt chips */}
  <div style={{display: 'flex', gap: 6, flexWrap: 'wrap'}}>
    {COPILOT_FLOWS.map(f => (
      <button key={f.flow} type="button" onClick={() => setQuestion(f.question)}
        style={{height: 28, padding: '0 12px', borderRadius: 14, border: '1px solid var(--hair)', background: 'transparent', fontSize: 11.5, color: 'var(--color-neutral-400)', cursor: 'pointer'}}>
        {f.label}
      </button>
    ))}
  </div>
  {/* Input + send */}
  <div style={{display: 'flex', gap: 8, border: '1px solid var(--hair)', borderRadius: 8, padding: '8px 12px', alignItems: 'flex-end'}}>
    <ChatMentionInput value={question} onChange={setQuestion} onSubmit={handleSend} placeholder="Pergunte sobre sua carteira…" />
    <button type="button" onClick={handleSend} disabled={sending}
      style={{flexShrink: 0, width: 32, height: 32, borderRadius: 6, border: 'none', background: 'var(--ac)', color: '#fff', cursor: 'pointer', display: 'grid', placeItems: 'center'}}>
      <i className="ph-fill ph-paper-plane-right" style={{fontSize: 14}} />
    </button>
  </div>
  <div style={{fontSize: 10, color: 'var(--color-neutral-600)'}}>Conteúdo gerado por IA. Não constitui consultoria de investimentos.</div>
</div>
```

**Right sidebar — "Contexto em uso":**

```tsx
<div style={{border: '1px solid var(--hair)', borderRadius: 8, background: 'var(--nk-card)'}}>
  <SectionHeader title="Contexto em uso" />
  <div style={{padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 10}}>
    {[
      {icon: 'ph-chart-pie', label: 'Carteira consolidada', meta: 'atualizada agora'},
      {icon: 'ph-calendar', label: 'Histórico 12 meses', meta: 'dividendos + trades'},
      {icon: 'ph-user-circle', label: `Perfil ${investorProfile ?? 'Moderado'}`, meta: 'detectado automaticamente'},
    ].map(ctx => (
      <div key={ctx.label} style={{display: 'flex', alignItems: 'center', gap: 10}}>
        <i className={`ph-fill ${ctx.icon}`} style={{fontSize: 16, color: 'var(--ac)', flexShrink: 0}} />
        <div>
          <div style={{fontSize: 12.5, fontWeight: 500}}>{ctx.label}</div>
          <div style={{fontSize: 11, color: 'var(--color-neutral-600)'}}>{ctx.meta}</div>
        </div>
      </div>
    ))}
  </div>
</div>
```

**Right sidebar — "Histórico":**

```tsx
<div style={{border: '1px solid var(--hair)', borderRadius: 8, background: 'var(--nk-card)'}}>
  <SectionHeader title="Histórico" />
  <div style={{padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8}}>
    {messages.filter(m => m.role === 'user').slice(-5).reverse().map(m => (
      <div key={m.id} style={{display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 12}}>
        <span style={{color: 'var(--color-neutral-400)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1}}>{m.text}</span>
        <span style={{color: 'var(--color-neutral-600)', flexShrink: 0, fontSize: 10.5}}>agora</span>
      </div>
    ))}
    {messages.filter(m => m.role === 'user').length === 0 && (
      <div style={{fontSize: 11.5, color: 'var(--color-neutral-600)'}}>Nenhuma pergunta ainda.</div>
    )}
  </div>
</div>
```

**Keep:** `PremiumBlur` gate around entire content; `AiGeneratedNotice`; `ResponseEvidence`; `AssistantStructuredBlocks`; all state and handlers.

**AssistantStructuredBlocks restyling** (if the component uses hardcoded Tailwind color classes internally, do NOT modify that component — only restyle message bubbles in this file).

- [ ] **Step 1:** Read `src/pages/ChatInteligente.tsx` fully, note `handleSend` function name and `messagesEndRef` scroll logic
- [ ] **Step 2:** Remove all Lucide icon imports
- [ ] **Step 3:** Replace single-card layout with two-column grid per skeleton above
- [ ] **Step 4:** Implement header, message area, input area in the left panel
- [ ] **Step 5:** Implement right sidebar "Contexto em uso" and "Histórico" panels
- [ ] **Step 6:** Replace all Tailwind color classes in this file with Nocturne tokens
- [ ] **Step 7:** Run type-check + lint; fix errors
- [ ] **Step 8:** Run unit tests — confirm 456 pass
- [ ] **Step 9:** Commit: `feat(web): nocturne redesign — ChatInteligente`

---

### Task 3: AssetSearch screener rewrite (`src/pages/AssetSearch.tsx`)

**Files:**
- Modify: `src/pages/AssetSearch.tsx`

**Interfaces:**
- Consumes: `allStocks` (array of `Asset`), `searchTerm`, `debouncedSearch`, existing `useQuery` fetching logic, `navigate`
- Produces: none

The handoff replaces the card-grid + type-tabs with a screener: search bar → preset chip row → DataTable. Preserve all existing hooks and queries; only rewrite JSX.

**Remove:** `<Tabs>`, `<TabsList>`, `<TabsTrigger>`, `<TabsContent>`, `AssetCard` local component, `activeTab` state. Keep: `searchTerm`, `debouncedSearch`, `showSuggestions`, `searchRef`, both `useQuery` calls, `navigate`.

**Preset chips** (local constant, no state needed — clicking sets `searchTerm`):

```tsx
const SCREENER_PRESETS = [
  {label: 'DY > 8%', term: 'dy'},
  {label: 'P/L < 10', term: 'pl'},
  {label: 'ROE > 15%', term: 'roe'},
  {label: 'FIIs', term: 'FII'},
  {label: 'Blue chips', term: 'PETR'},
];
```

**Full layout:**

```tsx
<div style={{maxWidth: 1200, margin: '0 auto', padding: '28px 16px', display: 'flex', flexDirection: 'column', gap: 20}}>
  {/* Page title */}
  <div style={{display: 'flex', alignItems: 'center', gap: 9}}>
    <i className="ph-fill ph-magnifying-glass" style={{fontSize: 18, color: 'var(--ac)'}} />
    <span style={{fontFamily: 'var(--font-heading)', fontSize: 18, fontWeight: 600}}>Buscar Ativos</span>
  </div>

  {/* Search bar */}
  <div style={{display: 'flex', gap: 8, alignItems: 'center'}}>
    <div ref={searchRef} style={{flex: 1, position: 'relative'}}>
      <i className="ph-fill ph-magnifying-glass" style={{position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 16, color: 'var(--color-neutral-600)', pointerEvents: 'none'}} />
      <input
        value={searchTerm}
        onChange={e => { setSearchTerm(e.target.value); setShowSuggestions(true); }}
        placeholder="Buscar por ticker, nome ou critério…"
        style={{width: '100%', height: 46, paddingLeft: 38, paddingRight: searchTerm ? 36 : 12, border: '1px solid var(--hair)', borderRadius: 8, background: 'var(--surf-3)', fontSize: 13, outline: 'none', color: 'inherit'}}
      />
      {searchTerm && (
        <button type="button" onClick={() => { setSearchTerm(''); setShowSuggestions(false); }}
          style={{position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-neutral-500)'}}>
          <i className="ph-fill ph-x" style={{fontSize: 14}} />
        </button>
      )}
      {/* Autocomplete dropdown — keep existing logic, restyle: */}
      {showSuggestions && searchTerm && (
        <div style={{position: 'absolute', top: 50, left: 0, right: 0, zIndex: 50, border: '1px solid var(--hair)', borderRadius: 8, background: 'var(--surf-2)', boxShadow: 'var(--shadow-lg)', overflow: 'hidden'}}>
          {/* keep existing suggestion items, restyle hover to var(--surf-3) */}
        </div>
      )}
    </div>
    <button type="button"
      style={{height: 46, padding: '0 20px', borderRadius: 8, border: 'none', background: 'var(--grad-violet)', color: '#fff', fontSize: 13, fontWeight: 500, cursor: 'pointer'}}>
      Buscar
    </button>
  </div>

  {/* Preset chips */}
  <div style={{display: 'flex', gap: 6, flexWrap: 'wrap'}}>
    {SCREENER_PRESETS.map(p => (
      <button key={p.label} type="button" onClick={() => setSearchTerm(p.term)}
        style={{height: 28, padding: '0 12px', borderRadius: 14, border: '1px solid var(--hair)', background: 'transparent', fontSize: 11.5, color: 'var(--color-neutral-400)', cursor: 'pointer'}}>
        {p.label}
      </button>
    ))}
  </div>

  {/* Results section */}
  <section style={{border: '1px solid var(--hair)', borderRadius: 8, background: 'var(--nk-card)'}}>
    <SectionHeader
      title="Screener"
      subtitle={`${filteredStocks.length} ativos encontrados`}
    />
    {isLoading ? (
      <div style={{padding: '28px 16px', textAlign: 'center', color: 'var(--color-neutral-600)'}}>Carregando…</div>
    ) : (
      <DataTable
        minWidth={820}
        columns={[
          {label: 'Ativo'},
          {label: 'Setor'},
          {label: 'Preço', align: 'right'},
          {label: 'Variação', align: 'right'},
          {label: 'Volume', align: 'right'},
          {label: 'Market Cap', align: 'right'},
        ]}
      >
        {filteredStocks.slice(0, 50).map(asset => (
          <tr key={asset.stock} onClick={() => navigate(`/ativos/${asset.stock}`)}
            style={{cursor: 'pointer', borderTop: '1px solid var(--hair-soft)'}}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--surf-3)')}
            onMouseLeave={e => (e.currentTarget.style.background = '')}>
            <td style={TD_STYLE}>
              <div style={{display: 'flex', alignItems: 'center', gap: 9}}>
                {asset.logo && <img src={asset.logo} alt="" style={{width: 24, height: 24, borderRadius: 4, objectFit: 'contain'}} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />}
                <span style={{fontWeight: 600, fontSize: 12.5}}>{asset.stock}</span>
              </div>
            </td>
            <td style={TD_STYLE}>
              <span style={{fontSize: 11.5, color: 'var(--color-neutral-500)'}}>{asset.sector || '—'}</span>
            </td>
            <td style={TD_RIGHT}>{formatCurrency(asset.close)}</td>
            <td style={{...TD_RIGHT, color: asset.change >= 0 ? 'var(--pos)' : 'var(--neg)'}}>
              {asset.change >= 0 ? '+' : ''}{asset.change?.toFixed(2)}%
            </td>
            <td style={{...TD_RIGHT, color: 'var(--color-neutral-500)', fontSize: 11.5}}>
              {asset.volume ? (asset.volume / 1e6).toFixed(1) + 'M' : '—'}
            </td>
            <td style={{...TD_RIGHT, color: 'var(--color-neutral-500)', fontSize: 11.5}}>
              {asset.market_cap ? (asset.market_cap / 1e9).toFixed(1) + 'B' : '—'}
            </td>
          </tr>
        ))}
      </DataTable>
    )}
  </section>
</div>
```

**`filteredStocks` derivation** — keep existing filtering logic, just rename variable if needed:

```tsx
const allStocksFlat: Asset[] = useMemo(() => {
  const raw = Array.isArray(allStocks) ? allStocks[0] : allStocks;
  return Array.isArray((raw as any)?.stocks) ? (raw as any).stocks : [];
}, [allStocks]);

const filteredStocks: Asset[] = useMemo(() => {
  if (!debouncedSearch) return allStocksFlat;
  const q = debouncedSearch.toUpperCase();
  return allStocksFlat.filter(a =>
    a.stock?.toUpperCase().includes(q) ||
    a.name?.toUpperCase().includes(q) ||
    a.sector?.toUpperCase().includes(q) ||
    a.type?.toUpperCase().includes(q)
  );
}, [allStocksFlat, debouncedSearch]);
```

- [ ] **Step 1:** Read `src/pages/AssetSearch.tsx` fully — note exact `allStocks` response shape (array vs object)
- [ ] **Step 2:** Remove `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent`, `activeTab` state, `AssetCard` local component, Lucide imports, all Card imports
- [ ] **Step 3:** Add `SCREENER_PRESETS` constant; add `filteredStocks` memo
- [ ] **Step 4:** Implement full new layout: title → search bar → preset chips → DataTable section
- [ ] **Step 5:** Import `DataTable`, `TD_STYLE`, `TD_RIGHT`, `SectionHeader` from `@/components/shared`
- [ ] **Step 6:** Run type-check + lint — fix errors
- [ ] **Step 7:** Run unit tests — confirm 456 pass
- [ ] **Step 8:** Commit: `feat(web): nocturne redesign — AssetSearch screener`

---

### Task 4: Comparator rewrite (`src/pages/Comparator.tsx`)

**Files:**
- Modify: `src/pages/Comparator.tsx`

**Interfaces:**
- Consumes: `selectedAssets`, `inputValue`, `stocksSearchData`, `quotesData`, `hasComparator`, `StockAutocompleteInput`
- Produces: none

The handoff adds a mode toggle (Renda Variável / Renda Fixa) and restructures both views. Renda Fixa mode is new UI with a static form; Renda Variável mode keeps existing comparison logic but adds inline bars.

**New state:**

```tsx
type CompMode = 'equity' | 'fixed';
const [compMode, setCompMode] = useState<CompMode>('equity');

// Renda Fixa form state (UI-only, no API)
const [rfPrincipal, setRfPrincipal] = useState('10000');
const [rfPrazo, setRfPrazo] = useState('24');
const [rfIPCA, setRfIPCA] = useState('4.5');
const [rfCDI, setRfCDI] = useState('10.5');
```

**Mode toggle:**

```tsx
<div style={{display: 'inline-flex', border: '1px solid var(--hair)', borderRadius: 8, overflow: 'hidden'}}>
  {([['equity', 'Renda Variável'], ['fixed', 'Renda Fixa']] as const).map(([mode, label]) => (
    <button key={mode} type="button" aria-pressed={compMode === mode} onClick={() => setCompMode(mode)}
      style={{padding: '7px 18px', fontSize: 12.5, fontWeight: 500, cursor: 'pointer', border: 'none',
        background: compMode === mode ? 'var(--ac)' : 'transparent',
        color: compMode === mode ? '#fff' : 'var(--color-neutral-400)'}}>
      {label}
    </button>
  ))}
</div>
```

**Full page layout:**

```tsx
<div style={{maxWidth: 1200, margin: '0 auto', padding: '28px 16px', display: 'flex', flexDirection: 'column', gap: 20}}>
  {/* Header row: title + mode toggle */}
  <div style={{display: 'flex', alignItems: 'center', gap: 16}}>
    <div style={{display: 'flex', alignItems: 'center', gap: 9}}>
      <i className="ph-fill ph-git-diff" style={{fontSize: 18, color: 'var(--ac)'}} />
      <span style={{fontFamily: 'var(--font-heading)', fontSize: 18, fontWeight: 600}}>Comparador</span>
    </div>
    {/* mode toggle here */}
  </div>

  {compMode === 'equity' ? <EquityContent /> : <FixedContent />}
</div>
```

**Equity mode** — asset selector + comparison table with inline bars:

```tsx
{/* Asset selector (keep existing StockAutocompleteInput logic) */}
<section style={{border: '1px solid var(--hair)', borderRadius: 8, background: 'var(--nk-card)', padding: '14px 16px'}}>
  <div style={{display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center'}}>
    {selectedAssets.map(a => (
      <div key={a.symbol} style={{display: 'flex', alignItems: 'center', gap: 6, height: 28, padding: '0 10px', borderRadius: 14, background: 'var(--badge-cy-bg)', color: 'var(--cy)', fontSize: 12}}>
        {a.symbol}
        <button type="button" onClick={() => removeAsset(a.symbol)} style={{background: 'none', border: 'none', cursor: 'pointer', color: 'var(--cy)', padding: 0, display: 'flex'}}>
          <i className="ph-fill ph-x" style={{fontSize: 11}} />
        </button>
      </div>
    ))}
    {/* Dashed add button */}
    <div style={{position: 'relative'}}>
      <StockAutocompleteInput value={inputValue} onChange={setInputValue} placeholder="+ adicionar ativo"
        inputStyle={{height: 28, borderRadius: 14, border: '1px dashed var(--hair)', background: 'transparent', fontSize: 12, padding: '0 12px', color: 'var(--color-neutral-400)'}} />
    </div>
  </div>
</section>

{/* Comparison table — PremiumBlur gate */}
<PremiumBlur enabled={!hasComparator}>
  {selectedAssets.length > 0 && (
    <section style={{border: '1px solid var(--hair)', borderRadius: 8, background: 'var(--nk-card)'}}>
      <SectionHeader title="Comparação lado a lado" subtitle={`${selectedAssets.length} ativos selecionados`} />
      <DataTable minWidth={720} columns={[{label: 'Indicador'}, ...selectedAssets.map(a => ({label: a.symbol, align: 'right' as const}))]}>
        {COMPARISON_ROWS.map(row => {
          // Find best value across assets for this row
          const values = selectedAssets.map(a => getQuoteValue(quotesData, a.symbol, row.key));
          const best = row.higherIsBetter ? Math.max(...values.filter(v => v !== null) as number[]) : Math.min(...values.filter(v => v !== null) as number[]);
          return (
            <tr key={row.key} style={{borderTop: '1px solid var(--hair-soft)'}}>
              <td style={TD_STYLE}><span style={{fontSize: 12.5, color: 'var(--color-neutral-400)'}}>{row.label}</span></td>
              {selectedAssets.map(a => {
                const val = getQuoteValue(quotesData, a.symbol, row.key);
                const isBest = val !== null && val === best && values.filter(v => v !== null).length > 1;
                return (
                  <td key={a.symbol} style={TD_RIGHT}>
                    <div style={{display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3}}>
                      {/* Bar */}
                      {val !== null && best !== 0 && (
                        <div style={{width: 80, height: 4, borderRadius: 2, background: 'var(--sunk)', overflow: 'hidden'}}>
                          <div style={{height: '100%', width: `${Math.min(Math.abs(val / best) * 100, 100)}%`, background: isBest ? 'var(--pos)' : 'var(--ac)', borderRadius: 2}} />
                        </div>
                      )}
                      <span style={{fontSize: 12.5, fontVariantNumeric: 'tabular-nums', fontWeight: isBest ? 600 : 400, color: isBest ? 'var(--pos)' : undefined}}>
                        {val !== null ? row.format(val) : '—'}
                      </span>
                    </div>
                  </td>
                );
              })}
            </tr>
          );
        })}
      </DataTable>
    </section>
  )}
</PremiumBlur>
```

**`COMPARISON_ROWS` constant** (module-level):

```tsx
const COMPARISON_ROWS: Array<{key: string; label: string; higherIsBetter: boolean; format: (v: number) => string}> = [
  {key: 'close', label: 'Preço Atual', higherIsBetter: false, format: v => formatCurrency(v)},
  {key: 'change', label: 'Variação', higherIsBetter: true, format: v => `${v >= 0 ? '+' : ''}${v?.toFixed(2)}%`},
  {key: 'pl', label: 'P/L', higherIsBetter: false, format: v => v?.toFixed(1)},
  {key: 'pvp', label: 'P/VP', higherIsBetter: false, format: v => v?.toFixed(2)},
  {key: 'dy', label: 'Dividend Yield', higherIsBetter: true, format: v => `${v?.toFixed(1)}%`},
  {key: 'roe', label: 'ROE', higherIsBetter: true, format: v => `${v?.toFixed(1)}%`},
  {key: 'dividaPatrimonio', label: 'Dívida/Patrimônio', higherIsBetter: false, format: v => v?.toFixed(2)},
];
```

**`getQuoteValue` helper** (module-level, reads from existing `quotesData` shape — read the actual shape before implementing):

```tsx
function getQuoteValue(quotesData: Record<string, any> | undefined, symbol: string, key: string): number | null {
  const q = quotesData?.[symbol];
  if (!q) return null;
  const val = q[key] ?? q?.quote?.[key];
  return typeof val === 'number' ? val : null;
}
```

**Renda Fixa mode** (new UI, no API calls — UI-only placeholder):

**Fixed income instruments:**

```tsx
const RF_INSTRUMENTS = [
  {name: 'Tesouro IPCA+ 2029', kind: 'Tesouro', rate: 'IPCA+6.2%'},
  {name: 'CDB Banco Inter 110% CDI', kind: 'CDB', rate: '110% CDI'},
  {name: 'LCI Itaú 95% CDI', kind: 'LCI', rate: '95% CDI', exempt: true},
  {name: 'LCA Bradesco 93% CDI', kind: 'LCA', rate: '93% CDI', exempt: true},
  {name: 'CRI 13.5% a.a.', kind: 'CRI', rate: '13.5%', exempt: true},
];
```

```tsx
{/* Assumptions form */}
<section style={{border: '1px solid var(--hair)', borderRadius: 8, background: 'var(--nk-card)', padding: '14px 16px'}}>
  <SectionHeader title="Parâmetros da simulação" />
  <div style={{display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, padding: '14px 16px'}}>
    {[
      {label: 'Principal (R$)', value: rfPrincipal, set: setRfPrincipal, placeholder: '10.000'},
      {label: 'Prazo (meses)', value: rfPrazo, set: setRfPrazo, placeholder: '24'},
      {label: 'IPCA (% a.a.)', value: rfIPCA, set: setRfIPCA, placeholder: '4.5'},
      {label: 'CDI (% a.a.)', value: rfCDI, set: setRfCDI, placeholder: '10.5'},
      {label: 'IR padrão (%)', value: '15', set: () => {}, placeholder: '15'},
    ].map(f => (
      <div key={f.label}>
        <label style={{fontSize: 10.5, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-neutral-600)', display: 'block', marginBottom: 5}}>
          {f.label}
        </label>
        <input value={f.value} onChange={e => f.set(e.target.value)} placeholder={f.placeholder}
          style={{width: '100%', height: 34, border: '1px solid var(--hair)', borderRadius: 6, background: 'var(--surf-3)', padding: '0 10px', fontSize: 12.5, color: 'inherit', outline: 'none'}} />
      </div>
    ))}
  </div>
</section>

{/* Fixed income comparison table */}
<section style={{border: '1px solid var(--hair)', borderRadius: 8, background: 'var(--nk-card)'}}>
  <SectionHeader title="Renda fixa lado a lado" />
  <DataTable minWidth={900} columns={[
    {label: 'Ativo'},
    {label: 'Tipo'},
    {label: 'Taxa'},
    {label: 'Bruto', align: 'right'},
    {label: 'Imposto', align: 'right'},
    {label: 'Líquido', align: 'right'},
    {label: 'Real', align: 'right'},
    {label: 'Tag'},
  ]}>
    {RF_INSTRUMENTS.map(inst => {
      const principal = parseFloat(rfPrincipal.replace(/\D/g, '')) || 10000;
      const months = parseInt(rfPrazo) || 24;
      const cdi = parseFloat(rfCDI) / 100;
      const ipca = parseFloat(rfIPCA) / 100;
      // Simplified calculation for display purposes
      const bruto = principal * (1 + (inst.rate.includes('CDI') ? cdi * (parseFloat(inst.rate) / 100) : ipca + 0.062)) ** (months / 12) - principal;
      const ir = inst.exempt ? 0 : bruto * (months <= 6 ? 0.225 : months <= 12 ? 0.20 : months <= 24 ? 0.175 : 0.15);
      const liquido = bruto - ir;
      const real = liquido - principal * ((1 + ipca) ** (months / 12) - 1);
      const pct = (liquido / principal) * 100;
      const maxPct = 25; // for bar width scale
      return (
        <tr key={inst.name} style={{borderTop: '1px solid var(--hair-soft)'}}>
          <td style={TD_STYLE}><span style={{fontSize: 12.5, fontWeight: 500}}>{inst.name}</span></td>
          <td style={TD_STYLE}><span style={{fontSize: 11, padding: '2px 7px', borderRadius: 10, background: 'var(--badge-cy-bg)', color: 'var(--cy)'}}>{inst.kind}</span></td>
          <td style={TD_STYLE}><span style={{fontSize: 12, color: 'var(--color-neutral-400)'}}>{inst.rate}</span></td>
          <td style={TD_RIGHT}>{formatCurrency(bruto)}</td>
          <td style={{...TD_RIGHT, color: 'var(--neg)'}}>{inst.exempt ? 'Isento' : formatCurrency(ir)}</td>
          <td style={TD_RIGHT}>
            <div style={{display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3}}>
              <div style={{width: 80, height: 4, borderRadius: 2, background: 'var(--sunk)', overflow: 'hidden'}}>
                <div style={{height: '100%', width: `${Math.min((pct / maxPct) * 100, 100)}%`, background: 'var(--pos)', borderRadius: 2}} />
              </div>
              <span style={{fontVariantNumeric: 'tabular-nums', fontSize: 12.5}}>{formatCurrency(liquido)}</span>
            </div>
          </td>
          <td style={{...TD_RIGHT, color: real >= 0 ? 'var(--pos)' : 'var(--neg)', fontSize: 12}}>{formatCurrency(real)}</td>
          <td style={TD_STYLE}>
            {inst.exempt && <span style={{fontSize: 10.5, padding: '2px 7px', borderRadius: 10, background: 'var(--badge-pos-bg)', color: 'var(--pos)'}}>Isento IR</span>}
          </td>
        </tr>
      );
    })}
  </DataTable>
</section>

{/* AI verdict panel + IR table below (1.25fr / 1fr grid) */}
<div style={{display: 'grid', gridTemplateColumns: 'minmax(0,1.25fr) minmax(0,1fr)', gap: 16}}>
  {/* AI verdict */}
  <div style={{border: '1px solid rgba(145,132,217,0.35)', borderRadius: 8, background: 'linear-gradient(135deg, rgba(111,94,217,0.10) 0%, rgba(76,201,240,0.06) 100%)', padding: '16px'}}>
    <div style={{display: 'flex', gap: 8, alignItems: 'flex-start'}}>
      <i className="ph-fill ph-sparkle" style={{fontSize: 16, color: 'var(--ac)', flexShrink: 0, marginTop: 2}} />
      <div style={{display: 'flex', flexDirection: 'column', gap: 8}}>
        <div style={{fontSize: 13, fontWeight: 600}}>Para {rfPrazo} meses com R$ {Number(rfPrincipal).toLocaleString('pt-BR')}</div>
        <ul style={{margin: 0, paddingLeft: 16, display: 'flex', flexDirection: 'column', gap: 5}}>
          <li style={{fontSize: 12, color: 'var(--color-neutral-400)'}}>CDB 110% CDI tende a superar LCI em prazos acima de 24 meses.</li>
          <li style={{fontSize: 12, color: 'var(--color-neutral-400)'}}>LCI/LCA isentos de IR são vantajosos em alíquotas de 20–22,5%.</li>
          <li style={{fontSize: 12, color: 'var(--color-neutral-400)'}}>Tesouro IPCA+ protege contra inflação acima de {rfIPCA}% a.a.</li>
        </ul>
      </div>
    </div>
  </div>
  {/* IR regressive table */}
  <div style={{border: '1px solid var(--hair)', borderRadius: 8, background: 'var(--nk-card)', padding: '14px 16px'}}>
    <div style={{fontFamily: 'var(--font-heading)', fontSize: 13, fontWeight: 600, marginBottom: 12}}>IR Regressivo</div>
    {[
      {prazo: 'Até 6 meses', aliq: '22,5%'},
      {prazo: '6 a 12 meses', aliq: '20,0%'},
      {prazo: '12 a 24 meses', aliq: '17,5%'},
      {prazo: 'Acima de 24 meses', aliq: '15,0%'},
    ].map((row, i) => (
      <div key={i} style={{display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderTop: i > 0 ? '1px solid var(--hair-soft)' : undefined, fontSize: 12}}>
        <span style={{color: 'var(--color-neutral-500)'}}>{row.prazo}</span>
        <span style={{fontVariantNumeric: 'tabular-nums', color: 'var(--neg)'}}>{row.aliq}</span>
      </div>
    ))}
    <div style={{marginTop: 10, fontSize: 10.5, color: 'var(--color-neutral-600)', lineHeight: 1.5}}>
      LCI, LCA, CRI e CRA são isentos de IR para pessoa física.
    </div>
  </div>
</div>
```

- [ ] **Step 1:** Read `src/pages/Comparator.tsx` fully — note exact `quotesData` type shape and `removeAsset` handler
- [ ] **Step 2:** Add `CompMode`, `rfPrincipal/rfPrazo/rfIPCA/rfCDI` state; add `COMPARISON_ROWS`, `RF_INSTRUMENTS`, `getQuoteValue` module-level constants
- [ ] **Step 3:** Remove Lucide imports; remove `<Card>`, `<CardContent>`, `<Separator>`, `<Badge>` imports; keep `PremiumBlur`, `StockAutocompleteInput`, `useSubscription`, all queries
- [ ] **Step 4:** Implement mode toggle + equity mode content
- [ ] **Step 5:** Implement Renda Fixa mode (form + DataTable + AI verdict + IR table)
- [ ] **Step 6:** Run type-check + lint; fix errors
- [ ] **Step 7:** Run unit tests — confirm 456 pass
- [ ] **Step 8:** Commit: `feat(web): nocturne redesign — Comparator with Renda Fixa mode`

---

### Task 5: RiInteligente cosmetic token pass (`src/pages/RiInteligente.tsx`)

**Files:**
- Modify: `src/pages/RiInteligente.tsx`

**Interfaces:**
- Consumes: existing hooks and state unchanged
- Produces: none

No handoff design exists for this screen. Apply token-only pass: swap hardcoded Tailwind color classes → Nocturne tokens, swap Lucide icons → Phosphor, convert any `<Card>` wrappers → `<div>` with `var(--nk-card)`. No structural changes.

**Color mappings:**
- `from-primary/10` gradient → `background: 'linear-gradient(120deg, rgba(111,94,217,0.10) 0%, rgba(76,201,240,0.06) 100%)'`
- `border-amber-500/30 bg-amber-500/10` → `border: '1px solid var(--warn)', background: 'rgba(154,106,6,0.10)'`
- `text-amber-700` / `text-amber-600` → `color: 'var(--warn)'`
- `border-border/80` → `border: '1px solid var(--hair)'`
- `bg-card` → `background: 'var(--nk-card)'`
- `text-muted-foreground` → `color: 'var(--color-neutral-500)'`
- `border-primary/20` → `border: '1px solid var(--hair)'`
- `bg-primary/5` → `background: 'var(--surf-3)'`
- `text-primary` → `color: 'var(--ac)'`
- `bg-emerald-500/10 text-emerald-700` → `background: 'var(--badge-pos-bg)', color: 'var(--pos)'`
- Any `bg-gradient-to-br from-card to-card/50` → `background: 'var(--nk-card)'`

**Icon mappings:** FileSearch→`ph-file-magnifying-glass`, FileText→`ph-file-text`, Loader2→`ph-spinner`, RefreshCcw→`ph-arrows-clockwise`, Search→`ph-magnifying-glass`, Sparkles→`ph-sparkle`, XCircle→`ph-x-circle`.

**`<Card>` → `<div>` conversion:**
```tsx
// Before:
<Card className="border-border/80">
  <CardHeader>…</CardHeader>
  <CardContent>…</CardContent>
</Card>

// After:
<div style={{border: '1px solid var(--hair)', borderRadius: 8, background: 'var(--nk-card)'}}>
  <SectionHeader title="…" />
  <div style={{padding: '14px 16px'}}>…</div>
</div>
```

- [ ] **Step 1:** Read `src/pages/RiInteligente.tsx` fully — catalogue all Tailwind color classes and Lucide icons used
- [ ] **Step 2:** Remove all Lucide icon imports; add Phosphor icon references inline
- [ ] **Step 3:** Convert every `<Card>` → `<div>` with inline style; remove all `CardContent`, `CardHeader`, `CardTitle`, `CardDescription` usage
- [ ] **Step 4:** Replace all Tailwind color classes with inline style objects using Nocturne tokens per mapping table above
- [ ] **Step 5:** Preserve all hooks, queries, state, handlers, Select, Input, Button, AiGeneratedNotice
- [ ] **Step 6:** Run type-check + lint; fix errors
- [ ] **Step 7:** Run unit tests — confirm 456 pass
- [ ] **Step 8:** Commit: `feat(web): nocturne token pass — RiInteligente`

---

### Task 6: Wave 2 verification pass

**Files:**
- None modified (verification only)

- [ ] **Step 1:** Run full test suite: `npm run test:unit -- --run` — confirm 456 pass, 1 pre-existing fail (`interceptors.spec.ts`)
- [ ] **Step 2:** Run `npm run type-check` — zero errors
- [ ] **Step 3:** Run `npm run lint` — zero errors
- [ ] **Step 4:** Run `npx playwright test --reporter=list` — confirm all E2E pass
- [ ] **Step 5:** If any test or lint failure: read the failing file, fix root cause, re-run
- [ ] **Step 6:** Commit: `chore(web): wave2 verification pass — all tests green`
