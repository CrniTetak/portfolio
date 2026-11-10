// M1–M8 Monte Karlo. PUN tok "Request a quote" (zahtev → primljen → ponuda → avans → potvrda) postoji samo za Royal Suite.
// Svi ostali zahtevi (događaji iz M8, ostali rezultati) iskreno završavaju na "Quote requested" i vidljivi su u T5/T7/V5 kao poseban zahtev.
// Nema "Confirm and pay"; velike iznose naplaćujemo transferom ili linkom. Kazino sadržaj je uvek ponuda partnera uz 18+.
import { Check } from 'lucide-react'
import { useState } from 'react'
import { useDemo } from '../../demo/DemoProvider'
import { Dugme } from '../../komponente/Dugme'
import { Kartica, OznakaStanja, PraznoStanje, RedOrganizatora, TrakaPartnera18 } from '../../komponente/Kartica'
import { Kvacica } from '../../komponente/Kontrole'
import { PrikaznoPolje } from '../../komponente/PrikaznoPolje'
import { Slika } from '../../komponente/Slika'
import { Dve, Potvrda, Strana } from '../../komponente/Strana'
import { Tabela } from '../../komponente/Tabela'
import { TokDugme } from '../../komponente/TokDugme'
import { useEkran, useIdi } from '../../okvir/kontekst'
import { podaciUloge } from '../../okvir/korisnik'
import { link } from '../../pravila/rute'
import { SALDO_MONTE_KARLO } from '../../scenario/datumi'
import { datum, eur, noci, opsegDatuma, procenat } from '../../scenario/format'
import { cenaOdTekst, MK_DOGADJAJI, MK_OPSEZI, MK_REZULTATI, MONTE_KARLO, monteKarloAvans, monteKarloSaldo, monteKarloUkupno, paket, refKataloga } from '../../scenario/ponude'
import { PONUDA_VAZI_DANA } from '../../scenario/racun'
import { DEMO, HOTEL_MONTE_KARLO, KORISNIK_NALOG, REF, REF_TOKOVI } from '../../scenario/strane'
import { BEZ_FAJLA, FILTERI_ILUSTRACIJA, GRADOVI_DOGADJAJA, MK_UKLJUCENO, ZAHTEV_PRIMLJEN_TEKST } from '../../tekstovi/tokovi'
import { dodajZahtev, napreduj, odbij, posaljiRoyal } from '../../tokovi/tokovi'

const ROYAL = paket('royal')

function Podmeni({ aktivan }: { aktivan: 'M1' | 'M8' | 'B1' }) {
  const idi = useIdi()
  const stavke: { naziv: string; ekran: 'M1' | 'M8' | 'B1' }[] = [
    { naziv: 'Experiences', ekran: 'M1' },
    { naziv: 'Events & Tournaments', ekran: 'M8' },
    { naziv: 'All-In', ekran: 'B1' },
  ]
  return (
    <nav aria-label="Monte Carlo" className="flex flex-wrap gap-x-6 border-b border-gold-800">
      {stavke.map((s) => (
        <button key={s.ekran} type="button" aria-current={aktivan === s.ekran ? 'page' : undefined} onClick={() => idi(s.ekran)} className={`nav-stavka nav-mala ${aktivan === s.ekran ? 'nav-aktivna' : ''}`}>
          {s.naziv}
        </button>
      ))}
    </nav>
  )
}

