// B7.3 — vidljivost: pogled po ulozi odgovara tabeli "ko šta vidi"; brava uvoza; brava "nema rukom pisanih iznosa".
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import { describe, expect, it } from 'vitest'
import { DOZVOLJENA_POLJA, ZABRANJENA_POLJA, pogled, zabranjeniIznosi, zabranjeniNizovi } from './vidljivost'
import { ULOGE } from '../prica/tipovi'

const SRC = join(__dirname, '..')

function sviFajlovi(dir: string, ext: string[]): string[] {
  const izlaz: string[] = []
  for (const ime of readdirSync(dir)) {
    const p = join(dir, ime)
    if (statSync(p).isDirectory()) izlaz.push(...sviFajlovi(p, ext))
    else if (ext.some((e) => ime.endsWith(e))) izlaz.push(p)
  }
  return izlaz
}

/** Svi ključevi i sve primitivne vrednosti jednog objekta (rekurzivno). */
function prosetaj(x: unknown, kljucevi: string[] = [], vrednosti: (string | number)[] = []) {
  if (Array.isArray(x)) x.forEach((e) => prosetaj(e, kljucevi, vrednosti))
  else if (x && typeof x === 'object') {
    for (const [k, v] of Object.entries(x)) {
      kljucevi.push(k)
      prosetaj(v, kljucevi, vrednosti)
    }
  } else if (typeof x === 'string' || typeof x === 'number') vrednosti.push(x)
  return { kljucevi, vrednosti }
}

describe('pogled po ulozi = tabela "ko šta vidi"', () => {
  for (const u of ULOGE) {
    it(`${u}: selektor vraća tačno dozvoljena polja`, () => {
      expect(Object.keys(pogled(u)).sort()).toEqual([...DOZVOLJENA_POLJA[u]].sort())
    })
    it(`${u}: nijedno zabranjeno polje ne postoji ni u dubini`, () => {
      const { kljucevi } = prosetaj(pogled(u))
      for (const z of ZABRANJENA_POLJA[u]) expect(kljucevi, `${u} ne sme da ima polje ${z}`).not.toContain(z)
    })
    it(`${u}: zabranjeni iznosi i imena ne postoje u podacima`, () => {
      const { vrednosti } = prosetaj(pogled(u))
      for (const iznos of zabranjeniIznosi(u)) expect(vrednosti, `${u} ne sme da vidi ${iznos}`).not.toContain(iznos)
      const tekstovi = vrednosti.filter((v): v is string => typeof v === 'string').join(' | ').toLowerCase()
      for (const niz of zabranjeniNizovi(u)) expect(tekstovi, `${u} ne sme da vidi "${niz}"`).not.toContain(niz.toLowerCase())
    })
  }

  it('igrač: vidi svoj udeo (5%, ukupno i po ratama), ali ne uslove dogovora (rate klubova, bonuse, sell-on, ponude, proviziju)', () => {
    const p = pogled('player')
    expect(p.udeo.ukupno).toBe(220_000)
    expect(p.udeo.poRati.map((r) => r.iznos)).toEqual([80_000, 70_000, 70_000])
    expect(JSON.stringify(p)).not.toMatch(/\b(4400000|5000000|30000|1600000|1400000)\b/)
  })
  it('agent: vidi svoju proviziju i ugovor klijenta, ali ne uslove dogovora', () => {
    const p = pogled('agent')
    expect(p.provizija.iznos).toBe(30_000)
    expect(p.ugovor.godisnjaBruto).toBe(150_000)
    expect(JSON.stringify(p)).not.toMatch(/\b(4400000|5000000|1600000|1400000|220000)\b/)
  })
  it('finansijer: vidi potraživanje, ali ne igrača, ličnih uslova, agenta ni bonuse', () => {
    const p = pogled('financier')
    expect(p.potrazivanje.nominal).toBe(2_660_000)
    expect(JSON.stringify(p)).not.toMatch(/Vranešević|Luka|Savić|\b(150000|200000|250000)\b/)
  })
  it('prodavac: nema provizije agenta, ličnih uslova ni medicinskih detalja', () => {
    const j = JSON.stringify(pogled('selling'))
    expect(j).not.toMatch(/\b30000\b|Savić|klinika|Riverside/)
  })
  it('kupac: vidi lične uslove i proviziju, ali ne finansiranje', () => {
    const p = pogled('buying')
    expect(p.licniUslovi.godisnjaBruto).toBe(150_000)
    expect(p.agent.provizija).toBe(30_000)
    expect(JSON.stringify(p)).not.toMatch(/\b(2660000|2535000|125000)\b/)
  })
})

