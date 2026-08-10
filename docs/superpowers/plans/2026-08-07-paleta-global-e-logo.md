# Paleta Global e Logo — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Unificar os três vocabulários de token do projeto em um só, definir as duas paletas globais e consolidar o desenho da marca num componente único.

**Architecture:** Os tokens canônicos (`--surface-*`, `--on-surface-*`) passam a reagir ao tema, e os tokens semânticos do shadcn passam a derivar deles — é o que repinta 72 arquivos sem alterar uma linha de código. As telas que precisam ser sempre escuras (landing e autenticação) declaram a classe `dark` no próprio container, em vez de dependerem de escopos especiais como `.landing-root` ou dos aliases `--auth-*`.

**Tech Stack:** React 18, TypeScript, Vite, Tailwind CSS 3, shadcn-ui, Vitest, jsdom.

## Global Constraints

- **Nenhuma dependência nova.** Não rodar `npm install`.
- **Branch:** `web/feature/paleta-global-e-logo`. Já criada, a partir da `develop`.
- **Diretório:** `B:/my projects/TrackerInvest/web`.
- **`npx` está quebrado nesta máquina.** Use:
  - Teste focado: `node node_modules/vitest/vitest.mjs run <caminho>`
  - Suíte completa: `node node_modules/vitest/vitest.mjs run`
  - Tipos: `node node_modules/typescript/bin/tsc -p tsconfig.app.json --noEmit`
  - Lint: `node node_modules/eslint/bin/eslint.js src`
  - Nunca `npm run test` (roda Playwright).
- **O working tree carrega trabalho não commitado que NÃO pertence a este plano** e não pode entrar em nenhum commit: `index.html`, `public/favicon.ico`, `public/favicon-16x16.png`, `public/favicon-32x32.png`, `public/favicon.svg`, `public/apple-touch-icon.png`, `public/trakker-logo.png`, `src/App.tsx`, `src/pages/Settings.tsx`, `src/lib/interceptors.ts`, `src/components/settings/PrivacySettings.tsx`, `src/components/settings/PrivacySettings.spec.tsx`. **Commitar sempre com `git add <caminhos específicos>` — nunca `git add -A` nem `git add .`.**
- **Esta etapa muda cor, token e logo. Não move um pixel de posição** — nenhuma alteração de layout, espaçamento ou tipografia.
- **Erros de tipo pré-existentes** que devem continuar existindo e não são deste plano: `GoogleLoginButton.tsx(21,10)`, `AssetAllocationChart.tsx(110,21)`, `ConsentContext.spec.tsx(45,45)`, `ConsentContext.tsx(57,18)`, `useFileUpload.ts(18,10)`, `AddAsset.tsx(278,64)`, `trakkerAi.ts(368,10)`, `stripe.ts(10,3)`. Estão corrigidos no PR #57, em outra branch. O gate de cada task é: **nenhum erro novo além desses oito**.
- **Comentários de código em português.**

### Paleta — valores canônicos

| Token | Escuro | Claro |
|---|---|---|
| `--surface-base` | `224 30% 6%` | `40 33% 98%` |
| `--surface-panel` | `224 28% 8%` | `40 24% 96%` |
| `--surface-raised` | `223 24% 11%` | `40 40% 100%` |
| `--surface-input` | `225 20% 18%` | `40 20% 92%` |
| `--surface-hairline` | `0 0% 100%` | `30 14% 12%` |
| `--on-surface` | `228 90% 93%` | `30 14% 12%` |
| `--on-surface-accent` | `228 100% 86%` | `230 60% 32%` |
| `--on-surface-muted` | `228 18% 72%` | `33 9% 38%` |
| `--on-surface-subtle` | `228 12% 55%` | `35 7% 50%` |
| `--brand` | `230 100% 62%` | `230 100% 62%` |
| `--brand-strong` | `230 90% 54%` | `230 90% 54%` |
| `--accent-positive` | `158 84% 45%` | `158 76% 30%` |
| `--accent-negative` | `351 83% 61%` | `351 72% 42%` |
| `--warning` | `40 95% 60%` | `32 90% 34%` |

Todos os pares de contraste foram calculados pela fórmula da WCAG e passam em AA. A referência visual está em `docs/design/paletas-globais.html`.

### Mapa de conversão dos aliases `--auth-*`

Toda ocorrência de `style={{...: 'var(--auth-X)'}}` vira a classe correspondente. São 159 ocorrências de 24 aliases.

| Alias | Vira |
|---|---|
| `--auth-bg` | `bg-surface` |
| `--auth-panel` | `bg-surface-panel` |
| `--auth-surface` | `bg-surface-raised` |
| `--auth-input` | `bg-surface-input` |
| `--auth-brand` | `bg-brand` / `text-brand` / `border-brand` conforme a propriedade original |
| `--auth-brand-strong` | `bg-brand-strong` / `text-brand-strong` conforme a propriedade |
| `--auth-brand-soft-05` | `bg-brand/5` |
| `--auth-brand-soft-10` | `bg-brand/10` |
| `--auth-brand-soft-20` | `bg-brand/20` |
| `--auth-brand-soft-40` | `bg-brand/40` |
| `--auth-brand-soft-50` | `bg-brand/50` |
| `--auth-text-main` | `text-on-surface` |
| `--auth-text-main-alt` | `text-on-surface` |
| `--auth-text-accent` | `text-on-surface-accent` |
| `--auth-text-muted` | `text-on-surface-muted/60` |
| `--auth-text-body` | `text-on-surface-muted/75` |
| `--auth-text-body-strong` | `text-on-surface-muted/70` |
| `--auth-text-soft` | `text-on-surface-muted/40` |
| `--auth-text-secondary` | `text-on-surface-subtle` |
| `--auth-highlight` | `bg-brand/[0.12]` |
| `--auth-highlight-soft` | `bg-brand/[0.08]` |
| `--auth-highlight-mid` | `bg-brand/[0.07]` |
| `--auth-highlight-subtle` | `bg-brand/5` |
| `--auth-success-soft` | `bg-positive/[0.08]` |
| `--auth-danger-soft` | `bg-negative/[0.12]` |

