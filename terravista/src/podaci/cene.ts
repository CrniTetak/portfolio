// CENE (PLAN B3) u centima (celi brojevi, bez zaokruživanja). Prikaz ISKLJUČIVO kroz format.ts.
// Sve su ilustracija: jedna cena za sve zemlje pilota, uz napomenu „Cena zavisi od zemlje (primer).“ (stalni-tekstovi.ts).
import type { Kanal } from './kanali'
import type { Paket } from './paketi'

export const CENE = {
  kanalPoIzboru: 299,
  paketZanr: 599,
  paketZemlja: 999,
} as const

/** Mesečna cena kanala: besplatni = 0; po izboru = cena kanala; kanal u paketu se ne kupuje pojedinačno (null). */
export function cenaKanala(k: Kanal): number | null {
  if (k.deo === 'besplatni') return 0
  if (k.deo === 'po-izboru') return CENE.kanalPoIzboru
  return null
}

export function cenaPaketa(p: Paket): number {
  return p.vrsta === 'zemlja' ? CENE.paketZemlja : CENE.paketZanr
}

/** Stopa PDV-a za prikaz u demou (primer, Nemačka); iznosi sa PDV-om su ono što se prikazuje, ovo služi samo za red „od toga PDV“. */
export const PDV_STOPA = 19

/** PDV sadržan u ceni sa PDV-om (centi, zaokruženo). */
export function pdvUCeni(centi: number): number {
  return Math.round((centi * PDV_STOPA) / (100 + PDV_STOPA))
}
