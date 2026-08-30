# Fundação Nocturne — tokens, tipografia, ícones — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Trazer a paleta Nocturne, a tipografia unificada em Inter e os ícones Phosphor do redesign (`design_handoff_trackerr/`) para dentro do sistema de tokens existente em `web`, sem tocar em layout, estrutura de página ou nomes de token já consumidos.

**Architecture:** Troca de valores dentro do mecanismo de tokens HSL já existente (`:root` / `.dark` em `src/index.css`, consumido via `hsl(var(--x))` em `tailwind.config.ts`). Ícones migram via uma camada de compatibilidade central (`src/components/ui/icons.tsx`) que reexporta os componentes do Phosphor sob os nomes que os 74 arquivos já importam — só a origem do import muda, não o JSX.

**Tech Stack:** React + Vite + Tailwind CSS v3 + shadcn/ui + `@phosphor-icons/react` (novo) + Vitest/Testing Library.

## Global Constraints

- Nomes de token CSS/Tailwind existentes não mudam (`--background`, `--card`, `--accent-positive`, `--brand`, etc.) — só valores.
- Nenhum peso de fonte acima de 600 (regra do handoff, seção "Tipo").
- `--destructive`/`--destructive-foreground` não mudam (ação perigosa do shadcn, conceito diferente de `--accent-negative`).
- `ThemeToggle.tsx` e o mecanismo `.dark` não mudam nesta etapa.
- Ícones: nome do componente JSX usado nos callsites não muda — só a origem do import.
- `@phosphor-icons/react@2.1.10` já está instalado em `node_modules` (via `npm install --no-save`, feito durante a pesquisa deste plano) mas **não está em `package.json`** — Task 1 formaliza a dependência.

---

### Task 1: Camada de compatibilidade de ícones

**Files:**
- Create: `src/components/ui/icons.tsx`
- Test: `src/components/ui/icons.spec.tsx`
- Modify: `package.json` (dependência)

**Interfaces:**
- Produces: módulo `@/components/ui/icons` que exporta os 66 nomes abaixo, com a mesma assinatura de componente SVG (`React.ForwardRefExoticComponent<IconProps>`, aceita `className`, `size`, `color`) que `lucide-react` já expõe hoje.

- [ ] **Step 1: Instalar a dependência formalmente**

```bash
npm install @phosphor-icons/react@2.1.10
```

- [ ] **Step 2: Escrever o teste de smoke da camada de compatibilidade**

```tsx
// src/components/ui/icons.spec.tsx
import {describe, expect, it} from 'vitest';
import {render} from '@testing-library/react';
import * as Icons from './icons';

const expectedNames = [
  'AlertTriangle', 'ArrowLeft', 'ArrowRight', 'ArrowUpDown', 'BadgeCheck',
  'BarChart3', 'Bell', 'Bot', 'Building', 'Building2', 'Calculator',
  'Calendar', 'CalendarIcon', 'Check', 'CheckCircle2', 'ChevronDown',
  'ChevronLeft', 'ChevronRight', 'ChevronUp', 'Circle', 'CircleDollarSign',
  'CircleHelp', 'Coins', 'Cookie', 'Crown', 'Dot', 'Download', 'Edit',
  'Eye', 'EyeOff', 'FileText', 'GripVertical', 'Info', 'Landmark', 'Loader',
  'Loader2', 'Mail', 'MessageSquare', 'Moon', 'MoreHorizontal', 'PanelLeft',
  'Pencil', 'PiggyBank', 'Plus', 'RefreshCw', 'RotateCcw', 'Save', 'Search',
  'Send', 'Settings', 'Shield', 'ShieldCheck', 'Sparkles', 'Star', 'Sun',
  'Trash2', 'TrendingUp', 'Upload', 'User', 'User2', 'Users', 'Wallet', 'X',
  'Zap',
];

describe('icons compat layer', () => {
  it('exporta todos os nomes que os callsites de lucide-react esperam', () => {
    for (const name of expectedNames) {
      expect(Icons[name as keyof typeof Icons], `faltando: ${name}`).toBeDefined();
    }
  });

  it('cada ícone renderiza um <svg>', () => {
    for (const name of expectedNames) {
      const Icon = Icons[name as keyof typeof Icons] as React.ComponentType<{className?: string}>;
      const {container, unmount} = render(<Icon className="h-4 w-4" />);
      expect(container.querySelector('svg'), `não renderizou svg: ${name}`).not.toBeNull();
      unmount();
    }
  });
});
```

