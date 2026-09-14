import {useReducer} from 'react';
import {toast} from 'sonner';
import {
  aiAnalysisService,
  type FutureSimulatorHorizon,
  type FutureSimulatorResponse,
} from '@/services/ai';
import {stockServices} from '@/server/api/api';
import {accumulateCdi} from '@/pages/cdi-performance.utils';

interface SimulationResult {
  simulation: FutureSimulatorResponse;
  cdiComparison: number | null;
  /** Nível de detalhe com que a projeção foi calculada. */
  detailed: boolean;
}

interface SimulatorState {
  monthlyContribution: number;
  horizon: FutureSimulatorHorizon;
  result: SimulationResult | null;
  isLoading: boolean;
}

type SimulatorAction =
  | {type: 'set-contribution'; value: number}
  | {type: 'set-horizon'; value: FutureSimulatorHorizon}
  | {type: 'start'}
  | {type: 'done'; result: SimulationResult}
  | {type: 'fail'};

const initialState: SimulatorState = {
  monthlyContribution: 1000,
  horizon: '10y',
  result: null,
  isLoading: false,
};

// Trocar um parâmetro invalida o resultado: uma projeção calculada para outro
// aporte ou horizonte não pode continuar visível como se refletisse o atual.
function simulatorReducer(state: SimulatorState, action: SimulatorAction): SimulatorState {
  switch (action.type) {
    case 'set-contribution':
      return {...state, monthlyContribution: action.value, result: null};
    case 'set-horizon':
      return {...state, horizon: action.value, result: null};
    case 'start':
      return {...state, isLoading: true};
    case 'done':
      return {...state, isLoading: false, result: action.result};
    case 'fail':
      return {...state, isLoading: false, result: null};
  }
}

async function fetchCdiComparison(simulation: FutureSimulatorResponse): Promise<number | null> {
  const from = new Date();
  from.setMonth(from.getMonth() - simulation.months);
  const to = new Date();
  try {
    const response = await stockServices.getCdiSeries(
      from.toISOString().slice(0, 10),
      to.toISOString().slice(0, 10),
    );
    const series = response.data?.series;
    if (!Array.isArray(series) || series.length < 2) return null;
    const lastValue = Array.from(accumulateCdi(series).values()).pop();
    return typeof lastValue === 'number'
      ? simulation.currentPortfolioValue * (1 + lastValue / 100)
      : null;
  } catch {
    return null;
  }
}

export function useFutureSimulator(detailed: boolean) {
  const [state, dispatch] = useReducer(simulatorReducer, initialState);

  const simulate = async () => {
    dispatch({type: 'start'});
    try {
      // POST /ai/future-simulator busca a carteira do usuário por conta
      // própria; os cenários são fixos no server e voltam em `assumptions`.
      const simulation = await aiAnalysisService.futureSimulator({
        horizon: state.horizon,
        monthlyContribution: state.monthlyContribution > 0 ? state.monthlyContribution : undefined,
      });
      // CDI é benchmark: entra a partir do intermediário, fora do iniciante.
      const cdiComparison = detailed ? await fetchCdiComparison(simulation) : null;
      dispatch({type: 'done', result: {simulation, cdiComparison, detailed}});
    } catch {
      dispatch({type: 'fail'});
      toast.error('Não foi possível calcular a projeção.');
    }
  };

  return {
    monthlyContribution: state.monthlyContribution,
    horizon: state.horizon,
    isLoading: state.isLoading,
    // Uma projeção calculada para outro nível de detalhe some ao trocar o
    // nível, em vez de continuar na tela como se refletisse o atual.
    result: state.result?.detailed === detailed ? state.result : null,
    setMonthlyContribution: (value: number) => dispatch({type: 'set-contribution', value}),
    setHorizon: (value: FutureSimulatorHorizon) => dispatch({type: 'set-horizon', value}),
    simulate,
  };
}
