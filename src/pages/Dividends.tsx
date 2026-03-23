import {useEffect, useMemo, useState} from 'react';
import {useNavigate, useSearchParams} from 'react-router-dom';
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
import {Badge} from '@/components/ui/badge';
import {Button} from '@/components/ui/button';
import {Skeleton} from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import portfolioService from '@/services/portfolio';
import {formatCurrency} from '@/utils';
import {ChevronRight, Landmark} from 'lucide-react';

type DividendEventType = 'JCP' | 'Dividendo';

interface DividendEvent {
  symbol: string;
  assetName: string;
  assetType: string;
  eventType: DividendEventType;
  date: string;
  quantity: number;
  valuePerUnit: number;
  totalValue: number;
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

const Dividends = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [selectedPortfolioId, setSelectedPortfolioId] = useState('all');

  const {data: portfolios = []} = useQuery({
    queryKey: ['portfolios'],
    queryFn: async () => portfolioService.getPortfolios(),
  });

  useEffect(() => {
    const fromUrl = searchParams.get('portfolioId');
    if (fromUrl) {
      setSelectedPortfolioId(fromUrl);
      return;
    }

    if (portfolios.length > 0 && selectedPortfolioId === 'all') {
      setSelectedPortfolioId('all');
    }
  }, [portfolios, searchParams, selectedPortfolioId]);

  const {data: portfolioPayload, isLoading} = useQuery({
    queryKey: ['dividends-portfolio', selectedPortfolioId],
    queryFn: async () => {
      if (!selectedPortfolioId || selectedPortfolioId === 'all') {
        return portfolioService.getAssets();
      }
      return portfolioService.getPortfolio(selectedPortfolioId);
    },
  });

  const apiAssets = useMemo(() => {
    if (!portfolioPayload) return [];
    if (Array.isArray(portfolioPayload)) return portfolioPayload;
    return portfolioPayload.assets ?? [];
  }, [portfolioPayload]);

  const allDividendEvents = useMemo<DividendEvent[]>(() => {
    return apiAssets
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
            assetType: asset?.type || 'other',
            eventType,
            date: String(entry?.date || ''),
            quantity,
            valuePerUnit,
            totalValue: valuePerUnit * quantity,
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
  }, [apiAssets]);

  const latestDividends = allDividendEvents.slice(0, 8);
  const totalPaid = allDividendEvents.reduce((sum, item) => sum + item.totalValue, 0);
  const totalJcp = allDividendEvents
    .filter((item) => item.eventType === 'JCP')
    .reduce((sum, item) => sum + item.totalValue, 0);
  const totalDividends = allDividendEvents
    .filter((item) => item.eventType === 'Dividendo')
    .reduce((sum, item) => sum + item.totalValue, 0);

  return (
    <div className="container py-8 animate-fade-in">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dividendos</h1>
          <p className="text-sm text-muted-foreground">
            Ultimos proventos recebidos e historico completo de JCP e dividendos
          </p>
        </div>
        <Select
          value={selectedPortfolioId}
          onValueChange={(value) => setSelectedPortfolioId(value)}>
          <SelectTrigger className="w-full sm:w-72">
            <SelectValue placeholder="Selecione a carteira" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as Carteiras</SelectItem>
            {portfolios.map((p: any) => (
              <SelectItem key={p.id || p._id} value={p.id || p._id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <Card className="border-emerald-300/40 bg-gradient-to-r from-emerald-50 to-white dark:border-emerald-400/20 dark:from-emerald-950/30 dark:to-slate-950">
          <CardHeader className="pb-2">
            <CardDescription>Total recebido (Dividendos + JCP)</CardDescription>
            <CardTitle className="text-2xl text-emerald-700 dark:text-emerald-300">
              {formatCurrency(totalPaid)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-sky-300/40 bg-gradient-to-r from-sky-50 to-white dark:border-sky-400/20 dark:from-sky-950/30 dark:to-slate-950">
          <CardHeader className="pb-2">
            <CardDescription>Total em JCP</CardDescription>
            <CardTitle className="text-2xl text-sky-700 dark:text-sky-300">
              {formatCurrency(totalJcp)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-violet-300/40 bg-gradient-to-r from-violet-50 to-white dark:border-violet-400/20 dark:from-violet-950/30 dark:to-slate-950">
          <CardHeader className="pb-2">
            <CardDescription>Total em Dividendos</CardDescription>
            <CardTitle className="text-2xl text-violet-300">
              {formatCurrency(totalDividends)}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card className="mb-6 overflow-hidden rounded-2xl border border-primary/10 bg-gradient-to-br from-card to-card/70">
        <CardHeader>
          <CardTitle>Ultimos dividendos disponiveis</CardTitle>
          <CardDescription>Clique em um ativo para abrir todos os detalhes</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : latestDividends.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border/70 p-6 text-sm text-muted-foreground">
              Nenhum evento de dividendo encontrado para esta selecao.
            </div>
          ) : (
            <div className="overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Ativo</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="text-right">Valor recebido</TableHead>
                    <TableHead className="text-right">Acao</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {latestDividends.map((event, index) => (
                    <TableRow
                      key={`${event.symbol}-${event.date}-${index}`}
                      className="cursor-pointer"
                      onClick={() =>
                        navigate(
                          `/dividends/${event.symbol}?portfolioId=${selectedPortfolioId}`,
                        )
                      }>
                      <TableCell>
                        {parseDate(event.date)?.toLocaleDateString('pt-BR') || '-'}
                      </TableCell>
                      <TableCell>
                        <div className="min-w-[180px]">
                          <p className="font-medium">{event.symbol}</p>
                          <p className="truncate text-xs text-muted-foreground">
                            {event.assetName}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{event.eventType}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(event.totalValue)}
                      </TableCell>
                      <TableCell className="text-right text-primary">
                        <span className="inline-flex items-center text-xs font-semibold">
                          Ver detalhes <ChevronRight className="ml-1 h-4 w-4" />
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="overflow-hidden rounded-2xl border border-primary/10 bg-card/60">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Landmark className="h-5 w-5 text-primary" />
            Historico completo
          </CardTitle>
          <CardDescription>
            Todos os eventos de proventos da carteira selecionada
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : allDividendEvents.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border/70 p-6 text-sm text-muted-foreground">
              Sem historico de dividendos para mostrar.
            </div>
          ) : (
            <div className="overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Ativo</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="text-right">Qtd</TableHead>
                    <TableHead className="text-right">Valor por cota</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allDividendEvents.map((event, index) => (
                    <TableRow key={`${event.symbol}-${event.date}-${event.eventType}-${index}`}>
                      <TableCell>
                        {parseDate(event.date)?.toLocaleDateString('pt-BR') || '-'}
                      </TableCell>
                      <TableCell>
                        <button
                          type="button"
                          className="font-medium text-primary hover:underline"
                          onClick={() =>
                            navigate(
                              `/dividends/${event.symbol}?portfolioId=${selectedPortfolioId}`,
                            )
                          }>
                          {event.symbol}
                        </button>
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
        </CardContent>
      </Card>

      <div className="mt-6 flex justify-end">
        <Button variant="outline" onClick={() => navigate('/dashboard')}>
          Voltar para dashboard
        </Button>
      </div>
    </div>
  );
};

export default Dividends;
