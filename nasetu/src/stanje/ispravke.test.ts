// Testovi za nalaze kontrolora: ponovno slanje posle isteka, "Sledeći korak", izviđanje posle premotavanja,
// komentar bez glasa, "Pošalji izbor" i veličina ekipe.
import { describe, expect, it } from 'vitest'
import { stanjeZahteva } from '../logika/rezervacije'
import { adresaZaImenovanu, zahteviDelte } from './izvedeno'
import { reducer } from './reducer'
import { BRIEF_SCENARIO, pocetnoStanje, SCENARIO_TERMIN } from './scenario'
import { stanjeZaSkok } from './skokovi-za-testove'
import type { Akcija } from './akcije'

describe('ponovno slanje zahteva posle isteka (+48 h)', () => {
  it('istekli zahtev se preskače: može novi zahtev', () => {
    let s = stanjeZaSkok('zahtev', false).stanje
    const stari = zahteviDelte(s)[0]
    s = reducer(s, { tip: 'PREMOTAJ', sati: 48 })
    expect(stanjeZahteva(stari, s.sati)).toBe('istekao')
    const novo = reducer(s, { tip: 'POSALJI_ZAHTEV', lokacijaId: 'industrijski-loft', termin: SCENARIO_TERMIN, razred: 'do30', prekovremeniSati: 0 })
    expect(novo).not.toBe(s)
    expect(zahteviDelte(novo).at(-1)!.id).not.toBe(stari.id)
  })
})

describe('izviđanje posle +72 h', () => {
  it('adresa imenovanoj osobi se zatvara 24 h posle izviđanja', () => {
    let s = pocetnoStanje()
    s = reducer(s, { tip: 'ZATRAZI_IZVIDJANJE', lokacijaId: 'industrijski-loft', kada: 49, osoba: 'Ana P.', brojLjudi: 2 })
    s = reducer(s, { tip: 'POTVRDI_IZVIDJANJE', id: s.izvidjanja[0].id })
    s = reducer(s, { tip: 'PREMOTAJ', sati: 48 })
    expect(adresaZaImenovanu(s, 'industrijski-loft', 'Ana P.').nivo).toBe('adresa')
    s = reducer(s, { tip: 'PREMOTAJ', sati: 24 }) // 72 h od početka = izviđanje + 23 h
    expect(adresaZaImenovanu(s, 'industrijski-loft', 'Ana P.').nivo).toBe('adresa')
    s = reducer(s, { tip: 'PREMOTAJ', sati: 2 })
    expect(adresaZaImenovanu(s, 'industrijski-loft', 'Ana P.').nivo).toBe('zona')
  })
  it('izviđanje u prošlosti se odbija', () => {
    let s = pocetnoStanje()
    s = reducer(s, { tip: 'PREMOTAJ', sati: 100 })
    expect(reducer(s, { tip: 'ZATRAZI_IZVIDJANJE', lokacijaId: 'industrijski-loft', kada: 49, osoba: 'Ana P.', brojLjudi: 2 })).toBe(s)
  })
})

describe('komentar primaoca', () => {
  const izbor = (s = stanjeZaSkok('izbor', false).stanje) => ({ s, id: s.izbori.at(-1)!.id })
  it('komentar bez glasa se čuva, bez suda', () => {
    const { s, id } = izbor()
    const n = reducer(s, { tip: 'KOMENTARISI', izborId: id, lokacijaId: 'industrijski-loft', ime: 'Marko', komentar: 'Lepo svetlo' })
    expect(n.glasovi).toEqual([expect.objectContaining({ ime: 'Marko', sud: null, komentar: 'Lepo svetlo' })])
  })
  it('komentar jednog imena se ne prenosi na drugo; glas čuva komentar', () => {
    const { s, id } = izbor()
    let n = reducer(s, { tip: 'KOMENTARISI', izborId: id, lokacijaId: 'industrijski-loft', ime: 'Marko', komentar: 'Lepo svetlo' })
    n = reducer(n, { tip: 'GLASAJ', izborId: id, lokacijaId: 'industrijski-loft', ime: 'Jelena', sud: 'ne', komentar: '' })
    expect(n.glasovi.find((g) => g.ime === 'Jelena')?.komentar).toBe('')
    expect(n.glasovi.find((g) => g.ime === 'Marko')?.komentar).toBe('Lepo svetlo')
    n = reducer(n, { tip: 'GLASAJ', izborId: id, lokacijaId: 'industrijski-loft', ime: 'Marko', sud: 'da', komentar: 'Lepo svetlo' })
    expect(n.glasovi.filter((g) => g.ime === 'Marko')).toHaveLength(1)
  })
  it('prazan komentar se odbija', () => {
    const { s, id } = izbor()
    expect(reducer(s, { tip: 'KOMENTARISI', izborId: id, lokacijaId: 'industrijski-loft', ime: 'Marko', komentar: '  ' })).toBe(s)
  })
})

describe('"Pošalji izbor"', () => {
  it('uvek sadrži Loft, Halu i Studio — i kad produkcija ima svoj nacrt iz kataloga', () => {
    let s = reducer(pocetnoStanje(), { tip: 'DODAJ_U_IZBOR', lokacijaId: 'stan-sedamdesete' })
    s = reducer(s, { tip: 'POSALJI_BRIEF', brief: BRIEF_SCENARIO })
    s = reducer(s, { tip: 'ADMIN_POSALJI_IZBOR', briefId: s.briefovi.at(-1)!.id })
    const poslat = s.izbori.find((i) => i.poslatProdukciji !== null && i.akterId === 'delta')!
    expect(poslat.lokacijaIds).toEqual(expect.arrayContaining(['industrijski-loft', 'brutalisticka-hala', 'foto-studio', 'stan-sedamdesete']))
    expect(poslat.lokacijaIds.slice(0, 3)).toEqual(['industrijski-loft', 'brutalisticka-hala', 'foto-studio'])
  })
})

describe('veličina ekipe', () => {
  it('"Traži opciju" se odbija za lokaciju koja ne prima ekipu iz briefa (isto kao rezervacija)', () => {
    let s = reducer(pocetnoStanje(), { tip: 'POSALJI_BRIEF', brief: { ...BRIEF_SCENARIO, razred: 'preko30' } })
    const a: Akcija = { tip: 'TRAZI_OPCIJU', lokacijaId: 'industrijski-loft', termin: SCENARIO_TERMIN }
    expect(reducer(s, a)).toBe(s) // loft prima najviše 30 ljudi
    expect(reducer(s, { ...a, lokacijaId: 'brutalisticka-hala' })).not.toBe(s)
    s = reducer(s, { tip: 'POSALJI_ZAHTEV', lokacijaId: 'industrijski-loft', termin: SCENARIO_TERMIN, razred: 'preko30', prekovremeniSati: 0 })
    expect(s.zahtevi.filter((z) => z.produkcijaId === 'delta')).toHaveLength(0)
  })
})
