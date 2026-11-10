// „Preskoči na sadržaj“ i „Preskoči na kontrole priče“: prvi fokusabilni linkovi na stranici (DOM redosled sadržaja se ne menja).
// href je „#“ (ne menja rutu); klik premešta fokus.
const TRAKA = '[data-traka-price] button:not([disabled]), [data-traka-telefon] button:not([disabled]), [data-pilula-koraka]'

export function SkipLinkovi({ saTrakom }: { saTrakom: boolean }) {
  const na = (trazi: () => HTMLElement | null) => (e: { preventDefault: () => void }) => {
    e.preventDefault()
    trazi()?.focus()
  }
  return (
    <nav className="skip-linkovi" aria-label="Preskakanje">
      <a href="#" className="skip-link" onClick={na(() => document.getElementById('sadrzaj'))}>
        Preskoči na sadržaj
      </a>
      {saTrakom && (
        <a href="#" className="skip-link" onClick={na(() => [...document.querySelectorAll<HTMLElement>(TRAKA)].find((e) => !e.closest('[inert], [aria-hidden=true]')) ?? null)}>
          Preskoči na kontrole priče
        </a>
      )}
    </nav>
  )
}
