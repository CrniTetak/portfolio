// E2E vođene priče (talasi 1 i 2) u pravom pregledaču, nad `npm run preview` (port 4192).
// Svih 4 ugla (Ana, Marko, Prodavnica, Moderacija) × 9 koraka × obe grane (lanac, „za poene“ 6R–8R) × računar (1280) i telefon (390):
// Dalje / Nazad / skok / „Pokaži mi“ / Restart / osvežavanje, sadržaj ključnih ekrana (brojke iz UX 7), i RUČNO klikanje svih radnji pravim
// dugmadima (sa obaveznim kvačicama koje gledalac sam štiklira), uz proveru ekrana po matrici (UX 3.3) i stanja posle svake radnje.
import { BASE, KLJUC, izvestaj, otvori, proveravac, sleep, ucitajModule } from './_zajednicko.mjs'

const { m, zatvori } = await ucitajModule({
  matrica: '/src/pravila/matrica.ts',
  koraci: '/src/prica/koraci.ts',
  datumi: '/src/scenario/datumi.ts',
  format: '/src/scenario/format.ts',
  rute: '/src/pravila/rute.ts',
})
const { lista, proveri } = proveravac()
const UGLOVI = ['ana', 'marko', 'prodavnica', 'moderacija']
const GRANE = ['lanac', 'poeni']
const UREDJAJI = [
  { naziv: 'racunar', sirina: 1280, visina: 800, telefon: false },
  { naziv: 'telefon', sirina: 390, visina: 844, telefon: true },
]
const POC = { v: 1, poz: { korak: 1, n: 0, grana: 'lanac' }, rezim: 'vodjena', tema: 'svetla', poruke: { slobodno: true }, saglasnosti: {}, tokovi: { noviOglasi: [], omiljeno: [] } }
const kraj = (korak, grana = 'lanac') => ({ korak, n: m.koraci.brojRadnji(korak, grana), grana })
const poc = (korak, grana = 'lanac') => ({ korak, n: 0, grana })
const KRAJ_PRICE = kraj(9)
const svrsen = (poz) => poz.korak === KRAJ_PRICE.korak && poz.n === KRAJ_PRICE.n