Quando o alias aparece em `border`, use o prefixo `border-`; em `color`, `text-`; em `background`/`backgroundColor`, `bg-`.

---

## Refinamento sobre a spec — leia antes da Task 2

A spec (seção 8) afirma que a mudança dos tokens e a conversão das telas de auth **precisam viajar no mesmo commit**, porque `--auth-bg` deriva de `--surface-base`: no momento em que `--surface-base` no `:root` passa a valer a paleta clara, as cinco telas de auth ficam com texto claro sobre fundo claro.

O raciocínio está certo, mas há uma saída melhor do que um commit gigante. Na Task 2, os aliases `--auth-*` deixam de derivar de `--surface-*` e passam a apontar para **literais escuros**, congelados. As telas de auth continuam exatamente como estão, corretas, enquanto o resto do sistema já migra. As Tasks 3 a 5 então convertem as telas uma a uma, com revisão entre elas, e a Task 7 remove a ponte quando não há mais consumidor.

Isso satisfaz a intenção da spec — nunca deixar o login ilegível — sem concentrar 159 conversões, duas paletas e três correções num único commit irrevisável.

---

## Estrutura de arquivos

```
src/index.css                                  as duas paletas + ponte temporaria
src/index.spec.ts                              NOVO: teste de paridade de tokens
tailwind.config.ts                             on-surface-subtle entra, secondary sai
src/components/AppLogo.tsx                     REESCRITO: SVG inline + texto
src/assets/logo-icon-{dark,light}-bg.svg       removidos (viram SVG inline)
src/assets/logo-lockup-{dark,light}-bg.svg     mantidos, sem uso na aplicacao
src/assets/logo.png                            removido
src/components/landing/sections/LandingNav.tsx      consome AppLogo
src/components/landing/sections/LandingFooter.tsx   consome AppLogo
src/pages/Landing.tsx                          .landing-root vira dark
src/pages/Landing.spec.tsx                     procura texto, nao alt
src/pages/SignIn.tsx                           conversao + dark no root
src/pages/Register.tsx                         conversao + dark no root
src/pages/ForgotPassword.tsx                   conversao + dark no root
src/pages/ResetPassword.tsx                    conversao + dark no root
src/components/WalletLoadingScreen.tsx         conversao + dark no root
src/components/ui/custom-tooltip.tsx           cor fixa vira token
src/components/ui/feature-tour-modal.tsx       cor fixa vira token
src/pages/AIInsights.tsx                       cor fixa vira token
docs/design/paletas-globais.html               atualizado se algum valor mudar
```

---

### Task 1: Componente único de logo

**Files:**
- Modify: `src/components/AppLogo.tsx` (reescrita completa)
- Modify: `src/components/landing/sections/LandingNav.tsx`
- Modify: `src/components/landing/sections/LandingFooter.tsx`
- Modify: `src/pages/Landing.spec.tsx`
- Delete: `src/assets/logo.png`
- Add to git: `src/assets/logo-lockup-dark-bg.svg`, `src/assets/logo-lockup-light-bg.svg`
- Test: `src/components/AppLogo.spec.tsx` (novo)

**Interfaces:**
- Consumes: nada de tasks anteriores.
- Produces: `<AppLogo size?: 'sm' | 'md' | 'lg', variant?: 'full' | 'icon', className?: string />`. `size` padrão `'md'`, `variant` padrão `'full'`. No modo `full` renderiza o ícone SVG inline seguido do texto `Trackerr` em `<span>`. No modo `icon` renderiza só o ícone. O ícone é sempre `aria-hidden="true"`.

**Contexto importante:** os quatro SVGs em `src/assets/` e a remoção de `logo.png` estão no working tree **sem commit**. Os arquivos de ícone (`logo-icon-dark-bg.svg`, `logo-icon-light-bg.svg`) não serão adicionados ao git: o desenho deles vira SVG inline no componente. Os dois arquivos de lockup **são** adicionados, para uso externo (apresentação, e-mail), mesmo sem consumidor no código.

- [ ] **Step 1: Escrever o teste que falha**

Criar `src/components/AppLogo.spec.tsx`:

```tsx
import {describe, it, expect} from 'vitest';
import {render, screen} from '@testing-library/react';
import {AppLogo} from './AppLogo';

describe('AppLogo', () => {
  it('renderiza a marca como texto de verdade, nao como imagem', () => {
    render(<AppLogo />);
    expect(screen.getByText('Trackerr')).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('esconde o icone de leitores de tela, que leem o texto', () => {
    const {container} = render(<AppLogo />);
    const svg = container.querySelector('svg');
    expect(svg).not.toBeNull();
    expect(svg?.getAttribute('aria-hidden')).toBe('true');
  });

  it('no modo icon nao renderiza a palavra', () => {
    render(<AppLogo variant="icon" />);
    expect(screen.queryByText('Trackerr')).not.toBeInTheDocument();
  });

  it('o anel de fundo herda a cor do tema via currentColor', () => {
    const {container} = render(<AppLogo />);
    const anel = container.querySelector('circle[stroke="currentColor"]');
    expect(anel).not.toBeNull();
  });
});
```

- [ ] **Step 2: Rodar o teste e confirmar que falha**

```bash
node node_modules/vitest/vitest.mjs run src/components/AppLogo.spec.tsx
```

