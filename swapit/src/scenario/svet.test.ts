// SLOJ 1: PRAVILA KOJA UVEK VAŽE (PLAN B3). Proverava se u SVAKOJ poziciji priče (obe grane), sa i bez slobodnih tokova.
import { describe, expect, it } from 'vitest'
import { dodajNoviOglas, POCETNI_TOKOVI } from '../tokovi/tokovi'
import { KATEGORIJE } from './kategorije'
import { brojRecenzija } from './korisnici'
import { ocena } from './format'
import { ANIN_PS2, OGLASI_BEOGRAD, type Oglas } from './oglasi'
import { svePozicije } from './pomocno'
import { svet } from './svet'

const NOVI: Oglas = { id: 'novi-test', naslov: 'Test oglas', kat: 'knjige', vrsta: 'roba', nacin: 'razmena', trazi: 'roba', vlasnik: 'ana_zvz84', firma: false, grad: 'Beograd', opstina: 'zvz', opis: 'Test.' }
const NOVI_POENI: Oglas = { ...NOVI, id: 'novi-poeni', nacin: 'poeni', poeni: 25, trazi: undefined }
const SA_TOKOVIMA = dodajNoviOglas(dodajNoviOglas(POCETNI_TOKOVI, NOVI), NOVI_POENI)

const STANJA = svePozicije().flatMap((poz) => [
  { poz, tokovi: POCETNI_TOKOVI, ime: `${poz.korak}/${poz.n}/${poz.grana}` },
  { poz, tokovi: SA_TOKOVIMA, ime: `${poz.korak}/${poz.n}/${poz.grana} + tokovi` },
])

describe('pravila koja uvek važe', () => {
  it('ima dovoljno stanja za proveru', () => {
    expect(STANJA.length).toBeGreaterThan(100)
  })

  for (const { poz, tokovi, ime } of STANJA) {
    it(`zbirovi se slažu: ${ime}`, () => {
      const s = svet(poz, tokovi)
      const u = s.ukupno
      // zbir po kategorijama = ukupno; roba + usluge + ideje = ukupno
      expect(KATEGORIJE.reduce((z, k) => z + s.poKategoriji[k.id].ukupno, 0)).toBe(u.ukupno)
      expect(u.roba + u.usluge + u.ideje).toBe(u.ukupno)
      for (const k of KATEGORIJE) {
        const b = s.poKategoriji[k.id]
        expect(b.roba + b.usluge + b.ideje).toBe(b.ukupno)
      }
      expect(KATEGORIJE.reduce((z, k) => z + s.poKategoriji[k.id].roba, 0)).toBe(u.roba)
      // za razmenu + za poene + poklanjam = ukupno
      expect(s.nacin.razmena + s.nacin.poeni + s.nacin.poklon).toBe(u.ukupno)
      // zbir tipova razmene = broj „za razmenu“; zbir poena po vrednostima = broj „za poene“
      expect(Object.values(s.tipovi).reduce((z, n) => z + n, 0)).toBe(s.nacin.razmena)
      expect(Object.values(s.poeniPoVrednosti).reduce((z, n) => z + n, 0)).toBe(s.nacin.poeni)
      // Građanin + Firma = ukupno
      expect(s.gradjanin + s.firma).toBe(u.ukupno)
      expect(s.oglasi.length).toBe(u.ukupno)
      // istaknuto se sabira, aukcije se broje u ukupno ali NE u istaknuto (PLAN B5.4)
      expect(s.istaknuto.red + s.istaknuto.top + s.istaknuto.premium).toBe(s.istaknuto.ukupno)
      expect(s.oglasi.filter((o) => o.aukcija && o.istaknuto).length).toBe(0)
    })

    it(`pravila sadržaja: ${ime}`, () => {
      const s = svet(poz, tokovi)
      for (const o of s.oglasi) {
        // „za poene“ i „poklanjam“ su samo roba i samo građani
        if (o.nacin !== 'razmena') {
          expect(o.vrsta, o.naslov).toBe('roba')
          expect(o.firma, o.naslov).toBe(false)
        }
        // firme nemaju poena
        if (o.firma) expect(o.nacin, o.naslov).toBe('razmena')
        // „za poene“ ima vrednost, „za razmenu“ ima šta traži
        if (o.nacin === 'poeni') expect([10, 25, 50, 100]).toContain(o.poeni)
        if (o.nacin === 'razmena') expect(o.trazi, o.naslov).toBeDefined()
      }
      // ids su jedinstveni
      expect(new Set(s.oglasi.map((o) => o.id)).size).toBe(s.oglasi.length)
    })

    it(`korisnici: recenzije ≤ razmene, poeni nikad negativni, prikazana ocena = zaokružen prosek: ${ime}`, () => {
      const s = svet(poz, tokovi)
      for (const k of Object.values(s.korisnici)) {
        expect(k.recenzije, k.id).toBeLessThanOrEqual(k.razmene)
        expect(k.poeni, k.id).toBeGreaterThanOrEqual(0)
        expect(k.recenzije).toBe(brojRecenzija(k.ocene))
        const stvarnoDesetine = k.recenzije ? Math.floor((k.zbirOcena * 20 + k.recenzije) / (k.recenzije * 2)) : 0
        if (k.recenzije) expect(ocena(k.zbirOcena, k.recenzije)).toBe(`${Math.floor(stvarnoDesetine / 10)},${stvarnoDesetine % 10}`)
        else expect(ocena(k.zbirOcena, k.recenzije)).toBe('—')
      }
    })
  }

  it('brojač „Vidi sve (N)“ za svaku kategoriju = broj kartica u listi te kategorije', () => {
    for (const { poz, tokovi } of STANJA.slice(0, 40)) {
      const s = svet(poz, tokovi)
      for (const k of KATEGORIJE) expect(s.oglasi.filter((o) => o.kat === k.id).length).toBe(s.poKategoriji[k.id].ukupno)
    }
  })

  it('slobodni tok: novi oglas se vidi u brojačima (+2)', () => {
    const bez = svet({ korak: 1, n: 0, grana: 'lanac' })
    const sa = svet({ korak: 1, n: 0, grana: 'lanac' }, SA_TOKOVIMA)
    expect(sa.ukupno.ukupno).toBe(bez.ukupno.ukupno + 2)
    expect(sa.nacin.poeni).toBe(bez.nacin.poeni + 1)
    expect(sa.poKategoriji.knjige.ukupno).toBe(bez.poKategoriji.knjige.ukupno + 2)
  })

  it('Anin PlayStation 2 nije među 225 i pojavljuje se tek kad Ana objavi oglas (korak 2)', () => {
    expect(OGLASI_BEOGRAD.some((o) => o.id === ANIN_PS2.id)).toBe(false)
    expect(svet({ korak: 2, n: 0, grana: 'lanac' }).oglasi.some((o) => o.id === ANIN_PS2.id)).toBe(false)
    expect(svet({ korak: 2, n: 2, grana: 'lanac' }).oglasi.some((o) => o.id === ANIN_PS2.id)).toBe(true)
  })

  it('region ne ulazi u brojače Beograda', () => {
    const s = svet({ korak: 1, n: 0, grana: 'lanac' })
    expect(s.region.length).toBe(22)
    expect(s.oglasi.some((o) => o.grad !== 'Beograd')).toBe(false)
  })
})
