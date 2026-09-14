/**
 * Composição do vídeo de produto — porta de
 * `design_handoff_trackerr/trackerr-video-piece.jsx`.
 *
 * Tudo é renderizado a partir do tempo autoral `T` (segundos). As cenas ficam
 * sempre montadas e sua visibilidade/opacidade é derivada de `T` e das cues.
 */
import type {CSSProperties, ReactNode} from 'react';
import logoSrc from './trackerr-logo.png';
import {MOTION, SHOWCASE_TIMELINE, clamp, type Cues} from './timeline';

const C = {
  bg: '#1b1b1d',
  surf: '#272729',
  surf2: '#222224',
  hair: 'rgba(234,234,236,0.10)',
  hairSoft: 'rgba(234,234,236,0.06)',
  text: '#e9e9ed',
  muted: '#9a9eac',
  faint: '#6b6f7a',
  ac: '#98a0ab',
  acStrong: '#7b8290',
  pos: '#2fd6a3',
  warn: '#f0b32e',
  cy: '#4cc9f0',
} as const;

export const SHOWCASE_BG = C.bg;

const HEAD = 'Inter, system-ui, sans-serif';

const CUES: Cues = SHOWCASE_TIMELINE.cues;
const TOTAL = SHOWCASE_TIMELINE.authoredTotal;

interface TimedProps {
  T: number;
}

interface StartProps extends TimedProps {
  start: number;
}

function fmtBRL(n: number): string {
  return 'R$ ' + Math.round(n).toLocaleString('pt-BR');
}

// ── Primitivas de composição (Shot / Captions do animations-v3) ─────────────

function Shot({T, from, to, children}: TimedProps & {from: number; to: number; children: ReactNode}) {
  const on = T >= from && T < to;
  return (
    <div style={{position: 'absolute', inset: 0, visibility: on ? 'visible' : 'hidden'}}>
      {children}
    </div>
  );
}

interface CaptionItem {
  at: number;
  until: number;
  text: string;
}

const CAPTION_FADE = 0.18;

function Captions({T, items}: TimedProps & {items: readonly CaptionItem[]}) {
  let active: CaptionItem | null = null;
  for (const item of items) {
    if (T < item.at) break;
    active = item;
  }
  if (!active || T >= active.until) return null;
  const o = clamp(
    Math.min((T - active.at) / CAPTION_FADE, (active.until - T) / CAPTION_FADE, 1),
    0,
    1,
  );
  return (
    <div
      data-testid="showcase-caption"
      style={{
        position: 'absolute',
        left: '8%',
        right: '8%',
        bottom: '7%',
        textAlign: 'center',
        opacity: o,
        pointerEvents: 'none',
        font: '500 30px ' + HEAD,
        color: '#f6f4ef',
        textShadow: '0 1px 14px rgba(0,0,0,0.45)',
      }}
    >
      {active.text}
    </div>
  );
}

const CAPTIONS: readonly CaptionItem[] = [
  {at: CUES.Carteira + 0.6, until: CUES.Graficos, text: 'Toda a carteira, em um só lugar.'},
  {at: CUES.Graficos + 0.2, until: CUES.Copiloto, text: 'Gráficos que se atualizam em tempo real.'},
  {at: CUES.Copiloto + 0.2, until: CUES.RI, text: 'Um copiloto que explica o porquê.'},
  {at: CUES.RI + 0.2, until: CUES.Encerramento, text: 'Pesquisa e indicadores direto na sua tela.'},
];

// ── Cenas ──────────────────────────────────────────────────────────────────

function IntroLogo({T}: TimedProps) {
  const closing = T >= CUES.Carteira;
  const openIn = MOTION.enter(T, [[0.15, 0], [1.0, 1]]);
  const openOut = 1 - MOTION.enter(T, [[CUES.Carteira - 1.15, 0], [CUES.Carteira - 0.4, 1]]);
  const closeIn = MOTION.enter(T, [[CUES.Encerramento + 0.25, 0], [CUES.Encerramento + 1.1, 1]]);
  const closeOut = 1 - MOTION.enter(T, [[TOTAL - 0.85, 0], [TOTAL - 0.1, 1]]);
  const o = !closing ? openIn * openOut : closeIn * closeOut;
  const subOpacity = !closing
    ? MOTION.enter(T, [[1.0, 0], [1.6, 1]]) * openOut
    : MOTION.enter(T, [[CUES.Encerramento + 1.3, 0], [CUES.Encerramento + 1.9, 1]]) * closeOut;
  if (o < 0.01 && subOpacity < 0.01) return null;
  const logoSize = closing ? 48 : 52;
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 18,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          opacity: o,
          transform: 'translateY(' + (1 - o) * 14 + 'px)',
        }}
      >
        <img src={logoSrc} alt="" style={{width: logoSize, height: logoSize, borderRadius: 12}} />
        <div style={{font: '600 44px ' + HEAD, color: C.text, letterSpacing: '-0.02em'}}>Trackerr</div>
      </div>
      <div
        style={{
          font: '500 20px ' + HEAD,
          color: C.muted,
          opacity: subOpacity,
          textAlign: 'center',
          maxWidth: 560,
        }}
      >
        {closing ? 'Seu copiloto financeiro' : '90 segundos para entender a plataforma'}
      </div>
    </div>
  );
}

