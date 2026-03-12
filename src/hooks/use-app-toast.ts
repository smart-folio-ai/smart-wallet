import {toast} from 'sonner';

/**
 * Hook centralizado para toasts da aplicação.
 * Usa as classes de gradiente definidas no index.css:
 * - success → success-gradient (green → emerald)
 * - error   → danger-gradient  (red → rose)
 * - warning → warning-gradient (yellow → amber)
 * - info    → info-gradient    (blue → indigo)
 */
export function useAppToast() {
  const success = (title: string, description?: string) => {
    toast.success(title, {description});
  };

  const error = (title: string, description?: string) => {
    toast.error(title, {description});
  };

  const warning = (title: string, description?: string) => {
    toast.warning(title, {description});
  };

  const info = (title: string, description?: string) => {
    toast.info(title, {description});
  };

  return {success, error, warning, info};
}

export default useAppToast;
