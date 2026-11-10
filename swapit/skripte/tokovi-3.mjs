// Tokovi 7, 8 i 12: profil i podešavanja, prijava, podrška i pravni tekstovi, otvaranje poslovnog naloga građanina. Deo skripte e2e-tokovi.mjs.
import { ima, korak, nema, proveri, zdravo, C, D, SVE, rx } from './_tokovi-zajednicko.mjs'

// ---------------------------------------------------------------------------------------------------------------------
// TOK 7 i 12: prijava (R1, R5), moj profil (N2), podešavanja (N3), recenzije (N4), poslovni nalog (F1 → F2 → Z3 → Z4 → F3)
// ---------------------------------------------------------------------------------------------------------------------
export async function tok7i12(S) {
  await korak(S, 'tok 7', async () => {
    await S.ucitaj('/ana/prijava')
    await zdravo(S, 'R1')
    ima(S, 'R1: popunjeno za demo, bez prave lozinke', await S.glavni(), /polja su popunjena za demo[\s\S]*ana_zvz84[\s\S]*Prijavi se[\s\S]*Ništa se ne šalje/)
    await S.klik('Zaboravljena lozinka')
    proveri(`${S.uredjaj.naziv} R1 → R5`, (await S.ekran()) === 'R5')
    await zdravo(S, 'R5')
    await S.klik('Pošalji link')
    ima(S, 'R5: potvrda da se ništa ne šalje', await S.glavni(), /ništa se ne šalje|Ništa se ne šalje|demo/i)
    await S.klik('Nazad na prijavu')
    proveri(`${S.uredjaj.naziv} R5 → R1`, (await S.ekran()) === 'R1')
    await S.klik('Prijavi se')
    ima(S, 'R1: „Prijavi se“ otvara izbor „Uđi kao“', await S.tekst(), /Uđi kao/)

    // N2 moj profil: 20 poena, nema oglasa; prečice vode na stvarne ekrane
    await S.idi('/ana/moj-profil')
    await zdravo(S, 'N2')
    ima(S, 'N2: 20 poena, model u proveri', await S.glavni(), /20 poena[\s\S]*model u proveri/)
    await S.klik('Moji poeni')
    proveri(`${S.uredjaj.naziv} N2 → W1`, (await S.ekran()) === 'W1')
    await S.idi('/ana/moj-profil')
    await S.klik('Paketi aukcija')
    proveri(`${S.uredjaj.naziv} N2 → Z2`, (await S.ekran()) === 'Z2')
    await S.idi('/ana/moj-profil')
    await S.klik('Poslovni nalog')
    proveri(`${S.uredjaj.naziv} N2 → F1`, (await S.ekran()) === 'F1')
    await S.idi('/ana/moj-profil')
    await S.klik('Sve recenzije')
    proveri(`${S.uredjaj.naziv} N2 → N4`, (await S.ekran()) === 'N4')
    await zdravo(S, 'N4')
    await S.idi('/ana/moj-profil')
    await S.klik('Uredi')
    await zdravo(S, 'N2 „Uredi“')

    // N3: podešavanja; „Obriši nalog“ je isključeno, „Odjavi se“ vodi na R1
    await S.idi('/ana/podesavanja')
    await zdravo(S, 'N3')
    ima(S, 'N3: brisanje naloga je isključeno u demou', await S.glavni(), /Brisanje naloga je isključeno u demou/)
    proveri(`${S.uredjaj.naziv} N3: „Obriši nalog“ nije aktivno`, (await S.stanjeDugmeta('Obriši nalog')) !== 'aktivno')
    await S.klik('Politika privatnosti', { sel: 'main a, main button' })
    proveri(`${S.uredjaj.naziv} N3 → S4`, (await S.ekran()) === 'S4')
    await S.idi('/ana/podesavanja')
    await S.klik('Odjavi se')
    proveri(`${S.uredjaj.naziv} N3 „Odjavi se“ → R1`, (await S.ekran()) === 'R1')

    // tuđi profil: N1 → Sve recenzije (N4)
    await S.idi('/ana/profil/marko_voz77')
    await zdravo(S, 'N1')
  })

  await korak(S, 'tok 12', async () => {
    await S.ucitaj('/ana/poslovni/planovi')
    await zdravo(S, 'F1')
    ima(S, 'F1: dva plana sa cenama, ilustrativno', await S.glavni(), rx('Majstor', SVE, `${D(C.pretplataMajstor)} mesečno`, SVE, 'Radnja', SVE, `${D(C.pretplataRadnja)} mesečno`, SVE, 'ilustrativno, nije cenovnik'))
    await S.klik('Otvori poslovni nalog', { i: 1 })
    proveri(`${S.uredjaj.naziv} F1 → F2`, (await S.ekran()) === 'F2')
    await zdravo(S, 'F2')
    ima(S, 'F2: izabran plan Radnja', await S.glavni(), rx(`Plan: Radnja · ${D(C.pretplataRadnja)} mesečno`))
    proveri(`${S.uredjaj.naziv} F2: uslovi nisu unapred štiklirani, nastavak neaktivan`, !(await S.kvacicaStiklirana('Saglasan sam sa uslovima')) && (await S.stanjeDugmeta('Nastavi na pretplatu')) !== 'aktivno')
    await S.stikliraj('Saglasan sam sa uslovima')
    await S.klik('Nastavi na pretplatu')
    proveri(`${S.uredjaj.naziv} F2 → Z3`, (await S.ekran()) === 'Z3')
    await zdravo(S, 'Z3 pretplata')
    const z3 = await S.glavni()
    ima(S, 'Z3 pretplata: 2.490 din, poslovni korisnik', z3, rx(D(C.pretplataRadnja), SVE, 'Plaćaš kao poslovni korisnik'))
    nema(S, 'Z3 pretplata (firma): nema potrošačkog teksta o odustanku', z3, /Pravo na odustanak|usluga počne odmah/)
    proveri(`${S.uredjaj.naziv} Z3 pretplata (firma): nema kvačice „Želim da usluga počne odmah“`, (await S.broji('main label.kvacica')) === 0)
    await S.klik('Plati')
    ima(S, 'Z4 pretplata: poslovni nalog je otvoren', await S.glavni(), /Poslovni nalog je otvoren/)
    await S.klik('Gledaj kao Prodavnica')
    proveri(`${S.uredjaj.naziv} Z4 → F3 (tabla firme, ugao Prodavnica)`, (await S.ekran()) === 'F3', await S.ekran())
    await zdravo(S, 'F3')
    const st = await S.stanje()
    proveri(`${S.uredjaj.naziv} poslovni nalog je u tokovima`, !!st.tokovi.poslovno && JSON.stringify(st.tokovi.poslovno).length > 5)
  })
}

