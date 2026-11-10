// Pretraga (PLAN B4.5): kvačice, ćirilica, sinonimi, više reči, prazno, 40 znakova, specijalni znakovi; pretraga ne menja stanje.
import { describe, expect, it } from 'vitest'
import { svet } from '../scenario/svet'
import { POCETNI_TOKOVI } from '../tokovi/tokovi'
import { normalizuj, NAJVISE_ZNAKOVA } from './normalizuj'
import { odgovara, odgovaraTekstu, ogranici, pretrazi } from './pretrazi'
import { GOTOVI_UPITI } from './sinonimi'

const S1 = svet({ korak: 1, n: 0, grana: 'lanac' })
const S2 = svet({ korak: 2, n: 3, grana: 'lanac' })
const naslovi = (upit: string, s = S1) => pretrazi(s.oglasi, upit).map((o) => o.naslov)

describe('normalizacija', () => {
  it('kvačice, mala slova, interpunkcija', () => {
    expect(normalizuj('Dečji BICIKL!')).toBe('decji bicikl')
    expect(normalizuj('  šećer,  žito ')).toBe('secer zito')
    expect(normalizuj('Đorđe')).toBe('dorde')
    expect(normalizuj('djordje')).toBe('dorde')
  })
  it('ćirilica → latinica', () => {
    expect(normalizuj('бицикл')).toBe('bicikl')
    expect(normalizuj('Дечји бицикл')).toBe('decji bicikl')
    expect(normalizuj('џак шљива')).toBe('dzak sljiva')
  })
})

describe('pretraga', () => {
  it('bez kvačica nalazi sa kvačicama', () => {
    expect(naslovi('udzbenici')).toContain('Udžbenici za 3. razred (komplet od 5)')
    expect(naslovi('kruska')).toContain('Kruška abate fetel, 5 kg')
  })
  it('ćirilica', () => {
    expect(naslovi('бицикл').length).toBeGreaterThan(5)
    expect(naslovi('бицикл')).toEqual(naslovi('bicikl'))
  })
  it('sinonimi: bajs → bicikl, jabuka → jabuke', () => {
    expect(naslovi('bajs').length).toBeGreaterThan(5)
    expect(naslovi('jabuka').length).toBeGreaterThan(0)
  })
  it('PS2 / plejstejšn: Anin PlayStation 2 se nalazi tek kad je objavljen (korak 2)', () => {
    expect(naslovi('ps2', S1)).not.toContain('PlayStation 2 sa igrama')
    expect(naslovi('ps2', S2)).toContain('PlayStation 2 sa igrama')
    expect(naslovi('plejstejšn', S2)).toContain('PlayStation 2 sa igrama')
  })
  it('više reči: sve moraju da odgovaraju', () => {
    const r = naslovi('dečji bicikl')
    expect(r.length).toBeGreaterThan(0)
    expect(r.every((n) => /bicikl/i.test(n))).toBe(true)
    expect(naslovi('bicikl knjige')).toEqual([])
  })
  it('počeci reči: „bicikl“ nalazi „bicikla“ (Mali servis bicikla)', () => {
    expect(naslovi('bicikl')).toContain('Mali servis bicikla')
  })
  it('pretraga po kategoriji, opštini i vrsti', () => {
    expect(naslovi('knjige').length).toBeGreaterThan(10)
    expect(naslovi('zvezdara').length).toBeGreaterThan(3)
    expect(naslovi('ideja').length).toBe(12)
  })
  it('prazan upit i razmaci nemaju rezultata', () => {
    expect(naslovi('')).toEqual([])
    expect(naslovi('   ')).toEqual([])
    expect(naslovi('!!!')).toEqual([])
  })
  it('upit se skraćuje na 40 znakova', () => {
    expect(ogranici('x'.repeat(100)).length).toBe(NAJVISE_ZNAKOVA)
    expect(naslovi('bicikl ' + 'a'.repeat(100))).toEqual([])
  })
  it('specijalni znakovi ne kvare pretragu i ne daju lažne rezultate', () => {
    for (const upit of ['<script>alert(1)</script>', '"; --', '%', '.*', '(bicikl', 'bicikl\\']) {
      expect(() => pretrazi(S1.oglasi, upit)).not.toThrow()
    }
    expect(naslovi('<')).toEqual([])
    expect(naslovi('%')).toEqual([])
    expect(naslovi('.*')).toEqual([])
    expect(naslovi('(bicikl').length).toBeGreaterThan(5)
  })
  it('šest gotovih upita daje rezultate', () => {
    expect(GOTOVI_UPITI.length).toBe(6)
    for (const u of GOTOVI_UPITI) expect(naslovi(u).length, u).toBeGreaterThan(0)
  })
  it('istaknuti oglasi (najviše 2, naslov ili opis odgovara upitu) idu prvi', () => {
    const r = pretrazi(S1.oglasi, 'bicikl')
    const pogodak = (o: (typeof r)[number]) => !!o.istaknuto && odgovaraTekstu(o, 'bicikl')
    const istaknutiPrvi = r.slice(0, 2).filter(pogodak).length
    const ukupnoIstaknutih = Math.min(2, r.filter(pogodak).length)
    expect(istaknutiPrvi).toBe(ukupnoIstaknutih)
  })
  it('pretraga ne menja stanje: ista ulazna lista, ista pozicija', () => {
    const pre = JSON.stringify(S1.oglasi.map((o) => o.id))
    pretrazi(S1.oglasi, 'bicikl')
    expect(JSON.stringify(S1.oglasi.map((o) => o.id))).toBe(pre)
    expect(svet({ korak: 1, n: 0, grana: 'lanac' }, POCETNI_TOKOVI).ukupno.ukupno).toBe(225)
  })
  it('brojač rezultata = broj kartica (dužina liste)', () => {
    const r = pretrazi(S1.oglasi, 'bicikl')
    expect(r.length).toBe(S1.oglasi.filter((o) => odgovara(o, 'bicikl')).length)
  })
})
