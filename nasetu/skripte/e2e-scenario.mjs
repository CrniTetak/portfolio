// Ručno pokretana provera u pravom pregledaču: prođe ceo scenario KLIKOM, pravi slike ekrana
// i prijavljuje greške u konzoli i pozive ka tuđim serverima.
//
// Pokretanje (u dva prozora):
//   npm run build && npm run preview -- --port 4180 --strictPort
//   BASE_URL=http://localhost:4180/ npm run e2e -- <folder-za-slike>
// Potreban je instaliran Chrome (putanja se može zadati kroz CHROME_PATH).
//
// Dorada 2: scenario dalje prolazi kroz predračun u dinarima, osporavanje sa zaključanim "Odobri", automatsko odbijanje druge
// produkcije, dokumente iz plaćene rezervacije, otkazivanje vlasnika sa zamenskom lokacijom, CSV za knjigovođu (preuzet fajl se
// čita sa diska), odobrenje lokacije u adminu, naloge, preporuku partnera i usluge na predračunu (Alati → "Predračun sa uslugama").
//
// Dorada 3: scenario ulazi kroz ulazni ekran u SLOBODNOM režimu (sve radi kao u dorade 2); "Skoči na…" zamenjuju pozicije u priči
// (naPoziciji) i Alati; uloga se menja kroz "Gledaj kao" na traci priče. Vođeni režim proverava skripta e2e-prica.mjs.
import { existsSync, mkdirSync, readFileSync, rmSync } from 'node:fs'
import { resolve } from 'node:path'
import puppeteer from 'puppeteer-core'

const IZLAZ = process.argv[2] ?? 'e2e-slike'
const BASE = process.env.BASE_URL ?? 'http://localhost:4173/'
const CHROME = process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe'
mkdirSync(IZLAZ, { recursive: true })
const PREUZIMANJA = resolve(IZLAZ, 'preuzimanja')
rmSync(PREUZIMANJA, { recursive: true, force: true })
mkdirSync(PREUZIMANJA, { recursive: true })

// Sve tajne adrese i telefoni iz podaci/adrese-privatno.ts: nijedna ne sme da se pojavi tamo gde ne sme
const PRIVATNO = readFileSync('src/podaci/adrese-privatno.ts', 'utf8')
const ADRESE = [...PRIVATNO.matchAll(/adresa: '([^']+)'/g)].map((m) => m[1])
const TELEFONI = [...PRIVATNO.matchAll(/telefon: '([^']+)'/g)].map((m) => m[1])
if (ADRESE.length < 10) throw new Error('Nisu pročitane sve adrese: ' + ADRESE.length)
if (TELEFONI.length < 10) throw new Error('Nisu pročitani svi telefoni: ' + TELEFONI.length)

const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--no-sandbox'] })
const page = await browser.newPage()
await page.setViewport({ width: 1280, height: 900 })
// preuzimanje CSV-a ide u poseban folder (da se fajl može pročitati i proveriti)
const cdp = await page.createCDPSession()
await cdp.send('Browser.setDownloadBehavior', { behavior: 'allow', downloadPath: PREUZIMANJA })

