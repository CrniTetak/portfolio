// Regresija (plan dorade 3, odeljak 5.4): stari „Skoči na…" == nove pozicije priče. Svet mora biti isti,
// osim glasa iz koraka 4 (stari skokovi ga nisu imali).
import { describe, expect, it } from 'vitest'
import { izgradiSvet } from '../prica/izgradi'
import { POSTAVKE } from '../prica/pomocno-za-testove'
import type { Pozicija } from '../prica/tipovi'
import { SKOKOVI, stanjeZaSkok } from './skokovi-za-testove'

const TABELA: Record<string, Pozicija> = {
  pocetak: { korak: 1, odradjeno: 0, grana: 'vazi' },
  izbor: { korak: 3, odradjeno: 1, grana: 'vazi' },
  opcija: { korak: 5, odradjeno: 2, grana: 'vazi' },
  osporavanje: { korak: 5, odradjeno: 3, grana: 'vazi' },
  zahtev: { korak: 6, odradjeno: 1, grana: 'vazi' },
  odobrio: { korak: 7, odradjeno: 1, grana: 'vazi' },
  uplata: { korak: 8, odradjeno: 1, grana: 'vazi' },
  otkazao: { korak: 9, odradjeno: 1, grana: 'otkaz' },
}

describe('stari skokovi == nove pozicije', () => {
  for (const [id, poz] of Object.entries(TABELA)) {
    it(`skok „${id}"`, () => {
      expect(SKOKOVI.some((k) => k.id === id)).toBe(true)
      const staro = stanjeZaSkok(id, false).stanje
      const novo = izgradiSvet(poz, POSTAVKE)
      // razlike su dozvoljene samo u glasovima (korak 4) i u polju priče
      expect({ ...novo, glasovi: [], prica: null, uloga: 'x' }).toEqual({ ...staro, glasovi: [], prica: null, uloga: 'x' })
      if (poz.korak >= 4) expect(novo.glasovi).toHaveLength(1)
      else expect(novo.glasovi).toHaveLength(0)
    })
  }
  it('Predračun sa uslugama je van priče (Alati u slobodnom režimu) i ima svoj test u most.test.ts', () => {
    expect(SKOKOVI.some((k) => k.id === 'usluge')).toBe(true)
  })
})
