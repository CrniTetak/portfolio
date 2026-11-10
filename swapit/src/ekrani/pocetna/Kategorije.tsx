// P2 „Prikaz i jezik“, P3 „Kategorije“ i P7 „Kategorija — Vidi sve“ (UX 6.3). Brojač kategorije je broj stvarnih kartica u demou (UX 12, stavka 10):
// „Vidi sve (N)“ na početnoj, brojač u P3 i „Prikazano N od N“ u P7 dolaze iz istog svet(), pa se uvek slažu.
import { Moon, Sun } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { useDemo, type VrstaStuba } from '../../demo/DemoProvider'
import { useStanjePrice } from '../../demo/useStanje'
import { KarticaOglasa } from '../../komponente/KarticaOglasa'
import { Padajuce, Pilule, Prekidac } from '../../komponente/Kontrole'
import { Obavestenje } from '../../komponente/Obavestenje'
import { ObavestenjeNekretnine } from '../../komponente/Obavestenja'
import { Veza } from '../../komponente/Veza'
import { useEkran } from '../../okvir/kontekst'
import { KUCA, link } from '../../pravila/rute'
import { broj } from '../../scenario/format'
import { KATEGORIJA_JABUCICA, KATEGORIJA_PO_ID, KATEGORIJE, KATEGORIJE_SA_OBAVESTENJEM, type Oglas } from '../../scenario/svet'
import { JEZICI, PORUKE } from '../../tekstovi/okvir'
import { NemaStranice } from '../NemaStranice'

const VRSTA_OGLASA = { roba: 'roba', usluge: 'usluga', ideje: 'ideja' } as const
const NAZIV_VRSTE: Record<VrstaStuba, string> = { roba: 'Roba', usluge: 'Usluge', ideje: 'Ideje' }
const VRSTE: VrstaStuba[] = ['roba', 'usluge', 'ideje']

export function P2() {
  const demo = useDemo()
  const navigate = useNavigate()
  const { ugao } = useEkran()
  const tamna = demo.tema === 'tamna'
  return (
    <section className="kartica ekran-uzak stog" data-ekran-sadrzaj="P2">
      <h1>Prikaz i jezik</h1>
      <div className="grupa-polja">
        <span className="polje-oznaka">Tema</span>
        <Prekidac oznaka="Tamna tema" prikaziStanje ukljucen={tamna} onChange={(v) => demo.postaviTemu(v ? 'tamna' : 'svetla')} />
        <p className="pomocni-tekst flex items-center gap-2" data-tema-opis>
          {tamna ? <Moon size={16} strokeWidth={1.75} aria-hidden /> : <Sun size={16} strokeWidth={1.75} aria-hidden />} Tema se odmah menja na celom demou.
        </p>
      </div>
      {/* kontrolisano polje: ostaje na „Srpski“, a izbor drugog jezika samo prikaže poruku */}
      <Padajuce oznaka="Jezik" vrednost={JEZICI[0]} onChange={(v) => v !== JEZICI[0] && demo.obavesti(PORUKE.jezik)} opcije={[...JEZICI]} />
      <div className="red-dugmad">
        <button type="button" className="dugme dugme-zeleno" onClick={() => (window.history.length > 1 ? navigate(-1) : navigate(link(KUCA[ugao], ugao)))}>
          Nazad
        </button>
        <Veza ekran={KUCA[ugao]} className="dugme dugme-linija">
          Početna
        </Veza>
      </div>
    </section>
  )
}

/** Prekidač Roba / Usluge / Ideje sa brojačima za datu kategoriju (ili za sve). */
function PrekidacVrste({ brojaci }: { brojaci: Record<VrstaStuba, number> }) {
  const demo = useDemo()
  return (
    <div className="grupa-polja">
      <span className="polje-oznaka">Vrsta</span>
      <Pilule<VrstaStuba> oznaka="Roba, usluge ili ideje" vrednost={demo.vrstaStuba} onChange={demo.postaviVrstuStuba} opcije={VRSTE.map((v) => ({ v, naziv: `${NAZIV_VRSTE[v]} (${broj(brojaci[v])})` }))} />
    </div>
  )
}

