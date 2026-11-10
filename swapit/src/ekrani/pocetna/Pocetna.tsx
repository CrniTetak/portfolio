// P1 „Početna“ (UX 6.3): pozdrav, priče zajednice, red „Istaknuto · plaćeno“, 9 redova po kategorijama (prekidač Roba / Usluge / Ideje
// iz levog stuba), desno „Sponzorisano“ i PREMIUM. Brojke su iz svet() i prate korak priče (npr. Anin oglas od koraka 2).
import { Plus } from 'lucide-react'
import { useDemo } from '../../demo/DemoProvider'
import { useStanjePrice } from '../../demo/useStanje'
import { ikonaPoImenu } from '../../komponente/Ilustracija'
import { KarticaOglasa } from '../../komponente/KarticaOglasa'
import { RedKategorije } from '../../komponente/RedKategorije'
import { Veza } from '../../komponente/Veza'
import { Znacka } from '../../komponente/Znacka'
import { useEkran } from '../../okvir/kontekst'
import { link } from '../../pravila/rute'
import { broj, poeni } from '../../scenario/format'
import { ANA_ID, KATEGORIJE, MARKO_ID, korisnikUgla, type Oglas } from '../../scenario/svet'
import { storije } from './storije'
import { DesnaKolona } from './DesnaKolona'

const VRSTA_PO_STUBU = { roba: 'roba', usluge: 'usluga', ideje: 'ideja' } as const
const NASLOV_VRSTE = { roba: 'Roba', usluge: 'Usluge', ideje: 'Ideje' } as const

/** Predmeti priče idu prvi u svom redu, ostalo ostaje redom iz podataka. */
const predmetiPrviPrvo = (lista: Oglas[]): Oglas[] => [...lista.filter((o) => o.rezervisan), ...lista.filter((o) => !o.rezervisan)]

export function Price() {
  const { ugao } = useEkran()
  const demo = useDemo()
  return (
    <section aria-label="Priče zajednice" className="price" data-price>
      {ugao !== 'moderacija' && (
        <a className="prica prica-nova" href={`#${link('P9', ugao)}`} aria-label="Objavi u zajednici">
          <Plus size={32} strokeWidth={1.75} aria-hidden />
          <span>Objavi u zajednici</span>
        </a>
      )}
      {storije(demo.tokovi).map((p, i) => {
        const Ikona = ikonaPoImenu(p.ikonica)
        return (
          <a key={p.id} className="prica" data-b={String(i % 6)} href={`#${link('P8', ugao, { prica: p.id })}`} aria-label={`Priča: ${p.naslov}`}>
            <Ikona size={28} strokeWidth={1.75} aria-hidden />
            <span>{p.naslov}</span>
          </a>
        )
      })}
    </section>
  )
}

export function Pocetna() {
  const demo = useDemo()
  const { s, ugao } = useStanjePrice()
  const vrsta = demo.vrstaStuba
  const kljuc = vrsta
  const korisnik = korisnikUgla(s, ugao)

  // redovi: za robu 9 kategorija iz dizajna; za usluge i ideje kategorije koje imaju najviše takvih oglasa
  const redovi =
    vrsta === 'roba'
      ? KATEGORIJE.filter((k) => k.redP1 !== null).sort((a, b) => a.redP1! - b.redP1!)
      : KATEGORIJE.filter((k) => s.poKategoriji[k.id][kljuc] > 0)
          .sort((a, b) => s.poKategoriji[b.id][kljuc] - s.poKategoriji[a.id][kljuc])
          .slice(0, 9)
  const istaknuto = s.oglasi.filter((o) => o.istaknuto === 'red' && o.vrsta === VRSTA_PO_STUBU[vrsta]).slice(0, 5)

  return (
    <div className="p1-raspored" data-ekran-sadrzaj="P1">
      <div className="stog">
        <h1 className="sr-only">Početna</h1>
        {korisnik && ugao === 'ana' && korisnik.verifikovan && (
          <section className="kartica kartica-mirna" data-pozdrav aria-label="Pozdrav">
            <div className="naslov-reda">
              <div>
                <h2>Dobro došla, {ANA_ID}!</h2>
                <p className="pomocni-tekst">Tvoj nalog je spreman. Oglas je besplatan, a razmena ide bez novca.</p>
              </div>
              <div className="znacke">
                <Znacka vrsta="verifikovan" />
                <Znacka vrsta="gradjanin" />
                <Veza ekran="W1" className="znacka znacka-poeni" ariaLabel={`Moji poeni: ${poeni(korisnik.poeni)}`}>
                  {poeni(korisnik.poeni)}
                </Veza>
                <Znacka vrsta="model" />
              </div>
            </div>
          </section>
        )}
        {korisnik && ugao === 'marko' && (
          <section className="kartica kartica-mirna" data-pozdrav aria-label="Pozdrav">
            <div className="naslov-reda">
              <div>
                <h2>Dobro došao, {MARKO_ID}!</h2>
                <p className="pomocni-tekst">
                  Stari član: <b className="num">{broj(korisnik.razmene)}</b> razmena.
                </p>
              </div>
              <div className="znacke">
                <Znacka vrsta="verifikovan" />
                <Znacka vrsta="gradjanin" />
              </div>
            </div>
          </section>
        )}
        <Price />
        {istaknuto.length > 0 && (
          <RedKategorije naslov="Istaknuto" istaknuto>
            {istaknuto.map((o) => (
              <KarticaOglasa key={o.id} oglas={o} />
            ))}
          </RedKategorije>
        )}
        {redovi.map((k) => {
          const lista = predmetiPrviPrvo(s.oglasi.filter((o) => o.kat === k.id && o.vrsta === VRSTA_PO_STUBU[vrsta])).slice(0, 5)
          return (
            <RedKategorije key={k.id} naslov={k.naziv} kat={k.id} brojSvih={s.poKategoriji[k.id][kljuc]}>
              {lista.map((o) => (
                <KarticaOglasa key={o.id} oglas={o} />
              ))}
            </RedKategorije>
          )
        })}
        <p className="pomocni-tekst" data-prikaz-vrste>
          Prikaz: {NASLOV_VRSTE[vrsta]}.<span className="max-lg:hidden"> Prekidač „Roba · Usluge · Ideje“ u levom stubu menja redove.</span>
        </p>
      </div>
      <DesnaKolona />
    </div>
  )
}
