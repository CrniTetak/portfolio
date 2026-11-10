// JEDINO MESTO ZA PRIKAZ brojki i datuma (UI 3): "EUR 2,500", "EUR −7,200", "EUR 7,260.00", "15 Jan 2027", "20%", "96 / 120".
// Namerno bez Date i toLocale*: sat računara se ne koristi nigde u demou (UX 9).
import type { Dat } from './datumi'

const MESECI = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** 1234567 -> "1,234,567" (zarez za hiljade). */
export function broj(n: number): string {
  const s = String(Math.abs(Math.trunc(n)))
  return s.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}
/** "EUR 2,500"; negativno sa pravim minusom: "EUR −7,200". */
export const eur = (n: number) => `EUR ${n < 0 ? '−' : ''}${broj(n)}`
/** "EUR 7,260.00" (samo format sa decimalama, ista vrednost). */
export const eurDec = (n: number) => `EUR ${n < 0 ? '−' : ''}${broj(n)}.00`
/** "+EUR 150" / "−EUR 150" (razlika). */
export const eurRazlika = (n: number) => `${n < 0 ? '−' : '+'}EUR ${broj(n)}`
export const procenat = (p: number) => `${p}%`
/** "96 / 120". */
export const odOd = (a: number, b: number) => `${a} / ${b}`
/** "96 / 120", a posle otkaza (ishod C) "—" umesto "96 / 0". */
export const odOdIli = (otkazano: boolean, a: number, b: number) => (otkazano ? "—" : `${a} / ${b}`)
/** "15 Jan 2027". */
export const datum = (d: Dat) => `${d.d} ${MESECI[d.m - 1]} ${d.y}`
/** "14 – 19 Mar 2027" (isti mesec) ili "28 Feb – 3 Mar 2027". */
export function opsegDatuma(a: Dat, b: Dat): string {
  if (a.m === b.m && a.y === b.y) return `${a.d} – ${b.d} ${MESECI[a.m - 1]} ${a.y}`
  return `${a.d} ${MESECI[a.m - 1]} – ${b.d} ${MESECI[b.m - 1]} ${b.y}`
}
/** "Mar 2027" (mesec i godina za kartice paketa). */
export const mesecGodina = (d: Dat) => `${MESECI[d.m - 1]} ${d.y}`
/** "1 seat" / "24 seats". */
export const sedista = (n: number) => `${n} ${n === 1 ? 'seat' : 'seats'}`
/** "5 nights" / "1 night". */
export const noci = (n: number) => `${n} ${n === 1 ? 'night' : 'nights'}`
