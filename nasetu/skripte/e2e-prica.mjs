// Provera VOĐENE PRIČE u pravom pregledaču (dorada 3): 3 uloge × 9 koraka × obe grane na koraku 9.
//
// Šta proverava:
//  - ulaz kroz ulazni ekran (kartica uloge + „Uđi u demo"); Admin NIJE ponuđen u „Gledaj kao";
//  - „Dalje" kroz svih 9 koraka, na svakom koraku (početno i završno stanje) „Prikaži mi" vodi na očekivani ekran;
//  - u vođenom režimu klik na SVAKO aktivno dugme na ekranu ne menja stanje sveta (osim sledeće radnje priče)
//    i ne javlja „nije sledeći korak" (traži „zaboravljena" dugmad); radnje van priče su ugašene (aria-disabled);
//  - ručni prolaz radnjama uz smenu uloge (P → Simuliraj → V Odobri → P → Simuliraj uplatu → V Otkaži u grani „otkaz");
//  - osvežavanje usred koraka; „Kreni ispočetka" sa potvrdom; „Nazad u priču";
//  - nijedna od 10 adresa pre uplate (ni posle otkazivanja), bez grešaka u konzoli i bez poziva ka tuđim serverima;
//  - kratko i slobodni režim: Admin ponuđen, +72 h → odstupanje → „Vrati na korak", radnja priče pomera poziciju.
//
// Pokretanje:
//   npm run build && npm run preview -- --port 4180 --strictPort     (jedan prozor)
//   BASE_URL=http://localhost:4180/ node skripte/e2e-prica.mjs [folder-za-slike]   (drugi prozor)
import { mkdirSync, readFileSync } from 'node:fs'
import puppeteer from 'puppeteer-core'

const BASE = process.env.BASE_URL ?? 'http://localhost:4180/'
const CHROME = process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const IZLAZ = process.argv[2] ?? 'e2e-slike'
mkdirSync(`${IZLAZ}/prica`, { recursive: true })
const KLJUC = 'nasetu.prototip.v1'

const PRIVATNO = readFileSync('src/podaci/adrese-privatno.ts', 'utf8')
const ADRESE = [...PRIVATNO.matchAll(/adresa: '([^']+)'/g)].map((m) => m[1])
const TELEFONI = [...PRIVATNO.matchAll(/telefon: '([^']+)'/g)].map((m) => m[1])
if (ADRESE.length < 10 || TELEFONI.length < 10) throw new Error('Nisu pročitane sve adrese i telefoni')

const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--no-sandbox'] })
const page = await browser.newPage()
await page.setViewport({ width: 1280, height: 900 })
const problemi = []
const spoljni = []
const ORIGIN = BASE.replace(/\/$/, '')
page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) problemi.push(`console.${m.type()}: ${m.text()}`) })
page.on('pageerror', (e) => problemi.push('pageerror: ' + e.message))
page.on('requestfailed', (r) => problemi.push('requestfailed: ' + r.url()))
page.on('request', (r) => {
  const u = r.url()
  if (!u.startsWith(ORIGIN) && !u.startsWith('data:') && !u.startsWith('blob:' + ORIGIN)) spoljni.push(u)
})

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const slika = (ime) => page.screenshot({ path: `${IZLAZ}/prica/${ime}.png` })
const idi = async (hash) => { await page.evaluate((h) => { location.hash = h }, hash); await sleep(250) }
const stanje = () => page.evaluate((k) => JSON.parse(sessionStorage.getItem(k)), KLJUC)
const hash = () => page.evaluate(() => location.hash.slice(1))
const greska = async (poruka) => { await slika('GRESKA'); throw new Error(poruka) }
const tvrdi = async (uslov, poruka) => { if (!uslov) await greska(poruka) }

