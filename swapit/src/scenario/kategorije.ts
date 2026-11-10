// 31 kategorija (UX 7.3, bez "Životinje"), gustina, ikonica i red na P1 (UX 12.11).
// Brojevi oglasa NISU ovde: izvode se iz oglasi.ts kroz svet().

export type Gustina = 'gusto' | 'srednje' | 'malo'

export type Kategorija = {
  id: string
  naziv: string
  gustina: Gustina
  /** Naziv Lucide ikonice za kategoriju (ilustracija usluga i ideja). */
  ikonica: string
  /** Mesto reda na Početnoj (1–9) ili null ako se kategorija vidi samo iz levog stuba. */
  redP1: number | null
}

const k = (id: string, naziv: string, gustina: Gustina, ikonica: string, redP1: number | null = null): Kategorija => ({ id, naziv, gustina, ikonica, redP1 })

export const KATEGORIJE: Kategorija[] = [
  k('bebe-i-deca', 'Bebe i deca', 'gusto', 'baby', 6),
  k('knjige', 'Knjige', 'gusto', 'book-open', 5),
  k('igre-i-konzole', 'Igre i konzole', 'gusto', 'gamepad-2', 4),
  k('sport-i-rekreacija', 'Sport i rekreacija', 'gusto', 'dumbbell', 8),
  k('bicikli-i-trotineti', 'Bicikli i trotineti', 'gusto', 'bike', 7),
  k('namestaj', 'Nameštaj', 'gusto', 'sofa', 1),
  k('odeca', 'Odeća', 'gusto', 'shirt', 9),
  k('sveze-voce-i-povrce', 'Sveže voće i povrće', 'srednje', 'apple', 2),
  k('it-oprema', 'IT oprema', 'srednje', 'monitor', 3),
  k('mobilni-telefoni', 'Mobilni telefoni i oprema', 'srednje', 'smartphone'),
  k('racunari-i-laptopovi', 'Računari i laptopovi', 'srednje', 'laptop'),
  k('audio-i-video', 'Audio i video oprema', 'srednje', 'speaker'),
  k('alati-i-masine', 'Alati i mašine', 'srednje', 'wrench'),
  k('igracke-i-hobiji', 'Igračke i hobiji', 'srednje', 'puzzle'),
  k('kucni-aparati', 'Kućni aparati', 'srednje', 'washing-machine'),
  k('kuhinjski-aparati', 'Kuhinjski aparati', 'srednje', 'cooking-pot'),
  k('kucni-dekor', 'Kućni dekor', 'srednje', 'lamp'),
  k('muzika-i-instrumenti', 'Muzika i instrumenti', 'srednje', 'guitar'),
  k('basta-i-biljke', 'Bašta i biljke', 'srednje', 'flower-2'),
  k('kamping', 'Kamping i oprema za prirodu', 'srednje', 'tent'),
  k('zdravlje-i-lepota', 'Zdravlje i lepota', 'malo', 'heart-pulse'),
  k('kancelarijska-oprema', 'Kancelarijska oprema', 'malo', 'briefcase'),
  k('kolekcionarstvo', 'Kolekcionarstvo i antikviteti', 'malo', 'gem'),
  k('ljubimci-oprema', 'Oprema za kućne ljubimce', 'malo', 'paw-print'),
  k('foto-i-video', 'Foto i video oprema', 'malo', 'camera'),
  k('gradjevinski-materijal', 'Građevinski materijal', 'malo', 'hammer'),
  k('rasveta-i-elektrika', 'Rasveta i električna oprema', 'malo', 'lightbulb'),
  k('nakit-i-satovi', 'Nakit i satovi', 'malo', 'watch'),
  k('poljoprivredne-masine', 'Poljoprivredne mašine', 'malo', 'tractor'),
  k('vozila', 'Vozila (obaveštenje)', 'malo', 'car'),
  k('nekretnine', 'Nekretnine (obaveštenje)', 'malo', 'house'),
]

export const KATEGORIJA_PO_ID: Record<string, Kategorija> = Object.fromEntries(KATEGORIJE.map((x) => [x.id, x]))
/** Kategorije za koje važi obaveštenje „SWAPIT ne posreduje u prometu nekretnina i vozila…“ (UX 0). */
export const KATEGORIJE_SA_OBAVESTENJEM: string[] = ['vozila', 'nekretnine']
/** Jedina kategorija sa jabučicom „Iz sopstvene proizvodnje“. */
export const KATEGORIJA_JABUCICA = 'sveze-voce-i-povrce'