export function M1Rezultati() {
  const idi = useIdi()
  const demo = useDemo()
  return (
    <Strana naslov="Monte Carlo experiences" stanje="rezultati">
      <Podmeni aktivan="M1" />
      <Kartica>
        <div className="grid gap-4 md:grid-cols-4">
          <PrikaznoPolje oznaka="Destination" vrednost="Monte Carlo" />
          <PrikaznoPolje oznaka="Date of stay" vrednost={opsegDatuma(ROYAL.od, ROYAL.do)} />
          <PrikaznoPolje oznaka="Guests" vrednost={String(MONTE_KARLO.gostiju)} />
          <div className="flex items-end">
            <Dugme siroko onClick={() => demo.obavesti(FILTERI_ILUSTRACIJA)}>
              Search
            </Dugme>
          </div>
        </div>
      </Kartica>
      <Dve
        levo={
          <>
            <p className="text-ink-2">Sort: Most popular</p>
            <div className="grid gap-4 md:grid-cols-2">
              {MK_REZULTATI.map((r) => (
                <Kartica key={r.kljuc}>
                  <p className="font-display text-[24px] leading-7 font-semibold">{r.naziv}</p>
                  <p className="my-3 text-gold-400">{cenaOdTekst(r)}</p>
                  <Dugme
                    varijanta="secondary"
                    onClick={() => {
                      if (r.kljuc === 'royal') idi('M2')
                      else {
                        demo.promeniTokove((t) => ({ ...t, s8Kljuc: r.kljuc }))
                        idi('S8')
                      }
                    }}
                  >
                    View details
                  </Dugme>
                </Kartica>
              ))}
            </div>
          </>
        }
        desno={
          <Kartica naslov="Filters">
            <div className="flex flex-col gap-3">
              <PrikaznoPolje oznaka="Offer type" vrednost="All types" />
              <PrikaznoPolje oznaka="Price" vrednost={`${eur(MK_OPSEZI[0][0])} – ${eur(MK_OPSEZI[1][1])}`} />
              <PrikaznoPolje oznaka="Amenities" vrednost="Any" />
              <Dugme varijanta="secondary" onClick={() => demo.obavesti(FILTERI_ILUSTRACIJA)}>
                Apply filters
              </Dugme>
            </div>
          </Kartica>
        }
      />
      <TrakaPartnera18 />
      <RedOrganizatora />
    </Strana>
  )
}