// ---------------------------------------------------------------------------------------------------------------------
// TOK 8: podrška (S1), pravila (S2), kako radi (S3), pravni tekstovi (S4), prijava problema (S5), kako ređamo (P10), uvod (U1, U3)
// ---------------------------------------------------------------------------------------------------------------------
export async function tok8(S) {
  await korak(S, 'tok 8', async () => {
    await S.ucitaj('/ana/podrska')
    await zdravo(S, 'S1')
    proveri(`${S.uredjaj.naziv} S1: pet tema podrške`, (await S.broji('main a[href*="#/"], main button')) >= 5)
    const teme = [
      ['Pravila zajednice i zabranjene stvari', 'S2'],
      ['Kako radi SWAPIT', 'S3'],
      ['Pravni tekstovi', 'S4'],
      ['Prijavi problem', 'S5'],
      ['Kako ređamo oglase', 'P10'],
    ]
    for (const [naziv, ekran] of teme) {
      await S.idi('/ana/podrska')
      await S.klik('Otvori', { sel: 'main a, main button', i: teme.findIndex((t) => t[0] === naziv) })
      proveri(`${S.uredjaj.naziv} S1 „${naziv}“ → ${ekran}`, (await S.ekran()) === ekran, await S.ekran())
      await zdravo(S, ekran)
    }
    // S2: spisak zabranjenih stvari je isti kao svuda (jedan izvor)
    await S.idi('/ana/pravila')
    ima(S, 'S2: spisak zabranjenih stvari', await S.glavni(), /Prerađena hrana iz domaće radinosti, meso, mlečni proizvodi i alkohol/)
    // S4: tri pravna teksta su nacrt
    await S.idi('/ana/podrska')
    await S.klik('Pravni tekstovi', { sel: 'main a, main button' }).catch(() => {})
    await zdravo(S, 'S4')
    ima(S, 'S4: tekst je nacrt i traži pregled stručnog lica', await S.glavni(), /nacrt/i)
    // S5: prijava problema → potvrda
    await S.idi('/ana/prijavi-problem')
    await S.klik('Prevara')
    await S.klik('Pošalji')
    ima(S, 'S5: potvrda prijave, ništa se ne šalje', await S.glavni(), /Prijava je primljena|primljena|ništa se ne šalje/i)
    // S1 poruka podršci
    await S.idi('/ana/podrska')
    await S.klik('Poruka podršci')
    proveri(`${S.uredjaj.naziv} S1 „Poruka podršci“ → razgovor sa podrškom (C2)`, (await S.ekran()) === 'C2', await S.ekran())
    await zdravo(S, 'C2 podrška')
  })

  await korak(S, 'uvod', async () => {
    await S.ucitaj('/')
    await zdravo(S, 'U1')
    ima(S, 'U1: šta je ovo', await S.glavni(), /SWAPIT/)
    const dugmad = await S.page.evaluate(() => [...document.querySelectorAll('main button, main a')].filter((e) => e.getClientRects().length).map((e) => e.textContent.trim()))
    proveri(`${S.uredjaj.naziv} U1: ima dugme za početak`, dugmad.some((d) => /Pogledaj demo/i.test(d)), dugmad.join(' ; '))
    await S.idi('/o-demou')
    await zdravo(S, 'U3')
    nema(S, 'U3: nema fraze „u izradi“', await S.glavni(), /u izradi/i)
  })
}
