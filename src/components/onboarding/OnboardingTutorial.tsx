import {useEffect, useReducer} from 'react';
import {useLocation} from 'react-router-dom';
import * as DialogPrimitive from '@radix-ui/react-dialog';

/** Mesma chave do protótipo: quem marcou "Não mostrar novamente" não vê de novo. */
export const TUTORIAL_SEEN_KEY = 'tkr_tutorial_seen';
export const OPEN_TUTORIAL_EVENT = 'trackerr:open-tutorial';
const AUTO_OPEN_DELAY_MS = 900;

type Illustration = 'dashboard' | 'copilot' | 'ri' | 'close';

const STEPS: {title: string; body: string; illustration: Illustration}[] = [
  {title: 'Bem-vindo ao Trackerr', body: 'Sua carteira inteira em um só lugar, com patrimônio e alocação sempre atualizados.', illustration: 'dashboard'},
  {title: 'Copiloto de investimentos', body: 'Um copiloto de IA lê sua carteira e explica riscos e oportunidades em linguagem simples.', illustration: 'copilot'},
  {title: 'RI Inteligente', body: 'Indicadores de mercado e releases das empresas, resumidos por IA, direto na sua tela.', illustration: 'ri'},
  {title: 'Você está no controle', body: 'Importe suas notas e extratos da B3 e deixe a leitura da carteira com a gente.', illustration: 'close'},
];

const BARS = [
  {h: '60%', color: 'var(--ac)', delay: '0s'},
  {h: '35%', color: 'var(--cy)', delay: '0.08s'},
  {h: '48%', color: 'var(--pos)', delay: '0.16s'},
  {h: '22%', color: 'var(--warn)', delay: '0.24s'},
  {h: '15%', color: 'var(--ac-strong)', delay: '0.32s'},
];

// Animações do handoff (tutBarGrow, tutTypeReveal, tutDraw). Respeitam quem pede menos movimento.
const KEYFRAMES = `
@keyframes tutBarGrow { from { transform: scaleY(0); transform-origin: bottom; opacity: 0; } to { transform: scaleY(1); transform-origin: bottom; opacity: 1; } }
@keyframes tutTypeReveal { from { width: 0; } to { width: 100%; } }
@keyframes tutDraw { from { stroke-dashoffset: 500; } to { stroke-dashoffset: 0; } }
@media (prefers-reduced-motion: reduce) { [data-tut-anim] { animation: none !important; } }
`;

interface State {
  open: boolean;
  step: number;
  dontShow: boolean;
}

type Action = {type: 'open'} | {type: 'close'} | {type: 'next'} | {type: 'prev'} | {type: 'toggle-dont-show'};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'open':
      return {...state, open: true, step: 0};
    case 'close':
      return {...state, open: false};
    case 'next':
      return {...state, step: Math.min(state.step + 1, STEPS.length - 1)};
    case 'prev':
      return {...state, step: Math.max(state.step - 1, 0)};
    case 'toggle-dont-show':
      return {...state, dontShow: !state.dontShow};
  }
}

function hasSeenTutorial(): boolean {
  try {
    return localStorage.getItem(TUTORIAL_SEEN_KEY) === '1';
  } catch {
    return true;
  }
}

export function openTutorial() {
  window.dispatchEvent(new Event(OPEN_TUTORIAL_EVENT));
}

