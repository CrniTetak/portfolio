// E2E "ko šta vidi" (B5, B7.4): prolazi SVAKI ekran SVAKE uloge u SVAKOM stanju priče (Approved) i traži zabranjene podatke
// u prikazanom tekstu. Spisak zabranjenog se gradi iz scenario/, ne kuca se ručno. Ista skripta popisuje SVE "EUR ..." iznose
// sa svih ekrana i proverava da je svaki od njih poznat (izračunat u scenario/ ili deo sporednih transfera), pa tako hvata
// pogrešnu brojku napisanu u tekstu. Takođe: na svakom ekranu oznaka DEMO i pravna napomena, ruta vodi na pravi ekran.
//
// Pokretanje:  npm run build && npm run preview   pa   npm run e2e:vidljivost
// Opcije:      --brzo  (samo početno i završno stanje svakog koraka)
import { BASE, KLJUC, izvestaj, otvori, proveravac, ucitajModule } from './_zajednicko.mjs'

const BRZO = process.argv.includes('--brzo')
const { m, zatvori } = await ucitajModule()
const ULOGE = ['selling', 'buying', 'player', 'agent', 'financier']
const NAPOMENA = 'Demo — illustrative only, not legal or financial advice'

// --------------------------------------------------------------------------- poznati iznosi (sve što scenario sme da prikaže)
function sviBrojevi(x, izlaz = new Set()) {
  if (typeof x === 'number' && Number.isFinite(x)) izlaz.add(Math.round(x))
  else if (Array.isArray(x)) x.forEach((e) => sviBrojevi(e, izlaz))
  else if (x && typeof x === 'object') Object.values(x).forEach((e) => sviBrojevi(e, izlaz))
  return izlaz
}
const poznati = new Set()
for (const modul of [m.racun, m.uslovi, m.strane]) for (const v of Object.values(modul)) if (typeof v !== 'function') sviBrojevi(v, poznati)
// izvedeno u pravila/izvedeno.ts i na ekranima: preostale rate, razlike verzija, zbirovi rata
const R = m.racun
const U = m.uslovi
poznati.add(U.RATE[1] + U.RATE[2])
poznati.add(R.provizijaAgenta + R.naknadaPola)
for (const [a, b] of [[0, 1], [1, 2], [0, 2]]) {
  const r = R.razlikaVerzija(a, b)
  poznati.add(Math.abs(r.fiksni)); poznati.add(Math.abs(r.bonusi))
}
for (let i = 0; i < U.VERZIJE.length; i++) { poznati.add(R.fiksniVerzije(i)); poznati.add(R.naslovnaVerzije(i)) }
poznati.add(0)

const broj = (n) => m.format.broj(n)
const rxIznos = (n) => new RegExp(`(?<![\\d,])${broj(n).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![\\d,])`)

// --------------------------------------------------------------------------- pozicije i ekrani
// Odobrena rečenica: igraču kaže šta NE vidi, pa sme da pomene te reči. Ništa drugo se ne izuzima.
const DOZVOLJENA_REC_IGRACU = 'You do not see the offers between the clubs, the agent commission or the sell-on terms.'
const ODBIJENO_IZNOSI = [80000, 70000, 220000, 1400000]
const ODBIJENO_IZRAZI = ['Installment 2', 'Sell-on', 'paid to you directly', 'Once registration is confirmed', 'required documents']
// ("what-if" se ne traži: tekst koraka 9 glavne priče ga sadrži i u Approved; identičnost tekstova proverava se posebno)
const FINANSIJER_IZRAZI = ['refund', 'refus', 'rejected', 'did not go through', 'not carried out']
const pozicije = []
for (let k = 1; k <= 9; k++) {
  const n = m.reducer.brojRadnji({ korak: k, grana: 'approved' })
  for (let o = 0; o <= n; o++) if (!BRZO || o === 0 || o === n) pozicije.push({ korak: k, odradjeno: o })
}
const ekraniUloge = (u) => m.rute.EKRANI.filter((e) => e.uloga === u).map((e) => ({ id: e.id, ruta: '/' + e.putanja }))
const c2 = (u) => (u === 'selling' ? m.strane.SPOREDNI_PRODAVAC : u === 'buying' ? m.strane.SPOREDNI_KUPAC : []).map((t) => ({ id: 'C2', ruta: m.rute.putSporednog(u, t.id) }))

const { browser, page, problemi, spoljni } = await otvori({ sirina: 1280, visina: 900 })
const { lista, proveri } = proveravac()
const nalazi = []
let brojProvera = 0
const nalaz = (opis) => { if (nalazi.length < 60) nalazi.push(opis) ; else if (nalazi.length === 60) nalazi.push('... (još nalaza)'); }
const provera = (ok, opis) => { brojProvera++; if (!ok) nalaz(opis) }