const problemi = []
const spoljni = []
const ORIGIN = BASE.replace(/\/$/, '')
page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) problemi.push(`console.${m.type()}: ${m.text()}`) })
page.on('pageerror', (e) => problemi.push('pageerror: ' + e.message))
page.on('requestfailed', (r) => problemi.push('requestfailed: ' + r.url()))
// blob: istog porekla (CSV pravljen u pregledaču) i data: NISU pozivi ka tuđim serverima
page.on('request', (r) => {
  const u = r.url()
  if (!u.startsWith(ORIGIN) && !u.startsWith('data:') && !u.startsWith('blob:' + ORIGIN)) spoljni.push(u)
})

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const slika = (ime) => page.screenshot({ path: `${IZLAZ}/${ime}.png`, fullPage: true })
const idi = async (hash) => { await page.evaluate((h) => { location.hash = h }, hash); await sleep(250) }
const klikni = async (tekst, selektor = 'button, a') => {
  const ok = await page.evaluate((t, sel) => {
    const el = [...document.querySelectorAll(sel)].find((e) => e.textContent.trim().includes(t) && e.getClientRects().length > 0 && !e.disabled)
    if (!el) return false
    el.click()
    return true
  }, tekst, selektor)
  if (!ok) { await slika('GRESKA-nema-dugmeta'); throw new Error('Nema dugmeta: ' + tekst) }
  await sleep(250)
}
// klik po aria-label (npr. "Odobri nalog: …"), kad isti tekst stoji na više dugmadi
const kliknuAria = async (deo, selektor = 'button') => {
  const ok = await page.evaluate((t, sel) => {
    const el = [...document.querySelectorAll(sel)].find((e) => (e.getAttribute('aria-label') ?? '').includes(t) && e.getClientRects().length > 0 && !e.disabled)
    if (!el) return false
    el.click()
    return true
  }, deo, selektor)
  if (!ok) { await slika('GRESKA-nema-aria'); throw new Error('Nema dugmeta (aria): ' + deo) }
  await sleep(250)
}
const kliknuHref = async (hash) => {
  const ok = await page.evaluate((h) => {
    const el = document.querySelector(`a[href="${h}"]`)
    if (!el) return false
    el.click()
    return true
  }, hash)
  if (!ok) { await slika('GRESKA-nema-linka'); throw new Error('Nema linka: ' + hash) }
  await sleep(250)
}
const ima = (tekst) => page.evaluate((t) => document.body.innerText.replace(/\s+/g, ' ').toLowerCase().includes(t.toLowerCase()), tekst)
const mora = async (tekst) => { if (!(await ima(tekst))) { await slika('GRESKA-fali-tekst'); throw new Error('Fali tekst: ' + tekst) } }
const nema = async (tekst) => { if (await ima(tekst)) { await slika('GRESKA-suvisan-tekst'); throw new Error('Ne sme da stoji: ' + tekst) } }
const nemaAdresa = async (gde) => {
  const tekst = await page.evaluate(() => document.body.innerText)
  const procurila = [...ADRESE, ...TELEFONI].filter((a) => tekst.includes(a))
  if (procurila.length) { await slika('GRESKA-adresa'); throw new Error('Adresa/telefon se vidi (' + gde + '): ' + procurila.join('; ')) }
}
// „Gledaj kao" na traci priče (vodi na ekran uloge za tekući korak, kao u aplikaciji)
const uloga = async (naziv) => {
  await page.evaluate((n) => {
    const g = document.querySelector('[role=group][aria-label="Gledaj kao"]')
    ;[...g.querySelectorAll('button')].find((b) => b.textContent.trim() === n).click()
  }, naziv)
  await sleep(250)
}
// isto, ali ostaje na istoj strani (ako je ona dozvoljena novoj ulozi)
const ulogaOstani = async (naziv) => {
  const hash = await page.evaluate(() => location.hash.slice(1))
  await uloga(naziv)
  await idi(hash)
}
const stanje = () => page.evaluate(() => JSON.parse(sessionStorage.getItem('nasetu.prototip.v1')))
const dugmeOnemoguceno = (tekst) => page.evaluate((t) => {
  const el = [...document.querySelectorAll('button')].find((e) => e.textContent.trim() === t && e.getClientRects().length > 0)
  return el ? el.disabled || el.getAttribute('aria-disabled') === 'true' : null
}, tekst)
// Mesto u priči se postavlja u sačuvanom stanju pa osvežavanjem (aplikacija svet ponovo gradi iz pozicije), isto kao stari „Skoči na…"
const naPoziciji = async (korak, odradjeno, grana = 'vazi') => {
  await page.evaluate((k, o, g) => {
    const kljuc = 'nasetu.prototip.v1'
    const s = JSON.parse(sessionStorage.getItem(kljuc))
    s.prica = { ...s.prica, korak: k, odradjeno: o, grana: g, odstupljeno: false }
    s.uloga = 'produkcija'
    sessionStorage.setItem(kljuc, JSON.stringify(s))
  }, korak, odradjeno, grana)
  await page.goto(BASE + '?r=' + Date.now() + '#/pocetna', { waitUntil: 'networkidle0' })
  await sleep(300)
}
// Predračun sa uslugama: Alati na traci priče (slobodni režim), uz potvrdu ako ima izmena van priče
const predracunSaUslugama = async () => {
  await klikni('Alati', 'button')
  await klikni('Predračun sa uslugama', 'button')
  await sleep(300)
  if (await page.$('dialog[open]')) { await klikni('Učitaj', 'dialog button'); await sleep(300) }
}
// Kreni ispočetka (uz potvrdu); uloga ostaje, pa se vraća Produkcija radi sledećih provera
const kreniIspocetka = async () => {
  await klikni('Kreni ispočetka', 'button')
  await klikni('Da, kreni ispočetka', 'dialog button')
  await sleep(300)
  await uloga('Produkcija')
}
// Ulaz u demo: izbor uloge i režima, pa „Uđi u demo"
const udjiUDemo = async (rezim, naziv = 'produkcija') => {
  await page.click(`[data-uloga="${naziv}"]`)
  await klikni(rezim === 'vodjeno' ? 'Vođena priča' : 'Slobodno istraživanje', 'button')
  await page.click('[data-udji-u-demo]')
  await sleep(400)
}

