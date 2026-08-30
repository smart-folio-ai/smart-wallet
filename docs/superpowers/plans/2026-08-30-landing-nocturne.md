# Landing — fidelidade Nocturne — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fechar 3 gaps de fidelidade entre a Landing atual e `design_handoff_trackerr/Trackerr Landing.dc.html`: CTAs primários preenchidos → contorno, toggle de tema ausente, seção de profundidade adaptativa ausente.

**Architecture:** Mudanças pontuais em componentes de seção já existentes (`src/components/landing/sections/*`), mais um componente de seção novo seguindo exatamente o padrão dos existentes (`Section` + `data-reveal` + dados centralizados em `landing-data.ts`).

**Tech Stack:** React + Vite + Tailwind + shadcn/ui (Button) + Vitest/Testing Library.

## Global Constraints

- Branch nasce de `feature/design-foundation-nocturne` (não de `develop`) — já tem tokens Nocturne e ícones Phosphor.
- Ícones vêm de `@/components/ui/icons`, nunca de `lucide-react` (removido na etapa anterior).
- Nenhuma seção existente muda de ordem, exceto a inserção da seção nova entre `TrustSection` e `PricingSection`.
- Testes não fazem assert de classe CSS/cor — seguem o padrão de `HeroSection.spec.tsx` (texto/role via Testing Library).
- Node v20.19.0 para todo comando (`export PATH="/c/Users/Pedro Henrique/AppData/Roaming/nvm/v20.19.0:$PATH"`); `bun` para qualquer mudança de dependência (nenhuma prevista nesta etapa).

---

### Task 1: CTAs primários — preenchido → contorno

**Files:**
- Modify: `src/components/landing/sections/HeroSection.tsx:89`
- Modify: `src/components/landing/sections/LandingNav.tsx:58-62`
- Modify: `src/components/landing/sections/FinalCtaSection.tsx:34`
- Modify: `src/components/landing/sections/PricingSection.tsx:149,161`

**Interfaces:** nenhuma — troca de string de `className`, sem mudança de props/comportamento.

- [ ] **Step 1: Trocar a classe nos 5 locais**

Em todos os 5, a substring `"bg-brand text-brand-foreground hover:bg-brand-strong"` vira `"border border-brand bg-transparent text-brand hover:bg-brand/10 transition-colors"`. O restante do `className` (ex.: `"group"`, classes de layout) não muda.

`HeroSection.tsx:86-94` (verificar o texto exato antes de editar — o arquivo já tem `group` e `transition-colors` na classe):
```tsx
<Button
  asChild
  size="lg"
  className="group border border-brand bg-transparent text-brand hover:bg-brand/10 transition-colors">
  <Link ref={ctaRef} to={heroCopy.primaryCta.href}>
    {heroCopy.primaryCta.label}
    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
  </Link>
</Button>
```

`LandingNav.tsx:58-62`:
```tsx
<Button
  asChild
  className="border border-brand bg-transparent text-brand hover:bg-brand/10 transition-colors">
  <Link to="/register">Criar conta</Link>
</Button>
```

`FinalCtaSection.tsx:31-39`:
```tsx
<Button
  asChild
  size="lg"
  className="group border border-brand bg-transparent text-brand hover:bg-brand/10 transition-colors">
  <Link ref={ctaRef} to="/register">
    Criar conta gratuita
    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
  </Link>
</Button>
```

`PricingSection.tsx:144-153` (branch `isFree`) e `:154-166` (branch `else`) — em ambos, dentro do template string condicional, o branch `plan.featured ? '...' : '...'` tem sua primeira alternativa (a de `plan.featured`) trocada:
```tsx
plan.featured
  ? 'border border-brand bg-transparent text-brand hover:bg-brand/10 transition-colors'
  : 'border border-surface-hairline/[0.12] bg-transparent text-on-surface hover:bg-surface-hairline/[0.06]'
```
(o branch `: '...'` do plano não-destacado não muda — já é outline neutro, correto).

- [ ] **Step 2: Rodar os specs existentes das 4 seções tocadas**

```bash
export PATH="/c/Users/Pedro Henrique/AppData/Roaming/nvm/v20.19.0:$PATH"
npx vitest run src/components/landing/sections/HeroSection.spec.tsx src/components/landing/sections/PricingSection.spec.tsx
```

