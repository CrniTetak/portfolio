// S11. Offer receivable to financiers: potraživanje (rate 2 i 3, bez igračevog udela), izbor finansijera, ponuda, prihvatanje.
import { Chip } from '../../komponente/Chip'
import { AkcijaDugme, DugmeLink, DugmeVanPrice } from '../../komponente/Dugme'
import { Ekran, useStanjeEkrana } from '../../komponente/Ekran'
import { Kartica, Napomena, PlocicaPaznje, PraznoStanje, Red } from '../../komponente/Kartica'
import { usePrica } from '../../prica/PricaProvider'
import { gotovo, odbijeno, odobrenjeUstupanja } from '../../pravila/izvedeno'
import { korakEkrana } from '../../pravila/stanjeEkrana'
import { putZa } from '../../pravila/rute'
import { pogled } from '../../pravila/vidljivost'
import { eur, pctDecimal } from '../../scenario/format'

export default function S11Finansiranje() {
  const { poz } = usePrica()
  const stanje = useStanjeEkrana('S11')
  const p = pogled('selling')
  if (stanje === 'nije-pocelo' && !odbijeno(poz)) {
    return (
      <Ekran id="S11" naslov="Financing" transfer={false} podnaslov="Turn future installments into cash today.">
        <PraznoStanje opis="After the first payout, you can offer the remaining installments to regulated financiers and receive cash today." korak={korakEkrana('S11', 'selling')} />
      </Ekran>
    )
  }
  // Grana Rejected (povraćaj kupcu): nema rata
  if (odbijeno(poz)) {
    return (
      <Ekran id="S11" naslov="Offer receivable to financiers" >
        <PlocicaPaznje varijanta="info" ikona="undo" naslov="Not applicable: registration refused">In this illustration, there is no receivable to offer to financiers because the transfer did not go through.</PlocicaPaznje>
        <div>
          <DugmeLink to={putZa('S13')} varijanta="secondary">Open exceptions</DugmeLink>
        </div>
      </Ekran>
    )
  }
  const f = p.finansiranje
  const ponudjeno = gotovo(poz, 'f1')
  const stigla = gotovo(poz, 'f2')
  const prihvaceno = gotovo(poz, 'f3')
  const odob = odobrenjeUstupanja(poz)
  const ustupljeno = gotovo(poz, 'f5')
  const rata2placena = gotovo(poz, 'f8')

  return (
    <Ekran id="S11" naslov="Offer receivable to financiers" crumb="Financing" podnaslov="Turn future installments into cash today. In this illustration, only receivables that passed the platform's checks are shown to financiers."
      akcije={ustupljeno ? <Chip v="paid" ikona="check">Receivable assigned</Chip> : ponudjeno ? <Chip v="nego" ikona="clock">In progress</Chip> : <Chip v="neutral" ikona="clock">Not offered yet</Chip>}>
      <div className="grid g-1-1">
        <Kartica naslov="Receivable to offer" id="potrazivanje">
          <div className="stack-lg">
            <div>
              <div className="eyebrow">Installments 2 and 3: your share</div>
              <div className="headline num">{eur(f.potrazivanje)}</div>
            </div>
            <div>
              <Red naziv="Installment 2" opis={`Due ${f.datumiRata[0]}`} desno={<b className="num">{eur(f.poRati[0])}</b>} />
              <Red naziv="Installment 3" opis={`Due ${f.datumiRata[1]}`} desno={<b className="num">{eur(f.poRati[1])}</b>} />
            </div>
            <p className="muted">Based on: signed agreement + escrow rules.</p>
            <Napomena>The player's share is paid directly and is not part of this offer.</Napomena>
          </div>
        </Kartica>

        <Kartica naslov="Share with" id="finansijeri">
          <div className="stack-lg">
            <fieldset style={{ border: 0, padding: 0, margin: 0 }} disabled aria-describedby="fin-pomoc">
              <legend className="sr">Financiers to share the receivable with</legend>
              {[f.finansijer, ...f.ostaliFinansijeri].map((ime, i) => (
                <label key={ime} className="signer" style={{ cursor: 'default' }}>
                  <input type="checkbox" checked={i === 0} readOnly style={{ width: 18, height: 18 }} />
                  <span className="grow"><b>{ime}</b></span>
                  {i === 0 && <Chip v="info" ikona="check">Pre-selected</Chip>}
                </label>
              ))}
            </fieldset>
            <p className="help muted" id="fin-pomoc" style={{ fontSize: 12 }}>Pre-selected for the demo. In this illustration, receivables are offered only to regulated financiers.</p>
            <div className="field">
              <label htmlFor="min-avans">Minimum advance</label>
              <input id="min-avans" className="num" value={eur(f.minimalniAvans)} readOnly />
              <span className="help">Pre-filled for the demo</span>
            </div>
          </div>
        </Kartica>
      </div>

      {!ponudjeno && (
        <div className="btnrow">
          <AkcijaDugme radnja="f1" uloga="selling" ikona="send" />
        </div>
      )}

      {ponudjeno && !stigla && (
        <PlocicaPaznje varijanta="info" naslov="Offer sent">
          <b>Offer sent to 1 financier: waiting for response.</b> {f.finansijer} reviews the receivable (no player identity, no personal terms).
        </PlocicaPaznje>
      )}

      {stigla && !prihvaceno && (
        <Kartica naslov={`Offer received: ${eur(f.avans)} advance`} id="ponuda" desno={<Chip v="nego" ikona="clock">Awaiting your reply</Chip>}>
          <div className="stack-lg">
            <dl className="terms">
              <div><dt>Advance paid to you today</dt><dd className="num">{eur(f.avans)}</dd></div>
              <div><dt>Discount</dt><dd className="num">{eur(f.popust)}<small>{pctDecimal(f.popustPct)} of the nominal amount</small></dd></div>
              <div><dt>Financier</dt><dd>{f.finansijer}</dd></div>
              <div><dt>Offer valid until</dt><dd>{f.vaziDo} (illustrative)</dd></div>
            </dl>
            <div className="btnrow">
              <AkcijaDugme radnja="f3" uloga="selling" ikona="check" />
              <DugmeVanPrice>Decline</DugmeVanPrice>
            </div>
          </div>
        </Kartica>
      )}

      {prihvaceno && !ustupljeno && (
        <PlocicaPaznje varijanta="warn" naslov={`Accepted: approvals ${odob.odobreno} of 2`}>
          You accepted the offer of <b>{eur(f.avans)}</b>. In this illustration, two people at your club approve the assignment.{' '}
          <DugmeLink to={putZa('S12')} varijanta="primary" sm>View account approvals</DugmeLink>
        </PlocicaPaznje>
      )}

      {ustupljeno && (
        <PlocicaPaznje varijanta="ok" naslov="Receivable assigned">
          <b>Receivable assigned.</b> Installments 2 and 3 will be paid to {f.finansijer}. <b>{eur(f.avans)} received.</b>{' '}
          {rata2placena ? 'Installment 2 has been paid to the financier.' : 'Installment 2 is paid to the financier when the buying club funds it.'}
        </PlocicaPaznje>
      )}
    </Ekran>
  )
}
