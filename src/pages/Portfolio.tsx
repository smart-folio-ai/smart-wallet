import {useMemo, useReducer, useState} from 'react';
import * as XLSX from 'xlsx';
import {useNavigate} from 'react-router-dom';
import {useQuery, useQueryClient, useMutation} from '@tanstack/react-query';
import {Loader2, Trash2} from '@/components/ui/icons';
import {ConfirmDialog} from '@/components/ConfirmDialog';
import useAppToast from '@/hooks/use-app-toast';

// Types and Services
import {Asset} from '@/types/portfolio';
import portfolioService from '@/services/portfolio';
import {useSelectedPortfolio} from '@/contexts/SelectedPortfolioContext';

// Nocturne shared components
import {
  SectionHeader,
  DataTable,
  TD_STYLE,
  TD_RIGHT,
  MarketDataStaleBanner,
} from '@/components/shared';
import {badgeStyle, type BadgeSeverity} from '@/components/shared/badge-style';
import {useAdaptiveLevel} from '@/contexts/AdaptiveLevelContext';
import {
  deriveMarketDataStatus,
  hasFreshQuote,
} from '@/pages/dashboard-summary.utils';
import {usePortfolioComposition} from '@/hooks/usePortfolioComposition';
import {usePortfolioRiskContribution} from '@/hooks/usePortfolioRiskContribution';
import {
  buildRiskRows,
  describeExcluded,
  describeRiskFooter,
  riskBarWidthPct,
} from '@/pages/risk-contribution-display.utils';
import type {AllocationBucket} from '@/hooks/usePortfolioComposition';
import {
  buildExposureRowsFromBuckets,
  deviationColor,
} from '@/pages/composition-display.utils';
import {formatPctPtBr, formatPpPtBr, formatSignedPctPtBr} from '@/utils/formatters';
import {describeAsset} from '@/pages/portfolio-asset-display.utils';

// ── Exposure + Risk helpers ────────────────────────────────────────────────
//
// Havia aqui um `DEFAULT_TARGETS` (stock 40 / fii 20 / fund 25 / etf 10 /
// crypto 5) que o card "Real vs alvo da política de investimento" usava como
// alvo. Não era a política do usuário: era um número inventado exibido com o
// rótulo da política dele. Saiu em TRA-141 — o alvo agora vem de
// `/portfolio/composition`, que lê a meta real e reusa o mesmo cálculo do
// alerta de alocação.

/** Balde da política -> chave de cor já usada pelo card. */
const BUCKET_COLOR_KEY: Record<AllocationBucket, string> = {
  stocks: 'stock',
  crypto: 'crypto',
  fiis: 'fii',
  other: 'other',
};
const TYPE_LABEL: Record<string, string> = {
  stock: 'Ações', fii: 'FIIs', fund: 'Renda Fixa', etf: 'ETFs', crypto: 'Cripto', other: 'Outros',
};
/** Classe no singular, como na coluna "Classe" do handoff. */
const CLASS_LABEL: Record<string, string> = {
  stock: 'Ação BR', fii: 'FII', fund: 'Renda fixa', etf: 'ETF', crypto: 'Cripto', other: 'Outros',
};

// Mesma paleta usada no donut/legenda de alocação do dashboard (ver ALLOCATION_COLORS em Index.tsx),
// estendida para as classes adicionais exibidas aqui (fund/etf não existem como fatia própria lá).
const CLASS_COLORS: Record<string, string> = {
  stock: 'hsl(var(--chart-2))',
  crypto: 'hsl(var(--chart-1))',
  fii: 'hsl(var(--chart-4))',
  fund: 'hsl(var(--chart-3))',
  etf: 'hsl(var(--chart-5))',
  other: 'hsl(var(--chart-3))',
};

export type ExposureGroupBy = 'class' | 'sector' | 'account';

function pickGroupKey(a: Asset, groupBy: ExposureGroupBy): string {
  if (groupBy === 'sector') return String(a.sector || '').trim() || 'Sem setor';
  if (groupBy === 'account') return a.account ?? 'Sem conta';
  return a.type;
}

