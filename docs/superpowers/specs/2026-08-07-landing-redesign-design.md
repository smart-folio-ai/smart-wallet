# Redesign da Landing Page — Trackerr

**Data:** 2026-08-07
**Escopo:** `web` apenas. Nenhuma alteração em `server` ou `trackerr-ia`.
**Branch:** `web/feature/landing-redesign`

---

## 1. Objetivo

Elevar a landing page do Trackerr ao padrão visual de plataforma de investimentos
profissional, na linha "fintech premium" (Stripe / Linear / Ramp): muito respiro,
tipografia grande e apertada, superfícies escuras neutras, movimento refinado
coreografado com GSAP.

O redesign cobre aparência, estrutura de seções e copy. É a primeira etapa de um
redesign maior que depois alcançará a aplicação interna; por isso todas as
decisões de token aqui são aditivas e não podem quebrar as páginas existentes.

## 2. Persona e promessa

**Persona:** investidor pessoa física que já tem carteira montada — 10 a 50 ativos
espalhados entre corretoras, controle em planilha, sofrimento anual com IR,
sem visibilidade de concentração de risco.

Ele não quer aprender a investir. Quer parar de gastar o domingo atualizando
planilha e quer que alguém aponte o que exige atenção.

**Promessa central:** sua carteira inteira consolidada, o imposto calculado, e
uma IA dizendo onde agir primeiro.

**Regra de copy:** falar do problema do usuário, não das nossas features. Verbo
no imperativo, número concreto quando existir, zero jargão de marketing
("revolucionário", "inovador", "disruptivo" são proibidos).

## 3. Sistema visual

### 3.1 Superfícies

O fundo atual é navy médio saturado (`--surface-base: 222.2 55.1% 9.6%`) com um
glow radial azul grande no hero. Isso lê como "template", não como produto caro.

Mudança:

- Novos valores de superfície escurecidos e dessaturados, em preto-azulado quase
  neutro: base em `~224 30% 6%`, painéis apenas 2–3% mais claros.
- O glow radial gigante do hero é removido.
- Entra `GridBackdrop`: malha de linhas de 1px a ~4% de opacidade, com máscara
  radial que faz fade nas bordas.

Fundo neutro faz o azul da marca virar acento raro em vez de banho de cor — é o
que produz a sensação de sofisticação.

**Escopo dos novos valores — decisão importante.** Os tokens `--surface-*` de hoje
são consumidos também pelas quatro páginas de autenticação, através dos aliases
`--auth-bg`, `--auth-panel` e `--auth-surface`. Redefini-los em `:root` mudaria a
aparência dessas páginas, o que está fora do escopo desta etapa.

Portanto os valores escurecidos são aplicados **escopados à landing**, via um
seletor de raiz próprio (`.landing-root`) que redefine `--surface-base`,
`--surface-panel`, `--surface-raised` e `--surface-hairline` apenas dentro da
árvore da landing. O `:root` global permanece intocado. Na etapa seguinte do
redesign — quando a aplicação interna for tratada — a decisão de promover esses
valores para `:root` será tomada com o app inteiro em vista.

### 3.2 Cor

`--brand`, `--brand-strong` e `--brand-foreground` permanecem inalterados. Nenhuma
página existente muda de cor.

Tokens novos (aditivos, em `:root` de `src/index.css`):

| Token | Uso |
|---|---|
| `--accent-positive` | Variação positiva de preço, ganhos (esmeralda) |
| `--accent-negative` | Variação negativa de preço, perdas (rosa/vermelho) |
| `--surface-hairline` | Bordas de 1px de baixíssimo contraste |

Hoje a landing usa `emerald-400` e `amber-400` hardcoded nos componentes; esses
usos migram para os tokens novos.

Bordas: `border-brand/15` (azulado) é substituído por hairlines neutros.
Sombras coloridas (`shadow-brand/30`, `shadow-brand/10`) são removidas — em fundo
escuro elas parecem plástico. Elevação passa a vir de borda + gradiente interno sutil.

### 3.3 Tipografia

Famílias mantidas: Manrope (heading) e Inter (body), já carregadas.

- Headline do hero: `clamp(2.5rem, 6vw, 4.5rem)`, `letter-spacing: -0.03em`,
  `line-height: 0.95`.
- H2 de seção: `clamp(1.875rem, 3.5vw, 3rem)`, mesmo tracking negativo.
- Corpo: 17–18px com `line-height: 1.7`.
- Todo número financeiro usa `font-variant-numeric: tabular-nums` — obrigatório,
  senão os contadores animados causam reflow horizontal.

