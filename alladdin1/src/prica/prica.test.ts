// B8.2: testovi priče. Ceo put A i B/C radnju po radnju; skok/Next/Back daju isto što i ručne radnje; granice, račva, odbijanje.
import { describe, expect, it } from 'vitest'
import { brojPozicija, brojRadnji, nadjiRadnju, radnjeKoraka, sledecaRadnja, sveRadnje } from './koraci'
import { ciljBack, ciljGlavnaPrica, ciljNext, ciljSkok, jeKraj, odigraj } from './navigacija'
import { POCETNA_POZICIJA, prihvata, reducer } from './reducer'
import type { Ishod, Poz, Uloga } from './tipovi'
import { datumiKoraka } from '../scenario/datumi'

const uloga = (u: Uloga[] | 'any'): Uloga => (u === 'any' ? 'traveler' : u[0])

/** Ručno klikanje: svaka radnja iz svoje uloge, pa prelazak koraka; vraća sve pozicije redom. */
function rucniPut(ishod: Ishod): Poz[] {
  let p = POCETNA_POZICIJA
  const sve: Poz[] = [p]
  for (let k = 1; k <= 9; k++) {
    if (k === 7 && ishod !== 'A') {
      p = reducer(p, { t: 'ishod', ishod })
      sve.push(p)
    }
    for (const r of radnjeKoraka(k, p.ishod)) {
      const sl = reducer(p, { t: 'radnja', id: r.id, uloga: uloga(r.uloge) })
      expect(sl, r.id).not.toBe(p)
      p = sl
      sve.push(p)
    }
    if (k < 9) {
      p = reducer(p, { t: 'sledeciKorak' })
      sve.push(p)
    }
  }
  return sve
}

describe('priča: cela putanja radnju po radnju', () => {
  for (const ishod of ['A', 'B', 'C'] as Ishod[]) {
    it(`ishod ${ishod}: od 1/početno do 9/završno`, () => {
      const put = rucniPut(ishod)
      const kraj = put[put.length - 1]
      expect(kraj.korak).toBe(9)
      expect(jeKraj(kraj)).toBe(true)
      expect(kraj.ishod).toBe(ishod)
    })
    it(`ishod ${ishod}: ID-jevi radnji su jedinstveni i svaka je nadjiva`, () => {
      const ids = sveRadnje(ishod).map((r) => r.id)
      expect(new Set(ids).size).toBe(ids.length)
      for (const r of sveRadnje(ishod)) expect(nadjiRadnju(r.id, ishod)?.radnja).toBe(r)
    })
  }
  it('putevi B i C dele korake 1–6 sa A', () => {
    for (let k = 1; k <= 6; k++) for (const i of ['B', 'C'] as Ishod[]) expect(radnjeKoraka(k, i).map((r) => r.id)).toEqual(radnjeKoraka(k, 'A').map((r) => r.id))
  })
  it('ima po jedan datum više nego radnji, za svaki korak i ishod', () => {
    for (const i of ['A', 'B', 'C'] as Ishod[]) for (let k = 1; k <= 9; k++) expect(datumiKoraka(k, i).length, `${i}${k}`).toBe(brojRadnji(k, i) + 1)
  })
})

describe('priča: skok, Next i Back daju isto stanje kao ručno klikanje', () => {
  for (const ishod of ['A', 'B', 'C'] as Ishod[]) {
    it(`ishod ${ishod}: odigraj(pozicija) = pozicija do koje se stiže ručno, za SVAKU poziciju`, () => {
      for (const p of rucniPut(ishod)) expect(odigraj(p), JSON.stringify(p)).toEqual(p)
    })
    it(`ishod ${ishod}: Next prolazi kroz sve pozicije puta po redu`, () => {
      // u Next nizu svaka pozicija je ili završno/početno; broj pozicija = početno + završno po koraku
      let p: Poz = { korak: 1, n: 0, ishod: 'A' }
      const vidjeno: Poz[] = [p]
      let zastita = 0
      while (!jeKraj(p) && zastita++ < 100) {
        if (p.korak === 7 && p.n === 0 && p.ishod !== ishod) p = reducer(p, { t: 'ishod', ishod })
        p = ciljNext(p)
        vidjeno.push(p)
      }
      expect(jeKraj(p)).toBe(true)
      for (const x of vidjeno) expect(odigraj(x)).toEqual(x)
    })
  }
  it('ukupan broj pozicija puta A = zbir (radnje + 1) po koracima', () => {
    expect(brojPozicija('A')).toBe(sveRadnje('A').length + 9)
  })
})

