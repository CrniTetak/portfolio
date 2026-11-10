// S2 / B2. Pregled transfera: vremenska linija 1-9, dogovoreni uslovi, dokumenta, aktivnost (B2 još i "Your obligations").
import { Chip, ChipRate } from '../../komponente/Chip'
import { Ekran } from '../../komponente/Ekran'
import { DugmeLink } from '../../komponente/Dugme'
import { Kartica, PlocicaPaznje, Red } from '../../komponente/Kartica'
import { VremenskaLinija9 } from '../../komponente/Linije'
import { usePrica } from '../../prica/PricaProvider'
import { aktivnost, brojGotovih, fazaKoraka, fazaPovracaja, gotovo, odbijeno, statusRate } from '../../pravila/izvedeno'
import { putZa } from '../../pravila/rute'
import { pogled } from '../../pravila/vidljivost'
import { DATUM } from '../../scenario/datumi'
import { eur, nizRata, pct } from '../../scenario/format'
import { IGRAC } from '../../scenario/strane'

type Klub = 'selling' | 'buying'

export default function Pregled({ uloga }: { uloga: Klub }) {
  const { poz } = usePrica()
  const prodavac = uloga === 'selling'
  const p = pogled(uloga)
  const n = 1 + (gotovo(poz, 'o1') ? 1 : 0) + (gotovo(poz, 'o2') ? 1 : 0)
  const dogovoreno = gotovo(poz, 'o3')
  const v = p.verzije[n - 1]
  const d = p.dogovoreno
  const potpisa = brojGotovih(poz, ['g1', 'g2'])
  const ugovorFaza = fazaKoraka(poz, 4)
  const paket = fazaKoraka(poz, 6)
  const dogadjaji = aktivnost(poz, uloga)
  const povrat = odbijeno(poz)
  const faza = fazaPovracaja(poz)

  const dokumenta = [
    {
      naziv: 'Offer',
      chip: povrat ? <Chip v="neutral" ikona="undo">Not carried out</Chip> : dogovoreno ? <Chip v="paid" ikona="check">Agreed · v3</Chip> : <Chip v="nego" ikona="pen">Under negotiation · v{n}</Chip>,
    },
    {
      naziv: 'Transfer agreement',
      chip:
        ugovorFaza === 'buduci' ? <Chip v="neutral" ikona="clock">Not started yet</Chip>
        : ugovorFaza === 'zavrsen' ? (povrat ? <Chip v="neutral" ikona="undo">Signed, not carried out</Chip> : <Chip v="paid" ikona="check">Signed</Chip>)
        : <Chip v="sign" ikona="pen">{potpisa} of 2 signed</Chip>,
    },
    {
      naziv: 'Registration pack',
      chip:
        paket === 'buduci' ? <Chip v="neutral" ikona="clock">Not ready yet</Chip>
        : paket === 'zavrsen' ? (odbijeno(poz) ? <Chip v="over" ikona="x">ITC refused</Chip> : <Chip v="paid" ikona="check">Entered in the TMS</Chip>)
        : <Chip v="info" ikona="doc">Ready for the TMS</Chip>,
    },
  ]

  return (
    <Ekran
      id={prodavac ? 'S2' : 'B2'}
      naslov={`${IGRAC.ime} → ${p.protivStrana.naziv}`}
      crumb="Overview"
      transfer
      podnaslov="Permanent transfer · Deal overview"
    >
      <VremenskaLinija9 poz={poz} />

      {povrat && (
        <PlocicaPaznje
          varijanta="info"
          ikona="undo"
          naslov={poz.korak === 6 ? 'ITC refused' : poz.korak === 7 ? 'Replaced by refund' : poz.korak === 8 ? 'Closed' : 'Refund confirmed'}
        >
          {poz.korak <= 7 && (prodavac
            ? 'In this illustration, the registration was refused, so nothing is paid out and the escrow funds go back to the buyer.'
            : `In this illustration, the registration was refused and your deposit of ${eur(pogled('buying').povracaj)} goes back to you.`)}
          {poz.korak === 8 && (prodavac ? 'In this illustration, there are no installments, bonuses or receivable to track.' : 'In this illustration, there are no installments or bonuses to track.')}
          {poz.korak === 9 && (faza === 'arhiviran' ? 'The refund was confirmed by the escrow partner and the evidence archive is stored.' : 'The refund was confirmed by the escrow partner. The evidence archive is still to be stored.')}
        </PlocicaPaznje>
      )}

      <div className="grid g-1-1">
        {povrat ? (
          <Kartica naslov="Terms that were agreed (not carried out)" id="uslovi" desno={<Chip v="neutral" ikona="undo">Not carried out</Chip>}>
            <dl className="terms">
              <div>
                <dt>Fixed fee</dt>
                <dd className="num"><s>{eur(v.fiksni)}</s></dd>
              </div>
              <div>
                <dt>Headline value</dt>
                <dd className="num"><s>{eur(d.naslovna)}</s></dd>
              </div>
            </dl>
            <p className="muted">In this illustration, these terms are not carried out because the registration was refused.</p>
          </Kartica>
        ) : (
        <Kartica naslov={dogovoreno ? 'Agreed terms' : 'Terms under negotiation'} id="uslovi" desno={dogovoreno ? <Chip v="paid" ikona="check">Agreed</Chip> : <Chip v="nego" ikona="pen">v{n}</Chip>}>
          <dl className="terms">
            <div>
              <dt>Fixed fee</dt>
              <dd className="num">{eur(v.fiksni)}</dd>
            </div>
            <div>
              <dt>Installments</dt>
              <dd className="num">{nizRata(v.rate)}</dd>
            </div>
            <div>
              <dt>Bonuses</dt>
              <dd className="num">{eur(v.bonusi)}</dd>
            </div>
            <div>
              <dt>Sell-on</dt>
              <dd className="num">{pct(v.sellOnPct)}</dd>
            </div>
            {dogovoreno && (
              <div>
                <dt>Headline value</dt>
                <dd className="num">{eur(d.naslovna)}</dd>
              </div>
            )}
          </dl>
        </Kartica>
        )}

        <Kartica naslov="Documents" id="dokumenta">
          {dokumenta.map((x) => (
            <Red key={x.naziv} naziv={x.naziv} desno={x.chip} />
          ))}
        </Kartica>
      </div>

      {!prodavac && !dogovoreno && (
        <Kartica naslov="Your obligations" id="obaveze">
          <p className="muted">Under negotiation: your payment obligations are calculated once the offer is accepted.</p>
        </Kartica>
      )}
      {!prodavac && dogovoreno && povrat && (
        <Kartica naslov="Your obligations" id="obaveze">
          <p>In this illustration, no payments are due and the deposit of {eur(pogled('buying').povracaj)} is refunded.</p>
        </Kartica>
      )}
      {!prodavac && dogovoreno && !povrat && (
        <Kartica naslov="Your obligations" id="obaveze" desno={<DugmeLink to={putZa('B9')} varijanta="ghost" sm>Payments</DugmeLink>}>
          <div>
              <Red naziv="Escrow deposit" opis={`Due ${DATUM.escrowRok}`} desno={<span><b className="num">{eur(pogled('buying').uplata.ukupno)}</b> <ChipRate status={statusRate(1, poz)} kupac /></span>} />
              <Red naziv="Installment 2" opis={p.dogovoreno.datumiRata[1]} desno={<span><b className="num">{eur(p.dogovoreno.rate[1])}</b> <ChipRate status={statusRate(2, poz)} kupac /></span>} />
              <Red naziv="Installment 3" opis={p.dogovoreno.datumiRata[2]} desno={<span><b className="num">{eur(p.dogovoreno.rate[2])}</b> <ChipRate status={statusRate(3, poz)} kupac /></span>} />
          </div>
        </Kartica>
      )}

      <Kartica naslov="Activity" id="aktivnost">
        {dogadjaji.length === 0 ? (
          <p className="muted">Nothing has happened yet.</p>
        ) : (
          dogadjaji.map((e, i) => <Red key={i} naziv={e.tekst} opis={e.datum} />)
        )}
      </Kartica>
    </Ekran>
  )
}
