// Brave B3 i B7. Dva dela: (1) funkcije brave stvarno hvataju krsenja (probe sa lošim primerima),
// (2) nijedan fajl u src/ ne krši brave. Brave su aktivne od faze 0, pa ih svaki nov ekran odmah čuva.
import { readdirSync, readFileSync, existsSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import { describe, expect, it } from 'vitest'
import { izvuciImena, krsenjaGolihBrojeva, krsenjaBrojevaUzJedinice, krsenjaBrendaUppercase, krsenjaPlatiSada, krsenjaZargona, krsenjaBrenda, krsenjaVelikihSlovaCss, krsenjaBrojki, krsenjaImena, krsenjaIzraza, krsenjaObrazaca, krsenjaUvoza, krsenjaVremena } from './brave'
import { ZABRANJENI_IZRAZI } from './zabrane'

const SRC = join(process.cwd(), 'src')

function fajlovi(dir: string): string[] {
  const izlaz: string[] = []
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name)
    if (e.isDirectory()) izlaz.push(...fajlovi(p))
    else izlaz.push(p)
  }
  return izlaz
}
const rel = (p: string) => relative(SRC, p).split(sep).join('/')
const svi = fajlovi(SRC).map((p) => ({ putanja: rel(p), tekst: readFileSync(p, 'utf8') }))
const izvorni = svi.filter((f) => /\.(tsx?|css)$/.test(f.putanja) && !/\.test\.ts$/.test(f.putanja))
const tsx = izvorni.filter((f) => f.putanja.endsWith('.tsx'))
// tekstovi koji se prikazuju: komponente, ekrani, okvir, tekstovi/*.ts, scenario/*.ts (osim samih pravila zabrana)
const prikazani = izvorni.filter(
  (f) => (f.putanja.endsWith('.tsx') || f.putanja.startsWith('tekstovi/') || f.putanja.startsWith('scenario/') || f.putanja.startsWith('podaci/')) && !f.putanja.endsWith('.css'),
)
const vanScenarija = izvorni.filter((f) => !f.putanja.startsWith('scenario/') && !f.putanja.endsWith('.css') && !f.putanja.startsWith('pravila/'))

