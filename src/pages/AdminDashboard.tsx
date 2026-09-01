import {useQuery} from '@tanstack/react-query';
import AdminService from '@/services/admin';

const metricCards = [
  {
    key: 'totalActiveSubscriptions',
    label: 'Assinaturas Ativas',
    icon: 'ph-seal-check',
  },
  {
    key: 'totalTrialSubscriptions',
    label: 'Trials Ativos',
    icon: 'ph-sparkle',
  },
  {
    key: 'totalManualGrants',
    label: 'Concessões Manuais',
    icon: 'ph-users',
  },
] as const;

export default function AdminDashboard() {
  const {data, isLoading} = useQuery({
    queryKey: ['admin-overview'],
    queryFn: () => AdminService.getOverview(),
  });

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metricCards.map(({key, label, icon}) => (
          <div
            key={key}
            style={{
              background: 'var(--nk-card)',
              border: '1px solid var(--hair)',
              borderRadius: 12,
              boxShadow: 'var(--shadow-sm)',
              padding: '16px 20px',
            }}>
            <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8}}>
              <span style={{fontSize:13, fontWeight:600, color:'var(--color-neutral-400)'}}>
                {label}
              </span>
              <i className={`ph-fill ${icon}`} style={{fontSize:16, color:'var(--color-neutral-400)'}} />
            </div>
            <div style={{fontSize:28, fontWeight:600, letterSpacing:'-0.5px'}}>
              {isLoading ? '...' : data?.[key] ?? 0}
            </div>
          </div>
        ))}

        <div
          style={{
            background: 'var(--nk-card)',
            border: '1px solid rgba(145,132,217,0.15)',
            borderRadius: 12,
            boxShadow: 'var(--shadow-sm)',
            padding: '16px 20px',
          }}>
          <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8}}>
            <span style={{fontSize:13, fontWeight:600, color:'var(--color-neutral-400)'}}>
              Plano Mais Usado
            </span>
            <i className="ph-fill ph-crown" style={{fontSize:16, color:'var(--ac)'}} />
          </div>
          <div style={{fontSize:16, fontWeight:600}}>
            {isLoading ? 'Carregando...' : data?.mostUsedPlan?.planName ?? 'Sem dados'}
          </div>
          <p style={{fontSize:13, color:'var(--color-neutral-500)', margin:'4px 0 0'}}>
            {data?.mostUsedPlan ? `${data.mostUsedPlan.count} usuários ativos` : 'Nenhuma assinatura ativa'}
          </p>
        </div>
      </div>

      <div
        style={{
          background: 'var(--nk-card)',
          border: '1px solid var(--hair)',
          borderRadius: 12,
          boxShadow: 'var(--shadow-sm)',
        }}>
        <div style={{padding:'16px 20px 0'}}>
          <h3 style={{display:'flex', alignItems:'center', gap:8, fontSize:14, fontWeight:600, margin:0}}>
            <i className="ph-fill ph-chart-bar" style={{fontSize:16}} />
            Usuários por plano
          </h3>
        </div>
        <div style={{padding:'12px 20px 20px'}}>
          <div style={{overflowX:'auto'}}>
            <table style={{width:'100%', borderCollapse:'collapse'}}>
              <thead>
                <tr style={{borderBottom:'1px solid var(--hair)'}}>
                  <th style={{padding:'8px 12px', textAlign:'left', fontSize:12, fontWeight:600, color:'var(--color-neutral-500)'}}>
                    Plano
                  </th>
                  <th style={{padding:'8px 12px', textAlign:'right', fontSize:12, fontWeight:600, color:'var(--color-neutral-500)'}}>
                    Usuários
                  </th>
                </tr>
              </thead>
              <tbody>
                {(data?.usersByPlan || []).map((item) => (
                  <tr key={item.planId} style={{borderBottom:'1px solid var(--hair-soft)'}}>
                    <td style={{padding:'10px 12px', fontSize:14, fontWeight:500}}>
                      {item.planName}
                    </td>
                    <td style={{padding:'10px 12px', fontSize:14, textAlign:'right'}}>
                      {item.count}
                    </td>
                  </tr>
                ))}
                {!isLoading && !data?.usersByPlan?.length ? (
                  <tr>
                    <td
                      colSpan={2}
                      style={{padding:'20px 12px', textAlign:'center', fontSize:14, color:'var(--color-neutral-500)'}}>
                      Nenhum dado de assinatura disponível.
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
