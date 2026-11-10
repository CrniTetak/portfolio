// A7. Exception: u glavnom putu samo "What-if example" (korak 9); inače "No exceptions".
import { Chip } from '../../komponente/Chip'
import { Ekran } from '../../komponente/Ekran'
import { Ikona } from '../../komponente/Ikona'
import { Kartica, Napomena, PlocicaPaznje } from '../../komponente/Kartica'
import { usePrica } from '../../prica/PricaProvider'
import { daniKasnjenja, odbijeno } from '../../pravila/izvedeno'

export default function A7Izuzetak() {
  const { poz } = usePrica()
  if (odbijeno(poz)) {
    return (
      <Ekran id="A7" naslov="Exception" akcije={<Chip v="outline" ikona="undo">{poz.korak <= 7 ? 'Commission not payable' : 'Closed'}</Chip>}>
        <PlocicaPaznje varijanta="info" ikona="undo" naslov={poz.korak <= 7 ? 'Commission not payable: the transfer did not go through' : 'Closed'}>
          In this illustration, no commission is paid because the transfer did not go through.
        </PlocicaPaznje>
      </Ekran>
    )
  }

  const dani = daniKasnjenja(poz)
  return (
    <Ekran id="A7" naslov="Exception" akcije={dani !== null ? <Chip v="outline" ikona="info">What-if example</Chip> : <Chip v="paid" ikona="check">No exceptions</Chip>}>
      {dani === null ? (
        <Kartica naslov="Commission" id="bez">
          <p><Ikona ime="check" sm /> No exceptions. Nothing is blocking your commission.</p>
        </Kartica>
      ) : (
        <p><b>Nothing new for you.</b> Your commission was paid in step 7.</p>
      )}
      <Kartica naslov={dani !== null ? 'What-if example: registration not completed' : 'If registration is not completed'} id="sta-ako">
        <div className="stack">
          {dani !== null && <p><b>This is not what happened.</b> It shows what would have followed if registration had failed.</p>}
          <p className="muted">In this illustration, no commission is paid: the transfer did not go through.</p>
          {dani !== null && <Napomena>Viewing this example does not change the state of the story.</Napomena>}
        </div>
      </Kartica>
    </Ekran>
  )
}
