import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {portfolioDigestService} from '@/server/api/api';

const DIGEST_PREFERENCE_QUERY_KEY = ['portfolio-digest-preference'];

/**
 * Preferência do resumo semanal de carteira por e-mail (TRA-202).
 *
 * Antes desta tela não havia NENHUM jeito de ligar essa preferência — só o
 * link de descadastro no rodapé do próprio e-mail. `enabled` some do doc do
 * usuário até a primeira vez que alguém mexe no toggle (default `false` no
 * schema); tratamos ausência como `false`, igual ao server.
 */
export function usePortfolioDigestPreference() {
  return useQuery({
    queryKey: DIGEST_PREFERENCE_QUERY_KEY,
    queryFn: async () => {
      const response = await portfolioDigestService.getPreference();
      return Boolean(response.data?.enabled);
    },
  });
}

export function useSavePortfolioDigestPreference() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (enabled: boolean) => portfolioDigestService.updatePreference(enabled),
    onSuccess: (_response, enabled) => {
      queryClient.setQueryData(DIGEST_PREFERENCE_QUERY_KEY, enabled);
    },
  });
}
