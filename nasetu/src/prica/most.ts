// Most između ekrana i priče (plan dorade 3, odeljci 5 i 6).
// Ovde je „korenski reducer": svaka radnja sa ekrana prolazi kroz njega pre domenskog reducera.
//  - VOĐENO: prolazi samo SLEDEĆA radnja priče (jedna istina); sve ostalo što menja stanje se odbija.
//  - SLOBODNO: sve radi kao u dorade 2; ako je radnja baš sledeća u priči, priča ide napred, a svaka druga
//    radnja koja stvarno promeni svet postavlja „odstupljeno" (traka nudi „Vrati na korak N").
import { reducer } from '../stanje/reducer'
import type { Akcija } from '../stanje/akcije'
import type { Stanje } from '../stanje/tipovi'
import { PUTANJA_OTKAZ } from './koraci'
import { pozicijaPosleBroja, redniBroj, sledecaRadnja } from './pozicija'

/** Akcije prikaza: ne menjaju priču ni svet, pa uvek prolaze. */
const AKCIJE_PRIKAZA = new Set<Akcija['tip']>(['PROMENI_ULOGU', 'PROMENI_PRIKAZ_VLASNIKA', 'SAKRIJ_DEMO'])
export const jeAkcijaPrikaza = (a: Akcija): boolean => AKCIJE_PRIKAZA.has(a.tip)

/** Stabilan zapis akcije (ključevi sortirani, undefined i domacin:false izbačeni) za poređenje. */
function kanonski(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(kanonski)
  if (v && typeof v === 'object') {
    const o = v as Record<string, unknown>
    const izlaz: Record<string, unknown> = {}
    for (const k of Object.keys(o).sort()) {
      if (o[k] === undefined) continue
      if (k === 'domacin' && o[k] === false) continue
      izlaz[k] = kanonski(o[k])
    }
    return izlaz
  }
  return v
}
export const jednako = (a: Akcija, b: Akcija): boolean => JSON.stringify(kanonski(a)) === JSON.stringify(kanonski(b))

/** Korenski reducer: pravila vođenog i slobodnog režima iznad domenskog reducera. */
export function primeni(s: Stanje, a: Akcija): Stanje {
  if (a.tip === 'UCITAJ') return a.stanje
  const prica = s.prica

  if (jeAkcijaPrikaza(a)) {
    // Admin postoji samo u slobodnom režimu
    if (a.tip === 'PROMENI_ULOGU' && a.uloga === 'admin' && prica.rezim === 'vodjeno') return s
    // u vođenoj priči vlasnik je uvek „Pravno lice" (Alfa Prostori, vlasnik lofta): drugi prikaz bi sakrio zahtev i „Odobri"
    if (a.tip === 'PROMENI_PRIKAZ_VLASNIKA' && a.prikaz !== 'pravno' && prica.rezim === 'vodjeno') return s
    return reducer(s, a)
  }

  if (prica.rezim === 'vodjeno') {
    const sl = sledecaRadnja(prica)
    if (!sl) return s
    const akcija = sl.napravi(s)
    if (!jednako(a, akcija)) return s
    const novo = reducer(s, akcija)
    if (novo === s) return s
    return { ...novo, prica: { ...novo.prica, odradjeno: prica.odradjeno + 1 } }
  }

  // slobodno
  const novo = reducer(s, a)
  if (novo === s) return s // stvarno nije promenjeno ništa: nema odstupanja
  if (!prica.odstupljeno) {
    const n = redniBroj(prica)
    const sledeca = PUTANJA_OTKAZ[n]
    if (sledeca && jednako(a, sledeca.napravi(s))) {
      const grana = sledeca.korak === 9 ? 'otkaz' : 'vazi'
      return { ...novo, prica: { ...novo.prica, ...pozicijaPosleBroja(grana, n + 1) } }
    }
  }
  return { ...novo, prica: { ...novo.prica, odstupljeno: true } }
}

/** Da li je akciju odbio čuvar vođenog režima (a pravila bi je inače dozvolila)? Za poruku „nije sledeći korak". */
export function cuvarOdbija(s: Stanje, a: Akcija): boolean {
  if (s.prica.rezim !== 'vodjeno' || a.tip === 'UCITAJ' || jeAkcijaPrikaza(a)) return false
  return primeni(s, a) === s && reducer(s, a) !== s
}
