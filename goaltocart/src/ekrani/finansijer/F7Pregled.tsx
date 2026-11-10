// F7. Preview and exceptions: (a) pregled sporednih potraživanja (kao C2, iz ugla finansijera), (b) "Missed installment" u koraku 9.
import { Chip } from '../../komponente/Chip'
import { Ekran } from '../../komponente/Ekran'
import { Ikona } from '../../komponente/Ikona'
import { Kartica, Napomena, PlocicaPaznje } from '../../komponente/Kartica'
import { usePrica } from '../../prica/PricaProvider'
import { daniKasnjenja, gotovo } from '../../pravila/izvedeno'
import { pogled } from '../../pravila/vidljivost'
import { DATUM } from '../../scenario/datumi'
import { eur } from '../../scenario/format'

export default function F7Pregled() {
  const { poz } = usePrica()
  const p = pogled('financier')
  const dani = daniKasnjenja(poz)
  const poziciju = gotovo(poz, 'f5')
  const kraj = gotovo(poz, 'x1')
  const iznosB = p.potrazivanje.rate[1].iznos
  return (
    <Ekran
      id="F7"
      naslov="Preview and exceptions"
      podnaslov="Other receivables and missed installments"
      akcije={dani !== null && poziciju ? <Chip v="over" ikona="warn">Missed installment</Chip> : <Chip v="paid" ikona="check">No missed installments</Chip>}
    >
      <Kartica naslov="Missed installment" id="kasni">
        {dani === null || !poziciju ? (
          <p><Ikona ime="check" sm /> No missed installments.</p>
        ) : (
          <div className="stack-lg">
            <PlocicaPaznje naslov={`Installment B is overdue (${dani} days)`} ikona="warn">
              <b>{eur(iznosB)} was due on {DATUM.rata3}.</b> {p.prodavac} is the seller and {p.duznik} is the debtor.
            </PlocicaPaznje>
            <ol className="steps">
              <li>
                <span className="dot"><Ikona ime="check" /></span>
                <div><b>Reminder sent</b><small className="tnum">{DATUM.kasnjenje14} (14 days late)</small></div>
              </li>
              <li className={kraj ? '' : 'todo now'}>
                <span className="dot">{kraj ? <Ikona ime="check" /> : <Ikona ime="clock" />}</span>
                <div><b>Grace period</b><small className="tnum">{kraj ? `Over on ${DATUM.kasnjenje28}` : 'Running'}</small></div>
              </li>
              <li className={kraj ? '' : 'todo'}>
                <span className="dot">{kraj ? <Ikona ime="check" /> : <Ikona ime="clock" />}</span>
                <div><b>Evidence pack (process step)</b><small>{kraj ? 'In this illustration the process would then prepare an evidence pack that can be forwarded.' : 'Described as a step of the process: it would only follow if the grace period ends without payment.'}</small></div>
              </li>
            </ol>
          </div>
        )}
      </Kartica>

      <Kartica naslov="Other receivables (overview only)" id="sporedna" bezTela>
        <div className="tablewrap">
          <table className="t">
            <thead>
              <tr>
                <th>Seller</th>
                <th>Debtor (buyer)</th>
                <th className="r">Nominal amount</th>
                <th>Due dates</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {p.sporedna.map((s) => (
                <tr key={s.prodavac}>
                  <td className="who" data-label="Seller"><b>{s.prodavac}</b></td>
                  <td data-label="Debtor (buyer)">{s.duznik}</td>
                  <td data-label="Nominal amount" className="r num">{eur(s.nominal)}</td>
                  <td data-label="Due dates">{s.rokovi}</td>
                  <td data-label="Status"><Chip v="neutral" ikona="eye">Overview only</Chip></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Kartica>
      <Napomena>These receivables belong to other clubs and are not part of the guided story. Their steps do not move with the story bar.</Napomena>
    </Ekran>
  )
}
