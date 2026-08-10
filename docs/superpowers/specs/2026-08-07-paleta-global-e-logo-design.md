# Etapa A — Paleta global, tokens unificados e logo

**Data:** 2026-08-07
**Escopo:** `web` apenas. Nenhuma alteração em `server` ou `trackerr-ia`.
**Branch:** `web/feature/paleta-global-e-logo`
**Referência visual:** `web/docs/design/paletas-globais.html`

---

## 1. Objetivo

Unificar os três sistemas de token que hoje descrevem a mesma coisa, definir as
duas paletas globais do produto e consolidar o desenho da marca num componente
único.

É a primeira de duas etapas. A Etapa B redesenha as cinco telas de autenticação
sobre a fundação validada aqui. Esta etapa **muda cor, token e logo — não move
um pixel de posição**.

## 2. O problema

Três vocabulários convivem descrevendo superfícies e texto:

- os tokens semânticos do shadcn (`--background`, `--card`, `--muted`,
  `--border`…), que reagem ao `.dark`;
- os tokens canônicos (`--brand`, `--surface-*`, `--on-surface-*`), que **não**
  reagem ao tema e significam "superfície escura";
- os aliases `--auth-*`, que são `--surface-*` embrulhados em `hsl()` para uso
  em `style` inline.

Mais dois mecanismos de escopo criados para contornar a falta de unificação:
`.landing-root`, que impede a landing de contaminar as telas de auth, e o par
`--accent-positive`/`--accent-negative` convivendo com `--success`/`--warning`/
`--info`.

Impacto medido no código:

| Consumo | Arquivos |
|---|---|
| Classes semânticas do shadcn (`bg-background`, `text-foreground`, `bg-card`, `text-muted-foreground`, `border-border`, `bg-muted`) | 72 |
| Classes `surface`/`on-surface` | 16, **todas dentro de `components/landing/`** |
| `--auth-*` em `style` inline | 5 |

## 3. Decisões tomadas

| Questão | Decisão |
|---|---|
| Telas de auth seguem o tema? | Não. Continuam sempre escuras, mas consumindo os tokens globais em vez dos aliases `--auth-*`. |
| Tema escuro | Adota a paleta da landing. |
| Tema claro | Refinado: papel, off-white quente. |
| Azul da marca | Vence o do logo: `230 100% 62%`, constante nos dois temas. |
| Fonte do lockup | O lockup SVG sai da aplicação; a palavra vira texto HTML. |
| Telas de auth redesenhadas | As cinco, na Etapa B. |

## 4. Arquitetura de tokens

Estado final: **um sistema só**.

- **`:root`** carrega a paleta clara completa e as constantes de marca.
- **`.dark`** redefine exatamente o mesmo conjunto de nomes com a paleta escura.
- **`--surface-*` e `--on-surface-*` passam a reagir ao tema.** Deixam de
  significar "superfície escura" e passam a significar "superfície da camada N
  no tema atual". É a mudança conceitual central da etapa.
- **`.landing-root` é removido.** A landing declara `dark` no seu container: ela
  é escura sempre, e "escura" passa a ser um tema global, não um escopo especial.
- **Os aliases `--auth-*` são removidos**, junto com todos os usos em `style`
  inline nas telas que os consomem. Esses usos viram classes Tailwind
  (`bg-surface-panel`, `text-on-surface-muted`). É pré-requisito da Etapa B:
  enquanto houver `style` inline com cor fixa, mudar de tema não muda nada.
- **`--accent-positive`/`--accent-negative` passam a ser o vocabulário
  financeiro** (alta/baixa, ganho/perda). `--warning` e `--info` permanecem para
  aviso e informação. `--destructive` permanece intocado: é do shadcn, aparece em
  21 arquivos e significa ação perigosa (excluir), não perda financeira — são
  conceitos diferentes que por acaso são vermelhos. `--success` continua
  existindo, usado por 7 arquivos, mas passa a derivar de `--accent-positive`
  para as duas ideias de "positivo" não divergirem de tom.

### 4.1 Como os 72 arquivos mudam sem alteração de código

Este é o mecanismo central da etapa e precisa ser explícito. Os tokens
semânticos do shadcn passam a **derivar** dos canônicos, em ambos os temas:

| Token shadcn | Deriva de |
|---|---|
| `--background` | `--surface-base` |
| `--foreground` | `--on-surface` |
| `--card`, `--popover` | `--surface-raised` |
| `--card-foreground`, `--popover-foreground` | `--on-surface` |
| `--muted` | `--surface-panel` |
| `--muted-foreground` | `--on-surface-muted` |
| `--border`, `--input` | hairline do tema |
| `--primary`, `--ring` | `--brand` |
| `--secondary` | `--surface-panel` |
| `--accent` | `--surface-panel` |

É por isso que os 72 arquivos que usam `bg-background`, `text-foreground`,
`bg-card` e afins são repintados sem uma linha alterada — e é por isso que a
conferência visual da seção 10 é obrigatória.