await page.goto(BASE, { waitUntil: 'networkidle0' })
await page.evaluate(() => sessionStorage.clear())
await page.reload({ waitUntil: 'networkidle0' })
await slika('00-ulaz')
await mora('Vođena priča (preporučeno)')
await udjiUDemo('slobodno')
if (!(await page.evaluate(() => location.hash)).endsWith('/pocetna')) throw new Error('Posle ulaza očekivana je Početna')
await mora('Sada slobodno istražujete')
await klikni('Razumem', 'button')
await slika('01-pocetna')
await mora('PROTOTIP')
await mora('Plaćate nas samo za uslugu')
await mora('Pravne strane (nacrt)')

// korak 2: brief
await klikni('Pošalji zahtev (brief)', 'a')
await mora('Pošaljite zahtev (brief)')
await mora('Rezervacije prave samo firme i preduzetnici (PIB i matični broj)')
await mora('Treba mi pomoć oko dozvola (cena po dogovoru)')
await nema('(U prototipu se ne računa.)')
await slika('02-brief')
if (!(await page.$eval('#datum', (e) => e.readOnly))) throw new Error('Datum u briefu mora biti zaključan')
await klikni('Pošalji zahtev', 'button')
await mora('Zahtev je poslat.')
await page.reload({ waitUntil: 'networkidle0' }) // osvežavanje ne nudi isti zahtev ponovo
await mora('Zahtev je poslat.')
await nema('Pošalji zahtev (brief)')

// korak 3: admin šalje izbor (u adminu su i nalozi na čekanju)
await uloga('Admin')
await idi('/admin') // /brief je javni ekran, pa uloga ostaje na njemu
await mora('Admin pregled')
await mora('Nalozi na čekanju')
await mora('Opšti uslovi v0.1 i Ugovor o posredovanju v0.1 (izmišljeno)')
await mora('PIB 000000000 · MB 00000000 (izmišljeno)')
await slika('03-admin')
await page.evaluate(() => {
  const red = [...document.querySelectorAll('tr')].find((r) => r.textContent.includes('Produkcija Delta') && r.textContent.includes('Pošalji izbor'))
  ;[...red.querySelectorAll('button')].find((b) => b.textContent.includes('Pošalji izbor')).click()
})
await sleep(250)
await mora('Izbor poslat')

// korak 4: izbor i lokacije (adresa se ne vidi)
await uloga('Produkcija')
await idi('/produkcija')
await mora('Izbor je spreman')
await mora('PIB 000000000')
await klikni('Otvori izbor', 'a')
await mora('pripremio Nasetu')
const izborId = await page.evaluate(() => location.hash.split('/')[2])
await slika('04-izbor')
await nemaAdresa('ekran bez prava')
await idi('/lokacije')
await mora('10 lokacija')
await slika('05-katalog')
await idi('/lokacije/industrijski-loft')
await mora('Tehnički list')
await mora('Broj priključaka')
await mora('Parking za kamione')
await mora('Strana sveta')
await mora('Prostor za šminku')
await mora('Pravila zgrade')
await mora('Dan pripreme / raspremanja')
await mora('Prototip: 6 fotografija; za objavu prave lokacije potrebno je najmanje 10')
await mora('Fakturiše se u dinarima')
await mora('Depozit plaća produkcija direktno vlasniku, po ugovoru o lokaciji; vraća se posle zapisnika na izlazu.')
await mora('Naknadu Nasetuu plaćate predračunom u dinarima')
await slika('06-lokacija')
await klikni('Traži opciju', 'button')
await mora('Prva opcija')
await idi('/lokacije/brutalisticka-hala')
await klikni('Traži opciju', 'button')
await mora('Druga opcija')

// korak 5: deljenje i primalac
await idi(`/izbor/${izborId}/deljenje`)
await mora('Pogledaj kao primalac')
await slika('07-deljenje')
await klikni('Pogledaj kao primalac', 'a')
await mora('Vaše ime')
await klikni('Sviđa mi se', 'button')
await mora('Glas je zabeležen')
// komentar bez glasa
await page.type('textarea', 'Lepo svetlo')
await klikni('Pošalji komentar', 'button')
await slika('08-primalac')
await idi(`/izbor/${izborId}/deljenje`)
await mora('Sviđa mi se: 1')

