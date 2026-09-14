import {AxiosError} from 'axios';
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {investmentPolicyService, type InvestmentPolicy} from '@/server/api/api';

export const INVESTMENT_POLICY_KEY = ['investment-policy'] as const;
const VERSIONS_KEY = [...INVESTMENT_POLICY_KEY, 'versions'] as const;

export function useInvestmentPolicy() {
  return useQuery({
    queryKey: INVESTMENT_POLICY_KEY,
    queryFn: async () => (await investmentPolicyService.get()).data,
    staleTime: 5 * 60 * 1000,
  });
}

export function useInvestmentPolicyVersions(enabled: boolean) {
  return useQuery({
    queryKey: VERSIONS_KEY,
    queryFn: async () => (await investmentPolicyService.versions()).data,
    enabled,
  });
}

export function useSaveInvestmentPolicy() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (policy: InvestmentPolicy) => investmentPolicyService.save(policy),
    onSuccess: () => queryClient.invalidateQueries({queryKey: INVESTMENT_POLICY_KEY}),
  });
}

/** Mensagem de validação do server (400) ou `undefined`. */
export function policyErrorMessage(error: unknown): string | undefined {
  if (!(error instanceof AxiosError) || error.response?.status !== 400) return undefined;
  const message = (error.response.data as {message?: string | string[]})?.message;
  return Array.isArray(message) ? message[0] : message;
}
