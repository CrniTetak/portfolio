// SLIKE programa — evidencija (PLAN B7.3). Podrazumevano programi koriste gradijente (bez licence i bez rizika); prave slike su retke (probna slika u talasu 1).
// Kasnije (skripte/slike.mjs): kadrovi iz otvorenih filmova preko Commons-a, SAMO uz licencu sa bele liste (CC0, javno vlasništvo, CC BY, CC BY-SA).
// Brava (slike.test.ts): slika u public/slike/ bez stavke ovde, bez licence sa bele liste, bez autora/izvora/datuma ili bez `alt` → test pada.

export type SlikaStavka = {
  id: string
  /** Fajl u public/slike/. */
  fajl: string
  alt: string
  autor: string
  licenca: string
  /** Adresa stranice izvora kao TEKST. */
  izvor: string
  datumProvere: string
  /** Ručni pregled sadržaja (lica, logoi, natpisi); piše čovek, skripta ga čuva. */
  pregled?: string
  /** Ime i sha1 preuzetog izvora (skripta ga upisuje); izmenjen izvor poništava „pregled“. */
  izvorFajl?: string
  izvorSha1?: string
  /** Emisije (id) na čijem ekranu se slika koristi (T9; kasnije T2, T4, T11). */
  emisije: readonly string[]
}

import evidencija from './slike-evidencija.json'

/** Evidencija piše skripta skripte/slike.mjs (licenca, autor, izvor, datum); ručno se ne menja. */
export const SLIKE: readonly SlikaStavka[] = evidencija as SlikaStavka[]

/** Gradijent programa: determinisan iz id-a (isti id → isti gradijent); 6 toplih tonova iz palete (klase .gradijent-0 … .gradijent-5). */
export function gradijentZa(id: string): number {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0
  return h % 6
}