// korak 6: opcije i osporavanje
await idi('/produkcija/opcije')
await mora('Prva opcija')
await slika('09-opcije')
await klikni('Simuliraj: Produkcija Sigma traži isti termin', 'button')
await mora('Druga produkcija traži isti termin')
await slika('10-osporena')

// A2: vlasnik otvara Sigmin zahtev za loft: "Odobri" je zaključano dok Deltina prva opcija još važi
const sigmaZahtevId = (await stanje()).zahtevi.find((z) => z.produkcijaId === 'sigma' && z.lokacijaId === 'industrijski-loft').id
await uloga('Vlasnik')
await idi(`/vlasnik/zahtev/${sigmaZahtevId}`)
await mora('Zahtev za rezervaciju — Industrijski loft')
await mora('Čeka se odluka prve opcije (Produkcija Delta), još 24 h')
if ((await dugmeOnemoguceno('Odobri')) !== true) throw new Error('"Odobri" za Sigmin zahtev mora biti onemogućeno dok prva opcija važi')
await slika('10b-odobri-zakljucan')

// Delta (prva) potvrđuje i traži rezervaciju
await uloga('Produkcija')
await idi('/produkcija/opcije')
// potvrda opcije vodi na obrazac zahteva (unapred popunjen iz opcije), pa tek onda na slanje vlasniku
await klikni('Potvrdi i zatraži rezervaciju', 'a')
await mora('Zahtev za rezervaciju — Industrijski loft')
await mora('Domaćin na snimanju')
await mora('Otkazivanje (predlog za advokata)')
await mora('Rezervacije prave samo firme i preduzetnici (PIB i matični broj)')
await mora('Više od 14 dana pre snimanja: vlasniku se ne plaća ništa.')
await slika('10c-obrazac-zahteva')
await klikni('Pošalji zahtev vlasniku', 'button')
await mora('Čeka vlasnika')
await mora('105.300,00 RSD') // cena lokacije u dinarima (900 € × 117)
await mora('Rezervacija — Industrijski loft')
const zId = await page.evaluate(() => location.hash.split('/')[3])
await mora('Vlasnik je firma: vlasnik izdaje fakturu na punu cenu')
await slika('11-rezervacija-ceka')

// korak 7: vlasnik odobrava
await uloga('Vlasnik')
await mora('Zahtevi koji čekaju odgovor')
await slika('12-vlasnik')
// sada je Delta prva i njen zahtev može; Sigmin je i dalje zaključan (prednost ima Deltin zahtev)
await kliknuHref(`#/vlasnik/zahtev/${sigmaZahtevId}`)
await mora('Prednost ima zahtev Produkcija Delta (prva opcija)')
await idi(`/vlasnik/zahtev/${zId}`)
await mora('Zahtev za rezervaciju — Industrijski loft')
await mora('Fakturišete u dinarima')
await klikni('Odobri', 'button')
await mora('Odobreno. Produkcija je obaveštena')
await slika('13-vlasnik-odobrio')
// Sigmin zahtev je automatski odbijen sa razlogom
await idi('/vlasnik')
await mora('Automatski odbijeni zahtevi')
await kliknuHref(`#/vlasnik/zahtev/${sigmaZahtevId}`)
await mora('Odbijeno')
await mora('Termin je potvrđen produkciji sa prvom opcijom')
await slika('13b-sigma-odbijena')

// korak 8: predračun u dinarima (adresa još skrivena)
await uloga('Produkcija')
await idi('/produkcija')
await mora('Predračun čeka uplatu')
await klikni('Otvori predračun', 'a')
await mora('15.795,00 RSD')
await mora('≈ 135,00 € (orijentaciono)')
await mora('Naknada Nasetua 15%')
await mora('PIB 000000000 · MB 00000000 (izmišljeno)')
await nema('15.795 RSD (')
await slika('14-predracun')
await nemaAdresa('ekran bez prava')
// dokumenti iz rezervacije PRE uplate: opšti primer, bez adrese
await idi(`/primeri?dokument=brief&rezervacija=${zId}`)
await mora('Popunjen dokument vidi se posle potvrđene uplate naknade')
await mora('vidi se posle potvrđene uplate naknade')
await nemaAdresa('Brief pre uplate')
await idi(`/primeri?dokument=ugovor&rezervacija=${zId}`)
await nemaAdresa('ugovor pre uplate')

