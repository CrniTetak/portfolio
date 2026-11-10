// PODEŠAVANJA demoa (PLAN B3, B7.1). Prekidači koji se menjaju na jednom mestu.

/**
 * Prekidač za javni link: kad je isključen, SVI kanali dobijaju neutralnu pločicu sa nazivom,
 * bez ijednog pravog logotipa.
 */
export const prikaziLogotipe = false

/** Posle koliko milisekundi mirovanja se u slobodnom režimu nudi „Izgubio si se?“. */
export const VREME_PODSETNIKA_MS = 45_000

/** E2E skraćuje vreme promenljivom postavljenom PRE učitavanja stranice (bez posebnog parametra u linku). */
export function vremePodsetnika(): number {
  const g = globalThis as { __TV_PODSETNIK_MS?: number }
  return typeof g.__TV_PODSETNIK_MS === 'number' ? g.__TV_PODSETNIK_MS : VREME_PODSETNIKA_MS
}

/** Verzija ključa u sessionStorage (prica/cuvanje.ts, talas 1). */
export const KLJUC_CUVANJA = 'terravista.demo.v1'
