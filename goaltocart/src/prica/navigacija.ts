// Navigacija kroz priču (UX.md 1.5): Next / Back / skok / račva / Restart računaju CILJNU poziciju.
// Stanje se zatim gradi ponovnim odigravanjem kroz reducer (dogadjaj 'idi').
import { BROJ_KORAKA } from './tipovi'
import type { Grana, Pozicija } from './tipovi'
import { brojRadnji, jeZavrsenKorak, POCETNO } from './reducer'

/** "Next": početno -> završno stanje istog koraka; završno -> početno sledećeg. Na 9/završno nema cilja (isključeno). */
export function ciljNext(p: Pozicija): Pozicija | null {
  if (!jeZavrsenKorak(p)) return { ...p, odradjeno: brojRadnji(p) }
  if (p.korak >= BROJ_KORAKA) return null
  return { korak: p.korak + 1, odradjeno: 0, grana: p.grana }
}

/** "Back": odmakao od početnog -> početno istog koraka; inače početno prethodnog. Na 1/početno ostaje. */
export function ciljBack(p: Pozicija): Pozicija {
  if (p.odradjeno > 0) return { ...p, odradjeno: 0 }
  if (p.korak > 1) return { korak: p.korak - 1, odradjeno: 0, grana: p.grana }
  return p
}

/** Skok na korak i "Show me": uvek POČETNO stanje izabranog koraka. */
export function ciljSkok(p: Pozicija, korak: number): Pozicija {
  return { korak, odradjeno: 0, grana: p.grana }
}

/** Račva: samo na koraku 6; vraća na 6/početno u izabranoj grani. */
export function ciljGrana(p: Pozicija, grana: Grana): Pozicija {
  if (p.korak !== 6) return p
  return { korak: 6, odradjeno: 0, grana }
}

export const ciljRestart = (): Pozicija => POCETNO

/** Koraci čiji je položaj "završen" u traci (tačka je prazna, tekuća ili završena). */
export type StanjeTacke = 'done' | 'now' | 'todo'
export function stanjeTacke(p: Pozicija, korak: number): StanjeTacke {
  if (korak < p.korak) return 'done'
  if (korak === p.korak) return 'now'
  return 'todo'
}