### 3.4 Componentes-base

Ficam em `src/components/landing/ui/`. **Não** alteram `src/components/ui/`
(shadcn), que continua servindo o app.

- `Section` — espaçamento vertical consistente e largura máxima
- `Eyebrow` — label pequeno acima do título
- `GlassPanel` — card padrão da landing (hairline + gradiente interno)
- `Ticker` — número com tabular-nums, animável por `useCountUp`
- `GridBackdrop` — malha de fundo com máscara

## 4. Estrutura de seções

Nove seções, contra seis hoje:

| # | Seção | Função |
|---|---|---|
| 1 | Hero | Promessa + prova visual do produto |
| 2 | Faixa de mercado | Ticker contínuo — sinal de sistema vivo |
| 3 | O problema | Espelhar a dor: planilha, corretoras espalhadas, IR |
| 4 | Produto (3 blocos) | Carteira consolidada · IA que prioriza · Fiscal resolvido |
| 5 | Como funciona | 3 passos: conectar → analisar → decidir |
| 6 | Confiança | B3+NYSE, tempo real, LGPD, AES-256 |
| 7 | Preços | 3 planos, Premium destacado |
| 8 | FAQ | Objeções: segurança, corretoras suportadas, cancelamento |
| 9 | CTA final + rodapé | Rodapé completo: produto, empresa, legal, social |

## 5. Copy

### 5.1 Hero

- **Eyebrow:** Gestão de carteira com IA
- **H1:** Sua carteira inteira. Sem planilha, sem surpresa no IR.
- **Sub:** O Trackerr consolida seus ativos de todas as corretoras, calcula seu
  imposto e usa IA para te dizer o que exige atenção agora — não mais um
  relatório para você interpretar.
- **CTA primário:** Começar grátis → `/register`
- **CTA secundário:** Ver como funciona → âncora `#produto`
- **Micro-prova:** Grátis até 10 ativos · Sem cartão de crédito

### 5.2 Problema

- **H2:** Você não tem um problema de investimento. Tem um problema de controle.
- Três cartões:
  - "Ativos em 3 corretoras diferentes" — nenhuma delas mostra o quadro completo.
  - "O IR vira um fim de semana perdido" — apuração manual, medo de errar.
  - "Descobre a concentração de risco tarde demais" — quando o prejuízo já veio.

### 5.3 Produto

Três blocos, cada um com título, parágrafo e mockup animado:

1. **Carteira consolidada** — todas as corretoras num só lugar, com alocação real
   por ativo, setor e classe.
2. **IA que prioriza** — não é um relatório: é uma lista do que fazer, ordenada.
3. **Fiscal resolvido** — apuração mensal, DARF calculada, prejuízo compensado.

### 5.4 Demais seções

Como funciona, confiança e preços reaproveitam a substância de
`landing-data.ts` (workflowSteps, trustStats, planItems), com textos revisados
para o novo tom. FAQ é conteúdo novo, com no mínimo quatro perguntas cobrindo
segurança de dados, corretoras suportadas, cancelamento e o que o plano grátis
inclui.

## 6. Mockups de produto

Cada mockup é um componente React com dados fictícios — não são screenshots.
Motivo: são animáveis com GSAP, não envelhecem quando a UI do app mudar (e o app
ainda será redesenhado), e não exigem pipeline de captura.

Ficam em `src/components/landing/mockups/`:

- `PortfolioMockup` — painel de carteira: donut de alocação + lista de posições
  com variação diária.
- `AiAlertMockup` — card de alerta priorizado, ex.: "PETR4 = 23% da carteira,
  acima do seu limite de 15%".
- `TaxMockup` — apuração mensal com DARF calculada e prejuízo compensado.

Os dados fictícios ficam em `landing-data.ts`, nunca inline nos componentes.

## 7. Movimento

**Filosofia:** o movimento dirige o olhar e sugere dados vivos. Se o usuário
*nota* a animação, ela falhou. Durações de 0.4–0.8s, ease `power3.out`,
deslocamentos de 16–24px. Nada de bounce ou elastic.

Biblioteca: **GSAP apenas** (já é dependência do projeto). three.js e anime.js
foram avaliados e descartados — o estilo escolhido não pede WebGL, e uma segunda
biblioteca de animação seria redundância.

### 7.1 Por seção