Expected: PASS sem alteração (nenhum desses specs faz assert de classe/cor, só texto e `href`).

- [ ] **Step 3: Type-check e lint**

```bash
npm run type-check && npm run lint
```

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/components/landing/sections/HeroSection.tsx src/components/landing/sections/LandingNav.tsx src/components/landing/sections/FinalCtaSection.tsx src/components/landing/sections/PricingSection.tsx
git commit -m "feat(web): outline primary CTAs on landing per Nocturne handoff"
```

---

### Task 2: Toggle de tema na nav

**Files:**
- Modify: `src/components/landing/sections/LandingNav.tsx`
- Test: `src/components/landing/sections/LandingNav.spec.tsx` (arquivo novo — não existe hoje)

**Interfaces:**
- Consumes: `ThemeToggle` de `@/components/ThemeToggle` (já existe, sem props obrigatórias).

- [ ] **Step 1: Escrever o teste (falha esperada)**

```tsx
// src/components/landing/sections/LandingNav.spec.tsx
import {describe, it, expect, beforeEach, vi} from 'vitest';
import {render, screen} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';
import {LandingNav} from './LandingNav';

describe('LandingNav', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn().mockImplementation(() => ({
        matches: false,
        media: '',
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    );
  });

  it('tem um controle para alternar o tema', () => {
    render(
      <MemoryRouter>
        <LandingNav />
      </MemoryRouter>,
    );
    expect(
      screen.getByRole('button', {name: /toggle theme/i}),
    ).toBeInTheDocument();
  });

  it('mantém os links de entrar e criar conta', () => {
    render(
      <MemoryRouter>
        <LandingNav />
      </MemoryRouter>,
    );
    expect(screen.getByRole('link', {name: /entrar/i})).toHaveAttribute(
      'href',
      '/signin',
    );
    expect(screen.getByRole('link', {name: /criar conta/i})).toHaveAttribute(
      'href',
      '/register',
    );
  });
});
```

- [ ] **Step 2: Rodar e confirmar que falha**

```bash
export PATH="/c/Users/Pedro Henrique/AppData/Roaming/nvm/v20.19.0:$PATH"
npx vitest run src/components/landing/sections/LandingNav.spec.tsx
```

Expected: FAIL — `Unable to find role="button" with name /toggle theme/i` (o `ThemeToggle` ainda não está no componente).

- [ ] **Step 3: Adicionar o `ThemeToggle`**

Em `LandingNav.tsx`, adicionar o import:
```tsx
import {ThemeToggle} from '@/components/ThemeToggle';
```

E renderizar dentro do `<div className="flex items-center gap-2">`, antes do primeiro `Button`:
```tsx
<div className="flex items-center gap-2">
  <ThemeToggle />
  <Button
    asChild
    variant="ghost"
    className="text-on-surface-muted/70 hover:bg-surface-hairline/[0.06] hover:text-on-surface">
    <Link to="/signin">Entrar</Link>
  </Button>
  {/* ...botão "Criar conta" já ajustado no Task 1... */}
