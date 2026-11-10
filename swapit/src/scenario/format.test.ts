import { describe, expect, it } from 'vitest'
import { broj, datum, din, ocena, poeni } from './format'

describe('format.ts', () => {
  it('broj: tačka za hiljade', () => {
    expect(broj(1284)).toBe('1.284')
    expect(broj(15000)).toBe('15.000')
    expect(broj(7)).toBe('7')
    expect(broj(1000000)).toBe('1.000.000')
  })
  it('din', () => {
    expect(din(1149)).toBe('1.149 din')
    expect(din(0)).toBe('0 din')
  })
  it('poeni: srpski oblik (1 poen, 2 poena, 21 poen, 11 poena)', () => {
    expect(poeni(1)).toBe('1 poen')
    expect(poeni(2)).toBe('2 poena')
    expect(poeni(5)).toBe('5 poena')
    expect(poeni(11)).toBe('11 poena')
    expect(poeni(20)).toBe('20 poena')
    expect(poeni(21)).toBe('21 poen')
    expect(poeni(85)).toBe('85 poena')
  })
  it('ocena: jedna decimala sa zarezom, zaokruženo na najbližu desetinu (4,75 → 4,8)', () => {
    expect(ocena(52, 11)).toBe('4,7')
    expect(ocena(57, 12)).toBe('4,8')
    expect(ocena(140, 29)).toBe('4,8')
    expect(ocena(5, 1)).toBe('5,0')
    expect(ocena(0, 0)).toBe('—')
  })
  it('ocena: formula je nezavisno proverena (decimalno računanje) za sve zbirove i brojeve recenzija do 60', () => {
    // nezavisna provera: prosek kao decimalni broj, zaokružen na desetinu („.5 naviše“, sa malom tolerancijom zbog binarnih razlomaka)
    for (let n = 1; n <= 60; n++)
      for (let zbir = 3 * n; zbir <= 5 * n; zbir++) {
        const desetine = Math.floor((zbir / n) * 10 + 0.5 + 1e-9)
        const ocekivano = `${Math.floor(desetine / 10)},${desetine % 10}`
        expect(ocena(zbir, n), `zbir ${zbir}, recenzija ${n}`).toBe(ocekivano)
      }
    expect(ocena(19, 4)).toBe('4,8') // 4,75 → 4,8
    expect(ocena(14, 3)).toBe('4,7') // 4,666… → 4,7
    expect(ocena(9, 2)).toBe('4,5')
  })
  it('datum: „19. 10. 2026.“', () => {
    expect(datum({ d: 19, m: 10, y: 2026 })).toBe('19. 10. 2026.')
  })
})
