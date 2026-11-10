// PREKIDAČ „Televizor ⇄ Telefon“ (UX 1.2, UI 8): samo na uskom ekranu, preko cele širine.
import { useDemo } from './stanje'
import { Smartphone, Tv } from './Ikone'

export function PrekidacUredjaja() {
  const { uredjaj, postaviUredjaj } = useDemo()
  return (
    <div className="segment segment--uredjaj" role="group" aria-label="Uređaj">
      <button type="button" aria-pressed={uredjaj === 'tv'} onClick={() => postaviUredjaj('tv')}>
        <Tv className="ic" aria-hidden="true" /> Televizor
      </button>
      <button type="button" aria-pressed={uredjaj === 'tel'} onClick={() => postaviUredjaj('tel')}>
        <Smartphone className="ic" aria-hidden="true" /> Telefon
      </button>
    </div>
  )
}
