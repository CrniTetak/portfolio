// Uredno prazno stanje za ekrane koji još nisu izgrađeni (talas 2): "Not started yet" / "Coming in the next build".
// Prikazuje opis stanja iz tabele 4.0 za trenutni korak i, ako je baš na ovom ekranu na redu radnja uloge, njeno dugme,
// da se priča može proći i ručnim klikanjem.
import { AkcijaDugme } from '../../komponente/Dugme'
import { Ekran } from '../../komponente/Ekran'
import { Kartica, Napomena, PraznoStanje } from '../../komponente/Kartica'
import { usePrica } from '../../prica/PricaProvider'
import { putanja } from '../../prica/koraci'
import { celija } from '../../pravila/matrica'
import { korakEkrana, stanjeEkrana } from '../../pravila/stanjeEkrana'
import { meta } from '../../pravila/rute'
import { sledecaRadnja } from '../../prica/reducer'
import type { EkranId } from '../../prica/tipovi'

export default function Stub({ id }: { id: EkranId }) {
  const { uloga, poz } = usePrica()
  const m = meta(id)
  const stanje = stanjeEkrana(id, uloga, poz)
  const c = celija(poz.korak, uloga, poz.grana)
  const zaOvajEkran = putanja(poz.grana).filter((r) => r.ekran === id && r.uloga === uloga)
  const sl = sledecaRadnja(poz)
  const naRedu = sl && sl.uloga === uloga && sl.ekran === id

  return (
    <Ekran id={id} naslov={m.naziv} stub>
      {stanje === 'nije-pocelo' ? (
        <PraznoStanje opis="Nothing has happened here yet. This screen fills in once the story reaches it." korak={korakEkrana(id, uloga)} />
      ) : (
        <PraznoStanje naslov="Coming in the next build" opis="This screen is part of the full demo and is not built yet. The summary below follows the story." />
      )}
      {stanje !== 'nije-pocelo' && c.ekrani.includes(id) && (
        <Kartica naslov="Where this step stands for you" id="stanje">
          <p>
            <b>At the start of the step:</b> {c.pocetni}
          </p>
          <p>
            <b>When the step is done:</b> {c.zavrsni}
          </p>
        </Kartica>
      )}
      {naRedu && zaOvajEkran.map((r) => <AkcijaDugme key={r.id} radnja={r.id} uloga={uloga} actAs={r.odobrava} />)}
      {zaOvajEkran.length > 0 && !naRedu && stanje !== 'nije-pocelo' && <Napomena>Actions on this screen follow the story; the next one is not yours yet.</Napomena>}
    </Ekran>
  )
}
