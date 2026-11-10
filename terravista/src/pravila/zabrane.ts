// ZABRANJENI IZRAZI u tekstu ekrana (PLAN B6.5, UX 8): jedan spisak za sve testove (izvorni test i e2e-zabrane).
// Demo ne tvrdi ništa o zakonima, presudama ni partnerstvima. Rečenica o nedostupnosti mora biti TAČNO NEDOSTUPNO iz stalni-tekstovi.ts.
import { NEDOSTUPNO, OZNAKA_DEMOA } from '../podaci/stalni-tekstovi'

export type Zabrana = { naziv: string; izraz: RegExp }

export const ZABRANE: readonly Zabrana[] = [
  { naziv: 'zakon', izraz: /zakon/i },
  { naziv: 'uredba', izraz: /uredb/i },
  { naziv: 'presuda', izraz: /presud/i },
  { naziv: '§', izraz: /§/ },
  { naziv: 'BGB', izraz: /\bBGB\b/ },
  { naziv: 'po zakonu', izraz: /po\s+zakonu/i },
  { naziv: 'sigurno (uz plaćanje)', izraz: /sigurn/i },
  { naziv: 'partner', izraz: /partner/i },
  { naziv: 'zabranjeno', izraz: /zabranjen/i },
  { naziv: 'monopol', izraz: /monopol/i },
  { naziv: 'ekskluzivno', izraz: /ekskluziv/i },
  { naziv: 'garancija', izraz: /garanc/i },
  { naziv: 'zvanično', izraz: /zvani[cč]/i },
  { naziv: 'ovlašćeno', izraz: /ovla[sš][cć]/i },
]

/**
 * Vraća zabranjene izraze nađene u tekstu. Oznaka demoa („nisu partneri“) i jedina dozvoljena rečenica o nedostupnosti
 * se pre provere uklanjaju iz teksta (oni su dozvoljeni na tačno tom mestu).
 */
export function nadjiZabranjeno(tekst: string): string[] {
  const t = tekst.split(OZNAKA_DEMOA).join(' ')
  return ZABRANE.filter((z) => z.izraz.test(t)).map((z) => z.naziv)
}

/** Rečenica koja govori o nedostupnosti, ali nije TAČNA dozvoljena rečenica (npr. „zabranjeno u Srbiji“, „jer prava drži …“). */
export function netacnaRecenicaONedostupnosti(tekst: string): boolean {
  const t = tekst.split(NEDOSTUPNO).join(' ')
  return /nije\s+dostup[^.]*\bjer\b|prava\s+(?:za|u)\s+[^.]*\b(?:drži|ima|poseduje)\b/i.test(t)
}
