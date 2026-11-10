// N-2: prvog dana akcije brojke na A4, F3 i F6 su primer, pa uz njih stoji ova oznaka.
import { AKCIJA_PRIMER_OZNAKA } from '../scenario/poslovno'

export function PrimerOznaka() {
  return (
    <p className="pomocni-tekst" data-primer-oznaka>
      {AKCIJA_PRIMER_OZNAKA}
    </p>
  )
}
