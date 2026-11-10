// Koraci vođene priče i njihove RADNJE (plan dorade 3, odeljak 2).
// Radnja = jedan klik u priči. Ne sastavlja se novo: koristi postojeće RADNJE_SCENARIJA, pa ništa nije duplirano
// i priča ne može da zaobiđe pravila (sve ide kroz isti reducer kao dugmad na ekranima).
import type { Akcija } from '../stanje/akcije'
import { RADNJE_SCENARIJA } from '../stanje/scenario'
import type { Stanje } from '../stanje/tipovi'
import type { Grana, UlogaPrice } from './tipovi'

export interface RadnjaPrice {
  /** isti id koristi dugme na ekranu (DugmeRadnje) */
  id: string
  korak: number
  /** ko je izvodi; 'nasetu' = tim Nasetua ili druga produkcija (simulirano, dugme Simuliraj) */
  uloga: UlogaPrice | 'nasetu'
  /** akcija koju priča šalje reduceru, računata iz tekućeg stanja (ID-jevi se čitaju iz sveta) */
  napravi: (s: Stanje) => Akcija
  /** tekst na dugmetu */
  tekst: string
  /** šta je rezultat (za poruku) */
  ishod: string
}

const R = RADNJE_SCENARIJA

const brief: RadnjaPrice = { id: 'brief', korak: 2, uloga: 'produkcija', napravi: R.brief, tekst: 'Pošalji zahtev', ishod: 'Zahtev je poslat' }
const izbor: RadnjaPrice = { id: 'izbor', korak: 3, uloga: 'nasetu', napravi: R.izbor, tekst: 'Simuliraj: Nasetu tim šalje izbor', ishod: 'Izbor je stigao' }
const glas: RadnjaPrice = { id: 'glas', korak: 4, uloga: 'produkcija', napravi: R.glas, tekst: 'Sviđa mi se', ishod: 'Glas je zabeležen' }
const opcijaLoft: RadnjaPrice = { id: 'opcijaLoft', korak: 5, uloga: 'produkcija', napravi: R.opcijaLoft, tekst: 'Traži opciju', ishod: 'Opcija na loftu je postavljena' }
const opcijaHala: RadnjaPrice = { id: 'opcijaHala', korak: 5, uloga: 'produkcija', napravi: R.opcijaHala, tekst: 'Traži opciju', ishod: 'Opcija na hali je postavljena (druga u redu)' }
const osporavanje: RadnjaPrice = { id: 'osporavanje', korak: 5, uloga: 'nasetu', napravi: R.osporavanje, tekst: 'Simuliraj: Produkcija Sigma traži isti termin', ishod: 'Prva opcija ima 24 h' }
const zahtev: RadnjaPrice = { id: 'zahtev', korak: 6, uloga: 'produkcija', napravi: R.zahtev, tekst: 'Pošalji zahtev vlasniku', ishod: 'Zahtev je poslat vlasniku' }
const odobri: RadnjaPrice = { id: 'odobri', korak: 7, uloga: 'vlasnik', napravi: R.odobri, tekst: 'Odobri', ishod: 'Zahtev je odobren, predračun je izdat' }
const uplata: RadnjaPrice = { id: 'uplata', korak: 8, uloga: 'nasetu', napravi: R.uplata, tekst: 'Simuliraj: Nasetu potvrđuje uplatu', ishod: 'Uplata je potvrđena, adresa je otvorena' }
const otkazi: RadnjaPrice = { id: 'otkazi', korak: 9, uloga: 'vlasnik', napravi: R.otkazi, tekst: 'Otkaži plaćenu rezervaciju (simulacija)', ishod: 'Vlasnik je otkazao' }

/** Sve radnje glavne grane (rezervacija važi), redom. */
export const PUTANJA_VAZI: RadnjaPrice[] = [brief, izbor, glas, opcijaLoft, opcijaHala, osporavanje, zahtev, odobri, uplata]
/** Grana vlasnik otkaže: isto do kraja koraka 8, pa još jedna radnja na koraku 9. */
export const PUTANJA_OTKAZ: RadnjaPrice[] = [...PUTANJA_VAZI, otkazi]

export const putanja = (grana: Grana): RadnjaPrice[] => (grana === 'otkaz' ? PUTANJA_OTKAZ : PUTANJA_VAZI)
export const radnjeKoraka = (korak: number, grana: Grana): RadnjaPrice[] => putanja(grana).filter((r) => r.korak === korak)
export const nadjiRadnju = (id: string): RadnjaPrice | undefined => PUTANJA_OTKAZ.find((r) => r.id === id)
