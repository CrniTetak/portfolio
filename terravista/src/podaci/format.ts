// FORMAT — JEDINO mesto prikaza brojeva, cena, vremena i datuma (PLAN B3). Ekrani ne sklapaju iznose rukom.
// Namerno bez toLocaleString (zavisi od pregledača); sve je običan, predvidiv tekst.

/** 1284 → „1.284“ (tačka kao razdvajač hiljada, kao na srpskom). */
export function broj(n: number): string {
  const znak = n < 0 ? '-' : ''
  const cifre = String(Math.trunc(Math.abs(n)))
  return znak + cifre.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

/** Cena u centima → „2,99 €“; „1.200,00 €“ za veće iznose. */
export function cena(centi: number): string {
  const celo = Math.trunc(centi / 100)
  const deo = String(Math.abs(centi % 100)).padStart(2, '0')
  return `${broj(celo)},${deo} €`
}

/** Iznos bez centi kad su celi: 1200000 → „12.000 €“ (table); inače kao cena(). */
export function cenaBezCenti(centi: number): string {
  return centi % 100 === 0 ? `${broj(centi / 100)} €` : cena(centi)
}

/** „9,99 € mesečno“. */
export function cenaMesecno(centi: number): string {
  return `${cena(centi)} mesečno`
}

/** Procenat: 60 → „60 %“. */
export function procenat(n: number): string {
  return `${n} %`
}

/** Minuti od ponoći → „19:45“. */
export function vreme(minuti: number): string {
  const m = ((minuti % 1440) + 1440) % 1440
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
}

/** Izmišljen datum „2026-10-12“ → „12. 10. 2026.“ (bez Date objekta). */
export function datum(iso: string): string {
  const [g, m, d] = iso.split('-').map(Number)
  return `${d}. ${m}. ${g}.`
}

/** Koliki je deo od najvećeg vrednosti, u celim procentima (za stubiće). */
export function postotakOd(vrednost: number, najvise: number): number {
  return najvise <= 0 ? 0 : Math.round((vrednost * 100) / najvise)
}
