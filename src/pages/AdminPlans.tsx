import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {FormEvent, useState} from 'react';
import {toast} from 'sonner';
import {AdminPlan} from '@/interface/admin';
import {UserPlanTier} from '@/interface/subscription';
import AdminService from '@/services/admin';

type PlanFormState = {
  name: string;
  description: string;
  price: string;
  currency: string;
  interval: 'month' | 'year' | 'week' | 'day';
  intervalCount: string;
  tier: UserPlanTier | '';
  features: string;
  annualPrice: string;
  annualStripePriceId: string;
  isFeatured: boolean;
  isComingSoon: boolean;
};

const initialForm: PlanFormState = {
  name: '',
  description: '',
  price: '',
  currency: 'brl',
  interval: 'month',
  intervalCount: '1',
  tier: '',
  features: '',
  annualPrice: '',
  annualStripePriceId: '',
  isFeatured: false,
  isComingSoon: false,
};

function mapPlanToForm(plan: AdminPlan): PlanFormState {
  return {
    name: plan.name,
    description: plan.description || '',
    price: String(plan.price),
    currency: plan.currency || 'brl',
    interval: (plan.interval as PlanFormState['interval']) || 'month',
    intervalCount: String(plan.intervalCount || 1),
    tier: plan.tier || '',
    features: (plan.features || []).join('\n'),
    annualPrice: plan.annualPrice != null ? String(plan.annualPrice) : '',
    annualStripePriceId: plan.annualStripePriceId || '',
    isFeatured: plan.isFeatured ?? false,
    isComingSoon: plan.isComingSoon ?? false,
  };
}

