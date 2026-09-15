import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {
  financialPlanService,
  type FinancialGoalInput,
  type FinancialPlan,
  type FinancialPlanSettings,
} from '@/server/api/api';

const PLAN_KEY = ['financial-plan'] as const;

export function useFinancialPlan() {
  return useQuery({
    queryKey: PLAN_KEY,
    queryFn: async () => (await financialPlanService.get()).data,
  });
}

/** Toda escrita devolve o plano inteiro: grava direto no cache, sem refetch. */
function usePlanMutation<TVariables>(mutationFn: (variables: TVariables) => Promise<{data: FinancialPlan}>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: (response) => queryClient.setQueryData(PLAN_KEY, response.data),
  });
}

export const useUpdatePlanSettings = () =>
  usePlanMutation((settings: FinancialPlanSettings) => financialPlanService.updateSettings(settings));

export const useSaveGoal = () =>
  usePlanMutation(({id, goal}: {id?: string; goal: FinancialGoalInput}) =>
    id ? financialPlanService.updateGoal(id, goal) : financialPlanService.addGoal(goal),
  );

export const useRemoveGoal = () => usePlanMutation((id: string) => financialPlanService.removeGoal(id));

export function apiMessage(error: unknown): string | undefined {
  const message = (error as {response?: {data?: {message?: string | string[]}}})?.response?.data?.message;
  return Array.isArray(message) ? message[0] : message;
}
