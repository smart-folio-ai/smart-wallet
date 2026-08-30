# Auth (SignIn + Register) — fidelidade Nocturne e correção de tema

**Data:** 2026-08-30
**Escopo:** `web` apenas. `ForgotPassword`/`ResetPassword`/`TwoFactorVerify` ficam fora desta etapa.
**Branch:** `feature/auth-nocturne-redesign`
**Depende de:** `feature/design-foundation-nocturne` (PR #102, ainda não mergeado — esta branch nasce dela).
**Referência:** `design_handoff_trackerr/Trackerr Auth.dc.html` + README.md (seção "2. Auth")

Terceira etapa do redesign (paralela à etapa Landing, ambas nascem da mesma fundação).

## 1. Objetivo

Trazer o padrão visual do handoff pras telas de login/cadastro e, no processo, corrigir um bug real: o painel direito (formulário) hoje é branco fixo por hex, ignorando o tema do app inteiro.

## 2. Estado atual

`src/pages/SignIn.tsx` e `src/pages/Register.tsx` já têm a estrutura de 2 colunas do handoff (painel esquerdo editorial com gradiente + prova, painel direito com formulário), mas:

- **Painel direito com `style={{backgroundColor: '#ffffff'}}` fixo** (`SignIn.tsx:248`, `Register.tsx:223`, este último comentado no próprio código como `{/* Painel direito - formulário (BRANCO) */}`). Não reage a `.dark`/`.light` de jeito nenhum.
- Tipografia do painel direito usa Tailwind cru (`text-slate-500`, `border-slate-200`, `bg-slate-50/50`) e hex direto (`#94a3b8`, `#475569`, `#f9f7ff`) em vez dos tokens (`text-muted-foreground`, `border-input`, `bg-background` etc.) que o resto do app usa desde a Etapa 1.
- `text-surface-panel` usado como cor de **texto** do heading (`SignIn.tsx:258`, `Register.tsx:233`) — `--surface-panel` é um token de fundo, não de texto; deveria ser `text-foreground`.
- Nenhum `ThemeToggle` nas duas telas (o handoff fixa um no canto superior direito).
- Nenhuma alternância visual entre "Entrar"/"Criar conta" — são duas rotas sem indicação visual de que são modos irmãos.
- O painel esquerdo (`bg-surface-panel`, gradiente com `hsl(var(--brand)/0.0x)`) já usa tokens corretamente — **não muda**.
- Lógica de formulário (`react-hook-form` + `zod`, `AuthenticationService`, `GoogleLoginButton`, 2FA redirect) — **não muda**.

## 3. Decisões tomadas

| Questão | Decisão |
|---|---|
| Estrutura de arquivos | Extrai um componente compartilhado `src/components/auth/AuthTabs.tsx` (par de abas Entrar/Criar conta) e reaproveita `ThemeToggle` já existente. Não extrai um `AuthLayout` genérico nesta etapa — `SignIn.tsx`/`Register.tsx` continuam donos do próprio JSX de layout (each ainda é uma página só, risco menor, menos refactor que uma extração de layout completa). |
| Painel direito | `bg-background text-foreground` no lugar do hex fixo — reage a tema como o resto do app. |
| Campos e textos do form | Tokens no lugar de `slate-*`/hex: `text-slate-500`→`text-muted-foreground`, `border-slate-200`→`border-input`, `bg-slate-50/50`→`bg-input` (ou `bg-background`, ver seção 5), `#94a3b8`/`#475569`→tokens equivalentes. |
| `text-surface-panel` no heading | Corrige pra `text-foreground`. |
| Abas Entrar/Criar conta | Componente `AuthTabs` com 2 `Link`, estilo segmented-control (pílula com fundo, aba ativa destacada) — visual do handoff, navegação real de rota por baixo. |
| Toggle de tema | `ThemeToggle` fixo no canto superior direito de ambas as telas (`position: fixed` ou `absolute` no container raiz). |

## 4. `AuthTabs` — especificação

**Arquivo novo:** `src/components/auth/AuthTabs.tsx`
**Teste novo:** `src/components/auth/AuthTabs.spec.tsx`

```tsx
interface AuthTabsProps {
  active: 'login' | 'register';
}
```

Renderiza um container `flex` com padding pequeno, borda (`border border-input`, ou `border-hairline` se esse token existir — usar `border-input` que já existe), fundo levemente distinto do painel (`bg-muted/50` ou similar), raio `rounded-lg`. Dentro, dois `Link`:
- `{label: 'Entrar', to: '/signin'}`
- `{label: 'Criar conta', to: '/register'}`

O item cujo `to` corresponde a `active` recebe destaque (`bg-background text-foreground shadow-sm` ou equivalente ao padrão de tab ativa já usado em algum lugar do app — checar `src/components/ui/tabs.tsx` do shadcn, que já existe no projeto, e reaproveitar suas classes de estado ativo em vez de inventar um padrão novo). O item inativo fica `text-muted-foreground`, sem fundo.

`SignIn.tsx` renderiza `<AuthTabs active="login" />`, `Register.tsx` renderiza `<AuthTabs active="register" />`, posicionado no topo do painel direito, acima do `<h2>` do formulário (ver `Trackerr Auth.dc.html:119-123` pro posicionamento de referência — logo no início do `<main>`, antes do título).

## 5. Mapeamento de classe/token (painel direito)

| Antes | Depois |
|---|---|
| `style={{backgroundColor: '#ffffff'}}` no container do painel direito | remove o `style`, adiciona `bg-background` na `className` |
| `text-surface-panel` (heading `h2`) | `text-foreground` |
| `text-slate-500` (subtítulo, "Não tem uma conta?") | `text-muted-foreground` |
| `text-slate-500` (label uppercase de campo) | `text-muted-foreground` |
| `border-slate-200` + `bg-slate-50/50` (Input) | `border-input` + `bg-background` (o componente `Input` do shadcn já aplica `bg-background` por padrão sem prop extra — conferir `src/components/ui/input.tsx`; se já for o comportamento default, essas duas classes custom só precisam ser removidas, não substituídas) |
| `style={{color: '#94a3b8'}}` (botão de olho mostrar/ocultar senha) | `text-muted-foreground` |
| `style={{color: '#475569'}}` (label do checkbox "Manter conectado") | `text-foreground` (ou `text-muted-foreground`, mais próximo do peso visual original — usar `text-muted-foreground`) |
| `style={{color: '#94a3b8'}}` (rodapé "Copyright © 2025...") | `text-muted-foreground` |
| `border-slate-300` (Checkbox) | remove — o componente `Checkbox` do shadcn já tem borda própria por token; conferir `src/components/ui/checkbox.tsx` antes de decidir se precisa de substituto |

Aplicar a mesma tabela em `Register.tsx`, que repete os mesmos padrões (`text-slate-500`, `#ffffff` etc. nos mesmos pontos estruturais — cabeçalho, campos, rodapé). `Register.tsx` tem, além disso, um bloco só seu (checklist de regras de senha, `Register.tsx:426-464`) que também usa cor crua:

| Antes (só em `Register.tsx`) | Depois |
|---|---|
| `border-slate-200 bg-slate-50/70 text-slate-600` (container do checklist) | `border-input bg-muted/50 text-muted-foreground` |
| `text-slate-700` (título "Regras da senha") | `text-foreground` |
| `text-emerald-600` (regra cumprida) | `text-success` |
| `text-slate-600` (regra não cumprida) | `text-muted-foreground` (mesmo valor do container — já cai nisso por herança se o `<p>` não sobrescrever, mas cada `<p>` tem `className` próprio condicional, então precisa ficar explícito em cada um) |

## 6. Testes

- `AuthTabs.spec.tsx`: renderiza com `active="login"`, confere que "Entrar" tem o estado ativo (classe ou `aria-current`) e "Criar conta" não; inverte com `active="register"`.
- `SignIn.spec.tsx`/`Register.spec.tsx` (se existirem specs — conferir `src/pages/SignIn.spec.tsx`, `src/pages/Register.spec.tsx`) rodam sem quebrar; se algum teste faz `getByText`/`getByRole` que dependia de estrutura removida (ex.: nenhum teste deveria depender de cor), não deve haver impacto.
- `tests/e2e/auth-ui.spec.ts` — já teve um ajuste na Etapa 1 (seletor de mostrar/ocultar senha por `sr-only`, não por classe de ícone); rodar de novo pra confirmar que continua passando com os novos tokens.
- `npm run type-check`, `npm run lint`, `npm run test:unit`, `npm run build`.
- Verificação visual manual: abrir `/signin` e `/register` nos dois temas, confirmar que o painel direito muda de cor com o toggle, que as abas mostram o estado ativo certo, comparar com `Trackerr Auth.dc.html`.

## 7. Fora de escopo

- `ForgotPassword.tsx`, `ResetPassword.tsx`, `TwoFactorVerify.tsx`, `SignOut.tsx` — ficam com o visual atual.
- Unificar SignIn/Register num componente único com estado (mantém 2 rotas).
- Mudanças em `AuthenticationService`, validação de formulário, fluxo de 2FA.
- Extração de um `AuthLayout` compartilhado genérico (avaliar numa etapa futura se a duplicação entre os dois arquivos incomodar).
