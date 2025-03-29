
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  AreaChart, 
  Area, 
  BarChart,
  Bar,
  PieChart, 
  Pie, 
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Cell,
  CartesianGrid,
  LineChart,
  Line
} from "recharts";
import { 
  ArrowUpDown, 
  BarChart2, 
  Briefcase, 
  Building, 
  Calendar, 
  ChevronRight, 
  CircleDollarSign, 
  Clock, 
  Coins, 
  DollarSign, 
  Download, 
  Filter, 
  LineChart as LineChartIcon, 
  PieChart as PieChartIcon,
  Search, 
  Share2, 
  Star, 
  TrendingUp, 
  Wallet
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { portfolioService } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

// Interfaces
interface Asset {
  id: string;
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  amount: number;
  value: number;
  allocation: number;
  type: "stock" | "crypto" | "fii" | "other";
  dividendYield?: number;
  lastDividend?: number;
  sector?: string;
  purchasePrice?: number;
  purchaseDate?: string;
  profitLoss?: number;
  profitLossPercentage?: number;
  history?: {
    date: string;
    price: number;
  }[];
  dividendHistory?: {
    date: string;
    value: number;
  }[];
}

interface AssetPerformance {
  period: string;
  value: number;
  change: number;
}

// Mock data
const mockAssets: Asset[] = [
  {
    id: "1",
    symbol: "PETR4",
    name: "Petrobras",
    price: 30.45,
    change24h: 2.3,
    amount: 100,
    value: 3045.00,
    allocation: 12,
    type: "stock",
    dividendYield: 12.5,
    lastDividend: 1.25,
    sector: "Petróleo e Gás",
    purchasePrice: 28.75,
    purchaseDate: "2023-05-15",
    profitLoss: 170.00,
    profitLossPercentage: 5.91,
    history: Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      return {
        date: date.toISOString().slice(0, 10),
        price: 28 + Math.random() * 5,
      };
    }),
    dividendHistory: [
      { date: "2023-11-15", value: 0.75 },
      { date: "2023-08-15", value: 0.65 },
      { date: "2023-05-15", value: 0.70 },
      { date: "2023-02-15", value: 0.60 },
    ]
  },
  {
    id: "2",
    symbol: "VALE3",
    name: "Vale",
    price: 65.70,
    change24h: -1.2,
    amount: 50,
    value: 3285.00,
    allocation: 13,
    type: "stock",
    dividendYield: 8.7,
    lastDividend: 0.85,
    sector: "Mineração",
    purchasePrice: 62.30,
    purchaseDate: "2023-03-10",
    profitLoss: 170.00,
    profitLossPercentage: 5.45,
    history: Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      return {
        date: date.toISOString().slice(0, 10),
        price: 60 + Math.random() * 8,
      };
    }),
    dividendHistory: [
      { date: "2023-11-05", value: 0.95 },
      { date: "2023-08-05", value: 0.90 },
      { date: "2023-05-05", value: 0.85 },
      { date: "2023-02-05", value: 0.80 },
    ]
  },
  {
    id: "3",
    symbol: "BTC",
    name: "Bitcoin",
    price: 225000.00,
    change24h: 4.5,
    amount: 0.025,
    value: 5625.00,
    allocation: 22,
    type: "crypto",
    purchasePrice: 200000.00,
    purchaseDate: "2023-01-15",
    profitLoss: 625.00,
    profitLossPercentage: 12.5,
    history: Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      return {
        date: date.toISOString().slice(0, 10),
        price: 190000 + Math.random() * 40000,
      };
    }),
  },
  {
    id: "4",
    symbol: "HGLG11",
    name: "CSHG Logística",
    price: 160.50,
    change24h: 0.8,
    amount: 30,
    value: 4815.00,
    allocation: 19,
    type: "fii",
    dividendYield: 9.2,
    lastDividend: 1.38,
    sector: "Logística",
    purchasePrice: 155.20,
    purchaseDate: "2023-02-20",
    profitLoss: 159.00,
    profitLossPercentage: 3.41,
    history: Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      return {
        date: date.toISOString().slice(0, 10),
        price: 155 + Math.random() * 10,
      };
    }),
    dividendHistory: [
      { date: "2023-11-20", value: 1.38 },
      { date: "2023-10-20", value: 1.35 },
      { date: "2023-09-20", value: 1.36 },
      { date: "2023-08-20", value: 1.32 },
      { date: "2023-07-20", value: 1.30 },
      { date: "2023-06-20", value: 1.35 },
    ]
  },
  {
    id: "5",
    symbol: "ETH",
    name: "Ethereum",
    price: 12500.00,
    change24h: -2.1,
    amount: 0.2,
    value: 2500.00,
    allocation: 10,
    type: "crypto",
    purchasePrice: 13000.00,
    purchaseDate: "2023-04-10",
    profitLoss: -100.00,
    profitLossPercentage: -4.0,
    history: Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      return {
        date: date.toISOString().slice(0, 10),
        price: 11000 + Math.random() * 3000,
      };
    }),
  },
  {
    id: "6",
    symbol: "KNRI11",
    name: "Kinea Rendimentos",
    price: 95.20,
    change24h: 1.2,
    amount: 25,
    value: 2380.00,
    allocation: 9,
    type: "fii",
    dividendYield: 8.5,
    lastDividend: 0.95,
    sector: "Títulos e Valores Mobiliários",
    purchasePrice: 90.50,
    purchaseDate: "2023-06-05",
    profitLoss: 117.50,
    profitLossPercentage: 5.19,
    history: Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      return {
        date: date.toISOString().slice(0, 10),
        price: 90 + Math.random() * 8,
      };
    }),
    dividendHistory: [
      { date: "2023-11-10", value: 0.95 },
      { date: "2023-10-10", value: 0.93 },
      { date: "2023-09-10", value: 0.94 },
      { date: "2023-08-10", value: 0.91 },
      { date: "2023-07-10", value: 0.90 },
      { date: "2023-06-10", value: 0.92 },
    ]
  },
  {
    id: "7",
    symbol: "ITSA4",
    name: "Itaúsa",
    price: 12.35,
    change24h: 0.5,
    amount: 200,
    value: 2470.00,
    allocation: 10,
    type: "stock",
    dividendYield: 6.8,
    lastDividend: 0.15,
    sector: "Financeiro",
    purchasePrice: 11.90,
    purchaseDate: "2023-07-20",
    profitLoss: 90.00,
    profitLossPercentage: 3.78,
    history: Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      return {
        date: date.toISOString().slice(0, 10),
        price: 11.5 + Math.random() * 1.5,
      };
    }),
    dividendHistory: [
      { date: "2023-11-25", value: 0.15 },
      { date: "2023-08-25", value: 0.14 },
      { date: "2023-05-25", value: 0.13 },
      { date: "2023-02-25", value: 0.12 },
    ]
  },
  {
    id: "8",
    symbol: "XRP",
    name: "Ripple",
    price: 3.25,
    change24h: 3.8,
    amount: 400,
    value: 1300.00,
    allocation: 5,
    type: "crypto",
    purchasePrice: 2.90,
    purchaseDate: "2023-08-15",
    profitLoss: 140.00,
    profitLossPercentage: 12.07,
    history: Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      return {
        date: date.toISOString().slice(0, 10),
        price: 2.8 + Math.random() * 0.8,
      };
    }),
  },
];

