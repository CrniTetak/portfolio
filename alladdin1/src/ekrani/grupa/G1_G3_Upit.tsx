// G1 Group Charter inquiry, G2 paket The Macau VIP Express, G3 Quote request sent (korak 1). Brojke iz scenario/.
import { Check, Plane, ShieldCheck, Star, Users } from 'lucide-react'
import { useDemo } from '../../demo/DemoProvider'
import { Dugme } from '../../komponente/Dugme'
import { Kartica, RedOrganizatora, TrakaPartnera18 } from '../../komponente/Kartica'
import { PrikaznoPolje } from '../../komponente/PrikaznoPolje'
import { RadnjaDugme } from '../../komponente/RadnjaDugme'
import { PozadinaBezSlike, Slika } from '../../komponente/Slika'
import { Dve, Potvrda, Strana } from '../../komponente/Strana'
import { useEkran, useIdi } from '../../okvir/kontekst'
import { link } from '../../pravila/rute'
import { odrediste } from '../../okvir/odrediste'
import { GRAND_PRIX_OD, KRAJ_PUTOVANJA, POLAZAK, ROK_POPUNJENOSTI, VEGAS_OD } from '../../scenario/datumi'
import { datum, eur, mesecGodina, noci, opsegDatuma, procenat } from '../../scenario/format'
import { AVANS_PROC, CENA_V1, GRAND_PRIX, MACAU_MIN_GRUPA, NOCI_MACAU, SEDISTA, TROSKOVI_OBRADE_PROC, VEGAS, vrednostV1 } from '../../scenario/racun'
import { HOTEL_MACAU, HOTEL_ZVEZDICE, LET, KLUB, LJUDI, PAKET_GRAND_PRIX, PAKET_MACAU, PAKET_VEGAS, PREVOZNIK } from '../../scenario/strane'

export function G1Upit() {
  const idi = useIdi()
  const { uloga } = useEkran()
  const kartice = [
    { naziv: PAKET_VEGAS, ekran: 'S8', info: `Las Vegas | ${noci(VEGAS.noci)} | ${mesecGodina(VEGAS_OD)} | from ${eur(VEGAS.cena)} per person (group ${VEGAS.sedista}+)` },
    { naziv: PAKET_GRAND_PRIX, ekran: 'S8', info: `Monte Carlo | ${noci(GRAND_PRIX.noci)} | ${mesecGodina(GRAND_PRIX_OD)} | from ${eur(GRAND_PRIX.cena)} per person (group ${GRAND_PRIX.sedista}+)` },
    { naziv: PAKET_MACAU, ekran: 'G2', info: `Macau | ${noci(NOCI_MACAU)} | ${mesecGodina(POLAZAK)} | from ${eur(CENA_V1)} per person (group ${MACAU_MIN_GRUPA}+)` },
  ]
  return (
    <Strana naslov="Your exclusive group journey begins" stanje="upit" popunjeno>
      <Kartica naslov="Group Charter Inquiry">
        <div className="grid gap-4 md:grid-cols-2">
          <PrikaznoPolje oznaka="Destination" vrednost={odrediste()} />
          <PrikaznoPolje oznaka="Dates" vrednost={opsegDatuma(POLAZAK, KRAJ_PUTOVANJA)} />
          <PrikaznoPolje oznaka="Number of guests" vrednost={String(SEDISTA)} />
          <PrikaznoPolje oznaka="Group type" vrednost="Poker club" />
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-4">
          <RadnjaDugme id="1.pretraga" nakon={(u) => link('G2', u)}>
            Find group packages
          </RadnjaDugme>
          <Dugme varijanta="text" onClick={() => idi('G2')}>
            View the Macau package
          </Dugme>
        </div>
      </Kartica>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-label="Benefits">
        {[
          { t: 'Charter flights', i: Plane },
          { t: 'Rooms for the whole group', i: Users },
          { t: 'A personal advisor', i: Star },
          { t: 'Partner offers, 18+', i: ShieldCheck },
        ].map(({ t, i: Ikona }) => (
          <li key={t} className="card flex items-center gap-3">
            <Ikona size={20} strokeWidth={1.75} className="text-gold-500" aria-hidden="true" />
            {t}
          </li>
        ))}
      </ul>
      <section aria-label="Featured charter packages" className="flex flex-col gap-4">
        <h2 className="naslov-kartice">Featured Charter Packages</h2>
        <div className="grid gap-4 lg:grid-cols-3">
          {kartice.map((k) => (
            <Kartica key={k.naziv}>
              <p className="font-display text-[24px] leading-7 font-semibold">{k.naziv}</p>
              <p className="my-3 text-gold-400">{k.info}</p>
              <Dugme varijanta="secondary" onClick={() => idi(k.ekran)}>
                View details
              </Dugme>
            </Kartica>
          ))}
        </div>
      </section>
      {odrediste() !== 'Macau' && <p className="text-ink-2" data-odrediste-napomena>In this demo only the Macau package is detailed. The other packages open a short preview.</p>}
      <TrakaPartnera18 />
      <p className="text-[13px] text-ink-3" data-uloga-info={uloga}>
        Group packages are on request. Prices are indicative.
      </p>
    </Strana>
  )
}

