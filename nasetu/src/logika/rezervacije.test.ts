import { describe, expect, it } from 'vitest'
import {
  kreditIzboraZaZahtev, mozeLiOdobriti, mozeLiOtkazatiVlasnik, mozeLiPotvrditiUplatu, napraviPredracunNaknade, napraviPredracunUsluge,
  noviZahtev, stanjeZahteva, stavkePredracuna,
} from './rezervacije'
import { preklapaju, proveriTermin } from './termini'
import type { Termin, Zahtev } from './tipovi'

const T: Termin = { priprema: ['2026-11-16'], snimanje: ['2026-11-17'] }
const kasnije: Termin = { priprema: [], snimanje: ['2026-11-30'] }
const sudar: Termin = { priprema: [], snimanje: ['2026-11-16'] } // dan pripreme drugog zahteva

function zahtev(id: string, termin: Termin, sada = 0, lokacijaId = 'loft'): Zahtev {
  return noviZahtev({ id, lokacijaId, produkcijaId: 'delta', briefId: null, termin, razred: 'do30', prekovremeniSati: 0, osnovicaCenti: 90000, sada })
}

describe('rok zahteva (48 h)', () => {
  const z = zahtev('z1', T, 0)
  it('vlasnik ima 48 h; posle toga zahtev je istekao', () => {
    expect(stanjeZahteva(z, 47)).toBe('ceka')
    expect(stanjeZahteva(z, 48)).toBe('istekao')
  })
  it('istekao zahtev se ne može odobriti', () => {
    expect(mozeLiOdobriti(z, [z], [], 48, []).moze).toBe(false)
  })
})

describe('isti termin ne može dva puta', () => {
  it('preklapanje: zajednički dan (i dan pripreme) je sudar', () => {
    expect(preklapaju(T, sudar)).toBe(true)
    expect(preklapaju(T, kasnije)).toBe(false)
  })
  it('drugo odobrenje preklapajućeg termina se odbija', () => {
    const prvi = { ...zahtev('z1', T), stanje: 'odobren' as const }
    const drugi = zahtev('z2', T)
    const ishod = mozeLiOdobriti(drugi, [prvi, drugi], [], 1, [])
    expect(ishod.moze).toBe(false)
    expect(ishod.razlog).toBe('Termin je već potvrđen za drugu rezervaciju.')
  })
  it('termin koji se ne preklapa prolazi', () => {
    const prvi = { ...zahtev('z1', T), stanje: 'odobren' as const }
    expect(mozeLiOdobriti(zahtev('z2', kasnije), [prvi], [], 1, []).moze).toBe(true)
  })
  it('druga lokacija nije sudar', () => {
    const prvi = { ...zahtev('z1', T), stanje: 'odobren' as const }
    expect(proveriTermin('hala', T, [prvi], []).slobodan).toBe(true)
  })
  it('zahtev koji tek čeka vlasnika još ne zaključava termin', () => {
    expect(proveriTermin('loft', T, [zahtev('z1', T)], []).slobodan).toBe(true)
  })
  it('unapred zauzet dan lokacije blokira', () => {
    expect(proveriTermin('loft', T, [], ['2026-11-17']).slobodan).toBe(false)
  })
})

describe('predračun i uplata', () => {
  it('predračun nastaje iz osnovice zahteva (900 € → 135 €, 15.795,00 RSD, kurs zapisan na predračunu)', () => {
    const p = napraviPredracunNaknade('p1', 1, zahtev('z1', T), [], 5)
    expect(p.vrsta).toBe('naknada')
    expect(p.naknadaCenti).toBe(13500)
    expect(p.ukupnoCenti).toBe(13500)
    expect(p.kurs).toBe(117)
    expect(p.ukupnoPara).toBe(1579500)
    expect(p.pozivNaBroj).toBe('97 NS-2026-0042')
  })
  it('uplata se ne potvrđuje dok vlasnik nije odobrio', () => {
    const z = zahtev('z1', T)
    const p = napraviPredracunNaknade('p1', 1, z, [], 5)
    expect(mozeLiPotvrditiUplatu(z, p)).toEqual({ moze: false, razlog: 'Vlasnik još nije odobrio.' })
    expect(mozeLiPotvrditiUplatu({ ...z, stanje: 'odobren' }, p).moze).toBe(true)
  })
  it('uplata otkazane rezervacije se ne potvrđuje', () => {
    const z = { ...zahtev('z1', T), stanje: 'otkazao-vlasnik' as const }
    expect(mozeLiPotvrditiUplatu(z, napraviPredracunNaknade('p1', 1, z, [], 5)).moze).toBe(false)
  })
})

