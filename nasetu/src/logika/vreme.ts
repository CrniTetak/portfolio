// Simulirano vreme. Vreme je JEDAN BROJ: celi sati od izmišljenog početka scenarija.
// Pravi sat računara se nigde ne koristi — zato prototip uvek pokazuje iste brojke.
// Rokovi se ne "izvršavaju" u pozadini, nego se računaju iz ovog broja pri prikazu.

/** Početak scenarija: ponedeljak, 2. 11. 2026. u 09:00 (izmišljeno). */
const POCETAK = Date.UTC(2026, 10, 2, 9, 0)
const MS_SAT = 3_600_000

const DANI = ['ned', 'pon', 'uto', 'sre', 'čet', 'pet', 'sub']

/** Rok "ističe" tačno kad je sada ≥ rok (na 71 h opcija važi, na 72 h je istekla). */
export function istekao(rok: number, sada: number): boolean {
  return sada >= rok
}

/** Koliko sati je ostalo do roka (nikad ispod nule). */
export function preostaloSati(rok: number, sada: number): number {
  return Math.max(0, rok - sada)
}

function datumIzSati(sati: number): Date {
  return new Date(POCETAK + sati * MS_SAT)
}

const dvo = (n: number) => String(n).padStart(2, '0')

/** "pon 2. 11. 2026. 09:00" */
export function formatVreme(sati: number): string {
  const d = datumIzSati(sati)
  return `${DANI[d.getUTCDay()]} ${d.getUTCDate()}. ${d.getUTCMonth() + 1}. ${d.getUTCFullYear()}. ${dvo(d.getUTCHours())}:${dvo(d.getUTCMinutes())}`
}

/** Kalendarski dan iz ISO oblika "2026-11-17" → "17. 11. 2026." */
export function formatDan(iso: string): string {
  const [g, m, d] = iso.split('-').map(Number)
  return `${d}. ${m}. ${g}.`
}

/** "uto 17. 11." */
export function formatDanKratko(iso: string): string {
  const [g, m, d] = iso.split('-').map(Number)
  return `${DANI[new Date(Date.UTC(g, m - 1, d)).getUTCDay()]} ${d}. ${m}.`
}

/** Simulirani sat u kom počinje dati dan u datom času (za izviđanja). */
export function satiZaDan(iso: string, cas: number): number {
  const [g, m, d] = iso.split('-').map(Number)
  return Math.round((Date.UTC(g, m - 1, d, cas, 0) - POCETAK) / MS_SAT)
}

/** Datum "danas" u simuliranom vremenu kao ISO ("2026-11-02"). */
export function danasIso(sati: number): string {
  return datumIzSati(sati).toISOString().slice(0, 10)
}

export function dodajDane(iso: string, n: number): string {
  const [g, m, d] = iso.split('-').map(Number)
  return new Date(Date.UTC(g, m - 1, d + n)).toISOString().slice(0, 10)
}

export const NAZIVI_MESECA = ['januar', 'februar', 'mart', 'april', 'maj', 'jun', 'jul', 'avgust', 'septembar', 'oktobar', 'novembar', 'decembar']

/** Mreža jednog meseca za kalendar: nedelje počinju ponedeljkom; null = prazno polje. */
export function mreza(godina: number, mesec: number): (string | null)[][] {
  const prvi = new Date(Date.UTC(godina, mesec, 1))
  const pomak = (prvi.getUTCDay() + 6) % 7 // ponedeljak = 0
  const brojDana = new Date(Date.UTC(godina, mesec + 1, 0)).getUTCDate()
  const polja: (string | null)[] = Array(pomak).fill(null)
  for (let d = 1; d <= brojDana; d++) polja.push(`${godina}-${dvo(mesec + 1)}-${dvo(d)}`)
  while (polja.length % 7) polja.push(null)
  const redovi: (string | null)[][] = []
  for (let i = 0; i < polja.length; i += 7) redovi.push(polja.slice(i, i + 7))
  return redovi
}
