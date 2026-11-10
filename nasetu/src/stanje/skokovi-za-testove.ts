// SAMO ZA TESTOVE: stari „Skoči na…" iz dorade 2, sačuvan kao REFERENCA za regresiju (dorada 3, plan 5.4).
// Aplikacija ga više ne koristi: korake i skokove sada vodi src/prica/. Svaki skok je spisak istih radnji
// koje izvode dugmad, primenjenih kroz isti reducer.
import { SIGMA } from '../podaci/akteri'
import { izborDelte, predracunZa } from './izvedeno'
import { reducer } from './reducer'
import { pocetnoStanje, RADNJE_SCENARIJA as radnje, zahtevLofta, otkazanZahtevLofta } from './scenario'
import type { Akcija } from './akcije'
import type { Stanje, Uloga } from './tipovi'

type Radnja = (s: Stanje) => Akcija

export interface Skok {
  id: string
  naziv: string
  uloga: Uloga
  radnje: Radnja[]
  /** na koji link se ide posle skoka */
  ruta: (s: Stanje) => string
}

export const SKOKOVI: Skok[] = [
  { id: 'pocetak', naziv: 'Početak', uloga: 'produkcija', radnje: [], ruta: () => '/' },
  {
    id: 'izbor', naziv: 'Izbor spreman', uloga: 'produkcija',
    radnje: [radnje.brief, radnje.izbor],
    ruta: (s) => `/izbor/${izborDelte(s)?.id}`,
  },
  {
    id: 'opcija', naziv: 'Opcija', uloga: 'produkcija',
    radnje: [radnje.brief, radnje.izbor, radnje.opcijaLoft, radnje.opcijaHala],
    ruta: () => '/produkcija/opcije',
  },
  {
    // Vlasnik otvara Sigmin zahtev za loft: "Odobri" je zaključano dok Deltina prva opcija još važi (A2)
    id: 'osporavanje', naziv: 'Osporavanje (Odobri zaključan)', uloga: 'vlasnik',
    radnje: [radnje.brief, radnje.izbor, radnje.opcijaLoft, radnje.opcijaHala, radnje.osporavanje],
    ruta: (s) => `/vlasnik/zahtev/${s.zahtevi.find((z) => z.produkcijaId === SIGMA && z.lokacijaId === 'industrijski-loft')?.id}`,
  },
  {
    id: 'zahtev', naziv: 'Zahtev poslat', uloga: 'vlasnik',
    radnje: [radnje.brief, radnje.izbor, radnje.opcijaLoft, radnje.opcijaHala, radnje.osporavanje, radnje.zahtev],
    ruta: (s) => `/vlasnik/zahtev/${zahtevLofta(s)?.id}`,
  },
  {
    id: 'odobrio', naziv: 'Vlasnik odobrio', uloga: 'produkcija',
    radnje: [radnje.brief, radnje.izbor, radnje.opcijaLoft, radnje.opcijaHala, radnje.osporavanje, radnje.zahtev, radnje.odobri],
    ruta: (s) => `/produkcija/predracun/${predracunZa(s, zahtevLofta(s)?.id ?? '')?.id}`,
  },
  {
    id: 'uplata', naziv: 'Uplata potvrđena', uloga: 'produkcija',
    radnje: [radnje.brief, radnje.izbor, radnje.opcijaLoft, radnje.opcijaHala, radnje.osporavanje, radnje.zahtev, radnje.odobri, radnje.uplata],
    ruta: (s) => `/produkcija/rezervacija/${zahtevLofta(s)?.id}`,
  },
  {
    // Brief sa izborom van kataloga (50 €, plaćen) → rezervacija sa domaćinom: 135 − 50 + 70 = 155 € = 18.135,00 RSD
    id: 'usluge', naziv: 'Predračun sa uslugama', uloga: 'produkcija',
    radnje: [radnje.briefUsluge, radnje.uplataIzbora, radnje.izbor, radnje.opcijaLoft, radnje.opcijaHala, radnje.osporavanje, radnje.zahtevDomacin, radnje.odobri],
    ruta: (s) => `/produkcija/predracun/${predracunZa(s, zahtevLofta(s)?.id ?? '')?.id}`,
  },
  {
    id: 'otkazao', naziv: 'Vlasnik otkazao', uloga: 'produkcija',
    radnje: [radnje.brief, radnje.izbor, radnje.opcijaLoft, radnje.opcijaHala, radnje.osporavanje, radnje.zahtev, radnje.odobri, radnje.uplata, radnje.otkazi],
    ruta: (s) => `/produkcija/rezervacija/${otkazanZahtevLofta(s)?.id}`,
  },
]

/** Stanje posle skoka: početno stanje + iste radnje kao ručno. Zadržava samo izbor sakrivanja trake "Demo". */
export function stanjeZaSkok(id: string, demoSakriven: boolean): { stanje: Stanje; ruta: string } {
  const skok = SKOKOVI.find((k) => k.id === id) ?? SKOKOVI[0]
  let s: Stanje = { ...pocetnoStanje(), demoSakriven }
  for (const r of skok.radnje) s = reducer(s, r(s))
  s = { ...s, uloga: skok.uloga }
  return { stanje: s, ruta: skok.ruta(s) }
}
