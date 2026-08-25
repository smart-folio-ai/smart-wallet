import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {Button} from '@/components/ui/button';
import {
  ArrowRight,
  CheckCircle2,
  FileSpreadsheet,
  Info,
  TrendingUp,
  Wallet,
  XCircle,
} from 'lucide-react';

interface B3ImportGuideModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Abre o seletor de arquivo do relatório consolidado (posições). */
  onImportReport?: () => void;
  /** Leva para a tela de transações, onde entra o extrato de negociação. */
  onGoToTransactions?: () => void;
}

/**
 * A B3 exporta três arquivos diferentes e nenhum deles sozinho preenche a
 * carteira inteira. Sem esta explicação o usuário importa o consolidado,
 * não vê P&L nem proventos distribuídos, e conclui que o produto está
 * quebrado — quando na verdade o arquivo escolhido não contém esses dados.
 */

type FileCard = {
  id: string;
  name: string;
  where: string;
  icon: typeof Wallet;
  fills: string[];
  missing: string[];
};

const FILES: FileCard[] = [
  {
    id: 'consolidado',
    name: 'Relatório consolidado',
    where: 'Extratos › Relatório consolidado',
    icon: Wallet,
    fills: ['Quais ativos você tem hoje', 'Quantidade e valor atual de cada um'],
    missing: [
      'Quanto você pagou (só traz a cotação de fechamento)',
      'Data de cada provento — o arquivo não tem coluna de data',
    ],
  },
  {
    id: 'negociacao',
    name: 'Extrato de negociação',
    where: 'Extratos › Negociação',
    icon: TrendingUp,
    fills: [
      'Cada compra e venda com preço e data',
      'Preço médio, lucro/prejuízo e base para o IR',
    ],
    missing: ['Proventos (dividendos, JCP e rendimentos não aparecem aqui)'],
  },
  {
    id: 'movimentacao',
    name: 'Extrato de movimentação',
    where: 'Extratos › Movimentação',
    icon: FileSpreadsheet,
    fills: [
      'Cada provento com a data real do pagamento',
      'Dividendos, JCP e rendimentos mês a mês',
    ],
    missing: ['Preço de compra dos ativos'],
  },
];

export function B3ImportGuideModal({
  open,
  onOpenChange,
  onImportReport,
  onGoToTransactions,
}: B3ImportGuideModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">
            Como importar seus dados da B3
          </DialogTitle>
          <DialogDescription>
            A B3 separa seus dados em três arquivos. Cada um preenche uma parte
            diferente da carteira — por isso vale importar mais de um.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-3">
            {FILES.map((file) => {
              const Icon = file.icon;
              return (
                <div
                  key={file.id}
                  className="rounded-xl border border-surface-hairline/[0.12] bg-surface-panel/40 p-4">
                  <Icon className="mb-2 h-5 w-5 text-primary" />
                  <p className="font-heading text-sm font-semibold text-on-surface">
                    {file.name}
                  </p>
                  <p className="mt-0.5 text-xs text-on-surface-subtle">
                    {file.where}
                  </p>

                  <ul className="mt-3 space-y-1.5">
                    {file.fills.map((item) => (
                      <li key={item} className="flex gap-1.5 text-xs leading-relaxed">
                        <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-success" />
                        <span className="text-on-surface-muted">{item}</span>
                      </li>
                    ))}
                    {file.missing.map((item) => (
                      <li key={item} className="flex gap-1.5 text-xs leading-relaxed">
                        <XCircle className="mt-0.5 h-3 w-3 shrink-0 text-on-surface-subtle" />
                        <span className="text-on-surface-subtle">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>

          <div className="rounded-xl border border-surface-hairline/[0.12] p-4">
            <p className="font-heading text-sm font-semibold text-on-surface">
              Ordem recomendada
            </p>
            <ol className="mt-3 space-y-2.5">
              {[
                {
                  n: '1',
                  t: 'Relatório consolidado',
                  d: 'Cria seus ativos na carteira. Comece por ele.',
                },
                {
                  n: '2',
                  t: 'Extrato de negociação',
                  d: 'Traz o que você pagou. É o que destrava o lucro/prejuízo.',
                },
                {
                  n: '3',
                  t: 'Extrato de movimentação',
                  d: 'Traz os proventos com data, distribuídos mês a mês.',
                },
              ].map((step) => (
                <li key={step.n} className="flex gap-3">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 font-heading text-[11px] font-bold text-primary">
                    {step.n}
                  </span>
                  <span className="text-xs leading-relaxed">
                    <span className="font-semibold text-on-surface">
                      {step.t}
                    </span>
                    <span className="text-on-surface-muted"> — {step.d}</span>
                  </span>
                </li>
              ))}
            </ol>
          </div>

          <div className="flex gap-2.5 rounded-xl border border-surface-hairline/[0.12] bg-surface-panel/40 p-3.5">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-on-surface-subtle" />
            <div className="space-y-1.5 text-xs leading-relaxed text-on-surface-muted">
              <p>
                <span className="font-semibold text-on-surface">
                  Use os arquivos em Excel (.xlsx) ou CSV.
                </span>{' '}
                O PDF do mesmo extrato não funciona: ele é feito para leitura,
                não traz os dados em colunas.
              </p>
              <p>
                Você não precisa criar uma carteira nova nem apagar a atual —
                importar de novo atualiza o que já está lá.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            {onGoToTransactions && (
              <Button variant="outline" onClick={onGoToTransactions}>
                Importar negociações
              </Button>
            )}
            {onImportReport && (
              <Button onClick={onImportReport}>
                Importar relatório
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default B3ImportGuideModal;
