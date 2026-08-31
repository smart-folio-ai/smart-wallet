import React, {useMemo, useRef, useState} from 'react';
import {useMutation, useQuery} from '@tanstack/react-query';
import {useToast} from '@/hooks/use-toast';
import portfolioService from '@/services/portfolio';
import {formatCurrency} from '@/utils/formatters';
import {formatDate} from '@/utils';
import {KpiCard, SectionHeader, DataTable, TD_STYLE, TD_RIGHT} from '@/components/shared';

const TX_KIND_STYLE: Record<string, React.CSSProperties> = {
  buy: {padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: 'var(--badge-pos-bg)', color: 'var(--pos)'},
  sell: {padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: 'var(--badge-neg-bg)', color: 'var(--neg)'},
  dividend: {padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: 'rgba(145,132,217,0.15)', color: 'var(--color-accent-200)'},
  bonus: {padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: 'rgba(145,132,217,0.15)', color: 'var(--color-accent-200)'},
};
const TX_KIND_LABEL: Record<string, string> = {buy: 'Compra', sell: 'Venda', dividend: 'Provento', bonus: 'Bonificação'};
const TX_ORIGIN_STYLE: Record<string, React.CSSProperties> = {
  manual: {padding: '2px 8px', borderRadius: 6, fontSize: 11, background: 'rgba(var(--rgb-line),0.08)', color: 'var(--color-neutral-400)'},
  b3: {padding: '2px 8px', borderRadius: 6, fontSize: 11, background: 'var(--badge-cy-bg)', color: 'var(--cy)'},
  import: {padding: '2px 8px', borderRadius: 6, fontSize: 11, background: 'rgba(145,132,217,0.12)', color: 'var(--color-accent-200)'},
};
const TX_FILTERS = [
  {label: 'Todos', value: 'all'}, {label: 'Compra', value: 'buy'},
  {label: 'Venda', value: 'sell'}, {label: 'Provento', value: 'dividend'},
  {label: 'Bonificação', value: 'bonus'},
];

type Transaction = {
  _id: string;
  symbol: string;
  type: 'buy' | 'sell' | 'dividend' | 'bonus';
  side?: 'buy' | 'sell';
  quantity: number;
  price: number;
  fees?: number;
  total: number;
  date: string;
  provider?: string;
  account?: string;
};

