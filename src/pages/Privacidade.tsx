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
    id: 'base-legal',
    title: '3. Bases legais',
    paragraphs: [
      'Tratamos seus dados para executar o contrato de uso da plataforma (art. 7º, V, da LGPD), cumprir obrigações legais e fiscais (art. 7º, II), proteger a segurança da conta e prevenir abusos por legítimo interesse (art. 7º, IX) e, para cookies não essenciais, mediante o seu consentimento (art. 7º, I), que pode ser revogado a qualquer momento em Cookies.',
    ],
  },
  {
    id: 'compartilhamento',
    title: '4. Compartilhamento com operadores',
    paragraphs: [
      'Compartilhamos apenas os dados necessários para cada finalidade, com os operadores abaixo, sob contrato e tratamento de dados conforme a LGPD. Não vendemos dados pessoais.',
    ],
    list: [
      'Stripe — pagamento de assinaturas com cartão (nome, e-mail e dados de cobrança; o número do cartão fica só no Stripe).',
      'Asaas — pagamento via PIX (nome, e-mail e CPF, informado apenas no momento do pagamento e não armazenado pelo Trackerr).',
      'Resend — envio de e-mails transacionais e de notificação (nome e e-mail).',
      'Cloudflare — hospedagem e entrega do site (dados técnicos de acesso, como IP e navegador).',
      'Provedores de inteligência artificial (OpenRouter, NVIDIA, Groq, Google Gemini e Anthropic) — geração de análises e respostas do copiloto a partir de posições, valores e perguntas; enviamos um identificador interno pseudônimo, nunca seu nome, e-mail ou CPF.',
      'Google — login com Google, quando você escolhe essa opção (nome, e-mail e foto do perfil Google).',
      'Servidores de aplicação e banco de dados contratados pelo Trackerr, onde ficam sua conta e sua carteira.',
    ],
  },
  {
    id: 'transferencia',
    title: '5. Transferência internacional',
    paragraphs: [
      'Parte desses operadores (Stripe, Resend, Cloudflare, Google e os provedores de inteligência artificial) processa dados fora do Brasil, principalmente nos Estados Unidos. Essas transferências são feitas nas hipóteses do art. 33 da LGPD, para a execução do contrato com você e com garantias contratuais de proteção de dados, e limitadas ao mínimo necessário: os provedores de IA recebem dados de carteira pseudonimizados, sem identificação direta.',
    ],
  },
  {
    id: 'ia',
    title: '6. Uso de inteligência artificial',
    paragraphs: [
      'Os insights e as respostas do copiloto são gerados automaticamente e têm caráter informativo: não são recomendação de investimento. As interações com o copiloto ficam no seu histórico e são apagadas quando você exclui a conta.',
    ],
  },
  {
    id: 'seguranca',
    title: '7. Segurança',
    paragraphs: [
      'O tráfego entre o seu navegador e os nossos servidores é cifrado com TLS. As senhas são armazenadas como hash Argon2id, nunca em texto puro, e a autenticação de dois fatores (TOTP) está disponível para todas as contas. As credenciais de acesso às corretoras são cifradas com AES-256 antes de serem persistidas. Ações administrativas sobre contas de usuários ficam registradas em trilha de auditoria.',
    ],
  },
  {
    id: 'direitos',
    title: '8. Seus direitos (LGPD)',
    paragraphs: [
      'Você pode solicitar acesso, correção, portabilidade, exportação ou eliminação (apagamento) dos seus dados a qualquer momento em Configurações → Privacidade, ou pelo e-mail dpo@trackerr.com.br. Respondemos em até 15 dias corridos.',
    ],
  },
  {
    id: 'retencao',
    title: '9. Retenção e exclusão',
    paragraphs: [
      'Mantemos os dados enquanto sua conta estiver ativa. Ao excluir a conta, apagamos na hora seus dados de cadastro, perfil, endereços, credenciais de corretoras, histórico do copiloto, notificações e preferências, e encerramos a renovação da assinatura. Registros de operações e pagamentos podem ser mantidos pelo prazo exigido pela legislação fiscal, sem vínculo com seu nome ou e-mail.',
    ],
  },
  {
    id: 'contato',
    title: '10. Contato do encarregado (DPO)',
    paragraphs: [
      'Nosso encarregado de proteção de dados (DPO) pode ser contatado em dpo@trackerr.com.br para qualquer questão relacionada a este documento ou ao tratamento dos seus dados pessoais.',
    ],
  },
];

export default function Privacidade() {
  return (
    <LegalDocLayout
      title="Política de privacidade"
      updatedLabel="Última atualização em 26 de setembro de 2026"
      sections={sections}
    />
  );
}
