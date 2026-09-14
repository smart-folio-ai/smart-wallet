import {useState} from 'react';
import {useFiscalOptimizer, useFiscalSummary} from '@/hooks/useFiscal';
import {latestMonth} from '@/services/fiscal/fiscal-summary';
import {DarfHero, MonthCalcCard} from '@/components/fiscal/DarfHero';
import {FiscalRoadmapSection} from '@/components/fiscal/FiscalRoadmapSection';
import {FiscalToolsSection} from '@/components/fiscal/FiscalToolsSection';

/**
 * Fiscal & IR — bloco `isFiscal` de design_handoff_trackerr/Trackerr App.dc.html.
 * Simulador, importações, guia do IR e relatórios não estão no handoff, mas são
 * fluxos reais: seguem abaixo, no mesmo desenho de card.
 */
export default function Fiscal() {
  const [year, setYear] = useState<number | undefined>();
  const summary = useFiscalSummary(year);
  const optimizer = useFiscalOptimizer(year);

  const monthly = summary.data?.monthly ?? [];
  const month = latestMonth(monthly);

  return (
    <div style={{display: 'flex', flexDirection: 'column', gap: 16.8}}>
      {summary.isError && (
        <div role="alert" style={{border: '1px solid var(--neg)', borderRadius: 8, padding: '11.2px 14px', fontSize: 12.5, color: 'var(--neg)', display: 'flex', alignItems: 'center', gap: 11.2}}>
          <span style={{flex: 1}}>Não foi possível carregar a apuração agora.</span>
          <button type="button" onClick={() => summary.refetch()} style={{border: '1px solid var(--neg)', borderRadius: 6, background: 'transparent', color: 'var(--neg)', height: 28, padding: '0 11.2px', cursor: 'pointer'}}>
            Tentar de novo
          </button>
        </div>
      )}
      <div className="grid grid-cols-1 items-start gap-[16.8px] lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]" aria-busy={summary.isLoading}>
        <DarfHero month={summary.isLoading ? null : month} />
        <MonthCalcCard month={month} />
      </div>
      <FiscalRoadmapSection month={month} monthly={monthly} year={summary.data?.year} />
      <FiscalToolsSection
        optimizer={optimizer.data}
        taxDrivers={summary.data?.taxDrivers ?? []}
        hasMonthly={summary.isLoading || monthly.length > 0}
        guide={summary.data?.guide ?? []}
        year={year ?? summary.data?.year}
        onYearChange={setYear}
      />
    </div>
  );
}
