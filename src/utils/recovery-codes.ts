/**
 * Utilitários dos códigos de recuperação.
 *
 * Regra que vale para o arquivo inteiro: os códigos nunca vão para console,
 * URL, query string, localStorage ou qualquer telemetria. Eles só transitam
 * entre a memória do componente, a área de transferência e o arquivo .txt que
 * o próprio usuário pediu.
 */

/**
 * O backend compara ignorando caixa e separadores. A UI não deve exigir o
 * formato `A1B2-C3D4`: só descartamos espaços nas pontas antes de enviar o que
 * a pessoa digitou ou colou.
 */
export function prepareRecoveryCodeForSubmit(input: string): string {
  return input.trim();
}

/** Um código é "preenchido" se sobra algo além de separadores. */
export function hasRecoveryCodeContent(input: string): boolean {
  return input.replace(/[^a-zA-Z0-9]/g, '').length > 0;
}

export function buildRecoveryCodesText(
  codes: string[],
  generatedAt: string,
): string {
  const when = new Date(generatedAt);
  const stamp = Number.isNaN(when.getTime())
    ? generatedAt
    : when.toLocaleString('pt-BR');

  return [
    'Trackerr — códigos de recuperação da autenticação em dois fatores',
    `Gerados em: ${stamp}`,
    '',
    'Cada código funciona UMA única vez.',
    'Guarde este arquivo como você guardaria sua senha.',
    'Gerar novos códigos invalida todos os desta lista.',
    '',
    ...codes,
    '',
  ].join('\n');
}

export function buildRecoveryCodesFilename(generatedAt: string): string {
  const when = new Date(generatedAt);
  const day = Number.isNaN(when.getTime())
    ? 'agora'
    : when.toISOString().slice(0, 10);
  return `trackerr-codigos-recuperacao-${day}.txt`;
}

/**
 * Salva os códigos como .txt via Blob + object URL.
 *
 * Object URL é revogado logo depois do clique: manter a URL viva deixaria o
 * conteúdo dos códigos acessível pela aba enquanto a página existisse.
 */
export function downloadRecoveryCodes(
  codes: string[],
  generatedAt: string,
): void {
  const blob = new Blob([buildRecoveryCodesText(codes, generatedAt)], {
    type: 'text/plain;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);

  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = buildRecoveryCodesFilename(generatedAt);
  anchor.rel = 'noopener';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  // Revogar de forma síncrona pode cancelar o download antes de o navegador
  // ler o Blob. Sai da tarefa atual e só então libera a URL.
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

/** Copia os códigos, um por linha. Lança se a área de transferência falhar. */
export async function copyRecoveryCodes(codes: string[]): Promise<void> {
  await navigator.clipboard.writeText(codes.join('\n'));
}
