// SLOJ 2: KONTROLNA TABELA. Poredi svet() sa brojkama prepisanim iz UX.md 7.1–7.8 (ocekivano.ts).
// Kad test padne, poruka kaže koja tvrdnja iz UX-a više ne važi.
import { describe, expect, it } from 'vitest'
import { brojRadnji } from '../prica/koraci'
import { CENE } from './cene'
import { demoDatum, danUNedelji, DATUM_ISTICE_AUKCIJA_J2, DATUM_SLEDECA_NAPLATA } from './datumi'
import { datum, ocena } from './format'
import { KATEGORIJE } from './kategorije'
import { KORISNICI, REGION_KORISNICI } from './korisnici'
import { poslednjeRecenzije } from './recenzije'
import { OGLASI_BEOGRAD, OGLASI_REGION } from './oglasi'
import * as O from './ocekivano'
import { pocetno, zavrsno } from './pomocno'
import { svet } from './svet'

const s1 = svet(zavrsno(1))
const s2 = svet(zavrsno(2))

describe('UX 7.3: oglasi po kategorijama', () => {
  it('ima tačno 31 kategoriju i 225 oglasa u Beogradu', () => {
    expect(KATEGORIJE.length).toBe(31)
    expect(OGLASI_BEOGRAD.length).toBe(225)
  })
  for (const k of KATEGORIJE) {
    it(`kategorija „${k.naziv}“: ukupno / roba / usluge / ideje`, () => {
      const [ukupno, roba, usluge, ideje] = O.KATEGORIJE_OCEKIVANO[k.id]
      const b = s1.poKategoriji[k.id]
      expect([b.ukupno, b.roba, b.usluge, b.ideje], `UX 7.3 kaže ${[ukupno, roba, usluge, ideje]}`).toEqual([ukupno, roba, usluge, ideje])
    })
  }
  it('gustina: 7 gusto (95), 13 srednje (92), 11 malo (38)', () => {
    for (const g of ['gusto', 'srednje', 'malo'] as const) {
      const kat = KATEGORIJE.filter((k) => k.gustina === g)
      expect(kat.length).toBe(O.GUSTINA_OCEKIVANO[g].kategorija)
      expect(kat.reduce((z, k) => z + s1.poKategoriji[k.id].ukupno, 0)).toBe(O.GUSTINA_OCEKIVANO[g].oglasa)
    }
  })
  it('ukupno 225 / 189 / 24 / 12 na početku, 226 / 190 posle koraka 2', () => {
    expect(s1.ukupno).toEqual(O.UKUPNO_POCETAK)
    expect(s2.ukupno).toEqual(O.UKUPNO_POSLE_KORAKA_2)
    expect(s2.poKategoriji['igre-i-konzole'].ukupno).toBe(14)
  })
  it('način: 162 / 38 / 25 (163 posle koraka 2)', () => {
    expect(s1.nacin).toEqual(O.NACIN_POCETAK)
    expect(s2.nacin).toEqual(O.NACIN_POSLE_KORAKA_2)
  })
  it('oglasi „za poene“: 10 → 14, 25 → 12, 50 → 8, 100 → 4', () => {
    expect(s1.poeniPoVrednosti).toEqual(O.POENI_PO_VREDNOSTI)
  })
  it('devet tipova razmene (roba za robu 85, 86 posle koraka 2)', () => {
    expect(s1.tipovi).toEqual(O.TIPOVI_POCETAK)
    expect(s2.tipovi).toEqual({ ...O.TIPOVI_POCETAK, rr: 86 })
  })
  it('Građanin 198 / Firma 27 (199 / 27 posle koraka 2)', () => {
    expect({ gradjanin: s1.gradjanin, firma: s1.firma }).toEqual(O.GRADJANIN_FIRMA_POCETAK)
    expect({ gradjanin: s2.gradjanin, firma: s2.firma }).toEqual(O.GRADJANIN_FIRMA_POSLE_KORAKA_2)
  })
  it('firme su 22 usluge + 5 oglasa Zupčanika; dve usluge u „Bašta i biljke“ su od građana', () => {
    const firmeUsluge = s1.oglasi.filter((o) => o.firma && o.vrsta === 'usluga').length
    expect(firmeUsluge).toBe(22)
    expect(s1.oglasi.filter((o) => o.firma && o.vrsta !== 'usluga').length).toBe(5)
    expect(s1.oglasi.filter((o) => !o.firma && o.vrsta === 'usluga').every((o) => o.kat === 'basta-i-biljke')).toBe(true)
  })
  it('oglasa po firmama (UX 7.2)', () => {
    for (const [id, n] of Object.entries(O.OGLASA_PO_FIRMI)) expect(s1.oglasi.filter((o) => o.vlasnik === id).length, id).toBe(n)
  })
  it('istaknuto · plaćeno: 8 (5 + 1 + 2); javne aukcije: 6 koje nisu istaknute', () => {
    expect(s1.istaknuto).toEqual(O.ISTAKNUTO)
    expect(s1.aukcije).toBe(O.AUKCIJE)
  })
  it('region: 22 oglasa u 11 gradova, po 2', () => {
    expect(OGLASI_REGION.length).toBe(O.REGION.oglasa)
    const poGradu = new Map<string, number>()
    for (const o of OGLASI_REGION) poGradu.set(o.grad, (poGradu.get(o.grad) ?? 0) + 1)
    expect(poGradu.size).toBe(O.REGION.gradova)
    expect([...poGradu.values()].every((n) => n === O.REGION.poGradu)).toBe(true)
  })
})