## 5. As paletas

Valores em canais HSL, o formato que o `index.css` já usa. A representação
visual, com espécimes de interface pintados em cada paleta, está em
`web/docs/design/paletas-globais.html` — atualize-a junto se algum valor mudar.

| Token | Escuro | Claro | Papel |
|---|---|---|---|
| `--surface-base` | `224 30% 6%` | `40 33% 98%` | Fundo da página |
| `--surface-panel` | `224 28% 8%` | `40 24% 96%` | Faixas e agrupamentos |
| `--surface-raised` | `223 24% 11%` | `40 40% 100%` | Cards e popovers |
| `--on-surface` | `228 90% 93%` | `30 14% 12%` | Título e corpo |
| `--on-surface-muted` | `228 18% 72%` | `33 9% 38%` | Texto secundário |
| `--on-surface-subtle` | `228 12% 55%` | `35 7% 50%` | Rótulos e apoio |
| `--brand` | `230 100% 62%` | `230 100% 62%` | Ação primária, links |
| `--accent-positive` | `158 84% 45%` | `158 76% 30%` | Alta, ganho |
| `--accent-negative` | `351 83% 61%` | `351 72% 42%` | Baixa, perda |
| `--warning` | `40 95% 60%` | `32 90% 34%` | Atenção |

Notas de desenho:

- No claro, o **card sobe para branco puro enquanto o fundo fica creme**, então
  o card emerge do fundo em vez de se confundir com ele. É a lógica de camada do
  escuro, invertida.
- Os neutros de texto do claro ficam na faixa quente (hue 30–35) para não
  brigarem com o creme; os do escuro ficam frios (hue 228) pelo mesmo motivo.
- `--on-surface-subtle` é um nome novo. Hoje existe `--on-surface-secondary`
  com papel equivalente mas valor que não sobrevive à inversão de tema; o nome
  antigo é substituído, e seus consumidores na landing são atualizados junto.
- **Hairline.** O token `--surface-hairline` continua existindo e passa a ter
  valor por tema: no escuro é branco (`0 0% 100%`), no claro é o próprio tom de
  texto (`30 14% 12%`). Em ambos os casos é sempre consumido com alfa baixo
  (`border-surface-hairline/10`), o que produz uma borda de 1px discreta sobre
  qualquer um dos dois fundos.

### 5.1 Contraste — verificado, não estimado

Todos os pares foram calculados pela fórmula da WCAG. Mínimo de 4,5:1 para texto
corrido e 3:1 para elementos de interface e texto grande.

| Par | Mínimo | Escuro | Claro |
|---|---|---|---|
| Corpo sobre fundo | 4,5 | 15,28 | 15,82 |
| Corpo sobre painel | 4,5 | 14,77 | 15,17 |
| Corpo sobre card | 4,5 | 13,82 | 16,43 |
| Secundário sobre fundo | 4,5 | 8,99 | 5,79 |
| Secundário sobre painel | 4,5 | 8,69 | 5,56 |
| Apoio sobre fundo | 3,0 | 5,23 | 3,70 |
| Marca sobre fundo | 3,0 | 3,91 | 4,78 |
| Branco no botão de marca | 4,5 | 4,97 | 4,97 |
| Positiva sobre fundo | 3,0 | 9,92 | 4,37 |
| Negativa sobre fundo | 3,0 | 5,33 | 6,16 |
| Aviso sobre fundo | 3,0 | 11,16 | 4,90 |

**Regra de uso que sai daí:** no tema escuro a marca sobre o fundo mede 3,91:1 —
suficiente para botão, borda, ícone e texto grande, insuficiente para parágrafo.
Azul de marca não vira cor de texto corrido no escuro.

## 6. Logo

- **O lockup sai da aplicação.** `logo-lockup-*.svg` desenha a palavra "Trackerr"
  como `<text font-family="'Space Grotesk'">`. Carregado via `<img src>`, um SVG
  é isolado: não enxerga fontes do documento pai, e Space Grotesk não está
  carregada no projeto. A palavra sairia na fonte de fallback do sistema,
  diferente em cada máquina. Os arquivos permanecem no repositório para uso
  externo (apresentação, e-mail, redes), onde não precisam casar com a
  tipografia do produto.
- **`AppLogo` passa a ser o único lugar que desenha a marca:** o ícone mais a
  palavra em `<span>`, na fonte do app. Props: `size` (`sm` | `md` | `lg`) e
  `variant` (`full` | `icon`).
- **O ícone vira SVG inline dentro do componente.** `logo-icon-dark-bg.svg` e
  `logo-icon-light-bg.svg` diferem apenas na cor do anel de fundo (branco a 20%
  contra escuro a 20%). Inline, o anel usa `currentColor` com opacidade e
  acompanha o tema sozinho — sem duplicata de arquivo e sem uma requisição de
  imagem. O arco continua fixo em `--brand`.
