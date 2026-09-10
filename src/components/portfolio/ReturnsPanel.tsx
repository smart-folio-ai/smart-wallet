import {formatCurrency} from '@/utils/formatters';
import {useAdaptiveLevel} from '@/contexts/AdaptiveLevelContext';
import {
  usePortfolioReturns,
  UNAVAILABLE_LABEL,
  type PortfolioReturns,
} from '@/hooks/usePortfolioReturns';

/**
 * Rentabilidade da carteira, apresentada conforme o nível do investidor
 * (TRA-147).
 *
 * O nível muda QUAL PERGUNTA o painel responde, não só as palavras:
 *
 * - iniciante    → "Estou indo bem?" — decomposição em reais, sem percentual
 *                  de rentabilidade, que é o número que mais confunde quem
 *                  começa.
 * - intermediário → "Quanto rendeu, de verdade?" — TWR, que neutraliza aporte
 *                  e por isso é comparável com índice.
 * - avançado     → "Rendeu por mérito ou por timing?" — TWR e IRR lado a lado.
 *                  A diferença entre os dois mede acerto de timing dos aportes.
 *
 * Todos os três veem a decomposição aporte vs rendimento: é a única métrica do
 * inventário que serve aos três perfis, mudando de apresentação e não de
 * disponibilidade.
 */

const pct = (value: number): string =>
  `${value >= 0 ? '+' : ''}${(value * 100).toFixed(2)}%`;

const toneColor = (value: number): string =>
  value >= 0 ? 'var(--pos)' : 'var(--neg)';

const card: React.CSSProperties = {
  border: '1px solid var(--hair)',
  borderRadius: 12,
  background: 'var(--nk-card)',
  padding: 24,
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
};

const heading: React.CSSProperties = {
  fontFamily: 'var(--font-heading)',
  fontSize: 15,
  fontWeight: 600,
};

const muted: React.CSSProperties = {
  fontSize: 13,
  color: 'var(--color-neutral-500)',
};

const numeric: React.CSSProperties = {
  fontVariantNumeric: 'tabular-nums',
};

/** Barra mostrando a proporção entre o que foi aportado e o que rendeu. */
function ContributionBar({data}: {data: PortfolioReturns['contribution']}) {
  const total = Math.max(data.currentValue, data.contributed, 1);
  const contributedPct = Math.min(100, (data.contributed / total) * 100);
  const gainPositive = data.marketGain >= 0;

  return (
    <div
      aria-hidden="true"
      style={{
        display: 'flex',
        height: 8,
        borderRadius: 4,
        overflow: 'hidden',
        background: 'var(--surf-3)',
      }}>
      <div
        style={{
          width: `${contributedPct}%`,
          background: 'var(--color-neutral-500)',
        }}
      />
      {gainPositive && (
        <div style={{flex: 1, background: 'var(--pos)'}} />
      )}
    </div>
  );
}

function UnavailableNote({reasons}: {reasons: PortfolioReturns['unavailable']}) {
  if (!reasons.length) return null;
  return (
    <ul style={{margin: 0, paddingLeft: 18, ...muted}}>
      {reasons.map((reason) => (
        <li key={reason}>{UNAVAILABLE_LABEL[reason] ?? reason}</li>
      ))}
    </ul>
  );
}

