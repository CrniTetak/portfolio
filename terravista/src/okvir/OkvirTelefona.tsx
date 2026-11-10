// OKVIR TELEFONA: u okviru (laptop, platno 360 × 760 umanjeno) ili „prirodno“, punom širinom (telefon-uređaj; bez umanjenog okvira).
import { TelSadrzajEkrana } from '../ekrani'
import { RAM_TELEFON, TELEFON } from './mere'
import { Uklopi } from './Uklopi'

export function OkvirTelefona({ prirodno = false, osvetli = false }: { prirodno?: boolean; osvetli?: boolean }) {
  if (prirodno) {
    return (
      <div className="tel-platno tel-platno--prirodno" data-tel-platno role="region" aria-label="Telefon (demo)">
        <TelSadrzajEkrana />
      </div>
    )
  }
  return (
    <Uklopi baza={TELEFON} tip="tel" ram={RAM_TELEFON} osvetli={osvetli} naslov="Telefon (demo)">
      <div className="tel-platno" data-tel-platno style={{ width: TELEFON.sirina, height: TELEFON.visina }}>
        <TelSadrzajEkrana />
      </div>
    </Uklopi>
  )
}