export default function Transactions() {
  const {toast} = useToast();
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState<number>(currentYear);
  const [symbol, setSymbol] = useState('');
  const [selectedPortfolio, setSelectedPortfolio] = useState('all');
  const [txFilter, setTxFilter] = useState('all');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const {data: portfolios = []} = useQuery({
    queryKey: ['portfolios-for-transactions'],
    queryFn: async () => {
      const data = await portfolioService.getPortfolios();
      return Array.isArray(data) ? data : [];
    },
  });

  const {
    data: transactionsResponse,
    isLoading: loadingTransactions,
    refetch,
  } = useQuery({
    queryKey: ['portfolio-transactions', year, symbol],
    queryFn: async () => {
      const params: Record<string, unknown> = {year};
      if (symbol.trim()) params.symbol = symbol.trim().toUpperCase();
      const response = await portfolioService.getTransactions(params);
      return response?.transactions || [];
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      if (selectedPortfolio === 'all') {
        throw new Error('Selecione uma carteira para importar o extrato.');
      }
      return portfolioService.importB3Transactions(selectedPortfolio, file);
    },
    onSuccess: (result: any) => {
      toast({
        title: 'Extrato importado',
        description: `${result?.tradesImported || 0} transações importadas (${result?.ignoredDuplicates || 0} duplicadas ignoradas).`,
      });
      refetch();
    },
    onError: (error: any) => {
      toast({
        title: 'Erro na importação',
        description:
          error?.message || 'Não foi possível importar o extrato de negociações B3.',
        variant: 'destructive',
      });
    },
  });

  const transactions = useMemo(() => {
    const list = Array.isArray(transactionsResponse) ? transactionsResponse : [];
    return list.slice().sort((a: Transaction, b: Transaction) => {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
  }, [transactionsResponse]);

  const handleUploadFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    uploadMutation.mutate(file);
    event.target.value = '';
  };

  const stats = useMemo(() => {
    const buys = transactions.filter((t) => t.type === 'buy');
    const sells = transactions.filter((t) => t.type === 'sell');
    const divs = transactions.filter((t) => t.type === 'dividend');
    const totalBought = buys.reduce((s, t) => s + (t.total || 0), 0);
    const totalSold = sells.reduce((s, t) => s + (t.total || 0), 0);
    const totalDividends = divs.reduce((s, t) => s + (t.total || 0), 0);
    return {
      totalBought,
      totalSold,
      totalDividends,
      netBalance: totalSold - totalBought + totalDividends,
      buyCount: buys.length,
      sellCount: sells.length,
    };
  }, [transactions]);

  const filteredTx = useMemo(() => {
    if (txFilter === 'all') return transactions;
    return transactions.filter((t) => (t.type || t.side) === txFilter);
  }, [transactions, txFilter]);

  const accounts = portfolios;
  const period = String(year);
  const openImportModal = () => fileInputRef.current?.click();

  return (
    <div style={{display: 'flex', flexDirection: 'column', gap: 16.8}}>
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        style={{display: 'none'}}
        onChange={handleUploadFile}
        disabled={uploadMutation.isPending}
      />

      {/* Stats */}
      <div style={{display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: 11.2}}>
        <KpiCard label="Compras totais" value={formatCurrency(stats.totalBought)} sub={`${stats.buyCount} operações`} />
        <KpiCard label="Vendas totais" value={formatCurrency(stats.totalSold)} sub={`${stats.sellCount} operações`} />
        <KpiCard label="Proventos" value={formatCurrency(stats.totalDividends)} sub="recebidos no período" />
        <KpiCard
          label="Saldo líquido"
          value={formatCurrency(stats.netBalance)}
          deltaStyle={{color: stats.netBalance >= 0 ? 'var(--pos)' : 'var(--neg)'}}
          sub="compras - vendas + proventos"
        />
      </div>

      {/* Table */}
      <section style={{border: '1px solid var(--hair)', borderRadius: 8, background: 'var(--nk-card)'}}>
        <SectionHeader
          title="Todas as movimentações"
          subtitle={`${transactions.length} lançamentos · ${accounts.length} contas · ${period}`}
          action={
            <div style={{display: 'flex', gap: 8.4, flexWrap: 'wrap', alignItems: 'center'}}>
              {TX_FILTERS.map((f) => (
                <span key={f.value} onClick={() => setTxFilter(f.value)}
                  style={txFilter === f.value
                    ? {padding: '3px 10px', borderRadius: 20, fontSize: 11.5, cursor: 'pointer', background: 'rgba(145,132,217,0.18)', color: 'var(--color-accent-100)', border: '1px solid rgba(145,132,217,0.45)'}
                    : {padding: '3px 10px', borderRadius: 20, fontSize: 11.5, cursor: 'pointer', background: 'transparent', color: 'var(--color-neutral-500)', border: '1px solid var(--hair)'}}>
                  {f.label}
                </span>
              ))}
              <button type="button" onClick={openImportModal} style={{height: 30, padding: '0 11.2px', borderRadius: 8, border: '1px solid var(--color-accent-700)', background: 'transparent', color: 'var(--color-accent-200)', fontSize: 11.5, cursor: 'pointer', fontFamily: 'var(--font-body)'}}>
                {uploadMutation.isPending ? 'Importando...' : 'Importar arquivo'}
              </button>
            </div>
          }
        />
        <DataTable
          minWidth={820}
          columns={[
            {label: 'Data'}, {label: 'Tipo'}, {label: 'Ativo'}, {label: 'Conta'},
            {label: 'Qtd', align: 'right'}, {label: 'Preço', align: 'right'},
            {label: 'Total', align: 'right'}, {label: 'Origem', align: 'right'},
          ]}
        >
          {loadingTransactions ? (
            <tr>
              <td colSpan={8} style={{padding: '16.8px', textAlign: 'center', color: 'var(--color-neutral-600)', fontSize: 12.5}}>
                Carregando...
              </td>
            </tr>
          ) : filteredTx.length === 0 ? (
            <tr>
              <td colSpan={8} style={{padding: '16.8px', textAlign: 'center', color: 'var(--color-neutral-600)', fontSize: 12.5}}>
                Nenhuma transação encontrada.
              </td>
            </tr>
          ) : (
            filteredTx.map((t) => (
              <tr key={t._id} style={{borderTop: '1px solid var(--hair-soft)'}} className="hover:bg-[rgba(145,132,217,0.06)]">
                <td style={{...TD_STYLE, color: 'var(--color-neutral-400)', fontVariantNumeric: 'tabular-nums'}}>{formatDate(t.date)}</td>
                <td style={TD_STYLE}>
                  <span style={TX_KIND_STYLE[t.type] ?? TX_KIND_STYLE['buy']}>{TX_KIND_LABEL[t.type] ?? t.type}</span>
                </td>
                <td style={{...TD_STYLE, fontWeight: 600}}>{t.symbol}</td>
                <td style={{...TD_STYLE, color: 'var(--color-neutral-500)', fontSize: 11.5}}>{t.account ?? '—'}</td>
                <td style={TD_RIGHT}>{t.quantity}</td>
                <td style={TD_RIGHT}>{formatCurrency(t.price)}</td>
                <td style={{...TD_RIGHT, fontWeight: 600, color: t.type === 'buy' ? 'var(--neg)' : 'var(--pos)'}}>{formatCurrency(t.total)}</td>
                <td style={{...TD_RIGHT}}>
                  <span style={TX_ORIGIN_STYLE[t.provider ?? 'manual'] ?? TX_ORIGIN_STYLE['manual']}>{t.provider ?? 'Manual'}</span>
                </td>
              </tr>
            ))
          )}
        </DataTable>
      </section>
    </div>
  );
}