describe('brava uvoza: ekrani ne smeju da uvoze scenario/uslovi ni scenario/racun', () => {
  const ekrani = sviFajlovi(join(SRC, 'ekrani'), ['.tsx', '.ts'])
  const dozvoljeniUvozi = [join(SRC, 'komponente'), join(SRC, 'okvir')]
  it('ekrani/ nikad ne uvoze uslovi ni racun (podaci idu kroz pravila/vidljivost)', () => {
    expect(ekrani.length).toBeGreaterThan(10)
    for (const f of ekrani) {
      const kod = readFileSync(f, 'utf8')
      expect(kod, relative(SRC, f)).not.toMatch(/from\s+['"][^'"]*scenario\/(uslovi|racun)['"]/)
    }
  })
  it('ni komponente ni okvir ne uvoze uslovi ni racun', () => {
    for (const d of dozvoljeniUvozi) {
      for (const f of sviFajlovi(d, ['.tsx', '.ts'])) {
        expect(readFileSync(f, 'utf8'), relative(SRC, f)).not.toMatch(/from\s+['"][^'"]*scenario\/(uslovi|racun)['"]/)
      }
    }
  })
})

describe('brava uvoza je proširena na pravila/ i prica/ (uz dozvoljene izuzetke)', () => {
  // Samo ovi fajlovi smeju da čitaju ulazne i izvedene vrednosti scenarija; svi ostali idu kroz njih.
  const DOZVOLJENI = new Set(['pravila/vidljivost.ts', 'pravila/izvedeno.ts', 'pravila/matrica.ts', 'prica/koraci.ts'])
  it('ostali fajlovi u pravila/ i prica/ ne uvoze uslovi ni racun', () => {
    for (const d of ['pravila', 'prica', 'tekstovi', 'okvir', 'komponente']) {
      for (const f of sviFajlovi(join(SRC, d), ['.ts', '.tsx'])) {
        const rel = relative(SRC, f).split(sep).join('/')
        if (rel.endsWith('.test.ts') || DOZVOLJENI.has(rel)) continue
        expect(readFileSync(f, 'utf8'), rel).not.toMatch(/from\s+['"][^'"]*scenario\/(uslovi|racun)['"]/)
      }
    }
  })
  it('izuzeci su stvarno u upotrebi (inače ih treba ukloniti sa spiska)', () => {
    for (const rel of DOZVOLJENI) {
      expect(readFileSync(join(SRC, rel), 'utf8'), rel).toMatch(/scenario\/(uslovi|racun)/)
    }
  })
})

describe('brava: nijedan iznos nije napisan rukom u kodu ekrana', () => {
  /** Bez komentara i bez praznih linija. */
  function bezKomentara(kod: string): string {
    return kod.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\s\/\/.*$/gm, '')
  }
  const proveravani = sviFajlovi(SRC, ['.ts', '.tsx']).filter((f) => {
    const rel = relative(SRC, f).split(sep).join('/')
    return !rel.startsWith('scenario/') && !rel.endsWith('.test.ts') && rel !== 'vite-env.d.ts'
  })
  it('postoji dovoljno fajlova za proveru', () => {
    expect(proveravani.length).toBeGreaterThan(40)
  })
  it('nema obrasca iznosa sa zarezom (npr. 1,600,000) niti "EUR <broj>" u kodu', () => {
    for (const f of proveravani) {
      const kod = bezKomentara(readFileSync(f, 'utf8'))
      expect(kod, `${relative(SRC, f)}: iznos sa zarezom`).not.toMatch(/\b\d{1,3}(,\d{3})+\b/)
      expect(kod, `${relative(SRC, f)}: "EUR <broj>"`).not.toMatch(/EUR\s?\d/)
    }
  })
  it('nema velikih celih brojeva (>= 5 cifara ili sa donjim crtama) osim u scenario/', () => {
    for (const f of proveravani) {
      const kod = bezKomentara(readFileSync(f, 'utf8'))
      expect(kod, `${relative(SRC, f)}: veliki broj`).not.toMatch(/\b\d{1,3}(_\d{3})+\b/)
      expect(kod, `${relative(SRC, f)}: veliki broj`).not.toMatch(/(?<![\w.#-])\d{5,}(?![\w-])/)
    }
  })
})

describe('pogledi su zamrznuti, a zabranjene grupe iznosa pokrivaju udeo, naknade i školovanje', () => {
  it('ekran ne može da izmeni pogled', () => {
    for (const u of ULOGE) {
      expect(Object.isFrozen(pogled(u))).toBe(true)
      expect(() => { (pogled(u) as unknown as Record<string, unknown>).novoPolje = 1 }).toThrow()
    }
    expect(Object.isFrozen(pogled('selling').dogovoreno.rate)).toBe(true)
  })
  it('agent i finansijer ne vide igračev udeo (80,000 / 70,000 / 220,000 / bonus udeli) ni naknade (11,000 / 22,000)', () => {
    for (const u of ['agent', 'financier'] as const) {
      const z = zabranjeniIznosi(u)
      for (const x of [80_000, 70_000, 220_000, 10_000, 12_500, 7_500, 11_000, 22_000]) expect(z, `${u} ${x}`).toContain(x)
    }
  })
  it('igrač, agent i finansijer ne vide procenu školovanja (195,000); igrač ne vidi naknade', () => {
    for (const u of ['player', 'agent', 'financier'] as const) expect(zabranjeniIznosi(u)).toContain(195_000)
    expect(zabranjeniIznosi('player')).toEqual(expect.arrayContaining([11_000, 22_000]))
    // igrač LEGITIMNO vidi svoj udeo, pa ti iznosi nisu zabranjeni njemu
    expect(zabranjeniIznosi('player')).not.toContain(220_000)
  })
})
