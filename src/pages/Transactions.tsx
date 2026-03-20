import {useMemo, useRef, useState} from 'react';
import {useMutation, useQuery} from '@tanstack/react-query';
import {Button} from '@/components/ui/button';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select';
import {Skeleton} from '@/components/ui/skeleton';
import {useToast} from '@/hooks/use-toast';
import portfolioService from '@/services/portfolio';
import {formatCurrency} from '@/utils/formatters';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {Upload, RefreshCw} from 'lucide-react';

type Transaction = {
  _id: string;
  symbol: string;
  type: 'buy' | 'sell';
  side?: 'buy' | 'sell';
  quantity: number;
  price: number;
  fees?: number;
  total: number;
  date: string;
  provider?: string;
};

export default function Transactions() {
  const {toast} = useToast();
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState<number>(currentYear);
  const [symbol, setSymbol] = useState('');
  const [selectedPortfolio, setSelectedPortfolio] = useState('all');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const {data: portfolios = []} = useQuery({
    queryKey: ['portfolios-for-transactions'],
    queryFn: async () => {
      const data = await portfolioService.getPortfolios();
      return Array.isArray(data) ? data : [];
    },
  });

  const {
    data: transactionsResponse,
    isLoading: loadingTransactions,
    refetch,
  } = useQuery({
    queryKey: ['portfolio-transactions', year, symbol],
    queryFn: async () => {
      const params: Record<string, unknown> = {year};
      if (symbol.trim()) params.symbol = symbol.trim().toUpperCase();
      const response = await portfolioService.getTransactions(params);
      return response?.transactions || [];
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      if (selectedPortfolio === 'all') {
        throw new Error('Selecione uma carteira para importar o extrato.');
      }
      return portfolioService.importB3Transactions(selectedPortfolio, file);
    },
    onSuccess: (result: any) => {
      toast({
        title: 'Extrato importado',
        description: `${result?.tradesImported || 0} transações importadas (${result?.ignoredDuplicates || 0} duplicadas ignoradas).`,
      });
      refetch();
    },
    onError: (error: any) => {
      toast({
        title: 'Erro na importação',
        description:
          error?.message || 'Não foi possível importar o extrato de negociações B3.',
        variant: 'destructive',
      });
    },
  });

  const transactions = useMemo(() => {
    const list = Array.isArray(transactionsResponse) ? transactionsResponse : [];
    return list.slice().sort((a: Transaction, b: Transaction) => {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
  }, [transactionsResponse]);

  const handleUploadFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    uploadMutation.mutate(file);
    event.target.value = '';
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-3xl font-bold">Transações</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <CardTitle>Importar Extrato de Negociações B3</CardTitle>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm">
                  Como exportar na B3?
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Como Exportar O Extrato Na B3</AlertDialogTitle>
                  <AlertDialogDescription className="space-y-2 text-sm">
                    <p>1. Acesse o site da B3: Área do Investidor.</p>
                    <p>2. Faça login com seu CPF e autenticação.</p>
                    <p>3. Vá em Extratos ou Negociação.</p>
                    <p>4. Abra o Extrato de Negociações do período desejado.</p>
                    <p>5. Clique em Exportar e escolha XLSX/CSV.</p>
                    <p>6. Envie esse arquivo aqui em Importar transações.</p>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogAction>Entendi</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <Label>Carteira</Label>
              <Select value={selectedPortfolio} onValueChange={setSelectedPortfolio}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a carteira" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Selecione...</SelectItem>
                  {portfolios.map((portfolio: any) => (
                    <SelectItem key={portfolio._id || portfolio.id} value={portfolio._id || portfolio.id}>
                      {portfolio.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Ano</Label>
              <Input
                type="number"
                value={year}
                onChange={(event) => setYear(Number(event.target.value || currentYear))}
              />
            </div>
            <div>
              <Label>Filtrar por ativo</Label>
              <Input
                placeholder="PETR4"
                value={symbol}
                onChange={(event) => setSymbol(event.target.value)}
              />
            </div>
            <div className="flex items-end">
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={handleUploadFile}
                disabled={uploadMutation.isPending}
              />
              <Button
                className="w-full"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadMutation.isPending}
              >
                <Upload className="h-4 w-4 mr-2" />
                {uploadMutation.isPending ? 'Importando...' : 'Importar transações'}
              </Button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Aceita Extrato de Negociações B3 em XLSX/XLS/CSV. Este fluxo importa apenas
            transações (compra/venda), não posição consolidada.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Histórico de Transações</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingTransactions ? (
            <Skeleton className="h-16 w-full" />
          ) : transactions.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma transação encontrada para os filtros selecionados.</p>
          ) : (
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 pr-2">Data</th>
                    <th className="text-left py-2 pr-2">Ativo</th>
                    <th className="text-left py-2 pr-2">Tipo</th>
                    <th className="text-right py-2 pr-2">Qtd</th>
                    <th className="text-right py-2 pr-2">Preço</th>
                    <th className="text-right py-2 pr-2">Taxas</th>
                    <th className="text-right py-2">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((transaction: Transaction) => (
                    <tr key={transaction._id} className="border-b">
                      <td className="py-2 pr-2">{new Date(transaction.date).toLocaleDateString('pt-BR')}</td>
                      <td className="py-2 pr-2 font-medium">{transaction.symbol}</td>
                      <td className="py-2 pr-2">{(transaction.type || transaction.side) === 'sell' ? 'Venda' : 'Compra'}</td>
                      <td className="py-2 pr-2 text-right">{Number(transaction.quantity || 0).toLocaleString('pt-BR')}</td>
                      <td className="py-2 pr-2 text-right">{formatCurrency(transaction.price || 0)}</td>
                      <td className="py-2 pr-2 text-right">{formatCurrency(transaction.fees || 0)}</td>
                      <td className="py-2 text-right">{formatCurrency(transaction.total || 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
