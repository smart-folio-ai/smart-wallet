# Fundação — tokens Nocturne + Inter + Phosphor

**Data:** 2026-08-30
**Escopo:** `web` apenas. Nenhuma alteração em `server` ou `trackerr-ia`.
**Branch:** `feature/design-foundation-nocturne`
**Referência:** `design_handoff_trackerr/` (README.md + `_ds/nocturne-*/styles.css` + os 4 `.dc.html`)

Primeira de várias etapas do redesign do handoff. Esta etapa entrega só a
fundação — cor, tipografia, ícones — sem tocar em layout, componentes ou
estrutura de página. Landing, Auth e as 17 telas do App vêm em etapas
seguintes, já sobre esta base.

---

## 1. Objetivo

Trazer o design system **Nocturne** (tema do handoff) para dentro do sistema
de tokens que já existe em `web` — sem renomear nada que os 72+ arquivos já
consomem — e migrar os ícones de `lucide-react` para `@phosphor-icons/react`,
que é o que o handoff usa.

## 2. Estado atual

- `src/index.css`: tokens HSL em `:root` (claro) e `.dark` (escuro), consumidos
  via `hsl(var(--x))` no `tailwind.config.ts`. Mecanismo já correto — só os
  *valores* mudam de paleta, não a estrutura.
- Fonte: Inter (corpo) + Manrope (`--font-heading`, títulos).
- Ícones: `lucide-react` em 74 arquivos, 64 nomes de ícone distintos; 23 desses
  arquivos são primitivos `components/ui/*` gerados pelo shadcn CLI.
- Tema: `ThemeToggle.tsx` já alterna `.dark` na raiz, persiste em
  `localStorage`, respeita `prefers-color-scheme` no primeiro load. Não muda
  nesta etapa.

## 3. Decisões tomadas

| Questão | Decisão |
|---|---|
| Nomenclatura dos tokens | Mantém a atual (`--background`, `--card`, `--accent-positive`…). Só os valores HSL mudam. |
| Fonte de título | Unifica em Inter. Manrope sai do projeto (import + referências). |
| Ícones | Migra tudo, incluindo os 23 primitivos shadcn/ui, via camada de compatibilidade central (não callsite a callsite). |
| Câmbio (`--cy`, cyan de benchmark) | Não existe token equivalente hoje → novo token `--benchmark`, sem tocar nos existentes. |

## 4. Mapeamento de cor (handoff → tokens existentes)

Conversão hex→HSL feita e verificada. Tabela por tema:

### Superfície e fundo

