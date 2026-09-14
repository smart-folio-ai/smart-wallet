import {InvestorProfileCard} from '@/components/settings/InvestorProfileCard';
import {InvestmentPolicyCard} from '@/components/settings/InvestmentPolicyCard';
import {ConnectedAccountsCard} from '@/components/settings/ConnectedAccountsCard';
import {PersonalDataCard} from '@/components/settings/PersonalDataCard';
import {SecuritySummaryCard} from '@/components/settings/SecuritySummaryCard';
import {PrivacySettings} from '@/components/settings/PrivacySettings';
import {NotificationsCard} from '@/components/settings/NotificationsCard';
import {SubscriptionCard} from '@/components/settings/SubscriptionCard';

/**
 * Configurações — bloco `isSettings` de design_handoff_trackerr/Trackerr
 * App.dc.html. Dados pessoais, notificações e assinatura não existem no
 * handoff, mas são fluxos reais da conta: seguem abaixo, no mesmo desenho.
 * Troca de senha e 2FA vivem em /security.
 */
export default function Settings() {
  return (
    <div
      className="grid grid-cols-1 items-start gap-[16.8px] xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
      <div className="flex min-w-0 flex-col gap-[16.8px]">
        <InvestorProfileCard />
        <InvestmentPolicyCard />
        <ConnectedAccountsCard />
        <PersonalDataCard />
      </div>
      <div className="flex min-w-0 flex-col gap-[16.8px]">
        <SecuritySummaryCard />
        <PrivacySettings />
        <NotificationsCard />
        <SubscriptionCard />
      </div>
    </div>
  );
}
