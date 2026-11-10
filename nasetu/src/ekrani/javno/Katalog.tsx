// J2 — Katalog i pretraga. Nigde se ne prikazuje tačna adresa.
import { SlidersHorizontal, SearchX } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router'
import { KarticaLokacije } from '../../komponente/KarticaLokacije'
import { Dugme, Kartica, Kvacice, Naslov, Natpis, PraznoStanje, Stranica, DugmeLink, KLASA_POLJA } from '../../komponente/osnovno'
import { NAZIV_RAZREDA, type Razred } from '../../logika/novac'
import { proveriTermin } from '../../logika/termini'
import { DELTA } from '../../podaci/akteri'
import { cenaOd, NAZIV_OZNAKE, STILOVI, TIPOVI, type Oznaka } from '../../podaci/lokacije'
import { briefDelte, sveLokacije, zauzetiDani } from '../../stanje/izvedeno'
import { useIzborLokacije } from '../../stanje/hooks'
import { useStanje } from '../../stanje/StanjeProvider'

type Redosled = 'preporuceno' | 'cena-rastuce' | 'cena-opadajuce'

const RAZREDI: Razred[] = ['do10', 'do30', 'preko30']
const USLOVI = Object.keys(NAZIV_OZNAKE) as Oznaka[]

export default function Katalog() {
  const { stanje } = useStanje()
  const { mozeDaDodaje, uIzboru, prebaci } = useIzborLokacije()
  const [params] = useSearchParams()
  const [tipovi, setTipovi] = useState<string[]>(params.get('tip') ? [params.get('tip')!] : [])
  const [zone, setZone] = useState<string[]>([])
  const [stilovi, setStilovi] = useState<string[]>([])
  const [uslovi, setUslovi] = useState<Oznaka[]>([])
  const [ekipa, setEkipa] = useState<Razred | ''>((params.get('ekipa') as Razred) || '')
  const [cenaDo, setCenaDo] = useState('')
  const [redosled, setRedosled] = useState<Redosled>('preporuceno')
  const [filteriOtvoreni, setFilteriOtvoreni] = useState(false)

  const brief = briefDelte(stanje)
  // 10 izmišljenih lokacija + one koje je admin objavio u prototipu
  const lokacije = useMemo(() => sveLokacije(stanje), [stanje])
  const ZONE = useMemo(() => Array.from(new Set(lokacije.map((l) => l.zona))).sort(), [lokacije])

  const rezultat = useMemo(() => {
    const lista = lokacije.filter((l) =>
      (!tipovi.length || tipovi.includes(l.tip)) &&
      (!zone.length || zone.includes(l.zona)) &&
      (!stilovi.length || l.stilovi.some((s) => stilovi.includes(s))) &&
      uslovi.every((u) => l.oznake.includes(u)) &&
      (!ekipa || l.cene[ekipa] != null) &&
      (!cenaDo || cenaOd(l) <= Number(cenaDo) * 100))
    if (redosled === 'cena-rastuce') lista.sort((a, b) => cenaOd(a) - cenaOd(b))
    if (redosled === 'cena-opadajuce') lista.sort((a, b) => cenaOd(b) - cenaOd(a))
    return lista
  }, [lokacije, tipovi, zone, stilovi, uslovi, ekipa, cenaDo, redosled])

  const ocisti = () => { setTipovi([]); setZone([]); setStilovi([]); setUslovi([]); setEkipa(''); setCenaDo('') }

  const filteri = (
    <div className="flex flex-col gap-5">
      <Kvacice legenda="Tip prostora" vrednosti={TIPOVI.map((t) => ({ id: t, naziv: t }))} izabrano={tipovi} onChange={setTipovi} />
      <Kvacice legenda="Zona" vrednosti={ZONE.map((z) => ({ id: z, naziv: z }))} izabrano={zone} onChange={setZone} />
      <div><Natpis>Cena po danu (do)</Natpis>
        <select aria-label="Najviša cena po danu" className={KLASA_POLJA} value={cenaDo} onChange={(e) => setCenaDo(e.target.value)}>
          <option value="">Bez ograničenja</option>
          {[300, 500, 750, 1000].map((c) => <option key={c} value={c}>do {c} €</option>)}
        </select></div>
      <Kvacice legenda="Tehnički uslovi" vrednosti={USLOVI.map((u) => ({ id: u, naziv: NAZIV_OZNAKE[u] }))} izabrano={uslovi} onChange={setUslovi} />
      <Kvacice legenda="Stil" vrednosti={STILOVI.map((s) => ({ id: s, naziv: s }))} izabrano={stilovi} onChange={setStilovi} />
      <div><Natpis>Kapacitet ekipe</Natpis>
        <select aria-label="Veličina ekipe" className={KLASA_POLJA} value={ekipa} onChange={(e) => setEkipa(e.target.value as Razred | '')}>
          <option value="">Bilo koja</option>
          {RAZREDI.map((r) => <option key={r} value={r}>{NAZIV_RAZREDA[r]}</option>)}
        </select></div>
      <Dugme varijanta="sekundarno" onClick={ocisti}>Očisti filtere</Dugme>
    </div>
  )

  return (
    <Stranica>
      <Naslov podnaslov="Pregled prostora u Beogradu. Cene su u evrima, a fakturišu se u dinarima. Tačna adresa se otvara tek posle uplate naknade.">Lokacije</Naslov>
      <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
        {/* telefon: filteri iza dugmeta; desktop: uvek vidljivi sa leve strane */}
        <div>
          <Dugme className="w-full lg:hidden" varijanta="sekundarno" ikona={SlidersHorizontal} aria-expanded={filteriOtvoreni} onClick={() => setFilteriOtvoreni(!filteriOtvoreni)}>Filteri</Dugme>
          <Kartica className={`mt-3 p-4 lg:mt-0 lg:block ${filteriOtvoreni ? 'block' : 'hidden'}`}>{filteri}</Kartica>
        </div>

        <div>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <p className="font-semibold" aria-live="polite">{rezultat.length} {rezultat.length === 1 ? 'lokacija' : rezultat.length >= 2 && rezultat.length <= 4 ? 'lokacije' : 'lokacija'}</p>
            <label className="flex items-center gap-2 text-sm">Redosled
              <select className={`${KLASA_POLJA} !w-auto`} value={redosled} onChange={(e) => setRedosled(e.target.value as Redosled)}>
                <option value="preporuceno">Preporučeno</option>
                <option value="cena-rastuce">Cena: od najniže</option>
                <option value="cena-opadajuce">Cena: od najviše</option>
              </select>
            </label>
          </div>
          {rezultat.length === 0 ? (
            <PraznoStanje ikona={SearchX} naslov="Nema lokacija za ove filtere" tekst="Ublažite filtere ili pošaljite zahtev — pripremićemo izbor.">
              <div className="flex flex-wrap justify-center gap-3">
                <Dugme varijanta="sekundarno" onClick={ocisti}>Očisti filtere</Dugme>
                <DugmeLink to="/brief">Pošalji zahtev</DugmeLink>
              </div>
            </PraznoStanje>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3">
              {rezultat.map((l, i) => (
                <KarticaLokacije
                  key={l.id} lokacija={l} prva={i === 0}
                  uIzboru={uIzboru(l.id)} mozeDaDodaje={mozeDaDodaje && !l.nova} onPrebaci={() => prebaci(l.id)}
                  zauzet={!!brief && !proveriTermin(l.id, brief.termin, stanje.zahtevi.filter((z) => z.produkcijaId !== DELTA), zauzetiDani(stanje, l)).slobodan}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </Stranica>
  )
}
