
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Share2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { portfolioService } from "@/lib/api";

// Components
import { PortfolioSummaryCards } from "@/components/portfolio/PortfolioSummaryCards";
import { PerformanceChart } from "@/components/portfolio/PerformanceChart";
import { AssetAllocationChart } from "@/components/portfolio/AssetAllocationChart";
import { AssetsList } from "@/components/portfolio/AssetsList";
import { AssetsListHeader } from "@/components/portfolio/AssetsListHeader";
import { AssetDetailModal } from "@/components/portfolio/AssetDetailModal";

// Types and Mock Data
import { Asset, SortConfig } from "@/types/portfolio";
import { mockAssets, performanceData } from "@/utils/mockData";

const Portfolio = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("all");
  const [loading, setLoading] = useState(true);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: "", direction: "asc" });

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
      <PortfolioSummaryCards 
        totalValue={totalValue}
        assets={assets}
        loading={loading}
        totalDividends={totalDividends}
        dividendYield={dividendYield}
      />

      {/* Performance Chart */}
      <PerformanceChart 
        loading={loading}
        activeTab={activeTab}
        assets={assets}
        performanceData={performanceData}
      />

      {/* Asset Allocation Chart */}
      <AssetAllocationChart 
        loading={loading}
        assets={assets}
        assetAllocationData={assetAllocationData}
        openAssetDetails={openAssetDetails}
      />

      {/* Assets List */}
      <Card className="card-gradient">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle>Ativos</CardTitle>
              <CardDescription>Todos os ativos em sua carteira</CardDescription>
            </div>
            <AssetsListHeader 
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              requestSort={requestSort}
            />
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
      <AssetDetailModal 
        selectedAsset={selectedAsset}
        setSelectedAsset={setSelectedAsset}
      />
    </div>
  );
};

export default Portfolio;
