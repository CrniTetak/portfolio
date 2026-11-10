// P3. My share (5%): tabela igračevih plaćanja, udeo u bonusima, rok.
// Igrač vidi svoj udeo u iznosima (ukupno, po ratama i po bonusima), ali ne ponude klubova, proviziju agenta ni sell-on.
// Udeo isplaćuje escrow u ime prodavca, istog dana kad i ratu prodavca.
import { ChipRataIgrac } from '../../komponente/Chip'
import { Ekran } from '../../komponente/Ekran'
import { Kartica, Napomena, PlocicaPaznje } from '../../komponente/Kartica'
import { DugmeLink } from '../../komponente/Dugme'
import { usePrica } from '../../prica/PricaProvider'
import { daniKasnjenja, odbijeno, ponudaPrihvacena, statusRate } from '../../pravila/izvedeno'
import { putZa } from '../../pravila/rute'
import { pogled } from '../../pravila/vidljivost'
import { eur, pct } from '../../scenario/format'
import { ISPLATA_UDELA, STA_IGRAC_VIDI } from '../../tekstovi/prica'

export default function P3Udeo() {
  const { poz } = usePrica()
  const p = pogled('player')
  const u = p.udeo
  const prihvaceno = ponudaPrihvacena(poz)
  const kasnjenje = daniKasnjenja(poz)

  if (odbijeno(poz)) {
    return (
      <Ekran id="P3" naslov="My share" podnaslov={`${pct(u.pct)} of the transfer fee`}>
        <PlocicaPaznje varijanta="info" ikona="undo" naslov="No payments from this transfer are scheduled">
          In this what-if example the transfer did not go through, so your share is not applicable.
        </PlocicaPaznje>
      </Ekran>
    )
  }

  if (!prihvaceno) {
    return (
      <Ekran id="P3" naslov="My share" podnaslov={`${pct(u.pct)} of the transfer fee`}>
        <PlocicaPaznje varijanta="info" naslov="Not agreed yet">
          Your share is {pct(u.pct)} of the transfer fee. The amounts are calculated once the clubs have agreed.
        </PlocicaPaznje>
      </Ekran>
    )
  }
  return (
    <Ekran id="P3" naslov="My share" podnaslov={`${pct(u.pct)} of the transfer fee, paid to you from escrow`}>
      {kasnjenje !== null && (
        <PlocicaPaznje naslov="Installment 3 delayed" ikona="warn">
          <b>{eur(u.poRati[2].iznos)} has not been received yet.</b> The buyer's installment is late, so in this illustration your payment follows when that installment arrives.{' '}
          <DugmeLink to={putZa('P8')} varijanta="secondary" sm>More</DugmeLink>
        </PlocicaPaznje>
      )}
      <p>Your share is {pct(u.pct)} of the transfer fee and is {ISPLATA_UDELA}.</p>
      <Kartica naslov="Your payments" id="placanja" bezTela>
        <div className="tablewrap">
          <table className="t">
            <thead>
              <tr>
                <th>Payment</th>
                <th>Due date</th>
                <th className="r">Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {u.poRati.map((r, i) => (
                <tr key={i}>
                  <td className="who" data-label="Payment"><b>Installment {i + 1}</b></td>
                  <td data-label="Due date" className="num">{r.datum}</td>
                  <td data-label="Amount" className="r num">{eur(r.iznos)}</td>
                  <td data-label="Status"><ChipRataIgrac status={statusRate((i + 1) as 1 | 2 | 3, poz)} /></td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td data-label="Payment">Total fixed share</td>
                <td className="nolabel" />
                <td data-label="Amount" className="r num">{eur(u.ukupno)}</td>
                <td className="nolabel" />
              </tr>
            </tfoot>
          </table>
        </div>
      </Kartica>
      <div className="btnrow">
        <DugmeLink to={putZa('P6')} varijanta="secondary">Payment receipts</DugmeLink>
        <DugmeLink to={putZa('P8')} varijanta="secondary">Exceptions</DugmeLink>
      </div>
      <Kartica naslov="Bonus shares" id="bonusi">
        <p className="muted">If a bonus is triggered, you receive {pct(u.pct)} of it. Nothing is due yet.</p>
        {u.poBonusu.map((b, i) => (
          <div className="signer" key={b.id}>
            <div className="grow"><b>Bonus {i + 1}</b><small>Your share if triggered</small></div>
            <b className="num">{eur(b.iznos)}</b>
          </div>
        ))}
      </Kartica>
      <div className="grid g-1-1">
        <Kartica naslov="When you are paid" id="rok">
          <p>Each payment is {ISPLATA_UDELA}.</p>
        </Kartica>
        <Napomena>{STA_IGRAC_VIDI}</Napomena>
      </div>
    </Ekran>
  )
}
