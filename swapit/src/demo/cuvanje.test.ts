import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { brojRadnji } from '../prica/koraci'
import { dodajNoviOglas } from '../tokovi/tokovi'
import { KLJUC, POCETNO, posleRestarta, proveri, ucitaj, upisi } from './cuvanje'

const dobro = { v: 1, poz: { korak: 5, n: 2, grana: 'lanac' }, rezim: 'slobodno', tema: 'tamna', poruke: { slobodno: true }, saglasnosti: { r3_uslovi: true }, tokovi: { noviOglasi: [] } }
const lazno = (zapis: unknown) => ({ getItem: () => JSON.stringify(zapis), setItem: () => {} })

describe('čuvanje stanja', () => {
  it('ključ je swapit.demo.v1', () => expect(KLJUC).toBe('swapit.demo.v1'))
  it('skripte (e2e) koriste isti ključ kao aplikacija (PK16)', () => {
    const skripta = readFileSync(fileURLToPath(new URL('../../skripte/_zajednicko.mjs', import.meta.url)), 'utf8')
    expect(skripta).toContain(`KLJUC = '${KLJUC}'`)
  })
  it('ispravan zapis se prihvata', () => {
    expect(proveri(dobro)?.poz).toEqual({ korak: 5, n: 2, grana: 'lanac' })
    expect(proveri(dobro)?.tema).toBe('tamna')
  })
  it('odbacuje staru verziju', () => {
    expect(proveri({ ...dobro, v: 0 })).toBeNull()
  })
  it('odbacuje granu „poeni“ na koraku 3', () => {
    expect(proveri({ ...dobro, poz: { korak: 3, n: 0, grana: 'poeni' } })).toBeNull()
  })
  it('odbacuje nedozvoljene vrednosti', () => {
    expect(proveri({ ...dobro, poz: { korak: 10, n: 0, grana: 'lanac' } })).toBeNull()
    expect(proveri({ ...dobro, poz: { korak: 5, n: 99, grana: 'lanac' } })).toBeNull()
    expect(proveri({ ...dobro, poz: { korak: 5, n: -1, grana: 'lanac' } })).toBeNull()
    expect(proveri({ ...dobro, rezim: 'x' })).toBeNull()
    expect(proveri({ ...dobro, tema: 'siva' })).toBeNull()
    expect(proveri({ ...dobro, poruke: { slobodno: 'da' } })).toBeNull()
    expect(proveri({ ...dobro, saglasnosti: { a: 'da' } })).toBeNull()
    expect(proveri({ ...dobro, tokovi: { noviOglasi: [{ id: 5 }] } })).toBeNull()
    expect(proveri({ ...dobro, tokovi: undefined })).toBeNull()
    expect(proveri(null)).toBeNull()
    expect(proveri('tekst')).toBeNull()
  })
  it('prihvata granu „poeni“ od koraka 6 i najveće n', () => {
    expect(proveri({ ...dobro, poz: { korak: 8, n: brojRadnji(8, 'poeni'), grana: 'poeni' } })).not.toBeNull()
    expect(proveri({ ...dobro, poz: { korak: 6, n: 0, grana: 'poeni' } })).not.toBeNull()
  })
  it('neispravan zapis daje početak, ne grešku', () => {
    expect(ucitaj(lazno({ v: 1, poz: 'x' }))).toEqual(POCETNO)
    expect(ucitaj({ getItem: () => '{pokvareno', setItem: () => {} })).toEqual(POCETNO)
    expect(ucitaj(null)).toEqual(POCETNO)
  })
  it('upis i čitanje daju isto', () => {
    const m = new Map<string, string>()
    const sk = { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v) }
    const s = { ...POCETNO, rezim: 'slobodno' as const, tema: 'tamna' as const }
    upisi(s, sk)
    expect(m.has(KLJUC)).toBe(true)
    expect(ucitaj(sk)).toEqual(s)
  })
  it('Restart: briše priču (korak 1, lanac), tokove i saglasnosti; ostaju režim, tema i viđene poruke', () => {
    const noviOglas = { id: 'x', naslov: 'x', kat: 'knjige', vrsta: 'roba', nacin: 'razmena', vlasnik: 'ana_zvz84', firma: false, grad: 'Beograd', opis: 'x' } as const
    const pre = { ...POCETNO, poz: { korak: 8, n: 1, grana: 'poeni' as const }, rezim: 'slobodno' as const, tema: 'tamna' as const, poruke: { slobodno: true }, saglasnosti: { a: true }, tokovi: dodajNoviOglas(POCETNO.tokovi, noviOglas) }
    const posle = posleRestarta(pre)
    expect(posle.poz).toEqual({ korak: 1, n: 0, grana: 'lanac' })
    expect(posle.saglasnosti).toEqual({})
    expect(posle.tokovi.noviOglasi).toEqual([])
    expect([posle.rezim, posle.tema, posle.poruke.slobodno]).toEqual(['slobodno', 'tamna', true])
  })
})
