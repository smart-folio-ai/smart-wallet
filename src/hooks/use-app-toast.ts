import {useCallback, useMemo} from 'react';
import {toast} from 'sonner';

/**
 * Hook centralizado para toasts da aplicação.
 * Usa as classes de gradiente definidas no index.css:
 * - success → success-gradient (green → emerald)
 * - error   → danger-gradient  (red → rose)
 * - warning → warning-gradient (yellow → amber)
 * - info    → info-gradient    (blue → indigo)
 *
 * As 4 funções são memoizadas (useCallback, sem deps — `toast` do sonner é
 * estável) porque este hook é usado por vários componentes dentro de
 * useCallback/useEffect deps (ex.: GoogleLoginButton). Sem memoização, cada
 * chamada a useAppToast() devolvia funções NOVAS a cada render, o que
 * invalidava esses deps a cada render e reexecutava efeitos que deveriam
 * rodar só quando o dado real mudasse.
 */
export function useAppToast() {
  const success = useCallback((title: string, description?: string) => {
    toast.success(title, {description});
  }, []);

  const error = useCallback((title: string, description?: string) => {
    toast.error(title, {description});
  }, []);

  const warning = useCallback((title: string, description?: string) => {
    toast.warning(title, {description});
  }, []);

  const info = useCallback((title: string, description?: string) => {
    toast.info(title, {description});
  }, []);

  return useMemo(
    () => ({success, error, warning, info}),
    [success, error, warning, info],
  );
}

export default useAppToast;