// korak 9: admin potvrđuje uplatu u dinarima
await uloga('Admin')
await idi('/admin')
await mora('15.795,00 RSD')
await klikni('Otvori predračun', 'a')
await mora('Potvrdi uplatu 15.795,00 RSD')
await klikni('Potvrdi uplatu', 'button')
await mora('Uplata potvrđena')
await slika('15-admin-potvrda')

// korak 10: adresa otvorena samo produkciji
await uloga('Produkcija')
await idi('/produkcija')
await klikni('Otvori rezervaciju', 'a')
await mora('Ulica Primera 12')
await mora('Naknada plaćena')
await mora('Lokacija je pronađena preko Nasetua; po ugovoru o posredovanju zaštitni period je 12 meseci.')
await slika('16-adresa')
// dokumenti iz plaćene rezervacije: ugovor, Brief i zapisnik (adresu upisuje samo logika/adresa.ts)
await klikni('Ugovor o lokaciji (primer)', 'a')
await mora('Posrednik, nije strana u ugovoru')
await mora('Alfa Prostori d.o.o.')
await mora('Ulica Primera 12')
await mora('Otkazivanje (predlog za advokata)')
await mora('predlog; konačan tekst piše advokat')
await slika('16b-ugovor-iz-rezervacije')
await idi(`/primeri?dokument=brief&rezervacija=${zId}`)
await mora('Adresa i ulaz')
await mora('Ulica Primera 12')
await mora('Nenad J.')
await slika('16c-brief-iz-rezervacije')
await idi(`/primeri?dokument=zapisnik&rezervacija=${zId}`)
await mora('Obrazac zapisnika na ulazu i izlazu')
await uloga('Partner')
await idi(`/primeri?dokument=brief&rezervacija=${zId}`)
await mora('Dokumenti rezervacije nisu dostupni partneru (ni pre ni posle uplate)')
await nemaAdresa('Brief kao partner')
await idi(`/primeri?dokument=ugovor&rezervacija=${zId}`)
await nemaAdresa('ugovor kao partner')
await idi('/lokacije/industrijski-loft')
await nemaAdresa('ekran bez prava')
await slika('17-partner-lokacija')
await idi('/partner')
await mora('Tačne adrese ne vidite ni vi: vidi ih samo produkcija posle potvrđene uplate naknade.')
await mora('10.530,00 RSD') // primer obračuna: naknada 90 €
await mora('2.106,00 RSD') // deo partnera 20% = 18 €
await slika('18-partner')

// primeri pravnih dokumenata, mejlova i pravne strane (bez adresa)
await uloga('Produkcija')
await idi('/primeri')
await mora('Opšti uslovi korišćenja')
await mora('Ugovor o posredovanju sa vlasnikom')
await mora('Politika privatnosti i kolačića')
await kliknuAria('Otvori primer: Ugovor o posredovanju sa vlasnikom')
await mora('12 meseci')
await mora('predlog; konačan tekst piše advokat')
await nemaAdresa('ugovor o posredovanju')
await idi('/primeri')
await klikni('Podsetnik za izviđanje', 'button')
await mora('[adresa — šalje se samo imenovanoj osobi]')
await mora('Primer; ništa se ne šalje')
await nemaAdresa('mejl podsetnik za izviđanje')
await slika('19b-mejl-podsetnik')
await klikni('Pravne strane (nacrt)', 'a')
await mora('Pravne strane (nacrt)')
await mora('v0.1 (izmišljeno)')
await nemaAdresa('pravne strane')
await slika('19c-pravne-strane')

// osvežavanje ne gubi stanje
await page.reload({ waitUntil: 'networkidle0' })
await uloga('Produkcija')
await idi('/produkcija')
await mora('Naknada je plaćena')

// B5: vlasnik otkazuje plaćenu rezervaciju (jednom, sa potvrdom), produkcija vidi povraćaj i zamensku lokaciju
await uloga('Vlasnik')
await idi(`/vlasnik/zahtev/${zId}`)
await mora('Dokumenti ove rezervacije')
await klikni('Otkaži rezervaciju', 'button')
await mora('Otkazati plaćenu rezervaciju?')
await slika('20-vlasnik-otkazivanje-potvrda')
await klikni('Otkaži rezervaciju', 'dialog button')
await mora('Rezervacija je otkazana')
await slika('20b-vlasnik-otkazao')
await uloga('Produkcija')
await idi(`/produkcija/rezervacija/${zId}`)
await mora('Vlasnik je otkazao rezervaciju')
await mora('Naknada se vraća (izmišljeno)')
await mora('15.795,00 RSD')
await mora('Predlog zamenske lokacije')
await mora('Rezervacija je otkazana; adresa više nije dostupna.')
await nemaAdresa('otkazana rezervacija (produkcija)')
await slika('21-produkcija-otkazano')
await uloga('Admin')
await idi('/admin')
await mora('Povraćaj: 15.795,00 RSD')
await nemaAdresa('admin pregled posle otkazivanja')
await slika('22-admin-povracaj')

