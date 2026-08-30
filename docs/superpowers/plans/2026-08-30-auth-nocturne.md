# Auth (SignIn + Register) — fidelidade Nocturne — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Corrigir o painel direito de `SignIn.tsx`/`Register.tsx` (hoje branco fixo por hex, ignora tema), trocar cor crua por tokens, adicionar abas Entrar/Criar conta e o toggle de tema, batendo com `design_handoff_trackerr/Trackerr Auth.dc.html`.

**Architecture:** Componente novo `AuthTabs` (par de abas navegáveis) mais edições pontuais em `SignIn.tsx`/`Register.tsx` — sem extrair layout compartilhado, sem tocar lógica de formulário/autenticação.

**Tech Stack:** React + Vite + Tailwind + shadcn/ui (Input, Checkbox, Button já emitem tokens por padrão — o problema é só override custom) + react-hook-form + Vitest/Testing Library.

## Global Constraints

- Branch nasce de `feature/design-foundation-nocturne` (não de `develop`).
- Ícones vêm de `@/components/ui/icons`, nunca de `lucide-react`.
- `ForgotPassword.tsx`, `ResetPassword.tsx`, `TwoFactorVerify.tsx`, `SignOut.tsx` não mudam.
- Lógica de `react-hook-form`/`zod`/`AuthenticationService`/2FA não muda — só classe/estilo.
- Node v20.19.0 para todo comando (`export PATH="/c/Users/Pedro Henrique/AppData/Roaming/nvm/v20.19.0:$PATH"`).

---

### Task 1: `AuthTabs`

**Files:**
- Create: `src/components/auth/AuthTabs.tsx`
- Test: `src/components/auth/AuthTabs.spec.tsx`

**Interfaces:**
- Produces: `AuthTabs({active: 'login' | 'register'})`, sem outras props. Consumido pelas Tasks 2 e 3.

- [ ] **Step 1: Escrever o teste (falha esperada)**

```tsx
// src/components/auth/AuthTabs.spec.tsx
import {describe, it, expect} from 'vitest';
import {render, screen} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';
import {AuthTabs} from './AuthTabs';

describe('AuthTabs', () => {
  it('marca Entrar como ativo quando active="login"', () => {
    render(
      <MemoryRouter>
        <AuthTabs active="login" />
      </MemoryRouter>,
    );
    expect(screen.getByRole('link', {name: 'Entrar'})).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(
      screen.getByRole('link', {name: 'Criar conta'}),
    ).not.toHaveAttribute('aria-current');
  });

  it('marca Criar conta como ativo quando active="register"', () => {
    render(
      <MemoryRouter>
        <AuthTabs active="register" />
      </MemoryRouter>,
    );
    expect(screen.getByRole('link', {name: 'Criar conta'})).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(screen.getByRole('link', {name: 'Entrar'})).not.toHaveAttribute(
      'aria-current',
    );
  });

  it('os dois links apontam pras rotas certas', () => {
    render(
      <MemoryRouter>
        <AuthTabs active="login" />
      </MemoryRouter>,
    );
    expect(screen.getByRole('link', {name: 'Entrar'})).toHaveAttribute(
      'href',
      '/signin',
    );
    expect(screen.getByRole('link', {name: 'Criar conta'})).toHaveAttribute(
      'href',
      '/register',
    );
  });
});
```

- [ ] **Step 2: Rodar e confirmar que falha**

```bash
export PATH="/c/Users/Pedro Henrique/AppData/Roaming/nvm/v20.19.0:$PATH"
npx vitest run src/components/auth/AuthTabs.spec.tsx
```

Expected: FAIL — módulo `./AuthTabs` não existe.

- [ ] **Step 3: Criar o componente**

```tsx
// src/components/auth/AuthTabs.tsx
import {Link} from 'react-router-dom';
import {cn} from '@/lib/utils';

interface AuthTabsProps {
  active: 'login' | 'register';
}

const tabs = [
  {id: 'login' as const, label: 'Entrar', to: '/signin'},
  {id: 'register' as const, label: 'Criar conta', to: '/register'},
];

export function AuthTabs({active}: AuthTabsProps) {
  return (
    <div className="inline-flex w-full gap-1 rounded-lg bg-muted p-1 text-muted-foreground">
      {tabs.map((tab) => {
        const isActive = tab.id === active;
        return (
          <Link
            key={tab.id}
            to={tab.to}
            aria-current={isActive ? 'page' : undefined}
            className={cn(
              'flex-1 rounded-md px-3 py-1.5 text-center text-sm font-medium transition-all',
              isActive
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}>
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}

export default AuthTabs;
```

