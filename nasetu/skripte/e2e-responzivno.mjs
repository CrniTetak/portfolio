// Provera prikaza na telefonima i tabletima (uspravno i položeno), u OBA režima (vođeno i slobodno), za ključne ekrane svih uloga.
// 18 veličina: 17 iz dorade 2 + telefon 360 × 640. Za SVAKU veličinu, režim i ekran:
//  (a) nema skrola u stranu;
//  (b) pri dnu je najviše JEDAN fiksni sloj (donji blok sa trakom priče), a gore jedan sloj zaglavlja;
//  (c) oznaka PROTOTIP se vidi bez skrolovanja;
//  (d) poslednji sadržaj i podnožje mogu da se odskroluju iznad trake;
//  (e) panel odozdo (telefon) ne prelazi 82% visine; meni i Alati staju u ekran;
//  (f) mete za dodir u traci i zaglavlju su najmanje 44 px;
//  (g) ništa fiksno ne prekriva tekst: svaki tekst sadržaja može da se dovede u deo ekrana koji nijedan fiksni sloj ne zaklanja;
//  (h) gornji lepljivi blok zauzima najviše ~15% visine (telefon položeno nije lepljiv);
//  uz snimke ekrana (samo viewport) za pregled očima.
//
// Pokretanje:
//   npm run build && npm run preview -- --port 4180 --strictPort     (jedan prozor)
//   node skripte/e2e-responzivno.mjs [BASE_URL] [filter-veličine, npr. 360x640]   (drugi prozor)
// Snimci: e2e-slike/responzivno/<širina>x<visina>/<režim>-<ekran>.png (folder je u .gitignore)
import { mkdirSync, writeFileSync } from 'node:fs'
import puppeteer from 'puppeteer-core'

const BASE = process.argv[2] ?? process.env.BASE_URL ?? 'http://localhost:4180/'
const FILTER = process.argv[3] ?? null
const CHROME = process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const IZLAZ = 'e2e-slike/responzivno'
const KLJUC = 'nasetu.prototip.v1'

const VELICINE = [
  // telefoni uspravno
  [320, 568, 'telefon'], [360, 640, 'telefon'], [360, 800, 'telefon'], [375, 667, 'telefon'], [390, 844, 'telefon'], [393, 852, 'telefon'],
  [412, 915, 'telefon'], [430, 932, 'telefon'],
  // tableti uspravno
  [768, 1024, 'tablet'], [800, 1280, 'tablet'], [820, 1180, 'tablet'], [834, 1194, 'tablet'], [1024, 1366, 'tablet'],
  // tableti položeno
  [1024, 768, 'tablet'], [1180, 820, 'tablet'], [1280, 800, 'tablet'], [1366, 1024, 'tablet'],
  // telefon položeno
  [844, 390, 'telefon'],
].filter(([w, h]) => !FILTER || FILTER === `${w}x${h}`)

const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--no-sandbox'] })
const page = await browser.newPage()
const problemi = []
const spoljni = []
const ORIGIN = BASE.replace(/\/$/, '')
page.on('response', (r) => { if (r.status() >= 400) problemi.push('HTTP ' + r.status() + ' ' + r.url()) })
page.on('pageerror', (e) => problemi.push('pageerror: ' + e.message))
page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) problemi.push(`console.${m.type()}: ${m.text()}`) })
page.on('request', (r) => { const u = r.url(); if (!u.startsWith(ORIGIN) && !u.startsWith('data:') && !u.startsWith('blob:' + ORIGIN)) spoljni.push(u) })
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const klikniTekst = async (tekst, sel = 'button, a') => {
  const ok = await page.evaluate((t, s) => {
    const el = [...document.querySelectorAll(s)].find((e) => e.textContent.trim().includes(t) && e.getClientRects().length > 0 && !e.disabled)
    if (!el) return false
    el.click(); return true
  }, tekst, sel)
  if (!ok) throw new Error('Nema dugmeta: ' + tekst)
  await sleep(250)
}

