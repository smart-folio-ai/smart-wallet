import {FormEvent, useMemo, useState} from 'react';
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {toast} from 'sonner';
import {useAuth} from '@/hooks/useAuth';
import AdminService from '@/services/admin';

const DEFAULT_TRIAL_DURATION_DAYS = 7;

export default function AdminGrants() {
  const {isAdmin} = useAuth();
  const queryClient = useQueryClient();
  const [email, setEmail] = useState('');
  const [planId, setPlanId] = useState('');
  const [grantType, setGrantType] = useState<'TRIAL' | 'PERMANENT'>('TRIAL');
  const [trialDurationDays, setTrialDurationDays] = useState(String(DEFAULT_TRIAL_DURATION_DAYS));
  const [discountPercent, setDiscountPercent] = useState('');
  const [notes, setNotes] = useState('');
  const [roleEmail, setRoleEmail] = useState('');
  const [role, setRole] = useState<'editor' | 'admin'>('editor');
  const [historyPage, setHistoryPage] = useState(1);
  const historyLimit = 10;

  const {data: plans} = useQuery({
    queryKey: ['admin-plans'],
    queryFn: () => AdminService.getPlans(),
  });

  const {data: history, isLoading: isHistoryLoading} = useQuery({
    queryKey: ['admin-grants-history', historyPage],
    queryFn: () => AdminService.listGrants({page: historyPage, limit: historyLimit}),
  });

  const activePlans = useMemo(
    () => (plans || []).filter((plan) => plan.isActive),
    [plans],
  );

  const isTrial = grantType === 'TRIAL';
  const parsedTrialDuration = Number(trialDurationDays);
  const isTrialDurationValid =
    !isTrial || (Number.isInteger(parsedTrialDuration) && parsedTrialDuration > 0);

  const parsedDiscount = discountPercent.trim() === '' ? undefined : Number(discountPercent);
  const isDiscountValid =
    parsedDiscount === undefined || (parsedDiscount >= 0 && parsedDiscount <= 100);

  const grantMutation = useMutation({
    mutationFn: () =>
      AdminService.grantSubscription({
        email,
        planId,
        grantType,
        trialDurationDays: isTrial ? parsedTrialDuration : undefined,
        discountPercent: parsedDiscount,
        notes: notes.trim() || undefined,
      }),
    onSuccess: () => {
      toast.success('Concessão manual aplicada com sucesso.');
      setEmail('');
      setPlanId('');
      setNotes('');
      setGrantType('TRIAL');
      setTrialDurationDays(String(DEFAULT_TRIAL_DURATION_DAYS));
      setDiscountPercent('');
      setHistoryPage(1);
      queryClient.invalidateQueries({queryKey: ['admin-overview']});
      queryClient.invalidateQueries({queryKey: ['admin-grants-history']});
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Não foi possível aplicar a concessão.');
    },
  });

  const roleMutation = useMutation({
    mutationFn: () => AdminService.updateUserRoleByEmail({email: roleEmail, role}),
    onSuccess: () => {
      toast.success('Permissão atualizada com sucesso.');
      setRoleEmail('');
      setRole('editor');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Não foi possível atualizar a permissão.');
    },
  });

  const handleGrant = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isTrialDurationValid || !isDiscountValid) {
      return;
    }
    grantMutation.mutate();
  };

  const handleRole = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    roleMutation.mutate();
  };

  const canSubmitGrant =
    !grantMutation.isPending && !!planId && isTrialDurationValid && isDiscountValid;

  const cardStyle: React.CSSProperties = {
    background: 'var(--nk-card)',
    border: '1px solid var(--hair)',
    borderRadius: 12,
    boxShadow: 'var(--shadow-sm)',
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: 'var(--sunk)',
    border: '1px solid var(--hair)',
    borderRadius: 8,
    padding: '8px 12px',
    fontSize: 14,
    color: 'inherit',
    outline: 'none',
    boxSizing: 'border-box',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 13,
    fontWeight: 500,
    color: 'var(--color-neutral-400)',
    display: 'block',
    marginBottom: 4,
  };

  const errorTextStyle: React.CSSProperties = {
    fontSize: 12,
    color: 'var(--color-danger-500, #ef4444)',
    marginTop: 4,
  };

  const grantTypeLabel = (type: string) => {
    if (type === 'TRIAL' || type === 'TRIAL_7_DAYS') return 'Trial';
    if (type === 'PERMANENT') return 'Permanente';
    return type;
  };

  const formatDate = (value: string) => {
    try {
      return new Date(value).toLocaleString('pt-BR');
    } catch {
      return value;
    }
  };

  const totalPages = history ? Math.max(1, Math.ceil(history.total / history.limit)) : 1;

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <div style={cardStyle}>
        <div style={{padding:'16px 20px 0'}}>
          <h3 style={{fontSize:15, fontWeight:700, margin:0}}>
            Concessão manual de plano
          </h3>
          <p style={{fontSize:13, color:'var(--color-neutral-500)', margin:'4px 0 0'}}>
            Conceda um trial com duração customizável, desconto opcional ou acesso permanente
            informando apenas o e-mail do usuário.
          </p>
        </div>
        <div style={{padding:'16px 20px 20px'}}>
          <form onSubmit={handleGrant} className="space-y-4">
            <div>
              <label htmlFor="grant-email" style={labelStyle}>E-mail do usuário</label>
              <input
                id="grant-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                style={inputStyle}
              />
            </div>

            <div>
              <label htmlFor="grant-plan" style={labelStyle}>Plano</label>
              <select
                id="grant-plan"
                value={planId}
                onChange={(event) => setPlanId(event.target.value)}
                style={{...inputStyle, cursor:'pointer'}}>
                <option value="">Selecione o plano</option>
                {activePlans.map((plan) => (
                  <option key={plan._id} value={plan._id}>{plan.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="grant-type" style={labelStyle}>Tipo da concessão</label>
              <select
                id="grant-type"
                value={grantType}
                onChange={(event) => setGrantType(event.target.value as 'TRIAL' | 'PERMANENT')}
                style={{...inputStyle, cursor:'pointer'}}>
                <option value="TRIAL">Trial (duração customizável)</option>
                <option value="PERMANENT">Plano permanente</option>
              </select>
            </div>

            {isTrial ? (
              <div>
                <label htmlFor="grant-trial-duration" style={labelStyle}>
                  Duração do trial (dias)
                </label>
                <input
                  id="grant-trial-duration"
                  type="number"
                  min={1}
                  step={1}
                  value={trialDurationDays}
                  onChange={(event) => setTrialDurationDays(event.target.value)}
                  required
                  style={inputStyle}
                />
                {!isTrialDurationValid ? (
                  <span style={errorTextStyle}>Informe um número de dias maior que zero.</span>
                ) : null}
              </div>
            ) : null}

            <div>
              <label htmlFor="grant-discount" style={labelStyle}>
                Desconto (%) — opcional
              </label>
              <input
                id="grant-discount"
                type="number"
                min={0}
                max={100}
                step={1}
                value={discountPercent}
                onChange={(event) => setDiscountPercent(event.target.value)}
                placeholder="Ex: 20"
                style={inputStyle}
              />
              {!isDiscountValid ? (
                <span style={errorTextStyle}>Informe um valor entre 0 e 100.</span>
              ) : null}
            </div>

            <div>
              <label htmlFor="grant-notes" style={labelStyle}>Observação da auditoria</label>
              <textarea
                id="grant-notes"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                rows={4}
                placeholder="Motivo interno da concessão"
                style={{
                  ...inputStyle,
                  resize: 'vertical',
                  fontFamily: 'inherit',
                }}
              />
            </div>

            <button
              type="submit"
              disabled={!canSubmitGrant}
              style={{
                background: canSubmitGrant ? 'var(--ac)' : 'var(--surf-3)',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                padding: '8px 16px',
                fontSize: 14,
                fontWeight: 600,
                cursor: canSubmitGrant ? 'pointer' : 'not-allowed',
                opacity: canSubmitGrant ? 1 : 0.7,
              }}>
              {grantMutation.isPending ? 'Aplicando...' : 'Confirmar concessão'}
            </button>
          </form>
        </div>
      </div>

      {isAdmin ? (
        <div style={cardStyle}>
          <div style={{padding:'16px 20px 0'}}>
            <h3 style={{fontSize:15, fontWeight:700, margin:0}}>
              Delegar permissão de editor/admin
            </h3>
            <p style={{fontSize:13, color:'var(--color-neutral-500)', margin:'4px 0 0'}}>
              Use isso para liberar funcionários que poderão operar a concessão manual.
            </p>
          </div>
          <div style={{padding:'16px 20px 20px'}}>
            <form onSubmit={handleRole} className="space-y-4">
              <div>
                <label htmlFor="role-email" style={labelStyle}>E-mail do usuário</label>
                <input
                  id="role-email"
                  type="email"
                  value={roleEmail}
                  onChange={(event) => setRoleEmail(event.target.value)}
                  required
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Role</label>
                <select
                  value={role}
                  onChange={(event) => setRole(event.target.value as 'editor' | 'admin')}
                  style={{...inputStyle, cursor:'pointer'}}>
                  <option value="editor">Editor</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={roleMutation.isPending}
                style={{
                  background: roleMutation.isPending ? 'var(--surf-3)' : 'var(--ac)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  padding: '8px 16px',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: roleMutation.isPending ? 'not-allowed' : 'pointer',
                  opacity: roleMutation.isPending ? 0.7 : 1,
                }}>
                {roleMutation.isPending ? 'Atualizando...' : 'Salvar permissão'}
              </button>
            </form>
          </div>
        </div>
      ) : null}

      <div style={{...cardStyle, gridColumn: '1 / -1'}}>
        <div style={{padding:'16px 20px 0', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap: 8}}>
          <div>
            <h3 style={{fontSize:15, fontWeight:700, margin:0}}>
              Histórico de concessões manuais
            </h3>
            <p style={{fontSize:13, color:'var(--color-neutral-500)', margin:'4px 0 0'}}>
              Auditoria das concessões manuais aplicadas por administradores e editores.
            </p>
          </div>
        </div>
        <div style={{padding:'16px 20px 20px'}}>
          {isHistoryLoading ? (
            <p style={{fontSize:13, color:'var(--color-neutral-500)'}}>Carregando histórico...</p>
          ) : !history || history.items.length === 0 ? (
            <p style={{fontSize:13, color:'var(--color-neutral-500)'}}>
              Nenhuma concessão manual registrada ainda.
            </p>
          ) : (
            <>
              <div style={{overflowX: 'auto'}}>
                <table style={{width: '100%', borderCollapse: 'collapse', fontSize: 13}}>
                  <thead>
                    <tr style={{textAlign: 'left', borderBottom: '1px solid var(--hair)'}}>
                      <th style={{padding: '8px 12px', color: 'var(--color-neutral-400)', fontWeight: 600}}>E-mail</th>
                      <th style={{padding: '8px 12px', color: 'var(--color-neutral-400)', fontWeight: 600}}>Plano</th>
                      <th style={{padding: '8px 12px', color: 'var(--color-neutral-400)', fontWeight: 600}}>Tipo</th>
                      <th style={{padding: '8px 12px', color: 'var(--color-neutral-400)', fontWeight: 600}}>Desconto</th>
                      <th style={{padding: '8px 12px', color: 'var(--color-neutral-400)', fontWeight: 600}}>Data</th>
                      <th style={{padding: '8px 12px', color: 'var(--color-neutral-400)', fontWeight: 600}}>Concedido por</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.items.map((item) => (
                      <tr key={item.id} style={{borderBottom: '1px solid var(--hair)'}}>
                        <td style={{padding: '8px 12px'}}>{item.userEmail}</td>
                        <td style={{padding: '8px 12px'}}>{item.planName}</td>
                        <td style={{padding: '8px 12px'}}>
                          {grantTypeLabel(item.grantType)}
                          {item.trialDurationDays ? ` (${item.trialDurationDays}d)` : ''}
                        </td>
                        <td style={{padding: '8px 12px'}}>
                          {item.discountPercent ? `${item.discountPercent}%` : '—'}
                        </td>
                        <td style={{padding: '8px 12px'}}>{formatDate(item.createdAt)}</td>
                        <td style={{padding: '8px 12px'}}>{item.performedByEmail}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={{display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 12, marginTop: 12}}>
                <span style={{fontSize: 12, color: 'var(--color-neutral-500)'}}>
                  Página {history.page} de {totalPages}
                </span>
                <button
                  type="button"
                  disabled={historyPage <= 1}
                  onClick={() => setHistoryPage((page) => Math.max(1, page - 1))}
                  style={{
                    background: 'var(--sunk)',
                    border: '1px solid var(--hair)',
                    borderRadius: 6,
                    padding: '4px 10px',
                    fontSize: 12,
                    cursor: historyPage <= 1 ? 'not-allowed' : 'pointer',
                    opacity: historyPage <= 1 ? 0.5 : 1,
                  }}>
                  Anterior
                </button>
                <button
                  type="button"
                  disabled={historyPage >= totalPages}
                  onClick={() => setHistoryPage((page) => Math.min(totalPages, page + 1))}
                  style={{
                    background: 'var(--sunk)',
                    border: '1px solid var(--hair)',
                    borderRadius: 6,
                    padding: '4px 10px',
                    fontSize: 12,
                    cursor: historyPage >= totalPages ? 'not-allowed' : 'pointer',
                    opacity: historyPage >= totalPages ? 0.5 : 1,
                  }}>
                  Próxima
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
