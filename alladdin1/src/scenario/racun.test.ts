// SLOJ 1 (B3): pravila koja važe za BILO KOJU cenu. Ovi testovi ostaju tačni i kad se cena promeni u uslovi.ts.
import { describe, expect, it } from 'vitest'
import { brojRadnji } from '../prica/koraci'
import type { Ishod, Poz } from '../prica/tipovi'
import * as R from './racun'
import * as P from './ponude'
import { stanjeGrupe, statusiPutnika, tabla } from './stanjeGrupe'

// Za B i C stanje zavisi i od koraka 1–6, pa se proveravaju celi putevi.
function celiPut(ishod: Ishod): Poz[] {
  const lista: Poz[] = []
  for (let k = 1; k <= 9; k++) for (let n = 0; n <= brojRadnji(k, ishod); n++) lista.push({ korak: k, n, ishod })
  return lista
}

const IMENA = { marko: 'M', teodora: 'T', ana: 'A', mateo: 'Q' }
const sviBrojevi = (o: unknown): number[] =>
  typeof o === 'number' ? [o] : o && typeof o === 'object' ? Object.values(o as Record<string, unknown>).flatMap(sviBrojevi) : []

describe('racun: pravila za bilo koju cenu', () => {
  it('zbir rata po putniku = cena; avans + rata 2 + rata 3 = vrednost paketa', () => {
    expect(R.AVANS_PO_PUTNIKU + R.RATA2_PO_PUTNIKU + R.RATA3_PO_PUTNIKU).toBe(R.CENA_V2)
    expect(R.AVANS_GRUPE + R.RATA2_GRUPE + R.RATA3_GRUPE).toBe(R.vrednostV2)
    expect(R.AVANS_PROC + R.RATA2_PROC + R.RATA3_PROC).toBe(100)
  })
  it('v2 − v1 = dodatak × sedišta', () => {
    expect(R.vrednostV2 - R.vrednostV1).toBe(R.DODATAK_V2 * R.SEDISTA)
    expect(R.RAZLIKA_V2_UKUPNO).toBe(R.DODATAK_V2 * R.SEDISTA)
  })
  it('avans grupe = procenat × vrednost, i = sedišta × avans po putniku (celi brojevi)', () => {
    expect(R.AVANS_GRUPE).toBe(R.proc(R.vrednostV2, R.AVANS_PROC))
    expect(R.AVANS_GRUPE).toBe(R.SEDISTA * R.AVANS_PO_PUTNIKU)
    expect(R.AVANS_GRUPE_V1).toBe(R.proc(R.vrednostV1, R.AVANS_PROC))
  })
  it('proc baca grešku kad rezultat nije ceo broj', () => {
    expect(() => R.proc(333, 20)).toThrow()
    expect(R.proc(500, 20)).toBe(100)
  })
  it('sobe: standard + VIP = sedišta; u B sobe = sedišta bloka', () => {
    expect(R.STANDARD_SOBA_V2 + R.VIP_APARTMANA).toBe(R.SEDISTA)
    expect(R.STANDARD_SOBA_B + R.VIP_APARTMANA_U_B).toBe(R.BLOK_B)
  })
  it('upis: spremni + oni koji čekaju e-mail = redovi u fajlu; slobodnih mesta posle uvoza', () => {
    expect(R.UPIS.spremnoZaUvoz + R.UPIS.cekaEmail).toBe(R.UPIS.redovaUFajlu)
    expect(R.SEDISTA - R.UPIS.spremnoZaUvoz).toBeGreaterThan(0)
  })
  it('B: neto fakture (avans − kreditna nota + fakture putnika) = vrednost manjeg bloka', () => {
    expect(R.AVANS_GRUPE - R.KREDITNA_NOTA_B + R.BLOK_B * R.FAKTURA_PUTNIKA).toBe(R.VREDNOST_B)
    expect(R.AVANS_ZADRZAN_B + R.BLOK_B * R.RATA2_PO_PUTNIKU).toBe(R.proc(R.VREDNOST_B, 100 - R.RATA3_PROC))
  })
  it('C: povraćaj + zadržano = plaćeno do roka', () => {
    expect(R.POVRACAJ_UKUPNO_C + R.TROSKOVI_OBRADE_C).toBe(R.PLACENO_DO_ROKA_C)
    expect(R.POVRACAJ_AVANSA_C + R.TROSKOVI_OBRADE_C).toBe(R.AVANS_GRUPE)
  })
  it('sporedne grupe: plaćeno + preostalo = vrednost; avans = procenat', () => {
    for (const g of [R.VEGAS, R.GRAND_PRIX]) {
      expect(g.placeno + g.preostalo).toBe(g.vrednost)
      expect(g.placeno).toBe(R.proc(g.vrednost, R.AVANS_PROC))
    }
  })
  it('slobodni tokovi: zbir = zbir stavki; avans = procenat × zbir', () => {
    expect(P.krstarenjeOsnova + P.krstarenjeDodaci + P.KRSTARENJE.takseIPristojbe).toBe(P.krstarenjeUkupno)
    expect(P.monteKarloAvans + P.monteKarloSaldo).toBe(P.monteKarloUkupno)
    expect(P.monteKarloAvans).toBe(R.proc(P.monteKarloUkupno, P.MONTE_KARLO.avansProc))
    expect(P.konsijerzUkupno).toBe(P.KONSIJERZ.galaPaket + P.KONSIJERZ.partneriITakse)
  })
})

