// B7.2 — testovi priče: cela putanja, Next/Back/skok, račva, Restart, odbijanje nevažećih radnji, skladište.
import { describe, expect, it } from 'vitest'
import { KORACI, putanja, radnjeKoraka } from './koraci'
import { ciljBack, ciljGrana, ciljNext, ciljSkok, stanjeTacke } from './navigacija'
import { izgradiStanje, jeIsto, jeVazecaPozicija, normalizuj, POCETNO, reducer, sledecaRadnja } from './reducer'
import { KLJUC, napraviZapis, parsirajZapis, PODRAZUMEVANO, ucitaj, sacuvaj } from './skladiste'
import type { Grana, Pozicija } from './tipovi'

/** Ručno "klikanje": primenjuje svaku radnju redom i prelazi na sledeći korak; vraća SVA stanja usput. */
function rucnoSvaStanja(grana: Grana, odKoraka = 1): Pozicija[] {
  const sva: Pozicija[] = []
  let s: Pozicija = { korak: odKoraka, odradjeno: 0, grana }
  sva.push(s)
  for (let guard = 0; guard < 200; guard++) {
    const sl = sledecaRadnja(s)
    if (sl) {
      s = reducer(s, { tip: 'izvedi', id: sl.id })
    } else if (s.korak < 9) {
      s = reducer(s, { tip: 'sledeci-korak' })
    } else break
    sva.push(s)
  }
  return sva
}

describe('cela putanja', () => {
  it('Approved: od 1/početno do 9/završno, radnju po radnju, bez greške', () => {
    const sva = rucnoSvaStanja('approved')
    const kraj = sva[sva.length - 1]
    expect(kraj).toEqual({ korak: 9, odradjeno: radnjeKoraka(9, 'approved').length, grana: 'approved' })
    // svaka radnja pomera tačno za jedan pod-korak
    const ukupnoRadnji = putanja('approved').length
    expect(ukupnoRadnji).toBe(3 + 2 + 1 + 4 + 4 + 2 + 1 + 8 + 1)
    // 9 koraka su svi posećeni
    expect(new Set(sva.map((s) => s.korak)).size).toBe(9)
  })

  it('Rejected: koraci 1-5 su isti, a od koraka 6 drugačiji (7 refund, 8 zatvoreno, 9 arhiva)', () => {
    const sva = rucnoSvaStanja('rejected')
    const kraj = sva[sva.length - 1]
    expect(kraj).toEqual({ korak: 9, odradjeno: 1, grana: 'rejected' })
    expect(radnjeKoraka(8, 'rejected')).toHaveLength(0)
    for (let k = 1; k <= 6; k++) {
      expect(radnjeKoraka(k, 'rejected').map((r) => r.id)).toEqual(radnjeKoraka(k, 'approved').map((r) => r.id))
    }
  })

  it('svaka radnja ima ekran i izvođača; radnje "sustav" imaju mesta za dugme (osim kraja priče)', () => {
    for (const grana of ['approved', 'rejected'] as const) {
      for (const r of putanja(grana)) {
        expect(r.ekran).toBeTruthy()
        expect(r.tekst).toBeTruthy()
        if (r.uloga === 'sustav' && r.id !== 'x1') expect(r.simulira?.length ?? 0).toBeGreaterThan(0)
      }
    }
  })

  it('id-evi radnji su jedinstveni u jednoj grani', () => {
    for (const grana of ['approved', 'rejected'] as const) {
      const ids = putanja(grana).map((r) => r.id)
      expect(new Set(ids).size).toBe(ids.length)
    }
  })

  it('9 koraka sa nazivima', () => {
    expect(KORACI).toHaveLength(9)
    expect(KORACI.map((k) => k.broj)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9])
  })
})