- [ ] **Step 3: Rodar o teste e confirmar que falha (módulo não existe ainda)**

Run: `npx vitest run src/components/ui/icons.spec.tsx`
Expected: FAIL — `Failed to resolve import "./icons"`

- [ ] **Step 4: Criar a camada de compatibilidade**

Mapeamento verificado contra `node_modules/@phosphor-icons/react/dist/index.d.ts` (nomes reais exportados pelo pacote, não adivinhados). Onde o nome do lucide não existe no Phosphor, o ícone semanticamente mais próximo foi escolhido; comentário ao lado de cada linha registra a origem para facilitar troca futura em code review.

```tsx
// src/components/ui/icons.tsx
// Camada de compatibilidade lucide-react -> @phosphor-icons/react.
// Reexporta sob os nomes que os componentes do app já importam, para que a
// migração seja só uma troca da origem do import, sem tocar em JSX.
// Peso default "regular" (traço fino, igual ao visual do lucide); "fill" só
// deve ser usado manualmente em ícone de IA/copiloto e estado ativo,
// conforme design_handoff_trackerr/README.md.
export {
  Warning as AlertTriangle,
  ArrowLeft,
  ArrowRight,
  ArrowsDownUp as ArrowUpDown,
  SealCheck as BadgeCheck,
  ChartBar as BarChart3,
  Bell,
  Robot as Bot,
  Building,
  Buildings as Building2,
  Calculator,
  Calendar,
  Calendar as CalendarIcon,
  Check,
  CheckCircle as CheckCircle2,
  CaretDown as ChevronDown,
  CaretLeft as ChevronLeft,
  CaretRight as ChevronRight,
  CaretUp as ChevronUp,
  Circle,
  CurrencyCircleDollar as CircleDollarSign,
  Question as CircleHelp,
  Coins,
  Cookie,
  Crown,
  Dot,
  Download,
  PencilSimple as Edit,
  Eye,
  EyeSlash as EyeOff,
  FileText,
  DotsSixVertical as GripVertical,
  Info,
  Bank as Landmark,
  CircleNotch as Loader,
  CircleNotch as Loader2,
  Envelope as Mail,
  ChatCircle as MessageSquare,
  Moon,
  DotsThree as MoreHorizontal,
  SidebarSimple as PanelLeft,
  Pencil,
  PiggyBank,
  Plus,
  ArrowClockwise as RefreshCw,
  ArrowCounterClockwise as RotateCcw,
  FloppyDisk as Save,
  MagnifyingGlass as Search,
  PaperPlaneTilt as Send,
  Gear as Settings,
  Shield,
  ShieldCheck,
  Sparkle as Sparkles,
  Star,
  Sun,
  Trash as Trash2,
  TrendUp as TrendingUp,
  UploadSimple as Upload,
  User,
  UserCircle as User2,
  Users,
  Wallet,
  X,
  Lightning as Zap,
} from '@phosphor-icons/react';
```

- [ ] **Step 5: Rodar o teste e confirmar que passa**

Run: `npx vitest run src/components/ui/icons.spec.tsx`
Expected: PASS (2 testes)

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json src/components/ui/icons.tsx src/components/ui/icons.spec.tsx
git commit -m "feat(web): add lucide-to-phosphor icon compatibility layer"
```

---

### Task 2: Trocar a origem dos imports de ícone nos 74 arquivos

**Files:**
- Modify: os 74 arquivos que hoje têm `from 'lucide-react'` ou `from "lucide-react"` (lista completa obtida via grep, ver Step 1).
- Modify: `package.json` (remove `lucide-react`).

**Interfaces:**
- Consumes: `@/components/ui/icons` (Task 1) — mesmos nomes exportados que `lucide-react` oferecia.

- [ ] **Step 1: Listar os arquivos afetados (auditoria antes da troca)**

```bash
grep -rl "lucide-react" src > /tmp/lucide-files.txt
wc -l /tmp/lucide-files.txt
```

Expected: 74 (73 arquivos de app/páginas/componentes + este próprio `icons.tsx` não conta pois importa direto de `@phosphor-icons/react`).

- [ ] **Step 2: Trocar a origem do import em todos os arquivos**

Substituição mecânica — só a string do módulo importado muda, os nomes entre chaves ficam exatamente iguais:

```bash
grep -rlE "from ['\"]lucide-react['\"]" src | xargs sed -i \
  -E "s/from ['\"]lucide-react['\"]/from '@\/components\/ui\/icons'/g"