</div>
```

- [ ] **Step 4: Rodar e confirmar que passa**

```bash
npx vitest run src/components/landing/sections/LandingNav.spec.tsx
```

Expected: PASS (2 testes).

- [ ] **Step 5: Type-check e lint**

```bash
npm run type-check && npm run lint
```

- [ ] **Step 6: Commit**

```bash
git add src/components/landing/sections/LandingNav.tsx src/components/landing/sections/LandingNav.spec.tsx
git commit -m "feat(web): add theme toggle to landing nav"
```

---

### Task 3: Seção "Profundidade adaptativa"

**Files:**
- Modify: `src/components/landing/landing-data.ts` (novo export `adaptiveDepthCopy`)
- Create: `src/components/landing/sections/AdaptiveDepthSection.tsx`
- Test: `src/components/landing/sections/AdaptiveDepthSection.spec.tsx`
- Modify: `src/pages/Landing.tsx` (import + inserção entre `TrustSection` e `PricingSection`)

**Interfaces:**
- Produces: `AdaptiveDepthSection` (componente funcional sem props), exportado default e nomeado, mesmo padrão de `TrustSection`/`FinalCtaSection`.
- Consumes: `Section` de `../ui/Section`, `Button` de `@/components/ui/button`, `adaptiveDepthCopy` de `../landing-data`.

- [ ] **Step 1: Adicionar os dados em `landing-data.ts`**

Adicionar ao final do arquivo (mesmo padrão dos outros `export const *Copy`):

```ts
export const adaptiveDepthCopy = {
  title: 'A mesma verdade, no seu idioma.',
  subtitle:
    'A IA adapta o vocabulário e a densidade de informação ao seu nível — os números nunca mudam, só como eles são explicados.',
  levels: [
    {
      id: 'iniciante' as const,
      label: 'Iniciante',
      metricLabel: 'Como está indo',
      metricValue: '+8,2% este ano',
      metricNote: 'Sua carteira está subindo mais que a poupança.',
    },
    {
      id: 'intermediario' as const,
      label: 'Intermediário',
      metricLabel: 'Retorno acumulado',
      metricValue: '+8,2%',
      metricNote: '12,4 p.p. acima do CDI no período.',
    },
    {
      id: 'avancado' as const,
      label: 'Avançado',
      metricLabel: 'Sharpe / Retorno acum.',
      metricValue: '1,84 / +8,2%',
      metricNote: 'Vol. anualizada 11,2% · benchmark CDI · janela 12m.',
    },
  ],
};

export type AdaptiveDepthLevelId = (typeof adaptiveDepthCopy.levels)[number]['id'];
```

- [ ] **Step 2: Escrever o teste (falha esperada)**

```tsx
// src/components/landing/sections/AdaptiveDepthSection.spec.tsx
import {describe, it, expect} from 'vitest';
import {render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {AdaptiveDepthSection} from './AdaptiveDepthSection';

describe('AdaptiveDepthSection', () => {
  it('mostra o nível intermediário por padrão', () => {
    render(<AdaptiveDepthSection />);
    expect(screen.getByText('Retorno acumulado')).toBeInTheDocument();
    expect(screen.getByText('+8,2%')).toBeInTheDocument();
  });

  it('troca o conteúdo do card ao clicar em Iniciante', async () => {
    const user = userEvent.setup();
    render(<AdaptiveDepthSection />);
    await user.click(screen.getByRole('button', {name: 'Iniciante'}));
    expect(screen.getByText('Como está indo')).toBeInTheDocument();
    expect(screen.getByText('+8,2% este ano')).toBeInTheDocument();
  });

  it('troca o conteúdo do card ao clicar em Avançado', async () => {
    const user = userEvent.setup();
    render(<AdaptiveDepthSection />);
    await user.click(screen.getByRole('button', {name: 'Avançado'}));
    expect(screen.getByText('Sharpe / Retorno acum.')).toBeInTheDocument();
    expect(screen.getByText('1,84 / +8,2%')).toBeInTheDocument();
  });
});
```

- [ ] **Step 3: Rodar e confirmar que falha**

```bash
export PATH="/c/Users/Pedro Henrique/AppData/Roaming/nvm/v20.19.0:$PATH"
npx vitest run src/components/landing/sections/AdaptiveDepthSection.spec.tsx
```

Expected: FAIL — módulo `./AdaptiveDepthSection` não existe.

- [ ] **Step 4: Criar o componente**

```tsx
// src/components/landing/sections/AdaptiveDepthSection.tsx
import {useState} from 'react';
import {Button} from '@/components/ui/button';
import {Section} from '../ui/Section';
import {GlassPanel} from '../ui/GlassPanel';
import {adaptiveDepthCopy, type AdaptiveDepthLevelId} from '../landing-data';
import {cn} from '@/lib/utils';

export function AdaptiveDepthSection() {
  const [levelId, setLevelId] = useState<AdaptiveDepthLevelId>('intermediario');
  const level =
    adaptiveDepthCopy.levels.find((l) => l.id === levelId) ??
    adaptiveDepthCopy.levels[1];

  return (
    <Section id="profundidade">
      <div className="max-w-3xl">
        <h2
          data-reveal
          className="font-heading font-bold tracking-[-0.03em] text-on-surface [font-size:clamp(1.875rem,3.5vw,3rem)] [line-height:1.08]">
          {adaptiveDepthCopy.title}
        </h2>
        <p
          data-reveal
          data-reveal-delay="0.08"
          className="mt-6 text-[1.0625rem] leading-[1.7] text-on-surface-muted/60">
          {adaptiveDepthCopy.subtitle}
        </p>
      </div>

      <div data-reveal className="mt-10 flex flex-col items-center gap-8">
        <div className="inline-flex gap-1 rounded-lg border border-surface-hairline/[0.12] bg-surface-base p-1">
          {adaptiveDepthCopy.levels.map((l) => (
            <Button
              key={l.id}
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => setLevelId(l.id)}
              className={cn(
                'rounded-md px-4 text-sm font-medium transition-colors',
                l.id === levelId
                  ? 'bg-brand/10 text-brand'
                  : 'text-on-surface-muted/60 hover:text-on-surface',
              )}>
              {l.label}
            </Button>
          ))}
        </div>

        <GlassPanel className="w-full max-w-md p-7 text-center">
          <p className="text-xs uppercase tracking-widest text-on-surface-muted/50">
            {level.metricLabel}
          </p>
          <p className="mt-2 font-heading text-3xl font-semibold text-on-surface">
            {level.metricValue}
          </p>
          <p className="mt-3 text-sm text-on-surface-muted/60">
            {level.metricNote}
          </p>
        </GlassPanel>
      </div>
    </Section>
  );
}

