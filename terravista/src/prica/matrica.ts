// MATRICA PRIČE (PLAN B4.3, UX 3.2): za svaki korak i pod-korak (radnju) — koji ekran televizora, koji ekran telefona i koji početni izbor.
// Pozicija = (korak, p): p je broj odrađenih radnji u koraku. p = 0 je POČETNO stanje koraka, p = broj radnji je ZAVRŠNO stanje.
// Sve što priča pokazuje je funkcija pozicije i grane račve (Grčka/Srbija) — nema posebnog „stanja ekrana“.
import { KANAL_BESPLATNI_FILM, KANAL_GLAVNI, PAKET_PRICE, REKLAME } from '../podaci/svet'
import type { Grana } from '../podaci/svet'
import { sastavi } from '../pravila/ekrani'

export type RadnjaId =
  | 'pocni'
  | 'gledaj-besplatni-film'
  | 'pokazi-reklamu'
  | 'nastavi-program'
  | 'otvori-kanal-price'
  | 'pretplati'
  | 'skeniraj'
  | 'nastavi-kao-ana'
  | 'razumem'
  | 'na-placanje'
  | 'plati'
  | 'vrati-na-tv'
  | 'otvori-paket-price'
  | 'pretplati-paket'
  | 'izaberi-grcku'
  | 'izaberi-srbiju'
  | 'pogledaj-nedostupan'
  | 'otkazi-kanal'
  | 'u-redu'
  | 'otkazi-ugovore'
  | 'jetzt-kundigen'

export type Stanje = {
  /** Putanja ekrana televizora (npr. /tv/pocetna) ili putanja table (/tabla/vesna). */
  tv: string
  /** Putanja ekrana telefona (npr. /pocetna). */
  tel: string
  /** Početni izbor na televizoru (id elementa) ako se razlikuje od onog iz registra. */
  fokus?: string
}

export type DefinicijaKoraka = { radnje: readonly RadnjaId[]; stanja: readonly Stanje[] }

const T = (id: string, p?: Record<string, string>) => sastavi(id, p)
const TEL_POCETNA = sastavi('P1')
const doma = KANAL_GLAVNI.id
const besplatniFilm = KANAL_BESPLATNI_FILM.id
const paketSrbija = PAKET_PRICE.id

const s = (tv: string, tel: string = TEL_POCETNA, fokus?: string): Stanje => ({ tv, tel, fokus })

export function definicija(korak: number, grana: Grana): DefinicijaKoraka {
  switch (korak) {
    case 1:
      return { radnje: ['pocni'], stanja: [s(T('T1')), s(T('T2'))] }
    case 2:
      return {
        radnje: ['gledaj-besplatni-film', 'pokazi-reklamu', 'nastavi-program'],
        stanja: [
          s(T('T2'), TEL_POCETNA, `besplatni-${besplatniFilm}`),
          s(T('T9', { id: besplatniFilm }), TEL_POCETNA, 'plejer-pokazi-reklamu'),
          s(T('T10', { id: REKLAME[0].id })),
          s(T('T9', { id: besplatniFilm }), TEL_POCETNA, 'plejer-od-pocetka'),
        ],
      }
    case 3:
      return {
        radnje: ['otvori-kanal-price'],
        stanja: [s(T('T5'), TEL_POCETNA, 'kanali-prekidac-poizboru'), s(T('T8', { id: doma }))],
      }
    case 4: {
      const qr = T('T13', { proizvod: doma })
      const narudzba = sastavi('P3', { proizvod: doma })
      return {
        radnje: ['pretplati', 'skeniraj', 'nastavi-kao-ana', 'razumem', 'na-placanje', 'plati', 'vrati-na-tv'],
        stanja: [
          s(T('T8', { id: doma })),
          s(qr),
          s(qr, sastavi('P2', { proizvod: doma })),
          s(qr, narudzba),
          s(qr, narudzba),
          s(qr, sastavi('P4', { proizvod: doma })),
          s(qr, sastavi('P5', { proizvod: doma })),
          s(T('T14', { id: doma }), sastavi('P5', { proizvod: doma })),
        ],
      }
    }
    case 5: {
      const stranica = T('T16', { id: paketSrbija })
      const narudzba = sastavi('P3', { proizvod: paketSrbija })
      return {
        radnje: ['otvori-paket-price', 'pretplati-paket', 'razumem', 'na-placanje', 'plati', 'vrati-na-tv'],
        stanja: [
          s(T('T15')),
          s(stranica),
          s(stranica, narudzba),
          s(stranica, narudzba),
          s(stranica, sastavi('P4', { proizvod: paketSrbija })),
          s(stranica, sastavi('P5', { proizvod: paketSrbija })),
          s(stranica, sastavi('P5', { proizvod: paketSrbija })),
        ],
      }
    }
    case 6:
      return grana === 'grcka'
        ? { radnje: ['izaberi-grcku'], stanja: [s(T('T25'), TEL_POCETNA, 'zemlja-grcka'), s(T('T26'))] }
        : {
            radnje: ['izaberi-srbiju', 'pogledaj-nedostupan'],
            stanja: [s(T('T25'), TEL_POCETNA, 'zemlja-srbija'), s(T('T27')), s(T('T12', { id: doma }))],
          }
    case 7:
      return {
        radnje: ['otkazi-kanal', 'u-redu', 'otkazi-ugovore', 'jetzt-kundigen'],
        stanja: [
          s(T('T19')),
          s(T('T20', { id: doma })),
          s(T('T20', { id: doma }), sastavi('P8')),
          s(T('T20', { id: doma }), sastavi('P9')),
          s(T('T20', { id: doma }), sastavi('P10', { id: paketSrbija })),
        ],
      }
    case 8:
      return { radnje: [], stanja: [s(sastavi('V1'))] }
    case 9:
      return { radnje: [], stanja: [s(sastavi('M1'))] }
  }
  throw new Error(`Nepoznat korak: ${korak}`)
}

export const BROJ_KORAKA_PRICE = 9

export function duzina(korak: number, grana: Grana): number {
  return definicija(korak, grana).radnje.length
}

export function stanjeZa(korak: number, p: number, grana: Grana): Stanje {
  const d = definicija(korak, grana)
  const st = d.stanja[p]
  if (!st) throw new Error(`Nema stanja za korak ${korak}, pod-korak ${p}`)
  return st
}