// B6: izvoz za knjigovođu — CSV se pravi u pregledaču; preuzeti fajl se čita sa diska i proverava
const CSV = resolve(PREUZIMANJA, 'nasetu-predracuni-primer.csv')
const preuzmiCsv = async () => {
  rmSync(CSV, { force: true })
  await klikni('Izvoz faktura za knjigovođu', 'button')
  for (let i = 0; i < 40 && !existsSync(CSV); i++) await sleep(150)
  if (!existsSync(CSV)) throw new Error('CSV nije preuzet')
  await sleep(300)
  const tekst = readFileSync(CSV, 'utf8')
  if (!tekst.startsWith('\uFEFF')) throw new Error('CSV nema BOM')
  if (!tekst.includes("'000000000")) throw new Error('PIB u CSV-u mora ostati tekst sa vodećim nulama')
  for (const a of [...ADRESE, ...TELEFONI]) if (tekst.includes(a)) throw new Error('CSV sadrži adresu/telefon: ' + a)
  return tekst
}
const csv = await preuzmiCsv()
if (!csv.startsWith('\uFEFFBroj;Vrsta;Kupac;PIB;MB;Iznos (RSD);Kurs;Poziv na broj;Status')) throw new Error('Loše zaglavlje CSV-a: ' + csv.slice(0, 80))
if (!csv.includes('15795,00') || !csv.includes('-15795,00') || !csv.includes('vraćeno (izmišljeno)')) throw new Error('CSV nema red naknade i povraćaja')

// B2: nalozi na čekanju (admin odobrava jedan, odbija drugi)
await kliknuAria('Odobri nalog: Produkcija Epsilon')
await kliknuAria('Odbij nalog: Foto atelje Zeta')
await mora('Odobren')
await slika('23-admin-nalozi')

// B7/B8/B1c: vlasnik dodaje lokaciju (sa fotografisanjem), pa je admin objavljuje
await uloga('Vlasnik')
await idi('/vlasnik/nova-lokacija')
await mora('Dodaj lokaciju')
await nema('cene po veličini ekipe se dodaju u pravoj aplikaciji')
await mora('Cena snimajućeg dana po veličini ekipe')
await mora('Dan pripreme i raspremanja')
await page.type('#naziv', 'Probni podrum')
await page.type('#kv', '80')
await page.type('#op', 'Vračar')
await page.type('#c30', '250')
await klikni('Dodaj dokument', 'button')
await klikni('Fotografije', 'summary')
for (let i = 0; i < 12; i++) await klikni('Dodaj probnu sliku', 'button')
await mora('Dodato: 10 / 10')
await klikni('Usluge Nasetua', 'summary')
await klikni('Profesionalno fotografisanje', 'label')
await slika('24-nova-lokacija')
await klikni('Pošalji na odobrenje', 'button')
await mora('Lokacija je poslata na odobrenje')
await mora('izmišljen predračun od 8.775,00 RSD')
await slika('25-lokacija-poslata')
await idi('/vlasnik')
await mora('Čeka odobrenje admina')
await mora('Predračun za fotografisanje')
// B4: partner preporučuje lokaciju (obavezna potvrda "Vlasnik je saglasan")
await uloga('Partner')
await idi('/partner')
await mora('Preporuči lokaciju')
await page.type('#p-naziv', 'Stara štamparija')
await page.type('#p-opstina', 'Palilula')
if ((await dugmeOnemoguceno('Pošalji preporuku adminu')) !== true) throw new Error('Preporuka mora biti zaključana bez potvrde "Vlasnik je saglasan"')
await klikni('Vlasnik je saglasan', 'label')
await klikni('Pošalji preporuku adminu', 'button')
await mora('stigla je adminu')
await slika('26-partner-preporuka')
// admin: lokacije na čekanju (kontrolna lista), objava, katalog 11 lokacija
await uloga('Admin')
await idi('/admin')
await mora('Lokacije na čekanju')
await mora('Probni podrum')
await mora('Stara štamparija')
await mora('Preporuka partnera')
await mora('8.775,00 RSD') // predračun za fotografisanje među uplatama
await mora('fotografisanje prostora')
// drugo preuzimanje CSV-a: sada sadrži i predračun za fotografisanje, i dalje bez adresa
const csv2 = await preuzmiCsv()
if (!csv2.includes('fotografisanje prostora') || !csv2.includes('8775,00') || !csv2.includes('-15795,00')) throw new Error('Drugi CSV nema očekivane redove')
await slika('27-admin-lokacije-na-cekanju')
await kliknuAria('Odobri objavu: Probni podrum')
await mora('Objavljena u katalogu')
await idi('/lokacije')
await mora('11 lokacija')
await mora('Nova (izmišljeno)')
await slika('28-katalog-11')
await klikni('Probni podrum', 'a')
await mora('U prototipu se nova lokacija ne rezerviše')
await ulogaOstani('Produkcija')
if ((await dugmeOnemoguceno('Zatraži rezervaciju')) !== true) throw new Error('Za novu lokaciju "Zatraži rezervaciju" mora biti onemogućeno')
if ((await dugmeOnemoguceno('Traži opciju')) !== true) throw new Error('Za novu lokaciju "Traži opciju" mora biti onemogućeno')
await ulogaOstani('Admin')
await mora('Tehnički list')
await nemaAdresa('nova lokacija')
await slika('29-nova-lokacija-strana')