function computeExposure(
  assets: Asset[],
  totalValue: number,
  groupBy: ExposureGroupBy = 'class',
) {
  const acc: Record<string, number> = {};
  for (const a of assets) {
    const k = pickGroupKey(a, groupBy);
    acc[k] = (acc[k] || 0) + a.value;
  }
  return Object.entries(acc)
    .map(([key, value]) => {
      const pct = totalValue > 0 ? (value / totalValue) * 100 : 0;
      // Sem alvo aqui: agrupamento por tipo cru (6 tipos) não casa com a
      // política, que é definida em 4 baldes. Quando há meta, as linhas vêm
      // de `buildExposureRowsFromBuckets` no lugar desta função.
      const target = 0;
      return {
        type: key,
        label: groupBy === 'class' ? (TYPE_LABEL[key] || key) : key,
        value,
        pct,
        dev: pct - target,
        target,
        color: CLASS_COLORS[key] || 'var(--color-neutral-400)',
      };
    })
    .sort((a, b) => b.value - a.value);
}

/**
 * Leitura da posição no vocabulário do handoff ("Em linha", "Concentração"…).
 * Não é recomendação de compra ou venda: só aponta o que merece atenção.
 */
function positionSignal(asset: {allocation: number; profitLossPercentage?: number; beta?: number}):
  | {label: string; severity: BadgeSeverity}
  | null {
  if (asset.allocation > 15) return {label: 'Concentração', severity: 'warn'};
  if (asset.beta != null && asset.beta > 1.5) return {label: 'Risco alto', severity: 'neg'};
  const pnl = asset.profitLossPercentage;
  if (pnl == null) return null;
  if (pnl >= 30) return {label: 'Realizar parcial', severity: 'info'};
  if (pnl <= -15) return {label: 'Revisar tese', severity: 'info'};
  return {label: 'Em linha', severity: 'ok'};
}

// ── Colunas ────────────────────────────────────────────────────────────────
type ColumnKey = 'class' | 'account' | 'qty' | 'price' | 'weight' | 'beta';
const OPTIONAL_COLUMNS: {key: ColumnKey; label: string}[] = [
  {key: 'class', label: 'Classe'},
  {key: 'account', label: 'Conta'},
  {key: 'qty', label: 'Qtd'},
  {key: 'price', label: 'Preço'},
  {key: 'weight', label: 'Peso'},
  {key: 'beta', label: 'Beta'},
];

function hiddenColumnsReducer(state: Record<ColumnKey, boolean>, key: ColumnKey) {
  return {...state, [key]: !state[key]};
}

const COLUMN_TIPS = {
  weight: {
    title: 'Peso na carteira',
    body: 'Percentual do valor total da carteira que esse ativo representa hoje.',
    formula: 'valor do ativo ÷ valor total',
  },
  beta: {
    title: 'Beta vs IBOV',
    body: 'Sensibilidade do ativo ao índice de referência. Acima de 1 amplifica movimentos do índice; abaixo de 1 amortece.',
    formula: 'cov(ativo, ibov) ÷ var(ibov)',
  },
};

