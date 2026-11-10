// Matrica priče (UX 3.3): korak × ugao × grana → ekran. Svaka ćelija ima početni i završni ekran koji ugao sme da vidi;
// „Pokaži mi“ za svaku poziciju i ugao daje postojeći ekran; ekrani radnji se slažu sa ćelijama; ključne ćelije su prepisane iz UX 3.3.
import { describe, expect, it } from 'vitest'
import { svePozicije } from '../scenario/pomocno'
import { radnjeKoraka, sveRadnje } from '../prica/koraci'
import { UGLOVI, type Grana } from '../prica/tipovi'
import { poUgluZa } from '../tekstovi/kartice'
import { celija, ekranZaPoziciju, ekraniKoraka, MATRICA_LANAC, MATRICA_POENI } from './matrica'
import { KUCA, RUTA_PO_ID } from './rute'

describe('matrica: sve ćelije', () => {
  it('9 × 4 ćelija u glavnom toku i 3 × 4 u račvi, svaka sa dva ekrana koje ugao sme da vidi', () => {
    let broj = 0
    for (const u of UGLOVI) {
      expect(MATRICA_LANAC[u].length).toBe(9)
      expect(MATRICA_POENI[u].length).toBe(3)
      for (const c of [...MATRICA_LANAC[u], ...MATRICA_POENI[u]]) {
        for (const e of [c.pocetno, c.zavrsno]) {
          expect(RUTA_PO_ID[e], `${u} ${e}`).toBeDefined()
          expect(RUTA_PO_ID[e].uglovi, `${u} → ${e}`).toContain(u)
        }
        broj++
      }
    }
    expect(broj).toBe(48)
  })
  for (const grana of ['lanac', 'poeni'] as Grana[])
    it(`grana ${grana}: ekran svake radnje postoji, vidljiv je uglu koji je izvodi i pripada koraku tog ugla`, () => {
      for (const r of sveRadnje(grana)) {
        expect(RUTA_PO_ID[r.ekran], `${r.id} → ${r.ekran}`).toBeDefined()
        for (const u of r.uloge) {
          expect(RUTA_PO_ID[r.ekran].uglovi, `${r.id}: ${r.ekran} za ${u}`).toContain(u)
          expect(ekraniKoraka(r.korak, grana, u), `${r.id} u koraku za ${u}`).toContain(r.ekran)
        }
      }
    })
  it('„Pokaži mi“: za svaku poziciju i ugao ekran postoji i ugao ga sme da vidi', () => {
    for (const poz of svePozicije())
      for (const u of UGLOVI) {
        const ekran = ekranZaPoziciju(poz, u)
        expect(RUTA_PO_ID[ekran], `${poz.korak}/${poz.n}/${poz.grana} ${u}`).toBeDefined()
        expect(RUTA_PO_ID[ekran].uglovi, `${poz.korak}/${poz.n}/${poz.grana} ${u} → ${ekran}`).toContain(u)
      }
  })
  it('svaka ćelija ima opis (kartica priče) za svaku poziciju', () => {
    for (const poz of svePozicije()) for (const u of UGLOVI) expect(poUgluZa(poz, u).length, `${poz.korak} ${u}`).toBeGreaterThan(10)
  })
})

describe('matrica: ključne ćelije iz UX 3.3 (prepisano rukom)', () => {
  const L = (korak: number, n: number, grana: Grana = 'lanac') => ({ korak, n, grana })
  const ana = (k: number, grana: Grana = 'lanac') => celija(k, 'ana', grana)
  it('Ana: početno / završno po koracima', () => {
    expect([ana(1).pocetno, ana(1).zavrsno]).toEqual(['R2', 'P1'])
    expect([ana(2).pocetno, ana(2).zavrsno]).toEqual(['O2', 'W3'])
    expect([ana(3).pocetno, ana(3).zavrsno]).toEqual(['W4', 'O1'])
    expect([ana(4).pocetno, ana(4).zavrsno]).toEqual(['X1', 'X3'])
    expect(ana(6).pocetno).toBe('X13')
    expect([ana(7).pocetno, ana(7).zavrsno]).toEqual(['X8', 'D3'])
    expect(ana(8).pocetno).toBe('X9')
    expect([ana(6, 'poeni').pocetno, ana(6, 'poeni').zavrsno]).toEqual(['O1', 'W2'])
  })
  it('Marko, Prodavnica i Moderacija', () => {
    expect([celija(4, 'marko', 'lanac').pocetno, celija(4, 'marko', 'lanac').zavrsno]).toEqual(['X12', 'X4'])
    expect([celija(5, 'marko', 'lanac').pocetno, celija(5, 'marko', 'lanac').zavrsno]).toEqual(['X4', 'X6'])
    expect(celija(3, 'prodavnica', 'lanac').pocetno).toBe('F6')
    expect(celija(8, 'prodavnica', 'lanac').pocetno).toBe('A5')
    expect([celija(5, 'moderacija', 'lanac').pocetno, celija(5, 'moderacija', 'lanac').zavrsno]).toEqual(['V2', 'V3'])
    expect(celija(6, 'moderacija', 'lanac').pocetno).toBe('V4')
  })
  it('početak priče: Ana R2, ostali kuća ugla', () => {
    expect(ekranZaPoziciju(L(1, 0), 'ana')).toBe('R2')
    for (const u of ['marko', 'prodavnica', 'moderacija'] as const) expect(ekranZaPoziciju(L(1, 0), u)).toBe(KUCA[u])
  })
  it('usred koraka: ekran sledeće radnje ugla; na kraju koraka završni ekran', () => {
    expect(ekranZaPoziciju(L(1, 1), 'ana')).toBe('R3')
    expect(ekranZaPoziciju(L(2, 2), 'ana')).toBe('O4')
    expect(ekranZaPoziciju(L(7, 2), 'ana')).toBe('D1')
    expect(ekranZaPoziciju(L(5, 1), 'marko')).toBe('X5')
    expect(ekranZaPoziciju(L(5, radnjeKoraka(5, 'lanac').length), 'marko')).toBe('X6')
  })
})