// B7: kalendar vlasnika — blokiranje i odblokiranje dana
await uloga('Vlasnik')
await idi('/vlasnik')
await klikni('Kalendar: blokiraj ili odblokiraj dane', 'summary')
await page.evaluate(() => document.querySelector('button[aria-label^="18. novembar"]').click())
await sleep(250)
await mora('blokirali ste: 1')
await slika('30-vlasnik-kalendar')
await page.evaluate(() => document.querySelector('button[aria-label^="18. novembar"]').click())
await sleep(250)
await mora('blokirali ste: 0')

// Kreni ispočetka (traka priče)
await slika('31-traka')
await kreniIspocetka()
await idi('/produkcija')
await mora('Još nemate zahteva')

// ---------------------------------------------------------------- grane kroz pozicije u priči i Alati
// Predračun sa uslugama (O22): brief sa izborom van kataloga + domaćin; 135 − 50 + 70 = 155,00 € = 18.135,00 RSD
await predracunSaUslugama()
await mora('Izmenili ste stanje van priče')
await mora('Vaš predračun')
await mora('18.135,00 RSD')
await mora('≈ 155,00 € (orijentaciono)')
await mora('Uračunat izbor van kataloga')
await mora('−50,00 €')
await mora('Domaćin lokacije na snimanju: 1 dan × 70,00 €')
await mora('Nije deo osnovice za naknadu od 15%')
await nemaAdresa('predračun sa uslugama')
await slika('32-predracun-usluge')
await uloga('Admin')
await idi('/admin')
await mora('izbor van kataloga')
await mora('5.850,00 RSD')
await mora('Pomoć oko dozvola — cena po dogovoru')
await slika('33-admin-usluge')

// (a) vlasnik otkazuje pa nova (zamenska) rezervacija iz istog briefa dobija PRENESEN kredit od 50 €
await page.evaluate(() => {
  const red = [...document.querySelectorAll('tr')].find((r) => r.textContent.includes('Industrijski loft') && r.textContent.includes('Otvori predračun'))
  ;[...red.querySelectorAll('a')].find((a) => a.textContent.includes('Otvori predračun')).click()
})
await sleep(250)
await klikni('Potvrdi uplatu', 'button')
await mora('Uplata potvrđena')
const zIdUsluge = (await stanje()).zahtevi.find((z) => z.produkcijaId === 'delta').id
await uloga('Vlasnik')
await idi(`/vlasnik/zahtev/${zIdUsluge}`)
await klikni('Otkaži rezervaciju', 'button')
await klikni('Otkaži rezervaciju', 'dialog button')
await mora('Rezervacija je otkazana')
await uloga('Produkcija')
await idi(`/produkcija/rezervacija/${zIdUsluge}`)
await mora('Umanjenje od 50,00 € važi i za zamensku rezervaciju.')
await mora('Predlog zamenske lokacije')
await idi('/produkcija/zahtev/industrijski-loft')
await klikni('Pošalji zahtev vlasniku', 'button')
await mora('Čeka vlasnika')
const zIdNovi = await page.evaluate(() => location.hash.split('/')[3])
if (zIdNovi === zIdUsluge) throw new Error('Zamenska rezervacija mora biti nov zahtev')
await uloga('Vlasnik')
await idi(`/vlasnik/zahtev/${zIdNovi}`)
await klikni('Odobri', 'button')
await mora('Odobreno. Produkcija je obaveštena')
await uloga('Produkcija')
await idi('/produkcija')
await klikni('Otvori predračun', 'a')
await mora('Uračunat izbor van kataloga')
await mora('9.945,00 RSD') // 135 − 50 = 85 € × 117
await slika('33b-zamenska-sa-kreditom')

