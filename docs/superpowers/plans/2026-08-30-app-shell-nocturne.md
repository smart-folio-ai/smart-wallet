# App shell — fidelidade Nocturne — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reagrupar a navegação da sidebar (4 grupos), adicionar avatar+dropdown na topbar, introduzir um contexto de profundidade adaptativa (preferência local) com prova de conceito no Dashboard, e um command palette (⌘K) — fechando os gaps do App shell logado em relação a `design_handoff_trackerr/Trackerr App.dc.html`.

**Architecture:** Edições pontuais em `app-sidebar.tsx`/`AppTopbar.tsx` já existentes, mais 4 arquivos novos (`nav-data.ts` compartilhado, `useCurrentUserProfile`, `AdaptiveLevelContext`, `useCommandPalette` + `CommandPalette`). Nenhuma mudança de rota, nenhuma mudança de lógica de negócio fora do ponto único de prova de conceito no Dashboard.

**Tech Stack:** React + Vite + Tailwind + shadcn/ui (Sidebar, DropdownMenu, Command já existem) + react-hook-form (não usado aqui) + `@tanstack/react-query` + react-router-dom + Vitest/Testing Library.

## Global Constraints

- Branch nasce de `develop` (fundação, Landing e Auth já mergeados).
- Ícones vêm de `@/components/ui/icons`, nunca de `lucide-react`.
- Nenhuma tela fora de `Index.tsx` (Dashboard) reage ao nível adaptativo nesta etapa — infraestrutura pronta, não retrofit.
- `useCurrentUserProfile`/`AdaptiveLevelContext` seguem o padrão de hook/context já estabelecido no projeto (`useConsent`/`ConsentContext`: `createContext` + `useContext` + `throw` se usado fora do provider; `useSubscription`: `useQuery` do `@tanstack/react-query`).
- Testes de componente que hoje mockam um hook inteiro (`AppTopbar.spec.tsx` mocka `useSubscription` via `vi.mock`) continuam nesse padrão para os hooks novos — não introduzir `QueryClientProvider` real onde o arquivo já usa mock direto.
- Node v20.19.0 para todo comando (`export PATH="/c/Users/Pedro Henrique/AppData/Roaming/nvm/v20.19.0:$PATH"`); `bun` para qualquer mudança de dependência (nenhuma prevista — `cmdk`, `@radix-ui/react-dropdown-menu`, `@tanstack/react-query` já são dependências).

---

### Task 1: `nav-data.ts` compartilhado + sidebar em 4 grupos

**Files:**
- Create: `src/components/layout/nav-data.ts`
- Modify: `src/components/app-sidebar.tsx`
- Modify: `src/components/app-sidebar.spec.tsx`

**Interfaces:**
- Produces: `NavItem` (`{to: string; label: string; icon: LucideIcon}`), `NavSection` (`{label: string; items: NavItem[]}`), `sections: NavSection[]` (4 grupos) — exportados de `nav-data.ts`. Consumido por `app-sidebar.tsx` nesta task e por `CommandPalette.tsx` na Task 5.

- [ ] **Step 1: Criar `nav-data.ts` com os tipos e os 4 grupos**

```ts
// src/components/layout/nav-data.ts
import {
  BarChart3,
  Calculator,
  CircleDollarSign,
  FileSpreadsheet,
  FileText,
  GitCompare,
  Layers,
  MessageSquare,
  Plus,
  Search,
  Settings,
  Star,
  Wallet,
  type LucideIcon,
} from '@/components/ui/icons';

export type NavItem = {
  to: string;
  label: string;
  icon: LucideIcon;
};

export type NavSection = {
  label: string;
  items: NavItem[];
};

export const sections: NavSection[] = [
  {
    label: 'Carteira',
    items: [
      {to: '/dashboard', label: 'Dashboard', icon: BarChart3},
      {to: '/portfolio', label: 'Portfólio', icon: Layers},
      {to: '/dividends', label: 'Dividendos', icon: Wallet},
      {to: '/transactions', label: 'Transações', icon: Wallet},
      {to: '/add-asset', label: 'Adicionar Ativo', icon: Plus},
    ],
  },
  {
    label: 'Inteligência',
    items: [
      {to: '/ai-insights', label: 'IA Insights', icon: Star},
      {to: '/chat-inteligente', label: 'Chat Inteligente', icon: MessageSquare},
      {to: '/asset-search', label: 'Buscar Ativos', icon: Search},
      {to: '/ri-inteligente', label: 'RI Inteligente', icon: FileText},
    ],
  },
  {
    label: 'Planejamento',
    items: [
      {to: '/planning', label: 'Planejamento', icon: Calculator},
      {to: '/comparator', label: 'Comparador', icon: GitCompare},
      {to: '/fiscal', label: 'Fiscal', icon: FileSpreadsheet},
      {
        to: '/sync-accounts',
        label: 'Contas Conectadas',
        icon: CircleDollarSign,
      },
    ],
  },
  {
    label: 'Conta',
    items: [
      {to: '/settings', label: 'Configurações', icon: Settings},
      {to: '/subscription', label: 'Assinatura', icon: CircleDollarSign},
    ],
  },
];
```

