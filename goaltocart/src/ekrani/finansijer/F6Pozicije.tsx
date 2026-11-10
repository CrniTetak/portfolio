// F6. Positions / installment tracking: preuzeto potraživanje, dve rate sa stanjem, ukupan povraćaj i zarada. Bez podataka o igraču.
import { ChipRataFinansijer } from '../../komponente/Chip'
import { Ekran, useStanjeEkrana } from '../../komponente/Ekran'
import { Kartica, KpiPlocica, Napomena, PraznoStanje } from '../../komponente/Kartica'
import { usePrica } from '../../prica/PricaProvider'
import { daniKasnjenja, gotovo, statusRate } from '../../pravila/izvedeno'
import { korakEkrana } from '../../pravila/stanjeEkrana'
import { pogled } from '../../pravila/vidljivost'
import { eur } from '../../scenario/format'

export default function F6Pozicije() {
  const { poz } = usePrica()
  const stanje = useStanjeEkrana('F6')
  const p = pogled('financier')
  if (stanje === 'nije-pocelo') {
    return (
      <Ekran id="F6" naslov="Positions">
        <PraznoStanje opis="Your positions appear here once an offer is accepted and the receivable is assigned to you." korak={korakEkrana('F6', 'financier')} />
      </Ekran>
    )
  }
  const dodeljeno = gotovo(poz, 'f5')
  const pr = p.potrazivanje
  if (!dodeljeno) {
    return (
      <Ekran id="F6" naslov="Positions" podnaslov="Active positions: 0">
        <Kartica naslov="No positions yet" id="nema">
          <p className="muted">When an offer is accepted and approved by the seller, the receivable becomes a position here.</p>
        </Kartica>
      </Ekran>
    )
  }
  const kasnjenje = daniKasnjenja(poz)
  return (
    <Ekran id="F6" naslov="Positions" podnaslov={`${p.prodavac} · debtor ${p.duznik}`}>
      <Kartica naslov="Installments" id="rate" bezTela>
        <div className="tablewrap">
          <table className="t">
            <thead>
              <tr>
                <th>Installment</th>
                <th>Due date</th>
                <th className="r">Amount</th>
                <th>Status</th>
                <th>Paid from</th>
              </tr>
            </thead>
            <tbody>
              {pr.rate.map((r, i) => (
                <tr key={i} data-pozicija-rata={i + 1}>
                  <td className="who" data-label="Installment"><b>Installment {i === 0 ? 'A' : 'B'}</b></td>
                  <td data-label="Due date" className="num">{r.datum}</td>
                  <td data-label="Amount" className="r num">{eur(r.iznos)}</td>
                  <td data-label="Status"><ChipRataFinansijer status={statusRate((i + 2) as 2 | 3, poz)} kasnjenje={i === 1 ? kasnjenje : null} /></td>
                  <td data-label="Paid from">Escrow ({p.putPlacanja.posrednik}), to you in this illustration</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td data-label="Installment">Total</td>
                <td className="nolabel" />
                <td data-label="Amount" className="r num">{eur(pr.nominal)}</td>
                <td className="nolabel" />
                <td className="nolabel" />
              </tr>
            </tfoot>
          </table>
        </div>
      </Kartica>
      <div className="grid g-3">
        <KpiPlocica oznaka="Advance paid" vrednost={eur(pr.avans)} napomena="Sent when the offer was accepted (simulated)" />
        <KpiPlocica oznaka="Total to be received" vrednost={eur(pr.nominal)} napomena="Installments A and B" />
        <KpiPlocica oznaka="Difference (illustrative)" vrednost={eur(pr.popust)} napomena="Nominal amount minus the advance" />
      </div>
      <Napomena>Illustration only: the figures follow the offer made in this story and are not a forecast or investment advice.</Napomena>
    </Ekran>
  )
}
