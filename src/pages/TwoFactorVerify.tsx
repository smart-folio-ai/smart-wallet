import React, {useState, useRef} from 'react';
import {useNavigate} from 'react-router-dom';
import {api} from '@/server/api/api';
import useAppToast from '@/hooks/use-app-toast';

export default function TwoFactorVerify() {
  const navigate = useNavigate();
  const toast = useAppToast();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const tempToken =
    new URLSearchParams(window.location.search).get('tempToken') ||
    sessionStorage.getItem('2fa_temp_token') ||
    '';

  const handleVerify = async () => {
    if (code.length !== 6) {
      toast.error(
        'Código inválido',
        'Digite os 6 dígitos do seu aplicativo autenticador.',
      );
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/auth/2fa/authenticate', {
        tempToken,
        code,
      });

      const {accessToken, refreshToken} = response.data;
      localStorage.setItem('access_token', accessToken);
      localStorage.setItem('refresh_token', refreshToken);
      sessionStorage.removeItem('2fa_temp_token');

      toast.success('Autenticação concluída!', 'Bem-vindo ao Trackerr.');
      navigate('/dashboard', {replace: true});
    } catch {
      toast.error(
        'Não foi possível validar o código',
        'Confira os 6 dígitos do app autenticador e tente novamente.',
      );
      setCode('');
      inputRef.current?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleVerify();
  };

  return (
    <div style={{minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--surf-1)', padding:'0 16px'}}>
      <style>{'@keyframes spin{to{transform:rotate(360deg)}}'}</style>
      <div style={{width:'100%', maxWidth:420, display:'flex', flexDirection:'column', gap:24}}>
        {/* Icon + heading */}
        <div style={{textAlign:'center', display:'flex', flexDirection:'column', gap:8, alignItems:'center'}}>
          <div style={{width:64, height:64, borderRadius:16, background:'rgba(145,132,217,0.15)', display:'flex', alignItems:'center', justifyContent:'center'}}>
            <i className="ph-fill ph-shield-check" style={{fontSize:32, color:'var(--ac)'}} />
          </div>
          <h1 style={{fontSize:22, fontWeight:700, fontFamily:'var(--font-heading)'}}>Verificação em Dois Fatores</h1>
          <p style={{fontSize:13, color:'var(--color-neutral-500)'}}>Abra seu aplicativo autenticador e insira o código de 6 dígitos</p>
        </div>

        {/* Card */}
        <div style={{border:'1px solid var(--hair)', borderRadius:14, background:'var(--nk-card)', overflow:'hidden', boxShadow:'var(--shadow-sm)'}}>
          <div style={{padding:'20px 24px 12px', textAlign:'center', borderBottom:'1px solid var(--hair-soft)'}}>
            <p style={{fontWeight:600, fontSize:14}}>Código de verificação</p>
            <p style={{fontSize:12, color:'var(--color-neutral-500)', marginTop:4}}>Google Authenticator, Authy ou similar</p>
          </div>
          <div style={{padding:'16px 24px', display:'flex', flexDirection:'column', gap:12}}>
            <div style={{display:'flex', flexDirection:'column', gap:6}}>
              <label htmlFor="code" style={{fontSize:12, fontWeight:500, color:'var(--color-neutral-500)'}}>Código de 6 dígitos</label>
              <input
                ref={inputRef}
                id="code"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                placeholder="000000"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                onKeyDown={handleKeyDown}
                autoFocus
                autoComplete="one-time-code"
                style={{width:'100%', height:54, textAlign:'center', fontSize:24, letterSpacing:'0.3em', fontFamily:'monospace', border:'1px solid var(--hair)', borderRadius:8, background:'var(--surf-3)', color:'inherit', outline:'none', boxSizing:'border-box' as const}}
              />
            </div>
          </div>
          <div style={{padding:'0 24px 20px', display:'flex', flexDirection:'column', gap:8}}>
            <button
              type="button"
              onClick={handleVerify}
              disabled={loading || code.length !== 6}
              style={{width:'100%', height:44, borderRadius:8, border:'none', background: (loading || code.length !== 6) ? 'var(--surf-3)' : 'var(--grad-violet)', color: (loading || code.length !== 6) ? 'var(--color-neutral-500)' : '#fff', fontSize:14, fontWeight:600, cursor: (loading || code.length !== 6) ? 'not-allowed' : 'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:6}}
            >
              {loading ? (
                <><i className="ph-fill ph-spinner" style={{fontSize:15, animation:'spin 0.8s linear infinite'}} />Verificando...</>
              ) : 'Verificar Código'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/login')}
              style={{background:'none', border:'none', cursor:'pointer', fontSize:13, color:'var(--color-neutral-500)', display:'flex', alignItems:'center', justifyContent:'center', gap:4, padding:'4px 0'}}
            >
              <i className="ph-fill ph-arrow-left" style={{fontSize:14}} />Voltar para o login
            </button>
          </div>
        </div>

        <p style={{textAlign:'center', fontSize:11.5, color:'var(--color-neutral-500)'}}>
          Não tem acesso ao seu aplicativo?{' '}
          <a href="mailto:suporte@trackerr.com.br" style={{color:'var(--ac)'}}>Contate o suporte</a>
        </p>
      </div>
    </div>
  );
}
