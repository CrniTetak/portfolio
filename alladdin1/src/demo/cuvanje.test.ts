import { describe, expect, it } from 'vitest'
import { brojRadnji } from '../prica/koraci'
import { KLJUC, POCETNO, posleRestarta, proveri, ucitaj, upisi } from './cuvanje'

const dobro = { v: 1, poz: { korak: 5, n: 2, ishod: 'A' }, rezim: 'free', potvrda18: true, poruke: { slobodno: true } }
const lazno = (zapis: unknown) => ({ getItem: () => JSON.stringify(zapis), setItem: () => {} })

describe('čuvanje stanja', () => {
  it('ispravan zapis se prihvata', () => {
    expect(proveri(dobro)?.poz).toEqual({ korak: 5, n: 2, ishod: 'A' })
  })
  it('odbacuje staru verziju', () => {
    expect(proveri({ ...dobro, v: 0 })).toBeNull()
  })
  it('odbacuje ishod C na koraku 3', () => {
    expect(proveri({ ...dobro, poz: { korak: 3, n: 0, ishod: 'C' } })).toBeNull()
  })
  it('odbacuje nedozvoljene vrednosti', () => {
    expect(proveri({ ...dobro, poz: { korak: 10, n: 0, ishod: 'A' } })).toBeNull()
    expect(proveri({ ...dobro, poz: { korak: 5, n: 99, ishod: 'A' } })).toBeNull()
    expect(proveri({ ...dobro, poz: { korak: 5, n: -1, ishod: 'A' } })).toBeNull()
    expect(proveri({ ...dobro, rezim: 'x' })).toBeNull()
    expect(proveri({ ...dobro, potvrda18: 'da' })).toBeNull()
    expect(proveri(null)).toBeNull()
    expect(proveri('tekst')).toBeNull()
  })
  it('prihvata ishod B/C od koraka 7 i najveće n', () => {
    expect(proveri({ ...dobro, poz: { korak: 7, n: brojRadnji(7, 'B'), ishod: 'B' } })).not.toBeNull()
  })
  it('neispravan zapis daje početak, ne grešku', () => {
    expect(ucitaj(lazno({ v: 1, poz: 'x' }))).toEqual(POCETNO)
    expect(ucitaj({ getItem: () => '{pokvareno', setItem: () => {} })).toEqual(POCETNO)
    expect(ucitaj(null)).toEqual(POCETNO)
  })
  it('upis i čitanje daju isto', () => {
    const m = new Map<string, string>()
    const sk = { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v) }
    const s = { ...POCETNO, rezim: 'free' as const, potvrda18: true }
    upisi(s, sk)
    expect(m.has(KLJUC)).toBe(true)
    expect(ucitaj(sk)).toEqual(s)
  })
  it('Restart: briše priču (korak 1, ishod A), a ostaju režim, potvrda 18+ i viđene poruke', () => {
    const pre = { ...POCETNO, poz: { korak: 8, n: 1, ishod: 'B' as const }, rezim: 'free' as const, potvrda18: true, poruke: { slobodno: true } }
    const posle = posleRestarta(pre)
    expect(posle.poz).toEqual({ korak: 1, n: 0, ishod: 'A' })
    expect(posle.rezim).toBe('free')
    expect(posle.potvrda18).toBe(true)
    expect(posle.poruke.slobodno).toBe(true)
  })
})
