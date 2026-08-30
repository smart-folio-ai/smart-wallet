# App shell — fidelidade Nocturne (nav, topbar, profundidade adaptativa, ⌘K)

**Data:** 2026-08-30
**Escopo:** `web` apenas.
**Branch:** `feature/app-shell-nocturne`
**Depende de:** `develop` (fundação #102, Landing #103 e Auth #104 já mergeados).
**Referência:** `design_handoff_trackerr/Trackerr App.dc.html` + README.md (seção "3. App", "Interações e comportamento")

Quarta etapa do redesign. O shell logado (`AppSidebar` + `AppTopbar`) já existe, usa os primitivos shadcn (`Sidebar`, `Command`) e já herda os tokens Nocturne das etapas anteriores. Esta etapa fecha 4 gaps: reagrupamento de navegação, topbar com avatar/dropdown, faixa de profundidade adaptativa (preferência local, infraestrutura pronta pro resto do app consumir depois) e command palette (⌘K).

## 1. Objetivo

- Sidebar: 4 grupos (Carteira/Inteligência/Planejamento/Conta) em vez de 2, rodapé com selo SOC 2 · LGPD em vez de botão de sair.
- Topbar: avatar + nome + plano com dropdown (Configurações/Sair).
- Contexto de profundidade adaptativa (Iniciante/Intermediário/Avançado), persistido em localStorage, com faixa na topbar; Dashboard consome como prova de conceito.
- Command palette (⌘K/Ctrl+K): navegação estática pras rotas da sidebar + 1-2 ações (alternar tema, abrir configurações). Sem busca de ativos (precisaria de API — fora de escopo).

## 2. Estado atual

`src/components/app-sidebar.tsx`: 2 grupos (`Investir`, `Inteligência`) + grupo `Administração` condicional por role + rodapé com item "Sair" (`SidebarFooter` → `SidebarLink` pra `/signout`).

`src/components/layout/AppTopbar.tsx`: breadcrumb ausente (só título+subtítulo), botão "Buscar ativos" que **navega** pra `/asset-search` (não abre palette), badge de plano (`useSubscription` → `displayPlanName`), botões de config/notificações — mas nenhum avatar, nenhum dropdown, nenhum nome de usuário.

Nenhum contexto de profundidade adaptativa existe no app logado (só a demo estática/mockada da Landing, que não compartilha estado com isso).

`cmdk` já é dependência do projeto; `src/components/ui/command.tsx` já existe (shadcn `Command`/`CommandDialog`/`CommandInput`/`CommandList`/`CommandGroup`/`CommandItem`/`CommandShortcut`) — pronto pra uso, não precisa ser criado.

Rotas disponíveis (de `src/App.tsx`, área logada): `/dashboard`, `/portfolio` (+ `/portfolio/asset/:id`, `/portfolio/:symbol`), `/add-asset`, `/dividends` (+ `/dividends/:symbol`), `/transactions`, `/planning`, `/comparator`, `/ai-insights`, `/chat-inteligente`, `/asset-search`, `/ri-inteligente`, `/fiscal`, `/sync-accounts`, `/settings`, `/subscription`, `/admin`, `/admin/plans`, `/admin/grants`.

Dados de usuário: `useAuth()` só expõe `userId`/`role` (do JWT) — sem nome/email. `src/services/profile/index.ts` já expõe `Profile.getProfile()`, usado em `src/hooks/useSettings.ts` (`IUserProfileResponse`: `firstName`, `lastName`, `email`, ...). Nenhum hook dedicado e cacheado (react-query) existe pra consumir isso fora de Settings.

## 3. Decisões tomadas

| Questão | Decisão |
|---|---|
| Agrupamento da nav | 4 grupos: **Carteira** (Dashboard, Portfólio, Dividendos, Transações, Adicionar Ativo), **Inteligência** (IA Insights, Chat Inteligente, Buscar Ativos, RI Inteligente), **Planejamento** (Planejamento, Comparador, Fiscal, Contas Conectadas), **Conta** (Configurações, Assinatura). Grupo `Administração` condicional continua igual, no fim. |
| "Sair" | Sai do rodapé da sidebar, vai pro dropdown do avatar na topbar. Rodapé da sidebar vira selo estático "SOC 2 · LGPD". |
| Dados do avatar | Hook novo `useCurrentUserProfile` (react-query, `staleTime` alto — dado muda raramente), reaproveitando `Profile.getProfile()`. Nome exibido: `firstName`. Iniciais do avatar: primeira letra de `firstName` + primeira letra de `lastName`. |
| Profundidade adaptativa | Contexto React novo (`AdaptiveLevelContext`), 3 valores (`'iniciante' \| 'intermediario' \| 'avancado'`), default `'intermediario'`, persistido em `localStorage` (`adaptive-level`). Prova de conceito: o KPI principal do Dashboard (`Index.tsx`) muda rótulo/formato conforme o nível — não retrofita as outras 16 telas, isso fica pra quando cada uma for redesenhada. |
| Command palette | `useCommandPalette` (estado open/close + listener de teclado ⌘K/Ctrl+K) + componente `CommandPalette.tsx` usando os primitivos já existentes. 2 grupos: "Ir para" (rotas da sidebar, mesma lista/ícones dos 4 grupos) e "Ações" (alternar tema, abrir configurações). Botão "Buscar ativos" da topbar **não muda de função** (continua navegando pra `/asset-search`) — o ⌘K é um mecanismo novo e separado, ativado só por atalho de teclado e por um ícone de busca dedicado que substitui o botão de busca atual? **Não** — mantém os dois: o botão existente vira gatilho visual do ⌘K (abre a palette em vez de navegar direto), já que o handoff descreve exatamente esse padrão ("botão de busca (⌘K)"). |

## 4. Sidebar — mudança exata

Em `src/components/app-sidebar.tsx`, `const sections: NavSection[]` passa de 2 pra 4:

```ts
const sections: NavSection[] = [
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
      {to: '/sync-accounts', label: 'Contas Conectadas', icon: CircleDollarSign},
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

(`Settings` precisa ser importado de `@/components/ui/icons` — hoje não está entre os imports do arquivo.)

`footerItems`/`SidebarFooter` removidos (o item "Sair" e seu import de `LogOut` saem — `LogOut` deixa de ser usado neste arquivo). `SidebarFooter` passa a renderizar um selo estático:

```tsx
<SidebarFooter className="border-t border-sidebar-border/60 px-4 py-3">
  <p className="flex items-center gap-1.5 text-[10.5px] font-medium uppercase tracking-[0.1em] text-sidebar-foreground/45">
    <ShieldCheck className="h-3 w-3" />
    SOC 2 · LGPD
  </p>
</SidebarFooter>
```

(`ShieldCheck` já é importado no arquivo, reaproveitado.)

## 5. Topbar — avatar e dropdown

**Arquivo novo:** `src/hooks/useCurrentUserProfile.ts`

```ts
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

Em `AppTopbar.tsx`, adicionar ao final do grupo de ações (depois do sino de notificações): `DropdownMenu` (`@/components/ui/dropdown-menu`, já existe) com trigger = avatar (círculo com iniciais, `bg-brand/15 text-brand`) + nome (`firstName`, escondido em telas pequenas) + plano (reaproveita `displayPlanName` já disponível via `useSubscription`, que o arquivo já importa). Conteúdo do dropdown: item "Configurações" (navega `/settings`) e item "Sair" (usa `logout` de `useAuth()`).

## 6. Profundidade adaptativa

**Arquivo novo:** `src/contexts/AdaptiveLevelContext.tsx`

```tsx
type AdaptiveLevel = 'iniciante' | 'intermediario' | 'avancado';

interface AdaptiveLevelContextValue {
  level: AdaptiveLevel;
  setLevel: (level: AdaptiveLevel) => void;
}
```

Provider lê/escreve `localStorage.getItem('adaptive-level')`/`setItem`, default `'intermediario'` se ausente ou valor inválido. Hook `useAdaptiveLevel()` consome o contexto (lança erro se usado fora do provider, mesmo padrão de outros contexts do projeto — conferir `ConsentContext.tsx` pra seguir a convenção exata).

Provider entra em `src/App.tsx`, envolvendo a árvore autenticada (mesmo nível de `ProtectedRoute`/onde `AppSidebar`/`AppTopbar` já são renderizados).

Faixa na topbar (`AppTopbar.tsx`), abaixo da linha principal (handoff: "faixa do nível de profundidade vigente"): segmented control com os 3 níveis (mesmo padrão visual do segmented control já usado em `AuthTabs`/`ThemeToggle` da etapa anterior — 3 botões, ativo com `bg-background text-foreground shadow-sm`, inativo `text-muted-foreground`), mais um texto pequeno indicando a origem ("Preferência salva" — não "sugerido pela IA", já que não há IA de verdade decidindo nesta etapa; isso é uma divergência documentada em relação ao handoff, que assume que a IA decide o nível — aqui é 100% escolha do usuário).

**Prova de conceito no Dashboard:** em `src/pages/Index.tsx`, o segundo card de `MetricCellGrid` (hoje `label="P&L do período"`, linhas 1058-1081) recebe rótulo condicionado ao nível via `useAdaptiveLevel()` — o `value`/`tone`/dado numérico **não mudam**, só `label` e `sub`:
- **Iniciante:** `label="Como está indo"`, `sub` simplificado (ex.: só "desde o preço médio", sem o percentual técnico já mostrado no `value`).
- **Intermediário:** exatamente o que já existe hoje (`label="P&L do período"`, `sub` com o percentual) — nenhuma mudança de comportamento.
- **Avançado:** `label="P&L (custo médio)"`, `sub` mantém o percentual e acrescenta o valor absoluto já calculado em `summary.totalPnl` formatado, se ainda não estiver visível (não inventar dado novo, só reorganizar o que `summary` já fornece).

Esse é o único ponto do produto que reage ao nível nesta etapa — documentar isso claramente no código (comentário) pra próxima etapa (redesenho das 17 telas) saber que o padrão de consumo é `useAdaptiveLevel()` e pode ser replicado.

## 7. Command palette

**Arquivo novo:** `src/hooks/useCommandPalette.ts`

```ts
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

**Arquivo novo:** `src/components/layout/CommandPalette.tsx`

Usa `CommandDialog` (`open`/`onOpenChange` vindos de `useCommandPalette`), `CommandInput`, `CommandList`, `CommandEmpty`, dois `CommandGroup`:
- **"Ir para"**: todos os itens dos 4 grupos da sidebar (reaproveitar a mesma constante `sections` — exportá-la de `app-sidebar.tsx` ou centralizar em um arquivo `nav-data.ts` novo compartilhado por `AppSidebar` e `CommandPalette`, pra não duplicar a lista de rotas/labels/ícones em dois lugares).
- **"Ações"**: "Alternar tema" (chama a mesma lógica de `ThemeToggle` — ver `src/components/ThemeToggle.tsx` pra reaproveitar, não duplicar), "Abrir configurações" (navega `/settings`).

Cada `CommandItem` usa `onSelect` pra navegar (`useNavigate`) e fechar a palette (`setOpen(false)`).

`AppTopbar.tsx` monta `<CommandPalette open={open} onOpenChange={setOpen} />` (estado vindo de `useCommandPalette()` chamado no próprio `AppTopbar`) e o botão existente "Buscar ativos" passa a chamar `setOpen(true)` em vez de `navigate('/asset-search')` — ganha um `<CommandShortcut>⌘K</CommandShortcut>` visível ao lado do label.

## 8. Extração de dados de navegação compartilhados

**Arquivo novo:** `src/components/layout/nav-data.ts`

Move `NavItem`, `NavSection` e a constante `sections` (4 grupos, seção 4 acima) de `app-sidebar.tsx` pra cá. `app-sidebar.tsx` importa de lá; `CommandPalette.tsx` também. Isso é a única extração estrutural desta etapa — evita a lista de rotas divergir entre sidebar e palette.

## 9. Testes

- `app-sidebar.spec.tsx` (criar se não existir — conferir primeiro): renderiza os 4 grupos com os labels certos, item ativo recebe destaque, rodapé mostra "SOC 2 · LGPD" e não mostra mais "Sair".
- `AppTopbar.spec.tsx` (já existe, conferir): avatar/dropdown renderiza nome do usuário (mockar `useCurrentUserProfile`), item "Sair" chama `logout`.
- `AdaptiveLevelContext.spec.tsx`: provider default `intermediario`, `setLevel` persiste em localStorage, hook lança erro fora do provider.
- `CommandPalette.spec.tsx`: abre com `Ctrl+K` simulado, filtra por texto, `onSelect` de um item de rota navega e fecha a palette.
- `dashboard-summary.utils.spec.ts` ou equivalente (conferir onde a lógica de KPI do Dashboard já é testada) — cobrir os 3 níveis do rótulo adaptativo.
- `npm run type-check`, `npm run lint`, `npm run test:unit`, `npm run build`.
- E2E: rodar suíte completa (não só um arquivo — a experiência dos últimos 3 branches mostrou que mudanças de shell tendem a quebrar seletores em specs não óbvios).
- Verificação visual manual: sidebar com 4 grupos, dropdown do avatar, trocar nível na faixa e ver o Dashboard reagir, abrir ⌘K e navegar.

## 10. Fora de escopo

- Redesenho das 17 telas do produto (cada uma é uma etapa futura).
- IA de verdade decidindo o nível adaptativo (fica só como preferência do usuário nesta etapa).
- Busca de ativos da carteira dentro do ⌘K (precisa de API).
- Notificações reais (o sino já existe, sem popover funcional — não é desta etapa).
- Breadcrumb com trilha de mais de 1 nível (telas de detalhe tipo `/portfolio/asset/:id` continuam usando só título/subtítulo, sem trilha "Portfólio > PETR4").
