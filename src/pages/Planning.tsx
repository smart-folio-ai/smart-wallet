import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatCurrency } from '@/utils/formatters';
import { Calculator, PiggyBank, TrendingUp } from 'lucide-react';

const Planning = () => {
  // Estados para calculadora de aposentadoria
  const [retirementAge, setRetirementAge] = useState<string>('65');
  const [currentAge, setCurrentAge] = useState<string>('30');
  const [monthlyExpenses, setMonthlyExpenses] = useState<string>('5000');
  const [retirementResult, setRetirementResult] = useState<number | null>(null);

  // Estados para calculadora de investimento mensal
  const [monthlyIncome, setMonthlyIncome] = useState<string>('10000');
  const [savingsPercentage, setSavingsPercentage] = useState<string>('20');
  const [investmentGoal, setInvestmentGoal] = useState<string>('1000000');
  const [investmentResult, setInvestmentResult] = useState<number | null>(null);

  // Estados para calculadora de juros compostos
  const [initialAmount, setInitialAmount] = useState<string>('10000');
  const [monthlyContribution, setMonthlyContribution] = useState<string>('1000');
  const [annualRate, setAnnualRate] = useState<string>('10');
  const [investmentYears, setInvestmentYears] = useState<string>('20');
  const [compoundResult, setCompoundResult] = useState<number | null>(null);

  const calculateRetirement = () => {
    const yearsToRetirement = parseInt(retirementAge) - parseInt(currentAge);
    const monthlyExpensesValue = parseFloat(monthlyExpenses);
    const annualExpenses = monthlyExpensesValue * 12;
    // Regra dos 25x (4% de retirada anual)
    const neededAmount = annualExpenses * 25;
    setRetirementResult(neededAmount);
  };

  const calculateMonthlyInvestment = () => {
    const income = parseFloat(monthlyIncome);
    const percentage = parseFloat(savingsPercentage) / 100;
    const goal = parseFloat(investmentGoal);
    const monthlyAmount = income * percentage;
    
    // Assumindo 10% de retorno anual
    const monthlyRate = 0.10 / 12;
    const monthsNeeded = Math.log(1 + (goal * monthlyRate) / monthlyAmount) / Math.log(1 + monthlyRate);
    const yearsNeeded = monthsNeeded / 12;
    
    setInvestmentResult(yearsNeeded);
  };

  const calculateCompoundInterest = () => {
    const initial = parseFloat(initialAmount);
    const monthly = parseFloat(monthlyContribution);
    const rate = parseFloat(annualRate) / 100 / 12;
    const months = parseInt(investmentYears) * 12;

    // Fórmula de juros compostos com contribuições mensais
    const finalAmount = initial * Math.pow(1 + rate, months) + 
                       monthly * ((Math.pow(1 + rate, months) - 1) / rate);
    
    setCompoundResult(finalAmount);
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center space-x-2">
        <Calculator className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Planejamento Financeiro</h1>
          <p className="text-muted-foreground">
            Calculadoras para planejar seu futuro financeiro
          </p>
        </div>
      </div>

      <Tabs defaultValue="retirement" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="retirement">Aposentadoria</TabsTrigger>
          <TabsTrigger value="investment">Investimento Mensal</TabsTrigger>
          <TabsTrigger value="compound">Juros Compostos</TabsTrigger>
        </TabsList>

        <TabsContent value="retirement">
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <PiggyBank className="h-5 w-5 text-primary" />
                <CardTitle>Calculadora de Aposentadoria</CardTitle>
              </div>
              <CardDescription>
                Calcule quanto você precisa acumular para se aposentar
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="currentAge">Idade atual</Label>
                  <Input
                    id="currentAge"
                    type="number"
                    value={currentAge}
                    onChange={(e) => setCurrentAge(e.target.value)}
                    placeholder="30"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="retirementAge">Idade para aposentadoria</Label>
                  <Input
                    id="retirementAge"
                    type="number"
                    value={retirementAge}
                    onChange={(e) => setRetirementAge(e.target.value)}
                    placeholder="65"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="monthlyExpenses">Gastos mensais desejados</Label>
                  <Input
                    id="monthlyExpenses"
                    type="number"
                    value={monthlyExpenses}
                    onChange={(e) => setMonthlyExpenses(e.target.value)}
                    placeholder="5000"
                  />
                </div>
              </div>
              <Button onClick={calculateRetirement} className="w-full">
                Calcular
              </Button>
              {retirementResult && (
                <div className="p-4 bg-primary/10 rounded-lg">
                  <p className="text-lg font-semibold">
                    Você precisará acumular: {formatCurrency(retirementResult)}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Baseado na regra dos 25x (4% de retirada anual)
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="investment">
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                <CardTitle>Calculadora de Investimento Mensal</CardTitle>
              </div>
              <CardDescription>
                Descubra quanto tempo levará para atingir sua meta baseado na sua renda
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="monthlyIncome">Renda mensal</Label>
                  <Input
                    id="monthlyIncome"
                    type="number"
                    value={monthlyIncome}
                    onChange={(e) => setMonthlyIncome(e.target.value)}
                    placeholder="10000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="savingsPercentage">% da renda para investir</Label>
                  <Input
                    id="savingsPercentage"
                    type="number"
                    value={savingsPercentage}
                    onChange={(e) => setSavingsPercentage(e.target.value)}
                    placeholder="20"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="investmentGoal">Meta de investimento</Label>
                  <Input
                    id="investmentGoal"
                    type="number"
                    value={investmentGoal}
                    onChange={(e) => setInvestmentGoal(e.target.value)}
                    placeholder="1000000"
                  />
                </div>
              </div>
              <Button onClick={calculateMonthlyInvestment} className="w-full">
                Calcular
              </Button>
              {investmentResult && (
                <div className="p-4 bg-primary/10 rounded-lg">
                  <p className="text-lg font-semibold">
                    Tempo para atingir a meta: {investmentResult.toFixed(1)} anos
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Investindo {formatCurrency(parseFloat(monthlyIncome) * parseFloat(savingsPercentage) / 100)} por mês
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compound">
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Calculator className="h-5 w-5 text-primary" />
                <CardTitle>Calculadora de Juros Compostos</CardTitle>
              </div>
              <CardDescription>
                Veja como seus investimentos crescerão ao longo do tempo
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="initialAmount">Valor inicial</Label>
                  <Input
                    id="initialAmount"
                    type="number"
                    value={initialAmount}
                    onChange={(e) => setInitialAmount(e.target.value)}
                    placeholder="10000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="monthlyContribution">Contribuição mensal</Label>
                  <Input
                    id="monthlyContribution"
                    type="number"
                    value={monthlyContribution}
                    onChange={(e) => setMonthlyContribution(e.target.value)}
                    placeholder="1000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="annualRate">Taxa de juros anual (%)</Label>
                  <Input
                    id="annualRate"
                    type="number"
                    step="0.1"
                    value={annualRate}
                    onChange={(e) => setAnnualRate(e.target.value)}
                    placeholder="10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="investmentYears">Período (anos)</Label>
                  <Input
                    id="investmentYears"
                    type="number"
                    value={investmentYears}
                    onChange={(e) => setInvestmentYears(e.target.value)}
                    placeholder="20"
                  />
                </div>
              </div>
              <Button onClick={calculateCompoundInterest} className="w-full">
                Calcular
              </Button>
              {compoundResult && (
                <div className="p-4 bg-primary/10 rounded-lg">
                  <p className="text-lg font-semibold">
                    Valor final: {formatCurrency(compoundResult)}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Total investido: {formatCurrency(parseFloat(initialAmount) + (parseFloat(monthlyContribution) * parseInt(investmentYears) * 12))}
                  </p>
                  <p className="text-sm text-success font-medium">
                    Lucro: {formatCurrency(compoundResult - (parseFloat(initialAmount) + (parseFloat(monthlyContribution) * parseInt(investmentYears) * 12)))}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Planning;