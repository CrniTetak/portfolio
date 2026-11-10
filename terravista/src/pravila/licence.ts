// BELA LISTA LICENCI za slike programa (PLAN B7.3). Jedno mesto za test (slike.test.ts) i, kasnije, za skriptu slike.mjs.
// Dozvoljeno: CC0, javno vlasništvo (Public domain, PD-…), CC BY 2.0–4.0, CC BY-SA 2.0–4.0.
// Sve ostalo (GFDL-samo, „fair use“, nepoznato, NC, ND) se odbija — čak i kad liči na belu listu (npr. „CC BY-NC 4.0“).
const BELA_LISTA = [/^CC0/i, /^Public domain/i, /^PD(\b|-)/i, /^CC BY(-SA)? [2-4]\.0/i]
// „Public domain in the USA only“ i slično NIJE slobodno u drugim zemljama (npr. u Evropi)
const ZABRANJENO = [/\bNC\b/i, /\bND\b/i, /GFDL/i, /fair use/i, /\b(?:in\s+)?the\s+USA\s+only\b/i, /\bUS\s+only\b/i, /\bUSA\b/i]

export function licencaDozvoljena(kratko: string | undefined | null): boolean {
  if (!kratko) return false
  if (ZABRANJENO.some((r) => r.test(kratko))) return false
  return BELA_LISTA.some((r) => r.test(kratko))
}

/** CC BY i CC BY-SA traže navođenje autora (ispod slike i u spisku izvora u U3). */
export const trebaNavodjenje = (kratko: string): boolean => /^CC BY/i.test(kratko)