describe('stanjeGrupe: invarijante u SVAKOM stanju (korak × odrađeno × ishod)', () => {
  for (const ishod of ['A', 'B', 'C'] as Ishod[]) {
    const put = celiPut(ishod)
    it(`ishod ${ishod}: ništa nije negativno niti razlomljeno`, () => {
      for (const p of put) {
        for (const v of sviBrojevi(stanjeGrupe(p))) {
          expect(Number.isInteger(v), JSON.stringify(p)).toBe(true)
          expect(v, JSON.stringify(p)).toBeGreaterThanOrEqual(0)
        }
        for (const v of sviBrojevi(tabla(p).redovi)) expect(Number.isInteger(v) && v >= 0, JSON.stringify(p)).toBe(true)
      }
    })
    it(`ishod ${ishod}: plaćeno + preostalo = vrednost bloka (dok rezervacija postoji)`, () => {
      for (const p of put) {
        const s = stanjeGrupe(p)
        if (s.prihvacena && !s.otkazano) expect(s.placeno + s.preostalo, JSON.stringify(p)).toBe(s.vrednostBloka)
      }
    })
    it(`ishod ${ishod}: pločice G6 = zbir grupa (nezavisno preračunato)`, () => {
      for (const p of put) {
        const s = stanjeGrupe(p)
        const t = tabla(p)
        const macau = s.prihvacena && !s.otkazano
        expect(t.preostaloZaNaplatu, JSON.stringify(p)).toBe(R.VEGAS.preostalo + R.GRAND_PRIX.preostalo + (macau ? s.preostalo : 0))
        expect(t.potvrdjeniPutnici).toBe(R.VEGAS.upisano + R.GRAND_PRIX.upisano + (macau ? s.upisano : 0))
        expect(t.ukupnoSedista).toBe(R.VEGAS.sedista + R.GRAND_PRIX.sedista + (macau ? s.blokSedista : 0))
        expect(t.aktivne).toBe(2 + (macau ? 1 : 0))
        expect(t.akcije.length).toBeGreaterThan(0)
      }
    })
    it(`ishod ${ishod}: Markovo plaćeno + preostalo = cena (osim posle otkaza)`, () => {
      for (const p of put) {
        const s = stanjeGrupe(p)
        if (s.marko.upisan && !s.otkazano) expect(s.marko.placeno + s.marko.preostalo, JSON.stringify(p)).toBe(R.CENA_V2)
      }
    })
    it(`ishod ${ishod}: statusi putnika postoje i nema negativnih iznosa`, () => {
      for (const p of put) for (const r of statusiPutnika(p, IMENA)) expect(r.iznos).toBeGreaterThanOrEqual(0)
    })
  }

  it('plaćeno nikad ne opada na glavnom putu (A)', () => {
    let prethodno = 0
    for (const p of celiPut('A')) {
      const s = stanjeGrupe(p)
      expect(s.placeno).toBeGreaterThanOrEqual(prethodno)
      prethodno = s.placeno
    }
  })
  it('B: sobe u B = sedišta u B; upisano = blok; avans zadržan + kreditna nota = avans grupe', () => {
    const s = stanjeGrupe({ korak: 7, n: 2, ishod: 'B' })
    expect(s.standardSoba + s.vipApartmana).toBe(s.blokSedista)
    expect(s.upisano).toBe(s.blokSedista)
    expect(s.avansPlacen + R.KREDITNA_NOTA_B).toBe(R.AVANS_GRUPE)
  })
  it('C: posle izbora otkaza povraćaj + zadržano = plaćeno', () => {
    const s = stanjeGrupe({ korak: 7, n: 2, ishod: 'C' })
    expect(s.povracaj).not.toBeNull()
    expect(s.povracaj!.ukupno + s.povracaj!.zadrzano).toBe(s.placeno)
    expect(s.povracaj!.avansDeo + s.povracaj!.putniciDeo).toBe(s.povracaj!.ukupno)
  })
  it('G6: Macau nije na tabli dok ponuda nije prihvaćena', () => {
    expect(tabla({ korak: 3, n: 2, ishod: 'A' }).aktivne).toBe(2)
    expect(tabla({ korak: 4, n: 1, ishod: 'A' }).aktivne).toBe(3)
  })
})
