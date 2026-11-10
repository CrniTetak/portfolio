// Fiksna traka na vrhu SVAKOG ekrana (UI 7.13). Tekst se ne skraćuje; ne sme se uklanjati radi lepšeg izgleda.
export function OznakaDemoa() {
  return (
    <div className="demo-strip" role="region" aria-label="Demo notice" data-oznaka-demoa>
      Demo — illustrative only. Fictional data. Not an offer.
    </div>
  )
}
