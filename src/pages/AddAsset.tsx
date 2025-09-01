
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { CalendarIcon, Plus, TrendingUp } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function AddAsset() {
  const { toast } = useToast();
  const [date, setDate] = useState<Date>();
  
  const [formData, setFormData] = useState({
    symbol: '',
    name: '',
    type: '',
    quantity: '',
    purchasePrice: '',
    currentPrice: '',
    purchaseDate: '',
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.symbol || !formData.type || !formData.quantity || !formData.purchasePrice) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Ativo adicionado!",
      description: `${formData.symbol} foi adicionado ao seu portfólio com sucesso.`,
    });

    // Reset form
    setFormData({
      symbol: '',
      name: '',
      type: '',
      quantity: '',
      purchasePrice: '',
      currentPrice: '',
      purchaseDate: '',
    });
    setDate(undefined);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Plus className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Adicionar Ativo</h1>
            <p className="text-muted-foreground">
              Adicione um novo ativo ao seu portfólio manualmente
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Formulário principal */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Informações do Ativo</CardTitle>
                <CardDescription>
                  Preencha os dados do ativo que deseja adicionar
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="symbol">Símbolo do Ativo *</Label>
                      <Input
                        id="symbol"
                        placeholder="Ex: PETR4, AAPL, BTC"
                        value={formData.symbol}
                        onChange={(e) => handleInputChange('symbol', e.target.value.toUpperCase())}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="name">Nome do Ativo</Label>
                      <Input
                        id="name"
                        placeholder="Ex: Petrobras PN"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="type">Tipo de Ativo *</Label>
                    <Select value={formData.type} onValueChange={(value) => handleInputChange('type', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo de ativo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="stock">Ação</SelectItem>
                        <SelectItem value="fii">FII</SelectItem>
                        <SelectItem value="crypto">Criptomoeda</SelectItem>
                        <SelectItem value="other">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="quantity">Quantidade *</Label>
                      <Input
                        id="quantity"
                        type="number"
                        placeholder="100"
                        value={formData.quantity}
                        onChange={(e) => handleInputChange('quantity', e.target.value)}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="purchasePrice">Preço de Compra (R$) *</Label>
                      <Input
                        id="purchasePrice"
                        type="number"
                        step="0.01"
                        placeholder="25.50"
                        value={formData.purchasePrice}
                        onChange={(e) => handleInputChange('purchasePrice', e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="currentPrice">Preço Atual (R$)</Label>
                      <Input
                        id="currentPrice"
                        type="number"
                        step="0.01"
                        placeholder="28.75"
                        value={formData.currentPrice}
                        onChange={(e) => handleInputChange('currentPrice', e.target.value)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Data de Compra</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-left font-normal"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {date ? format(date, "dd/MM/yyyy", { locale: ptBR }) : "Selecionar data"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={date}
                            onSelect={setDate}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex justify-end space-x-4">
                    <Button type="button" variant="outline">
                      Cancelar
                    </Button>
                    <Button type="submit">
                      <Plus className="mr-2 h-4 w-4" />
                      Adicionar Ativo
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Informações laterais */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Dicas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-medium">Símbolos de Ações</h4>
                  <p className="text-sm text-muted-foreground">
                    Use sempre o código da ação na B3 (ex: PETR4, VALE3, ITUB4)
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Preço de Compra</h4>
                  <p className="text-sm text-muted-foreground">
                    Inclua taxas de corretagem no preço médio se desejar um cálculo mais preciso
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Data de Compra</h4>
                  <p className="text-sm text-muted-foreground">
                    A data ajuda no cálculo de impostos e análise temporal
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Resumo do Portfólio</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Total de Ativos</span>
                    <span className="font-medium">12</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Valor Total</span>
                    <span className="font-medium">R$ 45.230,50</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Rentabilidade</span>
                    <span className="font-medium text-green-500">+12,5%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