Esperado: FALHA. O `AppLogo` atual renderiza `<img>`, então `queryByRole('img')` encontra um elemento e `getByText('Trackerr')` não encontra nada.

- [ ] **Step 3: Reescrever `src/components/AppLogo.tsx`**

```tsx
import {cn} from '@/lib/utils';

interface AppLogoProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'full' | 'icon';
  className?: string;
}

const ICON_PX = {sm: 24, md: 28, lg: 34};
const TEXT_CLASS = {sm: 'text-base', md: 'text-lg', lg: 'text-2xl'};

/**
 * Único lugar que desenha a marca.
 *
 * O ícone é SVG inline, e não um arquivo: assim o anel de fundo usa
 * currentColor e acompanha o tema sozinho, sem precisar de uma versão para
 * fundo claro e outra para escuro, e sem uma requisição de imagem.
 *
 * A palavra "Trackerr" é texto de verdade, na fonte do app. O lockup em SVG
 * embute a fonte Space Grotesk, que não é carregada aqui — e um SVG dentro de
 * <img> não enxerga fontes do documento, então a palavra sairia diferente em
 * cada máquina. Como texto, ela também fica selecionável e legível por leitor
 * de tela, o que dispensa o alt.
 */
export function AppLogo({
  size = 'md',
  variant = 'full',
  className,
}: AppLogoProps) {
  const px = ICON_PX[size];

  const icone = (
    <svg
      width={px}
      height={px}
      viewBox="0 0 120 120"
      aria-hidden="true"
      focusable="false"
      className="shrink-0">
      <circle
        cx="60"
        cy="60"
        r="24"
        fill="none"
        stroke="currentColor"
        strokeOpacity="0.2"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <path
        d="M 60 22 A 38 38 0 0 1 98 60"
        fill="none"
        stroke="hsl(var(--brand))"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <circle cx="60" cy="60" r="7" fill="hsl(var(--brand))" />
    </svg>
  );

  if (variant === 'icon') {
    return <span className={cn('inline-flex', className)}>{icone}</span>;
  }

  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      {icone}
      <span
        className={cn(
          'font-heading font-semibold tracking-tight',
          TEXT_CLASS[size],
        )}>
        Trackerr
      </span>
    </span>
  );
}

export default AppLogo;
```

- [ ] **Step 4: Rodar o teste e confirmar que passa**

```bash
node node_modules/vitest/vitest.mjs run src/components/AppLogo.spec.tsx
```

Esperado: PASS, 4 testes.

- [ ] **Step 5: Fazer a nav da landing consumir o componente**

Em `src/components/landing/sections/LandingNav.tsx`, remover a linha de import do arquivo de logo e trocar o bloco do `<Link to="/">` para usar o componente:

```tsx
import {AppLogo} from '@/components/AppLogo';
```

```tsx
        <Link to="/" className="text-on-surface">
          <AppLogo size="md" />
        </Link>
```

A classe `text-on-surface` no `<Link>` é o que dá cor ao anel do ícone, já que ele usa `currentColor`.

- [ ] **Step 6: Fazer o rodapé da landing consumir o componente**

Em `src/components/landing/sections/LandingFooter.tsx`, mesma troca:

```tsx
import {AppLogo} from '@/components/AppLogo';
```

```tsx
            <Link to="/" className="text-on-surface">
              <AppLogo size="md" />
            </Link>
```

- [ ] **Step 7: Atualizar o teste da landing**

Em `src/pages/Landing.spec.tsx`, a primeira asserção do teste `abre com a promessa central e o caminho de conversão` procura o atributo `alt`. Trocar:

```tsx
    expect(screen.getAllByAltText('trackerr').length).toBeGreaterThan(0);
```

por:

```tsx
    expect(screen.getAllByText('Trackerr').length).toBeGreaterThan(0);
```

- [ ] **Step 8: Rodar a suíte inteira**

```bash
node node_modules/vitest/vitest.mjs run
node node_modules/typescript/bin/tsc -p tsconfig.app.json --noEmit
```

Esperado: suíte verde. Typecheck com exatamente os oito erros pré-existentes listados nas Global Constraints, nenhum a mais.

- [ ] **Step 9: Commit**

```bash
git rm --cached src/assets/logo.png
rm -f src/assets/logo.png
git add src/assets/logo-lockup-dark-bg.svg src/assets/logo-lockup-light-bg.svg
git add src/components/AppLogo.tsx src/components/AppLogo.spec.tsx
git add src/components/landing/sections/LandingNav.tsx
git add src/components/landing/sections/LandingFooter.tsx
git add src/pages/Landing.spec.tsx
git commit -m "feat(web): consolidate brand into a single AppLogo component"
```

Os arquivos `src/assets/logo-icon-*.svg` continuam no working tree sem serem adicionados ao git — o desenho deles agora vive inline no componente. Não os apague: são a fonte do desenho, caso alguém precise reeditar.

---

### Task 2: As duas paletas, com ponte temporária para o auth

**Files:**
- Modify: `src/index.css` (blocos `:root` e `.dark`)
- Modify: `tailwind.config.ts`
- Test: `src/index.spec.ts` (novo)

**Interfaces:**
- Consumes: nada da Task 1.
- Produces: os tokens da tabela de paleta das Global Constraints, definidos em `:root` (claro) e `.dark` (escuro). Classes Tailwind novas disponíveis: `bg-surface-input`, `text-on-surface-subtle`. A classe `text-on-surface-secondary` **deixa de existir**.

**Ponte temporária:** os aliases `--auth-*` param de derivar de `--surface-*` e passam a valer literais escuros. Isso mantém as cinco telas de auth corretas enquanto elas ainda não foram convertidas. A ponte é removida na Task 7.

- [ ] **Step 1: Escrever o teste de paridade que falha**

