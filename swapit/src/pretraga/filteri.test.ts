// Filteri pretrage (P4, P5, P7, P6): link ↔ filteri, podrazumevani grad i zemlja, svaki filter na stvarnim oglasima demoa, sortiranje i prazni slučajevi.
import { describe, expect, it } from 'vitest'
import { odgovaraTekstu } from './pretrazi'
import { svet } from '../scenario/svet'
import { SORTIRANJA, PRAZNI_FILTERI, SVE_ZEMLJE, SVI_GRADOVI, brojAktivnih, izLinka, poredaj, primeni, rezultati, uLink, type Filteri } from './filteri'

const s = svet({ korak: 1, n: 0, grana: 'lanac' })
const SVI = [...s.oglasi, ...s.region]
const f = (d: Partial<Filteri>): Filteri => ({ ...PRAZNI_FILTERI, ...d })
const bezKonteksta = { zelje: [] as string[] }

describe('link ↔ filteri', () => {
  it('prazan link daje podrazumevane filtere, a podrazumevane vrednosti se ne upisuju u link', () => {
    const { upit, filteri } = izLinka(new URLSearchParams(''))
    expect(upit).toBe('')
    expect(filteri).toEqual(PRAZNI_FILTERI)
    expect(uLink('', PRAZNI_FILTERI)).toEqual({})
  })
  it('izbor filtera preživljava put kroz link', () => {
    const izabrano = f({ tip: ['rr', 'ru'], nacin: 'poeni', kat: 'knjige', grad: 'Niš', zemlja: 'Srbija', stanje: 'Novo', slika: true, dostava: true, licno: true, odmah: true, ko: 'firma', sort: 'najnovije' })
    const q = new URLSearchParams(uLink('dečji bicikl', izabrano))
    expect(izLinka(q)).toEqual({ upit: 'dečji bicikl', filteri: izabrano })
  })
  it('nepoznate vrednosti iz linka se ignorišu, upit se skraćuje na 40 znakova', () => {
    const { upit, filteri } = izLinka(new URLSearchParams({ q: 'x'.repeat(100), nacin: 'kupovina', tip: 'rr,zz,<script>', sort: 'slucajno', ko: 'bog' }))
    expect(upit).toHaveLength(40)
    expect(filteri.nacin).toBe('')
    expect(filteri.tip).toEqual(['rr'])
    expect(filteri.sort).toBe('najblize')
    expect(filteri.ko).toBe('')
  })
  it('brojAktivnih ne računa sortiranje', () => {
    expect(brojAktivnih(PRAZNI_FILTERI)).toBe(0)
    expect(brojAktivnih(f({ sort: 'najnovije' }))).toBe(0)
    expect(brojAktivnih(f({ nacin: 'poklon', slika: true }))).toBe(2)
  })
})

describe('filteri na oglasima demoa', () => {
  it('podrazumevano je samo Beograd; grad bira oglase regiona, a „Svi gradovi“ sve', () => {
    expect(primeni(SVI, PRAZNI_FILTERI)).toHaveLength(s.oglasi.length)
    const nis = primeni(SVI, f({ grad: 'Niš', zemlja: 'Srbija' }))
    expect(nis.length).toBeGreaterThan(0)
    expect(nis.every((o) => o.grad === 'Niš')).toBe(true)
    expect(primeni(SVI, f({ grad: SVI_GRADOVI, zemlja: SVE_ZEMLJE }))).toHaveLength(SVI.length)
    expect(primeni(SVI, f({ grad: SVI_GRADOVI, zemlja: 'Hrvatska' })).every((o) => o.drzava === 'Hrvatska')).toBe(true)
  })
  it('način, tip razmene, kategorija, stanje, Građanin / Firma', () => {
    const poeni = primeni(s.oglasi, f({ nacin: 'poeni' }))
    expect(poeni).toHaveLength(s.nacin.poeni)
    expect(primeni(s.oglasi, f({ tip: ['rr'] })).length).toBe(s.tipovi.rr)
    expect(primeni(s.oglasi, f({ kat: 'knjige' })).length).toBe(s.poKategoriji.knjige.ukupno)
    expect(primeni(s.oglasi, f({ ko: 'firma' }))).toHaveLength(s.firma)
    expect(primeni(s.oglasi, f({ ko: 'gradjanin' }))).toHaveLength(s.gradjanin)
    expect(primeni(s.oglasi, f({ stanje: 'Novo' })).every((o) => o.stanje === 'Novo')).toBe(true)
  })
  it('„Dostupno odmah“ izbacuje aukcije; „Lično preuzimanje“ i „Dostava“ su samo roba', () => {
    expect(primeni(s.oglasi, f({ odmah: true }))).toHaveLength(s.oglasi.length - s.aukcije)
    expect(primeni(s.oglasi, f({ licno: true })).every((o) => o.vrsta === 'roba')).toBe(true)
    expect(primeni(s.oglasi, f({ dostava: true })).every((o) => o.preuzimanje === 'licno-kurir')).toBe(true)
  })
})

