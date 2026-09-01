import {FormEvent, useMemo, useState} from 'react';
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {toast} from 'sonner';
import {useAuth} from '@/hooks/useAuth';
import AdminService from '@/services/admin';

export default function AdminGrants() {
  const {isAdmin} = useAuth();
  const queryClient = useQueryClient();
  const [email, setEmail] = useState('');
  const [planId, setPlanId] = useState('');
  const [grantType, setGrantType] = useState<'TRIAL_7_DAYS' | 'PERMANENT'>('TRIAL_7_DAYS');
  const [notes, setNotes] = useState('');
  const [roleEmail, setRoleEmail] = useState('');
  const [role, setRole] = useState<'editor' | 'admin'>('editor');

  const {data: plans} = useQuery({
    queryKey: ['admin-plans'],
    queryFn: () => AdminService.getPlans(),
  });

  const activePlans = useMemo(
    () => (plans || []).filter((plan) => plan.isActive),
    [plans],
  );

  const grantMutation = useMutation({
    mutationFn: () =>
      AdminService.grantSubscription({
        email,
        planId,
        grantType,
        notes: notes.trim() || undefined,
      }),
    onSuccess: () => {
      toast.success('Concessão manual aplicada com sucesso.');
      setEmail('');
      setPlanId('');
      setNotes('');
      setGrantType('TRIAL_7_DAYS');
      queryClient.invalidateQueries({queryKey: ['admin-overview']});
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
    grantMutation.mutate();
  };

  const handleRole = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    roleMutation.mutate();
  };

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

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <div style={cardStyle}>
        <div style={{padding:'16px 20px 0'}}>
          <h3 style={{fontSize:15, fontWeight:700, margin:0}}>
            Concessão manual de plano
          </h3>
          <p style={{fontSize:13, color:'var(--color-neutral-500)', margin:'4px 0 0'}}>
            Conceda trial de 7 dias ou acesso permanente informando apenas o e-mail do usuário.
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
              <label style={labelStyle}>Plano</label>
              <select
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
              <label style={labelStyle}>Tipo da concessão</label>
              <select
                value={grantType}
                onChange={(event) => setGrantType(event.target.value as 'TRIAL_7_DAYS' | 'PERMANENT')}
                style={{...inputStyle, cursor:'pointer'}}>
                <option value="TRIAL_7_DAYS">Trial grátis por 7 dias</option>
                <option value="PERMANENT">Plano permanente</option>
              </select>
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
              disabled={grantMutation.isPending || !planId}
              style={{
                background: (grantMutation.isPending || !planId) ? 'var(--surf-3)' : 'var(--ac)',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                padding: '8px 16px',
                fontSize: 14,
                fontWeight: 600,
                cursor: (grantMutation.isPending || !planId) ? 'not-allowed' : 'pointer',
                opacity: (grantMutation.isPending || !planId) ? 0.7 : 1,
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
    </div>
  );
}