/** Klik po tekstu u celoj stranici (traka, sadržaj, dijalog). */
const klikni = async (tekst, sel = 'button, a', tacno = false) => {
  const ok = await page.evaluate((t, s, tac) => {
    const el = [...document.querySelectorAll(s)].find((e) => {
      const tt = e.textContent.trim()
      return (tac ? tt === t : tt.includes(t)) && e.getClientRects().length > 0 && !e.disabled && e.getAttribute('aria-disabled') !== 'true'
    })
    if (!el) return false
    el.click()
    return true
  }, tekst, sel, tacno)
  if (!ok) await greska('Nema (aktivnog) dugmeta: ' + tekst)
  await sleep(300)
}
const ima = (tekst) => page.evaluate((t) => document.body.innerText.replace(/\s+/g, ' ').toLowerCase().includes(t.toLowerCase()), tekst)
const mora = async (tekst) => tvrdi(await ima(tekst), 'Fali tekst: ' + tekst)
const nema = async (tekst) => tvrdi(!(await ima(tekst)), 'Ne sme da stoji: ' + tekst)
const nemaAdresa = async (gde) => {
  const tekst = await page.evaluate(() => document.body.innerText)
  const procurila = [...ADRESE, ...TELEFONI].filter((a) => tekst.includes(a))
  await tvrdi(procurila.length === 0, `Adresa/telefon se vidi (${gde}): ${procurila.join('; ')}`)
}
const dugmeUgaseno = (tekst) => page.evaluate((t) => {
  const el = [...document.querySelectorAll('main button')].find((e) => e.textContent.trim().startsWith(t) && e.getClientRects().length > 0)
  return el ? el.disabled || el.getAttribute('aria-disabled') === 'true' : null
}, tekst)

// ---------------------------------------------------------------- pomoćno za traku
const tipka = (naziv) => `[role=group][aria-label="Gledaj kao"] button`
const gledajKao = async (naziv) => {
  await page.evaluate((n) => [...document.querySelectorAll('[role=group][aria-label="Gledaj kao"] button')].find((b) => b.textContent.trim() === n).click(), naziv)
  await sleep(300)
}
const ulogeUTraci = () => page.evaluate(() => [...document.querySelectorAll('[role=group][aria-label="Gledaj kao"] button')].map((b) => b.textContent.trim()))
const dalje = async () => klikni('Dalje', '[data-traka] button', false)
const prikaziMi = async () => klikni('Prikaži mi', '[data-traka] button')
const poz = async () => { const s = (await stanje()).prica; return `${s.korak}/${s.odradjeno}/${s.grana}` }
const naslovTrake = () => page.evaluate(() => document.querySelector('[data-naslov-koraka]')?.textContent.trim() ?? '')

const NAZIV_ULOGE = { produkcija: 'Produkcija', vlasnik: 'Vlasnik', partner: 'Partner' }
const udji = async (uloga, rezim = 'vodjeno') => {
  await page.goto(BASE, { waitUntil: 'networkidle0' })
  await page.evaluate(() => sessionStorage.clear())
  await page.reload({ waitUntil: 'networkidle0' })
  await page.click(`[data-uloga="${uloga}"]`)
  await klikni(rezim === 'vodjeno' ? 'Vođena priča' : 'Slobodno istraživanje', 'button')
  await page.click('[data-udji-u-demo]')
  await sleep(500)
}

// ---------------------------------------------------------------- očekivani ekrani (isto što i src/prica/matrica.ts, računato iz stanja)
function ocekivano(s, uloga) {
  const { korak, odradjeno: odr, grana } = s.prica
  const delta = (l) => [...s.zahtevi].reverse().find((z) => z.produkcijaId === 'delta' && z.lokacijaId === l)
  const z = delta('industrijski-loft')
  const izb = [...s.izbori].reverse().find((i) => i.akterId === 'delta' && i.poslatProdukciji !== null)
  const pr = z ? s.predracuni.find((p) => p.zahtevId === z.id) : null
  const sigma = s.zahtevi.find((x) => x.produkcijaId === 'sigma' && x.lokacijaId === 'industrijski-loft')
  const rez = z ? `/produkcija/rezervacija/${z.id}` : '/produkcija'
  const dok = (v) => `/primeri?dokument=${v}${z ? `&rezervacija=${z.id}` : ''}`
  if (uloga === 'produkcija') {
    switch (korak) {
      case 1: return '/pocetna'
      case 2: return '/brief'
      case 3: return odr === 0 ? '/produkcija' : `/izbor/${izb.id}`
      case 4: return odr === 0 ? `/izbor/${izb.id}/primalac` : `/izbor/${izb.id}/deljenje`
      case 5: return ['/lokacije/industrijski-loft', '/lokacije/brutalisticka-hala', '/produkcija/opcije', '/produkcija/opcije'][odr]
      case 6: return odr === 0 ? '/produkcija/zahtev/industrijski-loft' : rez
      case 7: return rez
      case 8: return odr === 0 ? `/produkcija/predracun/${pr.id}` : rez
      default: return grana === 'otkaz' ? rez : dok('ugovor')
    }
  }
  if (uloga === 'vlasnik') {
    if (korak === 5 && odr >= 3) return `/vlasnik/zahtev/${sigma.id}`
    if (korak === 7 || korak === 8) return `/vlasnik/zahtev/${z.id}`
    if (korak === 9) return grana === 'otkaz' ? `/vlasnik/zahtev/${z.id}` : dok('ugovor')
    return '/vlasnik'
  }
  return korak === 9 && grana === 'vazi' ? dok('brief') : '/partner'
}

