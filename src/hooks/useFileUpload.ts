import {useState, useCallback} from 'react';
import {useAppToast} from '@/hooks/use-app-toast';

interface UseFileUploadOptions {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

interface UseFileUploadReturn {
  isUploading: boolean;
  progress: number;
  error: string | null;
  uploadFile: (file: File, endpoint: string, formData?: Record<string, string>) => Promise<void>;
  reset: () => void;
}

export const useFileUpload = (options?: UseFileUploadOptions): UseFileUploadReturn => {
  // useAppToast expõe {success, error, warning, info} — renomeados porque o
  // hook já tem um estado `error` próprio.
  const {success: showSuccess, error: showError} = useAppToast();
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setIsUploading(false);
    setProgress(0);
    setError(null);
  }, []);

  const uploadFile = useCallback(
    async (file: File, endpoint: string, additionalData?: Record<string, string>) => {
      setIsUploading(true);
      setProgress(0);
      setError(null);

      try {
        const formData = new FormData();
        formData.append('file', file);

        if (additionalData) {
          Object.entries(additionalData).forEach(([key, value]) => {
            formData.append(key, value);
          });
        }

        const token = localStorage.getItem('access_token');
        const xhr = new XMLHttpRequest();

        await new Promise<void>((resolve, reject) => {
          xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable) {
              setProgress(Math.round((e.loaded / e.total) * 100));
            }
          });

          xhr.addEventListener('load', () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve();
            } else {
              reject(new Error(`Upload failed: ${xhr.statusText}`));
            }
          });

          xhr.addEventListener('error', () => {
            reject(new Error('Upload failed'));
          });

          xhr.open('POST', endpoint);
          xhr.setRequestHeader('Authorization', `Bearer ${token}`);
          xhr.send(formData);
        });

        showSuccess('Upload concluído', 'Arquivo enviado com sucesso.');
        options?.onSuccess?.();
      } catch (err: any) {
        const errorMessage = err.message || 'Erro ao enviar arquivo';
        setError(errorMessage);
        showError('Erro no upload', errorMessage);
        options?.onError?.(errorMessage);
      } finally {
        setIsUploading(false);
      }
    },
    [showSuccess, showError, options]
  );

  return {isUploading, progress, error, uploadFile, reset};
};