Criar `src/index.spec.ts`:

```ts
import {describe, it, expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';

/**
 * O bug clássico de um sistema de dois temas é um token definido num tema e
 * esquecido no outro: a página passa a misturar texto de um tema com fundo do
 * outro, e ninguém percebe até alguém usar o toggle. Este teste lê o CSS e
 * exige que os dois blocos declarem exatamente o mesmo conjunto de nomes.
 */
function extrairTokens(css: string, seletor: string): string[] {
  const inicio = css.indexOf(seletor);
  if (inicio === -1) throw new Error(`Bloco ${seletor} não encontrado`);

  // Caminha do primeiro "{" até a chave que o fecha, contando aninhamento.
  const abre = css.indexOf('{', inicio);
  let profundidade = 0;
  let fim = abre;
  for (let i = abre; i < css.length; i++) {
    if (css[i] === '{') profundidade++;
    if (css[i] === '}') {
      profundidade--;
      if (profundidade === 0) {
        fim = i;
        break;
      }
    }
  }

  const corpo = css.slice(abre + 1, fim);
  return [...corpo.matchAll(/^\s*(--[a-z0-9-]+)\s*:/gm)]
    .map((m) => m[1])
    .sort();
}

describe('paridade de tokens entre os temas', () => {
  const css = readFileSync(resolve(__dirname, 'index.css'), 'utf8');

  it(':root e .dark declaram exatamente o mesmo conjunto de tokens', () => {
    const claro = extrairTokens(css, ':root {');
    const escuro = extrairTokens(css, '.dark {');

    const soNoClaro = claro.filter((t) => !escuro.includes(t));
    const soNoEscuro = escuro.filter((t) => !claro.includes(t));

    expect({soNoClaro, soNoEscuro}).toEqual({soNoClaro: [], soNoEscuro: []});
  });

  it('define os tokens canônicos de superfície e texto', () => {
    const escuro = extrairTokens(css, '.dark {');
    for (const token of [
      '--surface-base',
      '--surface-panel',
      '--surface-raised',
      '--surface-input',
      '--surface-hairline',
      '--on-surface',
      '--on-surface-accent',
      '--on-surface-muted',
      '--on-surface-subtle',
      '--accent-positive',
      '--accent-negative',
    ]) {
      expect(escuro).toContain(token);
    }
  });
});
```

- [ ] **Step 2: Rodar e confirmar que falha**

```bash
node node_modules/vitest/vitest.mjs run src/index.spec.ts
```

Esperado: FALHA nos dois testes. Hoje `.dark` não declara nenhum `--surface-*`, `--on-surface-*`, `--brand` nem `--accent-*` — eles só existem em `:root`.

- [ ] **Step 3: Reescrever o bloco `:root` de `src/index.css`**

Substituir todo o conteúdo entre `:root {` e a chave que o fecha (hoje linhas 8 a 127) por:

```css
  :root {
    --font-body: 'Inter', 'Segoe UI', Arial, sans-serif;
    --font-heading: 'Manrope', 'Inter', 'Segoe UI', sans-serif;

    --radius: 0.5rem;

    /* ──────────────────────────────────────────────────────────────
     * PALETA CLARA — papel. Off-white morno, neutros na faixa quente
     * (hue 30–35) para não brigarem com o creme. O card sobe para
     * branco puro enquanto o fundo fica creme, então o card emerge do
     * fundo em vez de se confundir com ele.
     * Contrastes verificados pela fórmula da WCAG; ver
     * docs/design/paletas-globais.html.
     * ────────────────────────────────────────────────────────────── */
    --surface-base: 40 33% 98%;
    --surface-panel: 40 24% 96%;
    --surface-raised: 40 40% 100%;
    --surface-input: 40 20% 92%;
    --surface-hairline: 30 14% 12%;

    --on-surface: 30 14% 12%;
    --on-surface-accent: 230 60% 32%;
    --on-surface-muted: 33 9% 38%;
    --on-surface-subtle: 35 7% 50%;

    /* Marca: constante nos dois temas, idêntica ao azul do logo. */
    --brand: 230 100% 62%;
    --brand-strong: 230 90% 54%;
    --brand-foreground: 0 0% 100%;

    /* Vocabulário financeiro: alta e baixa. */
    --accent-positive: 158 76% 30%;
    --accent-negative: 351 72% 42%;

    /* Aviso e informação. --destructive é do shadcn e significa ação
       perigosa (excluir), não perda financeira — são conceitos
       diferentes que por acaso são vermelhos. */
    --warning: 32 90% 34%;
    --warning-foreground: 40 40% 100%;
    --info: 230 100% 62%;
    --info-foreground: 0 0% 100%;
    --success: 158 76% 30%;
    --success-foreground: 40 40% 100%;
    --destructive: 0 72% 45%;
    --destructive-foreground: 40 40% 100%;

    /* ──────────────────────────────────────────────────────────────
     * Tokens do shadcn. Derivam dos canônicos acima — é isto que faz
     * os 72 arquivos que usam bg-background, text-foreground e bg-card
     * mudarem de cor sem nenhuma alteração de código.
     * ────────────────────────────────────────────────────────────── */
    --background: 40 33% 98%;
    --foreground: 30 14% 12%;
    --card: 40 40% 100%;
    --card-foreground: 30 14% 12%;
    --popover: 40 40% 100%;
    --popover-foreground: 30 14% 12%;
    --primary: 230 100% 62%;
    --primary-foreground: 0 0% 100%;
    --secondary: 40 24% 96%;
    --secondary-foreground: 30 14% 12%;
    --muted: 40 24% 96%;
    --muted-foreground: 33 9% 38%;
    --accent: 40 24% 96%;
    --accent-foreground: 30 14% 12%;
    --border: 35 12% 88%;
    --input: 35 12% 88%;
    --ring: 230 100% 62%;

    --sidebar-background: 40 24% 96%;
    --sidebar-foreground: 30 14% 12%;
    --sidebar-primary: 230 100% 62%;
    --sidebar-primary-foreground: 0 0% 100%;
    --sidebar-accent: 40 33% 98%;
    --sidebar-accent-foreground: 30 14% 12%;
    --sidebar-border: 35 12% 88%;
    --sidebar-ring: 230 100% 62%;

    --chart-1: 230 100% 62%;
    --chart-2: 158 76% 30%;
    --chart-3: 32 90% 34%;
    --chart-4: 280 55% 45%;
    --chart-5: 351 72% 42%;

    /* ──────────────────────────────────────────────────────────────
     * PONTE TEMPORÁRIA. Os aliases --auth-* costumavam derivar de
     * --surface-*. Agora que --surface-* reage ao tema, essa derivação
     * deixaria as telas de autenticação claras — elas foram desenhadas
     * para fundo escuro. Até que as cinco telas sejam convertidas para
     * classes Tailwind, os aliases apontam para literais escuros.
     * Este bloco inteiro sai na última task do plano.
     * ────────────────────────────────────────────────────────────── */
    --auth-bg: hsl(224 30% 6%);
    --auth-panel: hsl(224 28% 8%);
    --auth-surface: hsl(223 24% 11%);
    --auth-input: hsl(225 20% 18%);
    --auth-brand: hsl(230 100% 62%);
    --auth-brand-strong: hsl(230 90% 54%);
    --auth-brand-soft-05: hsl(230 100% 62% / 0.05);
    --auth-brand-soft-10: hsl(230 100% 62% / 0.1);
    --auth-brand-soft-20: hsl(230 100% 62% / 0.2);
    --auth-brand-soft-40: hsl(230 100% 62% / 0.4);
    --auth-brand-soft-50: hsl(230 100% 62% / 0.5);
    --auth-text-main: hsl(228 90% 93%);
    --auth-text-main-alt: hsl(228 90% 93%);
    --auth-text-accent: hsl(228 100% 86%);
    --auth-text-muted: hsl(228 18% 72% / 0.6);
    --auth-text-body: hsl(228 18% 72% / 0.75);
    --auth-text-body-strong: hsl(228 18% 72% / 0.7);
    --auth-text-soft: hsl(228 18% 72% / 0.4);
    --auth-text-secondary: hsl(228 12% 55%);
    --auth-highlight: hsl(230 100% 62% / 0.12);
    --auth-highlight-soft: hsl(230 100% 62% / 0.08);
    --auth-highlight-mid: hsl(230 100% 62% / 0.07);
    --auth-highlight-subtle: hsl(230 100% 62% / 0.05);
    --auth-success-soft: hsl(158 84% 45% / 0.08);
    --auth-danger-soft: hsl(351 83% 61% / 0.12);
  }
```

**Atenção:** o teste de paridade só compara os nomes começando com `--`. Os aliases `--auth-*` estão em `:root` mas não em `.dark`, o que faria o teste falhar. Por isso o Step 4 os declara também em `.dark`, com os mesmos valores — eles são escuros nos dois temas de propósito, e somem juntos na Task 7.

- [ ] **Step 4: Reescrever o bloco `.dark` de `src/index.css`**

Substituir todo o conteúdo entre `.dark {` e a chave que o fecha por:

```css
  .dark {
    /* ──────────────────────────────────────────────────────────────
     * PALETA ESCURA — a mesma da landing. Preto-azulado quase neutro,
     * para o azul da marca virar acento raro em vez de banho de cor.
     * ────────────────────────────────────────────────────────────── */
    --surface-base: 224 30% 6%;
    --surface-panel: 224 28% 8%;
    --surface-raised: 223 24% 11%;
    --surface-input: 225 20% 18%;
    --surface-hairline: 0 0% 100%;

    --on-surface: 228 90% 93%;
    --on-surface-accent: 228 100% 86%;
    --on-surface-muted: 228 18% 72%;
    --on-surface-subtle: 228 12% 55%;

    --brand: 230 100% 62%;
    --brand-strong: 230 90% 54%;
    --brand-foreground: 0 0% 100%;

    --accent-positive: 158 84% 45%;
    --accent-negative: 351 83% 61%;

    --warning: 40 95% 60%;
    --warning-foreground: 224 30% 6%;
    --info: 230 100% 62%;
    --info-foreground: 0 0% 100%;
    --success: 158 84% 45%;
    --success-foreground: 224 30% 6%;
    --destructive: 351 70% 42%;
    --destructive-foreground: 228 90% 93%;

    --background: 224 30% 6%;
    --foreground: 228 90% 93%;
    --card: 223 24% 11%;
    --card-foreground: 228 90% 93%;
    --popover: 223 24% 11%;
    --popover-foreground: 228 90% 93%;
    --primary: 230 100% 62%;
    --primary-foreground: 0 0% 100%;
    --secondary: 224 28% 8%;
    --secondary-foreground: 228 90% 93%;
    --muted: 224 28% 8%;
    --muted-foreground: 228 18% 72%;
    --accent: 224 28% 8%;
    --accent-foreground: 228 90% 93%;
    --border: 225 18% 18%;
    --input: 225 18% 18%;
    --ring: 230 100% 62%;

    --sidebar-background: 224 28% 8%;
    --sidebar-foreground: 228 90% 93%;
    --sidebar-primary: 230 100% 62%;
    --sidebar-primary-foreground: 0 0% 100%;
    --sidebar-accent: 223 24% 11%;
    --sidebar-accent-foreground: 228 90% 93%;
    --sidebar-border: 225 18% 18%;
    --sidebar-ring: 230 100% 62%;

    --chart-1: 230 100% 62%;
    --chart-2: 158 84% 45%;
    --chart-3: 40 95% 60%;
    --chart-4: 280 65% 65%;
    --chart-5: 351 83% 61%;

    /* Ponte temporária — ver o comentário em :root. Sai na Task 7. */
    --auth-bg: hsl(224 30% 6%);
    --auth-panel: hsl(224 28% 8%);
    --auth-surface: hsl(223 24% 11%);
    --auth-input: hsl(225 20% 18%);
    --auth-brand: hsl(230 100% 62%);
    --auth-brand-strong: hsl(230 90% 54%);
    --auth-brand-soft-05: hsl(230 100% 62% / 0.05);
    --auth-brand-soft-10: hsl(230 100% 62% / 0.1);
    --auth-brand-soft-20: hsl(230 100% 62% / 0.2);
    --auth-brand-soft-40: hsl(230 100% 62% / 0.4);
    --auth-brand-soft-50: hsl(230 100% 62% / 0.5);
    --auth-text-main: hsl(228 90% 93%);
    --auth-text-main-alt: hsl(228 90% 93%);
    --auth-text-accent: hsl(228 100% 86%);
    --auth-text-muted: hsl(228 18% 72% / 0.6);
    --auth-text-body: hsl(228 18% 72% / 0.75);
    --auth-text-body-strong: hsl(228 18% 72% / 0.7);
    --auth-text-soft: hsl(228 18% 72% / 0.4);
    --auth-text-secondary: hsl(228 12% 55%);
    --auth-highlight: hsl(230 100% 62% / 0.12);
    --auth-highlight-soft: hsl(230 100% 62% / 0.08);
    --auth-highlight-mid: hsl(230 100% 62% / 0.07);
    --auth-highlight-subtle: hsl(230 100% 62% / 0.05);
    --auth-success-soft: hsl(158 84% 45% / 0.08);
    --auth-danger-soft: hsl(351 83% 61% / 0.12);
  }
```

