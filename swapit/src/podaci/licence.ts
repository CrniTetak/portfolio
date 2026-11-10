// Pun naziv licence za navođenje autora (PK4): „CC BY-SA 4.0“ → „Creative Commons Imenovanje–Deliti pod istim uslovima 4.0“.
// Skraćenica ostaje uz naziv, pa se licenca može naći; nepoznata licenca se prikazuje kakva jeste (bela lista je u skripte/licence.mjs).

/** Nastavak države u nazivu licence („CC BY-SA 3.0 de“): ime države; nepoznat kod se prikazuje velikim slovima. */
const DRZAVE_LICENCE: Record<string, string> = { de: 'Nemačka', at: 'Austrija', nl: 'Holandija', fr: 'Francuska', it: 'Italija', pl: 'Poljska', es: 'Španija', ch: 'Švajcarska' }

export function punNazivLicence(licenca: string): string {
  if (/^(CC0|PD-?0)/i.test(licenca)) return `${licenca} (Creative Commons Zero, javno dobro)`
  if (/^(public domain|PD)/i.test(licenca)) return `${licenca} (javno dobro)`
  const m = /^CC BY(-SA)? (\d\.\d)(?: ([a-z]{2}))?$/i.exec(licenca)
  if (m) return `${licenca} (Creative Commons Imenovanje${m[1] ? '–Deliti pod istim uslovima' : ''} ${m[2]}${m[3] ? `, ${DRZAVE_LICENCE[m[3].toLowerCase()] ?? m[3].toUpperCase()}` : ''})`
  return licenca
}

/** Naziv dela bez prefiksa „File:“ i bez nastavka datoteke, kako stoji na Commons-u. */
export const nazivDela = (naslovNaCommons: string): string => naslovNaCommons.replace(/^File:/, '').replace(/\.(jpe?g|png|webp|tiff?)$/i, '')

/** Adresa teksta licence (B-1): prikazuje se kao TEKST, ne kao link (demo nema spoljnih linkova). Javno dobro nema uslova, pa nema adrese. */
export function adresaLicence(licenca: string): string | null {
  if (/^CC0/i.test(licenca)) return 'https://creativecommons.org/publicdomain/zero/1.0/'
  const m = /^CC BY(-SA)? (\d\.\d)(?: ([a-z]{2}))?$/i.exec(licenca)
  if (!m) return null
  return `https://creativecommons.org/licenses/${m[1] ? 'by-sa' : 'by'}/${m[2]}/${m[3] ? `${m[3].toLowerCase()}/` : ''}`
}

/** Rečenica o preradi (B-1): umanjene i isečene slike ostaju pod licencom originala. */
export const PRERADA_LICENCA = 'Slike su umanjene i isečene; prerađene slike ostaju pod istom licencom kao original.'
