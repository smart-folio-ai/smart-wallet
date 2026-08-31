import React from 'react';
import {useNavigate, useSearchParams} from 'react-router-dom';
import {toast} from 'sonner';
import {useQuery} from '@tanstack/react-query';
import {CurrentSubscriptionResponse} from '@/interface/subscription';
import SubscriptionService from '@/services/subscription';

interface SubscriptionDetails {
  planName: string;
  amount: number;
  currency: string;
  interval: string;
  status: string;
  nextBilling: string;
  features: string[];
}

export default function SubscriptionSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const sessionId = searchParams.get('session_id');

  const {data, isLoading} = useQuery<CurrentSubscriptionResponse>({
    queryKey: ['current-subscription'],
    queryFn: SubscriptionService.getCurrentPlan,
  });

  const subscriptionData = data?.subscription;
  const planData = data?.plan;

  const subscriptionDetails: SubscriptionDetails | null = planData
    ? {
        planName: planData.name,
        amount: planData.price,
        currency: planData.currency,
        interval: planData.interval,
        status: subscriptionData?.status || 'inactive',
        nextBilling: subscriptionData?.currentPeriodEnd || '',
        features: planData.features || [],
      }
    : null;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('pt-BR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div style={{minHeight:'100dvh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--surf-1)'}}>
        <style>{'@keyframes spin{to{transform:rotate(360deg)}}'}</style>
        <div style={{width:40, height:40, borderRadius:'50%', border:'3px solid var(--surf-3)', borderTopColor:'var(--ac)', animation:'spin 0.8s linear infinite'}} />
      </div>
    );
  }

  return (
    <div style={{minHeight:'100dvh', display:'flex', alignItems:'center', justifyContent:'center', padding:16, background:'var(--surf-1)'}}>
      <style>{'@keyframes spin{to{transform:rotate(360deg)}}'}</style>
      <div style={{width:'100%', maxWidth:640}}>
        <div style={{border:'1px solid var(--hair)', borderRadius:16, background:'var(--nk-card)', overflow:'hidden', boxShadow:'var(--shadow-lg)'}}>
          {/* Header */}
          <div style={{textAlign:'center', padding:'32px 24px 24px', borderBottom:'1px solid var(--hair-soft)'}}>
            <div style={{width:64, height:64, background:'rgba(47,214,163,0.20)', border:'1px solid rgba(47,214,163,0.20)', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px'}}>
              <i className="ph-fill ph-check" style={{fontSize:28, color:'var(--pos)'}} />
            </div>
            <h1 style={{fontSize:28, fontWeight:700, fontFamily:'var(--font-heading)', color:'var(--pos)', marginBottom:8}}>Assinatura Confirmada!</h1>
            <p style={{fontSize:16, color:'var(--color-neutral-500)'}}>
              Bem-vindo ao{' '}
              <span style={{fontWeight:500, color:'inherit'}}>{subscriptionDetails?.planName}</span>
            </p>
          </div>

          <div style={{padding:24, display:'flex', flexDirection:'column', gap:20}}>
            {/* Plan details */}
            <div style={{background:'var(--surf-3)', borderRadius:10, padding:24, display:'flex', flexDirection:'column', gap:16}}>
              <div style={{display:'flex', alignItems:'center', justifyContent:'space-between'}}>
                <div style={{display:'flex', alignItems:'center', gap:12}}>
                  <i className="ph-fill ph-crown" style={{fontSize:22, color:'var(--ac)'}} />
                  <div>
                    <h3 style={{fontSize:18, fontFamily:'var(--font-heading)', fontWeight:600}}>{subscriptionDetails?.planName}</h3>
                    <p style={{color:'var(--color-neutral-500)', fontSize:13}}>
                      {formatCurrency(subscriptionDetails?.amount || 0)}/{subscriptionDetails?.interval === 'month' ? 'mês' : 'ano'}
                    </p>
                  </div>
                </div>
                <span style={{padding:'3px 10px', borderRadius:6, fontSize:11.5, fontWeight:600,
                  background: subscriptionDetails?.status === 'active' ? 'var(--badge-pos-bg)' : 'var(--surf-3)',
                  color: subscriptionDetails?.status === 'active' ? 'var(--pos)' : 'var(--color-neutral-400)'}}>
                  {subscriptionDetails?.status === 'active' ? 'Ativo' : 'Pendente'}
                </span>
              </div>
              <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, paddingTop:16, borderTop:'1px solid var(--hair-soft)'}}>
                <div>
                  <p style={{fontSize:12.5, fontWeight:500, color:'var(--color-neutral-500)'}}>Próxima cobrança</p>
                  <p style={{fontSize:15, fontWeight:600, display:'flex', alignItems:'center', gap:4, marginTop:2}}>
                    <i className="ph-fill ph-calendar" style={{fontSize:14, color:'var(--ac)'}} />
                    {formatDate(subscriptionDetails?.nextBilling || '')}
                  </p>
                </div>
                <div>
                  <p style={{fontSize:12.5, fontWeight:500, color:'var(--color-neutral-500)'}}>ID da Sessão</p>
                  <p style={{fontSize:12, fontFamily:'monospace', background:'var(--surf-2)', padding:'2px 6px', borderRadius:4, marginTop:2, wordBreak:'break-all'}}>
                    {sessionId?.slice(0, 20)}...
                  </p>
                </div>
              </div>
            </div>

            {/* Features list */}
            {subscriptionDetails?.features && subscriptionDetails.features.length > 0 && (
              <div style={{border:'1px solid var(--hair)', borderRadius:12, padding:24}}>
                <h4 style={{fontSize:15, fontFamily:'var(--font-heading)', fontWeight:600, marginBottom:16}}>Recursos inclusos na sua assinatura:</h4>
                <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(180px, 1fr))', gap:12}}>
                  {subscriptionDetails.features.map((feature: string, index: number) => (
                    <div key={index} style={{display:'flex', alignItems:'center', gap:8}}>
                      <div style={{width:20, height:20, background:'rgba(47,214,163,0.20)', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0}}>
                        <i className="ph-fill ph-check" style={{fontSize:11, color:'var(--pos)'}} />
                      </div>
                      <span style={{fontSize:13, color:'var(--color-neutral-500)'}}>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Next steps */}
            <div style={{background:'rgba(145,132,217,0.15)', borderRadius:10, padding:24}}>
              <h4 style={{fontSize:15, fontWeight:600, marginBottom:12}}>Próximos passos:</h4>
              <div style={{display:'flex', flexDirection:'column', gap:8}}>
                {['Conecte suas contas de investimento','Configure suas preferências de análise','Explore os insights de IA personalizados'].map((step, i) => (
                  <div key={i} style={{display:'flex', alignItems:'center', gap:12}}>
                    <div style={{width:24, height:24, background:'var(--ac)', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0}}>
                      <span style={{fontSize:11, fontWeight:700, color:'#fff'}}>{i+1}</span>
                    </div>
                    <span style={{fontSize:13}}>{step}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Action buttons */}
            <div style={{display:'flex', flexWrap:'wrap', gap:10}}>
              <button type="button" onClick={() => navigate('/dashboard')}
                style={{flex:1, minWidth:160, height:48, borderRadius:9, border:'none', background:'var(--grad-violet)', color:'#fff', fontSize:14, fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:6}}>
                <i className="ph-fill ph-arrow-right" style={{fontSize:16}} />Ir para Dashboard
              </button>
              <button type="button" onClick={() => navigate('/sync-accounts')}
                style={{height:48, padding:'0 20px', borderRadius:9, border:'1px solid var(--hair)', background:'transparent', fontSize:14, fontWeight:500, cursor:'pointer', color:'inherit'}}>
                Conectar Contas
              </button>
              <button type="button" onClick={() => toast.success('Recibo enviado por email!')}
                style={{height:48, padding:'0 16px', borderRadius:9, border:'1px solid var(--hair)', background:'transparent', fontSize:14, cursor:'pointer', color:'inherit', display:'flex', alignItems:'center', gap:6}}>
                <i className="ph-fill ph-download-simple" style={{fontSize:15}} />Recibo
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