```

- [ ] **Step 3: Confirmar que não sobrou nenhuma referência a lucide-react no código**

```bash
grep -rl "lucide-react" src
```

Expected: nenhuma saída (só pode aparecer, se aparecer, dentro do próprio `src/components/ui/icons.tsx` — não deve, pois ele importa de `@phosphor-icons/react` diretamente).

- [ ] **Step 4: Type-check**

```bash
npm run type-check
```

Expected: PASS — se algum nome usado num arquivo não estiver na lista de exports do Task 1, o TypeScript aponta exatamente qual (`Module '"@/components/ui/icons"' has no exported member 'X'`). Se aparecer, adicionar o export faltante em `icons.tsx` antes de prosseguir.

- [ ] **Step 5: Lint**

```bash
npm run lint
```

Expected: PASS.

- [ ] **Step 6: Rodar a suíte de testes unitários completa**

```bash
npm run test:unit
```

Expected: PASS — nenhum spec depende de `lucide-react` diretamente (confirmado: `AssetDetail.gauge.spec.tsx` seleciona SVG por `viewBox`, não por biblioteca de ícone).

- [ ] **Step 7: Remover a dependência `lucide-react`**

```bash
npm uninstall lucide-react
```

- [ ] **Step 8: Rodar build de produção pra garantir que nada quebrou**

```bash
npm run build
```

Expected: build conclui sem erro.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "refactor(web): migrate all icon imports to phosphor via compat layer"
```

---

### Task 3: Tokens de cor Nocturne (claro e escuro)

**Files:**
- Modify: `src/index.css:22-157` (blocos `:root` e `.dark`)

**Interfaces:**
- Consumes: nenhuma (edição direta de valores CSS).
- Produces: os mesmos nomes de custom property que `tailwind.config.ts` já consome via `hsl(var(--x))` — nenhuma mudança necessária em `tailwind.config.ts` para cor.

- [ ] **Step 1: Substituir os valores do bloco `:root` (tema claro)**

Em `src/index.css`, dentro de `:root` (linhas 22-90), substituir os valores de cada variável pelos calculados a partir do handoff (hex → HSL verificado):

```css
--surface-base: 240 29% 97%;      /* --color-bg #f4f4f9 */
--surface-panel: 240 45% 98%;     /* --surf-2 #f7f7fc */
--surface-raised: 240 100% 100%;  /* --surf #fdfdff */
--surface-input: 232 25% 94%;     /* --sunk #ebecf3 */
--surface-hairline: 234 16% 12%;  /* --rgb-line base #1a1b24, usado com alpha */

--on-surface: 234 16% 12%;        /* --color-text #1a1b24 */
--on-surface-accent: 248 62% 61%; /* alinhado ao novo --brand */
--on-surface-muted: 33 9% 38%;    /* mantido — handoff não define tom de apoio próprio */
--on-surface-subtle: 35 7% 50%;   /* mantido */

--brand: 248 62% 61%;        /* --ac #6f5ed9 */
--brand-strong: 248 62% 61%; /* --ac-strong #6f5ed9, idêntico nos dois temas */
--brand-foreground: 0 0% 100%;

--accent-positive: 164 83% 33%; /* --pos #0e9873 */
--accent-negative: 348 75% 46%; /* --neg #cf1e42 */

--warning: 41 93% 31%;       /* --warn #9a6a06 */
--warning-foreground: 40 40% 100%;
--info: 248 62% 61%;         /* acompanha --brand */
--info-foreground: 0 0% 100%;
--success: 164 83% 33%;      /* deriva de --accent-positive, como já era */
--success-foreground: 40 40% 100%;
--destructive: 0 72% 45%;    /* não muda — ação perigosa do shadcn */
--destructive-foreground: 40 40% 100%;
```

Os tokens derivados do shadcn (`--background`, `--foreground`, `--card`, `--popover`, `--primary`, `--secondary`, `--muted`, `--accent`, `--border`, `--input`, `--ring`, `--sidebar-*`) recebem os mesmos valores acima, seguindo o padrão que já existe (ex.: `--background: var(--surface-base)` na prática hoje é feito duplicando o valor, não com `var()` — manter esse padrão de duplicação de valor para não introduzir uma indireção nova fora do escopo desta etapa):

