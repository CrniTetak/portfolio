// A4. Commission: provizija agenta (obaveza kupca, plaća se u ime igrača). Tri koraka sa statusom i datumom isplate.
import { Chip } from '../../komponente/Chip'
import { DugmeLink } from '../../komponente/Dugme'
import { putZa } from '../../pravila/rute'
import { Ekran, useStanjeEkrana } from '../../komponente/Ekran'
import { Ikona } from '../../komponente/Ikona'
import { Kartica, Napomena, PlocicaPaznje, PraznoStanje } from '../../komponente/Kartica'
import { usePrica } from '../../prica/PricaProvider'
import { gotovo, odbijeno } from '../../pravila/izvedeno'
import { korakEkrana } from '../../pravila/stanjeEkrana'
import { pogled } from '../../pravila/vidljivost'
import { DATUM } from '../../scenario/datumi'
import { eur } from '../../scenario/format'

export default function A4Provizija() {
  const { poz } = usePrica()
  const stanje = useStanjeEkrana('A4')
  const p = pogled('agent')
  if (stanje === 'nije-pocelo') {
    return (
      <Ekran id="A4" naslov="Commission">
        <PraznoStanje opis="Your commission is set in the agent agreement once your client's contract is being agreed." korak={korakEkrana('A4', 'agent')} />
      </Ekran>
    )
  }
  if (odbijeno(poz)) {
    return (
      <Ekran id="A4" naslov="Commission" akcije={<Chip v="outline" ikona="undo">Not payable</Chip>}>
        <PlocicaPaznje varijanta="info" ikona="undo" naslov="Commission not payable">
          In this illustration, no commission is paid because the transfer did not go through. The agreed commission was {eur(p.provizija.iznos)}.
        </PlocicaPaznje>
      </Ekran>
    )
  }

  const dogovorena = gotovo(poz, 't2')
  const obezbedjena = gotovo(poz, 'e4')
  const placena = gotovo(poz, 'p1')
  const koraci = [
    { naziv: 'Agreed in the agent agreement', opis: dogovorena ? 'Agreed together with the player contract' : 'Agreed when the contract terms are confirmed', gotovo: dogovorena },
    { naziv: 'Held in escrow', opis: obezbedjena ? `Deposited by ${p.provizija.platiocKupac} with the first installment` : 'Deposited with the first installment', gotovo: obezbedjena },
    { naziv: 'Paid out on behalf of your client', opis: placena ? `Paid on ${DATUM.isplata}` : `Planned for ${DATUM.isplata}, when registration is confirmed`, gotovo: placena },
  ]
  const tekuci = koraci.findIndex((k) => !k.gotovo)
  return (
    <Ekran
      id="A4"
      naslov="Commission"
      podnaslov="Paid on behalf of the player"
      akcije={placena ? <Chip v="paid" ikona="check">Paid</Chip> : obezbedjena ? <Chip v="held" ikona="lock">Held in escrow</Chip> : <Chip v="neutral" ikona="clock">Agreed</Chip>}
    >
      <PlocicaPaznje varijanta={placena ? 'ok' : 'info'} naslov={`Your commission: ${eur(p.provizija.iznos)}`} ikona={placena ? 'check' : 'info'}>
        Paid by {p.provizija.platiocKupac} on behalf of the player ({p.provizija.pct}% of the player's contract value, an assumption of this demo).{' '}
        {poz.korak >= 8 && 'Nothing new: your commission was paid in step 7.'}
      </PlocicaPaznje>
      <Kartica naslov="Status" id="status">
        <ol className="steps">
          {koraci.map((k, i) => (
            <li key={k.naziv} className={k.gotovo ? '' : i === tekuci ? 'todo now' : 'todo'}>
              <span className="dot">{k.gotovo ? <Ikona ime="check" /> : <Ikona ime="clock" />}</span>
              <div>
                <b>{k.naziv}</b>
                <small className="tnum">{k.opis}</small>
              </div>
            </li>
          ))}
        </ol>
      </Kartica>
      <div className="btnrow">
        <DugmeLink to={putZa('A7')} varijanta="secondary">Exceptions</DugmeLink>
      </div>
      <Napomena>In this illustration, the platform is designed not to take a share of the agent's commission and not to act for any party.</Napomena>
    </Ekran>
  )
}
