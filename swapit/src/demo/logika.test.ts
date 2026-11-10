// DORADA PK1, PK2, PK11, PK12: čista logika stanja demoa (izvedi / Nazad / skok / ulaz / Restart) bez pregledača.
import { describe, expect, it } from 'vitest'
import { ciljBack, ciljSkok, odigraj } from '../prica/navigacija'
import { radnjeKoraka } from '../prica/koraci'
import type { Poz } from '../prica/tipovi'
import { svet } from '../scenario/svet'
import { POCETNI_TOKOVI } from '../tokovi/tokovi'
import { POCETNO, posleRestarta, type Sacuvano } from './cuvanje'
import { imaNapredak, poIzvedi, poPostavi, poUlazu } from './logika'

const na = (poz: Poz, ostalo: Partial<Sacuvano> = {}): Sacuvano => ({ ...POCETNO, poz, ...ostalo })

describe('PK1: automatske radnje štikliraju svoje kvačice', () => {
  it('Marko 7.c2 → Anine automatske radnje 7.d1–7.z4 odrađene, a D2 i Z3 imaju štiklirane kvačice', () => {
    let x = na({ korak: 7, n: 0, grana: 'lanac' })
    x = poIzvedi(x, '7.x8', 'marko')!
    x = poIzvedi(x, '7.c2', 'marko')!
    expect(x.poz).toEqual({ korak: 7, n: 6, grana: 'lanac' })
    expect(x.saglasnosti.d2_uslovi).toBe(true)
    expect(x.saglasnosti.z3_odmah_dostava).toBe(true)
  })
  it('radnja koja nije na redu ili nije za taj ugao se odbija (null) i ništa ne menja', () => {
    const x = na({ korak: 7, n: 0, grana: 'lanac' })
    expect(poIzvedi(x, '7.c2', 'marko')).toBeNull() // prvo 7.x8
    expect(poIzvedi(x, '7.x8', 'prodavnica')).toBeNull() // pogrešan ugao
  })
  it('radnja koju gledalac sam izvodi ne štiklira tuđe kvačice', () => {
    let x = na({ korak: 1, n: 0, grana: 'lanac' })
    x = poIzvedi(x, '1.r2', 'ana')!
    expect(x.saglasnosti).toEqual({})
    x = poIzvedi(x, '1.r3', 'ana')!
    expect(x.saglasnosti).toMatchObject({ r3_punoletstvo: true, r3_uslovi: true })
  })
})

describe('PK2: Nazad i skok unazad skidaju kvačice koje pripadaju radnjama ispred', () => {
  it('posle Nazad na početak koraka 4 „Razumem“ nije štiklirano (Pošalji ponudu je opet blokirano)', () => {
    const x = na({ korak: 4, n: 2, grana: 'lanac' }, { saglasnosti: { r3_punoletstvo: true, r3_uslovi: true, x1_izbor: true, x2_razumem: true } })
    const nazad = poPostavi(x, ciljBack(x.poz))
    expect(nazad.poz).toEqual({ korak: 4, n: 0, grana: 'lanac' })
    expect(nazad.saglasnosti.x2_razumem).toBeUndefined()
    expect(nazad.saglasnosti.x1_izbor).toBeUndefined()
    expect(nazad.saglasnosti.r3_uslovi).toBe(true) // korak 1 je i dalje odrađen
  })
  it('skok na korak 2 skida kvačice koraka 4, a ostavlja korak 1', () => {
    const x = na({ korak: 7, n: 6, grana: 'lanac' }, { saglasnosti: { r3_uslovi: true, x2_razumem: true, d2_uslovi: true } })
    const s = poPostavi(x, ciljSkok(x.poz, 2).poz)
    expect(Object.keys(s.saglasnosti).sort()).toEqual(['r3_punoletstvo', 'r3_uslovi'])
  })
  it('kvačice slobodnih tokova (van priče) se čuvaju', () => {
    const x = na({ korak: 4, n: 2, grana: 'lanac' }, { saglasnosti: { x2_razumem: true, z3_odmah_isticanje: true, x8_telefon: true } })
    const s = poPostavi(x, { korak: 2, n: 0, grana: 'lanac' })
    expect(s.saglasnosti).toMatchObject({ z3_odmah_isticanje: true, x8_telefon: true })
    expect(s.saglasnosti.x2_razumem).toBeUndefined()
  })
})

