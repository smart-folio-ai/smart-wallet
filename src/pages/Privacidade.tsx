import {LegalDocLayout, LegalSection} from '@/components/legal/LegalDocLayout';

const sections: LegalSection[] = [
  {
    id: 'coleta',
    title: '1. Dados que coletamos',
    paragraphs: [
      'Coletamos os dados que você fornece diretamente (nome, e-mail, dados de contato e de conexão com corretoras) e dados gerados pelo uso da plataforma (posições, transações importadas, preferências de nível de profundidade e interações com o copiloto de IA).',
    ],
    list: [
      'Dados de identificação e contato',
      'Dados financeiros importados de corretoras (somente leitura)',
      'Dados de uso, dispositivo e registros de acesso',
    ],
  },
  {
    id: 'uso',
    title: '2. Como usamos seus dados',
    paragraphs: [
      'Usamos seus dados para consolidar sua carteira, gerar insights e cálculos fiscais, prevenir fraude e melhorar a plataforma. Não vendemos dados financeiros a terceiros nem os usamos para recomendar a compra ou venda de ativos.',
    ],
  },
  {
    id: 'compartilhamento',
    title: '3. Compartilhamento com terceiros',
    paragraphs: [
      'Compartilhamos apenas os dados estritamente necessários com processadores de pagamento (Stripe), provedores de infraestrutura em nuvem e serviços de detecção de fraude, todos sob contrato de confidencialidade e tratamento de dados conforme a LGPD.',
    ],
  },
  {
    id: 'seguranca',
    title: '4. Segurança',
    paragraphs: [
      'Dados em repouso são cifrados com AES-256 e em trânsito com TLS. Buscamos manter certificação SOC 2 Type II, autenticação de dois fatores disponível para todas as contas e trilhas de auditoria para acesso a dados sensíveis.',
    ],
  },
  {
    id: 'direitos',
    title: '5. Seus direitos (LGPD)',
    paragraphs: [
      'Você pode solicitar acesso, correção, portabilidade, exportação ou eliminação (apagamento) dos seus dados a qualquer momento em Configurações → Privacidade, ou pelo e-mail dpo@trackerr.com.br. Respondemos em até 15 dias corridos.',
    ],
  },
  {
    id: 'retencao',
    title: '6. Retenção e exclusão',
    paragraphs: [
      'Pretendemos manter os dados enquanto sua conta estiver ativa e por um período adicional após o encerramento, para cumprimento de obrigações fiscais e legais, salvo pedido de eliminação antecipada nos casos permitidos por lei. O prazo exato de retenção pós-encerramento ainda está sob definição jurídica.',
    ],
  },
  {
    id: 'contato',
    title: '7. Contato do encarregado (DPO)',
    paragraphs: [
      'Nosso encarregado de proteção de dados (DPO) pode ser contatado em dpo@trackerr.com.br para qualquer questão relacionada a este documento ou ao tratamento dos seus dados pessoais.',
    ],
  },
];

export default function Privacidade() {
  return (
    <LegalDocLayout
      title="Política de privacidade"
      updatedLabel="Última atualização em 2 de setembro de 2026 · rascunho"
      sections={sections}
    />
  );
}