/** Da li uloga na ovoj poziciji SME da vidi adresu (plaćena rezervacija, i to samo svoju). */
function smeAdresu(uloga, korak, odr, grana) {
  const placeno = (korak === 8 && odr === 1) || (korak === 9 && (grana === 'vazi' || odr === 0))
  if (uloga === 'produkcija') return placeno
  if (uloga === 'vlasnik') return korak === 9 && grana === 'vazi'
  return false
}

// ---------------------------------------------------------------- skeniranje: klik na svako aktivno dugme u sadržaju
const stanjeSveta = async () => {
  const s = await stanje()
  const { uloga, prikazVlasnika, demoSakriven, ...svet } = s // izbor uloge i prikaza nije promena sveta
  return JSON.stringify(svet)
}
async function skenirajAktivna(opis, ulogaTrake) {
  const hash0 = await hash()
  const pocetnoStanje = await stanjeSveta()
  const n = await page.evaluate(() => document.querySelectorAll('main button').length)
  let kliknuto = 0
  for (let i = 0; i < n; i++) {
    const info = await page.evaluate((idx) => {
      const b = [...document.querySelectorAll('main button')][idx]
      if (!b) return null
      const vidljivo = b.getClientRects().length > 0
      const aktivno = vidljivo && !b.disabled && b.getAttribute('aria-disabled') !== 'true'
      return { t: b.textContent.trim().slice(0, 40), radnja: b.getAttribute('data-radnja'), aktivno }
    }, i)
    if (!info || !info.aktivno) continue
    if (info.radnja) continue // dugme radnje priče: proverava se u ručnom prolazu
    await page.evaluate((idx) => [...document.querySelectorAll('main button')][idx]?.click(), i)
    await sleep(150)
    kliknuto++
    const toast = await page.evaluate(() => document.querySelector('[data-toast]')?.textContent ?? '')
    await tvrdi(!toast.includes('nije sledeći korak'), `${opis}: dugme „${info.t}“ je aktivno, a nije sledeći korak (priča ga odbija)`)
    // zatvori eventualni prozor, vrati se na ekran i ulogu
    await page.keyboard.press('Escape')
    if ((await hash()) !== hash0) await idi(hash0)
    const sad = await stanje()
    if (sad.uloga !== ulogaTrake) await gledajKao(NAZIV_ULOGE[ulogaTrake]), await idi(hash0)
    await tvrdi((await stanjeSveta()) === pocetnoStanje, `${opis}: klik na „${info.t}“ je promenio stanje sveta van priče`)
  }
  return kliknuto
}

/** Sve što je označeno kao van priče mora biti ugašeno (aria-disabled), a svako dugme koje menja stanje mora imati razlog. */
async function proveriVanPrice(opis) {
  const lose = await page.evaluate(() => [...document.querySelectorAll('main [data-van-price]')].filter((b) => b.getAttribute('aria-disabled') !== 'true').map((b) => b.textContent.trim()))
  await tvrdi(lose.length === 0, `${opis}: van priče, a aktivno: ${lose.join(', ')}`)
}

