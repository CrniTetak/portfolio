// F2. Receivables: lista potraživanja koja su ponuđena finansijeru. Glavno potraživanje se pojavljuje kad ga prodavac ponudi (korak 8);
// dva sporedna su samo pregled (F7). Finansijer NIKAD ne vidi igrača, lične uslove, agenta ni bonuse.
import { Link } from 'react-router'
import { Chip } from '../../komponente/Chip'
import { Ekran } from '../../komponente/Ekran'
import { Kartica, Napomena } from '../../komponente/Kartica'
import { usePrica } from '../../prica/PricaProvider'
import { gotovo } from '../../pravila/izvedeno'
import { putZa } from '../../pravila/rute'
import { pogled } from '../../pravila/vidljivost'
import { eur } from '../../scenario/format'

export default function F2Potrazivanja() {
  const { poz } = usePrica()
  const p = pogled('financier')
  const vidljivo = gotovo(poz, 'f1')
  const poslato = gotovo(poz, 'f2')
  const dodeljeno = gotovo(poz, 'f5')
  const status = dodeljeno ? <Chip v="paid" ikona="check">Accepted, assigned to you</Chip>
    : poslato ? <Chip v="nego" ikona="clock">Offer sent</Chip>
    : <Chip v="sign" ikona="pen">Awaiting your offer</Chip>
  const nominal = p.potrazivanje.nominal
  return (
    <Ekran id="F2" naslov="Receivables" podnaslov="Receivables offered to you by clubs">
      <Kartica naslov={`Receivables (${p.sporedna.length + (vidljivo ? 1 : 0)})`} id="lista" bezTela>
        <div className="tablewrap">
          <table className="t">
            <thead>
              <tr>
                <th>Seller</th>
                <th>Debtor (buyer)</th>
                <th className="r">Nominal amount</th>
                <th>Due dates</th>
                <th>Payment route</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {vidljivo && (
                <tr className="story" data-potrazivanje="glavno">
                  <td className="who" data-label="Seller"><Link className="rowlink" to={putZa('F3')}>{p.prodavac}</Link><small>New</small></td>
                  <td data-label="Debtor (buyer)">{p.duznik}</td>
                  <td data-label="Nominal amount" className="r num"><b>{eur(nominal)}</b></td>
                  <td data-label="Due dates" className="num">{p.potrazivanje.rate.map((r) => r.datum).join(', ')}</td>
                  <td data-label="Payment route">Via escrow (illustrative)</td>
                  <td data-label="Status">{status}</td>
                </tr>
              )}
              {p.sporedna.map((s) => (
                <tr key={s.prodavac}>
                  <td className="who" data-label="Seller"><Link className="rowlink" to={putZa('F7')}>{s.prodavac}</Link><small>Overview only</small></td>
                  <td data-label="Debtor (buyer)">{s.duznik}</td>
                  <td data-label="Nominal amount" className="r num">{eur(s.nominal)}</td>
                  <td data-label="Due dates">{s.rokovi}</td>
                  <td data-label="Payment route">Via escrow (illustrative)</td>
                  <td data-label="Status"><Chip v="neutral" ikona="eye">Overview only</Chip></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Kartica>
      {!vidljivo && <Napomena>The receivable of this story has not been offered yet. It appears here once the selling club offers it.</Napomena>}
      <Napomena>In this illustration, receivables are shown to you only after the platform has run its checks. Details about the people involved and the other terms of the deal are not part of what you see.</Napomena>
      <Napomena>Illustrative only, not investment advice.</Napomena>
    </Ekran>
  )
}
