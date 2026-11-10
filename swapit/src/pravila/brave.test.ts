// BRAVE nad izvornim kodom (PLAN B3, B7): test čita sve .tsx i src/tekstovi/*.ts i pada na zabranjene obrasce, izraze i ručno pisane brojke.
// Prvo se proverava da brave ZAISTA hvataju (primeri), pa se pokreću nad src/.
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import {
  brojPoljaPretrage,
  imaAutoComplete,
  izvuciImena,
  krsenjaBrenda,
  krsenjaBrojevaUzJedinice,
  krsenjaBrojki,
  krsenjaGolihBrojeva,
  krsenjaImena,
  krsenjaIzraza,
  krsenjaObrazaca,
  krsenjaUvoza,
  krsenjaVremena,
  krsenjaZargona,
} from './brave'
import { KORISNICI, REGION_KORISNICI } from '../scenario/korisnici'
import { FAJL_SA_POLJEM_PRETRAGE } from './zabrane'

const SRC = fileURLToPath(new URL('..', import.meta.url))
const LIKOVI_PRICE = ['Ana', 'Marko', 'Jovana']

function fajlovi(dir: string): string[] {
  return readdirSync(dir).flatMap((ime) => {
    const p = join(dir, ime)
    return statSync(p).isDirectory() ? fajlovi(p) : [p]
  })
}
const rel = (p: string) => relative(SRC, p).replace(/\\/g, '/')
const SVI = fajlovi(SRC).filter((p) => /\.(ts|tsx)$/.test(p) && !/\.test\.ts$/.test(p))
const TSX = SVI.filter((p) => p.endsWith('.tsx'))
const TEKSTOVI = SVI.filter((p) => rel(p).startsWith('tekstovi/'))
const ZA_TEKST = [...TSX, ...TEKSTOVI]
// pravila/ sadrži same brave i spiskove zabranjenog (u njima se zabranjene reči javljaju kao podatak), pa se ne proverava kao aplikacija
const APLIKACIJA = SVI.filter((p) => !rel(p).startsWith('pravila/'))
const citaj = (p: string) => readFileSync(p, 'utf8')

