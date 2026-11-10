// Testovi registra 53 ekrana (PLAN B8.1): tačno 53, jedinstveni id-ovi i rute, roditelj i početni fokus, rute se razrešavaju.
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { BROJ_EKRANA, EKRANI, ekran, poklopi, razresi, sastavi } from './ekrani'

const SRC = fileURLToPath(new URL('..', import.meta.url))

describe('registar ekrana', () => {
  it('tačno 53 ekrana: 3 uvodna, 31 televizor, 17 telefon, 2 table', () => {
    expect(EKRANI).toHaveLength(BROJ_EKRANA)
    expect(BROJ_EKRANA).toBe(53)
    expect(EKRANI.filter((e) => e.uredjaj === 'uvod')).toHaveLength(3)
    expect(EKRANI.filter((e) => e.uredjaj === 'tv')).toHaveLength(31)
    expect(EKRANI.filter((e) => e.uredjaj === 'tel')).toHaveLength(17)
    expect(EKRANI.filter((e) => e.uredjaj === 'tabla')).toHaveLength(2)
  })
  it('id-ovi U1–U3, T1–T31, P1–P17, V1, M1 (svi, bez rupa)', () => {
    const ocekivano = ['U1', 'U2', 'U3', ...Array.from({ length: 31 }, (_, i) => `T${i + 1}`), ...Array.from({ length: 17 }, (_, i) => `P${i + 1}`), 'V1', 'M1']
    expect(EKRANI.map((e) => e.id).sort()).toEqual([...ocekivano].sort())
  })
  it('id-ovi i rute su jedinstveni (po uređaju)', () => {
    expect(new Set(EKRANI.map((e) => e.id)).size).toBe(53)
    expect(new Set(EKRANI.map((e) => `${e.uredjaj === 'tel' ? 'tel' : 'strana'}:${e.ruta}`)).size).toBe(53)
  })
  it('svaki ekran ima naslov; svaki ekran osim početnih ima roditelja koji postoji; nema ciklusa', () => {
    const bezRoditelja = EKRANI.filter((e) => e.roditelj === null).map((e) => e.id)
    expect(bezRoditelja.sort()).toEqual(['M1', 'P1', 'T1', 'T2', 'U1', 'V1'])
    for (const e of EKRANI) {
      expect(e.naslov.length).toBeGreaterThan(2)
      if (e.roditelj !== null) expect(EKRANI.some((x) => x.id === e.roditelj), `${e.id} → ${e.roditelj}`).toBe(true)
      let t: string | null = e.id
      for (let i = 0; i < 20 && t !== null; i++) t = ekran(t).roditelj
      expect(t, `ciklus kod ${e.id}`).toBeNull()
    }
  })
  it('svaki TV ekran ima početni fokus', () => {
    for (const e of EKRANI.filter((x) => x.uredjaj === 'tv')) expect(e.pocetniFokus, e.id).toBeTruthy()
  })
})

describe('rute', () => {
  const primer: Record<string, string> = { id: 'doma-tv', proizvod: 'doma-tv', upit: 'film', pitanje: 'kako-otkazujem' }
  it('svaka ruta se sastavlja i razrešava nazad u isti ekran', () => {
    for (const e of EKRANI) {
      const parametri = Object.fromEntries([...e.ruta.matchAll(/:(\w+)/g)].map(([, ime]) => [ime, primer[ime]]))
      const putanja = sastavi(e.id, parametri)
      const uredjaj = e.uredjaj === 'tv' ? 'tv' : e.uredjaj === 'tel' ? 'tel' : 'strana'
      const r = razresi(uredjaj, putanja)
      expect(r?.ekran.id, `${e.id}: ${putanja}`).toBe(e.id)
      expect(r?.parametri).toEqual(parametri)
    }
  })
  it('televizor je pod /tv/…, telefon u zasebnom skupu (upit ?tel=)', () => {
    for (const e of EKRANI.filter((x) => x.uredjaj === 'tv')) expect(e.ruta.startsWith('/tv/')).toBe(true)
    expect(razresi('tv', '/tv/pocetna')?.ekran.id).toBe('T2')
    expect(razresi('tel', '/pocetna')?.ekran.id).toBe('P1')
    expect(razresi('strana', '/tabla/vesna')?.ekran.id).toBe('V1')
    expect(razresi('strana', '/')?.ekran.id).toBe('U1')
  })
  it('nepoznata ruta se ne razrešava (aplikacija tada vodi na početni ekran, nikad prazan ekran)', () => {
    expect(razresi('tv', '/tv/ne-postoji')).toBeNull()
    expect(razresi('tv', '/tv/kanal')).toBeNull()
    expect(razresi('tv', '/tv/kanal/a/b')).toBeNull()
    expect(razresi('tel', '/tv/pocetna')).toBeNull()
  })
  it('ruta T8 razlikuje kanal; poklopi vraća parametre; sastavi traži sve parametre', () => {
    expect(poklopi('/tv/kanal/:id', '/tv/kanal/doma-tv')).toEqual({ id: 'doma-tv' })
    expect(poklopi('/tv/kanal/:id', '/tv/paket/doma-tv')).toBeNull()
    expect(() => sastavi('T8')).toThrow()
    expect(sastavi('T8', { id: 'doma tv' })).toBe('/tv/kanal/doma%20tv')
  })
})

describe('svaki link iz izvora vodi na postojeći ekran', () => {
  function tsx(dir: string): string[] {
    return readdirSync(dir).flatMap((ime) => {
      const p = join(dir, ime)
      return statSync(p).isDirectory() ? tsx(p) : p.endsWith('.tsx') ? [p] : []
    })
  }
  it('sastavi(\'X\') i ekran: \'X\' u .tsx koriste samo ID-ove iz registra', () => {
    const ids = new Set(EKRANI.map((e) => e.id))
    let nadjeno = 0
    for (const f of tsx(SRC)) {
      const t = readFileSync(f, 'utf8')
      for (const [, id] of t.matchAll(/sastavi\(\s*['"]([A-Z]\d+)['"]/g)) {
        nadjeno++
        expect(ids.has(id), `${f}: ${id}`).toBe(true)
      }
      for (const [, id] of t.matchAll(/ekran:\s*['"]([A-Z]\d+)['"]/g)) {
        nadjeno++
        expect(ids.has(id), `${f}: ${id}`).toBe(true)
      }
    }
    expect(nadjeno).toBeGreaterThan(10)
  })
})