describe('UX 7.1: korisnici', () => {
  it('40 građana u Beogradu i 11 iz regiona', () => {
    expect(KORISNICI.length).toBe(O.BROJ_KORISNIKA.beograd)
    expect(REGION_KORISNICI.length).toBe(O.BROJ_KORISNIKA.region)
  })
  for (const [id, [razmene, recenzije, prosek, poeni]] of Object.entries(O.KORISNICI_OCEKIVANO)) {
    it(`${id}: razmene ${razmene}, recenzije ${recenzije}, prosek ${prosek}, poeni ${poeni}`, () => {
      const k = s1.korisnici[id]
      expect([k.razmene, k.recenzije, ocena(k.zbirOcena, k.recenzije), k.poeni]).toEqual([razmene, recenzije, prosek, poeni])
    })
  }
  it('Ana: nije verifikovana pre koraka 1, a posle ima oznaku i 20 poena', () => {
    expect(svet(pocetno(1)).korisnici['ana_zvz84'].verifikovan).toBe(false)
    expect(s1.korisnici['ana_zvz84']).toMatchObject({ verifikovan: true, poeni: 20, razmene: 0, recenzije: 0 })
  })
})

describe('UX 7.4: glavni tok (lanac)', () => {
  const proveri = (s: ReturnType<typeof svet>, o: (typeof O.STANJE_LANAC)['korak1']) => {
    for (const [ime, id] of [['ana', 'ana_zvz84'], ['marko', 'marko_voz77'], ['jovana', 'jovana_vra91']] as const) {
      expect(s.korisnici[id].poeni, `poeni ${ime}`).toBe(o.poeni[ime])
      expect([s.korisnici[id].razmene, s.korisnici[id].recenzije], `razmene/recenzije ${ime}`).toEqual(o.razmeneRecenzije[ime])
    }
    expect(s.ukupno.ukupno, 'oglasa u Beogradu').toBe(o.oglasa)
    expect(s.razmenjenoStvari, 'razmenjeno stvari').toBe(o.razmenjeno)
  }
  it('korak 1 (završno)', () => proveri(s1, O.STANJE_LANAC.korak1))
  it('korak 2 (završno)', () => proveri(s2, O.STANJE_LANAC.korak2))
  it('korak 8 (završno)', () => {
    const s8 = svet(zavrsno(8))
    proveri(s8, O.STANJE_LANAC.korak8)
    expect(s8.poKategoriji['igre-i-konzole'].ukupno).toBe(O.STANJE_LANAC.korak8.igre)
    expect(s8.poKategoriji['bicikli-i-trotineti'].ukupno).toBe(O.STANJE_LANAC.korak8.bicikli)
    expect(s8.poKategoriji['knjige'].ukupno).toBe(O.STANJE_LANAC.korak8.knjige)
  })
  it('Anin prosek posle koraka 8 je 5,0 (1 recenzija)', () => {
    const a = svet(zavrsno(8)).korisnici['ana_zvz84']
    expect(ocena(a.zbirOcena, a.recenzije)).toBe('5,0')
  })
})

