// PRAVILO UX 3.1 u kodu: dugme je aktivno samo ako je njegova radnja SLEDEĆA i gledalac je u ulozi koja je izvodi.
// Inače je vidljivo, ali neaktivno, uz razlog: "Done", "Available at step N", "Waiting for the advisor", "Switch to Traveler to try this".
// Gost je posebna uloga: svaka akcija otvara "Enter demo as…" (pa se ista akcija izvrši).
import { nadjiRadnju, sledecaRadnja } from '../prica/koraci'
import type { Poz, Radnja, Uloga } from '../prica/tipovi'
import { OPISI_RADNJI } from '../tekstovi/akcije'

const IME: Record<Uloga, string> = { organizer: 'Group organizer', traveler: 'Traveler', advisor: 'Advisor', guest: 'Guest' }
const KRACE: Record<Uloga, string> = { organizer: 'organizer', traveler: 'traveler', advisor: 'advisor', guest: 'guest' }

export type StatusRadnje = {
  aktivno: boolean
  razlog?: string
  /** Uloga na koju korisnik može da pređe da bi probao radnju ("Switch to Traveler to try this"). */
  prebaci?: Uloga
  /** Gost: klik otvara "Enter demo as…". */
  gost?: boolean
}

const izvodjac = (r: Radnja): string => (r.uloge === 'any' ? 'demo' : KRACE[r.uloge[0]])

export function statusRadnje(poz: Poz, uloga: Uloga, id: string): StatusRadnje {
  const nadjena = nadjiRadnju(id, poz.ishod)
  if (!nadjena) return { aktivno: false, razlog: 'Not part of this branch of the story' }
  const { radnja } = nadjena
  // "Request a group quote" radi i bez prethodne pretrage (reducer tada preskače pretragu)
  const indeks = id === '1.zahtev' && poz.korak === 1 && poz.n === 0 ? 0 : nadjena.indeks
  if (uloga === 'guest') return { aktivno: true, gost: true }
  if (poz.korak > radnja.korak || (poz.korak === radnja.korak && poz.n > indeks)) return { aktivno: false, razlog: 'Done' }
  if (poz.korak < radnja.korak) return { aktivno: false, razlog: `Available at step ${radnja.korak}` }
  if (indeks > poz.n) {
    const sl = sledecaRadnja(poz)
    // ako je sledeća radnja baš ove uloge, treba prvo nju odraditi
    if (sl && sl.uloge !== 'any' && sl.uloge.includes(uloga)) return { aktivno: false, razlog: `First: ${OPISI_RADNJI[sl.id] ?? 'the previous step'}` }
    const ime = sl ? izvodjac(sl) : 'previous action'
    return { aktivno: false, razlog: sl && sl.uloge === 'any' ? 'Waiting for the previous demo event' : `Waiting for the ${ime}` }
  }
  if (radnja.uloge === 'any' || radnja.uloge.includes(uloga)) return { aktivno: true }
  const prebaci = radnja.uloge[0]
  return { aktivno: false, razlog: `Switch to ${IME[prebaci]} to try this`, prebaci }
}

export const imeUloge = (u: Uloga) => IME[u]
