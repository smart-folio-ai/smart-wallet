# Landing Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reconstruir a landing page do Trackerr com visual "fintech premium", nove seções, copy novo e coreografia de movimento em GSAP, sem alterar nenhuma outra parte da aplicação.

**Architecture:** Tudo vive sob `src/components/landing/`, dividido em quatro pastas por responsabilidade — `ui/` (primitivos visuais), `motion/` (hooks de animação), `mockups/` (telas fictícias do produto) e `sections/` (as nove seções). `src/pages/Landing.tsx` apenas compõe as seções. Os valores de superfície escurecidos são escopados por uma classe `.landing-root`, de forma que o `:root` global e as páginas de autenticação permaneçam idênticos.

**Tech Stack:** React 18, TypeScript, Vite, Tailwind CSS 3, shadcn-ui (Radix), GSAP 3 com ScrollTrigger, Vitest + Testing Library, jsdom.

## Global Constraints

- **Nenhuma dependência nova.** GSAP já está no `package.json`. three.js e anime.js foram descartados na spec. Não rodar `npm install` de pacote novo.
- **Branch:** `web/feature/landing-redesign`. Já criada. Todos os commits vão nela.
- **Diretório de trabalho:** `B:/my projects/TrackerInvest/web`. Todos os comandos rodam a partir daí.
- **Comando de teste:** `npx vitest run <caminho>`. **Não** use `npm run test` — esse script roda Playwright, não Vitest.
- **Não tocar** em `src/components/ui/` (shadcn), nas páginas do app, em `server/` ou `trackerr-ia/`.
- **Não alterar** nenhum valor de token já existente em `:root` ou `.dark` no `src/index.css`. Só adições e o bloco novo `.landing-root`.
- **O working tree já tem alterações não commitadas** de outro trabalho (`src/App.tsx`, `src/pages/Settings.tsx`, `src/lib/interceptors.ts`, `src/components/settings/*`, `package.json`, `bun.lock`, `tailwind.config.ts`, `src/index.css`). **Sempre commitar com `git add <arquivos específicos>`, nunca `git add -A` ou `git add .`.**
- **Acessibilidade:** todo efeito respeita `prefers-reduced-motion: reduce` desligando a animação e deixando o conteúdo **visível**. Animar apenas `transform` e `opacity`. Pin, parallax e magnetic hover só a partir de 1024px, via `gsap.matchMedia()`. Todo efeito dentro de `gsap.context()` com `revert()` no cleanup.
- **Copy:** português do Brasil, tom direto, sem "revolucionário/inovador/disruptivo". Todo texto vive em `landing-data.ts`, não hardcoded em JSX (exceto títulos de seção, que ficam no componente da seção).
- **Números financeiros** usam a classe `tabular-nums`.

---

## Estrutura de arquivos final

```
src/components/landing/
  ui/
    Section.tsx           Wrapper de seção: id, padding vertical, largura máxima
    Eyebrow.tsx           Label pequeno acima do título
    GlassPanel.tsx        Card padrão (hairline + gradiente interno)
    GridBackdrop.tsx      Malha de fundo com máscara radial
    Ticker.tsx            Número com tabular-nums, animado por useCountUp
  motion/
    useGsapReveal.ts      MOVIDO de ../useGsapReveal.ts, API preservada
    useCountUp.ts         Contagem de 0 ao valor ao entrar na viewport
    useMarquee.ts         Loop infinito com gsap modifiers
    usePinnedSequence.ts  Pin + scrub trocando painéis
    useMagnetic.ts        Hover magnético em CTAs (desktop)
  mockups/
    PortfolioMockup.tsx   Carteira consolidada: donut + posições
    AiAlertMockup.tsx     Alertas priorizados da IA
    TaxMockup.tsx         Apuração de IR com DARF
  sections/
    LandingNav.tsx        MOVIDO de ../LandingNav.tsx
    HeroSection.tsx       REESCRITO
    MarketTape.tsx        MOVIDO e reescrito (marquee via GSAP)
    ProblemSection.tsx    NOVO
    ProductSection.tsx    NOVO (pin + mockups)
    HowItWorksSection.tsx Substitui WorkflowSection
    TrustSection.tsx      NOVO (extraído do ValueSection)
    PricingSection.tsx    MOVIDO e restilizado
    FaqSection.tsx        NOVO
    FinalCtaSection.tsx   Substitui CtaSection
    LandingFooter.tsx     MOVIDO e expandido
  MarketChart.tsx         MANTIDO onde está, restilizado
  landing-data.ts         REESCRITO com o novo copy
```

Arquivos deletados ao fim: `ValueSection.tsx`, `WorkflowSection.tsx`, `CtaSection.tsx`, `useGsapReveal.ts` (raiz), `LandingNav.tsx` (raiz), `LandingFooter.tsx` (raiz), `MarketTape.tsx` (raiz), `PricingSection.tsx` (raiz), `HeroSection.tsx` (raiz).

---

### Task 1: Fundação visual — tokens e primitivos de UI

**Files:**
- Modify: `src/index.css` (adicionar tokens após a linha 118, antes do fechamento de `:root`; adicionar bloco `.landing-root`)
- Modify: `tailwind.config.ts:137-148` (adicionar cores)
- Create: `src/components/landing/ui/Section.tsx`
- Create: `src/components/landing/ui/Eyebrow.tsx`
- Create: `src/components/landing/ui/GlassPanel.tsx`
- Create: `src/components/landing/ui/GridBackdrop.tsx`
- Test: `src/components/landing/ui/landing-ui.spec.tsx`

**Interfaces:**
- Consumes: nada (primeira task).
- Produces:
  - `<Section id?: string, className?: string, children: ReactNode>` — `<section>` com `py-24 sm:py-32` e container `mx-auto max-w-7xl px-4 sm:px-6 lg:px-8` interno.
  - `<Eyebrow children: ReactNode, className?: string>` — `<span>`.
  - `<GlassPanel className?: string, children: ReactNode, ...HTMLDivElement props>` — `<div>`.
  - `<GridBackdrop className?: string>` — `<div aria-hidden="true">`.
  - Classes Tailwind novas: `bg-surface-hairline`, `border-surface-hairline`, `text-positive`, `text-negative`, `bg-positive`, `bg-negative`.

- [ ] **Step 1: Escrever o teste que falha**

Criar `src/components/landing/ui/landing-ui.spec.tsx`:

```tsx
import {describe, it, expect} from 'vitest';
import {render, screen} from '@testing-library/react';
import {Section} from './Section';
import {Eyebrow} from './Eyebrow';
import {GlassPanel} from './GlassPanel';
import {GridBackdrop} from './GridBackdrop';

describe('primitivos da landing', () => {
  it('Section renderiza um section com id e o conteúdo dentro do container', () => {
    const {container} = render(
      <Section id="planos">
        <p>conteudo</p>
      </Section>,
    );

    const section = container.querySelector('section');
    expect(section).not.toBeNull();
    expect(section?.id).toBe('planos');
    expect(screen.getByText('conteudo')).toBeInTheDocument();
  });

  it('Eyebrow renderiza o texto', () => {
    render(<Eyebrow>Gestão de carteira com IA</Eyebrow>);
    expect(screen.getByText('Gestão de carteira com IA')).toBeInTheDocument();
  });

  it('GlassPanel repassa className e children', () => {
    const {container} = render(
      <GlassPanel className="minha-classe">
        <span>painel</span>
      </GlassPanel>,
    );

    expect(screen.getByText('painel')).toBeInTheDocument();
    expect(container.firstElementChild?.className).toContain('minha-classe');
  });

  it('GridBackdrop é decorativo e escondido de leitores de tela', () => {
    const {container} = render(<GridBackdrop />);
    expect(container.firstElementChild?.getAttribute('aria-hidden')).toBe(
      'true',
    );
  });
});
```

- [ ] **Step 2: Rodar o teste e confirmar que falha**

```bash
npx vitest run src/components/landing/ui/landing-ui.spec.tsx
```

Esperado: FAIL — `Failed to resolve import "./Section"`.

- [ ] **Step 3: Adicionar os tokens novos em `src/index.css`**

Dentro do bloco `:root`, logo após a linha `--auth-danger-soft: ...;` e antes do `}` que fecha o `:root`, inserir:

```css
    /* ──────────────────────────────────────────────────────────────
     * Tokens do redesign da landing. Aditivos: nenhum token acima
     * muda de valor, então nenhuma página existente muda de aparência.
     * ────────────────────────────────────────────────────────────── */
    --accent-positive: 158 84% 45%;
    --accent-negative: 351 83% 61%;
    --surface-hairline: 220 25% 100%;
```

`--surface-hairline` é branco em HSL; as bordas o usam sempre com alpha baixo (`border-surface-hairline/10`), o que produz uma hairline neutra sobre fundo escuro.

Depois do bloco `@layer base { ... }` que contém `:root` e `.dark` (ou seja, após a linha `}` que fecha esse layer, por volta da linha 173), adicionar:

```css
/* ──────────────────────────────────────────────────────────────────
 * Superfícies escurecidas do redesign, escopadas à landing.
 * Ficam fora de :root de propósito: os aliases --auth-* derivam dos
 * tokens globais e as páginas de autenticação não devem mudar agora.
 * ────────────────────────────────────────────────────────────────── */
.landing-root {
  --surface-base: 224 30% 6%;
  --surface-panel: 224 28% 8%;
  --surface-raised: 223 24% 11%;

  background-color: hsl(var(--surface-base));
  color: hsl(var(--on-surface));
}
```

- [ ] **Step 4: Adicionar as cores no `tailwind.config.ts`**

No objeto `colors`, dentro de `surface`, adicionar a chave `hairline`, e após o bloco `'on-surface'` adicionar `positive` e `negative`:

```ts
        surface: {
          DEFAULT: 'hsl(var(--surface-base) / <alpha-value>)',
          panel: 'hsl(var(--surface-panel) / <alpha-value>)',
          raised: 'hsl(var(--surface-raised) / <alpha-value>)',
          input: 'hsl(var(--surface-input) / <alpha-value>)',
          hairline: 'hsl(var(--surface-hairline) / <alpha-value>)',
        },
        'on-surface': {
          DEFAULT: 'hsl(var(--on-surface) / <alpha-value>)',
          accent: 'hsl(var(--on-surface-accent) / <alpha-value>)',
          muted: 'hsl(var(--on-surface-muted) / <alpha-value>)',
          secondary: 'hsl(var(--on-surface-secondary) / <alpha-value>)',
        },
        // Sinal de variação financeira. Substitui os emerald-400/rose-400
        // hardcoded que existiam nos componentes da landing.
        positive: 'hsl(var(--accent-positive) / <alpha-value>)',
        negative: 'hsl(var(--accent-negative) / <alpha-value>)',
```

- [ ] **Step 5: Criar `src/components/landing/ui/Section.tsx`**

```tsx
import type {ReactNode} from 'react';
import {cn} from '@/lib/utils';

interface SectionProps {
  id?: string;
  className?: string;
  containerClassName?: string;
  children: ReactNode;
}

/**
 * Wrapper padrão das seções da landing: ritmo vertical e largura máxima
 * consistentes. Toda seção passa por aqui para o espaçamento não divergir.
 */
export function Section({
  id,
  className,
  containerClassName,
  children,
}: SectionProps) {
  return (
    <section id={id} className={cn('relative py-24 sm:py-32', className)}>
      <div
        className={cn(
          'mx-auto max-w-7xl px-4 sm:px-6 lg:px-8',
          containerClassName,
        )}>
        {children}
      </div>
    </section>
  );
}

export default Section;
```

- [ ] **Step 6: Criar `src/components/landing/ui/Eyebrow.tsx`**

```tsx
import type {ReactNode} from 'react';
import {cn} from '@/lib/utils';

interface EyebrowProps {
  className?: string;
  children: ReactNode;
}

/** Label curto acima do título da seção. */
export function Eyebrow({className, children}: EyebrowProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 rounded-full border border-surface-hairline/10',
        'bg-surface-hairline/[0.04] px-3.5 py-1.5',
        'text-xs font-medium uppercase tracking-[0.14em] text-on-surface-muted/70',
        className,
      )}>
      {children}
    </span>
  );
}

export default Eyebrow;
```

- [ ] **Step 7: Criar `src/components/landing/ui/GlassPanel.tsx`**

```tsx
import type {HTMLAttributes, ReactNode} from 'react';
import {cn} from '@/lib/utils';

interface GlassPanelProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

/**
 * Card padrão da landing. Elevação vem de hairline + gradiente interno,
 * nunca de sombra colorida — sombra colorida em fundo escuro lê como plástico.
 */
export function GlassPanel({className, children, ...rest}: GlassPanelProps) {
  return (
    <div
      {...rest}
      className={cn(
        'rounded-2xl border border-surface-hairline/[0.08]',
        'bg-gradient-to-b from-surface-hairline/[0.05] to-surface-hairline/[0.01]',
        'backdrop-blur-xl',
        className,
      )}>
      {children}
    </div>
  );
}

export default GlassPanel;
```