export function G2Paket() {
  const demo = useDemo()
  return (
    <Strana stanje={demo.poz.korak === 1 ? 'upit' : 'u-toku'}>
      <section className="card relative overflow-hidden p-0!">
        <Slika id="mermerne-stepenice" hero prva />
        <div className="slika-tekst">
          <h1 className="naslov-ekrana">{PAKET_MACAU}</h1>
          <p className="text-gold-400">Macau · {noci(NOCI_MACAU)} · charter flight from Belgrade</p>
        </div>
      </section>
      <Dve
        levo={
          <>
            <Kartica naslov="Charter logistics">
              <ul className="flex flex-col gap-2 text-ink-2">
                <li>Carrier: {PREVOZNIK}</li>
                <li>
                  Flight: Belgrade {LET.polazak} → Macau {LET.dolazak} local time{LET.dolazakSledeciDan ? ' (next day)' : ''}
                </li>
                <li>Seat block: {SEDISTA} seats (exclusive to the group)</li>
                <li>Services: lounge, premium catering</li>
              </ul>
            </Kartica>
            <Kartica naslov="Accommodation at the resort">
              <div className="grid gap-4 md:grid-cols-[1fr_1.2fr]">
                <PozadinaBezSlike />
                <ul className="flex flex-col gap-2 text-ink-2">
                  <li>
                    {HOTEL_MACAU}, {HOTEL_ZVEZDICE} stars
                  </li>
                  <li>{SEDISTA} Standard rooms</li>
                </ul>
              </div>
            </Kartica>
          </>
        }
        desno={
          <>
            <section className="card border-gold-600! bg-linear-to-b from-bg-2 to-bg-1 text-center" aria-label="Summary">
              <p className="polje-oznaka">Financial & booking summary</p>
              <p className="num my-2 font-display text-[44px] leading-[52px] font-semibold text-gold-400 md:text-[56px] md:leading-[60px]">{eur(CENA_V1)}</p>
              <p className="text-ink-2">per traveler · {eur(vrednostV1)} for {SEDISTA} seats</p>
              <hr className="my-4 border-gold-800" />
              <p className="mb-4 text-ink-2">Deposit {procenat(AVANS_PROC)} — payable after you accept a quote</p>
              <div className="flex flex-col items-center gap-3">
                <RadnjaDugme id="1.zahtev" siroko nakon={(u) => link('G3', u)}>
                  Request a group quote
                </RadnjaDugme>
                <Dugme varijanta="secondary" siroko onClick={() => demo.obavesti()}>
                  Schedule a consultation with an advisor
                </Dugme>
                <RedOrganizatora />
                <p className="text-[13px] text-ink-3">Demo — no card is charged, nothing is sent</p>
              </div>
            </section>
            <Kartica naslov="Partner benefits" tiha>
              <TrakaPartnera18 />
              <ul className="mt-3 flex flex-col gap-2 text-ink-2">
                <li>Welcome reception</li>
                <li>Show tickets</li>
                <li>Entry offer to the partner's poker event — the entry fee is paid to the casino</li>
              </ul>
            </Kartica>
          </>
        }
      />
      <Kartica naslov="Rules and conditions">
        <ul className="flex flex-col gap-2 text-ink-2">
          <li>Minimum group size {MACAU_MIN_GRUPA} and payment deadlines are set in the quote.</li>
          <li>
            Cancellation (example terms): before the fill deadline ({datum(ROK_POPUNJENOSTI)}) the group deposit is returned minus {procenat(TROSKOVI_OBRADE_PROC)} handling, and traveler payments are returned in full. After the
            deadline the partner's terms apply.
          </li>
          <li>Every traveler needs a valid passport, checked with them directly after enrollment.</li>
        </ul>
      </Kartica>
      <p className="text-[13px] text-ink-3">
        Group organizer in this demo: {LJUDI.organizator.ime}, {KLUB}.
      </p>
    </Strana>
  )
}

export function G3Poslato() {
  const idi = useIdi()
  const demo = useDemo()
  return (
    <Strana stanje="poslato">
      <Kartica className="mx-auto w-full max-w-2xl">
        <Potvrda naslov="We have your inquiry" ikona={<Check size={36} strokeWidth={2} className="text-ok" aria-hidden="true" />}>
          <p className="text-ink-2">
            {PAKET_MACAU} · {opsegDatuma(POLAZAK, KRAJ_PUTOVANJA)} · {SEDISTA} guests · Poker club
          </p>
          <p>Your advisor {LJUDI.savetnik.ime} will reply shortly with a quote.</p>
          <div className="mt-3 flex flex-wrap justify-center gap-3">
            <Dugme onClick={() => idi('G6')}>Go to my overview</Dugme>
            <Dugme varijanta="secondary" onClick={() => demo.obavesti()}>
              Schedule a call
            </Dugme>
          </div>
        </Potvrda>
      </Kartica>
    </Strana>
  )
}
