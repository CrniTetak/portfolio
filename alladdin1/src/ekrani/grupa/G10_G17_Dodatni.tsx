// Talas 2: G10 Add passenger, G12 Passenger record, G14 Group statement, G17 Advisor & support. Brojke iz stanjeGrupe/izvod/racun.
import { useState } from 'react'
import { useDemo } from '../../demo/DemoProvider'
import { useStanje } from '../../demo/useStanje'
import { Dugme } from '../../komponente/Dugme'
import { Inicijali, Kartica, OznakaStanja, PraznoStanje, TrakaPartnera18 } from '../../komponente/Kartica'
import { PrikaznoPolje } from '../../komponente/PrikaznoPolje'
import { Dve, Strana } from '../../komponente/Strana'
import { Tabela } from '../../komponente/Tabela'
import { useIdi } from '../../okvir/kontekst'
import { datumiKoraka, ROK_POPUNJENOSTI, ROK_RATE3 } from '../../scenario/datumi'
import { datum, eur } from '../../scenario/format'
import { AVANS_PO_PUTNIKU, CENA_V2, FAKTURA_PUTNIKA, NACIN_PLACANJA, RATA2_PO_PUTNIKU, RATA3_PO_PUTNIKU, SEDISTA } from '../../scenario/racun'
import { izvod } from '../../scenario/stanjeGrupe'
import { DEMO, LJUDI, PAKET_MACAU, REF } from '../../scenario/strane'

export function G10Dodaj() {
  const demo = useDemo()
  const idi = useIdi()
  const { poz, s } = useStanje()
  const [dodat, setDodat] = useState(false)
  const novi = LJUDI.noviPutnik
  // dodavanje putnika ima smisla tek kad se upis otvori (korak 5) i dok grupa nije otkazana
  if (s.otkazano || poz.korak < 5)
    return (
      <Strana naslov="Add passenger" stanje="nedostupno">
        <PraznoStanje naslov="Not available">{s.otkazano ? 'This group was cancelled, so passengers cannot be added.' : 'Passengers can be added once the group deposit has arrived and enrollment opens.'}</PraznoStanje>
        <div>
          <Dugme varijanta="secondary" onClick={() => idi('G8')}>
            Back to passengers
          </Dugme>
        </div>
      </Strana>
    )
  return (
    <Strana naslov="Add passenger" stanje={dodat ? 'dodat' : 'dodaj'} popunjeno>
      <Kartica>
        <div className="grid gap-4 md:grid-cols-2">
          <PrikaznoPolje oznaka="Full name" vrednost={novi.ime} />
          <PrikaznoPolje oznaka="E-mail" vrednost={novi.email} />
          <PrikaznoPolje oznaka="Phone" vrednost={novi.telefon} />
          <PrikaznoPolje oznaka="Room type" vrednost="Standard" />
          <PrikaznoPolje oznaka="Special requests" vrednost="None" />
        </div>
        {dodat && (
          <p className="mt-4" role="status">
            <OznakaStanja vrsta="ok">Passenger added (demo)</OznakaStanja> <span className="text-ink-2">The passenger list in this demo does not change.</span>
          </p>
        )}
        <div className="mt-5 flex flex-wrap gap-3">
          <Dugme
            onClick={() => {
              setDodat(true)
              demo.obavesti()
            }}
          >
            Add passenger
          </Dugme>
          <Dugme varijanta="secondary" onClick={() => demo.obavesti()}>
            Send invitation e-mail
          </Dugme>
          <Dugme varijanta="text" onClick={() => idi('G8')}>
            Back to passengers
          </Dugme>
        </div>
      </Kartica>
    </Strana>
  )
}

