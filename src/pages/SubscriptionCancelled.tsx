import React from 'react';
import {useNavigate} from 'react-router-dom';
import {AppLogo} from '@/components/AppLogo';

export default function SubscriptionCancelled() {
  const navigate = useNavigate();

  const reasons = [
    {
      icon: <i className="ph-fill ph-credit-card" style={{fontSize:20, color:'var(--ac)'}} />,
      title: 'Problema com pagamento',
      description: 'Verifique se seus dados de pagamento estão corretos',
      action: () => navigate('/subscription'),
    },
    {
      icon: <i className="ph-fill ph-question" style={{fontSize:20, color:'var(--ac)'}} />,
      title: 'Precisa de mais informações',
      description: 'Conheça melhor nossos recursos e benefícios',
      action: () => navigate('/ai-insights'),
    },
    {
      icon: <i className="ph-fill ph-chat-circle" style={{fontSize:20, color:'var(--ac)'}} />,
      title: 'Falar com suporte',
      description: 'Nossa equipe pode esclarecer suas dúvidas',
      action: () => window.open('mailto:suporte@trackerr.com'),
    },
  ];

  return (
    <div style={{minHeight:'100dvh', display:'flex', alignItems:'center', justifyContent:'center', padding:16, background:'var(--surf-1)'}}>
      <div style={{width:'100%', maxWidth:672}}>
        <div style={{marginBottom:32, display:'flex', justifyContent:'center'}}>
          <AppLogo size="lg" />
        </div>
        <div style={{border:'1px solid var(--hair)', borderRadius:16, background:'var(--nk-card)', overflow:'hidden', boxShadow:'var(--shadow-lg)'}}>
          {/* Header */}
          <div style={{textAlign:'center', padding:'32px 24px 24px', borderBottom:'1px solid var(--hair-soft)'}}>
            <div style={{width:64, height:64, background:'var(--surf-3)', border:'1px solid var(--hair)', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px'}}>
              <i className="ph-fill ph-x" style={{fontSize:28, color:'var(--color-neutral-500)'}} />
            </div>
            <h1 style={{fontSize:28, fontWeight:700, fontFamily:'var(--font-heading)', marginBottom:8}}>Assinatura Cancelada</h1>
            <p style={{fontSize:16, color:'var(--color-neutral-500)'}}>Não se preocupe, você ainda pode assinar quando quiser</p>
          </div>

          {/* Content */}
          <div style={{padding:24, display:'flex', flexDirection:'column', gap:24}}>
            {/* Mensagem principal */}
            <div style={{textAlign:'center', background:'var(--surf-3)', border:'1px solid var(--hair)', borderRadius:12, padding:24}}>
              <h3 style={{fontSize:18, fontFamily:'var(--font-heading)', fontWeight:600, marginBottom:12}}>O que aconteceu?</h3>
              <p style={{color:'var(--color-neutral-500)', lineHeight:1.6, marginBottom:16}}>Sua assinatura foi cancelada e nenhuma cobrança foi realizada. Você pode tentar novamente a qualquer momento.</p>
              <p style={{fontSize:13, color:'var(--color-neutral-500)'}}>Seus dados estão seguros e você continua com acesso ao plano gratuito.</p>
            </div>

            {/* Possíveis razões */}
            <div>
              <h4 style={{fontSize:16, fontFamily:'var(--font-heading)', fontWeight:600, textAlign:'center', marginBottom:16}}>Como podemos ajudar?</h4>
              <div style={{display:'flex', flexDirection:'column', gap:12}}>
                {reasons.map((reason, index) => (
                  <button key={index} type="button" onClick={reason.action}
                    style={{display:'flex', alignItems:'center', gap:16, padding:16, border:'1px solid var(--hair)', borderRadius:10, background:'var(--nk-card)', cursor:'pointer', textAlign:'left', width:'100%', color:'inherit'}}>
                    <div style={{width:40, height:40, background:'rgba(145,132,217,0.15)', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0}}>
                      {reason.icon}
                    </div>
                    <div style={{flex:1}}>
                      <p style={{fontWeight:500, fontSize:14}}>{reason.title}</p>
                      <p style={{fontSize:12.5, color:'var(--color-neutral-500)', marginTop:2}}>{reason.description}</p>
                    </div>
                    <i className="ph-fill ph-arrow-right" style={{fontSize:16, color:'var(--color-neutral-400)'}} />
                  </button>
                ))}
              </div>
            </div>

            {/* Recursos perdidos — warn box */}
            <div style={{background:'var(--badge-warn-bg)', border:'1px solid var(--warn)', borderRadius:12, padding:24}}>
              <h4 style={{fontSize:16, fontFamily:'var(--font-heading)', fontWeight:600, textAlign:'center', marginBottom:16, color:'var(--warn)'}}>Recursos que você teria com o plano Premium:</h4>
              <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(200px, 1fr))', gap:10}}>
                {['Sincronização automática com B3','Insights de IA personalizados','Recomendações de compra/venda','Análise de preço justo','Alertas de oportunidades','Suporte prioritário'].map((feature, index) => (
                  <div key={index} style={{display:'flex', alignItems:'center', gap:8}}>
                    <div style={{width:8, height:8, borderRadius:'50%', background:'var(--warn)', flexShrink:0}} />
                    <span style={{fontSize:13}}>{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Ações */}
            <div style={{display:'flex', flexDirection:'column', gap:10}}>
              <button type="button" onClick={() => navigate('/subscription')}
                style={{width:'100%', height:48, borderRadius:9, border:'none', background:'var(--grad-violet)', color:'#fff', fontSize:14, fontWeight:600, cursor:'pointer'}}>
                Tentar Novamente
              </button>
              <button type="button" onClick={() => navigate('/dashboard')}
                style={{width:'100%', height:48, borderRadius:9, border:'1px solid var(--hair)', background:'transparent', fontSize:14, fontWeight:500, cursor:'pointer', color:'inherit'}}>
                Continuar Gratuito
              </button>
            </div>

            {/* Oferta especial */}
            <div style={{background:'rgba(145,132,217,0.15)', border:'1px solid rgba(145,132,217,0.35)', borderRadius:12, padding:24, textAlign:'center'}}>
              <h4 style={{fontSize:16, fontFamily:'var(--font-heading)', fontWeight:600, color:'var(--ac)', marginBottom:8}}>Oferta Especial</h4>
              <p style={{fontSize:13, color:'var(--color-neutral-500)', marginBottom:16}}>Que tal experimentar nosso plano gratuito por mais tempo? Você pode sempre fazer upgrade quando se sentir pronto.</p>
              <button type="button" onClick={() => navigate('/ai-insights')}
                style={{padding:'8px 20px', borderRadius:8, border:'1px solid rgba(145,132,217,0.35)', background:'transparent', fontSize:13, fontWeight:500, cursor:'pointer', color:'var(--ac)'}}>
                Explorar Recursos Gratuitos
              </button>
            </div>

            {/* Contato */}
            <div style={{textAlign:'center', paddingTop:16, borderTop:'1px solid var(--hair-soft)'}}>
              <p style={{fontSize:13, color:'var(--color-neutral-500)'}}>
                Ainda tem dúvidas? Fale conosco em{' '}
                <a href="mailto:suporte@trackerr.com" style={{color:'var(--ac)'}}>suporte@trackerr.com</a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