export function P3() {
  const demo = useDemo()
  const { s } = useStanjePrice()
  const vrsta = demo.vrstaStuba
  const ukupno: Record<VrstaStuba, number> = { roba: s.ukupno.roba, usluge: s.ukupno.usluge, ideje: s.ukupno.ideje }
  return (
    <section className="kartica ekran-srednji stog" data-ekran-sadrzaj="P3">
      <h1>Kategorije</h1>
      <PrekidacVrste brojaci={ukupno} />
      <ul className="lista-kategorija" data-lista-kategorija>
        {KATEGORIJE.map((k) => (
          <li key={k.id}>
            <Veza ekran="P7" parametri={{ kat: k.id }} className="stavka-kategorije">
              <span>{k.naziv}</span>
              <b className="num" data-broj-kategorije={k.id}>
                {broj(s.poKategoriji[k.id][vrsta])}
              </b>
            </Veza>
          </li>
        ))}
      </ul>
    </section>
  )
}

type Cip = 'razmena' | 'poeni' | 'poklon' | 'firma' | 'gradjanin'
const CIPOVI: { v: Cip; naziv: string }[] = [
  { v: 'razmena', naziv: 'Za razmenu' },
  { v: 'poeni', naziv: 'Za poene' },
  { v: 'poklon', naziv: 'Poklanjam' },
  { v: 'gradjanin', naziv: 'Građanin' },
  { v: 'firma', naziv: 'Firma' },
]
const proLazi = (o: Oglas, cipovi: Cip[]): boolean =>
  cipovi.every((c) => (c === 'firma' ? o.firma : c === 'gradjanin' ? !o.firma : o.nacin === c))

export function P7() {
  const { parametri } = useEkran()
  const demo = useDemo()
  const { s } = useStanjePrice()
  const [cipovi, setCipovi] = useState<Cip[]>([])
  const kat = Object.hasOwn(KATEGORIJA_PO_ID, parametri.kat) ? KATEGORIJA_PO_ID[parametri.kat] : null
  if (!kat) return <NemaStranice />
  const vrsta = demo.vrstaStuba
  const b = s.poKategoriji[kat.id]
  const sve = s.oglasi.filter((o) => o.kat === kat.id && o.vrsta === VRSTA_OGLASA[vrsta])
  const prikazano = sve.filter((o) => proLazi(o, cipovi))
  const prebaci = (c: Cip) => setCipovi((x) => (x.includes(c) ? x.filter((y) => y !== c) : [...x, c]))
  return (
    <section className="stog" data-ekran-sadrzaj="P7" data-kategorija={kat.id}>
      <div className="naslov-reda">
        <h1>
          {kat.naziv} <span className="pomocni-tekst num">({broj(b[vrsta])})</span>
        </h1>
        <Veza ekran="P3" className="dugme dugme-tekst">
          Sve kategorije
        </Veza>
      </div>
      <PrekidacVrste brojaci={{ roba: b.roba, usluge: b.usluge, ideje: b.ideje }} />
      {kat.id === KATEGORIJA_JABUCICA && <Obavestenje>Samo sveže voće i povrće iz sopstvene proizvodnje.</Obavestenje>}
      {KATEGORIJE_SA_OBAVESTENJEM.includes(kat.id) && <ObavestenjeNekretnine />}
      <div className="cipovi" role="group" aria-label="Filteri">
        {CIPOVI.map((c) => (
          <button key={c.v} type="button" className="pilula" aria-pressed={cipovi.includes(c.v)} onClick={() => prebaci(c.v)}>
            {c.naziv}
          </button>
        ))}
        {cipovi.length > 0 && (
          <button type="button" className="dugme dugme-tekst" onClick={() => setCipovi([])}>
            Poništi filtere
          </button>
        )}
        <Veza ekran="P4" upit={{ kat: kat.id }} className="dugme dugme-tekst">
          Više filtera
        </Veza>
      </div>
      {prikazano.length === 0 ? (
        <p className="prazno-stanje" data-prazna-kategorija>
          {sve.length === 0 ? `U ovoj kategoriji trenutno nema oglasa za izabranu vrstu (${NAZIV_VRSTE[vrsta].toLowerCase()}).` : 'Nijedan oglas ne odgovara izabranim filterima.'}
        </p>
      ) : (
        <div className="mreza-kartica" data-mreza>
          {prikazano.map((o) => (
            <KarticaOglasa key={o.id} oglas={o} />
          ))}
        </div>
      )}
      <p className="pomocni-tekst" data-prikazano>
        Prikazano {broj(prikazano.length)} od {broj(sve.length)}
      </p>
    </section>
  )
}
