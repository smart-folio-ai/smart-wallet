import {useMemo, useState} from 'react';
import {useNavigate, useParams, useSearchParams} from 'react-router-dom';
import {useQuery} from '@tanstack/react-query';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs';
import {Badge} from '@/components/ui/badge';
import {Button} from '@/components/ui/button';
import {Skeleton} from '@/components/ui/skeleton';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import portfolioService from '@/services/portfolio';
import {formatCurrency} from '@/utils';
import {ArrowLeft, Building2} from 'lucide-react';

type DividendEventType = 'JCP' | 'Dividendo';

interface DividendEvent {
  symbol: string;
  assetName: string;
  eventType: DividendEventType;
  date: string;
  quantity: number;
  valuePerUnit: number;
  totalValue: number;
  assetType: string;
}

const normalizeDividendEventType = (value: unknown): DividendEventType => {
  const normalized = String(value || '')
    .trim()
    .toLowerCase();

  if (
    normalized.includes('jcp') ||
    normalized.includes('juros sobre capital') ||
    normalized.includes('juros')
  ) {
    return 'JCP';
  }

  if (
    normalized.includes('dividend') ||
    normalized.includes('rendimento') ||
    normalized.includes('provento') ||
    normalized.includes('rend')
  ) {
    return 'Dividendo';
  }

  return 'Dividendo';
};