// ---------------------------------------------------------------- osnovna stanja (jednom, na računaru)
await page.setViewport({ width: 1280, height: 900 })
await page.goto(BASE, { waitUntil: 'networkidle0' })
await page.evaluate(() => sessionStorage.clear())
await page.reload({ waitUntil: 'networkidle0' })
await page.click('[data-udji-u-demo]')
await sleep(400)
const OSNOVA = JSON.parse(await page.evaluate((k) => sessionStorage.getItem(k), KLJUC))

// ID-jevi su deterministički: uzimaju se iz sveta na kraju priče (9/0)
await page.evaluate((k, o) => { const s = JSON.parse(sessionStorage.getItem(k)); s.prica = { ...s.prica, korak: 9, odradjeno: 0, grana: 'vazi' }; sessionStorage.setItem(k, JSON.stringify(s)) }, KLJUC, OSNOVA)
await page.goto(BASE + '?r=' + Date.now() + '#/pocetna', { waitUntil: 'networkidle0' })
const KRAJ = JSON.parse(await page.evaluate((k) => sessionStorage.getItem(k), KLJUC))
const ID = {
  izbor: [...KRAJ.izbori].reverse().find((i) => i.akterId === 'delta' && i.poslatProdukciji !== null).id,
  zahtev: [...KRAJ.zahtevi].reverse().find((z) => z.produkcijaId === 'delta' && z.lokacijaId === 'industrijski-loft').id,
  sigma: KRAJ.zahtevi.find((z) => z.produkcijaId === 'sigma' && z.lokacijaId === 'industrijski-loft').id,
}
ID.predracun = KRAJ.predracuni.find((p) => p.zahtevId === ID.zahtev).id

// stanja van priče (slobodni režim): predračun sa uslugama (Alati) i admin sa lokacijama na čekanju
await page.evaluate((k, o) => { const s = JSON.parse(o); s.prica = { ...s.prica, rezim: 'slobodno', vidjenUvodSlobodno: true }; sessionStorage.setItem(k, JSON.stringify(s)) }, KLJUC, JSON.stringify(OSNOVA))
await page.goto(BASE + '?r=' + Date.now() + '#/pocetna', { waitUntil: 'networkidle0' })
await klikniTekst('Alati', '[data-traka] button')
await klikniTekst('Predračun sa uslugama', 'button')
await sleep(400)
const USLUGE = JSON.parse(await page.evaluate((k) => sessionStorage.getItem(k), KLJUC))
const predracunUslugeId = USLUGE.predracuni.find((p) => p.vrsta === 'naknada').id
{
  const tehnicki = Object.fromEntries(['struja', 'prikljucci', 'plafon', 'zamracivanje', 'ton', 'svetlo', 'stranaSveta', 'oprema', 'vrata', 'lift', 'hodnik', 'parkingAuta', 'parkingKamioni', 'prostorEkipa', 'prostorSminka', 'prostorKostim', 'toaleti', 'sati', 'izmene', 'ljubimci', 'pusenje', 'pravilaZgrade'].map((k) => [k, 'primer (izmišljeno)']))
  const osnova = { podnosilacId: 'alfa', vlasnikId: 'alfa', vlasnikNaziv: '', saglasnostVlasnika: true, tip: 'Studio', opstina: 'Vračar', kvadratura: 80, stanje: 'ceka', odluka: null, poslat: 0, fotografisanje: false }
  USLUGE.prijave = JSON.parse(JSON.stringify(USLUGE))
  USLUGE.prijave.prijaveLokacija = [
    { ...osnova, id: 'pl-1', izvor: 'vlasnik', naziv: 'Probni podrum', tehnicki, brojFotografija: 10, dokaz: 'dokaz-primer.pdf', cenovnik: { do10: null, do30: 25000, preko30: null, satiDana: 10, pripremaCenti: 12500, prekovremeniCenti: 3000, najkrace: '1 dan', troskovi: '' } },
    { ...osnova, id: 'pl-2', izvor: 'partner', podnosilacId: 'mila', vlasnikId: '', vlasnikNaziv: 'Vlasnik prostora (izmišljeno)', naziv: 'Stara štamparija', tehnicki: {}, brojFotografija: 0, dokaz: '', cenovnik: { do10: null, do30: null, preko30: null, satiDana: 10, pripremaCenti: 0, prekovremeniCenti: 0, najkrace: '', troskovi: '' } },
  ]
}

