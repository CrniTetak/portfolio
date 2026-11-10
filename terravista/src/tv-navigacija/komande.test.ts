import { describe, expect, it } from 'vitest'
import { komandaIzTastera } from './komande'
import { NAJVISE_U_STEKU, ocisti, skini, stavi } from './stek'

describe('komande (tastatura i daljinski idu kroz jednu komandu)', () => {
  it('strelice, Enter, Backspace, Esc', () => {
    expect(komandaIzTastera({ key: 'ArrowUp' })).toBe('gore')
    expect(komandaIzTastera({ key: 'ArrowDown' })).toBe('dole')
    expect(komandaIzTastera({ key: 'ArrowLeft' })).toBe('levo')
    expect(komandaIzTastera({ key: 'ArrowRight' })).toBe('desno')
    expect(komandaIzTastera({ key: 'Enter' })).toBe('ok')
    expect(komandaIzTastera({ key: 'Backspace' })).toBe('nazad')
    expect(komandaIzTastera({ key: 'Escape' })).toBe('nazad')
  })
  it('tasteri pravih daljinskih: Nazad (kodovi 10009 i 461, imena GoBack/BrowserBack)', () => {
    expect(komandaIzTastera({ key: 'Unidentified', keyCode: 10009 })).toBe('nazad')
    expect(komandaIzTastera({ key: 'Unidentified', keyCode: 461 })).toBe('nazad')
    expect(komandaIzTastera({ key: 'GoBack' })).toBe('nazad')
    expect(komandaIzTastera({ key: 'BrowserBack' })).toBe('nazad')
  })
  it('ostali tasteri se ignorišu (slova, razmak, Tab, Delete)', () => {
    for (const key of ['a', ' ', 'Tab', 'Delete', 'F5', 'Shift']) expect(komandaIzTastera({ key })).toBeNull()
  })
})

describe('stek „Nazad“', () => {
  it('stavi/skini radi kao stek', () => {
    let s: string[] = []
    s = stavi(s, '/tv/pocetna')
    s = stavi(s, '/tv/kanali')
    const [ostatak, vrh] = skini(s)
    expect(vrh).toBe('/tv/kanali')
    expect(ostatak).toEqual(['/tv/pocetna'])
  })
  it('prazan stek vraća null', () => {
    expect(skini([])).toEqual([[], null])
  })
  it('ne duplira vrh i ograničava veličinu', () => {
    expect(stavi(['/tv/pocetna'], '/tv/pocetna')).toEqual(['/tv/pocetna'])
    let s: string[] = []
    for (let i = 0; i < NAJVISE_U_STEKU + 20; i++) s = stavi(s, `/tv/kanal/${i}`)
    expect(s).toHaveLength(NAJVISE_U_STEKU)
    expect(s[s.length - 1]).toBe(`/tv/kanal/${NAJVISE_U_STEKU + 19}`)
  })
  it('ocisti odbacuje neispravan zapis', () => {
    expect(ocisti('nije niz')).toEqual([])
    expect(ocisti(['/tv/pocetna', 5, '/uvod', '/tvx', 'javascript:alert(1)', '/tv'])).toEqual(['/tv/pocetna', '/tv'])
  })
})