// ================================================================ 1) ulaz
await page.goto(BASE, { waitUntil: 'networkidle0' })
await page.evaluate(() => sessionStorage.clear())
await page.reload({ waitUntil: 'networkidle0' })
await slika('00-ulaz')
await mora('Vođena priča (preporučeno)')
await mora('Slobodno istraživanje')
await mora('PROTOTIP')
await tvrdi((await page.$$('[data-uloga]')).length === 3, 'Ulaz mora imati tačno tri kartice uloga')
await nema('Admin')
await tvrdi(await page.evaluate(() => document.querySelector('[data-uloga="produkcija"]').getAttribute('aria-pressed') === 'true'), 'Produkcija mora biti unapred izabrana')

// ================================================================ 2) Dalje kroz svih 9 koraka (obe grane), za svaku ulogu
let ukupnoKlikova = 0
for (const uloga of ['produkcija', 'vlasnik', 'partner']) {
  await udji(uloga)
  await mora('PROTOTIP')
  await tvrdi((await ulogeUTraci()).join(',') === 'Produkcija,Vlasnik,Partner', 'U vođenom režimu Admin ne sme biti ponuđen u „Gledaj kao“')
  await tvrdi((await hash()) === ocekivano(await stanje(), uloga), `${uloga}: posle ulaza očekivan prvi ekran, a ovde je ${await hash()}`)

  for (const grana of ['vazi', 'otkaz']) {
    if (grana === 'otkaz') {
      // račva na koraku 9 (već smo tamo posle prve grane): „Vlasnik otkaže"
      await klikni('Otkaže', '[data-racva] button')
      await tvrdi((await poz()) === '9/0/otkaz', 'Račva mora voditi na 9/0/otkaz, a vodi na ' + await poz())
    } else {
      await tvrdi((await poz()) === '1/0/vazi', 'Ulaz mora početi od 1/0')
    }
    let sledece = true
    while (sledece) {
      const p = (await stanje()).prica
      const opis = `${uloga} korak ${p.korak}/${p.odradjeno} (${p.grana})`
      await prikaziMi()
      const s = await stanje()
      const cekano = ocekivano(s, uloga)
      const stvarno = await hash()
      await tvrdi(stvarno === cekano, `${opis}: Prikaži mi vodi na ${stvarno}, a očekivano je ${cekano}`)
      await tvrdi((await naslovTrake()).startsWith(`Korak ${p.korak} od 9`), `${opis}: naslov trake je „${await naslovTrake()}“`)
      await tvrdi((await stanje()).uloga === uloga, `${opis}: uloga se promenila`)
      if (!smeAdresu(uloga, p.korak, p.odradjeno, p.grana)) await nemaAdresa(opis)
      await proveriVanPrice(opis)
      ukupnoKlikova += await skenirajAktivna(opis, uloga)
      if (p.korak === 5 || p.korak === 9) await slika(`${uloga}-korak-${p.korak}-${p.odradjeno}-${p.grana}`)
      // Dalje (ako postoji): iz početnog u završno, pa u početak sledećeg
      const kraj = await page.evaluate(() => [...document.querySelectorAll('[data-traka] button')].find((b) => b.getAttribute('aria-label')?.startsWith('Dalje'))?.disabled)
      if (kraj) { sledece = false; break }
      await dalje()
      await tvrdi((await poz()) !== `${p.korak}/${p.odradjeno}/${p.grana}`, `${opis}: Dalje nije pomerilo priču`)
    }
    if (grana === 'vazi') await tvrdi((await poz()) === '9/0/vazi', 'Glavna grana mora završiti na 9/0 (kraj priče)')
    else await tvrdi((await poz()) === '9/1/otkaz', 'Grana otkaz mora završiti na 9/1')
  }
  // nazad kroz granicu: Nazad sa 9/1 otkaz vraća na 9/0, pa na 8/0 glavne grane
  await klikni('Nazad', '[data-traka] button')
  await tvrdi((await poz()) === '9/0/otkaz', 'Nazad iz 9/1 otkaz mora na 9/0 otkaz: ' + await poz())
  await klikni('Nazad', '[data-traka] button')
  await tvrdi((await poz()) === '8/0/vazi', 'Nazad iz 9/0 otkaz mora na 8/0 vazi: ' + await poz())
}
console.log(`Dalje kroz 9 koraka × 3 uloge × obe grane: OK (kliknuto ${ukupnoKlikova} aktivnih dugmadi, nijedno nije promenilo svet)`)

