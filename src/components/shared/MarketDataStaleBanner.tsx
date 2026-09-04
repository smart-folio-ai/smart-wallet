export interface MarketDataStaleBannerProps {
  // Timestamp da última resposta bem-sucedida do backend, no formato do
  // `useQuery().dataUpdatedAt` do React Query (ms desde epoch, 0 quando ainda
  // não houve resposta). Convertemos em HH:MM local para o usuário.
  updatedAt: number | null;
  staleCount: number;
  totalCount: number;
  // Poucos ativos rotulados são úteis; muitos poluem. Cortamos em 3.
  staleSymbols?: string[];
}

const formatClock = (updatedAt: number | null): string | null => {
  if (!updatedAt || !Number.isFinite(updatedAt)) return null;
  const date = new Date(updatedAt);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Banner exibido no topo do Dashboard / Portfolio quando o feed de cotações
 * do backend não trouxe preço para algum ativo em carteira. Sem esse aviso o
 * usuário via P&L "R$ 0,00" e gráfico chapado sem entender que o problema é
 * dado, não performance (TRA-92).
 */
export function MarketDataStaleBanner({
  updatedAt,
  staleCount,
  totalCount,
  staleSymbols,
}: MarketDataStaleBannerProps) {
  const clock = formatClock(updatedAt);
  const symbolPreview = (staleSymbols ?? []).slice(0, 3).join(', ');
  const remaining = (staleSymbols?.length ?? 0) - 3;

  const headline = clock
    ? `Dados de mercado indisponíveis desde ${clock}`
    : 'Dados de mercado indisponíveis';

  const detailBits = [
    `${staleCount} de ${totalCount} ativo${totalCount === 1 ? '' : 's'} sem cotação atualizada`,
  ];
  if (symbolPreview) {
    detailBits.push(
      remaining > 0
        ? `${symbolPreview} +${remaining}`
        : symbolPreview,
    );
  }

  return (
    <div
      role="status"
      aria-live="polite"
      data-testid="market-data-stale-banner"
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 11.2,
        border: '1px solid rgba(224, 163, 82, 0.32)',
        borderRadius: 8,
        padding: '11.2px 16.8px',
        background: 'rgba(224, 163, 82, 0.08)',
      }}>
      <i
        className="ph-fill ph-warning"
        style={{
          fontSize: 16,
          color: 'var(--warn)',
          marginTop: 1,
          flexShrink: 0,
        }}
      />
      <div style={{flex: 1, minWidth: 0}}>
        <div
          style={{
            fontSize: 12.5,
            color: 'var(--color-neutral-200)',
            lineHeight: 1.5,
            fontWeight: 600,
          }}>
          {headline}
        </div>
        <div
          style={{
            fontSize: 11,
            color: 'var(--color-neutral-500)',
            marginTop: 2.8,
          }}>
          {detailBits.join(' · ')}. P&amp;L e yield ficam como “—” até o feed voltar.
        </div>
      </div>
    </div>
  );
}
