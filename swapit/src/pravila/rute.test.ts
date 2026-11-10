import { describe, expect, it } from 'vitest'
import { UGLOVI } from '../prica/tipovi'
import { KUCA, RUTE, RUTA_PO_ID, link, razresi } from './rute'

// ID-jevi svih 84 ekrana iz UX.md 5 (prepisani rukom, nezavisno od rute.ts)
const SVI_ID = [
  'U1', 'U2', 'U3',
  'R1', 'R2', 'R3', 'R4', 'R5',
  'P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'P7', 'P8', 'P9', 'P10',
  'O1', 'O2', 'O3', 'O4', 'O5', 'O6',
  'X1', 'X2', 'X3', 'X4', 'X5', 'X6', 'X7', 'X8', 'X9', 'X10', 'X11', 'X12', 'X13',
  'C1', 'C2',
  'W1', 'W2', 'W3', 'W4', 'W5', 'W6',
  'J1', 'J2', 'J3', 'J4',
  'Z1', 'Z2', 'Z3', 'Z4',
  'N1', 'N2', 'N3', 'N4',
  'D1', 'D2', 'D3',
  'S1', 'S2', 'S3', 'S4', 'S5',
  'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9',
  'A1', 'A2', 'A3', 'A4', 'A5', 'A6',
  'V1', 'V2', 'V3', 'V4',
]

describe('registar ekrana', () => {
  it('ima tačno 84 ekrana iz UX-a, svaki jednom', () => {
    expect(SVI_ID.length).toBe(84)
    expect(RUTE.map((r) => r.id).sort()).toEqual([...SVI_ID].sort())
  })
  it('putanje su jedinstvene', () => {
    const mapa = new Map<string, string>()
    for (const r of RUTE) {
      const kljuc = `${r.bezUgla ? 'bez' : 'sa'}:${r.put.replace(/:\w+/g, ':p')}`
      expect(mapa.has(kljuc), `${r.id} i ${mapa.get(kljuc)} imaju istu putanju`).toBe(false)
      mapa.set(kljuc, r.id)
    }
  })
  it('svaki ekran ima naslov i bar jedan ugao', () => {
    for (const r of RUTE) {
      expect(r.naslov.length, r.id).toBeGreaterThan(2)
      expect(r.uglovi.length, r.id).toBeGreaterThan(0)
    }
  })
  it('kuća svakog ugla je ekran koji taj ugao sme da vidi', () => {
    for (const u of UGLOVI) expect(RUTA_PO_ID[KUCA[u]].uglovi).toContain(u)
  })
  it('svaki ugao ima dovoljno ekrana', () => {
    const broj = (u: (typeof UGLOVI)[number]) => RUTE.filter((r) => r.uglovi.includes(u)).length
    expect(broj('ana')).toBeGreaterThan(60)
    expect(broj('marko')).toBe(broj('ana'))
    expect(broj('prodavnica')).toBeGreaterThan(40)
    expect(broj('moderacija')).toBeGreaterThan(25)
  })
})

describe('linkovi', () => {
  it('svaki ekran: link → razresi daje isti ekran, za svaki ugao koji ga sme', () => {
    for (const r of RUTE)
      for (const u of r.uglovi) {
        const l = link(r.id, u)
        const x = razresi(l)
        expect(x?.id, `${r.id} → ${l}`).toBe(r.id)
        if (!r.bezUgla) expect(x?.ugao).toBe(u)
      }
  })
  it('primeri iz plana (B2)', () => {
    expect(link('U1', 'ana')).toBe('/')
    expect(link('U2', 'ana')).toBe('/ulaz')
    expect(link('U3', 'ana')).toBe('/o-demou')
    expect(link('S4', 'ana', { tekst: 'privatnost' })).toBe('/pravno/privatnost')
    expect(link('P1', 'ana')).toBe('/ana/pocetna')
    expect(link('O1', 'ana')).toBe('/ana/oglas/markov-bicikl')
    expect(link('X1', 'ana')).toBe('/ana/ponuda/markov-bicikl/izaberi')
    expect(link('X4', 'marko')).toBe('/marko/primljene/markov-bicikl')
    expect(link('X13', 'ana')).toBe('/ana/lanac')
    expect(link('Z3', 'ana')).toBe('/ana/placanje/dostava/SW-DEMO-0001')
    expect(link('F3', 'prodavnica')).toBe('/prodavnica/tabla')
    expect(link('V2', 'moderacija')).toBe('/moderacija/prijava/sljivovica')
    expect(link('P5', 'ana', {}, { q: 'bicikl' })).toBe('/ana/pretraga?q=bicikl')
  })
  it('parametri iz linka se vraćaju', () => {
    expect(razresi('/ana/oglas/dolap')?.parametri).toEqual({ oglas: 'dolap' })
    expect(razresi('/marko/primljene/markov-bicikl/ana-ps2/odbij')).toMatchObject({ id: 'X6', ugao: 'marko', parametri: { oglas: 'markov-bicikl', ponuda: 'ana-ps2' } })
    expect(razresi('/ana/placanje/isticanje/abc/potvrdjeno')).toMatchObject({ id: 'Z4', parametri: { svrha: 'isticanje', ref: 'abc' } })
  })
  it('nepostojeća ruta daje null', () => {
    expect(razresi('/ana/ne-postoji')).toBeNull()
    expect(razresi('/nepoznat/pocetna')).toBeNull()
    expect(razresi('/ana')).toBeNull()
    expect(razresi('/ulaz/ana')).toBeNull()
  })
  it('ekrani koji se razlikuju samo po poslednjem segmentu ne mešaju se', () => {
    expect(razresi('/ana/pretraga')?.id).toBe('P5')
    expect(razresi('/ana/pretraga/filteri')?.id).toBe('P4')
    expect(razresi('/ana/poeni')?.id).toBe('W1')
    expect(razresi('/ana/poeni/nedovoljno/markov-bicikl')?.id).toBe('W2')
    expect(razresi('/ana/profil/marko_voz77')?.id).toBe('N1')
    expect(razresi('/ana/profil/marko_voz77/recenzije')?.id).toBe('N4')
    expect(razresi('/ana/prijava')?.id).toBe('R1')
    expect(razresi('/moderacija/prijava/sljivovica')?.id).toBe('V2')
    expect(razresi('/ana/akcija/staro-za-novo/prijava')?.id).toBe('A2')
    expect(razresi('/prodavnica/akcije')?.id).toBe('A4')
    expect(razresi('/prodavnica/akcije/nova')?.id).toBe('A5')
  })
  it('ekrani sa cenom su označeni', () => {
    for (const id of ['Z1', 'Z2', 'Z3', 'Z4', 'F1', 'F8', 'F9', 'D2', 'A5']) expect(RUTA_PO_ID[id].cena, id).toBe(true)
  })
})