- [ ] **Step 2: Atualizar `app-sidebar.tsx` para importar de `nav-data.ts` e remover o rodapé de "Sair"**

Remove a definição local de `NavItem`, `NavSection` e `sections` (linhas 36-75 do arquivo atual) e o import de ícones que só eram usados ali (`BarChart3, Calculator, CircleDollarSign, FileText, FileSpreadsheet, GitCompare, Layers, MessageSquare, Plus, Search, Star, Wallet` — mantém só o que o arquivo ainda usa: `LogOut` sai, `ShieldCheck` fica, `Users` fica — conferir cada um contra o novo conteúdo do arquivo antes de decidir o que remover do import).

Adiciona:
```tsx
import {sections} from './layout/nav-data';
```
(`app-sidebar.tsx` está em `src/components/`, `nav-data.ts` em `src/components/layout/` — ajustar o caminho relativo, ou usar `@/components/layout/nav-data`.)

Remove `footerItems` (linha 77) e o import de `LogOut`.

`SidebarFooter` (linhas 156-162) passa de:
```tsx
<SidebarFooter className="border-t border-sidebar-border/60 py-3">
  <SidebarMenu>
    {footerItems.map((item) => (
      <SidebarLink key={item.to} {...item} />
    ))}
  </SidebarMenu>
</SidebarFooter>
```
para:
```tsx
<SidebarFooter className="border-t border-sidebar-border/60 px-4 py-3">
  <p className="flex items-center gap-1.5 text-[10.5px] font-medium uppercase tracking-[0.1em] text-sidebar-foreground/45">
    <ShieldCheck className="h-3 w-3" />
    SOC 2 · LGPD
  </p>
</SidebarFooter>
```

- [ ] **Step 3: Atualizar `app-sidebar.spec.tsx` pros 4 grupos e a ausência de "Sair"**

Substituir o conteúdo dos 3 testes existentes (eles hoje afirmam o comportamento ANTIGO — 2 grupos, "Sair" visível, "Configurações"/"Assinatura" ausentes — o oposto do que este plano entrega):

```tsx
import {describe, it, expect, vi, beforeAll} from 'vitest';
import {render, screen} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';
import {SidebarProvider} from '@/components/ui/sidebar';
import {AppSidebar} from './app-sidebar';

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({role: null}),
}));

beforeAll(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
});

function renderSidebar() {
  return render(
    <MemoryRouter>
      <SidebarProvider>
        <AppSidebar />
      </SidebarProvider>
    </MemoryRouter>,
  );
}

describe('AppSidebar', () => {
  it('renders the four fixed nav sections for a non-admin user', () => {
    renderSidebar();
    expect(screen.getByText('Carteira')).toBeInTheDocument();
    expect(screen.getByText('Inteligência')).toBeInTheDocument();
    expect(screen.getByText('Planejamento')).toBeInTheDocument();
    expect(screen.getByText('Conta')).toBeInTheDocument();
    expect(screen.queryByText('Investir')).not.toBeInTheDocument();
    expect(screen.queryByText('Administração')).not.toBeInTheDocument();
  });

  it('renders Configurações and Assinatura links, and no Sair link', () => {
    renderSidebar();
    expect(screen.getByText('Configurações')).toBeInTheDocument();
    expect(screen.getByText('Assinatura')).toBeInTheDocument();
    expect(screen.queryByText('Sair')).not.toBeInTheDocument();
  });

  it('shows the SOC 2 · LGPD badge in the footer', () => {
    renderSidebar();
    expect(screen.getByText('SOC 2 · LGPD')).toBeInTheDocument();
  });

  it('keeps every previously available route reachable across the four sections', () => {
    renderSidebar();
    const expectedLabels = [
      'Dashboard',
      'Portfólio',
      'Dividendos',
      'Transações',
      'Adicionar Ativo',
      'IA Insights',
      'Chat Inteligente',
      'Buscar Ativos',
      'RI Inteligente',
      'Planejamento',
      'Comparador',
      'Fiscal',
      'Contas Conectadas',
      'Configurações',
      'Assinatura',
    ];
    for (const label of expectedLabels) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });
});
```

Nota: o label da rota `/sync-accounts` muda de "Sincronizar Contas" pra "Contas Conectadas" (seção 4 do spec) — reflita isso no teste, não mantenha o texto antigo.

- [ ] **Step 4: Rodar o teste, type-check, lint**

```bash
export PATH="/c/Users/Pedro Henrique/AppData/Roaming/nvm/v20.19.0:$PATH"
npx vitest run src/components/app-sidebar.spec.tsx
npm run type-check && npm run lint
```

Expected: PASS em tudo.

- [ ] **Step 5: Commit**

```bash
git add src/components/layout/nav-data.ts src/components/app-sidebar.tsx src/components/app-sidebar.spec.tsx
git commit -m "feat(web): regroup sidebar nav into four sections, replace footer sign-out with SOC2/LGPD badge"
```

---

### Task 2: Avatar + dropdown na topbar

