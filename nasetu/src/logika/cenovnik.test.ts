// ZLATNI TEST (dorada 2, F0): zaključava iznose koje je prototip pokazivao PRE doterivanja cenovnika.
// bez = 1 snimajući dan; sa = + 1 dan pripreme; dva = 2 snimajuća dana + 1 priprema + 2 prekovremena sata.
// Ako ovaj test pukne, promenila se cena koju vlasnik vidi — to mora biti namerno (vidi odluku O19 niže).
import { describe, expect, it } from 'vitest'
import { LOKACIJE } from '../podaci/lokacije'
import { osnovicaZaTermin } from './cenovnik'
import { izracunajNaknadu, type Razred } from './novac'

type Red = { bez: number; sa: number; dva: number; naknada: number } | null
const ZLATNO: Record<string, { cene: Partial<Record<Razred, number>>; prek: number; do10: Red; do30: Red; preko30: Red }> = {
  'industrijski-loft': { cene: {do10:54000,do30:60000}, prek: 7000, do10: { bez: 54000, sa: 81000, dva: 149000, naknada: 12150 }, do30: { bez: 60000, sa: 90000, dva: 164000, naknada: 13500 }, preko30: null },
  'vila-sa-bastom': { cene: {do10:81000,do30:90000,preko30:112500}, prek: 11000, do10: { bez: 81000, sa: 121500, dva: 224500, naknada: 18225 }, do30: { bez: 90000, sa: 135000, dva: 247000, naknada: 20250 }, preko30: { bez: 112500, sa: 168750, dva: 303250, naknada: 25313 } },
  'brutalisticka-hala': { cene: {do10:68000,do30:75000,preko30:93750}, prek: 9000, do10: { bez: 68000, sa: 102000, dva: 188000, naknada: 15300 }, do30: { bez: 75000, sa: 112500, dva: 205500, naknada: 16875 }, preko30: { bez: 93750, sa: 140625, dva: 252375, naknada: 21094 } },
  'kafic-retro': { cene: {do10:32000,do30:35000}, prek: 4000, do10: { bez: 32000, sa: 48000, dva: 88000, naknada: 7200 }, do30: { bez: 35000, sa: 52500, dva: 95500, naknada: 7875 }, preko30: null },
  'napusteni-magacin': { cene: {do10:36000,do30:40000,preko30:50000}, prek: 5000, do10: { bez: 36000, sa: 54000, dva: 100000, naknada: 8100 }, do30: { bez: 40000, sa: 60000, dva: 110000, naknada: 9000 }, preko30: { bez: 50000, sa: 75000, dva: 135000, naknada: 11250 } },
  'moderna-kancelarija': { cene: {do10:41000,do30:45000,preko30:56250}, prek: 5000, do10: { bez: 41000, sa: 61500, dva: 112500, naknada: 9225 }, do30: { bez: 45000, sa: 67500, dva: 122500, naknada: 10125 }, preko30: { bez: 56250, sa: 84375, dva: 150625, naknada: 12656 } },
  'foto-studio': { cene: {do10:27000,do30:30000}, prek: 4000, do10: { bez: 27000, sa: 40500, dva: 75500, naknada: 6075 }, do30: { bez: 30000, sa: 45000, dva: 83000, naknada: 6750 }, preko30: null },
  'stan-sedamdesete': { cene: {do10:25000}, prek: 3000, do10: { bez: 25000, sa: 37500, dva: 68500, naknada: 5625 }, do30: null, preko30: null },
  'hotelski-lobi': { cene: {do10:108000,do30:120000}, prek: 14000, do10: { bez: 108000, sa: 162000, dva: 298000, naknada: 24300 }, do30: { bez: 120000, sa: 180000, dva: 328000, naknada: 27000 }, preko30: null },
  'stara-fabrika': { cene: {do10:45000,do30:50000,preko30:62500}, prek: 6000, do10: { bez: 45000, sa: 67500, dva: 124500, naknada: 10125 }, do30: { bez: 50000, sa: 75000, dva: 137000, naknada: 11250 }, preko30: { bez: 62500, sa: 93750, dva: 168250, naknada: 14063 } },
}

const RAZREDI: Razred[] = ['do10', 'do30', 'preko30']

describe('zlatni iznosi: cene po veličini ekipe i osnovice', () => {
  it('svih 10 lokacija je pokriveno', () => {
    expect(LOKACIJE.map((l) => l.id).sort()).toEqual(Object.keys(ZLATNO).sort())
  })
  for (const l of LOKACIJE) {
    it(`${l.id}: cene dana, prekovremeni sat i osnovica bez pripreme su nepromenjeni`, () => {
      const z = ZLATNO[l.id]
      expect(l.cene).toEqual(z.cene)
      expect(l.prekovremeniSatCenti).toBe(z.prek)
      for (const r of RAZREDI) {
        const bez = osnovicaZaTermin(l, { snimanje: ['x'], priprema: [] }, r)
        expect(bez).toBe(z[r]?.bez ?? null)
      }
    })
    it(`${l.id}: osnovica i naknada sa danom pripreme`, () => {
      const z = ZLATNO[l.id]
      for (const r of RAZREDI) {
        const sa = osnovicaZaTermin(l, { snimanje: ['x'], priprema: ['y'] }, r)
        const dva = osnovicaZaTermin(l, { snimanje: ['x', 'y'], priprema: ['p'] }, r, 2)
        const zr = z[r]
        if (!zr) { expect(sa).toBeNull(); continue }
        // Odluka O19: dan pripreme je JEDNA cena po lokaciji (pola cene za 11–30 ljudi; za lokaciju do 10 — pola te cene)
        // i važi za sve veličine ekipe. Za 11–30 (i lokaciju samo do 10) iznosi su ISTI kao pre; za ekipu do 10 i preko 30
        // SA danom pripreme račun se menja (to nije u glavnoj priči: ona je 11–30 ljudi).
        const osnovaPripreme = (z.do30 ?? z.do10)!.bez
        const priprema = Math.round(osnovaPripreme / 2)
        expect(l.cenaPripremeCenti).toBe(priprema)
        const ocekivanoSa = zr.bez + priprema
        const ocekivanoDva = 2 * zr.bez + priprema + 2 * l.prekovremeniSatCenti
        if (r === 'do30' || !z.do30) {
          expect(sa).toBe(zr.sa)
          expect(dva).toBe(zr.dva)
        }
        expect(sa).toBe(ocekivanoSa)
        expect(dva).toBe(ocekivanoDva)
        expect(izracunajNaknadu(sa!).naknadaCenti).toBe(izracunajNaknadu(ocekivanoSa).naknadaCenti)
      }
    })
  }
})