function ColumnMenu({
  hidden,
  onToggle,
  showBeta,
}: {
  hidden: Record<ColumnKey, boolean>;
  onToggle: (key: ColumnKey) => void;
  showBeta: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{position: 'relative'}}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 5.6,
          height: 30,
          padding: '0 11.2px',
          borderRadius: 8,
          background: 'transparent',
          fontFamily: 'var(--font-body)',
          fontSize: 11.5,
          cursor: 'pointer',
          border: `1px solid ${open ? 'var(--color-accent-700)' : 'var(--hair)'}`,
          color: open ? 'var(--color-accent-200)' : 'var(--color-neutral-300)',
        }}>
        <i className="ph ph-columns" style={{fontSize: 13}} />
        <span>Colunas</span>
        <i className={open ? 'ph ph-caret-up' : 'ph ph-caret-down'} style={{fontSize: 11}} />
      </button>
      {open && (
        <div
          style={{
            position: 'absolute',
            top: 36,
            right: 0,
            zIndex: 70,
            width: 216,
            border: '1px solid var(--hair)',
            borderRadius: 8,
            background: 'var(--surf-4)',
            boxShadow: 'var(--shadow-lg)',
            padding: 8.4,
          }}>
          <div style={{fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-neutral-600)', padding: '4px 8px 8px'}}>
            Mostrar colunas
          </div>
          {OPTIONAL_COLUMNS.filter((c) => showBeta || c.key !== 'beta').map((c) => {
            const on = !hidden[c.key];
            return (
              <button
                key={c.key}
                type="button"
                onClick={() => onToggle(c.key)}
                style={{display: 'flex', alignItems: 'center', gap: 8.4, width: '100%', padding: '7px 8px', border: 'none', borderRadius: 6, background: 'transparent', color: 'var(--color-neutral-200)', fontFamily: 'var(--font-body)', fontSize: 12.5, cursor: 'pointer'}}>
                <i
                  className={on ? 'ph-fill ph-check-square' : 'ph ph-square'}
                  style={{fontSize: 14, color: on ? 'var(--color-accent-300)' : 'var(--color-neutral-600)'}}
                />
                <span style={{flex: 1, textAlign: 'left'}}>{c.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────
const formatCurrency = (v: number) =>
  v.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'});
const formatQuantity = (v: number) =>
  v.toLocaleString('pt-BR', {maximumFractionDigits: 8});

const CHIP_STYLE: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 5.6,
  height: 26,
  padding: '0 8.4px',
  border: '1px solid var(--hair)',
  borderRadius: 6,
  fontSize: 11.5,
  color: 'var(--color-neutral-400)',
  background: 'transparent',
};

// ── Portfolio Page ─────────────────────────────────────────────────────────
const Portfolio = () => {
  const toast = useAppToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const {level} = useAdaptiveLevel();
  // Meta real do usuário e desvio por balde (TRA-141). Substitui o
  // `DEFAULT_TARGETS` que o card de exposição exibia como se fosse a política.
  const {data: composition} = usePortfolioComposition();
  const {data: riskContribution} = usePortfolioRiskContribution();
  // A carteira é escolhida no seletor do topo e vale para todas as telas.
  const {portfolios, selectedId, selectedPortfolio, isAll, setSelectedId} =
    useSelectedPortfolio();

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [exposureGroupBy, setExposureGroupBy] = useState<ExposureGroupBy>('class');
  const [includeFixedIncome, setIncludeFixedIncome] = useState(true);
  const [hiddenCols, toggleCol] = useReducer(hiddenColumnsReducer, {
    class: false,
    account: false,
    qty: false,
    price: false,
    weight: false,
    beta: false,
  });

  const {
    data: apiAssets = [],
    isLoading: loading,
    dataUpdatedAt: assetsUpdatedAt,
  } = useQuery({
    queryKey: ['portfolioAssets'],
    queryFn: async () => {
      const data = await portfolioService.getAssets();
      return Array.isArray(data) ? data : [];
    },
  });

  const displayApiAssets = useMemo(
    () =>
      isAll ? apiAssets : apiAssets.filter((a: any) => a.portfolioId === selectedId),
    [apiAssets, isAll, selectedId],
  );

  const totalApiValue = displayApiAssets.reduce(
    (sum: number, asset: any) => sum + (asset.total || 0),
    0,
  );

  // Preço: cotação viva quando o feed tem; senão o fechamento que veio do
  // relatório da B3 (`price`). Resultado só com custo real — `avgPrice` sai
  // das negociações importadas; sem ele o P&L fica indisponível em vez de
  // virar um zero falso (TRA-92).
  const assets: Asset[] = displayApiAssets.map((a: any) => {
    // Em lançamento manual `price` é o preço de compra, não mercado: só o
    // fechamento do relatório da B3 serve de fallback para a cotação.
    const reportPrice = a.source === 'b3' && a.price > 0 ? a.price : undefined;
    const marketPrice = hasFreshQuote(a) ? a.currentPrice : reportPrice;
    const avg = Number(a.avgPrice) > 0 ? Number(a.avgPrice) : undefined;
    const pnlPct =
      avg && marketPrice > 0 ? ((marketPrice - avg) / avg) * 100 : undefined;
    const pnlValue =
      avg && marketPrice > 0 ? (marketPrice - avg) * (a.quantity ?? 0) : undefined;

    return {
      _id: a.id || a._id,
      symbol: a.symbol,
      name: a.name || a.symbol,
      price: reportPrice ?? 0,
      currentPrice: hasFreshQuote(a) ? a.currentPrice : undefined,
      change24h: a.change24h ?? 0,
      amount: a.quantity,
      value: a.total,
      allocation: totalApiValue > 0 ? (a.total / totalApiValue) * 100 : 0,
      type: a.type,
      sector: a.sector ?? undefined,
      avgPrice: avg,
      purchasePrice: avg,
      profitLoss: pnlValue,
      profitLossPercentage: pnlPct,
      beta: a.indicators?.beta ?? undefined,
      account: a.portfolio?.name ?? undefined,
    };
  });

  const FIXED_INCOME_TYPES = new Set(['fund', 'other']);
  const filteredAssets = assets
    .filter((asset) => includeFixedIncome || !FIXED_INCOME_TYPES.has(asset.type))
    .sort((a, b) => b.value - a.value);

  const totalValue = assets.reduce((sum, asset) => sum + asset.value, 0);
  const accountCount = new Set(assets.map((a) => a.account).filter(Boolean)).size;

  const marketStatus = useMemo(
    () => deriveMarketDataStatus(displayApiAssets),
    [displayApiAssets],
  );

  const openAssetDetails = (asset: Asset) => {
    if (asset._id) navigate(`/portfolio/asset/${asset._id}`);
    else navigate(`/portfolio/asset/symbol/${asset.symbol}`);
  };

  const deletePortfolioMutation = useMutation({
    mutationFn: async (portfolioId: string) => portfolioService.deletePortfolio(portfolioId),
    onSuccess: async () => {
      toast.success('Carteira removida', 'A carteira foi removida com sucesso.');
      setSelectedId('all');
      setDeleteDialogOpen(false);
      await queryClient.invalidateQueries();
    },
    onError: () => {
      toast.error('Erro ao remover carteira', 'Não foi possível remover a carteira selecionada.');
      setDeleteDialogOpen(false);
    },
  });

  // ── Nocturne derived values ───────────────────────────────────────────
  // Com meta configurada, o card compara contra a política REAL, nos 4 baldes
  // em que ela é definida (TRA-141). Sem meta — ou agrupando por setor/conta,
  // que a política não cobre — mostra só o peso, sem inventar alvo.
  const exposureRows = useMemo(() => {
    const rebalancing = composition?.rebalancing;
    if (exposureGroupBy === 'class' && rebalancing?.hasTarget) {
      return buildExposureRowsFromBuckets(
        rebalancing.buckets,
        rebalancing.totalValue,
      ).map((row) => ({
        ...row,
        type: row.bucket,
        color:
          CLASS_COLORS[BUCKET_COLOR_KEY[row.bucket]] ||
          'var(--color-neutral-400)',
      }));
    }
    return computeExposure(filteredAssets, totalValue, exposureGroupBy);
  }, [composition, filteredAssets, totalValue, exposureGroupBy]);
  const hasPolicyTarget =
    exposureGroupBy === 'class' && Boolean(composition?.rebalancing?.hasTarget);
  const groupLabel =
    exposureGroupBy === 'sector' ? 'setor' : exposureGroupBy === 'account' ? 'conta' : 'classe';
  // Decomposição de Euler do servidor (TRA-141). Antes a "fatia do VaR" saía
  // de multiplicadores fixos por classe — sem dado, o card não aparece.
  const riskRows = useMemo(() => buildRiskRows(riskContribution), [riskContribution]);
  const riskExcludedNote = describeExcluded(riskContribution);

  // Mesmo corte do dashboard: visão quantitativa do intermediário em diante.
  const isAdvanced = level !== 'iniciante';
  const riskSectionTitle = isAdvanced ? 'Contribuição de risco por ativo' : 'Onde está concentrada a carteira';
  const riskSectionSubtitle = isAdvanced
    ? 'Fatia do VaR 95% · janela 252 dias'
    : 'Quanto cada ativo pesa no sobe-e-desce da carteira';
  const riskInsight = describeRiskFooter(riskRows, isAdvanced);

  const show = {
    class: !hiddenCols.class,
    account: !hiddenCols.account,
    qty: !hiddenCols.qty,
    price: !hiddenCols.price,
    weight: !hiddenCols.weight,
    beta: isAdvanced && !hiddenCols.beta,
  };

  // Cabeçalho e linhas saem da mesma lista: a ordem das colunas não pode
  // divergir entre `<th>` e `<td>`.
  const columns: {
    key: string;
    label: string;
    align?: 'left' | 'right';
    visible: boolean;
    tooltip?: {title: string; body: string; formula?: string};
    cell: (asset: Asset) => React.ReactNode;
    exportValue: (asset: Asset) => string | number;
  }[] = [
    {
      key: 'symbol',
      label: 'Ativo',
      visible: true,
      cell: (asset) => {
        const display = describeAsset(asset);
        return (
          <div style={{display: 'flex', alignItems: 'center', gap: 8.4}}>
            <div style={{width: 24, height: 24, borderRadius: 6, border: '1px solid var(--hair)', display: 'grid', placeItems: 'center', fontSize: 9, fontWeight: 600, color: 'var(--color-neutral-400)', flexShrink: 0}}>
              {display.badge}
            </div>
            <div style={{minWidth: 0}}>
              <div style={{fontWeight: 600}}>{display.title}</div>
              {display.subtitle ? (
                <div style={{fontSize: 10.5, color: 'var(--color-neutral-600)'}}>{display.subtitle}</div>
              ) : null}
            </div>
          </div>
        );
      },
      exportValue: (asset) => describeAsset(asset).title,
    },
    {
      key: 'class',
      label: 'Classe',
      visible: show.class,
      cell: (asset) => (
        <span style={{color: 'var(--color-neutral-500)', fontSize: 11.5}}>{CLASS_LABEL[asset.type] ?? asset.type}</span>
      ),
      exportValue: (asset) => CLASS_LABEL[asset.type] ?? asset.type,
    },
    {
      key: 'account',
      label: 'Conta',
      visible: show.account,
      cell: (asset) => (
        <span style={{color: 'var(--color-neutral-500)', fontSize: 11.5}}>{asset.account ?? '—'}</span>
      ),
      exportValue: (asset) => asset.account ?? '',
    },
    {
      key: 'qty',
      label: 'Qtd',
      align: 'right',
      visible: show.qty,
      cell: (asset) => (
        <span style={{color: 'var(--color-neutral-300)'}}>{asset.amount ? formatQuantity(asset.amount) : '—'}</span>
      ),
      exportValue: (asset) => asset.amount ?? '',
    },
    {
      key: 'price',
      label: 'Preço',
      align: 'right',
      visible: show.price,
      cell: (asset) => {
        const price = asset.currentPrice ?? asset.price;
        return (
          <span
            title={asset.currentPrice == null && price ? 'Fechamento informado no relatório da B3' : undefined}
            style={{color: asset.currentPrice == null ? 'var(--color-neutral-500)' : 'var(--color-neutral-300)'}}>
            {price ? formatCurrency(price) : '—'}
          </span>
        );
      },
      exportValue: (asset) => asset.currentPrice ?? asset.price ?? '',
    },
    {
      key: 'value',
      label: 'Posição',
      align: 'right',
      visible: true,
      cell: (asset) => <span style={{fontWeight: 600}}>{formatCurrency(asset.value)}</span>,
      exportValue: (asset) => asset.value,
    },
    {
      key: 'pnl',
      label: 'Resultado',
      align: 'right',
      visible: true,
      cell: (asset) =>
        asset.profitLossPercentage == null ? (
          <span
            title="Sem preço médio: importe o Extrato de Negociação da B3 para calcular o resultado."
            style={{color: 'var(--color-neutral-500)'}}>
            —
          </span>
        ) : (
          <span style={{fontWeight: 600, color: asset.profitLossPercentage >= 0 ? 'var(--pos)' : 'var(--neg)'}}>
            {formatSignedPctPtBr(asset.profitLossPercentage)}
          </span>
        ),
      exportValue: (asset) => asset.profitLoss ?? '',
    },
    {
      key: 'weight',
      label: 'Peso',
      align: 'right',
      visible: show.weight,
      tooltip: COLUMN_TIPS.weight,
      cell: (asset) => (
        <span style={{color: 'var(--color-neutral-300)'}}>{formatPctPtBr(asset.allocation, 1)}</span>
      ),
      exportValue: (asset) => Number(asset.allocation.toFixed(2)),
    },
    {
      key: 'beta',
      label: 'Beta',
      align: 'right',
      visible: show.beta,
      tooltip: COLUMN_TIPS.beta,
      cell: (asset) => (
        <span style={{color: 'var(--color-neutral-400)'}}>
          {asset.beta != null ? asset.beta.toFixed(2).replace('.', ',') : '—'}
        </span>
      ),
      exportValue: (asset) => asset.beta ?? '',
    },
    {
      key: 'signal',
      label: 'Sinal',
      align: 'right',
      visible: true,
      cell: (asset) => {
        const signal = positionSignal(asset);
        return (
          <span style={{display: 'inline-flex', alignItems: 'center', gap: 8.4}}>
            {signal ? (
              <span style={badgeStyle(signal.severity)}>{signal.label}</span>
            ) : (
              <span style={{color: 'var(--color-neutral-500)'}}>—</span>
            )}
            <i className="ph ph-caret-right" style={{fontSize: 12, color: 'var(--color-neutral-600)'}} />
          </span>
        );
      },
      exportValue: (asset) => positionSignal(asset)?.label ?? '',
    },
  ];
  const activeColumns = columns.filter((c) => c.visible);

  const handleExportXlsx = () => {
    const rows = filteredAssets.map((asset) =>
      Object.fromEntries(activeColumns.map((c) => [c.label, c.exportValue(asset)])),
    );
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Posições');
    const today = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(workbook, `posicoes-trackerr-${today}.xlsx`);
    toast.success(
      'Planilha exportada',
      `${filteredAssets.length} posições · arquivo enviado para downloads.`,
    );
  };

  const syncedAt = assetsUpdatedAt
    ? new Date(assetsUpdatedAt).toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'})
    : null;
  const positionsLabel = `${filteredAssets.length} ${filteredAssets.length === 1 ? 'posição' : 'posições'}`;
  const accountsLabel = `${accountCount} ${accountCount === 1 ? 'conta' : 'contas'}`;

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <div style={{display: 'flex', flexDirection: 'column', gap: 16.8}}>

      {marketStatus.isStale && (
        <MarketDataStaleBanner
          updatedAt={assetsUpdatedAt || null}
          staleCount={marketStatus.staleCount}
          totalCount={marketStatus.totalCount}
          staleSymbols={marketStatus.staleSymbols}
        />
      )}

      {/* Toolbar: agregação + filtros + meta line */}
      <div style={{display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 11.2}}>
        <div style={{display: 'flex', padding: 2.8, gap: 2.8, border: '1px solid var(--hair)', borderRadius: 8, background: 'rgba(var(--rgb-bg),0.8)'}}>
          {(
            [
              {id: 'class', label: 'Classe'},
              {id: 'sector', label: 'Setor'},
              {id: 'account', label: 'Conta'},
            ] as {id: ExposureGroupBy; label: string}[]
          ).map((g) => (
            <button
              key={g.id}
              type="button"
              onClick={() => setExposureGroupBy(g.id)}
              aria-pressed={exposureGroupBy === g.id}
              style={
                exposureGroupBy === g.id
                  ? {height: 26, padding: '0 12px', fontSize: 12, border: 'none', borderRadius: 6, background: 'var(--nk-card)', color: 'var(--color-neutral-100)', boxShadow: 'var(--shadow-sm)', cursor: 'pointer'}
                  : {height: 26, padding: '0 12px', fontSize: 12, border: 'none', borderRadius: 6, background: 'transparent', color: 'var(--color-neutral-500)', cursor: 'pointer'}
              }>
              {g.label}
            </button>
          ))}
        </div>

        <div style={{display: 'flex', gap: 5.6, flexWrap: 'wrap'}}>
          <span style={CHIP_STYLE}>
            <i className="ph ph-wallet" style={{fontSize: 12}} />
            {selectedPortfolio?.name ?? 'Todas as contas'}
          </span>
          <span style={CHIP_STYLE}>
            <i className="ph ph-currency-circle-dollar" style={{fontSize: 12}} />
            Moeda: BRL
          </span>
          <button
            type="button"
            onClick={() => setIncludeFixedIncome((v) => !v)}
            aria-pressed={includeFixedIncome}
            style={{...CHIP_STYLE, cursor: 'pointer'}}>
            <i className={includeFixedIncome ? 'ph ph-check-square' : 'ph ph-square'} style={{fontSize: 12}} />
            Inclui renda fixa
          </button>
          {!isAll && (
            <ConfirmDialog
              open={deleteDialogOpen}
              onOpenChange={setDeleteDialogOpen}
              title="Remover carteira?"
              description={
                <>Isso vai remover <span style={{fontWeight: 500}}>{selectedPortfolio?.name ?? 'esta carteira'}</span> e todos os ativos importados/manualmente adicionados nela. Essa ação não pode ser desfeita.</>
              }
              trigger={
                <button type="button" disabled={deletePortfolioMutation.isPending} style={{...CHIP_STYLE, cursor: 'pointer'}}>
                  {deletePortfolioMutation.isPending ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Trash2 className="h-3 w-3" />
                  )}
                  Remover carteira
                </button>
              }
              confirmLabel="Remover"
              cancelLabel="Cancelar"
              confirmIcon={<Trash2 className="h-4 w-4 mr-2" />}
              confirmVariant="destructive"
              loading={deletePortfolioMutation.isPending}
              onConfirm={() => deletePortfolioMutation.mutate(selectedId)}
            />
          )}
        </div>

        <div style={{marginLeft: 'auto', fontSize: 11.5, color: 'var(--color-neutral-600)', fontVariantNumeric: 'tabular-nums'}}>
          {positionsLabel} · {formatCurrency(totalValue)}
          {syncedAt ? ` · sincronizado ${syncedAt}` : ''}
        </div>
      </div>

      {/* Grid Exposição + Risco */}
      <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 380px), 1fr))', gap: 16.8}}>
        {exposureRows.length > 0 && (
          <section style={{border: '1px solid var(--hair)', borderRadius: 8, background: 'var(--nk-card)'}}>
            <SectionHeader
              title={`Exposição por ${groupLabel}`}
              subtitle={
                // "Nada é escondido sem dizer que existe" (handoff): sem meta,
                // o card diz que o desvio existe e o que falta para vê-lo.
                hasPolicyTarget
                  ? 'Real vs alvo da política de investimento'
                  : exposureGroupBy === 'class'
                    ? 'Peso atual · defina uma política para ver o desvio'
                    : `Peso atual por ${groupLabel}`
              }
              action={
                <span style={{fontSize: 10.5, color: 'var(--color-neutral-600)'}}>
                  {hasPolicyTarget ? 'peso · desvio' : 'peso'}
                </span>
              }
            />
            <div style={{padding: 16.8, display: 'flex', flexDirection: 'column', gap: 14}}>
              {exposureRows.map((row) => (
                <div key={row.label}>
                  <div style={{display: 'flex', alignItems: 'baseline', gap: 8.4, fontSize: 12.5}}>
                    <span style={{flex: 1, color: 'var(--color-neutral-200)'}}>{row.label}</span>
                    <span style={{color: 'var(--color-neutral-500)', fontVariantNumeric: 'tabular-nums'}}>{formatCurrency(row.value)}</span>
                    <span style={{width: 46, textAlign: 'right', fontWeight: 600, fontVariantNumeric: 'tabular-nums'}}>{formatPctPtBr(row.pct, 1)}</span>
                    {hasPolicyTarget && (
                      <span
                        style={{
                          width: 62,
                          textAlign: 'right',
                          fontVariantNumeric: 'tabular-nums',
                          fontSize: 11.5,
                          color: deviationColor(row.dev),
                        }}>
                        {formatPpPtBr(row.dev)}
                      </span>
                    )}
                  </div>
                  <div style={{position: 'relative', height: 8, borderRadius: 2, background: 'rgba(var(--rgb-line),0.06)', marginTop: 5.6}}>
                    <div
                      style={{
                        position: 'absolute',
                        inset: '0 auto 0 0',
                        width: `${Math.min(row.pct, 100)}%`,
                        background: row.color,
                        borderRadius: 2,
                      }}
                    />
                    {row.target > 0 && (
                      <div
                        style={{
                          position: 'absolute',
                          top: -3,
                          bottom: -3,
                          left: `${Math.min(row.target, 100)}%`,
                          width: 2,
                          background: 'var(--color-neutral-400)',
                        }}
                      />
                    )}
                  </div>
                </div>
              ))}
              {hasPolicyTarget && (
                <div style={{display: 'flex', alignItems: 'center', gap: 8.4, fontSize: 11, color: 'var(--color-neutral-600)', paddingTop: 5.6, borderTop: '1px solid var(--hair-soft)'}}>
                  <span style={{width: 2, height: 12, background: 'var(--color-neutral-400)'}} />
                  <span>marca vertical = alvo definido na sua política</span>
                </div>
              )}
            </div>
          </section>
        )}

        {riskRows.length > 0 && (
          <section style={{border: '1px solid var(--hair)', borderRadius: 8, background: 'var(--nk-card)'}}>
            <SectionHeader title={riskSectionTitle} subtitle={riskSectionSubtitle} />
            {/* Linhas do handoff: ticker · barra · fatia do risco · peso. */}
            <div
              data-testid="risk-contribution-rows"
              style={{padding: 16.8, display: 'flex', flexDirection: 'column', gap: 11.2}}>
              {riskRows.map((row) => (
                <div key={row.symbol} style={{display: 'flex', alignItems: 'center', gap: 11.2}}>
                  <span style={{width: 62, fontSize: 12, fontWeight: 600, color: 'var(--color-neutral-200)'}}>
                    {row.symbol}
                  </span>
                  <div style={{flex: 1, height: 10, borderRadius: 2, background: 'rgba(var(--rgb-line),0.06)', overflow: 'hidden'}}>
                    <div
                      style={{
                        height: '100%',
                        width: `${riskBarWidthPct(row.sharePct)}%`,
                        background: row.warn ? 'var(--warn)' : 'var(--color-accent-400)',
                      }}
                    />
                  </div>
                  <span style={{width: 52, textAlign: 'right', fontSize: 12, fontVariantNumeric: 'tabular-nums', color: 'var(--color-neutral-300)'}}>
                    {row.share}
                  </span>
                  <span style={{width: 44, textAlign: 'right', fontSize: 11, fontVariantNumeric: 'tabular-nums', color: 'var(--color-neutral-600)'}}>
                    {row.weight}
                  </span>
                </div>
              ))}
              {(riskInsight || riskExcludedNote) && (
                <div style={{fontSize: 11.5, color: 'var(--color-neutral-500)', lineHeight: 1.5, paddingTop: 8.4, borderTop: '1px solid var(--hair-soft)'}}>
                  {riskInsight}
                  {riskInsight && riskExcludedNote ? ' ' : ''}
                  {riskExcludedNote}
                </div>
              )}
            </div>
          </section>
        )}
      </div>

      {/* Todas as posições */}
      <section style={{border: '1px solid var(--hair)', borderRadius: 8, background: 'var(--nk-card)'}}>
        <SectionHeader
          title="Todas as posições"
          subtitle={
            isAdvanced
              ? `${positionsLabel} · ${accountsLabel} · beta e sinal por ativo`
              : `${positionsLabel} · ${accountsLabel}`
          }
          action={
            <div style={{display: 'flex', gap: 8.4}}>
              <ColumnMenu hidden={hiddenCols} onToggle={toggleCol} showBeta={isAdvanced} />
              <button
                type="button"
                onClick={handleExportXlsx}
                disabled={filteredAssets.length === 0}
                style={{height: 30, padding: '0 11.2px', border: '1px solid var(--color-accent-700)', borderRadius: 8, background: 'transparent', color: 'var(--color-accent-200)', fontFamily: 'var(--font-body)', fontSize: 11.5, cursor: 'pointer'}}>
                Exportar XLSX
              </button>
            </div>
          }
        />
        <DataTable
          minWidth={860}
          columns={activeColumns.map(({label, align, tooltip}) => ({label, align, tooltip}))}>
          {loading ? (
            <tr>
              <td colSpan={activeColumns.length} style={{...TD_STYLE, textAlign: 'center', color: 'var(--color-neutral-500)'}}>
                <Loader2 className="h-4 w-4 animate-spin" style={{display: 'inline-block'}} />
              </td>
            </tr>
          ) : filteredAssets.length === 0 ? (
            <tr>
              <td colSpan={activeColumns.length} style={{...TD_STYLE, textAlign: 'center', color: 'var(--color-neutral-500)', fontSize: 12.5}}>
                {portfolios.length === 0
                  ? 'Nenhuma carteira ainda. Importe seus arquivos da B3 em Adicionar ativo.'
                  : 'Nenhum ativo encontrado.'}
              </td>
            </tr>
          ) : (
            filteredAssets.map((asset) => (
              <tr
                key={asset._id || asset.symbol}
                onClick={() => openAssetDetails(asset)}
                style={{borderTop: '1px solid var(--hair-soft)', cursor: 'pointer'}}
                className="hover:bg-[rgba(152,160,171,0.06)]">
                {activeColumns.map((column) => (
                  <td
                    key={column.key}
                    style={column.align === 'right' ? TD_RIGHT : TD_STYLE}>
                    {column.cell(asset)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </DataTable>
        <div style={{padding: '11.2px 16.8px', borderTop: '1px solid var(--hair-soft)', fontSize: 11, color: 'var(--color-neutral-600)'}}>
          Clique em uma linha para abrir a análise completa do ativo — indicadores, balanço, resultados, dividendos e a sua posição.
        </div>
      </section>
    </div>
  );
};

export default Portfolio;
