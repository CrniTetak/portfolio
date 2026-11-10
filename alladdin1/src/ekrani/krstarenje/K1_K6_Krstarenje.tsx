// K1–K6 Krstarenje (slobodni tok): landing → pretraga → rezultati → paket → porudžbina i demo plaćanje → potvrda.
// Kazino sadržaj je uvek ponuda partnera (operatera kazina na brodu) uz 18+. Brojke iz scenario/ponude.ts (jedan katalog).
import { Check } from 'lucide-react'
import { useState } from 'react'
import { useDemo } from '../../demo/DemoProvider'
import { Dugme } from '../../komponente/Dugme'
import { Kartica, OznakaStanja, PraznoStanje, RedOrganizatora, TrakaPartnera18 } from '../../komponente/Kartica'
import { Kvacica } from '../../komponente/Kontrole'
import { PrikaznoPolje } from '../../komponente/PrikaznoPolje'
import { PozadinaBezSlike } from '../../komponente/Slika'
import { Dve, Potvrda, Strana } from '../../komponente/Strana'
import { TokDugme } from '../../komponente/TokDugme'
import { useEkran, useIdi } from '../../okvir/kontekst'
import { podaciUloge } from '../../okvir/korisnik'
import { link } from '../../pravila/rute'
import { KRSTARENJE_POLAZAK } from '../../scenario/datumi'
import { datum, eur, mesecGodina, noci } from '../../scenario/format'
import { danaKrstarenja, KRSTARENJA, KRSTARENJE, KRSTARENJE_OPSEZI, krstarenjeDodaci, krstarenjeOsnova, krstarenjeUkupno, paket } from '../../scenario/ponude'
import { BROD, DEMO, REF_TOKOVI } from '../../scenario/strane'
import { BEZ_FAJLA, FILTERI_ILUSTRACIJA, ITINERER_KRSTARENJA, KRSTARENJE_FUNKCIJE, KRSTARENJE_PONUDA_KAZINA, KRSTARENJE_PONUDA_STAVKE } from '../../tekstovi/tokovi'
import { napreduj } from '../../tokovi/tokovi'

const NAZIV_DODATKA = 'Premium Drink Package'
const IBERIAN = paket('iberian')