const ASSETS = [
  {label: 'Ações', pct: 42, color: C.ac},
  {label: 'FIIs', pct: 23, color: C.cy},
  {label: 'Renda Fixa', pct: 20, color: C.pos},
  {label: 'Cripto', pct: 9, color: C.warn},
  {label: 'Caixa', pct: 6, color: C.acStrong},
] as const;

function Bars({T, start}: StartProps) {
  const maxH = 128;
  return (
    <div style={{display: 'flex', alignItems: 'flex-end', gap: 22, height: maxH + 26}}>
      {ASSETS.map((a, i) => {
        const g = MOTION.draw(T, start + 0.35 + i * 0.13, start + 1.35 + i * 0.13);
        const h = (a.pct / 42) * maxH * g;
        return (
          <div
            key={a.label}
            style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, width: 48}}
          >
            <div style={{height: maxH, display: 'flex', alignItems: 'flex-end'}}>
              <div style={{width: 32, height: h, borderRadius: 6, background: a.color, opacity: 0.9}} />
            </div>
            <div style={{font: '500 11px ' + HEAD, color: C.faint, textAlign: 'center'}}>{a.label}</div>
          </div>
        );
      })}
    </div>
  );
}

const eyebrow: CSSProperties = {
  font: '500 12px ' + HEAD,
  color: C.faint,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
};