function StepIllustration({kind}: {kind: Illustration}) {
  if (kind === 'dashboard') {
    return (
      <div style={{padding: 16, display: 'flex', flexDirection: 'column', gap: 10, height: '100%'}}>
        <div style={{fontSize: 9.5, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-neutral-600)'}}>Patrimônio</div>
        <div style={{fontFamily: 'var(--font-heading)', fontSize: 20, fontWeight: 600}}>R$ 1.284.930</div>
        <div style={{display: 'flex', alignItems: 'flex-end', gap: 10, height: 76, flex: 1}}>
          {BARS.map((bar) => (
            <div key={bar.delay} data-tut-anim style={{width: 22, borderRadius: 5, background: bar.color, height: bar.h, animation: `tutBarGrow 1.1s ease-out ${bar.delay} both`}} />
          ))}
        </div>
      </div>
    );
  }
  if (kind === 'copilot') {
    return (
      <div style={{padding: 16, display: 'flex', flexDirection: 'column', gap: 10, height: '100%'}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 8}}>
          <i className="ph-fill ph-sparkle" style={{fontSize: 15, color: 'var(--color-accent-300)'}} aria-hidden />
          <div style={{fontSize: 12.5, fontWeight: 600}}>Copiloto</div>
        </div>
        <div style={{border: '1px solid rgba(152,160,171,0.28)', borderRadius: 8, background: 'var(--surf-2)', padding: 12, fontSize: 12.5, lineHeight: 1.5, color: 'var(--color-neutral-200)', overflow: 'hidden'}}>
          <span data-tut-anim style={{display: 'inline-block', animation: 'tutTypeReveal 1.6s steps(40,end) 0.2s both', whiteSpace: 'nowrap', overflow: 'hidden', maxWidth: '100%'}}>
            PETR4 concentra 19,4% do seu VaR — considere diversificar.
          </span>
        </div>
      </div>
    );
  }
  if (kind === 'ri') {
    return (
      <div style={{padding: 16, display: 'flex', flexDirection: 'column', gap: 10, height: '100%'}}>
        <div style={{fontSize: 9.5, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-neutral-600)'}}>RI Inteligente · Ibovespa</div>
        <div style={{fontFamily: 'var(--font-heading)', fontSize: 20, fontWeight: 600}}>131.920 pts</div>
        <svg width="100%" height="60" viewBox="0 0 280 60" style={{overflow: 'visible'}} aria-hidden>
          <path d="M0 50 L40 42 L80 45 L120 28 L160 32 L200 14 L240 20 L280 6" fill="none" stroke="var(--cy)" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={500} data-tut-anim style={{animation: 'tutDraw 1.4s ease-out 0.2s both'}} />
        </svg>
      </div>
    );
  }
  return (
    <div style={{padding: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, height: '100%', textAlign: 'center'}}>
      <i className="ph-fill ph-check-circle" data-tut-anim style={{fontSize: 30, color: 'var(--pos)', animation: 'tutBarGrow 0.5s ease-out 0.1s both'}} aria-hidden />
      <div style={{fontSize: 12.5, color: 'var(--color-neutral-300)', maxWidth: 380, lineHeight: 1.5}}>
        Importe sua carteira e deixe a IA cuidar da leitura dos números.
      </div>
    </div>
  );
}

/**
 * Tutorial de primeiro acesso (design_handoff_trackerr/Trackerr App.dc.html,
 * `modalTutorial`). Abre sozinho no primeiro acesso ao Dashboard e pelo botão
 * "?" da topbar (evento `trackerr:open-tutorial`).
 */
export function OnboardingTutorial() {
  const {pathname} = useLocation();
  const [state, dispatch] = useReducer(reducer, {open: false, step: 0, dontShow: true});

  useEffect(() => {
    const onOpen = () => dispatch({type: 'open'});
    window.addEventListener(OPEN_TUTORIAL_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_TUTORIAL_EVENT, onOpen);
  }, []);

  useEffect(() => {
    if (pathname !== '/dashboard' || hasSeenTutorial()) return;
    const timer = setTimeout(() => dispatch({type: 'open'}), AUTO_OPEN_DELAY_MS);
    return () => clearTimeout(timer);
  }, [pathname]);

  const close = () => {
    if (state.dontShow) {
      try {
        localStorage.setItem(TUTORIAL_SEEN_KEY, '1');
      } catch {
        // sem armazenamento: o tutorial volta na próxima visita
      }
    }
    dispatch({type: 'close'});
  };

  const step = STEPS[state.step];
  const isLast = state.step === STEPS.length - 1;

  return (
    <DialogPrimitive.Root open={state.open} onOpenChange={(open) => (open ? dispatch({type: 'open'}) : close())}>
      <DialogPrimitive.Portal>
        <style>{KEYFRAMES}</style>
        <DialogPrimitive.Overlay style={{position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(var(--rgb-deep),0.72)', backdropFilter: 'blur(6px)'}} />
        <div style={{position: 'fixed', inset: 0, zIndex: 301, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32, pointerEvents: 'none'}}>
          <DialogPrimitive.Content
            aria-describedby="tutorial-body"
            style={{
              pointerEvents: 'auto',
              width: '100%',
              maxWidth: 560,
              border: '1px solid rgba(152,160,171,0.30)',
              borderRadius: 8,
              overflow: 'hidden',
              background: 'linear-gradient(160deg, rgba(var(--rgb-accent-deep),0.36) 0%, rgba(var(--rgb-surf-2),0.98) 44%), var(--surf-2)',
              boxShadow: 'var(--shadow-lg)',
              color: 'var(--color-text)',
              fontFamily: 'var(--font-body)',
            }}>
            <div style={{padding: '16.8px 22.4px', borderBottom: '1px solid var(--hair-soft)', display: 'flex', alignItems: 'flex-start', gap: 11.2}}>
              <div style={{width: 32, height: 32, borderRadius: 8, background: 'var(--grad-violet)', display: 'grid', placeItems: 'center', flexShrink: 0}}>
                <i className="ph-fill ph-compass" style={{fontSize: 16, color: 'var(--sunk)'}} aria-hidden />
              </div>
              <div style={{flex: 1}}>
                <DialogPrimitive.Title style={{fontFamily: 'var(--font-heading)', fontSize: 17, fontWeight: 600, letterSpacing: '-0.015em', margin: 0}}>
                  {step.title}
                </DialogPrimitive.Title>
                <div style={{fontSize: 12, color: 'var(--color-neutral-400)', marginTop: 3}}>
                  Passo {state.step + 1} de {STEPS.length} · conheça o Trackerr
                </div>
              </div>
              <button
                type="button"
                onClick={close}
                aria-label="Fechar"
                className="hover:border-[color:var(--color-accent-700)] hover:text-[color:var(--color-neutral-100)]"
                style={{width: 30, height: 30, borderRadius: 8, borderWidth: 1, borderStyle: 'solid', borderColor: 'var(--hair)', background: 'transparent', color: 'var(--color-neutral-400)', cursor: 'pointer', display: 'grid', placeItems: 'center'}}>
                <i className="ph ph-x" style={{fontSize: 14}} aria-hidden />
              </button>
            </div>

            <div style={{padding: 22.4, display: 'flex', flexDirection: 'column', gap: 16.8}}>
              <div key={state.step} style={{position: 'relative', height: 168, border: '1px solid var(--hair)', borderRadius: 8, background: 'var(--surf-3)', overflow: 'hidden'}}>
                <StepIllustration kind={step.illustration} />
              </div>
              <div id="tutorial-body" style={{fontSize: 13, color: 'var(--color-neutral-300)', lineHeight: 1.55}}>
                {step.body}
              </div>
              <div style={{display: 'flex', gap: 6, justifyContent: 'center'}} aria-hidden>
                {STEPS.map((item, index) => (
                  <span key={item.title} style={{width: 6, height: 6, borderRadius: '50%', background: index === state.step ? 'var(--ac)' : 'var(--hair)'}} />
                ))}
              </div>
            </div>

            <div style={{padding: '14px 22.4px', borderTop: '1px solid var(--hair-soft)', display: 'flex', alignItems: 'center', gap: 11.2}}>
              <label style={{display: 'flex', alignItems: 'center', gap: 6.4, fontSize: 11.5, color: 'var(--color-neutral-400)', cursor: 'pointer', flex: 1}}>
                <input
                  type="checkbox"
                  checked={state.dontShow}
                  onChange={() => dispatch({type: 'toggle-dont-show'})}
                  style={{width: 14, height: 14, accentColor: 'var(--ac)'}}
                />
                Não mostrar novamente
              </label>
              {state.step > 0 && (
                <button
                  type="button"
                  onClick={() => dispatch({type: 'prev'})}
                  className="hover:border-[color:var(--color-accent-700)] hover:text-[color:var(--color-neutral-100)]"
                  style={{height: 34, padding: '0 14px', borderRadius: 8, borderWidth: 1, borderStyle: 'solid', borderColor: 'var(--hair)', background: 'transparent', color: 'var(--color-neutral-300)', fontFamily: 'var(--font-body)', fontSize: 12.5, cursor: 'pointer'}}>
                  Voltar
                </button>
              )}
              <button
                type="button"
                onClick={() => (isLast ? close() : dispatch({type: 'next'}))}
                className="hover:brightness-[1.08]"
                style={{height: 34, padding: '0 16.8px', borderRadius: 8, border: 'none', background: 'var(--grad-violet)', color: 'var(--sunk)', fontFamily: 'var(--font-body)', fontSize: 12.5, fontWeight: 600, cursor: 'pointer'}}>
                {isLast ? 'Concluir' : 'Próximo'}
              </button>
            </div>
          </DialogPrimitive.Content>
        </div>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
