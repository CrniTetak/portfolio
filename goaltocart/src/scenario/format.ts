// JEDINO mesto za prikaz iznosa, procenata i datuma (UI.md 3.3).
// Zarez je razdvajač hiljada, valuta je ispred, minus je pravi znak (U+2212).

const MINUS = '−'

/** 1600000 -> "1,600,000" */
export function broj(n: number): string {
  const znak = n < 0 ? MINUS : ''
  const s = Math.abs(Math.round(n)).toString()
  return znak + s.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

/** 4400000 -> "EUR 4,400,000" */
export function eur(n: number): string {
  return `EUR ${broj(n)}`
}

/** 80000 -> "− EUR 80,000" (odbitak) */
export function eurMinus(n: number): string {
  return `${MINUS} EUR ${broj(Math.abs(n))}`
}

/** Razlika među verzijama: 800000 -> "+EUR 800,000", -400000 -> "−EUR 400,000" */
export function eurRazlika(n: number): string {
  if (n === 0) return 'no change'
  return `${n > 0 ? '+' : MINUS}EUR ${broj(Math.abs(n))}`
}

/** Razlika u procentnim poenima: 10 -> "+10 pts", -5 -> "−5 pts" */
export function poeni(n: number): string {
  if (n === 0) return 'no change'
  return `${n > 0 ? '+' : MINUS}${Math.abs(n)} pts`
}

/** 15 -> "15%" */
export function pct(n: number): string {
  return `${n}%`
}

/** Jedna decimala: 8.45 -> "8.5%" */
export function pctDecimal(n: number): string {
  return `${n.toFixed(1)}%`
}

/** "1,600,000 / 1,400,000 / 1,400,000" */
export function nizRata(rate: readonly number[]): string {
  return rate.map(broj).join(' / ')
}

/** Skraćeno za uske ekrane: [1600000,1400000,1400000] -> "1.6 / 1.4 / 1.4 M" */
export function nizRataKratko(rate: readonly number[]): string {
  // tačno, bez zaokruživanja: 1,250,000 -> 1.25
  return rate.map((r) => (r / 1_000_000).toFixed(2).replace(/0+$/, '').replace(/\.$/, '')).join(' / ') + ' M'
}

const MESECI = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** "2027-06-23" -> "23 Jun 2027" */
export function datumIso(iso: string): string {
  const [g, m, d] = iso.split('-').map(Number)
  return `${d} ${MESECI[m - 1]} ${g}`
}
