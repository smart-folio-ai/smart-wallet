---
target: src/pages/AIInsights.tsx
total_score: 13
max_score: 40
na_heuristics: 
p0_count: 2
p1_count: 2
timestamp: 2026-08-27T00-35-11Z
slug: src-pages-aiinsights-tsx
---
Method: dual-agent (A: opus design-director subagent · B: detect.mjs CLI)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 1/4 | Radar de Erro e Score falham silenciosamente (setNull); sem timestamp de geração em nenhum lugar |
| 2 | Match System / Real World | 2/4 | "proibições de erro" é erro de tradução; "robôs de arbitragem" soa golpe pra investidor de varejo BR |
| 3 | User Control and Freedom | 1/4 | Sem refresh após carregar; simulador não limpa resultado ao trocar parâmetro — número errado fica na tela |
| 4 | Consistency and Standards | 2/4 | 5 escalas de `rounded-*` diferentes; Card sempre sobrescrito em vez de usar `variant="glass"` já existente |
| 5 | Error Prevention | 1/4 | `BadgePremium` renderiza pra quem NÃO é premium (condição invertida); botão "Fazer Upgrade" sem onClick |
| 6 | Recognition Rather Than Recall | 2/4 | `Info` importado e nunca usado — zero tooltips; barra de alocação sem legenda |
| 7 | Flexibility and Efficiency | 1/4 | Um único caminho rígido; nenhum drill-down, export, ou modo avançado pro investidor experiente |
| 8 | Aesthetic and Minimalist Design | 2/4 | `font-black` em 15 lugares — tudo grita, nada tem destaque; sombra colorida viola regra do próprio design system |
| 9 | Error Recovery | 1/4 | Toast de erro do simulador some em 4s e deixa número obsoleto exibido com confiança total |
| 10 | Help and Documentation | 0/4 | Zero — nenhum tooltip, glossário, ou explicação de metodologia em toda a página |
| **Total** | | **13/40** | **Poor (33%)** |

## Design Specificity Verdict — FAIL

**LLM assessment**: Página é um dashboard SaaS dark genérico com strings em português coladas. Trocando os rótulos, serve pra qualquer produto — CRM, ferramenta de SEO, app de fitness. Nada na composição sabe que está olhando pra B3. O token `--primary: 230 100% 62%` é idêntico em light e dark mode — não há segunda cor de acento. ~65 aplicações de azul/primary numa única página; três painéis semanticamente diferentes (Opinião, Movimentações, Simulador) usam a mesma classe `bg-primary/5 border-primary/10`. O único momento genuinamente brasileiro é acidental (`formatCurrency`) — não há benchmark CDI/IBOV em lugar nenhum, apesar desse ser o benchmark mental #1 de qualquer investidor brasileiro. `font-heading: Manrope` está configurado no tailwind e usado **zero vezes** nesta página; tudo é Inter. A honestidade genuína do produto (não inventar zero, não inventar volatilidade) está documentada só em comentários de código — invisível pro usuário.

**Deterministic scan** (`detect.mjs`):
- `gradient-text` (linha 217): `bg-clip-text` + `bg-gradient` no h1 — tell clássico de UI gerada por IA
- `ai-color-palette` (linha 684): gradiente `from-indigo-600` no banner de upgrade — paleta indigo/roxo genérica

Ambos os achados do detector reforçam diretamente o veredito de especificidade da Assessment A: o headline é um gradiente azul-pra-azul (não faz nada), e o banner de upgrade usa a paleta mais genérica possível de dashboard AI.

**Visual overlays**: não disponível nesta execução (sem servidor de preview ativo; análise foi por código-fonte).

## Overall Impression

A engenharia por trás dos dados é sólida — `Promise.allSettled` desacoplando fontes, `null` em vez de `0` fabricado, remoção de dimensões que a IA não consegue calcular de verdade. Só que nada disso aparece na superfície visual, que é template genérico de dashboard 2022-2023 com ~65 aplicações da mesma cor primária carregando decoração, estrutura, ênfase, semântica e marca ao mesmo tempo. O maior problema não é "está azul demais" — é que a cor parou de significar qualquer coisa porque está em tudo.

## What's Working

1. **Disciplina de null-handling.** `overall !== null`, `'--'` em vez de `0`, `'—'` em vez de `0%` com o comentário explícito de que `val || 0` seria uma afirmação falsa. Pouco produto financeiro faz isso direito.
2. **Arquitetura de desacoplamento correta.** `Promise.allSettled` garante que score, radar de erro e análise LLM sobrevivem independentemente se uma fonte cair.
3. **Recusa em inventar números.** Remoção de "consistência"/"volatilidade" que a LLM não calcula de verdade, e os 4 horizontes fixos em vez de slider livre porque a API só aceita 4 valores.

## Priority Issues

**[P0] `BadgePremium` renderiza com condição invertida (linha 225)**
- Why it matters: `{!isPremium && <BadgePremium />}` mostra "PRO ACCOUNT" pra quem NÃO paga, e nada pra quem paga. Bug de confiança de billing disfarçado de bug visual.
- Fix: inverter para `{isPremium && <BadgePremium />}` e testar mutual exclusion com o UpgradeBanner.
- Suggested command: `/impeccable harden`

