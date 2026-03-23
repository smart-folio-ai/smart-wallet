import {useState} from 'react';
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {Button} from '@/components/ui/button';
import {formatCurrency} from '@/utils/formatters';
import {Calculator, PiggyBank, TrendingUp, ArrowRight} from 'lucide-react';

// ─── Componente auxiliar: card de resultado ──────────────────────────────────

function ResultCard({children}: {children: React.ReactNode}) {
  return (
    <div className="rounded-xl p-5 mt-1 bg-secondary border-l-[3px] border-l-primary">
      {children}
    </div>
  );
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
}: {
  label: string;
  id: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  step?: string;
  suffix?: string;
}) {
  return (
    <div className="space-y-2">
      <Label
        htmlFor={id}
        className="text-xs uppercase tracking-widest text-muted-foreground font-medium"
        style={{letterSpacing: '0.1em'}}
      >
        {label}
      </Label>
      <div className="relative">
        <Input
          id={id}
          type="number"
          step={step}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="h-11 text-sm bg-background pr-12"
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
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
  const [monthlyContribution, setMonthlyContribution] = useState<string>('1000');
  const [annualRate, setAnnualRate] = useState<string>('10');
  const [investmentYears, setInvestmentYears] = useState<string>('20');
  const [compoundResult, setCompoundResult] = useState<number | null>(null);

  const calculateRetirement = () => {
    const annualExpenses = parseFloat(monthlyExpenses) * 12;
    setRetirementResult(annualExpenses * 25);
  };

  const calculateMonthlyInvestment = () => {
    const income = parseFloat(monthlyIncome);
    const monthlyAmount = income * (parseFloat(savingsPercentage) / 100);
    const goal = parseFloat(investmentGoal);
    const monthlyRate = 0.10 / 12;
    const monthsNeeded =
      Math.log(1 + (goal * monthlyRate) / monthlyAmount) / Math.log(1 + monthlyRate);
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

  return (
    <div className="space-y-8 font-sans">
      {/* Cabeçalho da página */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 bg-primary/10">
              <Calculator className="h-5 w-5 text-primary" />
            </div>
            <h1 className="font-bold text-3xl font-heading tracking-tight text-foreground">
              Planejamento Financeiro
            </h1>
          </div>
          <p className="text-sm ml-12 text-muted-foreground">
            Calculadoras para simular e planejar seu futuro financeiro
          </p>
        </div>

        {/* Badge informativo */}
        <span
          className="text-xs font-medium uppercase tracking-widest px-3 py-1.5 rounded-full hidden sm:inline-flex bg-primary/10 text-primary"
          style={{letterSpacing: '0.1em'}}
        >
          Simulador
        </span>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="retirement" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 p-1 rounded-xl bg-muted/50">
          {[
            {value: 'retirement', label: 'Aposentadoria', icon: <PiggyBank className="h-3.5 w-3.5" />},
            {value: 'investment', label: 'Inv. Mensal', icon: <TrendingUp className="h-3.5 w-3.5" />},
            {value: 'compound', label: 'Juros Compostos', icon: <Calculator className="h-3.5 w-3.5" />},
          ].map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="flex items-center gap-1.5 text-xs font-medium rounded-lg transition-all"
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {/* ── Aposentadoria ──────────────────────────────────────────────── */}
        <TabsContent value="retirement">
          <div className="rounded-2xl p-6 space-y-6 bg-card border shadow-sm">
            {/* Header do card */}
            <div className="flex items-center gap-3 pb-4 border-b">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-primary/10">
                <PiggyBank className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h2 className="font-semibold text-base font-heading text-foreground">
                  Calculadora de Aposentadoria
                </h2>
                <p className="text-xs text-muted-foreground">
                  Descubra quanto acumular baseado na regra dos 25x (4% de retirada anual)
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
              className="w-full h-11 font-semibold text-sm gap-2 bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              Calcular
              <ArrowRight className="h-4 w-4" />
            </Button>

            {retirementResult && (
              <ResultCard>
                <p
                  className="text-xs uppercase tracking-widest mb-2 text-muted-foreground"
                  style={{letterSpacing: '0.1em'}}
                >
                  Patrimônio necessário
                </p>
                <p className="text-2xl font-bold font-heading text-primary">
                  {formatCurrency(retirementResult)}
                </p>
                <p className="text-xs mt-2 text-muted-foreground">
                  Baseado na regra dos 25x — você poderá retirar 4% ao ano sem esgotar o capital
                </p>
              </ResultCard>
            )}
          </div>
        </TabsContent>

        {/* ── Investimento Mensal ─────────────────────────────────────────── */}
        <TabsContent value="investment">
          <div className="rounded-2xl p-6 space-y-6 bg-card border shadow-sm">
            <div className="flex items-center gap-3 pb-4 border-b">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-primary/10">
                <TrendingUp className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h2 className="font-semibold text-base font-heading text-foreground">
                  Calculadora de Investimento Mensal
                </h2>
                <p className="text-xs text-muted-foreground">
                  Descubra quantos anos levará para atingir sua meta (assumindo 10% a.a.)
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
              className="w-full h-11 font-semibold text-sm gap-2 bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              Calcular
              <ArrowRight className="h-4 w-4" />
            </Button>

            {investmentResult && (
              <ResultCard>
                <p
                  className="text-xs uppercase tracking-widest mb-2 text-muted-foreground"
                  style={{letterSpacing: '0.1em'}}
                >
                  Tempo estimado para atingir a meta
                </p>
                <p className="text-2xl font-bold font-heading text-primary">
                  {investmentResult.toFixed(1)} anos
                </p>
                <p className="text-xs mt-2 text-muted-foreground">
                  Investindo {formatCurrency((parseFloat(monthlyIncome) * parseFloat(savingsPercentage)) / 100)} por mês com retorno de 10% a.a.
                </p>
              </ResultCard>
            )}
          </div>
        </TabsContent>

        {/* ── Juros Compostos ─────────────────────────────────────────────── */}
        <TabsContent value="compound">
          <div className="rounded-2xl p-6 space-y-6 bg-card border shadow-sm">
            <div className="flex items-center gap-3 pb-4 border-b">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-primary/10">
                <Calculator className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h2 className="font-semibold text-base font-heading text-foreground">
                  Calculadora de Juros Compostos
                </h2>
                <p className="text-xs text-muted-foreground">
                  Veja como seus investimentos crescerão ao longo do tempo
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
              className="w-full h-11 font-semibold text-sm gap-2 bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              Calcular
              <ArrowRight className="h-4 w-4" />
            </Button>

            {compoundResult && (() => {
              const totalInvested =
                parseFloat(initialAmount) +
                parseFloat(monthlyContribution) * parseInt(investmentYears) * 12;
              const profit = compoundResult - totalInvested;
              return (
                <ResultCard>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <p
                        className="text-xs uppercase tracking-widest mb-1 text-muted-foreground"
                        style={{letterSpacing: '0.1em'}}
                      >
                        Valor final
                      </p>
                      <p className="text-xl font-bold font-heading text-primary">
                        {formatCurrency(compoundResult)}
                      </p>
                    </div>
                    <div>
                      <p
                        className="text-xs uppercase tracking-widest mb-1 text-muted-foreground"
                        style={{letterSpacing: '0.1em'}}
                      >
                        Total investido
                      </p>
                      <p className="text-xl font-bold font-heading text-foreground">
                        {formatCurrency(totalInvested)}
                      </p>
                    </div>
                    <div>
                      <p
                        className="text-xs uppercase tracking-widest mb-1 text-muted-foreground"
                        style={{letterSpacing: '0.1em'}}
                      >
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
      </Tabs>
    </div>
  );
};

export default Planning;