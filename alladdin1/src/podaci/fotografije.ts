// SPISAK SVIH FOTOGRAFIJA (B6): izvor, link, autor i licenca za svaku. Slika koje nema ovde ne sme da bude u public/slike/
// (test: podaci/fotografije.test.ts). Svaka slika mora imati i red u docs/FOTOGRAFIJE.md.
// Fajlovi: public/slike/<id>-800.webp i <id>-1600.webp (pravi ih `npm run slike` iz izvor-slika/<id>.png|jpg).

export type Fotografija = {
  id: string
  sirine: number[] // koje širine postoje u public/slike/ (original odredjuje najvecu)
  alt: string // engleski opis za čitač ekrana
  ukrasna: boolean // ukrasna slika ima prazan alt
  izvor: string
  link: string
  autor: string
  licenca: string
  datumPreuzimanja: string // GGGG-MM-DD
}

export const FOTOGRAFIJE: Fotografija[] = [
  {
    id: 'mermerne-stepenice',
    sirine: [800, 1600],
    alt: 'A grand hall with a curved marble staircase and a crystal chandelier',
    ukrasna: false,
    izvor: 'StockCake',
    link: 'https://stockcake.com/',
    autor: 'nepoznat (StockCake, verovatno generisano veštačkom inteligencijom)',
    licenca: 'CC0',
    datumPreuzimanja: '2026-10-17',
  },
  {
    id: 'hotel-apartman',
    sirine: [800],
    alt: 'A hotel suite at sunset with a large window, soft curtains and a bed with cream linen',
    ukrasna: false,
    izvor: 'StockCake',
    link: 'https://stockcake.com/',
    autor: 'nepoznat (StockCake, verovatno generisano vestackom inteligencijom)',
    licenca: 'CC0',
    datumPreuzimanja: '2026-10-17',
  },
]

export function fotografija(id: string): Fotografija {
  const f = FOTOGRAFIJE.find((x) => x.id === id)
  if (!f) throw new Error(`Fotografija "${id}" nije u spisku podaci/fotografije.ts`)
  return f
}