- [ ] **Step 5: Atualizar `tailwind.config.ts`**

No objeto `colors`, dentro de `'on-surface'`, trocar a chave `secondary` por `subtle`:

```ts
        'on-surface': {
          DEFAULT: 'hsl(var(--on-surface) / <alpha-value>)',
          accent: 'hsl(var(--on-surface-accent) / <alpha-value>)',
          muted: 'hsl(var(--on-surface-muted) / <alpha-value>)',
          subtle: 'hsl(var(--on-surface-subtle) / <alpha-value>)',
        },
```

Nada mais muda nesse arquivo: `surface.hairline`, `positive` e `negative` já existem desde o redesign da landing.

- [ ] **Step 6: Corrigir os consumidores de `text-on-surface-secondary`**

A classe deixou de existir. Encontrar e trocar por `text-on-surface-subtle`:

```bash
grep -rn "on-surface-secondary" src --include=*.tsx
```

Para cada ocorrência, trocar `on-surface-secondary` por `on-surface-subtle`.

- [ ] **Step 7: Rodar os testes**

```bash
node node_modules/vitest/vitest.mjs run src/index.spec.ts
node node_modules/vitest/vitest.mjs run
node node_modules/typescript/bin/tsc -p tsconfig.app.json --noEmit
```

Esperado: os dois testes de paridade passam; a suíte inteira passa; typecheck com os oito erros pré-existentes e nenhum a mais.

- [ ] **Step 8: Commit**

```bash
git add src/index.css src/index.spec.ts tailwind.config.ts
git commit -m "feat(web): define the two global palettes with theme-reactive tokens"
```

Se o Step 6 alterou algum arquivo, adicione-o ao mesmo commit com caminho explícito.

---

### Task 3: Converter SignIn e WalletLoadingScreen

**Files:**
- Modify: `src/pages/SignIn.tsx` (23 ocorrências de `--auth-*`)
- Modify: `src/components/WalletLoadingScreen.tsx` (12 ocorrências)

**Interfaces:**
- Consumes: as classes Tailwind da Task 2 (`bg-surface`, `bg-surface-panel`, `bg-surface-raised`, `bg-surface-input`, `text-on-surface`, `text-on-surface-accent`, `text-on-surface-muted`, `text-on-surface-subtle`, `bg-brand`, `bg-brand-strong`, `bg-positive`, `bg-negative`) e o mapa de conversão das Global Constraints.
- Produces: nada que tasks posteriores consumam.

**A regra que mantém a tela escura:** como os tokens agora reagem ao tema, o container mais externo de cada tela convertida recebe a classe `dark`. É o mesmo mecanismo que a landing usará na Task 6. Sem isso, a tela ficaria clara no tema claro.

- [ ] **Step 1: Localizar o container raiz do SignIn**

```bash
grep -n "auth-bg" src/pages/SignIn.tsx
```

O elemento que usa `--auth-bg` como fundo é o container raiz. Adicione `dark` à sua `className` e converta o `style` para `bg-surface`.

Exemplo da forma final:

```tsx
      <div className="dark min-h-screen flex bg-surface">
```

- [ ] **Step 2: Converter as demais ocorrências do SignIn**

Para cada `style={{...}}` que contenha `var(--auth-X)`, remover a propriedade e adicionar a classe equivalente pelo mapa das Global Constraints. Quando o `style` ficar vazio, remover o atributo inteiro.

Exemplo de antes:

```tsx
<p style={{color: 'var(--auth-text-muted)'}} className="text-sm">
```

Depois:

```tsx
<p className="text-sm text-on-surface-muted/60">
```

Ao terminar, confirmar que não sobrou nenhuma:

```bash
grep -c "auth-" src/pages/SignIn.tsx
```

