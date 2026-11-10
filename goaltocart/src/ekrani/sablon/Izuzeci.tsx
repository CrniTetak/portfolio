// S13 / B11. Exceptions: (a) registracija nije prošla -> povraćaj, (b) zakasnela rata. U zdravom putu obe kartice su "No exceptions".
// U koraku 9 (glavni put) rata 3 kasni, a "What-if example" je jasno odvojen i NE menja stanje priče.
import { Chip } from '../../komponente/Chip'
import { AkcijaDugme, DugmePregled } from '../../komponente/Dugme'
import { Ekran } from '../../komponente/Ekran'
import { Ikona } from '../../komponente/Ikona'
import { Kartica, Napomena, PlocicaPaznje } from '../../komponente/Kartica'
import { usePrica } from '../../prica/PricaProvider'
import { daniKasnjenja, fazaPovracaja, gotovo } from '../../pravila/izvedeno'
import { pogled } from '../../pravila/vidljivost'
import { DATUM, datumKoraka } from '../../scenario/datumi'
import { eur } from '../../scenario/format'

type Klub = 'selling' | 'buying'

function NemaIzuzetaka() {
  return (
    <p>
      <Ikona ime="check" sm /> No exceptions.
    </p>
  )
}

/** Grana Rejected: povraćaj kupcu umesto isplate (ITC odbijen -> povraćaj pokrenut -> vraćeno -> potvrđeno -> dokazi arhivirani). */
function Povracaj({ uloga }: { uloga: Klub }) {
  const { poz } = usePrica()
  const prodavac = uloga === 'selling'
  const p = pogled(uloga)
  const faza = fazaPovracaja(poz)
  const vraceno = gotovo(poz, 'rf1')
  const arhivirano = gotovo(poz, 'rc1')
  const potvrdjeno = poz.korak >= 9
  const iznos = prodavac ? 0 : pogled('buying').povracaj // prodavac ne vidi kupčeve iznose
  const koraci: { naziv: string; opis: string; gotovo: boolean; odbijen?: boolean }[] = [
    { naziv: 'Registration refused (ITC)', opis: datumKoraka(6, 'rejected').kraj, gotovo: true, odbijen: true },
    { naziv: 'Refund initiated', opis: poz.korak >= 7 ? datumKoraka(7, 'rejected').pocetak : `Expected ${datumKoraka(7, 'rejected').pocetak}`, gotovo: poz.korak >= 7 },
    { naziv: prodavac ? 'Funds returned to the buyer' : 'Funds returned to you', opis: vraceno ? datumKoraka(7, 'rejected').kraj : 'Waiting for the escrow partner', gotovo: vraceno },
    { naziv: 'Refund confirmed by the escrow partner', opis: potvrdjeno ? datumKoraka(9, 'rejected').pocetak : `Expected ${datumKoraka(9, 'rejected').pocetak}`, gotovo: potvrdjeno },
    { naziv: 'Evidence archive stored', opis: arhivirano ? datumKoraka(9, 'rejected').kraj : poz.korak >= 9 ? 'Pending' : `Expected ${datumKoraka(9, 'rejected').kraj}`, gotovo: arhivirano },
  ]
  const tekuci = koraci.findIndex((k) => !k.gotovo)
  const chip = potvrdjeno ? <Chip v="paid" ikona="check">Refund confirmed</Chip> : faza === 'odbijeno' ? <Chip v="over" ikona="x">Registration refused</Chip> : <Chip v="nego" ikona="undo">Refund in progress</Chip>
  return (
    <Ekran id={prodavac ? 'S13' : 'B11'} naslov="Exceptions" transfer crumb="Exceptions" podnaslov={`${p.igrac.ime} → ${p.protivStrana.naziv}`} akcije={chip}>
      <PlocicaPaznje naslov={faza === 'odbijeno' ? 'ITC refused: a refund follows' : 'Registration not completed: refund to the buyer'} ikona="undo" varijanta="info">
        {prodavac
          ? 'In this illustration, no payout is assumed to be made and the escrow funds are assumed to be returned to the buyer.'
          : `In this illustration, you are assumed to be refunded ${eur(iznos)} from escrow. Platform fees would not be charged in this illustration.`}
      </PlocicaPaznje>
      <div className="grid g-1-1">
        <Kartica naslov="Refund" id="povracaj">
          <div className="stack-lg">
            <ol className="steps">
              {koraci.map((k, i) => (
                <li key={k.naziv} className={k.gotovo ? '' : i === tekuci ? 'todo now' : 'todo'}>
                  <span className="dot" style={k.odbijen ? { background: 'var(--st-over-bg)', color: 'var(--st-over-fg)' } : undefined}>{k.odbijen ? <Ikona ime="x" /> : k.gotovo ? <Ikona ime="check" /> : <Ikona ime="clock" />}</span>
                  <div><b>{k.naziv}</b><small className="tnum">{k.opis}</small></div>
                </li>
              ))}
            </ol>
            <div className="btnrow">
              {poz.korak === 7 && !vraceno && <AkcijaDugme radnja="rf1" uloga={uloga} />}
              {poz.korak === 9 && !arhivirano && <AkcijaDugme radnja="rc1" uloga={uloga} />}
              {arhivirano && <DugmePregled varijanta="secondary" ikona="file">View evidence archive</DugmePregled>}
            </div>
          </div>
        </Kartica>
        <Kartica naslov="Missed installment" id="kasni">
          <p><Ikona ime="undo" sm /> Not applicable: registration refused.</p>
        </Kartica>
      </div>
    </Ekran>
  )
}