- [ ] **Step 8: Criar `src/components/landing/ui/GridBackdrop.tsx`**

```tsx
import {cn} from '@/lib/utils';

interface GridBackdropProps {
  className?: string;
}

/**
 * Malha de fundo decorativa. As linhas vêm de um gradiente repetido e a
 * máscara radial faz o grid sumir nas bordas, evitando a borda dura.
 */
export function GridBackdrop({className}: GridBackdropProps) {
  return (
    <div
      aria-hidden="true"
      className={cn('pointer-events-none absolute inset-0', className)}
      style={{
        backgroundImage:
          'linear-gradient(to right, hsl(var(--surface-hairline) / 0.04) 1px, transparent 1px), linear-gradient(to bottom, hsl(var(--surface-hairline) / 0.04) 1px, transparent 1px)',
        backgroundSize: '64px 64px',
        maskImage:
          'radial-gradient(ellipse 70% 60% at 50% 30%, black 0%, transparent 100%)',
        WebkitMaskImage:
          'radial-gradient(ellipse 70% 60% at 50% 30%, black 0%, transparent 100%)',
      }}
    />
  );
}

export default GridBackdrop;
```

- [ ] **Step 9: Rodar o teste e confirmar que passa**

```bash
npx vitest run src/components/landing/ui/landing-ui.spec.tsx
```

Esperado: PASS, 4 testes.

- [ ] **Step 10: Verificar que nada quebrou**

```bash
npx tsc --noEmit
npx vitest run
```

Esperado: sem erros de tipo; a suíte inteira passa (o `Landing.spec.tsx` atual ainda passa, pois nada da landing mudou ainda).

- [ ] **Step 11: Commit**

```bash
git add src/index.css tailwind.config.ts src/components/landing/ui/
git commit -m "feat(web): add landing design tokens and ui primitives"
```

---

### Task 2: Hooks de movimento — mover reveal, criar useCountUp e Ticker

**Files:**
- Create: `src/components/landing/motion/useGsapReveal.ts` (conteúdo movido de `src/components/landing/useGsapReveal.ts`)
- Delete: `src/components/landing/useGsapReveal.ts`
- Modify: `src/components/landing/HeroSection.tsx:6` e `src/components/landing/PricingSection.tsx:6` (atualizar import — esses arquivos serão substituídos adiante, mas precisam compilar agora)
- Create: `src/components/landing/motion/useCountUp.ts`
- Create: `src/components/landing/ui/Ticker.tsx`
- Test: `src/components/landing/ui/Ticker.spec.tsx`

**Interfaces:**
- Consumes: Task 1 (`cn` de `@/lib/utils` já existia).
- Produces:
  - `useGsapReveal<T extends HTMLElement>(): React.MutableRefObject<T | null>` — API idêntica à atual.
  - `useGsapParallax<T extends HTMLElement>(strength?: number): React.MutableRefObject<T | null>` — API idêntica à atual.
  - `ensureScrollTrigger(): boolean` — **exportada agora** (antes era privada), para os hooks novos reusarem.
  - `useCountUp(ref: React.RefObject<HTMLElement>, value: number, format: (n: number) => string): void`
  - `<Ticker value: number, format?: (n: number) => string, className?: string>` — `<span>` com `tabular-nums`.

- [ ] **Step 1: Escrever o teste que falha**

Criar `src/components/landing/ui/Ticker.spec.tsx`:

```tsx
import {describe, it, expect, beforeEach, vi} from 'vitest';
import {render, screen} from '@testing-library/react';
import {Ticker} from './Ticker';

describe('Ticker', () => {
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

  it('renderiza o valor final formatado antes de qualquer animação', () => {
    render(<Ticker value={284930} format={(n) => `R$ ${Math.round(n)}`} />);
    expect(screen.getByText('R$ 284930')).toBeInTheDocument();
  });

  it('usa tabular-nums para o número não dançar ao animar', () => {
    const {container} = render(<Ticker value={12} />);
    expect(container.firstElementChild?.className).toContain('tabular-nums');
  });
});
```

- [ ] **Step 2: Rodar e confirmar que falha**

```bash
npx vitest run src/components/landing/ui/Ticker.spec.tsx
```

Esperado: FAIL — `Failed to resolve import "./Ticker"`.

- [ ] **Step 3: Mover o hook de reveal para `motion/`**

```bash
mkdir -p src/components/landing/motion
git mv src/components/landing/useGsapReveal.ts src/components/landing/motion/useGsapReveal.ts
```

Se o arquivo ainda não estiver rastreado pelo git (ele está como untracked), use `mv` simples:

```bash
mv src/components/landing/useGsapReveal.ts src/components/landing/motion/useGsapReveal.ts
```

No arquivo movido, mudar apenas a assinatura de `ensureScrollTrigger` para exportá-la — todo o resto do conteúdo permanece **exatamente** como está, incluindo os comentários. A lógica atual já trata jsdom/SSR e `prefers-reduced-motion` corretamente e não deve ser reescrita:

```ts
export function ensureScrollTrigger(): boolean {
```

- [ ] **Step 4: Corrigir os imports quebrados**

Em `src/components/landing/HeroSection.tsx`, trocar:

```tsx
import {useGsapParallax} from './useGsapReveal';
```

por:

```tsx
import {useGsapParallax} from './motion/useGsapReveal';
```

Fazer a mesma troca em `src/components/landing/PricingSection.tsx`.

- [ ] **Step 5: Criar `src/components/landing/motion/useCountUp.ts`**

```ts
import {useEffect} from 'react';
import gsap from 'gsap';
import {ScrollTrigger} from 'gsap/ScrollTrigger';
import {ensureScrollTrigger} from './useGsapReveal';

/**
 * Conta de 0 até `value` quando o elemento entra na viewport.
 *
 * O elemento já é renderizado com o valor final pelo React; este hook só
 * toca o textContent depois que o ScrollTrigger dispara. Consequência
 * deliberada: sem motion, sem viewport ou fora do browser, o número correto
 * já está na tela — nunca exibimos "0" como estado permanente.
 */
export function useCountUp(
  ref: React.RefObject<HTMLElement>,
  value: number,
  format: (n: number) => string,
) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!ensureScrollTrigger()) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const ctx = gsap.context(() => {
      const counter = {n: 0};

      gsap.to(counter, {
        n: value,
        duration: 1.4,
        ease: 'power2.out',
        onUpdate: () => {
          el.textContent = format(counter.n);
        },
        onComplete: () => {
          el.textContent = format(value);
        },
        scrollTrigger: {
          trigger: el,
          start: 'top 90%',
          once: true,
          onEnter: () => {
            el.textContent = format(0);
          },
        },
      });
    });

    return () => {
      ctx.revert();
      el.textContent = format(value);
    };
  }, [ref, value, format]);
}

// Referenciado para o bundler não remover o plugin em tree-shaking agressivo.
void ScrollTrigger;
```

- [ ] **Step 6: Criar `src/components/landing/ui/Ticker.tsx`**

```tsx
import {useRef} from 'react';
import {cn} from '@/lib/utils';
import {useCountUp} from '../motion/useCountUp';

interface TickerProps {
  value: number;
  /** Formatação do número. Padrão: inteiro com separador pt-BR. */
  format?: (n: number) => string;
  className?: string;
}

const defaultFormat = (n: number) =>
  new Intl.NumberFormat('pt-BR', {maximumFractionDigits: 0}).format(n);

/**
 * Número que conta ao entrar na viewport. tabular-nums é obrigatório:
 * sem ele os dígitos têm larguras diferentes e a linha inteira treme.
 */
export function Ticker({value, format = defaultFormat, className}: TickerProps) {
  const ref = useRef<HTMLSpanElement>(null);
  useCountUp(ref, value, format);

  return (
    <span ref={ref} className={cn('tabular-nums', className)}>
      {format(value)}
    </span>
  );
}

export default Ticker;
```

- [ ] **Step 7: Rodar os testes**

```bash
npx vitest run src/components/landing/ui/Ticker.spec.tsx
npx tsc --noEmit
```

Esperado: 2 testes passam; sem erros de tipo.

- [ ] **Step 8: Commit**

```bash
git add src/components/landing/motion/ src/components/landing/ui/Ticker.tsx src/components/landing/ui/Ticker.spec.tsx src/components/landing/HeroSection.tsx src/components/landing/PricingSection.tsx
git rm --cached src/components/landing/useGsapReveal.ts 2>/dev/null || true
git commit -m "feat(web): add motion hooks folder with count-up ticker"
```

---

### Task 3: Copy novo em `landing-data.ts`

**Files:**
- Modify: `src/components/landing/landing-data.ts` (reescrita completa)
- Test: `src/components/landing/landing-data.spec.ts`

**Interfaces:**
- Consumes: nada.
- Produces (todos exportados de `./landing-data`):
  - `heroCopy: {eyebrow: string; title: string; titleAccent: string; subtitle: string; primaryCta: {label: string; href: string}; secondaryCta: {label: string; href: string}; microProof: string[]}`
  - `heroPanel: {title: string; subtitle: string; equity: number; positions: number; risk: string; kpis: Array<{label: string; value: number; suffix: string}>}`
  - `interface TickerQuote {symbol: string; price: string; change: string; up: boolean}` — o nome **não** é `Ticker`: esse já é o componente de `ui/Ticker.tsx` e a colisão confundiria os imports.
  - `marketTape: TickerQuote[]`
  - `problemCopy: {title: string; subtitle: string; cards: Array<{title: string; description: string}>}`
  - `productCopy: {eyebrow: string; title: string; subtitle: string; blocks: Array<{id: 'carteira' | 'ia' | 'fiscal'; title: string; description: string}>}`
  - `workflowSteps: Array<{step: string; title: string; description: string}>` (nome mantido)
  - `trustStats: Array<{value: string; label: string}>` (nome mantido)
  - `planItems: PlanItem[]` e `interface PlanItem` (mantidos, textos revisados)
  - `faqItems: Array<{question: string; answer: string}>`
  - `finalCtaCopy: {title: string; subtitle: string; bullets: string[]}`
  - `footerColumns: Array<{title: string; links: Array<{label: string; to: string}>}>`
  - `portfolioMockupData`, `aiAlertMockupData`, `taxMockupData` — definidos na Task 6.

`valueCards` e `returnCards` são **removidos** — as seções que os consumiam deixam de existir.

- [ ] **Step 1: Escrever o teste que falha**

Criar `src/components/landing/landing-data.spec.ts`:

```ts
import {describe, it, expect} from 'vitest';
import {
  heroCopy,
  problemCopy,
  productCopy,
  faqItems,
  planItems,
  footerColumns,
} from './landing-data';

const JARGAO = /revolucion|inovador|disruptiv/i;

describe('landing-data', () => {
  it('o hero fala do problema do usuário, não das nossas features', () => {
    expect(heroCopy.title).toMatch(/sua carteira inteira/i);
    expect(heroCopy.subtitle).toMatch(/corretoras/i);
    expect(heroCopy.primaryCta.href).toBe('/register');
    expect(heroCopy.secondaryCta.href).toBe('#produto');
    expect(heroCopy.microProof.length).toBeGreaterThanOrEqual(2);
  });

  it('a seção de problema tem exatamente três dores', () => {
    expect(problemCopy.cards).toHaveLength(3);
  });

  it('a seção de produto tem os três blocos esperados', () => {
    expect(productCopy.blocks.map((b) => b.id)).toEqual([
      'carteira',
      'ia',
      'fiscal',
    ]);
  });

  it('o FAQ cobre as quatro objeções principais', () => {
    expect(faqItems.length).toBeGreaterThanOrEqual(4);
    const perguntas = faqItems.map((f) => f.question).join(' ');
    expect(perguntas).toMatch(/segur|dados/i);
    expect(perguntas).toMatch(/corretora/i);
    expect(perguntas).toMatch(/cancel/i);
    expect(perguntas).toMatch(/gr[áa]tis|gratuito/i);
  });

  it('mantém três planos com o Premium destacado', () => {
    expect(planItems).toHaveLength(3);
    expect(planItems.filter((p) => p.featured)).toHaveLength(1);
  });

  it('o rodapé tem colunas com links', () => {
    expect(footerColumns.length).toBeGreaterThanOrEqual(3);
    footerColumns.forEach((col) => {
      expect(col.links.length).toBeGreaterThan(0);
    });
  });

  it('não usa jargão de marketing proibido', () => {
    const tudo = JSON.stringify([heroCopy, problemCopy, productCopy, faqItems]);
    expect(tudo).not.toMatch(JARGAO);
  });
});
```

- [ ] **Step 2: Rodar e confirmar que falha**

```bash
npx vitest run src/components/landing/landing-data.spec.ts
```

Esperado: FAIL — `heroCopy` não exportado.

- [ ] **Step 3: Reescrever `landing-data.ts`**

Substituir o conteúdo inteiro do arquivo por:

