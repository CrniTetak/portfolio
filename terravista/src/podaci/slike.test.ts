// BRAVA SLIKA (PLAN B7.3): slika bez stavke u slike.ts, bez licence sa bele liste, bez autora/izvora/datuma ili bez `alt` → pada.
// U fazi 0 nema nijedne slike (programi koriste gradijente), pa brava „prolazi na prazno“ — ali je spremna za talas 1.
import { existsSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { licencaDozvoljena } from '../pravila/licence'
import { SLIKE, gradijentZa } from './slike'

const JAVNO = fileURLToPath(new URL('../../public/slike/', import.meta.url))
const fajlovi = existsSync(JAVNO) ? readdirSync(JAVNO).filter((f) => !f.startsWith('.')) : []

describe('slike programa', () => {
  it('nijedan fajl u public/slike/ bez stavke u slike.ts', () => {
    const poznati = new Set(SLIKE.map((s) => s.fajl))
    expect(fajlovi.filter((f) => !poznati.has(f))).toEqual([])
  })
  it('svaka stavka ima fajl, licencu sa bele liste, autora, izvor, datum provere i alt', () => {
    for (const s of SLIKE) {
      expect(fajlovi, s.id).toContain(s.fajl)
      expect(licencaDozvoljena(s.licenca), `${s.id}: licenca „${s.licenca}“`).toBe(true)
      expect(s.autor.length, s.id).toBeGreaterThan(1)
      expect(s.izvor, s.id).toMatch(/^https:\/\//)
      expect(s.datumProvere, s.id).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      expect(s.alt.length, s.id).toBeGreaterThan(3)
    }
  })
  it('bela lista licenci: CC0, javno vlasništvo, CC BY, CC BY-SA; sve ostalo se odbija', () => {
    for (const ok of ['CC0 1.0', 'Public domain', 'PD-self', 'CC BY 4.0', 'CC BY-SA 3.0']) expect(licencaDozvoljena(ok), ok).toBe(true)
    for (const ne of ['CC BY-NC 4.0', 'CC BY-ND 2.0', 'GFDL', 'Fair use', 'All rights reserved', '', 'nepoznata']) expect(licencaDozvoljena(ne), ne).toBe(false)
  })
  it('gradijent programa je determinisan iz id-a i u opsegu 0–5', () => {
    expect(gradijentZa('klasik-tv-1')).toBe(gradijentZa('klasik-tv-1'))
    for (const id of ['a', 'b', 'klasik-tv-1', 'rtl-3']) expect(gradijentZa(id)).toBeLessThan(6)
  })
})