(Classes de estado ativo/inativo espelham `src/components/ui/tabs.tsx` do shadcn — `data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm` — adaptado pra `Link` porque a navegação aqui é por rota, não por estado de um `Tabs.Root`.)

- [ ] **Step 4: Rodar e confirmar que passa**

```bash
npx vitest run src/components/auth/AuthTabs.spec.tsx
```

Expected: PASS (3 testes).

- [ ] **Step 5: Type-check e lint**

```bash
npm run type-check && npm run lint
```

- [ ] **Step 6: Commit**

```bash
git add src/components/auth/AuthTabs.tsx src/components/auth/AuthTabs.spec.tsx
git commit -m "feat(web): add AuthTabs component for signin/register navigation"
```

---

### Task 2: `SignIn.tsx` — tokens, abas, toggle de tema

**Files:**
- Modify: `src/pages/SignIn.tsx`

**Interfaces:**
- Consumes: `AuthTabs` (Task 1), `ThemeToggle` de `@/components/ThemeToggle` (já existe).

- [ ] **Step 1: Remover o `style` inline do painel direito e adicionar `bg-background`**

Linha 246-248, de:
```tsx
<div
  className="flex-1 flex items-center justify-center p-8"
  style={{backgroundColor: '#ffffff'}}>
```
para:
```tsx
<div className="relative flex-1 flex items-center justify-center bg-background p-8">
```
(`relative` adicionado porque o `ThemeToggle` do Step 5 vai usar `absolute` dentro desse container.)

- [ ] **Step 2: Corrigir o heading e o texto de apoio (linhas 257-278)**

`text-surface-panel` (heading) → `text-foreground`. `text-slate-500` (parágrafo "Não tem uma conta?") → `text-muted-foreground`.

```tsx
<h2
  className="font-bold mb-2 text-foreground"
  style={{
    fontSize: '1.875rem',
    fontFamily: 'var(--font-heading)',
    letterSpacing: '-0.02em',
  }}>
  Entrar no Terminal
</h2>
<p
  className="text-muted-foreground"
  style={{
    fontSize: '0.9rem',
  }}>
  Não tem uma conta?{' '}
  <button
    id="signin-goto-register"
    onClick={() => navigate('/register')}
    className="font-semibold transition-colors decoration-primary/30 underline-offset-4 hover:underline text-brand">
    Criar conta agora
  </button>
</p>
```

- [ ] **Step 3: Inserir `AuthTabs` acima do cabeçalho do formulário**

Import no topo do arquivo:
```tsx
import {AuthTabs} from '@/components/auth/AuthTabs';
```

No JSX, imediatamente antes do bloco `{/* Cabeçalho do form */}` (linha 256), dentro do mesmo `<div className="w-full max-w-md">`:
```tsx
<AuthTabs active="login" />

{/* Cabeçalho do form */}
<div className="mb-8 mt-6">
  ...
```
(adiciona `mt-6` no container do cabeçalho pra dar respiro entre as abas e o título — o `mb-8` original do cabeçalho continua.)

- [ ] **Step 4: Corrigir os campos de formulário (email, senha)**

Labels `text-slate-500` → `text-muted-foreground` (2 ocorrências, linhas ~294 e ~322). Inputs: remover `border-slate-200`/`bg-slate-50/50` da `className` (o componente `Input` já aplica `border-input bg-background` por padrão — conferir `src/components/ui/input.tsx` antes de editar pra confirmar que continua assim) e remover `text-surface-panel` (também não é necessário — `Input` não define cor de texto própria, herda `text-foreground` do body). Resultado, campo de e-mail:

```tsx
<Input
  id="signin-email"
  placeholder="seu@email.com"
  maxLength={254}
  {...field}
  className="h-12 text-sm focus-visible:ring-1 focus-visible:ring-brand"
/>
```

Campo de senha, mesma limpeza de classe, mais o botão de olho:
```tsx
<Button
  type="button"
  variant="ghost"
  size="icon"
  className="absolute right-1 top-1 h-10 w-10 text-muted-foreground hover:bg-transparent"
  onClick={() => setShowPassword(!showPassword)}>
  ...
</Button>
```
(`style={{color: '#94a3b8'}}` removido, `text-muted-foreground` na `className` no lugar.)

- [ ] **Step 5: Corrigir checkbox, botão de submit e rodapé**

