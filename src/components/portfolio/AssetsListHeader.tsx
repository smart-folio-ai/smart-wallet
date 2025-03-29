
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Filter, Search } from "lucide-react";
import { Asset } from "@/types/portfolio";

interface AssetsListHeaderProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  requestSort: (key: keyof Asset) => void;
}

export const AssetsListHeader = ({ searchQuery, setSearchQuery, requestSort }: AssetsListHeaderProps) => {
  return (
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
          <SelectItem value="avgPrice" onClick={() => requestSort('avgPrice')}>Preço Médio</SelectItem>
          <SelectItem value="aiRecommendation" onClick={() => requestSort('aiRecommendation')}>Recomendação IA</SelectItem>
          <SelectItem value="dividendYield" onClick={() => requestSort('dividendYield')}>Dividend Yield</SelectItem>
        </SelectContent>
      </Select>
      <Button variant="outline" size="icon">
        <Filter className="h-4 w-4" />
      </Button>
    </div>
  );
};
