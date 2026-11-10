// Priča: reducer, navigacija i ponovno odigravanje (PLAN B8.1). Ceo put lanca i poena, radnju po radnju.
import { describe, expect, it } from 'vitest'
import { svePozicije } from '../scenario/pomocno'
import { BROJ_KORAKA, brojRadnji, nadjiRadnju, odradjene, radnjeKoraka, sveRadnje, sledecaRadnja } from './koraci'
import { ciljBack, ciljGlavniTok, ciljNext, ciljSkok, jeKraj, jeZavrsno, odigraj } from './navigacija'
import { POCETNA_POZICIJA, dovrsiAutomatske, izvedi, mozeRadnja, prihvata, reducer } from './reducer'
import type { Grana, Poz } from './tipovi'

const klik = (p: Poz): Poz => {
  // jedan korak „Dalje“ klikom: sledeća radnja kroz reducer, a kad je korak završen — prelazak na sledeći korak
  const sl = sledecaRadnja(p)
  if (sl) return reducer(p, { t: 'radnja', id: sl.id, ugao: 'sistem' })
  return reducer(p, { t: 'sledeciKorak' })
}

describe('koraci', () => {
  it('9 koraka u obe grane; koraci 1–5 i 9 su isti', () => {
    expect(BROJ_KORAKA).toBe(9)
    for (let k = 1; k <= 9; k++) {
      expect(brojRadnji(k, 'lanac')).toBeGreaterThan(0)
      if (k < 6 || k === 9) expect(radnjeKoraka(k, 'lanac')).toEqual(radnjeKoraka(k, 'poeni'))
    }
  })
  it('id-jevi radnji su jedinstveni u svakoj grani i nalaze se kroz nadjiRadnju', () => {
    for (const g of ['lanac', 'poeni'] as Grana[]) {
      const ids = sveRadnje(g).map((r) => r.id)
      expect(new Set(ids).size).toBe(ids.length)
      for (const r of sveRadnje(g)) expect(nadjiRadnju(r.id, g)?.radnja).toBe(r)
    }
  })
  it('Jovana nema ugao: njene radnje su automatske', () => {
    for (const g of ['lanac', 'poeni'] as Grana[]) for (const r of sveRadnje(g).filter((x) => x.uloge.length === 0)) expect(r.auto).toBe(true)
  })
})

describe('reducer', () => {
  it('prihvata samo sledeću radnju i samo pravi ugao', () => {
    const p = POCETNA_POZICIJA
    expect(prihvata(p, { t: 'radnja', id: '1.r3', ugao: 'ana' })).toBe(false) // preskače
    expect(prihvata(p, { t: 'radnja', id: '1.r2', ugao: 'marko' })).toBe(false) // tuđa radnja
    expect(prihvata(p, { t: 'radnja', id: '1.r2', ugao: 'ana' })).toBe(true)
  })
  it('odbijen događaj vraća ISTU referencu', () => {
    const p = POCETNA_POZICIJA
    expect(reducer(p, { t: 'radnja', id: '9.primi', ugao: 'prodavnica' })).toBe(p)
    expect(reducer(p, { t: 'sledeciKorak' })).toBe(p)
    expect(reducer(p, { t: 'grana', grana: 'poeni' })).toBe(p)
  })
  it('račva se bira samo na koraku 6', () => {
    const p6: Poz = { korak: 6, n: 0, grana: 'lanac' }
    expect(reducer(p6, { t: 'grana', grana: 'poeni' })).toEqual({ korak: 6, n: 0, grana: 'poeni' })
    expect(reducer({ korak: 5, n: 0, grana: 'lanac' }, { t: 'grana', grana: 'poeni' }).grana).toBe('lanac')
    expect(reducer({ korak: 7, n: 0, grana: 'lanac' }, { t: 'grana', grana: 'poeni' }).grana).toBe('lanac')
  })
  it('korak se završava tek kad su sve radnje odrađene', () => {
    const p: Poz = { korak: 1, n: 1, grana: 'lanac' }
    expect(reducer(p, { t: 'sledeciKorak' })).toBe(p)
    expect(reducer({ korak: 1, n: 3, grana: 'lanac' }, { t: 'sledeciKorak' })).toEqual({ korak: 2, n: 0, grana: 'lanac' })
  })
  it('automatske radnje: Ana prihvata lanac, Marko i Jovana prihvataju odmah posle (jedan klik)', () => {
    const p6: Poz = { korak: 6, n: 0, grana: 'lanac' }
    const posle = izvedi(p6, '6.ana', 'ana')
    expect(posle).toEqual({ korak: 6, n: 3, grana: 'lanac' })
  })
  it('automatske radnje: kad gleda Marko, Anino prihvatanje se odigra samo, pa Marko klikne svoje', () => {
    const p6: Poz = { korak: 6, n: 0, grana: 'lanac' }
    expect(mozeRadnja(p6, '6.marko', 'marko')).toBe(true)
    expect(izvedi(p6, '6.marko', 'marko')).toEqual({ korak: 6, n: 3, grana: 'lanac' })
    // Prodavnica ne može da prihvati lanac
    expect(mozeRadnja(p6, '6.ana', 'prodavnica')).toBe(false)
  })
  it('izvedi: radnja koja nije sledeća se odbija i ne menja ništa (ni automatske pre nje)', () => {
    const p6: Poz = { korak: 6, n: 0, grana: 'lanac' }
    expect(izvedi(p6, '6.jovana', 'ana')).toBe(p6)
  })
  it('dovrsiAutomatske ne dira radnju koju gledalac izvodi', () => {
    const p: Poz = { korak: 5, n: 0, grana: 'lanac' }
    expect(dovrsiAutomatske(p, 'marko')).toBe(p)
  })
  it('moderacija u koraku 5 može da odluči: Markove radnje se odigraju same', () => {
    const p5: Poz = { korak: 5, n: 0, grana: 'lanac' }
    expect(izvedi(p5, '5.v2', 'moderacija')).toEqual({ korak: 5, n: 4, grana: 'lanac' })
  })
  it('račva 7R: Jovanin zahtev za poklon je automatski, Ana ga potvrđuje', () => {
    const p: Poz = { korak: 7, n: 0, grana: 'poeni' }
    const posleUredi = izvedi(p, '7R.uredi', 'ana')
    expect(posleUredi.n).toBe(2) // Jovanin zahtev se odigrao sam
    expect(izvedi(posleUredi, '7R.potvrdi', 'ana').n).toBe(4) // + Jovanina potvrda prijema (N-1)
  })
})

