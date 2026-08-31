import {useState, type ReactNode} from 'react';
import {formatCurrency, formatPercentage} from '@/utils/formatters';
import {
  calculateFixedIncomeComparison,
  type FixedIncomeScenarioResult,
} from '@/pages/planning-fixed-income.utils';

// ─── Componente auxiliar: card de resultado ──────────────────────────────────

function ResultCard({children}: {children: ReactNode}) {
  return (
    <div style={{
      borderRadius: 10,
      padding: '18px 20px',
      marginTop: 4,
      background: 'rgba(145,132,217,0.15)',
      borderLeft: '3px solid var(--ac)',
    }}>
      {children}
    </div>
  );
}

function formatMoneyInput(value: string): string {
  const digits = String(value || '').replace(/\D/g, '');
  if (!digits) return '';
  return Number(digits).toLocaleString('pt-BR');
}

function parseMoneyInput(value: string): number {
  const digits = String(value || '').replace(/\D/g, '');
  if (!digits) return 0;
  return Number(digits);
}

// ─── Componente auxiliar: campo de entrada ────────────────────────────────────

function FieldGroup({
  label,
  id,
  value,
  onChange,
  placeholder,
  step,
  suffix,
  helpText,
  inputType = 'number',
}: {
  label: string;
  id: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  step?: string;
  suffix?: string;
  helpText?: string;
  inputType?: 'number' | 'text';
}) {
  return (
    <div style={{display: 'flex', flexDirection: 'column', gap: 6}}>
      <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8}}>
        <label htmlFor={id} style={{fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--color-neutral-500)', fontWeight: 500}}>
          {label}
        </label>
        {helpText ? (
          <button type="button" title={helpText} aria-label={`Ajuda: ${label}`}
            style={{background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'var(--color-neutral-500)'}}>
            <i className="ph-fill ph-question" style={{fontSize: 13}} />
          </button>
        ) : null}
      </div>
      <div style={{position: 'relative'}}>
        <input
          id={id}
          type={inputType}
          step={step}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          inputMode={inputType === 'text' ? 'numeric' : 'decimal'}
          style={{
            width: '100%',
            height: 42,
            paddingLeft: 12,
            paddingRight: suffix ? 40 : 12,
            border: '1px solid var(--hair)',
            borderRadius: 8,
            background: 'var(--surf-3)',
            fontSize: 13,
            color: 'inherit',
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />
        {suffix && (
          <span style={{position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 11.5, color: 'var(--color-neutral-500)', pointerEvents: 'none', fontWeight: 500}}>
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────

const Planning = () => {
  // Tab state
  const [activeTab, setActiveTab] = useState<'aposentadoria' | 'mensal' | 'juros' | 'renda-fixa'>('aposentadoria');

  // Calculadora de aposentadoria
  const [retirementAge, setRetirementAge] = useState<string>('65');
  const [currentAge, setCurrentAge] = useState<string>('30');
  const [monthlyExpenses, setMonthlyExpenses] = useState<string>('5000');
  const [retirementResult, setRetirementResult] = useState<number | null>(null);

  // Calculadora de investimento mensal
  const [monthlyIncome, setMonthlyIncome] = useState<string>('10000');
  const [savingsPercentage, setSavingsPercentage] = useState<string>('20');
  const [investmentGoal, setInvestmentGoal] = useState<string>('1000000');
  const [investmentResult, setInvestmentResult] = useState<number | null>(null);

  // Calculadora de juros compostos
  const [initialAmount, setInitialAmount] = useState<string>('10000');
  const [monthlyContribution, setMonthlyContribution] =
    useState<string>('1000');
  const [annualRate, setAnnualRate] = useState<string>('10');
  const [investmentYears, setInvestmentYears] = useState<string>('20');
  const [compoundResult, setCompoundResult] = useState<number | null>(null);
  const [fixedIncomeInitial, setFixedIncomeInitial] = useState<string>('100.000');
  const [fixedIncomeYears, setFixedIncomeYears] = useState<string>('4');
  const [annualInflationRate, setAnnualInflationRate] = useState<string>('4.5');
  const [annualSelicRate, setAnnualSelicRate] = useState<string>('10.5');
  const [prefixRate, setPrefixRate] = useState<string>('14');
  const [ipcaSpreadRate, setIpcaSpreadRate] = useState<string>('6.5');
  const [selicSpreadRate, setSelicSpreadRate] = useState<string>('2');
  const [lcaRate, setLcaRate] = useState<string>('12.5');
  const [taxableIrRate, setTaxableIrRate] = useState<string>('15');
  const [fixedIncomeResult, setFixedIncomeResult] =
    useState<FixedIncomeScenarioResult[] | null>(null);

  const calculateRetirement = () => {
    const annualExpenses = parseFloat(monthlyExpenses) * 12;
    setRetirementResult(annualExpenses * 25);
  };

  const calculateMonthlyInvestment = () => {
    const income = parseFloat(monthlyIncome);
    const monthlyAmount = income * (parseFloat(savingsPercentage) / 100);
    const goal = parseFloat(investmentGoal);
    const monthlyRate = 0.1 / 12;
    const monthsNeeded =
      Math.log(1 + (goal * monthlyRate) / monthlyAmount) /
      Math.log(1 + monthlyRate);
    setInvestmentResult(monthsNeeded / 12);
  };

  const calculateCompoundInterest = () => {
    const initial = parseFloat(initialAmount);
    const monthly = parseFloat(monthlyContribution);
    const rate = parseFloat(annualRate) / 100 / 12;
    const months = parseInt(investmentYears) * 12;
    const finalAmount =
      initial * Math.pow(1 + rate, months) +
      monthly * ((Math.pow(1 + rate, months) - 1) / rate);
    setCompoundResult(finalAmount);
  };

  const calculateFixedIncomePlanner = () => {
    const scenarios = calculateFixedIncomeComparison({
      initialCapital: parseMoneyInput(fixedIncomeInitial),
      years: parseFloat(fixedIncomeYears || '0'),
      annualInflationRate: parseFloat(annualInflationRate || '0') / 100,
      annualSelicRate: parseFloat(annualSelicRate || '0') / 100,
      annualPrefixRate: parseFloat(prefixRate || '0') / 100,
      annualIpcaSpreadRate: parseFloat(ipcaSpreadRate || '0') / 100,
      annualSelicSpreadRate: parseFloat(selicSpreadRate || '0') / 100,
      annualLcaRate: parseFloat(lcaRate || '0') / 100,
      taxableIrRate: parseFloat(taxableIrRate || '0') / 100,
    });
    setFixedIncomeResult(scenarios);
  };

  return (
    <div style={{minHeight: '100vh', padding: '8px', position: 'relative', overflow: 'hidden', fontFamily: 'var(--font-body)', background: 'transparent', color: 'inherit'}}>
      {/* Background Glows */}
      <div style={{position: 'absolute', top: 0, left: 0, width: 500, height: 500, borderRadius: '50%', pointerEvents: 'none', opacity: 0.4, background: 'radial-gradient(circle, rgba(145,132,217,0.15) 0%, transparent 70%)'}} />
      <div style={{position: 'absolute', bottom: 0, right: 0, width: 500, height: 500, borderRadius: '50%', pointerEvents: 'none', opacity: 0.3, background: 'radial-gradient(circle, rgba(145,132,217,0.15) 0%, transparent 70%)'}} />

      <div style={{position: 'relative', zIndex: 10, maxWidth: 960, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 32}}>
        {/* Cabeçalho da página */}
        <div style={{display: 'flex', flexDirection: 'column', gap: 16}}>
          <div>
            <div style={{display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8}}>
              <div style={{width: 40, height: 40, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--ac)', flexShrink: 0}}>
                <i className="ph-fill ph-calculator" style={{fontSize: 20, color: '#fff'}} />
              </div>
              <h1 style={{fontWeight: 700, fontSize: 32, letterSpacing: '-0.02em', fontFamily: 'var(--font-heading)', margin: 0}}>
                Planejamento Financeiro
              </h1>
            </div>
            <p style={{fontSize: 14, color: 'var(--color-neutral-500)', margin: 0, marginLeft: 52}}>
              Calculadoras de precisão institucional para simular seu amanhã
            </p>
          </div>

          <span style={{fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.1em', padding: '6px 16px', borderRadius: 999, width: 'fit-content', background: 'rgba(145,132,217,0.15)', color: 'var(--ac)', border: '1px solid rgba(145,132,217,0.35)'}}>
            Terminal de Simulação
          </span>
        </div>

        {/* Tabs */}
        <div style={{display: 'flex', flexDirection: 'column', gap: 24}}>
          {/* Pill tab container */}
          <div style={{display: 'flex', gap: 4, background: 'var(--surf-3)', borderRadius: 10, padding: 4, flexWrap: 'wrap'}}>
            {(['aposentadoria', 'mensal', 'juros', 'renda-fixa'] as const).map((tab, i) => (
              <button key={tab} type="button"
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: '7px 16px', borderRadius: 7, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500,
                  background: activeTab === tab ? 'var(--ac)' : 'transparent',
                  color: activeTab === tab ? '#fff' : 'var(--color-neutral-400)',
                  transition: 'background 0.15s',
                }}>
                {(['Aposentadoria', 'Inv. Mensal', 'Juros Compostos', 'Renda Fixa'] as const)[i]}
              </button>
            ))}
          </div>

          {/* ── Aposentadoria ──────────────────────────────────────────────── */}
          {activeTab === 'aposentadoria' && (
            <div style={{border: '1px solid var(--hair)', borderRadius: 12, background: 'var(--nk-card)', padding: 24, display: 'flex', flexDirection: 'column', gap: 32, position: 'relative', overflow: 'hidden'}}>
              {/* Header do card */}
              <div style={{display: 'flex', alignItems: 'center', gap: 16, paddingBottom: 24, borderBottom: '1px solid var(--hair-soft)'}}>
                <div style={{width: 48, height: 48, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(145,132,217,0.15)', color: 'var(--ac)'}}>
                  <i className="ph-fill ph-piggy-bank" style={{fontSize: 18}} />
                </div>
                <div>
                  <h2 style={{fontWeight: 600, fontSize: 18, fontFamily: 'var(--font-heading)', margin: 0}}>
                    Calculadora de Independência Financeira
                  </h2>
                  <p style={{fontSize: 13, marginTop: 4, color: 'var(--color-neutral-500)', margin: '4px 0 0'}}>
                    Descubra o patrimônio necessário para aposentadoria baseado
                    na regra dos 25x (Safe Withdrawal Rate de 4%)
                  </p>
                </div>
              </div>

              {/* Inputs */}
              <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16}}>
                <FieldGroup
                  label="Idade atual"
                  id="currentAge"
                  value={currentAge}
                  onChange={setCurrentAge}
                  placeholder="30"
                  suffix="anos"
                />
                <FieldGroup
                  label="Idade na aposentadoria"
                  id="retirementAge"
                  value={retirementAge}
                  onChange={setRetirementAge}
                  placeholder="65"
                  suffix="anos"
                />
                <FieldGroup
                  label="Gastos mensais desejados"
                  id="monthlyExpenses"
                  value={monthlyExpenses}
                  onChange={setMonthlyExpenses}
                  placeholder="5000"
                  suffix="R$"
                />
              </div>

              <button type="button" onClick={calculateRetirement}
                style={{height: 40, padding: '0 20px', borderRadius: 8, border: 'none', background: 'var(--grad-violet)', color: '#fff', fontSize: 13, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%'}}>
                Calcular
                <i className="ph-fill ph-arrow-right" style={{fontSize: 16}} />
              </button>

              {retirementResult && (
                <ResultCard>
                  <p style={{fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8, color: 'var(--color-neutral-500)', margin: '0 0 8px'}}>
                    Patrimônio necessário
                  </p>
                  <p style={{fontSize: 24, fontWeight: 700, fontFamily: 'var(--font-heading)', color: 'var(--ac)', margin: 0}}>
                    {formatCurrency(retirementResult)}
                  </p>
                  <p style={{fontSize: 12, marginTop: 8, color: 'var(--color-neutral-500)', margin: '8px 0 0'}}>
                    Baseado na regra dos 25x — você poderá retirar 4% ao ano sem
                    esgotar o capital
                  </p>
                </ResultCard>
              )}
            </div>
          )}

          {/* ── Investimento Mensal ─────────────────────────────────────────── */}
          {activeTab === 'mensal' && (
            <div style={{border: '1px solid var(--hair)', borderRadius: 12, background: 'var(--nk-card)', padding: 24, display: 'flex', flexDirection: 'column', gap: 32, position: 'relative', overflow: 'hidden'}}>
              <div style={{display: 'flex', alignItems: 'center', gap: 16, paddingBottom: 24, borderBottom: '1px solid var(--hair-soft)'}}>
                <div style={{width: 48, height: 48, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(145,132,217,0.15)', color: 'var(--ac)'}}>
                  <i className="ph-fill ph-trend-up" style={{fontSize: 18}} />
                </div>
                <div>
                  <h2 style={{fontWeight: 600, fontSize: 18, fontFamily: 'var(--font-heading)', margin: 0}}>
                    Acelerador de Metas
                  </h2>
                  <p style={{fontSize: 13, marginTop: 4, color: 'var(--color-neutral-500)', margin: '4px 0 0'}}>
                    Simule o tempo exato para alcançar seu alvo patrimonial
                    (estimado a 10% a.a.)
                  </p>
                </div>
              </div>

              <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16}}>
                <FieldGroup
                  label="Renda mensal"
                  id="monthlyIncome"
                  value={monthlyIncome}
                  onChange={setMonthlyIncome}
                  placeholder="10000"
                  suffix="R$"
                />
                <FieldGroup
                  label="% da renda para investir"
                  id="savingsPercentage"
                  value={savingsPercentage}
                  onChange={setSavingsPercentage}
                  placeholder="20"
                  suffix="%"
                />
                <FieldGroup
                  label="Meta de investimento"
                  id="investmentGoal"
                  value={investmentGoal}
                  onChange={setInvestmentGoal}
                  placeholder="1000000"
                  suffix="R$"
                />
              </div>

              <button type="button" onClick={calculateMonthlyInvestment}
                style={{height: 40, padding: '0 20px', borderRadius: 8, border: 'none', background: 'var(--grad-violet)', color: '#fff', fontSize: 13, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%'}}>
                Calcular
                <i className="ph-fill ph-arrow-right" style={{fontSize: 16}} />
              </button>

              {investmentResult && (
                <ResultCard>
                  <p style={{fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--color-neutral-500)', margin: '0 0 8px'}}>
                    Tempo estimado para atingir a meta
                  </p>
                  <p style={{fontSize: 24, fontWeight: 700, fontFamily: 'var(--font-heading)', color: 'var(--ac)', margin: 0}}>
                    {investmentResult.toFixed(1)} anos
                  </p>
                  <p style={{fontSize: 12, marginTop: 8, color: 'var(--color-neutral-500)', margin: '8px 0 0'}}>
                    Investindo{' '}
                    {formatCurrency(
                      (parseFloat(monthlyIncome) *
                        parseFloat(savingsPercentage)) /
                        100,
                    )}{' '}
                    por mês com retorno de 10% a.a.
                  </p>
                </ResultCard>
              )}
            </div>
          )}

          {/* ── Juros Compostos ─────────────────────────────────────────────── */}
          {activeTab === 'juros' && (
            <div style={{border: '1px solid var(--hair)', borderRadius: 12, background: 'var(--nk-card)', padding: 24, display: 'flex', flexDirection: 'column', gap: 32, position: 'relative', overflow: 'hidden'}}>
              <div style={{display: 'flex', alignItems: 'center', gap: 16, paddingBottom: 24, borderBottom: '1px solid var(--hair-soft)'}}>
                <div style={{width: 48, height: 48, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(145,132,217,0.15)', color: 'var(--ac)'}}>
                  <i className="ph-fill ph-calculator" style={{fontSize: 18}} />
                </div>
                <div>
                  <h2 style={{fontWeight: 600, fontSize: 18, fontFamily: 'var(--font-heading)', margin: 0}}>
                    Poder dos Juros Compostos
                  </h2>
                  <p style={{fontSize: 13, marginTop: 4, color: 'var(--color-neutral-500)', margin: '4px 0 0'}}>
                    A 8ª maravilha do mundo trabalhando a favor do seu capital
                    no longo prazo
                  </p>
                </div>
              </div>

              <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16}}>
                <FieldGroup
                  label="Valor inicial"
                  id="initialAmount"
                  value={initialAmount}
                  onChange={setInitialAmount}
                  placeholder="10000"
                  suffix="R$"
                />
                <FieldGroup
                  label="Contribuição mensal"
                  id="monthlyContribution"
                  value={monthlyContribution}
                  onChange={setMonthlyContribution}
                  placeholder="1000"
                  suffix="R$"
                />
                <FieldGroup
                  label="Taxa de juros anual"
                  id="annualRate"
                  value={annualRate}
                  onChange={setAnnualRate}
                  placeholder="10"
                  step="0.1"
                  suffix="%"
                />
                <FieldGroup
                  label="Período"
                  id="investmentYears"
                  value={investmentYears}
                  onChange={setInvestmentYears}
                  placeholder="20"
                  suffix="anos"
                />
              </div>

              <button type="button" onClick={calculateCompoundInterest}
                style={{height: 40, padding: '0 20px', borderRadius: 8, border: 'none', background: 'var(--grad-violet)', color: '#fff', fontSize: 13, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%'}}>
                Calcular
                <i className="ph-fill ph-arrow-right" style={{fontSize: 16}} />
              </button>

              {compoundResult &&
                (() => {
                  const totalInvested =
                    parseFloat(initialAmount) +
                    parseFloat(monthlyContribution) *
                      parseInt(investmentYears) *
                      12;
                  const profit = compoundResult - totalInvested;
                  return (
                    <ResultCard>
                      <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 16}}>
                        <div>
                          <p style={{fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4, color: 'var(--color-neutral-500)', margin: '0 0 4px'}}>
                            Valor final
                          </p>
                          <p style={{fontSize: 20, fontWeight: 700, fontFamily: 'var(--font-heading)', color: 'var(--ac)', margin: 0}}>
                            {formatCurrency(compoundResult)}
                          </p>
                        </div>
                        <div>
                          <p style={{fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4, color: 'var(--color-neutral-500)', margin: '0 0 4px'}}>
                            Total investido
                          </p>
                          <p style={{fontSize: 20, fontWeight: 700, fontFamily: 'var(--font-heading)', margin: 0}}>
                            {formatCurrency(totalInvested)}
                          </p>
                        </div>
                        <div>
                          <p style={{fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4, color: 'var(--color-neutral-500)', margin: '0 0 4px'}}>
                            Lucro
                          </p>
                          <p style={{fontSize: 20, fontWeight: 700, fontFamily: 'var(--font-heading)', color: 'var(--pos)', margin: 0}}>
                            {formatCurrency(profit)}
                          </p>
                        </div>
                      </div>
                    </ResultCard>
                  );
                })()}
            </div>
          )}

          {/* ── Comparador de Renda Fixa ───────────────────────────────────── */}
          {activeTab === 'renda-fixa' && (
            <div style={{border: '1px solid var(--hair)', borderRadius: 12, background: 'var(--nk-card)', padding: 24, display: 'flex', flexDirection: 'column', gap: 32, position: 'relative', overflow: 'hidden'}}>
              <div style={{display: 'flex', alignItems: 'center', gap: 16, paddingBottom: 24, borderBottom: '1px solid var(--hair-soft)'}}>
                <div style={{width: 48, height: 48, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(145,132,217,0.15)', color: 'var(--ac)'}}>
                  <i className="ph-fill ph-trend-up" style={{fontSize: 18}} />
                </div>
                <div>
                  <h2 style={{fontWeight: 600, fontSize: 18, fontFamily: 'var(--font-heading)', margin: 0}}>
                    Planejador de Renda Fixa (Tesouro + LCA)
                  </h2>
                  <p style={{fontSize: 13, marginTop: 4, color: 'var(--color-neutral-500)', margin: '4px 0 0'}}>
                    Compare Prefixado, IPCA+, Selic+ e LCA com efeito de inflação e imposto.
                  </p>
                </div>
              </div>

              <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16}}>
                <FieldGroup
                  label="Capital inicial"
                  id="fixedIncomeInitial"
                  value={fixedIncomeInitial}
                  onChange={(value) => setFixedIncomeInitial(formatMoneyInput(value))}
                  placeholder="100.000"
                  suffix="R$"
                  inputType="text"
                  helpText="Valor que você vai investir hoje. Ex.: 100.000 significa cem mil reais."
                />
                <FieldGroup
                  label="Prazo"
                  id="fixedIncomeYears"
                  value={fixedIncomeYears}
                  onChange={setFixedIncomeYears}
                  placeholder="4"
                  suffix="anos"
                  helpText="Tempo total do investimento até o vencimento/resgate planejado."
                />
                <FieldGroup
                  label="Inflação anual (IPCA)"
                  id="annualInflationRate"
                  value={annualInflationRate}
                  onChange={setAnnualInflationRate}
                  placeholder="4.5"
                  step="0.1"
                  suffix="%"
                  helpText="Inflação esperada por ano. Ela reduz o ganho real do investimento."
                />
              </div>

              <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 16}}>
                <FieldGroup
                  label="Prefixado anual"
                  id="prefixRate"
                  value={prefixRate}
                  onChange={setPrefixRate}
                  placeholder="14"
                  step="0.1"
                  suffix="%"
                  helpText="Taxa fixa combinada no momento da aplicação. Ex.: 14% ao ano até o vencimento."
                />
                <FieldGroup
                  label="IPCA+ spread anual"
                  id="ipcaSpreadRate"
                  value={ipcaSpreadRate}
                  onChange={setIpcaSpreadRate}
                  placeholder="6.5"
                  step="0.1"
                  suffix="%"
                  helpText="No IPCA+, o retorno é: inflação do período + taxa fixa (spread). Ex.: IPCA 5% + spread 6,5% ≈ 11,5% nominal ao ano."
                />
                <FieldGroup
                  label="Selic anual"
                  id="annualSelicRate"
                  value={annualSelicRate}
                  onChange={setAnnualSelicRate}
                  placeholder="10.5"
                  step="0.1"
                  suffix="%"
                  helpText="Taxa Selic esperada por ano, usada como base no cenário Selic+."
                />
                <FieldGroup
                  label="Selic+ spread anual"
                  id="selicSpreadRate"
                  value={selicSpreadRate}
                  onChange={setSelicSpreadRate}
                  placeholder="2"
                  step="0.1"
                  suffix="%"
                  helpText="Taxa adicional sobre a Selic no cenário Selic+. Ex.: Selic 10,5% + 2% de spread."
                />
              </div>

              <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16}}>
                <FieldGroup
                  label="LCA anual (isento)"
                  id="lcaRate"
                  value={lcaRate}
                  onChange={setLcaRate}
                  placeholder="12.5"
                  step="0.1"
                  suffix="%"
                  helpText="Rentabilidade anual da LCA. LCA é isenta de IR para pessoa física."
                />
                <FieldGroup
                  label="IR (ativos tributáveis)"
                  id="taxableIrRate"
                  value={taxableIrRate}
                  onChange={setTaxableIrRate}
                  placeholder="15"
                  step="0.1"
                  suffix="%"
                  helpText="Alíquota de IR aplicada aos investimentos tributáveis neste comparador (Prefixado, IPCA+ e Selic+). LCA permanece isenta."
                />
              </div>

              <button type="button" onClick={calculateFixedIncomePlanner}
                style={{height: 40, padding: '0 20px', borderRadius: 8, border: 'none', background: 'var(--grad-violet)', color: '#fff', fontSize: 13, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%'}}>
                Comparar Cenários
                <i className="ph-fill ph-arrow-right" style={{fontSize: 16}} />
              </button>

              {fixedIncomeResult && fixedIncomeResult.length > 0 && (
                <ResultCard>
                  <p style={{fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--color-neutral-500)', margin: '0 0 12px'}}>
                    Resultado comparativo (líquido de IR e inflação)
                  </p>
                  <div style={{display: 'flex', flexDirection: 'column', gap: 12}}>
                    {[...fixedIncomeResult]
                      .sort((a, b) => b.realFinalValue - a.realFinalValue)
                      .map((scenario, idx) => (
                        <div
                          key={scenario.key}
                          style={{
                            borderRadius: 8,
                            border: idx === 0 ? '1px solid rgba(47,214,163,0.20)' : '1px solid var(--hair)',
                            padding: '12px',
                            background: idx === 0 ? 'rgba(47,214,163,0.20)' : 'var(--surf-2)',
                          }}>
                          <div style={{display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 8}}>
                            <div style={{display: 'flex', alignItems: 'center', gap: 8}}>
                              <p style={{fontWeight: 600, margin: 0}}>{scenario.label}</p>
                              {idx === 0 ? (
                                <span style={{fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--pos)', fontWeight: 700}}>
                                  Melhor Retorno Real
                                </span>
                              ) : null}
                            </div>
                            <div style={{textAlign: 'right'}}>
                              <p style={{fontSize: 13, fontWeight: 700, color: 'var(--ac)', margin: 0}}>
                                {formatCurrency(scenario.realFinalValue)} (real)
                              </p>
                              <p style={{fontSize: 12, color: 'var(--color-neutral-500)', margin: 0}}>
                                {formatCurrency(scenario.nominalFinalValue)} (nominal)
                              </p>
                            </div>
                          </div>
                          <div style={{marginTop: 8, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 8, fontSize: 12}}>
                            <p style={{color: 'var(--color-neutral-500)', margin: 0}}>
                              Taxa bruta anual: {formatPercentage(scenario.annualGrossRate * 100)}
                            </p>
                            <p style={{color: 'var(--color-neutral-500)', margin: 0}}>
                              IR aplicado: {formatPercentage(scenario.taxRate * 100)}
                            </p>
                            <p style={{color: 'var(--color-neutral-500)', margin: 0}}>
                              Ganho real anual: {formatPercentage(scenario.annualRealRate * 100)}
                            </p>
                          </div>
                        </div>
                      ))}
                  </div>
                  <p style={{fontSize: 12, marginTop: 12, color: 'var(--color-neutral-500)', margin: '12px 0 0'}}>
                    Observação: Prefixado a 14% para 2029 rende nominalmente 14% ao ano. O ganho real depende da inflação no período.
                    Ex.: retorno real aproximado = (1 + taxa nominal) / (1 + inflação) - 1.
                  </p>
                </ResultCard>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Planning;
