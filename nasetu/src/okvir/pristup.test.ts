import { describe, expect, it } from 'vitest'
import { smeNaLink, ulogeZaLink } from './pristup'

describe('zaštita ruta po ulozi', () => {
  it('/produkcija/* samo za Produkciju (Admin ne vidi ekrane Produkcije)', () => {
    for (const p of ['/produkcija', '/produkcija/opcije', '/produkcija/rezervacija/z-3', '/produkcija/predracun/p-4']) {
      expect(smeNaLink(p, 'produkcija')).toBe(true)
      for (const u of ['admin', 'vlasnik', 'partner'] as const) expect(smeNaLink(p, u)).toBe(false)
    }
  })
  it('vlasnikov predračun za fotografisanje je samo za vlasnika', () => {
    expect(ulogeZaLink('/vlasnik/predracun/p-5')).toEqual(['vlasnik'])
  })
  it('vlasnik, partner i admin ekrani su samo njihovi', () => {
    expect(ulogeZaLink('/vlasnik/zahtev/z-1')).toEqual(['vlasnik'])
    expect(ulogeZaLink('/partner')).toEqual(['partner'])
    expect(ulogeZaLink('/admin/predracun/p-1')).toEqual(['admin'])
  })
  it('pregled izbora samo Produkcija; deljenje i Partner i Admin; javni deo svi', () => {
    expect(ulogeZaLink('/izbor/izb-2')).toEqual(['produkcija'])
    expect(smeNaLink('/izbor/izb-2/deljenje', 'partner')).toBe(true)
    expect(smeNaLink('/izbor/izb-2/deljenje', 'vlasnik')).toBe(false)
    for (const p of ['/', '/lokacije', '/lokacije/industrijski-loft', '/brief', '/izbor/izb-2/primalac', '/primeri', '/pravno']) {
      expect(ulogeZaLink(p)).toHaveLength(4)
    }
  })
})
