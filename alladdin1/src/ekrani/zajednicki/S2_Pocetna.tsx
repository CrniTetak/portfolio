// S2 Home (UX 7.1): hero, pretraga kao lansirač, četiri kartice, dve trake. Slogan ostaje (UX 12.9, napomena za advokata za pravi proizvod).
import { useState } from 'react'
import { Building2, CalendarDays, Car, Crown, Search } from 'lucide-react'
import { Dugme } from '../../komponente/Dugme'
import { Padajuce } from '../../komponente/Kontrole'
import { PrikaznoPolje } from '../../komponente/PrikaznoPolje'
import { Slika } from '../../komponente/Slika'
import { Strana } from '../../komponente/Strana'
import { TrakaPartnera18 } from '../../komponente/Kartica'
import { useIdi } from '../../okvir/kontekst'
import { postaviOdrediste } from '../../okvir/odrediste'
import { KRAJ_PUTOVANJA, KRSTARENJE_KRAJ, KRSTARENJE_POLAZAK, MONTE_KARLO_DO, MONTE_KARLO_OD, POLAZAK, VEGAS_DO, VEGAS_OD } from '../../scenario/datumi'
import { opsegDatuma } from '../../scenario/format'

const ODREDISTA = ['Macau', 'Las Vegas', 'Monte Carlo', 'Mediterranean']
// datumi prate odredište (svi iz scenario/)
const DATUMI_ODREDISTA: Record<string, string> = {
  Macau: opsegDatuma(POLAZAK, KRAJ_PUTOVANJA),
  'Las Vegas': opsegDatuma(VEGAS_OD, VEGAS_DO),
  'Monte Carlo': opsegDatuma(MONTE_KARLO_OD, MONTE_KARLO_DO),
  Mediterranean: opsegDatuma(KRSTARENJE_POLAZAK, KRSTARENJE_KRAJ),
}
const CILJ: Record<string, string> = { Macau: 'G1', 'Las Vegas': 'G1', 'Monte Carlo': 'M1', Mediterranean: 'K2' }

export function S2Pocetna() {
  const idi = useIdi()
  const [odrediste, setOdrediste] = useState('Macau')
  const kartice = [
    { naziv: 'Monte Carlo', ekran: 'M1', ikona: Crown, opis: 'Suites, private transfers and dining, arranged by your advisor.' },
    { naziv: 'Luxury Transport', ekran: 'L1', ikona: Car, opis: 'Chauffeur, helicopter or yacht, on request.' },
    { naziv: 'VIP Travel', ekran: 'S5', ikona: Building2, opis: 'All packages in one place.' },
    { naziv: 'Poker & Events', ekran: 'M8', ikona: CalendarDays, opis: 'Travel packages around events organised by partner casinos.' },
  ]
  return (
    <Strana stanje="pocetna">
      <div className="card relative overflow-hidden p-0!">
        <Slika id="mermerne-stepenice" hero prva sizes="(min-width: 1024px) 1160px, 100vw" />
        <div className="slika-tekst flex flex-col gap-2 md:left-8 md:bottom-8">
          <h1 className="naslov-hero">
            Experience luxury. Go <span className="whitespace-nowrap">all-in.</span>
          </h1>
          <p className="max-w-xl text-[17px] text-ink-2">Group journeys and private stays, planned by a personal advisor.</p>
        </div>
      </div>

      <section className="card flex flex-col gap-4 md:flex-row md:items-end" aria-label="Search">
        <div className="md:w-52">
          <Dugme varijanta="secondary" siroko onClick={() => idi('Q1')}>
            VIP Concierge
          </Dugme>
        </div>
        <div className="md:flex-1">
          <Padajuce oznaka="Destination" opcije={ODREDISTA} vrednost={odrediste} onChange={setOdrediste} />
        </div>
        <div className="md:flex-1">
          <PrikaznoPolje oznaka="Dates" vrednost={DATUMI_ODREDISTA[odrediste]} />
        </div>
        <Dugme
          onClick={() => {
            postaviOdrediste(odrediste)
            idi(CILJ[odrediste])
          }}
        >
          <Search size={18} strokeWidth={1.75} aria-hidden="true" />
          Search
        </Dugme>
      </section>
      <p className="polje-pomoc">Pre-filled for the demo</p>

      <section aria-label="Explore" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kartice.map((k) => (
          <button key={k.naziv} type="button" onClick={() => idi(k.ekran)} className="card flex min-h-40 flex-col gap-2 text-left hover:border-gold-500!">
            <k.ikona size={24} strokeWidth={1.75} className="text-gold-500" aria-hidden="true" />
            <span className="font-display text-[24px] leading-7 font-semibold">{k.naziv}</span>
            <span className="text-ink-2">{k.opis}</span>
          </button>
        ))}
      </section>

      <TrakaPartnera18>Casino events are organised by partner casinos under their own licence and terms. AllAddIn1 sells travel packages around them. 18+.</TrakaPartnera18>

      <section className="grid gap-4 md:grid-cols-2">
        <button type="button" onClick={() => idi('G1')} className="card flex flex-col gap-1 text-left hover:border-gold-500!">
          <span className="polje-oznaka text-gold-500!">For group organizers</span>
          <span className="text-[18px]">One place for inquiry, quote, deposit, traveler payments and invoices.</span>
        </button>
        <button type="button" onClick={() => idi('B1')} className="card flex flex-col gap-1 text-left hover:border-gold-500!">
          <span className="polje-oznaka text-gold-500!">All-In membership</span>
          <span className="text-[18px]">A status earned through your trips.</span>
        </button>
      </section>
    </Strana>
  )
}