// ================================================================ 2b) svi ostali ekrani svih uloga u vođenom režimu: nijedno aktivno dugme ne menja svet
const naPoziciji = async (uloga, korak, odradjeno, grana = 'vazi') => {
  await page.evaluate((k, kor, o, g, u) => {
    const s = JSON.parse(sessionStorage.getItem(k))
    s.prica = { ...s.prica, korak: kor, odradjeno: o, grana: g, odstupljeno: false, rezim: 'vodjeno' }
    s.uloga = u
    sessionStorage.setItem(k, JSON.stringify(s))
  }, KLJUC, korak, odradjeno, grana, uloga)
  await page.goto(BASE + '?r=' + Date.now() + '#/pocetna', { waitUntil: 'networkidle0' })
  await sleep(300)
}
const OSTALI = ['/lokacije', '/lokacije/foto-studio', '/lokacije/industrijski-loft', '/primeri', '/pravno', '/brief?novi=1', '/vlasnik', '/vlasnik/nova-lokacija', '/partner', '/produkcija', '/produkcija/opcije', '/produkcija/izvidjanje/industrijski-loft']
let drugiKlikovi = 0
await udji('produkcija')
for (const uloga of ['produkcija', 'vlasnik', 'partner']) {
  for (const [k, o] of [[3, 1], [8, 1]]) {
    await naPoziciji(uloga, k, o)
    for (const ruta of OSTALI) {
      await idi(ruta)
      if (!(await page.evaluate(() => !!document.querySelector('main h1')))) continue
      const opis = `${uloga} ${k}/${o} ${ruta}`
      await proveriVanPrice(opis)
      drugiKlikovi += await skenirajAktivna(opis, uloga)
    }
  }
}
console.log(`Ostali ekrani × 3 uloge × 2 pozicije: OK (kliknuto ${drugiKlikovi} aktivnih dugmadi, nijedno nije promenilo svet)`)

