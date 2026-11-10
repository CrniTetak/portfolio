// P8. Exception: zakasnela rata 3 (korak 9, kasni KUPAC) i jasno odvojen "What-if example" (ne menja stanje priče).
// Igrač ne saznaje za ustupanje potraživanja ni za escrow detalje grane Rejected.
import { Chip } from '../../komponente/Chip'
import { Ekran } from '../../komponente/Ekran'
import { Ikona } from '../../komponente/Ikona'
import { Kartica, Napomena, PlocicaPaznje } from '../../komponente/Kartica'
import { usePrica } from '../../prica/PricaProvider'
import { daniKasnjenja, gotovo, odbijeno } from '../../pravila/izvedeno'
import { pogled } from '../../pravila/vidljivost'
import { DATUM } from '../../scenario/datumi'
import { eur } from '../../scenario/format'

export default function P8Izuzetak() {
  const { poz } = usePrica()
  const p = pogled('player')
  if (odbijeno(poz)) {
    const vraceno = gotovo(poz, 'rf1')
    const naslov = poz.korak === 7 ? (vraceno ? 'The transfer did not go through' : 'Registration not completed') : poz.korak >= 8 ? 'Closed' : 'Registration not completed'
    return (
      <Ekran id="P8" naslov="Exception" akcije={<Chip v="neutral" ikona="undo">Registration not completed</Chip>}>
        <PlocicaPaznje varijanta="info" ikona="undo" naslov={naslov}>
          The registration was not completed, so the transfer did not go through. No payments from this transfer are scheduled.
        </PlocicaPaznje>
      </Ekran>
    )
  }
  const dani = daniKasnjenja(poz)
  return (
    <Ekran id="P8" naslov="Exception" akcije={dani !== null ? <Chip v="over" ikona="warn">Installment delayed</Chip> : <Chip v="paid" ikona="check">No exceptions</Chip>}>
      {dani === null ? (
        <Kartica naslov="Delayed payments" id="kasni">
          <p><Ikona ime="check" sm /> No exceptions. All your payments are on schedule.</p>
        </Kartica>
      ) : (
        <PlocicaPaznje naslov="Installment 3 delayed" ikona="warn">
          <b>{eur(p.udeo.poRati[2].iznos)} was due on {DATUM.rata3} and has not been received.</b> The buyer's installment is late, so in this illustration your payment follows when that installment arrives.
        </PlocicaPaznje>
      )}
      <Kartica naslov={dani !== null ? 'What-if example: registration not completed' : 'Registration not completed'} id="sta-ako"
        desno={dani !== null ? <Chip v="outline" ikona="info">What-if example</Chip> : undefined}>
        <div className="stack">
          {dani !== null && <p><b>This is not what happened to you.</b> It shows what would have followed if registration had failed.</p>}
          <p className="muted">In this illustration, if the registration is not completed, the transfer does not go through and no payments from it are scheduled.</p>
          {dani !== null && <Napomena>Viewing this example does not change the state of the story.</Napomena>}
        </div>
      </Kartica>
    </Ekran>
  )
}