describe('skok i Next/Back daju isto stanje kao ručno klikanje', () => {
  for (const grana of ['approved', 'rejected'] as const) {
    it(`grana ${grana}: ponovno odigravanje do svake pozicije`, () => {
      const sva = rucnoSvaStanja(grana, grana === 'rejected' ? 6 : 1) // grana Rejected postoji tek od koraka 6
      for (const s of sva) {
        expect(izgradiStanje(s)).toEqual(s)
        expect(reducer(POCETNO, { tip: 'idi', cilj: s })).toEqual(s)
      }
    })
    it(`grana ${grana}: Next iz svake pozicije vodi tamo gde bi vodilo ručno klikanje`, () => {
      const sva = rucnoSvaStanja(grana, grana === 'rejected' ? 6 : 1) // grana Rejected postoji tek od koraka 6
      for (const s of sva) {
        const cilj = ciljNext(s)
        if (!cilj) {
          expect(s.korak).toBe(9)
          continue
        }
        const stanje = reducer(s, { tip: 'idi', cilj })
        // Next: ako korak nije završen -> završno stanje istog koraka, inače početno sledećeg
        const n = radnjeKoraka(s.korak, grana).length
        if (s.odradjeno < n) expect(stanje).toEqual({ korak: s.korak, odradjeno: n, grana })
        else expect(stanje).toEqual({ korak: s.korak + 1, odradjeno: 0, grana })
        expect(sva.some((x) => jeIsto(x, stanje))).toBe(true)
      }
    })
  }
})

describe('Next i Back po pravilu 1.5', () => {
  it('Next: početno -> završno -> početno sledećeg', () => {
    const p1: Pozicija = { korak: 1, odradjeno: 0, grana: 'approved' }
    expect(ciljNext(p1)).toEqual({ korak: 1, odradjeno: 3, grana: 'approved' })
    expect(ciljNext({ korak: 1, odradjeno: 3, grana: 'approved' })).toEqual({ korak: 2, odradjeno: 0, grana: 'approved' })
    // usred koraka: Next dovršava korak
    expect(ciljNext({ korak: 1, odradjeno: 1, grana: 'approved' })).toEqual({ korak: 1, odradjeno: 3, grana: 'approved' })
  })
  it('Next na 9/završno je isključen', () => {
    expect(ciljNext({ korak: 9, odradjeno: 1, grana: 'approved' })).toBeNull()
  })
  it('Back: odmaklo -> početno istog koraka; početno -> početno prethodnog; 1/početno ostaje', () => {
    expect(ciljBack({ korak: 4, odradjeno: 2, grana: 'approved' })).toEqual({ korak: 4, odradjeno: 0, grana: 'approved' })
    expect(ciljBack({ korak: 4, odradjeno: 4, grana: 'approved' })).toEqual({ korak: 4, odradjeno: 0, grana: 'approved' })
    expect(ciljBack({ korak: 4, odradjeno: 0, grana: 'approved' })).toEqual({ korak: 3, odradjeno: 0, grana: 'approved' })
    expect(ciljBack(POCETNO)).toEqual(POCETNO)
  })
  it('skok i "Show me" vode u POČETNO stanje koraka', () => {
    const iz: Pozicija = { korak: 8, odradjeno: 4, grana: 'approved' }
    expect(ciljSkok(iz, 3)).toEqual({ korak: 3, odradjeno: 0, grana: 'approved' })
    expect(reducer(iz, { tip: 'idi', cilj: ciljSkok(iz, 3) })).toEqual({ korak: 3, odradjeno: 0, grana: 'approved' })
  })
  it('korak bez radnji u Rejected (8): početno je ujedno završno, Next ide na 9', () => {
    const p: Pozicija = { korak: 8, odradjeno: 0, grana: 'rejected' }
    expect(ciljNext(p)).toEqual({ korak: 9, odradjeno: 0, grana: 'rejected' })
    expect(ciljBack(p)).toEqual({ korak: 7, odradjeno: 0, grana: 'rejected' })
  })
  it('tačke trake: završeni, tekući, ostali', () => {
    const p: Pozicija = { korak: 4, odradjeno: 1, grana: 'approved' }
    expect([1, 2, 3, 4, 5].map((k) => stanjeTacke(p, k))).toEqual(['done', 'done', 'done', 'now', 'todo'])
  })
})

