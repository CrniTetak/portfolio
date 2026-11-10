// Krug ispravki dorade 2: oslobađanje kredita posle otkazivanja (V-a), poništeno izviđanje (V-b), zaštite unosa, kalendar.
import { describe, expect, it } from 'vitest'
import { proveriNacrtLokacije } from '../logika/objava'
import { mozeLiBlokirati } from '../logika/kalendar'
import { MAX_TEKST_UNOSA } from '../logika/konstante'
import { nadjiLokaciju } from '../podaci/lokacije'
import { adresaZaImenovanu, zahteviDelte } from './izvedeno'
import { reducer } from './reducer'
import { pocetnoStanje } from './scenario'
import { stanjeZaSkok } from './skokovi-za-testove'
import { jeIspravnoStanje } from './validacija'
import type { Akcija } from './akcije'

describe('V-a: kredit od 50 € se oslobađa kad vlasnik otkaže rezervaciju', () => {
  it('zamenska rezervacija iz istog briefa ponovo dobija umanjenje; povraćaj je plaćeni iznos', () => {
    let s = stanjeZaSkok('usluge', false).stanje
    const z1 = zahteviDelte(s)[0]
    const p1 = s.predracuni.find((p) => p.zahtevId === z1.id)!
    expect(p1.umanjenjeCenti).toBe(5000)
    s = reducer(s, { tip: 'POTVRDI_UPLATU', predracunId: p1.id })
    s = reducer(s, { tip: 'OTKAZI_REZERVACIJU_VLASNIK', zahtevId: z1.id })
    expect(s.predracuni.find((p) => p.id === p1.id)?.povracaj?.iznosPara).toBe(1813500) // plaćeno 155 €
    // nova rezervacija iz istog briefa: kredit je ponovo dostupan
    s = reducer(s, { tip: 'POSALJI_ZAHTEV', lokacijaId: 'industrijski-loft', termin: z1.termin, razred: 'do30', prekovremeniSati: 0 })
    const z2 = zahteviDelte(s).at(-1)!
    expect(z2.id).not.toBe(z1.id)
    s = reducer(s, { tip: 'ODOBRI_ZAHTEV', zahtevId: z2.id })
    const p2 = s.predracuni.find((p) => p.zahtevId === z2.id)!
    expect(p2.umanjenjeCenti).toBe(5000)
    expect(p2.kreditIzPredracunaId).toBe(p1.kreditIzPredracunaId)
    expect(p2.ukupnoCenti).toBe(8500) // 135 − 50, bez domaćina
  })
  it('dok rezervacija NIJE otkazana, kredit je zauzet (ne važi dvaput)', () => {
    const s = stanjeZaSkok('usluge', false).stanje
    const z1 = zahteviDelte(s)[0]
    // drugi zahtev za drugi dan, dok je prvi živ: nema kredita
    let n = reducer(s, { tip: 'POSALJI_ZAHTEV', lokacijaId: 'foto-studio', termin: { priprema: [], snimanje: ['2026-12-10'] }, razred: 'do30', prekovremeniSati: 0 })
    const z2 = zahteviDelte(n).at(-1)!
    expect(z2.id).not.toBe(z1.id)
    n = reducer(n, { tip: 'ODOBRI_ZAHTEV', zahtevId: z2.id })
    expect(n.predracuni.find((p) => p.zahtevId === z2.id)?.umanjenjeCenti).toBe(0)
  })
})

describe('V-b: otkazivanje vlasnika poništava potvrđeno izviđanje', () => {
  it('imenovana osoba posle otkazivanja više ne vidi adresu', () => {
    let s = stanjeZaSkok('uplata', false).stanje
    s = reducer(s, { tip: 'ZATRAZI_IZVIDJANJE', lokacijaId: 'industrijski-loft', kada: 49, osoba: 'Ana P.', brojLjudi: 2 })
    s = reducer(s, { tip: 'POTVRDI_IZVIDJANJE', id: s.izvidjanja[0].id })
    s = reducer(s, { tip: 'PREMOTAJ', sati: 30 })
    expect(adresaZaImenovanu(s, 'industrijski-loft', 'Ana P.').nivo).toBe('adresa')
    s = reducer(s, { tip: 'OTKAZI_REZERVACIJU_VLASNIK', zahtevId: zahteviDelte(s)[0].id })
    expect(adresaZaImenovanu(s, 'industrijski-loft', 'Ana P.').nivo).toBe('zona')
  })
  it('izviđanje zatraženo POSLE otkazivanja važi normalno', () => {
    let s = stanjeZaSkok('otkazao', false).stanje
    s = reducer(s, { tip: 'PREMOTAJ', sati: 1 })
    s = reducer(s, { tip: 'ZATRAZI_IZVIDJANJE', lokacijaId: 'industrijski-loft', kada: 60, osoba: 'Ana P.', brojLjudi: 2 })
    s = reducer(s, { tip: 'POTVRDI_IZVIDJANJE', id: s.izvidjanja[0].id })
    s = reducer(s, { tip: 'PREMOTAJ', sati: 40 })
    expect(adresaZaImenovanu(s, 'industrijski-loft', 'Ana P.').nivo).toBe('adresa')
  })
})