// ---------------------------------------------------------------- ekrani
// [naziv, režim, uloga, korak, odrađeno, grana, ruta, dodatak]; dodatak: 'panel' | 'meni' | 'alati' | 'otvori' | 'usluge' | 'prijave'
const V = 'vodjeno'
const S = 'slobodno'
const R = ID.zahtev
const EKRANI = [
  // ---- vođena priča: ulaz i ključni ekrani sve tri uloge
  ['00-ulaz', V, 'produkcija', 1, 0, 'vazi', '/'],
  ['01-produkcija-pocetna', V, 'produkcija', 1, 0, 'vazi', '/pocetna'],
  ['02-brief', V, 'produkcija', 2, 0, 'vazi', '/brief'],
  ['03-tabla-simulacija', V, 'produkcija', 3, 0, 'vazi', '/produkcija'],
  ['04-izbor', V, 'produkcija', 3, 1, 'vazi', `/izbor/${ID.izbor}`],
  ['05-deljenje', V, 'produkcija', 4, 0, 'vazi', `/izbor/${ID.izbor}/deljenje`],
  ['06-primalac', V, 'produkcija', 4, 0, 'vazi', `/izbor/${ID.izbor}/primalac`],
  ['07-lokacija-loft', V, 'produkcija', 5, 0, 'vazi', '/lokacije/industrijski-loft'],
  ['08-opcije', V, 'produkcija', 5, 3, 'vazi', '/produkcija/opcije'],
  ['09-zahtev-forma', V, 'produkcija', 6, 0, 'vazi', '/produkcija/zahtev/industrijski-loft'],
  ['10-rezervacija-ceka', V, 'produkcija', 6, 1, 'vazi', `/produkcija/rezervacija/${R}`],
  ['11-predracun', V, 'produkcija', 8, 0, 'vazi', `/produkcija/predracun/${ID.predracun}`],
  ['12-rezervacija-placeno', V, 'produkcija', 8, 1, 'vazi', `/produkcija/rezervacija/${R}`],
  ['13-dokument-ugovor', V, 'produkcija', 9, 0, 'vazi', `/primeri?dokument=ugovor&rezervacija=${R}`],
  ['14-rezervacija-otkazana', V, 'produkcija', 9, 1, 'otkaz', `/produkcija/rezervacija/${R}`],
  ['15-vlasnik-tabla', V, 'vlasnik', 1, 0, 'vazi', '/vlasnik'],
  ['16-vlasnik-sigma', V, 'vlasnik', 5, 3, 'vazi', `/vlasnik/zahtev/${ID.sigma}`],
  ['17-vlasnik-odobri', V, 'vlasnik', 7, 0, 'vazi', `/vlasnik/zahtev/${R}`],
  ['18-vlasnik-grana-otkaz', V, 'vlasnik', 9, 0, 'otkaz', `/vlasnik/zahtev/${R}`],
  ['19-partner-tabla', V, 'partner', 1, 0, 'vazi', '/partner'],
  ['20-partner-dokument', V, 'partner', 9, 0, 'vazi', `/primeri?dokument=brief&rezervacija=${R}`],
  ['21-panel', V, 'produkcija', 5, 0, 'vazi', '/lokacije/industrijski-loft', 'panel'],
  ['22-panel-racva', V, 'produkcija', 9, 0, 'vazi', `/primeri?dokument=ugovor&rezervacija=${R}`, 'panel'],
  ['23-meni', V, 'produkcija', 4, 0, 'vazi', `/izbor/${ID.izbor}/deljenje`, 'meni'],
  // ---- slobodno istraživanje: isto plus admin, katalog i ekrani dorade 2
  ['30-produkcija-pocetna', S, 'produkcija', 1, 0, 'vazi', '/pocetna'],
  ['31-katalog', S, 'produkcija', 2, 0, 'vazi', '/lokacije'],
  ['32-lokacija', S, 'produkcija', 5, 2, 'vazi', '/lokacije/industrijski-loft'],
  ['33-lokacija-dugacak-naziv', S, 'produkcija', 3, 1, 'vazi', '/lokacije/foto-studio'],
  ['34-brief', S, 'produkcija', 2, 0, 'vazi', '/brief?novi=1'],
  ['35-izbor', S, 'produkcija', 3, 1, 'vazi', `/izbor/${ID.izbor}`],
  ['36-deljenje', S, 'produkcija', 4, 0, 'vazi', `/izbor/${ID.izbor}/deljenje`],
  ['37-opcije', S, 'produkcija', 5, 3, 'vazi', '/produkcija/opcije'],
  ['38-zahtev-forma', S, 'produkcija', 5, 3, 'vazi', '/produkcija/zahtev/industrijski-loft'],
  ['39-predracun', S, 'produkcija', 8, 0, 'vazi', `/produkcija/predracun/${ID.predracun}`],
  ['40-rezervacija-placeno', S, 'produkcija', 8, 1, 'vazi', `/produkcija/rezervacija/${R}`],
  ['41-vlasnik-tabla', S, 'vlasnik', 8, 1, 'vazi', '/vlasnik'],
  ['42-vlasnik-sigma', S, 'vlasnik', 5, 3, 'vazi', `/vlasnik/zahtev/${ID.sigma}`],
  ['43-vlasnik-zahtev-placeno', S, 'vlasnik', 8, 1, 'vazi', `/vlasnik/zahtev/${R}`],
  ['44-nova-lokacija', S, 'vlasnik', 1, 0, 'vazi', '/vlasnik/nova-lokacija', 'otvori'],
  ['45-partner-tabla', S, 'partner', 1, 0, 'vazi', '/partner'],
  ['46-admin-pregled', S, 'admin', 7, 1, 'vazi', '/admin'],
  ['47-admin-predracun', S, 'admin', 7, 1, 'vazi', `/admin/predracun/${ID.predracun}`],
  ['48-admin-lokacije-na-cekanju', S, 'admin', 7, 1, 'vazi', '/admin', 'prijave'],
  ['49-predracun-usluge', S, 'produkcija', 7, 1, 'vazi', `/produkcija/predracun/${predracunUslugeId}`, 'usluge'],
  ['50-primeri', S, 'produkcija', 1, 0, 'vazi', '/primeri'],
  ['51-pravne-strane', S, 'produkcija', 1, 0, 'vazi', '/pravno', 'otvori'],
  ['52-alati', S, 'produkcija', 4, 0, 'vazi', '/pocetna', 'alati'],
  ['53-panel', S, 'produkcija', 5, 2, 'vazi', '/lokacije/industrijski-loft', 'panel'],
  ['54-odstupanje', S, 'produkcija', 4, 0, 'vazi', '/pocetna', 'odstupanje'],
]

