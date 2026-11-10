// JEDAN REDUCER za priču (čista funkcija: ista pozicija + isti događaj = isto stanje; vraća ISTU referencu kad se događaj odbije).
// Kroz njega idu i dugmad na ekranima i skok/Dalje/Nazad/Restart (navigacija.ts ga samo ponovo odigrava).
// Radnja se prihvata SAMO ako je baš ona sledeća u listi i gledalac je u uglu koji je izvodi. Izuzetak je 'sistem'
// (automatske radnje i ponovno odigravanje): njega ne ograničava ugao.
import { brojRadnji, sledecaRadnja } from './koraci'
import type { Grana, Poz, Ugao } from './tipovi'

export const POCETNA_POZICIJA: Poz = { korak: 1, n: 0, grana: 'lanac' }

export type Dogadjaj = { t: 'radnja'; id: string; ugao: Ugao | 'sistem' } | { t: 'sledeciKorak' } | { t: 'grana'; grana: Grana }

export function reducer(p: Poz, d: Dogadjaj): Poz {
  switch (d.t) {
    case 'radnja': {
      const sl = sledecaRadnja(p)
      if (!sl || sl.id !== d.id) return p
      if (d.ugao !== 'sistem' && !sl.uloge.includes(d.ugao)) return p
      return { ...p, n: p.n + 1 }
    }
    case 'sledeciKorak':
      // prelazak je dozvoljen tek kad je korak završen
      if (p.n !== brojRadnji(p.korak, p.grana) || p.korak >= 9) return p
      return { ...p, korak: p.korak + 1, n: 0 }
    case 'grana':
      // račva se bira samo na koraku 6; promena grane ponovo kreće korak 6 od početka
      if (p.korak !== 6 || p.grana === d.grana) return p
      return { korak: 6, n: 0, grana: d.grana }
  }
}

/** Da li bi događaj bio prihvaćen (provera bez primene). */
export const prihvata = (p: Poz, d: Dogadjaj): boolean => reducer(p, d) !== p

/**
 * Automatske radnje: dok je sledeća radnja `auto` i gledalac je ne izvodi, ona se odigra sama (kroz isti reducer).
 * Tako Ana klikne jednom, a „Čeka se Marko“ → „Čeka se Jovana“ → „Prihvaćeno“ se odigra posle (UX 1.1).
 */
export function dovrsiAutomatske(p: Poz, ugao: Ugao): Poz {
  let q = p
  for (;;) {
    const sl = sledecaRadnja(q)
    if (!sl || !sl.auto || sl.uloge.includes(ugao)) return q
    q = reducer(q, { t: 'radnja', id: sl.id, ugao: 'sistem' })
  }
}

/**
 * Radnja sa ekrana: prvo se odigraju automatske radnje koje stoje ispred (npr. Anino prihvatanje kad gleda Marko),
 * pa se primeni tražena, pa automatske koje slede. Odbijena radnja ne menja ništa (vraća se ista referenca).
 */
export function izvedi(p: Poz, id: string, ugao: Ugao): Poz {
  const spremna = dovrsiAutomatske(p, ugao)
  const nova = reducer(spremna, { t: 'radnja', id, ugao })
  if (nova === spremna) return p
  return dovrsiAutomatske(nova, ugao)
}

/** Da li je radnja sada aktivna za dati ugao (dugme na ekranu je omogućeno). */
export const mozeRadnja = (p: Poz, id: string, ugao: Ugao): boolean => izvedi(p, id, ugao) !== p