describe('brave hvataju krsenja (probe sa lošim primerima)', () => {
  it('B7: obrasci i pravi unos', () => {
    expect(krsenjaObrazaca('<form onSubmit={x}>')).toContain('<form')
    expect(krsenjaObrazaca('<input type="password" />')).toContain('type="password"')
    expect(krsenjaObrazaca('<input type="text" />')).toContain('type="text"/email/tel/number/search/url/date')
    expect(krsenjaObrazaca('<input />')).toContain('<input bez checkbox/radio')
    expect(krsenjaObrazaca('<textarea />')).toContain('<textarea')
    expect(krsenjaObrazaca('<input autoComplete="cc-number" />').length).toBeGreaterThan(0)
    expect(krsenjaObrazaca('<a href="https://primer.example">x</a>')).toContain('spoljni link (href koji ne počinje sa #)')
    expect(krsenjaObrazaca('<button type="submit">')).toContain('type="submit"')
    expect(krsenjaObrazaca('fetch("/x")').length).toBeGreaterThan(0)
  })
  it('B7: dozvoljene kontrole prolaze', () => {
    expect(krsenjaObrazaca('<input type="checkbox" />')).toEqual([])
    expect(krsenjaObrazaca('<input type="radio" />')).toEqual([])
    expect(krsenjaObrazaca('<a href="#/legal/terms">Terms</a>')).toEqual([])
    expect(krsenjaObrazaca('<button type="button">Show me</button>')).toEqual([])
  })
  it('B7: zabranjeni izrazi, cele reči, bez obzira na veličinu slova', () => {
    expect(krsenjaIzraza('<p>Secure payment</p>')).toContain('Secure payment')
    expect(krsenjaIzraza('<p>pay now</p>')).toContain('Pay now')
    expect(krsenjaIzraza('<p>Visa</p>')).toContain('Visa')
    expect(krsenjaIzraza('<p>Advisor support</p>')).toEqual([]) // "Visa" nije cela reč u "Advisor"
    expect(krsenjaIzraza('// Pay now u komentaru se ne računa')).toEqual([])
  })
  it('B3: ručno pisane brojke i datumi', () => {
    expect(krsenjaBrojki('<p>EUR 2500</p>')).toContain('EUR iznos')
    expect(krsenjaBrojki('<p>1,500</p>')).toContain('iznos sa zarezom za hiljade')
    expect(krsenjaBrojki('<p>20% deposit</p>')).toContain('procenat')
    expect(krsenjaBrojki('<p>15 Jan 2027</p>')).toContain('datum')
    expect(krsenjaBrojki('<div className="w-[50%]">Step 4</div>')).toEqual([]) // klase se ne računaju
    expect(krsenjaBrojki('// EUR 5 u komentaru')).toEqual([])
  })
  it('B3: sat računara i lokalni formati', () => {
    expect(krsenjaVremena('Date.now()')).toContain('Date.now')
    expect(krsenjaVremena('new Date()')).toContain('new Date() bez argumenta')
    expect(krsenjaVremena('x.toLocaleString("en")')).toContain('toLocale*String')
    expect(krsenjaVremena('new Date(2027, 0, 15)')).toEqual([])
  })
  it('naziv brenda se ne piše velikim slovima (ni kroz CSS na naslovima)', () => {
    expect(krsenjaBrenda('<h1>ALLADDIN1</h1>')).toHaveLength(1)
    expect(krsenjaBrenda('<h1>AllAddIn1</h1>')).toEqual([])
    expect(krsenjaVelikihSlovaCss('h1 { text-transform: uppercase; }')).toEqual(['h1'])
    expect(krsenjaVelikihSlovaCss('.btn { text-transform: uppercase; }')).toEqual([])
  })
  it('brave: goli brojevi, uppercase na brendu, "Pay … now", žargon', () => {
    expect(krsenjaGolihBrojeva('<p>Valid for 7 days, seat block 120 seats, 18+</p>')).toHaveLength(1)
    expect(krsenjaGolihBrojeva('<p>{n} seats, 18+</p>')).toEqual([])
    expect(krsenjaGolihBrojeva("<p>{x && 'Valid for 120 seats'}</p>")).toHaveLength(1)
    expect(krsenjaGolihBrojeva("const a = 'AA1-R-04'")).toEqual([])
    expect(krsenjaBrojevaUzJedinice('<p>Rated 5 stars, 7 days, 6 months, 4 nights</p>')).toHaveLength(4)
    expect(krsenjaBrojevaUzJedinice("<p>{x ? 'for 3 guests' : ''}</p>")).toHaveLength(1)
    expect(krsenjaBrojevaUzJedinice('<p>{n} nights, 18+</p>')).toEqual([])
    expect(krsenjaBrojevaUzJedinice('<p>Rated five stars, seven days, Twelve months</p>')).toHaveLength(3)
    expect(krsenjaBrojevaUzJedinice('<p>Dinner for six, luggage for two</p>')).toEqual([])
    expect(krsenjaBrendaUppercase('<span className="text-sm uppercase">AllAddIn1</span>')).toHaveLength(1)
    expect(krsenjaBrendaUppercase('<span className="uppercase">Terms</span>')).toEqual([])
    expect(krsenjaPlatiSada('<button>Pay {eur(x)} now</button>')).toHaveLength(1)
    expect(krsenjaPlatiSada('<button>Pay {eur(x)}</button>')).toEqual([])
    expect(krsenjaZargona('<p>Coming in the next build</p>')).toEqual(['next build'])
  })
  it('B3: brava uvoza i imena iz strane.ts', () => {
    expect(krsenjaUvoza("import { CENA } from '../scenario/uslovi'")).toEqual(['direktan uvoz scenario/uslovi'])
    expect(krsenjaUvoza("import { vrednost } from '../scenario/racun'")).toEqual([])
    const imena = izvuciImena("export const KLUB = 'Silverline Poker Club'\nexport const A = 'abc'")
    expect(imena).toEqual(['Silverline Poker Club'])
    expect(krsenjaImena('<p>Silverline Poker Club</p>', imena)).toEqual(imena)
    expect(krsenjaImena('<p>nešto drugo</p>', imena)).toEqual([])
  })
})

