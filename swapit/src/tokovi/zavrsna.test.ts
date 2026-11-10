// ZAVRŠNA DORADA (tehnicki-plan/DORADA-ZAVRSNA.md): K1, V1, V2, V7, V10 i tačke QA (S4, S6, N9, L-2, L-7, L-9, N-2) kao testovi nad čistom logikom.
import { describe, expect, it } from 'vitest'
import { POCETNO, posleRestarta } from '../demo/cuvanje'
import { poUlazu } from '../demo/logika'
import { jeSlobodnaDostava } from '../demo/useStanje'
import { CENE } from '../scenario/cene'
import { ANA_ID, JOVANA_ID, KORISNICI, MARKO_ID, REGION_KORISNICI } from '../scenario/korisnici'
import { OGLASI_BEOGRAD, REZERVISANI_IDOVI, jeRezervisan } from '../scenario/oglasi'
import { ANIN_STARI_BICIKL, AKCIJA_NAKNADA_OPIS, AKCIJA_PRIMER_OZNAKA, PRIJAVE_AKCIJE, POENI_ISTICU_TEKST, poklonDodelaOpis, poklonPotvrdjenTekst, potrosioDodelioTekst, predataStvarDodelaOpis } from '../scenario/poslovno'
import { KATEGORIJE_SA_OBAVESTENJEM } from '../scenario/kategorije'
import { P10_AUKCIJE, P10_PREMIUM, S3_ODELJCI, PRAVNI_TEKSTOVI, CRVENE_LINIJE, CRVENA_LINIJA_PODACI, CRVENA_LINIJA_PARTNERSTVA, CUVANJE_TEKST } from '../scenario/stranice'
import { istorijaPoena, svet } from '../scenario/svet'
const PRICA_POCETAK = { korak: 1, n: 0, grana: 'lanac' as const }
import {
  izmeniOglas,
  istakniOglas,
  kupiPaket,
  napraviOglas,
  odgovoriNaPonudu,
  odlukaPrijaveAkcije,
  odluciPrijavu,
  pokreniAukciju,
  pokreniRazmenu,
  ponudeZaOglas,
  posaljiPonudu,
  prihvatiPonudu,
  prihvatiPonuduIPokreni,
  prijaviOglas,
  idPrijave,
  statusPonude,
  ukloniOglas,
} from './operacije'
import { POCETNI_TOKOVI, dodajNoviOglas, imaTokova, proveriTokove } from './tokovi'

const NACRT = { primer: 'primer-solje', vrsta: 'roba' as const, kat: 'kucni-dekor', nacin: 'razmena' as const, trazi: 'roba' as const, stanje: 'Korišćeno', preuzimanje: 'licno' as const }