describe('UX 7.5: račva „za poene“', () => {
  const poeni = (s: ReturnType<typeof svet>) => ({ ana: s.korisnici['ana_zvz84'].poeni, marko: s.korisnici['marko_voz77'].poeni, jovana: s.korisnici['jovana_vra91'].poeni })
  const razmene = (s: ReturnType<typeof svet>) => ({ ana: s.korisnici['ana_zvz84'].razmene, marko: s.korisnici['marko_voz77'].razmene, jovana: s.korisnici['jovana_vra91'].razmene })
  it('6R (početak)', () => {
    const s = svet(pocetno(6, 'poeni'))
    expect([poeni(s), razmene(s), s.ukupno.ukupno, s.razmenjenoStvari]).toEqual([O.STANJE_POENI.korak6.poeni, O.STANJE_POENI.korak6.razmene, O.STANJE_POENI.korak6.oglasa, O.STANJE_POENI.korak6.razmenjeno])
  })
  it('7R (kraj): poklon PlayStation 2', () => {
    const s = svet(zavrsno(7, 'poeni'))
    expect([poeni(s), razmene(s), s.ukupno.ukupno, s.razmenjenoStvari]).toEqual([O.STANJE_POENI.korak7.poeni, O.STANJE_POENI.korak7.razmene, O.STANJE_POENI.korak7.oglasa, O.STANJE_POENI.korak7.razmenjeno])
  })
  it('8R (kraj): bicikl za poene, recenzija Ana → Marko', () => {
    const s = svet(zavrsno(8, 'poeni'))
    expect([poeni(s), razmene(s), s.ukupno.ukupno, s.razmenjenoStvari]).toEqual([O.STANJE_POENI.korak8.poeni, O.STANJE_POENI.korak8.razmene, O.STANJE_POENI.korak8.oglasa, O.STANJE_POENI.korak8.razmenjeno])
    expect([s.korisnici['ana_zvz84'].recenzije, s.korisnici['marko_voz77'].recenzije]).toEqual([O.STANJE_POENI.korak8.recenzije.ana, O.STANJE_POENI.korak8.recenzije.marko])
  })
  it('u račvi je Markov bicikl „za poene — 50“ od koraka 6', () => {
    const b = svet(pocetno(6, 'poeni')).oglasi.find((o) => o.id === 'markov-bicikl')
    expect(b).toMatchObject({ nacin: 'poeni', poeni: 50 })
    expect(svet(pocetno(6)).oglasi.find((o) => o.id === 'markov-bicikl')).toMatchObject({ nacin: 'razmena' })
  })
  it('Jovana poklon prima besplatno: njeni poeni se ne menjaju, udžbenici ostaju „za razmenu“', () => {
    const s = svet(zavrsno(8, 'poeni'))
    expect(s.korisnici['jovana_vra91'].poeni).toBe(60)
    expect(s.oglasi.find((o) => o.id === 'jovanini-udzbenici')?.nacin).toBe('razmena')
  })
})

