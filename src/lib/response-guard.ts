import {AxiosError, type AxiosResponse} from 'axios';

const BINARY_RESPONSE_TYPES = new Set(['blob', 'arraybuffer', 'stream', 'text', 'document']);

/**
 * Página de manutenção, erro de proxy ou URL de API errada devolvem HTML com
 * status 200. Sem esta barreira o HTML chega às telas como se fosse o JSON
 * esperado e elas quebram (TRA-223); como erro, cada tela mostra o próprio
 * estado de falha.
 */
export function rejectHtmlResponse(response: AxiosResponse): AxiosResponse {
  const responseType = response.config?.responseType;
  if (responseType && BINARY_RESPONSE_TYPES.has(responseType)) return response;

  const contentType = String(response.headers?.['content-type'] ?? '').toLowerCase();
  const looksLikeHtml =
    contentType.includes('text/html') ||
    (typeof response.data === 'string' && /^\s*<(!doctype|html)/i.test(response.data));
  if (!looksLikeHtml) return response;

  throw new AxiosError(
    'Resposta inesperada do servidor.',
    AxiosError.ERR_BAD_RESPONSE,
    response.config,
    response.request,
    {...response, status: 502, statusText: 'Bad Gateway'},
  );
}
