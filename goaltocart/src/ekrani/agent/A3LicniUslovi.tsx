// A3. Personal terms: pregled ugovora igrača (kao P2), beleške o pregovorima (samo prikaz) i "Confirm agreed terms".
import { Chip } from '../../komponente/Chip'
import { AkcijaDugme } from '../../komponente/Dugme'
import { Ekran, useStanjeEkrana } from '../../komponente/Ekran'
import { Kartica, Napomena, PraznoStanje } from '../../komponente/Kartica'
import { usePrica } from '../../prica/PricaProvider'
import { gotovo } from '../../pravila/izvedeno'
import { korakEkrana } from '../../pravila/stanjeEkrana'
import { pogled } from '../../pravila/vidljivost'
import { eur } from '../../scenario/format'

export default function A3LicniUslovi() {
  const { poz } = usePrica()
  const stanje = useStanjeEkrana('A3')
  const p = pogled('agent')
  if (stanje === 'nije-pocelo') {
    return (
      <Ekran id="A3" naslov="Personal terms">
        <PraznoStanje opis="Once the clubs have agreed in principle, you negotiate your client's contract with the buying club." korak={korakEkrana('A3', 'agent')} />
      </Ekran>
    )
  }
  const t1 = gotovo(poz, 't1')
  const t2 = gotovo(poz, 't2')
  return (
    <Ekran
      id="A3"
      naslov="Personal terms"
      podnaslov={`${p.klijent.ime} · ${p.noviKlub}`}
      akcije={t2 ? <Chip v="paid" ikona="check">Agreed</Chip> : t1 ? <Chip v="info" ikona="check">Terms confirmed by you</Chip> : <Chip v="nego" ikona="pen">In negotiation</Chip>}
    >
      <div className="grid g-1-1">
        <Kartica naslov="Contract summary" id="ugovor">
          <dl className="terms" style={{ gridTemplateColumns: '1fr' }}>
            <div><dt>New club</dt><dd>{p.noviKlub}</dd></div>
            <div><dt>Duration</dt><dd>{p.ugovor.godina} years</dd></div>
            <div><dt>Gross yearly salary</dt><dd className="num">{eur(p.ugovor.godisnjaBruto)}</dd></div>
            <div><dt>Medical</dt><dd>{t2 ? 'Passed' : `Scheduled · ${p.klinika.termin}`}</dd></div>
          </dl>
        </Kartica>
        <Kartica naslov="Negotiation notes" id="beleske">
          <div className="field">
            <label htmlFor="beleske-polje">Notes (pre-filled for the demo)</label>
            <input id="beleske-polje" aria-describedby="beleske-pomoc" readOnly value="Salary and duration discussed with the buying club; medical date confirmed." />
            <span className="help" id="beleske-pomoc">Display only. Nothing is typed or saved.</span>
          </div>
        </Kartica>
      </div>
      {!t1 && (
        <div className="btnrow">
          <AkcijaDugme radnja="t1" uloga="agent" ikona="check" />
        </div>
      )}
      {t1 && !t2 && <Napomena>You confirmed the terms. Waiting for the buying club to confirm as well.</Napomena>}
    </Ekran>
  )
}
