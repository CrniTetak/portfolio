import { describe, expect, it } from 'vitest'
import { dodajOperaciju, ocistiStavkePrice, POCETNI_SLOJ, vazecePretplate } from './slobodno'

const jePaket = (id: string) => id.startsWith('paket-')
const prazno = { kanali: [], paketi: [] }

describe('slobodni sloj (B4.4)', () => {
  it('pretplata i otkaz se primenjuju redom nad osnovom iz priče', () => {
    let s = dodajOperaciju(POCETNI_SLOJ, { tip: 'pretplati', proizvod: 'arena' })
    s = dodajOperaciju(s, { tip: 'pretplati', proizvod: 'paket-film' })
    expect(vazecePretplate(prazno, s, jePaket)).toEqual({ kanali: ['arena'], paketi: ['paket-film'] })
    s = dodajOperaciju(s, { tip: 'otkazi', proizvod: 'arena' })
    expect(vazecePretplate({ kanali: ['arena'], paketi: [] }, s, jePaket).kanali).toEqual([])
  })
  it('otkaz stavke iz priče skida osnovu; ponovljena operacija se ne duplira', () => {
    const s = dodajOperaciju(dodajOperaciju(POCETNI_SLOJ, { tip: 'otkazi', proizvod: 'doma' }), { tip: 'otkazi', proizvod: 'doma' })
    expect(s.operacije).toHaveLength(1)
    expect(vazecePretplate({ kanali: ['doma'], paketi: [] }, s, jePaket).kanali).toEqual([])
  })
  it('navigacija priče briše operacije nad stavkama priče i ručnu zemlju; ostale operacije i podešavanja ostaju', () => {
    let s = dodajOperaciju(dodajOperaciju(POCETNI_SLOJ, { tip: 'pretplati', proizvod: 'doma' }), { tip: 'pretplati', proizvod: 'arena' })
    s = { ...s, zemlja: 'RS', titlovi: false }
    const c = ocistiStavkePrice(s, ['doma', 'paket-srbija'])
    expect(c.operacije).toEqual([{ tip: 'pretplati', proizvod: 'arena' }])
    expect(c.zemlja).toBeNull()
    expect(c.titlovi).toBe(false)
  })
  it('Restart (početni sloj) je prazan', () => {
    expect(POCETNI_SLOJ.operacije).toEqual([])
    expect(POCETNI_SLOJ.zemlja).toBeNull()
  })
})