export function K1Krstarenje() {
  const idi = useIdi()
  return (
    <Strana stanje="landing">
      <section className="card relative overflow-hidden p-0!">
        <PozadinaBezSlike hero />
        <div className="slika-tekst">
          <h1 className="naslov-ekrana">Luxury Cruises & Entertainment</h1>
        </div>
      </section>
      <p className="max-w-3xl text-ink-2">Sail the Mediterranean with your group or your partner. Dine, relax and enjoy the evening programme on board. Casino evenings are offered by the ship's casino operator.</p>
      <div>
        <Dugme onClick={() => idi('K2')}>Book Your VIP Cruise</Dugme>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {KRSTARENJE_FUNKCIJE.map((f) => (
          <Kartica key={f.naslov} naslov={f.naslov}>
            <ul className="flex flex-col gap-2 text-ink-2">
              {f.stavke.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </Kartica>
        ))}
      </div>
      <Kartica naslov="VIP CONCIERGE" tiha>
        <p className="mb-3 text-ink-2">Need help choosing? Our advisors plan the whole journey with you.</p>
        <Dugme varijanta="secondary" onClick={() => idi('Q1')}>
          Meet our advisors
        </Dugme>
      </Kartica>
      <TrakaPartnera18 />
    </Strana>
  )
}

export function K2Pretraga() {
  const idi = useIdi()
  const demo = useDemo()
  return (
    <Strana naslov="Find your cruise" stanje="pretraga" popunjeno>
      <Kartica>
        <div className="grid gap-4 md:grid-cols-2">
          <PrikaznoPolje oznaka="Destination" vrednost="Mediterranean" />
          <PrikaznoPolje oznaka="Departure date" vrednost={mesecGodina(KRSTARENJE_POLAZAK)} />
          <PrikaznoPolje oznaka="Duration" vrednost="Any duration" />
          <PrikaznoPolje oznaka="Price range (per person)" vrednost={`${eur(KRSTARENJE_OPSEZI[0][0])} – ${eur(KRSTARENJE_OPSEZI[2][1])}`} />
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <Dugme onClick={() => idi('K3')}>Find cruise</Dugme>
          <Dugme varijanta="text" onClick={() => demo.obavesti(FILTERI_ILUSTRACIJA)}>
            Change filters
          </Dugme>
        </div>
      </Kartica>
    </Strana>
  )
}

export function K3Rezultati() {
  const idi = useIdi()
  const demo = useDemo()
  return (
    <Strana naslov="Cruise & Entertainment Packages" stanje="rezultati">
      <p className="text-ink-2">Mediterranean · {mesecGodina(KRSTARENJE_POLAZAK)}</p>
      <div className="grid gap-4 md:grid-cols-2">
        {KRSTARENJA.map((k) => (
          <Kartica key={k.kljuc}>
            <p className="font-display text-[24px] leading-7 font-semibold">{k.naziv}</p>
            <p className="my-3 text-gold-400">
              {danaKrstarenja(k.noci)} days / {noci(k.noci)} — from {eur(k.cenaOd)} per person
            </p>
            <Dugme
              varijanta="secondary"
              onClick={() => {
                if (k.kljuc === 'iberian') idi('K4')
                else {
                  demo.promeniTokove((t) => ({ ...t, s8Kljuc: k.kljuc }))
                  idi('S8')
                }
              }}
            >
              View details
            </Dugme>
          </Kartica>
        ))}
      </div>
      <TrakaPartnera18 />
      <RedOrganizatora />
    </Strana>
  )
}

export function K4Paket() {
  const idi = useIdi()
  return (
    <Strana naslov={IBERIAN.naziv} stanje="paket" podnaslov={`Ship: ${BROD} · ${danaKrstarenja(IBERIAN.noci)} days / ${noci(IBERIAN.noci)}`}>
      <Dve
        levo={
          <>
            <Kartica naslov="Itinerary & casino details">
              <ul className="flex flex-col gap-2 text-ink-2">
                {ITINERER_KRSTARENJA.map((d) => (
                  <li key={d}>{d}</li>
                ))}
              </ul>
            </Kartica>
            <Kartica naslov="Casino offer" tiha>
              <TrakaPartnera18>{KRSTARENJE_PONUDA_KAZINA[0]}</TrakaPartnera18>
              <ul className="mt-3 flex flex-col gap-2 text-ink-2">
                {KRSTARENJE_PONUDA_STAVKE.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </Kartica>
          </>
        }
        desno={
          <Kartica naslov="Finalize your booking">
            <p className="num font-display text-[34px] leading-10 font-semibold text-gold-400">{eur(KRSTARENJE.cenaPoOsobi)} pp</p>
            <div className="mt-4 flex flex-col gap-3">
              <PrikaznoPolje oznaka="Cabins" vrednost={KRSTARENJE.kabina} />
              <PrikaznoPolje oznaka="Number of guests" vrednost={String(KRSTARENJE.osoba)} />
              <PrikaznoPolje oznaka="Additional services" vrednost={`${NAZIV_DODATKA} ${eur(KRSTARENJE.dodatakPoOsobi)} pp`} />
            </div>
            <dl className="mt-4 grid grid-cols-[1fr_auto] gap-x-4 gap-y-1.5 text-ink-2">
              <dt>
                Base fare {KRSTARENJE.osoba} × {eur(KRSTARENJE.cenaPoOsobi)}
              </dt>
              <dd className="num">{eur(krstarenjeOsnova)}</dd>
              <dt>Add-ons</dt>
              <dd className="num">{eur(krstarenjeDodaci)}</dd>
              <dt>Taxes & fees</dt>
              <dd className="num">{eur(KRSTARENJE.takseIPristojbe)}</dd>
              <dt className="font-semibold text-ink">Total</dt>
              <dd className="num font-semibold text-gold-400">{eur(krstarenjeUkupno)}</dd>
            </dl>
            <div className="mt-4 flex flex-col gap-3">
              <Dugme siroko onClick={() => idi('K5')}>
                Book now
              </Dugme>
              <RedOrganizatora />
            </div>
          </Kartica>
        }
      />
    </Strana>
  )
}

export function K5Porudzbina() {
  // potvrde NISU unapred štiklirane: korisnik ih štiklira, a dugme do tada kaže šta fali
  const [uslovi, setUslovi] = useState(false)
  const [punoletni, setPunoletni] = useState(false)
  const { uloga } = useEkran()
  const k = podaciUloge(uloga)
  const fali = !uslovi && !punoletni ? 'Tick both confirmations to continue' : !uslovi ? 'Tick the terms and conditions to continue' : !punoletni ? 'Confirm that all travelers are 18 or over' : undefined
  return (
    <Strana naslov="Order & demo payment" stanje="porudzbina" popunjeno>
      <Dve
        levo={
          <Kartica naslov="Order summary">
            <ul className="flex flex-col gap-2 text-ink-2">
              <li>Trip: {IBERIAN.naziv}</li>
              <li>Departure {datum(KRSTARENJE_POLAZAK)}</li>
              <li>
                Passengers {KRSTARENJE.osoba} · Cabins: {KRSTARENJE.kabina}
              </li>
              <li>
                Pricing: {KRSTARENJE.osoba} × {eur(KRSTARENJE.cenaPoOsobi)} · Additional services {eur(krstarenjeDodaci)} · Taxes & fees {eur(KRSTARENJE.takseIPristojbe)}
              </li>
              <li className="font-semibold text-ink">
                Total <span className="num text-gold-400">{eur(krstarenjeUkupno)}</span>
              </li>
            </ul>
            <div className="mt-4 flex flex-col gap-3">
              <Kvacica oznaka="I agree to the terms and conditions" checked={uslovi} onChange={setUslovi} obavezna />
              <Kvacica oznaka="All travelers are 18 or over" checked={punoletni} onChange={setPunoletni} obavezna />
            </div>
          </Kartica>
        }
        desno={
          <Kartica naslov="Payment (demo)">
            <div className="flex flex-col gap-4">
              <PrikaznoPolje oznaka="Card" vrednost={DEMO.kartica} />
              <PrikaznoPolje oznaka="Cardholder" vrednost={k.ime} />
              <PrikaznoPolje oznaka="Billing" vrednost={DEMO.adresa} />
              <p className="text-[13px] text-ink-3">Demo — no card is charged, nothing is sent</p>
              <TokDugme primeni={(t) => napreduj(t, 'krstarenje', 'placeno')} nakon={(u) => link('K6', u)} blokirano={fali} siroko>
                Confirm booking & pay {eur(krstarenjeUkupno)}
              </TokDugme>
              <RedOrganizatora />
            </div>
          </Kartica>
        }
      />
    </Strana>
  )
}

export function K6Potvrda() {
  const demo = useDemo()
  const idi = useIdi()
  if (demo.tokovi.krstarenje !== 'placeno')
    return (
      <Strana naslov="Booking confirmed" stanje="nije-poceo">
        <PraznoStanje>Your cruise booking appears here once you have completed the order.</PraznoStanje>
      </Strana>
    )
  return (
    <Strana stanje="potvrdjeno">
      <Kartica className="mx-auto w-full max-w-2xl">
        <Potvrda naslov="Your booking is confirmed!" ikona={<Check size={36} strokeWidth={2} className="text-ok" aria-hidden="true" />}>
          <OznakaStanja vrsta="neu">Demo order</OznakaStanja>
          <p className="num text-gold-400">{REF_TOKOVI.krstarenje}</p>
          <ul className="flex flex-col gap-1 text-ink-2">
            <li>{IBERIAN.naziv}</li>
            <li>
              Departure {datum(KRSTARENJE_POLAZAK)} · Cabins: {KRSTARENJE.kabina} · {KRSTARENJE.osoba} passengers
            </li>
            <li>
              Total paid <span className="num text-gold-400">{eur(krstarenjeUkupno)}</span>
            </li>
          </ul>
          <p className="text-ink-2">What's next? A confirmation e-mail with the details and the boarding information would be sent to you (demo text only).</p>
          <div className="mt-3 flex flex-wrap justify-center gap-3">
            <Dugme varijanta="secondary" onClick={() => demo.obavesti(BEZ_FAJLA)}>
              Download confirmation
            </Dugme>
            <Dugme varijanta="secondary" onClick={() => demo.obavesti(BEZ_FAJLA)}>
              Print confirmation
            </Dugme>
            <Dugme onClick={() => idi('T7', 'traveler')}>Manage my booking</Dugme>
            <Dugme varijanta="text" onClick={() => idi('S2')}>
              Return to Home
            </Dugme>
          </div>
          <RedOrganizatora />
        </Potvrda>
      </Kartica>
    </Strana>
  )
}
