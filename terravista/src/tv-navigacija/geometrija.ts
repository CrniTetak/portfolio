// GEOMETRIJA — srce prostorne navigacije televizora (PLAN B5.2). ČISTA funkcija: bez DOM-a, bez Reacta, potpuno testirana.
// „Ko je sledeći izabran kad se pritisne strelica?“ Redosled pravila:
//  1. izričit sused na elementu (gore/dole/levo/desno = id, ili „nista“ = ostani);
//  2. u REDU (isti `red`) levo/desno je indeks ± 1, bez obzira da li je element trenutno van slike; na kraju reda: ostani (bez kruženja);
//  3. inače geometrija: kandidati koji su CELI u traženom smeru; rezultat = udaljenost u smeru + 2 × poprečno odstupanje
//     (elementi koji se preklapaju po poprečnoj osi nemaju odstupanje, pa imaju prednost — u vodiču ostaje isto vreme).
//     Levo/desno ide SAMO na elemente u istom „pojasu“ (preklapaju se uspravno): strelica udesno nikad ne skače dijagonalno u traku iznad;
//  4. pri ulasku u drugi red bira se ZAPAMĆENI element tog reda.
// Nema kruženja: ako nema kandidata, vraća se null (izbor ostaje gde je).

export type Smer = 'gore' | 'dole' | 'levo' | 'desno'

/** Mere u „TV jedinicama“ (umanjenje platna je jednako po obe ose, pa odnosi ostaju tačni). */
export type Pravougaonik = { x: number; y: number; sirina: number; visina: number }

/** Vrednost izričitog suseda koja znači „ovde se ne ide dalje“. */
export const NISTA = 'nista'

export type Kandidat = {
  id: string
  rect: Pravougaonik
  /** Red (vodoravna traka kartica, navigacija…) i mesto u njemu. */
  red?: string
  indeks?: number
  gore?: string
  dole?: string
  levo?: string
  desno?: string
  onemogucen?: boolean
}

export type Opcije = {
  /** Zapamćeni element zadatog reda (ili undefined). */
  zapamcenRed?: (red: string) => string | undefined
  /** Koliko sme da „zadre“ element u suprotnom smeru da se još računa kao „u smeru“ (TV jedinice). */
  tolerancija?: number
}

const TOLERANCIJA = 24
/** Težina poprečnog odstupanja (PLAN B5.2). */
const TEZINA_POPRECNO = 2
/** Sitna težina razlike centara — samo da presudi kad je sve ostalo isto (vodič: ostaje najbliže vreme). */
const TEZINA_CENTRA = 0.05

const desnaIvica = (r: Pravougaonik) => r.x + r.sirina
const donjaIvica = (r: Pravougaonik) => r.y + r.visina

function jeUSmeru(tr: Pravougaonik, k: Pravougaonik, smer: Smer, tol: number): boolean {
  switch (smer) {
    case 'desno':
      return k.x >= desnaIvica(tr) - tol
    case 'levo':
      return desnaIvica(k) <= tr.x + tol
    case 'dole':
      return k.y >= donjaIvica(tr) - tol
    case 'gore':
      return donjaIvica(k) <= tr.y + tol
  }
}

/** Razmak izmedju najbližih ivica u smeru kretanja (nikad negativan). */
function razmakUSmeru(tr: Pravougaonik, k: Pravougaonik, smer: Smer): number {
  switch (smer) {
    case 'desno':
      return Math.max(0, k.x - desnaIvica(tr))
    case 'levo':
      return Math.max(0, tr.x - desnaIvica(k))
    case 'dole':
      return Math.max(0, k.y - donjaIvica(tr))
    case 'gore':
      return Math.max(0, tr.y - donjaIvica(k))
  }
}

/** Poprečno odstupanje: 0 ako se opsezi preklapaju, inače razmak između njih. */
function poprecno(tr: Pravougaonik, k: Pravougaonik, smer: Smer): { razmak: number; centar: number } {
  const vodoravno = smer === 'levo' || smer === 'desno'
  const a0 = vodoravno ? tr.y : tr.x
  const a1 = a0 + (vodoravno ? tr.visina : tr.sirina)
  const b0 = vodoravno ? k.y : k.x
  const b1 = b0 + (vodoravno ? k.visina : k.sirina)
  const preklop = Math.min(a1, b1) - Math.max(a0, b0)
  return { razmak: preklop > 0 ? 0 : -preklop, centar: Math.abs((a0 + a1) / 2 - (b0 + b1) / 2) }
}

export function sledeci(trenutni: Kandidat, svi: readonly Kandidat[], smer: Smer, opcije: Opcije = {}): string | null {
  const tol = opcije.tolerancija ?? TOLERANCIJA
  const moguci = svi.filter((k) => !k.onemogucen && k.id !== trenutni.id)

  // 1. izričit sused
  const izricit = trenutni[smer]
  if (izricit === NISTA) return null
  if (izricit !== undefined && moguci.some((k) => k.id === izricit)) return izricit

  // 2. red: levo/desno je indeks ± 1
  if ((smer === 'levo' || smer === 'desno') && trenutni.red !== undefined && trenutni.indeks !== undefined) {
    const pomak = smer === 'desno' ? 1 : -1
    const uRedu = moguci
      .filter((k) => k.red === trenutni.red && k.indeks !== undefined && (k.indeks - trenutni.indeks!) * pomak > 0)
      .sort((a, b) => Math.abs(a.indeks! - trenutni.indeks!) - Math.abs(b.indeks! - trenutni.indeks!))
    return uRedu.length ? uRedu[0].id : null // kraj reda: ostani
  }

  // 3. geometrija
  let najbolji: Kandidat | null = null
  let najboljiRezultat = Infinity
  for (const k of moguci) {
    if (!jeUSmeru(trenutni.rect, k.rect, smer, tol)) continue
    const p = poprecno(trenutni.rect, k.rect, smer)
    if ((smer === 'levo' || smer === 'desno') && p.razmak > 0) continue // levo-desno samo u istom pojasu
    const rezultat = razmakUSmeru(trenutni.rect, k.rect, smer) + TEZINA_POPRECNO * p.razmak + TEZINA_CENTRA * p.centar
    if (rezultat < najboljiRezultat) {
      najboljiRezultat = rezultat
      najbolji = k
    }
  }
  if (!najbolji) return null

  // 4. ulazak u drugi red: zapamćeni element tog reda
  if (najbolji.red !== undefined && najbolji.red !== trenutni.red && opcije.zapamcenRed) {
    const zapamcen = opcije.zapamcenRed(najbolji.red)
    if (zapamcen !== undefined && zapamcen !== trenutni.id && moguci.some((k) => k.id === zapamcen)) return zapamcen
  }
  return najbolji.id
}
