import {AxiosError} from 'axios';
import {twoFactorService} from '@/server/api/api';
import {
  GeneratedRecoveryCodes,
  RecoveryCodesErrorKind,
  RecoveryCodesStatus,
} from '@/interface/two-factor';
import {establishSession, SessionTokens} from '@/services/authentication/session';

/**
 * Erro de domínio dos códigos de recuperação.
 *
 * Carrega uma `kind` para a UI decidir o que fazer (ex.: mandar refazer login
 * quando o tempToken foi invalidado) e uma mensagem em pt-BR já pronta.
 *
 * IMPORTANTE: nada aqui loga o código digitado nem os códigos gerados.
 */
export class RecoveryCodesError extends Error {
  readonly kind: RecoveryCodesErrorKind;
  readonly description: string;

  constructor(kind: RecoveryCodesErrorKind, title: string, description: string) {
    super(title);
    this.name = 'RecoveryCodesError';
    this.kind = kind;
    this.description = description;
  }
}

type ApiErrorBody = {error?: string; message?: string; code?: string};

function statusOf(error: unknown): number | undefined {
  return error instanceof AxiosError ? error.response?.status : undefined;
}

function isNetworkFailure(error: unknown): boolean {
  return error instanceof AxiosError && !error.response;
}

/**
 * Heurística leve para separar "código de recuperação errado" de "tempToken
 * morto" quando ambos voltam como 401. Só é usada como pista: o fallback
 * continua sendo a mensagem de código inválido.
 */
function mentionsToken(error: unknown): boolean {
  if (!(error instanceof AxiosError)) return false;
  const body = error.response?.data as ApiErrorBody | undefined;
  const text = `${body?.error ?? ''} ${body?.message ?? ''} ${body?.code ?? ''}`;
  return /token|sess|expir|blacklist/i.test(text);
}

const NETWORK_ERROR = () =>
  new RecoveryCodesError(
    'network',
    'Sem conexão com o servidor',
    'Verifique sua internet e tente novamente.',
  );

const UNKNOWN_ERROR = () =>
  new RecoveryCodesError(
    'unknown',
    'Não foi possível concluir',
    'Tente novamente em instantes. Se persistir, fale com o suporte.',
  );

/**
 * O backend permite 5 requisições por minuto nessas rotas. Estourado o limite
 * na rota autenticada, basta esperar — a sessão continua válida.
 */
const GENERATE_RATE_LIMIT = () =>
  new RecoveryCodesError(
    'rate-limited',
    'Muitas tentativas',
    'O limite é de 5 tentativas por minuto. Aguarde um minuto e tente de novo.',
  );

/**
 * Na rota de consumo o estouro do limite é destrutivo: o backend invalida o
 * tempToken, então não adianta esperar — o usuário precisa refazer o login.
 */
const CONSUME_RATE_LIMIT = () =>
  new RecoveryCodesError(
    'rate-limited',
    'Muitas tentativas — faça login novamente',
    'Por segurança, esta sessão de verificação foi encerrada após 5 tentativas em um minuto. Entre com e-mail e senha para recomeçar.',
  );

const SESSION_EXPIRED = () =>
  new RecoveryCodesError(
    'session-expired',
    'Sessão de verificação expirada',
    'Entre com e-mail e senha novamente para receber uma nova verificação.',
  );

export const recoveryCodesService = {
  /**
   * Gera (ou regenera) os códigos. Único ponto em que o texto puro chega ao
   * cliente — o valor retornado deve viver só em memória, na tela de exibição
   * única.
   */
  async generate(totpCode: string): Promise<GeneratedRecoveryCodes> {
    try {
      const response = await twoFactorService.generateRecoveryCodes(totpCode);
      const {codes, generatedAt} = response.data as GeneratedRecoveryCodes;
      return {codes, generatedAt};
    } catch (error) {
      if (isNetworkFailure(error)) throw NETWORK_ERROR();

      const status = statusOf(error);
      if (status === 429) throw GENERATE_RATE_LIMIT();
      if (status === 400 || status === 401 || status === 403) {
        throw new RecoveryCodesError(
          'invalid-totp',
          'Código do autenticador inválido',
          'Confira os 6 dígitos no app — o código muda a cada 30 segundos.',
        );
      }
      throw UNKNOWN_ERROR();
    }
  },

  async getStatus(): Promise<RecoveryCodesStatus> {
    const response = await twoFactorService.recoveryCodesStatus();
    const {total, remaining, generatedAt} = response.data as RecoveryCodesStatus;
    return {total, remaining, generatedAt};
  },

  /**
   * Troca um código de recuperação pela sessão definitiva. Reaproveita
   * `establishSession`, o mesmo ponto usado pelo passo TOTP — não existe um
   * segundo caminho de criação de sessão.
   */
  async consume(tempToken: string, recoveryCode: string): Promise<void> {
    try {
      const response = await twoFactorService.consumeRecoveryCode(
        tempToken,
        recoveryCode,
      );
      establishSession(response.data as SessionTokens);
    } catch (error) {
      if (error instanceof RecoveryCodesError) throw error;
      if (isNetworkFailure(error)) throw NETWORK_ERROR();

      const status = statusOf(error);
      if (status === 429) throw CONSUME_RATE_LIMIT();
      if ((status === 401 || status === 403) && mentionsToken(error)) {
        throw SESSION_EXPIRED();
      }
      if (status === 400 || status === 401 || status === 403 || status === 404) {
        throw new RecoveryCodesError(
          'invalid-recovery-code',
          'Código de recuperação inválido ou já usado',
          'Cada código funciona uma única vez. Tente outro da sua lista.',
        );
      }
      throw UNKNOWN_ERROR();
    }
  },
};

export default recoveryCodesService;