| Token existente | Escuro (novo valor) | Claro (novo valor) | Origem no handoff |
|---|---|---|---|
| `--background` | `233 27% 12%` (#161826) | `240 29% 97%` (#f4f4f9) | `--color-bg` |
| `--card` | `232 18% 17%` (#232532) | `240 100% 100%` (#fdfdff) | `--surf` (topo do gradiente de card) |
| `--surface-panel` | `233 23% 15%` (#1e2030) | `240 45% 98%` (#f7f7fc) | `--surf-2` (base do gradiente, popover) |
| `--surface-raised` | `232 19% 15%` (#20222f) | `240 100% 99%` (#fafaff) | `--surf-4` (tooltip) |
| `--surface-input` | `229 22% 10%` (#14161f) | `232 25% 94%` (#ebecf3) | `--sunk` (campo, trilha) |
| `--surface-hairline` | `240 10% 92%` (base, usado com alpha baixo) | `234 16% 12%` (base, usado com alpha baixo) | `--rgb-line` |
| `--foreground` | `240 10% 92%` (#e9e9ed) | `234 16% 12%` (#1a1b24) | `--color-text` |

`--surface-panel` também cobre o papel de célula de grade (`--surf-3` do
handoff é próximo o bastante de `--surf-2` para não justificar um 5º token).

### Vocabulário financeiro e semântico

| Token existente | Escuro | Claro | Origem |
|---|---|---|---|
| `--accent-positive` | `162 67% 51%` | `164 83% 33%` | `--pos` |
| `--accent-negative` | `350 86% 63%` | `348 75% 46%` | `--neg` |
| `--warning` | `41 87% 56%` | `41 93% 31%` | `--warn` |
| `--brand` | `249 53% 68%` | `248 62% 61%` | `--ac` |
| `--brand-strong` | `248 62% 61%` | `248 62% 61%` | `--ac-strong` (idêntico nos dois temas) |

`--success` continua derivando de `--accent-positive` (já é assim, ver etapa
anterior de paleta). `--destructive` **não muda** — continua vermelho de ação
perigosa do shadcn, conceito diferente de `--accent-negative` (perda
financeira), mesmo que os tons fiquem próximos.

### Token novo

| Token novo | Escuro | Claro | Uso |
|---|---|---|---|
| `--benchmark` | `194 85% 62%` (#4cc9f0) | `198 73% 38%` (#1a7ba6) | linha de benchmark nos gráficos (`--cy` no handoff). Cor tailwind `benchmark`, mesmo padrão `hsl(var(--benchmark) / <alpha-value>)` dos outros. |

`--ac-soft` (`247 93% 83%` escuro / `250 29% 45%` claro, linha da carteira no
gráfico) também vira token novo — `--brand-soft` — pelo mesmo motivo: não tem
equivalente hoje e é usado no lugar errado se reaproveitar `--brand`.

### O que não muda

`--chart-1..5`, `--sidebar-*`, `--border`, `--input`, `--ring`, `--muted*`,
`--secondary*`, `--popover*`, `--destructive*` seguem existindo com a mesma
estrutura; os dois usos atuais de `--chart-*` (`Index.tsx`, `index.css`)
recebem ajuste de valor para não destoar da paleta nova, sem mudar nome nem
mecanismo.

## 5. Tipografia

- Remove `@import` do Manrope em `index.css`.
- `--font-heading` passa a apontar para o mesmo valor de `--font-body`
  (`'Inter', 'Segoe UI', Arial, sans-serif'`).
- `tailwind.config.ts`: `fontFamily.heading` idem `fontFamily.sans`/`body`.
- Nenhum peso de fonte acima de 600 é usado (handoff nunca passa disso); pesos
  700/800 carregados hoje no `@import` do Inter saem do link do Google Fonts.

## 6. Ícones

**Abordagem:** camada de compatibilidade central, não edição arquivo a
arquivo.

1. Adiciona dependência `@phosphor-icons/react`.
2. Cria `src/components/ui/icons.tsx`: reexporta os ícones do Phosphor sob os
   mesmos nomes que os componentes já usam (`ArrowRight`, `Moon`, `Sun`,
   `ChevronDown`, etc. — os 64 nomes atualmente importados de `lucide-react`).
   Onde o nome não bate 1:1 (ex.: `Loader2` do lucide não existe no Phosphor —
   vira `CircleNotch`), o arquivo central faz o de-para; o nome exportado
   continua sendo `Loader2` para não obrigar mudança de JSX em quem consome.
3. Troca a *origem* do import (`from "lucide-react"` → `from
   "@/components/ui/icons"`) nos 74 arquivos, incluindo os 23 primitivos
   `components/ui/*`. Nome do componente JSX não muda em nenhum callsite.
4. Peso visual: usa `weight="regular"` como default no wrapper (equivalente ao
   traço fino do lucide), reservando `fill`/`duotone` só onde o handoff pede
   explicitamente (ícone de IA/copiloto, estado ativo — conforme README:
   "fill só para copiloto/IA e estado ativo").
5. Props: audita os 11 arquivos que usam `strokeWidth` (prop do lucide, sem
   equivalente direto no Phosphor — vira `weight`). Ajusta caso a caso durante
   a implementação.
6. Remove `lucide-react` do `package.json` só depois de confirmar zero import
   restante (`grep -rl "lucide-react" src`).

## 7. Testes e verificação

- `npm run type-check` — pega qualquer nome de ícone sem export correspondente
  no arquivo central.
- `npm run lint`.
- `npm run test:unit` — specs existentes que fazem snapshot/query de ícone por
  `data-testid` ou texto continuam passando; specs que dependem de classe CSS
  específica do lucide (se houver) precisam de ajuste pontual.
- Verificação visual manual: abrir app em dev, alternar tema claro/escuro,
  conferir contra os 4 `.dc.html` do handoff (screenshot lado a lado) nas
  telas que já existem hoje (Dashboard/Index, Portfolio, Settings, Sidebar).
- `grep -rl "lucide-react" src` → vazio ao final.
- `grep -rl "Manrope" src` → vazio ao final.

## 8. Fora de escopo (etapas futuras)

- Layout, espaçamento, raio, elevação, sombra — o handoff já é compatível
  (raio 8px máx, já é o `--radius` atual) mas qualquer ajuste fino de card/
  grid fica para quando as telas forem redesenhadas.
- Landing, Auth, App shell (sidebar/topbar) e as 17 telas do produto —
  cada uma vira spec própria, decidido em brainstorming anterior.
- Tokens de movimento/animação do handoff (150ms/240ms/600ms).
- Toggle de tema em si (já funciona, não precisa mudar).

## 9. Riscos

- Ícone sem equivalente direto no Phosphor exige escolha manual — mitigado
  pela camada central, onde a decisão fica em um único lugar revisável.
- `strokeWidth` nos 11 arquivos citados quebra silenciosamente se não migrado
  (prop desconhecida é ignorada por padrão em React, não quebra build, mas
  muda visual) — endereçado explicitamente na seção 6.5, não deixado para
  descobrir em code review.