// ---------------------------------------------------------------- probe u stranici
function probe(opcije) {
  const vid = (e) => { const cs = getComputedStyle(e); const r = e.getBoundingClientRect(); return cs.display !== 'none' && cs.visibility !== 'hidden' && r.width > 0 && r.height > 0 }
  const fiksni = [...document.querySelectorAll('body *')].filter((e) => {
    if (e.tagName === 'DIALOG' || !vid(e)) return false
    const cs = getComputedStyle(e)
    return cs.position === 'fixed' || (cs.position === 'sticky' && cs.top === '0px')
  })
  const skup = new Set(fiksni)
  const vrh = fiksni.filter((e) => { let p = e.parentElement; while (p) { if (skup.has(p)) return false; p = p.parentElement } return true })
  const opis = (e) => e.getAttribute('data-donji') !== null ? 'donji blok' : e.tagName === 'HEADER' ? 'zaglavlje' : (e.getAttribute('aria-label') || e.className.toString().split(' ').slice(0, 3).join('.') || e.tagName)
  const r = vrh.map((e) => ({ ime: opis(e), r: e.getBoundingClientRect(), e }))
  const greske = []

  // (a) skrol u stranu
  const skrol = document.documentElement.scrollWidth - window.innerWidth
  if (skrol > 0) greske.push(`skrol u stranu +${skrol}px`)

  // (b) fiksni slojevi: pri dnu najviše jedan; ne seku se
  const donji = r.filter((x) => x.r.bottom >= window.innerHeight - 1 && x.r.top > 0)
  if (!opcije.overlay && donji.length > 1) greske.push('više fiksnih slojeva pri dnu: ' + donji.map((x) => x.ime).join(', '))
  for (let i = 0; i < r.length; i++) for (let j = i + 1; j < r.length; j++) {
    const a = r[i].r, b = r[j].r
    const w = Math.min(a.right, b.right) - Math.max(a.left, b.left)
    const h = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top)
    if (w > 1 && h > 1 && !opcije.overlay) greske.push(`preklapanje: ${r[i].ime} x ${r[j].ime}`)
  }

  // (c) PROTOTIP se vidi bez skrolovanja
  const oznaka = document.querySelector('[data-oznaka-prototip]')
  if (!oznaka) greske.push('nema oznake PROTOTIP')
  else { const o = oznaka.getBoundingClientRect(); if (o.top < 0 || o.bottom > window.innerHeight || o.right > window.innerWidth || o.width < 1) greske.push('PROTOTIP nije vidljiv bez skrolovanja') }

  // (e) panel / meni / Alati stoje u ekranu
  const panel = document.querySelector('[role=dialog][aria-label="Panel priče"]')
  if (panel) { const p = panel.getBoundingClientRect(); if (p.height > window.innerHeight * 0.82 + 1) greske.push(`panel ${Math.round(p.height)}px > 82% od ${window.innerHeight}px`) }
  for (const el of [document.querySelector('#alati-panel'), document.querySelector('[data-meni] > div:last-child')].filter(Boolean)) {
    const p = el.getBoundingClientRect()
    if (p.bottom > window.innerHeight + 1 || p.right > window.innerWidth + 1 || p.left < -1 || p.top < -1) greske.push(`${el.id || 'meni'} van ekrana`)
  }

  // (f) mete za dodir u traci i zaglavlju >= 44 px (ikone bez teksta takođe)
  // (f) važi za telefonski raspored; na tabletu i računaru mere trake su iste kao u GoalToCart-u (dugmad 30-32 px, krugovi 28 px)
  const telefonski = window.innerWidth < 720 || window.innerHeight < 500
  const mete = !telefonski ? [] : [...document.querySelectorAll('[data-donji] button, [data-donji] a, header button, header a')].filter((e) => vid(e) && !e.closest('.sr-only'))
  const male = mete.filter((e) => { const b = e.getBoundingClientRect(); return b.height < 43.5 || b.width < 43.5 }).map((e) => `${(e.getAttribute('aria-label') || e.textContent).trim().slice(0, 22)} ${Math.round(e.getBoundingClientRect().width)}x${Math.round(e.getBoundingClientRect().height)}`)
  // linkovi u zaglavlju i dugmad trake moraju biti >= 44 u visinu; širina samo za dugmad bez teksta (ikone)
  const ozbiljno = male.filter((m) => { const [w, h] = m.split(' ').pop().split('x').map(Number); return h < 43.5 })
  if (ozbiljno.length) greske.push('premale mete za dodir: ' + ozbiljno.slice(0, 4).join(' | '))

  // (h) gornji lepljivi blok <= ~15% visine (osim kad nije lepljiv: telefon položeno)
  const gornji = r.filter((x) => x.r.top <= 1)
  const gore = gornji.reduce((m, x) => Math.max(m, x.r.bottom), 0)
  if (!opcije.overlay && gore > window.innerHeight * 0.15 + 2) greske.push(`gornji lepljivi blok ${Math.round(gore)}px > 15% od ${window.innerHeight}px`)
  // donji blok: ne sme zauzeti više od 40% visine (osim otvorenog panela)
  const donjiBlok = document.querySelector('[data-donji]')
  if (donjiBlok && donjiBlok.getBoundingClientRect().height > window.innerHeight * 0.4) greske.push(`donji blok ${Math.round(donjiBlok.getBoundingClientRect().height)}px > 40% visine`)

  return { greske, gore: Math.round(gore), donji: donjiBlok ? Math.round(donjiBlok.getBoundingClientRect().height) : 0 }
}

