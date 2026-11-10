import { describe, expect, it } from 'vitest'
import { efektivniRok, jeZiva, novaOpcija, osporiPrvu, pozicija, redOpcija, stanjeOpcije } from './opcije'
import type { Termin } from './tipovi'
import { istekao, preostaloSati } from './vreme'

const T: Termin = { priprema: ['2026-11-16'], snimanje: ['2026-11-17'] }
const TAJ_DRUGI: Termin = { priprema: [], snimanje: ['2026-12-20'] }

describe('rokovi opcije (72 h)', () => {
  const o = novaOpcija('o1', 'hala', 'delta', T, 10)
  it('na 71 h od postavljanja važi, na 72 h je istekla', () => {
    expect(stanjeOpcije(o, 10 + 71)).toBe('aktivna')
    expect(stanjeOpcije(o, 10 + 72)).toBe('istekla')
  })
  it('granica roka: ističe tačno kad je sada ≥ rok', () => {
    expect(istekao(72, 71)).toBe(false)
    expect(istekao(72, 72)).toBe(true)
    expect(preostaloSati(72, 100)).toBe(0)
  })
})

describe('osporavanje (24 h)', () => {
  const prva = novaOpcija('o1', 'loft', 'delta', T, 0)
  const druga = novaOpcija('o2', 'loft', 'sigma', T, 5)
  const osporeno = osporiPrvu([prva, druga], 'loft', T, 'sigma', 10)
  const p = osporeno[0]
  it('prva opcija dobija rok od 24 h od trenutka osporavanja', () => {
    expect(p.osporavanje).toEqual({ od: 'sigma', rok: 34 })
    expect(stanjeOpcije(p, 20)).toBe('osporena')
  })
  it('osporavanje skraćuje opciju: ističe posle 24 h iako bi 72 h još trajalo', () => {
    expect(efektivniRok(p)).toBe(34)
    expect(stanjeOpcije(p, 33)).toBe('osporena')
    expect(stanjeOpcije(p, 34)).toBe('istekla')
  })
  it('ne osporava sopstvenu opciju niti dva puta', () => {
    expect(osporiPrvu([prva], 'loft', T, 'delta', 10)[0].osporavanje).toBeNull()
    const jednom = osporiPrvu([prva, druga], 'loft', T, 'sigma', 10)
    expect(osporiPrvu(jednom, 'loft', T, 'sigma', 20)[0].osporavanje?.rok).toBe(34)
  })
})

describe('red opcija (prva / druga)', () => {
  const sigma = novaOpcija('o-s', 'hala', 'sigma', T, -6)
  const delta = novaOpcija('o-d', 'hala', 'delta', T, 0)
  it('prva je ranije postavljena; druga sledeća', () => {
    expect(pozicija([sigma, delta], sigma, 0)).toBe(1)
    expect(pozicija([sigma, delta], delta, 0)).toBe(2)
  })
  it('ista sekunda: ranije uneta je prva', () => {
    const a = novaOpcija('a', 'hala', 'sigma', T, 5)
    const b = novaOpcija('b', 'hala', 'delta', T, 5)
    expect(redOpcija([a, b], 'hala', T, 5).map((o) => o.id)).toEqual(['a', 'b'])
  })
  it('kad prva istekne, druga postaje prva', () => {
    // Sigmina ističe na 66 h
    const s = { ...sigma, vaziDo: 66 }
    expect(pozicija([s, delta], delta, 65)).toBe(2)
    expect(pozicija([s, delta], delta, 66)).toBe(1)
    expect(pozicija([s, delta], s, 66)).toBeNull()
  })
  it('kad prva odustane (otpusti), druga postaje prva', () => {
    const otpustena = { ...sigma, stanje: 'otpustena' as const }
    expect(jeZiva(otpustena, 0)).toBe(false)
    expect(pozicija([otpustena, delta], delta, 0)).toBe(1)
  })
  it('red se računa po lokaciji i terminu', () => {
    const drugaLok = novaOpcija('x', 'loft', 'sigma', T, -10)
    const drugiTermin = novaOpcija('y', 'hala', 'sigma', TAJ_DRUGI, -10)
    expect(pozicija([drugaLok, drugiTermin, delta], delta, 0)).toBe(1)
  })
})