Checkbox (linha ~373-378): remover `border-slate-300` da `className` (o componente já usa `border-primary` por padrão — conferir `src/components/ui/checkbox.tsx`), manter `data-[state=checked]:bg-brand data-[state=checked]:border-brand`.

Label do checkbox (linha ~380-384): `style={{color: '#475569'}}` → remove o `style`, adiciona `text-muted-foreground` na `className`.

Botão de submit — mantém o gradiente (`bg-[linear-gradient(135deg,hsl(var(--brand)),hsl(var(--brand-strong)))]`, já correto e já usa os tokens de brand da etapa anterior), só remove `style={{color: '#f9f7ff'}}` e adiciona `text-brand-foreground` na `className` (mesmo token semântico que já existe pra texto sobre fundo de marca).

Rodapé (linha ~412-414): `style={{color: '#94a3b8'}}` → `text-muted-foreground` na `className`, sem `style`.

- [ ] **Step 6: Adicionar o `ThemeToggle`**

Import:
```tsx
import {ThemeToggle} from '@/components/ThemeToggle';
```

No JSX, como primeiro filho do container raiz (`<div id="signin-page" className="dark min-h-screen flex" ...>` — linha 145-148), adicionar antes do painel esquerdo:
```tsx
<div className="absolute right-4 top-4 z-50">
  <ThemeToggle />
</div>
```
(usa `absolute` porque o container raiz não tem `relative` — conferir se precisa adicionar `relative` ao `className` do container raiz pra o `absolute` funcionar corretamente; se sim, adicionar.)

- [ ] **Step 7: Type-check, lint, specs existentes**

```bash
export PATH="/c/Users/Pedro Henrique/AppData/Roaming/nvm/v20.19.0:$PATH"
npm run type-check && npm run lint
npx vitest run src/pages/SignIn.spec.tsx
```

Expected: tudo PASS. Se `SignIn.spec.tsx` não existir, pular esse comando (conferir antes com `ls src/pages/SignIn.spec.tsx`).

- [ ] **Step 8: Commit**

```bash
git add src/pages/SignIn.tsx
git commit -m "feat(web): fix SignIn panel to respect theme tokens, add auth tabs and theme toggle"
```

---

### Task 3: `Register.tsx` — tokens, abas, toggle de tema, checklist de senha

**Files:**
- Modify: `src/pages/Register.tsx`

**Interfaces:**
- Consumes: `AuthTabs` (Task 1). NOT `ThemeToggle` — see Step 7.

- [ ] **Step 1: Painel direito — remover `style` inline, adicionar `bg-background`**

Linha 220-223, de:
```tsx
<div
  className="flex-1 flex items-center justify-center p-8 overflow-y-auto"
  style={{backgroundColor: '#ffffff'}}>
```
para:
```tsx
<div className="relative flex-1 flex items-center justify-center overflow-y-auto bg-background p-8">
```

- [ ] **Step 2: Corrigir heading e texto de apoio (linhas 232-249)**

Mesmo padrão do Task 2/Step 2: `text-surface-panel`→`text-foreground` no `<h2>`, `text-slate-500`→`text-muted-foreground` no `<p>`.

- [ ] **Step 3: Inserir `AuthTabs`**

Import `AuthTabs` de `@/components/auth/AuthTabs`. No JSX, antes do bloco `{/* Cabeçalho do form */}` (linha 231):
```tsx
<AuthTabs active="register" />

{/* Cabeçalho do form */}
<div className="mb-8 mt-6">
  ...
```

- [ ] **Step 4: Corrigir os 5 campos (nome, sobrenome, e-mail, senha, confirmar senha)**

Mesmo padrão do Task 2/Step 4, repetido 5x: label `text-slate-500`→`text-muted-foreground`, `Input` perde `border-slate-200 bg-slate-50/50 text-surface-panel` da `className` (linhas 264-276, 288-300, 314-326, 339-353, 383-397). Botões de olho (senha e confirmar senha, linhas 356-371 e 400-419) perdem `style={{color: '#94a3b8'}}`, ganham `text-muted-foreground` na `className`.

- [ ] **Step 5: Corrigir o checklist de regras de senha (linhas 426-464)**

