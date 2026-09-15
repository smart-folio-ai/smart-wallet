import {createContext, useCallback, useContext, useMemo, useState, type ReactNode} from 'react';
import {useQuery} from '@tanstack/react-query';
import portfolioService from '@/services/portfolio';

/** Valor que representa a carteira consolidada (todas as contas). */
export const ALL_PORTFOLIOS = 'all';
const STORAGE_KEY = 'tkr_selected_portfolio';

type SelectedPortfolioState = {
  selectedId: string;
  setSelectedId: (id: string) => void;
};

const SelectedPortfolioContext = createContext<SelectedPortfolioState | undefined>(undefined);

const readStored = () => {
  try {
    return localStorage.getItem(STORAGE_KEY) || ALL_PORTFOLIOS;
  } catch {
    return ALL_PORTFOLIOS;
  }
};

/**
 * A carteira escolhida no topo vale para todas as telas (Dashboard,
 * Portfólio, Proventos, Transações) e sobrevive ao reload.
 */
export const SelectedPortfolioProvider = ({children}: {children: ReactNode}) => {
  const [selectedId, setState] = useState(readStored);

  const setSelectedId = useCallback((id: string) => {
    setState(id);
    try {
      localStorage.setItem(STORAGE_KEY, id);
    } catch {
      // armazenamento bloqueado: a escolha vale só nesta sessão
    }
  }, []);

  const value = useMemo(() => ({selectedId, setSelectedId}), [selectedId, setSelectedId]);
  return (
    <SelectedPortfolioContext.Provider value={value}>{children}</SelectedPortfolioContext.Provider>
  );
};

export const portfolioIdOf = (portfolio: {id?: string; _id?: string}) =>
  String(portfolio.id || portfolio._id || '');

export function useSelectedPortfolio() {
  const ctx = useContext(SelectedPortfolioContext);
  if (!ctx) throw new Error('useSelectedPortfolio must be used within SelectedPortfolioProvider');

  const {data} = useQuery({
    queryKey: ['portfolios'],
    queryFn: async () => {
      const list = await portfolioService.getPortfolios();
      return Array.isArray(list) ? list : [];
    },
    staleTime: 60_000,
  });
  const portfolios: any[] = Array.isArray(data) ? data : [];

  // Carteira removida (ou de outra conta no mesmo navegador) volta para a
  // consolidada em vez de deixar as telas filtrando por um id que não existe.
  const exists = portfolios.some((p) => portfolioIdOf(p) === ctx.selectedId);
  const selectedId =
    ctx.selectedId === ALL_PORTFOLIOS || !data || exists ? ctx.selectedId : ALL_PORTFOLIOS;
  const selectedPortfolio = portfolios.find((p) => portfolioIdOf(p) === selectedId) ?? null;

  return {
    portfolios,
    selectedId,
    selectedPortfolio,
    isAll: selectedId === ALL_PORTFOLIOS,
    setSelectedId: ctx.setSelectedId,
  };
}
