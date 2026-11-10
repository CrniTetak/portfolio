import { describe, expect, it } from 'vitest'
import { pocetnoStanje } from './scenario'
import { jeIspravnoStanje } from './validacija'

describe('provera sačuvanog stanja', () => {
  it('početno stanje je ispravno', () => expect(jeIspravnoStanje(pocetnoStanje())).toBe(true))
  it('odbacuje stari format, nedostajuća polja i smeće', () => {
    expect(jeIspravnoStanje({ ...pocetnoStanje(), verzija: 1 })).toBe(false)
    expect(jeIspravnoStanje({ ...pocetnoStanje(), zahtevi: undefined })).toBe(false)
    expect(jeIspravnoStanje({ ...pocetnoStanje(), uloga: 'hakerr' })).toBe(false)
    expect(jeIspravnoStanje({ ...pocetnoStanje(), sati: 'x' })).toBe(false)
    expect(jeIspravnoStanje(null)).toBe(false)
    expect(jeIspravnoStanje('x')).toBe(false)
  })
})

describe('provera stanja priče (dorada 3)', () => {
  const sa = (prica: object, ostalo: object = {}) => ({ ...pocetnoStanje(), ...ostalo, prica: { ...pocetnoStanje().prica, ...prica } })
  it('stari zapis (verzija 3, bez priče) se odbacuje', () => {
    expect(jeIspravnoStanje({ ...pocetnoStanje(), verzija: 3 })).toBe(false)
    expect(jeIspravnoStanje({ ...pocetnoStanje(), prica: undefined })).toBe(false)
  })
  it('račva otkaz sme samo na koraku 9', () => {
    expect(jeIspravnoStanje(sa({ korak: 5, odradjeno: 0, grana: 'otkaz' }))).toBe(false)
    expect(jeIspravnoStanje(sa({ korak: 9, odradjeno: 1, grana: 'otkaz' }))).toBe(true)
  })
  it('odrađeno ne sme preko broja radnji koraka', () => {
    expect(jeIspravnoStanje(sa({ korak: 2, odradjeno: 2 }))).toBe(false)
    expect(jeIspravnoStanje(sa({ korak: 5, odradjeno: 3 }))).toBe(true)
    expect(jeIspravnoStanje(sa({ korak: 9, odradjeno: 1, grana: 'vazi' }))).toBe(false)
    expect(jeIspravnoStanje(sa({ korak: 10 }))).toBe(false)
  })
  it('vođeni režim nema Admina ni odstupanja; slobodni sme', () => {
    expect(jeIspravnoStanje(sa({ rezim: 'vodjeno' }, { uloga: 'admin' }))).toBe(false)
    expect(jeIspravnoStanje(sa({ rezim: 'vodjeno', odstupljeno: true }))).toBe(false)
    expect(jeIspravnoStanje(sa({ rezim: 'slobodno', odstupljeno: true }, { uloga: 'admin' }))).toBe(true)
    expect(jeIspravnoStanje(sa({ rezim: 'cudno' }))).toBe(false)
  })
})