export function M2Detalj() {
  const idi = useIdi()
  const demo = useDemo()
  return (
    <Strana naslov={`${ROYAL.naziv} — ${HOTEL_MONTE_KARLO}`} stanje="detalj">
      <Dve
        levo={
          <>
            <Slika id="hotel-apartman" prva />
        <p className="polje-pomoc px-4 pb-3">Illustrative image</p>
            <Kartica naslov="What's included">
              <ul className="flex flex-col gap-2 text-ink-2">
                {MK_UKLJUCENO.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </Kartica>
            <TrakaPartnera18>Partner benefits (offered by the partner casino under its licence, 18+): welcome reception at the casino salon, show tickets.</TrakaPartnera18>
          </>
        }
        desno={
          <Kartica naslov="Indicative price">
            <p className="num font-display text-[34px] leading-10 font-semibold text-gold-400">from {eur(monteKarloUkupno)}</p>
            <p className="mb-4 text-ink-2">
              for {MONTE_KARLO.gostiju} guests · {noci(ROYAL.noci)} — the final price is in your quote
            </p>
            <div className="flex flex-col gap-3">
              <Dugme
                siroko
                onClick={() => {
                  demo.promeniTokove((t) => ({ ...t, mkDogadjaj: null }))
                  idi('M3')
                }}
              >
                Request a quote
              </Dugme>
              <Dugme varijanta="secondary" siroko onClick={() => demo.obavesti()}>
                Ask an advisor
              </Dugme>
              <RedOrganizatora />
            </div>
          </Kartica>
        }
      />
    </Strana>
  )
}

export function M3Zahtev() {
  const demo = useDemo()
  const { uloga } = useEkran()
  const k = podaciUloge(uloga)
  // potvrde NISU unapred štiklirane: korisnik ih štiklira, a dugme do tada kaže šta fali
  const [punoletan, setPunoletan] = useState(false)
  const [kontakt, setKontakt] = useState(false)
  const t = demo.tokovi
  const dogadjaj = t.mkDogadjaj ? paket(t.mkDogadjaj) : null
  const cilj = dogadjaj ?? ROYAL
  const fali = !punoletan && !kontakt ? 'Tick both confirmations to continue' : !punoletan ? 'Confirm that you are 18 or over' : !kontakt ? 'Tick the contact consent to continue' : undefined
  return (
    <Strana naslov="Request a quote" stanje={dogadjaj ? 'dogadjaj' : 'royal'} popunjeno>
      <Dve
        levo={
          <Kartica naslov="Your stay">
            <ul className="flex flex-col gap-2 text-ink-2">
              <li>{cilj.naziv}</li>
              <li>{opsegDatuma(cilj.od, cilj.do)}</li>
              <li>{MONTE_KARLO.gostiju} guests</li>
            </ul>
            {dogadjaj && (
              <div className="mt-4">
                <TrakaPartnera18>Event organised by the partner casino under its own licence and terms. 18+.</TrakaPartnera18>
              </div>
            )}
          </Kartica>
        }
        desno={
          <Kartica naslov="Your details">
            <div className="flex flex-col gap-3">
              <PrikaznoPolje oznaka="Full name" vrednost={k.ime} />
              <PrikaznoPolje oznaka="E-mail" vrednost={k.email} />
              <PrikaznoPolje oznaka="Phone" vrednost={k.telefon} />
              <PrikaznoPolje oznaka="Special request" vrednost="A quiet room with a view" />
              <Kvacica oznaka="I confirm I am 18 or over" checked={punoletan} onChange={setPunoletan} obavezna />
              <Kvacica oznaka="I agree that AllAddIn1 contacts me about this request" checked={kontakt} onChange={setKontakt} obavezna />
              <TokDugme primeni={(x) => (dogadjaj ? dodajZahtev(x, dogadjaj.kljuc) : posaljiRoyal(x))} nakon={(u) => link('M4', u)} blokirano={fali}>
                Request a quote
              </TokDugme>
              <p className="text-[13px] text-ink-3">No payment now. We need your passport details only after you accept a quote.</p>
            </div>
          </Kartica>
        }
      />
    </Strana>
  )
}

export function M4Primljen() {
  const demo = useDemo()
  const idi = useIdi()
  const t = demo.tokovi
  const kljuc = t.poslednji ?? (t.monteKarlo !== 'none' ? 'royal' : null)
  if (!kljuc)
    return (
      <Strana naslov="Request received" stanje="nije-poceo">
        <PraznoStanje>Send a request first. A confirmation of your request will appear here.</PraznoStanje>
      </Strana>
    )
  const p = paket(kljuc)
  const puniTok = kljuc === 'royal'
  const indeks = t.zahtevi.indexOf(kljuc)
  const ref = puniTok ? REF.zahtev1 : refKataloga(indeks < 0 ? 0 : indeks)
  return (
    <Strana stanje={puniTok ? t.monteKarlo : 'zahtev'}>
      <Kartica className="mx-auto w-full max-w-2xl">
        <Potvrda naslov="Request received" ikona={<Check size={36} strokeWidth={2} className="text-ok" aria-hidden="true" />}>
          <p className="num text-gold-400">{ref}</p>
          <p className="text-ink-2">
            {p.naziv} · {opsegDatuma(p.od, p.do)}
          </p>
          {puniTok ? <p>Your advisor will send a personal quote.</p> : <p data-zahtev-tekst>{ZAHTEV_PRIMLJEN_TEKST}.</p>}
          {!puniTok && <p className="text-ink-2">{cenaOdTekst(p)}. The final price is in the quote.</p>}
          {p.tip === 'Event' && <TrakaPartnera18>Event organised by the partner casino under its own licence and terms. 18+.</TrakaPartnera18>}
          <div className="mt-3 flex flex-wrap justify-center gap-3">
            <Dugme onClick={() => idi('T7', 'traveler')}>Go to my trips</Dugme>
            {puniTok && t.monteKarlo === 'zatrazeno' && (
              <TokDugme varijanta="secondary" primeni={(x) => napreduj(x, 'monteKarlo', 'ponuda')} nakon={(u) => link('M5', u)}>
                Demo shortcut: advisor replies now
              </TokDugme>
            )}
          </div>
        </Potvrda>
      </Kartica>
    </Strana>
  )
}

export function M5Ponuda() {
  const demo = useDemo()
  const t = demo.tokovi
  if (t.monteKarlo === 'none' || t.monteKarlo === 'zatrazeno')
    return (
      <Strana naslov="Your quote" stanje="ceka">
        <PraznoStanje naslov="Waiting for your advisor's quote">{t.monteKarlo === 'none' ? 'Send a request for the Royal Suite first.' : 'Your advisor is preparing a personal quote.'}</PraznoStanje>
      </Strana>
    )
  if (t.monteKarlo === 'odbijeno')
    return (
      <Strana naslov={`Your quote — ${ROYAL.naziv}`} stanje="odbijeno">
        <Kartica>
          <OznakaStanja vrsta="neu">Declined</OznakaStanja>
          <p className="mt-3 text-ink-2">You declined this quote. Nothing was charged.</p>
          <div className="mt-4">
            <RedOrganizatora />
          </div>
        </Kartica>
      </Strana>
    )
  return (
    <Strana naslov={`Your quote — ${ROYAL.naziv}`} stanje={t.monteKarlo}>
      <Kartica>
        <Tabela
          naslov="Quote"
          kljuc={(r) => r.naziv}
          redovi={[...MONTE_KARLO.stavke]}
          kolone={[
            { naslov: 'Item', glavna: true, celija: (r) => (r.naziv === 'Royal Suite' ? `${r.naziv}, ${noci(ROYAL.noci)}` : r.naziv) },
            { naslov: 'Amount', desno: true, celija: (r) => eur(r.iznos) },
          ]}
          podnozje={
            <span className="flex justify-between gap-4 font-semibold">
              <span>Total</span>
              <span className="num text-gold-400">{eur(monteKarloUkupno)}</span>
            </span>
          }
        />
        <p className="mt-4 text-ink-2">
          Deposit {procenat(MONTE_KARLO.avansProc)} {eur(monteKarloAvans)} · Balance {eur(monteKarloSaldo)} due {datum(SALDO_MONTE_KARLO)}
        </p>
        <p className="mt-1 text-ink-2">Quote validity: {PONUDA_VAZI_DANA} days (example)</p>
        <p className="mt-1 text-[13px] text-ink-3">Cancellation terms apply as set out in the quote (demo text).</p>
        <div className="mt-4 flex flex-wrap items-start gap-3">
          <TokDugme primeni={(x) => napreduj(x, 'monteKarlo', 'prihvaceno')} nakon={(u) => link('M6', u)}>
            Accept quote and pay deposit
          </TokDugme>
          <Dugme varijanta="secondary" onClick={() => demo.obavesti()}>
            Ask a question
          </Dugme>
          <TokDugme varijanta="danger" primeni={(x) => odbij(x, 'monteKarlo')} nakon={(u) => link('M5', u)}>
            Decline
          </TokDugme>
        </div>
        <div className="mt-4">
          <RedOrganizatora />
        </div>
      </Kartica>
    </Strana>
  )
}

export function M6Avans() {
  const demo = useDemo()
  const t = demo.tokovi
  const [tab, setTab] = useState<'bank' | 'link'>('bank')
  const [otvorena, setOtvorena] = useState(false)
  if (t.monteKarlo !== 'prihvaceno' && t.monteKarlo !== 'potvrdjeno')
    return (
      <Strana naslov="Deposit" stanje="nije-poceo">
        <PraznoStanje>Accept your quote first. The deposit details will appear here.</PraznoStanje>
      </Strana>
    )
  return (
    <Strana naslov={`Deposit ${eur(monteKarloAvans)}`} stanje={t.monteKarlo} popunjeno>
      <div role="group" aria-label="Payment method" className="flex gap-3">
        {(['bank', 'link'] as const).map((k) => (
          <Dugme key={k} varijanta={tab === k ? 'primary' : 'secondary'} mala onClick={() => setTab(k)}>
            {k === 'bank' ? 'Bank transfer' : 'Payment link (demo)'}
          </Dugme>
        ))}
      </div>
      <Kartica>
        {tab === 'bank' ? (
          <div className="flex flex-col gap-4">
            <PrikaznoPolje oznaka="Beneficiary" vrednost={KORISNIK_NALOG} />
            <PrikaznoPolje oznaka="IBAN" vrednost={DEMO.iban} />
            <PrikaznoPolje oznaka="Reference" vrednost={REF_TOKOVI.monteKarlo} />
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <Dugme varijanta="secondary" onClick={() => setOtvorena(!otvorena)}>
              Open payment link
            </Dugme>
            {otvorena && (
              <div className="rounded-card border border-gold-600 p-4" data-demo-stranica>
                <p className="mb-2 font-semibold">Demo payment page</p>
                <PrikaznoPolje oznaka="Card" vrednost={DEMO.kartica} />
                <p className="mt-2 text-[13px] text-ink-3">Demo — no card is charged, nothing is sent</p>
              </div>
            )}
          </div>
        )}
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <TokDugme primeni={(x) => napreduj(x, 'monteKarlo', 'potvrdjeno')} nakon={(u) => link('M7', u)}>
            I have paid
          </TokDugme>
          {t.monteKarlo === 'potvrdjeno' && <OznakaStanja vrsta="ok">Deposit received</OznakaStanja>}
        </div>
        <p className="mt-3 text-[13px] text-ink-3">Large amounts are collected by bank transfer or payment link, not with a single click.</p>
        <div className="mt-3">
          <RedOrganizatora />
        </div>
      </Kartica>
    </Strana>
  )
}

export function M7Potvrda() {
  const demo = useDemo()
  const idi = useIdi()
  const t = demo.tokovi
  if (t.monteKarlo !== 'potvrdjeno')
    return (
      <Strana naslov="Reservation confirmed" stanje="nije-poceo">
        <PraznoStanje>Your reservation appears here once the deposit is received.</PraznoStanje>
      </Strana>
    )
  return (
    <Strana stanje="potvrdjeno">
      <Kartica className="mx-auto w-full max-w-2xl">
        <Potvrda naslov="Your All-In stay is confirmed" ikona={<Check size={36} strokeWidth={2} className="text-ok" aria-hidden="true" />}>
          <p className="num text-gold-400">{REF_TOKOVI.monteKarlo}</p>
          <p className="text-ink-2">
            {ROYAL.naziv} · {opsegDatuma(ROYAL.od, ROYAL.do)}
          </p>
          <p className="text-ink-2">
            Deposit {eur(monteKarloAvans)} received · Balance {eur(monteKarloSaldo)} due {datum(SALDO_MONTE_KARLO)}
          </p>
          <p>Your advisor will be in touch.</p>
          <div className="mt-3 flex flex-wrap justify-center gap-3">
            <Dugme varijanta="secondary" onClick={() => demo.obavesti(BEZ_FAJLA)}>
              Download confirmation
            </Dugme>
            <Dugme varijanta="secondary" onClick={() => idi('B2', 'traveler')}>
              See my All-In status
            </Dugme>
            <Dugme onClick={() => idi('T5', 'traveler')}>Go to my trips</Dugme>
          </div>
          <RedOrganizatora />
        </Potvrda>
      </Kartica>
    </Strana>
  )
}

export function M8Dogadjaji() {
  const demo = useDemo()
  const idi = useIdi()
  return (
    <Strana naslov="Events & Tournaments — organised by partner casinos" stanje="dogadjaji">
      <Podmeni aktivan="M8" />
      <TrakaPartnera18>AllAddIn1 sells travel packages around these events. Entry to the events is arranged with the partner casino, under its licence. 18+.</TrakaPartnera18>
      <div className="grid gap-4 md:grid-cols-3">
        {MK_DOGADJAJI.map((d, i) => (
          <Kartica key={d.kljuc}>
            <p className="font-display text-[24px] leading-7 font-semibold">{d.naziv}</p>
            <p className="mt-1 text-ink-2">{GRADOVI_DOGADJAJA[i]}</p>
            <p className="text-ink-2">{opsegDatuma(d.od, d.do)}</p>
            <p className="my-3 text-gold-400">Travel package {cenaOdTekst(d)}</p>
            <Dugme
              varijanta="secondary"
              onClick={() => {
                demo.promeniTokove((t) => ({ ...t, mkDogadjaj: d.kljuc }))
                idi('M3')
              }}
            >
              Request a quote
            </Dugme>
          </Kartica>
        ))}
      </div>
      <RedOrganizatora />
    </Strana>
  )
}

