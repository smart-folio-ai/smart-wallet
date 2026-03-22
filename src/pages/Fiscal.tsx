import {useEffect, useMemo, useState} from 'react';
import {useMutation, useQuery} from '@tanstack/react-query';
import {fiscalService, brokerSyncService} from '@/server/api/api';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Input} from '@/components/ui/input';
import {Button} from '@/components/ui/button';
import {Label} from '@/components/ui/label';
import {Badge} from '@/components/ui/badge';
import {Skeleton} from '@/components/ui/skeleton';
import {formatCurrency} from '@/utils/formatters';
import useAppToast from '@/hooks/use-app-toast';

interface FiscalOptimizerResponse {
  accumulatedLosses?: {
    stock?: number;
    fii?: number;
    crypto?: number;
    total?: number;
  };
  opportunities?: Array<{
    symbol: string;
    headline?: string;
    potentialGain?: number;
    estimatedTaxWithoutOffset?: number;
    estimatedTaxWithOffset?: number;
    taxSaved?: number;
  }>;
}

export default function Fiscal() {
  const toast = useAppToast();
  const [year, setYear] = useState<number | ''>('');
  const [symbol, setSymbol] = useState('PETR4');
  const [quantity, setQuantity] = useState(100);
  const [sellPrice, setSellPrice] = useState(50);

  const {
    data: summary,
    isLoading: loadingSummary,
    refetch,
  } = useQuery({
    queryKey: ['fiscal-summary', year],
    queryFn: async () =>
      (
        await fiscalService.getSummary(
          typeof year === 'number' ? year : undefined,
        )
      ).data,
  });

  useEffect(() => {
    if (year === '' && typeof summary?.year === 'number') {
      setYear(summary.year);
    }
  }, [summary?.year, year]);

  const {data: uploads, isLoading: loadingUploads} = useQuery({
    queryKey: ['broker-sync-uploads'],
    queryFn: async () => (await brokerSyncService.getUploads()).data,
    refetchInterval: 5000,
  });

  const {data: optimizerData, isLoading: loadingOptimizer} =
    useQuery<FiscalOptimizerResponse>({
      queryKey: ['fiscal-optimizer', year],
      queryFn: async () =>
        (
          await fiscalService.getOptimizer(
            typeof year === 'number' ? year : undefined,
          )
        ).data,
    });

  const previewMutation = useMutation({
    mutationFn: async () =>
      (
        await fiscalService.previewSale({
          symbol: symbol.toUpperCase(),
          quantity,
          sellPrice,
        })
      ).data,
  });

  const latestUploads = useMemo(
    () => (Array.isArray(uploads) ? uploads.slice(0, 6) : []),
    [uploads],
  );

  const accumulatedLossTotal = optimizerData?.accumulatedLosses?.total || 0;
  const previewData = previewMutation.data;
  const stockSalesMonth = previewData?.stockSalesMonth || 0;
  const stockExemptionLimit = previewData?.stockExemptionLimit || 20000;
  const hasTaxExemptionByMonthlyLimit =
    previewData?.category === 'stock' && stockSalesMonth <= stockExemptionLimit;
  const hasZeroEstimatedTax = (previewData?.estimatedTax || 0) <= 0;
  const canHighlightZeroTaxByLossOffset =
    previewData?.category === 'stock' &&
    (previewData?.profit || 0) > 0 &&
    accumulatedLossTotal > 0 &&
    !hasTaxExemptionByMonthlyLimit &&
    (previewData?.estimatedTax || 0) <= 0;
  const zeroTaxReason = hasZeroEstimatedTax
    ? hasTaxExemptionByMonthlyLimit
      ? `Imposto zerado por isenção de vendas mensais (até ${formatCurrency(stockExemptionLimit)} em ações).`
      : canHighlightZeroTaxByLossOffset
        ? 'Imposto zerado por compensação de prejuízo acumulado.'
        : null
    : null;
  const firstOpportunity = optimizerData?.opportunities?.[0];

  const downloadReport = async (
    type: 'fiscal' | 'transactions' | 'assets',
    label: string,
  ) => {
    try {
      const response = await fiscalService.getReport({
        type,
        year: typeof year === 'number' ? year : undefined,
        format: 'pdf',
      });
      const blob = new Blob([response.data], {type: 'application/pdf'});
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type}-report-${typeof year === 'number' ? year : 'atual'}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Relatório gerado', `${label} baixado com sucesso.`);
    } catch {
      toast.error('Erro', 'Não foi possível gerar o relatório.');
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-3xl font-bold">Fiscal</h1>
        <div className="flex items-center gap-2">
          <Label htmlFor="fiscal-year">Ano</Label>
          <Input
            id="fiscal-year"
            className="w-24"
            type="number"
            value={year}
            onChange={(e) =>
              setYear(e.target.value ? Number(e.target.value) : '')
            }
          />
          <Button variant="outline" onClick={() => refetch()}>
            Atualizar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="rounded-2xl bg-card/40 border-primary/5 shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm">Lucro/Prejuízo Ações</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">
            {loadingSummary ? (
              <Skeleton className="h-8 w-28" />
            ) : (
              formatCurrency(summary?.totals?.stockProfit || 0)
            )}
          </CardContent>
        </Card>
        <Card className="rounded-2xl bg-card/40 border-primary/5 shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm">Lucro/Prejuízo FIIs</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">
            {loadingSummary ? (
              <Skeleton className="h-8 w-28" />
            ) : (
              formatCurrency(summary?.totals?.fiiProfit || 0)
            )}
          </CardContent>
        </Card>
        <Card className="rounded-2xl bg-card/40 border-primary/5 shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm">Lucro/Prejuízo Cripto</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">
            {loadingSummary ? (
              <Skeleton className="h-8 w-28" />
            ) : (
              formatCurrency(summary?.totals?.cryptoProfit || 0)
            )}
          </CardContent>
        </Card>
        <Card className="rounded-2xl bg-card/40 border-primary/5 shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm">Imposto Estimado</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold text-emerald-500">
            {loadingSummary ? (
              <Skeleton className="h-8 w-28" />
            ) : (
              formatCurrency(summary?.totals?.taxDue || 0)
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="rounded-2xl bg-gradient-to-br from-card to-card/50 border-primary/5 shadow-2xl shadow-primary/5 overflow-hidden">
          <CardHeader>
            <CardTitle>Simular Venda</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Ativo</Label>
                <Input
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value)}
                  placeholder="PETR4"
                />
              </div>
              <div>
                <Label>Quantidade</Label>
                <Input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value || 0))}
                />
              </div>
              <div>
                <Label>Preço de venda</Label>
                <Input
                  type="number"
                  value={sellPrice}
                  onChange={(e) => setSellPrice(Number(e.target.value || 0))}
                />
              </div>
            </div>
            <Button onClick={() => previewMutation.mutate()}>
              Calcular imposto
            </Button>

            {previewMutation.data && (
              <div className="rounded-lg border p-4 bg-muted/40 text-sm space-y-2">
                <p className="font-semibold text-base">
                  Se vender {previewMutation.data.symbol} hoje:
                </p>
                <p className="text-lg">
                  Lucro:{' '}
                  <strong className="text-emerald-500">
                    {formatCurrency(previewMutation.data.profit || 0)}
                  </strong>
                </p>
                <p className="text-lg">
                  Imposto:{' '}
                  <strong className="text-amber-500">
                    {formatCurrency(previewMutation.data.estimatedTax || 0)}
                  </strong>
                </p>
                {zeroTaxReason ? (
                  <p className="text-sm text-emerald-600 font-medium">
                    {zeroTaxReason}
                  </p>
                ) : null}
                <p className="text-lg">
                  Impacto na carteira:{' '}
                  <strong className="text-primary">
                    {(previewMutation.data.portfolioImpactPercent || 0).toFixed(
                      2,
                    )}
                    %
                  </strong>{' '}
                  {previewMutation.data.sector
                    ? `• setor ${previewMutation.data.sector}`
                    : ''}
                </p>
                {previewMutation.data.category === 'stock' && (
                  <p className="text-muted-foreground">
                    Vendas no mês (ações):{' '}
                    <strong>
                      {formatCurrency(
                        previewMutation.data.stockSalesMonth || 0,
                      )}
                    </strong>{' '}
                    / limite de isenção{' '}
                    <strong>
                      {formatCurrency(
                        previewMutation.data.stockExemptionLimit || 20000,
                      )}
                    </strong>
                  </p>
                )}
                {previewMutation.data.message ? (
                  <p className="mt-2 text-muted-foreground">
                    {previewMutation.data.message}
                  </p>
                ) : null}
                <div className="mt-3 rounded-md border bg-background p-3 space-y-1">
                  {loadingOptimizer ? (
                    <Skeleton className="h-5 w-72" />
                  ) : (
                    <p>
                      Você possui{' '}
                      <strong>{formatCurrency(accumulatedLossTotal)}</strong> de
                      prejuízo acumulado.
                    </p>
                  )}
                  {canHighlightZeroTaxByLossOffset ? (
                    <p>
                      Se vender <strong>{previewData.symbol}</strong> agora, o
                      imposto da operação será <strong>zero</strong>.
                    </p>
                  ) : null}
                </div>
                {firstOpportunity ? (
                  <div className="mt-3 rounded-md border bg-background p-3 space-y-1">
                    <p className="font-medium">
                      O sistema analisa a carteira e sugere:
                    </p>
                    <p className="text-sm">
                      <strong>Otimização fiscal possível:</strong>
                    </p>
                    <p className="text-sm">
                      Vender ativo <strong>{firstOpportunity.symbol}</strong>.
                    </p>
                    {typeof firstOpportunity.potentialGain === 'number' &&
                    firstOpportunity.potentialGain > 0 ? (
                      <p className="text-sm">
                        Realizar prejuízo de{' '}
                        <strong>
                          {formatCurrency(firstOpportunity.potentialGain)}
                        </strong>
                        .
                      </p>
                    ) : null}
                    <p className="text-sm text-muted-foreground">
                      Isso reduzirá o imposto futuro sobre operações com lucro.
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Imposto sem compensação:{' '}
                      {formatCurrency(
                        firstOpportunity.estimatedTaxWithoutOffset || 0,
                      )}{' '}
                      | com compensação:{' '}
                      {formatCurrency(
                        firstOpportunity.estimatedTaxWithOffset || 0,
                      )}{' '}
                      | economia:{' '}
                      {formatCurrency(firstOpportunity.taxSaved || 0)}
                    </p>
                    {firstOpportunity.headline ? (
                      <p className="text-xs text-muted-foreground">
                        {firstOpportunity.headline}
                      </p>
                    ) : null}
                  </div>
                ) : null}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-2xl bg-gradient-to-br from-card to-card/50 border-primary/5 shadow-2xl shadow-primary/5 overflow-hidden">
          <CardHeader>
            <CardTitle>Status de Importações</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {loadingUploads && <Skeleton className="h-12 w-full" />}
            {!loadingUploads && latestUploads.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Nenhum upload recente.
              </p>
            )}
            {!loadingSummary && (summary?.monthly || []).length === 0 && (
              <p className="text-xs text-muted-foreground">
                Sem vendas apuradas para o ano selecionado. Se você importou
                apenas posição consolidada da B3, o resumo fiscal pode ficar
                zerado.
              </p>
            )}
            {latestUploads.map((u: any) => (
              <div
                key={u._id}
                className="flex items-center justify-between rounded border p-2 text-sm">
                <div>
                  <p className="font-medium">{u.originalName}</p>
                  <p className="text-muted-foreground">{u.provider}</p>
                  {u.errorMessage ? (
                    <p className="text-xs text-destructive">{u.errorMessage}</p>
                  ) : null}
                </div>
                <Badge
                  variant={
                    u.status === 'processed'
                      ? 'default'
                      : u.status === 'failed'
                        ? 'destructive'
                        : 'secondary'
                  }>
                  {u.status}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-2xl bg-gradient-to-br from-card to-card/50 border-primary/5 shadow-2xl shadow-primary/5 overflow-hidden">
        <CardHeader>
          <CardTitle>Guia Mastigado IR</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {(summary?.guide || []).map((line: string, idx: number) => (
            <p key={`${line}-${idx}`}>{line}</p>
          ))}
        </CardContent>
      </Card>

      <Card className="rounded-2xl bg-gradient-to-br from-card to-card/50 border-primary/5 shadow-2xl shadow-primary/5 overflow-hidden">
        <CardHeader>
          <CardTitle>Relatórios em PDF</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() => downloadReport('fiscal', 'Relatório Fiscal')}>
            Baixar Fiscal (PDF)
          </Button>
          <Button
            variant="outline"
            onClick={() =>
              downloadReport('transactions', 'Relatório de Transações')
            }>
            Baixar Transações (PDF)
          </Button>
          <Button
            variant="outline"
            onClick={() => downloadReport('assets', 'Relatório de Ativos')}>
            Baixar Ativos (PDF)
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
