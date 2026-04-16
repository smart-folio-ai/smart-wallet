import {useState, type ReactNode} from 'react';
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {Button} from '@/components/ui/button';
import {formatCurrency, formatPercentage} from '@/utils/formatters';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {Calculator, PiggyBank, TrendingUp, ArrowRight, CircleHelp} from 'lucide-react';
import {
  calculateFixedIncomeComparison,
  type FixedIncomeScenarioResult,
} from '@/pages/planning-fixed-income.utils';

// ─── Componente auxiliar: card de resultado ──────────────────────────────────

function ResultCard({children}: {children: ReactNode}) {
  return (
    <div className="rounded-xl p-5 mt-1 bg-primary/5 border-l-[3px] border-l-primary/60">
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
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <Label
          htmlFor={id}
          className="text-xs uppercase tracking-widest text-muted-foreground font-medium"
          style={{letterSpacing: '0.1em'}}>
          {label}
        </Label>
        {helpText ? (
          <TooltipProvider delayDuration={100}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  aria-label={`Ajuda: ${label}`}
                  className="inline-flex h-4 w-4 items-center justify-center text-muted-foreground/80 hover:text-primary transition-colors">
                  <CircleHelp className="h-3.5 w-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" align="end" className="max-w-[280px] text-xs leading-relaxed">
                {helpText}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : null}
      </div>
      <div className="relative">
        <Input
          id={id}
          type={inputType}
          step={step}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          inputMode={inputType === 'text' ? 'numeric' : 'decimal'}
          className="h-11 text-sm bg-background border-input focus-visible:ring-1 focus-visible:ring-primary pr-12 transition-all"
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none font-medium">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────

const Planning = () => {
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
    <div className="min-h-screen p-2 md:p-6 relative overflow-hidden font-sans bg-transparent text-foreground">
      {/* Background Glows (se adaptam ao tema claro ou escuro) */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] rounded-full pointer-events-none opacity-40 bg-[radial-gradient(circle,_var(--tw-gradient-stops))] from-primary/10 to-transparent" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full pointer-events-none opacity-30 bg-[radial-gradient(circle,_var(--tw-gradient-stops))] from-primary/5 to-transparent" />

      <div className="relative z-10 max-w-5xl mx-auto space-y-8">
        {/* Cabeçalho da página */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-primary shadow-lg shadow-primary/20">
                <Calculator className="h-5 w-5 text-primary-foreground" />
              </div>
              <h1 className="font-bold text-3xl md:text-4xl tracking-tight font-heading">
                Planejamento Financeiro
              </h1>
            </div>
            <p className="text-sm md:text-base ml-0 md:ml-14 text-muted-foreground">
              Calculadoras de precisão institucional para simular seu amanhã
            </p>
          </div>

          <span className="text-xs font-medium uppercase tracking-widest px-4 py-2 rounded-full w-fit bg-primary/10 text-primary border border-primary/20">
            Terminal de Simulação
          </span>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="retirement" className="space-y-6">
          <TabsList className="grid w-full h-14 grid-cols-4 p-1.5 rounded-2xl bg-card border shadow-sm">
            {[
              {
                value: 'retirement',
                label: 'Aposentadoria',
                icon: <PiggyBank className="h-4 w-4" />,
              },
              {
                value: 'investment',
                label: 'Inv. Mensal',
                icon: <TrendingUp className="h-4 w-4" />,
              },
              {
                value: 'compound',
                label: 'Juros Compostos',
                icon: <Calculator className="h-4 w-4" />,
              },
              {
                value: 'fixed_income',
                label: 'Renda Fixa',
                icon: <TrendingUp className="h-4 w-4" />,
              },
            ].map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="flex items-center gap-2 text-sm font-medium rounded-xl transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md py-2.5 font-heading">
                {tab.icon}
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {/* ── Aposentadoria ──────────────────────────────────────────────── */}
          <TabsContent value="retirement">
            <div className="rounded-2xl p-6 md:p-8 space-y-8 bg-card border border-border/50 shadow-xl shadow-primary/5 relative overflow-hidden group">
              {/* Header do card */}
              <div className="flex items-center gap-4 pb-6 border-b border-border/40">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-primary/10 text-primary shadow-inner">
                  <PiggyBank className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="font-semibold text-lg md:text-xl font-heading text-foreground">
                    Calculadora de Independência Financeira
                  </h2>
                  <p className="text-sm mt-1 text-muted-foreground">
                    Descubra o patrimônio necessário para aposentadoria baseado
                    na regra dos 25x (Safe Withdrawal Rate de 4%)
                  </p>
                </div>
              </div>

              {/* Inputs */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

              <Button
                onClick={calculateRetirement}
                className="w-full h-12 font-semibold text-sm gap-2 transition-all duration-300 shadow-md shadow-primary/20 hover:scale-[1.01]">
                Calcular
                <ArrowRight className="h-4 w-4" />
              </Button>

              {retirementResult && (
                <ResultCard>
                  <p
                    className="text-xs uppercase tracking-widest mb-2 text-muted-foreground"
                    style={{letterSpacing: '0.1em'}}>
                    Patrimônio necessário
                  </p>
                  <p className="text-2xl font-bold font-heading text-primary">
                    {formatCurrency(retirementResult)}
                  </p>
                  <p className="text-xs mt-2 text-muted-foreground">
                    Baseado na regra dos 25x — você poderá retirar 4% ao ano sem
                    esgotar o capital
                  </p>
                </ResultCard>
              )}
            </div>
          </TabsContent>

          {/* ── Investimento Mensal ─────────────────────────────────────────── */}
          <TabsContent value="investment">
            <div className="rounded-2xl p-6 md:p-8 space-y-8 bg-card border border-border/50 shadow-xl shadow-primary/5 relative overflow-hidden">
              <div className="flex items-center gap-4 pb-6 border-b border-border/40">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-primary/10 text-primary shadow-inner">
                  <TrendingUp className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="font-semibold text-lg md:text-xl font-heading text-foreground">
                    Acelerador de Metas
                  </h2>
                  <p className="text-sm mt-1 text-muted-foreground">
                    Simule o tempo exato para alcançar seu alvo patrimonial
                    (estimado a 10% a.a.)
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

              <Button
                onClick={calculateMonthlyInvestment}
                className="w-full h-12 font-semibold text-sm gap-2 transition-all duration-300 shadow-md shadow-primary/20 hover:scale-[1.01]">
                Calcular
                <ArrowRight className="h-4 w-4" />
              </Button>

              {investmentResult && (
                <ResultCard>
                  <p
                    className="text-xs uppercase tracking-widest mb-2 text-muted-foreground"
                    style={{letterSpacing: '0.1em'}}>
                    Tempo estimado para atingir a meta
                  </p>
                  <p className="text-2xl font-bold font-heading text-primary">
                    {investmentResult.toFixed(1)} anos
                  </p>
                  <p className="text-xs mt-2 text-muted-foreground">
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
          </TabsContent>

          {/* ── Juros Compostos ─────────────────────────────────────────────── */}
          <TabsContent value="compound">
            <div className="rounded-2xl p-6 md:p-8 space-y-8 bg-card border border-border/50 shadow-xl shadow-primary/5 relative overflow-hidden">
              <div className="flex items-center gap-4 pb-6 border-b border-border/40">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-primary/10 text-primary shadow-inner">
                  <Calculator className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="font-semibold text-lg md:text-xl font-heading text-foreground">
                    Poder dos Juros Compostos
                  </h2>
                  <p className="text-sm mt-1 text-muted-foreground">
                    A 8ª maravilha do mundo trabalhando a favor do seu capital
                    no longo prazo
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

              <Button
                onClick={calculateCompoundInterest}
                className="w-full h-12 font-semibold text-sm gap-2 transition-all duration-300 shadow-md shadow-primary/20 hover:scale-[1.01]">
                Calcular
                <ArrowRight className="h-4 w-4" />
              </Button>

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
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <p
                            className="text-xs uppercase tracking-widest mb-1 text-muted-foreground"
                            style={{letterSpacing: '0.1em'}}>
                            Valor final
                          </p>
                          <p className="text-xl font-bold font-heading text-primary">
                            {formatCurrency(compoundResult)}
                          </p>
                        </div>
                        <div>
                          <p
                            className="text-xs uppercase tracking-widest mb-1 text-muted-foreground"
                            style={{letterSpacing: '0.1em'}}>
                            Total investido
                          </p>
                          <p className="text-xl font-bold font-heading text-foreground">
                            {formatCurrency(totalInvested)}
                          </p>
                        </div>
                        <div>
                          <p
                            className="text-xs uppercase tracking-widest mb-1 text-muted-foreground"
                            style={{letterSpacing: '0.1em'}}>
                            Lucro
                          </p>
                          <p className="text-xl font-bold font-heading text-green-500">
                            {formatCurrency(profit)}
                          </p>
                        </div>
                      </div>
                    </ResultCard>
                  );
                })()}
            </div>
          </TabsContent>

          {/* ── Comparador de Renda Fixa ───────────────────────────────────── */}
          <TabsContent value="fixed_income">
            <div className="rounded-2xl p-6 md:p-8 space-y-8 bg-card border border-border/50 shadow-xl shadow-primary/5 relative overflow-hidden">
              <div className="flex items-center gap-4 pb-6 border-b border-border/40">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-primary/10 text-primary shadow-inner">
                  <TrendingUp className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="font-semibold text-lg md:text-xl font-heading text-foreground">
                    Planejador de Renda Fixa (Tesouro + LCA)
                  </h2>
                  <p className="text-sm mt-1 text-muted-foreground">
                    Compare Prefixado, IPCA+, Selic+ e LCA com efeito de inflação e imposto.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

              <Button
                onClick={calculateFixedIncomePlanner}
                className="w-full h-12 font-semibold text-sm gap-2 transition-all duration-300 shadow-md shadow-primary/20 hover:scale-[1.01]">
                Comparar Cenários
                <ArrowRight className="h-4 w-4" />
              </Button>

              {fixedIncomeResult && fixedIncomeResult.length > 0 && (
                <ResultCard>
                  <p
                    className="text-xs uppercase tracking-widest mb-3 text-muted-foreground"
                    style={{letterSpacing: '0.1em'}}>
                    Resultado comparativo (líquido de IR e inflação)
                  </p>
                  <div className="space-y-3">
                    {[...fixedIncomeResult]
                      .sort((a, b) => b.realFinalValue - a.realFinalValue)
                      .map((scenario, idx) => (
                        <div
                          key={scenario.key}
                          className={`rounded-lg border px-3 py-3 ${
                            idx === 0
                              ? 'border-emerald-500/50 bg-emerald-500/10'
                              : 'border-border/70 bg-background'
                          }`}>
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-center gap-2">
                              <p className="font-semibold">{scenario.label}</p>
                              {idx === 0 ? (
                                <span className="text-[10px] uppercase tracking-widest text-emerald-600 font-bold">
                                  Melhor Retorno Real
                                </span>
                              ) : null}
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-bold text-primary">
                                {formatCurrency(scenario.realFinalValue)} (real)
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {formatCurrency(scenario.nominalFinalValue)} (nominal)
                              </p>
                            </div>
                          </div>
                          <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                            <p className="text-muted-foreground">
                              Taxa bruta anual: {formatPercentage(scenario.annualGrossRate * 100)}
                            </p>
                            <p className="text-muted-foreground">
                              IR aplicado: {formatPercentage(scenario.taxRate * 100)}
                            </p>
                            <p className="text-muted-foreground">
                              Ganho real anual: {formatPercentage(scenario.annualRealRate * 100)}
                            </p>
                          </div>
                        </div>
                      ))}
                  </div>
                  <p className="text-xs mt-3 text-muted-foreground">
                    Observação: Prefixado a 14% para 2029 rende nominalmente 14% ao ano. O ganho real depende da inflação no período.
                    Ex.: retorno real aproximado = (1 + taxa nominal) / (1 + inflação) - 1.
                  </p>
                </ResultCard>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Planning;
