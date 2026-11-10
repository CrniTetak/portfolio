// Talas 1: lanac 1–8 za Anu i Marka, radnju po radnju kroz isti reducer kroz koji idu dugmad na ekranima.
import { describe, expect, it } from 'vitest'
import { recenzijeKorisnika } from '../scenario/svet'
import { brojRadnji } from './koraci'
import { odigraj } from './navigacija'
import { POCETNA_POZICIJA, izvedi, mozeRadnja, reducer } from './reducer'
import { saglasnostiZa } from './saglasnosti'
import type { Poz } from './tipovi'

describe('Ana kroz korake 1–8', () => {
  it('klik po klik sa pravim radnjama (Marko i Jovana rade automatski)', () => {
    let p: Poz = POCETNA_POZICIJA
    const sledeci = () => (p = reducer(p, { t: 'sledeciKorak' }))
    for (const [id, n] of [['1.r2', 1], ['1.r3', 2], ['1.r4', 3]] as const) {
      p = izvedi(p, id, 'ana')
      expect(p).toMatchObject({ korak: 1, n })
    }
    sledeci()
    for (const id of ['2.o2', '2.o3', '2.zelja']) p = izvedi(p, id, 'ana')
    sledeci()
    p = izvedi(p, '3.w4', 'ana')
    sledeci()
    for (const id of ['4.x1', '4.x2']) p = izvedi(p, id, 'ana')
    sledeci()
    p = odigraj({ korak: 5, n: brojRadnji(5, 'lanac'), grana: 'lanac' }) // Ana nema radnji u koraku 5: Dalje ga završava
    sledeci()
    p = izvedi(p, '6.ana', 'ana')
    expect(p).toEqual({ korak: 6, n: 3, grana: 'lanac' })
    sledeci()
    for (const id of ['7.x8', '7.c2', '7.d1', '7.d2', '7.z3', '7.z4']) p = izvedi(p, id, 'ana')
    expect(p).toEqual({ korak: 7, n: 6, grana: 'lanac' })
    sledeci()
    p = izvedi(p, '8.pot.ana', 'ana')
    expect(p.n).toBe(3)
    for (const id of ['8.x10', '8.x11']) p = izvedi(p, id, 'ana')
    expect(p).toEqual({ korak: 8, n: 5, grana: 'lanac' })
  })
})

describe('Marko', () => {
  it('korak 5: tri radnje, moderacija odlučuje sama', () => {
    let p: Poz = { korak: 5, n: 0, grana: 'lanac' }
    for (const id of ['5.x4', '5.x5', '5.x6']) p = izvedi(p, id, 'marko')
    expect(p).toEqual({ korak: 5, n: 5, grana: 'lanac' })
  })
  it('korak 7: kad se dogovori, Anina dostava se odigra sama', () => {
    let p: Poz = { korak: 7, n: 0, grana: 'lanac' }
    for (const id of ['7.x8', '7.c2']) p = izvedi(p, id, 'marko')
    expect(p).toEqual({ korak: 7, n: 6, grana: 'lanac' })
  })
  it('korak 8: Anina potvrda ide pre njegove, Jovanina posle', () => {
    expect(izvedi({ korak: 8, n: 0, grana: 'lanac' }, '8.pot.marko', 'marko').n).toBe(3)
  })
  it('poklapanje (3.w4) mogu i Ana i Marko, a Prodavnica ne', () => {
    const p: Poz = { korak: 3, n: 0, grana: 'lanac' }
    expect(mozeRadnja(p, '3.w4', 'ana')).toBe(true)
    expect(mozeRadnja(p, '3.w4', 'marko')).toBe(true)
    expect(mozeRadnja(p, '3.w4', 'prodavnica')).toBe(false)
  })
})

describe('kvačice saglasnosti prate odrađene radnje', () => {
  it('nijedna nije unapred štiklirana', () => {
    expect(saglasnostiZa({ korak: 1, n: 0, grana: 'lanac' })).toEqual([])
    expect(saglasnostiZa({ korak: 4, n: 0, grana: 'lanac' })).not.toContain('x2_razumem')
  })
  it('„Dalje“ štiklira samo ono što je u tom koraku odrađeno', () => {
    expect(saglasnostiZa({ korak: 1, n: 3, grana: 'lanac' })).toEqual(expect.arrayContaining(['r3_punoletstvo', 'r3_uslovi']))
    expect(saglasnostiZa({ korak: 4, n: 2, grana: 'lanac' })).toContain('x2_razumem')
    expect(saglasnostiZa({ korak: 7, n: 6, grana: 'lanac' })).toEqual(expect.arrayContaining(['d2_uslovi', 'z3_odmah_dostava']))
  })
})

describe('recenzije korisnika kroz priču', () => {
  it('posle koraka 8 nova recenzija stoji na vrhu, lista ima najviše pet', () => {
    const posle: Poz = { korak: 8, n: 5, grana: 'lanac' }
    const marko = recenzijeKorisnika('marko_voz77', posle)
    expect(marko).toHaveLength(5)
    expect(marko[0]).toMatchObject({ autor: 'ana_zvz84', ocena: 5 })
    const ana = recenzijeKorisnika('ana_zvz84', posle)
    expect(ana).toHaveLength(1)
    expect(ana[0].autor).toBe('jovana_vra91')
    expect(recenzijeKorisnika('ana_zvz84', { korak: 3, n: 0, grana: 'lanac' })).toEqual([])
    expect(recenzijeKorisnika('marko_voz77', { korak: 3, n: 0, grana: 'lanac' })[0].autor).not.toBe('ana_zvz84')
  })
})
