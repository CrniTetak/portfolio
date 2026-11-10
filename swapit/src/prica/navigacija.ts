// Dalje / Nazad / skok / „Pokaži mi“ / račva / Restart računaju samo CILJNU poziciju (UX 3.2, PLAN B4.1).
// Stanje se onda gradi ponovnim odigravanjem kroz ISTI reducer (odigraj), pa skok uvek daje isto što i ručno klikanje.
import { radnjeKoraka } from './koraci'
import { POCETNA_POZICIJA, reducer } from './reducer'
import type { Grana, Poz } from './tipovi'

const duzina = (p: Poz): number => radnjeKoraka(p.korak, p.grana).length
export const jeZavrsno = (p: Poz): boolean => p.n === duzina(p)
export const jeKraj = (p: Poz): boolean => p.korak === 9 && jeZavrsno(p)

/** Grana ima smisla tek od koraka 6; koraci 1–5 su isti u obe. */
const granaZaKorak = (korak: number, grana: Grana): Grana => (korak < 6 ? 'lanac' : grana)

/** Dalje: početno → završno; završno → početno sledećeg koraka. Na kraju priče ostaje (dugme je isključeno). */
export function ciljNext(p: Poz): Poz {
  if (jeKraj(p)) return p
  if (!jeZavrsno(p)) return { ...p, n: duzina(p) }
  return { ...p, korak: p.korak + 1, n: 0 }
}

/** Nazad: odmaklo → početno tog koraka; početno → početno prethodnog; 1/početno ostaje. Iz 6 nazad na 1–5 vraća granu na „lanac“. */
export function ciljBack(p: Poz): Poz {
  if (p.n > 0) return { ...p, n: 0 }
  if (p.korak === 1) return p
  const korak = p.korak - 1
  return { korak, n: 0, grana: granaZaKorak(korak, p.grana) }
}

/** Skok i „Pokaži mi“: početno izabranog koraka. Skok na 1–5 poništava račvu („Račva poništena“); na 6–9 grana ostaje. */
export function ciljSkok(p: Poz, korak: number): { poz: Poz; granaVracena: boolean } {
  const grana = granaZaKorak(korak, p.grana)
  return { poz: { korak, n: 0, grana }, granaVracena: grana !== p.grana }
}

/** „Nazad na glavni tok“: lanac, korak 6, početno. */
export const ciljGlavniTok = (): Poz => ({ korak: 6, n: 0, grana: 'lanac' })

/**
 * Ponovno odigravanje: iz početne pozicije kroz reducer do cilja (radnju po radnju, korak po korak).
 * Glavni dokaz da su skok i ručno klikanje isto.
 */
export function odigraj(cilj: Poz): Poz {
  let p = POCETNA_POZICIJA
  const izaberiGranu = () => {
    if (p.korak === 6 && cilj.grana !== p.grana) p = reducer(p, { t: 'grana', grana: cilj.grana })
  }
  const uradiRadnje = (korak: number, n: number) => {
    const lista = radnjeKoraka(korak, p.grana)
    for (let i = 0; i < n; i++) p = reducer(p, { t: 'radnja', id: lista[i].id, ugao: 'sistem' })
  }
  while (p.korak < cilj.korak) {
    izaberiGranu()
    uradiRadnje(p.korak, radnjeKoraka(p.korak, p.grana).length)
    p = reducer(p, { t: 'sledeciKorak' })
  }
  izaberiGranu()
  uradiRadnje(p.korak, cilj.n)
  return p
}
