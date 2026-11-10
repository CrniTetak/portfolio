// "Skip to content" i "Skip to story controls": prvi fokusabilni linkovi na stranici (DOM redosled sadržaja se ne menja).
// href je "#" (ne menja rutu); klik premešta fokus.
const TRAKA = '[data-traka-price] button:not([disabled]), [data-traka-telefon] button:not([disabled]), [data-pilula-koraka]'

export function SkipLinkovi({ saTrakom }: { saTrakom: boolean }) {
  const na = (trazi: () => HTMLElement | null) => (e: { preventDefault: () => void }) => {
    e.preventDefault()
    trazi()?.focus()
  }
  return (
    <div className="skip-linkovi">
      <a href="#" className="skip-link" onClick={na(() => document.getElementById('sadrzaj'))}>
        Skip to content
      </a>
      {saTrakom && (
        <a href="#" className="skip-link" onClick={na(() => [...document.querySelectorAll<HTMLElement>(TRAKA)].find((e) => !e.closest('[inert], [aria-hidden=true]')) ?? null)}>
          Skip to story controls
        </a>
      )}
    </div>
  )
}
