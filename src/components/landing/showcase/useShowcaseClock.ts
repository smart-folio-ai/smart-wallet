import {useEffect, useState, useSyncExternalStore, type RefObject} from 'react';

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

function subscribeReducedMotion(onChange: () => void): () => void {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return () => {};
  }
  const mql = window.matchMedia(REDUCED_MOTION_QUERY);
  mql.addEventListener?.('change', onChange);
  return () => mql.removeEventListener?.('change', onChange);
}

function getReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }
  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(subscribeReducedMotion, getReducedMotion, () => false);
}

function subscribeVisibility(onChange: () => void): () => void {
  if (typeof document === 'undefined') return () => {};
  document.addEventListener('visibilitychange', onChange);
  return () => document.removeEventListener('visibilitychange', onChange);
}

const getDocumentVisible = () =>
  typeof document === 'undefined' || document.visibilityState !== 'hidden';

/** true enquanto o elemento intersecta a viewport (true se não houver IntersectionObserver). */
function useInViewport(ref: RefObject<Element>): boolean {
  const [inView, setInView] = useState(true);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver((entries) => {
      const entry = entries[entries.length - 1];
      if (entry) setInView(entry.isIntersecting);
    });
    io.observe(el);
    return () => io.disconnect();
  }, [ref]);
  return inView;
}

interface ClockOptions {
  /** Duração do loop (segundos de reprodução). */
  duration: number;
  /** Quando false, o relógio congela no instante atual. */
  enabled: boolean;
  /** Elemento observado para pausar quando fora da tela. */
  targetRef: RefObject<Element>;
}

/**
 * Relógio em loop dirigido por requestAnimationFrame. Só avança enquanto
 * `enabled`, a aba está visível e o elemento está na viewport; ao retomar,
 * continua de onde parou (sem salto de tempo).
 */
export function useLoopClock({duration, enabled, targetRef}: ClockOptions): number {
  const [time, setTime] = useState(0);
  const docVisible = useSyncExternalStore(subscribeVisibility, getDocumentVisible, () => true);
  const inView = useInViewport(targetRef);
  const running = enabled && docVisible && inView;

  useEffect(() => {
    if (!running) return;
    let lastTs: number | null = null;
    let rafId = 0;
    const step = (ts: number) => {
      const dt = lastTs == null ? 0 : (ts - lastTs) / 1000;
      lastTs = ts;
      if (dt > 0) setTime((t) => (t + dt) % duration);
      rafId = requestAnimationFrame(step);
    };
    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, [running, duration]);

  return time;
}