export default function ReturnsPanel() {
  const {level} = useAdaptiveLevel();
  const {data, isLoading, isError} = usePortfolioReturns();

  if (isLoading) {
    return (
      <div style={card}>
        <span style={heading}>Rentabilidade</span>
        <span style={muted}>Calculando…</span>
      </div>
    );
  }

  // Falha na rota não pode derrubar o dashboard: o painel some e o resto fica.
  if (isError || !data) return null;

  const {contribution, twr, irr, benchmark, unavailable, staleDays} = data;
  const isBeginner = level === 'iniciante';
  const isAdvanced = level === 'avancado';
  // Beta só entra com valor real. Voltou a ser calculável quando TRA-143
  // corrigiu a série diária; antes disso era '—' fixo e saiu da tela em
  // TRA-145 justamente por isso.
  const showBenchmark = isAdvanced && benchmark?.beta !== null;

  return (
    <div style={card}>
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: 12,
          flexWrap: 'wrap',
        }}>
        <span style={heading}>
          {isBeginner ? 'Como está indo seu dinheiro' : 'Rentabilidade'}
        </span>
        {data.from && data.to && (
          <span style={{...muted, ...numeric}}>
            {data.from} a {data.to}
          </span>
        )}
      </div>

      {/*
        Decomposição aporte vs rendimento — os três níveis veem, porque
        responde a pergunta que o P&L a custo médio nunca respondeu: fui bem,
        ou só coloquei mais dinheiro?
      */}
      <div style={{display: 'flex', flexDirection: 'column', gap: 10}}>
        {isBeginner ? (
          <p style={{margin: 0, fontSize: 15, lineHeight: 1.6}}>
            Dos seus{' '}
            <strong style={numeric}>
              {formatCurrency(contribution.currentValue)}
            </strong>
            , você depositou{' '}
            <strong style={numeric}>
              {formatCurrency(contribution.contributed)}
            </strong>{' '}
            e o mercado{' '}
            {contribution.marketGain >= 0 ? 'rendeu' : 'tirou'}{' '}
            <strong
              style={{...numeric, color: toneColor(contribution.marketGain)}}>
              {formatCurrency(Math.abs(contribution.marketGain))}
            </strong>
            .
          </p>
        ) : (
          <div style={{display: 'flex', gap: 32, flexWrap: 'wrap'}}>
            <Figure
              label="Você aportou"
              value={formatCurrency(contribution.contributed)}
            />
            <Figure
              label="O mercado rendeu"
              value={formatCurrency(contribution.marketGain)}
              color={toneColor(contribution.marketGain)}
              note={
                contribution.marketGainPct !== null
                  ? `${pct(contribution.marketGainPct)} sobre o aportado`
                  : undefined
              }
            />
          </div>
        )}

        <ContributionBar data={contribution} />
      </div>

      {/*
        TWR entra a partir do intermediário. Para o iniciante, um percentual de
        rentabilidade ao lado do valor em reais é o número que mais confunde —
        ele já tem a resposta em dinheiro, que é o que precisa.
      */}
      {!isBeginner && twr.value !== null && (
        <div
          style={{
            display: 'flex',
            gap: 32,
            flexWrap: 'wrap',
            paddingTop: 16,
            borderTop: '1px solid var(--hair)',
          }}>
          <Figure
            label="Rentabilidade (TWR)"
            value={pct(twr.value)}
            color={toneColor(twr.value)}
            note={
              twr.annualized !== null
                ? `${pct(twr.annualized)} ao ano`
                : undefined
            }
            tooltip="Neutraliza aportes e retiradas — é o número comparável com CDI e IBOV."
          />

          {isAdvanced && irr !== null && (
            <Figure
              label="Retorno do seu capital (IRR)"
              value={pct(irr)}
              color={toneColor(irr)}
              note={`${twr.periods} pregões`}
              tooltip="Pondera pelo momento dos aportes. Acima do TWR significa que você aportou bem."
            />
          )}
        </div>
      )}

      {/*
        Beta e tracking error — só no avançado, e só com valor real. Nunca
        renderiza traço: uma métrica permanentemente vazia contamina a leitura
        das vizinhas, que foi o motivo de TRA-145 tirá-las da tela.
      */}
      {showBenchmark && (
        <div
          style={{
            display: 'flex',
            gap: 32,
            flexWrap: 'wrap',
            paddingTop: 16,
            borderTop: '1px solid var(--hair)',
          }}>
          <Figure
            label="Beta vs IBOV"
            value={(benchmark.beta as number).toFixed(2)}
            note={`${benchmark.observations} pregões`}
            tooltip="Quanto a carteira balança em relação ao índice. Acima de 1 amplifica; abaixo, amortece."
          />
          {benchmark.trackingError !== null && (
            <Figure
              label="Tracking error"
              value={`${(benchmark.trackingError * 100).toFixed(2)}%`}
              note="anualizado"
              tooltip="Quanto o retorno da carteira se afasta do índice. Quanto menor, mais colada ao IBOV."
            />
          )}
          {benchmark.correlation !== null && (
            <Figure
              label="Correlação"
              value={benchmark.correlation.toFixed(2)}
              note="com o IBOV"
              tooltip="Confiabilidade do beta: correlação baixa significa que o beta explica pouco do movimento."
            />
          )}
        </div>
      )}

      {isAdvanced && twr.value !== null && irr !== null && (
        <p style={{margin: 0, ...muted}}>
          {irr > twr.value
            ? 'Seu IRR está acima do TWR: os aportes entraram em bons momentos.'
            : irr < twr.value
              ? 'Seu IRR está abaixo do TWR: os aportes entraram em momentos piores que a média do período.'
              : 'IRR e TWR coincidem: os aportes não alteraram o resultado.'}
        </p>
      )}

      {staleDays > 0 && !isBeginner && (
        <p style={{margin: 0, ...muted}}>
          {staleDays} {staleDays === 1 ? 'dia' : 'dias'} da série sem cotação
          para todos os ativos.
        </p>
      )}

      <UnavailableNote reasons={unavailable} />
    </div>
  );
}

function Figure({
  label,
  value,
  color,
  note,
  tooltip,
}: {
  label: string;
  value: string;
  color?: string;
  note?: string;
  tooltip?: string;
}) {
  return (
    <div
      style={{display: 'flex', flexDirection: 'column', gap: 2}}
      title={tooltip}>
      <span
        style={{
          fontSize: 10.5,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: 'var(--color-neutral-500)',
        }}>
        {label}
      </span>
      <span style={{fontSize: 22, fontWeight: 600, ...numeric, color}}>
        {value}
      </span>
      {note && <span style={{fontSize: 12, ...muted, ...numeric}}>{note}</span>}
    </div>
  );
}