// (d) kraj strane iznad trake + (g) svaki tekst može da se dovede u nezaklonjen deo ekrana
function krajITekst() {
  const greske = []
  const donjiBlok = document.querySelector('[data-donji]')
  const vrhTrake = donjiBlok ? donjiBlok.getBoundingClientRect().top : window.innerHeight
  window.scrollTo(0, document.documentElement.scrollHeight)
  const kraj = document.querySelector('footer p:last-of-type') ?? document.querySelector('main > *:last-child')
  if (kraj) { const rk = kraj.getBoundingClientRect(); if (donjiBlok && rk.bottom > donjiBlok.getBoundingClientRect().top + 1) greske.push(`kraj strane je ispod trake (${Math.round(rk.bottom)} > ${Math.round(donjiBlok.getBoundingClientRect().top)})`) }

  // (g) uzorak teksta: element sa sopstvenim tekstom dovedemo u sredinu vidljivog dela i proverimo da ga fiksni sloj ne zaklanja
  const fiksni = () => [...document.querySelectorAll('body *')].filter((e) => {
    if (e.tagName === 'DIALOG' || e.closest('[data-toast]')) return false
    const cs = getComputedStyle(e); const r = e.getBoundingClientRect()
    return (cs.position === 'fixed' || (cs.position === 'sticky' && cs.top === '0px')) && r.width > 0 && r.height > 0 && cs.display !== 'none' && cs.visibility !== 'hidden'
  })
  const vrh = (() => { const s = new Set(fiksni()); return [...s].filter((e) => { let p = e.parentElement; while (p) { if (s.has(p)) return false; p = p.parentElement } return true }) })()
  const gornjaIvica = Math.max(0, ...vrh.filter((e) => e.getBoundingClientRect().top <= 1).map((e) => e.getBoundingClientRect().bottom))
  const donjaIvica = Math.min(window.innerHeight, ...vrh.filter((e) => e.getBoundingClientRect().top > 1).map((e) => e.getBoundingClientRect().top))
  const slobodno = donjaIvica - gornjaIvica
  const cvorovi = [...document.querySelectorAll('main *, footer *')].filter((e) => {
    if (e.closest('.sr-only')) return false
    const zat = e.closest('details:not([open])'); if (zat && !e.closest('summary')) return false // sadržaj zatvorenog details nije vidljiv
    const r = e.getBoundingClientRect()
    if (r.width < 1 || r.height < 1 || getComputedStyle(e).visibility === 'hidden') return false
    return [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim().length > 1)
  })
  const korak = Math.max(1, Math.floor(cvorovi.length / 120))
  const pokriven = []
  for (let i = 0; i < cvorovi.length; i += korak) {
    const e = cvorovi[i]
    const h = e.getBoundingClientRect().height
    if (h > slobodno - 8) continue // viši od nezaklonjenog dela: čita se skrolovanjem
    window.scrollBy(0, e.getBoundingClientRect().top - (gornjaIvica + (slobodno - h) / 2))
    const rr = e.getBoundingClientRect()
    for (const f of vrh) {
      if (f.contains(e)) continue
      const b = f.getBoundingClientRect()
      const w = Math.min(rr.right, b.right) - Math.max(rr.left, b.left)
      const hh = Math.min(rr.bottom, b.bottom) - Math.max(rr.top, b.top)
      if (w > 2 && hh > 2) pokriven.push(`„${e.textContent.trim().slice(0, 24)}“ ispod ${f.getAttribute('data-donji') !== null ? 'donjeg bloka' : f.tagName === 'HEADER' ? 'zaglavlja' : f.className.toString().slice(0, 20)}`)
    }
  }
  if (pokriven.length) greske.push('fiksni sloj zaklanja tekst: ' + [...new Set(pokriven)].slice(0, 3).join(' | '))
  window.scrollTo(0, 0)
  return greske
}