- **`LandingNav` e `LandingFooter` passam a consumir `AppLogo`** em vez de
  importarem o arquivo direto. Hoje há três implementações do mesmo logo em três
  arquivos; depois disso, uma.
- **O texto alternativo deixa de existir para a palavra.** Hoje convivem
  `alt="trackerr"` e `alt="Trackerr"`, divergência que quebra `Landing.spec.tsx`.
  Como a palavra vira texto real, o ícone recebe `aria-hidden="true"` e a marca é
  lida diretamente como texto pelo leitor de tela. Os testes passam a procurar o
  texto, não o atributo.

## 7. Cores fixas que precisam virar token

Auditoria feita no código: 20 usos de cor fixa fora da landing. A maioria é
inofensiva — `text-white` sobre gradiente âmbar, sobre `emerald-500`, sobre
`indigo-600`, e os `bg-black/80` que são scrim de modal. Esses fundos não vêm de
token e não mudam.

**Três são texto branco sobre fundo que passa a ser claro no tema claro, e
precisam ser corrigidos nesta etapa:**

| Arquivo | Problema |
|---|---|
| `components/ui/custom-tooltip.tsx` | `text-white` e `border-white/10` no tooltip, cujo fundo vem de `--popover`. Usado pelos gráficos em várias telas. |
| `components/ui/feature-tour-modal.tsx` | Dois botões com `bg-transparent text-white`, herdando o fundo do modal. |
| `pages/AIInsights.tsx` | Ícone com `group-hover:text-white` cujo fundo de hover vem de token. |

`components/WalletLoadingScreen.tsx` usa `bg-white/5` mas pertence à família auth
e é coberto pela conversão da seção 8.

## 8. Sequência de execução — e a armadilha que a define

Os aliases `--auth-*` derivam de `--surface-*` no `:root`. **No instante em que
`--surface-base` no `:root` passa a valer a paleta clara, `--auth-bg` vira creme
e as cinco telas de autenticação ficam com texto claro sobre fundo claro.**

Por isso a mudança de significado dos tokens e a conversão das telas de auth
**têm que viajar juntas**. Não é preferência de organização: qualquer commit que
faça uma sem a outra deixa o login ilegível.

Ordem:

1. **Componente de logo** — independente de tudo, não toca em token.
2. **Paleta + conversão do auth, como uma peça única** — `index.css` ganha as
   duas paletas, os `--auth-*` somem e as cinco telas passam a usar classes
   Tailwind. As correções da seção 7 entram aqui, pelo mesmo motivo.
3. **Landing** — `.landing-root` é trocado por `dark` no container e o bloco CSS
   é removido.
4. **Limpeza** — remoção dos tokens que ficaram sem consumidor.

## 9. Testes

- **Paridade de tokens (novo).** Um teste lê `src/index.css` e afirma que `:root`
  e `.dark` declaram exatamente o mesmo conjunto de nomes de token. Pega o bug
  clássico desse tipo de sistema: um token definido em um tema e esquecido no
  outro, que faz a página misturar texto de um tema com fundo do outro sem
  ninguém perceber até alguém usar o toggle.
- **`Landing.spec.tsx`** passa a procurar o texto "Trackerr" em vez do atributo
  `alt`, acompanhando a mudança da seção 6.
- **Specs de autenticação existentes** (`SignIn`, `Register`, `ForgotPassword`,
  `ResetPassword`) devem continuar passando sem alteração — a conversão de
  `style` inline para classe não muda comportamento nem texto. Se algum quebrar,
  é sinal de que a conversão mudou mais do que devia.
- Comandos: `node node_modules/vitest/vitest.mjs run`, `npm run type-check`
  (corrigido no PR #57 e agora real), `node node_modules/eslint/bin/eslint.js src`.

## 10. O que os testes não pegam

Contraste está calculado e cores fixas perigosas estão mapeadas, mas
legibilidade percebida, hierarquia visual e se o creme parece intencional ou
sujo — isso é olho humano.

Como 72 arquivos mudam de cor sem uma linha de código alterada, **antes do merge
alguém precisa conferir seis telas nos dois temas**, alternando pelo toggle da
sidebar: dashboard, carteira, uma tela de formulário, configurações, login e a
landing.

## 11. Fora de escopo

- Favicons e `index.html` — funcionam independentemente do sistema de tokens.
- O redesign das telas de auth — é a Etapa B.
- Qualquer mudança de layout, espaçamento ou tipografia.
- `server` e `trackerr-ia`.

## 12. Critérios de aceite

- `:root` e `.dark` declaram o mesmo conjunto de tokens, com os valores da
  seção 5.
- Nenhum `--auth-*` permanece no código.
- Nenhum `.landing-root` permanece no código.
- A landing continua escura em ambos os temas do app.
- As cinco telas de autenticação continuam escuras e legíveis.
- Os três arquivos da seção 7 tiram cor de token.
- `AppLogo` é o único componente que desenha a marca, e a palavra "Trackerr" é
  texto real em HTML.
- Suíte, type-check e lint passam.
