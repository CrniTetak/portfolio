// Next / Back / skok / "Show me" / račva / Restart računaju samo CILJNU poziciju (UX 3.2, B4).
// Stanje se onda gradi ponovnim odigravanjem kroz ISTI reducer (odigraj), pa skok uvek daje isto što i ručno klikanje.
import { radnjeKoraka } from './koraci'
import { POCETNA_POZICIJA, reducer } from './reducer'
import type { Poz, Uloga } from './tipovi'

const duzina = (p: Poz) => radnjeKoraka(p.korak, p.ishod).length
export const jeZavrsno = (p: Poz) => p.n === duzina(p)
export const jePocetno = (p: Poz) => p.n === 0
export const jeKraj = (p: Poz) => p.korak === 9 && jeZavrsno(p)

/** Ciljna pozicija za Next: početno → završno; završno → početno sledećeg. Na kraju priče ostaje (dugme je isključeno). */
export function ciljNext(p: Poz): Poz {
  if (jeKraj(p)) return p
  if (!jeZavrsno(p)) return { ...p, n: duzina(p) }
  return { ...p, korak: p.korak + 1, n: 0 }
}

/** Ciljna pozicija za Back: odmaklo → početno tog koraka; početno → početno prethodnog; 1/početno ostaje. */
export function ciljBack(p: Poz): Poz {
  if (p.n > 0) return { ...p, n: 0 }
  if (p.korak === 1) return p
  // koraci 1–6 su isti u svim ishodima: Back iz 7/početno u B ili C vraća ishod na A
  return { korak: p.korak - 1, n: 0, ishod: p.korak - 1 < 7 ? 'A' : p.ishod }
}

/** Skok i "Show me": početno izabranog koraka. Skok na 1–6 vraća ishod na A ("Branch reset"); na 7–9 ishod ostaje. */
export function ciljSkok(p: Poz, korak: number): { poz: Poz; granaVracena: boolean } {
  const vraca = korak < 7 && p.ishod !== 'A'
  return { poz: { korak, n: 0, ishod: korak < 7 ? 'A' : p.ishod }, granaVracena: vraca }
}

/** "Back to main story": ishod A, korak 7, početno. */
export const ciljGlavnaPrica = (): Poz => ({ korak: 7, n: 0, ishod: 'A' })

/** Prva uloga koja sme da izvede radnju (za ponovno odigravanje). */
const izvodjac = (uloge: Uloga[] | 'any'): Uloga => (uloge === 'any' ? 'organizer' : uloge[0])

/**
 * Ponovno odigravanje: iz početne pozicije kroz reducer do cilja (radnju po radnju, korak po korak).
 * Glavni dokaz da su skok i ručno klikanje isto.
 */
export function odigraj(cilj: Poz): Poz {
  let p = POCETNA_POZICIJA
  const izaberiIshod = () => {
    if (p.korak === 7 && cilj.ishod !== 'A') p = reducer(p, { t: 'ishod', ishod: cilj.ishod })
  }
  while (p.korak < cilj.korak) {
    izaberiIshod()
    for (const rad of radnjeKoraka(p.korak, p.ishod)) p = reducer(p, { t: 'radnja', id: rad.id, uloga: izvodjac(rad.uloge) })
    p = reducer(p, { t: 'sledeciKorak' })
  }
  izaberiIshod()
  const lista = radnjeKoraka(p.korak, p.ishod)
  for (let i = 0; i < cilj.n; i++) p = reducer(p, { t: 'radnja', id: lista[i].id, uloga: izvodjac(lista[i].uloge) })
  return p
}
