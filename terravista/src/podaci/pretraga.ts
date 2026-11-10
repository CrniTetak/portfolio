// PRETRAGA (UX T17/T18): samo GOTOVI upiti (demo nema nijedno polje za kucanje). Rezultati se izvode iz kanala i emisija.
import { KANALI, type Kanal } from './kanali'
import { EMISIJE, type Emisija } from './emisije'

export const UPITI: readonly string[] = ['film', 'serije', 'sport', 'deca', 'muzika', 'pink']

export const imaUpit = (u: string): boolean => UPITI.includes(u)

const sadrzi = (tekst: string, upit: string) => tekst.toLowerCase().includes(upit.toLowerCase())

/** Kanali čiji žanr ili naziv sadrži upit. */
export function kanaliZaUpit(upit: string): readonly Kanal[] {
  return KANALI.filter((k) => sadrzi(k.zanr, upit) || sadrzi(k.naziv, upit))
}

/** Emisije kanala koji odgovaraju upitu ili čiji naziv sadrži upit. */
export function emisijeZaUpit(upit: string): readonly Emisija[] {
  const kanali = new Set(kanaliZaUpit(upit).map((k) => k.id))
  return EMISIJE.filter((e) => kanali.has(e.kanalId) || sadrzi(e.naziv, upit)).slice(0, 6)
}
