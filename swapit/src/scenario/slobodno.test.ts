// Podaci slobodnih tokova i tekstovi stranica: primeri oglasa poštuju pravila sadržaja, napravljeni oglas je ispravan u svim kombinacijama,
// spisak zabranjenih stvari ima jedan izvor (N-4), pravni tekstovi su označeni kao nacrt, crvenih linija je devet.
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { jeOglas } from '../tokovi/tokovi'
import { napraviOglas, type Nacrt } from '../tokovi/operacije'
import { POCETNI_TOKOVI } from '../tokovi/tokovi'
import { VREDNOSTI_POENA } from './cene'
import { FIRMA_PO_ID } from './firme'
import { KATEGORIJA_PO_ID } from './kategorije'
import { KORISNIK_PO_ID } from './korisnici'
import { PRIMERI_OGLASA, PRIMERI_OGLASA_FIRME, PONUDE_JAKNA, RAZGOVORI_PO_UGLU, ZELJE_PRIMERI, AUKCIJE_OGLASI, MTB_ID, brojPonudaAukcije, ponudeAukcije, rokAukcije } from './slobodno'
import { CRVENE_LINIJE, PRAVNI_TEKSTOVI, S3_ODELJCI, S4_UPOZORENJE } from './stranice'
import { ZABRANJENE_STVARI } from './poslovno'
import { OGLASI_BEOGRAD } from './oglasi'
import { PONUDE_NA_MTB } from './tabla'

const bez = (s: string) => s.toLowerCase().replace(/[čć]/g, 'c').replace(/š/g, 's').replace(/ž/g, 'z').replace(/đ/g, 'dj')
const reci = (s: string) => bez(s).split(/[^a-z0-9]+/).filter(Boolean)
const ZABRANJENO = ['alkohol', 'rakija', 'sljivovica', 'dzem', 'kolac', 'slatko', 'ulje', 'meso', 'sir', 'zivotinja', 'oruzje', 'lek', 'lekovi', 'duvan', 'organski', 'eko', 'eco', 'co2']

describe('primeri oglasa', () => {
  const svi = [...PRIMERI_OGLASA, ...PRIMERI_OGLASA_FIRME]
  it('ids su jedinstveni, kategorije postoje, nijedna zabranjena reč (isto pravilo kao za oglase u podacima)', () => {
    expect(new Set(svi.map((p) => p.id)).size).toBe(svi.length)
    for (const p of svi) {
      expect(KATEGORIJA_PO_ID[p.kat], p.id).toBeDefined()
      const r = new Set([...reci(p.naslov), ...reci(p.opis)])
      for (const z of ZABRANJENO) expect(r.has(z), `${p.naslov}: ${z}`).toBe(false)
    }
  })
  it('primeri iz svih vrsta postoje za građane, a firma ima robu i uslugu', () => {
    expect(new Set(PRIMERI_OGLASA.map((p) => p.vrsta))).toEqual(new Set(['roba', 'usluga', 'ideja']))
    expect(new Set(PRIMERI_OGLASA_FIRME.map((p) => p.vrsta))).toEqual(new Set(['roba', 'usluga']))
  })
  it('napravljen oglas je ispravan u svakoj kombinaciji (tip, način, vrednost poena, preuzimanje), i građanin i firma', () => {
    let broj = 0
    for (const p of svi)
      for (const vrsta of ['roba', 'usluga', 'ideja'] as const)
        for (const nacin of ['razmena', 'poeni', 'poklon'] as const)
          for (const poeni of VREDNOSTI_POENA) {
            const nacrt: Nacrt = { primer: p.id, vrsta, kat: p.kat, nacin, poeni: nacin === 'poeni' ? poeni : undefined, trazi: 'roba', stanje: 'Novo', preuzimanje: 'licno-kurir' }
            const gradjanin = napraviOglas(POCETNI_TOKOVI, 'ana_zvz84', false, 'zvz', nacrt)
            expect(jeOglas(gradjanin), JSON.stringify(gradjanin)).toBe(true)
            const firma = napraviOglas(POCETNI_TOKOVI, 'zupcanik', true, 'zvz', nacrt)
            expect(jeOglas(firma), JSON.stringify(firma)).toBe(true)
            expect(firma.nacin).toBe('razmena') // firme nemaju poene ni poklone
            expect(KORISNIK_PO_ID[gradjanin.vlasnik]).toBeDefined()
            expect(FIRMA_PO_ID[firma.vlasnik]).toBeDefined()
            broj++
          }
    expect(broj).toBeGreaterThan(100)
  })
})

