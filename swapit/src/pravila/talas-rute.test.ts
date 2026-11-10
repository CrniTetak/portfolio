// Talas 3: svih 84 ekrana je izgrađeno. Registar ruta i registar komponenti se slažu, nijedan ekran nije kostur („u izradi“), a svaka radnja priče,
// svaka ćelija matrice, svaka stavka okvira i svaki ekran u svakom uglu koji ga sme vodi na postojeći izgrađen ekran.
import { describe, expect, it } from 'vitest'
import { BROJ_IZGRADJENIH, ekranZa } from '../ekrani'
import { NemaStranice } from '../ekrani/NemaStranice'
import { sveRadnje } from '../prica/koraci'
import { UGLOVI } from '../prica/tipovi'
import { MATRICA_LANAC, MATRICA_POENI } from './matrica'
import { RUTE, link, razresi } from './rute'

const SVI = RUTE.map((r) => r.id)

describe('svih 84 ekrana je izgrađeno', () => {
  it('registar ruta i registar komponenti se slažu (84 / 84), nijedan ekran nije „Nema te stranice“ ni kostur', () => {
    expect(RUTE).toHaveLength(84)
    expect(BROJ_IZGRADJENIH).toBe(84)
    for (const r of RUTE) {
      expect(r.izgradjen, r.id).toBe(true)
      expect(ekranZa(r.id), r.id).not.toBe(NemaStranice)
    }
    // nepoznat ID nikad ne daje prazan ekran
    expect(ekranZa('NEMA-GA')).toBe(NemaStranice)
    expect(ekranZa('constructor')).toBe(NemaStranice)
  })
  it('svaka radnja priče, u obe grane, ima izgrađen ekran', () => {
    for (const grana of ['lanac', 'poeni'] as const) for (const r of sveRadnje(grana)) expect(SVI, `${grana} ${r.id} → ${r.ekran}`).toContain(r.ekran)
  })
  it('svih 48 ćelija matrice (4 ugla × 9 koraka u lancu + 4 × 3 u račvi = 48) ima izgrađen početni i završni ekran', () => {
    let broj = 0
    for (const u of UGLOVI)
      for (const c of [...MATRICA_LANAC[u], ...MATRICA_POENI[u]]) {
        for (const e of [c.pocetno, c.zavrsno]) expect(SVI, `${u} → ${e}`).toContain(e)
        broj++
      }
    expect(broj).toBe(48)
  })
  it('linkovi za ekrane priče: primeri iz plana', () => {
    expect(link('X13', 'marko')).toBe('/marko/lanac')
    expect(link('D3', 'ana', { posiljka: 'SW-DEMO-0001' })).toBe('/ana/dostava/prati/SW-DEMO-0001')
    expect(link('C2', 'ana', { razgovor: 'lanac' })).toBe('/ana/poruke/lanac')
    expect(razresi('/ana/poruke/lanac')).toMatchObject({ id: 'C2', parametri: { razgovor: 'lanac' } })
    expect(razresi('/ana/placanje/dostava/SW-DEMO-0001/potvrdjeno')?.id).toBe('Z4')
  })
  it('linkovi talasa 2 i 3: poklon je za Anin PlayStation 2, prijava je „šljivovica“, akcija ima jedan primer, aukcija je MTB, pravni tekst je „uslovi“', () => {
    expect(link('W5', 'ana')).toBe('/ana/poklon/ana-ps2')
    expect(link('V2', 'moderacija')).toBe('/moderacija/prijava/sljivovica')
    expect(link('V4', 'moderacija')).toBe('/moderacija/prijava/sljivovica/obavestenje')
    expect(link('A1', 'ana')).toBe('/ana/akcija/staro-za-novo')
    expect(link('F4', 'ana')).toBe('/ana/firma/zupcanik')
    expect(link('J2', 'ana')).toBe('/ana/aukcija/mtb-bicikl-storm')
    expect(link('S4', 'ana')).toBe('/pravno/uslovi')
    expect(link('P8', 'ana')).toBe('/ana/prica/jabuke')
    expect(razresi('/prodavnica/akcije/nova')?.id).toBe('A5')
    expect(razresi('/prodavnica/akcije')?.id).toBe('A4')
    expect(razresi('/prodavnica/akcija/staro-za-novo/prijave')?.id).toBe('A6')
    expect(razresi('/ana/poeni/nedovoljno/markov-bicikl')?.id).toBe('W2')
    expect(razresi('/ana/aukcija/mtb-bicikl-storm/pokreni')?.id).toBe('J3')
    expect(razresi('/ana/aukcija/mtb-bicikl-storm/ponude')?.id).toBe('J4')
    expect(razresi('/ana/poslovni/planovi')?.id).toBe('F1')
  })
  it('F1 i F2 (poslovni nalog) vide i građani, jer N2 vodi na F1', () => {
    for (const id of ['F1', 'F2']) expect(RUTE.find((r) => r.id === id)!.uglovi).toEqual(expect.arrayContaining(['ana', 'marko', 'prodavnica']))
  })
})
