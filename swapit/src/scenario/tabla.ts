// TABLA FIRME I MODERACIJE (UX 7.7): ulazne vrednosti koje se ne mogu izvesti iz oglasa. Sve izmišljeno.
// Zbirovi koji se mogu izvesti (npr. popusti = prijave × popust po biciklu) računaju se u svet.ts.

/** Firma čiji je poslovni nalog u priči (Prodavnica): id iz firme.ts / strane.ts. */
export const ZUPCANIK_ID = 'zupcanik' as const

/** Zupčanik (F3/F6): pregledi, omiljeno, ponude, obavljene razmene, reklama. */
export const ZUPCANIK = {
  pregledi30Dana: 1204,
  sacuvanoUOmiljeno: 63,
  ponude: 17,
  obavljeneRazmene: 6,
  reklamaPrikazi: 9650,
  reklamaKlikovi: 214,
} as const

/** Akcija „staro za novo“ (A4, od koraka 9): prijave 12 = primljeno 5 + čeka procenu 4 + odbijeno 3. */
export const AKCIJA = {
  primljeno: 5,
  cekaProcenu: 4,
  odbijeno: 3,
  pregledi: 486,
} as const

/** Moderacija (V1): obrađeno ove nedelje = uklonjeno + ostavljeno; „šljivovica“ se uklanja u koraku 5. */
export const MODERACIJA = {
  uklonjenoPocetak: 9,
  ostavljeno: 32,
} as const

/** Javne aukcije (J1): „MTB bicikl STORM“ ima 7 ponuda. */
export const PONUDE_NA_MTB = 7