- **Hero** — timeline de entrada em cascata (eyebrow → headline por linha → sub →
  CTAs → painel), ~1.2s. Painel entra com leve rotação em perspectiva. A linha do
  gráfico se desenha via `strokeDashoffset`. Grid com parallax de 30px.
- **Faixa de mercado** — loop infinito com `gsap.to` + `modifiers` (o atual usa CSS
  e tem emenda visível). Pausa no hover. Preços piscam ocasionalmente em
  positivo/negativo.
- **KPIs e números** — contagem de 0 ao valor ao entrar na viewport (`useCountUp`).
- **Produto** — a seção fica pinada enquanto os três mockups trocam conforme o
  scroll (`ScrollTrigger` com `pin` + `scrub`). Em telas < 1024px vira
  empilhamento simples, sem pin.
- **Preços** — cards escalonados; o Premium sobe 8px e ganha borda luminosa.
- **Global** — hairlines de seção desenhando da esquerda para a direita; nav ganha
  fundo com blur após 40px de scroll; magnetic hover nos CTAs primários (desktop).

### 7.2 Regras inegociáveis

- `prefers-reduced-motion: reduce` desliga todo efeito e mantém o conteúdo
  **visível** — nunca esconder conteúdo sem restaurá-lo.
- Só `transform` e `opacity` são animados. Proibido animar `width`, `height`,
  `top`, `left`, `filter`.
- Pin, parallax e magnetic hover apenas a partir de 1024px, via `gsap.matchMedia()`.
- Todo efeito dentro de `gsap.context()` com `revert()` no unmount — a aplicação é
  SPA e não pode vazar ScrollTrigger entre rotas.

## 8. Arquitetura de arquivos

```
src/components/landing/
  ui/          Section, Eyebrow, GlassPanel, Ticker, GridBackdrop
  mockups/     PortfolioMockup, AiAlertMockup, TaxMockup
  sections/    Hero, MarketTape, Problem, Product, HowItWorks,
               Trust, Pricing, Faq, FinalCta, LandingNav, LandingFooter
  motion/      useGsapReveal (existente, estendido), useCountUp,
               useMarquee, usePinnedSequence, useMagnetic
  landing-data.ts
```

Regras:

- Um arquivo por seção, nenhum acima de ~150 linhas.
- `useGsapReveal.ts` é **movido** para `motion/`, preservando a API atual
  (`useGsapReveal`, `useGsapParallax`) e a lógica de `ensureScrollTrigger` — que já
  trata jsdom/SSR corretamente e não deve ser reescrita.
- `MarketChart` é reaproveitado, com o desenho de linha animado adicionado.
- Todo dado textual vive em `landing-data.ts`, não hardcoded em JSX.

## 9. O que não muda

- `src/components/ui/` (shadcn) — intocado.
- Páginas do app (dashboard, auth, admin, settings) — intocadas.
- Tokens existentes em `:root` e `.dark` — nenhum valor alterado. As mudanças são
  adições (`--accent-positive`, `--accent-negative`, `--surface-hairline`) mais um
  bloco `.landing-root` que redefine as superfícies apenas dentro da landing
  (ver 3.1).
- Páginas de autenticação — os aliases `--auth-*` continuam derivando dos valores
  globais e não mudam.
- `server` e `trackerr-ia` — intocados.

## 10. Testes e verificação

- `src/pages/Landing.spec.tsx` é reescrito junto com o copy. Ele valida os
  elementos-âncora da nova landing (headline, CTAs, presença dos três blocos de
  produto, preços, FAQ). O teste não é afrouxado para passar.
- Teste novo garantindo que, com `prefers-reduced-motion: reduce`, o conteúdo
  permanece visível.
- Comandos obrigatórios antes de declarar conclusão: `npm run type-check`,
  `npx vitest run`, `npm run lint`.
- Verificação manual: rodar a aplicação e conferir o resultado em desktop e
  mobile, incluindo o comportamento sem pin abaixo de 1024px.

## 11. Critérios de aceite

- A landing renderiza as nove seções na ordem definida.
- O copy do hero e da seção de problema corresponde ao especificado na seção 5.
- Nenhuma página existente do app muda de aparência.
- Todas as animações respeitam `prefers-reduced-motion`.
- Nenhum ScrollTrigger permanece ativo após navegar para fora da landing.
- `type-check`, `vitest` e `lint` passam.
- Nenhuma dependência nova é adicionada ao `package.json`.