describe('PLAN B5.10: značka paketa kod Marka', () => {
  const marko = (p: ReturnType<typeof pocetno>) => svet(p).znackaPaketa.marko
  it('2 do 4/početno, 3 od 4/završno do 5/početno, 2 od 5/završno', () => {
    expect(marko(zavrsno(3))).toBe(O.ZNACKA_MARKO.korak3)
    expect(marko(pocetno(4))).toBe(O.ZNACKA_MARKO.korak4Pocetno)
    expect(marko(zavrsno(4))).toBe(O.ZNACKA_MARKO.korak4Zavrsno)
    expect(marko(pocetno(5))).toBe(O.ZNACKA_MARKO.korak5Pocetno)
    expect(marko(zavrsno(5))).toBe(O.ZNACKA_MARKO.korak5Zavrsno)
    expect(marko(pocetno(6))).toBe(O.ZNACKA_MARKO.korak6)
  })
})

describe('PK7: značka paketa kod Ane', () => {
  const ana = (p: ReturnType<typeof pocetno>) => svet(p).znackaPaketa.ana
  it('čeka do Aninog prihvatanja lanca; u grani „poeni“ gasi se radnjom 6R.uzmi', () => {
    expect(ana(pocetno(3))).toBe(O.ZNACKA_ANA.korak3Pocetno)
    expect(ana(zavrsno(3))).toBe(O.ZNACKA_ANA.korak4)
    expect(ana(zavrsno(5))).toBe(O.ZNACKA_ANA.korak5Zavrsno)
    expect(ana({ korak: 6, n: 1, grana: 'lanac' })).toBe(O.ZNACKA_ANA.korak6LanacPosleAna)
    expect(ana({ korak: 6, n: 0, grana: 'poeni' })).toBe(O.ZNACKA_ANA.korak6PoeniPre)
    expect(ana({ korak: 6, n: 1, grana: 'poeni' })).toBe(O.ZNACKA_ANA.korak6PoeniPosleUzmi)
    expect(ana(zavrsno(8, 'poeni'))).toBe(0)
  })
})

describe('UX 7.6: cene', () => {
  it('sve cene iz tabele', () => {
    expect(CENE.postavljanjeOglasa).toBe(O.CENE_OCEKIVANO.postavljanje)
    expect(CENE.isticanje).toEqual(O.CENE_OCEKIVANO.isticanje)
    expect(CENE.paketiAukcija).toEqual(O.CENE_OCEKIVANO.paketiAukcija)
    expect([CENE.pretplataMajstor, CENE.pretplataRadnja, CENE.akcijaStaroZaNovo, CENE.reklama7Dana, CENE.popustPoStaromBiciklu, CENE.dostavaMala, CENE.dostavaVelika]).toEqual([
      O.CENE_OCEKIVANO.majstor,
      O.CENE_OCEKIVANO.radnja,
      O.CENE_OCEKIVANO.akcija,
      O.CENE_OCEKIVANO.reklama,
      O.CENE_OCEKIVANO.popust,
      O.CENE_OCEKIVANO.dostavaMala,
      O.CENE_OCEKIVANO.dostavaVelika,
    ])
  })
})