```ts
export const heroCopy = {
  eyebrow: 'Gestão de carteira com IA',
  title: 'Sua carteira inteira.',
  titleAccent: 'Sem planilha, sem surpresa no IR.',
  subtitle:
    'O Trackerr consolida seus ativos de todas as corretoras, calcula seu imposto e usa IA para te dizer o que exige atenção agora — não mais um relatório para você interpretar.',
  primaryCta: {label: 'Começar grátis', href: '/register'},
  secondaryCta: {label: 'Ver como funciona', href: '#produto'},
  microProof: ['Grátis até 10 ativos', 'Sem cartão de crédito'],
};

export const heroPanel = {
  title: 'Carteira consolidada',
  subtitle: 'Todas as corretoras · atualizado agora',
  equity: 284930,
  positions: 27,
  risk: 'Moderado',
  kpis: [
    {label: 'Retorno 30D', value: 8.42, suffix: '%'},
    {label: 'Alpha vs IBOV', value: 3.07, suffix: '%'},
    {label: 'Yield 12M', value: 5.13, suffix: '%'},
  ],
};

export interface TickerQuote {
  symbol: string;
  price: string;
  change: string;
  up: boolean;
}

export const marketTape: TickerQuote[] = [
  {symbol: 'PETR4', price: 'R$ 39,82', change: '+2,14%', up: true},
  {symbol: 'VALE3', price: 'R$ 67,19', change: '+1,37%', up: true},
  {symbol: 'ITUB4', price: 'R$ 35,66', change: '-0,42%', up: false},
  {symbol: 'WEGE3', price: 'R$ 46,20', change: '+3,08%', up: true},
  {symbol: 'BBAS3', price: 'R$ 27,04', change: '-1,15%', up: false},
  {symbol: 'AAPL', price: 'US$ 218,44', change: '+0,88%', up: true},
  {symbol: 'MSFT', price: 'US$ 432,51', change: '+1,11%', up: true},
  {symbol: 'IVVB11', price: 'R$ 358,90', change: '+0,64%', up: true},
];

export const problemCopy = {
  title: 'Você não tem um problema de investimento.',
  titleAccent: 'Tem um problema de controle.',
  subtitle:
    'Quem já investe há algum tempo não trava por falta de ativo. Trava por falta de visão do conjunto.',
  cards: [
    {
      title: 'Ativos em três corretoras diferentes',
      description:
        'Cada uma mostra um pedaço. Nenhuma mostra o quadro completo, e a planilha que junta tudo está sempre desatualizada.',
    },
    {
      title: 'O IR vira um fim de semana perdido',
      description:
        'Apuração mês a mês, prejuízo a compensar, DARF a emitir. Feito na mão, com medo de errar e pagar a mais.',
    },
    {
      title: 'A concentração aparece tarde demais',
      description:
        'Você descobre que um papel virou um quarto da carteira quando ele cai — não quando ainda dava para reequilibrar.',
    },
  ],
};

export const productCopy = {
  eyebrow: 'O produto',
  title: 'Três coisas que você para de fazer na mão',
  subtitle:
    'Conecte uma vez. O acompanhamento passa a ser leitura, não digitação.',
  blocks: [
    {
      id: 'carteira' as const,
      title: 'Carteira consolidada',
      description:
        'Todas as corretoras num só lugar, com alocação real por ativo, setor e classe. O número que aparece é o número certo, sem você somar nada.',
    },
    {
      id: 'ia' as const,
      title: 'IA que prioriza',
      description:
        'Não é um relatório para interpretar: é uma lista ordenada do que fazer. Concentração acima do seu limite, aporte fora da estratégia, dividendo a reinvestir.',
    },
    {
      id: 'fiscal' as const,
      title: 'Fiscal resolvido',
      description:
        'Apuração mensal automática, prejuízo compensado, isenção de R$ 20 mil aplicada e a DARF já calculada com o valor a pagar.',
    },
  ],
};

export const workflowSteps = [
  {
    step: '01',
    title: 'Conecte sua carteira',
    description:
      'Importe a nota de corretagem, o extrato da B3 ou sincronize direto com a corretora. Leva alguns minutos, uma vez só.',
  },
  {
    step: '02',
    title: 'A IA lê o contexto',
    description:
      'Concentração, risco, exposição setorial e impacto fiscal são calculados em conjunto — não isolados em abas separadas.',
  },
  {
    step: '03',
    title: 'Decida com prioridade',
    description:
      'Você recebe o que exige atenção agora, na ordem em que importa, com o motivo explicado em uma linha.',
  },
];

export const trustStats = [
  {value: 'B3 + NYSE', label: 'Cobertura de mercado'},
  {value: 'Tempo real', label: 'Atualização de cotações'},
  {value: 'LGPD', label: 'Tratamento de dados'},
  {value: 'AES-256', label: 'Criptografia em repouso'},
];

export interface PlanItem {
  name: string;
  price: string;
  period?: string;
  detail: string;
  aiPillar: string;
  cta: string;
  href: string;
  featured: boolean;
  benefits: string[];
}

export const planItems: PlanItem[] = [
  {
    name: 'Básico',
    price: 'Grátis',
    detail: 'Para organizar a carteira e enxergar o conjunto',
    aiPillar: 'Consolidação completa, sem limite de corretoras',
    cta: 'Começar grátis',
    href: '/register',
    featured: false,
    benefits: [
      'Até 10 ativos',
      'Consolidação de todas as corretoras',
      'Alocação por ativo, setor e classe',
      'Acompanhamento de proventos',
    ],
  },
  {
    name: 'Premium',
    price: 'R$ 29',
    period: '/mês',
    detail: 'Para quem já tem carteira formada e decide toda semana',
    aiPillar: 'IA priorizando o que fazer, com o fiscal resolvido junto',
    cta: 'Assinar Premium',
    href: '/register',
    featured: true,
    benefits: [
      'Ativos ilimitados',
      'Alertas de risco e concentração com IA',
      'Apuração de IR e DARF calculada',
      'Comparador de ativos',
      'RI resumido em linguagem direta',
      'Alertas personalizados',
    ],
  },
  {
    name: 'Global Investor',
    price: 'Sob consulta',
    detail: 'Para operação maior ou múltiplas carteiras',
    aiPillar: 'Copilot completo, multiportfólio e cenários futuros',
    cta: 'Falar com especialista',
    href: '/register',
    featured: false,
    benefits: [
      'Tudo do Premium',
      'Gestão multiportfólio',
      'Radar de oportunidade com IA',
      'Simulador de cenários',
      'API dedicada',
      'Suporte prioritário',
    ],
  },
];

export const faqItems = [
  {
    question: 'Meus dados ficam seguros?',
    answer:
      'Sim. Os dados são criptografados em repouso com AES-256 e trafegam sempre por conexão cifrada. O tratamento segue a LGPD, e você pode exportar ou apagar tudo quando quiser, direto nas configurações da conta.',
  },
  {
    question: 'Funciona com a minha corretora?',
    answer:
      'O Trackerr importa nota de corretagem e extrato da B3, o que cobre qualquer corretora que opere no mercado brasileiro. Para as principais, há também sincronização direta, sem importação manual.',
  },
  {
    question: 'O que o plano grátis inclui de verdade?',
    answer:
      'Até 10 ativos com consolidação completa, alocação e acompanhamento de proventos. Sem prazo de expiração e sem pedir cartão. A IA de priorização e o módulo fiscal são do Premium.',
  },
  {
    question: 'Posso cancelar quando quiser?',
    answer:
      'Sim, pelo próprio painel, sem falar com ninguém. O acesso continua até o fim do período já pago e sua carteira permanece disponível no plano grátis.',
  },
  {
    question: 'O Trackerr recomenda o que comprar?',
    answer:
      'Não. O Trackerr não é consultoria de investimento e não indica ativos. Ele mostra o que está fora do que você mesmo definiu como estratégia — concentração acima do seu limite, por exemplo — e deixa a decisão com você.',
  },
];

export const finalCtaCopy = {
  title: 'Pare de consolidar carteira na mão',
  subtitle:
    'Conecte sua carteira e receba a primeira leitura de risco e concentração em minutos.',
  bullets: [
    'Sem cartão para começar',
    'Cancelamento a qualquer momento',
    'Dados tratados conforme a LGPD',
  ],
};

export const footerColumns = [
  {
    title: 'Produto',
    links: [
      {label: 'Como funciona', to: '#como-funciona'},
      {label: 'Planos', to: '#planos'},
      {label: 'Perguntas frequentes', to: '#faq'},
    ],
  },
  {
    title: 'Conta',
    links: [
      {label: 'Entrar', to: '/signin'},
      {label: 'Criar conta', to: '/register'},
      {label: 'Recuperar senha', to: '/forgot-password'},
    ],
  },
  {
    title: 'Legal',
    links: [
      {label: 'Termos de uso', to: '/termos'},
      {label: 'Política de privacidade', to: '/privacidade'},
      {label: 'Cookies', to: '/cookies'},
    ],
  },
];
```

- [ ] **Step 4: Rodar o teste de dados**

```bash
npx vitest run src/components/landing/landing-data.spec.ts
```

Esperado: PASS, 7 testes.

- [ ] **Step 5: Confirmar a quebra esperada nos componentes antigos**

```bash
npx tsc --noEmit
```

Esperado: FALHA, com erros em `HeroSection.tsx` (`returnCards`), `ValueSection.tsx` (`valueCards`) e `MarketTape.tsx`. Isso é esperado — esses arquivos são substituídos nas tasks seguintes. **Não** conserte-os aqui e **não** reintroduza `valueCards`/`returnCards`.

- [ ] **Step 6: Commit**

```bash
git add src/components/landing/landing-data.ts src/components/landing/landing-data.spec.ts
git commit -m "feat(web): rewrite landing copy for portfolio-owner persona"
```

---

### Task 4: Marquee com GSAP e a faixa de mercado

**Files:**
- Create: `src/components/landing/motion/useMarquee.ts`
- Create: `src/components/landing/sections/MarketTape.tsx`
- Delete: `src/components/landing/MarketTape.tsx`
- Test: `src/components/landing/sections/MarketTape.spec.tsx`

**Interfaces:**
- Consumes: `marketTape` e `TickerQuote` da Task 3; `ensureScrollTrigger` não é usado aqui.
- Produces:
  - `useMarquee<T extends HTMLElement>(speed?: number): React.MutableRefObject<T | null>` — aplica loop infinito no elemento; `speed` em pixels por segundo, padrão 60.
  - `<MarketTape />` — componente sem props.

- [ ] **Step 1: Escrever o teste que falha**

Criar `src/components/landing/sections/MarketTape.spec.tsx`:

```tsx
import {describe, it, expect, beforeEach, vi} from 'vitest';
import {render, screen} from '@testing-library/react';
import {MarketTape} from './MarketTape';

describe('MarketTape', () => {
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

  it('duplica a lista para o loop não ter emenda visível', () => {
    render(<MarketTape />);
    expect(screen.getAllByText('PETR4')).toHaveLength(2);
  });

  it('marca alta e baixa com cores semânticas distintas', () => {
    render(<MarketTape />);
    const alta = screen.getAllByText('+2,14%')[0];
    const baixa = screen.getAllByText('-0,42%')[0];

    expect(alta.className).toContain('text-positive');
    expect(baixa.className).toContain('text-negative');
  });
});
```

- [ ] **Step 2: Rodar e confirmar que falha**

```bash
npx vitest run src/components/landing/sections/MarketTape.spec.tsx
```

Esperado: FAIL — módulo não encontrado.

- [ ] **Step 3: Criar `src/components/landing/motion/useMarquee.ts`**

```ts
import {useEffect, useRef} from 'react';
import gsap from 'gsap';

/**
 * Loop horizontal infinito.
 *
 * O truque está no `modifiers`: em vez de animar até -50% e reiniciar (o que
 * produz um salto de um frame), o x é envolvido em módulo da metade da largura,
 * então o trilho nunca "volta" — ele só continua. A lista precisa estar
 * duplicada no DOM para isso funcionar.
 */
export function useMarquee<T extends HTMLElement>(speed = 60) {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function')
      return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const half = el.scrollWidth / 2;
    if (!half) return;

    const ctx = gsap.context(() => {
      const wrap = gsap.utils.wrap(-half, 0);
      const tween = gsap.to(el, {
        x: `-=${half}`,
        duration: half / speed,
        ease: 'none',
        repeat: -1,
        modifiers: {
          x: (value) => `${wrap(parseFloat(value))}px`,
        },
      });

      const pause = () => tween.pause();
      const resume = () => tween.resume();

      el.addEventListener('mouseenter', pause);
      el.addEventListener('mouseleave', resume);

      return () => {
        el.removeEventListener('mouseenter', pause);
        el.removeEventListener('mouseleave', resume);
      };
    }, el);

    return () => ctx.revert();
  }, [speed]);

  return ref;
}
```