**Files:**
- Create: `src/hooks/useCurrentUserProfile.ts`
- Modify: `src/components/layout/AppTopbar.tsx`
- Modify: `src/components/layout/AppTopbar.spec.tsx`

**Interfaces:**
- Produces: `useCurrentUserProfile()` — `useQuery` retornando `{data, isLoading, ...}` onde `data` é `IUserProfileResponse | undefined`.
- Consumes: `Profile.getProfile()` de `@/services/profile`, `useAuth().logout`.

- [ ] **Step 1: Criar `useCurrentUserProfile.ts`**

```ts
// src/hooks/useCurrentUserProfile.ts
import {useQuery} from '@tanstack/react-query';
import Profile from '@/services/profile';

export function useCurrentUserProfile() {
  return useQuery({
    queryKey: ['current-user-profile'],
    queryFn: () => Profile.getProfile(),
    staleTime: 5 * 60 * 1000,
  });
}
```

(Conferir a exportação real de `@/services/profile` — se for `export default Profile` ou uma exportação nomeada — antes de escrever o import; ajustar conforme o arquivo real.)

- [ ] **Step 2: Adicionar o import de `DropdownMenu` e o avatar em `AppTopbar.tsx`**

Imports novos:
```tsx
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {LogOut, User} from '@/components/ui/icons';
import {useAuth} from '@/hooks/useAuth';
import {useCurrentUserProfile} from '@/hooks/useCurrentUserProfile';
```

No corpo de `AppTopbar`, adicionar:
```tsx
const {logout} = useAuth();
const {data: profile} = useCurrentUserProfile();
const initials = profile
  ? `${profile.firstName?.[0] ?? ''}${profile.lastName?.[0] ?? ''}`.toUpperCase()
  : '';
```

No JSX, ao final do `<div className="flex items-center gap-2">` (depois do botão de notificações, linha 156 do arquivo atual):
```tsx
<Separator orientation="vertical" className="hidden h-6 sm:block" />

<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button
      type="button"
      variant="ghost"
      className="flex h-11 items-center gap-2 px-2 text-muted-foreground hover:text-foreground">
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand/15 text-xs font-semibold text-brand">
        {initials || <User className="h-3.5 w-3.5" />}
      </span>
      <span className="hidden text-sm font-medium text-foreground md:inline">
        {profile?.firstName ?? ''}
      </span>
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent align="end">
    <DropdownMenuItem onClick={() => navigate('/settings')}>
      <Settings className="mr-2 h-4 w-4" />
      Configurações
    </DropdownMenuItem>
    <DropdownMenuSeparator />
    <DropdownMenuItem onClick={logout}>
      <LogOut className="mr-2 h-4 w-4" />
      Sair
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```
(`Settings` já é importado no arquivo — reaproveitar, não duplicar import.)

- [ ] **Step 3: Atualizar `AppTopbar.spec.tsx`**

Adicionar o mock de `useCurrentUserProfile` e `useAuth` (padrão idêntico ao mock existente de `useSubscription` — `vi.mock` direto, sem `QueryClientProvider`):

```tsx
const mockUseCurrentUserProfile = vi.fn();
const mockLogout = vi.fn();

vi.mock('@/hooks/useCurrentUserProfile', () => ({
  useCurrentUserProfile: () => mockUseCurrentUserProfile(),
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({logout: mockLogout}),
}));
```

No `beforeEach`, adicionar:
```tsx
mockUseCurrentUserProfile.mockReturnValue({
  data: {firstName: 'Ana', lastName: 'Costa', email: 'ana@example.com'},
  isLoading: false,
});
```

Novo teste:
```tsx
it('shows the user avatar with initials and a dropdown with logout', async () => {
  const user = userEvent.setup();
  renderTopbar();
  const trigger = screen.getByText('AC').closest('button')!;
  await user.click(trigger);
  expect(screen.getByText('Sair')).toBeInTheDocument();
  await user.click(screen.getByText('Sair'));
  expect(mockLogout).toHaveBeenCalledTimes(1);
});
```
(Import `userEvent` de `@testing-library/user-event` no topo do arquivo se ainda não estiver importado.)

- [ ] **Step 4: Rodar o teste, type-check, lint**

```bash
export PATH="/c/Users/Pedro Henrique/AppData/Roaming/nvm/v20.19.0:$PATH"
npx vitest run src/components/layout/AppTopbar.spec.tsx
npm run type-check && npm run lint
```

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useCurrentUserProfile.ts src/components/layout/AppTopbar.tsx src/components/layout/AppTopbar.spec.tsx
git commit -m "feat(web): add user avatar dropdown with settings/logout to topbar"
```

---

### Task 3: Contexto de profundidade adaptativa + prova de conceito no Dashboard

**Files:**
- Create: `src/contexts/AdaptiveLevelContext.tsx`
- Test: `src/contexts/AdaptiveLevelContext.spec.tsx`
- Modify: `src/App.tsx`
- Modify: `src/pages/Index.tsx`

**Interfaces:**
- Produces: `AdaptiveLevel = 'iniciante' | 'intermediario' | 'avancado'`, `AdaptiveLevelProvider`, `useAdaptiveLevel(): {level: AdaptiveLevel; setLevel: (l: AdaptiveLevel) => void}`. Consumido pela Task 4 (faixa na topbar) e por `Index.tsx` nesta mesma task.

- [ ] **Step 1: Escrever o teste do contexto (falha esperada)**

```tsx
// src/contexts/AdaptiveLevelContext.spec.tsx
import {describe, it, expect, beforeEach} from 'vitest';
import {render, screen, renderHook} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  AdaptiveLevelProvider,
  useAdaptiveLevel,
} from './AdaptiveLevelContext';

