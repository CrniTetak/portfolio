// Kuke za ekrane: stanje sveta za trenutnu poziciju priče, odrađene radnje i kvačice saglasnosti.
// Ekrani čitaju stanje isključivo ovuda (i iz scenario/svet.ts), nikad direktno iz ulaznih fajlova scenarija.
import { useMemo } from 'react'
import { odradjene } from '../prica/koraci'
import { svet, vlasnikUgla, type Svet } from '../scenario/svet'
import { useEkran } from '../okvir/kontekst'
import type { Ugao } from '../prica/tipovi'
import type { Tokovi } from '../tokovi/tokovi'
import { useDemo } from './DemoProvider'

export type StanjePrice = {
  s: Svet
  ugao: Ugao
  /** Da li je radnja priče već odrađena (u trenutnoj grani). */
  uradjeno: (id: string) => boolean
  korak: number
  grana: 'lanac' | 'poeni'
  /** Stanje slobodnih tokova i način da se promeni (čista funkcija iz tokovi/operacije.ts). */
  tokovi: Tokovi
  promeni: (f: (t: Tokovi) => Tokovi) => Tokovi
  /** Režim „Slobodno klikanje“: tokovi koji su vezani za priču rade kao slobodni. */
  slobodno: boolean
  /** Ko je gledalac: Ana, Marko ili firma (Prodavnica); Moderacija nema svoje oglase i ponude. */
  ja: string | null
}

export function useStanjePrice(): StanjePrice {
  const demo = useDemo()
  const { ugao } = useEkran()
  const { poz, tokovi } = demo
  const s = useMemo(() => svet(poz, tokovi), [poz.korak, poz.n, poz.grana, tokovi]) // eslint-disable-line react-hooks/exhaustive-deps
  const u = useMemo(() => odradjene(poz), [poz.korak, poz.n, poz.grana]) // eslint-disable-line react-hooks/exhaustive-deps
  return { s, ugao, uradjeno: (id) => u.has(id), korak: poz.korak, grana: poz.grana, tokovi, promeni: demo.promeniTokove, slobodno: demo.rezim === 'slobodno', ja: vlasnikUgla(ugao) }
}

/**
 * V1: JEDNO pravilo za dostavu — „slobodno“ je režim Slobodno klikanje ILI adresa nosi ?razmena=… (D1/D2 i Z3/Z4 koriste ovu funkciju).
 * Dostava bicikla iz priče nikad nema ?razmena=, a slobodna dostava nikad ne pokreće radnje 7.d2/7.z3/7.z4.
 */
export const jeSlobodnaDostava = (rezim: string, search: string): boolean => rezim === 'slobodno' || new URLSearchParams(search).has('razmena')

/** Kvačica saglasnosti (ili izbor) koja živi u stanju demoa: nije unapred štiklirana. */
export function useSaglasnost(kljuc: string): [boolean, (v: boolean) => void] {
  const demo = useDemo()
  return [!!demo.saglasnosti[kljuc], (v) => demo.postaviSaglasnost(kljuc, v)]
}