```tsx
<div className="rounded-xl border border-input bg-muted/50 p-3 text-xs text-muted-foreground">
  <p className="mb-2 font-semibold text-foreground">
    Regras da senha
  </p>
  <p className={hasMinLength ? 'text-success' : 'text-muted-foreground'}>
    • Mínimo de 8 caracteres
  </p>
  <p className={hasUppercase ? 'text-success' : 'text-muted-foreground'}>
    • Pelo menos 1 letra maiúscula
  </p>
  <p className={hasLowercase ? 'text-success' : 'text-muted-foreground'}>
    • Pelo menos 1 letra minúscula
  </p>
  <p className={hasNumber ? 'text-success' : 'text-muted-foreground'}>
    • Pelo menos 1 número
  </p>
  <p className={hasSpecial ? 'text-success' : 'text-muted-foreground'}>
    • Pelo menos 1 caractere especial
  </p>
  <p className={passwordsMatch ? 'text-success' : 'text-muted-foreground'}>
    • A confirmação deve ser igual à senha
  </p>
</div>
```

- [ ] **Step 6: Corrigir checkbox de termos, botão de submit, rodapé**

Checkbox (linha 472-478): remove `border-slate-300` da `className`, mantém `data-[state=checked]:bg-brand data-[state=checked]:border-brand`.

Label do checkbox (linha 480-495): `style={{color: '#475569'}}` → remove, adiciona `text-muted-foreground`.

Botão de submit (linha 507-523): remove `style={{color: '#f9f7ff'}}`, adiciona `text-brand-foreground` na `className` (mesmo padrão do Task 2/Step 5).

Rodapé (linha 528-530): `style={{color: '#94a3b8'}}` → `text-muted-foreground`, sem `style`.

- [ ] **Step 7: NÃO adicionar `ThemeToggle`**

Correção pós-Task 2: `Register.tsx:122` também tem `className="dark min-h-screen flex"` no container raiz — mesma causa raiz do bug encontrado e corrigido na Task 2 (toggle dentro de escopo `.dark` forçado não tem efeito nenhum; auth é propositalmente sempre escuro, decisão de design já documentada). Não adicionar `ThemeToggle` em `Register.tsx`. Pular este step.

- [ ] **Step 8: Type-check, lint, specs existentes**

```bash
export PATH="/c/Users/Pedro Henrique/AppData/Roaming/nvm/v20.19.0:$PATH"
npm run type-check && npm run lint
npx vitest run src/pages/Register.spec.tsx
```

Se `Register.spec.tsx` não existir, pular (conferir com `ls` antes).

- [ ] **Step 9: Commit**

```bash
git add src/pages/Register.tsx
git commit -m "feat(web): fix Register panel to respect theme tokens, add auth tabs and theme toggle"
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

Expected: tudo PASS (a mesma falha pré-existente de `src/lib/interceptors.spec.ts` documentada na etapa anterior pode aparecer — não é regressão desta etapa).

- [ ] **Step 2: E2E de auth**

```bash
npx playwright test tests/e2e/auth-ui.spec.ts tests/e2e/auth-success.spec.ts
```

Expected: PASS. Se algum seletor depender de estrutura removida nesta etapa (ex.: algo que dependia do texto exato "Não tem uma conta?" continua igual, então não deveria haver impacto), investigar e corrigir o teste, não o componente.

- [ ] **Step 3: Verificação visual manual**

```bash
npm run dev
```

Abrir `/signin` e `/register`, alternar tema, conferir: painel direito muda de cor, abas mostram estado ativo certo e navegam entre as rotas, campos/checkbox/botão de olho sem cor crua. Comparar com `design_handoff_trackerr/Trackerr Auth.dc.html`.

- [ ] **Step 4: Commit final (só se o Step 3 revelar ajuste necessário)**

```bash
git add -A
git commit -m "chore(web): final verification pass for auth nocturne fidelity"
```

---

## Self-review desta etapa

- **Cobertura do spec:** seção 4 (AuthTabs) → Task 1; seção 5 (mapeamento de classe/token) → Tasks 2 e 3, incluindo o adendo do checklist de senha do Register; seção 6 (testes) → Task 4.
- **Achado durante a escrita do plano, não previsto no spec original:** o checklist de regras de senha do `Register.tsx` (linhas 426-464) também usa cor crua (`slate-*`, `emerald-600`) — não estava na tabela original do spec (que só cobria os campos comuns a ambas as telas). Adicionado ao spec (seção 5, tabela extra) antes de escrever este plano, então já está refletido nos dois documentos.
- **Consistência:** `AuthTabs({active})` é o mesmo tipo/nome usado nas Tasks 2 e 3; `text-success` e `text-muted-foreground` são tokens já existentes no projeto (confirmados em `tailwind.config.ts`/`index.css` da etapa de fundação), não inventados aqui.
