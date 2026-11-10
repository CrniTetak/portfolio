// P6. Payment receipt: potvrda isplate igraču (prva rata posle koraka 7, druga rata posle koraka 8).
import { Chip } from '../../komponente/Chip'
import { Ekran, useStanjeEkrana } from '../../komponente/Ekran'
import { Ikona } from '../../komponente/Ikona'
import { Kartica, Napomena, PraznoStanje } from '../../komponente/Kartica'
import { usePrica } from '../../prica/PricaProvider'
import { odbijeno, statusRate } from '../../pravila/izvedeno'
import { korakEkrana } from '../../pravila/stanjeEkrana'
import { pogled } from '../../pravila/vidljivost'
import { DATUM } from '../../scenario/datumi'
import { eur } from '../../scenario/format'
import { ISPLATA_UDELA } from '../../tekstovi/prica'

export default function P6Potvrda() {
  const { poz } = usePrica()
  const stanje = useStanjeEkrana('P6')
  const p = pogled('player')
  if (stanje === 'nije-pocelo') {
    return (
      <Ekran id="P6" naslov="Payment receipt">
        <PraznoStanje opis="After the payout, a receipt for each payment you receive appears here." korak={korakEkrana('P6', 'player')} />
      </Ekran>
    )
  }
  if (odbijeno(poz)) {
    return (
      <Ekran id="P6" naslov="Payment receipt">
        <Kartica naslov="No payment" id="nema">
          <p>In this what-if example the transfer did not go through, so there is no payment and no receipt. No payments from this transfer are scheduled.</p>
        </Kartica>
      </Ekran>
    )
  }

  const placeno1 = statusRate(1, poz) === 'paid'
  const placeno2 = statusRate(2, poz) === 'paid' || statusRate(2, poz) === 'paid-financier'
  const racun = `••${p.igrac.racunKraj}`
  const potvrde = [
    { n: 1, placeno: placeno1, iznos: p.udeo.poRati[0].iznos, datum: DATUM.isplata },
    { n: 2, placeno: placeno2, iznos: p.udeo.poRati[1].iznos, datum: DATUM.rata2 },
  ]
  return (
    <Ekran id="P6" naslov="Payment receipt" podnaslov={`${p.udeo.pct}% share, installment payments`}>
      {potvrde.map((x) => (
        <Kartica
          key={x.n}
          id={`potvrda-${x.n}`}
          naslov={`Installment ${x.n}`}
          desno={x.placeno ? <Chip v="paid" ikona="check">Paid</Chip> : <Chip v="neutral" ikona="clock">Scheduled</Chip>}
        >
          <div className="stack">
            <p>
              {x.placeno ? (
                <>
                  <Ikona ime="check" sm /> <b>Paid on {x.datum}</b> · <b className="num">{eur(x.iznos)}</b> · to your account ending {racun}
                </>
              ) : (
                <>
                  Payment scheduled: <b className="num">{eur(x.iznos)}</b> on {x.datum}
                </>
              )}
            </p>
            {x.placeno && <p className="muted">Bank confirmation (fictional): <span className="mono">{p.potvrdaBanke.referenca}-{x.n}</span></p>}
          </div>
        </Kartica>
      ))}
      <Napomena>Receipts are illustrative. No real payment is made in this demo. Each payment is {ISPLATA_UDELA}.</Napomena>
    </Ekran>
  )
}