const performanceData: Record<string, AssetPerformance[]> = {
  stocks: [
    { period: '1D', value: 8800.00, change: 1.7 },
    { period: '1S', value: 8750.00, change: 1.2 },
    { period: '1M', value: 8500.00, change: -1.5 },
    { period: '3M', value: 8200.00, change: -4.9 },
    { period: '6M', value: 7800.00, change: -9.4 },
    { period: 'YTD', value: 7500.00, change: -13.0 },
    { period: '1A', value: 7200.00, change: -16.8 },
    { period: 'Desde o Início', value: 6500.00, change: 35.4 },
  ],
  fiis: [
    { period: '1D', value: 7195.00, change: 0.9 },
    { period: '1S', value: 7150.00, change: 0.3 },
    { period: '1M', value: 7050.00, change: -1.2 },
    { period: '3M', value: 6950.00, change: -2.6 },
    { period: '6M', value: 6800.00, change: -4.7 },
    { period: 'YTD', value: 6700.00, change: -6.1 },
    { period: '1A', value: 6500.00, change: -9.1 },
    { period: 'Desde o Início', value: 5800.00, change: 24.1 },
  ],
  crypto: [
    { period: '1D', value: 9425.00, change: 2.5 },
    { period: '1S', value: 9000.00, change: -2.4 },
    { period: '1M', value: 8500.00, change: -7.6 },
    { period: '3M', value: 7800.00, change: -15.2 },
    { period: '6M', value: 6900.00, change: -25.0 },
    { period: 'YTD', value: 6200.00, change: -32.7 },
    { period: '1A', value: 5800.00, change: -37.0 },
    { period: 'Desde o Início', value: 4000.00, change: 135.6 },
  ],
};