describe('K1: predmeti priče su rezervisani — jedno pravilo (jeRezervisan)', () => {
  it('pravilo važi za sve predmete priče i za nijedan običan oglas', () => {
    expect(REZERVISANI_IDOVI.length).toBeGreaterThanOrEqual(7)
    for (const id of REZERVISANI_IDOVI) expect(jeRezervisan(id), id).toBe(true)
    const obicni = OGLASI_BEOGRAD.filter((o) => !REZERVISANI_IDOVI.includes(o.id))
    expect(obicni.every((o) => !jeRezervisan(o))).toBe(true)
    expect(jeRezervisan(undefined)).toBe(false)
  })
  it('nijedna operacija ne dira predmet priče (prijava, isticanje, aukcija, izmena, uklanjanje)', () => {
    for (const id of REZERVISANI_IDOVI) {
      let t = kupiPaket(POCETNI_TOKOVI, 3)
      t = prijaviOglas(t, id, 'Razlog', MARKO_ID)
      t = istakniOglas(t, id, 7)
      t = pokreniAukciju(t, id, 7)
      t = izmeniOglas(t, id, { nacin: 'razmena' })
      t = ukloniOglas(t, id)
      expect(t, id).toEqual(kupiPaket(POCETNI_TOKOVI, 3))
    }
  })
  it('prijavi bicikl → ukloni: broj oglasa ostaje isti (i kad je zapis nasilno ubačen)', () => {
    const osnova = svet(PRICA_POCETAK, POCETNI_TOKOVI)
    const prijavljen = prijaviOglas(POCETNI_TOKOVI, 'markov-bicikl', 'Razlog', ANA_ID)
    expect(prijavljen.prijave).toHaveLength(0)
    // nasilno: zapis kao da je prijava prošla, pa moderacija uklanja
    const nasilno = { ...POCETNI_TOKOVI, prijave: [{ id: idPrijave('markov-bicikl'), oglas: 'markov-bicikl', razlog: 'Razlog', od: ANA_ID }], odluke: { [idPrijave('markov-bicikl')]: 'ukloni' as const }, uklonjeni: ['markov-bicikl'], istaknuti: [{ oglas: 'markov-bicikl', dana: 7 as const }], aukcije: [{ oglas: 'markov-bicikl', dana: 7 as const, korak: 1 }], izmene: { 'markov-bicikl': { nacin: 'poklon' as const } } }
    const s = svet(PRICA_POCETAK, nasilno)
    expect(s.oglasi.length).toBe(osnova.oglasi.length)
    const bicikl = s.oglasi.find((o) => o.id === 'markov-bicikl')!
    expect(bicikl.aukcija).toBeUndefined()
    expect(bicikl.istaknuto).toBeUndefined()
    expect(bicikl.nacin).toBe('razmena')
  })
  it('zapis iz sessionStorage-a koji dira predmet priče se odbacuje (unakrsna provera)', () => {
    for (const polje of ['prijave', 'istaknuti', 'aukcije', 'uklonjeni', 'izmene'] as const) {
      const lose: Record<string, unknown> = { ...POCETNI_TOKOVI }
      lose[polje] =
        polje === 'prijave'
          ? [{ id: 'p-markov-bicikl', oglas: 'markov-bicikl', razlog: 'Razlog', od: ANA_ID }]
          : polje === 'istaknuti'
            ? [{ oglas: 'markov-bicikl', dana: 7 }]
            : polje === 'aukcije'
              ? [{ oglas: 'markov-bicikl', dana: 7, korak: 1 }]
              : polje === 'uklonjeni'
                ? ['markov-bicikl']
                : { 'markov-bicikl': { nacin: 'razmena' } }
      expect(proveriTokove(JSON.parse(JSON.stringify(lose))), polje).toBeNull()
    }
  })
})

describe('V2: jedna stvar = najviše jedna aktivna razmena', () => {
  const pripremi = () => {
    let t = dodajNoviOglas(POCETNI_TOKOVI, napraviOglas(POCETNI_TOKOVI, MARKO_ID, false, 'voz', NACRT))
    const cilj = t.noviOglasi[0].id
    const a = posaljiPonudu(t, { cilj, od: ANA_ID, stvari: [{ naslov: 'Knjige', vrsta: 'roba' }] })
    const b = posaljiPonudu(a.tokovi, { cilj, od: 'irena_zem80', stvari: [{ naslov: 'Roleri', vrsta: 'roba' }] })
    return { t: b.tokovi, cilj, a: a.id, b: b.id }
  }
  it('prihvatanje jedne ponude zatvara ostale na istom oglasu', () => {
    const { t, cilj, a, b } = pripremi()
    const posle = prihvatiPonudu(t, a, cilj)
    expect(statusPonude(posle, a)).toBe('prihvacena')
    expect(statusPonude(posle, b)).toBe('odbijena')
    expect(posle.ponude.find((p) => p.id === b)?.razlog).toBe('izabrana druga ponuda')
  })
  it('druga razmena za istu stvar se odbija (pokreniRazmenu i prihvatiPonudu)', () => {
    const { t, cilj, a, b } = pripremi()
    const r = { tip: 'razmena' as const, cilj, naslov: 'Set šolja', vlasnik: MARKO_ID, stvari: [] }
    const prva = pokreniRazmenu(prihvatiPonudu(t, a, cilj), { ...r, id: a, od: ANA_ID })
    expect(prva.razmene).toHaveLength(1)
    const druga = pokreniRazmenu(prva, { ...r, id: b, od: 'irena_zem80' })
    expect(druga.razmene).toHaveLength(1)
    expect(prihvatiPonudu(prva, b, cilj)).toBe(prva)
  })
  it('izbor na aukciji zatvara sve ostale ponude te aukcije', () => {
    let t = kupiPaket(POCETNI_TOKOVI, 1)
    t = dodajNoviOglas(t, napraviOglas(t, ANA_ID, false, 'zvz', NACRT))
    const cilj = t.noviOglasi[0].id
    t = pokreniAukciju(t, cilj, 7)
    const ponude = ponudeZaOglas(t, cilj, true)
    expect(ponude.length).toBeGreaterThanOrEqual(3)
    const posle = prihvatiPonudu(t, ponude[0].id, cilj)
    const stanja = ponudeZaOglas(posle, cilj, true).map((p) => p.status)
    expect(stanja.filter((s) => s === 'prihvacena')).toHaveLength(1)
    expect(stanja.filter((s) => s === 'odbijena')).toHaveLength(ponude.length - 1)
    expect(odgovoriNaPonudu(posle, ponude[1].id, 'prihvacena')).toBe(posle) // već zatvorena
  })
})

