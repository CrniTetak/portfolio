// DATUMI su fiksni podaci (UX 3.3, 9). Sat računara se ne koristi. "Demo date" = datum pozicije u priči.
// Za svaki korak i ishod zapisan je niz datuma: [početno, posle 1. radnje, ..., završno] (dužina = broj radnji + 1).
export type Dat = { y: number; m: number; d: number }
const D = (d: number, m: number, y: number): Dat => ({ d, m, y })

/** Datum posle `noci` noći od `od` (kraj paketa = početak + noći); računa se u UTC, bez sata računara. */
export function krajPoNocima(od: Dat, noci: number): Dat {
  const t = new Date(Date.UTC(od.y, od.m - 1, od.d + noci))
  return { y: t.getUTCFullYear(), m: t.getUTCMonth() + 1, d: t.getUTCDate() }
}
/** Razlika u danima između dva datuma. */
export const razlikaDana = (a: Dat, b: Dat) => Math.round((Date.UTC(b.y, b.m - 1, b.d) - Date.UTC(a.y, a.m - 1, a.d)) / 86400000)

export const POCETAK_PRICE = D(19, 10, 2026)
export const ROK_AVANSA = D(6, 11, 2026)
export const LINK_VAZI_DO = D(30, 11, 2026)
export const ROK_POPUNJENOSTI = D(15, 1, 2027)
export const ROK_RATE3 = D(12, 2, 2027)
export const POLAZAK = D(14, 3, 2027)
export const KRAJ_PUTOVANJA = D(19, 3, 2027)
export const DOKUMENTA_OTKLJUCANA = D(1, 3, 2027)
export const POVRACAJ_POTVRDJEN_C = D(1, 2, 2027)
/** Ostali slobodni tokovi (svi posle kraja priče, UX 12.5). */
export const KRSTARENJE_POLAZAK = D(26, 4, 2027)
export const MONTE_KARLO_OD = D(20, 5, 2027)
export const MONTE_KARLO_DO = D(25, 5, 2027)
export const GALA = D(15, 12, 2027)
export const SALDO_MONTE_KARLO = D(20, 4, 2027)
export const VEGAS_OD = D(10, 4, 2027)
export const VEGAS_DO = D(14, 4, 2027)
export const GRAND_PRIX_OD = D(20, 5, 2027)
export const GRAND_PRIX_DO = D(23, 5, 2027)
export const GRAND_PRIX_RATA2 = D(20, 3, 2027)
// rok rate 2 za Las Vegas je posle kraja priče (7 Mar 2027), da na koraku 9 ne bude već prošao (UX 8.5 navodi samo "Feb 2027")
export const VEGAS_RATA2 = D(12, 3, 2027)

type Ishod = 'A' | 'B' | 'C'
const KORACI_A: Dat[][] = [
  /* 1 */ [D(19, 10, 2026), D(20, 10, 2026), D(21, 10, 2026)],
  /* 2 */ [D(22, 10, 2026), D(24, 10, 2026)],
  /* 3 */ [D(27, 10, 2026), D(28, 10, 2026), D(29, 10, 2026)],
  /* 4 */ [D(30, 10, 2026), D(2, 11, 2026), D(4, 11, 2026), D(5, 11, 2026)],
  /* 5 */ [D(9, 11, 2026), D(12, 11, 2026), D(19, 11, 2026), D(30, 11, 2026), D(30, 11, 2026), D(30, 11, 2026)],
  /* 6 */ [D(1, 12, 2026), D(9, 12, 2026), D(14, 1, 2027)],
  /* 7 */ [D(15, 1, 2027), D(15, 1, 2027), D(15, 1, 2027)],
  /* 8 */ [D(18, 1, 2027), D(8, 2, 2027), D(12, 2, 2027)],
  /* 9 */ [D(1, 3, 2027), D(7, 3, 2027)],
]
const KORACI_B: Dat[][] = [...KORACI_A.slice(0, 6), KORACI_A[6], KORACI_A[7], KORACI_A[8]]
const KORACI_C: Dat[][] = [
  ...KORACI_A.slice(0, 6),
  [D(15, 1, 2027), D(15, 1, 2027), D(15, 1, 2027)],
  [D(18, 1, 2027), D(1, 2, 2027)],
  [D(2, 2, 2027), D(5, 2, 2027)],
]
const PO_ISHODU: Record<Ishod, Dat[][]> = { A: KORACI_A, B: KORACI_B, C: KORACI_C }
/** Datum zatvaranja otkazane grupe (ishod C, kraj koraka 9). */
export const ZATVORENO_C = KORACI_C[8][1]

/** Niz datuma za korak (1–9) i ishod. */
export const datumiKoraka = (korak: number, ishod: Ishod): Dat[] => PO_ISHODU[ishod][korak - 1]
/** Demo datum za poziciju (korak, n odrađenih radnji, ishod). */
export const demoDatum = (korak: number, n: number, ishod: Ishod): Dat => {
  const niz = datumiKoraka(korak, ishod)
  return niz[Math.min(n, niz.length - 1)]
}

/** Događaji u M8 (posle kraja priče; polazak i povratak). */
export const DOGADJAJI_DATUMI = [
  { od: D(11, 6, 2027), do: D(14, 6, 2027) },
  { od: D(2, 7, 2027), do: D(5, 7, 2027) },
  { od: D(17, 9, 2027), do: D(20, 9, 2027) },
] as const
export const KRSTARENJE_KRAJ = D(30, 4, 2027)