describe('PK11 i PK15: ulaz u demo, Restart i napredak', () => {
  it('prvi ulaz nema napretka (bez potvrde); usred priče ili posle probe ima', () => {
    expect(imaNapredak(POCETNO)).toBe(false)
    expect(imaNapredak(na({ korak: 3, n: 0, grana: 'lanac' }))).toBe(true)
    expect(imaNapredak(na({ korak: 1, n: 0, grana: 'lanac' }, { saglasnosti: { r3_uslovi: true } }))).toBe(true)
    expect(imaNapredak(na({ korak: 1, n: 0, grana: 'lanac' }, { tokovi: { ...POCETNI_TOKOVI, omiljeno: ['markov-bicikl'] } }))).toBe(true)
  })
  it('„Uđi u demo“ čisti isto što i Restart (priča, kvačice, tokovi), a menja režim', () => {
    const pre = na({ korak: 7, n: 6, grana: 'poeni' }, { saglasnosti: { d2_uslovi: true }, tokovi: { ...POCETNI_TOKOVI, omiljeno: ['markov-bicikl'] }, tema: 'tamna' })
    const { stanje, ekran } = poUlazu(pre, 'ana', 'vodjena')
    expect(stanje.poz).toEqual({ korak: 1, n: 0, grana: 'lanac' })
    expect(stanje.saglasnosti).toEqual({})
    expect(stanje.tokovi.omiljeno).toEqual([])
    expect(stanje.tema).toBe('tamna')
    expect(ekran).toBe('R2')
    expect(imaNapredak(stanje)).toBe(false)
  })
  it('slobodan ulaz kreće sa kraja koraka 1 (Ana verifikovana, 20 poena) i kvačicama koje to podrazumeva', () => {
    const { stanje, ekran } = poUlazu(POCETNO, 'marko', 'slobodno')
    expect(stanje.rezim).toBe('slobodno')
    expect(stanje.poz).toEqual({ korak: 1, n: 3, grana: 'lanac' })
    expect(stanje.saglasnosti).toMatchObject({ r3_punoletstvo: true, r3_uslovi: true })
    expect(ekran).toBe('P1')
    expect(svet(stanje.poz).korisnici['ana_zvz84']).toMatchObject({ verifikovan: true, poeni: 20 })
  })
  it('Restart vraća korak 1 i briše sve, a režim, temu i viđene poruke ostavlja', () => {
    const pre = na({ korak: 6, n: 2, grana: 'poeni' }, { rezim: 'slobodno', tema: 'tamna', poruke: { slobodno: true }, saglasnosti: { r3_uslovi: true } })
    const posle = posleRestarta(pre)
    expect(posle).toMatchObject({ poz: { korak: 1, n: 0, grana: 'lanac' }, saglasnosti: {}, rezim: 'slobodno', tema: 'tamna', poruke: { slobodno: true } })
  })
})

describe('PK12: klik po klik račve 6R–8R kroz pravi ugao daje isto što i skok', () => {
  it('svaka radnja se izvodi uglom koji je izvodi; automatske (Jovana, drugi ugao) se odigraju same', () => {
    let x = poPostavi(na({ korak: 1, n: 0, grana: 'lanac' }), { korak: 6, n: 0, grana: 'poeni' })
    expect(x.poz).toEqual({ korak: 6, n: 0, grana: 'poeni' })
    for (let korak = 6; korak <= 8; korak++) {
      for (const r of radnjeKoraka(korak, 'poeni')) {
        const ugao = r.uloge[0]
        if (!ugao) continue // Jovana: automatska
        const sledece = poIzvedi(x, r.id, ugao)
        if (sledece) x = sledece // null = radnja je već odigrana automatski posle prethodne
      }
      const kraj = { korak, n: radnjeKoraka(korak, 'poeni').length, grana: 'poeni' as const }
      expect(x.poz, `kraj koraka ${korak}`).toEqual(kraj)
      x = poPostavi(x, { korak: korak + 1, n: 0, grana: 'poeni' }) // „Dalje“ na sledeći korak
    }
    expect(x.poz).toEqual({ korak: 9, n: 0, grana: 'poeni' })
    expect(x.poz).toEqual(odigraj({ korak: 9, n: 0, grana: 'poeni' }))
  })
})