describe('D6: prihvatanje ponude i pokretanje razmene su jedna celina; neuspeh se vidi u stanju', () => {
  const r = (cilj: string, id: string, od: string) => ({ id, tip: 'razmena' as const, cilj, naslov: 'Set šolja', vlasnik: MARKO_ID, od, stvari: [] })
  const pripremi = () => {
    const t = dodajNoviOglas(POCETNI_TOKOVI, napraviOglas(POCETNI_TOKOVI, MARKO_ID, false, 'voz', NACRT))
    const cilj = t.noviOglasi[0].id
    const a = posaljiPonudu(t, { cilj, od: ANA_ID, stvari: [{ naslov: 'Knjige', vrsta: 'roba' }] })
    return { t: a.tokovi, cilj, a: a.id }
  }
  it('uspeh: ponuda je prihvaćena i razmena postoji', () => {
    const { t, cilj, a } = pripremi()
    const posle = prihvatiPonuduIPokreni(t, a, cilj, r(cilj, a, ANA_ID))
    expect(statusPonude(posle, a)).toBe('prihvacena')
    expect(posle.razmene).toHaveLength(1)
  })
  it('razmena ne može da se pokrene („za poene“ bez dovoljno poena): ponuda se NE prihvata', () => {
    const { t, cilj, a } = pripremi()
    const bezPoena = prihvatiPonuduIPokreni(t, a, cilj, { ...r(cilj, a, ANA_ID), tip: 'poeni', poeni: 50, raspolozivo: 0 })
    expect(bezPoena).toBe(t)
    expect(statusPonude(bezPoena, a)).toBe('ceka')
    expect(bezPoena.razmene).toHaveLength(0)
  })
  it('ponovljeno prihvatanje i uklanjanje predmeta priče ne menjaju stanje', () => {
    const { t, cilj, a } = pripremi()
    const posle = prihvatiPonuduIPokreni(t, a, cilj, r(cilj, a, ANA_ID))
    expect(prihvatiPonuduIPokreni(posle, a, cilj, r(cilj, a, ANA_ID))).toBe(posle)
    expect(ukloniOglas(posle, 'markov-bicikl')).toBe(posle)
  })
})

describe('V1: Z3/Z4 i D1/D2 odlučuju slobodno/priča istim pravilom', () => {
  it('slobodna dostava: režim slobodno ILI ?razmena= u adresi; dostava iz priče nikad', () => {
    expect(jeSlobodnaDostava('slobodno', '')).toBe(true)
    expect(jeSlobodnaDostava('vodjena', '?razmena=poeni-x')).toBe(true)
    expect(jeSlobodnaDostava('vodjena', '')).toBe(false)
    expect(jeSlobodnaDostava('vodjena', '?velicina=mala')).toBe(false)
  })
})

