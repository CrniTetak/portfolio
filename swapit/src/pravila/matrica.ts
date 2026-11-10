// MATRICA PRIČE (UX 3.3, merodavno): korak × ugao × grana → ekran POČETNOG i ZAVRŠNOG stanja.
// „Pokaži mi“ i klik na broj koraka otvaraju POČETNI ekran (UX 3.2); „Dalje“ i „Nazad“ otvaraju ekran stanja na kome su stali.
// Opis šta ugao vidi ili radi u koraku je u tekstovi/kartice.ts (poUgluZa), a ovde je samo ekran; test proverava da se slažu.
import { radnjeKoraka } from '../prica/koraci'
import type { EkranId, Grana, Poz, Ugao } from '../prica/tipovi'

export type Celija = { pocetno: EkranId; zavrsno: EkranId }
const c = (pocetno: EkranId, zavrsno: EkranId = pocetno): Celija => ({ pocetno, zavrsno })

/** Glavni tok (lanac): koraci 1–9. */
export const MATRICA_LANAC: Record<Ugao, Celija[]> = {
  ana: [c('R2', 'P1'), c('O2', 'W3'), c('W4', 'O1'), c('X1', 'X3'), c('X3', 'X12'), c('X13'), c('X8', 'D3'), c('X9', 'N1'), c('P1', 'A1')],
  marko: [c('P1'), c('P1', 'W3'), c('W4', 'O1'), c('X12', 'X4'), c('X4', 'X6'), c('X13'), c('X8'), c('X9', 'N1'), c('P1')],
  prodavnica: [c('F3'), c('F4'), c('F6'), c('F3'), c('F3'), c('F3'), c('F3'), c('A5'), c('A5', 'A6')],
  moderacija: [c('V1'), c('V1'), c('V1'), c('V1'), c('V2', 'V3'), c('V4'), c('V1'), c('V1'), c('V1')],
}

/** Račva „za poene“: koraci 6R, 7R, 8R (korak 9 je isti kao u glavnom toku). */
export const MATRICA_POENI: Record<Ugao, Celija[]> = {
  ana: [c('O1', 'W2'), c('O2', 'W5'), c('W1', 'N1')],
  marko: [c('X12'), c('X12'), c('X9', 'N1')],
  prodavnica: [c('F3'), c('F3'), c('A5')],
  moderacija: [c('V4'), c('V1'), c('V1')],
}

/** Ćelija za korak i granu; korak 9 i koraci 1–5 uvek iz glavnog toka. */
export function celija(korak: number, ugao: Ugao, grana: Grana): Celija {
  if (grana === 'poeni' && korak >= 6 && korak <= 8) return MATRICA_POENI[ugao][korak - 6]
  return MATRICA_LANAC[ugao][korak - 1]
}

/** Ekran na kome je priča za dati ugao na datoj poziciji. */
export function ekranZaPoziciju(poz: Poz, ugao: Ugao): EkranId {
  const lista = radnjeKoraka(poz.korak, poz.grana)
  const { pocetno, zavrsno } = celija(poz.korak, ugao, poz.grana)
  if (poz.n === 0) return pocetno
  if (poz.n >= lista.length) return zavrsno
  // usred koraka: ekran sledeće radnje koju ugao sam izvodi; ako je nema, završni ekran
  const sledeca = lista.slice(poz.n).find((r) => r.uloge.includes(ugao))
  return sledeca ? sledeca.ekran : zavrsno
}

/** Svi ekrani koji u datom koraku pripadaju priči za ugao (za dugme „Pokaži mi“ / „Nazad na priču“). */
export function ekraniKoraka(korak: number, grana: Grana, ugao: Ugao): EkranId[] {
  const { pocetno, zavrsno } = celija(korak, ugao, grana)
  const ekrani = new Set<EkranId>([pocetno, zavrsno])
  for (const r of radnjeKoraka(korak, grana)) if (r.uloge.includes(ugao)) ekrani.add(r.ekran)
  return [...ekrani]
}

