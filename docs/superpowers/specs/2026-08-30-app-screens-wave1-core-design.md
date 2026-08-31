# App Screens Wave 1 — Core Financial Screens (Nocturne fidelity)

**Data:** 2026-08-30
**Escopo:** `web` apenas.
**Branch:** `feature/app-screens-wave1-core`
**Depende de:** `develop` (fundação #102, Landing #103, Auth #104, App shell #105, Auth pixel-fidelity #106 já mergeados).
**Referência:** `design_handoff_trackerr/Trackerr App.dc.html` (seções `isDashboard`, `isPortfolio`, `isDividends`, `isAsset`, `isTransactions`, `isAdd`)

Primeira onda do redesign completo das telas do app. Cobre as 6 telas financeiras core. **Toda lógica (hooks, react-query, API calls, utils) é preservada — apenas o JSX retornado muda.**

---

## 1. Objetivo

Substituir o JSX das 6 telas listadas abaixo para refletir pixel-a-pixel o handoff Nocturne. Extrair 5 primitivos visuais compartilhados antes de reimplementar as telas para evitar duplicação.

---

## 2. Componentes compartilhados (extrair primeiro)

Todos em `src/components/shared/`. Não sobrescrevem nenhum componente existente.

### 2.1 `KpiCard`

```tsx
interface KpiCardProps {
  label: string;
  value: string;
  delta?: string;
  deltaStyle?: string; // CSS inline style string para cor do delta
  sub?: string;
  tooltip?: { title: string; body: string; formula?: string };
}
```

Estilo: `border: 1px solid var(--hair); border-radius: 8px; padding: 14px 16.8px; background: var(--card); position: relative`

Label: `font-size: 10.5px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--color-neutral-600)`

Valor: `font-family: var(--font-heading); font-size: 23px; font-weight: 600; letter-spacing: -0.02em; margin-top: 8.4px; font-variant-numeric: tabular-nums`

Tooltip (popover absoluto, `position: absolute; top: 34px; z-index: 60; width: 292px`): aparece no hover/focus do botão `ph-fill ph-info` (15×15px).

### 2.2 `SectionHeader`

```tsx
interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode; // botão ou controle à direita
}
```

Padding: `14px 16.8px`. Border-bottom: `1px solid var(--hair-soft)`. Título: `font-family: var(--font-heading); font-size: 14px; font-weight: 600`. Subtítulo: `font-size: 11px; color: var(--color-neutral-600); margin-top: 2px`.

### 2.3 `AiInsightBanner`

```tsx
interface AiInsightBannerProps {
  text: string;
  meta?: string;
  actionLabel?: string;
  onAction?: () => void;
}
```

Background: `linear-gradient(100deg, rgba(var(--rgb-accent-deep),0.42), rgba(var(--rgb-surf),0.30))`. Border: `1px solid rgba(145,132,217,0.28); border-radius: 8px; padding: 11.2px 16.8px`. Ícone: `ph-fill ph-sparkle`, `font-size: 16px; color: var(--color-accent-300)`. Botão: `height: 26px; padding: 0 8.4px; border: 1px solid var(--hair); border-radius: 6px; background: transparent; color: var(--color-neutral-400); font-size: 11px`.

### 2.4 `PeriodSelector`

```tsx
interface PeriodSelectorProps {
  periods: Array<{ label: string; value: string }>;
  value: string;
  onChange: (v: string) => void;
}
```

Container: `display: flex; padding: 2.8px; gap: 2.8px; border: 1px solid var(--hair); border-radius: 8px`. Botão ativo: `background: var(--card); color: var(--color-neutral-100); border-radius: 6px; box-shadow: 0 1px 3px rgba(0,0,0,0.18)`. Botão inativo: `background: transparent; color: var(--color-neutral-500)`. Ambos: `height: 28px; padding: 0 10px; font-size: 12px; border: none; cursor: pointer`.

### 2.5 `DataTable`

```tsx
interface DataTableProps {
  columns: Array<{ label: string; align?: 'left' | 'right'; style?: string }>;
  children: React.ReactNode; // <tbody> rows
  minWidth?: number; // default 600
}
```

`<table style="width: 100%; min-width: {minWidth}px; border-collapse: collapse; font-size: 12.5px">`. `<th>`: `padding: 9.8px 16.8px; text-align: {align}; font-size: 10.5px; font-weight: 500; letter-spacing: 0.08em; text-transform: uppercase; color: var(--color-neutral-600); white-space: nowrap`. `<tr>`: `border-top: 1px solid var(--hair-soft)` + hover `background: rgba(145,132,217,0.06)`.

### 2.6 `src/components/shared/index.ts` (barrel)

```ts
export { KpiCard } from './KpiCard';
export { SectionHeader } from './SectionHeader';
export { AiInsightBanner } from './AiInsightBanner';
export { PeriodSelector } from './PeriodSelector';
export { DataTable } from './DataTable';
```

---

## 3. Dashboard (`src/pages/Index.tsx`)

**Preservar:** toda lógica de `useDashboardSummary`, `useAdaptiveLevel`, `useAuth`, cálculos de KPI, summary, formatação de moeda.

**Layout do JSX retornado** (substituição completa do return):

```
<div class="flex flex-col gap-[16.8px]">
  1. <AiInsightBanner> — texto de `levelHint`, meta de `levelMeta`, botão "Como a IA decidiu"
  2. <div class="grid grid-cols-4 gap-[11.2px]">
       4× <KpiCard> — Patrimônio total, P&L do período, Dividendos recebidos, Beta
     </div>
  3. {level !== 'iniciante' && <QuantBar>} — 5 cols: Sharpe, Volatilidade, Max Drawdown, Alfa, VaR 95%
     (QuantBar: grid 5 colunas, `background: var(--surf-3)`, separados por `1px solid var(--hair-soft)`)
  4. <div class="grid gap-[16.8px]" style="grid-template-columns: minmax(0,1.9fr) minmax(0,1fr)">
       <section> Evolução patrimonial (gráfico linha base-100, legenda, <PeriodSelector>) </section>
       <section> Alocação (donut + legenda lista) </section>
     </div>
  5. <section> IA Insights — 3 cards horizontais </section>
  6. <section> Dividendos próximos — 4 cards horizontais </section>
  7. <section> Posições em destaque — <DataTable minWidth={700}>, 7 cols, 6 linhas preview, link "Ver portfólio completo" </section>
</div>
```

**QuantBar** (inline nesta tela, não extrai separado — só aparece aqui): `display: grid; grid-template-columns: repeat(5, minmax(0,1fr)); gap: 1px; border: 1px solid var(--hair); border-radius: 8px; background: var(--hair-soft)`. Cada célula: `padding: 11.2px 16.8px; background: var(--surf-3)`. Label: `font-size: 10.5px; color: var(--color-neutral-600); letter-spacing: 0.08em; text-transform: uppercase`. Valor: `font-size: 16px; font-weight: 600; margin-top: 5.6px; font-variant-numeric: tabular-nums; color: var(--color-neutral-100)`. Nota: `font-size: 10.5px; color: var(--color-neutral-600); margin-top: 2.8px`.

**Gráfico Evolução patrimonial:** usar SVG inline (mesmo padrão do handoff — polyline com gradiente fill). Legenda: 3 itens (Carteira, IBOV, CDI) com dot colorido + valor de retorno.

**Donut Alocação:** SVG `<circle>` com `stroke-dasharray`/`stroke-dashoffset` por fatia. Lista de itens: dot colorido + label + percentual + valor.

**Gráfico IA Insights:** 3 cards `border: 1px solid var(--hair); border-radius: 8px; padding: 14px 16.8px`. Cada card: ícone Phosphor fill + título 13px 600 + descrição 12px + badge de impacto.

**Dividendos próximos:** 4 cards horizontais com data-com, símbolo, valor por ação.

**Posições em destaque:** `<DataTable>` com colunas Ativo, Classe, Cotação, P&L, Peso, DY, Beta. Link "Ver portfólio completo" → `/portfolio`.

---

## 4. Portfolio (`src/pages/Portfolio.tsx`)

**Preservar:** `usePortfolio`, `useAssets`, filtros existentes, navegação para `/portfolio/asset/:id`.

**Layout:**

```
<div class="flex flex-col gap-[16.8px]">
  1. Tabs de grupo: segmented control (Todos / Renda Variável / Renda Fixa / FIIs)
     — mesma estrutura de <PeriodSelector> mas com tabs de grupo
  2. Pills de filtro: Classe / Setor / Conta (inline, gap 5.6px)
     — pill ativo: `background: rgba(145,132,217,0.18); color: var(--color-accent-100); border: 1px solid rgba(145,132,217,0.45)`
     — pill inativo: `background: transparent; color: var(--color-neutral-500); border: 1px solid var(--hair)`
  3. Barra de risco (5 buckets):
     `border: 1px solid var(--hair); border-radius: 8px; overflow: hidden`
     — 5 colunas com fundo colorido proporcional (Defensivo=azul, Moderado=verde, etc.)
     — cada bucket: label + percentual de alocação
  4. <section>
       <SectionHeader title="Carteira" subtitle="{n} ativos" action={<ConfiguradorColunas>}>
       — ConfiguradorColunas: botão gear → Popover com checkboxes para toggle das colunas
       <DataTable minWidth={900}>
         — Colunas configuráveis (máx 9): Ativo, Classe, Conta, Qtd, Preço Médio, Cotação, P&L R$, DY, Weight, Beta
         — Linha clicável → navigate(`/portfolio/asset/${symbol}`)
         — Sparkline mini (SVG 60×24px) na coluna Cotação
       </DataTable>
     </section>
</div>
```

---

## 5. Dividendos (`src/pages/Dividends.tsx`)

**Preservar:** `useDividends`, cálculos de YoC, agenda, projeções.

**Layout:**

```
<div class="flex flex-col gap-[16.8px]">
  1. grid 4 cols: 4× <KpiCard> (DY médio, Proventos 12m, YoC, Próximo provento)
  2. <section> "Proventos recebidos por mês"
       — 12 barras CSS (não SVG) em grid 12 colunas, altura proporcional
       — legenda: recebido (cor positiva) + previsto (violeta tracejado)
     </section>
  3. grid 1fr/1.2fr:
       <section> "Agenda · próximos 45 dias"
         — lista de eventos: mini-calendário (day/month badge) + símbolo + data-com + valor
       </section>
       <section> "Renda por ativo · 12 meses"
         — botão "Informe de rendimentos"
         — <DataTable>: Ativo, Total R$, DY, YoC (verde), Nº proventos
       </section>
  4. {showQuant && <AiInsightBanner> cobertura de renda passiva }
</div>
```

---

## 6. Asset Detail (`src/pages/AssetDetail.tsx`)

**Preservar:** `useAssetDetail`, `useAssetFundamentals`, `useAssetDividends`, tabs existentes.

**Layout:**

```
<div class="flex flex-col gap-[16.8px]">
  1. Hero section (gradient):
     background: linear-gradient(115deg, rgba(111,94,217,0.34) 0%, rgba(76,201,240,0.16) 48%, rgba(var(--rgb-surf-2),0.85) 100%), var(--surf-2)
     border: 1px solid rgba(145,132,217,0.30); border-radius: 8px; overflow: hidden
     — grid 1fr/340px:
       Esquerda: badge (grad-violet, 40×40px, letras símbolo), símbolo + tag setor, preço 34px, delta, 3 hero stats
       Direita: mini-card backdrop-blur "Sua posição" (5 linhas label/valor) + botões "Registrar operação" e "Alertas"

  2. Tab bar: 6 tabs segmented control + picker "ver outro ativo" à direita

  3. Tab Visão geral: grid 1.7fr/1fr
       Esquerda: gráfico "{símbolo} vs setor vs carteira" (base-100, 12m)
       Direita: card análise IA com verdicts (Valuation/Lucro/Dívida/Crescimento) + recomendação

  4. Tab Indicadores: tabela indicadores (P/L, P/VP, ROE, ROIC, EV/EBITDA, Dív.Líq/EBITDA, etc.)

  5. Tab Balanço: tabela com anos como colunas (últimos 5)

  6. Tab Resultados: gráfico receita/lucro por ano + tabela

  7. Tab Dividendos: gráfico barras DY por ano + tabela (Data-com, Pagamento, Por ação, Você recebeu)

  8. Tab Sobre: texto descritivo + dados cadastrais
</div>
```

---

## 7. Transações (`src/pages/Transactions.tsx`)

**Preservar:** `useTransactions`, filtros, paginação, import modal.

**Layout:**

```
<div class="flex flex-col gap-[16.8px]">
  1. grid 4 cols: 4× <KpiCard> sem tooltip (Compras totais, Vendas totais, Proventos, Saldo líquido)
     — Saldo usa deltaStyle colorido (verde/vermelho)

  2. <section>
       <SectionHeader title="Todas as movimentações" subtitle="{n} lançamentos · {n} contas · {período}">
         action: pills de filtro (Compra/Venda/Provento/Bonificação/Desdobramento) + botão "Importar arquivo"
       <DataTable minWidth={820}>
         8 cols: Data, Tipo (badge colorido), Ativo, Conta, Qtd, Preço, Total, Origem (badge)
         — Tipo: Compra=verde, Venda=vermelho, Provento=violeta
         — Origem: Manual=cinza, B3=azul, Importado=violeta
       </DataTable>
     </section>
</div>
```

---

## 8. Adicionar Ativo (`src/pages/AddAsset.tsx`)

**Preservar:** `useAddAsset`, validação do formulário, lógica de upload/import.

**Layout:**

```
grid 1fr/1.15fr gap-[16.8px]:

Coluna esquerda:
  <section>
    <SectionHeader title="Lançar manualmente" subtitle="Para ativos fora da B3 ou operações antigas">
    — 6 campos: Ativo, Tipo, Data, Quantidade, Preço médio, Corretora
    — Botões: "Salvar ativo" (grad-violet, flex:1) + "Salvar e adicionar outro" (ghost)
  </section>

Coluna direita:
  <section> dropzone gradient
    border: 1px dashed rgba(145,132,217,0.45); border-radius: 8px; overflow: hidden
    background: linear-gradient(122deg, rgba(111,94,217,0.24) 0%, rgba(76,201,240,0.10) 58%, rgba(var(--rgb-surf-2),0.86) 100%)
    — ícone upload (44×44px, grad-aurora, glow)
    — título "Arraste seus arquivos aqui" 17px
    — subtítulo "PDF, CSV ou XLSX..."
    — botões "Escolher arquivos" + "Qual arquivo eu preciso?"
  </section>
  <section> "Importações recentes"
    — lista: ícone + label + meta + badge de status
  </section>
```

---

## 9. Tokens de cor obrigatórios

| Token | Uso |
|---|---|
| `var(--card)` | fundo de cards/sections |
| `var(--hair)` | borders principais |
| `var(--hair-soft)` | borders suaves (separadores internos) |
| `var(--color-neutral-100..600)` | texto (100=mais claro, 600=mais escuro) |
| `var(--color-accent-100..700)` | violeta Nocturne em gradações |
| `var(--grad-violet)` | gradiente principal de CTAs |
| `var(--grad-aurora)` | gradiente de upload/destaque |
| `var(--pos)` | cor de ganho/positivo |
| `var(--neg)` | cor de perda/negativo |
| `var(--warn)` | cor de aviso/amarelo |
| `var(--surf-2)`, `var(--surf-3)`, `var(--surf-4)` | superfícies em camadas |
| `var(--font-heading)` | tipografia de títulos e valores grandes |
| `var(--font-body)` | tipografia de corpo |

**Proibido:** qualquer cor hardcoded (`#hex`, `rgb(...)` literal) fora de `rgba(145,132,217,...)` que é o violeta Nocturne documentado no handoff.

---

## 10. Constraints globais

- Ícones: Phosphor (`ph ph-*`, `ph-fill ph-*`) — não usar Lucide em JSX novo
- `font-variant-numeric: tabular-nums` em todo valor financeiro
- Nenhum `useEffect` novo (usar react-query existente)
- `npm run type-check`, `npm run lint`, `npm run test:unit` devem passar
- `npm run build` deve passar sem warnings
- E2E: rodar `npx playwright test` completo ao final (mudanças de layout podem quebrar seletores)
- Verificação visual: abrir cada tela no browser e comparar com handoff antes de commit

---

## 11. Fora de escopo

- Lógica de negócio nova (filtros, sorting, paginação além do existente)
- Waves 2-4 (IA Insights, Copiloto, Research, Comparador, Planning, Fiscal, Settings, etc.)
- Tela "Relatórios" (nova — entra na Wave 3)
- Integração real do botão "Como a IA decidiu" (só renderiza o banner com texto estático do hook existente)
- Botão Google OAuth: consistência visual com handoff (dark surface, ícone Phosphor) — deixar para fix separado após wave 1