export default function AdminPlans() {
  const queryClient = useQueryClient();
  const [editingPlan, setEditingPlan] = useState<AdminPlan | null>(null);
  const [form, setForm] = useState<PlanFormState>(initialForm);

  const {data: plans, isLoading} = useQuery({
    queryKey: ['admin-plans'],
    queryFn: () => AdminService.getPlans(),
  });

  const resetForm = () => {
    setEditingPlan(null);
    setForm(initialForm);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!form.tier) {
        throw new Error('Selecione o nível de acesso do plano.');
      }
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        price: Number(form.price),
        currency: form.currency.trim().toLowerCase(),
        interval: form.interval,
        intervalCount: Number(form.intervalCount),
        tier: form.tier,
        features: form.features
          .split('\n')
          .map((item) => item.trim())
          .filter(Boolean),
        ...(form.annualPrice.trim() !== ''
          ? {annualPrice: Number(form.annualPrice)}
          : {}),
        ...(form.annualStripePriceId.trim() !== ''
          ? {annualStripePriceId: form.annualStripePriceId.trim()}
          : {}),
        isFeatured: form.isFeatured,
        isComingSoon: form.isComingSoon,
      };

      if (editingPlan) {
        return AdminService.updatePlan(editingPlan._id, payload);
      }

      return AdminService.createPlan(payload);
    },
    onSuccess: () => {
      toast.success(editingPlan ? 'Plano atualizado com sucesso.' : 'Plano criado com sucesso.');
      queryClient.invalidateQueries({queryKey: ['admin-plans']});
      resetForm();
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          'Não foi possível salvar o plano.'
      );
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: (planId: string) => AdminService.deactivatePlan(planId),
    onSuccess: () => {
      toast.success('Plano desativado com sucesso.');
      queryClient.invalidateQueries({queryKey: ['admin-plans']});
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Não foi possível desativar o plano.');
    },
  });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    saveMutation.mutate();
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
    <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
      <div style={cardStyle}>
        <div style={{padding:'16px 20px 0'}}>
          <h3 style={{fontSize:15, fontWeight:700, margin:0}}>
            {editingPlan ? 'Editar plano' : 'Novo plano'}
          </h3>
        </div>
        <div style={{padding:'16px 20px 20px'}}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="plan-name" style={labelStyle}>Nome</label>
              <input
                id="plan-name"
                value={form.name}
                onChange={(event) => setForm((prev) => ({...prev, name: event.target.value}))}
                required
                style={inputStyle}
              />
            </div>

            <div>
              <label htmlFor="plan-description" style={labelStyle}>Descrição</label>
              <textarea
                id="plan-description"
                value={form.description}
                onChange={(event) => setForm((prev) => ({...prev, description: event.target.value}))}
                rows={4}
                style={{...inputStyle, resize:'vertical', fontFamily:'inherit'}}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label htmlFor="plan-price" style={labelStyle}>Preço</label>
                <input
                  id="plan-price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.price}
                  onChange={(event) => setForm((prev) => ({...prev, price: event.target.value}))}
                  required
                  style={inputStyle}
                />
              </div>

              <div>
                <label htmlFor="plan-currency" style={labelStyle}>Moeda</label>
                <input
                  id="plan-currency"
                  value={form.currency}
                  onChange={(event) => setForm((prev) => ({...prev, currency: event.target.value}))}
                  required
                  style={inputStyle}
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label style={labelStyle}>Intervalo</label>
                <select
                  value={form.interval}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      interval: event.target.value as PlanFormState['interval'],
                    }))
                  }
                  style={{...inputStyle, cursor:'pointer'}}>
                  <option value="month">Mensal</option>
                  <option value="year">Anual</option>
                  <option value="week">Semanal</option>
                  <option value="day">Diário</option>
                </select>
              </div>

              <div>
                <label htmlFor="plan-interval-count" style={labelStyle}>Qtd. de intervalos</label>
                <input
                  id="plan-interval-count"
                  type="number"
                  min="1"
                  step="1"
                  value={form.intervalCount}
                  onChange={(event) => setForm((prev) => ({...prev, intervalCount: event.target.value}))}
                  required
                  style={inputStyle}
                />
              </div>
            </div>

            <div>
              <label style={labelStyle}>Nível de acesso</label>
              <select
                value={form.tier}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    tier: event.target.value as PlanFormState['tier'],
                  }))
                }
                style={{...inputStyle, cursor:'pointer'}}>
                <option value="">Selecione</option>
                <option value="free">Free</option>
                <option value="pro">Pro</option>
                <option value="premium">Premium</option>
                <option value="global_investor">Global Investor</option>
              </select>
              <p style={{fontSize:12, color:'var(--color-neutral-500)', margin:'4px 0 0'}}>
                Define o acesso liberado pro assinante — independente do nome do plano.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label htmlFor="plan-annual-price" style={labelStyle}>Preço anual (opcional)</label>
                <input
                  id="plan-annual-price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.annualPrice}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      annualPrice: event.target.value,
                    }))
                  }
                  style={inputStyle}
                />
              </div>

              <div>
                <label htmlFor="plan-annual-stripe-price-id" style={labelStyle}>
                  Stripe Price ID anual (opcional)
                </label>
                <input
                  id="plan-annual-stripe-price-id"
                  value={form.annualStripePriceId}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      annualStripePriceId: event.target.value,
                    }))
                  }
                  style={inputStyle}
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div style={{display:'flex', alignItems:'center', gap:8}}>
                <input
                  id="plan-is-featured"
                  type="checkbox"
                  checked={form.isFeatured}
                  onChange={(event) =>
                    setForm((prev) => ({...prev, isFeatured: event.target.checked}))
                  }
                  style={{width:16, height:16, cursor:'pointer', accentColor:'var(--ac)'}}
                />
                <label
                  htmlFor="plan-is-featured"
                  style={{fontSize:13, fontWeight:500, color:'var(--color-neutral-400)', cursor:'pointer'}}>
                  Destacar na landing
                </label>
              </div>

              <div style={{display:'flex', alignItems:'center', gap:8}}>
                <input
                  id="plan-is-coming-soon"
                  type="checkbox"
                  checked={form.isComingSoon}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      isComingSoon: event.target.checked,
                    }))
                  }
                  style={{width:16, height:16, cursor:'pointer', accentColor:'var(--ac)'}}
                />
                <label
                  htmlFor="plan-is-coming-soon"
                  style={{fontSize:13, fontWeight:500, color:'var(--color-neutral-400)', cursor:'pointer'}}>
                  Exibir como "em breve"
                </label>
              </div>
            </div>

            <div>
              <label htmlFor="plan-features" style={labelStyle}>Features (uma por linha)</label>
              <textarea
                id="plan-features"
                value={form.features}
                onChange={(event) => setForm((prev) => ({...prev, features: event.target.value}))}
                rows={6}
                style={{...inputStyle, resize:'vertical', fontFamily:'inherit'}}
              />
            </div>

            <div style={{display:'flex', gap:8}}>
              <button
                type="submit"
                disabled={saveMutation.isPending}
                style={{
                  background: saveMutation.isPending ? 'var(--surf-3)' : 'var(--ac)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  padding: '8px 16px',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: saveMutation.isPending ? 'not-allowed' : 'pointer',
                  opacity: saveMutation.isPending ? 0.7 : 1,
                }}>
                {saveMutation.isPending ? 'Salvando...' : editingPlan ? 'Atualizar plano' : 'Criar plano'}
              </button>
              {editingPlan ? (
                <button
                  type="button"
                  onClick={resetForm}
                  style={{
                    background: 'transparent',
                    color: 'inherit',
                    border: '1px solid var(--hair)',
                    borderRadius: 8,
                    padding: '8px 16px',
                    fontSize: 14,
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}>
                  Cancelar edição
                </button>
              ) : null}
            </div>
          </form>
        </div>
      </div>

      <div style={cardStyle}>
        <div style={{padding:'16px 20px 0'}}>
          <h3 style={{fontSize:15, fontWeight:700, margin:0}}>Planos cadastrados</h3>
        </div>
        <div style={{padding:'12px 20px 20px'}}>
          <div style={{overflowX:'auto'}}>
            <table style={{width:'100%', borderCollapse:'collapse'}}>
              <thead>
                <tr style={{borderBottom:'1px solid var(--hair)'}}>
                  <th style={{padding:'8px 12px', textAlign:'left', fontSize:12, fontWeight:600, color:'var(--color-neutral-500)'}}>
                    Plano
                  </th>
                  <th style={{padding:'8px 12px', textAlign:'left', fontSize:12, fontWeight:600, color:'var(--color-neutral-500)'}}>
                    Nível
                  </th>
                  <th style={{padding:'8px 12px', textAlign:'left', fontSize:12, fontWeight:600, color:'var(--color-neutral-500)'}}>
                    Preço
                  </th>
                  <th style={{padding:'8px 12px', textAlign:'left', fontSize:12, fontWeight:600, color:'var(--color-neutral-500)'}}>
                    Status
                  </th>
                  <th style={{padding:'8px 12px', textAlign:'right', fontSize:12, fontWeight:600, color:'var(--color-neutral-500)'}}>
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody>
                {(plans || []).map((plan) => (
                  <tr key={plan._id} style={{borderBottom:'1px solid var(--hair-soft)'}}>
                    <td style={{padding:'10px 12px'}}>
                      <div style={{fontSize:14, fontWeight:500}}>{plan.name}</div>
                      <div style={{fontSize:12, color:'var(--color-neutral-500)'}}>
                        {plan.intervalCount}x {plan.interval}
                      </div>
                    </td>
                    <td style={{padding:'10px 12px', fontSize:14}}>{plan.tier || '—'}</td>
                    <td style={{padding:'10px 12px', fontSize:14}}>
                      {plan.currency?.toUpperCase()} {plan.price.toFixed(2)}
                    </td>
                    <td style={{padding:'10px 12px', fontSize:14}}>
                      {plan.isActive ? 'Ativo' : 'Inativo'}
                    </td>
                    <td style={{padding:'10px 12px', textAlign:'right'}}>
                      <div style={{display:'flex', justifyContent:'flex-end', gap:8}}>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingPlan(plan);
                            setForm(mapPlanToForm(plan));
                          }}
                          style={{
                            background: 'transparent',
                            border: '1px solid var(--hair)',
                            borderRadius: 6,
                            padding: '4px 10px',
                            fontSize: 12,
                            fontWeight: 500,
                            cursor: 'pointer',
                            color: 'inherit',
                          }}>
                          Editar
                        </button>
                        <button
                          type="button"
                          disabled={!plan.isActive || deactivateMutation.isPending}
                          onClick={() => deactivateMutation.mutate(plan._id)}
                          style={{
                            background: 'var(--neg)',
                            color: '#fff',
                            border: 'none',
                            borderRadius: 6,
                            padding: '4px 10px',
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: (!plan.isActive || deactivateMutation.isPending) ? 'not-allowed' : 'pointer',
                            opacity: (!plan.isActive || deactivateMutation.isPending) ? 0.5 : 1,
                          }}>
                          Desativar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!isLoading && !plans?.length ? (
                  <tr>
                    <td
                      colSpan={5}
                      style={{padding:'20px 12px', textAlign:'center', fontSize:14, color:'var(--color-neutral-500)'}}>
                      Nenhum plano cadastrado.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