describe('zaštite unosa u reduceru', () => {
  const zahtevA = (prekovremeniSati: number): Akcija => ({
    tip: 'POSALJI_ZAHTEV', lokacijaId: 'industrijski-loft', termin: { priprema: [], snimanje: ['2026-11-18'] }, razred: 'do30', prekovremeniSati,
  })
  it('negativni, NaN, razlomljeni i preveliki prekovremeni sati ne bacaju grešku nego se odbijaju', () => {
    const s = pocetnoStanje()
    for (const v of [-1, NaN, Infinity, 1.5, 13, 1e9]) expect(() => reducer(s, zahtevA(v))).not.toThrow()
    for (const v of [-1, NaN, Infinity, 1.5, 13]) expect(reducer(s, zahtevA(v))).toBe(s)
    expect(reducer(s, zahtevA(2))).not.toBe(s)
  })
  it('naziv, opština i tip preporuke i lokacije se seku', () => {
    const dugo = 'x'.repeat(500)
    let s = reducer(pocetnoStanje(), { tip: 'POSALJI_PREPORUKU', preporuka: { naziv: dugo, tip: dugo, opstina: dugo, vlasnikNaziv: dugo, saglasnostVlasnika: true } })
    expect(s.prijaveLokacija[0].naziv).toHaveLength(MAX_TEKST_UNOSA)
    expect(s.prijaveLokacija[0].opstina).toHaveLength(MAX_TEKST_UNOSA)
    expect(s.prijaveLokacija[0].tip).toHaveLength(MAX_TEKST_UNOSA)
    s = reducer(pocetnoStanje(), { tip: 'POSALJI_LOKACIJU', lokacija: {
      naziv: dugo, tip: dugo, opstina: dugo, kvadratura: 50, tehnicki: {}, brojFotografija: 99, dokaz: dugo, fotografisanje: false,
      cenovnik: { do10: null, do30: 20000, preko30: null, satiDana: 10, pripremaCenti: 0, prekovremeniCenti: 0, najkrace: dugo, troskovi: dugo },
    } })
    expect(s.prijaveLokacija[0].naziv).toHaveLength(MAX_TEKST_UNOSA)
    expect(s.prijaveLokacija[0].opstina).toHaveLength(MAX_TEKST_UNOSA)
    expect(s.prijaveLokacija[0].brojFotografija).toBe(10)
  })
  it('proveriNacrtLokacije daje jasne poruke (NaN, negativne vrednosti, prazno)', () => {
    const ok = { naziv: 'A', opstina: 'B', kvadratura: 10, cenovnik: { do10: null, do30: 100, preko30: null, satiDana: 10, pripremaCenti: 0, prekovremeniCenti: 0 } }
    expect(proveriNacrtLokacije(ok)).toBeNull()
    expect(proveriNacrtLokacije({ ...ok, naziv: ' ' })).toContain('naziv')
    expect(proveriNacrtLokacije({ ...ok, kvadratura: NaN })).toContain('Kvadratura')
    expect(proveriNacrtLokacije({ ...ok, cenovnik: { ...ok.cenovnik, do30: NaN } })).toContain('Cene')
    expect(proveriNacrtLokacije({ ...ok, cenovnik: { ...ok.cenovnik, do30: null } })).toContain('cenu')
    expect(proveriNacrtLokacije({ ...ok, cenovnik: { ...ok.cenovnik, prekovremeniCenti: -5 } })).toContain('prekovremenog')
    expect(proveriNacrtLokacije({ ...ok, cenovnik: { ...ok.cenovnik, satiDana: 0 } })).toContain('sati')
  })
})

describe('kalendar: nepostojeći datumi i prošlost', () => {
  const l = nadjiLokaciju('industrijski-loft')!
  const baza = { l, blokirani: {}, opcije: [], zahtevi: [], sada: 0 }
  it('nepostojeći dan (30. 2.) i dan pre simuliranog "danas" se odbijaju', () => {
    expect(mozeLiBlokirati({ ...baza, dan: '2026-02-30' }).moze).toBe(false)
    expect(mozeLiBlokirati({ ...baza, dan: '2026-13-01' }).moze).toBe(false)
    expect(mozeLiBlokirati({ ...baza, dan: '2026-11-01' }).razlog).toBe('Dan je u prošlosti.')
    expect(mozeLiBlokirati({ ...baza, dan: '2026-11-18' }).moze).toBe(true)
  })
})

describe('stanje: nizovi se ne dele i validacija oblika', () => {
  it('dva početna stanja nemaju zajedničke nizove termina', () => {
    const a = pocetnoStanje()
    const b = pocetnoStanje()
    a.opcije[0].termin.snimanje.push('2030-01-01')
    expect(b.opcije[0].termin.snimanje).not.toContain('2030-01-01')
  })
  it('opcija ili zahtev sa pokvarenim terminom, i zahtev bez opcijaId, odbacuju stanje', () => {
    const s = stanjeZaSkok('zahtev', false).stanje
    expect(jeIspravnoStanje(s)).toBe(true)
    expect(jeIspravnoStanje({ ...s, opcije: [{ ...s.opcije[0], termin: 5 }] })).toBe(false)
    expect(jeIspravnoStanje({ ...s, zahtevi: [{ ...s.zahtevi[0], opcijaId: 7 }] })).toBe(false)
  })
})
