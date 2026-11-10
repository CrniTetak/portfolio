// Bela lista licenci za fotografije (PLAN B6.1). Jedno mesto: koristi je skripte/slike-commons.mjs i test src/podaci/fotografije.test.ts.
// Dozvoljeno: CC0, Public domain (PD-self, PD-old…), CC BY 2.0–4.0, CC BY-SA 2.0–4.0.
// Sve ostalo (GFDL-samo, „fair use“, nepoznato, NC, ND) se odbija.
export const BELA_LISTA = [/^CC0/i, /^Public domain/i, /^PD(\b|-)/i, /^CC BY(-SA)? [2-4]\.0/i]
/** Izričito zabranjeno, čak i kad liči na belu listu (npr. „CC BY-NC 4.0“). */
export const ZABRANJENO = [/\bNC\b/i, /\bND\b/i, /GFDL/i, /fair use/i]

export function licencaDozvoljena(kratko) {
  if (!kratko) return false
  if (ZABRANJENO.some((r) => r.test(kratko))) return false
  return BELA_LISTA.some((r) => r.test(kratko))
}

/** CC BY i CC BY-SA traže navođenje autora (ispod slike u O1 i u spisku „Izvori slika“). */
export const trebaNavodjenje = (kratko) => /^CC BY/i.test(kratko ?? '')