await page.goto(BASE, { waitUntil: 'networkidle0' })
const nepoznatiIznosi = new Map()
const finTekst = new Map()
let ucitano = 0

async function prodji(sirina, visina, pozicijeZaProlaz, grana = 'approved') {
  await page.setViewport({ width: sirina, height: visina, deviceScaleFactor: 1, isMobile: sirina < 720, hasTouch: sirina < 720 })
  for (const uloga of ULOGE) {
    const zabranjeniIznosi = m.vidljivost.zabranjeniIznosi(uloga)
    const zabranjeniNizovi = m.vidljivost.zabranjeniNizovi(uloga)
    const ekrani = [...ekraniUloge(uloga), ...c2(uloga)]
    for (const poz of pozicijeZaProlaz) {
      for (const e of ekrani) {
        const oznaka = `${sirina}px ${grana === 'rejected' ? 'REJECTED ' : ''}${uloga} ${e.id} @${poz.korak}/${poz.odradjeno}`
        await page.evaluate((k, p, g) => sessionStorage.setItem(k, JSON.stringify({ verzija: 1, korak: p.korak, odradjeno: p.odradjeno, grana: g, rezim: 'guided', vidjenUvodFree: true })), KLJUC, poz, grana)
        await page.goto(BASE + '#' + e.ruta, { waitUntil: 'domcontentloaded' })
        await page.reload({ waitUntil: 'domcontentloaded' })
        await page.waitForSelector('[data-ekran]', { timeout: 8000 })
        ucitano++
        const r = await page.evaluate(() => ({
          ekran: document.querySelector('[data-ekran]')?.getAttribute('data-ekran'),
          tekst: document.body.innerText,
          demo: document.querySelector('[data-oznaka-demo]')?.textContent.trim() ?? null,
          sadrzaj: document.querySelector('[data-ekran]')?.innerText ?? '',
          prica: [...document.querySelectorAll('.demobar .story .bar-h, .demobar .story > p')].map((x) => x.innerText).join(' '), // bez prekidača grane: to je kontrola prezentera
          blokovi: [...document.querySelectorAll('.demobar .story > p, [data-ekran] .kpi, [data-ekran] .attn, [data-ekran] .empty, [data-ekran] .note')].map((x) => x.innerText),
          pricaP: [...document.querySelectorAll('.demobar .story > p')].map((x) => x.innerText).join(' '),
          agreedChip: [...document.querySelectorAll('[data-ekran] .chip')].some((c) => /^Agreed/.test(c.textContent.trim())),
        }))
        // Grana Rejected posle odbijene registracije: nijedan ekran ne sme da pokaže iznose/izraze iz Approved puta (dorada talasa 3, D1-D3).
        if (grana === 'approved' && uloga === 'financier' && poz.korak >= 6 && poz.korak <= 8 && poz.odradjeno === 0 && sirina === 1280) finTekst.set(`${e.id}@${poz.korak}`, r.sadrzaj + '|' + r.pricaP)
        // nijedna kartica priče ni pločica ne ponavlja istu rečenicu dvaput
        for (const blok of r.blokovi) {
          const rec = blok.split(/\n|(?<=[.!?])\s+/).map((x) => x.trim().toLowerCase()).filter((x) => x.length > 12)
          provera(new Set(rec).size === rec.length, `${oznaka}: ponovljena rečenica u bloku "${blok.replace(/\n/g, ' / ').slice(0, 90)}"`)
        }
        const odbijenoStanje = grana === 'rejected' && (poz.korak > 6 || poz.odradjeno === m.reducer.brojRadnji({ korak: 6, grana: 'rejected' }))
        if (odbijenoStanje) {
          for (const iznos of ODBIJENO_IZNOSI) provera(!rxIznos(iznos).test(r.sadrzaj), `${oznaka}: Rejected pokazuje iznos iz Approved puta ${broj(iznos)}`)
          if (uloga === 'buying') provera(!rxIznos(1600000).test(r.sadrzaj), `${oznaka}: Rejected kupac vidi 1,600,000`)
          for (const niz of e.id === 'C2' ? [] : ODBIJENO_IZRAZI) provera(!(uloga === 'player' ? r.sadrzaj.split(DOZVOLJENA_REC_IGRACU).join('') : r.sadrzaj).toLowerCase().includes(niz.toLowerCase()), `${oznaka}: Rejected pokazuje "${niz}"`)
          if (e.id === 'S2' || e.id === 'B2') provera(!r.agreedChip, `${oznaka}: Rejected ima zelenu oznaku "Agreed"`)
          if (uloga === 'financier') {
            // isti tekst u obe grane za iste korake (6-8 na početku): finansijer ne sme da sazna ishod
            if (poz.korak >= 6 && poz.korak <= 8 && poz.odradjeno === 0 && sirina === 1280) {
              const k = `${e.id}@${poz.korak}`
              provera(finTekst.get(k) === r.sadrzaj + '|' + r.pricaP, `${oznaka}: finansijer vidi drugačiji tekst nego u grani Approved`)
            }
            for (const niz of FINANSIJER_IZRAZI) {
              provera(!r.sadrzaj.toLowerCase().includes(niz), `${oznaka}: finansijer saznaje ishod ("${niz}")`)
              provera(!r.prica.toLowerCase().includes(niz), `${oznaka}: priča finansijeru otkriva ishod ("${niz}")`)
            }
          }
        }
        provera(r.ekran === e.id, `${oznaka}: ruta otvara ekran ${r.ekran}`)
        provera(r.demo === 'DEMO — fictional data', `${oznaka}: nema oznake DEMO`)
        provera(r.tekst.includes(NAPOMENA), `${oznaka}: nema pravne napomene`)
        provera(!/undefined|NaN|\[object/.test(r.tekst), `${oznaka}: u tekstu je "undefined"/"NaN"`)
        for (const iznos of zabranjeniIznosi) provera(!rxIznos(iznos).test(r.tekst), `${oznaka}: ZABRANJEN iznos ${broj(iznos)}`)
        const tekstZaNizove = uloga === 'player' ? r.tekst.split(DOZVOLJENA_REC_IGRACU).join('') : r.tekst
        for (const niz of zabranjeniNizovi) provera(!tekstZaNizove.toLowerCase().includes(niz.toLowerCase()), `${oznaka}: ZABRANJEN tekst "${niz}"`)
        // popis svih EUR iznosa
        for (const mt of r.tekst.matchAll(/EUR\s(\d{1,3}(?:,\d{3})*|\d+)/g)) {
          const v = Number(mt[1].replace(/,/g, ''))
          provera(poznati.has(v), `${oznaka}: nepoznat iznos EUR ${mt[1]}`)
          if (!poznati.has(v)) nepoznatiIznosi.set(mt[1], oznaka)
          // format: zarez kao razdvajač hiljada
          provera(broj(v) === mt[1], `${oznaka}: pogrešan format iznosa EUR ${mt[1]}`)
        }
      }
    }
  }
}

await prodji(1280, 900, pozicije)
// grana Rejected (od koraka 6): isti ekrani i ista pravila vidljivosti
const pozicijeRej = []
for (let k = 6; k <= 9; k++) {
  const n = m.reducer.brojRadnji({ korak: k, grana: 'rejected' })
  for (let o = 0; o <= n; o++) if (!BRZO || o === 0 || o === n) pozicijeRej.push({ korak: k, odradjeno: o })
}
await prodji(1280, 900, pozicijeRej, 'rejected')
// telefonski raspored sadrži isti sadržaj; proba samo na početnom/završnom stanju
const kratke = pozicije.filter((p) => p.odradjeno === 0 || p.odradjeno === m.reducer.brojRadnji({ korak: p.korak, grana: 'approved' }))
await prodji(360, 800, kratke)
await prodji(360, 640, pozicijeRej.filter((p) => p.odradjeno === 0 || p.odradjeno === m.reducer.brojRadnji({ korak: p.korak, grana: 'rejected' })), 'rejected')

// C1 i C3
for (const [id, ruta] of [['C1', '/'], ['C3', '/about']]) {
  await page.goto(BASE + '#' + ruta, { waitUntil: 'domcontentloaded' })
  await page.reload({ waitUntil: 'domcontentloaded' })
  await page.waitForSelector('[data-ekran]')
  const r = await page.evaluate(() => ({ ekran: document.querySelector('[data-ekran]')?.getAttribute('data-ekran'), tekst: document.body.innerText, demo: document.querySelector('[data-oznaka-demo]')?.textContent.trim() }))
  provera(r.ekran === id, `${id}: pogrešan ekran`)
  provera(r.demo === 'DEMO — fictional data', `${id}: nema oznake DEMO`)
  provera(r.tekst.includes(NAPOMENA), `${id}: nema pravne napomene`)
  provera(!/EUR\s\d/.test(r.tekst), `${id}: ne sme da pokazuje iznose`)
  provera(!/subscription|projection|revenue/i.test(r.tekst), `${id}: brojke poslovnog modela se ne prikazuju`)
}

await browser.close()
await zatvori()
console.log(`Učitano ${ucitano} ekrana, ${brojProvera} provera. Poznatih iznosa: ${poznati.size}.`)
for (const n of nalazi) console.log('  X ' + n)
if (nepoznatiIznosi.size) console.log('Nepoznati iznosi:', [...nepoznatiIznosi.entries()].slice(0, 10))
proveri(`vidljivost: ${brojProvera} provera nad ${ucitano} ekrana`, nalazi.length === 0, nalazi.length)
const ok = izvestaj('e2e-vidljivost', lista, problemi, spoljni)
process.exit(ok ? 0 : 1)
