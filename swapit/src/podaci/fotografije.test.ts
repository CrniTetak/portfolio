// Brava za fotografije (PLAN B6.4): fajl u public/slike/ bez stavke u fotografije.ts, stavka bez licence sa bele liste,
// bez autora/izvora/datuma, bez reda u FOTOGRAFIJE.md ili bez alt teksta → test pada → nema builda.
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { FOTOGRAFIJE } from './fotografije'

const KOREN = fileURLToPath(new URL('../..', import.meta.url))
const SLIKE = join(KOREN, 'public', 'slike')
const SIRINE = { kartica: [400, 800], detalj: [800, 1600], prica: [320, 640], reklama: [800] } as const

// bela lista je u skripte/licence.mjs (jedno mesto za skriptu i test); putanja je promenljiva da TypeScript ne traži deklaracije
const putanjaLicence = '../../skripte/licence.mjs'
const { licencaDozvoljena, trebaNavodjenje } = (await import(/* @vite-ignore */ putanjaLicence)) as { licencaDozvoljena: (s: string) => boolean; trebaNavodjenje: (s: string) => boolean }

describe('bela lista licenci', () => {
  it('prihvata CC0, Public domain, CC BY i CC BY-SA 2.0–4.0', () => {
    for (const l of ['CC0', 'CC0 1.0', 'Public domain', 'PD-self', 'CC BY 2.0', 'CC BY 4.0', 'CC BY-SA 3.0', 'CC BY-SA 4.0']) expect(licencaDozvoljena(l), l).toBe(true)
  })
  it('odbija sve ostalo (NC, ND, GFDL, fair use, nepoznato, prazno)', () => {
    for (const l of ['CC BY-NC 4.0', 'CC BY-ND 2.0', 'CC BY-NC-SA 3.0', 'GFDL 1.2', 'Fair use', 'OGL 2', 'All rights reserved', '', undefined as unknown as string]) expect(licencaDozvoljena(l), String(l)).toBe(false)
  })
  it('CC BY i CC BY-SA traže navođenje autora', () => {
    expect(trebaNavodjenje('CC BY-SA 4.0')).toBe(true)
    expect(trebaNavodjenje('CC0')).toBe(false)
  })
})

describe('fotografije', () => {
  it('svaka slika ima licencu sa bele liste, autora, izvor, datum provere i alt', () => {
    expect(FOTOGRAFIJE.length).toBeGreaterThan(0)
    for (const f of FOTOGRAFIJE) {
      expect(licencaDozvoljena(f.licenca), `${f.id}: ${f.licenca}`).toBe(true)
      expect(f.autor.length, f.id).toBeGreaterThan(1)
      expect(f.stranica, f.id).toMatch(/^https:\/\/commons\.wikimedia\.org\/wiki\/File:/)
      expect(f.naslovNaCommons, f.id).toMatch(/^File:/)
      expect(f.datumProvere, f.id).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      expect(f.alt.trim().length, f.id).toBeGreaterThan(3)
      expect(f.izmena.length, f.id).toBeGreaterThan(3)
      expect(f.namene.length, f.id).toBeGreaterThan(0)
      expect(f.ekrani.length, f.id).toBeGreaterThan(0)
    }
  })
  it('id-jevi su jedinstveni', () => {
    expect(new Set(FOTOGRAFIJE.map((f) => f.id)).size).toBe(FOTOGRAFIJE.length)
  })
  it('za svaku nameni postoje svi fajlovi (osim veličina koje original nije dozvoljavao)', () => {
    for (const f of FOTOGRAFIJE)
      for (const n of f.namene) {
        const postoje = SIRINE[n].filter((w) => existsSync(join(SLIKE, `${f.id}-${n}-${w}.webp`)))
        expect(postoje.length, `${f.id} ${n}: nijedan fajl`).toBeGreaterThan(0)
        expect(existsSync(join(SLIKE, `${f.id}-${n}-${SIRINE[n][0]}.webp`)), `${f.id} ${n}: nema najmanje širine`).toBe(true)
      }
  })
  it('svaki fajl u public/slike/ ima stavku u spisku', () => {
    const idjevi = FOTOGRAFIJE.map((f) => f.id)
    for (const ime of readdirSync(SLIKE)) {
      expect(ime, ime).toMatch(/\.webp$/)
      expect(idjevi.some((id) => ime.startsWith(`${id}-`)), `${ime} nema stavku u fotografije.ts`).toBe(true)
    }
  })
  it('svaka slika ima red u docs/FOTOGRAFIJE.md sa istim autorom i licencom', () => {
    const md = readFileSync(join(KOREN, 'docs', 'FOTOGRAFIJE.md'), 'utf8')
    for (const f of FOTOGRAFIJE) {
      const red = md.split('\n').find((r) => r.startsWith(`| ${f.id} |`))
      expect(red, `${f.id}: nema reda u FOTOGRAFIJE.md`).toBeDefined()
      expect(red).toContain(f.licenca)
      expect(red).toContain(f.autor)
    }
  })
  it('slike sa CC BY / CC BY-SA imaju autora koji se prikazuje (navođenje)', () => {
    for (const f of FOTOGRAFIJE) if (trebaNavodjenje(f.licenca)) expect(f.autor.length, f.id).toBeGreaterThan(2)
  })
})
