import { describe, expect, it } from 'vitest'
import {
  brutoNeto, cenaZaVelikuEkipu, centiIzPara, deoPartnera, eur, eurKratko, eurOrijentaciono, izracunajNaknadu, izracunajOsnovicu,
  obracunPredracuna, obracunZaProdukciju, rsdPara, uPare,
} from './novac'

const loft = { cenaDanaCenti: 60000, snimajuciDani: 1, daniPripreme: 1 }

describe('osnovica', () => {
  it('loft: 1 dan + 1 dan pripreme = 600 + 300 = 900 €', () => {
    expect(izracunajOsnovicu(loft)).toBe(90000)
  })
  it('dan pripreme košta pola cene (podrazumevano)', () => {
    expect(izracunajOsnovicu({ ...loft, snimajuciDani: 2, daniPripreme: 2 })).toBe(180000)
  })
  it('eksplicitna cena pripreme (jedna po lokaciji) pregazi podrazumevanu', () => {
    expect(izracunajOsnovicu({ ...loft, cenaPripremeCenti: 20000 })).toBe(80000)
  })
  it('prekovremeni sati ulaze u osnovicu', () => {
    expect(izracunajOsnovicu({ ...loft, prekovremeniSati: 2, cenaPrekovremenogSataCenti: 10000 })).toBe(110000)
  })
  it('ekipa preko 30 je skuplja za 25%', () => {
    expect(cenaZaVelikuEkipu(60000)).toBe(75000)
  })
  it('neispravan ulaz baca grešku', () => {
    expect(() => izracunajOsnovicu({ ...loft, snimajuciDani: 0 })).toThrow()
    expect(() => izracunajOsnovicu({ ...loft, snimajuciDani: -1 })).toThrow()
    expect(() => izracunajOsnovicu({ ...loft, cenaDanaCenti: NaN })).toThrow()
    expect(() => izracunajOsnovicu({ ...loft, cenaPripremeCenti: -1 })).toThrow()
  })
})

describe('naknada (15%, najmanje 40 €)', () => {
  it('900 € → 135,00 €', () => {
    const n = izracunajNaknadu(90000)
    expect(n.naknadaCenti).toBe(13500)
    expect(n.primenjenMinimum).toBe(false)
  })
  it('250 € → 15% je 37,50 €, primenjuje se najmanji iznos 40,00 €', () => {
    const n = izracunajNaknadu(25000)
    expect(n.naknadaCenti).toBe(4000)
    expect(n.primenjenMinimum).toBe(true)
  })
  it('granica oko 266,67 €', () => {
    expect(izracunajNaknadu(26666).naknadaCenti).toBe(4000)
    expect(izracunajNaknadu(26667).naknadaCenti).toBe(4000)
    expect(izracunajNaknadu(26700).naknadaCenti).toBe(4005)
  })
  it('osnovica 0 ili negativna daje grešku', () => {
    expect(() => izracunajNaknadu(0)).toThrow()
    expect(() => izracunajNaknadu(-5)).toThrow()
  })
})

describe('dinari: preračun po kursu zapisanom na predračunu i zaokruživanje', () => {
  it('135 € × 117 = 15.795,00 RSD (iznos u parama)', () => {
    expect(uPare(13500)).toBe(1579500)
    expect(rsdPara(uPare(13500))).toBe('15.795,00 RSD')
  })
  it('45 € = 5.265,00 RSD (primer iz zahteva)', () => {
    expect(rsdPara(uPare(4500, 117))).toBe('5.265,00 RSD')
  })
  it('najmanja jedinica: 1 cent = 1,17 RSD', () => {
    expect(uPare(1, 117)).toBe(117)
    expect(rsdPara(117)).toBe('1,17 RSD')
  })
  it('necelobrojni kurs se zaokružuje na paru, jednom na ukupnom iznosu', () => {
    expect(uPare(13500, 117.1724)).toBe(Math.round(13500 * 117.1724))
    expect(Number.isInteger(uPare(1234, 117.1724))).toBe(true)
    // ukupno zaokruženo jednom, a ne red po red
    expect(uPare(1234 + 4321, 117.1724)).toBe(Math.round((1234 + 4321) * 117.1724))
  })
  it('format: tačka za hiljade, zarez za decimale, uvek dve decimale, negativan iznos sa minusom', () => {
    expect(rsdPara(0)).toBe('0,00 RSD')
    expect(rsdPara(5)).toBe('0,05 RSD')
    expect(rsdPara(123456789)).toBe('1.234.567,89 RSD')
    expect(rsdPara(-1579500)).toBe('−15.795,00 RSD')
  })
  it('evro ispod dinara je "orijentaciono"', () => {
    expect(eurOrijentaciono(13500)).toBe('≈ 135,00 € (orijentaciono)')
    expect(centiIzPara(1579500, 117)).toBe(13500)
  })
  it('37,50 € se vidi tačno (ne zaokružuje na 38)', () => {
    expect(eur(3750)).toBe('37,50 €')
    expect(eur(13500)).toBe('135,00 €')
    expect(eur(123456789)).toBe('1.234.567,89 €')
    expect(eurKratko(60000)).toBe('600 €')
  })
})

