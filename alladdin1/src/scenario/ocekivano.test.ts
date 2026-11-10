// SLOJ 2 (B3): izračunato se poredi sa kontrolnom tabelom prepisanom iz UX.md odeljak 8.
import { describe, expect, it } from 'vitest'
import * as R from './racun'
import * as P from './ponude'
import { stanjeGrupe, tabla } from './stanjeGrupe'
import { OCEKIVANO_ISHODI, OCEKIVANO_MARKO, OCEKIVANO_PAKET, OCEKIVANO_PROCENTI, OCEKIVANO_SPOREDNE, OCEKIVANO_STANJE, OCEKIVANO_TABLA, OCEKIVANO_TOKOVI } from './ocekivano'

describe('UX.md 8.1 paket Macau', () => {
  it('brojke paketa', () => {
    expect(R.SEDISTA).toBe(OCEKIVANO_PAKET.sedista)
    expect(R.CENA_V1).toBe(OCEKIVANO_PAKET.cenaV1)
    expect(R.CENA_V2).toBe(OCEKIVANO_PAKET.cenaV2)
    expect(R.vrednostV2).toBe(OCEKIVANO_PAKET.vrednostV2)
    expect(R.vrednostV1).toBe(OCEKIVANO_PAKET.vrednostV1)
    expect(R.RAZLIKA_V2_UKUPNO).toBe(OCEKIVANO_PAKET.razlikaUkupno)
    expect(R.AVANS_GRUPE).toBe(OCEKIVANO_PAKET.avansGrupe)
    expect(R.AVANS_GRUPE_V1).toBe(OCEKIVANO_PAKET.avansGrupeV1)
    expect(R.AVANS_PO_PUTNIKU).toBe(OCEKIVANO_PAKET.avansPoPutniku)
    expect(R.RATA2_PO_PUTNIKU).toBe(OCEKIVANO_PAKET.rata2PoPutniku)
    expect(R.RATA3_PO_PUTNIKU).toBe(OCEKIVANO_PAKET.rata3PoPutniku)
    expect(R.RATA2_GRUPE).toBe(OCEKIVANO_PAKET.rata2Grupe)
    expect(R.RATA3_GRUPE).toBe(OCEKIVANO_PAKET.rata3Grupe)
    expect(R.STANDARD_SOBA_V2).toBe(OCEKIVANO_PAKET.standardSobaV2)
    expect(R.VIP_APARTMANA).toBe(OCEKIVANO_PAKET.vipApartmana)
  })
})

describe('UX.md 8.3–8.4 ishodi B i C', () => {
  it('brojke ishoda', () => {
    expect(R.KREDITNA_NOTA_B).toBe(OCEKIVANO_ISHODI.kreditnaNotaB)
    expect(R.BLOK_B).toBe(OCEKIVANO_ISHODI.blokB)
    expect(R.VREDNOST_B).toBe(OCEKIVANO_ISHODI.vrednostB)
    expect(R.AVANS_ZADRZAN_B).toBe(OCEKIVANO_ISHODI.avansZadrzanB)
    expect(R.STANDARD_SOBA_B).toBe(OCEKIVANO_ISHODI.standardSobaB)
    expect(R.TROSKOVI_OBRADE_C).toBe(OCEKIVANO_ISHODI.troskoviObradeC)
    expect(R.POVRACAJ_UKUPNO_C).toBe(OCEKIVANO_ISHODI.povracajC)
    expect(R.POVRACAJ_AVANSA_C).toBe(OCEKIVANO_ISHODI.povracajAvansaC)
    expect(R.POVRACAJ_PUTNICIMA_C).toBe(OCEKIVANO_ISHODI.povracajPutnicimaC)
    expect(R.PLACENO_DO_ROKA_C).toBe(OCEKIVANO_ISHODI.placenoDoRokaC)
  })
  for (const r of OCEKIVANO_STANJE) {
    it(`stanje grupe: ${r.naziv}`, () => {
      const s = stanjeGrupe(r.poz)
      expect(s.upisano).toBe(r.upisano)
      expect(s.rata2Sedista).toBe(r.rata2)
      expect(s.placeno).toBe(r.placeno)
      expect(s.preostalo).toBe(r.preostalo)
      expect(s.fakture).toBe(r.fakture)
    })
  }
  it('procenti plaćenog', () => {
    for (const r of OCEKIVANO_PROCENTI) expect(stanjeGrupe(r.poz).procentPlaceno, JSON.stringify(r.poz)).toBe(r.procenat)
  })
  it('ishod C posle izbora: plaćeno do roka, povraćaj i zadržano', () => {
    const s = stanjeGrupe({ korak: 7, n: 2, ishod: 'C' })
    expect(s.placeno).toBe(OCEKIVANO_ISHODI.placenoDoRokaC)
    expect(s.povracaj?.ukupno).toBe(OCEKIVANO_ISHODI.povracajC)
    expect(s.povracaj?.zadrzano).toBe(OCEKIVANO_ISHODI.troskoviObradeC)
    const kraj = stanjeGrupe({ korak: 8, n: 1, ishod: 'C' })
    expect(kraj.povracaj?.potvrdjen).toBe(true)
  })
})