// (c) Kreni ispočetka posle usluga: ništa ne ostaje (predračuni, beleške, blokirani dani, prijave)
await kreniIspocetka()
const posleReseta = await stanje()
if (posleReseta.predracuni.length || posleReseta.zahtevi.some((z) => z.produkcijaId === 'delta') || posleReseta.prijaveLokacija.length || posleReseta.beleske.length || Object.keys(posleReseta.blokiraniDani).length) {
  throw new Error('Posle Reseta je ostalo nešto od usluga')
}
await idi('/produkcija')
await mora('Još nemate zahteva')

// Osporavanje: "Odobri" zaključan, pa se posle +24 h otključava (druga postaje prva)
await naPoziciji(5, 3)
await uloga('Vlasnik')
await idi(`/vlasnik/zahtev/${(await stanje()).zahtevi.find((z) => z.produkcijaId === 'sigma' && z.lokacijaId === 'industrijski-loft').id}`)
await mora('Čeka se odluka prve opcije (Produkcija Delta), još 24 h')
if ((await dugmeOnemoguceno('Odobri')) !== true) throw new Error('"Odobri" mora biti zaključano posle osporavanja')
// (b) granica: na 23 h još zaključano, na 24 h otključano (vreme se postavlja u sačuvanom stanju, pa osvežavanje)
const postaviSate = async (h) => {
  await page.evaluate((v) => { const k = 'nasetu.prototip.v1'; const s = JSON.parse(sessionStorage.getItem(k)); s.sati = v; s.prica.odstupljeno = true; sessionStorage.setItem(k, JSON.stringify(s)) }, h)
  await page.reload({ waitUntil: 'networkidle0' })
  await sleep(300)
}
await postaviSate(23)
await mora('još 1 h')
if ((await dugmeOnemoguceno('Odobri')) !== true) throw new Error('"Odobri" mora biti zaključano na 23 h')
await postaviSate(24)
if ((await dugmeOnemoguceno('Odobri')) !== false) throw new Error('"Odobri" mora da se otključa na 24 h bez potvrde prve opcije')
await slika('34-posle-24h-otkljucano')

// (d) kalendar vlasnika odbija blokiranje dana na kome postoji opcija
await naPoziciji(5, 2)
await uloga('Vlasnik')
await idi('/vlasnik')
await klikni('Kalendar: blokiraj ili odblokiraj dane', 'summary')
await page.evaluate(() => document.querySelector('button[aria-label^="17. novembar"]').click())
await sleep(250)
await mora('Na ovaj dan postoji opcija.')
await mora('blokirali ste: 0')
await slika('34b-kalendar-odbija-opciju')

// Račva na koraku 9: Vlasnik otkaže (grana „otkaz"), pa vlasnik stvarno otkazuje plaćenu rezervaciju
await naPoziciji(9, 0, 'otkaz')
await uloga('Vlasnik')
await mora('Otkaži rezervaciju')
await klikni('Otkaži rezervaciju', 'button')
await klikni('Otkaži rezervaciju', 'dialog button')
await uloga('Produkcija')
await mora('Vlasnik je otkazao rezervaciju')
await nemaAdresa('grana otkaz')
await slika('35-grana-otkaz')

// telefon (390 px): nema horizontalnog skrola na ključnim ekranima
await page.setViewport({ width: 390, height: 800, isMobile: true, hasTouch: true })
for (const h of ['/', '/pocetna', '/lokacije', '/lokacije/industrijski-loft', '/brief?novi=1', '/produkcija', '/admin', '/pravno', '/primeri', '/vlasnik', '/vlasnik/nova-lokacija', '/partner']) {
  await idi(h)
  const sirina = await page.evaluate(() => document.documentElement.scrollWidth)
  if (sirina > 390) { await slika('GRESKA-skrol'); throw new Error('Horizontalni skrol na ' + h + ': ' + sirina) }
}
console.log('PROBLEMI:', JSON.stringify(problemi, null, 1))
console.log('POZIVI KA TUĐIM SERVERIMA:', JSON.stringify(spoljni))
await browser.close()
if (problemi.length || spoljni.length) { console.log('SCENARIO NIJE OK: konzola ili tuđi serveri'); process.exit(1) }
console.log('SCENARIO OK')
