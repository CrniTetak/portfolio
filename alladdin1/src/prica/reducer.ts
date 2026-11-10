// JEDAN REDUCER za priču (čista funkcija: ista pozicija + isti događaj = isto stanje; vraća ISTU referencu kad se događaj odbije): kroz njega idu i dugmad na ekranima i skok/Next/Back/Restart (navigacija.ts ga samo ponovo odigrava).
// Izuzetak: '1.zahtev' na samom početku (korak 1, n = 0) preskače pretragu paketa i vodi direktno na n = 2.
// Radnja se prihvata SAMO ako je baš ona sledeća u listi i gledalac je u ulozi koja je izvodi; inače se odbija (stanje ostaje isto).
import { brojRadnji, sledecaRadnja } from './koraci'
import type { Dogadjaj, Poz } from './tipovi'

export const POCETNA_POZICIJA: Poz = { korak: 1, n: 0, ishod: 'A' }

export function reducer(p: Poz, d: Dogadjaj): Poz {
  switch (d.t) {
    case 'radnja': {
      // upit se može poslati i bez prethodne pretrage paketa: "Request a group quote" tada preskače pretragu
      if (d.id === '1.zahtev' && p.korak === 1 && p.n === 0 && d.uloga === 'organizer') return { ...p, n: 2 }
      const sl = sledecaRadnja(p)
      if (!sl || sl.id !== d.id) return p
      if (sl.uloge !== 'any' && !sl.uloge.includes(d.uloga)) return p
      return { ...p, n: p.n + 1 }
    }
    case 'sledeciKorak':
      // prelazak je dozvoljen tek kad je korak završen
      if (p.n !== brojRadnji(p.korak, p.ishod) || p.korak >= 9) return p
      return { ...p, korak: p.korak + 1, n: 0 }
    case 'ishod':
      // račva se bira samo na početku koraka 7; promena ishoda ponovo kreće korak 7 od početka
      if (p.korak !== 7 || p.ishod === d.ishod) return p
      return { korak: 7, n: 0, ishod: d.ishod }
  }
}

/** Da li bi događaj bio prihvaćen (provera bez primene). */
export const prihvata = (p: Poz, d: Dogadjaj) => reducer(p, d) !== p