const STORAGE_KEY = 'adaptive-level';

function TestConsumer() {
  const {level, setLevel} = useAdaptiveLevel();
  return (
    <div>
      <span>nível: {level}</span>
      <button onClick={() => setLevel('avancado')}>ir pra avançado</button>
    </div>
  );
}

describe('AdaptiveLevelContext', () => {
  beforeEach(() => {
    localStorage.removeItem(STORAGE_KEY);
  });

  it('usa intermediario como default quando não há valor salvo', () => {
    render(
      <AdaptiveLevelProvider>
        <TestConsumer />
      </AdaptiveLevelProvider>,
    );
    expect(screen.getByText('nível: intermediario')).toBeInTheDocument();
  });

  it('persiste o nível em localStorage ao trocar', async () => {
    const user = userEvent.setup();
    render(
      <AdaptiveLevelProvider>
        <TestConsumer />
      </AdaptiveLevelProvider>,
    );
    await user.click(screen.getByText('ir pra avançado'));
    expect(screen.getByText('nível: avancado')).toBeInTheDocument();
    expect(localStorage.getItem(STORAGE_KEY)).toBe('avancado');
  });

  it('lê o nível salvo em localStorage no mount', () => {
    localStorage.setItem(STORAGE_KEY, 'iniciante');
    render(
      <AdaptiveLevelProvider>
        <TestConsumer />
      </AdaptiveLevelProvider>,
    );
    expect(screen.getByText('nível: iniciante')).toBeInTheDocument();
  });

  it('lança erro quando usado fora do provider', () => {
    const {result} = renderHook(() => {
      try {
        return useAdaptiveLevel();
      } catch (e) {
        return e as Error;
      }
    });
    expect(result.current).toBeInstanceOf(Error);
    expect((result.current as Error).message).toMatch(
      /AdaptiveLevelProvider/,
    );
  });
});
```

- [ ] **Step 2: Rodar e confirmar que falha**

```bash
export PATH="/c/Users/Pedro Henrique/AppData/Roaming/nvm/v20.19.0:$PATH"
npx vitest run src/contexts/AdaptiveLevelContext.spec.tsx
```

Expected: FAIL — módulo `./AdaptiveLevelContext` não existe.

- [ ] **Step 3: Criar o contexto**

```tsx
// src/contexts/AdaptiveLevelContext.tsx
import {createContext, useContext, useState, type ReactNode} from 'react';

export type AdaptiveLevel = 'iniciante' | 'intermediario' | 'avancado';

const STORAGE_KEY = 'adaptive-level';
const VALID_LEVELS: AdaptiveLevel[] = ['iniciante', 'intermediario', 'avancado'];
const DEFAULT_LEVEL: AdaptiveLevel = 'intermediario';

interface AdaptiveLevelContextValue {
  level: AdaptiveLevel;
  setLevel: (level: AdaptiveLevel) => void;
}

const AdaptiveLevelContext = createContext<
  AdaptiveLevelContextValue | undefined
>(undefined);

function readStoredLevel(): AdaptiveLevel {
  if (typeof window === 'undefined') return DEFAULT_LEVEL;
  const stored = localStorage.getItem(STORAGE_KEY);
  return VALID_LEVELS.includes(stored as AdaptiveLevel)
    ? (stored as AdaptiveLevel)
    : DEFAULT_LEVEL;
}

export function AdaptiveLevelProvider({children}: {children: ReactNode}) {
  const [level, setLevelState] = useState<AdaptiveLevel>(readStoredLevel);

  const setLevel = (next: AdaptiveLevel) => {
    localStorage.setItem(STORAGE_KEY, next);
    setLevelState(next);
  };

  return (
    <AdaptiveLevelContext.Provider value={{level, setLevel}}>
      {children}
    </AdaptiveLevelContext.Provider>
  );
}

