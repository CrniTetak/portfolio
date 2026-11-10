// DORADA V1, S12, PK4, PK8, N2: ono što ekran STVARNO prikazuje (renderovanje na serveru, bez pregledača), ne samo podaci.
import { createElement, type ReactElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { DemoProvider } from '../demo/DemoProvider'
import { porukaPrihvatanja } from '../ekrani/razmena/Lanac'
import { EkranCtx } from '../okvir/kontekst'
import { FOTOGRAFIJE } from '../podaci/fotografije'
import { PRERADA_LICENCA, adresaLicence, nazivDela, punNazivLicence } from '../podaci/licence'
import type { Ugao } from '../prica/tipovi'
import { OGLASI_BEOGRAD, OGLASI_REGION } from '../scenario/oglasi'
import { poslednjeRecenzije, TEKSTOVI } from '../scenario/recenzije'
import { KORISNICI } from '../scenario/korisnici'
import { svet } from '../scenario/svet'
import { zavrsno } from '../scenario/pomocno'
import { IzvoriSlika, izvoriSlika } from './IzvoriSlika'
import { KarticaOglasa } from './KarticaOglasa'
import { NavodjenjeAutora } from './Slika'

// P-S7: tačka u pravnim oznakama je aria-hidden (čitač ne izgovara „tačka“), pa se za poređenje teksta vraća u običan znak
const prikazi = (el: ReactElement, ugao: Ugao = 'ana'): string =>
  renderToStaticMarkup(createElement(DemoProvider, null, createElement(EkranCtx.Provider, { value: { id: 'P1', ugao, parametri: {} } }, el))).split('<span aria-hidden="true">·</span>').join('·')

const SVI_OGLASI = [...svet(zavrsno(9)).oglasi, ...OGLASI_REGION, ...OGLASI_BEOGRAD]

describe('V1 (pravno): oznake na kartici oglasa nikad nisu odsečene ni izbačene', () => {
  it('svaka kartica nosi „Građanin“ ili „Firma“, i to u prvom redu znački', () => {
    for (const o of SVI_OGLASI) {
      const html = prikazi(createElement(KarticaOglasa, { oglas: o }))
      const klasa = o.firma ? 'znacka-firma' : 'znacka-gradjanin'
      const tekst = o.firma ? ' Firma</span>' : ' Građanin</span>'
      expect(html.includes(klasa) && html.includes(tekst), o.id).toBe(true)
      expect(html.indexOf('ko-pravne'), o.id).toBeGreaterThan(-1)
      expect(html.indexOf(klasa), o.id).toBeGreaterThan(html.indexOf('ko-pravne'))
    }
  })
  it('svaka istaknuta kartica (red Istaknuto, PREMIUM, Top ponuda) nosi „Istaknuto · plaćeno“, i kad ima i oznaku načina', () => {
    const istaknuti = SVI_OGLASI.filter((o) => o.istaknuto)
    expect(istaknuti.map((o) => o.istaknuto)).toEqual(expect.arrayContaining(['red', 'top', 'premium']))
    for (const o of istaknuti) {
      const html = prikazi(createElement(KarticaOglasa, { oglas: o, plava: o.istaknuto === 'premium' }))
      expect(html, o.id).toContain('Istaknuto · plaćeno')
    }
    // istaknut oglas „za poene“: pravne oznake + oznaka načina u trećem, manjem redu
    const poeniIstaknuto = istaknuti.find((o) => o.nacin === 'poeni')!
    const html = prikazi(createElement(KarticaOglasa, { oglas: poeniIstaknuto }))
    expect(html).toContain('Istaknuto · plaćeno')
    expect(html).toContain('Za poene')
    expect(html.indexOf('Istaknuto · plaćeno')).toBeLessThan(html.indexOf('ko-nacin'))
  })
  it('značke nisu u okviru slike (ne prekrivaju je): pojas stoji posle bloka slike', () => {
    const html = prikazi(createElement(KarticaOglasa, { oglas: SVI_OGLASI.find((o) => o.istaknuto)! }))
    const slika = html.slice(html.indexOf('ko-slika'), html.indexOf('ko-pojas'))
    expect(slika).not.toContain('znacka')
  })
  it('kartica javne aukcije nosi „Javna aukcija“, a „Poklanjam“ i „Za poene“ ostaju oznake načina', () => {
    expect(prikazi(createElement(KarticaOglasa, { oglas: SVI_OGLASI.find((o) => o.aukcija)!, ka: 'J2' }))).toContain('Javna aukcija')
    expect(prikazi(createElement(KarticaOglasa, { oglas: SVI_OGLASI.find((o) => o.nacin === 'poklon')! }))).toContain('Poklanjam')
  })
})

describe('S12: jabučica ima kratak vidljiv tekst', () => {
  it('kartica iz „Sveže voće i povrće“ kaže „Sopstvena proizvodnja“, ostale ne', () => {
    const voce = SVI_OGLASI.find((o) => o.kat === 'sveze-voce-i-povrce')!
    expect(prikazi(createElement(KarticaOglasa, { oglas: voce }))).toContain('Sopstvena proizvodnja')
    expect(prikazi(createElement(KarticaOglasa, { oglas: SVI_OGLASI.find((o) => o.kat === 'knjige')! }))).not.toContain('Sopstvena proizvodnja')
  })
})

describe('PK4: navođenje autora se STVARNO prikazuje', () => {
  it('ispod velike slike: autor, naziv dela i pun naziv licence za svaku fotografiju', () => {
    for (const f of FOTOGRAFIJE) {
      const html = renderToStaticMarkup(createElement(NavodjenjeAutora, { id: f.id }))
      const esc = (x: string) => x.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;')
      expect(html, f.id).toContain(esc(f.autor))
      expect(html, f.id).toContain(esc(nazivDela(f.naslovNaCommons)))
      expect(html, f.id).toContain(punNazivLicence(f.licenca))
      const adresa = adresaLicence(f.licenca)
      if (adresa) expect(html, f.id).toContain(adresa)
      expect(html, f.id).toContain(PRERADA_LICENCA)
    }
  })
  it('B-1: adresa licence se izvodi iz oznake, javno dobro je nema', () => {
    expect(adresaLicence('CC BY-SA 4.0')).toBe('https://creativecommons.org/licenses/by-sa/4.0/')
    expect(adresaLicence('CC BY 2.0')).toBe('https://creativecommons.org/licenses/by/2.0/')
    expect(adresaLicence('CC BY-SA 3.0 de')).toBe('https://creativecommons.org/licenses/by-sa/3.0/de/')
    expect(adresaLicence('CC0')).toContain('publicdomain/zero')
    expect(adresaLicence('Public domain')).toBeNull()
  })
  it('puni naziv licence: CC BY-SA nosi „Imenovanje–Deliti pod istim uslovima“ i broj verzije', () => {
    expect(punNazivLicence('CC BY-SA 4.0')).toBe('CC BY-SA 4.0 (Creative Commons Imenovanje–Deliti pod istim uslovima 4.0)')
    expect(punNazivLicence('CC BY 2.0')).toContain('Imenovanje 2.0')
    expect(punNazivLicence('CC0')).toContain('javno dobro')
    expect(punNazivLicence('Public domain')).toContain('javno dobro')
  })
  it('D5: licenca sa nastavkom države dobija pun naziv, i svaka licenca iz spiska fotografija ga dobija', () => {
    expect(punNazivLicence('CC BY-SA 3.0 de')).toBe('CC BY-SA 3.0 de (Creative Commons Imenovanje–Deliti pod istim uslovima 3.0, Nemačka)')
    for (const f of FOTOGRAFIJE) expect(punNazivLicence(f.licenca), f.licenca).toMatch(/\((Creative Commons|javno dobro)/)
  })
  it('U3 „Izvori slika“: svaki autor, licenca i izvor (kao tekst) iz spiska se vide, bez spoljnih linkova', () => {
    const html = renderToStaticMarkup(createElement(IzvoriSlika))
    expect(html).toContain('Izvori slika')
    for (const f of FOTOGRAFIJE) {
      const esc = (x: string) => x.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;')
      expect(html, f.id).toContain(esc(f.autor))
      expect(html, f.id).toContain(punNazivLicence(f.licenca))
      expect(html, f.id).toContain(f.stranica)
      const adresa = adresaLicence(f.licenca)
      if (adresa) expect(html, f.id).toContain(adresa)
    }
    expect(html).toContain(PRERADA_LICENCA)
    expect(html).not.toMatch(/<a\s/i)
    // isti izvor se navodi jednom, a sve slike iz njega su pobrojane
    expect(izvoriSlika().reduce((z, i) => z + i.slike.length, 0)).toBe(FOTOGRAFIJE.length)
  })
})

describe('PK8: poruka pri prihvatanju lanca zavisi od ugla', () => {
  it('Ana vidi da su prihvatili Marko i Jovana; Marko vidi da su prihvatile Ana i Jovana', () => {
    expect(porukaPrihvatanja('ana')).toBe('Lanac je prihvaćen: Marko i Jovana su prihvatili.')
    expect(porukaPrihvatanja('marko')).toBe('Lanac je prihvaćen: Ana i Jovana su prihvatile.')
  })
})

describe('N2 i PK12: recenzije', () => {
  it('na svakom profilu prvih 5 recenzija ima različite tekstove', () => {
    for (const k of KORISNICI) {
      const r = poslednjeRecenzije(k.id, k.ocene, 5)
      expect(new Set(r.map((x) => x.tekst)).size, k.id).toBe(r.length)
    }
  })
  it('tekst recenzije odgovara njenoj oceni (3, 4 ili 5), za svakog korisnika', () => {
    for (const k of KORISNICI)
      for (const r of poslednjeRecenzije(k.id, k.ocene, 5)) {
        // tekst mora biti iz skupa baš za tu ocenu, i ni iz jednog drugog skupa
        expect(TEKSTOVI[r.ocena], `${k.id}: ${r.tekst}`).toContain(r.tekst)
        for (const druga of [3, 4, 5] as const) if (druga !== r.ocena) expect(TEKSTOVI[druga], `${k.id}: „${r.tekst}“ je tekst ocene ${druga}`).not.toContain(r.tekst)
      }
  })
})
