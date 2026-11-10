// STALNI TEKSTOVI (PLAN B3, B6): tekstovi koji se moraju poklapati TAČNO sa dizajnom. Jedno mesto; test ih poredi sa UX.md.

/** Oznaka demoa na SVAKOM ekranu (UX 2). Uvek ceo, nikad skraćen. */
export const OZNAKA_DEMOA =
  'Demo — primer. Prikazani kanali nisu partneri TerraVista-e i nema dogovora s njima. Cene i podaci su izmišljeni.'

/** Napomena posle svake lažne radnje (UX 0, 5.0). */
export const SIMULIRANA_RADNJA = 'Simulirana radnja — ništa nije poslato ni naplaćeno'

/** Jedina dozvoljena rečenica o nedostupnosti kanala (KANALI.md; PLAN B6.5). */
export const NEDOSTUPNO = 'Prava za ovu zemlju nisu obezbeđena (primer).'

/** Uz svaku cenu na stranici kanala, paketa i narudžbe (UX 7). */
export const CENA_ZAVISI_OD_ZEMLJE = 'Cena zavisi od zemlje (primer).'
export const SA_PDV = 'Sa PDV-om.'

/** Nazad na početnom ekranu televizora (UX 1.3). */
export const POCETNI_EKRAN_PORUKA = 'Ovo je početni ekran. Pritisni Početna ili izaberi nešto.'

/** Fiktivan izbor jezika (UX 3.6). */
export const JEZIK_PORUKA = 'Demo je na srpskom; ostali jezici dolaze u pravom proizvodu.'

/** Uvod za „Kako se upravlja“ (UX 3.5). */
export const KAKO_SE_UPRAVLJA = [
  'Strelice biraju',
  'Enter potvrđuje',
  'Backspace ili Esc vraća',
  'Klik radi uvek; traka dole te vraća u priču',
  'Tab prelazi na traku i telefon, Esc vraća na televizor',
] as const

export const NASLOV_STRANICE = 'TerraVista — DEMO'
