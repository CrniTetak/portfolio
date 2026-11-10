// Brava fotografija (B6): slika bez izvora, linka i licence ne može da uđe u build.
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { FOTOGRAFIJE, fotografija } from './fotografije'

const SLIKE = join(process.cwd(), 'public', 'slike')
const DOC = join(process.cwd(), 'docs', 'FOTOGRAFIJE.md')
const doc = existsSync(DOC) ? readFileSync(DOC, 'utf8') : ''
const NEPOZNATO = /^(\s*|nepoznato|nepoznata|unknown|n\/a|\?+)$/i

describe('fotografije.ts', () => {
  it('(a) svaki fajl u public/slike/ ima stavku u spisku', () => {
    const idovi = new Set(FOTOGRAFIJE.map((f) => f.id))
    for (const fajl of existsSync(SLIKE) ? readdirSync(SLIKE) : []) {
      const m = /^(.+)-(\d+)\.webp$/.exec(fajl)
      expect({ fajl, uSpisku: !!m && idovi.has(m[1]) }).toEqual({ fajl, uSpisku: true })
    }
  })
  it('(b) svaka stavka ima izvor, link i licencu (nijedno nije prazno ni "nepoznato")', () => {
    for (const f of FOTOGRAFIJE) {
      expect({ id: f.id, izvor: NEPOZNATO.test(f.izvor) }).toEqual({ id: f.id, izvor: false })
      expect({ id: f.id, licenca: NEPOZNATO.test(f.licenca) }).toEqual({ id: f.id, licenca: false })
      expect({ id: f.id, link: /^https:\/\/\S+$/.test(f.link) }).toEqual({ id: f.id, link: true })
      expect({ id: f.id, autor: NEPOZNATO.test(f.autor) }).toEqual({ id: f.id, autor: false })
      expect({ id: f.id, datum: /^\d{4}-\d{2}-\d{2}$/.test(f.datumPreuzimanja) }).toEqual({ id: f.id, datum: true })
    }
  })
  it('(c) svaka stavka ima red u docs/FOTOGRAFIJE.md', () => {
    expect(doc.length).toBeGreaterThan(0)
    for (const f of FOTOGRAFIJE) expect({ id: f.id, uDokumentu: doc.includes('`' + f.id + '`') }).toEqual({ id: f.id, uDokumentu: true })
  })
  it('(d) svaka sadržajna slika ima alt, ukrasna ima prazan alt', () => {
    for (const f of FOTOGRAFIJE) {
      if (!f.ukrasna) expect({ id: f.id, alt: f.alt.trim().length > 5 }).toEqual({ id: f.id, alt: true })
    }
  })
  it('svaka stavka ima sve WebP fajlove iz spiska širina i nema duplih id-eva', () => {
    expect(new Set(FOTOGRAFIJE.map((f) => f.id)).size).toBe(FOTOGRAFIJE.length)
    for (const f of FOTOGRAFIJE) for (const w of f.sirine) expect({ fajl: `${f.id}-${w}.webp`, postoji: existsSync(join(SLIKE, `${f.id}-${w}.webp`)) }).toEqual({ fajl: `${f.id}-${w}.webp`, postoji: true })
  })
  it('fotografija() baca grešku za nepoznat id', () => {
    expect(() => fotografija('ne-postoji')).toThrow()
  })
})