export default AdaptiveDepthSection;
```

- [ ] **Step 5: Rodar e confirmar que passa**

```bash
npx vitest run src/components/landing/sections/AdaptiveDepthSection.spec.tsx
```

Expected: PASS (3 testes).

- [ ] **Step 6: Inserir a seção em `Landing.tsx`**

```tsx
import {AdaptiveDepthSection} from '@/components/landing/sections/AdaptiveDepthSection';
```

E no JSX, entre `<TrustSection />` e `<PricingSection />`:
```tsx
<TrustSection />
<AdaptiveDepthSection />
<PricingSection />
```

- [ ] **Step 7: Type-check e lint**

```bash
npm run type-check && npm run lint
```

- [ ] **Step 8: Commit**

```bash
git add src/components/landing/landing-data.ts src/components/landing/sections/AdaptiveDepthSection.tsx src/components/landing/sections/AdaptiveDepthSection.spec.tsx src/pages/Landing.tsx
git commit -m "feat(web): add adaptive-depth demo section to landing"
```

---

### Task 4: Verificação final

**Files:** nenhum arquivo novo.

- [ ] **Step 1: Suíte completa**

```bash
export PATH="/c/Users/Pedro Henrique/AppData/Roaming/nvm/v20.19.0:$PATH"
npm run type-check
npm run lint
npm run test:unit
npm run build
```

Expected: tudo PASS (uma falha pré-existente e não relacionada pode aparecer em `src/lib/interceptors.spec.ts` — confirmar que é a mesma falha já documentada na etapa anterior, não uma nova).

- [ ] **Step 2: E2E de landing/proteção de rota**

```bash
npx playwright test tests/e2e/protected-and-landing.spec.ts
```

Expected: PASS.

- [ ] **Step 3: Verificação visual manual**

```bash
npm run dev
```

Abrir `/`, alternar tema pelo novo toggle na nav, conferir os 5 CTAs em contorno, rolar até a seção nova ("profundidade adaptativa") e clicar nos 3 níveis. Comparar com `design_handoff_trackerr/Trackerr Landing.dc.html` aberto direto no navegador.

- [ ] **Step 4: Commit final (só se o Step 3 revelar ajuste necessário)**

```bash
git add -A
git commit -m "chore(web): final verification pass for landing nocturne fidelity"
```

---

## Self-review desta etapa

- **Cobertura do spec:** seção 4 (CTAs) → Task 1; seção 5 (toggle) → Task 2; seção 6 (seção nova) → Task 3; seção 7 (testes) → coberta em cada task + Task 4.
- **Consistência:** `AdaptiveDepthSection` segue exatamente o padrão de `TrustSection`/`ProblemSection` (`Section`, `data-reveal`, dados em `landing-data.ts`, `GlassPanel` para o card) — nenhum padrão novo introduzido.
- **Tipos:** `AdaptiveDepthLevelId` exportado de `landing-data.ts` e consumido em `AdaptiveDepthSection.tsx` — nome consistente nos dois arquivos.