// ================================================================ 3) ručni prolaz radnjama uz smenu uloge
for (const start of ['produkcija', 'vlasnik', 'partner']) {
  await udji(start)
  const tvrdiPoz = async (ocek, gde) => tvrdi((await poz()) === ocek, `ručni prolaz (${start}) ${gde}: očekivano ${ocek}, a jeste ${await poz()}`)
  // 2: zahtev
  await dalje(); await gledajKao('Produkcija'); await klikni('Prikaži mi', '[data-traka] button')
  await tvrdi((await hash()) === '/brief', 'Zahtev: očekivan /brief')
  await klikni('Pošalji zahtev', 'main button')
  await mora('Zahtev je poslat.')
  await tvrdiPoz('2/1/vazi', 'posle zahteva')
  // pokušaj radnje iz sledećih koraka mora biti ugašen: Brief više nije „sledeća" radnja
  // 3: izbor (Simuliraj)
  await dalje(); await prikaziMi()
  await tvrdi((await hash()) === '/produkcija', 'Izbor: očekivana tabla')
  await klikni('Simuliraj: Nasetu tim šalje izbor', 'main button')
  await tvrdiPoz('3/1/vazi', 'posle izbora')
  // 4: deljenje i glas
  await dalje(); await prikaziMi()
  await tvrdi((await hash()).endsWith('/primalac'), 'Korak 4: Prikaži mi vodi na ekran primaoca (tu je aktivno dugme): ' + await hash())
  await mora('Vaše ime')
  await tvrdi((await dugmeUgaseno('Ne sviđa mi se')) === true, 'Ne sviđa mi se mora biti ugašeno u vođenoj priči')
  await klikni('Sviđa mi se', 'main button')
  await mora('Glas je zabeležen')
  await tvrdiPoz('4/1/vazi', 'posle glasa')
  // 5: opcije
  await dalje(); await prikaziMi()
  await klikni('Traži opciju', 'main button')
  await tvrdiPoz('5/1/vazi', 'posle opcije na loftu')
  await prikaziMi()
  await tvrdi((await hash()) === '/lokacije/brutalisticka-hala', 'Prikaži mi posle prve opcije vodi na halu: ' + await hash())
  await klikni('Traži opciju', 'main button')
  await tvrdiPoz('5/2/vazi', 'posle opcije na hali')
  await prikaziMi()
  await klikni('Simuliraj: Produkcija Sigma traži isti termin', 'main button')
  await tvrdiPoz('5/3/vazi', 'posle osporavanja')
  await mora('Druga produkcija traži isti termin')
  // vlasnik vidi Sigmin zahtev sa zaključanim „Odobri"
  await gledajKao('Vlasnik')
  await tvrdi((await hash()).startsWith('/vlasnik/zahtev/'), 'Vlasnik u koraku 5/3 vidi Sigmin zahtev: ' + await hash())
  await mora('Čeka se odluka prve opcije (Produkcija Delta), još 24 h')
  await tvrdi((await dugmeUgaseno('Odobri')) === true, 'Odobri za Sigmu mora biti zaključano')
  // 6: zahtev za rezervaciju
  await dalje(); await gledajKao('Produkcija'); await prikaziMi()
  await tvrdi((await hash()) === '/produkcija/zahtev/industrijski-loft', 'Zahtev: očekivana forma')
  await tvrdi(await page.evaluate(() => document.querySelector('#prek').readOnly), 'Polja zahteva moraju biti samo za čitanje u vođenoj priči')
  await klikni('Pošalji zahtev vlasniku', 'main button')
  await mora('Čeka vlasnika')
  await tvrdiPoz('6/1/vazi', 'posle zahteva za rezervaciju')
  // 7: vlasnik odobrava
  await dalje()
  await mora('U ovom koraku odlučuje vlasnik')
  await gledajKao('Vlasnik')
  await tvrdi((await dugmeUgaseno('Odobri')) === false, 'Vlasnik u koraku 7 mora moći da odobri')
  await mora('Odbij') // vidljivo, ali ugašeno
  await tvrdi((await dugmeUgaseno('Odbij')) === true, 'Odbij mora biti ugašeno')
  await klikni('Odobri', 'main button')
  await mora('Odobreno.')
  await tvrdiPoz('7/1/vazi', 'posle odobrenja')
  // 8: predračun i uplata (adresa zaključana pa otvorena)
  await dalje(); await gledajKao('Produkcija'); await prikaziMi()
  await mora('15.795,00 RSD')
  await nemaAdresa('predračun pre uplate')
  await klikni('Simuliraj: Nasetu potvrđuje uplatu', 'main button')
  await tvrdiPoz('8/1/vazi', 'posle uplate')
  await prikaziMi()
  await mora('Ulica Primera 12')
  // 9: grana „Vlasnik otkaže": vlasnik otkazuje, adresa se ponovo zaključava
  await dalje()
  await klikni('Otkaže', '[data-racva] button')
  await tvrdiPoz('9/0/otkaz', 'račva')
  await gledajKao('Vlasnik'); await prikaziMi()
  await klikni('Otkaži rezervaciju', 'main button')
  await klikni('Otkaži rezervaciju', 'dialog button')
  await tvrdiPoz('9/1/otkaz', 'posle otkazivanja')
  await gledajKao('Produkcija'); await prikaziMi()
  await mora('Vlasnik je otkazao rezervaciju')
  await mora('Predlog zamenske lokacije')
  await nemaAdresa('posle otkazivanja')
  await slika(`rucni-prolaz-${start}-kraj`)
}
console.log('Ručni prolaz radnjama (start kao svaka od 3 uloge): OK')