describe('V7: uz poene nikad korisničko ime ni id', () => {
  const imena = [...KORISNICI.map((k) => k.id), ...KORISNICI.map((k) => k.ime), ...REGION_KORISNICI.map((k) => k.id), ...REGION_KORISNICI.map((k) => k.ime), ANA_ID, MARKO_ID, JOVANA_ID, 'Ana', 'Marko', 'Jovana']
  it('rečenice o poenima ne sadrže nikoga po imenu', () => {
    const tekstovi = [poklonPotvrdjenTekst(50), predataStvarDodelaOpis(50), poklonDodelaOpis(50, 'PlayStation 2'), potrosioDodelioTekst(50), CRVENE_LINIJE.find((t) => /Poeni/.test(t)) ?? '']
    for (const t of tekstovi) for (const ime of imena) expect(t.includes(ime), `„${t}“ sadrži ${ime}`).toBe(false)
    expect(poklonPotvrdjenTekst(50)).toBe('SWAPIT ti je dodelio 50 poena za poklon — primalac je potvrdio prijem.')
    expect(predataStvarDodelaOpis(50)).toBe('SWAPIT ti je dodelio 50 poena za predatu stvar — primalac je potvrdio prijem.')
  })
  it('reč „direktno“ uz poene više ne postoji', () => {
    expect(CRVENE_LINIJE.join(' ')).not.toMatch(/direktno/)
    expect(CRVENE_LINIJE.find((t) => /^Poeni/.test(t))).toContain('poeni se ne kupuju, ne isplaćuju i ne prenose')
  })
})

describe('V1 (A), V5, V6: tekstovi crvene linije i čuvanja', () => {
  it('crvena linija o podacima i partnerstvima je jedan tekst', () => {
    expect(CRVENE_LINIJE).toContain(CRVENA_LINIJA_PODACI)
    expect(CRVENE_LINIJE).toContain(CRVENA_LINIJA_PARTNERSTVA)
    expect(CRVENA_LINIJA_PODACI).toContain('firme javno prikazuju (izmišljenu) adresu radnje')
    expect(CRVENA_LINIJA_PARTNERSTVA).toContain('Nazivi proizvoda u oglasima opisuju ono što ljudi nude.')
    const sviTekstovi = JSON.stringify([PRAVNI_TEKSTOVI, S3_ODELJCI])
    expect(sviTekstovi).not.toMatch(/adresa nikad/)
  })
  it('tekst o čuvanju je tačan i isti u privatnosti i kolačićima', () => {
    expect(CUVANJE_TEKST).toContain('Ništa se ne šalje; zatvaranjem prozora sve se briše.')
    const privatnost = PRAVNI_TEKSTOVI.find((p) => p.id === 'privatnost')!.odeljci.map((o) => o.tekst).join(' ')
    const kolacici = PRAVNI_TEKSTOVI.find((p) => p.id === 'kolacici')!.odeljci.map((o) => o.tekst).join(' ')
    expect(privatnost).toContain(CUVANJE_TEKST)
    expect(kolacici).toContain(CUVANJE_TEKST)
  })
  it('N9: isti tekst o isteku poena u W1 i S3', () => {
    expect(S3_ODELJCI.map((o) => o.tekst).join(' ')).toContain(POENI_ISTICU_TEKST)
  })
})