const sesije = []
async function pokreni(uredjaj) {
  const o = await otvori({ sirina: uredjaj.sirina, visina: uredjaj.visina, telefon: uredjaj.telefon })
  sesije.push(o)
  const { page } = o
  let brojac = 0
  const stanje = () => page.evaluate((k) => JSON.parse(sessionStorage.getItem(k) ?? 'null'), KLJUC)
  const ekran = () => page.evaluate(() => document.querySelector('main[data-ekran]')?.getAttribute('data-ekran') ?? null)
  const hash = () => page.evaluate(() => location.hash)
  const tekst = () => page.evaluate(() => document.body.innerText)
  const ucitaj = async (ruta, poz = POC.poz, extra = {}) => {
    await page.goto(BASE + '?r=0#/', { waitUntil: 'networkidle0' })
    await sleep(100)
    await page.evaluate((k, s) => sessionStorage.setItem(k, JSON.stringify(s)), KLJUC, { ...POC, poz, ...extra })
    await page.goto(BASE + '?r=' + ++brojac + '#' + ruta, { waitUntil: 'networkidle0' })
    await sleep(120)
  }
  /** Klik na vidljivo dugme/link u glavnom delu ekrana čiji tekst počinje ovako (obavezne kvačice gledalac štiklira sam). */
  const klik = async (t, { stikliraj = true, sel = 'main button, main a', pocekaj = 160 } = {}) => {
    if (stikliraj) {
      await page.evaluate(() => {
        for (const i of document.querySelectorAll('main input[data-obavezna]:not(:checked)')) i.click()
      })
      await sleep(60)
    }
    const rez = await page.evaluate(
      (t, sel) => {
        const re = new RegExp('^' + t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
        const el = [...document.querySelectorAll(sel)].filter((e) => e.getClientRects().length > 0).find((e) => re.test((e.textContent || '').replace(/\s+/g, ' ').trim()))
        if (!el) return 'nema'
        if (el.disabled || el.getAttribute('aria-disabled') === 'true') return 'neaktivno'
        el.click()
        return 'ok'
      },
      t,
      sel,
    )
    if (rez !== 'ok') throw new Error(`Dugme „${t}“ nije kliknuto (${rez}) na ${await hash()}`)
    await sleep(pocekaj)
  }
  const dalje = () => page.evaluate((tel) => (tel ? document.querySelector('[data-traka-telefon] button[aria-label="Sledeći korak"]') : document.querySelector('[data-traka-price] button[aria-label=Dalje]'))?.click(), uredjaj.telefon)
  const nazad = () => page.evaluate((tel) => (tel ? document.querySelector('[data-traka-telefon] button[aria-label="Prethodni korak"]') : document.querySelector('[data-traka-price] button[aria-label=Nazad]'))?.click(), uredjaj.telefon)
  const skok = async (k) => {
    if (uredjaj.telefon) {
      await page.evaluate(() => document.querySelector('[data-traka-telefon] .mid')?.click())
      await sleep(250)
      await page.evaluate((n) => document.querySelectorAll('.pr-sheet ol li button')[n - 1].click(), k)
    } else await page.evaluate((n) => document.querySelectorAll('[data-traka-price] .pr-d')[n - 1].click(), k)
    await sleep(250)
  }
  const idi = async (h) => {
    await page.evaluate((x) => (location.hash = x), h)
    await sleep(200)
  }
  return { ...o, uredjaj, stanje, ekran, hash, tekst, ucitaj, klik, dalje, nazad, skok, idi }
}

/** Sadržaj ključnih ekrana: [opis, ugao, pozicija, ruta ili null (= ekran iz matrice), [izrazi koji moraju stajati]]. Brojke su iz UX 7. */
const SADRZAJ = [
  ['F3 u koraku 1: nema akcije, 5 oglasa, 1.204 pregleda, pretplata kao ilustracija', 'prodavnica', poc(1), null, [/Tabla firme/, /Aktivni oglasi\s+5/, /Pregledi, \d+ dana\s+1\.204/, /Ponude\s+17/, /Obavljene razmene\s+6/, /Nema aktivne akcije/, /Pretplata: Radnja/, /2\.490 din/, /ilustrativno, nije cenovnik/]],
  ['F4 u koraku 2: javni profil, oznaka Firma, 5 oglasa', 'prodavnica', kraj(2), null, [/Sportski kutak Zupčanik/, /Firma/, /Oglasi firme \(5\)/, /izmišljena adresa/]],
  ['F6 u koraku 3: rezultati poslednjih dana', 'prodavnica', poc(3), null, [/Pregled rezultata/, /Pregledi\s+1\.204/, /Sačuvano u omiljeno\s+63/, /Nedelja 4/, /9\.650/, /214/, /2,2%/]],
  ['A5 u koraku 8: nacrt akcije, cena i oznake', 'prodavnica', poc(8), null, [/Nova akcija/, /4\.900 din/, /ilustrativno, nije cenovnik/, /3\.000 din/, /Dostupno u koraku 9/, /Reklama „Sponzorisano“ za akciju \(\d+ dana na početnoj\) je uključena u cenu akcije\./]],
  ['A4 u koraku 9: prijave 12 = 5 + 4 + 3, popusti 15.000 din, naknada 4.900 din', 'prodavnica', { korak: 9, n: 4, grana: 'lanac' }, '/prodavnica/akcije', [/Tabla akcija/, /Prijave\s+12/, /Primljeno\s+5/, /Čeka procenu\s+4/, /Odbijeno\s+3/, /15\.000 din/, /4\.900 din/, /486/, /ilustrativno, nije cenovnik/]],
  ['A6 na kraju koraka 9: kupon izdat', 'prodavnica', kraj(9), null, [/Prijave na akciji/, /Kupon izdat: 3\.000 din/, /luka_zem89/, /Prikaži sve \(12\)/]],
  ['F3 na kraju koraka 9: akcija je aktivna', 'prodavnica', kraj(9), '/prodavnica/tabla', [/Staro za novo/, /Sponzorisano/, /prijava:\s*12/]],
  ['A1 (Ana, kraj priče): stranica akcije sa oznakama', 'ana', kraj(9), null, [/Sponzorisano/, /Staro za novo — donesi stari bicikl, dobij popust 3\.000 din na novi/, /ilustrativno, nije cenovnik/, /2\. 11\. 2026\. – 30\. 11\. 2026\./, /Prijavi stari bicikl/]],
  ['P1 (Marko, korak 9, pre plaćanja akcije): reklama firme još nije reklama akcije', 'marko', poc(9), null, [/Sponzorisano/, /Sportska oprema i bicikli/, /Oglašava: Sportski kutak Zupčanik/]],
  ['P1 (Marko, kraj priče): reklama „Sponzorisano“ za akciju je tek posle plaćanja', 'marko', kraj(9), null, [/Sponzorisano/, /Staro za novo/, /Oglašava: Sportski kutak Zupčanik/]],
  ['V1 u koraku 4: tri prijave, stiže „šljivovica“', 'moderacija', poc(4), null, [/Tabla moderacije/, /Na čekanju\s+3/, /Obrađeno ove nedelje\s+41/, /Uklonjeno ove nedelje\s+9/, /Domaća šljivovica 5 l/, /Sveže voće i povrće/, /Spisak zabranjenih stvari/]],
  ['V2 u koraku 5: pregled prijave', 'moderacija', poc(5), null, [/Pregled prijave/, /Domaća šljivovica 5 l/, /nenad_pal65/, /Zabranjena stvar: alkohol/, /Ukloni/, /Ostavi/, /Traži izmenu/]],
  ['V3 na kraju koraka 5: obrazloženje, spisak zabranjenih stvari, odluka poslata', 'moderacija', kraj(5), null, [/Oglas je uklonjen jer SWAPIT ne dozvoljava alkohol ni prerađenu hranu iz domaće radinosti\./, /Ovo vidi korisnik/, /Prerađena hrana iz domaće radinosti, meso, mlečni proizvodi i alkohol/, /Duvan i duvanski proizvodi/, /Odluka je poslata/]],
  ['V4 u koraku 6: kako korisnik vidi odluku', 'moderacija', poc(6), null, [/Tvoj oglas je uklonjen/, /Spisak zabranjenih stvari/, /Uloži prigovor/, /Razumem/, /nenad_pal65/]],
  ['V1 u koraku 6: na čekanju 2, uklonjeno 10, obrađeno 42', 'moderacija', poc(6), '/moderacija/moderacija', [/Na čekanju\s+2/, /Obrađeno ove nedelje\s+42/, /Uklonjeno ove nedelje\s+10/, /Uklonjeno/]],
  ['V1 u koraku 9: automatska provera akcije i reklame', 'moderacija', kraj(9), null, [/Automatska provera: akcija i reklama imaju oznake Firma i Sponzorisano\./]],
  ['W2 u 6R: nedovoljno poena (20, fali 30, treba 50), predlog poklona', 'ana', { korak: 6, n: 1, grana: 'poeni' }, null, [/Nedovoljno poena/, /Imaš 20 poena, fali ti 30 poena/, /Treba ti 50 poena/, /Pokloni PlayStation 2/, /Razmeni umesto toga/, /Poeni se ne mogu kupiti/, /model u proveri/, /Za poene · 50/]],
  ['O2 u 7R: „Uredi oglas“, način Poklanjam', 'ana', poc(7, 'poeni'), null, [/Uredi oglas/, /Sačuvaj izmene/, /Poklanjam/, /SWAPIT ti dodeljuje 50 poena tek kad primalac potvrdi prijem poklona/, /način zaključan na „Poklanjam“/]],
  ['W5 u 7R: Jovanin zahtev, Anin poklon potvrđen, Jovana potvrdila prijem, SWAPIT dodelio 70 poena', 'ana', kraj(7, 'poeni'), null, [/Zahtev za poklon/, /jovana_vra91/, /Poklon je potvrđen/, /SWAPIT ti je dodelio 50 poena za poklon — primalac je potvrdio prijem[.]/]],
  ['W1 na kraju 7R: 70 poena, istorija +50 poena', 'ana', kraj(7, 'poeni'), '/ana/poeni', [/Moji poeni/, /70 poena/, /model u proveri/, /SWAPIT ti je dodelio 50 poena za poklon [(]PlayStation 2[)] — primalac je potvrdio prijem[.]/, /\+50 poena/, /Uzmi bicikl za poene/, /Dostupno u koraku 8/]],
  ['W1 na početku 8R: poeni 70, spremno „Uzmi bicikl za poene“', 'ana', poc(8, 'poeni'), null, [/70 poena/, /Uzmi bicikl za poene/, /Za poene · 50/]],
  ['W1 na kraju 8R: Ana 20 poena (−50), Marko 85', 'ana', kraj(8, 'poeni'), '/ana/poeni', [/20 poena/, /−50 poena/, /Potrošeno 50 poena: Dečji bicikl 20 inča/]],
  ['W1 na kraju 8R (Marko): 85 poena, +50 poena', 'marko', kraj(8, 'poeni'), '/marko/poeni', [/85 poena/, /\+50 poena/, /Poeni iz ranijih razmena/]],
  ['X12 u 6R (Marko): Ana razmišlja o biciklu za poene', 'marko', poc(6, 'poeni'), null, [/ana_zvz84 razmišlja da uzme tvoj bicikl za poene/]],
  ['X12 u 7R (Marko): Ana uzima bicikl za poene', 'marko', kraj(7, 'poeni'), null, [/ana_zvz84 uzima bicikl za poene/]],
  ['O1 u 7R (posle izmene oglasa): Anin PlayStation 2 je „Poklanjam“', 'ana', { korak: 7, n: 2, grana: 'poeni' }, '/ana/oglas/ana-ps2', [/Poklanjam/]],
  ['X10 na kraju 8R: SWAPIT oduzima i dodeljuje poene (nema prenosa između korisnika)', 'ana', kraj(8, 'poeni'), '/ana/razmena/lanac/obavljena', [/Razmena obavljena/, /Primalac stvari je potrošio 50 poena · Davaocu stvari je SWAPIT dodelio 50 poena za predatu stvar — primalac je potvrdio prijem[.]/]],
  ['O6 u 7R: Anin oglas, dugme „Uredi“', 'ana', { korak: 7, n: 2, grana: 'poeni' }, '/ana/moji-oglasi', [/Moji oglasi/, /PlayStation 2 sa igrama/, /Uredi/, /Istakni/, /Poklanjam/]],
]

try {
  for (const uredjaj of UREDJAJI) {
    const S = await pokreni(uredjaj)
    const naziv = (ugao, opis) => `${uredjaj.naziv} ${ugao}: ${opis}`

    for (const ugao of UGLOVI)
      for (const grana of GRANE) {
        const pocetak = grana === 'lanac' ? POC.poz : poc(6, 'poeni')
        const oznaka = grana === 'poeni' ? ' (račva)' : ''
        // ------------------------------------------------------------ A) Dalje do kraja priče, ekran po matrici i bez kostura
        await S.ucitaj(m.rute.link(m.matrica.ekranZaPoziciju(pocetak, ugao), ugao), pocetak)
        let poz = pocetak
        for (let i = 0; i < 40 && !svrsen(poz); i++) {
          await S.dalje()
          await sleep(160)
          poz = (await S.stanje()).poz
          const cilj = m.matrica.ekranZaPoziciju(poz, ugao)
          const t = await S.tekst()
          const ime = `${poz.korak}/${poz.n}${poz.grana === 'poeni' ? 'R' : ''}`
          proveri(naziv(ugao, `Dalje${oznaka} → ${ime}: ekran ${cilj}`), (await S.ekran()) === cilj, `${await S.ekran()} ${await S.hash()}`)
          proveri(naziv(ugao, `Dalje${oznaka} → ${ime}: nema kostura „u izradi“`), !(await S.page.evaluate(() => !!document.querySelector('[data-u-izradi]'))), cilj)
          proveri(naziv(ugao, `Dalje${oznaka} → ${ime}: nema „Još nije počelo“ na ekranu priče`), !(await S.page.evaluate(() => !!document.querySelector('[data-jos-nije-poceo]'))), cilj)
          proveri(naziv(ugao, `Dalje${oznaka} → ${ime}: demo datum`), t.includes('Demo datum') || uredjaj.telefon, '')
          proveri(naziv(ugao, `Dalje${oznaka} → ${ime}: grana ostaje ${grana}`), poz.grana === grana)
        }
        proveri(naziv(ugao, `Dalje${oznaka} stiže do kraja priče (9/završno)`), svrsen(poz), JSON.stringify(poz))
        // Nazad do početka
        for (let k = 0; k < 60 && !(grana === 'lanac' ? poz.korak === 1 && poz.n === 0 : poz.korak === 5 && poz.n === 0); k++) {
          await S.nazad()
          await sleep(140)
          poz = (await S.stanje()).poz
        }
        if (grana === 'lanac') proveri(naziv(ugao, 'Nazad vraća na 1/početno'), poz.korak === 1 && poz.n === 0, JSON.stringify(poz))
        else {
          proveri(naziv(ugao, 'Nazad iz 6R/početno vraća na 5/početno'), poz.korak === 5 && poz.n === 0, JSON.stringify(poz))
          proveri(naziv(ugao, 'Nazad iz račve vraća granu na „lanac“ (račva poništena)'), poz.grana === 'lanac', JSON.stringify(poz))
        }

        // ------------------------------------------------------------ B) skok na svaki korak: početno stanje i ekran iz matrice
        for (let k = 1; k <= 9; k++) {
          if (grana === 'poeni' && k < 6) continue // skok na 1–5 iz račve poništava račvu: proverava se ispod
          await S.ucitaj(m.rute.link(m.matrica.ekranZaPoziciju(pocetak, ugao), ugao), pocetak)
          await S.skok(k)
          const p = (await S.stanje()).poz
          proveri(naziv(ugao, `skok${oznaka} na korak ${k}: početno stanje u grani ${grana}`), p.korak === k && p.n === 0 && p.grana === (k < 6 ? 'lanac' : grana), JSON.stringify(p))
          proveri(naziv(ugao, `skok${oznaka} na korak ${k}: ekran ${m.matrica.ekranZaPoziciju(p, ugao)}`), (await S.ekran()) === m.matrica.ekranZaPoziciju(p, ugao), `${await S.ekran()}`)
        }
        if (grana === 'poeni') {
          await S.ucitaj(m.rute.link(m.matrica.ekranZaPoziciju(pocetak, ugao), ugao), pocetak)
          await S.skok(3)
          const p = (await S.stanje()).poz
          proveri(naziv(ugao, 'skok iz račve na korak 3 poništava račvu'), p.korak === 3 && p.grana === 'lanac', JSON.stringify(p))
        }

        // ------------------------------------------------------------ C) „Pokaži mi“ i „Nazad na priču“
        const gde = grana === 'lanac' ? poc(4) : poc(7, 'poeni')
        await S.ucitaj(m.rute.link('S2', ugao), gde)
        const naPrici = await S.page.evaluate((tel) => (document.querySelector(tel ? '[data-traka-telefon] .pr-slot button' : '[data-glavno-dugme]')?.textContent ?? '').trim(), uredjaj.telefon)
        proveri(naziv(ugao, `van ekrana priče${oznaka} glavno dugme vodi nazad u priču`), /Nazad na priču|Pokaži mi/.test(naPrici), naPrici)
        if (!uredjaj.telefon) {
          await S.klik('Nazad na priču', { sel: '[data-glavno-dugme]', stikliraj: false })
          const cilj = m.matrica.ekranZaPoziciju(gde, ugao)
          proveri(naziv(ugao, `„Nazad na priču“${oznaka} otvara ${cilj}`), (await S.ekran()) === cilj, await S.ekran())
          await S.klik('Pokaži mi', { sel: '[data-glavno-dugme]', stikliraj: false })
          proveri(naziv(ugao, `„Pokaži mi“${oznaka} ostaje na ekranu početnog stanja`), (await S.ekran()) === cilj && (await S.stanje()).poz.n === 0, await S.ekran())
        }

        // ------------------------------------------------------------ D) osvežavanje usred koraka
        const usred = grana === 'lanac' ? (ugao === 'ana' ? { korak: 2, n: 1, grana } : ugao === 'marko' ? { korak: 5, n: 1, grana } : ugao === 'prodavnica' ? { korak: 9, n: 2, grana } : { korak: 5, n: 2, grana }) : ugao === 'ana' ? { korak: 7, n: 1, grana } : { korak: 8, n: 1, grana }
        await S.ucitaj(m.rute.link(m.matrica.ekranZaPoziciju(usred, ugao), ugao), usred)
        await S.page.reload({ waitUntil: 'networkidle0' })
        await sleep(250)
        const posle = (await S.stanje()).poz
        proveri(naziv(ugao, `osvežavanje${oznaka} čuva mesto u priči`), posle.korak === usred.korak && posle.n === usred.n && posle.grana === usred.grana, JSON.stringify(posle))
        proveri(naziv(ugao, `osvežavanje${oznaka} ostaje na istom ekranu`), (await S.ekran()) === m.matrica.ekranZaPoziciju(usred, ugao), await S.ekran())

        // ------------------------------------------------------------ E) Restart (iz račve takođe vraća na korak 1, grana lanac)
        if (uredjaj.telefon) {
          await S.page.evaluate(() => document.querySelector('[data-traka-telefon] .mid')?.click())
          await sleep(250)
          await S.page.evaluate(() => [...document.querySelectorAll('.pr-sheet button')].find((b) => /Restart demo/.test(b.textContent))?.click())
        } else await S.page.evaluate(() => [...document.querySelectorAll('[data-traka-price] button')].find((b) => /Restart demo/.test(b.textContent))?.click())
        await sleep(250)
        proveri(naziv(ugao, `Restart${oznaka} traži potvrdu`), /Vratiti demo na korak 1\?/.test(await S.tekst()))
        await S.page.evaluate(() => [...document.querySelectorAll('[role=dialog] button')].find((b) => b.textContent.trim() === 'Da')?.click())
        await sleep(400)
        const posleR = (await S.stanje()).poz
        proveri(naziv(ugao, `Restart${oznaka}: korak 1 početno, grana lanac`), posleR.korak === 1 && posleR.n === 0 && posleR.grana === 'lanac', JSON.stringify(posleR))
        proveri(naziv(ugao, `Restart${oznaka} otvara ekran koraka 1`), (await S.ekran()) === m.matrica.ekranZaPoziciju(POC.poz, ugao), await S.ekran())
      }

    // -------------------------------------------------------------- F) sadržaj ključnih ekrana (brojke iz UX 7)
    for (const [opis, ugao, pozicija, ruta, izrazi] of SADRZAJ) {
      const putanja = ruta ?? m.rute.link(m.matrica.ekranZaPoziciju(pozicija, ugao), ugao)
      await S.ucitaj(putanja, pozicija)
      const t = await S.tekst()
      for (const re of izrazi) proveri(naziv(ugao, `${opis}: ${re}`), re.test(t), `${await S.ekran()} ${await S.hash()}`)
      proveri(naziv(ugao, `${opis}: nema kostura ni „Još nije počelo“`), !(await S.page.evaluate(() => !!document.querySelector('[data-u-izradi], [data-jos-nije-poceo]'))))
    }

    // PK2-6: značke (Firma, Sponzorisano, Istaknuto · plaćeno) se proveravaju SELEKTORIMA, ne tekstom ekrana
    const ZNACKE = [
      ['A5 u koraku 8: pregled oglasa akcije nosi „Firma“ i „Sponzorisano“', 'prodavnica', poc(8), ['[data-pregled-oznaka] .znacka-firma', '[data-pregled-oznaka] .znacka-sponzorisano']],
      ['A1 na kraju priče: akcija nosi „Sponzorisano“', 'ana', kraj(9), ['.znacka-sponzorisano']],
      ['P1 na kraju priče: reklama akcije nosi „Sponzorisano“', 'marko', kraj(9), ['[data-reklama] .znacka-sponzorisano']],
      ['P1 u koraku 1: obe reklame nose „Sponzorisano“', 'ana', poc(1), ['[data-reklama="pedala"] .znacka-sponzorisano', '[data-reklama="zupcanik"] .znacka-sponzorisano'], '/ana/pocetna'],
      ['F4 u koraku 2: javni profil nosi „Firma“', 'ana', poc(2), ['.znacka-firma'], '/ana/firma/zupcanik'],
      ['P1 u koraku 1: red „Istaknuto“ nosi „Istaknuto · plaćeno“', 'ana', poc(1), ['[data-red="istaknuto"] .znacka-istaknuto'], '/ana/pocetna'],
    ]
    for (const [opis, ugao, pozicija, selektori, ruta] of ZNACKE) {
      await S.ucitaj(ruta ?? m.rute.link(m.matrica.ekranZaPoziciju(pozicija, ugao), ugao), pozicija)
      for (const sel of selektori) proveri(naziv(ugao, `${opis}: ${sel}`), await S.page.evaluate((s) => !!document.querySelector(s), sel), sel)
    }

    // -------------------------------------------------------------- G) RUČNO klikanje radnji (pravim dugmadima), korak po korak
    const radnje = async (ugao, korak, koraci, grana = 'lanac') => {
      const start = { korak, n: 0, grana }
      await S.ucitaj(m.rute.link(m.matrica.ekranZaPoziciju(start, ugao), ugao), start)
      for (const [opis, t, ocekEkran, opcije] of koraci) {
        const pre = (await S.stanje()).poz
        try {
          await S.klik(t, opcije)
        } catch (e) {
          proveri(naziv(ugao, `korak ${korak}${grana === 'poeni' ? 'R' : ''}: ${opis}`), false, e.message)
          continue
        }
        const p = (await S.stanje()).poz
        proveri(naziv(ugao, `korak ${korak}${grana === 'poeni' ? 'R' : ''}: ${opis}`), (await S.ekran()) === ocekEkran || ocekEkran === '*', `${await S.ekran()} (očekivano ${ocekEkran}) ${JSON.stringify(pre)} → ${JSON.stringify(p)}`)
      }
      const p = (await S.stanje()).poz
      proveri(naziv(ugao, `korak ${korak}${grana === 'poeni' ? 'R' : ''}: sve radnje odrađene, korak završen`), p.korak === korak && p.n === m.koraci.brojRadnji(korak, grana) && p.grana === grana, JSON.stringify(p))
    }
    // ---- Ana, glavni tok
    await radnje('ana', 1, [['R2 Dalje → R3', 'Dalje', 'R3'], ['R3 Napravi nalog → R4', 'Napravi nalog', 'R4'], ['R4 Potvrdi', 'Potvrdi', 'R4']])
    proveri(naziv('ana', 'R4: oznaka „Verifikovan“ i početni poeni posle potvrde'), /Verifikovan/.test(await S.tekst()) && /20 poena/.test(await S.tekst()))
    await S.klik('Uđi')
    proveri(naziv('ana', 'R4 „Uđi“ → P1 sa pozdravom'), (await S.ekran()) === 'P1' && /Dobro došla/.test(await S.tekst()), await S.ekran())
    await radnje('ana', 2, [['O2 Dalje → O3', 'Dalje', 'O3'], ['O3 Objavi → O4', 'Objavi', 'O4'], ['O4 Dodaj u listu želja → W3', 'Dodaj u listu želja', 'W3']])
    await radnje('ana', 3, [['W4 Pogledaj oglas → O1', 'Pogledaj oglas', 'O1']])
    await radnje('ana', 4, [['X1 izaberi PlayStation 2', 'Izaberi', 'X1'], ['X1 Nastavi → X2', 'Nastavi', 'X2'], ['X2 Pošalji ponudu → X3', 'Pošalji ponudu', 'X3']])
    // lanac se prihvata jednim klikom; kratka sekvenca stanja se vidi sama (Ana → Marko → Jovana → „Lanac prihvaćen — sve troje“)
    await radnje('ana', 6, [['X13 Prihvati lanac (Marko i Jovana odmah posle)', 'Prihvati lanac', 'X13', { pocekaj: 250 }]])
    proveri(naziv('ana', 'X13: sekvenca — Marko još nije prihvatio'), /Čeka se Marko/.test(await S.tekst()) || /marko_voz77: prihvatio/.test(await S.tekst()), await S.tekst())
    await sleep(2400)
    proveri(naziv('ana', 'X13: „Lanac prihvaćen — sve troje“ posle sekvence'), /Lanac prihvaćen — sve troje/.test(await S.tekst()) && /jovana_vra91: prihvatila/.test(await S.tekst()))
    await radnje('ana', 7, [['X8 Poruke → C2', 'Poruke', 'C2'], ['C2 Dogovoreno', 'Dogovoreno', 'C2', { sel: 'main button' }], ['C2 Nazad na dogovor → X8', 'Nazad na dogovor', 'X8'], ['X8 Pošalji kurirom → D1', 'Pošalji kurirom', 'D1'], ['D1 Nastavi → D2', 'Nastavi', 'D2'], ['D2 Plati dostavu → Z3', 'Plati dostavu', 'Z3'], ['Z3 Plati → Z4', 'Plati', 'Z4'], ['Z4 Nastavi → D3', 'Nastavi', 'D3']])
    await radnje('ana', 8, [['X9 Primio/la sam', 'Primio/la sam', 'X9'], ['X9 Razmena obavljena → X10', 'Razmena obavljena', 'X10', { sel: 'main a' }], ['X10 Oceni razmenu → X11', 'Oceni razmenu', 'X11'], ['X11 Objavi recenziju → N1', 'Objavi recenziju', 'N1']])
    proveri(naziv('ana', 'N1 Markov profil: nova recenzija Ane na vrhu'), /ana_zvz84/.test(await S.page.evaluate(() => document.querySelector('[data-recenzija]')?.textContent ?? '')))
    // ---- Ana, račva „za poene“
    await radnje('ana', 6, [['O1 Uzmi za poene → W2', 'Uzmi za poene', 'W2'], ['W2 Pokloni PlayStation 2', 'Pokloni PlayStation 2', 'W2']], 'poeni')
    proveri(naziv('ana', 'W2: posle izbora poklona stoji obaveštenje'), /PlayStation 2 je spreman za poklon/.test(await S.tekst()))
    await radnje('ana', 7, [['O2 Sačuvaj izmene → W5 (Jovanin zahtev stiže sam)', 'Sačuvaj izmene', 'W5'], ['W5 Potvrdi poklon', 'Potvrdi poklon', 'W5']], 'poeni')
    proveri(naziv('ana', 'W5: poklon potvrđen, SWAPIT dodelio 50 poena posle potvrde prijema'), /Poklon je potvrđen/.test(await S.tekst()) && /SWAPIT ti je dodelio 50 poena za poklon — primalac je potvrdio prijem/.test(await S.tekst()))
    await S.idi('#' + m.rute.link('W1', 'ana'))
    proveri(naziv('ana', 'W1 posle potvrde poklona: 70 poena'), /70 poena/.test(await S.tekst()), await S.tekst())
    await radnje('ana', 8, [['W1 Uzmi bicikl za poene → X9', 'Uzmi bicikl za poene', 'X9'], ['X9 Primio/la sam', 'Primio/la sam', 'X9'], ['X9 Razmena obavljena → X10', 'Razmena obavljena', 'X10', { sel: 'main a' }], ['X10 Oceni razmenu → X11', 'Oceni razmenu', 'X11'], ['X11 Objavi recenziju → N1', 'Objavi recenziju', 'N1']], 'poeni')
    // ---- Marko, glavni tok
    await radnje('marko', 3, [['W4 Pogledaj oglas → O1 (Jovanin)', 'Pogledaj oglas', 'O1']])
    await radnje('marko', 5, [['X4 Detalji → X5', 'Detalji', 'X5'], ['X5 Odbij → X6', 'Odbij', 'X6'], ['X6 Odbij ponudu', 'Odbij ponudu', 'X6']])
    proveri(naziv('marko', 'X6: „Ponuda odbijena“'), /Ponuda odbijena/.test(await S.tekst()))
    await radnje('marko', 6, [['X13 Prihvati lanac (Anino prihvatanje se odigra samo)', 'Prihvati lanac', 'X13']])
    await radnje('marko', 7, [['X8 Poruke → C2', 'Poruke', 'C2'], ['C2 Dogovoreno (Anina dostava se odigra sama)', 'Dogovoreno', 'C2']])
    await radnje('marko', 8, [['X9 Primio/la sam', 'Primio/la sam', 'X9'], ['X9 Razmena obavljena → X10', 'Razmena obavljena', 'X10', { sel: 'main a' }], ['X10 Oceni razmenu → X11', 'Oceni razmenu', 'X11'], ['X11 Objavi recenziju → N1', 'Objavi recenziju', 'N1']])
    // ---- Marko, račva „za poene“: Anino uzimanje i potvrda se odigraju same, on potvrđuje predaju
    await radnje('marko', 8, [['X9 Potvrđujem predaju (Anino uzimanje bicikla se odigra samo)', 'Potvrđujem predaju', 'X9'], ['X9 Razmena obavljena → X10', 'Razmena obavljena', 'X10', { sel: 'main a' }], ['X10 Oceni razmenu → X11', 'Oceni razmenu', 'X11'], ['X11 Pogledaj recenziju → N1', 'Pogledaj recenziju', 'N1']], 'poeni')
    // ---- Prodavnica, korak 9: A5 → Z3 → Z4 → A1 → A4 → A6
    await radnje('prodavnica', 9, [['A5 Objavi akciju → Z3', 'Objavi akciju', 'Z3'], ['Z3 Plati → Z4', 'Plati', 'Z4'], ['Z4 Nastavi → A1', 'Nastavi', 'A1'], ['A1 Tabla akcija → A4', 'Tabla akcija', 'A4'], ['A4 Prijave na akciji → A6', 'Prijave na akciji', 'A6'], ['A6 Primi', 'Primi', 'A6']])
    proveri(naziv('prodavnica', 'A6: „Kupon izdat“ posle „Primi“'), /Kupon izdat: 3\.000 din/.test(await S.tekst()))
    // ---- Moderacija, korak 5: V2 → V3
    await radnje('moderacija', 5, [['V2 Ukloni → V3', 'Ukloni', 'V3'], ['V3 Pošalji odluku', 'Pošalji odluku', 'V3']])
    proveri(naziv('moderacija', 'V3: „Odluka je poslata“'), /Odluka je poslata/.test(await S.tekst()))
    await S.klik('Kako korisnik vidi odluku', { sel: 'main a' })
    proveri(naziv('moderacija', 'V3 → V4: kako korisnik vidi odluku'), (await S.ekran()) === 'V4' && /Tvoj oglas je uklonjen/.test(await S.tekst()), await S.ekran())

    // -------------------------------------------------------------- H) radnje van koraka i ugla su neaktivne (primeri)
    await S.ucitaj('/prodavnica/akcije/nova', poc(8))
    proveri(naziv('prodavnica', 'A5 u koraku 8: „Objavi akciju“ je neaktivno uz razlog'), await S.page.evaluate(() => {
      const w = document.querySelector('[data-radnja="9.objavi"]')
      return !!w && (w.querySelector('button')?.disabled || w.querySelector('button')?.getAttribute('aria-disabled') === 'true') && /Dostupno u koraku 9/.test(w.textContent)
    }))
    await S.ucitaj('/moderacija/prijava/sljivovica', poc(5))
    proveri(naziv('moderacija', 'V2: „Ukloni“ je aktivno samo moderaciji'), await S.page.evaluate(() => document.querySelector('[data-radnja="5.v2"] button')?.getAttribute('aria-disabled') !== 'true'))
    await S.ucitaj('/ana/poklon/ana-ps2', poc(7, 'poeni'))
    proveri(naziv('ana', 'W5 pre izmene oglasa: „Još nije počelo“'), /Još nije počelo/.test(await S.tekst()))

    // -------------------------------------------------------------- I) do ekrana se stiže i KLIKOM kroz zaglavlje (paket → X12)
    await S.ucitaj('/marko/pocetna', poc(5))
    if (!uredjaj.telefon) {
      await S.page.evaluate(() => document.querySelector('[data-zaglavlje] a[aria-label^="Moje razmene i ponude"]').click())
      await sleep(250)
      proveri(naziv('marko', 'klik na paket u zaglavlju vodi na X12'), (await S.ekran()) === 'X12', await S.ekran())
    }
  }
} catch (e) {
  proveri('skripta prekinuta greškom', false, e.stack ?? e.message)
}
const problemi = sesije.flatMap((s) => s.problemi)
const spoljni = sesije.flatMap((s) => s.spoljni)
for (const s of sesije) await s.browser.close()
zatvori()
const ok = izvestaj('e2e-prica', lista, problemi, spoljni)
process.exit(ok ? 0 : 1)
