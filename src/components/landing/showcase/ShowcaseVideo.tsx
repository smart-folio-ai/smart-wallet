import {useLayoutEffect, useRef, type CSSProperties, type RefObject} from 'react';
import {SHOWCASE_BG, ShowcaseComposition} from './ShowcaseComposition';
import {SHOWCASE_TIMELINE, warpTime} from './timeline';
import {useLoopClock, usePrefersReducedMotion} from './useShowcaseClock';

const STAGE_W = 1280;
const STAGE_H = 720;

/** Quadro estático (tempo autoral) exibido com prefers-reduced-motion: cena Carteira já assentada. */
export const SHOWCASE_STATIC_T = SHOWCASE_TIMELINE.cues.Carteira + 3.4;

export interface ShowcaseVideoProps {
  className?: string;
  style?: CSSProperties;
  /** Pausa a reprodução no quadro atual. */
  paused?: boolean;
}

/** Ajusta o palco 1280×720 ao tamanho do contêiner via transform (sem re-render). */
function useFitStage(
  containerRef: RefObject<HTMLDivElement>,
  stageRef: RefObject<HTMLDivElement>,
) {
  useLayoutEffect(() => {
    const container = containerRef.current;
    const stage = stageRef.current;
    if (!container || !stage) return;
    const measure = () => {
      const s = Math.max(
        0.05,
        Math.min(container.clientWidth / STAGE_W, container.clientHeight / STAGE_H),
      );
      stage.style.transform = `translate(-50%, -50%) scale(${s})`;
    };
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(measure);
    ro.observe(container);
    return () => ro.disconnect();
  }, [containerRef, stageRef]);
}

/**
 * Vídeo de produto da Landing (porta de `Trackerr Showcase Video.dc.html`).
 * Preenche o elemento pai (que deve ser `position: relative` com 16:9) e
 * reproduz em loop; pausa com a aba oculta ou fora da tela.
 */
export function ShowcaseVideo({className, style, paused = false}: ShowcaseVideoProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const reducedMotion = usePrefersReducedMotion();
  const time = useLoopClock({
    duration: SHOWCASE_TIMELINE.total,
    enabled: !paused && !reducedMotion,
    targetRef: containerRef,
  });
  useFitStage(containerRef, stageRef);

  const T = reducedMotion ? SHOWCASE_STATIC_T : warpTime(SHOWCASE_TIMELINE, time);

  return (
    <div
      ref={containerRef}
      role="img"
      aria-label="Demonstração do Trackerr: carteira, gráficos, copiloto de IA e RI Inteligente"
      data-state={reducedMotion ? 'static' : paused ? 'paused' : 'playing'}
      className={className}
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        background: SHOWCASE_BG,
        fontFamily: 'Inter, system-ui, sans-serif',
        ...style,
      }}
    >
      <div
        ref={stageRef}
        aria-hidden="true"
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          width: STAGE_W,
          height: STAGE_H,
          transformOrigin: 'center',
          background: SHOWCASE_BG,
          overflow: 'hidden',
        }}
      >
        <ShowcaseComposition T={T} />
      </div>
    </div>
  );
}

export default ShowcaseVideo;