const parseDate = (dateValue: unknown): Date | null => {
  if (!dateValue) return null;
  const parsed = new Date(String(dateValue));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const DividendDetail = () => {
  const navigate = useNavigate();
  const {symbol = ''} = useParams();
  const [searchParams] = useSearchParams();
  const portfolioId = searchParams.get('portfolioId') || 'all';
  const normalizedSymbol = symbol.toUpperCase();
  const [activeTab, setActiveTab] = useState<'all' | 'dividend' | 'jcp'>('all');
  const [groupBy, setGroupBy] = useState<'month' | 'year'>('month');

  const {data: portfolioPayload, isLoading} = useQuery({
    queryKey: ['dividends-detail', portfolioId],
    queryFn: async () => {
      if (!portfolioId || portfolioId === 'all') {
        return portfolioService.getAssets();
      }
      return portfolioService.getPortfolio(portfolioId);
    },
  });

  const apiAssets = useMemo(() => {
    if (!portfolioPayload) return [];
    if (Array.isArray(portfolioPayload)) return portfolioPayload;
    return portfolioPayload.assets ?? [];
  }, [portfolioPayload]);

  const events = useMemo<DividendEvent[]>(() => {
    return apiAssets
      .filter((asset: any) => String(asset?.symbol || '').toUpperCase() === normalizedSymbol)
      .flatMap((asset: any) => {
        const quantity = Number(asset?.quantity || 0);
        const history = Array.isArray(asset?.dividendHistory)
          ? asset.dividendHistory
          : [];

        return history.map((entry: any) => {
          const valuePerUnit = Number(entry?.value || 0);
          const eventType = normalizeDividendEventType(
            entry?.type ||
              entry?.eventType ||
              entry?.paymentType ||
              entry?.kind ||
              entry?.description,
          );

          return {
            symbol: String(asset?.symbol || '').toUpperCase(),
            assetName: asset?.name || asset?.longName || asset?.symbol || '-',
            eventType,
            date: String(entry?.date || ''),
            quantity,
            valuePerUnit,
            totalValue: quantity * valuePerUnit,
            assetType: asset?.type || 'other',
          };
        });
      })
      .sort((a, b) => {
        const bDate = parseDate(b.date);
        const aDate = parseDate(a.date);
        if (!aDate && !bDate) return 0;
        if (!aDate) return 1;
        if (!bDate) return -1;
        return bDate.getTime() - aDate.getTime();
      });
  }, [apiAssets, normalizedSymbol]);

  const filteredEvents = useMemo(() => {
    if (activeTab === 'jcp') return events.filter((item) => item.eventType === 'JCP');
    if (activeTab === 'dividend') {
      return events.filter((item) => item.eventType === 'Dividendo');
    }
    return events;
  }, [activeTab, events]);

  const totalJcp = events
    .filter((event) => event.eventType === 'JCP')
    .reduce((sum, event) => sum + event.totalValue, 0);
  const totalDividend = events
    .filter((event) => event.eventType === 'Dividendo')
    .reduce((sum, event) => sum + event.totalValue, 0);
  const totalReceived = totalJcp + totalDividend;

  const headlineName = events[0]?.assetName || normalizedSymbol;

  const payoutChartData = useMemo(() => {
    const grouped = new Map<
      string,
      {label: string; order: number; dividend: number; jcp: number; total: number}
    >();

    events.forEach((event) => {
      const parsedDate = parseDate(event.date);
      if (!parsedDate) return;

      const year = parsedDate.getUTCFullYear();
      const month = parsedDate.getUTCMonth() + 1;
      const key = groupBy === 'year' ? `${year}` : `${year}-${String(month).padStart(2, '0')}`;
      const label =
        groupBy === 'year'
          ? `${year}`
          : parsedDate.toLocaleDateString('pt-BR', {
              month: 'short',
              year: '2-digit',
            });

      const current = grouped.get(key) || {
        label,
        order: parsedDate.getTime(),
        dividend: 0,
        jcp: 0,
        total: 0,
      };

      if (event.eventType === 'JCP') {
        current.jcp += event.totalValue;
      } else {
        current.dividend += event.totalValue;
      }
      current.total = current.dividend + current.jcp;
      current.order = Math.max(current.order, parsedDate.getTime());

      grouped.set(key, current);
    });

    return Array.from(grouped.values()).sort((a, b) => a.order - b.order);
  }, [events, groupBy]);

  return (
    <div className="container py-8 animate-fade-in">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <Button
          variant="ghost"
          size="sm"
          className="gap-2"
          onClick={() => navigate(`/dividends?portfolioId=${portfolioId}`)}>
          <ArrowLeft className="h-4 w-4" />
          Voltar para dividendos
        </Button>
      </div>

      <Card className="mb-6 overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-r from-slate-100 via-white to-slate-100 dark:border-primary/15 dark:from-slate-950 dark:via-blue-950/30 dark:to-slate-950">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardDescription>Detalhes de proventos</CardDescription>
              <CardTitle className="mt-1 flex items-center gap-2 text-2xl">
                <Building2 className="h-5 w-5 text-primary" />
                {normalizedSymbol}
              </CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">{headlineName}</p>
            </div>
            <Badge variant="outline" className="text-sm">
              {events.length} evento(s)
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-violet-300/40 bg-violet-50 p-4 dark:border-violet-400/25 dark:bg-violet-950/25">
              <p className="text-xs uppercase tracking-wider text-violet-700 dark:text-violet-300">Total Recebido</p>
              <p className="mt-2 text-2xl font-bold text-violet-800 dark:text-violet-200">
                {formatCurrency(totalReceived)}
              </p>
            </div>
            <div className="rounded-xl border border-sky-300/40 bg-sky-50 p-4 dark:border-sky-400/25 dark:bg-sky-950/25">
              <p className="text-xs uppercase tracking-wider text-sky-700 dark:text-sky-300">Total JCP</p>
              <p className="mt-2 text-2xl font-bold text-sky-800 dark:text-sky-200">{formatCurrency(totalJcp)}</p>
            </div>
            <div className="rounded-xl border border-emerald-300/40 bg-emerald-50 p-4 dark:border-emerald-400/25 dark:bg-emerald-950/25">
              <p className="text-xs uppercase tracking-wider text-emerald-700 dark:text-emerald-300">Total Dividendos</p>
              <p className="mt-2 text-2xl font-bold text-emerald-800 dark:text-emerald-200">
                {formatCurrency(totalDividend)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6 overflow-hidden rounded-2xl border border-primary/10 bg-card/70">
        <CardHeader className="pb-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle>Recebimentos por período</CardTitle>
              <CardDescription>
                Visual mensal/anual de dividendos e JCP recebidos.
              </CardDescription>
            </div>
            <div className="rounded-lg bg-muted p-1">
              <Button
                size="sm"
                variant={groupBy === 'month' ? 'default' : 'ghost'}
                className="h-8 px-3"
                onClick={() => setGroupBy('month')}>
                Mensal
              </Button>
              <Button
                size="sm"
                variant={groupBy === 'year' ? 'default' : 'ghost'}
                className="h-8 px-3"
                onClick={() => setGroupBy('year')}>
                Anual
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-72 w-full" />
          ) : payoutChartData.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border/70 p-6 text-sm text-muted-foreground">
              Sem dados suficientes para montar o gráfico.
            </div>
          ) : (
            <div className="h-72 w-full rounded-xl border border-white/10 bg-gradient-to-b from-card/60 to-card/20 p-3">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={payoutChartData}
                  margin={{top: 8, right: 12, left: 8, bottom: 8}}
                  barGap={8}
                  barCategoryGap="25%">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted-foreground)/0.18)" />
                  <XAxis dataKey="label" tick={{fontSize: 12}} tickLine={false} axisLine={false} />
                  <YAxis
                    tickFormatter={(value) => `R$ ${Number(value).toLocaleString('pt-BR')}`}
                    tick={{fontSize: 11}}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    cursor={{fill: 'hsl(var(--muted)/0.2)'}}
                    content={({active, payload, label}) => {
                      if (!active || !payload?.length) return null;
                      const dividend = Number(payload.find((p) => p.dataKey === 'dividend')?.value || 0);
                      const jcp = Number(payload.find((p) => p.dataKey === 'jcp')?.value || 0);
                      const total = dividend + jcp;
                      return (
                        <div className="rounded-xl border border-border/70 bg-background/95 p-3 shadow-xl">
                          <p className="mb-1 text-sm font-semibold">{label}</p>
                          <p className="text-xs text-emerald-600 dark:text-emerald-300">
                            Dividendos: {formatCurrency(dividend)}
                          </p>
                          <p className="text-xs text-sky-600 dark:text-sky-300">
                            JCP: {formatCurrency(jcp)}
                          </p>
                          <p className="mt-1 text-xs font-semibold text-foreground">
                            Total: {formatCurrency(total)}
                          </p>
                        </div>
                      );
                    }}
                  />
                  <Bar
                    dataKey="dividend"
                    name="Dividendos"
                    radius={[6, 6, 0, 0]}
                    barSize={26}
                    fill="#22c55e"
                  />
                  <Bar
                    dataKey="jcp"
                    name="JCP"
                    radius={[6, 6, 0, 0]}
                    barSize={26}
                    fill="#0ea5e9"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="overflow-hidden rounded-2xl border border-primary/10 bg-card/70">
        <CardHeader>
          <CardTitle>Historico completo de JCP e Dividendos</CardTitle>
          <CardDescription>
            Informacoes detalhadas por evento: data, quantidade, valor por unidade e total.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as 'all' | 'dividend' | 'jcp')}>
            <TabsList className="mb-4">
              <TabsTrigger value="all">Todos</TabsTrigger>
              <TabsTrigger value="dividend">Dividendos</TabsTrigger>
              <TabsTrigger value="jcp">JCP</TabsTrigger>
            </TabsList>
            <TabsContent value={activeTab}>
              {isLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : filteredEvents.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border/70 p-6 text-sm text-muted-foreground">
                  Nenhum evento encontrado para este filtro.
                </div>
              ) : (
                <div className="overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead className="text-right">Quantidade</TableHead>
                        <TableHead className="text-right">Valor por unidade</TableHead>
                        <TableHead className="text-right">Total recebido</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredEvents.map((event, index) => (
                        <TableRow key={`${event.symbol}-${event.date}-${event.eventType}-${index}`}>
                          <TableCell>
                            {parseDate(event.date)?.toLocaleDateString('pt-BR') || '-'}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{event.eventType}</Badge>
                          </TableCell>
                          <TableCell className="text-right">{event.quantity}</TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(event.valuePerUnit)}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(event.totalValue)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default DividendDetail;
