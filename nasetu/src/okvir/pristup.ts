// Koja uloga sme na koji link, i gde je polazna strana svake uloge.
// Uloga se čuva u stanju, ne u linku: kad se uloga promeni, a trenutni ekran je ne pripada,
// ide se na polaznu stranu nove uloge (UX 4.0). Ako neko ipak dođe na tuđ ekran
// (npr. dugmetom „Nazad"), Okvir ne prikazuje ekran nego poruku (vidi Okvir.tsx).
import type { Uloga } from '../logika/tipovi'

export const POLAZNA: Record<Uloga, string> = {
  produkcija: '/pocetna',
  vlasnik: '/vlasnik',
  partner: '/partner',
  admin: '/admin',
}

const SVE: Uloga[] = ['produkcija', 'vlasnik', 'partner', 'admin']

/** Koje uloge smeju na link (javni deo: sve). */
export function ulogeZaLink(putanja: string): Uloga[] {
  for (const u of SVE) {
    const prefiks = `/${u === 'produkcija' ? 'produkcija' : u}`
    if (putanja === prefiks || putanja.startsWith(prefiks + '/')) return [u]
  }
  // pregled izbora (P2) vidi samo produkcija; podešavanje/deljenje produkcija, partner i admin
  if (/^\/izbor\/[^/]+$/.test(putanja)) return ['produkcija']
  if (/^\/izbor\/[^/]+\/deljenje$/.test(putanja)) return ['produkcija', 'partner', 'admin']
  return SVE
}

export const smeNaLink = (putanja: string, uloga: Uloga): boolean => ulogeZaLink(putanja).includes(uloga)