// Helper function to format currency
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

// Helper function to format percentage
const formatPercentage = (value: number) => {
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
};

const Portfolio = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("all");
  const [loading, setLoading] = useState(true);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState("1M");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Asset | "";
    direction: "asc" | "desc";
  }>({ key: "", direction: "asc" });

  // Filter and sort assets
  const filteredAssets = assets
    .filter((asset) => {
      if (activeTab !== "all" && asset.type !== activeTab) return false;
      if (searchQuery && !asset.symbol.toLowerCase().includes(searchQuery.toLowerCase()) && 
          !asset.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => {
      if (!sortConfig.key) return 0;
      
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];
      
      if (aValue === undefined || bValue === undefined) return 0;
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortConfig.direction === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
      }
      
      return 0;
    });

  // Get total values
  const totalValue = assets.reduce((sum, asset) => sum + asset.value, 0);

  // Calculate totals by type
  const totalsByType = assets.reduce(
    (acc, asset) => {
      acc[asset.type] += asset.value;
      return acc;
    },
    { stock: 0, fii: 0, crypto: 0, other: 0 }
  );

  // Prepare data for charts
  const assetAllocationData = [
    { name: "Ações", value: totalsByType.stock / totalValue * 100, color: "#22c55e" },
    { name: "FIIs", value: totalsByType.fii / totalValue * 100, color: "#8b5cf6" },
    { name: "Criptomoedas", value: totalsByType.crypto / totalValue * 100, color: "#3b82f6" },
    { name: "Outros", value: totalsByType.other / totalValue * 100, color: "#f59e0b" },
  ];

  // Sort function
  const requestSort = (key: keyof Asset) => {
    const direction = 
      sortConfig.key === key && sortConfig.direction === "asc" ? "desc" : "asc";
    setSortConfig({ key, direction });
  };

  // Load data
  useEffect(() => {
    // Simulating API call with mock data
    setTimeout(() => {
      setAssets(mockAssets);
      setLoading(false);
    }, 800);

    // When API is ready:
    // const fetchAssets = async () => {
    //   try {
    //     setLoading(true);
    //     const response = await portfolioService.getAssets();
    //     setAssets(response.data);
    //   } catch (error) {
    //     console.error("Failed to fetch assets", error);
    //     toast({
    //       title: "Erro",
    //       description: "Falha ao carregar os ativos",
    //       variant: "destructive",
    //     });
    //   } finally {
    //     setLoading(false);
    //   }
    // };
    // fetchAssets();
  }, []);

  const openAssetDetails = (asset: Asset) => {
    setSelectedAsset(asset);
  };

  // Calculate additional metrics
  const totalDividends = assets
    .filter(asset => asset.dividendHistory)
    .reduce((sum, asset) => {
      const assetDividends = asset.dividendHistory?.reduce((total, div) => total + div.value, 0) || 0;
      return sum + (assetDividends * asset.amount);
    }, 0);

  const dividendYield = totalValue > 0 
    ? (totalDividends / totalValue) * 100 
    : 0;

  // Get performance data based on active tab
  const getPerformanceData = () => {
    switch (activeTab) {
      case "stock":
        return performanceData.stocks;
      case "fii":
        return performanceData.fiis;
      case "crypto":
        return performanceData.crypto;
      default:
        return performanceData.stocks;
    }
  };

  return (
    <div className="container py-8 animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Portfólio</h1>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Button variant="outline" size="sm">
            <Share2 className="h-4 w-4 mr-2" />
            Compartilhar
          </Button>
        </div>
      </div>

      {/* Portfolio Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="card-gradient">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Valor Total</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-12 animate-pulse bg-muted rounded" />
            ) : (
              <div className="space-y-1">
                <div className="text-3xl font-bold">{formatCurrency(totalValue)}</div>
                <div className="text-sm text-muted-foreground">
                  Ativos: {assets.length}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="card-gradient">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Rentabilidade</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-12 animate-pulse bg-muted rounded" />
            ) : (
              <div className="space-y-1">
                <div className="flex items-center">
                  <div className={`text-3xl font-bold ${assets.reduce((sum, asset) => sum + (asset.profitLoss || 0), 0) >= 0 ? 'text-success' : 'text-destructive'}`}>
                    {formatCurrency(assets.reduce((sum, asset) => sum + (asset.profitLoss || 0), 0))}
                  </div>
                  <Badge className={`ml-2 ${assets.reduce((sum, asset) => sum + (asset.profitLossPercentage || 0), 0) / assets.length >= 0 ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}>
                    {formatPercentage(assets.reduce((sum, asset) => sum + (asset.profitLossPercentage || 0), 0) / assets.length)}
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground">
                  Total acumulado
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="card-gradient">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Dividendos</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-12 animate-pulse bg-muted rounded" />
            ) : (
              <div className="space-y-1">
                <div className="text-3xl font-bold text-success">
                  {formatCurrency(totalDividends)}
                </div>
                <div className="text-sm text-muted-foreground">
                  Yield médio: {dividendYield.toFixed(2)}%
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Performance Card */}
      <Card className="mb-8 card-gradient">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Desempenho</CardTitle>
              <CardDescription>Evolução do valor por período</CardDescription>
            </div>
            <div className="flex space-x-1">
              {["1D", "1S", "1M", "3M", "6M", "YTD", "1A", "MAX"].map((period) => (
                <Button 
                  key={period} 
                  variant={selectedPeriod === period ? "default" : "outline"} 
                  size="sm"
                  onClick={() => setSelectedPeriod(period)}
                  className="text-xs h-8"
                >
                  {period}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="h-72 animate-pulse bg-muted rounded" />
          ) : (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={getPerformanceData().flatMap(data => 
                    data.period === selectedPeriod ? 
                    assets
                      .filter(asset => activeTab === "all" || asset.type === activeTab)
                      .flatMap(asset => asset.history || [])
                      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()) : 
                    []
                  )}
                  margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
                >
                  <defs>
                    <linearGradient id="colorPerformance" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => {
                      const date = new Date(value);
                      return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
                    }}
                  />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => formatCurrency(value)}
                    domain={['auto', 'auto']}
                  />
                  <Tooltip
                    formatter={(value) => [formatCurrency(Number(value)), "Valor"]}
                    labelFormatter={(label) => new Date(label).toLocaleDateString('pt-BR')}
                  />
                  <Area
                    type="monotone"
                    dataKey="price"
                    stroke="#22c55e"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorPerformance)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Asset Allocation Card */}
      <Card className="mb-8 card-gradient">
        <CardHeader>
          <CardTitle>Alocação de Ativos</CardTitle>
          <CardDescription>Distribuição por tipo de ativo</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="h-64 animate-pulse bg-muted rounded" />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={assetAllocationData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      dataKey="value"
                      nameKey="name"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {assetAllocationData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value) => [`${Number(value).toFixed(2)}%`, "Alocação"]}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Principais Ativos</h3>
                {assets.sort((a, b) => b.value - a.value).slice(0, 5).map((asset) => (
                  <div 
                    key={asset.id} 
                    className="flex items-center justify-between bg-background/50 p-3 rounded-lg hover:bg-background/80 cursor-pointer" 
                    onClick={() => openAssetDetails(asset)}
                  >
                    <div className="flex items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                        asset.type === 'stock' ? 'bg-success/20' : 
                        asset.type === 'fii' ? 'bg-purple-500/20' : 
                        'bg-blue-500/20'
                      }`}>
                        {asset.type === 'stock' ? (
                          <TrendingUp className="h-4 w-4 text-success" />
                        ) : asset.type === 'fii' ? (
                          <Building className="h-4 w-4 text-purple-500" />
                        ) : (
                          <Coins className="h-4 w-4 text-blue-500" />
                        )}
                      </div>
                      <div>
                        <div className="font-medium">{asset.symbol}</div>
                        <div className="text-xs text-muted-foreground">{asset.name}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{formatCurrency(asset.value)}</div>
                      <div className={`text-xs ${asset.change24h >= 0 ? 'text-success' : 'text-destructive'}`}>
                        {formatPercentage(asset.change24h)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Assets List */}
      <Card className="card-gradient">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle>Ativos</CardTitle>
              <CardDescription>Todos os ativos em sua carteira</CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar ativo..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select defaultValue="value">
                <SelectTrigger className="w-full sm:w-44">
                  <SelectValue placeholder="Ordenar por" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="value" onClick={() => requestSort('value')}>Valor</SelectItem>
                  <SelectItem value="change" onClick={() => requestSort('change24h')}>Variação</SelectItem>
                  <SelectItem value="allocation" onClick={() => requestSort('allocation')}>Alocação</SelectItem>
                  {activeTab !== "crypto" && (
                    <SelectItem value="dividendYield" onClick={() => requestSort('dividendYield')}>Dividend Yield</SelectItem>
                  )}
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <Tabs defaultValue="all" className="w-full" onValueChange={setActiveTab} value={activeTab}>
            <TabsList className="w-full md:w-fit">
              <TabsTrigger value="all" className="flex-1 md:flex-none">Todos</TabsTrigger>
              <TabsTrigger value="stock" className="flex-1 md:flex-none">Ações</TabsTrigger>
              <TabsTrigger value="fii" className="flex-1 md:flex-none">FIIs</TabsTrigger>
              <TabsTrigger value="crypto" className="flex-1 md:flex-none">Cripto</TabsTrigger>
            </TabsList>

            <TabsContent value="all">
              <AssetsList 
                assets={filteredAssets} 
                loading={loading} 
                onAssetClick={openAssetDetails} 
                requestSort={requestSort}
                sortConfig={sortConfig}
              />
            </TabsContent>

            <TabsContent value="stock">
              <AssetsList 
                assets={filteredAssets} 
                loading={loading} 
                onAssetClick={openAssetDetails} 
                requestSort={requestSort}
                sortConfig={sortConfig}
              />
            </TabsContent>

            <TabsContent value="fii">
              <AssetsList 
                assets={filteredAssets} 
                loading={loading} 
                onAssetClick={openAssetDetails} 
                requestSort={requestSort}
                sortConfig={sortConfig}
              />
            </TabsContent>

            <TabsContent value="crypto">
              <AssetsList 
                assets={filteredAssets} 
                loading={loading} 
                onAssetClick={openAssetDetails} 
                requestSort={requestSort}
                sortConfig={sortConfig}
              />
            </TabsContent>
          </Tabs>
        </CardHeader>
      </Card>

      {/* Asset Detail Modal */}
      {selectedAsset && (
        <div className="fixed inset-0 bg-background/80 z-50 flex justify-center items-center p-4">
          <div className="bg-card rounded-lg shadow-lg max-w-3xl w-full max-h-[90vh] overflow-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold flex items-center">
                    {selectedAsset.symbol}
                    <Badge className="ml-2">
                      {selectedAsset.type === 'stock' ? 'Ação' : 
                       selectedAsset.type === 'fii' ? 'FII' : 
                       selectedAsset.type === 'crypto' ? 'Cripto' : 'Outro'}
                    </Badge>
                  </h2>
                  <p className="text-muted-foreground">{selectedAsset.name}</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setSelectedAsset(null)}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Preço Atual</span>
                      <span className="font-medium">{formatCurrency(selectedAsset.price)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Quantidade</span>
                      <span className="font-medium">{selectedAsset.amount}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Valor Total</span>
                      <span className="font-medium">{formatCurrency(selectedAsset.value)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Alocação</span>
                      <span className="font-medium">{selectedAsset.allocation}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Variação 24h</span>
                      <span className={`font-medium ${selectedAsset.change24h >= 0 ? 'text-success' : 'text-destructive'}`}>
                        {formatPercentage(selectedAsset.change24h)}
                      </span>
                    </div>
                  </div>
                </div>
                <div>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Preço de Compra</span>
                      <span className="font-medium">{formatCurrency(selectedAsset.purchasePrice || 0)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Data de Compra</span>
                      <span className="font-medium">
                        {selectedAsset.purchaseDate ? new Date(selectedAsset.purchaseDate).toLocaleDateString('pt-BR') : '-'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Lucro/Prejuízo</span>
                      <span className={`font-medium ${(selectedAsset.profitLoss || 0) >= 0 ? 'text-success' : 'text-destructive'}`}>
                        {formatCurrency(selectedAsset.profitLoss || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Variação (%)</span>
                      <span className={`font-medium ${(selectedAsset.profitLossPercentage || 0) >= 0 ? 'text-success' : 'text-destructive'}`}>
                        {formatPercentage(selectedAsset.profitLossPercentage || 0)}
                      </span>
                    </div>
                    {(selectedAsset.type === 'stock' || selectedAsset.type === 'fii') && (
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Dividend Yield</span>
                        <span className="font-medium text-success">{selectedAsset.dividendYield}%</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-medium mb-4">Histórico de Preço</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={selectedAsset.history}
                      margin={{ top: 5, right: 5, left: 5, bottom: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value) => {
                          const date = new Date(value);
                          return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
                        }}
                      />
                      <YAxis 
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value) => formatCurrency(value)}
                      />
                      <Tooltip 
                        formatter={(value) => [formatCurrency(Number(value)), "Preço"]}
                        labelFormatter={(label) => new Date(label).toLocaleDateString('pt-BR')}
                      />
                      <Line
                        type="monotone"
                        dataKey="price"
                        stroke="#22c55e"
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 8 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {(selectedAsset.type === 'stock' || selectedAsset.type === 'fii') && selectedAsset.dividendHistory && (
                <div>
                  <h3 className="text-lg font-medium mb-4">Histórico de Dividendos</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead className="text-right">Valor por Ação</TableHead>
                        <TableHead className="text-right">Valor Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedAsset.dividendHistory.map((dividend) => (
                        <TableRow key={dividend.date}>
                          <TableCell>{new Date(dividend.date).toLocaleDateString('pt-BR')}</TableCell>
                          <TableCell className="text-right">{formatCurrency(dividend.value)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(dividend.value * selectedAsset.amount)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              <div className="mt-6 flex justify-end">
                <Button variant="outline" className="mr-2" onClick={() => setSelectedAsset(null)}>
                  Fechar
                </Button>
                <Button>
                  <ChevronRight className="h-4 w-4 mr-2" />
                  Ver Detalhes Completos
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface AssetsListProps {
  assets: Asset[];
  loading: boolean;
  onAssetClick: (asset: Asset) => void;
  requestSort: (key: keyof Asset) => void;
  sortConfig: {
    key: keyof Asset | "";
    direction: "asc" | "desc";
  };
}

const AssetsList = ({ assets, loading, onAssetClick, requestSort, sortConfig }: AssetsListProps) => {
  const getSortIcon = (field: keyof Asset) => {
    if (sortConfig.key !== field) return <ArrowUpDown className="h-4 w-4" />;
    return sortConfig.direction === 'asc' ? (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="m18 15-6-6-6 6"/></svg>
    ) : (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="m6 9 6 6 6-6"/></svg>
    );
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12"></TableHead>
            <TableHead>Ativo</TableHead>
            <TableHead 
              className="cursor-pointer hover:text-primary"
              onClick={() => requestSort('price')}
            >
              <div className="flex items-center">
                Preço {getSortIcon('price')}
              </div>
            </TableHead>
            <TableHead 
              className="cursor-pointer hover:text-primary"
              onClick={() => requestSort('change24h')}
            >
              <div className="flex items-center">
                Variação 24h {getSortIcon('change24h')}
              </div>
            </TableHead>
            <TableHead 
              className="cursor-pointer hover:text-primary"
              onClick={() => requestSort('amount')}
            >
              <div className="flex items-center">
                Quantidade {getSortIcon('amount')}
              </div>
            </TableHead>
            <TableHead 
              className="cursor-pointer hover:text-primary text-right"
              onClick={() => requestSort('value')}
            >
              <div className="flex items-center justify-end">
                Valor {getSortIcon('value')}
              </div>
            </TableHead>
            <TableHead 
              className="cursor-pointer hover:text-primary text-right"
              onClick={() => requestSort('allocation')}
            >
              <div className="flex items-center justify-end">
                Alocação {getSortIcon('allocation')}
              </div>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell colSpan={7}>
                  <div className="h-10 animate-pulse bg-muted rounded" />
                </TableCell>
              </TableRow>
            ))
          ) : assets.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
                Nenhum ativo encontrado
              </TableCell>
            </TableRow>
          ) : (
            assets.map((asset) => (
              <TableRow 
                key={asset.id}
                className="cursor-pointer hover:bg-accent/50"
                onClick={() => onAssetClick(asset)}
              >
                <TableCell>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    asset.type === 'stock' ? 'bg-success/20' : 
                    asset.type === 'fii' ? 'bg-purple-500/20' : 
                    'bg-blue-500/20'
                  }`}>
                    {asset.type === 'stock' ? (
                      <TrendingUp className="h-4 w-4 text-success" />
                    ) : asset.type === 'fii' ? (
                      <Building className="h-4 w-4 text-purple-500" />
                    ) : (
                      <Coins className="h-4 w-4 text-blue-500" />
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="font-medium">{asset.symbol}</div>
                  <div className="text-xs text-muted-foreground">{asset.name}</div>
                </TableCell>
                <TableCell>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(asset.price)}</TableCell>
                <TableCell>
                  <div className={`flex items-center ${asset.change24h >= 0 ? 'text-success' : 'text-destructive'}`}>
                    {asset.change24h >= 0 ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 mr-1"><path d="m18 15-6-6-6 6"/></svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 mr-1"><path d="m6 9 6 6 6-6"/></svg>
                    )}
                    {Math.abs(asset.change24h).toFixed(2)}%
                  </div>
                </TableCell>
                <TableCell>{asset.amount}</TableCell>
                <TableCell className="text-right">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(asset.value)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end">
                    <span className="mr-2">{asset.allocation}%</span>
                    <div className="w-16">
                      <Progress value={asset.allocation} className="h-2" />
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default Portfolio;
