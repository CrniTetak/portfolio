// Logo koncept A "Putanja" kao INLINE SVG komponenta (koristi spakovani Inter, ne font strane).
// Znak: putanja koja se zavija i tirkizna tačka na kraju. Favicon: public/favicon.svg (iz koncept-a-znak.svg).

/** Znak bez pozadine (za tamno zaglavlje). */
export function LogoZnak({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 64" aria-hidden="true" focusable="false">
      <path d="M43.3 20.7 A16 16 0 1 0 48 32 H33" fill="none" stroke="#fff" strokeWidth="5.5" />
      <circle cx="33" cy="32" r="4.5" fill="#19B5A5" />
    </svg>
  )
}

/** Zaglavlje: znak + reč "GoalToCart" (reč se na telefonu skriva CSS-om). */
export function LogoZaglavlje() {
  return (
    <span className="logo">
      <LogoZnak />
      <span>GoalToCart</span>
    </span>
  )
}

/** Pun logo (koncept A, svetla podloga): mornarski kvadrat + znak + reč. */
export function LogoPun({ visina = 40 }: { visina?: number }) {
  return (
    <svg viewBox="0 0 330 80" height={visina} role="img" aria-label="GoalToCart">
      <g transform="translate(8 8)">
        <rect width="64" height="64" rx="14" fill="#12284B" />
        <path d="M43.3 20.7 A16 16 0 1 0 48 32 H33" fill="none" stroke="#FFFFFF" strokeWidth="5" />
        <circle cx="33" cy="32" r="4" fill="#19B5A5" />
      </g>
      <text
        x="88" y="53" fontSize="34" fontWeight="600" letterSpacing="-0.5" fill="#12284B"
        textLength="225" lengthAdjust="spacingAndGlyphs"
        style={{ fontFamily: "'Inter Variable', system-ui, 'Segoe UI', Arial, sans-serif" }}
      >
        GoalToCart
      </text>
    </svg>
  )
}
