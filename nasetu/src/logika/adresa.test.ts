import { readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { PRIVATNO } from '../podaci/adrese-privatno'
import { imaOtvorenoIzvidjanje, prikazAdrese, type KontekstAdrese, type Posmatrac } from './adresa'
import type { Izvidjanje, Predracun, Zahtev } from './tipovi'

const LOFT = 'industrijski-loft'
const ADRESA_LOFTA = PRIVATNO[LOFT].adresa
const T = { priprema: ['2026-11-16'], snimanje: ['2026-11-17'] }

function zahtev(produkcijaId: string, lokacijaId: string, stanje: Zahtev['stanje']): Zahtev {
  return { id: `z-${produkcijaId}-${lokacijaId}`, lokacijaId, produkcijaId, briefId: null, termin: T, razred: 'do30',
    prekovremeniSati: 0, osnovicaCenti: 90000, domacin: false, kurs: 117, opcijaId: null, poslat: 0, rok: 48, stanje, razlog: null, otkazan: null }
}
function predracun(z: Zahtev, placen: boolean): Predracun {
  return { id: `p-${z.id}`, vrsta: 'naknada', kupacId: z.produkcijaId, zahtevId: z.id, briefId: null, prijavaId: null,
    osnovicaCenti: 90000, naknadaCenti: 13500, primenjenMinimum: false, umanjenjeCenti: 0, kreditIzPredracunaId: null, nepokrivenKreditCenti: 0,
    domacinCenti: 0, uslugaCenti: 0, ukupnoCenti: 13500, kurs: 117, ukupnoPara: 1579500,
    pozivNaBroj: '97 NS-2026-0042', izdat: 1, uplataPotvrdjena: placen ? 2 : null, pregledan: false, povracaj: null }
}
function kontekst(p: Partial<KontekstAdrese> = {}): KontekstAdrese {
  return { zahtevi: [], predracuni: [], izvidjanja: [], sada: 0, ...p }
}
const delta: Posmatrac = { uloga: 'produkcija', akterId: 'delta' }

describe('adresa: produkcija vidi tek posle POTVRĐENE uplate', () => {
  it('bez zahteva: samo zona', () => {
    expect(prikazAdrese(LOFT, delta, kontekst()).nivo).toBe('zona')
  })
  it('zahtev čeka vlasnika: samo zona', () => {
    const z = zahtev('delta', LOFT, 'ceka')
    expect(prikazAdrese(LOFT, delta, kontekst({ zahtevi: [z] })).nivo).toBe('zona')
  })
  it('vlasnik odobrio, predračun izdat ali NEPLAĆEN: samo zona', () => {
    const z = zahtev('delta', LOFT, 'odobren')
    const r = prikazAdrese(LOFT, delta, kontekst({ zahtevi: [z], predracuni: [predracun(z, false)] }))
    expect(r.nivo).toBe('zona')
    expect(r.adresa).toBeUndefined()
    expect(JSON.stringify(r)).not.toContain(ADRESA_LOFTA)
  })
  it('uplata potvrđena: adresa, kontakt i pristup', () => {
    const z = zahtev('delta', LOFT, 'odobren')
    const r = prikazAdrese(LOFT, delta, kontekst({ zahtevi: [z], predracuni: [predracun(z, true)] }))
    expect(r.nivo).toBe('sve')
    expect(r.adresa).toBe(ADRESA_LOFTA)
    expect(r.telefon).toBe(PRIVATNO[LOFT].telefon)
  })
  it('plaćena rezervacija DRUGE lokacije ili DRUGE produkcije ne otvara ovu adresu', () => {
    const drugaLok = zahtev('delta', 'brutalisticka-hala', 'odobren')
    const tudja = zahtev('sigma', LOFT, 'odobren')
    const k = kontekst({ zahtevi: [drugaLok, tudja], predracuni: [predracun(drugaLok, true), predracun(tudja, true)] })
    expect(prikazAdrese(LOFT, delta, k).nivo).toBe('zona')
  })
})

describe('adresa: otkazivanje vlasnika zatvara adresu (O11)', () => {
  it('plaćena rezervacija koju je vlasnik otkazao više ne otvara adresu, uz poruku', () => {
    const z = zahtev('delta', LOFT, 'otkazao-vlasnik')
    const r = prikazAdrese(LOFT, delta, kontekst({ zahtevi: [z], predracuni: [predracun(z, true)] }))
    expect(r.nivo).toBe('zona')
    expect(r.razlog).toBe('Rezervacija je otkazana; adresa više nije dostupna.')
    expect(JSON.stringify(r)).not.toContain(ADRESA_LOFTA)
  })
})

describe('adresa: ostali posmatrači', () => {
  const z = zahtev('delta', LOFT, 'odobren')
  const placeno = kontekst({ zahtevi: [z], predracuni: [predracun(z, true)] })
  it('admin vidi sve', () => {
    expect(prikazAdrese(LOFT, { uloga: 'admin', akterId: 'nasetu' }, kontekst()).nivo).toBe('sve')
  })
  it('vlasnik vidi svoju lokaciju, tuđu samo zonu', () => {
    expect(prikazAdrese(LOFT, { uloga: 'vlasnik', akterId: 'alfa' }, kontekst()).nivo).toBe('sve')
    expect(prikazAdrese(LOFT, { uloga: 'vlasnik', akterId: 'ivan' }, kontekst()).nivo).toBe('zona')
  })
  it('partner i primalac linka vide samo zonu, čak i kad je plaćeno', () => {
    expect(prikazAdrese(LOFT, { uloga: 'partner', akterId: 'mila' }, placeno).nivo).toBe('zona')
    expect(prikazAdrese(LOFT, { uloga: 'primalac', akterId: 'primalac' }, placeno).nivo).toBe('zona')
  })
})

describe('adresa: imenovana osoba za POTVRĐENO izviđanje', () => {
  const kada = 100
  const izv = (stanje: Izvidjanje['stanje'], osoba = 'Ana P.'): Izvidjanje => ({
    id: 'i1', lokacijaId: LOFT, produkcijaId: 'delta', kada, osoba, brojLjudi: 2, stanje, poslat: 0 })
  const osoba: Posmatrac = { uloga: 'produkcija', akterId: 'delta', imenovanaOsoba: 'Ana P.' }

  it('izviđanje koje tek čeka potvrdu ne otvara adresu', () => {
    expect(prikazAdrese(LOFT, osoba, kontekst({ izvidjanja: [izv('ceka')], sada: 90 })).nivo).toBe('zona')
  })
  it('potvrđeno: adresa se otvara tačno 24 h ranije, bez kontakta vlasnika', () => {
    const iz = [izv('potvrdjeno')]
    expect(prikazAdrese(LOFT, osoba, kontekst({ izvidjanja: iz, sada: 75 })).nivo).toBe('zona')
    const r = prikazAdrese(LOFT, osoba, kontekst({ izvidjanja: iz, sada: 76 }))
    expect(r.nivo).toBe('adresa')
    expect(r.adresa).toBe(ADRESA_LOFTA)
    expect(r.kontaktOsoba).toBe('Nasetu')
    expect(JSON.stringify(r)).not.toContain(PRIVATNO[LOFT].telefon)
  })
  it('posle izviđanja (+24 h) se ponovo zatvara', () => {
    expect(imaOtvorenoIzvidjanje(LOFT, 'Ana P.', kontekst({ izvidjanja: [izv('potvrdjeno')], sada: 124 }))).toBe(false)
  })
  it('odbijeno izviđanje i druga osoba ne dobijaju adresu', () => {
    expect(prikazAdrese(LOFT, osoba, kontekst({ izvidjanja: [izv('odbijeno')], sada: 100 })).nivo).toBe('zona')
    const tudja: Posmatrac = { ...osoba, imenovanaOsoba: 'Pera Perić' }
    expect(prikazAdrese(LOFT, tudja, kontekst({ izvidjanja: [izv('potvrdjeno')], sada: 100 })).nivo).toBe('zona')
  })
  it('ostali članovi ekipe (produkcija bez imena) i dalje vide samo zonu', () => {
    expect(prikazAdrese(LOFT, delta, kontekst({ izvidjanja: [izv('potvrdjeno')], sada: 100 })).nivo).toBe('zona')
  })
})

describe('BRAVA: privatne adrese čita samo logika/adresa.ts', () => {
  const src = join(dirname(fileURLToPath(import.meta.url)), '..')
  const ovajFajl = fileURLToPath(import.meta.url)

  function sviFajlovi(dir: string): string[] {
    return readdirSync(dir).flatMap((ime) => {
      const p = join(dir, ime)
      return statSync(p).isDirectory() ? sviFajlovi(p) : [p]
    })
  }

  it('nijedan drugi fajl ne uvozi adrese-privatno', () => {
    const prekrsioci = sviFajlovi(src)
      .filter((f) => /\.(ts|tsx)$/.test(f))
      .filter((f) => f !== ovajFajl && !f.endsWith(join('logika', 'adresa.ts')) && !f.endsWith('adrese-privatno.ts'))
      // hvata samo stvarni uvoz (import ... from '...adrese-privatno' ili import('...')), ne komentare
      .filter((f) => /(from|import\s*\()\s*['"][^'"]*adrese-privatno['"]/.test(readFileSync(f, 'utf8')))
      .map((f) => relative(src, f))
    expect(prekrsioci).toEqual([])
  })
  it('adresa.ts ga zaista uvozi (brava nije prazna)', () => {
    expect(readFileSync(join(src, 'logika', 'adresa.ts'), 'utf8')).toContain('adrese-privatno')
  })
})
