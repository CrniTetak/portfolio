// S4. Personal terms (status): prodavac vidi SAMO ishod ("agreed", "Medical: passed"), bez ikakvih detalja ugovora ili nalaza.
import { Chip } from '../../komponente/Chip'
import { DugmeLink } from '../../komponente/Dugme'
import { Ekran, useStanjeEkrana } from '../../komponente/Ekran'
import { Ikona } from '../../komponente/Ikona'
import { Kartica, Napomena, PraznoStanje } from '../../komponente/Kartica'
import { usePrica } from '../../prica/PricaProvider'
import { gotovo } from '../../pravila/izvedeno'
import { korakEkrana } from '../../pravila/stanjeEkrana'
import { putZa } from '../../pravila/rute'
import { pogled } from '../../pravila/vidljivost'
import { DATUM, datumKoraka } from '../../scenario/datumi'

export default function S4LicniUslovi() {
  const { poz } = usePrica()
  const stanje = useStanjeEkrana('S4')
  const p = pogled('selling')
  if (stanje === 'nije-pocelo') {
    return (
      <Ekran id="S4" naslov="Personal terms" transfer>
        <PraznoStanje opis="After the offer is accepted, the buying club agrees the player's contract. You will see only the outcome here." korak={korakEkrana('S4', 'selling')} />
      </Ekran>
    )
  }
  const dogovoreno = gotovo(poz, 't2')
  return (
    <Ekran id="S4" naslov="Personal terms" transfer podnaslov={`${p.igrac.ime} → ${p.protivStrana.naziv}`}>
      <Kartica naslov={dogovoreno ? 'Personal terms: agreed' : 'Personal terms: not agreed yet'} id="uslovi"
        desno={dogovoreno ? <Chip v="paid" ikona="check">Agreed</Chip> : <Chip v="nego" ikona="clock">In negotiation</Chip>}>
        <div className="stack-lg">
          <div className="grid g-1-1">
            <div>
              <div className="eyebrow">Personal terms</div>
              <p style={{ fontSize: 16, fontWeight: 600 }}>
                {dogovoreno ? `Agreed on ${datumKoraka(2, 'approved').kraj}` : 'Being agreed between the buying club, the player and his agent'}
              </p>
            </div>
            <div>
              <div className="eyebrow">Medical</div>
              <p style={{ fontSize: 16, fontWeight: 600 }}>
                {dogovoreno ? (
                  <>
                    <Ikona ime="check" sm /> Medical: passed
                  </>
                ) : (
                  `Medical: scheduled ${DATUM.medicinski}`
                )}
              </p>
              <p className="muted">Only the outcome is shared with you, not any findings.</p>
            </div>
          </div>
          <Napomena ikona="lock">Details of the player's contract are private between the buying club, the player and the player's agent.</Napomena>
          <div>
            <DugmeLink to={putZa('S2')} varijanta="secondary">Back to deal</DugmeLink>
          </div>
        </div>
      </Kartica>
    </Ekran>
  )
}
