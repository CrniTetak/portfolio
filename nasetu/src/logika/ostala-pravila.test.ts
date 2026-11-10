// Testovi za nova pravila dorade 2: kalendar vlasnika (B7), zamenska lokacija (B5), objava lokacije (B6),
// izvoz za knjigovođu (B6), tehnički list (B8), primeri i dokumenti (A3, A5, A6, B3, B9, B11).
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { LOKACIJE, nadjiLokaciju, POLJA_TEHNICKOG } from '../podaci/lokacije'
import { ADRESA_U_MEJLU, DOKUMENTI, MEJLOVI, PRAVNI_DOKUMENTI } from '../podaci/primeri'
import { prikazAdrese, type KontekstAdrese } from './adresa'
import { briefOdeljci, OTKAZIVANJE_REDOVI, TEKST_DEPOZITA, ugovorOdeljci, type PodaciDokumenta } from './dokumenti'
import { poljeCsv, redoviZaKnjigovodju, uCsv, ZAGLAVLJE_CSV } from './izvoz'
import { mozeLiBlokirati, zauzetiDani } from './kalendar'
import { VERZIJA_DOKUMENATA } from './konstante'
import { kontrolnaLista, lokacijaIzPrijave, mozeLiObjaviti } from './objava'
import { jeZiva, novaOpcija } from './opcije'
import { napraviPredracunNaknade, noviZahtev } from './rezervacije'
import { proveriTermin } from './termini'
import type { PrijavaLokacije, Termin, Zahtev } from './tipovi'
import { zamenskeLokacije } from './zamena'

const T: Termin = { priprema: ['2026-11-16'], snimanje: ['2026-11-17'] }
const loft = nadjiLokaciju('industrijski-loft')!
const kontekst: KontekstAdrese = { zahtevi: [], predracuni: [], izvidjanja: [], sada: 0 }
const admin = { uloga: 'admin' as const, akterId: 'nasetu' }

// Adrese i telefoni se uzimaju KROZ prikazAdrese (admin vidi sve), ne uvozom privatnog fajla (to bi pokvarilo test "BRAVA").
const SVE_ADRESE = LOKACIJE.map((l) => prikazAdrese(l.id, admin, kontekst))
const ADRESE = SVE_ADRESE.map((a) => a.adresa!)
const TELEFONI = SVE_ADRESE.map((a) => a.telefon!)

describe('B7: kalendar vlasnika', () => {
  const baza = { l: loft, blokirani: {}, opcije: [], zahtevi: [], sada: 0 }
  it('blokiran dan zatvara termin u proveri termina', () => {
    const blokirani = { [loft.id]: ['2026-11-17'] }
    expect(proveriTermin(loft.id, T, [], zauzetiDani(loft, {})).slobodan).toBe(true)
    const p = proveriTermin(loft.id, T, [], zauzetiDani(loft, blokirani))
    expect(p.slobodan).toBe(false)
    expect(p.razlog).toBe('Termin je zauzet.')
  })
  it('slobodan dan se može blokirati', () => {
    expect(mozeLiBlokirati({ ...baza, dan: '2026-11-18' }).moze).toBe(true)
  })
  it('ne može dan koji je zauzet van Nasetua, već blokiran ili neispravan', () => {
    expect(mozeLiBlokirati({ ...baza, dan: '2026-11-10' }).moze).toBe(false)
    expect(mozeLiBlokirati({ ...baza, dan: '2026-11-18', blokirani: { [loft.id]: ['2026-11-18'] } }).moze).toBe(false)
    expect(mozeLiBlokirati({ ...baza, dan: 'sutra' }).moze).toBe(false)
  })
  it('ne može dan pod opcijom, zahtevom na čekanju ili rezervacijom (O17)', () => {
    const opcija = novaOpcija('o1', loft.id, 'delta', T, 0)
    expect(jeZiva(opcija, 0)).toBe(true)
    expect(mozeLiBlokirati({ ...baza, dan: '2026-11-17', opcije: [opcija] }).razlog).toBe('Na ovaj dan postoji opcija.')
    const z: Zahtev = noviZahtev({ id: 'z1', lokacijaId: loft.id, produkcijaId: 'delta', briefId: null, termin: T, razred: 'do30', prekovremeniSati: 0, osnovicaCenti: 90000, sada: 0 })
    expect(mozeLiBlokirati({ ...baza, dan: '2026-11-16', zahtevi: [z] }).razlog).toBe('Na ovaj dan postoji zahtev na čekanju.')
    expect(mozeLiBlokirati({ ...baza, dan: '2026-11-16', zahtevi: [{ ...z, stanje: 'odobren' }] }).razlog).toBe('Na ovaj dan postoji rezervacija.')
  })
  it('odbijen zahtev i istekla opcija više ne smetaju', () => {
    const z: Zahtev = { ...noviZahtev({ id: 'z1', lokacijaId: loft.id, produkcijaId: 'delta', briefId: null, termin: T, razred: 'do30', prekovremeniSati: 0, osnovicaCenti: 90000, sada: 0 }), stanje: 'odbijen' }
    expect(mozeLiBlokirati({ ...baza, dan: '2026-11-17', zahtevi: [z] }).moze).toBe(true)
    expect(mozeLiBlokirati({ ...baza, dan: '2026-11-17', opcije: [novaOpcija('o1', loft.id, 'delta', T, 0)], sada: 72 }).moze).toBe(true)
  })
})