- [ ] **Step 4: Criar `src/components/landing/sections/MarketTape.tsx`**

```tsx
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
```

- [ ] **Step 5: Remover o arquivo antigo e a keyframe morta**

```bash
rm src/components/landing/MarketTape.tsx
```

Em `tailwind.config.ts`, remover a keyframe `ticker` (linhas 55–60) e a entrada `ticker: 'ticker 32s linear infinite'` de `animation` (linha 70) — o marquee agora é feito em GSAP e essas regras ficaram órfãs.

- [ ] **Step 6: Rodar o teste**

```bash
npx vitest run src/components/landing/sections/MarketTape.spec.tsx
```

Esperado: PASS, 2 testes.

- [ ] **Step 7: Commit**

```bash
git add src/components/landing/motion/useMarquee.ts src/components/landing/sections/MarketTape.tsx src/components/landing/sections/MarketTape.spec.tsx tailwind.config.ts
git commit -m "feat(web): replace css ticker with gsap marquee"
```

---

### Task 5: Nav e Hero

**Files:**
- Create: `src/components/landing/motion/useMagnetic.ts`
- Create: `src/components/landing/sections/LandingNav.tsx`
- Create: `src/components/landing/sections/HeroSection.tsx`
- Modify: `src/components/landing/MarketChart.tsx` (restilizar traço e pontos)
- Delete: `src/components/landing/LandingNav.tsx`, `src/components/landing/HeroSection.tsx`
- Test: `src/components/landing/sections/HeroSection.spec.tsx`

**Interfaces:**
- Consumes: `heroCopy`, `heroPanel` (Task 3); `Section`, `Eyebrow`, `GlassPanel`, `GridBackdrop`, `Ticker` (Tasks 1–2); `useGsapParallax` (Task 2).
- Produces:
  - `useMagnetic<T extends HTMLElement>(strength?: number): React.MutableRefObject<T | null>` — padrão 0.25.
  - `<LandingNav />`, `<HeroSection />` — sem props.

- [ ] **Step 1: Escrever o teste que falha**

Criar `src/components/landing/sections/HeroSection.spec.tsx`:

```tsx
import {describe, it, expect, beforeEach, vi} from 'vitest';
import {render, screen} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';
import {HeroSection} from './HeroSection';

const renderHero = () =>
  render(
    <MemoryRouter>
      <HeroSection />
    </MemoryRouter>,
  );

describe('HeroSection', () => {
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

  it('apresenta a promessa central', () => {
    renderHero();
    expect(screen.getByText(/sua carteira inteira/i)).toBeInTheDocument();
    expect(
      screen.getByText(/sem planilha, sem surpresa no ir/i),
    ).toBeInTheDocument();
  });

  it('oferece os dois caminhos: criar conta e ver o produto', () => {
    renderHero();
    expect(
      screen.getByRole('link', {name: /começar grátis/i}),
    ).toHaveAttribute('href', '/register');
    expect(screen.getByRole('link', {name: /ver como funciona/i})).toHaveAttribute(
      'href',
      '#produto',
    );
  });

  it('mostra a micro-prova que remove atrito da decisão', () => {
    renderHero();
    expect(screen.getByText(/grátis até 10 ativos/i)).toBeInTheDocument();
    expect(screen.getByText(/sem cartão de crédito/i)).toBeInTheDocument();
  });

  it('mostra o painel de produto com os números da carteira', () => {
    renderHero();
    expect(screen.getByText(/carteira consolidada/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/gráfico em alta/i)).toBeInTheDocument();
    expect(screen.getByText(/retorno 30d/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Rodar e confirmar que falha**

```bash
npx vitest run src/components/landing/sections/HeroSection.spec.tsx
```

Esperado: FAIL — módulo não encontrado.

- [ ] **Step 3: Criar `src/components/landing/motion/useMagnetic.ts`**

```ts
import {useEffect, useRef} from 'react';
import gsap from 'gsap';

/**
 * Hover magnético: o elemento acompanha levemente o cursor e volta ao centro
 * na saída. Só desktop — em touch não há cursor e o efeito só atrapalha.
 */
export function useMagnetic<T extends HTMLElement>(strength = 0.25) {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function')
      return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (!window.matchMedia('(min-width: 1024px)').matches) return;

    const ctx = gsap.context(() => {
      const onMove = (event: MouseEvent) => {
        const rect = el.getBoundingClientRect();
        const x = event.clientX - (rect.left + rect.width / 2);
        const y = event.clientY - (rect.top + rect.height / 2);

        gsap.to(el, {
          x: x * strength,
          y: y * strength,
          duration: 0.4,
          ease: 'power3.out',
        });
      };

      const onLeave = () => {
        gsap.to(el, {x: 0, y: 0, duration: 0.5, ease: 'power3.out'});
      };

      el.addEventListener('mousemove', onMove);
      el.addEventListener('mouseleave', onLeave);

      return () => {
        el.removeEventListener('mousemove', onMove);
        el.removeEventListener('mouseleave', onLeave);
      };
    }, el);

    return () => ctx.revert();
  }, [strength]);

  return ref;
}
```

- [ ] **Step 4: Criar `src/components/landing/sections/LandingNav.tsx`**

```tsx
import {useEffect, useState} from 'react';
import {Link} from 'react-router-dom';
import {Button} from '@/components/ui/button';
import trackerrLogo from '@/assets/logo.png';

const navLinks = [
  {label: 'Produto', id: 'produto'},
  {label: 'Como funciona', id: 'como-funciona'},
  {label: 'Planos', id: 'planos'},
  {label: 'Dúvidas', id: 'faq'},
];

export function LandingNav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, {passive: true});
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const goTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({behavior: 'smooth'});
  };

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'border-b border-surface-hairline/[0.07] bg-surface-base/80 backdrop-blur-xl'
          : 'border-b border-transparent'
      }`}>
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2">
          <img src={trackerrLogo} alt="trackerr" className="h-8 w-auto" />
          <span className="font-heading text-lg font-semibold tracking-tight text-on-surface">
            trackerr
          </span>
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <button
              key={link.id}
              type="button"
              onClick={() => goTo(link.id)}
              className="rounded-full px-4 py-2 text-sm text-on-surface-muted/60 transition-colors hover:bg-surface-hairline/[0.06] hover:text-on-surface">
              {link.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Button
            asChild
            variant="ghost"
            className="text-on-surface-muted/70 hover:bg-surface-hairline/[0.06] hover:text-on-surface">
            <Link to="/signin">Entrar</Link>
          </Button>
          <Button
            asChild
            className="bg-brand text-brand-foreground transition-colors hover:bg-brand-strong">
            <Link to="/register">Criar conta</Link>
          </Button>
        </div>
      </nav>
    </header>
  );
}

export default LandingNav;
```

- [ ] **Step 5: Criar `src/components/landing/sections/HeroSection.tsx`**

```tsx
import {useEffect, useRef} from 'react';
import {Link} from 'react-router-dom';
import gsap from 'gsap';
import {ArrowRight} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Eyebrow} from '../ui/Eyebrow';
import {GlassPanel} from '../ui/GlassPanel';
import {GridBackdrop} from '../ui/GridBackdrop';
import {Ticker} from '../ui/Ticker';
import {MarketChart} from '../MarketChart';
import {heroCopy, heroPanel} from '../landing-data';
import {useMagnetic} from '../motion/useMagnetic';
import {useGsapParallax} from '../motion/useGsapReveal';

const currency = (n: number) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(n);

export function HeroSection() {
  const rootRef = useRef<HTMLElement | null>(null);
  const ctaRef = useMagnetic<HTMLAnchorElement>(0.2);
  const gridRef = useGsapParallax<HTMLDivElement>(30);

  // Timeline de entrada. Não usa ScrollTrigger: o hero já está na viewport
  // no primeiro paint, então a cascata roda no mount.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function')
      return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const ctx = gsap.context(() => {
      gsap
        .timeline({defaults: {ease: 'power3.out', duration: 0.7}})
        .from('[data-hero="eyebrow"]', {opacity: 0, y: 16})
        .from('[data-hero="line"]', {opacity: 0, y: 24, stagger: 0.1}, '-=0.45')
        .from('[data-hero="sub"]', {opacity: 0, y: 16}, '-=0.4')
        .from('[data-hero="ctas"]', {opacity: 0, y: 16}, '-=0.45')
        .from('[data-hero="proof"]', {opacity: 0, y: 12}, '-=0.5')
        .from(
          '[data-hero="panel"]',
          {opacity: 0, y: 32, rotateX: 6, transformPerspective: 900},
          '-=0.8',
        );
    }, root);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={rootRef}
      id="inicio"
      className="relative overflow-hidden pb-24 pt-36 sm:pb-32">
      <div ref={gridRef} className="absolute inset-0">
        <GridBackdrop />
      </div>

      <div className="relative mx-auto grid max-w-7xl gap-16 px-4 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:items-center lg:px-8">
        <div>
          <div data-hero="eyebrow">
            <Eyebrow>{heroCopy.eyebrow}</Eyebrow>
          </div>

          <h1 className="mt-7 font-heading font-bold tracking-[-0.03em] text-on-surface [font-size:clamp(2.5rem,6vw,4.5rem)] [line-height:0.98]">
            <span data-hero="line" className="block">
              {heroCopy.title}
            </span>
            <span
              data-hero="line"
              className="block text-on-surface-muted/45">
              {heroCopy.titleAccent}
            </span>
          </h1>

          <p
            data-hero="sub"
            className="mt-7 max-w-xl text-[1.0625rem] leading-[1.7] text-on-surface-muted/65">
            {heroCopy.subtitle}
          </p>

          <div
            data-hero="ctas"
            className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Button
              asChild
              size="lg"
              className="group bg-brand text-brand-foreground transition-colors hover:bg-brand-strong">
              <Link ref={ctaRef} to={heroCopy.primaryCta.href}>
                {heroCopy.primaryCta.label}
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-surface-hairline/[0.12] bg-transparent text-on-surface hover:bg-surface-hairline/[0.06] hover:text-on-surface">
              <a href={heroCopy.secondaryCta.href}>
                {heroCopy.secondaryCta.label}
              </a>
            </Button>
          </div>

          <ul
            data-hero="proof"
            className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2">
            {heroCopy.microProof.map((item) => (
              <li
                key={item}
                className="flex items-center gap-2 text-sm text-on-surface-muted/50">
                <span className="h-1 w-1 rounded-full bg-positive" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div data-hero="panel">
          <GlassPanel className="p-6">
            <div className="mb-6 flex items-start justify-between">
              <div>
                <p className="font-heading text-sm font-semibold text-on-surface">
                  {heroPanel.title}
                </p>
                <p className="mt-1 text-xs text-on-surface-muted/50">
                  {heroPanel.subtitle}
                </p>
              </div>
              <span className="flex items-center gap-2 rounded-full border border-positive/20 bg-positive/10 px-3 py-1 text-xs font-medium text-positive">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-positive opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-positive" />
                </span>
                ao vivo
              </span>
            </div>

            <div className="h-52">
              <MarketChart />
            </div>

            <dl className="mt-6 grid grid-cols-3 gap-4 border-t border-surface-hairline/[0.07] pt-5">
              {heroPanel.kpis.map((kpi) => (
                <div key={kpi.label}>
                  <dt className="text-xs text-on-surface-muted/50">
                    {kpi.label}
                  </dt>
                  <dd className="mt-1.5 font-heading text-lg font-semibold text-positive">
                    <Ticker
                      value={kpi.value}
                      format={(n) => `+${n.toFixed(2).replace('.', ',')}`}
                    />
                    {kpi.suffix}
                  </dd>
                </div>
              ))}
            </dl>

            <dl className="mt-5 grid grid-cols-3 gap-4 border-t border-surface-hairline/[0.07] pt-5">
              <div>
                <dt className="text-xs text-on-surface-muted/50">Patrimônio</dt>
                <dd className="mt-1 font-heading text-base font-semibold tabular-nums text-on-surface">
                  {currency(heroPanel.equity)}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-on-surface-muted/50">Posições</dt>
                <dd className="mt-1 font-heading text-base font-semibold tabular-nums text-on-surface">
                  {heroPanel.positions}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-on-surface-muted/50">Risco</dt>
                <dd className="mt-1 font-heading text-base font-semibold text-on-surface">
                  {heroPanel.risk}
                </dd>
              </div>
            </dl>
          </GlassPanel>
        </div>
      </div>
    </section>
  );
}

export default HeroSection;
```

- [ ] **Step 6: Restilizar `MarketChart.tsx`**

Manter toda a lógica de animação e o `aria-label` intactos. Trocar apenas as cores nos `<defs>` e nos círculos finais, para usarem os tokens novos:

```tsx
        <linearGradient id="tk-line" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="hsl(var(--brand))" />
          <stop offset="100%" stopColor="hsl(var(--accent-positive))" />
        </linearGradient>
        <linearGradient id="tk-area" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="hsl(var(--brand) / 0.22)" />
          <stop offset="100%" stopColor="hsl(var(--brand) / 0)" />
        </linearGradient>
```

