import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {recoveryCodesService} from '@/services/two-factor/recovery-codes';
import {GeneratedRecoveryCodes, RecoveryCodesStatus} from '@/interface/two-factor';

export const RECOVERY_CODES_STATUS_KEY = [
  'two-factor',
  'recovery-codes',
  'status',
] as const;

/**
 * Limiar de aviso de "poucos códigos restantes".
 *
 * O backend emite 10 códigos de uso único. Avisamos em 3 porque o evento que
 * consome código — perder o celular — costuma queimar um na hora: em 3 a
 * pessoa gasta um e ainda fica com dois de reserva, margem suficiente para
 * regenerar com calma enquanto o autenticador ainda funciona (única saída sem
 * suporte). Em 5 (metade da lista) o aviso apareceria em uso rotineiro e
 * viraria ruído; em 1 já seria tarde para dar qualquer opção.
 */
export const LOW_RECOVERY_CODES_THRESHOLD = 3;

export function isRunningLowOnRecoveryCodes(
  status: Pick<RecoveryCodesStatus, 'remaining' | 'generatedAt'> | undefined,
): boolean {
  if (!status || status.generatedAt === null) return false;
  return status.remaining <= LOW_RECOVERY_CODES_THRESHOLD;
}

/** Status dos códigos. Nunca traz o texto dos códigos — só a contagem. */
export function useRecoveryCodesStatus(enabled = true) {
  return useQuery<RecoveryCodesStatus>({
    queryKey: RECOVERY_CODES_STATUS_KEY,
    queryFn: () => recoveryCodesService.getStatus(),
    enabled,
    staleTime: 30_000,
    retry: false,
  });
}

/**
 * Geração/regeneração. O resultado contém os códigos em texto puro e por isso
 * fica só no estado da mutation (memória) — nunca é gravado no cache de
 * queries, que é compartilhado e sobrevive à tela.
 */
export function useGenerateRecoveryCodes() {
  const queryClient = useQueryClient();

  return useMutation<GeneratedRecoveryCodes, Error, string>({
    mutationFn: (totpCode: string) => recoveryCodesService.generate(totpCode),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: RECOVERY_CODES_STATUS_KEY});
    },
  });
}
