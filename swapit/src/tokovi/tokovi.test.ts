// DORADA PK3: zapis iz sessionStorage se strogo proverava (poznata kategorija, vlasnik, poeni, „trazi“, dužine), inače se odbacuje.
import { describe, expect, it } from 'vitest'
import { POCETNO, proveri, ucitaj } from '../demo/cuvanje'
import { svet } from '../scenario/svet'
import { POCETNI_TOKOVI, jeOglas, proveriTokove } from './tokovi'

const dobar = { id: 'moj-oglas', naslov: 'Moja knjiga', kat: 'knjige', vrsta: 'roba', nacin: 'razmena', trazi: 'roba', vlasnik: 'ana_zvz84', firma: false, grad: 'Beograd', opis: 'Opis.' }
const zapis = (tokovi: unknown) => ({ v: 1, poz: { korak: 1, n: 0, grana: 'lanac' }, rezim: 'vodjena', tema: 'svetla', poruke: { slobodno: false }, saglasnosti: {}, tokovi })

describe('PK3: provera tokova iz zapisa', () => {
  it('ispravan oglas i omiljeno prolaze', () => {
    expect(jeOglas(dobar)).toBe(true)
    expect(proveriTokove({ noviOglasi: [dobar], omiljeno: ['markov-bicikl', 'moj-oglas'] })).not.toBeNull()
    expect(jeOglas({ ...dobar, nacin: 'poeni', poeni: 25 })).toBe(true)
    expect(jeOglas({ ...dobar, firma: true, vlasnik: 'zupcanik' })).toBe(true)
  })
  it('nepoznata kategorija, vlasnik, poeni i „trazi“ se odbacuju', () => {
    const pokvareno: Record<string, unknown>[] = [
      { kat: 'nepostojeca' },
      { kat: '__proto__' },
      { kat: 'constructor' },
      { vlasnik: 'neko_nepoznat' },
      { vlasnik: 'zupcanik' }, // firma sa firma: false
      { firma: true }, // korisnik označen kao firma
      { nacin: 'poeni', poeni: 7 },
      { nacin: 'poeni' }, // „za poene“ bez vrednosti
      { trazi: 'stvar' },
      { vrsta: 'zivotinja' },
      { nacin: 'kupovina' },
      { grad: 'Niš' },
    ]
    for (const p of pokvareno) expect(jeOglas({ ...dobar, ...p }), JSON.stringify(p)).toBe(false)
  })
  it('predugi i prazni tekstovi se odbacuju', () => {
    expect(jeOglas({ ...dobar, naslov: 'x'.repeat(121) })).toBe(false)
    expect(jeOglas({ ...dobar, opis: 'x'.repeat(601) })).toBe(false)
    expect(jeOglas({ ...dobar, naslov: '' })).toBe(false)
    expect(jeOglas({ ...dobar, id: 'i'.repeat(61) })).toBe(false)
  })
  it('omiljeno: nepoznat ili ponovljen id i predugačak spisak se odbacuju', () => {
    expect(proveriTokove({ noviOglasi: [], omiljeno: ['ne-postoji-takav-oglas'] })).toBeNull()
    expect(proveriTokove({ noviOglasi: [], omiljeno: ['markov-bicikl', 'markov-bicikl'] })).toBeNull()
    expect(proveriTokove({ noviOglasi: [], omiljeno: [5] })).toBeNull()
    expect(proveriTokove({ noviOglasi: Array(21).fill(dobar), omiljeno: [] })).toBeNull()
  })
  it('namerno pokvaren zapis daje početno stanje, a ne grešku', () => {
    const sk = (z: unknown) => ({ getItem: () => JSON.stringify(z), setItem: () => {} })
    expect(proveri(zapis({ noviOglasi: [{ ...dobar, kat: 'nepostojeca' }] }))).toBeNull()
    expect(ucitaj(sk(zapis({ noviOglasi: [{ ...dobar, kat: 'nepostojeca' }] })))).toEqual(POCETNO)
    expect(ucitaj(sk(zapis({ noviOglasi: [], omiljeno: ['nema-ga'] })))).toEqual(POCETNO)
    expect(proveri(zapis({ noviOglasi: [dobar], omiljeno: ['markov-bicikl'] }))).not.toBeNull()
  })
  it('svet() se brani od nepoznate kategorije: ne ruši se i ne računa takav oglas', () => {
    const pre = svet({ korak: 1, n: 0, grana: 'lanac' }).ukupno.ukupno
    const s = svet({ korak: 1, n: 0, grana: 'lanac' }, { ...POCETNI_TOKOVI, noviOglasi: [{ ...dobar, kat: 'nepostojeca' } as never] })
    expect(s.ukupno.ukupno).toBe(pre)
  })
})
