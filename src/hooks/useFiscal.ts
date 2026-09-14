import {useQuery} from '@tanstack/react-query';
import {brokerSyncService, fiscalService} from '@/server/api/api';
import type {FiscalOptimizerResponse, FiscalSummaryResponse} from '@/services/fiscal/fiscal-summary';

/** `year` indefinido deixa o server escolher o ano da última negociação. */
export function useFiscalSummary(year?: number) {
  return useQuery<FiscalSummaryResponse>({
    queryKey: ['fiscal-summary', year ?? 'latest'],
    queryFn: async () => (await fiscalService.getSummary(year)).data,
  });
}

export function useFiscalOptimizer(year?: number) {
  return useQuery<FiscalOptimizerResponse>({
    queryKey: ['fiscal-optimizer', year ?? 'latest'],
    queryFn: async () => (await fiscalService.getOptimizer(year)).data,
  });
}

export function useBrokerUploads() {
  return useQuery({
    queryKey: ['broker-sync-uploads'],
    queryFn: async () => (await brokerSyncService.getUploads()).data,
    refetchInterval: 5000,
  });
}