Esperado: `0`.

- [ ] **Step 3: Converter o WalletLoadingScreen**

Mesma operação em `src/components/WalletLoadingScreen.tsx`, incluindo `dark` no container raiz. Este arquivo também tem `bg-white/5` e `border-white/5` numa barra de progresso — trocar por `bg-surface-hairline/5` e `border-surface-hairline/5`, para a barra tirar a cor de token como o resto.

```bash
grep -c "auth-" src/components/WalletLoadingScreen.tsx
```

Esperado: `0`.

- [ ] **Step 4: Rodar os testes de autenticação**

```bash
node node_modules/vitest/vitest.mjs run src/pages/SignIn.spec.tsx
node node_modules/vitest/vitest.mjs run
```

Esperado: tudo verde. O `SignIn.spec.tsx` existente não deve precisar de nenhuma alteração — a conversão troca a forma de aplicar cor, não o comportamento nem os textos. **Se ele quebrar, é sinal de que a conversão mudou mais do que devia; investigue em vez de ajustar o teste.**

- [ ] **Step 5: Commit**

```bash
git add src/pages/SignIn.tsx src/components/WalletLoadingScreen.tsx
git commit -m "refactor(web): convert sign-in and loading screen to global tokens"
```

---

### Task 4: Converter Register e ForgotPassword

**Files:**
- Modify: `src/pages/Register.tsx` (34 ocorrências)
- Modify: `src/pages/ForgotPassword.tsx` (28 ocorrências)

**Interfaces:**
- Consumes: as classes da Task 2 e o mapa das Global Constraints.
- Produces: nada.

- [ ] **Step 1: Converter o Register**

Adicionar `dark` ao container raiz — o elemento que hoje usa `var(--auth-bg)` como fundo — e converter cada `style` com `var(--auth-X)` para a classe equivalente pelo mapa das Global Constraints. Quando um `style` ficar vazio, remover o atributo.

Exemplo de antes:

```tsx
<div style={{backgroundColor: 'var(--auth-panel)'}} className="rounded-xl p-6">
```

Depois:

```tsx
<div className="rounded-xl bg-surface-panel p-6">
```

Verificar:

```bash
grep -c "auth-" src/pages/Register.tsx
```

Esperado: `0`.

- [ ] **Step 2: Converter o ForgotPassword**

Mesma operação, mesmo mapa, incluindo `dark` no container raiz.

```bash
grep -c "auth-" src/pages/ForgotPassword.tsx
```

Esperado: `0`.

- [ ] **Step 3: Rodar os testes**

```bash
node node_modules/vitest/vitest.mjs run src/pages/Register.spec.tsx src/pages/ForgotPassword.spec.tsx
node node_modules/vitest/vitest.mjs run
```

Esperado: verde, sem alteração nos specs. Se algum quebrar, investigue a conversão.

- [ ] **Step 4: Commit**

```bash
git add src/pages/Register.tsx src/pages/ForgotPassword.tsx
git commit -m "refactor(web): convert register and forgot-password to global tokens"
```

---

### Task 5: Converter ResetPassword

**Files:**
- Modify: `src/pages/ResetPassword.tsx` (57 ocorrências — o arquivo com mais conversões do plano)

**Interfaces:**
- Consumes: as classes da Task 2 e o mapa das Global Constraints.
- Produces: nada.

Esta task existe sozinha porque o arquivo tem 716 linhas e mais conversões que qualquer outro. Juntá-lo a outra tela produziria um diff difícil de revisar com atenção.

- [ ] **Step 1: Converter**

Adicionar `dark` ao container raiz e converter as 57 ocorrências pelo mapa das Global Constraints, removendo atributos `style` que ficarem vazios.

```bash
grep -c "auth-" src/pages/ResetPassword.tsx
```

Esperado: `0`.

- [ ] **Step 2: Rodar os testes**

```bash
node node_modules/vitest/vitest.mjs run src/pages/ResetPassword.spec.tsx
node node_modules/vitest/vitest.mjs run
node node_modules/typescript/bin/tsc -p tsconfig.app.json --noEmit
```

Esperado: verde; typecheck com os oito erros pré-existentes.

- [ ] **Step 3: Confirmar que nenhum consumidor de `--auth-*` sobrou**

```bash
grep -rn "auth-" src --include=*.tsx
```

Esperado: nenhuma saída. Este é o pré-requisito para a Task 7 poder remover a ponte.

- [ ] **Step 4: Commit**

```bash
git add src/pages/ResetPassword.tsx
git commit -m "refactor(web): convert reset-password to global tokens"
```

---

### Task 6: Landing sobre o tema global, e as cores fixas restantes

**Files:**
- Modify: `src/pages/Landing.tsx`
- Modify: `src/index.css` (remoção do bloco `.landing-root`)
- Modify: `src/components/ui/custom-tooltip.tsx`
- Modify: `src/components/ui/feature-tour-modal.tsx`
- Modify: `src/pages/AIInsights.tsx`

**Interfaces:**
- Consumes: os tokens da Task 2.
- Produces: nada.

- [ ] **Step 1: Trocar `.landing-root` por `dark` na página**

Em `src/pages/Landing.tsx`, o container externo usa a classe `landing-root`. Trocar por `dark`:

```tsx
    <div ref={containerRef} className="dark min-h-screen bg-surface font-body">
```

O comentário acima do componente explica o `.landing-root`; substituir por:

```tsx
/**
 * A classe `dark` mantém a landing escura independentemente do tema escolhido
 * no app. Antes isso era feito por um escopo próprio (.landing-root) que
 * redefinia as superfícies; agora "escuro" é um tema global e a landing apenas
 * o declara.
 */
```

- [ ] **Step 2: Remover o bloco `.landing-root` de `src/index.css`**

