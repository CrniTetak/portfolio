// Datumi su fiksni podaci (UX 3.3): proveravaju se same vrednosti, ne samo dužina nizova.
import { describe, expect, it } from 'vitest'
import { demoDatum, datumiKoraka, GRAND_PRIX_RATA2, KRAJ_PUTOVANJA, POLAZAK, ROK_AVANSA, ROK_POPUNJENOSTI, ROK_RATE3, VEGAS_RATA2, type Dat } from './datumi'
import { datum } from './format'

const k = (d: Dat) => d.y * 10000 + d.m * 100 + d.d
describe('datumi priče', () => {
  it('početak i kraj svakog koraka (glavni put)', () => {
    const pk = [
      ['19 Oct 2026', '21 Oct 2026'],
      ['22 Oct 2026', '24 Oct 2026'],
      ['27 Oct 2026', '29 Oct 2026'],
      ['30 Oct 2026', '5 Nov 2026'],
      ['9 Nov 2026', '30 Nov 2026'],
      ['1 Dec 2026', '14 Jan 2027'],
      ['15 Jan 2027', '15 Jan 2027'],
      ['18 Jan 2027', '12 Feb 2027'],
      ['1 Mar 2027', '7 Mar 2027'],
    ]
    pk.forEach(([a, b], i) => {
      const niz = datumiKoraka(i + 1, 'A')
      expect(datum(niz[0]), `korak ${i + 1} početak`).toBe(a)
      expect(datum(niz.at(-1)!), `korak ${i + 1} kraj`).toBe(b)
    })
  })
  it('ishod C: korak 8 do 1 Feb 2027, korak 9 od 2 Feb do 5 Feb 2027', () => {
    expect(datum(datumiKoraka(8, 'C').at(-1)!)).toBe('1 Feb 2027')
    expect(datum(datumiKoraka(9, 'C')[0])).toBe('2 Feb 2027')
    expect(datum(datumiKoraka(9, 'C').at(-1)!)).toBe('5 Feb 2027')
  })
  it('Markove uplate: rata 2 9 Dec 2026, rata 3 8 Feb 2027; demo datum po poziciji', () => {
    expect(datum(demoDatum(6, 1, 'A'))).toBe('9 Dec 2026')
    expect(datum(demoDatum(8, 1, 'A'))).toBe('8 Feb 2027')
    expect(datum(demoDatum(1, 0, 'A'))).toBe('19 Oct 2026')
  })
  it('datumi nikad ne idu unazad kroz ceo put (A, B, C)', () => {
    for (const ishod of ['A', 'B', 'C'] as const) {
      let prethodni = 0
      for (let korak = 1; korak <= 9; korak++)
        for (const d of datumiKoraka(korak, ishod)) {
          expect(k(d)).toBeGreaterThanOrEqual(prethodni)
          prethodni = k(d)
        }
    }
  })
  it('rokovi i putovanje', () => {
    expect(datum(ROK_AVANSA)).toBe('6 Nov 2026')
    expect(datum(ROK_POPUNJENOSTI)).toBe('15 Jan 2027')
    expect(datum(ROK_RATE3)).toBe('12 Feb 2027')
    expect(datum(POLAZAK)).toBe('14 Mar 2027')
    expect(datum(KRAJ_PUTOVANJA)).toBe('19 Mar 2027')
  })
  it('sporedne grupe: rate 2 su posle kraja priče (7 Mar 2027)', () => {
    expect(k(VEGAS_RATA2)).toBeGreaterThan(k({ d: 7, m: 3, y: 2027 }))
    expect(k(GRAND_PRIX_RATA2)).toBeGreaterThan(k({ d: 7, m: 3, y: 2027 }))
  })
})