describe('priča: granice, Back, skok i račva', () => {
  it('1/početno: Back ostaje', () => {
    expect(ciljBack(POCETNA_POZICIJA)).toEqual(POCETNA_POZICIJA)
  })
  it('9/završno: Next ostaje (isključen), jeKraj', () => {
    const kraj = { korak: 9, n: brojRadnji(9, 'A'), ishod: 'A' as Ishod }
    expect(jeKraj(kraj)).toBe(true)
    expect(ciljNext(kraj)).toEqual(kraj)
  })
  it('Back: odmaklo → početno tog koraka; početno → početno prethodnog', () => {
    expect(ciljBack({ korak: 5, n: 2, ishod: 'A' })).toEqual({ korak: 5, n: 0, ishod: 'A' })
    expect(ciljBack({ korak: 5, n: 0, ishod: 'A' })).toEqual({ korak: 4, n: 0, ishod: 'A' })
  })
  it('Back iz 7/početno u ishodu B ili C vraća glavni put (ishod A); Back usred koraka 7 ostaje u ishodu', () => {
    expect(ciljBack({ korak: 7, n: 0, ishod: 'B' })).toEqual({ korak: 6, n: 0, ishod: 'A' })
    expect(ciljBack({ korak: 7, n: 0, ishod: 'C' })).toEqual({ korak: 6, n: 0, ishod: 'A' })
    expect(ciljBack({ korak: 7, n: 1, ishod: 'C' })).toEqual({ korak: 7, n: 0, ishod: 'C' })
    expect(ciljBack({ korak: 8, n: 0, ishod: 'B' })).toEqual({ korak: 7, n: 0, ishod: 'B' })
  })
  it('Next: početno → završno; završno → početno sledećeg', () => {
    expect(ciljNext({ korak: 4, n: 0, ishod: 'A' })).toEqual({ korak: 4, n: brojRadnji(4, 'A'), ishod: 'A' })
    expect(ciljNext({ korak: 4, n: brojRadnji(4, 'A'), ishod: 'A' })).toEqual({ korak: 5, n: 0, ishod: 'A' })
  })
  it('račva se bira samo na početku koraka 7', () => {
    const p6 = { korak: 6, n: 0, ishod: 'A' as Ishod }
    expect(reducer(p6, { t: 'ishod', ishod: 'B' })).toBe(p6)
    const p7 = { korak: 7, n: 0, ishod: 'A' as Ishod }
    expect(reducer(p7, { t: 'ishod', ishod: 'B' })).toEqual({ korak: 7, n: 0, ishod: 'B' })
    // promena ishoda usred koraka 7 ponovo kreće korak od početka
    expect(reducer({ korak: 7, n: 1, ishod: 'B' }, { t: 'ishod', ishod: 'C' })).toEqual({ korak: 7, n: 0, ishod: 'C' })
  })
  it('skok na 1–6 vraća ishod na A ("Branch reset"); skok na 7–9 zadržava ishod', () => {
    const b = { korak: 8, n: 0, ishod: 'B' as Ishod }
    expect(ciljSkok(b, 3)).toEqual({ poz: { korak: 3, n: 0, ishod: 'A' }, granaVracena: true })
    expect(ciljSkok(b, 9).poz.ishod).toBe('B')
    expect(ciljSkok(b, 9).granaVracena).toBe(false)
  })
  it('"Back to main story" = ishod A, 7/početno', () => {
    expect(ciljGlavnaPrica()).toEqual({ korak: 7, n: 0, ishod: 'A' })
  })
})

describe('priča: reducer odbija neispravne radnje', () => {
  it('radnja koja nije sledeća se odbija', () => {
    // upit može i bez pretrage: preskače pretragu (n → 2)
    expect(reducer(POCETNA_POZICIJA, { t: 'radnja', id: '1.zahtev', uloga: 'organizer' })).toEqual({ korak: 1, n: 2, ishod: 'A' })
    expect(prihvata(POCETNA_POZICIJA, { t: 'radnja', id: '1.zahtev', uloga: 'advisor' })).toBe(false)
    expect(prihvata(POCETNA_POZICIJA, { t: 'radnja', id: '6.rata2', uloga: 'traveler' })).toBe(false)
  })
  it('radnja iz pogrešne uloge se odbija, čak i ako je sledeća', () => {
    expect(sledecaRadnja(POCETNA_POZICIJA)?.id).toBe('1.pretraga')
    expect(prihvata(POCETNA_POZICIJA, { t: 'radnja', id: '1.pretraga', uloga: 'advisor' })).toBe(false)
    expect(prihvata(POCETNA_POZICIJA, { t: 'radnja', id: '1.pretraga', uloga: 'guest' })).toBe(false)
    expect(prihvata(POCETNA_POZICIJA, { t: 'radnja', id: '1.pretraga', uloga: 'organizer' })).toBe(true)
  })
  it('događaj bez izvođača ("any") prihvata svaka uloga', () => {
    const p = { korak: 7, n: 0, ishod: 'A' as Ishod }
    expect(prihvata(p, { t: 'radnja', id: '7.sim', uloga: 'advisor' })).toBe(true)
  })
  it('prelazak u sledeći korak tek kad je korak završen; posle 9 nema dalje', () => {
    expect(prihvata(POCETNA_POZICIJA, { t: 'sledeciKorak' })).toBe(false)
    expect(prihvata({ korak: 9, n: 1, ishod: 'A' }, { t: 'sledeciKorak' })).toBe(false)
  })
  it('Restart: početna pozicija je 1/početno, ishod A', () => {
    expect(POCETNA_POZICIJA).toEqual({ korak: 1, n: 0, ishod: 'A' })
  })
})