```css
--background: 240 29% 97%;
--foreground: 234 16% 12%;
--card: 240 100% 100%;
--card-foreground: 234 16% 12%;
--popover: 240 100% 100%;
--popover-foreground: 234 16% 12%;
--primary: 248 62% 61%;
--primary-foreground: 0 0% 100%;
--secondary: 240 45% 98%;
--secondary-foreground: 234 16% 12%;
--muted: 240 45% 98%;
--muted-foreground: 33 9% 38%;
--accent: 240 45% 98%;
--accent-foreground: 234 16% 12%;
--border: 234 16% 88%;
--input: 234 16% 88%;
--ring: 248 62% 61%;

--sidebar-background: 240 45% 98%;
--sidebar-foreground: 234 16% 12%;
--sidebar-primary: 248 62% 61%;
--sidebar-primary-foreground: 0 0% 100%;
--sidebar-accent: 240 29% 97%;
--sidebar-accent-foreground: 234 16% 12%;
--sidebar-border: 234 16% 88%;
--sidebar-ring: 248 62% 61%;

--chart-1: var(--brand);
--chart-2: var(--accent-positive);
--chart-3: var(--warning);
--chart-4: 250 29% 45%; /* --ac-soft claro #5d5294, série 4 exclusiva */
--chart-5: var(--accent-negative);
```

- [ ] **Step 2: Substituir os valores do bloco `.dark` (tema escuro)**

Mesma estrutura, valores do tema escuro do handoff:

```css
--surface-base: 233 27% 12%;      /* --color-bg #161826 */
--surface-panel: 233 23% 15%;     /* --surf-2 #1e2030 */
--surface-raised: 232 19% 15%;    /* --surf-4 #20222f */
--surface-input: 229 22% 10%;     /* --sunk #14161f */
--surface-hairline: 240 10% 92%;  /* --rgb-line base #e9e9ed, usado com alpha */

--on-surface: 240 10% 92%;        /* --color-text #e9e9ed */
--on-surface-accent: 249 53% 68%; /* alinhado ao novo --brand escuro */
--on-surface-muted: 228 18% 72%;  /* mantido */
--on-surface-subtle: 228 12% 55%; /* mantido */

--brand: 249 53% 68%;        /* --ac #9184d9 */
--brand-strong: 248 62% 61%; /* --ac-strong #6f5ed9 */
--brand-foreground: 0 0% 100%;

--accent-positive: 162 67% 51%; /* --pos #2fd6a3 */
--accent-negative: 350 86% 63%; /* --neg #f2506b */

--warning: 41 87% 56%;       /* --warn #f0b32e */
--warning-foreground: 233 27% 12%;
--info: 249 53% 68%;
--info-foreground: 0 0% 100%;
--success: 162 67% 51%;
--success-foreground: 233 27% 12%;
--destructive: 351 70% 42%;  /* não muda */
--destructive-foreground: 240 10% 92%;

--background: 233 27% 12%;
--foreground: 240 10% 92%;
--card: 232 18% 17%;         /* --surf #232532 */
--card-foreground: 240 10% 92%;
--popover: 232 18% 17%;
--popover-foreground: 240 10% 92%;
--primary: 249 53% 68%;
--primary-foreground: 0 0% 100%;
--secondary: 233 23% 15%;
--secondary-foreground: 240 10% 92%;
--muted: 233 23% 15%;
--muted-foreground: 228 18% 72%;
--accent: 233 23% 15%;
--accent-foreground: 240 10% 92%;
--border: 234 16% 18%;
--input: 234 16% 18%;
--ring: 249 53% 68%;

--sidebar-background: 233 23% 15%;
--sidebar-foreground: 240 10% 92%;
--sidebar-primary: 249 53% 68%;
--sidebar-primary-foreground: 0 0% 100%;
--sidebar-accent: 232 18% 17%;
--sidebar-accent-foreground: 240 10% 92%;
--sidebar-border: 234 16% 18%;
--sidebar-ring: 249 53% 68%;

--chart-1: var(--brand);
--chart-2: var(--accent-positive);
--chart-3: var(--warning);
--chart-4: 247 93% 83%; /* --ac-soft escuro #b5abfc, série 4 exclusiva */
--chart-5: var(--accent-negative);
```

