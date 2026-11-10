// T5 My trips (kuća putnika), T6 Group seat, T9 Trip documents. Status putnika Marka iz stanjeGrupe(poz).marko.
import { useDemo } from '../../demo/DemoProvider'
import { useStanje } from '../../demo/useStanje'
import { Dugme } from '../../komponente/Dugme'
import { Kartica, OznakaStanja, PraznoStanje, TrakaPartnera18 } from '../../komponente/Kartica'
import { RadnjaDugme } from '../../komponente/RadnjaDugme'
import { Dve, Strana } from '../../komponente/Strana'
import { useIdi } from '../../okvir/kontekst'
import { BROJ_KORAKA, CENA_V2, PASOS_VAZI_MESECI, RATA2_PO_PUTNIKU, RATA3_PO_PUTNIKU } from '../../scenario/racun'
import { KRAJ_PUTOVANJA, POLAZAK, POVRACAJ_POTVRDJEN_C, ROK_POPUNJENOSTI, ROK_RATE3, ZATVORENO_C } from '../../scenario/datumi'
import { datum, eur, opsegDatuma } from '../../scenario/format'
import { HOTEL_MACAU, KLUB, LJUDI, PAKET_MACAU } from '../../scenario/strane'
import { NAZIVI_KORAKA } from '../../prica/koraci'
import { porukePutnika } from '../../tekstovi/poruke'
import { sviZahtevi } from '../../tokovi/zahtevi'
import type { Poz } from '../../prica/tipovi'
import type { StanjeGrupe } from '../../scenario/stanjeGrupe'

/** Jedna rečenica statusa po stanju (T6). */
function recenicaStatusa(poz: Poz, s: StanjeGrupe): string {
  if (!s.marko.upisan) return 'You are not enrolled yet.'
  if (s.otkazano) return s.povracaj?.potvrdjen ? `Group cancelled — ${eur(s.marko.povracaj)} refund confirmed on ${datum(POVRACAJ_POTVRDJEN_C)}` : `Group cancelled — your ${eur(s.marko.povracaj)} refund is being processed`
  if (poz.korak <= 5) return 'You’re enrolled — your seat is covered by the group deposit.'
  if (poz.korak === 6) return s.marko.rata2Placena ? 'Installment 2 paid — thank you.' : 'Installment 2 is open.'
  if (poz.korak === 7) {
    if (s.izbor === 'B') return 'Your seat is in the smaller block.'
    if (s.blokPotvrdjen) return 'Your seat is confirmed.'
    return 'Deadline day — waiting for the group to fill.'
  }
  if (poz.korak === 8) return s.marko.rata3Placena ? 'Paid in full. Thank you.' : 'The final installment is open.'
  return s.paketPutovanja === 'issued' ? 'Your documents are ready.' : 'Your documents are being prepared.'
}

export function T5Putovanja() {
  const { poz, s } = useStanje()
  const idi = useIdi()
  const demo = useDemo()
  const individualne = sviZahtevi(demo.tokovi)
  const imaSve = s.marko.upisan || individualne.length > 0
  return (
    <Strana naslov="My trips" stanje={imaSve ? 'ima-putovanje' : 'prazno'}>
      <Dve
        levo={
          <>
          {s.marko.upisan && (
            <Kartica naslov={PAKET_MACAU}>
              <p className="mb-1 text-gold-400">Group seat · Step {poz.korak} of {BROJ_KORAKA}</p>
              <p className="mb-4 text-ink-2">{opsegDatuma(POLAZAK, KRAJ_PUTOVANJA)} · {NAZIVI_KORAKA[poz.korak - 1]}</p>
              <Dugme varijanta="secondary" onClick={() => idi('T6')}>
                View my seat
              </Dugme>
            </Kartica>
          )}
          {individualne.map((r) => (
            <Kartica key={r.id} naslov={r.naziv}>
              <p className="mb-1 text-gold-400">{r.odbijeno ? 'Declined' : r.faze[r.faza]}</p>
              <p className="mb-4 text-ink-2">
                {r.tip} · Ref {r.ref}
              </p>
              <Dugme varijanta="secondary" onClick={() => idi('T7')}>
                View details
              </Dugme>
            </Kartica>
          ))}
          {!imaSve && (
            <PraznoStanje naslov="Nothing here yet">
              {poz.korak <= 4 ? 'Your organizer is still planning. Your trip will appear here once you join the group.' : 'Trips and requests will appear here.'}
            </PraznoStanje>
          )}
          </>
        }
        desno={
          <>
            <Kartica naslov={`Messages (${porukePutnika(poz, s).length})`} tiha>
              <Dugme varijanta="text" onClick={() => idi('T8')}>
                Open messages
              </Dugme>
            </Kartica>
            <Kartica naslov="All-In status" tiha>
              <Dugme varijanta="text" onClick={() => idi('B2')}>
                See my status
              </Dugme>
            </Kartica>
          </>
        }
      />
    </Strana>
  )
}

