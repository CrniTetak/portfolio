import { describe, expect, it } from 'vitest'
import { broj, datum, eur, eurDec, eurRazlika, noci, odOd, opsegDatuma, procenat } from './format'

describe('format.ts (jedino mesto za prikaz)', () => {
  it('iznosi', () => {
    expect(broj(1234567)).toBe('1,234,567')
    expect(eur(2500)).toBe('EUR 2,500')
    expect(eur(300000)).toBe('EUR 300,000')
    expect(eur(-7200)).toBe('EUR −7,200')
    expect(eur(0)).toBe('EUR 0')
    expect(eurDec(7260)).toBe('EUR 7,260.00')
    expect(eurRazlika(150)).toBe('+EUR 150')
    expect(eurRazlika(-150)).toBe('−EUR 150')
  })
  it('datumi, procenti, odnosi', () => {
    expect(datum({ d: 15, m: 1, y: 2027 })).toBe('15 Jan 2027')
    expect(opsegDatuma({ d: 14, m: 3, y: 2027 }, { d: 19, m: 3, y: 2027 })).toBe('14 – 19 Mar 2027')
    expect(opsegDatuma({ d: 28, m: 2, y: 2027 }, { d: 3, m: 3, y: 2027 })).toBe('28 Feb – 3 Mar 2027')
    expect(procenat(20)).toBe('20%')
    expect(odOd(96, 120)).toBe('96 / 120')
    expect(noci(5)).toBe('5 nights')
    expect(noci(1)).toBe('1 night')
  })
})
