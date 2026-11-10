// J1 — Nova početna. Nijedan tekst ne obećava ono što prototip ne može (osiguranje, "bezbedno", "provereno").
import { Search } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { HeroSlika } from '../../komponente/Slika'
import { KarticaLokacije } from '../../komponente/KarticaLokacije'
import { DugmeLink, Dugme, Kartica, Natpis, Podnaslov } from '../../komponente/osnovno'
import { NAKNADA_MINIMUM_CENTI, NAKNADA_PROCENAT } from '../../logika/konstante'
import { eurKratko, NAZIV_RAZREDA, type Razred } from '../../logika/novac'
import { LOKACIJE, TIPOVI } from '../../podaci/lokacije'
import { useIdiKao, useIzborLokacije } from '../../stanje/hooks'

/** Tačka u velikom naslovu: font ima široku tačku (advance oko 0,41 em), pa se približava prethodnom slovu. */
const Tacka = () => <span className="-ml-[0.12em]">.</span>

const KORACI = [
  'Opišite šta vam treba',
  'Dobijete izbor lokacija u 24–48 h',
  'Podelite izbor i držite opciju',
  'Vlasnik odobri termin',
  'Platite našu naknadu i otvara se adresa',
]

export default function Pocetna() {
  const navigate = useNavigate()
  const idiKao = useIdiKao()
  const { mozeDaDodaje, uIzboru, prebaci } = useIzborLokacije()
  const [tip, setTip] = useState('')
  const [razred, setRazred] = useState<Razred | ''>('')

  const trazi = () => {
    const q = new URLSearchParams()
    if (tip) q.set('tip', tip)
    if (razred) q.set('ekipa', razred)
    navigate(`/lokacije${q.toString() ? '?' + q : ''}`)
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 md:py-12">
      {/* Hero (stari raspored, dorada 4b): fotografija preko cele širine, preko nje naslov, tekst i dugmad; ispod pretraga */}
      <section className="tamno relative overflow-hidden rounded-kartica bg-mastilo px-5 pb-12 pt-8 text-white min-[400px]:pb-14 min-[400px]:pt-12 md:px-10 md:pb-20 md:pt-16">
        <HeroSlika />
        {/* Zatamnjenje: najslabije mesto (gore) je 80% mastila, pa je beli tekst bar 8 : 1 čak i preko potpuno bele fotografije */}
        <div className="absolute inset-0 bg-gradient-to-t from-mastilo/95 to-mastilo/80" aria-hidden />
        <div className="relative">
          <h1 className="hero-naslov max-w-2xl text-[26px] leading-[1.1] min-[360px]:text-[30px] min-[400px]:text-4xl md:text-[56px]">Prostori za snimanje u Beogradu<Tacka /> Plaćate nas samo za uslugu<Tacka /></h1>
          <p className="mt-3 max-w-xl text-base text-[#E6E0DC] min-[400px]:mt-4 min-[400px]:text-lg">Lokaciju plaćate direktno vlasniku. Nasetu naplaćuje samo svoju naknadu.</p>
          <div className="mt-4 flex flex-wrap gap-2 min-[400px]:mt-6 min-[400px]:gap-3">
            <DugmeLink to="/lokacije">Pogledaj lokacije</DugmeLink>
            <DugmeLink to="/brief" varijanta="svetlo">Pošalji zahtev (brief)</DugmeLink>
          </div>
        </div>
      </section>

      {/* Brza pretraga (pilula ispod hero-a, lagano preklopljena preko njegove donje ivice): samo polja koja stvarno filtriraju katalog */}
      <form
        onSubmit={(e) => { e.preventDefault(); trazi() }}
        className="relative z-10 mx-auto -mt-7 flex max-w-[760px] flex-col gap-1 rounded-[28px] border border-linija bg-white p-2 shadow-pilula sm:flex-row sm:items-center sm:gap-0 sm:rounded-full"
        aria-label="Brza pretraga"
      >
        <label className="block flex-1 cursor-pointer rounded-full px-5 py-2 hover:bg-traka focus-within:bg-traka focus-within:ring-2 focus-within:ring-akcent">
          <span className="block text-[13px] font-semibold text-prig">Tip prostora</span>
          <select className="w-full cursor-pointer bg-transparent text-base font-semibold text-mastilo outline-none" value={tip} onChange={(e) => setTip(e.target.value)}>
            <option value="">Svi tipovi</option>
            {TIPOVI.map((t) => <option key={t}>{t}</option>)}
          </select>
        </label>
        <span className="mx-1 h-px bg-linija sm:h-8 sm:w-px" aria-hidden />
        <label className="block flex-1 cursor-pointer rounded-full px-5 py-2 hover:bg-traka focus-within:bg-traka focus-within:ring-2 focus-within:ring-akcent">
          <span className="block text-[13px] font-semibold text-prig">Ekipa</span>
          <select className="w-full cursor-pointer bg-transparent text-base font-semibold text-mastilo outline-none" value={razred} onChange={(e) => setRazred(e.target.value as Razred | '')}>
            <option value="">Bilo koja</option>
            {(Object.keys(NAZIV_RAZREDA) as Razred[]).map((r) => <option key={r} value={r}>{NAZIV_RAZREDA[r]}</option>)}
          </select>
        </label>
        <button type="submit" className="inline-flex h-12 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-full bg-akcent px-6 text-base font-semibold text-white hover:bg-akcent-t sm:ml-2">
          <Search size={20} aria-hidden /> Traži
        </button>
      </form>

      {/* Kako ide */}
      <section className="mt-12 md:mt-16">
        <Natpis>Kako ide</Natpis>
        <ol className="grid gap-4 md:grid-cols-5">
          {KORACI.map((k, i) => (
            <li key={k} className="flex items-start gap-3 md:flex-col">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-akcent font-bold text-white" aria-hidden>{i + 1}</span>
              <span className="font-medium">{k}</span>
            </li>
          ))}
        </ol>
      </section>

      {/* Šta plaćate i kome */}
      <section className="mt-12 md:mt-16">
        <Podnaslov>Šta plaćate i kome</Podnaslov>
        <div className="grid gap-4 md:grid-cols-2">
          <Kartica className="p-5">
            <h3 className="font-semibold">Vlasniku, direktno</h3>
            <p className="mt-1 text-sek">Cena lokacije — po dogovoru iz ugovora o lokaciji.</p>
          </Kartica>
          <Kartica className="border-l-4 !border-l-akcent !bg-akcent-s p-5">
            <h3 className="font-semibold text-mastilo">Nasetuu</h3>
            <p className="mt-1 text-mastilo">Naknada {NAKNADA_PROCENAT}% cene lokacije, najmanje {eurKratko(NAKNADA_MINIMUM_CENTI)}.</p>
          </Kartica>
        </div>
      </section>

      {/* Zašto je adresa skrivena */}
      <section className="mt-12 md:mt-16">
        <Podnaslov>Zašto je adresa skrivena</Podnaslov>
        <p className="max-w-2xl text-sek">
          Do uplate naknade vidite samo opštinu i širu zonu. Tačna adresa i kontakt vlasnika otvaraju se posle potvrđene uplate.
        </p>
      </section>

      {/* Izdvojene lokacije */}
      <section className="mt-12 md:mt-16">
        <Podnaslov>Izdvojene lokacije</Podnaslov>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {LOKACIJE.filter((l) => l.istaknuto).map((l) => (
            <KarticaLokacije key={l.id} lokacija={l} uIzboru={uIzboru(l.id)} mozeDaDodaje={mozeDaDodaje} onPrebaci={() => prebaci(l.id)} />
          ))}
        </div>
        <p className="mt-4"><Link to="/lokacije" className="font-semibold text-akcent hover:underline">Sve lokacije →</Link></p>
      </section>

      {/* Za vlasnike */}
      <section className="mt-12 md:mt-16">
        <Kartica className="flex flex-wrap items-center justify-between gap-4 p-6">
          <div>
            <h2 className="text-xl font-bold">Imate prostor?</h2>
            <p className="text-sek">Upis je besplatan.</p>
          </div>
          <Dugme varijanta="sekundarno" onClick={() => idiKao('vlasnik', '/vlasnik/nova-lokacija')}>Dodaj lokaciju</Dugme>
        </Kartica>
      </section>
    </div>
  )
}