describe('UX.md 8.5 tabla organizatora', () => {
  it('dve fiksne grupe', () => {
    for (const [kljuc, g] of [['vegas', R.VEGAS], ['grandPrix', R.GRAND_PRIX]] as const) {
      expect(g.vrednost).toBe(OCEKIVANO_SPOREDNE[kljuc].vrednost)
      expect(g.placeno).toBe(OCEKIVANO_SPOREDNE[kljuc].placeno)
      expect(g.preostalo).toBe(OCEKIVANO_SPOREDNE[kljuc].preostalo)
      expect(g.rata2).toBe(OCEKIVANO_SPOREDNE[kljuc].rata2)
    }
  })
  for (const r of OCEKIVANO_TABLA) {
    it(`pločice: ${r.naziv}`, () => {
      const t = tabla(r.poz)
      expect(t.aktivne).toBe(r.aktivne)
      expect(t.potvrdjeniPutnici).toBe(r.potvrdjeni)
      expect(t.ukupnoSedista).toBe(r.sedista)
      expect(t.preostaloZaNaplatu).toBe(r.preostalo)
    })
  }
})

describe('UX.md 8.2 i 8.7', () => {
  for (const r of OCEKIVANO_MARKO) {
    it(`Marko: ${r.naziv}`, () => {
      const s = stanjeGrupe(r.poz)
      expect(s.marko.placeno).toBe(r.placeno)
      expect(s.marko.preostalo).toBe(r.preostalo)
    })
  }
  it('slobodni tokovi', () => {
    expect(P.krstarenjeOsnova).toBe(OCEKIVANO_TOKOVI.krstarenje.osnova)
    expect(P.krstarenjeDodaci).toBe(OCEKIVANO_TOKOVI.krstarenje.dodaci)
    expect(P.KRSTARENJE.takseIPristojbe).toBe(OCEKIVANO_TOKOVI.krstarenje.takse)
    expect(P.krstarenjeUkupno).toBe(OCEKIVANO_TOKOVI.krstarenje.ukupno)
    expect(P.monteKarloUkupno).toBe(OCEKIVANO_TOKOVI.monteKarlo.ukupno)
    expect(P.monteKarloAvans).toBe(OCEKIVANO_TOKOVI.monteKarlo.avans)
    expect(P.monteKarloSaldo).toBe(OCEKIVANO_TOKOVI.monteKarlo.saldo)
    expect(P.konsijerzUkupno).toBe(OCEKIVANO_TOKOVI.konsijerz.ukupno)
    expect(P.TRANSPORT.helikopter).toBe(OCEKIVANO_TOKOVI.transport.helikopter)
  })
})