export default function Izuzeci({ uloga }: { uloga: Klub }) {
  const { poz } = usePrica()
  const prodavac = uloga === 'selling'
  const p = pogled(uloga)
  if (fazaPovracaja(poz) !== 'nije') return <Povracaj uloga={uloga} />
  const dani = daniKasnjenja(poz)
  const kraj = gotovo(poz, 'x1')
  const r3 = p.dogovoreno.rate[2]
  const ustupljeno = prodavac && gotovo(poz, 'f5')

  return (
    <Ekran id={prodavac ? 'S13' : 'B11'} naslov="Exceptions" transfer crumb="Exceptions" podnaslov={`${p.igrac.ime} → ${p.protivStrana.naziv}`}
      akcije={dani !== null ? <Chip v="over" ikona="warn">Installment overdue</Chip> : <Chip v="paid" ikona="check">No exceptions</Chip>}>
      {dani !== null && (
        <PlocicaPaznje naslov={`Installment 3 overdue ${dani} days`} ikona="warn">
          <b>{eur(r3)} was due on {DATUM.rata3}.</b>{' '}
          {prodavac
            ? ustupljeno ? `The installment is assigned to ${pogled('selling').finansiranje.finansijer}. The financier has been notified.` : 'An automatic reminder was sent to the buying club.'
            : 'Automatic reminders were sent. Pay now to close the exception.'}
        </PlocicaPaznje>
      )}

      <div className="grid g-1-1">
        <Kartica naslov="Missed installment" id="kasni">
          {dani === null ? (
            <NemaIzuzetaka />
          ) : (
            <div className="stack-lg">
              <ol className="steps">
                <li>
                  <span className="dot"><Ikona ime="check" /></span>
                  <div><b>Due date</b><small className="num">{DATUM.rata3}</small></div>
                </li>
                <li>
                  <span className="dot"><Ikona ime="check" /></span>
                  <div><b>Automatic reminder</b><small className="num">Sent on {DATUM.kasnjenje14} (14 days late)</small></div>
                </li>
                <li className={kraj ? '' : 'todo now'}>
                  <span className="dot">{kraj ? <Ikona ime="check" /> : <Ikona ime="clock" />}</span>
                  <div><b>Grace period</b><small className="num">{kraj ? `Over on ${DATUM.kasnjenje28}` : 'Running'}</small></div>
                </li>
                <li className={kraj ? '' : 'todo'}>
                  <span className="dot">{kraj ? <Ikona ime="check" /> : <Ikona ime="clock" />}</span>
                  <div><b>{kraj ? 'Evidence pack prepared (illustrative)' : 'Evidence pack'}</b><small>{kraj ? 'Prepared from the signed agreement and the payment trail' : 'Prepared if the grace period ends without payment'}</small></div>
                </li>
              </ol>
              <div className="btnrow">
                {prodavac ? (
                  <DugmePregled varijanta="secondary" ikona="file" poruka="Simulated action — nothing was sent">View evidence pack</DugmePregled>
                ) : (
                  <DugmePregled varijanta="primary" ikona="wallet">Pay now</DugmePregled>
                )}
              </div>
              {!prodavac && <p className="muted" style={{ fontSize: 12.5 }}>Pay now is display only. Nothing is paid in this demo.</p>}
            </div>
          )}
        </Kartica>

        <Kartica naslov={dani !== null ? 'What-if example: registration not completed' : 'Registration not completed'} id="refund"
          desno={dani !== null ? <Chip v="outline" ikona="info">What-if example</Chip> : undefined}>
          {dani === null ? (
            <div className="stack">
              <NemaIzuzetaka />
              <p className="muted">
                {prodavac
                  ? 'In this illustration, if the registration is not completed, no payout would be made and the escrow funds would be returned to the buyer.'
                  : `In this illustration, if the registration is not completed, you would be refunded ${eur(pogled('buying').povracaj)} from escrow, and platform fees would not be charged.`}
              </p>
            </div>
          ) : (
            <div className="stack">
              <p>
                <b>This is not what happened.</b> It shows what would have followed if registration had failed:
              </p>
              <p className="muted">
                {prodavac
                  ? 'In this illustration, no payout would be made and the escrow funds would be returned to the buyer.'
                  : `You would be refunded ${eur(pogled('buying').povracaj)} from escrow.`}
              </p>
              <Napomena>Viewing this example does not change the state of the story.</Napomena>
            </div>
          )}
        </Kartica>
      </div>
    </Ekran>
  )
}
