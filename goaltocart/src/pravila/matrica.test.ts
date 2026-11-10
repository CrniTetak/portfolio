// B7.3 — testovi pravila: tabela 4.0 (9 koraka x 5 uloga x 2 grane), rute, "Show me" ciljevi, navigacija.
import { describe, expect, it } from 'vitest'
import { celija, showMe, sveCelije } from './matrica'
import { EKRANI, NAVIGACIJA, TABLA, TABOVI_TRANSFERA, donjaNavigacija, ekranZaPutanju, idEkrana, meta, putSporednog, putZa, ulogaIzPutanje } from './rute'
import { SPOREDNI_KUPAC, SPOREDNI_PRODAVAC } from '../scenario/strane'
import { ULOGE } from '../prica/tipovi'
import type { EkranId } from '../prica/tipovi'

// 49 ekrana iz UX.md (C2 je šablon sa 4 sporedne instance po ulozi)
const SVIH_49: EkranId[] = [
  'C1', 'C2', 'C3',
  ...Array.from({ length: 13 }, (_, i) => `S${i + 1}` as EkranId),
  ...Array.from({ length: 11 }, (_, i) => `B${i + 1}` as EkranId),
  ...Array.from({ length: 8 }, (_, i) => `P${i + 1}` as EkranId),
  ...Array.from({ length: 7 }, (_, i) => `A${i + 1}` as EkranId),
  ...Array.from({ length: 7 }, (_, i) => `F${i + 1}` as EkranId),
]

describe('rute', () => {
  it('svaki ekran iz UX.md ima rutu (osim C2 koji ima rutu po transferu)', () => {
    expect(SVIH_49).toHaveLength(49)
    for (const id of SVIH_49) {
      if (id === 'C2') continue
      expect(EKRANI.some((e) => e.id === id), `nema rute za ${id}`).toBe(true)
    }
  })
  it('putanje su jedinstvene i ekranZaPutanju ih vraća', () => {
    const putanje = EKRANI.map((e) => e.putanja)
    expect(new Set(putanje).size).toBe(putanje.length)
    for (const e of EKRANI) expect(ekranZaPutanju(e.putanja)?.id).toBe(e.id)
  })
  it('link sadrži ulogu: #/<uloga>/<ekran>', () => {
    expect(putZa('S3')).toBe('/selling/offers')
    expect(putZa('B7')).toBe('/buying/secure-funds')
    expect(putZa('F3')).toBe('/financier/receivables/main')
    expect(putSporednog('selling', 'player-c')).toBe('/selling/transfers/player-c')
    for (const e of EKRANI.filter((x) => x.uloga)) expect(ulogaIzPutanje('/' + e.putanja)).toBe(e.uloga)
  })
  it('C2 ima instance za sve sporedne transfere, a nepoznata ruta nije ekran', () => {
    for (const t of SPOREDNI_PRODAVAC) expect(idEkrana(putSporednog('selling', t.id))?.ekran).toBe('C2')
    for (const t of SPOREDNI_KUPAC) expect(idEkrana(putSporednog('buying', t.id))?.ekran).toBe('C2')
    expect(SPOREDNI_PRODAVAC).toHaveLength(4)
    expect(SPOREDNI_KUPAC).toHaveLength(4)
    expect(idEkrana('/nesto/nepostojece')).toBeNull()
  })
  it('meta() ne baca grešku za ijedan ekran', () => {
    for (const id of SVIH_49) expect(() => meta(id)).not.toThrow()
  })
})

describe('tabela 4.0: korak x uloga x grana', () => {
  const celije = sveCelije()
  it('ima 9 x 5 x 2 = 90 ćelija', () => {
    expect(celije).toHaveLength(90)
  })
  it('za svaku ćeliju: ekran postoji, "Show me" cilj postoji, početni i završni opis su definisani', () => {
    for (const { korak, uloga, grana, celija: c } of celije) {
      const oznaka = `${grana} korak ${korak} ${uloga}`
      expect(c.ekrani.length, oznaka).toBeGreaterThan(0)
      for (const id of c.ekrani) {
        expect(() => meta(id), `${oznaka}: ${id}`).not.toThrow()
        // ekran pripada toj ulozi
        expect(meta(id).uloga, `${oznaka}: ${id} pripada drugoj ulozi`).toBe(uloga)
      }
      expect(c.pocetni.trim().length, `${oznaka}: početni opis`).toBeGreaterThan(0)
      expect(c.zavrsni.trim().length, `${oznaka}: završni opis`).toBeGreaterThan(0)
      expect(showMe(korak, uloga, grana)).toBe(c.ekrani[0])
    }
  })
  it('primeri iz UX.md 4.0', () => {
    expect(celija(1, 'selling', 'approved').ekrani).toEqual(['S3'])
    expect(celija(5, 'buying', 'approved').ekrani).toEqual(['B7', 'B10', 'B7'])
    expect(celija(8, 'selling', 'approved').ekrani).toEqual(['S10', 'S11', 'S12', 'S10'])
    expect(celija(8, 'financier', 'approved').ekrani).toEqual(['F1', 'F2', 'F3', 'F4', 'F5', 'F6'])
    expect(celija(9, 'player', 'approved').ekrani).toEqual(['P3', 'P8'])
    expect(celija(7, 'selling', 'rejected').ekrani).toEqual(['S13', 'S7'])
    expect(celija(8, 'buying', 'rejected').ekrani).toEqual(['B2'])
  })
  it('koraci 1-5 su isti u obe grane', () => {
    for (let k = 1; k <= 5; k++) for (const u of ULOGE) expect(celija(k, u, 'rejected')).toEqual(celija(k, u, 'approved'))
  })
  it('financijer: koraci 1-7 su "Nothing for you at this step" (F1)', () => {
    for (let k = 1; k <= 7; k++) expect(celija(k, 'financier', 'approved').ekrani).toEqual(['F1'])
  })
})

describe('navigacija po ulozi', () => {
  it('svaka stavka navigacije vodi na postojeću rutu uloge', () => {
    for (const u of ULOGE) {
      for (const s of NAVIGACIJA[u]) {
        expect(meta(s.cilj).uloga, `${u} ${s.oznaka}`).toBe(u)
        for (const a of s.aktivna) if (a !== 'C2') expect(() => meta(a)).not.toThrow()
      }
      expect(meta(TABLA[u]).uloga).toBe(u)
    }
  })
  it('donja navigacija na telefonu ima najviše 5 stavki', () => {
    for (const u of ULOGE) {
      const { glavne, vise } = donjaNavigacija(u)
      expect(glavne.length + (vise.length ? 1 : 0)).toBeLessThanOrEqual(5)
    }
  })
  it('kartice transfera vode na ekrane iste uloge', () => {
    for (const [u, lista] of Object.entries(TABOVI_TRANSFERA)) for (const t of lista!) expect(meta(t.ekran).uloga).toBe(u)
  })
})
