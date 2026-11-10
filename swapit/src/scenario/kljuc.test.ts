// V4: ključevi iz linka i zapisa ne smeju da pogode nasleđena svojstva objekta.
import { describe, expect, it } from 'vitest'
import { imaKljuc, uzmi } from './kljuc'
import { KATEGORIJA_PO_ID, KORISNIK_PO_ID, FIRMA_PO_ID, OPSTINA_PO_ID, ANA_ID } from './svet'
import { PRIMER_PO_ID, ZELJA_PO_ID } from './slobodno'
import { RUTA_PO_ID } from '../pravila/rute'
import { odluciPrijavu, izmeniOglas, odlukaPrijaveAkcije, statusPonude, razlogOdbijanja, napraviOglas } from '../tokovi/operacije'
import { POCETNI_TOKOVI, proveriTokove } from '../tokovi/tokovi'
import { saglasnostiPosle } from '../prica/saglasnosti'
import { svet } from './svet'

const OPASNI = ['constructor', '__proto__', 'toString', 'hasOwnProperty', 'valueOf', 'prototype']

describe('imaKljuc / uzmi', () => {
  it('prihvata sopstvene ključeve, odbija nasleđene', () => {
    expect(imaKljuc({ a: 1 }, 'a')).toBe(true)
    for (const k of OPASNI) expect(imaKljuc({ a: 1 }, k)).toBe(false)
    expect(imaKljuc({ a: 1 }, 5)).toBe(false)
    expect(uzmi({ a: 1 }, 'a')).toBe(1)
    for (const k of OPASNI) expect(uzmi({ a: 1 }, k)).toBeUndefined()
  })
  it('sve tabele iz scenarija odbijaju opasne ključeve', () => {
    for (const t of [KATEGORIJA_PO_ID, KORISNIK_PO_ID, FIRMA_PO_ID, OPSTINA_PO_ID, PRIMER_PO_ID, ZELJA_PO_ID, RUTA_PO_ID]) for (const k of OPASNI) expect(uzmi(t as Record<string, unknown>, k)).toBeUndefined()
  })
})

describe('operacije ne padaju na opasnim ključevima', () => {
  it('odluka, izmena, prijava akcije: opasan ključ se tretira kao običan novi ključ', () => {
    for (const k of OPASNI) {
      const t1 = odluciPrijavu(POCETNI_TOKOVI, k, 'ostavi')
      expect(Object.hasOwn(t1.odluke, k)).toBe(k !== '__proto__' ? true : true)
      expect(Object.getPrototypeOf(t1.odluke)).toBe(Object.prototype)
      // druga odluka za isti ključ se ne primenjuje
      expect(odluciPrijavu(t1, k, 'ukloni').odluke[k]).toBe('ostavi')
      const t2 = odlukaPrijaveAkcije(POCETNI_TOKOVI, k, 'primljeno')
      expect(Object.hasOwn(t2.statusiPrijava, k)).toBe(true)
      expect(odlukaPrijaveAkcije(t2, k, 'odbijeno').statusiPrijava[k]).toBe('primljeno')
    }
  })
  it('statusPonude i razlog za nasleđeni ključ: čeka, bez razloga', () => {
    for (const k of OPASNI) {
      expect(statusPonude(POCETNI_TOKOVI, k)).toBe('ceka')
      expect(razlogOdbijanja(POCETNI_TOKOVI, k)).toBeUndefined()
    }
  })
  it('izmena oglasa sa opasnim id-jem ne diže izuzetak', () => {
    for (const k of OPASNI) expect(() => izmeniOglas(POCETNI_TOKOVI, k, { nacin: 'razmena' })).not.toThrow()
  })
  it('napraviOglas sa opasnim primerom koristi podrazumevani naslov', () => {
    for (const k of OPASNI) expect(napraviOglas(POCETNI_TOKOVI, ANA_ID, false, 'zvz', { primer: k, vrsta: 'roba', kat: 'knjige', nacin: 'razmena', preuzimanje: 'licno' }).naslov).toBe('Novi oglas')
  })
})

describe('svet i zapis sa opasnim ključevima', () => {
  it('svet() sa izmenama/odlukama pod opasnim ključem se ne menja', () => {
    const poz = { korak: 1, n: 0, grana: 'lanac' as const }
    const osnova = svet(poz, POCETNI_TOKOVI)
    for (const k of OPASNI) {
      const t = { ...POCETNI_TOKOVI, izmene: { [k]: { nacin: 'poeni' as const, poeni: 10 as const } }, odluke: { [k]: 'ukloni' as const }, statusiPrijava: { [k]: 'primljeno' as const } }
      const s = svet(poz, t)
      expect(s.oglasi.length).toBe(osnova.oglasi.length)
    }
  })
  it('zapis iz sessionStorage-a sa opasnim ključem u rečnicima se odbacuje ili ostaje bezopasan', () => {
    const sirovo = JSON.parse('{"noviOglasi":[],"odluke":{"__proto__":"ukloni"}}')
    const r = proveriTokove(sirovo)
    if (r) expect(Object.getPrototypeOf(r.odluke)).toBe(Object.prototype)
    expect(proveriTokove({ noviOglasi: [], zelje: [{ k: ANA_ID, id: 'constructor' }] })).toBeNull()
    expect(proveriTokove({ noviOglasi: [], pratim: [{ k: ANA_ID, id: 'toString' }] })).toBeNull()
    expect(proveriTokove({ noviOglasi: [], ponude: [{ id: 'p1', cilj: 'x', od: 'constructor', stvari: [{ naslov: 'a', vrsta: 'roba' }], status: 'ceka' }] })).toBeNull()
  })
  it('saglasnosti: opasan ključ se čuva kao običan, a ključevi priče se računaju iznova', () => {
    const stare = JSON.parse('{"constructor":true,"toString":true,"r3_uslovi":true}')
    const nove = saglasnostiPosle(stare, { korak: 1, n: 0, grana: 'lanac' })
    expect(nove.constructor).toBe(true)
    expect(nove.r3_uslovi).toBeUndefined()
  })
})
