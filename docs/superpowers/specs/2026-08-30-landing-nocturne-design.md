# Landing — fidelidade Nocturne (CTAs, toggle de tema, profundidade adaptativa)

**Data:** 2026-08-30
**Escopo:** `web` apenas.
**Branch:** `feature/landing-nocturne-redesign`
**Depende de:** `feature/design-foundation-nocturne` (PR #102, ainda não mergeado — esta branch nasce dela, não de `develop`, pra herdar tokens Nocturne e ícones Phosphor).
**Referência:** `design_handoff_trackerr/Trackerr Landing.dc.html` + README.md (seção "1. Landing")

Segunda etapa do redesign. A Landing já existe e é modular (`src/components/landing/sections/*`), já herda a paleta Nocturne automaticamente da Etapa 1 (consome `bg-surface`, `text-on-surface`, `bg-brand` etc., que já mudaram de valor). Esta etapa fecha 3 gaps pontuais de fidelidade — não é um redesenho do zero.

## 1. Objetivo

- CTAs primários preenchidos → contorno (o handoff nunca preenche o botão primário).
- Adicionar o toggle de tema (componente já existe, só falta plugar na nav).
- Adicionar a seção "profundidade adaptativa" que hoje não existe.

## 2. Estado atual

`Landing.tsx` monta: `LandingNav → HeroSection → MarketTape → ProblemSection → ProductSection → HowItWorksSection → TrustSection → PricingSection → FaqSection → FinalCtaSection → LandingFooter`.

5 CTAs usam `bg-brand text-brand-foreground hover:bg-brand-strong` (preenchido):
- `src/components/landing/sections/HeroSection.tsx:86-94` (CTA primário do hero)
- `src/components/landing/sections/LandingNav.tsx:58-62` ("Criar conta")
- `src/components/landing/sections/FinalCtaSection.tsx:30-38` (CTA de fechamento)
- `src/components/landing/sections/PricingSection.tsx:144-153` e `:154-166` (CTA do plano em destaque, dois branches condicionais com a mesma classe)

O CTA secundário do Hero (`HeroSection.tsx:95-99`) já usa um outline, mas com borda neutra (`border-surface-hairline/[0.12]`) — é o padrão certo pra secundário, não pra primário. Primário precisa de borda **de acento** pra manter hierarquia visual sem preencher.

`LandingNav.tsx` não importa nem renderiza `ThemeToggle` (`src/components/ThemeToggle.tsx`, já existe e já funciona no app logado).

Nenhuma seção de "profundidade adaptativa" existe hoje (confirmado por grep em `src/components/landing/sections/`).

## 3. Decisões tomadas

| Questão | Decisão |
|---|---|
| CTAs primários | Trocam pra outline de acento: `border border-brand bg-transparent text-brand hover:bg-brand/10 transition-colors`. Mantém `text-brand-foreground`→`text-brand` (cor do texto = cor da borda, já que não há mais fundo colorido pra contrastar). |
| CTA secundário do Hero | Não muda — já está correto (outline neutro). |
| Toggle de tema | Entra em `LandingNav.tsx`, ao lado de "Entrar"/"Criar conta", reaproveitando `ThemeToggle.tsx` sem modificação. |
| Seção de profundidade adaptativa | Nova, `AdaptiveDepthSection.tsx`, entre `TrustSection` e `PricingSection` (ordem do handoff: prova → profundidade adaptativa → planos). Conteúdo ilustrativo/mockado — o app logado ainda não tem esse conceito implementado (é do App shell, etapa futura). |

## 4. CTAs — mudança exata

Classe nova, idêntica nos 5 locais (extrai pra uma constante evitaria duplicação, mas os arquivos já duplicam a classe preenchida hoje da mesma forma — manter o padrão existente do arquivo, só trocar a string):

```
antes: "bg-brand text-brand-foreground hover:bg-brand-strong"
depois: "border border-brand bg-transparent text-brand hover:bg-brand/10 transition-colors"
```

Em `HeroSection.tsx:89` e `FinalCtaSection.tsx:34` a classe já tem `group` e outras utilities no mesmo `className` — só a substring de cor muda, o resto (`group`, `transition-colors` se já presente) fica. Em `PricingSection.tsx:149` e `:161` a substituição é dentro do template string condicional (`plan.featured ? '...' : '...'`) — só o branch `plan.featured` muda.

## 5. Toggle de tema — mudança exata

Em `LandingNav.tsx`, importar `ThemeToggle` de `@/components/ThemeToggle` e renderizar entre os links de navegação e o par de botões "Entrar"/"Criar conta" (ou logo à esquerda deles, dentro do mesmo `<div className="flex items-center gap-2">`), sem props adicionais — o componente já gerencia estado e persistência sozinho.

## 6. Seção "Profundidade adaptativa" — especificação

**Arquivo novo:** `src/components/landing/sections/AdaptiveDepthSection.tsx`
**Teste novo:** `src/components/landing/sections/AdaptiveDepthSection.spec.tsx`

Padrão a seguir (mesmo dos outros arquivos de seção): componente funcional, sem props, `id` na seção raiz pra âncora de navegação (`id="profundidade"` — não conflita com `navLinks` de `LandingNav.tsx`, que não referencia essa seção, então não precisa entrar no menu superior).

Conteúdo (baseado no README do handoff, seção "Profundidade adaptativa"):
- Título + subtítulo explicando o conceito ("A verdade dos números nunca muda — só o vocabulário e a densidade").
- Segmented control com 3 opções: Iniciante / Intermediário / Avançado (usa `useState<'iniciante' | 'intermediario' | 'avancado'>`, default `'intermediario'`).
- Card de exemplo (um "mock" de KPI de dashboard) que muda de conteúdo conforme o nível selecionado:
  - **Iniciante:** vocabulário simples, poucos números. Ex.: rótulo "Como está indo", valor "+8,2% este ano", subtexto "Sua carteira está subindo mais que a poupança."
  - **Intermediário:** vocabulário técnico moderado. Ex.: rótulo "Retorno acumulado", valor "+8,2%", subtexto "12,4 p.p. acima do CDI no período."
  - **Avançado:** vocabulário técnico denso, mais métricas. Ex.: rótulo "Sharpe / Retorno acum.", valor "1,84 / +8,2%", subtexto "Vol. anualizada 11,2% · benchmark CDI · janela 12m."
- Componentes reaproveitados: `Button`/segmented control no mesmo padrão visual de outros toggles do app (ver `src/components/ui/button.tsx`, variantes já existentes — não criar componente de segmented-control novo, montar com `Button` + `variant` condicional, mesmo padrão do App (`app-sidebar.tsx` usa lógica parecida pra item ativo)).

## 7. Testes

- `AdaptiveDepthSection.spec.tsx`: renderiza os 3 níveis, clica em cada botão do segmented control, confirma que o texto do card muda pra cada nível (query por texto, não por classe).
- Specs existentes de `HeroSection.spec.tsx`, `PricingSection.spec.tsx` etc. — rodar sem alteração, confirmar que não quebram com a troca de classe (não deveriam, pois não fazem assert de classe CSS, mas checar).
- `npm run type-check`, `npm run lint`, `npm run test:unit`, `npm run build`.
- Verificação visual manual: abrir `/`, alternar tema pelo novo toggle, conferir os 5 CTAs em contorno e a seção nova, comparar com `Trackerr Landing.dc.html`.

## 8. Fora de escopo

- Reordenar ou redesenhar qualquer outra seção existente.
- Qualquer mudança em Auth, App shell ou nas 17 telas do produto.
- Adicionar a seção nova ao menu de navegação do header.
