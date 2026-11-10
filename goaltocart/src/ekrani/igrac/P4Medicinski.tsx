// P4. Medical: termin, mesto, status (samo ishod, bez nalaza).
import { Chip } from '../../komponente/Chip'
import { Ekran, useStanjeEkrana } from '../../komponente/Ekran'
import { Kartica, Napomena, PraznoStanje, Red } from '../../komponente/Kartica'
import { usePrica } from '../../prica/PricaProvider'
import { gotovo } from '../../pravila/izvedeno'
import { korakEkrana } from '../../pravila/stanjeEkrana'
import { pogled } from '../../pravila/vidljivost'

export default function P4Medicinski() {
  const { poz } = usePrica()
  const stanje = useStanjeEkrana('P4')
  const p = pogled('player')
  if (stanje === 'nije-pocelo') {
    return (
      <Ekran id="P4" naslov="Medical">
        <PraznoStanje opis="The medical examination is scheduled once the clubs have agreed in principle. The date and place appear here." korak={korakEkrana('P4', 'player')} />
      </Ekran>
    )
  }
  const proso = gotovo(poz, 't2')
  return (
    <Ekran id="P4" naslov="Medical" podnaslov={p.noviKlub} akcije={proso ? <Chip v="paid" ikona="check">Passed</Chip> : <Chip v="neutral" ikona="clock">Scheduled</Chip>}>
      <Kartica naslov="Appointment" id="termin">
        <Red naziv="Date" opis="Medical examination for the transfer" desno={<b className="num">{p.klinika.termin}</b>} />
        <Red naziv="Place" desno={<b>{p.klinika.naziv}</b>} />
        <Red naziv="Status" desno={proso ? <Chip v="paid" ikona="check">Passed</Chip> : <Chip v="neutral" ikona="clock">Scheduled</Chip>} />
      </Kartica>
      <Napomena ikona="lock">In this illustration, other parties see only the outcome of the medical, and only the outcome is shown here.</Napomena>
    </Ekran>
  )
}
