// Stalna oznaka na vrhu SVAKOG ekrana (UX 0, UI 5.14). Tekst se ne skraćuje i ne sme se uklanjati radi lepšeg izgleda.
import { DEMO_OZNAKA } from '../tekstovi/okvir'

export function OznakaDemoa() {
  return (
    <aside className="oznaka-demoa" aria-label="Oznaka demoa" data-oznaka-demoa>
      {DEMO_OZNAKA}
    </aside>
  )
}