**[P0] Simulador mantém resultado obsoleto ao trocar parâmetros (linhas 512-594)**
- Why it matters: mudar o aporte ou horizonte não limpa `simulation` — a página mostra com confiança total um valor em R$ que não corresponde aos parâmetros atuais na tela.
- Fix: limpar `simulation` em `onValueChange`/`onClick` do horizonte, ou migrar pra React Query com os parâmetros como key (resolve a obsolescência estruturalmente).
- Suggested command: `/impeccable harden`

**[P1] Monocultura azul — ~65 aplicações de primary/blue, mesmo token em ambos os temas**
- Why it matters: é a queixa literal do usuário, e é também por que nada tem hierarquia — quando 65 elementos são a mesma cor, a cor parou de codificar informação.
- Fix: cor do gauge/simulador guiada pelo score (âmbar <40, neutro 40-79, verde ≥80) usando os tokens `--accent-positive`/`--warning` que já existem; `bg-primary` só em elementos interativos; matar o gradiente azul-pra-azul do h1; usar `font-heading` (Manrope) que está configurado e nunca usado.
- Suggested command: `/impeccable colorize`

**[P1] Severidade do Radar de Erro codificada só em cor, sem ordenação, falha silenciosa**
- Why it matters: falha WCAG 1.4.1 (uso de cor); o ponto `amber-500` de 2x2px tem contraste ~2.15:1 no fundo claro — abaixo do mínimo de 3:1 mesmo pra elemento não-textual. `medium` pode renderizar acima de `high` porque a ordem é a da API.
- Fix: chip de texto com a severidade ("ALTO"/"MÉDIO") + ícone distinto, ordenar por severidade, mostrar contagem resumo, e tratar explicitamente o caso de falha (`errorRadar === null`) com retry visível.
- Suggested command: `/impeccable audit`

**[P2] Recomendações sem proveniência, timestamp ou disclaimer**
- Why it matters: preço-alvo e upside gerados por LLM aparecem como fato do produto, sem aviso de IA, sem "gerado em", sem disclaimer de risco — risco regulatório real no Brasil, e inconsistente (o texto livre do RAG é rotulado como IA, os números-alvo não são).
- Fix: aplicar `AiGeneratedNotice` (já existe no código, usado só no RagAskPanel) no radar de oportunidades, rebalanceamento e opinião; adicionar "Gerado em `<data/hora>`" no header com refresh.
- Suggested command: `/impeccable clarify`

## Persona Red Flags

**Alex (investidor experiente)**: "Opinião Trackerr" é uma frase em itálico entre aspas sem nenhuma métrica anexada — lê como horóscopo, não análise. O gauge de 192×192px gasta ~37.000px² pra mostrar um inteiro de dois dígitos, enquanto as métricas que ele quer (Sharpe, beta, VaR, correlação, P/VP, DY) simplesmente não existem — o comentário no código confirma que volatilidade foi removida de propósito. Nenhum benchmark CDI/IBOV em lugar nenhum, incluindo no simulador — uma projeção de R$847k em 10 anos sem "vs. CDI" não significa nada pra um investidor brasileiro sério. Sem export, sem drill-down: ele não consegue verificar nada, então não vai confiar.

**Jordan (iniciante)**: recebe o veredito de uma palavra só, "Frágil", sob um gauge quase vazio, sem próximo passo. Jargão não definido em toda parte (Rebalanceamento, Diversificação, Aporte, UPSIDE) com `Info` importado e nunca renderizado — zero tooltips na página inteira. O `line-through` na alocação atual dela (linha 398) lê como "isso está errado/apagado" quando é a carteira real dela. Quando ela está *sobre-alocada* num setor, `Math.max(0, ideal - current)` zera a largura da barra — a situação mais comum de rebalanceamento fica invisível.

**Sam (acessibilidade)**: severidade do radar codificada só em cor — falha WCAG confirmada. `text-primary` falha AA no modo escuro (~3.79:1, abaixo de 4.5:1). O gauge SVG não tem `role`, `aria-label` nem `<title>`. O slider de aporte mensal não tem `aria-label` nem `htmlFor` no label. Os 4 botões de horizonte não formam um `radiogroup`. Estado de carregamento não tem `aria-live`/`role="status"`. Hierarquia de heading quebrada (h1 → h4 pulando dois níveis) e nenhuma `<section>` tem `aria-labelledby`.

## Minor Observations

- `plan` (localStorage) calculado e nunca usado — código morto e smell de segurança (string de plano controlada pelo cliente)
- `key={i}` em 4 `.map()`s diferentes — bugs de reordenação
- `catch {}` engole o erro sem logar em lugar nenhum
- Cards sempre brigam contra o próprio componente (`border-none shadow-none`, `bg-card/40`) em vez de usar `variant="glass"` que já existe
- Abaixo de `xl` (1024-1279px), a coluna direita inteira (Radar de Oportunidades + banner de upgrade) cai 3 viewports abaixo — em laptop comum o CTA que monetiza fica praticamente invisível
- `formatPercentage` importado e nunca chamado — percentuais formatados manualmente com `.toFixed(1)` em 3 lugares diferentes

## Questions to Consider

1. Se você apagasse o gauge de score, alguém notaria — ou é a decoração mais cara da página?
2. A página diz pro usuário que o dinheiro dele está "Frágil" e, quatro seções depois, tenta vender "robôs de arbitragem". Qual das duas é o produto de verdade?
3. Todo investidor brasileiro sério compara com CDI, e a página projeta dez anos de patrimônio sem citar isso uma vez. Qual pixel desta página só poderia existir num produto B3?
