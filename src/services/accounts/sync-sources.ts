import type {BadgeSeverity} from '@/components/shared/badge-style';

export type ExchangeId = 'binance' | 'coinbase' | 'bitso' | 'mercadobitcoin';

export interface BrokerConnection {
  id: string;
  provider: string;
  status: 'connected' | 'disconnected' | 'error';
  lastSync?: string;
  lastError?: string | null;
}

export interface BrokerUpload {
  _id: string;
  provider: string;
  originalName: string;
  status: 'received' | 'queued' | 'processing' | 'processed' | 'failed';
  errorMessage?: string | null;
  createdAt?: string;
}

export interface ExchangeSource {
  id: ExchangeId;
  name: string;
  initials: string;
  kind: string;
  what: string;
  steps: string[];
  security: string;
  needsPassphrase?: boolean;
}

/** Exchanges que o server sincroniza de verdade (ProviderRegistry, via CCXT). */
export const EXCHANGES: ExchangeSource[] = [
  {
    id: 'binance',
    name: 'Binance',
    initials: 'BN',
    kind: 'Exchange cripto · global',
    what: 'Lê saldos e histórico de trades em spot e earn. A chave que você gera não permite saque nem ordem.',
    steps: ['Em Binance → Gerenciamento de API, crie uma nova chave', 'Marque APENAS "Enable Reading" e desmarque saque e trade', 'Cole a API Key e a Secret aqui e salve'],
    security: 'Chave read-only · Secret cifrada com AES-256',
  },
  {
    id: 'coinbase',
    name: 'Coinbase',
    initials: 'CB',
    kind: 'Exchange cripto · global',
    what: 'Lê contas e transações com uma chave de API de visualização, sem permissão para enviar cripto.',
    steps: ['Em Coinbase → Configurações → API, crie uma chave', 'Dê apenas a permissão "view"', 'Cole a chave, o secret e, se houver, a passphrase'],
    security: 'Chave somente visualização · cifrada com AES-256',
    needsPassphrase: true,
  },
  {
    id: 'bitso',
    name: 'Bitso',
    initials: 'BI',
    kind: 'Exchange cripto · LatAm',
    what: 'Traz saldos em cripto e em reais para a sua carteira.',
    steps: ['Em Bitso → Configurações → Chaves de API, gere uma chave', 'Escolha o perfil de permissão "Somente leitura"', 'Cole a chave, o segredo e salve'],
    security: 'Chave read-only · cifrada com AES-256',
  },
  {
    id: 'mercadobitcoin',
    name: 'Mercado Bitcoin',
    initials: 'MB',
    kind: 'Exchange cripto · Brasil',
    what: 'Traz seus saldos em cripto negociados na maior exchange brasileira.',
    steps: ['Em Mercado Bitcoin → Configurações → API, crie uma chave', 'Habilite apenas a leitura de saldos', 'Cole a chave, o segredo e salve'],
    security: 'Chave read-only · cifrada com AES-256',
  },
];

export const exchangeName = (id: string) => EXCHANGES.find((exchange) => exchange.id === id)?.name ?? id;

export function connectionStatus(connection?: BrokerConnection): {label: string; severity: BadgeSeverity | 'neutral'} {
  if (!connection) return {label: 'Disponível', severity: 'neutral'};
  if (connection.status === 'error') return {label: 'Reautenticar', severity: 'warn'};
  if (connection.status === 'connected') return {label: 'Conectada', severity: 'ok'};
  return {label: 'Desconectada', severity: 'neutral'};
}

export function relativeTime(iso: string | undefined, now = Date.now()): string {
  if (!iso) return '—';
  const minutes = Math.round((now - new Date(iso).getTime()) / 60000);
  if (minutes < 1) return 'agora';
  if (minutes < 60) return `há ${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `há ${hours} h`;
  const days = Math.round(hours / 24);
  if (days < 7) return `há ${days} ${days === 1 ? 'dia' : 'dias'}`;
  return new Date(iso).toLocaleDateString('pt-BR', {day: '2-digit', month: 'short'});
}

export interface SyncLogEntry {
  key: string;
  icon: string;
  color: string;
  label: string;
  meta: string;
  at?: string;
}

const UPLOAD_STATUS: Record<BrokerUpload['status'], string> = {
  received: 'recebido',
  queued: 'na fila',
  processing: 'processando',
  processed: 'importado',
  failed: 'falhou',
};

/** Linhas do "Histórico de sincronização": leituras das exchanges e arquivos importados. */
export function buildSyncLog(connections: BrokerConnection[], uploads: BrokerUpload[]): SyncLogEntry[] {
  const fromConnections = connections.map<SyncLogEntry>((connection) => {
    const name = exchangeName(connection.provider);
    if (connection.status === 'error') {
      return {key: `c-${connection.provider}`, icon: 'ph ph-warning-circle', color: 'var(--warn)', label: `${name} · leitura falhou`, meta: connection.lastError ?? 'reautenticação necessária', at: connection.lastSync};
    }
    return {
      key: `c-${connection.provider}`,
      icon: connection.lastSync ? 'ph ph-check-circle' : 'ph ph-info',
      color: connection.lastSync ? 'var(--pos)' : 'var(--color-accent-300)',
      label: connection.lastSync ? `${name} · leitura concluída` : `${name} · conectada`,
      meta: connection.lastSync ? 'saldos atualizados na carteira' : 'aguardando a primeira sincronização',
      at: connection.lastSync,
    };
  });

  const fromUploads = uploads.map<SyncLogEntry>((upload) => ({
    key: `u-${upload._id}`,
    icon: upload.status === 'failed' ? 'ph ph-warning-circle' : upload.status === 'processed' ? 'ph ph-check-circle' : 'ph ph-clock',
    color: upload.status === 'failed' ? 'var(--warn)' : upload.status === 'processed' ? 'var(--pos)' : 'var(--color-accent-300)',
    label: `${upload.provider.toUpperCase()} · ${upload.originalName}`,
    meta: upload.errorMessage ? `falhou · ${upload.errorMessage}` : `arquivo ${UPLOAD_STATUS[upload.status]}`,
    at: upload.createdAt,
  }));

  return [...fromConnections, ...fromUploads].sort((a, b) => (b.at ? new Date(b.at).getTime() : 0) - (a.at ? new Date(a.at).getTime() : 0));
}

const csvCell = (value: string) => {
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return `"${safe.replace(/"/g, '""')}"`;
};

export function syncLogCsv(entries: SyncLogEntry[]): string {
  const header = ['Data', 'Evento', 'Detalhe'].map(csvCell).join(';');
  const rows = entries.map((entry) =>
    [entry.at ? new Date(entry.at).toLocaleString('pt-BR') : '', entry.label, entry.meta].map(csvCell).join(';'),
  );
  // BOM: o Excel em português abre o CSV com acentos certos.
  return String.fromCharCode(0xfeff) + [header, ...rows].join('\n');
}