describe('rezultati i sortiranje', () => {
  it('bez upita i bez filtera nema rezultata (P5 pokazuje uputstvo)', () => {
    expect(rezultati(s.oglasi, '', PRAZNI_FILTERI, bezKonteksta)).toEqual([])
    expect(rezultati(s.oglasi, '   ', f({ sort: 'najnovije' }), bezKonteksta)).toEqual([])
  })
  it('upit nalazi oglase (kvačice, sinonimi), a filter ga sužava', () => {
    const svi = rezultati(s.oglasi, 'bicikl', PRAZNI_FILTERI, bezKonteksta)
    expect(svi.length).toBeGreaterThan(5)
    const bajs = rezultati(s.oglasi, 'bajs', PRAZNI_FILTERI, bezKonteksta)
    expect(bajs.length).toBe(svi.length)
    const poeni = rezultati(s.oglasi, 'bicikl', f({ nacin: 'poeni' }), bezKonteksta)
    expect(poeni.length).toBeLessThan(svi.length)
    expect(poeni.every((o) => o.nacin === 'poeni')).toBe(true)
  })
  it('D3: najviše dva istaknuta oglasa čiji naslov ili opis odgovara upitu idu prvi u svakom sortiranju; istaknuti oglas koji se poklapa samo kategorijom ne ulazi u istaknuti red', () => {
    for (const { v } of SORTIRANJA) {
      for (const q of ['bicikl', 'trotinet']) {
        const r = rezultati(s.oglasi, q, f({ sort: v }), { opstina: 'zvz', zelje: ['bicikl'] })
        const pogodak = (o: (typeof r)[number]) => !!o.istaknuto && odgovaraTekstu(o, q)
        const n = Math.min(2, r.filter(pogodak).length)
        expect(r.slice(0, n).every(pogodak), q + ' ' + v).toBe(true)
      }
      // „bicikl“: istaknuti iz kategorije bicikala čiji naslov/opis nema reč ne računa se kao pogodak
      const trotinet = s.oglasi.find((o) => o.istaknuto && !odgovaraTekstu(o, 'bicikl'))
      expect(trotinet).toBeDefined()
      // bez upita nema istaknutog reda
      const bez = rezultati(s.oglasi, '', f({ nacin: 'poeni', sort: v }), { opstina: 'zvz', zelje: [] })
      expect(bez.length).toBeGreaterThan(0)
    }
  })
  it('„Najbliže“ stavlja oglase iz iste opštine pre udaljenih, „Najnovije“ obrće redosled, „Poklapanje“ ističe oglase koji odgovaraju želji', () => {
    const ulaz = s.oglasi.filter((o) => !o.istaknuto && o.vrsta === 'roba').slice(0, 60)
    const bliz = poredaj(ulaz, 'najblize', { opstina: 'zvz', zelje: [] })
    const prviDrugaOpstina = bliz.findIndex((o) => o.opstina !== 'zvz')
    expect(bliz.slice(0, prviDrugaOpstina).every((o) => o.opstina === 'zvz')).toBe(true)
    expect(bliz.slice(prviDrugaOpstina).some((o) => o.opstina === 'zvz')).toBe(false)
    const novo = poredaj(ulaz, 'najnovije', bezKonteksta)
    expect(novo[0]).toBe(ulaz[ulaz.length - 1])
    const zeljeno = poredaj(ulaz, 'poklapanje', { zelje: ['knjige'] })
    expect(zeljeno[0].kat).toBe('knjige')
  })
})
