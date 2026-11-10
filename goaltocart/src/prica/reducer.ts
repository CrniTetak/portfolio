// Reducer priče: čista funkcija koja primenjuje JEDNU radnju na stanje.
// I dugmad na ekranima i traka demoa prolaze kroz isti reducer, pa skok ne može da zaobiđe pravila.
import { radnjeKoraka } from './koraci'
import { BROJ_KORAKA } from './tipovi'
import type { Grana, Pozicija, RadnjaDef } from './tipovi'

export const POCETNO: Pozicija = { korak: 1, odradjeno: 0, grana: 'approved' }

export type Dogadjaj =
  | { tip: 'izvedi'; id: string } // radnja sa ekrana; prihvata se samo ako je baš ona SLEDEĆA u listi
  | { tip: 'sledeci-korak' } // dozvoljeno samo kad su svi pod-koraci tekućeg koraka odrađeni
  | { tip: 'idi'; cilj: Pozicija } // ponovno odigravanje do ciljne pozicije
  | { tip: 'restart' }
  | { tip: 'grana'; grana: Grana } // račva, samo na koraku 6

export const jeIsto = (a: Pozicija, b: Pozicija) => a.korak === b.korak && a.odradjeno === b.odradjeno && a.grana === b.grana

/**
 * Skok pre koraka 6 vraća granu na neodlučenu (Approved): grana Rejected postoji samo od koraka 6 nadalje.
 * Tako "Back", skok na korak 1-5 i Restart uvek daju glavnu priču, a račva se ponovo bira na koraku 6.
 */
export function normalizuj(p: Pozicija): Pozicija {
  return p.korak < 6 && p.grana === 'rejected' ? { ...p, grana: 'approved' } : p
}

export function brojRadnji(p: Pick<Pozicija, 'korak' | 'grana'>): number {
  return radnjeKoraka(p.korak, p.grana).length
}

/** Sledeća radnja u listi (ili undefined ako je korak završen). */
export function sledecaRadnja(p: Pozicija): RadnjaDef | undefined {
  return radnjeKoraka(p.korak, p.grana)[p.odradjeno]
}

export const jeZavrsenKorak = (p: Pozicija) => p.odradjeno >= brojRadnji(p)
export const jePocetnoStanje = (p: Pozicija) => p.odradjeno === 0

/** Redni broj pozicije u celoj putanji grane (broj odrađenih radnji od početka priče). */
export function redniBroj(p: Pozicija): number {
  let n = 0
  for (let k = 1; k < p.korak; k++) n += radnjeKoraka(k, p.grana).length
  return n + p.odradjeno
}

export function reducer(s: Pozicija, d: Dogadjaj): Pozicija {
  switch (d.tip) {
    case 'izvedi': {
      const sl = sledecaRadnja(s)
      if (!sl || sl.id !== d.id) return s // odbijeno: nije sledeća
      return { ...s, odradjeno: s.odradjeno + 1 }
    }
    case 'sledeci-korak': {
      if (!jeZavrsenKorak(s) || s.korak >= BROJ_KORAKA) return s
      return { ...s, korak: s.korak + 1, odradjeno: 0 }
    }
    case 'restart':
      return POCETNO
    case 'grana': {
      // Račva se bira na koraku 6. Iz grane Rejected "Back to the main story" vraća na 6/početno u Approved (i sa koraka 7-9).
      if (s.korak === 6) return { korak: 6, odradjeno: 0, grana: d.grana }
      if (s.korak > 6 && s.grana === 'rejected' && d.grana === 'approved') return { korak: 6, odradjeno: 0, grana: 'approved' }
      return s
    }
    case 'idi':
      return izgradiStanje(normalizuj(d.cilj))
  }
}

/**
 * Gradi stanje tako što od početka primenjuje radnje (kroz isti reducer) do ciljne pozicije.
 * Ako cilj nije dostižan (nevažeći), vraća najbliže dostižno stanje.
 */
export function izgradiStanje(cilj: Pozicija): Pozicija {
  let s: Pozicija = { korak: 1, odradjeno: 0, grana: cilj.grana }
  for (let i = 0; i < 1000 && !jeIsto(s, cilj); i++) {
    const sl = sledecaRadnja(s)
    if (s.korak < cilj.korak) {
      s = sl ? reducer(s, { tip: 'izvedi', id: sl.id }) : reducer(s, { tip: 'sledeci-korak' })
    } else if (s.korak === cilj.korak && s.odradjeno < cilj.odradjeno && sl) {
      s = reducer(s, { tip: 'izvedi', id: sl.id })
    } else break
  }
  return s
}

/** Provera oblika pozicije (npr. iz sessionStorage). */
export function jeVazecaPozicija(x: unknown): x is Pozicija {
  if (!x || typeof x !== 'object') return false
  const p = x as Record<string, unknown>
  if (!Number.isInteger(p.korak) || !Number.isInteger(p.odradjeno)) return false
  if (p.grana !== 'approved' && p.grana !== 'rejected') return false
  const k = p.korak as number
  const o = p.odradjeno as number
  if (k < 1 || k > BROJ_KORAKA || o < 0) return false
  if (p.grana === 'rejected' && k < 6) return false // grana Rejected postoji tek od koraka 6
  return o <= brojRadnji({ korak: k, grana: p.grana })
}
