/** Marca do handoff (Trackerr Landing.dc.html, header e rodapé). */
export function TrackerrMark({size = 28}: {size?: number}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      aria-hidden="true"
      focusable="false"
      style={{flexShrink: 0, color: 'var(--color-text)'}}>
      <circle
        cx="60"
        cy="60"
        r="24"
        fill="none"
        stroke="currentColor"
        strokeOpacity="0.2"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <path
        d="M 60 22 A 38 38 0 0 1 98 60"
        fill="none"
        stroke="var(--color-accent)"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <circle cx="60" cy="60" r="7" fill="var(--color-accent)" />
    </svg>
  );
}