export function useAdaptiveLevel(): AdaptiveLevelContextValue {
  const context = useContext(AdaptiveLevelContext);
  if (!context) {
    throw new Error(
      'useAdaptiveLevel must be used within an AdaptiveLevelProvider',
    );
  }
  return context;
}
```

- [ ] **Step 4: Rodar e confirmar que passa**

```bash
npx vitest run src/contexts/AdaptiveLevelContext.spec.tsx
```

Expected: PASS (4 testes).

- [ ] **Step 5: Adicionar o provider em `App.tsx`**

A rota coringa (`path="*"`) de `App.tsx` já envolve `AppSidebar`/`AppTopbar` assim:
```tsx
<Route
  path="*"
  element={
    <ProtectedRoute>
      <SidebarProvider>
        <div className="relative flex min-h-screen w-full bg-background">
          <AppSidebar />
          <SidebarInset className="bg-background">
            <AppTopbar />
            ...
```
Import:
```tsx
import {AdaptiveLevelProvider} from '@/contexts/AdaptiveLevelContext';
```
Envolver o `<SidebarProvider>` (ou o `<ProtectedRoute>`, tanto faz — escolher o que ficar mais legível no diff) com `<AdaptiveLevelProvider>`, de forma que `AppTopbar` e todas as rotas autenticadas (incluindo `Index`/Dashboard) fiquem dentro do provider.

- [ ] **Step 6: Prova de conceito no Dashboard**

Em `src/pages/Index.tsx`, import:
```tsx
import {useAdaptiveLevel} from '@/contexts/AdaptiveLevelContext';
```

No corpo do componente:
```tsx
const {level} = useAdaptiveLevel();
```

O segundo `MetricCell` (linhas 1058-1081 do arquivo atual, hoje `label="P&L do período"`) passa a calcular `label` e `sub` condicionados a `level`, mantendo `value`/`tone` exatamente como já são calculados:

```tsx
const pnlLabel =
  level === 'iniciante'
    ? 'Como está indo'
    : level === 'avancado'
      ? 'P&L (custo médio)'
      : 'P&L do período';

const pnlSub =
  summary.totalPnl === null || summary.totalPnlPercentage === null
    ? level === 'iniciante'
      ? 'custo médio indisponível'
      : 'custo médio indisponível'
    : level === 'iniciante'
      ? 'desde o preço médio'
      : `${summary.totalPnlPercentage >= 0 ? '+' : '-'}${Math.abs(summary.totalPnlPercentage).toFixed(2)}%`;
```

```tsx
<MetricCell
  label={pnlLabel}
  value={
    summary.totalPnl === null || summary.totalPnlPercentage === null
      ? '—'
      : `${summary.totalPnl >= 0 ? '+' : '-'}${formatCurrency(
          Math.abs(summary.totalPnl),
        )}`
  }
  tone={
    summary.totalPnl === null
      ? 'default'
      : summary.totalPnl >= 0
        ? 'positive'
        : 'negative'
  }
  sub={pnlSub}
/>
```

(Nível `intermediario` produz exatamente o `label`/`sub` que já existiam antes desta mudança — comportamento inalterado nesse caso, conferir isso explicitamente ao revisar o diff.)

Comentário acima do bloco, documentando o padrão pra próxima etapa:
```tsx
// Prova de conceito de useAdaptiveLevel() — só este card reage ao nível
// nesta etapa. Quando o redesenho de cada tela chegar, o padrão de consumo
// é este: ler `level`, variar só texto/formato, nunca o valor numérico.
```

- [ ] **Step 7: Type-check, lint, rodar specs de Index.tsx se existirem**

```bash
export PATH="/c/Users/Pedro Henrique/AppData/Roaming/nvm/v20.19.0:$PATH"
npm run type-check && npm run lint
ls src/pages/Index.spec.tsx 2>/dev/null && npx vitest run src/pages/Index.spec.tsx
```

Se `Index.spec.tsx` não existir, pular o comando de teste (conferir com `ls` antes). Se existir e falhar por causa da ausência de `AdaptiveLevelProvider` no wrapper de teste, envolver o render com o provider (mesmo padrão da Task 1/2 — mockar o hook inteiro em vez de importar o provider real é aceitável aqui também, já que o comportamento sob teste não depende do nível por padrão).

- [ ] **Step 8: Commit**

```bash
git add src/contexts/AdaptiveLevelContext.tsx src/contexts/AdaptiveLevelContext.spec.tsx src/App.tsx src/pages/Index.tsx
git commit -m "feat(web): add adaptive-depth level context with Dashboard proof-of-concept"
```

---

### Task 4: Faixa de profundidade adaptativa na topbar

**Files:**
- Modify: `src/components/layout/AppTopbar.tsx`
- Modify: `src/components/layout/AppTopbar.spec.tsx`

**Interfaces:**
- Consumes: `useAdaptiveLevel()` (Task 3).

- [ ] **Step 1: Adicionar o import e o estado**

```tsx
import {useAdaptiveLevel, type AdaptiveLevel} from '@/contexts/AdaptiveLevelContext';
import {cn} from '@/lib/utils';
```

No corpo de `AppTopbar`:
```tsx
const {level, setLevel} = useAdaptiveLevel();
const levelOptions: {id: AdaptiveLevel; label: string}[] = [
  {id: 'iniciante', label: 'Iniciante'},
  {id: 'intermediario', label: 'Intermediário'},
  {id: 'avancado', label: 'Avançado'},
];
```

- [ ] **Step 2: Adicionar a faixa abaixo da linha principal**

Depois do `</div>` que fecha `<div className="flex h-14 items-center justify-between px-4 md:px-6">` (linha 158 do arquivo original antes das mudanças da Task 2) e antes do `</header>` de fechamento, adicionar:

```tsx
<div className="flex items-center gap-3 border-t border-border/50 px-4 py-1.5 md:px-6">
  <div className="inline-flex gap-1 rounded-md bg-muted p-0.5">
    {levelOptions.map((opt) => (
      <button
        key={opt.id}
        type="button"
        onClick={() => setLevel(opt.id)}
        className={cn(
          'rounded px-2.5 py-1 text-[11px] font-medium transition-all',
          opt.id === level
            ? 'bg-background text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground',
        )}>
        {opt.label}
      </button>
    ))}
  </div>
  <span className="text-[10.5px] text-muted-foreground/70">
    Preferência salva
  </span>
</div>
```

- [ ] **Step 3: Atualizar `AppTopbar.spec.tsx`**

Adicionar o mock de `useAdaptiveLevel`:
```tsx
const mockSetLevel = vi.fn();

vi.mock('@/contexts/AdaptiveLevelContext', () => ({
  useAdaptiveLevel: () => ({level: 'intermediario', setLevel: mockSetLevel}),
}));
```

Novo teste:
```tsx
it('shows the adaptive-depth level switcher and lets the user change level', async () => {
  const user = userEvent.setup();
  renderTopbar();
  expect(screen.getByText('Intermediário')).toBeInTheDocument();
  await user.click(screen.getByText('Avançado'));
  expect(mockSetLevel).toHaveBeenCalledWith('avancado');
});
```

- [ ] **Step 4: Rodar o teste, type-check, lint**

```bash
export PATH="/c/Users/Pedro Henrique/AppData/Roaming/nvm/v20.19.0:$PATH"
npx vitest run src/components/layout/AppTopbar.spec.tsx
npm run type-check && npm run lint
```

- [ ] **Step 5: Commit**

```bash
git add src/components/layout/AppTopbar.tsx src/components/layout/AppTopbar.spec.tsx
git commit -m "feat(web): add adaptive-depth level switcher to topbar"
```

---

### Task 5: Command palette (⌘K)

**Files:**
- Create: `src/hooks/useCommandPalette.ts`
- Test: `src/hooks/useCommandPalette.spec.ts`
- Create: `src/components/layout/CommandPalette.tsx`
- Test: `src/components/layout/CommandPalette.spec.tsx`
- Modify: `src/components/layout/AppTopbar.tsx`
- Modify: `src/components/layout/AppTopbar.spec.tsx`

**Interfaces:**
- Produces: `useCommandPalette(): {open: boolean; setOpen: (v: boolean) => void}`. `CommandPalette({open, onOpenChange}: {open: boolean; onOpenChange: (v: boolean) => void})`.
- Consumes: `sections` de `@/components/layout/nav-data` (Task 1), `ThemeToggle`'s toggle logic (reaproveitar, não duplicar — ver Step 4).

- [ ] **Step 1: Escrever o teste de `useCommandPalette` (falha esperada)**

```ts
// src/hooks/useCommandPalette.spec.ts
import {describe, it, expect} from 'vitest';
import {renderHook, act} from '@testing-library/react';
import {useCommandPalette} from './useCommandPalette';

describe('useCommandPalette', () => {
  it('começa fechado', () => {
    const {result} = renderHook(() => useCommandPalette());
    expect(result.current.open).toBe(false);
  });

  it('abre com Ctrl+K', () => {
    const {result} = renderHook(() => useCommandPalette());
    act(() => {
      window.dispatchEvent(
        new KeyboardEvent('keydown', {key: 'k', ctrlKey: true}),
      );
    });
    expect(result.current.open).toBe(true);
  });

  it('alterna (toggle) a cada Ctrl+K', () => {
    const {result} = renderHook(() => useCommandPalette());
    act(() => {
      window.dispatchEvent(
        new KeyboardEvent('keydown', {key: 'k', ctrlKey: true}),
      );
    });
    expect(result.current.open).toBe(true);
    act(() => {
      window.dispatchEvent(
        new KeyboardEvent('keydown', {key: 'k', ctrlKey: true}),
      );
    });
    expect(result.current.open).toBe(false);
  });

  it('setOpen controla o estado diretamente', () => {
    const {result} = renderHook(() => useCommandPalette());
    act(() => {
      result.current.setOpen(true);
    });
    expect(result.current.open).toBe(true);
  });
});
```

- [ ] **Step 2: Rodar e confirmar que falha**

```bash
export PATH="/c/Users/Pedro Henrique/AppData/Roaming/nvm/v20.19.0:$PATH"
npx vitest run src/hooks/useCommandPalette.spec.ts
```

Expected: FAIL — módulo não existe.

- [ ] **Step 3: Criar `useCommandPalette.ts`**

```ts
// src/hooks/useCommandPalette.ts
import {useEffect, useState} from 'react';

export function useCommandPalette() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  return {open, setOpen};
}
```

- [ ] **Step 4: Rodar e confirmar que passa**

```bash
npx vitest run src/hooks/useCommandPalette.spec.ts
```

Expected: PASS (4 testes).

- [ ] **Step 5: Escrever o teste de `CommandPalette` (falha esperada)**

```tsx
// src/components/layout/CommandPalette.spec.tsx
import {describe, it, expect, vi} from 'vitest';
import {render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {MemoryRouter} from 'react-router-dom';
import {CommandPalette} from './CommandPalette';

vi.mock('@/components/ThemeToggle', () => ({
  useThemeToggle: () => ({toggleTheme: vi.fn()}),
}));

function renderPalette(open = true) {
  const onOpenChange = vi.fn();
  render(
    <MemoryRouter>
      <CommandPalette open={open} onOpenChange={onOpenChange} />
    </MemoryRouter>,
  );
  return {onOpenChange};
}

describe('CommandPalette', () => {
  it('lista os itens de "Ir para" quando aberto', () => {
    renderPalette();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Portfólio')).toBeInTheDocument();
    expect(screen.getByText('Configurações')).toBeInTheDocument();
  });

  it('filtra por texto digitado', async () => {
    const user = userEvent.setup();
    renderPalette();
    const input = screen.getByRole('combobox');
    await user.type(input, 'fiscal');
    expect(screen.getByText('Fiscal')).toBeInTheDocument();
    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
  });

  it('lista a ação "Alternar tema" no grupo Ações', () => {
    renderPalette();
    expect(screen.getByText('Alternar tema')).toBeInTheDocument();
  });
});
```

Nota: `cmdk`'s `CommandInput` renderiza um `<input>` com `role="combobox"` (padrão do Radix/cmdk) — se o teste não encontrar por essa role, usar `screen.getByPlaceholderText(...)` com o placeholder real definido no Step 6 abaixo.

- [ ] **Step 6: Rodar e confirmar que falha**

```bash
npx vitest run src/components/layout/CommandPalette.spec.tsx
```

Expected: FAIL — módulo não existe.

- [ ] **Step 7: Investigar como `ThemeToggle.tsx` alterna o tema, pra reaproveitar sem duplicar**

Ler `src/components/ThemeToggle.tsx` (já lido durante o brainstorming desta etapa: hoje a lógica de toggle vive inteira dentro do componente, sem hook exportado separadamente). Duas opções, escolher a que exigir menos mudança:
(a) Extrair a lógica de alternância pra um hook `useThemeToggle()` exportado de `ThemeToggle.tsx`, e fazer o componente `ThemeToggle` consumir esse hook também (elimina duplicação real);
(b) Duplicar as ~6 linhas de toggle diretamente dentro de `CommandPalette.tsx`, com um comentário apontando pra `ThemeToggle.tsx` como a implementação irmã.

Preferir (a) se o refactor for pequeno (só extrair a função de toggle e o estado pra um hook, sem mudar o comportamento visível de `ThemeToggle`); usar (b) só se (a) exigir tocar em mais do que `ThemeToggle.tsx`. Documentar a escolha no relatório da task.

- [ ] **Step 8: Criar `CommandPalette.tsx`**

```tsx
// src/components/layout/CommandPalette.tsx
import {useNavigate} from 'react-router-dom';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {Settings, Sun} from '@/components/ui/icons';
import {sections} from './nav-data';

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandPalette({open, onOpenChange}: CommandPaletteProps) {
  const navigate = useNavigate();

  const go = (to: string) => {
    navigate(to);
    onOpenChange(false);
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Buscar uma tela ou ação..." />
      <CommandList>
        <CommandEmpty>Nada encontrado.</CommandEmpty>
        <CommandGroup heading="Ir para">
          {sections.flatMap((section) =>
            section.items.map((item) => (
              <CommandItem
                key={item.to}
                onSelect={() => go(item.to)}>
                <item.icon className="mr-2 h-4 w-4" />
                {item.label}
              </CommandItem>
            )),
          )}
        </CommandGroup>
        <CommandGroup heading="Ações">
          <CommandItem onSelect={() => go('/settings')}>
            <Settings className="mr-2 h-4 w-4" />
            Abrir configurações
          </CommandItem>
          {/* Alternar tema: implementação exata depende da decisão do Step 7 */}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}

export default CommandPalette;
```

(O item "Alternar tema" é completado de acordo com a decisão do Step 7 — se optou por (a), importa e chama `useThemeToggle().toggleTheme` no `onSelect`; se (b), inclui a lógica de toggle diretamente ali.)

- [ ] **Step 9: Rodar e confirmar que passa**

```bash
npx vitest run src/components/layout/CommandPalette.spec.tsx
```

Expected: PASS (3 testes).

- [ ] **Step 10: Wire em `AppTopbar.tsx`**

Import:
```tsx
import {useCommandPalette} from '@/hooks/useCommandPalette';
import {CommandPalette} from './CommandPalette';
import {CommandShortcut} from '@/components/ui/command';
```

No corpo:
```tsx
const {open: paletteOpen, setOpen: setPaletteOpen} = useCommandPalette();
```

O botão "Buscar ativos" existente (linhas 105-114 do arquivo original, antes das mudanças das tasks anteriores) troca `onClick={() => navigate('/asset-search')}` por `onClick={() => setPaletteOpen(true)}`, e ganha um atalho visível:
```tsx
<Button
  type="button"
  variant="outline"
  size="sm"
  className="hidden border-border/70 bg-transparent text-muted-foreground hover:text-foreground lg:flex"
  onClick={() => setPaletteOpen(true)}>
  <Search className="mr-2 h-3.5 w-3.5" />
  Buscar
  <CommandShortcut className="ml-2">⌘K</CommandShortcut>
</Button>
```

Renderizar o palette uma vez, fora do `<header>` ou como último filho dele (`CommandDialog` já é um `Dialog` do Radix, que usa portal — a posição no JSX não afeta o layout visual):
```tsx
<CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
```

- [ ] **Step 11: Atualizar `AppTopbar.spec.tsx`**

O teste que hoje pode existir assumindo que "Buscar ativos" navega direto precisa ser conferido e ajustado se necessário (procurar por qualquer `getByRole('button', {name: /buscar/i})` seguido de assert de navegação — não há esse teste no arquivo atual conforme lido no brainstorming, mas conferir de novo após as Tasks 2 e 4 terem alterado o arquivo, para não haver assert desatualizado).

Novo teste:
```tsx
it('opens the command palette when the search button is clicked', async () => {
  const user = userEvent.setup();
  renderTopbar();
  await user.click(screen.getByRole('button', {name: /buscar/i}));
  expect(screen.getByPlaceholderText(/buscar uma tela/i)).toBeInTheDocument();
});
```

- [ ] **Step 12: Rodar tudo, type-check, lint**

```bash
export PATH="/c/Users/Pedro Henrique/AppData/Roaming/nvm/v20.19.0:$PATH"
npx vitest run src/components/layout/AppTopbar.spec.tsx src/components/layout/CommandPalette.spec.tsx src/hooks/useCommandPalette.spec.ts
npm run type-check && npm run lint
```

- [ ] **Step 13: Commit**

```bash
git add src/hooks/useCommandPalette.ts src/hooks/useCommandPalette.spec.ts src/components/layout/CommandPalette.tsx src/components/layout/CommandPalette.spec.tsx src/components/layout/AppTopbar.tsx src/components/layout/AppTopbar.spec.tsx src/components/ThemeToggle.tsx
git commit -m "feat(web): add Ctrl+K command palette for navigation and theme toggle"
```

(Inclui `ThemeToggle.tsx` no commit só se o Step 7 tiver optado pela extração em hook.)

---

### Task 6: Verificação final

**Files:** nenhum arquivo novo.

- [ ] **Step 1: Suíte completa**

```bash
export PATH="/c/Users/Pedro Henrique/AppData/Roaming/nvm/v20.19.0:$PATH"
npm run type-check
npm run lint
npm run test:unit
npm run build
```

Expected: tudo PASS (a mesma falha pré-existente e não relacionada de `src/lib/interceptors.spec.ts` pode aparecer).

- [ ] **Step 2: E2E completo**

```bash
./node_modules/.bin/playwright test
```

(usar o binário local, não `npx playwright`, que resolveu uma versão incompatível em etapas anteriores desta mesma sequência de branches). Expected: PASS em tudo. Mudanças de shell tendem a quebrar seletores de teste em specs não óbvios (aconteceu nas duas etapas anteriores) — investigar e corrigir o teste, não o componente, quando a mudança visual for intencional.

- [ ] **Step 3: Verificação visual manual**

```bash
npm run dev
```

Login no app (ou usar uma rota que não exija autenticação real, se disponível em dev), navegar pelo shell: conferir os 4 grupos da sidebar, o rodapé SOC2/LGPD, o dropdown do avatar, a faixa de profundidade adaptativa (trocar nível e ver o segundo card do Dashboard mudar de rótulo), abrir o ⌘K e navegar por um item. Comparar com `design_handoff_trackerr/Trackerr App.dc.html`.

- [ ] **Step 4: Commit final (só se o Step 2/3 revelar ajuste necessário)**

```bash
git add -A
git commit -m "chore(web): final verification pass for app shell nocturne fidelity"
```

---

## Self-review desta etapa

- **Cobertura do spec:** seção 4 (sidebar) → Task 1; seção 5 (topbar/avatar) → Task 2; seção 6 (profundidade adaptativa) → Tasks 3-4; seção 7 (command palette) → Task 5; seção 8 (nav-data compartilhado) → Task 1, consumido pela Task 5; seção 9 (testes) → coberta em cada task + Task 6.
- **Testes pré-existentes que assumem o comportamento ANTIGO:** `app-sidebar.spec.tsx` e (potencialmente) partes de `AppTopbar.spec.tsx` afirmam hoje o estado que este plano está mudando de propósito — a Task 1/2 reescrevem essas asserções explicitamente, não é uma quebra acidental.
- **Ambiguidade resolvida:** a extração de `useThemeToggle` (Task 5, Step 7) fica como decisão-no-momento-da-implementação com critério explícito (menor mudança), já que não pude confirmar de antemão o tamanho exato do refactor sem reler `ThemeToggle.tsx` byte a byte durante a escrita deste plano — o critério evita que a decisão seja arbitrária.
- **Consistência de tipos:** `AdaptiveLevel`, `NavItem`, `NavSection` só são definidos uma vez cada (Tasks 1 e 3) e importados nas tasks seguintes — nenhuma redefinição.
