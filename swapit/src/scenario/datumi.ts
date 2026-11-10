// DEMO DATUMI (UX 3.3, B5.5). Nema pravog sata: sve se računa od demo datuma priče. Datum je običan zapis dan/mesec/godina.

export type Datum = { d: number; m: number; y: number }
const dat = (d: number, m: number, y = 2026): Datum => ({ d, m, y })

export const DATUM_POCETKA = dat(19, 10)
/** J2 posle kraja priče (B5.5). */
export const DATUM_ISTICE_AUKCIJA_J2 = dat(12, 11)
/** F8 sledeća naplata (B5.5). */
export const DATUM_SLEDECA_NAPLATA = dat(18, 11)

/** Akcija „staro za novo“ (A1, A3, A5): traje od 2. 11. do 30. 11. 2026. */
export const DATUM_AKCIJA_OD = dat(2, 11)
export const DATUM_AKCIJA_DO = dat(30, 11)
/** A2: ponuđeni termini donošenja starog bicikla u radnju. */
export const TERMINI_AKCIJE: Datum[] = [dat(3, 11), dat(4, 11), dat(5, 11)]

/** Datum početka i kraja svakog koraka (korak 7 traje od 22. do 24. 10.). */
const DATUMI_KORAKA: { od: Datum; do: Datum }[] = [
  { od: dat(19, 10), do: dat(19, 10) },
  { od: dat(19, 10), do: dat(19, 10) },
  { od: dat(20, 10), do: dat(20, 10) },
  { od: dat(20, 10), do: dat(20, 10) },
  { od: dat(21, 10), do: dat(21, 10) },
  { od: dat(22, 10), do: dat(22, 10) },
  { od: dat(22, 10), do: dat(24, 10) },
  { od: dat(24, 10), do: dat(24, 10) },
  { od: dat(2, 11), do: dat(2, 11) },
]

/** Demo datum za korak: početak koraka dok nije završen, kraj koraka kad je završen. */
export function demoDatum(korak: number, zavrsno: boolean): Datum {
  const k = DATUMI_KORAKA[korak - 1]
  return zavrsno ? k.do : k.od
}

const DANI = ['nedelja', 'ponedeljak', 'utorak', 'sreda', 'četvrtak', 'petak', 'subota']
/** Dan u nedelji za datum (čista računica sa zadatim argumentima; ne koristi sat računara). */
export const danUNedelji = (x: Datum): string => DANI[new Date(Date.UTC(x.y, x.m - 1, x.d)).getUTCDay()]

/** Ranije razmene (istorija poena): datum pre početka demoa, da ne izgleda kao da su poeni stigli istog dana. */
export const DATUM_RANIJE_RAZMENE = dat(1, 10)

/** Dodaje dane na demo datum (čista računica bez sata računara). Koristi se za rok aukcije u slobodnom toku. */
export function dodajDane(x: Datum, dana: number): Datum {
  const d = new Date(Date.UTC(x.y, x.m - 1, x.d + dana))
  return { d: d.getUTCDate(), m: d.getUTCMonth() + 1, y: d.getUTCFullYear() }
}

/** Rokovi šest aktivnih javnih aukcija (J1, J2): prva je „MTB bicikl STORM“ (B5.5), ostale ističu posle kraja priče. */
export const ROKOVI_AUKCIJA: Datum[] = [DATUM_ISTICE_AUKCIJA_J2, dat(9, 11), dat(10, 11), dat(14, 11), dat(15, 11), dat(16, 11)]

/** Istorija računa pretplate (F8, demo): prethodne naplate, mesec za mesecom. */
export const ISTORIJA_RACUNA: Datum[] = [dat(18, 10), dat(18, 9), dat(18, 8)]