describe('ceo put priče, radnju po radnju', () => {
  for (const grana of ['lanac', 'poeni'] as Grana[]) {
    it(`grana ${grana}: od 1/početno do 9/završno`, () => {
      let p: Poz = POCETNA_POZICIJA
      if (grana === 'poeni') {
        for (let i = 0; i < 100 && p.korak < 6; i++) p = klik(p)
        p = reducer(p, { t: 'grana', grana: 'poeni' })
      }
      let koraka = 0
      while (!jeKraj(p)) {
        const sledeci = klik(p)
        expect(sledeci).not.toBe(p)
        p = sledeci
        if (++koraka > 200) throw new Error('petlja')
      }
      expect(p).toEqual({ korak: 9, n: brojRadnji(9, grana), grana })
    })
  }
})

describe('Dalje / Nazad / skok = ručno klikanje', () => {
  const sve = svePozicije()
  it('odigraj(pozicija) daje tu istu poziciju za svaku poziciju obe grane', () => {
    for (const p of sve) expect(odigraj(p), `${p.korak}/${p.n}/${p.grana}`).toEqual(p)
  })
  it('Dalje: početno → završno → početno sledećeg; na kraju ostaje', () => {
    for (const p of sve) {
      const c = ciljNext(p)
      if (jeKraj(p)) expect(c).toBe(p)
      else if (!jeZavrsno(p)) expect(c).toEqual({ ...p, n: brojRadnji(p.korak, p.grana) })
      else expect(c).toEqual({ korak: p.korak + 1, n: 0, grana: p.grana })
      // cilj je uvek ispravna pozicija koju može da proizvede ručno klikanje
      expect(odigraj(c)).toEqual(c)
    }
  })
  it('Nazad: odmaklo → početno tog koraka; početno → početno prethodnog; 1/početno ostaje', () => {
    expect(ciljBack(POCETNA_POZICIJA)).toEqual(POCETNA_POZICIJA)
    for (const p of sve) {
      const c = ciljBack(p)
      expect(odigraj(c)).toEqual(c)
      if (p.n > 0) expect(c).toEqual({ ...p, n: 0 })
      else if (p.korak > 1) expect(c.korak).toBe(p.korak - 1)
    }
  })
  it('Nazad iz koraka 6 u grani „poeni“ na korak 5 vraća granu „lanac“, a iz 7 ostaje na 6 u „poeni“', () => {
    expect(ciljBack({ korak: 6, n: 0, grana: 'poeni' })).toEqual({ korak: 5, n: 0, grana: 'lanac' })
    expect(ciljBack({ korak: 7, n: 0, grana: 'poeni' })).toEqual({ korak: 6, n: 0, grana: 'poeni' })
  })
  it('skok na 1–5 poništava račvu (poruka), na 6–9 grana ostaje', () => {
    const iz: Poz = { korak: 8, n: 2, grana: 'poeni' }
    expect(ciljSkok(iz, 3)).toEqual({ poz: { korak: 3, n: 0, grana: 'lanac' }, granaVracena: true })
    expect(ciljSkok(iz, 7)).toEqual({ poz: { korak: 7, n: 0, grana: 'poeni' }, granaVracena: false })
    expect(ciljSkok({ korak: 4, n: 0, grana: 'lanac' }, 2).granaVracena).toBe(false)
    for (let k = 1; k <= 9; k++) for (const g of ['lanac', 'poeni'] as Grana[]) {
      const { poz } = ciljSkok({ korak: 9, n: 0, grana: g }, k)
      expect(odigraj(poz)).toEqual(poz)
    }
  })
  it('„Nazad na glavni tok“: lanac, korak 6, početno', () => {
    expect(ciljGlavniTok()).toEqual({ korak: 6, n: 0, grana: 'lanac' })
  })
  it('odradjene() prati poziciju', () => {
    expect(odradjene({ korak: 1, n: 0, grana: 'lanac' }).size).toBe(0)
    expect(odradjene({ korak: 2, n: 1, grana: 'lanac' }).has('1.r4')).toBe(true)
    expect(odradjene({ korak: 2, n: 1, grana: 'lanac' }).has('2.o3')).toBe(false)
  })
})
