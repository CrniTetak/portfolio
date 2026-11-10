// B7. Secure funds: uplata u escrow u tri pod-koraka (priprema -> odobrenja na B10 -> potvrda partnera).
import { Chip } from '../../komponente/Chip'
import { AkcijaDugme, DugmeLink } from '../../komponente/Dugme'
import { Ekran, useStanjeEkrana } from '../../komponente/Ekran'
import { EscrowKartica, fazaEscrow } from '../../komponente/Escrow'
import { Ikona } from '../../komponente/Ikona'
import { Kartica, Napomena, PlocicaPaznje, PraznoStanje } from '../../komponente/Kartica'
import { usePrica } from '../../prica/PricaProvider'
import { gotovo, odobrenjeDepozita } from '../../pravila/izvedeno'
import { korakEkrana } from '../../pravila/stanjeEkrana'
import { putZa } from '../../pravila/rute'
import { pogled } from '../../pravila/vidljivost'
import { DATUM } from '../../scenario/datumi'
import { eur } from '../../scenario/format'
import { ESCROW } from '../../scenario/strane'

export default function B7ObezbedenjeSredstava() {
  const { poz } = usePrica()
  const stanje = useStanjeEkrana('B7')
  const p = pogled('buying')
  if (stanje === 'nije-pocelo') {
    return (
      <Ekran id="B7" naslov="Secure funds" transfer crumb="Secure funds">
        <PraznoStanje opis="You secure the first installment in escrow before registration. The deposit is prepared, approved by two people, and confirmed by the escrow partner." korak={korakEkrana('B7', 'buying')} />
      </Ekran>
    )
  }
  const faza = fazaEscrow(poz)
  const poslato = gotovo(poz, 'e1')
  const odob = odobrenjeDepozita(poz)
  const potvrdjeno = gotovo(poz, 'e4')
  const u = p.uplata

  // Grana Rejected: umesto isplate sledi povraćaj kupcu
  if (faza === 'odbijeno' || faza === 'povrat' || faza === 'vraceno') {
    const vraceno = faza === 'vraceno'
    return (
      <Ekran id="B7" naslov="Secure funds" transfer crumb="Secure funds" podnaslov={`${p.igrac.ime} → ${p.protivStrana.naziv}`}
        akcije={vraceno ? <Chip v="outline" ikona="undo">Refunded</Chip> : faza === 'odbijeno' ? <Chip v="nego" ikona="undo">Refund to follow</Chip> : <Chip v="nego" ikona="undo">Refund initiated</Chip>}>
        <PlocicaPaznje varijanta="info" ikona="undo" naslov={vraceno ? `Refund: ${eur(p.povracaj)} returned` : faza === 'odbijeno' ? 'Refund to follow' : 'Refund initiated'}>
          {vraceno
            ? `In this illustration, ${eur(p.povracaj)} was returned to your account from escrow.`
            : faza === 'odbijeno' ? `In this illustration, ${eur(p.povracaj)} is assumed to go back to you from escrow.` : `In this illustration, ${eur(p.povracaj)} is on its way back to you from escrow.`}
        </PlocicaPaznje>
        <div className="grid g-1-1">
          <Kartica naslov="Refund" id="povracaj" bezTela>
            <table className="t">
              <tbody>
                <tr><td data-label="Item">Deposited into escrow</td><td className="r num" data-label="Amount">{eur(u.ukupno)}</td></tr>
                <tr><td data-label="Item">Refund to you</td><td className="r num" data-label="Amount"><b>{eur(p.povracaj)}</b></td></tr>
              </tbody>
            </table>
            <div className="body">
              <p className="muted">In this illustration, platform fees would not be charged and the agent commission would not be paid out.</p>
            </div>
          </Kartica>
          <Kartica naslov="Next" id="sledece">
            <div className="stack">
              <p>{vraceno ? 'The deposit is returned. The escrow partner confirms it in step 9.' : 'Follow the refund in Exceptions.'}</p>
              <DugmeLink to={putZa('B11')} varijanta="primary">Open exceptions</DugmeLink>
            </div>
          </Kartica>
        </div>
        <EscrowKartica
          faza={faza}
          iznos={u.ukupno}
          naslovIznosa={vraceno ? 'Deposit returned to you' : faza === 'odbijeno' ? 'Deposit to be returned to you' : 'Deposit on its way back to you'}
          redovi={[
            ['Status', vraceno ? 'Returned' : faza === 'odbijeno' ? 'Refund to follow' : 'Refund initiated'],
            ['Account', <span className="mono" key="acc">{p.escrow.racunMaskiran}</span>],
            ['Payout rule', 'In this illustration, nothing is paid out because the registration was not completed'],
          ]}
        />
      </Ekran>
    )
  }

  let status: React.ReactNode
  if (faza === 'isplaceno') status = <Chip v="paid" ikona="check">Deposit released at registration</Chip>
  else if (potvrdjeno) status = <Chip v="held" ikona="lock">Deposit confirmed by {ESCROW.naziv} (fictional)</Chip>
  else if (odob.zavrseno) status = <Chip v="nego" ikona="clock">Approved 2 of 2, awaiting confirmation</Chip>
  else if (poslato) status = <Chip v="sign" ikona="pen">Sent for approval · {odob.odobreno} of 2</Chip>
  else status = <Chip v="neutral" ikona="clock">Deposit ready to prepare</Chip>

  return (
    <Ekran id="B7" naslov="Secure funds" transfer crumb="Secure funds" podnaslov={`${p.igrac.ime} → ${p.protivStrana.naziv}`} akcije={status}>
      <div className="grid g-1-1">
        <button type="button" className="rolecard" aria-pressed="true" style={{ minHeight: 0 }}>
          <span className="tickmark"><Ikona ime="check" /></span>
          <b>Pay first installment into escrow</b>
          <span>Selected for this story. In this illustration the money waits in a separate account until registration is confirmed.</span>
        </button>
        <button type="button" className="rolecard" aria-pressed="false" aria-disabled="true" style={{ minHeight: 0, cursor: 'not-allowed', opacity: 0.75 }}>
          <b>Provide a bank guarantee</b>
          <span>Not used in this story.</span>
        </button>
      </div>

      <div className="grid g-1-1">
        <Kartica naslov="Amount to deposit" id="iznos" bezTela>
          <table className="t">
            <tbody>
              <tr><td data-label="Item">Installment 1</td><td className="r num" data-label="Amount">{eur(u.rata1)}</td></tr>
              <tr><td data-label="Item">Agent commission (on behalf of the player)</td><td className="r num" data-label="Amount">{eur(u.provizija)}</td></tr>
              <tr><td data-label="Item">Platform fee (your half)</td><td className="r num" data-label="Amount">{eur(u.naknadaPola)}</td></tr>
            </tbody>
            <tfoot>
              <tr><td data-label="Item">Total to deposit</td><td className="r num" data-label="Amount"><b>{eur(u.ukupno)}</b></td></tr>
            </tfoot>
          </table>
          <div className="body">
            <p className="muted">Payment currency: EUR — no conversion cost. Due by {DATUM.escrowRok}.</p>
          </div>
        </Kartica>

        <div className="stack-lg">
          {!poslato && (
            <Kartica naslov="Next step" id="sledeci">
              <div className="stack">
                <p>The deposit is ready. Two people at your club approve it before it is sent.</p>
                <AkcijaDugme radnja="e1" uloga="buying" ikona="send" />
              </div>
            </Kartica>
          )}
          {poslato && !potvrdjeno && (
            <Kartica naslov="Approvals" id="odobrenja">
              <div className="stack">
                <p>Deposit {eur(u.ukupno)} into escrow: <b>approvals {odob.odobreno} of 2</b>.</p>
                {!odob.zavrseno && <DugmeLink to={putZa('B10')} varijanta="primary">View account approvals</DugmeLink>}
                {odob.zavrseno && (
                  <>
                    <p className="muted">Both approvals are in. The escrow partner now confirms the deposit.</p>
                    <AkcijaDugme radnja="e4" uloga="buying" />
                  </>
                )}
              </div>
            </Kartica>
          )}
          {potvrdjeno && (
            <Napomena ikona="lock">
              <b>Deposit confirmed by {ESCROW.naziv} (fictional).</b> {faza === 'isplaceno' ? 'The funds were released at registration.' : 'In this illustration, the funds stay locked until registration is confirmed.'} Approvals: <b>completed, 2 of 2</b>.
            </Napomena>
          )}
        </div>
      </div>

      <EscrowKartica
        faza={faza}
        iznos={u.ukupno}
        naslovIznosa={potvrdjeno ? 'Deposit held for this transfer' : 'Deposit to be held for this transfer'}
        redovi={[
          ['Status', potvrdjeno ? (faza === 'isplaceno' ? 'Released' : 'Held in escrow') : 'Waiting for your deposit'],
          ['Deposit date', potvrdjeno ? DATUM.uplataEscrow : `Due by ${DATUM.escrowRok}`],
          ['Account', <span className="mono" key="acc">{p.escrow.racunMaskiran}</span>],
          ['Payout rule', 'Released when registration is confirmed (in this illustration)'],
        ]}
      />
    </Ekran>
  )
}
