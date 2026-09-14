import {Link} from 'react-router-dom';
import type {UpcomingDividend} from '@/services/portfolio';

const PAYMENT_TYPE_LABEL: Record<UpcomingDividend['paymentType'], string> = {
  JCP: 'JCP',
  DIVIDEND: 'Dividendo',
  RENDIMENTO: 'Rendimento',
  OTHER: 'Provento',
};

const currency = (value: number) =>
  value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: value >= 1000 ? 0 : 2,
  });

// A data vem como meia-noite UTC; formatar no fuso local mostraria o dia anterior.
const dayMonth = (iso: string) =>
  new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    timeZone: 'UTC',
  });

interface UpcomingDividendsCardProps {
  items: UpcomingDividend[];
  totalNetValue: number;
  windowDays: number;
  /** Valor de mercado atual de cada posição, para o yield do pagamento. */
  positionValueBySymbol: Record<string, number>;
  isLoading?: boolean;
}

/**
 * Card "Proventos a receber" do Dashboard — mesma estrutura e estilos do
 * bloco em design_handoff_trackerr/Trackerr App.dc.html.
 */
export function UpcomingDividendsCard({
  items,
  totalNetValue,
  windowDays,
  positionValueBySymbol,
  isLoading,
}: UpcomingDividendsCardProps) {
  return (
    <section
      style={{
        border: '1px solid var(--hair)',
        borderRadius: 8,
        background: 'var(--nk-card)',
      }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 16.8px',
          borderBottom: '1px solid var(--hair-soft)',
        }}>
        <div>
          <div style={{fontFamily: 'var(--font-heading)', fontSize: 14, fontWeight: 600}}>
            Proventos a receber
          </div>
          <div style={{fontSize: 11, color: 'var(--color-neutral-600)', marginTop: 2}}>
            Próximos {windowDays} dias · {currency(totalNetValue)} previstos
          </div>
        </div>
        <Link to="/dividends" style={{fontSize: 11.5}}>
          Dividendos →
        </Link>
      </div>

      <div style={{padding: '5.6px 0'}}>
        {isLoading ? (
          <div style={{padding: '8.4px 16.8px', fontSize: 12, color: 'var(--color-neutral-500)'}}>
            Carregando…
          </div>
        ) : items.length === 0 ? (
          <div style={{padding: '8.4px 16.8px', fontSize: 12, color: 'var(--color-neutral-500)', lineHeight: 1.5}}>
            Nenhum provento previsto. Importe o relatório de Eventos da B3 em{' '}
            <Link to="/add-asset">Adicionar ativo</Link>.
          </div>
        ) : (
          items.map((d) => {
            const positionValue = positionValueBySymbol[d.symbol];
            const yieldLabel =
              positionValue > 0
                ? `${((d.netValue / positionValue) * 100).toLocaleString('pt-BR', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}%`
                : '—';
            return (
              <div
                key={d.id}
                style={{display: 'flex', alignItems: 'center', gap: 11.2, padding: '8.4px 16.8px'}}>
                <div
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 6,
                    border: '1px solid var(--hair)',
                    display: 'grid',
                    placeItems: 'center',
                    fontSize: 10,
                    fontWeight: 600,
                    color: 'var(--color-neutral-300)',
                    background: 'rgba(var(--rgb-bg),0.6)',
                  }}>
                  {d.symbol.slice(0, 3)}
                </div>
                <div style={{flex: 1, minWidth: 0}}>
                  <div style={{fontSize: 12.5, fontWeight: 600}}>{d.symbol}</div>
                  <div style={{fontSize: 10.5, color: 'var(--color-neutral-600)'}}>
                    {PAYMENT_TYPE_LABEL[d.paymentType]} · pagamento {dayMonth(d.expectedPaymentDate)}
                  </div>
                </div>
                <div style={{textAlign: 'right'}}>
                  <div
                    style={{
                      fontSize: 12.5,
                      fontWeight: 600,
                      color: 'var(--pos)',
                      fontVariantNumeric: 'tabular-nums',
                    }}>
                    {currency(d.netValue)}
                  </div>
                  <div
                    style={{
                      fontSize: 10.5,
                      color: 'var(--color-neutral-600)',
                      fontVariantNumeric: 'tabular-nums',
                    }}>
                    {yieldLabel}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}

export default UpcomingDividendsCard;