describe('BRAVA za kalendar: provere termina nikad ne gledaju samo lokacija.zauzeti', () => {
  const src = join(dirname(fileURLToPath(import.meta.url)), '..')
  const fajlovi = (dir: string): string[] =>
    readdirSync(dir).flatMap((ime) => { const p = join(dir, ime); return statSync(p).isDirectory() ? fajlovi(p) : [p] })
  it('nijedan poziv proveri*/mozeLiOdobriti ne dobija l.zauzeti direktno (mora zauzetiDani, da blokirani dani važe)', () => {
    const prekrsioci = fajlovi(src)
      .filter((f) => /\.(ts|tsx)$/.test(f) && !/\.test\.ts$/.test(f))
      .filter((f) => /(proveriTermin\w*|mozeLiOdobriti)\([^\n]*\.zauzeti\b/.test(readFileSync(f, 'utf8')))
      .map((f) => relative(src, f))
    expect(prekrsioci).toEqual([])
  })
})

describe('B5: zamenska lokacija', () => {
  const z = noviZahtev({ id: 'z1', lokacijaId: loft.id, produkcijaId: 'delta', briefId: 'b-1', termin: T, razred: 'do30', prekovremeniSati: 0, osnovicaCenti: 90000, sada: 0 })
  const ulaz = {
    katalog: LOKACIJE, zahtev: z, tipoviBriefa: ['Loft', 'Hala', 'Studio'], sviZahtevi: [] as Zahtev[], opcije: [],
    zauzetiDani: (l: typeof loft) => zauzetiDani(l, {}), sada: 0,
  }
  it('loft ima jedini tip u katalogu, pa se nudi lokacija tipa iz briefa (najviše 2), slobodna u terminu', () => {
    const zamene = zamenskeLokacije(ulaz)
    expect(zamene).toHaveLength(2)
    for (const l of zamene) {
      expect(l.id).not.toBe(loft.id)
      expect(['Hala', 'Studio']).toContain(l.tip)
      expect(proveriTermin(l.id, T, [], l.zauzeti).slobodan).toBe(true)
      expect(l.cene.do30).toBeDefined()
    }
  })
  it('ne nudi zauzetu lokaciju, ni onu koja ne prima ekipu', () => {
    // stara-fabrika je zauzeta 17. 11.; stan prima samo do 10 ljudi
    const ids = zamenskeLokacije({ ...ulaz, tipoviBriefa: ['Hala', 'Stan'] }).map((l) => l.id)
    expect(ids).not.toContain('stara-fabrika')
    expect(ids).not.toContain('stan-sedamdesete')
  })
  it('blokiran dan isključuje lokaciju', () => {
    const svi = zamenskeLokacije({ ...ulaz, tipoviBriefa: ['Studio'] }).map((l) => l.id)
    expect(svi).toEqual(['foto-studio'])
    const bez = zamenskeLokacije({ ...ulaz, tipoviBriefa: ['Studio'], zauzetiDani: (l) => zauzetiDani(l, { 'foto-studio': ['2026-11-17'] }) })
    expect(bez).toEqual([])
  })
  it('lokacija bez tuđih opcija se nudi pre one sa opcijom', () => {
    const opcijaNaHali = novaOpcija('o-h', 'brutalisticka-hala', 'sigma', T, 0)
    const ids = zamenskeLokacije({ ...ulaz, tipoviBriefa: ['Hala'], opcije: [opcijaNaHali] }).map((l) => l.id)
    expect(ids[0]).not.toBe('brutalisticka-hala')
    expect(ids).toContain('brutalisticka-hala') // ali je i dalje moguća (tuđe opcije ne blokiraju)
  })
  it('isti tip ima prednost nad tipom iz briefa', () => {
    const hala = nadjiLokaciju('brutalisticka-hala')!
    const zHala = { ...z, lokacijaId: hala.id, termin: { priprema: [], snimanje: ['2026-11-19'] } as Termin }
    const ids = zamenskeLokacije({ ...ulaz, zahtev: zHala, tipoviBriefa: ['Studio'] }).map((l) => l.id)
    expect(nadjiLokaciju(ids[0])?.tip).toBe('Hala')
  })
  it('bez ikakvog kandidata lista je prazna ("Nasetu šalje novi izbor")', () => {
    expect(zamenskeLokacije({ ...ulaz, tipoviBriefa: [], katalog: [loft] })).toEqual([])
  })
})

describe('B6/B7: objava lokacije i tehnički list', () => {
  const tehnicki = Object.fromEntries(POLJA_TEHNICKOG.map((p) => [p.kljuc, p.primer]))
  const prijava: PrijavaLokacije = {
    id: 'pl-1', izvor: 'vlasnik', podnosilacId: 'alfa', vlasnikId: 'alfa', vlasnikNaziv: '', saglasnostVlasnika: true,
    naziv: 'Probni podrum', tip: 'Studio', opstina: 'Vračar', kvadratura: 80,
    cenovnik: { do10: 20000, do30: 25000, preko30: null, satiDana: 10, pripremaCenti: 12500, prekovremeniCenti: 3000, najkrace: '1 snimajući dan', troskovi: '' },
    tehnicki, brojFotografija: 10, dokaz: 'dokaz-primer.pdf', fotografisanje: false, stanje: 'ceka', odluka: null, poslat: 0,
  }
  it('sva tri uslova ispunjena → može objava', () => {
    expect(kontrolnaLista(prijava).every((s) => s.ispunjeno)).toBe(true)
    expect(mozeLiObjaviti(prijava).moze).toBe(true)
  })
  it('manje od 10 fotografija, prazan tehnički list ili bez dokaza → ne može', () => {
    expect(mozeLiObjaviti({ ...prijava, brojFotografija: 9 }).moze).toBe(false)
    expect(mozeLiObjaviti({ ...prijava, tehnicki: { ...tehnicki, struja: '' } }).moze).toBe(false)
    expect(mozeLiObjaviti({ ...prijava, dokaz: '' }).moze).toBe(false)
  })
  it('već rešena prijava se ne objavljuje ponovo', () => {
    expect(mozeLiObjaviti({ ...prijava, stanje: 'objavljena' }).moze).toBe(false)
  })
  it('preporuka partnera nema fotografije ni dokaz, pa čeka dopunu vlasnika', () => {
    const preporuka: PrijavaLokacije = { ...prijava, izvor: 'partner', vlasnikId: '', tehnicki: {}, brojFotografija: 0, dokaz: '' }
    const o = mozeLiObjaviti(preporuka)
    expect(o.moze).toBe(false)
    expect(o.razlog).toContain('dopunu vlasnika')
  })
  it('objavljena prijava postaje lokacija u katalogu: bez adrese, fotografija i unapred zauzetih dana', () => {
    const l = lokacijaIzPrijave({ ...prijava, stanje: 'objavljena' })
    expect(l.nova).toBe(true)
    expect(l.zauzeti).toEqual([])
    expect(l.cene).toEqual({ do10: 20000, do30: 25000 })
    expect(l.kapacitet).toBe('do30')
    expect(l.cenaPripremeCenti).toBe(12500)
    expect(JSON.stringify(l)).not.toContain('adres')
    expect(prikazAdrese(l.id, { uloga: 'produkcija', akterId: 'delta' }, kontekst).nivo).toBe('zona')
  })
  it('svih 10 lokacija ima sva obavezna polja tehničkog lista popunjena (B8)', () => {
    for (const l of LOKACIJE) {
      const stavke = l.tehnicki.flatMap((g) => g.stavke)
      for (const f of POLJA_TEHNICKOG) {
        const v = stavke.find(([n]) => n === f.naziv)?.[1]
        expect(v, `${l.id}: ${f.naziv}`).toBeTruthy()
        expect(v, `${l.id}: ${f.naziv}`).not.toBe('—')
      }
    }
  })
  it('B7: cene po veličini ekipe i dan pripreme su upisani eksplicitno po lokaciji', () => {
    for (const l of LOKACIJE) {
      expect(Object.keys(l.cene).length).toBeGreaterThan(0)
      expect(l.cenaPripremeCenti).toBeGreaterThan(0)
    }
  })
})

describe('B6: izvoz za knjigovođu (CSV bez mreže)', () => {
  const z = noviZahtev({ id: 'z1', lokacijaId: loft.id, produkcijaId: 'delta', briefId: null, termin: T, razred: 'do30', prekovremeniSati: 0, osnovicaCenti: 90000, sada: 0 })
  const p = { ...napraviPredracunNaknade('p1', 1, z, [], 5), uplataPotvrdjena: 6 }
  it('zaglavlje i redovi: broj, vrsta, kupac, PIB, MB, iznos u RSD sa decimalnim zarezom, kurs, poziv na broj, status', () => {
    const [red] = redoviZaKnjigovodju([p])
    expect(ZAGLAVLJE_CSV).toEqual(['Broj', 'Vrsta', 'Kupac', 'PIB', 'MB', 'Iznos (RSD)', 'Kurs', 'Poziv na broj', 'Status'])
    expect(red).toEqual(['NS-2026-0042', 'naknada za rezervaciju', 'Produkcija Delta (izmišljeno)', "'000000000", "'00000000", '15795,00', '117', '97 NS-2026-0042', 'plaćeno'])
  })
  it('povraćaj je poseban red sa negativnim iznosom', () => {
    const redovi = redoviZaKnjigovodju([{ ...p, povracaj: { sati: 7, iznosPara: p.ukupnoPara } }])
    expect(redovi).toHaveLength(2)
    expect(redovi[1][1]).toBe('povraćaj')
    expect(redovi[1][5]).toBe('-15795,00')
    expect(redovi[1][8]).toBe('vraćeno (izmišljeno)')
  })
  it('CSV: BOM, separator ;, CRLF, navodnici oko polja sa ; ili navodnikom', () => {
    const csv = uCsv([['a;b', 'sa "navodnicima"', '15795,00']])
    expect(csv.startsWith('﻿')).toBe(true)
    expect(csv).toContain('\r\n')
    expect(csv).toContain('"a;b";"sa ""navodnicima""";15795,00')
  })
  it('zaštita od formula: polje koje počinje sa = + - @ dobija apostrof, ali običan (negativan) broj ne', () => {
    expect(poljeCsv('=SUM(A1)')).toBe("'=SUM(A1)")
    expect(poljeCsv('@x')).toBe("'@x")
    expect(poljeCsv('-15795,00')).toBe('-15795,00')
    expect(poljeCsv('+381')).toBe("'+381")
    expect(poljeCsv('\tx')).toBe("'\tx")
    expect(poljeCsv('\rx')).toBe('"\'\rx"')
    expect(poljeCsv("'000000000")).toBe("'000000000") // vodeće nule kao tekst, bez formule
  })
  it('CSV ne sadrži nijednu adresu ni telefon (ni posle uplate ni posle otkazivanja)', () => {
    const csv = uCsv(redoviZaKnjigovodju([p, { ...p, id: 'p2', povracaj: { sati: 9, iznosPara: p.ukupnoPara } }]))
    for (const a of [...ADRESE, ...TELEFONI]) expect(csv).not.toContain(a)
  })
})

describe('A5/A6: ugovor o lokaciji i Location Brief iz rezervacije', () => {
  const podaci: PodaciDokumenta = {
    zahtevId: 'z-3', projekat: 'Reklama, Beograd', vlasnikNaziv: 'Alfa Prostori d.o.o. (izmišljeno)', vlasnikTip: 'pravno',
    korisnikNaziv: 'Produkcija Delta (izmišljeno)', lokacijaNaziv: loft.naziv, opstina: loft.opstina, termin: T, razred: 'do30',
    prekovremeniSati: 0, osnovicaCenti: 90000, kurs: 117, tehnicki: loft.tehnicki,
  }
  const placeno: KontekstAdrese = {
    zahtevi: [{ ...noviZahtev({ id: 'z-3', lokacijaId: loft.id, produkcijaId: 'delta', briefId: null, termin: T, razred: 'do30', prekovremeniSati: 0, osnovicaCenti: 90000, sada: 0 }), stanje: 'odobren' }],
    predracuni: [], izvidjanja: [], sada: 5,
  }
  placeno.predracuni = [{ ...napraviPredracunNaknade('p1', 1, placeno.zahtevi[0], [], 5), uplataPotvrdjena: 6 }]
  const delta = { uloga: 'produkcija' as const, akterId: 'delta' }
  const tekst = (o: [string, string][]) => o.map(([n, t]) => `${n}: ${t}`).join('\n')

  it('ugovor: strane su samo vlasnik i korisnik; Nasetu je posrednik koji nije strana', () => {
    const o = ugovorOdeljci(null, null)
    const strane = o.find(([n]) => n === 'Strane')![1]
    expect(strane).toContain('Vlasnik prostora')
    expect(strane).toContain('Korisnik')
    expect(strane).not.toContain('Nasetu')
    expect(o.find(([n]) => n === 'Posrednik, nije strana u ugovoru')![1]).toContain('Nasetu')
  })
  it('ugovor sadrži sve odeljke šablona, sa otkazivanjem i depozitom', () => {
    const imena = ugovorOdeljci(null, null).map(([n]) => n)
    for (const n of ['Termin, sati i prekovremeni rad', 'Broj ljudi', 'Dozvoljene izmene i vraćanje u prvobitno stanje', 'Depozit', 'Zapisnik na ulazu i izlazu',
      'Otkazivanje (predlog za advokata)', 'Viša sila', 'Saglasnost za snimanje i emitovanje', 'Polisa produkcije', 'Napomena']) expect(imena).toContain(n)
    const t = tekst(ugovorOdeljci(null, null))
    expect(t).toContain(TEKST_DEPOZITA)
    for (const r of OTKAZIVANJE_REDOVI) expect(t).toContain(r)
    expect(t).toContain('predlog; konačan tekst piše advokat')
  })
  it('opšti primer (bez rezervacije) nema adresu', () => {
    for (const a of ADRESE) expect(tekst(ugovorOdeljci(null, null))).not.toContain(a)
    expect(briefOdeljci(null, null).find(([n]) => n === 'Adresa i ulaz')![1]).toBe('vidi se posle potvrđene uplate naknade')
    expect(briefOdeljci(null, null).find(([n]) => n === 'Kontakt na dan snimanja')![1]).toBe('vidi se posle potvrđene uplate naknade')
  })
  it('neplaćena rezervacija: podaci su popunjeni, ali adresa i kontakt nisu (JSON bez 10 adresa i telefona)', () => {
    const neplaceno = { ...placeno, predracuni: [{ ...placeno.predracuni[0], uplataPotvrdjena: null }] }
    const adresa = prikazAdrese(loft.id, delta, neplaceno)
    expect(adresa.nivo).toBe('zona')
    const sve = JSON.stringify([ugovorOdeljci(podaci, adresa), briefOdeljci(podaci, adresa)])
    for (const a of [...ADRESE, ...TELEFONI]) expect(sve).not.toContain(a)
    expect(briefOdeljci(podaci, adresa).find(([n]) => n === 'Adresa i ulaz')![1]).toContain('posle potvrđene uplate')
  })
  it('plaćena rezervacija: dokumenti sadrže adresu lofta i ništa više od toga', () => {
    const adresa = prikazAdrese(loft.id, delta, placeno)
    expect(adresa.nivo).toBe('sve')
    const sve = JSON.stringify([ugovorOdeljci(podaci, adresa), briefOdeljci(podaci, adresa)])
    expect(sve).toContain(adresa.adresa!)
    expect(sve).toContain(adresa.telefon!)
    const druge = ADRESE.filter((a) => a !== adresa.adresa)
    for (const a of druge) expect(sve).not.toContain(a)
    expect(tekst(ugovorOdeljci(podaci, adresa))).toContain('Alfa Prostori')
    expect(tekst(ugovorOdeljci(podaci, adresa))).toContain('105.300,00 RSD')
  })
  it('partner i primalac ne dobijaju adresu ni kad je rezervacija plaćena', () => {
    const adresa = prikazAdrese(loft.id, { uloga: 'partner', akterId: 'mila' }, placeno)
    expect(adresa.nivo).toBe('zona')
    const sve = JSON.stringify([ugovorOdeljci(podaci, adresa), briefOdeljci(podaci, adresa)])
    for (const a of [...ADRESE, ...TELEFONI]) expect(sve).not.toContain(a)
  })
  it('otkazana rezervacija ponovo zatvara adresu u dokumentima', () => {
    const otkazano = { ...placeno, zahtevi: [{ ...placeno.zahtevi[0], stanje: 'otkazao-vlasnik' as const }] }
    const adresa = prikazAdrese(loft.id, delta, otkazano)
    expect(JSON.stringify(briefOdeljci(podaci, adresa))).not.toContain(ADRESE[0])
    expect(adresa.nivo).toBe('zona')
  })
})

describe('B3/B9/B11: primeri pravnih dokumenata i mejlova', () => {
  it('svaki pravni dokument ima verziju v0.1 i oznaku da tekst piše advokat', () => {
    expect(PRAVNI_DOKUMENTI.map((d) => d.id)).toEqual(['uslovi', 'posredovanje-vlasnik', 'posredovanje-produkcija', 'partner', 'privatnost'])
    for (const d of PRAVNI_DOKUMENTI) {
      expect(d.verzija).toBe(VERZIJA_DOKUMENATA)
      expect(JSON.stringify(d.odeljci)).toContain('predlog; konačan tekst piše advokat')
    }
  })
  it('oba ugovora o posredovanju sadrže zaštitni period od 12 meseci', () => {
    for (const id of ['posredovanje-vlasnik', 'posredovanje-produkcija']) {
      expect(JSON.stringify(DOKUMENTI.find((d) => d.id === id)!.odeljci)).toContain('12 meseci')
    }
  })
  it('opšti uslovi: Nasetu je posrednik i nije strana u ugovoru o lokaciji', () => {
    expect(JSON.stringify(DOKUMENTI.find((d) => d.id === 'uslovi')!.odeljci)).toContain('nije strana u ugovoru o lokaciji')
  })
  it('postoje tri nova mejla (novi brief, odbijen zahtev, podsetnik za izviđanje); svaki ima primaoca', () => {
    for (const id of ['novi-brief', 'odbijen-zahtev', 'podsetnik-izvidjanje']) expect(MEJLOVI.some((m) => m.id === id)).toBe(true)
    for (const m of MEJLOVI) expect(m.primalac).toBeTruthy()
    expect(MEJLOVI.find((m) => m.id === 'odbijen-zahtev')!.telo).toContain('Razlog:')
    expect(MEJLOVI.find((m) => m.id === 'podsetnik-izvidjanje')!.telo).toContain(ADRESA_U_MEJLU)
  })
  it('nijedan statični tekst (dokumenti, mejlovi, pravne strane) ne sadrži adresu ni telefon', () => {
    const sve = JSON.stringify([DOKUMENTI, MEJLOVI])
    for (const a of [...ADRESE, ...TELEFONI]) expect(sve).not.toContain(a)
  })
})
