// B8.3: testovi matrice (tabela 3.3), ruta (65 ekrana) i pravila radnji (UX 3.1).
import { describe, expect, it } from 'vitest'
import { brojRadnji, radnjeKoraka, sveRadnje } from '../prica/koraci'
import type { Ishod, Poz } from '../prica/tipovi'
import { celija } from './matrica'
import { statusRadnje } from './radnje'
import { KUCA, RUTE, RUTA_PO_ID, link, razresi } from './rute'

describe('matrica 3.3: svaka celija (9 koraka × 3 uloge × 3 ishoda) je definisana', () => {
  for (const ishod of ['A', 'B', 'C'] as Ishod[])
    for (let k = 1; k <= 9; k++)
      for (const uloga of ['organizer', 'traveler', 'advisor'] as const)
        it(`korak ${k} · ${uloga} · ${ishod}`, () => {
          const c = celija(k, uloga, ishod)!
          expect(c).not.toBeNull()
          for (const s of [c.pocetno, c.zavrsno]) {
            expect(RUTA_PO_ID[s.ekran], `${s.ekran} nije u registru`).toBeDefined()
            expect(s.opis.length).toBeGreaterThan(5)
            // ekran mora da bude dozvoljen za tu ulogu
            expect(RUTA_PO_ID[s.ekran].uloge).toContain(uloga)
          }
        })
  it('gost nema kolonu u priči', () => {
    expect(celija(1, 'guest', 'A')).toBeNull()
  })
  it('radnje iz koraci.ts se slažu sa celijama: ekran radnje je dozvoljen bar jednoj ulozi koja je izvodi', () => {
    for (const ishod of ['A', 'B', 'C'] as Ishod[])
      for (const r of sveRadnje(ishod)) {
        const ekran = RUTA_PO_ID[r.ekran]
        expect(ekran, r.id).toBeDefined()
        if (r.uloge !== 'any') expect(r.uloge.some((u) => ekran.uloge.includes(u)), r.id).toBe(true)
      }
  })
})

describe('rute: svih 65 ekrana iz UX.md 5', () => {
  it('ima tačno 65 jedinstvenih ekrana i jedinstvenih linkova', () => {
    expect(RUTE.length).toBe(65)
    expect(new Set(RUTE.map((r) => r.id)).size).toBe(65)
    expect(new Set(RUTE.map((r) => r.put)).size).toBe(65)
  })
  it('link i razrešavanje se slažu za svaki ekran i svaku dozvoljenu ulogu', () => {
    for (const r of RUTE)
      for (const u of r.uloge) {
        if (r.id === 'S1' || r.id === 'S6' || r.id === 'S7') continue
        expect(razresi(link(r.id, u)), r.id).toEqual({ id: r.id, uloga: u })
      }
  })
  it('kuća svake uloge postoji i dozvoljena je toj ulozi', () => {
    for (const [u, id] of Object.entries(KUCA)) expect(RUTA_PO_ID[id].uloge).toContain(u)
  })
  it('nepostojeća ruta se ne razrešava', () => {
    expect(razresi('/organizer/nema/ovoga')).toBeNull()
    expect(razresi('/niko/home')).toBeNull()
  })
  it('izgrađeni ekrani ove faze', () => {
    const gotovi = RUTE.filter((r) => r.izgradjen).map((r) => r.id)
    for (const id of ['S1', 'S2', 'S6', 'S7', 'G1', 'G2', 'G3', 'G4', 'G5', 'G6', 'G7', 'G8', 'G11', 'G13', 'G15', 'G16', 'T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T9', 'V1', 'V2', 'V3', 'V4'])
      expect(gotovi).toContain(id)
  })
  it('ekrani sa ulogom koja ne važi vode na kuću (uloge su navedene)', () => {
    for (const r of RUTE) expect(r.uloge.length).toBeGreaterThan(0)
  })
})

describe('radnje: pravilo UX 3.1 (dugme × pozicija × uloga)', () => {
  const p = (korak: number, n: number, ishod: Ishod = 'A'): Poz => ({ korak, n, ishod })
  it('sledeća radnja prave uloge je aktivna', () => {
    expect(statusRadnje(p(1, 0), 'organizer', '1.pretraga')).toEqual({ aktivno: true })
    expect(statusRadnje(p(2, 0), 'advisor', '2.v1')).toEqual({ aktivno: true })
  })
  it('pogrešna uloga: "Switch to … to try this"', () => {
    const s = statusRadnje(p(1, 0), 'advisor', '1.pretraga')
    expect(s.aktivno).toBe(false)
    expect(s.razlog).toBe('Switch to Group organizer to try this')
    expect(s.prebaci).toBe('organizer')
    expect(statusRadnje(p(1, 0), 'traveler', '1.pretraga').razlog).toMatch(/^Switch to/)
  })
  it('već odrađeno: "Done"', () => {
    expect(statusRadnje(p(1, 1), 'organizer', '1.pretraga')).toEqual({ aktivno: false, razlog: 'Done' })
    expect(statusRadnje(p(3, 0), 'organizer', '1.pretraga').razlog).toBe('Done')
  })
  it('budući korak: "Available at step N"', () => {
    expect(statusRadnje(p(1, 0), 'traveler', '6.rata2').razlog).toBe('Available at step 6')
    expect(statusRadnje(p(2, 0), 'organizer', '4.prihvati').razlog).toBe('Available at step 4')
  })
  it('isti korak, ali ranija radnja još nije odrađena: "Waiting for the …"', () => {
    expect(statusRadnje(p(3, 0), 'advisor', '3.v2').razlog).toBe('Waiting for the organizer')
    expect(statusRadnje(p(4, 2), 'organizer', '4.transfer').razlog).toBe('Done')
    expect(statusRadnje(p(4, 0), 'organizer', '4.transfer').razlog).toBe('First: Accept the quote')
    expect(statusRadnje(p(4, 0), 'advisor', '4.avans').razlog).toBe('Waiting for the organizer')
  })
  it('ishod: radnja koje nema na tom putu se odbija', () => {
    expect(statusRadnje(p(7, 0, 'B'), 'advisor', '7.potvrda').aktivno).toBe(false)
    expect(statusRadnje(p(7, 0, 'A'), 'advisor', '7.opcije').aktivno).toBe(false)
  })
  it('događaj bez izvođača je aktivan za svaku ulogu', () => {
    for (const u of ['organizer', 'traveler', 'advisor'] as const) expect(statusRadnje(p(7, 0), u, '7.sim').aktivno).toBe(true)
  })
  it('gost: svaka akcija otvara izbor uloge', () => {
    expect(statusRadnje(p(4, 0), 'guest', '1.pretraga')).toEqual({ aktivno: true, gost: true })
  })
  it('na svakoj poziciji tačno jedna radnja je "sledeća", i ona je aktivna za svoju ulogu', () => {
    for (const ishod of ['A', 'B', 'C'] as Ishod[])
      for (let k = 1; k <= 9; k++)
        for (let n = 0; n < brojRadnji(k, ishod); n++) {
          const r = radnjeKoraka(k, ishod)[n]
          const u = r.uloge === 'any' ? 'organizer' : r.uloge[0]
          expect(statusRadnje({ korak: k, n, ishod }, u, r.id).aktivno, r.id).toBe(true)
        }
  })
})
