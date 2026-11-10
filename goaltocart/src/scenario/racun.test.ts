// B7.1 — svaki zbir iz UX.md 7 je jedan test.
import { describe, expect, it } from 'vitest'
import * as R from './racun'
import { BONUSI, RATE, SELL_ON_PCT, VERZIJE } from './uslovi'
import { broj, datumIso, eur, eurMinus, eurRazlika, pct, pctDecimal, poeni } from './format'

describe('fiksni deo i bonusi', () => {
  it('rate: 1,600,000 + 1,400,000 + 1,400,000 = 4,400,000', () => {
    expect(RATE[0] + RATE[1] + RATE[2]).toBe(4_400_000)
    expect(R.fiksniUkupno).toBe(4_400_000)
  })
  it('bonusi: 200,000 + 250,000 + 150,000 = 600,000; naslovna vrednost 5,000,000', () => {
    expect(BONUSI.map((b) => b.iznos)).toEqual([200_000, 250_000, 150_000])
    expect(R.bonusiUkupno).toBe(600_000)
    expect(R.naslovnaVrednost).toBe(5_000_000)
  })
  it('poslednja verzija ponude (v3) odgovara dogovorenim uslovima', () => {
    const v3 = VERZIJE[2]
    expect(v3.rate).toEqual(RATE)
    expect(v3.bonusiUkupno).toBe(R.bonusiUkupno)
    expect(v3.sellOnPct).toBe(SELL_ON_PCT)
  })
})

describe('udeo igrača, naknada, provizija', () => {
  it('udeli 80,000 + 70,000 + 70,000 = 220,000 = 5% x 4,400,000', () => {
    expect(R.udeoPoRati).toEqual([80_000, 70_000, 70_000])
    expect(R.udeoUkupno).toBe(220_000)
    expect(R.udeoUkupno).toBe((R.fiksniUkupno * 5) / 100)
  })
  it('udeli u bonusima 10,000 / 12,500 / 7,500', () => {
    expect(R.udeoPoBonusu).toEqual([10_000, 12_500, 7_500])
  })
  it('naknada platforme 22,000 = 2 x 11,000', () => {
    expect(R.naknadaUkupno).toBe(22_000)
    expect(R.naknadaPola).toBe(11_000)
    expect(R.naknadaPola * 2).toBe(R.naknadaUkupno)
  })
  it('provizija agenta 30,000 = 5% x 4 x 150,000', () => {
    expect(R.ugovorUkupno).toBe(600_000)
    expect(R.provizijaAgenta).toBe(30_000)
  })
  it('procenti su celi brojevi (nema decimala u iznosima)', () => {
    for (const x of [...R.udeoPoRati, ...R.udeoPoBonusu, R.naknadaUkupno, R.naknadaPola, R.provizijaAgenta]) {
      expect(Number.isInteger(x)).toBe(true)
    }
    expect(() => R.celiProcenat(333, 5)).toThrow()
  })
})

describe('korak 5 i 7: uplata i isplata', () => {
  it('uplata kupca 1,600,000 + 30,000 + 11,000 = 1,641,000', () => {
    expect(R.uplataKupca).toBe(1_641_000)
  })
  it('slap: 80,000 + 1,509,000 + 30,000 + 22,000 = 1,641,000', () => {
    expect(R.isplata).toEqual({ igrac: 80_000, naknada: 22_000, agent: 30_000, prodavacNeto: 1_509_000 })
    expect(R.isplataUkupno).toBe(1_641_000)
    expect(R.isplataUkupno).toBe(R.uplataKupca)
  })
})

describe('korak 8: finansiranje', () => {
  it('potraživanje 2 x 1,330,000 = 2,660,000', () => {
    expect(R.potrazivanjePoRati).toEqual([1_330_000, 1_330_000])
    expect(R.potrazivanje).toBe(2_660_000)
  })
  it('popust 125,000 (4.7% nominala)', () => {
    expect(R.avans).toBe(2_535_000)
    expect(R.popust).toBe(125_000)
    expect(R.popustPct.toFixed(1)).toBe('4.7')
  })
  it('prosečno dospeće 7 meseci i prinos zaokružen na 8.5%', () => {
    expect(R.dospecaMeseci).toEqual([4, 10])
    expect(R.prosecnoDospeceMeseci).toBe(7)
    expect(R.prinosZaPeriod.toFixed(2)).toBe('4.93')
    expect(pctDecimal(R.prinosGodisnje)).toBe('8.5%')
  })
  it('finansijer: plaća 2,535,000, prima 2,660,000, dobit 125,000', () => {
    expect(R.potrazivanje - R.avans).toBe(125_000)
  })
  it('neto prodavca 1,509,000 + 2,535,000 = 4,044,000 = 4,400,000 − 220,000 − 11,000 − 125,000', () => {
    expect(R.netoProdavca).toBe(4_044_000)
    expect(R.netoProveraIzRazlike).toBe(4_044_000)
  })
  it('povraćaj 1,641,000', () => {
    expect(R.povracaj).toBe(1_641_000)
  })
})

describe('verzije ponude', () => {
  it('v1 fiksno 4,000,000, v2 4,800,000, v3 4,400,000', () => {
    expect([0, 1, 2].map(R.fiksniVerzije)).toEqual([4_000_000, 4_800_000, 4_400_000])
  })
  it('razlike izvedene iz verzija', () => {
    expect(R.razlikaVerzija(0, 1)).toEqual({ fiksni: 800_000, bonusi: 100_000, sellOn: 10 })
    expect(R.razlikaVerzija(1, 2)).toEqual({ fiksni: -400_000, bonusi: 0, sellOn: -5 })
    expect(eurRazlika(R.razlikaVerzija(0, 1).fiksni)).toBe('+EUR 800,000')
    expect(eurRazlika(R.razlikaVerzija(1, 2).fiksni)).toBe('−EUR 400,000')
    expect(poeni(R.razlikaVerzija(1, 2).sellOn)).toBe('−5 pts')
  })
  it('rate svake verzije daju njen fiksni iznos', () => {
    for (const v of VERZIJE) expect(v.rate.reduce((a, b) => a + b, 0)).toBe(R.fiksniVerzije(v.broj - 1))
  })
})

describe('format', () => {
  it('EUR 4,400,000 sa zarezom i valutom ispred', () => {
    expect(eur(4_400_000)).toBe('EUR 4,400,000')
    expect(broj(999)).toBe('999')
    expect(broj(12_500)).toBe('12,500')
  })
  it('pravi znak minus za odbitke', () => {
    expect(eurMinus(80_000)).toBe('− EUR 80,000')
    expect(eurMinus(80_000)).not.toContain('-')
  })
  it('datum i procenat', () => {
    expect(datumIso('2027-06-23')).toBe('23 Jun 2027')
    expect(pct(15)).toBe('15%')
  })
})