export function G12Karton() {
  const { poz, s } = useStanje()
  const demo = useDemo()
  const [tab, setTab] = useState<'details' | 'payments'>('details')
  if (!s.marko.upisan)
    return (
      <Strana naslov={`Passenger: ${LJUDI.putnik.ime}`} stanje="nije-poceo">
        <PraznoStanje>The passenger record appears once the traveler has finished enrollment.</PraznoStanje>
      </Strana>
    )
  const m = s.marko
  const sledeca = !m.rata2Placena ? { iznos: RATA2_PO_PUTNIKU, rok: ROK_POPUNJENOSTI } : !m.rata3Placena ? { iznos: RATA3_PO_PUTNIKU, rok: ROK_RATE3 } : null
  const status = s.otkazano
    ? `Group cancelled — refund of ${eur(m.povracaj)} ${s.povracaj?.potvrdjen ? 'confirmed' : 'being processed'}`
    : `Paid ${eur(m.placeno)} of ${eur(CENA_V2)}${sledeca ? ` · next due ${eur(sledeca.iznos)} on ${datum(sledeca.rok)}` : ' · paid in full'}`
  const k = (korak: number, i: number) => datum(datumiKoraka(korak, 'A')[i])
  const uplate = [
    { opis: 'Group deposit credit', datum: datum(datumiKoraka(4, 'A').at(-1)!), iznos: eur(AVANS_PO_PUTNIKU), nacin: 'Covered by group deposit', status: 'ok' as const, tekst: 'Paid' },
    { opis: 'Installment 2', datum: m.rata2Placena ? k(6, 1) : datum(ROK_POPUNJENOSTI), iznos: eur(RATA2_PO_PUTNIKU), nacin: NACIN_PLACANJA.rata2, status: m.rata2Placena ? ('ok' as const) : ('warn' as const), tekst: m.rata2Placena ? 'Paid' : 'Due' },
    { opis: 'Installment 3', datum: m.rata3Placena ? k(8, 1) : datum(ROK_RATE3), iznos: eur(RATA3_PO_PUTNIKU), nacin: NACIN_PLACANJA.rata3, status: m.rata3Placena ? ('ok' as const) : ('neu' as const), tekst: m.rata3Placena ? 'Paid' : 'Open' },
  ]
  return (
    <Strana naslov={`Passenger: ${LJUDI.putnik.ime}`} stanje={`karton-${poz.korak}`} podnaslov={status}>
      <div role="tablist" aria-label="Passenger record" className="flex gap-6 border-b border-gold-800">
        {(['details', 'payments'] as const).map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={`min-h-11 border-b-2 text-[13px] font-semibold tracking-[.12em] uppercase ${tab === t ? 'border-gold-500 text-gold-500' : 'border-transparent text-ink-2'}`}
          >
            {t === 'details' ? 'Details' : 'Payments & invoices'}
          </button>
        ))}
      </div>
      {tab === 'details' ? (
        <Kartica>
          <div className="grid gap-4 md:grid-cols-2">
            <PrikaznoPolje oznaka="E-mail" vrednost={LJUDI.putnik.email} />
            <PrikaznoPolje oznaka="Phone" vrednost={LJUDI.putnik.telefon} />
            <PrikaznoPolje oznaka="Room" vrednost="VIP suite" />
            <PrikaznoPolje oznaka="Special requests" vrednost="None" />
            <PrikaznoPolje oznaka="Passport" vrednost={DEMO.pasosKraj} />
            <PrikaznoPolje oznaka="Consents accepted" vrednost={datum(datumiKoraka(5, 'A').at(-1)!)} />
          </div>
          <p className="polje-pomoc mt-3">Pre-filled for the demo</p>
        </Kartica>
      ) : (
        <>
          <Kartica naslov="Payments">
            <Tabela
              naslov="Payments"
              kljuc={(r) => r.opis}
              redovi={uplate}
              kolone={[
                { naslov: 'Payment', glavna: true, celija: (r) => r.opis },
                { naslov: 'Date', celija: (r) => r.datum },
                { naslov: 'Amount', desno: true, celija: (r) => r.iznos },
                { naslov: 'Method', celija: (r) => r.nacin },
                { naslov: 'Status', celija: (r) => <OznakaStanja vrsta={s.otkazano ? (r.opis === 'Group deposit credit' ? 'info' : 'neu') : r.status}>{s.otkazano ? (r.opis === 'Installment 3' ? 'Cancelled — not charged' : r.opis === 'Installment 2' ? 'Refunded' : 'Covered by group deposit') : r.tekst}</OznakaStanja> },
              ]}
            />
          </Kartica>
          <Kartica naslov="Invoices">
            {m.rata3Placena && !s.otkazano ? (
              <Tabela
                naslov="Invoices"
                kljuc={(r) => r.broj}
                redovi={[{ broj: `${REF.faktura}0001`, datum: k(8, 1), iznos: eur(FAKTURA_PUTNIKA) }]}
                kolone={[
                  { naslov: 'No.', glavna: true, celija: (r) => r.broj },
                  { naslov: 'Date', celija: (r) => r.datum },
                  { naslov: 'Amount', desno: true, celija: (r) => r.iznos },
                  { naslov: 'Status', celija: () => <OznakaStanja vrsta="ok">Issued</OznakaStanja> },
                ]}
              />
            ) : s.otkazano ? (
              <p className="text-ink-3">No invoice — group cancelled</p>
            ) : (
              <p className="text-ink-3">No invoice yet. It is issued when the final installment is paid.</p>
            )}
          </Kartica>
        </>
      )}
      {sledeca && !s.otkazano && (
        <div>
          <Dugme varijanta="secondary" onClick={() => demo.obavesti()}>
            Send reminder
          </Dugme>
        </div>
      )}
      <TrakaPartnera18 />
    </Strana>
  )
}