// ================================================================ 4) osvežavanje, Nazad u priču, Kreni ispočetka
await udji('produkcija')
for (let i = 0; i < 5; i++) await dalje() // 4/0
await page.reload({ waitUntil: 'networkidle0' })
await tvrdi((await poz()) === '4/0/vazi', 'Osvežavanje usred priče mora zadržati mesto: ' + await poz())
await mora('Korak 4 od 9')
// napuštanje ekrana priče
await idi('/lokacije')
await mora('Napustili ste ekran priče')
await klikni('Nazad u priču', '[data-traka] button')
await nema('Napustili ste ekran priče')
await tvrdi((await hash()).startsWith('/izbor/'), 'Nazad u priču vodi na ekran koraka: ' + await hash())
// Gledaj kao i dalje radi, ništa se ne gubi
await gledajKao('Vlasnik'); await gledajKao('Partner'); await gledajKao('Produkcija')
await tvrdi((await poz()) === '4/0/vazi', 'Gledaj kao ne sme da pomeri priču')
// Kreni ispočetka traži potvrdu; Odustani ne menja ništa
await klikni('Kreni ispočetka', '[data-traka] button')
await mora('Krenuti ispočetka')
await klikni('Odustani', 'dialog button')
await tvrdi((await poz()) === '4/0/vazi', 'Odustani ne sme da menja priču')
await klikni('Kreni ispočetka', '[data-traka] button')
await klikni('Da, kreni ispočetka', 'dialog button')
await tvrdi((await poz()) === '1/0/vazi', 'Kreni ispočetka mora vratiti na 1/0: ' + await poz())
await tvrdi((await stanje()).uloga === 'produkcija', 'Uloga ostaje posle Kreni ispočetka')
// sačuvan zapis ne može da raskine priču: ručno pokvaren svet se ponovo gradi iz pozicije
await page.evaluate((k) => { const s = JSON.parse(sessionStorage.getItem(k)); s.sati = 99; s.zahtevi = []; s.prica = { ...s.prica, korak: 7, odradjeno: 0 }; sessionStorage.setItem(k, JSON.stringify(s)) }, KLJUC)
await page.reload({ waitUntil: 'networkidle0' })
await tvrdi((await stanje()).zahtevi.some((z) => z.produkcijaId === 'delta') && (await stanje()).sati === 0, 'Svet mora biti ponovo izgrađen iz pozicije (ne iz pokvarenog zapisa)')
// Admin nije dostupan u vođenom režimu: poruka sa prelaskom u slobodni
await idi('/admin')
await mora('Admin je dostupan u slobodnom režimu')
console.log('Osvežavanje, napuštanje ekrana, Kreni ispočetka, Admin u vođenom: OK')

// ================================================================ 5) slobodni režim (kratko; ceo dorada-2 scenario je u e2e-scenario.mjs)
await udji('produkcija', 'slobodno')
await mora('Sada slobodno istražujete')
await klikni('Razumem', 'button')
await tvrdi((await ulogeUTraci()).join(',') === 'Produkcija,Vlasnik,Partner,Admin', 'U slobodnom režimu Admin mora biti ponuđen')
// radnja priče pomera poziciju (slobodno klikanje kroz priču)
await dalje(); await idi('/brief')
await klikni('Pošalji zahtev', 'main button')
await tvrdi((await poz()) === '2/1/vazi', 'U slobodnom režimu radnja priče pomera poziciju: ' + await poz())
await tvrdi(!(await stanje()).prica.odstupljeno, 'Radnja priče nije odstupanje')
// premotavanje (Alati) = odstupanje, „Vrati na korak" vraća
await klikni('Alati', '[data-traka] button')
await klikni('+72 h', 'button')
await mora('Izmenili ste stanje van priče')
await tvrdi((await stanje()).sati === 72, 'Premotavanje mora uvećati vreme')
await page.keyboard.press('Escape')
await klikni('Vrati na korak 2', '[data-traka] button')
await klikni('Vrati na korak 2', 'dialog button')
await tvrdi((await stanje()).sati === 0 && !(await stanje()).prica.odstupljeno, 'Vrati na korak mora obrisati izmene van priče')
// prelazak u vođeni režim iz Admina daje Produkciju
await gledajKao('Admin')
await tvrdi((await hash()) === '/admin', 'Admin vodi na /admin')
await klikni('Vođeno', '[data-traka] button')
await tvrdi((await stanje()).uloga === 'produkcija' && (await stanje()).prica.rezim === 'vodjeno', 'Iz Admina u vođeni režim: uloga postaje Produkcija')
console.log('Slobodni režim: OK')

console.log('PROBLEMI:', JSON.stringify(problemi, null, 1))
console.log('POZIVI KA TUĐIM SERVERIMA:', JSON.stringify(spoljni))
await browser.close()
if (problemi.length || spoljni.length) { console.log('E2E-PRICA NIJE OK: konzola ili tuđi serveri'); process.exit(1) }
console.log('E2E-PRICA OK')
