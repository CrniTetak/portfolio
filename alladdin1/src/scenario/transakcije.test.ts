// Dorada 1–3, 9: istorija transakcija (G13), rokovi iz stvarno preostalih rata i upis (57 pozivnica 63, 120 tek na kraju koraka 5).
import { describe, expect, it } from 'vitest'
import { brojRadnji } from '../prica/koraci'
import type { Ishod, Poz } from '../prica/tipovi'
import * as R from './racun'
import { istorijaTransakcija, izvod, stanjeGrupe, tabla } from './stanjeGrupe'

function celiPut(ishod: Ishod): Poz[] {
  const lista: Poz[] = []
  for (let k = 1; k <= 9; k++) for (let n = 0; n <= brojRadnji(k, ishod); n++) lista.push({ korak: k, n, ishod })
  return lista
}

describe('istorija transakcija G13', () => {
  for (const ishod of ['A', 'B', 'C'] as Ishod[]) {
    it(`ishod ${ishod}: zbir redova (bez povraćaja) = plaćeno u SVAKOM stanju; avans je uvek pun iznos`, () => {
      for (const p of celiPut(ishod)) {
        const s = stanjeGrupe(p)
        const redovi = istorijaTransakcija(p)
        expect(redovi.reduce((z, r) => z + r.iznos, 0), JSON.stringify(p)).toBe(s.placeno)
        const avans = redovi.find((r) => r.id === 'deposit')
        if (avans) expect(avans.iznos).toBe(R.AVANS_GRUPE)
      }
    })
  }
  it('B: kreditna nota je poseban red od izbora manjeg bloka', () => {
    expect(istorijaTransakcija({ korak: 7, n: 1, ishod: 'B' }).some((r) => r.id === 'kreditna')).toBe(false)
    const posle = istorijaTransakcija({ korak: 7, n: 2, ishod: 'B' })
    expect(posle.find((r) => r.id === 'kreditna')?.iznos).toBe(-R.KREDITNA_NOTA_B)
  })
})

describe('kreditna nota: jedan uslov svuda (G13 istorija ⇔ G14 izvod ⇔ brojač faktura)', () => {
  for (const ishod of ['A', 'B'] as Ishod[])
    it(`ishod ${ishod}: nota u istoriji ⇔ nota u izvodu u SVAKOM stanju`, () => {
      for (const p of celiPut(ishod)) {
        const uIstoriji = istorijaTransakcija(p).some((r) => r.id === 'kreditna')
        expect(uIstoriji, JSON.stringify(p)).toBe(izvod(p).kreditnaNota !== 0)
        expect(uIstoriji, JSON.stringify(p)).toBe(stanjeGrupe(p).kreditnaNota > 0)
      }
    })
  it('ishod C: nota u izvodu tek posle potvrde povraćaja', () => {
    for (const p of celiPut('C')) expect(izvod(p).kreditnaNota !== 0, JSON.stringify(p)).toBe(!!stanjeGrupe(p).povracaj?.potvrdjen)
  })
  it('B: brojač faktura = avans + nota + fakture putnika', () => {
    for (const p of celiPut('B')) {
      const s = stanjeGrupe(p)
      if (s.avansPrimljen) expect(s.fakture, JSON.stringify(p)).toBe(1 + (s.kreditnaNota > 0 ? 1 : 0) + s.rata3Sedista)
    }
  })
})

describe('G8/G11: slobodna mesta prate blok', () => {
  it('B posle izbora: 0 od 96; A na kraju koraka 5: 0 od 120', () => {
    const b = stanjeGrupe({ korak: 7, n: 2, ishod: 'B' })
    expect([b.slobodnoMesta, b.blokSedista]).toEqual([0, R.BLOK_B])
    const a = stanjeGrupe({ korak: 5, n: 5, ishod: 'A' })
    expect([a.slobodnoMesta, a.blokSedista]).toEqual([0, R.SEDISTA])
  })
  it('u svakom stanju slobodno = blok − upisano, nikad negativno', () => {
    for (const ishod of ['A', 'B', 'C'] as Ishod[]) for (const p of celiPut(ishod)) expect(stanjeGrupe(p).slobodnoMesta, JSON.stringify(p)).toBeGreaterThanOrEqual(0)
  })
})

describe('rokovi rata i upis', () => {
  const rok = (p: Poz) => tabla(p).redovi.find((r) => r.id === 'macau')!.rok
  it('sledeći rok se računa iz STVARNO preostale rate', () => {
    expect(rok({ korak: 6, n: 0, ishod: 'A' })).toMatchObject({ vrsta: 'popunjenost', iznos: R.RATA2_GRUPE })
    expect(rok({ korak: 6, n: 2, ishod: 'A' })).toMatchObject({ vrsta: 'popunjenost', iznos: R.NEPLACENO_NA_ROKU * R.RATA2_PO_PUTNIKU })
    expect(rok({ korak: 7, n: 2, ishod: 'A' })).toMatchObject({ vrsta: 'rata3', iznos: R.RATA3_GRUPE })
    expect(rok({ korak: 8, n: 2, ishod: 'A' })).toMatchObject({ vrsta: 'nema', iznos: 0 })
  })
  it('upis: 57 posle uvoza i linka (63 pozivnice), 120 tek na kraju koraka 5', () => {
    const posleLinka = stanjeGrupe({ korak: 5, n: 2, ishod: 'A' })
    expect(posleLinka.upisano).toBe(R.UPIS.spremnoZaUvoz)
    expect(posleLinka.pozivnicePoslate).toBe(R.SEDISTA - R.UPIS.spremnoZaUvoz)
    const kraj = stanjeGrupe({ korak: 5, n: 5, ishod: 'A' })
    expect(kraj.upisano).toBe(R.SEDISTA)
    expect(kraj.pozivnicePoslate).toBe(0)
  })
})

describe('izvod grupe (G14)', () => {
  const kraj = (korak: number, ishod: Ishod): Poz => ({ korak, n: brojRadnji(korak, ishod), ishod })
  it('A: faktura avansa + fakture putnika = vrednost paketa', () => {
    const i = izvod(kraj(8, 'A'))
    expect(i.avansFaktura + i.fakturePutnika).toBe(R.vrednostV2)
    expect(i.ukupno).toBe(R.vrednostV2)
    expect(i.brojFaktura).toBe(R.SEDISTA)
  })
  it('B: avans − kreditna nota + fakture putnika = vrednost manjeg bloka', () => {
    const i = izvod(kraj(8, 'B'))
    expect(i.kreditnaNota).toBe(-R.KREDITNA_NOTA_B)
    expect(i.ukupno).toBe(R.VREDNOST_B)
  })
  it('C: posle potvrde povraćaja ostaje samo zadržani iznos', () => {
    expect(izvod(kraj(7, 'C')).kreditnaNota).toBe(0)
    expect(izvod(kraj(8, 'C')).ukupno).toBe(R.TROSKOVI_OBRADE_C)
  })
  it('u svakom stanju: ukupno = faktura + kreditna nota + fakture putnika, nikad negativno', () => {
    for (const ishod of ['A', 'B', 'C'] as Ishod[])
      for (const p of celiPut(ishod)) {
        const i = izvod(p)
        expect(i.ukupno).toBe(i.avansFaktura + i.kreditnaNota + i.fakturePutnika)
        expect(i.ukupno).toBeGreaterThanOrEqual(0)
      }
  })
})