export function G14Izvod() {
  const { poz, s } = useStanje()
  const demo = useDemo()
  const idi = useIdi()
  const [svi, setSvi] = useState(false)
  const iz = izvod(poz)
  if (!s.avansPrimljen)
    return (
      <Strana naslov="Group statement" stanje="nije-poceo">
        <PraznoStanje>The statement appears once the group deposit has been received.</PraznoStanje>
      </Strana>
    )
  type Red = { stavka: string; iznos: string }
  const redovi: Red[] = []
  if (iz.avansFaktura) redovi.push({ stavka: 'Group deposit invoice', iznos: eur(iz.avansFaktura) })
  if (iz.kreditnaNota) redovi.push({ stavka: poz.ishod === 'B' ? 'Credit note (deposit for released seats)' : 'Credit note (deposit refund)', iznos: eur(iz.kreditnaNota) })
  if (poz.ishod !== 'C') redovi.push({ stavka: `Traveler invoices: ${iz.brojFaktura} × ${eur(FAKTURA_PUTNIKA)}`, iznos: eur(iz.fakturePutnika) })
  const nPrikaz = svi ? Math.min(iz.brojFaktura, SEDISTA) : Math.min(iz.brojFaktura, 5)
  const fakture = Array.from({ length: nPrikaz }, (_, i) => ({ broj: `${REF.faktura}${String(i + 1).padStart(4, '0')}` }))
  return (
    <Strana naslov="Group statement" stanje={`izvod-${poz.korak}-${poz.n}`} podnaslov={PAKET_MACAU}>
      <Kartica naslov="Statement">
        <Tabela
          naslov="Statement"
          kljuc={(r) => r.stavka}
          redovi={redovi}
          kolone={[
            { naslov: 'Item', glavna: true, celija: (r) => r.stavka },
            { naslov: 'Amount', desno: true, celija: (r) => r.iznos },
          ]}
          podnozje={
            <span className="flex justify-between gap-4 font-semibold">
              <span>{poz.ishod === 'C' ? 'Retained handling fee' : 'Total'}</span>
              <span className="num text-gold-400">{eur(iz.ukupno)}</span>
            </span>
          }
        />
        {poz.ishod === 'C' && <p className="polje-pomoc mt-3">Traveler payments are refunded in full and are not invoiced.</p>}
        <p className="polje-pomoc mt-3">Demo document — not a real invoice.</p>
      </Kartica>
      {poz.ishod !== 'C' && (
        <Kartica naslov="Traveler invoices">
          {fakture.length === 0 ? (
            <p className="text-ink-3">No traveler invoices yet. They are issued as final installments arrive.</p>
          ) : (
            <>
              <Tabela
                naslov="Invoices"
                kljuc={(r) => r.broj}
                redovi={fakture}
                kolone={[
                  { naslov: 'No.', glavna: true, celija: (r) => r.broj },
                  { naslov: 'Amount', desno: true, celija: () => eur(FAKTURA_PUTNIKA) },
                  { naslov: 'Status', celija: () => <OznakaStanja vrsta="ok">Issued</OznakaStanja> },
                ]}
              />
              <p className="polje-pomoc mt-3">
                Showing {fakture.length} of {iz.brojFaktura}
              </p>
              {iz.brojFaktura > 5 && (
                <Dugme varijanta="text" onClick={() => setSvi(!svi)}>
                  {svi ? 'Show fewer' : 'Show all'}
                </Dugme>
              )}
            </>
          )}
        </Kartica>
      )}
      <div className="flex flex-wrap gap-3">
        <Dugme onClick={() => demo.obavesti()}>Download statement (PDF)</Dugme>
        <Dugme varijanta="secondary" onClick={() => idi('G13')}>
          Back to finances
        </Dugme>
      </div>
      <TrakaPartnera18 />
    </Strana>
  )
}