describe('reducer odbija nevažeće', () => {
  it('radnja koja nije sledeća se odbija (čak i ako ekran greškom ostavi dugme aktivnim)', () => {
    const p = POCETNO
    expect(reducer(p, { tip: 'izvedi', id: 'o3' })).toBe(p) // prihvatanje pre kontraponude
    expect(reducer(p, { tip: 'izvedi', id: 'g1' })).toBe(p) // potpis iz drugog koraka
    expect(reducer(p, { tip: 'izvedi', id: 'nepostojeca' })).toBe(p)
    expect(reducer(p, { tip: 'izvedi', id: 'o1' })).toEqual({ korak: 1, odradjeno: 1, grana: 'approved' })
  })
  it('radnja iz već završenog koraka se ne primenjuje ponovo', () => {
    const kraj1: Pozicija = { korak: 1, odradjeno: 3, grana: 'approved' }
    expect(reducer(kraj1, { tip: 'izvedi', id: 'o1' })).toBe(kraj1)
  })
  it('prelazak na sledeći korak samo kad je tekući završen', () => {
    expect(reducer({ korak: 1, odradjeno: 1, grana: 'approved' }, { tip: 'sledeci-korak' })).toEqual({ korak: 1, odradjeno: 1, grana: 'approved' })
    expect(reducer({ korak: 9, odradjeno: 1, grana: 'approved' }, { tip: 'sledeci-korak' }).korak).toBe(9)
  })
})

describe('račva, Restart', () => {
  it('račva postoji samo na koraku 6; menja granu i vraća na 6/početno', () => {
    const na6: Pozicija = { korak: 6, odradjeno: 1, grana: 'approved' }
    expect(reducer(na6, { tip: 'grana', grana: 'rejected' })).toEqual({ korak: 6, odradjeno: 0, grana: 'rejected' })
    const na5: Pozicija = { korak: 5, odradjeno: 0, grana: 'approved' }
    expect(reducer(na5, { tip: 'grana', grana: 'rejected' })).toBe(na5)
    expect(ciljGrana(na5, 'rejected')).toBe(na5)
  })
  it('povratak na glavnu priču: grana Approved, korak 6/početno', () => {
    const rej: Pozicija = { korak: 6, odradjeno: 2, grana: 'rejected' }
    expect(reducer(rej, { tip: 'grana', grana: 'approved' })).toEqual({ korak: 6, odradjeno: 0, grana: 'approved' })
  })
  it('Restart vraća 1/početno, Approved', () => {
    expect(reducer({ korak: 8, odradjeno: 3, grana: 'rejected' }, { tip: 'restart' })).toEqual(POCETNO)
  })
})

describe('račva Rejected: ponašanje skoka pre koraka 6', () => {
  it('skok, Back i Next na korak 1-5 vraćaju granu na neodlučenu (Approved)', () => {
    const rej8: Pozicija = { korak: 8, odradjeno: 0, grana: 'rejected' }
    expect(reducer(rej8, { tip: 'idi', cilj: ciljSkok(rej8, 1) })).toEqual({ korak: 1, odradjeno: 0, grana: 'approved' })
    expect(reducer(rej8, { tip: 'idi', cilj: ciljSkok(rej8, 5) })).toEqual({ korak: 5, odradjeno: 0, grana: 'approved' })
    const rej6: Pozicija = { korak: 6, odradjeno: 0, grana: 'rejected' }
    expect(reducer(rej6, { tip: 'idi', cilj: ciljBack(rej6) })).toEqual({ korak: 5, odradjeno: 0, grana: 'approved' })
  })
  it('skok na korak 6-9 zadržava granu Rejected', () => {
    const rej8: Pozicija = { korak: 8, odradjeno: 0, grana: 'rejected' }
    expect(reducer(rej8, { tip: 'idi', cilj: ciljSkok(rej8, 6) })).toEqual({ korak: 6, odradjeno: 0, grana: 'rejected' })
    expect(reducer(rej8, { tip: 'idi', cilj: ciljSkok(rej8, 9) })).toEqual({ korak: 9, odradjeno: 0, grana: 'rejected' })
  })
  it('"Back to the main story" sa koraka 7-9 vraća na 6/početno u Approved; iz Approved se račva samo na koraku 6', () => {
    expect(reducer({ korak: 8, odradjeno: 0, grana: 'rejected' }, { tip: 'grana', grana: 'approved' })).toEqual({ korak: 6, odradjeno: 0, grana: 'approved' })
    const app8: Pozicija = { korak: 8, odradjeno: 2, grana: 'approved' }
    expect(reducer(app8, { tip: 'grana', grana: 'rejected' })).toBe(app8)
  })
  it('normalizuj i provera zapisa: Rejected pre koraka 6 ne postoji', () => {
    expect(normalizuj({ korak: 3, odradjeno: 0, grana: 'rejected' }).grana).toBe('approved')
    expect(jeVazecaPozicija({ korak: 3, odradjeno: 0, grana: 'rejected' })).toBe(false)
    expect(jeVazecaPozicija({ korak: 6, odradjeno: 1, grana: 'rejected' })).toBe(true)
  })
  it('grana Rejected: broj radnji u koracima 7, 8, 9', () => {
    expect([7, 8, 9].map((k) => radnjeKoraka(k, 'rejected').length)).toEqual([1, 0, 1])
  })
})