export function T6Mesto() {
  const { poz, s } = useStanje()
  const demo = useDemo()
  const idi = useIdi()
  if (!s.marko.upisan)
    return (
      <Strana naslov="Group seat" stanje="nije-upisan">
        <PraznoStanje>Join the group and your seat, payments and documents will appear here.</PraznoStanje>
        <div>
          <Dugme varijanta="secondary" onClick={() => idi('T1')}>
            Join the group
          </Dugme>
        </div>
      </Strana>
    )
  const placeno = s.marko.placeno
  const sledeca = !s.marko.rata2Placena ? { iznos: RATA2_PO_PUTNIKU, rok: ROK_POPUNJENOSTI } : !s.marko.rata3Placena ? { iznos: RATA3_PO_PUTNIKU, rok: ROK_RATE3 } : null
  const rata2OtvorenaSad = poz.korak === 6 && !s.marko.rata2Placena
  const dokumentaOtvorena = s.paketPutovanja === 'issued'
  return (
    <Strana naslov="Group seat" stanje={s.otkazano ? 'otkazano' : `korak-${poz.korak}`} podnaslov={PAKET_MACAU}>
      <Kartica>
        <p className="text-[18px]" data-status-putnika>
          {recenicaStatusa(poz, s)}
        </p>
        {s.otkazano && s.zatvoreno && (
          <p className="mt-1 text-ink-2">
            <OznakaStanja vrsta="neu">Closed</OznakaStanja> <span className="num">{datum(ZATVORENO_C)}</span>
          </p>
        )}
        {!s.otkazano && (
          <p className="mt-1 text-ink-2">
            Paid {eur(placeno)} of {eur(CENA_V2)}
            {sledeca ? ` · next ${eur(sledeca.iznos)} due ${datum(sledeca.rok)}` : ''}
          </p>
        )}
      </Kartica>
      <Dve
        levo={
          <Kartica naslov="Your payments">
            <ul className="flex flex-col gap-3">
              <li className="flex flex-wrap items-center justify-between gap-2">
                <span>Group deposit credit</span>
                <OznakaStanja vrsta={s.otkazano ? 'info' : 'ok'}>{s.otkazano ? 'Covered by group deposit' : 'Paid'}</OznakaStanja>
              </li>
              <li className="flex flex-wrap items-center justify-between gap-2">
                <span>Installment 2 · {eur(RATA2_PO_PUTNIKU)}</span>
                {s.otkazano ? <OznakaStanja vrsta="neu">Refunded</OznakaStanja> : s.marko.rata2Placena ? <OznakaStanja vrsta="ok">Paid</OznakaStanja> : <OznakaStanja vrsta="warn">Due</OznakaStanja>}
              </li>
              <li className="flex flex-wrap items-center justify-between gap-2">
                <span>Installment 3 · {eur(RATA3_PO_PUTNIKU)}</span>
                {s.otkazano ? <OznakaStanja vrsta="neu">Cancelled — not charged</OznakaStanja> : s.marko.rata3Placena ? <OznakaStanja vrsta="ok">Paid</OznakaStanja> : <OznakaStanja vrsta="neu">Open</OznakaStanja>}
              </li>
            </ul>
            <div className="mt-4 flex flex-wrap gap-3">
              {rata2OtvorenaSad && (
                <Dugme onClick={() => idi('T3')}>
                  Pay {eur(RATA2_PO_PUTNIKU)}
                </Dugme>
              )}
              {poz.korak === 8 && !s.marko.rata3Placena && !s.otkazano && <Dugme onClick={() => idi('T3')}>Pay {eur(RATA3_PO_PUTNIKU)}</Dugme>}
              {poz.korak === 7 && poz.ishod === 'A' && !s.blokPotvrdjen && s.rata2Sedista < s.blokSedista && <RadnjaDugme id="7.sim">Simulate: the last seats are paid on the deadline day</RadnjaDugme>}
            </div>
          </Kartica>
        }
        desno={
          <>
            <Kartica naslov="Your group">
              <ul className="flex flex-col gap-1.5 text-ink-2">
                <li>Organizer: {LJUDI.organizator.ime} ({KLUB})</li>
                <li>Advisor: {LJUDI.savetnik.ime}</li>
                <li>Hotel: {HOTEL_MACAU}</li>
                <li>Room: VIP suite</li>
              </ul>
            </Kartica>
            <Kartica naslov="Documents" tiha>
              {dokumentaOtvorena ? (
                <Dugme varijanta="secondary" onClick={() => idi('T9')}>
                  Open documents
                </Dugme>
              ) : (
                <p className="text-ink-2">Available once your advisor sends the trip pack.</p>
              )}
            </Kartica>
            <div className="flex flex-wrap gap-3">
              <Dugme varijanta="secondary" onClick={() => demo.obavesti()}>
                Change my details
              </Dugme>
              <Dugme varijanta="secondary" onClick={() => demo.otvoriPoruku(true)}>
                Message advisor
              </Dugme>
            </div>
          </>
        }
      />
      <TrakaPartnera18 />
    </Strana>
  )
}

export function T9Dokumenta() {
  const { s } = useStanje()
  const demo = useDemo()
  const gotovo = s.paketPutovanja === 'issued'
  const lista = ['E-ticket voucher (charter, Belgrade → Macau)', `Hotel voucher (${HOTEL_MACAU})`, 'Itinerary']
  return (
    <Strana naslov={`Your trip documents · departs ${datum(POLAZAK)}`} stanje={gotovo ? 'spremno' : 'priprema'}>
      {!gotovo ? (
        <PraznoStanje naslov={s.otkazano ? 'Closed' : 'Documents being prepared'}>{s.otkazano ? 'This group was cancelled.' : 'Your vouchers and itinerary will appear here once your advisor issues the trip pack.'}</PraznoStanje>
      ) : (
        <>
        <div className="grid gap-4 md:grid-cols-2">
          {lista.map((d) => (
            <Kartica key={d}>
              <p className="mb-3">{d}</p>
              <Dugme varijanta="secondary" mala onClick={() => demo.obavesti()}>
                Download
              </Dugme>
            </Kartica>
          ))}
          <Kartica>
            <p>Check your passport validity requirements (usually at least {PASOS_VAZI_MESECI} months after your return).</p>
          </Kartica>
          <Kartica>
            <p>Your advisor: {LJUDI.savetnik.ime}</p>
          </Kartica>
        </div>
        <TrakaPartnera18 />
        </>
      )}
    </Strana>
  )
}