E os dois círculos finais:

```tsx
      <circle cx="620" cy="42" r="4" fill="hsl(var(--accent-positive))" />
      <circle cx="620" cy="42" r="9" fill="hsl(var(--accent-positive) / 0.2)" />
```

E a grade de fundo, para hairline em vez de `on-surface`:

```tsx
          stroke="hsl(var(--surface-hairline) / 0.05)"
```

- [ ] **Step 7: Remover os arquivos antigos**

```bash
rm src/components/landing/LandingNav.tsx src/components/landing/HeroSection.tsx
```

- [ ] **Step 8: Rodar o teste**

```bash
npx vitest run src/components/landing/sections/HeroSection.spec.tsx
```

Esperado: PASS, 4 testes.

Se o teste do link primário falhar porque `useMagnetic` não aceita o ref do `<Link>`: `react-router-dom` v6 encaminha ref para o `<a>`, então `useMagnetic<HTMLAnchorElement>` funciona. Se o TypeScript reclamar do tipo do ref, use `ref={ctaRef as React.Ref<HTMLAnchorElement>}`.

- [ ] **Step 9: Commit**

```bash
git add src/components/landing/motion/useMagnetic.ts src/components/landing/sections/LandingNav.tsx src/components/landing/sections/HeroSection.tsx src/components/landing/sections/HeroSection.spec.tsx src/components/landing/MarketChart.tsx
git commit -m "feat(web): rebuild landing nav and hero with entrance timeline"
```

---

### Task 6: Mockups de produto

**Files:**
- Modify: `src/components/landing/landing-data.ts` (adicionar os dados dos mockups ao final)
- Create: `src/components/landing/mockups/PortfolioMockup.tsx`
- Create: `src/components/landing/mockups/AiAlertMockup.tsx`
- Create: `src/components/landing/mockups/TaxMockup.tsx`
- Test: `src/components/landing/mockups/mockups.spec.tsx`

**Interfaces:**
- Consumes: `GlassPanel` (Task 1).
- Produces:
  - `portfolioMockupData: {total: number; positions: Array<{symbol: string; name: string; weight: number; change: string; up: boolean}>}`
  - `aiAlertMockupData: Array<{severity: 'alta' | 'média' | 'baixa'; title: string; detail: string}>`
  - `taxMockupData: {month: string; sales: number; profit: number; offset: number; taxable: number; darf: number}`
  - `<PortfolioMockup />`, `<AiAlertMockup />`, `<TaxMockup />` — sem props.

- [ ] **Step 1: Escrever o teste que falha**

Criar `src/components/landing/mockups/mockups.spec.tsx`:

```tsx
import {describe, it, expect, beforeEach, vi} from 'vitest';
import {render, screen} from '@testing-library/react';
import {PortfolioMockup} from './PortfolioMockup';
import {AiAlertMockup} from './AiAlertMockup';
import {TaxMockup} from './TaxMockup';

describe('mockups de produto', () => {
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

  it('PortfolioMockup lista posições com peso na carteira', () => {
    render(<PortfolioMockup />);
    expect(screen.getByText('PETR4')).toBeInTheDocument();
    expect(screen.getByText('23,4%')).toBeInTheDocument();
  });

  it('AiAlertMockup mostra alerta priorizado com severidade', () => {
    render(<AiAlertMockup />);
    expect(screen.getByText(/concentração acima do limite/i)).toBeInTheDocument();
    expect(screen.getAllByText(/alta/i).length).toBeGreaterThan(0);
  });

  it('TaxMockup mostra a DARF calculada', () => {
    render(<TaxMockup />);
    expect(screen.getByText(/darf a pagar/i)).toBeInTheDocument();
    expect(screen.getByText(/R\$\s?1\.284,60/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Rodar e confirmar que falha**

```bash
npx vitest run src/components/landing/mockups/mockups.spec.tsx
```

Esperado: FAIL — módulos não encontrados.

- [ ] **Step 3: Adicionar os dados ao final de `landing-data.ts`**

```ts
/* ──────────────────────────────────────────────────────────────────
 * Dados fictícios dos mockups de produto. Não são screenshots: são
 * componentes React, então acompanham o tema e podem ser animados.
 * ────────────────────────────────────────────────────────────────── */

export const portfolioMockupData = {
  total: 284930,
  positions: [
    {symbol: 'PETR4', name: 'Petrobras PN', weight: 23.4, change: '+2,14%', up: true},
    {symbol: 'ITUB4', name: 'Itaú Unibanco PN', weight: 14.8, change: '-0,42%', up: false},
    {symbol: 'VALE3', name: 'Vale ON', weight: 12.1, change: '+1,37%', up: true},
    {symbol: 'IVVB11', name: 'S&P 500 BDR', weight: 11.6, change: '+0,64%', up: true},
    {symbol: 'WEGE3', name: 'WEG ON', weight: 9.2, change: '+3,08%', up: true},
  ],
};

export const aiAlertMockupData = [
  {
    severity: 'alta' as const,
    title: 'Concentração acima do limite',
    detail: 'PETR4 representa 23,4% da carteira. Seu limite definido é 15%.',
  },
  {
    severity: 'média' as const,
    title: 'Dividendo parado em caixa',
    detail: 'R$ 3.412 recebidos em proventos há 38 dias, ainda sem reaporte.',
  },
  {
    severity: 'baixa' as const,
    title: 'Exposição setorial subiu',
    detail: 'Setor financeiro passou de 18% para 26% após o último aporte.',
  },
];

export const taxMockupData = {
  month: 'Março de 2026',
  sales: 92400,
  profit: 8320,
  offset: 3480,
  taxable: 4840,
  darf: 1284.6,
};
```

- [ ] **Step 4: Criar `src/components/landing/mockups/PortfolioMockup.tsx`**

```tsx
import {GlassPanel} from '../ui/GlassPanel';
import {portfolioMockupData} from '../landing-data';

const currency = (n: number) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(n);

const percent = (n: number) => `${n.toFixed(1).replace('.', ',')}%`;

/** Recorte da tela de carteira: total consolidado e as maiores posições. */
export function PortfolioMockup() {
  const {total, positions} = portfolioMockupData;

  return (
    <GlassPanel className="p-6">
      <div className="flex items-baseline justify-between">
        <div>
          <p className="text-xs text-on-surface-muted/50">
            Patrimônio consolidado
          </p>
          <p className="mt-1 font-heading text-3xl font-bold tabular-nums text-on-surface">
            {currency(total)}
          </p>
        </div>
        <span className="rounded-full border border-surface-hairline/[0.08] px-3 py-1 text-xs text-on-surface-muted/50">
          4 corretoras
        </span>
      </div>

      <ul className="mt-7 space-y-4">
        {positions.map((position) => (
          <li key={position.symbol}>
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="font-heading text-sm font-semibold text-on-surface">
                  {position.symbol}
                </p>
                <p className="truncate text-xs text-on-surface-muted/45">
                  {position.name}
                </p>
              </div>
              <div className="flex items-center gap-4 whitespace-nowrap">
                <span className="text-sm tabular-nums text-on-surface-muted/70">
                  {percent(position.weight)}
                </span>
                <span
                  className={`w-16 text-right text-sm tabular-nums ${
                    position.up ? 'text-positive' : 'text-negative'
                  }`}>
                  {position.change}
                </span>
              </div>
            </div>
            <div className="mt-2 h-1 overflow-hidden rounded-full bg-surface-hairline/[0.06]">
              <div
                className="h-full rounded-full bg-brand/70"
                style={{width: `${position.weight * 3}%`}}
              />
            </div>
          </li>
        ))}
      </ul>
    </GlassPanel>
  );
}

export default PortfolioMockup;
```

- [ ] **Step 5: Criar `src/components/landing/mockups/AiAlertMockup.tsx`**

```tsx
import {AlertTriangle, Info, TrendingUp} from 'lucide-react';
import {GlassPanel} from '../ui/GlassPanel';
import {aiAlertMockupData} from '../landing-data';

const severityStyles = {
  alta: {
    icon: AlertTriangle,
    chip: 'border-negative/25 bg-negative/10 text-negative',
  },
  média: {
    icon: TrendingUp,
    chip: 'border-brand/25 bg-brand/10 text-on-surface-accent',
  },
  baixa: {
    icon: Info,
    chip: 'border-surface-hairline/[0.1] bg-surface-hairline/[0.04] text-on-surface-muted/60',
  },
} as const;