describe('predračun: N − U + D (naknada, izbor van kataloga, domaćin)', () => {
  const ulaz = { osnovicaCenti: 90000, kreditCenti: 0, snimajuciDani: 1, domacin: false }
  it('bez usluga: 900 € → 135,00 € / 15.795,00 RSD', () => {
    const o = obracunPredracuna(ulaz)
    expect(o.ukupnoCenti).toBe(13500)
    expect(rsdPara(uPare(o.ukupnoCenti))).toBe('15.795,00 RSD')
  })
  it('plaćeni izbor (50 €) i domaćin: 135 − 50 + 70 = 155,00 € / 18.135,00 RSD', () => {
    const o = obracunPredracuna({ ...ulaz, kreditCenti: 5000, domacin: true })
    expect(o.umanjenjeCenti).toBe(5000)
    expect(o.domacinCenti).toBe(7000)
    expect(o.ukupnoCenti).toBe(15500)
    expect(rsdPara(uPare(o.ukupnoCenti))).toBe('18.135,00 RSD')
  })
  it('naknada 40 € (najmanje) − 50 € ne ide ispod 0; razlika od 10 € se ne vraća; domaćin se i dalje plaća', () => {
    const o = obracunPredracuna({ osnovicaCenti: 25000, kreditCenti: 5000, snimajuciDani: 1, domacin: true })
    expect(o.naknadaCenti).toBe(4000)
    expect(o.umanjenjeCenti).toBe(4000)
    expect(o.nepokrivenKreditCenti).toBe(1000)
    expect(o.ukupnoCenti).toBe(7000)
  })
  it('kad kredit pokriva celu naknadu a nema domaćina, iznos je 0, nikad negativan', () => {
    expect(obracunPredracuna({ osnovicaCenti: 25000, kreditCenti: 5000, snimajuciDani: 1, domacin: false }).ukupnoCenti).toBe(0)
  })
  it('domaćin se računa po snimajućem danu (2 dana = 140 €) i nije deo osnovice za 15%', () => {
    const sa = obracunPredracuna({ ...ulaz, snimajuciDani: 2, domacin: true })
    const bez = obracunPredracuna({ ...ulaz, snimajuciDani: 2, domacin: false })
    expect(sa.domacinCenti).toBe(14000)
    expect(sa.naknadaCenti).toBe(bez.naknadaCenti)
  })
  it('kredit se ne primenjuje na domaćina', () => {
    expect(obracunPredracuna({ ...ulaz, kreditCenti: 5000, domacin: true }).domacinCenti).toBe(7000)
  })
})

describe('partner: 20% naknade Nasetua', () => {
  it('naknada 90 € → deo partnera 18 €', () => {
    expect(deoPartnera(9000)).toBe(1800)
    expect(eur(deoPartnera(9000))).toBe('18,00 €')
  })
})

describe('bruto / neto za vlasnika', () => {
  it('pravno lice: neto = bruto', () => {
    expect(brutoNeto(100000, 'pravno')).toEqual({ brutoCenti: 100000, porezCenti: 0, netoCenti: 100000 })
  })
  it('fizičko lice: 1.000 € → neto 850 €', () => {
    const r = brutoNeto(100000, 'fizicko')
    expect(r.porezCenti).toBe(15000)
    expect(r.netoCenti).toBe(85000)
  })
  it('A4: primer 300 € → porez po odbitku 45 € → vlasniku 255 € (fizičko lice)', () => {
    const o = obracunZaProdukciju(30000, 'fizicko')
    expect(o.porezCenti).toBe(4500)
    expect(o.netoCenti).toBe(25500)
    expect(o.vlasnikIzdajeFakturu).toBe(false)
  })
  it('A4: vlasnik firma izdaje fakturu na punu cenu', () => {
    const o = obracunZaProdukciju(30000, 'pravno')
    expect(o.porezCenti).toBe(0)
    expect(o.netoCenti).toBe(30000)
    expect(o.vlasnikIzdajeFakturu).toBe(true)
  })
})