describe('nijedan fajl u src/ ne krši brave', () => {
  it('ima fajlova za proveru (brava nije prazna)', () => {
    expect(tsx.length).toBeGreaterThan(0)
  })
  it('B7: nema obrazaca, polja za kucanje, spoljnih linkova ni mrežnih poziva u .tsx', () => {
    for (const f of tsx) expect({ fajl: f.putanja, krsenja: krsenjaObrazaca(f.tekst) }).toEqual({ fajl: f.putanja, krsenja: [] })
  })
  it('B7: nema zabranjenih izraza u prikazanim tekstovima', () => {
    expect(ZABRANJENI_IZRAZI.length).toBeGreaterThan(0)
    for (const f of prikazani) expect({ fajl: f.putanja, izrazi: krsenjaIzraza(f.tekst) }).toEqual({ fajl: f.putanja, izrazi: [] })
  })
  it('B3: nema ručno pisanih iznosa, procenata i datuma van scenario/', () => {
    for (const f of vanScenarija) expect({ fajl: f.putanja, brojke: krsenjaBrojki(f.tekst) }).toEqual({ fajl: f.putanja, brojke: [] })
  })
  it('B3: Date.now, new Date() i toLocale*String samo u scenario/format.ts', () => {
    for (const f of izvorni.filter((x) => x.putanja !== 'scenario/format.ts' && !x.putanja.startsWith('pravila/') && !x.putanja.endsWith('.css')))
      expect({ fajl: f.putanja, vreme: krsenjaVremena(f.tekst) }).toEqual({ fajl: f.putanja, vreme: [] })
  })
  it('naziv brenda nigde nije napisan velikim slovima; naslovi i logo nemaju uppercase u CSS-u', () => {
    for (const f of izvorni.filter((x) => !x.putanja.endsWith('.css') && !x.putanja.startsWith('pravila/'))) expect({ fajl: f.putanja, brend: krsenjaBrenda(f.tekst) }).toEqual({ fajl: f.putanja, brend: [] })
    for (const f of izvorni.filter((x) => x.putanja.endsWith('.css'))) expect({ fajl: f.putanja, css: krsenjaVelikihSlovaCss(f.tekst) }).toEqual({ fajl: f.putanja, css: [] })
  })
  it('nema golih brojeva od 2+ cifara u tekstu ekrana, "Pay … now", uppercase na brendu ni žargona', () => {
    for (const f of tsx.filter((x) => !x.putanja.startsWith('pravila/'))) {
      expect({ fajl: f.putanja, brojevi: krsenjaGolihBrojeva(f.tekst) }).toEqual({ fajl: f.putanja, brojevi: [] })
      expect({ fajl: f.putanja, pay: krsenjaPlatiSada(f.tekst) }).toEqual({ fajl: f.putanja, pay: [] })
      expect({ fajl: f.putanja, upper: krsenjaBrendaUppercase(f.tekst) }).toEqual({ fajl: f.putanja, upper: [] })
    }
    for (const f of prikazani.filter((x) => !x.putanja.startsWith('pravila/') && !x.putanja.startsWith('podaci/')))
      expect({ fajl: f.putanja, zargon: krsenjaZargona(f.tekst) }).toEqual({ fajl: f.putanja, zargon: [] })
  })
  it('nema jednocifrenih brojeva uz jedinice (nights, guests, days, stars, months...) u tekstu', () => {
    for (const f of prikazani.filter((x) => !x.putanja.startsWith('scenario/') && !x.putanja.startsWith('pravila/')))
      expect({ fajl: f.putanja, jedinice: krsenjaBrojevaUzJedinice(f.tekst) }).toEqual({ fajl: f.putanja, jedinice: [] })
  })
  it('B3: ekrani, okvir i komponente ne uvoze scenario/uslovi direktno', () => {
    for (const f of izvorni.filter((x) => /^(ekrani|okvir|komponente|demo|prica|tekstovi)\//.test(x.putanja)))
      expect({ fajl: f.putanja, uvoz: krsenjaUvoza(f.tekst) }).toEqual({ fajl: f.putanja, uvoz: [] })
  })
  it('B3: imena iz scenario/strane.ts nisu napisana rukom van scenario/ (kad strane.ts postoji)', () => {
    const p = join(SRC, 'scenario', 'strane.ts')
    if (!existsSync(p)) return // strane.ts se piše u talasu 1
    const imena = izvuciImena(readFileSync(p, 'utf8'))
    for (const f of vanScenarija) expect({ fajl: f.putanja, imena: krsenjaImena(f.tekst, imena) }).toEqual({ fajl: f.putanja, imena: [] })
  })
})