- [ ] **Step 3: Adicionar os dois tokens novos (benchmark e brand-soft)**

Ainda dentro de `:root`, logo após o bloco de `--accent-negative`/`--warning` (ou em qualquer ponto do mesmo seletor):

```css
/* :root (claro) */
--benchmark: 198 73% 38%;   /* --cy claro #1a7ba6 — linha de benchmark nos gráficos */
--brand-soft: 250 29% 45%;  /* --ac-soft claro #5d5294 — linha da carteira, já usado em --chart-4 acima */
```

```css
/* .dark (escuro) */
--benchmark: 194 85% 62%;   /* --cy escuro #4cc9f0 */
--brand-soft: 247 93% 83%;  /* --ac-soft escuro #b5abfc, já usado em --chart-4 acima */
```

- [ ] **Step 4: Registrar os dois tokens novos no Tailwind**

Em `tailwind.config.ts`, dentro de `theme.extend.colors`, junto aos outros pares `DEFAULT`/`hsl(var(...))` (perto de `positive`/`negative`):

```ts
benchmark: 'hsl(var(--benchmark) / <alpha-value>)',
'brand-soft': 'hsl(var(--brand-soft) / <alpha-value>)',
```

- [ ] **Step 5: Rodar o build e a suíte de testes**

```bash
npm run type-check && npm run test:unit && npm run build
```

Expected: PASS em tudo — mudança é só de valor de variável CSS, não deveria quebrar nenhum teste de lógica.

- [ ] **Step 6: Verificação visual manual**

```bash
npm run dev
```

Abrir `http://localhost:5173`, alternar tema claro/escuro pelo `ThemeToggle`, e comparar visualmente contra `design_handoff_trackerr/Trackerr Design System.dc.html` (abrir esse arquivo direto no navegador) nas páginas Dashboard (Index), Portfolio e Settings — checar fundo, card, cor de acento (blurple) e cores de alta/baixa.

- [ ] **Step 7: Commit**

```bash
git add src/index.css tailwind.config.ts
git commit -m "feat(web): apply Nocturne color tokens for light and dark themes"
```

---

### Task 4: Tipografia — unificar em Inter e limitar peso a 600

**Files:**
- Modify: `src/index.css:1` (import de fonte), `src/index.css:10` (`--font-heading`)
- Modify: `tailwind.config.ts:21-25` (`fontFamily`), `theme.extend` (novo `fontWeight`)
- Modify: `src/components/plans/PlanCard.tsx:85`, `src/components/ui/metric-cell.tsx:45` (`font-extrabold` → `font-semibold`)
- Modify: `src/pages/AssetDetail.tsx:735` (`fontWeight: 700` → `fontWeight: 600`)

**Interfaces:** nenhuma — mudança de configuração e 3 edições pontuais.

- [ ] **Step 1: Trocar o import de fonte**

Em `src/index.css`, linha 1:

```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');
```

(Remove `Manrope` e os pesos 700/800 do carregamento — o handoff usa só Inter 400/500/600.)

- [ ] **Step 2: Apontar `--font-heading` para Inter**

Em `src/index.css`, linha 10:

```css
--font-heading: 'Inter', 'Segoe UI', Arial, sans-serif;
```

- [ ] **Step 3: Atualizar `fontFamily` no Tailwind**

Em `tailwind.config.ts`, dentro de `theme.extend.fontFamily`:

```ts
fontFamily: {
  sans: ['Inter', 'Segoe UI', 'Arial', 'sans-serif'],
  body: ['Inter', 'Segoe UI', 'Arial', 'sans-serif'],
  heading: ['Inter', 'Segoe UI', 'Arial', 'sans-serif'],
},
```

- [ ] **Step 4: Capar o peso máximo de fonte no Tailwind**

O handoff proíbe peso acima de 600, mas `font-bold` (51 arquivos) e `font-extrabold` (2 arquivos) são usados no código hoje. Em vez de editar 51 arquivos, sobrescrever a escala de peso no Tailwind — mudança de token, não de componente. Em `tailwind.config.ts`, dentro de `theme.extend`:

```ts
fontWeight: {
  bold: '600',
  extrabold: '600',
},
```

Isso faz `font-bold` e `font-extrabold` renderizarem em 600 em todo o app, sem tocar em nenhum componente.

- [ ] **Step 5: Corrigir os 3 usos que não passam por classe Tailwind de peso**

