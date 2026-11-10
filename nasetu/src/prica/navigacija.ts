// Navigacija kroz priču (plan dorade 3, odeljak 2): Dalje / Nazad / skok / račva / kreni ispočetka računaju CILJNU poziciju.
// Stanje sveta se zatim gradi ponovnim odigravanjem radnji (izgradi.ts).
import { brojRadnji, jeZavrsenKorak, normalizuj } from './pozicija'
import { BROJ_KORAKA, KORAK_RACVE, POCETNA_POZICIJA, type Grana, type Pozicija } from './tipovi'

/** Dalje: iz početnog stanja odradi sve radnje koraka (završno); iz završnog ide na početak sledećeg. Na 9/završno nema cilja. */
export function ciljNext(p: Pozicija): Pozicija | null {
  if (!jeZavrsenKorak(p)) return { ...p, odradjeno: brojRadnji(p) }
  if (p.korak >= BROJ_KORAKA) return null
  return normalizuj({ korak: p.korak + 1, odradjeno: 0, grana: p.grana })
}

/** Nazad: iz završnog ili delimičnog stanja na početak istog koraka; iz početnog na početak prethodnog. Na 1/početno ostaje. */
export function ciljBack(p: Pozicija): Pozicija {
  if (p.odradjeno > 0) return { ...p, odradjeno: 0 }
  if (p.korak > 1) return normalizuj({ korak: p.korak - 1, odradjeno: 0, grana: p.grana })
  return p
}

/** Skok na korak (krug 1-9): uvek POČETNO stanje izabranog koraka. Odlazak pre koraka 9 vraća glavnu granu. */
export function ciljSkok(p: Pozicija, korak: number): Pozicija {
  return normalizuj({ korak, odradjeno: 0, grana: p.grana })
}

/** Račva: samo na koraku 9; vraća na 9/početno u izabranoj grani. */
export function ciljGrana(p: Pozicija, grana: Grana): Pozicija {
  if (p.korak !== KORAK_RACVE) return p
  return { korak: KORAK_RACVE, odradjeno: 0, grana }
}

export const ciljPocetak = (): Pozicija => ({ ...POCETNA_POZICIJA })

export type StanjeTacke = 'gotovo' | 'sada' | 'sledi'
export function stanjeTacke(p: Pozicija, korak: number): StanjeTacke {
  if (korak < p.korak) return 'gotovo'
  if (korak === p.korak) return 'sada'
  return 'sledi'
}
