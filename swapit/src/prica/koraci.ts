// 9 KORAKA PRIČE (UX 3.3) kao uređene liste radnji: lanac (glavni tok) i poeni (račva 6R–8R). Koraci 1–5 i 9 su zajednički.
// Pozicija je (korak, n): n radnji tog koraka je odrađeno; stanje se uvek gradi ponovnim odigravanjem ovih lista (navigacija.ts).
// Radnje koje u UX-u izvode dva ugla istovremeno (korak 5: Marko i Moderacija; korak 6: Ana, Marko, Jovana; korak 8: tri potvrde) poređane su
// jedna za drugom, a „auto“ znači da ih gledalac iz drugog ugla preskače sam (vidi reducer.ts). Talas 1: lanac 1–8 potvrđen prema UX 3.3.
import type { Grana, Poz, Radnja, Ugao } from './tipovi'

export const NAZIVI_KORAKA = ['Ulazak', 'Oglas i lista želja', 'Poklapanje', 'Ponuda', 'Odluka', 'Lanac razmene', 'Dogovor', 'Primopredaja i recenzija', 'Firma'] as const
export const BROJ_KORAKA = NAZIVI_KORAKA.length

const A: Ugao[] = ['ana']
const M: Ugao[] = ['marko']
const P: Ugao[] = ['prodavnica']
const S: Ugao[] = ['moderacija']
const AM: Ugao[] = ['ana', 'marko']

const korakIz = (id: string): number => Number(id.split('.')[0].replace('R', ''))
const r = (id: string, uloge: Ugao[], ekran: string, auto = false): Radnja => ({ id, korak: korakIz(id), uloge, ekran, ...(auto ? { auto } : {}) })

const ZAJEDNICKI_1_5: Radnja[][] = [
  [r('1.r2', A, 'R2'), r('1.r3', A, 'R3'), r('1.r4', A, 'R4')],
  [r('2.o2', A, 'O2'), r('2.o3', A, 'O3'), r('2.zelja', A, 'O4')],
  [r('3.w4', AM, 'W4')],
  [r('4.x1', A, 'X1'), r('4.x2', A, 'X2')],
  [r('5.x4', M, 'X4', true), r('5.x5', M, 'X5', true), r('5.x6', M, 'X6', true), r('5.v2', S, 'V2', true), r('5.v3', S, 'V3', true)],
]

const KORAK_9: Radnja[] = [r('9.objavi', P, 'A5'), r('9.z3', P, 'Z3'), r('9.z4', P, 'Z4'), r('9.a1', P, 'A1'), r('9.a4', P, 'A4'), r('9.primi', P, 'A6')]

const LANAC: Radnja[][] = [
  ...ZAJEDNICKI_1_5,
  // 6: JEDAN klik na „Prihvati“ (Ana) izvodi sve tri radnje; ekran X13 zatim sam, korak po korak (700 ms po stanju), prikazuje sekvencu
  // „Čeka se Marko“ → „Čeka se Jovana“ → „Prihvaćeno — sve troje“. U reduceru su to tri automatske radnje.
  [r('6.ana', A, 'X13', true), r('6.marko', M, 'X13', true), r('6.jovana', [], 'X13', true)],
  // Anine radnje (dostava bicikla) odigravaju se same kad gleda Marko (auto)
  [r('7.x8', AM, 'X8'), r('7.c2', AM, 'C2'), r('7.d1', A, 'D1', true), r('7.d2', A, 'D2', true), r('7.z3', A, 'Z3', true), r('7.z4', A, 'Z4', true)],
  [r('8.pot.ana', A, 'X9', true), r('8.pot.marko', M, 'X9', true), r('8.pot.jovana', [], 'X9', true), r('8.x10', AM, 'X10'), r('8.x11', AM, 'X11')],
  KORAK_9,
]

const POENI: Radnja[][] = [
  ...ZAJEDNICKI_1_5,
  [r('6R.uzmi', A, 'O1'), r('6R.pokloni', A, 'W2')],
  // 7R: Jovanin zahtev za poklon je automatski; Ana ga potvrđuje (PlayStation 2 postaje „Poklanjam“)
  // N-1: Ana potvrđuje poklon, Jovana (automatski) potvrđuje prijem, i TEK TADA SWAPIT dodeljuje poene (poene ne daje korisnik korisniku)
  [r('7R.uredi', A, 'O2'), r('7R.jovana', [], 'W5', true), r('7R.potvrdi', A, 'W5'), r('7R.prijem', [], 'W5', true)],
  // Anino uzimanje bicikla za poene gledalac iz ugla Marko vidi kao već urađeno (auto). Ana tek potvrdom prijema (8R.pot.ana) dovodi do toga
  // da SWAPIT dodeli poene Marku za predatu stvar (N-1)
  [r('8R.uzmi', A, 'W1', true), r('8R.pot.ana', A, 'X9', true), r('8R.pot.marko', M, 'X9', true), r('8R.x10', AM, 'X10'), r('8R.x11', AM, 'X11')],
  KORAK_9,
]

const LISTE: Record<Grana, Radnja[][]> = { lanac: LANAC, poeni: POENI }

export const radnjeKoraka = (korak: number, grana: Grana): Radnja[] => LISTE[grana][korak - 1]
export const brojRadnji = (korak: number, grana: Grana): number => radnjeKoraka(korak, grana).length
export const sveRadnje = (grana: Grana): Radnja[] => LISTE[grana].flat()

/** Sledeća radnja na poziciji, ili null ako je korak završen. */
export const sledecaRadnja = (p: Poz): Radnja | null => radnjeKoraka(p.korak, p.grana)[p.n] ?? null

/** Skup ID-jeva svih radnji odrađenih do pozicije (cele radnje ranijih koraka + prvih n tekućeg). */
export function odradjene(p: Poz): Set<string> {
  const s = new Set<string>()
  for (let k = 1; k < p.korak; k++) for (const x of radnjeKoraka(k, p.grana)) s.add(x.id)
  radnjeKoraka(p.korak, p.grana)
    .slice(0, p.n)
    .forEach((x) => s.add(x.id))
  return s
}

/** Gde radnja stoji u listi (ili null). */
export function nadjiRadnju(id: string, grana: Grana): { radnja: Radnja; indeks: number } | null {
  const k = korakIz(id)
  const i = LISTE[grana][k - 1]?.findIndex((x) => x.id === id) ?? -1
  return i < 0 ? null : { radnja: LISTE[grana][k - 1][i], indeks: i }
}