Apagar o bloco inteiro, incluindo o comentário acima dele (hoje por volta das linhas 183–195).

- [ ] **Step 3: Corrigir `custom-tooltip.tsx`**

Trocar `text-white` por `text-popover-foreground` e `border-white/10` por `border-surface-hairline/10`. O fundo do tooltip vem de `--popover`, então o texto precisa vir do par correspondente — com `text-white` fixo, o tooltip ficaria branco sobre branco no tema claro.

- [ ] **Step 4: Corrigir `feature-tour-modal.tsx`**

Os dois botões com `border-slate-500 bg-transparent text-white hover:bg-slate-700` herdam o fundo do modal. Trocar por:

```tsx
"border-surface-hairline/20 bg-transparent text-on-surface hover:bg-surface-hairline/10"
```

O botão com `bg-emerald-500 text-white hover:bg-emerald-600` fica como está: o fundo é uma cor fixa que não vem de token, então o branco continua correto.

- [ ] **Step 5: Corrigir `AIInsights.tsx`**

Na linha 539, o ícone dentro do círculo que reage ao hover:

```tsx
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary transition-colors">
                      <ArrowRight className="h-4 w-4 text-primary group-hover:text-white transition-colors" />
```

O fundo do hover é `bg-primary`, então o par correto é `text-primary-foreground` — não `white` fixo. Trocar apenas a classe do ícone:

```tsx
                      <ArrowRight className="h-4 w-4 text-primary group-hover:text-primary-foreground transition-colors" />
```

O `<div>` pai fica como está.

- [ ] **Step 6: Rodar tudo**

```bash
node node_modules/vitest/vitest.mjs run
node node_modules/typescript/bin/tsc -p tsconfig.app.json --noEmit
node node_modules/eslint/bin/eslint.js src
```

Esperado: suíte verde, oito erros de tipo pré-existentes, lint sem erros novos.

- [ ] **Step 7: Commit**

```bash
git add src/pages/Landing.tsx src/index.css src/components/ui/custom-tooltip.tsx src/components/ui/feature-tour-modal.tsx src/pages/AIInsights.tsx
git commit -m "refactor(web): move landing to the global dark theme and drop fixed colors"
```

---

### Task 7: Remover a ponte e fechar

**Files:**
- Modify: `src/index.css` (remoção dos blocos `--auth-*`)
- Modify: `docs/design/paletas-globais.html` (se algum valor divergiu)

**Interfaces:**
- Consumes: a ausência de consumidores de `--auth-*`, garantida na Task 5.
- Produces: o estado final da etapa.

- [ ] **Step 1: Confirmar que a ponte não tem consumidor**

```bash
grep -rn "auth-" src --include=*.tsx --include=*.ts
```

Esperado: nenhuma saída. **Se houver qualquer resultado, pare e reporte** — remover a ponte com um consumidor vivo deixa a tela sem cor.

- [ ] **Step 2: Remover os aliases dos dois blocos**

Em `src/index.css`, apagar o bloco de comentário "PONTE TEMPORÁRIA" e todas as linhas `--auth-*` de `:root`, e o bloco equivalente de `.dark`.

- [ ] **Step 3: Confirmar que a paridade continua valendo**

```bash
node node_modules/vitest/vitest.mjs run src/index.spec.ts
```

Esperado: PASS. Como os aliases saíram dos dois blocos ao mesmo tempo, a paridade se mantém.

- [ ] **Step 4: Conferir a documentação visual**

Abrir `docs/design/paletas-globais.html` e comparar cada valor da tabela com o que está em `src/index.css`. Se algum divergiu durante a implementação, atualizar o HTML — ele é a referência visual da decisão de cor e não pode mentir.

- [ ] **Step 5: Verificação final**

```bash
node node_modules/vitest/vitest.mjs run
node node_modules/typescript/bin/tsc -p tsconfig.app.json --noEmit
node node_modules/eslint/bin/eslint.js src
grep -rn "landing-root\|auth-" src --include=*.tsx --include=*.ts --include=*.css
```

Esperado: suíte verde; oito erros de tipo pré-existentes; lint sem erros; o `grep` sem nenhuma saída.

- [ ] **Step 6: Commit**

```bash
git add src/index.css docs/design/paletas-globais.html
git commit -m "chore(web): remove the auth token bridge"
```

---

## Verificação de conclusão

Antes de declarar a etapa pronta, com a saída do comando em mãos — não por suposição:

- [ ] `node node_modules/vitest/vitest.mjs run` — suíte inteira verde
- [ ] `node node_modules/typescript/bin/tsc -p tsconfig.app.json --noEmit` — exatamente os oito erros pré-existentes
- [ ] `node node_modules/eslint/bin/eslint.js src` — sem erros
- [ ] `grep -rn "landing-root\|auth-" src` — sem saída
- [ ] `git status --porcelain` — nenhum arquivo do plano pendente, e o trabalho em progresso listado nas Global Constraints ainda intocado

## Conferência visual — obrigatória, e só um humano pode fazer

Nenhum subagente deste plano tem navegador. 72 arquivos mudam de cor sem uma linha de código alterada, então **alguém precisa olhar** antes do merge.

Rodar `npm run dev` e conferir seis telas **nos dois temas**, alternando pelo toggle da sidebar:

1. Dashboard
2. Carteira (com gráficos — é onde o tooltip corrigido na Task 6 aparece)
3. Uma tela de formulário (Adicionar ativo)
4. Configurações
5. Login (deve continuar escura nos dois temas)
6. Landing (deve continuar escura nos dois temas)

O que procurar: texto sem contraste suficiente, borda que sumiu, card que não se distingue do fundo, e se o creme do tema claro parece intencional ou sujo.