describe('brave hvataju (primeri)', () => {
  it('obrasci', () => {
    expect(krsenjaObrazaca('<form onSubmit={x}>')).toContain('<form')
    expect(krsenjaObrazaca('<input type="password" />')).toContain('type="password"')
    expect(krsenjaObrazaca('<input type="email" name="x" />')).toContain('type="text"/email/tel/number/url/date')
    expect(krsenjaObrazaca('<input />')).toContain('<input bez checkbox/radio/range/search')
    expect(krsenjaObrazaca('<a href="https://x.rs">x</a>')).toContain('spoljni link (href koji ne počinje sa #)')
    expect(krsenjaObrazaca('fetch("/x")')).toContain('mrežni poziv (fetch/XMLHttpRequest/WebSocket/sendBeacon)')
    expect(krsenjaObrazaca('<input type="checkbox" /><input type="search" />')).toEqual([])
    expect(brojPoljaPretrage('<input type="search" /><input type="search" />')).toBe(2)
    expect(imaAutoComplete('<input autoComplete="off" />')).toBe(true)
  })
  it('izrazi', () => {
    expect(krsenjaIzraza('Sigurno plaćanje kroz Visa')).toEqual(expect.arrayContaining(['sigurno plaćanje', 'Visa']))
    expect(krsenjaIzraza('To je organski proizvod')).toContain('organski')
    expect(krsenjaIzraza('Visage')).toEqual([])
    expect(krsenjaIzraza('Iz sopstvene proizvodnje')).toEqual([])
    // V2: troje ljudi je „sve troje“
    expect(krsenjaIzraza('Svi troje prihvataju')).toContain('svi troje')
    expect(krsenjaIzraza('Sva trojica su stigla')).toContain('sva trojica')
    expect(krsenjaIzraza('Sve troje prihvataju')).toEqual([])
  })
  it('brojke', () => {
    expect(krsenjaBrojki('<p>Cena 1.149 din</p>').length).toBeGreaterThan(0)
    expect(krsenjaBrojki('<p>Imaš 20 poena</p>')).toContain('iznos u dinarima ili poenima')
    expect(krsenjaBrojki('<p>Do 19. 10. 2026. stiže</p>')).toContain('datum')
    expect(krsenjaGolihBrojeva('<p>Ima 225 oglasa</p>').length).toBe(1)
    expect(krsenjaGolihBrojeva('<p>Ima {n} oglasa</p>')).toEqual([])
    expect(krsenjaGolihBrojeva('const x = "Imaš 20 poena u demou";').length).toBe(1)
    expect(krsenjaBrojevaUzJedinice('<p>Za 3 dana stiže</p>').length).toBe(1)
    expect(krsenjaBrojevaUzJedinice('<p>Korak {k} od {n}</p>')).toEqual([])
    expect(krsenjaGolihBrojeva('<svg viewBox="0 0 1000 700" className="h-[44px] w-12">')).toEqual([])
  })
  it('vreme, uvoz, imena, brend, žargon', () => {
    expect(krsenjaVremena('Date.now()')).toContain('Date.now')
    expect(krsenjaVremena('new Date()')).toContain('new Date() bez argumenta')
    expect(krsenjaVremena('new Date(Date.UTC(2026, 9, 19))')).toEqual([])
    expect(krsenjaVremena('x.toLocaleString()')).toContain('toLocale*String')
    expect(krsenjaUvoza("import { OGLASI_BEOGRAD } from '../../scenario/oglasi'")).toContain('direktan uvoz scenario/oglasi')
    expect(krsenjaUvoza("import { svet } from '../../scenario/svet'")).toEqual([])
    expect(krsenjaImena('<p>Servis Lančanik</p>', ['Servis Lančanik', 'Sara'])).toEqual(['Servis Lančanik'])
    expect(krsenjaImena('<p>Sarajevo</p>', ['Sara'])).toEqual([])
    expect(krsenjaImena("<b>{'ana_zvz84'}</b>", ['ana_zvz84'])).toEqual(['ana_zvz84'])
    expect(krsenjaBrenda('<h1>Swapit</h1>')).toHaveLength(1)
    expect(krsenjaBrenda('<h1>SWAPIT</h1>')).toEqual([])
    expect(krsenjaZargona('TODO ovo')).toContain('TODO')
    expect(krsenjaZargona('Ekran je u izradi')).toContain('u izradi')
    expect(krsenjaZargona('Ekran je u izradi', true)).toEqual([])
  })
})