describe('ponude, aukcije, razgovori, želje', () => {
  it('ponude Irene i Stefana postoje i imaju poznate korisnike', () => {
    expect(PONUDE_JAKNA.map((p) => p.od)).toEqual(['irena_zem80', 'stefan_nbg93'])
    for (const p of PONUDE_JAKNA) expect(KORISNIK_PO_ID[p.od]).toBeDefined()
  })
  it('aukcija „MTB bicikl STORM“ ima 7 ponuda i rok iz priče; šest aukcija iz podataka ima rok i ponude', () => {
    expect(AUKCIJE_OGLASI).toHaveLength(6)
    expect(AUKCIJE_OGLASI[0]).toBe(MTB_ID)
    expect(brojPonudaAukcije(MTB_ID)).toBe(PONUDE_NA_MTB)
    expect(rokAukcije(MTB_ID)).toEqual({ d: 12, m: 11, y: 2026 })
    for (const id of AUKCIJE_OGLASI) {
      expect(OGLASI_BEOGRAD.find((o) => o.id === id)?.aukcija).toBe(true)
      expect(rokAukcije(id)).toBeDefined()
      for (const p of ponudeAukcije(id, brojPonudaAukcije(id))) expect(KORISNIK_PO_ID[p.od], p.id).toBeDefined()
    }
  })
  it('razgovori i želje: korisnici i id-jevi postoje', () => {
    for (const lista of Object.values(RAZGOVORI_PO_UGLU)) for (const r of lista) expect(r.id === 'podrska' || KORISNIK_PO_ID[r.id], r.id).toBeTruthy()
    expect(new Set(ZELJE_PRIMERI.map((z) => z.id)).size).toBe(ZELJE_PRIMERI.length)
  })
})

describe('tekstovi stranica', () => {
  it('pravni tekstovi: uslovi, privatnost i kolačići; svaki ima odeljke, a upozorenje kaže da nije pravni dokument', () => {
    expect(PRAVNI_TEKSTOVI.map((t) => t.id)).toEqual(['uslovi', 'privatnost', 'kolacici'])
    for (const t of PRAVNI_TEKSTOVI) expect(t.odeljci.length).toBeGreaterThanOrEqual(3)
    expect(S4_UPOZORENJE).toBe('Tekst za demo — nije pravni dokument')
  })
  it('uslovi koriste isti spisak zabranjenih stvari: ne ponavljaju ga rukom (izvor je poslovno.ts)', () => {
    const uslovi = JSON.stringify(PRAVNI_TEKSTOVI[0])
    for (const z of ZABRANJENE_STVARI) expect(uslovi.includes(z.naziv), z.naziv).toBe(false)
  })
  it('N-4: spisak zabranjenih stvari sadrži žive životinje, prerađenu hranu, meso, mlečne proizvode, alkohol, oružje, lekove, duvan i falsifikate', () => {
    const tekst = bez(ZABRANJENE_STVARI.map((z) => z.naziv).join(' | '))
    for (const rec of ['zive zivotinje', 'preradjena hrana', 'meso', 'mlecni proizvodi', 'alkohol', 'oruzje', 'municija', 'lekovi', 'duvan', 'falsifikati']) expect(tekst, rec).toContain(rec)
    expect(ZABRANJENE_STVARI.map((z) => z.napomena).join(' ')).toContain('Oprema za kućne ljubimce je dozvoljena')
  })
  it('crvenih linija je devet, a S3 ima šest odeljaka', () => {
    expect(CRVENE_LINIJE).toHaveLength(9)
    expect(S3_ODELJCI).toHaveLength(6)
  })
})

// N-4: spisak zabranjenih stvari ima JEDAN izvor. Naslovi stavki se ne pišu rukom ni u jednom ekranu ni u tekstovima (osim u poslovno.ts).
describe('jedan izvor za spisak zabranjenih stvari', () => {
  const SRC = fileURLToPath(new URL('..', import.meta.url))
  const fajlovi = (dir: string): string[] => readdirSync(dir).flatMap((ime) => (statSync(join(dir, ime)).isDirectory() ? fajlovi(join(dir, ime)) : [join(dir, ime)]))
  it('naslovi stavki spiska stoje samo u scenario/poslovno.ts', () => {
    for (const p of fajlovi(SRC).filter((x) => /\.(ts|tsx)$/.test(x) && !/\.test\.ts$/.test(x))) {
      const rel = relative(SRC, p).replace(/\\/g, '/')
      if (rel === 'scenario/poslovno.ts') continue
      const t = readFileSync(p, 'utf8')
      for (const z of ZABRANJENE_STVARI) expect(t.includes(z.naziv), `${rel}: „${z.naziv}“`).toBe(false)
    }
  })
})