describe('usluge na predračunu (B1)', () => {
  const izbor = (placen: boolean) => ({
    ...napraviPredracunUsluge('p-izbor', 1, { vrsta: 'izbor-van-kataloga', kupacId: 'delta', briefId: 'b-1' }, 0),
    uplataPotvrdjena: placen ? 3 : null,
  })
  const z = { ...zahtev('z1', T), briefId: 'b-1' }
  it('izbor van kataloga je predračun od 50 € = 5.850,00 RSD', () => {
    const p = izbor(false)
    expect(p.ukupnoCenti).toBe(5000)
    expect(p.ukupnoPara).toBe(585000)
    expect(p.briefId).toBe('b-1')
    expect(p.zahtevId).toBeNull()
  })
  it('fotografisanje je predračun od 75 € = 8.775,00 RSD, kupac je vlasnik', () => {
    const p = napraviPredracunUsluge('p-f', 2, { vrsta: 'fotografisanje', kupacId: 'alfa', prijavaId: 'pl-1' }, 0)
    expect(p.ukupnoCenti).toBe(7500)
    expect(p.ukupnoPara).toBe(877500)
    expect(p.kupacId).toBe('alfa')
  })
  it('kredit samo ako je 50 € PLAĆENO', () => {
    expect(kreditIzboraZaZahtev(z, [izbor(false)])).toBeNull()
    expect(kreditIzboraZaZahtev(z, [izbor(true)])).toEqual({ predracunId: 'p-izbor', centi: 5000 })
  })
  it('kredit samo jednom po briefu', () => {
    const prvi = napraviPredracunNaknade('p-n1', 2, z, [izbor(true)], 5)
    expect(prvi.umanjenjeCenti).toBe(5000)
    expect(prvi.kreditIzPredracunaId).toBe('p-izbor')
    expect(kreditIzboraZaZahtev(z, [izbor(true), prvi])).toBeNull()
  })
  it('predračun sa kreditom i domaćinom: 135 − 50 + 70 = 155 € = 18.135,00 RSD, a redovi su na predračunu', () => {
    const zd = { ...z, domacin: true }
    const p = napraviPredracunNaknade('p-n', 2, zd, [izbor(true)], 5)
    expect(p.ukupnoCenti).toBe(15500)
    expect(p.ukupnoPara).toBe(1813500)
    const redovi = stavkePredracuna(p)
    expect(redovi.map((s) => s.tip)).toEqual(['info', 'naknada', 'umanjenje', 'domacin'])
    expect(redovi[2].iznosCenti).toBe(-5000)
    expect(redovi[3].naziv).toContain('1 dan × 70,00 €')
  })
  it('naknada 40 € − 50 € → samo domaćin, a razlika od 10 € se ne vraća (napomena na predračunu)', () => {
    const mala = { ...z, domacin: true, osnovicaCenti: 25000 }
    const p = napraviPredracunNaknade('p-m', 2, mala, [izbor(true)], 5)
    expect(p.ukupnoCenti).toBe(7000)
    expect(p.nepokrivenKreditCenti).toBe(1000)
    expect(stavkePredracuna(p).find((s) => s.tip === 'umanjenje')?.napomena).toContain('10,00 €')
  })
  it('uplata usluge ne traži zahtev', () => {
    expect(mozeLiPotvrditiUplatu(undefined, izbor(false)).moze).toBe(true)
    expect(mozeLiPotvrditiUplatu(undefined, izbor(true)).moze).toBe(false)
  })
})

describe('otkazivanje vlasnika (B5)', () => {
  const placen = () => {
    const z = { ...zahtev('z1', T), stanje: 'odobren' as const }
    return { z, p: { ...napraviPredracunNaknade('p1', 1, z, [], 5), uplataPotvrdjena: 6 } }
  }
  it('plaćena rezervacija pre prvog dana termina može da se otkaže', () => {
    const { z, p } = placen()
    expect(mozeLiOtkazatiVlasnik(z, p, 10).moze).toBe(true)
  })
  it('ne može neplaćena, nepostojeća, već otkazana, niti kad je termin počeo', () => {
    const { z, p } = placen()
    expect(mozeLiOtkazatiVlasnik(z, { ...p, uplataPotvrdjena: null }, 10).moze).toBe(false)
    expect(mozeLiOtkazatiVlasnik(undefined, p, 10).moze).toBe(false)
    expect(mozeLiOtkazatiVlasnik({ ...z, stanje: 'otkazao-vlasnik' }, p, 10).moze).toBe(false)
    expect(mozeLiOtkazatiVlasnik({ ...z, stanje: 'ceka' }, p, 10).moze).toBe(false)
    expect(mozeLiOtkazatiVlasnik(z, p, 14 * 24 + 10).moze).toBe(false) // 16. 11. 2026. 00:00 je već prošlo
  })
})