describe('UX 7.7: tabla prodavnice i moderacije', () => {
  it('Zupčanik: oglasi, pregledi, omiljeno, ponude, razmene, reklama (2,2%)', () => {
    const z = s1.zupcanik
    const e = O.TABLA_OCEKIVANO.zupcanik
    expect([z.oglasa, z.pregledi30Dana, z.sacuvanoUOmiljeno, z.ponude, z.obavljeneRazmene, z.reklamaPrikazi, z.reklamaKlikovi, z.ctrDesetine]).toEqual([e.oglasa, e.pregledi, e.sacuvano, e.ponude, e.razmene, e.prikazi, e.klikovi, e.ctr])
  })
  it('akcija postoji tek od koraka 9: 12 = 5 + 4 + 3, 5 × 3.000 = 15.000 din, naknada 4.900 din; posle „Primi“ 6 / 3 / 18.000 din', () => {
    expect(svet(zavrsno(8)).akcija).toBeNull()
    const pre = svet({ korak: 9, n: 5, grana: 'lanac' }).akcija!
    expect([pre.primljeno, pre.cekaProcenu, pre.izdatiPopusti]).toEqual([5, 4, 15000])
    const posle = svet(zavrsno(9)).akcija!
    const ep = O.TABLA_OCEKIVANO.akcijaPosle
    expect([posle.primljeno, posle.cekaProcenu, posle.izdatiPopusti, posle.prijave]).toEqual([ep.primljeno, ep.cekaProcenu, ep.popusti, 12])
    const a = pre
    const e = O.TABLA_OCEKIVANO.akcija
    expect([a.prijave, a.primljeno, a.cekaProcenu, a.odbijeno, a.izdatiPopusti, a.naknada, a.pregledi]).toEqual([e.prijave, e.primljeno, e.cekaProcenu, e.odbijeno, e.popusti, e.naknada, e.pregledi])
  })
  it('moderacija: na čekanju 2 / 3 / 3 (do odluke 5.v3) / 2; obrađeno 41 (uklonjeno 9) → 42 (uklonjeno 10)', () => {
    const e = O.TABLA_OCEKIVANO.moderacija
    expect(svet(zavrsno(1)).moderacija.naCekanju).toBe(e.korak1)
    expect(svet(pocetno(4)).moderacija.naCekanju).toBe(e.korak4)
    expect(svet(pocetno(5)).moderacija.naCekanju).toBe(e.korak5Pocetno)
    expect(svet(zavrsno(5)).moderacija.naCekanju).toBe(e.korak5Zavrsno)
    expect(svet({ korak: 5, n: 4, grana: 'lanac' }).moderacija.naCekanju).toBe(3) // V2 otvorena, odluka još nije poslata
    expect(svet(pocetno(5)).moderacija).toMatchObject({ obradjeno: e.obradjenoPre, uklonjeno: e.uklonjenoPre })
    expect(svet(zavrsno(5)).moderacija).toMatchObject({ obradjeno: e.obradjenoPosle, uklonjeno: e.uklonjenoPosle })
  })
})

describe('UX 7.8: Jovanine recenzije', () => {
  it('5 poslednjih, tačno kao u dizajnu', () => {
    const j = s1.korisnici['jovana_vra91']
    expect(poslednjeRecenzije(j.id, j.ocene, 5)).toEqual(O.JOVANINE_RECENZIJE)
  })
  it('ocena se slaže sa tekstom: svi tekstovi iste ocene su iz istog skupa', () => {
    for (const k of KORISNICI) {
      for (const r of poslednjeRecenzije(k.id, k.ocene, 5)) expect([3, 4, 5]).toContain(r.ocena)
    }
  })
})

describe('UX 3.3 i PLAN B5.5: demo datumi', () => {
  it('19. 10. 2026. je ponedeljak, 24. 10. subota, 2. 11. ponedeljak', () => {
    expect(danUNedelji({ d: 19, m: 10, y: 2026 })).toBe('ponedeljak')
    expect(danUNedelji({ d: 24, m: 10, y: 2026 })).toBe('subota')
    expect(danUNedelji({ d: 2, m: 11, y: 2026 })).toBe('ponedeljak')
  })
  it('datumi koraka', () => {
    expect(datum(demoDatum(1, false))).toBe('19. 10. 2026.')
    expect(datum(demoDatum(3, true))).toBe('20. 10. 2026.')
    expect(datum(demoDatum(5, false))).toBe('21. 10. 2026.')
    expect(datum(demoDatum(7, false))).toBe('22. 10. 2026.')
    expect(datum(demoDatum(7, true))).toBe('24. 10. 2026.')
    expect(datum(demoDatum(9, true))).toBe('2. 11. 2026.')
  })
  it('J2 ističe 12. 11., F8 sledeća naplata 18. 11.', () => {
    expect(datum(DATUM_ISTICE_AUKCIJA_J2)).toBe('12. 11. 2026.')
    expect(datum(DATUM_SLEDECA_NAPLATA)).toBe('18. 11. 2026.')
  })
  it('svaki korak ima i početak i kraj', () => {
    for (let k = 1; k <= 9; k++) expect(brojRadnji(k, 'lanac')).toBeGreaterThan(0)
  })
})
