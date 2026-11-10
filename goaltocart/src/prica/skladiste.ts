// Čuvanje mesta u priči: SAMO sessionStorage (nestaje kad se zatvori prozor), jedan ključ sa verzijom.
// Ako se verzija ne poklapa ili zapis ne prođe proveru oblika, odbacuje se i kreće se iz početka.
import { jeVazecaPozicija, POCETNO } from './reducer'
import { ULOGE } from './tipovi'
import type { Pozicija, Rezim, Uloga } from './tipovi'

// Poslednja uloga ide u poseban ključ (da osvežavanje na ruti bez uloge, npr. #/about, ne vrati na podrazumevanu,
// a da promena uloge ne prepisuje zapis o stanju priče).
export const KLJUC_ULOGE = 'goaltocart.demo.v1.uloga'
export function ucitajUlogu(sk: Pick<Storage, 'getItem'> | null): Uloga {
  try {
    return ULOGE.find((u) => u === sk?.getItem(KLJUC_ULOGE)) ?? 'selling'
  } catch {
    return 'selling'
  }
}
export function sacuvajUlogu(sk: Pick<Storage, 'setItem'> | null, u: Uloga): void {
  try {
    sk?.setItem(KLJUC_ULOGE, u)
  } catch {
    // bez čuvanja
  }
}

export const KLJUC = 'goaltocart.demo.v1'
export const VERZIJA_ZAPISA = 1

export interface Zapis {
  verzija: number
  korak: number
  odradjeno: number
  grana: Pozicija['grana']
  rezim: Rezim
  vidjenUvodFree: boolean
}

export interface Sacuvano {
  pozicija: Pozicija
  rezim: Rezim
  vidjenUvodFree: boolean
}

export const PODRAZUMEVANO: Sacuvano = { pozicija: POCETNO, rezim: 'guided', vidjenUvodFree: false }

/** Čista funkcija: tekst iz skladišta -> stanje (ili podrazumevano). */
export function parsirajZapis(raw: string | null): Sacuvano {
  if (!raw) return PODRAZUMEVANO
  try {
    const z = JSON.parse(raw) as Partial<Zapis> | null
    if (!z || typeof z !== 'object' || z.verzija !== VERZIJA_ZAPISA) return PODRAZUMEVANO
    const pozicija = { korak: z.korak, odradjeno: z.odradjeno, grana: z.grana }
    if (!jeVazecaPozicija(pozicija)) return PODRAZUMEVANO
    if (z.rezim !== 'guided' && z.rezim !== 'free') return PODRAZUMEVANO
    return { pozicija, rezim: z.rezim, vidjenUvodFree: z.vidjenUvodFree === true }
  } catch {
    return PODRAZUMEVANO
  }
}

export function napraviZapis(s: Sacuvano): string {
  const z: Zapis = {
    verzija: VERZIJA_ZAPISA,
    korak: s.pozicija.korak,
    odradjeno: s.pozicija.odradjeno,
    grana: s.pozicija.grana,
    rezim: s.rezim,
    vidjenUvodFree: s.vidjenUvodFree,
  }
  return JSON.stringify(z)
}

type Skladiste = Pick<Storage, 'getItem' | 'setItem'>

export function ucitaj(sk: Skladiste | null): Sacuvano {
  try {
    return parsirajZapis(sk ? sk.getItem(KLJUC) : null)
  } catch {
    return PODRAZUMEVANO
  }
}

export function sacuvaj(sk: Skladiste | null, s: Sacuvano): void {
  try {
    sk?.setItem(KLJUC, napraviZapis(s))
  } catch {
    // privatni režim ili pun prostor: demo radi dalje bez čuvanja
  }
}