function CarteiraScreen({T, start}: StartProps) {
  const value = MOTION.enter(T, [[start + 0.25, 0], [start + 2.1, 1284930]]);
  const badgeO = MOTION.pop(T, start + 2.15, start + 2.55);
  return (
    <div style={{padding: '26px 30px', display: 'flex', flexDirection: 'column', gap: 22, height: '100%'}}>
      <div>
        <div style={eyebrow}>Patrimônio</div>
        <div style={{display: 'flex', alignItems: 'baseline', gap: 12, marginTop: 6}}>
          <div
            style={{
              font: '600 34px ' + HEAD,
              color: C.text,
              letterSpacing: '-0.02em',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {fmtBRL(value)}
          </div>
          <div style={{font: '600 15px ' + HEAD, color: C.pos, opacity: badgeO}}>+17,1%</div>
        </div>
      </div>
      <Bars T={T} start={start} />
    </div>
  );
}

const LINE_POINTS = [
  [0, 92],
  [40, 78],
  [80, 84],
  [120, 55],
  [160, 62],
  [200, 30],
  [240, 38],
  [280, 12],
] as const;
const LINE_PATH = 'M ' + LINE_POINTS.map((p) => p[0] + ' ' + p[1]).join(' L ');

function LineChart({T, start, end, color = C.pos}: StartProps & {end: number; color?: string}) {
  const g = MOTION.draw(T, start, end);
  return (
    <svg width="280" height="100" viewBox="0 0 280 100" style={{overflow: 'visible'}}>
      <path
        d={LINE_PATH}
        fill="none"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="600"
        strokeDashoffset={600 * (1 - g)}
      />
    </svg>
  );
}

function GraficosOverlay({T, start}: StartProps) {
  const tagO = MOTION.pop(T, start + 3.5, start + 3.9);
  return (
    <div
      style={{
        position: 'absolute',
        right: 30,
        top: 118,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: 8,
      }}
    >
      <LineChart T={T} start={start + 0.3} end={start + 3.4} />
      <div
        style={{
          font: '600 12px ' + HEAD,
          color: C.pos,
          opacity: tagO,
          background: 'rgba(47,214,163,0.12)',
          border: '1px solid rgba(47,214,163,0.3)',
          borderRadius: 6,
          padding: '4px 10px',
        }}
      >
        +17,1% no ano
      </div>
    </div>
  );
}

const COPILOT_MSG = 'PETR4 concentra 19,4% do seu VaR — considere diversificar.';

function CopilotoScreen({T, start}: StartProps) {
  const slide = MOTION.enter(T, [[start - 0.3, 0], [start + 0.6, 1]]);
  const typeP = clamp((T - (start + 0.9)) / 2.0, 0, 1);
  const shown = COPILOT_MSG.slice(0, Math.round(COPILOT_MSG.length * typeP));
  const pulse = 1 + Math.sin(T * 4) * 0.08;
  return (
    <div
      style={{
        padding: '26px 30px',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        opacity: slide,
        transform: 'translateY(' + (1 - slide) * 18 + 'px)',
      }}
    >
      <div style={{display: 'flex', alignItems: 'center', gap: 10}}>
        <div
          style={{
            width: 30,
            height: 30,
            borderRadius: 8,
            background: 'rgba(69,74,83,0.5)',
            border: '1px solid rgba(152,160,171,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transform: 'scale(' + pulse + ')',
          }}
        >
          <i className="ph-fill ph-sparkle" style={{fontSize: 15, color: C.ac}} />
        </div>
        <div style={{font: '600 14px ' + HEAD, color: C.text}}>Copiloto</div>
      </div>
      <div
        style={{
          maxWidth: 380,
          border: '1px solid rgba(152,160,171,0.28)',
          borderRadius: 10,
          background: C.surf2,
          padding: 16,
          font: '500 15px ' + HEAD,
          color: C.text,
          lineHeight: 1.5,
          minHeight: 60,
        }}
      >
        {shown}
      </div>
    </div>
  );
}

function Pill({o, children}: {o: number; children: ReactNode}) {
  return (
    <div
      style={{
        font: '600 12px ' + HEAD,
        color: C.text,
        background: C.surf2,
        border: '1px solid ' + C.hair,
        borderRadius: 999,
        padding: '6px 12px',
        opacity: o,
      }}
    >
      {children}
    </div>
  );
}

const RI_PILLS = [
  {text: 'PETR4 · relatório novo', d: 0.5},
  {text: 'Selic 10,75%', d: 0.8},
  {text: 'IPCA 4,2%', d: 1.1},
] as const;

function RIScreen({T, start}: StartProps) {
  const ibov = MOTION.enter(T, [[start + 0.2, 128400], [start + 1.6, 131920]]);
  return (
    <div style={{padding: '26px 30px', height: '100%', display: 'flex', flexDirection: 'column', gap: 20}}>
      <div>
        <div style={eyebrow}>RI Inteligente · Ibovespa</div>
        <div
          style={{
            font: '600 30px ' + HEAD,
            color: C.text,
            marginTop: 6,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {Math.round(ibov).toLocaleString('pt-BR')} pts
        </div>
      </div>
      <LineChart T={T} start={start + 0.3} end={start + 2.4} color={C.cy} />
      <div style={{display: 'flex', gap: 8, flexWrap: 'wrap'}}>
        {RI_PILLS.map((p) => (
          <Pill key={p.text} o={MOTION.pop(T, start + p.d, start + p.d + 0.4)}>
            {p.text}
          </Pill>
        ))}
      </div>
    </div>
  );
}

const dot: CSSProperties = {width: 7, height: 7, borderRadius: '50%', background: C.hair};

function DeviceFrame({T}: TimedProps) {
  const frameIn = MOTION.enter(T, [[CUES.Carteira - 0.4, 0], [CUES.Carteira + 0.3, 1]]);
  const frameOut = 1 - MOTION.enter(T, [[CUES.Encerramento - 0.3, 0], [CUES.Encerramento + 0.5, 1]]);
  const o = frameIn * frameOut;
  if (o < 0.01) return null;
  // zoom de câmera durante a cena Graficos, atravessando as duas fronteiras
  const zoom = MOTION.enter(T, [
    [CUES.Graficos - 0.3, 1],
    [CUES.Graficos + 0.9, 1.22],
    [CUES.Copiloto - 0.5, 1.22],
    [CUES.Copiloto + 0.3, 1],
  ]);
  const riIn = MOTION.enter(T, [[CUES.RI - 0.3, 0], [CUES.RI + 0.5, 1]]);
  const copilotoOut = 1 - riIn;
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: o,
        transform: 'scale(' + (0.94 + o * 0.06) + ')',
      }}
    >
      <div
        style={{
          width: 620,
          height: 400,
          transform: 'scale(' + zoom + ')',
          borderRadius: 14,
          border: '1px solid rgba(152,160,171,0.35)',
          background: 'linear-gradient(180deg, ' + C.surf + ' 0%, ' + C.surf2 + ' 100%)',
          boxShadow: '0 28px 72px rgba(0,0,0,0.5)',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <div
          style={{
            height: 34,
            borderBottom: '1px solid ' + C.hairSoft,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '0 14px',
          }}
        >
          <div style={{display: 'flex', gap: 5}}>
            <span style={dot} />
            <span style={dot} />
            <span style={dot} />
          </div>
          <div style={{font: '500 11px ' + HEAD, color: C.faint, margin: '0 auto'}}>app.trackerr.com.br</div>
        </div>
        <div style={{position: 'relative', height: 'calc(100% - 34px)'}}>
          <Shot T={T} from={CUES.Carteira - 1} to={CUES.Copiloto}>
            <CarteiraScreen T={T} start={CUES.Carteira} />
            <GraficosOverlay T={T} start={CUES.Graficos} />
          </Shot>
          <div style={{position: 'absolute', inset: 0, opacity: copilotoOut}}>
            <CopilotoScreen T={T} start={CUES.Copiloto} />
          </div>
          <div style={{position: 'absolute', inset: 0, opacity: riIn}}>
            <RIScreen T={T} start={CUES.RI} />
          </div>
        </div>
      </div>
    </div>
  );
}

/** Quadro 1280×720 da composição no tempo autoral `T`. */
export function ShowcaseComposition({T}: TimedProps) {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: 'radial-gradient(1100px 620px at 20% -10%, #2a2a2d 0%, rgba(69,74,83,0) 60%), ' + C.bg,
        overflow: 'hidden',
      }}
    >
      <IntroLogo T={T} />
      <DeviceFrame T={T} />
      <Captions T={T} items={CAPTIONS} />
    </div>
  );
}