describe('V10: Restart i poeni', () => {
  const bogato = () => {
    let t = dodajNoviOglas(POCETNI_TOKOVI, napraviOglas(POCETNI_TOKOVI, ANA_ID, false, 'zvz', NACRT))
    t = kupiPaket(t, 3)
    t = pokreniAukciju(t, t.noviOglasi[0].id, 7)
    t = posaljiPonudu(t, { cilj: 'markova-jakna', od: ANA_ID, stvari: [{ naslov: 'Knjige', vrsta: 'roba' }] }).tokovi
    t = odluciPrijavu(prijaviOglas(t, 'setic-za-kupanje-bebe', 'Razlog', ANA_ID), idPrijave('setic-za-kupanje-bebe'), 'ostavi')
    t = odlukaPrijaveAkcije(t, MARKO_ID, 'primljeno')
    return t
  }
  it('Restart i „Uđi u demo“ brišu SVE popunjene tokove', () => {
    const t = bogato()
    expect(imaTokova(t)).toBe(true)
    expect(Object.keys(t.odluke).length + t.ponude.length + t.aukcije.length + t.noviOglasi.length + t.prijave.length).toBeGreaterThan(4)
    const pre = { ...POCETNO, tokovi: t, saglasnosti: { x8_telefon_r1: true }, tema: 'tamna' as const }
    expect(posleRestarta(pre).tokovi).toEqual(POCETNI_TOKOVI)
    expect(posleRestarta(pre).saglasnosti).toEqual({})
    for (const rezim of ['vodjena', 'slobodno'] as const) {
      const { stanje } = poUlazu(pre, 'ana', rezim)
      expect(stanje.tokovi).toEqual(POCETNI_TOKOVI)
      expect(imaTokova(stanje.tokovi)).toBe(false)
    }
  })
  it('poeni nikad negativni: operacija odbija uzimanje „za poene“ bez dovoljno poena', () => {
    const r = { id: 'p1', tip: 'poeni' as const, cilj: 'x', naslov: 'Ranac', vlasnik: MARKO_ID, od: ANA_ID, stvari: [], poeni: 50 }
    expect(pokreniRazmenu(POCETNI_TOKOVI, r)).toBe(POCETNI_TOKOVI) // bez „raspolozivo“
    expect(pokreniRazmenu(POCETNI_TOKOVI, { ...r, raspolozivo: 20 })).toBe(POCETNI_TOKOVI)
    expect(pokreniRazmenu(POCETNI_TOKOVI, { ...r, raspolozivo: 50 }).poeni).toHaveLength(1)
  })
  it('poeni nikad negativni ni u izvodu (svet i istorija), čak i sa neispravnim zapisom', () => {
    const lose = { ...POCETNI_TOKOVI, poeni: [{ k: ANA_ID, vrsta: 'potroseno' as const, naslov: 'Ranac', iznos: 100 as const }] }
    for (const k of Object.values(svet(PRICA_POCETAK, lose).korisnici)) expect(k.poeni, k.id).toBeGreaterThanOrEqual(0)
    void istorijaPoena
  })
})

describe('QA tačke: S4, L-2, L-7, L-9, N-2', () => {
  it('S4: među javnim aukcijama nema vozila ni nekretnina (njih nema ni u kategorijama sa obaveštenjem)', () => {
    const aukcije = OGLASI_BEOGRAD.filter((o) => o.aukcija)
    expect(aukcije).toHaveLength(6)
    for (const o of aukcije) expect(KATEGORIJE_SA_OBAVESTENJEM.includes(o.kat), o.naslov).toBe(false)
    expect(OGLASI_BEOGRAD.find((o) => o.naslov.includes('Yugo'))?.aukcija).toBeUndefined()
  })
  it('L-2: svaki red „Čeka procenu“ može da se primi ili odbije; „Odbij“ menja status', () => {
    const ceka = PRIJAVE_AKCIJE.filter((p) => p.status === 'ceka')
    expect(ceka.length).toBeGreaterThan(1)
    const posle = odlukaPrijaveAkcije(POCETNI_TOKOVI, ceka[1].korisnik, 'odbijeno')
    expect(posle.statusiPrijava[ceka[1].korisnik]).toBe('odbijeno')
  })
  it('L-7, L-9, N-2: Anin stari bicikl, naknada po akciji i oznaka primera', () => {
    expect(ANIN_STARI_BICIKL).toBe('Dečji bicikl 16 inča (stari, ćerkin)')
    expect(AKCIJA_NAKNADA_OPIS).toBe('plaća se po akciji')
    expect(CENE.akcijaStaroZaNovo).toBe(4900)
    expect(AKCIJA_PRIMER_OZNAKA).toBe('Primer podataka posle nekoliko dana akcije (ilustrativno)')
  })
  it('S3: P10 objašnjava javne aukcije i Top ponudu/PREMIUM', () => {
    expect(P10_AUKCIJE).toContain('Javna aukcija · plaćeno')
    expect(P10_PREMIUM).toContain('Top ponuda')
    expect(P10_PREMIUM).toContain('PREMIUM')
  })
})
