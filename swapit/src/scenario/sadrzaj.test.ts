// SADRŽAJNE BRAVE (PLAN B3): pravila sadržaja oglasa koja moraju da važe u podacima (UX 0, 12, 7.3).
import { describe, expect, it } from 'vitest'
import { FIRMA_PO_ID } from './firme'
import { KATEGORIJE, KATEGORIJE_SA_OBAVESTENJEM, KATEGORIJA_JABUCICA } from './kategorije'
import { KORISNICI, KORISNIK_PO_ID, REGION_KORISNICI, brojRecenzija, zbirOcena } from './korisnici'
import { ANIN_PS2, OGLASI_BEOGRAD, OGLASI_REGION, PRIJAVLJENI_OGLAS, REZERVISANI_IDOVI } from './oglasi'
import { OPSTINE } from './opstine'
import { ocena } from './format'

const SVI = [...OGLASI_BEOGRAD, ANIN_PS2]

// reči koje se ne smeju naći u oglasima van moderacije (cele reči, bez kvačica)
const ZABRANJENO = ['alkohol', 'rakija', 'sljivovica', 'dzem', 'kolac', 'kolaci', 'slatko', 'ulje', 'meso', 'sir', 'zivotinja', 'zivotinje', 'oruzje', 'lek', 'lekovi', 'duvan', 'cigarete', 'organski', 'eko', 'eco', 'friendly', 'co2', 'usteđeno', 'usteceno', 'ustedjeno']
const bez = (s: string) => s.toLowerCase().replace(/[čć]/g, 'c').replace(/š/g, 's').replace(/ž/g, 'z').replace(/đ/g, 'dj')
const reci = (s: string) => bez(s).split(/[^a-z0-9]+/).filter(Boolean)

describe('sadržaj oglasa', () => {
  it('nijedan oglas van moderacije nema zabranjenu reč', () => {
    for (const o of [...SVI, ...OGLASI_REGION]) {
      const r = new Set([...reci(o.naslov), ...reci(o.opis)])
      for (const z of ZABRANJENO) expect(r.has(z), `${o.naslov}: „${z}“`).toBe(false)
    }
  })
  it('„šljivovica“ postoji samo kao prijavljen oglas (moderacija)', () => {
    expect(reci(PRIJAVLJENI_OGLAS.naslov)).toContain('sljivovica')
    expect(REZERVISANI_IDOVI).toContain('sljivovica')
  })
  it('jabučica (kategorija voće i povrće) je samo u toj kategoriji; kategorija „Životinje“ ne postoji', () => {
    expect(KATEGORIJE.some((k) => bez(k.naziv).includes('zivotinj'))).toBe(false)
    expect(KATEGORIJE.filter((k) => k.id === KATEGORIJA_JABUCICA).length).toBe(1)
    expect(SVI.filter((o) => o.kat === KATEGORIJA_JABUCICA).length).toBe(8)
  })
  it('svaki oglas u Beogradu ima opštinu sa mape', () => {
    const ids = new Set(OPSTINE.map((o) => o.id))
    for (const o of SVI) {
      expect(o.grad).toBe('Beograd')
      expect(o.opstina && ids.has(o.opstina), o.naslov).toBe(true)
    }
    expect(OPSTINE.length).toBe(11)
  })
  it('opština oglasa je opština vlasnika', () => {
    for (const o of SVI) {
      const opstina = o.firma ? FIRMA_PO_ID[o.vlasnik].opstina : KORISNIK_PO_ID[o.vlasnik].opstina
      expect(o.opstina, o.naslov).toBe(opstina)
    }
  })
  it('nekretnine i vozila imaju obaveštenje (kategorije su označene)', () => {
    expect(KATEGORIJE_SA_OBAVESTENJEM.sort()).toEqual(['nekretnine', 'vozila'])
    for (const k of KATEGORIJE_SA_OBAVESTENJEM) expect(KATEGORIJE.some((x) => x.id === k)).toBe(true)
  })
  it('kategorije svih oglasa postoje, ids su jedinstveni', () => {
    const kat = new Set(KATEGORIJE.map((k) => k.id))
    const ids = new Set<string>()
    for (const o of [...SVI, ...OGLASI_REGION, PRIJAVLJENI_OGLAS]) {
      expect(kat.has(o.kat), `${o.naslov}: ${o.kat}`).toBe(true)
      expect(ids.has(o.id), `ponovljen id ${o.id}`).toBe(false)
      ids.add(o.id)
    }
  })
  it('svaki građanin ima bar jedan oglas (osim Ane, čiji oglas stiže u koraku 2)', () => {
    for (const k of KORISNICI) {
      if (k.id === 'ana_zvz84') continue
      expect(SVI.some((o) => o.vlasnik === k.id), k.id).toBe(true)
    }
  })
  it('vlasnik svakog oglasa postoji', () => {
    for (const o of SVI) expect(o.firma ? FIRMA_PO_ID[o.vlasnik] : KORISNIK_PO_ID[o.vlasnik], o.naslov).toBeDefined()
    const regioni = new Set(REGION_KORISNICI.map((r) => r.id))
    for (const o of OGLASI_REGION) expect(regioni.has(o.vlasnik)).toBe(true)
  })
  it('predmeti priče su rezervisani za priču', () => {
    for (const id of ['markov-bicikl', 'markova-jakna', 'jovanini-udzbenici', 'jovanin-ranac', 'jovanine-knjige', 'ana-ps2', 'sljivovica']) expect(REZERVISANI_IDOVI).toContain(id)
  })
})

describe('pomoćni korisnici (PLAN B5.6)', () => {
  const pomocni = KORISNICI.filter((k) => k.uloga === 'pomocni')
  it('ima ih 31', () => expect(pomocni.length).toBe(31))
  it('razmene 1–20, recenzije ≤ razmene, ocena 4,3–4,9 ili bez recenzija', () => {
    for (const k of pomocni) {
      expect(k.razmene, k.id).toBeGreaterThanOrEqual(1)
      expect(k.razmene, k.id).toBeLessThanOrEqual(20)
      const n = brojRecenzija(k.ocene)
      expect(n, k.id).toBeLessThanOrEqual(k.razmene)
      if (n > 0) {
        const o = ocena(zbirOcena(k.ocene), n)
        const v = Number(o.replace(',', '.'))
        expect(v, `${k.id}: ${o}`).toBeGreaterThanOrEqual(4.3)
        expect(v, `${k.id}: ${o}`).toBeLessThanOrEqual(4.9)
      }
    }
  })
  it('korisnička imena prate obrazac ime_opština+godište', () => {
    for (const k of KORISNICI) expect(k.id, k.id).toMatch(/^[a-z]+_[a-z]{3}\d{2}$/)
  })
})
