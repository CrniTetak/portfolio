// 9 KORAKA PRIČE (UX 3.3) kao uređene liste radnji. Postoje tri liste: A (glavni put), B i C (odvajaju se od koraka 7).
// Pozicija je (korak, n): n radnji tog koraka je odrađeno. Stanje se uvek gradi ponovnim odigravanjem ovih lista.
import type { Ishod, Poz, Radnja, Uloga } from './tipovi'

export const NAZIVI_KORAKA = [
  'Inquiry',
  'Quote',
  'Refine',
  'Reserve & deposit',
  'Enroll travelers',
  'Traveler payments',
  'Fill deadline',
  'Final payment & invoices',
  'Confirmation & documents',
] as const

const r = (id: string, uloge: Uloga[] | 'any', ekran: string): Radnja => ({ id, korak: Number(id.split('.')[0]), uloge, ekran })
const O: Uloga[] = ['organizer']
const T: Uloga[] = ['traveler']
const V: Uloga[] = ['advisor']

/** Koraci 1–6 su isti u svim ishodima. */
const ZAJEDNICKI: Radnja[][] = [
  [r('1.pretraga', O, 'G1'), r('1.zahtev', O, 'G2')],
  [r('2.v1', V, 'V2')],
  [r('3.izmene', O, 'G4'), r('3.v2', V, 'V2')],
  [r('4.prihvati', O, 'G5'), r('4.transfer', O, 'G5'), r('4.avans', V, 'V3')],
  [r('5.uvoz', O, 'G9'), r('5.link', O, 'G11'), r('5.upis1', T, 'T1'), r('5.upis2', T, 'T2'), r('5.upis3', T, 'T3')],
  [r('6.rata2', T, 'T3'), r('6.podsetnik', ['organizer', 'advisor'], 'G8')],
]

const KORACI_A: Radnja[][] = [
  ...ZAJEDNICKI,
  [r('7.sim', 'any', 'G15'), r('7.potvrda', V, 'V4')],
  [r('8.rata3', T, 'T3'), r('8.sim', 'any', 'G13')],
  [r('9.paket', V, 'V1')],
]
const KORACI_B: Radnja[][] = [
  ...ZAJEDNICKI,
  [r('7.opcije', V, 'V4'), r('7.izbor', O, 'G15')],
  [r('8.rata3', T, 'T3'), r('8.sim', 'any', 'G13')],
  [r('9.paket', V, 'V1')],
]
const KORACI_C: Radnja[][] = [
  ...ZAJEDNICKI,
  [r('7.opcije', V, 'V4'), r('7.izbor', O, 'G15')],
  [r('8.povracaj', V, 'V3')],
  [r('9.zatvori', V, 'V3')],
]
const LISTE: Record<Ishod, Radnja[][]> = { A: KORACI_A, B: KORACI_B, C: KORACI_C }

export const radnjeKoraka = (korak: number, ishod: Ishod): Radnja[] => LISTE[ishod][korak - 1]
export const brojRadnji = (korak: number, ishod: Ishod): number => radnjeKoraka(korak, ishod).length
export const sveRadnje = (ishod: Ishod): Radnja[] => LISTE[ishod].flat()

/** Sledeća radnja na poziciji, ili null ako je korak završen. */
export function sledecaRadnja(p: Poz): Radnja | null {
  return radnjeKoraka(p.korak, p.ishod)[p.n] ?? null
}

/** Skup ID-jeva svih radnji odrađenih do pozicije (cele radnje ranijih koraka + prvih n tekućeg). */
export function odradjene(p: Poz): Set<string> {
  const s = new Set<string>()
  for (let k = 1; k < p.korak; k++) for (const x of radnjeKoraka(k, p.ishod)) s.add(x.id)
  radnjeKoraka(p.korak, p.ishod)
    .slice(0, p.n)
    .forEach((x) => s.add(x.id))
  return s
}

/** Gde radnja stoji u listi: radnja, korak i indeks (ili null). */
export function nadjiRadnju(id: string, ishod: Ishod): { radnja: Radnja; indeks: number } | null {
  const k = Number(id.split('.')[0])
  const i = LISTE[ishod][k - 1]?.findIndex((x) => x.id === id) ?? -1
  return i < 0 ? null : { radnja: LISTE[ishod][k - 1][i], indeks: i }
}

/** Ukupan broj stanja (korak × n) na putu. */
export const brojPozicija = (ishod: Ishod) => LISTE[ishod].reduce((z, l) => z + l.length + 1, 0)
