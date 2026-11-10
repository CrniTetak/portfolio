// Simbol Nasetua (dizajn/LOGO.md): četiri ugla kadra + luk (otvor prostora). Isti oblik kao public/nasetu-simbol.svg,
// ali ugrađen u stranicu sa fill="currentColor", pa prati boju teksta (u zaglavlju terakota: text-akcent).
// aria-hidden jer je ime „Nasetu" uvek napisano pored kao tekst.
export function Simbol({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" fill="currentColor" aria-hidden="true" focusable="false" className={`shrink-0 ${className}`}>
      <path d="M4 4H22V11H11V22H4Z" />
      <path d="M60 4H42V11H53V22H60Z" />
      <path d="M4 60H22V53H11V42H4Z" />
      <path d="M60 60H42V53H53V42H60Z" />
      <path d="M22 46V30A10 10 0 0 1 42 30V46Z" />
    </svg>
  )
}

/** Veličina simbola uz ime u zaglavlju: 20 px ispod 360 px širine, 22 px na telefonu, 24 px od 640 px (jednako veličini slova imena). */
export const KLASA_SIMBOL_ZAGLAVLJE = 'h-5 w-5 text-akcent min-[360px]:h-[22px] min-[360px]:w-[22px] sm:h-6 sm:w-6'
