import {useEffect, useMemo, useState} from 'react';
import {useMutation, useQuery} from '@tanstack/react-query';
import {fiscalService, brokerSyncService} from '@/server/api/api';
import {formatCurrency} from '@/utils/formatters';
import useAppToast from '@/hooks/use-app-toast';
import {KpiCard} from '@/components/shared';

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

interface FiscalTaxDriver {
  symbol: string;
  category: 'stock' | 'fii' | 'crypto';
  operations: number;
  grossSales: number;
  realizedProfit: number;
  estimatedTax: number;
  taxRate: number;
  reason: string;
}

interface FiscalSummaryResponse {
  year: number;
  totals?: {
    stockProfit?: number;
    fiiProfit?: number;
    cryptoProfit?: number;
    taxDue?: number;
  };
  monthly?: Array<{
    year: number;
    month: number;
    totalTax: number;
  }>;
  taxDrivers?: FiscalTaxDriver[];
  guide?: string[];
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
  } = useQuery<FiscalSummaryResponse>({
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
  const taxDrivers = useMemo(
    () => (Array.isArray(summary?.taxDrivers) ? summary.taxDrivers : []),
    [summary?.taxDrivers],
  );
  const topTaxDrivers = useMemo(
    () => taxDrivers.filter((item) => item.estimatedTax > 0).slice(0, 5),
    [taxDrivers],
  );
  const taxDue = summary?.totals?.taxDue || 0;
  const topTaxContributor = topTaxDrivers[0] || null;

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

  const categoryLabel = (category?: string) => {
    if (category === 'fii') return 'FII';
    if (category === 'crypto') return 'Cripto';
    return 'Ação';
  };

  return (
    <div style={{padding: 24, display: 'flex', flexDirection: 'column', gap: 24}}>
      {/* Header */}
      <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap'}}>
        <h1 style={{fontSize: 28, fontWeight: 700, fontFamily: 'var(--font-heading)', margin: 0}}>Fiscal</h1>
        <div style={{display: 'flex', alignItems: 'center', gap: 8}}>
          <label htmlFor="fiscal-year" style={{fontSize: 13, color: 'var(--color-neutral-500)'}}>Ano</label>
          <input
            id="fiscal-year"
            type="number"
            value={year}
            onChange={(e) => setYear(e.target.value ? Number(e.target.value) : '')}
            style={{width: 80, height: 36, padding: '0 10px', border: '1px solid var(--hair)', borderRadius: 7, background: 'var(--surf-3)', fontSize: 13, color: 'inherit', outline: 'none'}}
          />
          <button type="button" onClick={() => refetch()}
            style={{height: 36, padding: '0 14px', borderRadius: 7, border: '1px solid var(--hair)', background: 'transparent', fontSize: 13, cursor: 'pointer', color: 'inherit'}}>
            Atualizar
          </button>
        </div>
      </div>

      {/* Hero card */}
      <div style={{
        border: '1px solid var(--badge-warn-bg)',
        borderRadius: 12,
        background: `linear-gradient(135deg, rgba(76,201,240,0.10) 0%, var(--nk-card) 60%)`,
        padding: 24,
        display: 'flex',
        flexDirection: 'column',
        gap: 24,
      }}>
        <div style={{display: 'flex', flexDirection: 'column', gap: 24}}>
          <div style={{display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', gap: 24}}>
            <div>
              <p style={{fontSize: 10.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--color-neutral-500)'}}>
                Imposto Estimado
              </p>
              {loadingSummary ? (
                <div style={{height: 48, width: 220, borderRadius: 8, background: 'var(--surf-3)', marginTop: 8, animation: 'pulse 1.5s ease-in-out infinite'}} />
              ) : (
                <p style={{marginTop: 8, fontSize: 36, fontWeight: 900, fontFamily: 'var(--font-heading)', color: 'var(--pos)'}}>{formatCurrency(taxDue)}</p>
              )}
              <p style={{marginTop: 8, fontSize: 13, color: 'var(--color-neutral-500)'}}>
                Valor calculado com base nas vendas com lucro tributável no ano.
              </p>
            </div>

            <div style={{width: '100%', maxWidth: 420, borderRadius: 10, border: '1px solid rgba(76,201,240,0.30)', background: 'rgba(76,201,240,0.10)', padding: 16}}>
              <p style={{fontSize: 10.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--color-neutral-500)'}}>
                Por Que Você Vai Pagar Esse Valor
              </p>
              {loadingSummary ? (
                <div style={{display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12}}>
                  <div style={{height: 24, width: '100%', borderRadius: 6, background: 'var(--surf-3)'}} />
                  <div style={{height: 24, width: '100%', borderRadius: 6, background: 'var(--surf-3)'}} />
                  <div style={{height: 24, width: '66%', borderRadius: 6, background: 'var(--surf-3)'}} />
                </div>
              ) : topTaxDrivers.length === 0 ? (
                <p style={{marginTop: 12, fontSize: 13, color: 'var(--color-neutral-500)'}}>
                  Não há vendas tributáveis registradas no período atual.
                </p>
              ) : (
                <div style={{marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8}}>
                  {topTaxContributor ? (
                    <div style={{marginBottom: 8}}>
                      <span style={{display: 'inline-flex', alignItems: 'center', padding: '3px 10px', borderRadius: 6, fontSize: 11.5, fontWeight: 600, background: 'var(--badge-warn-bg)', color: 'var(--warn)', border: '1px solid var(--warn)', gap: 4}}>
                        Maior Contribuinte: {topTaxContributor.symbol} ({formatCurrency(topTaxContributor.estimatedTax)})
                      </span>
                    </div>
                  ) : null}
                  {topTaxDrivers.map((driver) => (
                    <div
                      key={driver.symbol}
                      style={{borderRadius: 8, border: '1px solid var(--hair)', background: 'var(--nk-card)', padding: '8px 12px'}}>
                      <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8}}>
                        <p style={{fontSize: 13, fontWeight: 600}}>
                          {driver.symbol} · {categoryLabel(driver.category)}
                        </p>
                        <p style={{fontSize: 13, fontWeight: 700, color: 'var(--warn)'}}>
                          {formatCurrency(driver.estimatedTax)}
                        </p>
                      </div>
                      <p style={{fontSize: 11.5, color: 'var(--color-neutral-500)'}}>
                        Lucro apurado: {formatCurrency(driver.realizedProfit)} ·
                        vendas: {formatCurrency(driver.grossSales)} · operações:{' '}
                        {driver.operations}
                      </p>
                      <p style={{fontSize: 11.5, color: 'var(--color-neutral-500)', marginTop: 4}}>
                        Motivo: {driver.reason}
                      </p>
                      <div style={{marginTop: 8, height: 6, width: '100%', borderRadius: 3, background: 'var(--surf-3)', overflow: 'hidden'}}>
                        <div style={{height: '100%', borderRadius: 3, background: 'var(--warn)', width: `${Math.max(8, Math.min(100, taxDue > 0 ? (driver.estimatedTax / taxDue) * 100 : 0))}%`}} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 4-col KPI grid */}
      <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12}}>
        <KpiCard label="Lucro/Prejuízo Ações" value={loadingSummary ? '…' : formatCurrency(summary?.totals?.stockProfit || 0)} />
        <KpiCard label="Lucro/Prejuízo FIIs" value={loadingSummary ? '…' : formatCurrency(summary?.totals?.fiiProfit || 0)} />
        <KpiCard label="Lucro/Prejuízo Cripto" value={loadingSummary ? '…' : formatCurrency(summary?.totals?.cryptoProfit || 0)} />
        <KpiCard label="Imposto Estimado" value={loadingSummary ? '…' : formatCurrency(taxDue)} />
      </div>

      {/* Two-col grid: Simular Venda + Status Importações */}
      <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 24}}>
        {/* Simular Venda */}
        <div style={{border: '1px solid var(--hair)', borderRadius: 12, background: 'var(--nk-card)', padding: 24, display: 'flex', flexDirection: 'column', gap: 16}}>
          <span style={{fontFamily: 'var(--font-heading)', fontSize: 15, fontWeight: 600}}>Simular Venda</span>

          <div style={{display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12}}>
            <div style={{display: 'flex', flexDirection: 'column', gap: 6}}>
              <label style={{fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-neutral-500)'}}>Ativo</label>
              <input
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                placeholder="PETR4"
                style={{height: 38, padding: '0 10px', border: '1px solid var(--hair)', borderRadius: 7, background: 'var(--surf-3)', fontSize: 13, color: 'inherit', outline: 'none'}}
              />
            </div>
            <div style={{display: 'flex', flexDirection: 'column', gap: 6}}>
              <label style={{fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-neutral-500)'}}>Quantidade</label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value || 0))}
                style={{height: 38, padding: '0 10px', border: '1px solid var(--hair)', borderRadius: 7, background: 'var(--surf-3)', fontSize: 13, color: 'inherit', outline: 'none'}}
              />
            </div>
            <div style={{display: 'flex', flexDirection: 'column', gap: 6}}>
              <label style={{fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-neutral-500)'}}>Preço de venda</label>
              <input
                type="number"
                value={sellPrice}
                onChange={(e) => setSellPrice(Number(e.target.value || 0))}
                style={{height: 38, padding: '0 10px', border: '1px solid var(--hair)', borderRadius: 7, background: 'var(--surf-3)', fontSize: 13, color: 'inherit', outline: 'none'}}
              />
            </div>
          </div>

          <button type="button" onClick={() => previewMutation.mutate()}
            style={{height: 40, padding: '0 20px', borderRadius: 8, border: 'none', background: 'var(--grad-violet)', color: '#fff', fontSize: 13, fontWeight: 500, cursor: 'pointer', alignSelf: 'flex-start'}}>
            Calcular imposto
          </button>

          {previewMutation.data && (
            <div style={{borderRadius: 8, border: '1px solid var(--hair)', padding: 16, background: 'var(--surf-2)', fontSize: 13, display: 'flex', flexDirection: 'column', gap: 8}}>
              <p style={{fontWeight: 600, fontSize: 14}}>
                Se vender {previewMutation.data.symbol} hoje:
              </p>
              <p style={{fontSize: 14}}>
                Lucro:{' '}
                <strong style={{color: 'var(--pos)'}}>
                  {formatCurrency(previewMutation.data.profit || 0)}
                </strong>
              </p>
              <p style={{fontSize: 14}}>
                Imposto:{' '}
                <strong style={{color: 'var(--warn)'}}>
                  {formatCurrency(previewMutation.data.estimatedTax || 0)}
                </strong>
              </p>
              {zeroTaxReason ? (
                <p style={{fontSize: 13, color: 'var(--pos)', fontWeight: 500}}>
                  {zeroTaxReason}
                </p>
              ) : null}
              <p style={{fontSize: 14}}>
                Impacto na carteira:{' '}
                <strong style={{color: 'var(--ac)'}}>
                  {(previewMutation.data.portfolioImpactPercent || 0).toFixed(2)}%
                </strong>{' '}
                {previewMutation.data.sector
                  ? `• setor ${previewMutation.data.sector}`
                  : ''}
              </p>
              {previewMutation.data.category === 'stock' && (
                <p style={{color: 'var(--color-neutral-500)'}}>
                  Vendas no mês (ações):{' '}
                  <strong>
                    {formatCurrency(previewMutation.data.stockSalesMonth || 0)}
                  </strong>{' '}
                  / limite de isenção{' '}
                  <strong>
                    {formatCurrency(previewMutation.data.stockExemptionLimit || 20000)}
                  </strong>
                </p>
              )}
              {previewMutation.data.message ? (
                <p style={{color: 'var(--color-neutral-500)'}}>
                  {previewMutation.data.message}
                </p>
              ) : null}
              <div style={{marginTop: 4, borderRadius: 6, border: '1px solid var(--hair)', background: 'var(--surf-1)', padding: 12, display: 'flex', flexDirection: 'column', gap: 4}}>
                {loadingOptimizer ? (
                  <div style={{height: 20, width: 288, borderRadius: 5, background: 'var(--surf-3)'}} />
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
                <div style={{marginTop: 4, borderRadius: 6, border: '1px solid var(--hair)', background: 'var(--surf-1)', padding: 12, display: 'flex', flexDirection: 'column', gap: 4}}>
                  <p style={{fontWeight: 500}}>
                    O sistema analisa a carteira e sugere:
                  </p>
                  <p style={{fontSize: 12.5}}>
                    <strong>Otimização fiscal possível:</strong>
                  </p>
                  <p style={{fontSize: 12.5}}>
                    Vender ativo <strong>{firstOpportunity.symbol}</strong>.
                  </p>
                  {typeof firstOpportunity.potentialGain === 'number' &&
                  firstOpportunity.potentialGain > 0 ? (
                    <p style={{fontSize: 12.5}}>
                      Realizar prejuízo de{' '}
                      <strong>
                        {formatCurrency(firstOpportunity.potentialGain)}
                      </strong>
                      .
                    </p>
                  ) : null}
                  <p style={{fontSize: 12.5, color: 'var(--color-neutral-500)'}}>
                    Isso reduzirá o imposto futuro sobre operações com lucro.
                  </p>
                  <p style={{fontSize: 11.5, color: 'var(--color-neutral-500)'}}>
                    Imposto sem compensação:{' '}
                    {formatCurrency(firstOpportunity.estimatedTaxWithoutOffset || 0)}{' '}
                    | com compensação:{' '}
                    {formatCurrency(firstOpportunity.estimatedTaxWithOffset || 0)}{' '}
                    | economia:{' '}
                    {formatCurrency(firstOpportunity.taxSaved || 0)}
                  </p>
                  {firstOpportunity.headline ? (
                    <p style={{fontSize: 11.5, color: 'var(--color-neutral-500)'}}>
                      {firstOpportunity.headline}
                    </p>
                  ) : null}
                </div>
              ) : null}
              {topTaxDrivers.length > 0 && (
                <div style={{marginTop: 4, borderRadius: 6, border: '1px solid var(--hair)', background: 'var(--surf-1)', padding: 12, display: 'flex', flexDirection: 'column', gap: 8}}>
                  <p style={{fontSize: 13, fontWeight: 500}}>
                    Ativos que mais pesam no imposto estimado:
                  </p>
                  {topTaxDrivers.slice(0, 3).map((driver) => (
                    <p
                      key={`sim-${driver.symbol}`}
                      style={{fontSize: 11.5, color: 'var(--color-neutral-500)'}}>
                      {driver.symbol}: imposto estimado de{' '}
                      <strong>{formatCurrency(driver.estimatedTax)}</strong> (
                      {driver.reason})
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Status de Importações */}
        <div style={{border: '1px solid var(--hair)', borderRadius: 12, background: 'var(--nk-card)', padding: 24, display: 'flex', flexDirection: 'column', gap: 12}}>
          <span style={{fontFamily: 'var(--font-heading)', fontSize: 15, fontWeight: 600}}>Status de Importações</span>

          {loadingUploads && (
            <div style={{height: 48, width: '100%', borderRadius: 8, background: 'var(--surf-3)'}} />
          )}
          {!loadingUploads && latestUploads.length === 0 && (
            <p style={{fontSize: 13, color: 'var(--color-neutral-500)'}}>
              Nenhum upload recente.
            </p>
          )}
          {!loadingSummary && (summary?.monthly || []).length === 0 && (
            <p style={{fontSize: 11.5, color: 'var(--color-neutral-500)'}}>
              Sem vendas apuradas para o ano selecionado. Se você importou
              apenas posição consolidada da B3, o resumo fiscal pode ficar
              zerado.
            </p>
          )}
          {latestUploads.map((u: any) => (
            <div
              key={u._id}
              style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: 7, border: '1px solid var(--hair)', padding: 8, fontSize: 13}}>
              <div>
                <p style={{fontWeight: 500}}>{u.originalName}</p>
                <p style={{color: 'var(--color-neutral-500)', fontSize: 12}}>{u.provider}</p>
                {u.errorMessage ? (
                  <p style={{fontSize: 11.5, color: 'var(--neg)'}}>{u.errorMessage}</p>
                ) : null}
              </div>
              <span style={{
                padding: '2px 8px', borderRadius: 5, fontSize: 11, fontWeight: 600,
                background: u.status === 'processed' ? 'var(--badge-pos-bg)' : u.status === 'failed' ? 'var(--badge-neg-bg)' : 'var(--surf-3)',
                color: u.status === 'processed' ? 'var(--pos)' : u.status === 'failed' ? 'var(--neg)' : 'var(--color-neutral-400)',
              }}>
                {u.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Guia Mastigado IR */}
      <div style={{border: '1px solid var(--hair)', borderRadius: 12, background: 'var(--nk-card)', padding: 24}}>
        <span style={{fontFamily: 'var(--font-heading)', fontSize: 15, fontWeight: 600, display: 'block', marginBottom: 12}}>Guia Mastigado IR</span>
        <div style={{display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13}}>
          {(summary?.guide || []).map((line: string, idx: number) => (
            <p key={`${line}-${idx}`}>{line}</p>
          ))}
        </div>
      </div>

      {/* Relatórios PDF */}
      <div style={{border: '1px solid var(--hair)', borderRadius: 12, background: 'var(--nk-card)', padding: 24}}>
        <span style={{fontFamily: 'var(--font-heading)', fontSize: 15, fontWeight: 600, display: 'block', marginBottom: 12}}>Relatórios em PDF</span>
        <div style={{display: 'flex', flexWrap: 'wrap', gap: 8}}>
          <button type="button" onClick={() => downloadReport('fiscal', 'Relatório Fiscal')}
            style={{height: 36, padding: '0 14px', borderRadius: 7, border: '1px solid var(--hair)', background: 'transparent', fontSize: 13, cursor: 'pointer', color: 'inherit'}}>
            Baixar Fiscal (PDF)
          </button>
          <button type="button" onClick={() => downloadReport('transactions', 'Relatório de Transações')}
            style={{height: 36, padding: '0 14px', borderRadius: 7, border: '1px solid var(--hair)', background: 'transparent', fontSize: 13, cursor: 'pointer', color: 'inherit'}}>
            Baixar Transações (PDF)
          </button>
          <button type="button" onClick={() => downloadReport('assets', 'Relatório de Ativos')}
            style={{height: 36, padding: '0 14px', borderRadius: 7, border: '1px solid var(--hair)', background: 'transparent', fontSize: 13, cursor: 'pointer', color: 'inherit'}}>
            Baixar Ativos (PDF)
          </button>
        </div>
      </div>
    </div>
  );
}