`font-extrabold` como *literal string* dentro de `cn()`/template ainda funciona com o Step 4 (a classe gerada muda de peso, o nome da classe é o mesmo) — nada a fazer nesses 2 arquivos além do que o Step 4 já resolve. O único caso que **não** passa pelo Tailwind é o `style` inline do recharts:

Em `src/pages/AssetDetail.tsx:735`:

```tsx
// antes
tick={{fontSize: 10, fontWeight: 700}}
// depois
tick={{fontSize: 10, fontWeight: 600}}
```

- [ ] **Step 6: Rodar build e testes**

```bash
npm run type-check && npm run test:unit && npm run build
```

Expected: PASS.

- [ ] **Step 7: Confirmar que Manrope não sobrou em lugar nenhum**

```bash
grep -ri "manrope" src tailwind.config.ts
```

Expected: nenhuma saída.

- [ ] **Step 8: Verificação visual manual**

```bash
npm run dev
```

Conferir títulos (h1-h4) e qualquer `font-bold`/`font-extrabold` visível (ex.: `PlanCard`, `metric-cell`, cifras do dashboard) — devem parecer "menos pesados" que antes, mas ainda legíveis como destaque, batendo com `design_handoff_trackerr/Trackerr Design System.dc.html`.

- [ ] **Step 9: Commit**

```bash
git add src/index.css tailwind.config.ts src/pages/AssetDetail.tsx
git commit -m "feat(web): unify typography on Inter and cap font weight at 600"
```

---

### Task 5: Verificação final e limpeza

**Files:** nenhum arquivo novo — só comandos de verificação e, se necessário, correções pontuais encontradas.

- [ ] **Step 1: Suíte completa**

```bash
npm run type-check
npm run lint
npm run test:unit
npm run build
```

Expected: tudo PASS.

- [ ] **Step 2: Grep de resíduos**

```bash
grep -rl "lucide-react" src package.json
grep -ri "manrope" src tailwind.config.ts
```

Expected: nenhuma saída em nenhum dos dois.

- [ ] **Step 3: Rodar E2E do fluxo de auth (mais sensível a mudança visual de token/tema)**

```bash
npx playwright test tests/e2e/auth-ui.spec.ts tests/e2e/protected-and-landing.spec.ts
```

Expected: PASS — esses specs verificam presença/estado de elementos, não cor exata, então não deveriam quebrar; confirma que a troca de ícone/token não afetou seletores.

- [ ] **Step 4: Screenshot comparativo final**

```bash
npm run dev
```

Abrir a página inicial logada (Dashboard) e a landing em `http://localhost:5173`, tema claro e escuro, e comparar lado a lado com `design_handoff_trackerr/Trackerr App.dc.html` e `Trackerr Landing.dc.html` abertos diretamente no navegador. Registrar divergências de cor/peso de fonte como itens para a próxima etapa (redesenho de tela), não para corrigir aqui — esta etapa é só fundação.

- [ ] **Step 5: Commit final (se houver ajustes do Step 3/4)**

```bash
git add -A
git commit -m "chore(web): final verification pass for Nocturne foundation"
```

---

## Self-review desta etapa

- **Cobertura do spec:** tokens de superfície/cor (Task 3), tipografia (Task 4), ícones (Tasks 1-2) — todas as seções 4, 5 e 6 do spec têm task correspondente. Seção 7 (testes) coberta pelas verificações em cada task + Task 5.
- **Achado fora do spec original, endereçado aqui:** `font-bold`/`font-extrabold` em 51+2 arquivos violava o teto de peso 600 — resolvido via override de token Tailwind (Task 4, Step 4), não por edição arquivo a arquivo.
- **Achado que invalidou uma preocupação do spec:** a seção 9 do spec citava risco de `strokeWidth` em 11 arquivos quebrando ícones Phosphor. Investigação (grep + leitura) confirmou que todo uso de `strokeWidth` nesses 11 arquivos é prop de `recharts` (`<Line>`/`<Area>`) ou atributo de `<svg>`/`<circle>` cru em gauges customizados — nenhum é prop de ícone `lucide-react`. Nenhuma ação necessária; risco descartado, não uma correção pendente.
- **Consistência de nomes:** os 66 nomes exportados em `icons.tsx` (Task 1) são exatamente os mesmos usados no grep dos 74 arquivos (Task 2) — mesma lista, verificada duas vezes.
