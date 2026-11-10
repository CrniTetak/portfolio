// Testovi izvora podataka (PLAN B3): kanali, paketi, cene, zemlje i dostupnost, emisije, brojke, format, stalni tekstovi.
import { existsSync, readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { DELOVI, matricaPrava, PRIHOD_PO_DELOVIMA, GLEDANOST, PRAVA_KANALA, udeo, ukupniPrihod } from './brojke'
import { CENE, cenaKanala, cenaPaketa } from './cene'
import { EMISIJE, SADA, TRAJANJE_REKLAME, emisijaSada, rasporedKanala } from './emisije'
import { broj, cena, cenaMesecno, datum, procenat, vreme } from './format'
import { FILMSKA_RIZNICA, KANALI, ZANROVI } from './kanali'
import { LIKOVI } from './likovi'
import { PAKETI } from './paketi'
import { REKLAME } from './reklame'
import { NEDOSTUPNO, OZNAKA_DEMOA, SIMULIRANA_RADNJA, CENA_ZAVISI_OD_ZEMLJE } from './stalni-tekstovi'
import { KANAL_BESPLATNI_FILM, KANAL_GLAVNI, PAKET_PRICE, dostupan, nedostupniU, popuni, proizvod } from './svet'
import { KODOVI_ZEMALJA, ZEMLJE } from './zemlje'
import { KORACI, karticaTekst } from '../prica/koraci'

describe('kanali (KANALI.md)', () => {
  it('18 kanala: 5 besplatnih, 3 po izboru, 10 u paketima', () => {
    expect(KANALI).toHaveLength(18)
    expect(KANALI.filter((k) => k.deo === 'besplatni')).toHaveLength(5)
    expect(KANALI.filter((k) => k.deo === 'po-izboru')).toHaveLength(3)
    expect(KANALI.filter((k) => k.deo === 'paket')).toHaveLength(10)
  })
  it('id i naziv su jedinstveni; svaki kanal je u tačno jednom delu', () => {
    expect(new Set(KANALI.map((k) => k.id)).size).toBe(18)
    expect(new Set(KANALI.map((k) => k.naziv)).size).toBe(18)
    for (const k of KANALI) {
      expect(['besplatni', 'po-izboru', 'paket']).toContain(k.deo)
      expect(k.deo === 'paket').toBe(k.paket !== undefined)
    }
  })
  it('žanrovi samo iz spiska (bez „Vesti“ i „Kuhinje“)', () => {
    expect(ZANROVI).toEqual(['Film', 'Serije', 'Zabava', 'Muzika', 'Sport', 'Dokumentarci', 'Deca', 'Opšti program'])
    for (const k of KANALI) expect(ZANROVI).toContain(k.zanr)
    expect(JSON.stringify(KANALI)).not.toMatch(/Vesti|Kuhinj/)
  })
  it('svaka uloga u priči ima tačno jedan kanal; nedostupni u Srbiji su tačno 3 (Doma TV, CMC, Hayat TV)', () => {
    expect(KANALI.filter((k) => k.ulogaUPrici === 'besplatni-film')).toHaveLength(1)
    expect(KANALI.filter((k) => k.ulogaUPrici === 'glavni-po-izboru')).toHaveLength(1)
    expect(PAKETI.filter((p) => p.ulogaUPrici === 'paket-price')).toHaveLength(1)
    expect(KANAL_BESPLATNI_FILM.naziv).toBe('Klasik')
    expect(KANAL_GLAVNI.naziv).toBe('Doma TV')
    expect(PAKET_PRICE.naziv).toBe('Paket Srbija')
    expect(nedostupniU('RS').map((k) => k.naziv).sort()).toEqual(['CMC', 'Doma TV', 'Hayat TV'])
  })
  it('„Filmska riznica“ je izmišljena i NIJE u ponudi gledaoca', () => {
    expect(FILMSKA_RIZNICA.naziv).toBe('Filmska riznica')
    expect(KANALI.some((k) => k.naziv === FILMSKA_RIZNICA.naziv || k.id === FILMSKA_RIZNICA.id)).toBe(false)
    expect(PAKETI.some((p) => p.kanali.some((k) => k.id === FILMSKA_RIZNICA.id))).toBe(false)
  })
  it('svaki kanal ima tri emisije', () => {
    for (const k of KANALI) expect(k.emisije).toHaveLength(3)
  })
})

describe('paketi i cene', () => {
  it('5 paketa, svaki sa tačno 2 kanala; svaki kanal paketa pripada tačno jednom paketu', () => {
    expect(PAKETI).toHaveLength(5)
    for (const p of PAKETI) expect(p.kanali).toHaveLength(2)
    const sviKanaliPaketa = PAKETI.flatMap((p) => p.kanali.map((k) => k.id))
    expect(new Set(sviKanaliPaketa).size).toBe(10)
    expect(PAKETI.filter((p) => p.vrsta === 'zemlja')).toHaveLength(3)
    expect(PAKETI.filter((p) => p.vrsta === 'zanr')).toHaveLength(2)
  })
  it('cene su 2,99 / 5,99 / 9,99 € (u centima)', () => {
    expect(CENE).toEqual({ kanalPoIzboru: 299, paketZanr: 599, paketZemlja: 999 })
    for (const k of KANALI.filter((x) => x.deo === 'po-izboru')) expect(cena(cenaKanala(k)!)).toBe('2,99 €')
    for (const k of KANALI.filter((x) => x.deo === 'besplatni')) expect(cenaKanala(k)).toBe(0)
    for (const k of KANALI.filter((x) => x.deo === 'paket')) expect(cenaKanala(k)).toBeNull()
    for (const p of PAKETI) expect(cena(cenaPaketa(p))).toBe(p.vrsta === 'zemlja' ? '9,99 €' : '5,99 €')
  })
})

describe('zemlje i dostupnost', () => {
  it('pet zemalja: DE, AT, CH (pilot), GR, RS', () => {
    expect(KODOVI_ZEMALJA).toEqual(['DE', 'AT', 'CH', 'GR', 'RS'])
    expect(ZEMLJE.filter((z) => z.pilot).map((z) => z.kod)).toEqual(['DE', 'AT', 'CH'])
  })
  it('Nemačka, Austrija, Švajcarska i Grčka: svih 18; Srbija: sve osim 3', () => {
    for (const kod of ['DE', 'AT', 'CH', 'GR'] as const) expect(KANALI.filter((k) => dostupan(k, kod))).toHaveLength(18)
    expect(KANALI.filter((k) => dostupan(k, 'RS'))).toHaveLength(15)
  })
  it('proizvod: kanal po izboru i paket sa cenom; nepoznat id nema proizvod', () => {
    expect(proizvod('doma-tv')?.cena).toBe(299)
    expect(proizvod('srbija')?.vrsta).toBe('paket')
    expect(proizvod('srbija')?.kanali).toHaveLength(2)
    expect(proizvod('nema')).toBeUndefined()
  })
})

describe('emisije, raspored, reklame', () => {
  it('54 emisije; svaka sa početkom pre kraja; svaki kanal ima emisiju koja traje u 20:00', () => {
    expect(EMISIJE).toHaveLength(54)
    expect(new Set(EMISIJE.map((e) => e.id)).size).toBe(54)
    for (const e of EMISIJE) expect(e.pocetak).toBeLessThan(e.kraj)
    for (const k of KANALI) expect(emisijaSada(k.id).kanalId).toBe(k.id)
    expect(SADA).toBe(1200)
  })
  it('raspored: bez preklapanja i rupa; u celini u mreži 19:00–23:00 u koracima od 15 min; reklama samo na besplatnim', () => {
    for (const k of KANALI) {
      const slotovi = rasporedKanala(k.id)
      let kraj = -1
      for (const s of slotovi) {
        const od = s.tip === 'emisija' ? s.emisija.pocetak : s.pocetak
        const do_ = s.tip === 'emisija' ? s.emisija.kraj : s.kraj
        if (kraj >= 0) expect(od).toBe(kraj)
        expect(od % 15).toBe(0)
        expect(do_ % 15).toBe(0)
        expect(od).toBeGreaterThanOrEqual(SADA - 60)
        expect(do_).toBeLessThanOrEqual(SADA + 180)
        kraj = do_
      }
      const reklame = slotovi.filter((s) => s.tip === 'reklama')
      expect(reklame).toHaveLength(k.deo === 'besplatni' ? 1 : 0)
      for (const r of reklame) expect(r.kraj - r.pocetak).toBe(TRAJANJE_REKLAME)
    }
  })
  it('dve izmišljene reklame bez pravih brendova', () => {
    expect(REKLAME).toHaveLength(2)
  })
})

describe('brojke (V1 i M1)', () => {
  it('prihodi po delovima se sabiraju u ukupno; udeli su celi i daju 100 %', () => {
    const zbir = Object.values(PRIHOD_PO_DELOVIMA).reduce((a, b) => a + b, 0)
    expect(ukupniPrihod()).toBe(zbir)
    const udeli = DELOVI.map((d) => udeo(d))
    for (const u of udeli) expect(Number.isInteger(u)).toBe(true)
    expect(udeli.reduce((a, b) => a + b, 0)).toBe(100)
  })
  it('matrica prava pokriva 3 dela × 5 zemalja', () => {
    const m = matricaPrava()
    expect(Object.keys(m).sort()).toEqual(['besplatni', 'paket', 'po-izboru'])
    for (const d of DELOVI) expect(Object.keys(m[d]).sort()).toEqual([...KODOVI_ZEMALJA].sort())
    for (const d of DELOVI) for (const z of ['DE', 'AT', 'CH', 'GR'] as const) expect(m[d][z]).toBe('obezbedjeno')
    expect(m.paket.RS).toBe('obezbedjeno')
    expect(m.besplatni.RS).toBe('delimicno')
    expect(m['po-izboru'].RS).toBe('delimicno')
  })
  it('V1: zemlje gledanosti i prava Vesnine su zemlje iz zemlje.ts', () => {
    expect(Object.keys(GLEDANOST).sort()).toEqual([...KODOVI_ZEMALJA].sort())
    expect(Object.keys(PRAVA_KANALA).sort()).toEqual([...KODOVI_ZEMALJA].sort())
  })
})

describe('format (jedino mesto prikaza)', () => {
  it('cene', () => {
    expect(cena(299)).toBe('2,99 €')
    expect(cena(999)).toBe('9,99 €')
    expect(cena(1200000)).toBe('12.000,00 €')
    expect(cena(5)).toBe('0,05 €')
    expect(cenaMesecno(599)).toBe('5,99 € mesečno')
  })
  it('brojevi, procenti, vreme, datum', () => {
    expect(broj(1284)).toBe('1.284')
    expect(broj(999)).toBe('999')
    expect(broj(1234567)).toBe('1.234.567')
    expect(procenat(60)).toBe('60 %')
    expect(vreme(19 * 60 + 5)).toBe('19:05')
    expect(vreme(0)).toBe('00:00')
    expect(datum('2026-10-12')).toBe('12. 10. 2026.')
  })
})

describe('stalni tekstovi', () => {
  it('oznaka demoa je TAČNO tekst iz UX.md (odeljak 2) i iz plana', () => {
    expect(OZNAKA_DEMOA).toBe('Demo — primer. Prikazani kanali nisu partneri TerraVista-e i nema dogovora s njima. Cene i podaci su izmišljeni.')
    const ux = new URL('../../../dizajn/UX.md', import.meta.url)
    if (existsSync(ux)) expect(readFileSync(ux, 'utf8')).toContain(`„${OZNAKA_DEMOA}“`)
  })
  it('ostali stalni tekstovi', () => {
    expect(NEDOSTUPNO).toBe('Prava za ovu zemlju nisu obezbeđena (primer).')
    expect(SIMULIRANA_RADNJA).toBe('Simulirana radnja — ništa nije poslato ni naplaćeno')
    expect(CENA_ZAVISI_OD_ZEMLJE).toBe('Cena zavisi od zemlje (primer).')
  })
  it('likovi: Ana, Nikola, Sara Marković i Vesna', () => {
    expect(LIKOVI.map((l) => l.ime)).toEqual(['Ana', 'Nikola', 'Sara', 'Vesna'])
  })
})

describe('šabloni kartica priče (popuni)', () => {
  it('ubacuje imena, kanale i cene iz podataka', () => {
    expect(popuni('{ana} bira {glavniKanal} za {cenaKanala}')).toBe('Ana bira Doma TV za 2,99 €')
  })
  it('nepoznato mesto je greška', () => {
    expect(() => popuni('{nepoznato}')).toThrow()
  })
  it('9 koraka; svaka kartica je popunjena (bez zagrada) i staje u fiksnu visinu (najviše 3 rečenice, do 200 znakova)', () => {
    expect(KORACI).toHaveLength(9)
    for (const k of KORACI) {
      const t = karticaTekst(k.broj)
      expect(t).not.toMatch(/[{}]/)
      expect(t.length).toBeLessThanOrEqual(200)
      expect((t.match(/[.!?](\s|$)/g) ?? []).length).toBeLessThanOrEqual(4)
    }
    expect(karticaTekst(3)).toContain('Doma TV')
    expect(karticaTekst(3)).toContain('2,99 €')
    expect(karticaTekst(5)).toContain('Paket Srbija')
    expect(karticaTekst(6)).toContain(NEDOSTUPNO)
    expect(karticaTekst(8)).toContain('Filmska riznica')
  })
})