/** Recorte da tela de alertas: o que a IA colocou no topo da fila. */
export function AiAlertMockup() {
  return (
    <GlassPanel className="p-6">
      <div className="flex items-center justify-between">
        <p className="font-heading text-sm font-semibold text-on-surface">
          O que exige atenção
        </p>
        <span className="text-xs text-on-surface-muted/45">
          Atualizado há 2 min
        </span>
      </div>

      <ul className="mt-6 space-y-3">
        {aiAlertMockupData.map((alert) => {
          const style = severityStyles[alert.severity];
          const Icon = style.icon;

          return (
            <li
              key={alert.title}
              className="rounded-xl border border-surface-hairline/[0.07] bg-surface-hairline/[0.02] p-4">
              <div className="flex items-start gap-3">
                <span
                  className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${style.chip}`}>
                  <Icon className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-heading text-sm font-semibold text-on-surface">
                      {alert.title}
                    </p>
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${style.chip}`}>
                      {alert.severity}
                    </span>
                  </div>
                  <p className="mt-1.5 text-sm leading-relaxed text-on-surface-muted/60">
                    {alert.detail}
                  </p>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </GlassPanel>
  );
}

export default AiAlertMockup;
```

- [ ] **Step 6: Criar `src/components/landing/mockups/TaxMockup.tsx`**

```tsx
import {GlassPanel} from '../ui/GlassPanel';
import {taxMockupData} from '../landing-data';

const currency = (n: number) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  }).format(n);

/** Recorte da tela fiscal: apuração do mês até a DARF. */
export function TaxMockup() {
  const {month, sales, profit, offset, taxable, darf} = taxMockupData;

  const rows = [
    {label: 'Vendas no mês', value: currency(sales)},
    {label: 'Lucro apurado', value: currency(profit)},
    {label: 'Prejuízo compensado', value: `- ${currency(offset)}`},
    {label: 'Base tributável', value: currency(taxable)},
  ];

  return (
    <GlassPanel className="p-6">
      <div className="flex items-center justify-between">
        <p className="font-heading text-sm font-semibold text-on-surface">
          Apuração de IR
        </p>
        <span className="rounded-full border border-surface-hairline/[0.08] px-3 py-1 text-xs text-on-surface-muted/50">
          {month}
        </span>
      </div>

      <dl className="mt-6 space-y-3">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex items-center justify-between border-b border-surface-hairline/[0.05] pb-3 last:border-b-0">
            <dt className="text-sm text-on-surface-muted/60">{row.label}</dt>
            <dd className="text-sm tabular-nums text-on-surface">{row.value}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-6 rounded-xl border border-brand/25 bg-brand/10 p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-on-surface-accent">
            DARF a pagar
          </p>
          <p className="font-heading text-xl font-bold tabular-nums text-on-surface">
            {currency(darf)}
          </p>
        </div>
        <p className="mt-2 text-xs text-on-surface-muted/50">
          Código 6015 · vencimento no último dia útil do mês seguinte
        </p>
      </div>
    </GlassPanel>
  );
}

export default TaxMockup;
```

- [ ] **Step 7: Rodar o teste**

```bash
npx vitest run src/components/landing/mockups/mockups.spec.tsx
```

Esperado: PASS, 3 testes. Se a asserção da DARF falhar por causa do espaço não-quebrável que o `Intl` insere entre "R$" e o número, a regex `/R\$\s?1\.284,60/` do teste já cobre ambos os casos — se ainda assim falhar, ajuste para `/1\.284,60/`.

- [ ] **Step 8: Commit**

```bash
git add src/components/landing/mockups/ src/components/landing/landing-data.ts
git commit -m "feat(web): add product mockups for landing"
```

---

### Task 7: Seção de problema

**Files:**
- Create: `src/components/landing/sections/ProblemSection.tsx`
- Test: `src/components/landing/sections/ProblemSection.spec.tsx`

**Interfaces:**
- Consumes: `problemCopy` (Task 3); `Section`, `GlassPanel` (Task 1).
- Produces: `<ProblemSection />` — sem props.

- [ ] **Step 1: Escrever o teste que falha**

Criar `src/components/landing/sections/ProblemSection.spec.tsx`:

```tsx
import {describe, it, expect} from 'vitest';
import {render, screen} from '@testing-library/react';
import {ProblemSection} from './ProblemSection';

describe('ProblemSection', () => {
  it('nomeia o problema como falta de controle, não de investimento', () => {
    render(<ProblemSection />);
    expect(
      screen.getByText(/você não tem um problema de investimento/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/tem um problema de controle/i)).toBeInTheDocument();
  });

  it('apresenta as três dores como cartões', () => {
    render(<ProblemSection />);
    expect(
      screen.getByText(/ativos em três corretoras diferentes/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/o ir vira um fim de semana perdido/i)).toBeInTheDocument();
    expect(
      screen.getByText(/a concentração aparece tarde demais/i),
    ).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Rodar e confirmar que falha**

```bash
npx vitest run src/components/landing/sections/ProblemSection.spec.tsx
```

Esperado: FAIL — módulo não encontrado.

- [ ] **Step 3: Criar o componente**

```tsx
import {Section} from '../ui/Section';
import {GlassPanel} from '../ui/GlassPanel';
import {problemCopy} from '../landing-data';

export function ProblemSection() {
  return (
    <Section id="problema">
      <div className="max-w-3xl">
        <h2
          data-reveal
          className="font-heading font-bold tracking-[-0.03em] text-on-surface [font-size:clamp(1.875rem,3.5vw,3rem)] [line-height:1.08]">
          <span className="block">{problemCopy.title}</span>
          <span className="block text-on-surface-muted/45">
            {problemCopy.titleAccent}
          </span>
        </h2>
        <p
          data-reveal
          data-reveal-delay="0.08"
          className="mt-6 text-[1.0625rem] leading-[1.7] text-on-surface-muted/60">
          {problemCopy.subtitle}
        </p>
      </div>

      <div className="mt-14 grid gap-5 md:grid-cols-3">
        {problemCopy.cards.map((card, index) => (
          <GlassPanel
            key={card.title}
            data-reveal
            data-reveal-delay={String(index * 0.1)}
            className="p-7">
            <span className="font-heading text-sm tabular-nums text-on-surface-muted/35">
              {String(index + 1).padStart(2, '0')}
            </span>
            <h3 className="mt-4 font-heading text-lg font-semibold leading-snug text-on-surface">
              {card.title}
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-on-surface-muted/60">
              {card.description}
            </p>
          </GlassPanel>
        ))}
      </div>
    </Section>
  );
}

export default ProblemSection;
```

- [ ] **Step 4: Rodar o teste**

```bash
npx vitest run src/components/landing/sections/ProblemSection.spec.tsx
```

Esperado: PASS, 2 testes.

- [ ] **Step 5: Commit**

```bash
git add src/components/landing/sections/ProblemSection.tsx src/components/landing/sections/ProblemSection.spec.tsx
git commit -m "feat(web): add landing problem section"
```

---

### Task 8: Seção de produto com sequência pinada

**Files:**
- Create: `src/components/landing/motion/usePinnedSequence.ts`
- Create: `src/components/landing/sections/ProductSection.tsx`
- Test: `src/components/landing/sections/ProductSection.spec.tsx`

**Interfaces:**
- Consumes: `productCopy` (Task 3); os três mockups (Task 6); `Section` (Task 1); `ensureScrollTrigger` (Task 2).
- Produces:
  - `usePinnedSequence<T extends HTMLElement>(panelCount: number): React.MutableRefObject<T | null>` — o elemento retornado deve conter `[data-panel]` (os painéis empilhados) e `[data-pin-target]` (o que fica pinado).
  - `<ProductSection />` — sem props.

- [ ] **Step 1: Escrever o teste que falha**

Criar `src/components/landing/sections/ProductSection.spec.tsx`:

```tsx
import {describe, it, expect, beforeEach, vi} from 'vitest';
import {render, screen} from '@testing-library/react';
import {ProductSection} from './ProductSection';

describe('ProductSection', () => {
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

  it('ancora em #produto para o CTA secundário do hero funcionar', () => {
    const {container} = render(<ProductSection />);
    expect(container.querySelector('#produto')).not.toBeNull();
  });

  it('apresenta os três blocos de produto', () => {
    render(<ProductSection />);
    expect(screen.getByText('Carteira consolidada')).toBeInTheDocument();
    expect(screen.getByText('IA que prioriza')).toBeInTheDocument();
    expect(screen.getByText('Fiscal resolvido')).toBeInTheDocument();
  });

  it('renderiza os três mockups, um por bloco', () => {
    render(<ProductSection />);
    expect(screen.getByText(/patrimônio consolidado/i)).toBeInTheDocument();
    expect(screen.getByText(/o que exige atenção/i)).toBeInTheDocument();
    expect(screen.getByText(/apuração de ir/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Rodar e confirmar que falha**

```bash
npx vitest run src/components/landing/sections/ProductSection.spec.tsx
```

Esperado: FAIL — módulo não encontrado.

- [ ] **Step 3: Criar `src/components/landing/motion/usePinnedSequence.ts`**

```ts
import {useEffect, useRef} from 'react';
import gsap from 'gsap';
import {ensureScrollTrigger} from './useGsapReveal';

/**
 * Pina a coluna do mockup e troca os painéis conforme o scroll da seção.
 *
 * Só roda a partir de 1024px, via gsap.matchMedia: em telas menores não há
 * espaço lateral para o efeito, e a seção vira empilhamento simples. O
 * matchMedia do GSAP também cuida da limpeza ao sair da faixa.
 *
 * Contrato do DOM: o container precisa conter um `[data-pin-target]` (o que
 * fica preso) e `panelCount` elementos `[data-panel]` sobrepostos dentro dele.
 */
export function usePinnedSequence<T extends HTMLElement>(panelCount: number) {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    if (!ensureScrollTrigger()) return;
    if (panelCount < 2) return;

    const mm = gsap.matchMedia();

    mm.add(
      {
        isDesktop: '(min-width: 1024px) and (prefers-reduced-motion: no-preference)',
      },
      (context) => {
        if (!context.conditions?.isDesktop) return;

        const panels = gsap.utils.toArray<HTMLElement>('[data-panel]', root);
        const pinTarget = root.querySelector<HTMLElement>('[data-pin-target]');
        if (!pinTarget || panels.length !== panelCount) return;

        gsap.set(panels, {opacity: 0, y: 24});
        gsap.set(panels[0], {opacity: 1, y: 0});

        const timeline = gsap.timeline({
          scrollTrigger: {
            trigger: root,
            start: 'top top+=80',
            end: `+=${(panelCount - 1) * 70}%`,
            pin: pinTarget,
            pinSpacing: false,
            scrub: 0.6,
          },
        });

        panels.forEach((panel, index) => {
          if (index === 0) return;
          timeline
            .to(panels[index - 1], {opacity: 0, y: -24, duration: 0.4})
            .to(panel, {opacity: 1, y: 0, duration: 0.4}, '<');
        });
      },
    );

    return () => mm.revert();
  }, [panelCount]);

  return ref;
}
```

- [ ] **Step 4: Criar `src/components/landing/sections/ProductSection.tsx`**

```tsx
import {Section} from '../ui/Section';
import {Eyebrow} from '../ui/Eyebrow';
import {PortfolioMockup} from '../mockups/PortfolioMockup';
import {AiAlertMockup} from '../mockups/AiAlertMockup';
import {TaxMockup} from '../mockups/TaxMockup';
import {productCopy} from '../landing-data';
import {usePinnedSequence} from '../motion/usePinnedSequence';

const mockupById = {
  carteira: PortfolioMockup,
  ia: AiAlertMockup,
  fiscal: TaxMockup,
};

export function ProductSection() {
  const rootRef = usePinnedSequence<HTMLDivElement>(productCopy.blocks.length);

  return (
    <Section id="produto">
      <div className="max-w-2xl">
        <div data-reveal>
          <Eyebrow>{productCopy.eyebrow}</Eyebrow>
        </div>
        <h2
          data-reveal
          data-reveal-delay="0.08"
          className="mt-6 font-heading font-bold tracking-[-0.03em] text-on-surface [font-size:clamp(1.875rem,3.5vw,3rem)] [line-height:1.08]">
          {productCopy.title}
        </h2>
        <p
          data-reveal
          data-reveal-delay="0.14"
          className="mt-5 text-[1.0625rem] leading-[1.7] text-on-surface-muted/60">
          {productCopy.subtitle}
        </p>
      </div>

      <div ref={rootRef} className="mt-16 lg:grid lg:grid-cols-2 lg:gap-16">
        {/* coluna de texto: rola normalmente */}
        <div className="space-y-16 lg:space-y-[70vh]">
          {productCopy.blocks.map((block, index) => {
            const Mockup = mockupById[block.id];

            return (
              <div key={block.id}>
                <div className="flex items-baseline gap-4">
                  <span className="font-heading text-sm tabular-nums text-on-surface-muted/30">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <h3 className="font-heading text-2xl font-semibold tracking-[-0.02em] text-on-surface">
                    {block.title}
                  </h3>
                </div>
                <p className="mt-4 max-w-lg text-[1.0625rem] leading-[1.7] text-on-surface-muted/60">
                  {block.description}
                </p>

                {/* Em mobile o mockup acompanha seu texto. Escondido no
                    desktop, onde a coluna pinada assume. */}
                <div className="mt-8 lg:hidden">
                  <Mockup />
                </div>
              </div>
            );
          })}
        </div>

        {/* coluna pinada: só desktop */}
        <div data-pin-target className="hidden lg:block">
          <div className="relative h-[520px]">
            {productCopy.blocks.map((block) => {
              const Mockup = mockupById[block.id];
              return (
                <div key={block.id} data-panel className="absolute inset-x-0 top-0">
                  <Mockup />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Section>
  );
}

export default ProductSection;
```

Observação sobre a duplicação: os mockups aparecem duas vezes no DOM — uma na coluna mobile (`lg:hidden`) e outra na coluna pinada (`hidden lg:block`). É proposital: é o que permite a mesma seção ser sequência pinada no desktop e empilhamento simples no mobile, sem JavaScript de breakpoint no render. Por isso o teste usa `getByText` na coluna mobile e passa — as duas cópias existem, mas as asserções do spec usam textos que aparecem uma vez por mockup, e ambos os mockups renderizam. **Se `getByText` reclamar de múltiplos elementos, troque as asserções do spec para `getAllByText(...)[0]`.**

- [ ] **Step 5: Rodar o teste**

```bash
npx vitest run src/components/landing/sections/ProductSection.spec.tsx
```

Esperado: PASS, 3 testes. Se houver erro de "found multiple elements", aplique o ajuste descrito no passo anterior.

- [ ] **Step 6: Commit**

```bash
git add src/components/landing/motion/usePinnedSequence.ts src/components/landing/sections/ProductSection.tsx src/components/landing/sections/ProductSection.spec.tsx
git commit -m "feat(web): add pinned product section with scroll sequence"
```

---

### Task 9: Como funciona e confiança

**Files:**
- Create: `src/components/landing/sections/HowItWorksSection.tsx`
- Create: `src/components/landing/sections/TrustSection.tsx`
- Delete: `src/components/landing/WorkflowSection.tsx`, `src/components/landing/ValueSection.tsx`
- Test: `src/components/landing/sections/HowItWorksSection.spec.tsx`

**Interfaces:**
- Consumes: `workflowSteps`, `trustStats` (Task 3); `Section` (Task 1).
- Produces: `<HowItWorksSection />`, `<TrustSection />` — sem props.

- [ ] **Step 1: Escrever o teste que falha**

Criar `src/components/landing/sections/HowItWorksSection.spec.tsx`:

```tsx
import {describe, it, expect} from 'vitest';
import {render, screen} from '@testing-library/react';
import {HowItWorksSection} from './HowItWorksSection';
import {TrustSection} from './TrustSection';

describe('HowItWorksSection', () => {
  it('ancora em #como-funciona e lista os três passos', () => {
    const {container} = render(<HowItWorksSection />);
    expect(container.querySelector('#como-funciona')).not.toBeNull();
    expect(screen.getByText('Conecte sua carteira')).toBeInTheDocument();
    expect(screen.getByText('A IA lê o contexto')).toBeInTheDocument();
    expect(screen.getByText('Decida com prioridade')).toBeInTheDocument();
  });
});

describe('TrustSection', () => {
  it('mostra os sinais de credibilidade', () => {
    render(<TrustSection />);
    expect(screen.getByText('B3 + NYSE')).toBeInTheDocument();
    expect(screen.getByText('AES-256')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Rodar e confirmar que falha**

```bash
npx vitest run src/components/landing/sections/HowItWorksSection.spec.tsx
```

Esperado: FAIL — módulos não encontrados.

- [ ] **Step 3: Criar `HowItWorksSection.tsx`**

```tsx
import {Section} from '../ui/Section';
import {Eyebrow} from '../ui/Eyebrow';
import {workflowSteps} from '../landing-data';

export function HowItWorksSection() {
  return (
    <Section id="como-funciona">
      <div className="max-w-2xl">
        <div data-reveal>
          <Eyebrow>Como funciona</Eyebrow>
        </div>
        <h2
          data-reveal
          data-reveal-delay="0.08"
          className="mt-6 font-heading font-bold tracking-[-0.03em] text-on-surface [font-size:clamp(1.875rem,3.5vw,3rem)] [line-height:1.08]">
          Do extrato à decisão em três passos
        </h2>
        <p
          data-reveal
          data-reveal-delay="0.14"
          className="mt-5 text-[1.0625rem] leading-[1.7] text-on-surface-muted/60">
          Você conecta uma vez. O resto é acompanhamento.
        </p>
      </div>

      <ol className="relative mt-16 grid gap-12 md:grid-cols-3 md:gap-8">
        <div
          aria-hidden="true"
          className="absolute left-0 right-0 top-5 hidden h-px bg-gradient-to-r from-transparent via-surface-hairline/[0.12] to-transparent md:block"
        />

        {workflowSteps.map((item, index) => (
          <li
            key={item.step}
            data-reveal
            data-reveal-delay={String(index * 0.12)}
            className="relative">
            <div className="relative z-10 flex h-10 w-10 items-center justify-center rounded-full border border-surface-hairline/[0.1] bg-surface-panel font-heading text-xs font-semibold tabular-nums text-on-surface-muted/70">
              {item.step}
            </div>
            <h3 className="mt-6 font-heading text-lg font-semibold text-on-surface">
              {item.title}
            </h3>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-on-surface-muted/60">
              {item.description}
            </p>
          </li>
        ))}
      </ol>
    </Section>
  );
}

export default HowItWorksSection;
```

- [ ] **Step 3b: Fazer o trilho se desenhar da esquerda para a direita**

A spec pede hairlines que se desenham ao entrar na viewport. O trilho que conecta
os três passos é onde isso aparece. Em `HowItWorksSection.tsx`, adicionar os
imports e o efeito, e um `ref` na `<div>` do trilho:

```tsx
import {useEffect, useRef} from 'react';
import gsap from 'gsap';
import {ensureScrollTrigger} from '../motion/useGsapReveal';
```

Dentro do componente, antes do `return`:

```tsx
  const railRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;
    if (!ensureScrollTrigger()) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        rail,
        {scaleX: 0, transformOrigin: 'left center'},
        {
          scaleX: 1,
          duration: 1.1,
          ease: 'power3.out',
          scrollTrigger: {trigger: rail, start: 'top 85%', once: true},
        },
      );
    });

    return () => ctx.revert();
  }, []);
```

E na `<div>` decorativa do trilho, adicionar `ref={railRef}`:

```tsx
        <div
          ref={railRef}
          aria-hidden="true"
          className="absolute left-0 right-0 top-5 hidden h-px bg-gradient-to-r from-transparent via-surface-hairline/[0.12] to-transparent md:block"
        />
```

O trilho é decorativo (`aria-hidden`), então escondê-lo em `scaleX: 0` não retém
conteúdo de ninguém — e com motion reduzido o efeito nem chega a rodar.

- [ ] **Step 4: Criar `TrustSection.tsx`**

```tsx
import {Section} from '../ui/Section';
import {trustStats} from '../landing-data';

export function TrustSection() {
  return (
    <Section className="py-16 sm:py-20">
      <div
        data-reveal
        className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-surface-hairline/[0.07] bg-surface-hairline/[0.07] lg:grid-cols-4">
        {trustStats.map((stat) => (
          <div key={stat.label} className="bg-surface-base px-6 py-8">
            <p className="font-heading text-xl font-semibold text-on-surface">
              {stat.value}
            </p>
            <p className="mt-1.5 text-xs text-on-surface-muted/50">
              {stat.label}
            </p>
          </div>
        ))}
      </div>
    </Section>
  );
}

export default TrustSection;
```

- [ ] **Step 5: Remover os arquivos antigos**

```bash
rm src/components/landing/WorkflowSection.tsx src/components/landing/ValueSection.tsx
```

- [ ] **Step 6: Rodar o teste**

```bash
npx vitest run src/components/landing/sections/HowItWorksSection.spec.tsx
```

Esperado: PASS, 2 testes.

- [ ] **Step 7: Commit**

```bash
git add src/components/landing/sections/HowItWorksSection.tsx src/components/landing/sections/TrustSection.tsx src/components/landing/sections/HowItWorksSection.spec.tsx
git commit -m "feat(web): add how-it-works and trust sections"
```

---

### Task 10: Preços e FAQ

**Files:**
- Create: `src/components/landing/sections/PricingSection.tsx`
- Create: `src/components/landing/sections/FaqSection.tsx`
- Delete: `src/components/landing/PricingSection.tsx`
- Test: `src/components/landing/sections/PricingSection.spec.tsx`
- Test: `src/components/landing/sections/FaqSection.spec.tsx`

**Interfaces:**
- Consumes: `planItems`, `faqItems` (Task 3); `Section`, `Eyebrow`, `GlassPanel` (Task 1); `Accordion` de `@/components/ui/accordion` (já existe no projeto).
- Produces: `<PricingSection />`, `<FaqSection />` — sem props.

- [ ] **Step 1: Escrever os testes que falham**

Criar `src/components/landing/sections/PricingSection.spec.tsx`:

```tsx
import {describe, it, expect} from 'vitest';
import {render, screen} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';
import {PricingSection} from './PricingSection';

describe('PricingSection', () => {
  it('ancora em #planos e mostra os três planos', () => {
    const {container} = render(
      <MemoryRouter>
        <PricingSection />
      </MemoryRouter>,
    );

    expect(container.querySelector('#planos')).not.toBeNull();
    expect(screen.getByText('Básico')).toBeInTheDocument();
    expect(screen.getByText('Premium')).toBeInTheDocument();
    expect(screen.getByText('Global Investor')).toBeInTheDocument();
  });

  it('destaca o Premium como mais escolhido', () => {
    render(
      <MemoryRouter>
        <PricingSection />
      </MemoryRouter>,
    );

    expect(screen.getByText(/mais escolhido/i)).toBeInTheDocument();
  });
});
```

Criar `src/components/landing/sections/FaqSection.spec.tsx`:

```tsx
import {describe, it, expect} from 'vitest';
import {render, screen} from '@testing-library/react';
import {FaqSection} from './FaqSection';

describe('FaqSection', () => {
  it('ancora em #faq e expõe as perguntas como botões acessíveis', () => {
    const {container} = render(<FaqSection />);

    expect(container.querySelector('#faq')).not.toBeNull();
    expect(
      screen.getByRole('button', {name: /meus dados ficam seguros/i}),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', {name: /posso cancelar quando quiser/i}),
    ).toBeInTheDocument();
  });

  it('deixa claro que não há recomendação de investimento', () => {
    render(<FaqSection />);
    expect(
      screen.getByRole('button', {name: /recomenda o que comprar/i}),
    ).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Rodar e confirmar que falham**

```bash
npx vitest run src/components/landing/sections/PricingSection.spec.tsx src/components/landing/sections/FaqSection.spec.tsx
```

Esperado: FAIL nos dois — módulos não encontrados.

- [ ] **Step 3: Criar `sections/PricingSection.tsx`**

```tsx
import {Link} from 'react-router-dom';
import {Check} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Section} from '../ui/Section';
import {Eyebrow} from '../ui/Eyebrow';
import {GlassPanel} from '../ui/GlassPanel';
import {planItems} from '../landing-data';

export function PricingSection() {
  return (
    <Section id="planos">
      <div className="mx-auto max-w-2xl text-center">
        <div data-reveal>
          <Eyebrow>Planos</Eyebrow>
        </div>
        <h2
          data-reveal
          data-reveal-delay="0.08"
          className="mt-6 font-heading font-bold tracking-[-0.03em] text-on-surface [font-size:clamp(1.875rem,3.5vw,3rem)] [line-height:1.08]">
          Comece grátis. Pague quando fizer diferença.
        </h2>
        <p
          data-reveal
          data-reveal-delay="0.14"
          className="mt-5 text-[1.0625rem] leading-[1.7] text-on-surface-muted/60">
          Sem cartão para começar e sem prazo de expiração no plano grátis.
        </p>
      </div>

      <div className="mt-16 grid items-start gap-5 lg:grid-cols-3">
        {planItems.map((plan, index) => (
          <GlassPanel
            key={plan.name}
            data-reveal
            data-reveal-delay={String(index * 0.1)}
            className={`relative flex flex-col p-7 transition-transform duration-300 ${
              plan.featured
                ? 'border-brand/30 lg:-translate-y-2'
                : 'hover:-translate-y-1'
            }`}>
            {plan.featured && (
              <span className="absolute -top-3 left-7 rounded-full bg-brand px-3 py-1 text-xs font-semibold text-brand-foreground">
                Mais escolhido
              </span>
            )}

            <h3 className="font-heading text-base font-semibold text-on-surface">
              {plan.name}
            </h3>
            <p className="mt-2 min-h-[40px] text-sm leading-relaxed text-on-surface-muted/55">
              {plan.detail}
            </p>

            <div className="mt-6 flex items-baseline gap-1">
              <span className="font-heading text-4xl font-bold tracking-[-0.02em] tabular-nums text-on-surface">
                {plan.price}
              </span>
              {plan.period && (
                <span className="text-sm text-on-surface-muted/50">
                  {plan.period}
                </span>
              )}
            </div>

            <p className="mt-6 rounded-xl border border-surface-hairline/[0.07] bg-surface-hairline/[0.03] px-4 py-3 text-xs leading-relaxed text-on-surface-muted/70">
              {plan.aiPillar}
            </p>

            <ul className="mt-6 flex-1 space-y-3">
              {plan.benefits.map((benefit) => (
                <li key={benefit} className="flex items-start gap-2.5">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-positive" />
                  <span className="text-sm leading-relaxed text-on-surface-muted/65">
                    {benefit}
                  </span>
                </li>
              ))}
            </ul>

            <Button
              asChild
              size="lg"
              className={`mt-8 w-full ${
                plan.featured
                  ? 'bg-brand text-brand-foreground hover:bg-brand-strong'
                  : 'border border-surface-hairline/[0.12] bg-transparent text-on-surface hover:bg-surface-hairline/[0.06]'
              }`}>
              <Link to={plan.href}>{plan.cta}</Link>
            </Button>
          </GlassPanel>
        ))}
      </div>
    </Section>
  );
}

export default PricingSection;
```

- [ ] **Step 4: Criar `sections/FaqSection.tsx`**

```tsx
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {Section} from '../ui/Section';
import {Eyebrow} from '../ui/Eyebrow';
import {faqItems} from '../landing-data';

export function FaqSection() {
  return (
    <Section id="faq" containerClassName="max-w-3xl">
      <div className="text-center">
        <div data-reveal>
          <Eyebrow>Dúvidas</Eyebrow>
        </div>
        <h2
          data-reveal
          data-reveal-delay="0.08"
          className="mt-6 font-heading font-bold tracking-[-0.03em] text-on-surface [font-size:clamp(1.875rem,3.5vw,3rem)] [line-height:1.08]">
          O que costumam perguntar antes de assinar
        </h2>
      </div>

      <Accordion
        type="single"
        collapsible
        data-reveal
        data-reveal-delay="0.14"
        className="mt-12">
        {faqItems.map((item) => (
          <AccordionItem
            key={item.question}
            value={item.question}
            className="border-surface-hairline/[0.07]">
            <AccordionTrigger className="text-left font-heading text-base font-medium text-on-surface hover:no-underline">
              {item.question}
            </AccordionTrigger>
            <AccordionContent className="text-[0.9375rem] leading-[1.7] text-on-surface-muted/60">
              {item.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </Section>
  );
}

export default FaqSection;
```

- [ ] **Step 5: Remover o arquivo antigo**

```bash
rm src/components/landing/PricingSection.tsx
```

- [ ] **Step 6: Rodar os testes**

```bash
npx vitest run src/components/landing/sections/PricingSection.spec.tsx src/components/landing/sections/FaqSection.spec.tsx
```

Esperado: PASS, 4 testes no total.

- [ ] **Step 7: Commit**

```bash
git add src/components/landing/sections/PricingSection.tsx src/components/landing/sections/PricingSection.spec.tsx src/components/landing/sections/FaqSection.tsx src/components/landing/sections/FaqSection.spec.tsx
git commit -m "feat(web): restyle pricing and add faq section"
```

---

### Task 11: CTA final e rodapé

**Files:**
- Create: `src/components/landing/sections/FinalCtaSection.tsx`
- Create: `src/components/landing/sections/LandingFooter.tsx`
- Delete: `src/components/landing/CtaSection.tsx`, `src/components/landing/LandingFooter.tsx`
- Test: `src/components/landing/sections/LandingFooter.spec.tsx`

**Interfaces:**
- Consumes: `finalCtaCopy`, `footerColumns` (Task 3); `Section`, `GridBackdrop` (Task 1); `useMagnetic` (Task 5).
- Produces: `<FinalCtaSection />`, `<LandingFooter />` — sem props.

- [ ] **Step 1: Escrever o teste que falha**

Criar `src/components/landing/sections/LandingFooter.spec.tsx`:

```tsx
import {describe, it, expect, beforeEach, vi} from 'vitest';
import {render, screen} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';
import {LandingFooter} from './LandingFooter';
import {FinalCtaSection} from './FinalCtaSection';

const wrap = (ui: React.ReactElement) =>
  render(<MemoryRouter>{ui}</MemoryRouter>);

describe('LandingFooter', () => {
  it('tem colunas de navegação e o aviso legal', () => {
    wrap(<LandingFooter />);

    expect(screen.getByText('Produto')).toBeInTheDocument();
    expect(screen.getByText('Legal')).toBeInTheDocument();
    expect(
      screen.getByRole('link', {name: /política de privacidade/i}),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/não constituem recomendação de investimento/i),
    ).toBeInTheDocument();
  });
});

describe('FinalCtaSection', () => {
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

  it('fecha com o convite e as garantias', () => {
    wrap(<FinalCtaSection />);

    expect(
      screen.getByText(/pare de consolidar carteira na mão/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/sem cartão para começar/i)).toBeInTheDocument();
    expect(
      screen.getByRole('link', {name: /criar conta gratuita/i}),
    ).toHaveAttribute('href', '/register');
  });
});
```

- [ ] **Step 2: Rodar e confirmar que falha**

```bash
npx vitest run src/components/landing/sections/LandingFooter.spec.tsx
```

Esperado: FAIL — módulos não encontrados.

- [ ] **Step 3: Criar `sections/FinalCtaSection.tsx`**

```tsx
import {Link} from 'react-router-dom';
import {ArrowRight, Check} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Section} from '../ui/Section';
import {GridBackdrop} from '../ui/GridBackdrop';
import {finalCtaCopy} from '../landing-data';
import {useMagnetic} from '../motion/useMagnetic';

export function FinalCtaSection() {
  const ctaRef = useMagnetic<HTMLAnchorElement>(0.2);

  return (
    <Section>
      <div
        data-reveal
        className="relative overflow-hidden rounded-3xl border border-surface-hairline/[0.08] px-8 py-20 text-center"
        style={{
          background:
            'linear-gradient(160deg, hsl(var(--brand) / 0.12) 0%, hsl(var(--surface-panel)) 60%)',
        }}>
        <GridBackdrop />

        <h2 className="relative mx-auto max-w-2xl font-heading font-bold tracking-[-0.03em] text-on-surface [font-size:clamp(1.875rem,3.5vw,3rem)] [line-height:1.08]">
          {finalCtaCopy.title}
        </h2>
        <p className="relative mx-auto mt-5 max-w-xl text-[1.0625rem] leading-[1.7] text-on-surface-muted/65">
          {finalCtaCopy.subtitle}
        </p>

        <div className="relative mt-10 flex flex-col justify-center gap-3 sm:flex-row">
          <Button
            asChild
            size="lg"
            className="group bg-brand text-brand-foreground hover:bg-brand-strong">
            <Link ref={ctaRef} to="/register">
              Criar conta gratuita
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="border-surface-hairline/[0.12] bg-transparent text-on-surface hover:bg-surface-hairline/[0.06] hover:text-on-surface">
            <Link to="/signin">Entrar</Link>
          </Button>
        </div>

        <ul className="relative mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-8">
          {finalCtaCopy.bullets.map((bullet) => (
            <li
              key={bullet}
              className="flex items-center gap-2 text-sm text-on-surface-muted/55">
              <Check className="h-4 w-4 text-positive" />
              {bullet}
            </li>
          ))}
        </ul>
      </div>
    </Section>
  );
}

export default FinalCtaSection;
```

- [ ] **Step 4: Criar `sections/LandingFooter.tsx`**

```tsx
import {Link} from 'react-router-dom';
import trackerrLogo from '@/assets/logo.png';
import {footerColumns} from '../landing-data';

export function LandingFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-surface-hairline/[0.07] bg-surface-panel/50 py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[1.5fr_repeat(3,1fr)]">
          <div>
            <Link to="/" className="flex items-center gap-2">
              <img src={trackerrLogo} alt="trackerr" className="h-8 w-auto" />
              <span className="font-heading text-base font-semibold text-on-surface">
                trackerr
              </span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-on-surface-muted/45">
              Carteira consolidada, imposto calculado e IA apontando o que exige
              atenção.
            </p>
          </div>

          {footerColumns.map((column) => (
            <nav key={column.title}>
              <h3 className="font-heading text-sm font-semibold text-on-surface">
                {column.title}
              </h3>
              <ul className="mt-4 space-y-3">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.to}
                      className="text-sm text-on-surface-muted/50 transition-colors hover:text-on-surface">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <p className="mt-14 border-t border-surface-hairline/[0.05] pt-8 text-xs leading-relaxed text-on-surface-muted/35">
          © {year} Trackerr. Todos os direitos reservados. As informações
          exibidas têm caráter informativo e não constituem recomendação de
          investimento.
        </p>
      </div>
    </footer>
  );
}

export default LandingFooter;
```

- [ ] **Step 5: Remover os arquivos antigos**

```bash
rm src/components/landing/CtaSection.tsx src/components/landing/LandingFooter.tsx
```

- [ ] **Step 6: Rodar o teste**

```bash
npx vitest run src/components/landing/sections/LandingFooter.spec.tsx
```

Esperado: PASS, 2 testes.

- [ ] **Step 7: Commit**

```bash
git add src/components/landing/sections/FinalCtaSection.tsx src/components/landing/sections/LandingFooter.tsx src/components/landing/sections/LandingFooter.spec.tsx
git commit -m "feat(web): add final cta and expanded landing footer"
```

---

### Task 12: Montagem da página, spec reescrito e verificação final

**Files:**
- Modify: `src/pages/Landing.tsx` (reescrita)
- Modify: `src/pages/Landing.spec.tsx` (reescrita)

**Interfaces:**
- Consumes: todas as seções das Tasks 4–11; `useGsapReveal` (Task 2).
- Produces: `Landing` (export default) — a página completa.

- [ ] **Step 1: Reescrever `src/pages/Landing.spec.tsx`**

```tsx
import {describe, it, expect, beforeEach, vi} from 'vitest';
import {render, screen} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';
import Landing from './Landing';

const stubMatchMedia = (matches: boolean) => {
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockImplementation((query: string) => ({
      matches,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  );
};

const renderLanding = () =>
  render(
    <MemoryRouter>
      <Landing />
    </MemoryRouter>,
  );

describe('Landing', () => {
  beforeEach(() => {
    stubMatchMedia(false);
  });

  it('abre com a promessa central e o caminho de conversão', () => {
    renderLanding();

    expect(screen.getAllByAltText('trackerr').length).toBeGreaterThan(0);
    expect(screen.getByText(/sua carteira inteira/i)).toBeInTheDocument();
    expect(
      screen.getByText(/sem planilha, sem surpresa no ir/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', {name: /começar grátis/i}),
    ).toHaveAttribute('href', '/register');
  });

  it('renderiza as nove seções na ordem definida', () => {
    const {container} = renderLanding();

    const ids = Array.from(container.querySelectorAll('section[id]')).map(
      (el) => el.id,
    );

    expect(ids).toEqual(
      expect.arrayContaining([
        'inicio',
        'problema',
        'produto',
        'como-funciona',
        'planos',
        'faq',
      ]),
    );
    expect(ids.indexOf('problema')).toBeLessThan(ids.indexOf('produto'));
    expect(ids.indexOf('produto')).toBeLessThan(ids.indexOf('planos'));
    expect(ids.indexOf('planos')).toBeLessThan(ids.indexOf('faq'));
  });

  it('mostra prova de mercado, produto e credibilidade', () => {
    renderLanding();

    expect(screen.getAllByText(/PETR4/i).length).toBeGreaterThan(0);
    expect(screen.getByLabelText(/gráfico em alta/i)).toBeInTheDocument();
    expect(screen.getAllByText(/carteira consolidada/i).length).toBeGreaterThan(0);
    expect(screen.getByText('AES-256')).toBeInTheDocument();
  });

  it('fecha com planos, dúvidas e o aviso de que não há recomendação', () => {
    renderLanding();

    expect(screen.getByText('Premium')).toBeInTheDocument();
    expect(
      screen.getByRole('button', {name: /meus dados ficam seguros/i}),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/não constituem recomendação de investimento/i),
    ).toBeInTheDocument();
  });

  it('com prefers-reduced-motion o conteúdo continua visível', () => {
    stubMatchMedia(true);
    renderLanding();

    const headline = screen.getByText(/sua carteira inteira/i);
    expect(headline).toBeInTheDocument();
    expect(headline).toBeVisible();
    expect(screen.getByText('Premium')).toBeVisible();
  });
});
```

- [ ] **Step 2: Rodar e confirmar que falha**

```bash
npx vitest run src/pages/Landing.spec.tsx
```

Esperado: FAIL — a `Landing.tsx` atual ainda importa as seções antigas, que foram deletadas.

- [ ] **Step 3: Reescrever `src/pages/Landing.tsx`**

```tsx
import {LandingNav} from '@/components/landing/sections/LandingNav';
import {HeroSection} from '@/components/landing/sections/HeroSection';
import {MarketTape} from '@/components/landing/sections/MarketTape';
import {ProblemSection} from '@/components/landing/sections/ProblemSection';
import {ProductSection} from '@/components/landing/sections/ProductSection';
import {HowItWorksSection} from '@/components/landing/sections/HowItWorksSection';
import {TrustSection} from '@/components/landing/sections/TrustSection';
import {PricingSection} from '@/components/landing/sections/PricingSection';
import {FaqSection} from '@/components/landing/sections/FaqSection';
import {FinalCtaSection} from '@/components/landing/sections/FinalCtaSection';
import {LandingFooter} from '@/components/landing/sections/LandingFooter';
import {useGsapReveal} from '@/components/landing/motion/useGsapReveal';

/**
 * A classe .landing-root escopa as superfícies escurecidas do redesign.
 * Sem ela, a landing herdaria os tokens globais — que continuam servindo as
 * páginas de autenticação e não devem mudar nesta etapa.
 */
export default function Landing() {
  const containerRef = useGsapReveal<HTMLDivElement>();

  return (
    <div ref={containerRef} className="landing-root min-h-screen font-body">
      <LandingNav />

      <main>
        <HeroSection />
        <MarketTape />
        <ProblemSection />
        <ProductSection />
        <HowItWorksSection />
        <TrustSection />
        <PricingSection />
        <FaqSection />
        <FinalCtaSection />
      </main>

      <LandingFooter />
    </div>
  );
}
```

- [ ] **Step 4: Rodar o teste da página**

```bash
npx vitest run src/pages/Landing.spec.tsx
```

Esperado: PASS, 5 testes.

Se o teste de ordem das seções falhar porque `TrustSection` e `FinalCtaSection` não têm `id`, isso é esperado — a asserção usa `arrayContaining` e checa apenas os índices relativos das seções com âncora.

- [ ] **Step 5: Verificação completa**

```bash
npx tsc --noEmit
npx vitest run
npm run lint
```

Esperado: sem erros de tipo; **toda** a suíte passa; lint limpo. Se o lint apontar imports não usados nos arquivos antigos, confirme que todos os arquivos listados como "deletados" no plano realmente saíram:

```bash
ls src/components/landing
```

Esperado ver apenas: `MarketChart.tsx`, `landing-data.ts`, `landing-data.spec.ts`, `mockups/`, `motion/`, `sections/`, `ui/`.

- [ ] **Step 6: Verificação visual no browser**

```bash
npm run dev
```

Abrir `http://localhost:8080/` e conferir, nesta ordem:

1. A cascata de entrada do hero roda uma vez e para.
2. A fita de cotações corre sem emenda e pausa ao passar o mouse.
3. Rolando até a seção de produto em janela larga (≥1024px), a coluna direita fica presa e os três mockups trocam.
4. Reduzindo a janela para menos de 1024px, a seção de produto vira empilhamento — sem pin, sem sobreposição.
5. Os KPIs do hero contam ao aparecer.
6. Ativando "reduzir movimento" no sistema operacional e recarregando: nada anima e **todo** o conteúdo permanece visível.
7. Navegar para `/signin` e confirmar que a página de login está visualmente idêntica ao que era antes.

Anotar qualquer divergência e corrigir antes do commit final.

- [ ] **Step 7: Commit**

```bash
git add src/pages/Landing.tsx src/pages/Landing.spec.tsx
git commit -m "feat(web): assemble redesigned landing page"
```

---

## Verificação de conclusão

Antes de declarar a entrega pronta, todos os itens abaixo precisam estar confirmados **com a saída do comando em mãos** — não por suposição:

- [ ] `npx tsc --noEmit` sem erros
- [ ] `npx vitest run` com toda a suíte passando
- [ ] `npm run lint` limpo
- [ ] `git status --porcelain` não mostra nenhum arquivo da landing pendente
- [ ] Os sete pontos da verificação visual do Step 6 da Task 12 conferidos no browser
- [ ] `/signin`, `/register` e o dashboard visualmente inalterados