describe('brave nad izvornim kodom', () => {
  it('ima izvornih fajlova za proveru', () => {
    expect(SVI.length).toBeGreaterThan(20)
    expect(TSX.length).toBeGreaterThan(10)
  })

  it('nema obrazaca ni pravih polja za kucanje; jedino polje je pretraga', () => {
    for (const p of TSX) {
      const t = citaj(p)
      expect(krsenjaObrazaca(t), rel(p)).toEqual([])
      if (rel(p) !== FAJL_SA_POLJEM_PRETRAGE) {
        expect(brojPoljaPretrage(t), `${rel(p)} ima polje za kucanje`).toBe(0)
        expect(imaAutoComplete(t), `${rel(p)} ima autoComplete`).toBe(false)
      }
    }
    const ukupnoPolja = TSX.reduce((z, p) => z + brojPoljaPretrage(citaj(p)), 0)
    expect(ukupnoPolja, 'tačno jedno polje za kucanje u celom kodu').toBeLessThanOrEqual(1)
  })

  it('nema mrežnih poziva, sata računara ni formatiranja van format.ts', () => {
    for (const p of APLIKACIJA) {
      const t = citaj(p)
      expect(krsenjaVremena(t), rel(p)).toEqual([])
      // cuvanje.ts sme sessionStorage (ne localStorage); mrežni poziv, klipbord, localStorage i kolačići nisu dozvoljeni nigde
      expect(krsenjaObrazaca(t).filter((n) => /mrežni|klipbord|localStorage/.test(n)), rel(p)).toEqual([])
    }
  })

  it('nema zabranjenih izraza u tekstu ekrana', () => {
    for (const p of ZA_TEKST) expect(krsenjaIzraza(citaj(p)), rel(p)).toEqual([])
  })

  it('nema ručno pisanih iznosa, datuma ni golih brojeva u tekstu ekrana (sve iz scenario/ kroz format.ts)', () => {
    for (const p of ZA_TEKST) {
      const t = citaj(p)
      expect(krsenjaBrojki(t), rel(p)).toEqual([])
      expect(krsenjaGolihBrojeva(t), rel(p)).toEqual([])
      expect(krsenjaBrojevaUzJedinice(t), rel(p)).toEqual([])
    }
  })

  it('ekrani ne uvoze ulazne fajlove scenarija direktno', () => {
    for (const p of TSX.filter((x) => rel(x).startsWith('ekrani/'))) expect(krsenjaUvoza(citaj(p)), rel(p)).toEqual([])
  })

  it('izmišljena imena iz strane.ts nisu napisana rukom u tekstu ekrana', () => {
    const imena = izvuciImena(citaj(join(SRC, 'scenario/strane.ts'))).filter((i) => !['SWAPIT', 'SWAPIT d.o.o. (demo)'].includes(i))
    expect(imena.length).toBeGreaterThan(8)
    for (const p of ZA_TEKST) expect(krsenjaImena(citaj(p), imena), rel(p)).toEqual([])
  })

  // PK5: korisnička imena (id i ime) dolaze iz korisnici.ts kroz svet(); u ekranima se ne pišu rukom.
  // Izuzetak sa razlogom: imena tri lika priče (Ana, Marko, Jovana) su ujedno i nazivi uglova gledanja (NAZIV_UGLA) i junaci priče u tekstu kartica.
  it('korisnička imena i id-jevi iz korisnici.ts nisu napisani rukom u tekstu ekrana', () => {
    const SVI_KORISNICI = [...KORISNICI, ...REGION_KORISNICI]
    const imena = [...SVI_KORISNICI.map((k) => k.id), ...SVI_KORISNICI.map((k) => k.ime).filter((i) => !LIKOVI_PRICE.includes(i))]
    expect(imena.length).toBeGreaterThan(90)
    for (const p of ZA_TEKST) expect(krsenjaImena(citaj(p), imena), rel(p)).toEqual([])
  })

  // V4: ključ iz linka ili zapisa se proverava JEDNOM funkcijom (scenario/kljuc.ts); `in` nad tabelom pogađa i nasleđena svojstva (constructor, toString…)
  it('nigde `in` nad tabelom: koristi se imaKljuc (Object.hasOwn)', () => {
    const IN = /[\w\])'"]\s+in\s+[A-Za-z_][\w.]*/
    for (const p of APLIKACIJA) {
      const red = citaj(p)
        .split('\n')
        .filter((l) => !/^\s*(\/\/|\*|\/\*)/.test(l) && !/for\s*\((const|let|var)\s/.test(l))
      const pogodci = red.filter((l) => IN.test(l.replace(/'[^']*'|"[^"]*"|`[^`]*`/g, '')))
      expect(pogodci, rel(p)).toEqual([])
    }
  })

  it('naziv brenda se piše „SWAPIT“', () => {
    for (const p of APLIKACIJA) expect(krsenjaBrenda(citaj(p)), rel(p)).toEqual([])
  })

  it('nema programerskog žargona ni fraze „u izradi“ nigde (talas 3: svih 84 ekrana je izgrađeno)', () => {
    for (const p of ZA_TEKST) expect(krsenjaZargona(citaj(p)), rel(p)).toEqual([])
    // komponenta za kostur ne postoji
    expect(SVI.some((p) => rel(p).includes('UIzradi'))).toBe(false)
    expect(SVI.some((p) => /UIzradi|data-u-izradi/.test(citaj(p)))).toBe(false)
  })
})

describe('brava: SWAPIT nije kupovina i prodaja', () => {
  it('u kodu aplikacije nema reči kupac, prodavac (ni njihovih padeža); za strane razmene piše „primalac/davalac stvari“', () => {
    const REC = /\b(kupac|kupca|kupcu|kupcem|kupci|prodavac|prodavca|prodavcu|prodavcem|prodavci)\b/i
    expect(REC.test('Kupac je potrošio')).toBe(true)
    expect(REC.test('Prodavcu je SWAPIT')).toBe(true)
    expect(REC.test('Primalac stvari')).toBe(false)
    const kriva = APLIKACIJA.filter((p) => REC.test(readFileSync(p, 'utf8'))).map(rel)
    expect(kriva).toEqual([])
  })
})
