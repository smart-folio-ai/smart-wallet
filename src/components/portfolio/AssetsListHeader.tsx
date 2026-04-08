import {Input} from '@/components/ui/input';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select';
import {Search} from 'lucide-react';
import {Asset} from '@/types/portfolio';

interface AssetsListHeaderProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  requestSort: (key: keyof Asset) => void;
  sectorFilter: string;
  setSectorFilter: (value: string) => void;
  availableSectors: string[];
  recommendationFilter: string;
  setRecommendationFilter: (value: string) => void;
  imbalanceFilter: string;
  setImbalanceFilter: (value: string) => void;
}

export const AssetsListHeader = ({
  searchQuery,
  setSearchQuery,
  requestSort,
  sectorFilter,
  setSectorFilter,
  availableSectors,
  recommendationFilter,
  setRecommendationFilter,
  imbalanceFilter,
  setImbalanceFilter,
}: AssetsListHeaderProps) => {
  return (
    <div className="grid w-full grid-cols-1 gap-2 md:w-auto md:grid-cols-2 xl:grid-cols-5">
      <div className="relative md:col-span-2 xl:col-span-1">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar ativo..."
          className="pl-8"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
        />
      </div>

      <Select value={sectorFilter} onValueChange={setSectorFilter}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Setor" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Setor: Todos</SelectItem>
          {availableSectors.map((sector) => (
            <SelectItem key={sector} value={sector}>
              {sector}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={recommendationFilter} onValueChange={setRecommendationFilter}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Recomendação IA" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">IA: Todas</SelectItem>
          <SelectItem value="buy">Comprar aos poucos</SelectItem>
          <SelectItem value="hold">Manter</SelectItem>
          <SelectItem value="sell">Revisar</SelectItem>
          <SelectItem value="uncovered">Sem cobertura</SelectItem>
        </SelectContent>
      </Select>

      <Select value={imbalanceFilter} onValueChange={setImbalanceFilter}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Desequilíbrio" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Desequilíbrio: Todos</SelectItem>
          <SelectItem value="overallocated">Sobrealocados</SelectItem>
          <SelectItem value="high-risk">Risco alto (24h)</SelectItem>
        </SelectContent>
      </Select>

      <Select defaultValue="value">
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Ordenar por" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="value" onClick={() => requestSort('value')}>
            Maior posição
          </SelectItem>
          <SelectItem value="result" onClick={() => requestSort('profitLossPercentage')}>
            Resultado no período
          </SelectItem>
          <SelectItem value="allocation" onClick={() => requestSort('allocation')}>
            Maior concentração
          </SelectItem>
          <SelectItem value="risk" onClick={() => requestSort('change24h')}>
            Maior risco
          </SelectItem>
          <SelectItem value="dividendYield" onClick={() => requestSort('dividendYield')}>
            Maior dividend yield
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};