describe('sessionStorage zapis', () => {
  it('pravi zapis se vraća nepromenjen', () => {
    const s = { pozicija: { korak: 5, odradjeno: 2, grana: 'approved' as const }, rezim: 'free' as const, vidjenUvodFree: true }
    expect(parsirajZapis(napraviZapis(s))).toEqual(s)
  })
  it('stara verzija zapisa se odbacuje', () => {
    const star = JSON.stringify({ verzija: 0, korak: 5, odradjeno: 0, grana: 'approved', rezim: 'guided', vidjenUvodFree: false })
    expect(parsirajZapis(star)).toEqual(PODRAZUMEVANO)
  })
  it('neispravan zapis se odbacuje, aplikacija se ne ruši', () => {
    expect(parsirajZapis('nije json')).toEqual(PODRAZUMEVANO)
    expect(parsirajZapis(null)).toEqual(PODRAZUMEVANO)
    expect(parsirajZapis('{"verzija":1}')).toEqual(PODRAZUMEVANO)
    for (const lose of [
      { korak: 0, odradjeno: 0, grana: 'approved', rezim: 'guided' },
      { korak: 10, odradjeno: 0, grana: 'approved', rezim: 'guided' },
      { korak: 1, odradjeno: 99, grana: 'approved', rezim: 'guided' },
      { korak: 1, odradjeno: 0, grana: 'nesto', rezim: 'guided' },
      { korak: 1, odradjeno: 0, grana: 'approved', rezim: 'cudno' },
      { korak: 1.5, odradjeno: 0, grana: 'approved', rezim: 'guided' },
    ]) {
      expect(parsirajZapis(JSON.stringify({ verzija: 1, vidjenUvodFree: false, ...lose }))).toEqual(PODRAZUMEVANO)
    }
  })
  it('ucitaj/sacuvaj rade sa skladištem i ne ruše se bez njega', () => {
    const mem = new Map<string, string>()
    const sk = { getItem: (k: string) => mem.get(k) ?? null, setItem: (k: string, v: string) => void mem.set(k, v) }
    const s = { pozicija: { korak: 7, odradjeno: 1, grana: 'approved' as const }, rezim: 'guided' as const, vidjenUvodFree: false }
    sacuvaj(sk, s)
    expect(mem.has(KLJUC)).toBe(true)
    expect(ucitaj(sk)).toEqual(s)
    expect(ucitaj(null)).toEqual(PODRAZUMEVANO)
    expect(() => sacuvaj(null, s)).not.toThrow()
  })
  it('jeVazecaPozicija prihvata samo dostižne pozicije', () => {
    expect(jeVazecaPozicija({ korak: 8, odradjeno: 6, grana: 'approved' })).toBe(true)
    expect(jeVazecaPozicija({ korak: 8, odradjeno: 1, grana: 'rejected' })).toBe(false) // korak 8 u Rejected nema radnji
    expect(jeVazecaPozicija(null)).toBe(false)
  })
})
