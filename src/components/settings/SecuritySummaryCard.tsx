import {Link} from 'react-router-dom';
import {useAccountSettings} from '@/hooks/useAccountSettings';
import {
  isRunningLowOnRecoveryCodes,
  useRecoveryCodesStatus,
} from '@/hooks/useRecoveryCodes';
import {CARD_STYLE, SettingsCardHeader, badgeStyle, type BadgeSeverity} from './settings-ui';

interface SecurityRow {
  icon: string;
  label: string;
  meta: string;
  status: string;
  severity: BadgeSeverity;
}

/**
 * Resumo somente leitura. Ativar 2FA, trocar senha e gerar códigos acontece na
 * tela Segurança (/security, TRA-166); cada linha leva para lá.
 */
export function SecuritySummaryCard() {
  const {data, isLoading} = useAccountSettings();
  const twoFactorEnabled = Boolean(data?.twoFactorEnabled);
  const {data: recovery} = useRecoveryCodesStatus(twoFactorEnabled);

  const rows: SecurityRow[] = [
    {
      icon: 'ph ph-fingerprint',
      label: 'Autenticação em dois fatores',
      meta: twoFactorEnabled
        ? 'App autenticador · pedido a cada login'
        : 'Proteja o login com um app autenticador',
      status: isLoading ? '…' : twoFactorEnabled ? 'Ativa' : 'Inativa',
      severity: isLoading ? 'info' : twoFactorEnabled ? 'ok' : 'warn',
    },
  ];

  if (twoFactorEnabled && recovery) {
    const neverGenerated = recovery.generatedAt === null;
    const low = isRunningLowOnRecoveryCodes(recovery);
    rows.push({
      icon: 'ph ph-key',
      label: 'Códigos de recuperação',
      meta: neverGenerated
        ? 'Acesso de emergência se perder o celular'
        : `${recovery.remaining} de ${recovery.total} códigos restantes`,
      status: neverGenerated ? 'Gerar' : low ? 'Revisar' : 'Ativa',
      severity: neverGenerated || low ? 'warn' : 'ok',
    });
  }

  rows.push({
    icon: 'ph ph-password',
    label: 'Senha',
    meta: 'Troque sua senha na tela de Segurança',
    status: 'Alterar',
    severity: 'info',
  });

  return (
    <section style={CARD_STYLE}>
      <SettingsCardHeader title="Segurança" />
      <div style={{padding: '5.6px 0'}}>
        {rows.map((row) => (
          <Link
            key={row.label}
            to="/security"
            className="hover:bg-[rgba(152,160,171,0.06)]"
            style={{display: 'flex', alignItems: 'center', gap: 11.2, padding: '11.2px 16.8px', borderBottom: '1px solid var(--hair-soft)', color: 'inherit', textDecoration: 'none'}}>
            <i className={row.icon} aria-hidden="true" style={{fontSize: 16, color: 'var(--color-accent-300)'}} />
            <div style={{flex: 1, minWidth: 0}}>
              <div style={{fontSize: 12.5, color: 'var(--color-neutral-200)'}}>{row.label}</div>
              <div style={{fontSize: 10.5, color: 'var(--color-neutral-600)', marginTop: 2, lineHeight: 1.4}}>{row.meta}</div>
            </div>
            <span style={badgeStyle(row.severity)}>{row.status}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