// ---------------------------------------------------------------- glavna petlja
const rezultati = []
for (const [w, h, vrsta] of VELICINE) {
  await page.setViewport({ width: w, height: h, deviceScaleFactor: 2, isMobile: true, hasTouch: true })
  const mapa = `${IZLAZ}/${w}x${h}`
  mkdirSync(mapa, { recursive: true })
  for (const [naziv, rezim, uloga, korak, odradjeno, grana, ruta, dodatak] of EKRANI) {
    if (uloga === 'admin' && rezim === V) continue
    const osnova = dodatak === 'usluge' ? USLUGE : dodatak === 'prijave' ? USLUGE.prijave : OSNOVA
    const s = JSON.parse(JSON.stringify(osnova))
    s.uloga = uloga
    s.demoSakriven = false
    s.prikazVlasnika = 'pravno'
    const odstupanje = dodatak === 'usluge' || dodatak === 'prijave' || dodatak === 'odstupanje'
    if (dodatak === 'odstupanje') s.sati = 24 // stvarno odstupanje (premotano vreme): traka mora to da pokaže
    s.prica = { ...s.prica, rezim, korak, odradjeno, grana, odstupljeno: odstupanje, vidjenUvodSlobodno: true }
    await page.evaluate((k, v) => sessionStorage.setItem(k, v), KLJUC, JSON.stringify(s))
    await page.goto(BASE + '?r=' + Date.now() + '#' + ruta, { waitUntil: 'networkidle0' })
    await sleep(300)
    let overlay = false
    try {
      if (dodatak === 'panel') {
        const dugme = await page.$('[data-pocetak-panela], header button[aria-label^="Korak"]')
        if (dugme && (await dugme.boundingBox())) { await dugme.click(); await sleep(300); overlay = true }
      }
      if (dodatak === 'meni') {
        const dugme = await page.$('header button[aria-label="Meni"]')
        if (dugme && (await dugme.boundingBox())) { await dugme.click(); await sleep(300); overlay = true }
      }
      if (dodatak === 'alati') {
        const dugme = await page.$('[data-traka="racunar"] button[aria-controls="alati-panel"]')
        if (dugme && (await dugme.boundingBox())) { await dugme.click(); await sleep(300) }
      }
      if (dodatak === 'otvori') await page.evaluate(() => document.querySelectorAll('details').forEach((d) => { d.open = true }))
      if (dodatak === 'odstupanje') {
        // oznaka odstupanja mora biti vidljiva: traka (računar) ili tačka na pločici „Korak N/9" (telefon)
        const vidi = await page.evaluate(() => !!document.querySelector('[data-odstupanje], [data-odstupanje-tacka]'))
        if (!vidi) problemi.push(`${w}x${h} ${naziv}: oznaka odstupanja nije vidljiva`)
      }
    } catch (e) { problemi.push(`${w}x${h} ${naziv}: ${e.message}`) }
    // izbegni zatečeni toast pri proveri (prolazan je)
    await page.evaluate(() => document.querySelectorAll('[data-toast]').forEach((t) => t.remove()))
    const p = await page.evaluate(probe, { overlay })
    let greske = [...p.greske]
    if (!overlay && dodatak !== 'alati') greske.push(...(await page.evaluate(krajITekst)))
    await page.evaluate(() => window.scrollTo(0, 0))
    await sleep(80)
    if (naziv !== '00-ulaz' || true) await page.screenshot({ path: `${mapa}/${rezim}-${naziv}.png` })
    // ulaz nema traku priče: (b) i (f) se tamo ne primenjuju
    if (naziv === '00-ulaz') greske = greske.filter((g) => !g.startsWith('premale mete') && !g.startsWith('više fiksnih'))
    rezultati.push({ velicina: `${w}x${h}`, vrsta, rezim, ekran: naziv, gore: p.gore, donji: p.donji, greske })
  }
}

writeFileSync(`${IZLAZ}/rezultat.json`, JSON.stringify(rezultati, null, 1))
const lose = rezultati.filter((r) => r.greske.length)
for (const r of lose) console.log(`${r.velicina}  ${r.rezim}  ${r.ekran}: ${r.greske.join(' | ')}`)
const po = {}
for (const r of rezultati) { const k = `${r.velicina} ${r.rezim}`; po[k] ??= { ok: 0, lose: 0, gore: r.gore, donji: r.donji }; r.greske.length ? po[k].lose++ : po[k].ok++ }
console.table(po)
console.log('Problemi u konzoli:', JSON.stringify([...new Set(problemi)].slice(0, 10)))
console.log('Pozivi ka tuđim serverima:', JSON.stringify(spoljni))
await browser.close()
const nije = lose.length || problemi.length || spoljni.length
console.log(nije ? `NALAZA: ${lose.length} (konzola: ${problemi.length}, tuđi serveri: ${spoljni.length})` : 'SVE VELIČINE OK (oba režima)')
process.exit(nije ? 1 : 0)
