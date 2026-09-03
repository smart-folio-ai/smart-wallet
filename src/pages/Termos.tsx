import {LegalDocLayout, LegalSection} from '@/components/legal/LegalDocLayout';

const sections: LegalSection[] = [
  {
    id: 'objeto',
    title: '1. Objeto',
    paragraphs: [
      'Estes termos regulam o uso da plataforma Trackerr, um serviço de consolidação de carteira de investimentos, análise fiscal e geração de insights por inteligência artificial.',
    ],
  },
  {
    id: 'natureza',
    title: '2. Natureza do serviço',
    paragraphs: [
      'O Trackerr não é uma corretora, gestora ou consultoria de investimentos. As informações e insights exibidos têm caráter informativo. O Trackerr não é consultoria de investimento e não recomenda ativos — a decisão final sobre qualquer operação é sempre do usuário.',
    ],
  },
  {
    id: 'conta',
    title: '3. Conta e responsabilidades do usuário',
    paragraphs: [
      'Você é responsável por manter a confidencialidade das credenciais de acesso, pela exatidão dos dados fornecidos e por ativar a verificação em duas etapas sempre que disponível.',
    ],
  },
  {
    id: 'planos',
    title: '4. Planos, cobrança e cancelamento',
    paragraphs: [
      'Assinaturas são cobradas de forma recorrente (mensal ou anual) via Stripe. Você pode cancelar a qualquer momento; o acesso permanece ativo até o fim do período já pago, sem reembolso proporcional (pro-rata), salvo obrigação legal em contrário.',
    ],
  },
  {
    id: 'ia',
    title: '5. Uso de inteligência artificial',
    paragraphs: [
      'Insights gerados por IA na plataforma têm caráter educativo e informativo, trazendo fonte, janela de dados e nível de confiança do modelo quando aplicável. Eles não constituem recomendação de investimento e podem conter imprecisões — a decisão final é sempre do usuário.',
    ],
  },
  {
    id: 'propriedade',
    title: '6. Propriedade intelectual',
    paragraphs: [
      'Marca, layout, código e metodologia de cálculo são de propriedade da Trackerr Tecnologia Ltda. É proibida a reprodução total ou parcial sem autorização.',
    ],
  },
  {
    id: 'rescisao',
    title: '7. Suspensão e rescisão',
    paragraphs: [
      'Podemos suspender ou encerrar contas em caso de uso indevido, fraude ou violação destes termos, mediante notificação prévia sempre que possível.',
    ],
  },
  {
    id: 'foro',
    title: '8. Lei aplicável e foro',
    paragraphs: [
      'Estes termos são regidos pelas leis brasileiras, com foro eleito na comarca de São Paulo, SP, para dirimir eventuais controvérsias, com renúncia a qualquer outro por mais privilegiado que seja.',
    ],
  },
];

export default function Termos() {
  return (
    <LegalDocLayout
      title="Termos de uso"
      updatedLabel="Última atualização em 2 de setembro de 2026 · rascunho"
      sections={sections}
    />
  );
}