export function G17Podrska() {
  const demo = useDemo()
  const { s } = useStanje()
  // u ishodu C grupa je otkazana: otvoreni zahtev je zatvoren
  const zahtevi = [
    { id: REF.podrska1, tema: 'Room allocation', status: 'Resolved' },
    { id: REF.podrska2, tema: 'Airport transfer for the group', status: s.otkazano ? 'Closed' : 'Active' },
  ]
  return (
    <Strana naslov="Advisor & support" stanje="podrska" popunjeno>
      <div className="grid gap-6 lg:grid-cols-3">
        <Kartica naslov="Your group advisor">
          <div className="flex items-center gap-4">
            <Inicijali tekst={LJUDI.savetnik.inicijali} />
            <div>
              <p className="font-semibold">{LJUDI.savetnik.ime}</p>
              <p className="text-ink-2">{LJUDI.savetnik.titula}</p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <Dugme onClick={() => demo.otvoriPoruku(true)}>Message</Dugme>
            <Dugme varijanta="secondary" onClick={() => demo.obavesti()}>
              Schedule video call
            </Dugme>
          </div>
        </Kartica>
        <Kartica naslov="Post a new request">
          <div className="flex flex-col gap-3">
            <PrikaznoPolje oznaka="Group" vrednost={PAKET_MACAU} />
            <PrikaznoPolje oznaka="Trip type" vrednost="Concierge / VIP services" />
            <PrikaznoPolje oznaka="Description" vrednost="Please arrange an airport transfer for the whole group." />
            <Dugme onClick={() => demo.obavesti()}>Submit request</Dugme>
          </div>
        </Kartica>
        <Kartica naslov="Luxury services">
          <ul className="mb-4 flex flex-col gap-2 text-ink-2">
            <li>Private jet transfer</li>
            <li>Fine-dining reservation</li>
            <li>VIP excursions and private tours</li>
          </ul>
          <Dugme varijanta="secondary" onClick={() => demo.obavesti()}>
            Request a quote
          </Dugme>
        </Kartica>
      </div>
      <Dve
        levo={
          <Kartica naslov="Active and resolved requests">
            <Tabela
              naslov="Requests"
              kljuc={(r) => r.id}
              redovi={zahtevi}
              kolone={[
                { naslov: 'ID', glavna: true, celija: (r) => r.id },
                { naslov: 'Trip / service', celija: (r) => r.tema },
                { naslov: 'Status', celija: (r) => <OznakaStanja vrsta={r.status === 'Resolved' ? 'ok' : r.status === 'Closed' ? 'neu' : 'info'}>{r.status}</OznakaStanja> },
              ]}
            />
          </Kartica>
        }
        desno={<TrakaPartnera18 />}
      />
    </Strana>
  )
}
