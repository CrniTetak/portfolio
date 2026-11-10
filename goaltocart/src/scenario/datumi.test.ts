// Datumi priče: radni dani, usklađene kopije, tačno kašnjenje; skraćeni prikaz rata.
import { describe, expect, it } from 'vitest'
import { DATUM, datumKoraka } from './datumi'
import { datumIso, nizRataKratko } from './format'
import { SPOREDNI_KUPAC, SPOREDNI_PRODAVAC } from './strane'
import { DATUMI_RATA, DATUMI_RATA_ISO, VERZIJE } from './uslovi'

const MESECI = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const parsiraj = (s: string) => {
  const [d, m, g] = s.replace(',', '').split(' ')
  return Date.UTC(Number(g), MESECI.indexOf(m), Number(d))
}
const danUNedelji = (s: string) => new Date(parsiraj(s)).getUTCDay() // 0 = nedelja, 6 = subota

describe('skraćeni prikaz rata (telefon) je tačan', () => {
  it('1,250,000 se ne zaokružuje na 1.3', () => {
    expect(nizRataKratko([1_500_000, 1_250_000, 1_250_000])).toBe('1.5 / 1.25 / 1.25 M')
    expect(nizRataKratko([1_600_000, 1_400_000, 1_400_000])).toBe('1.6 / 1.4 / 1.4 M')
    expect(nizRataKratko([1_800_000, 1_500_000, 1_500_000])).toBe('1.8 / 1.5 / 1.5 M')
  })
})

describe('datumi priče padaju na radne dane', () => {
  const svi: string[] = []
  for (const grana of ['approved', 'rejected'] as const) {
    for (let k = 1; k <= 9; k++) svi.push(datumKoraka(k, grana).pocetak, datumKoraka(k, grana).kraj)
  }
  svi.push(...DATUMI_RATA, ...Object.values(DATUM).filter((x) => /\d{4}$/.test(x)))

  it('nijedan datum nije subota ili nedelja', () => {
    for (const s of new Set(svi)) expect([0, 6], s).not.toContain(danUNedelji(s))
  })
  it('verzije ponude su radnim danima', () => {
    for (const v of VERZIJE) expect([0, 6], v.datum).not.toContain(danUNedelji(v.datum))
  })
  it('kopije datuma se slažu: tekst rata = ISO rata = imenovani datumi = datumi koraka', () => {
    DATUMI_RATA_ISO.forEach((iso, i) => expect(DATUMI_RATA[i]).toBe(datumIso(iso)))
    expect(DATUM.rata2).toBe(DATUMI_RATA[1])
    expect(DATUM.rata3).toBe(DATUMI_RATA[2])
    expect(datumKoraka(8, 'approved').kraj).toBe(DATUM.rata2)
    expect(datumKoraka(9, 'approved').pocetak).toBe(DATUM.kasnjenje14)
    expect(datumKoraka(9, 'approved').kraj).toBe(DATUM.kasnjenje28)
  })
  it('kašnjenje rate 3 je tačno 14 i 28 dana', () => {
    expect((parsiraj(DATUM.kasnjenje14) - parsiraj(DATUM.rata3)) / 86_400_000).toBe(14)
    expect((parsiraj(DATUM.kasnjenje28) - parsiraj(DATUM.rata3)) / 86_400_000).toBe(28)
  })
  it('sporedni transferi imaju relativne rokove (ne datume koji bi ostali u prošlosti)', () => {
    for (const t of [...SPOREDNI_PRODAVAC, ...SPOREDNI_KUPAC]) expect(t.rok, t.id).not.toMatch(/\d{4}/)
  })
  it('vreme isteka ponude je u letnjem vremenu (CEST)', () => {
    expect(DATUM.ponudaIsticeVreme).toContain('CEST')
  })
})
