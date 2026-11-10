// E2E cela priča u pravom pregledaču (B7.4): Next kroz svih 9 koraka za 5 uloga, "Show me", ručne radnje sa smenom uloga,
// skok/Back/Next naspram modela, osvežavanje, Restart, "Back to story", Guided/Free, pravilo 1.6, bez spoljnih poziva i grešaka.
//
// Pokretanje:
//   npm run build && npm run preview          (jedan prozor, port 4190)
//   npm run e2e                                (drugi prozor)
import { BASE, KLJUC, izvestaj, napraviOkvir, otvori, proveravac, sleep, ucitajModule } from './_zajednicko.mjs'

const { m, zatvori } = await ucitajModule()
const { browser, page, problemi, spoljni } = await otvori({ sirina: 1280, visina: 900 })
const F = napraviOkvir(page)
const { lista, proveri } = proveravac()
const ULOGE = ['selling', 'buying', 'player', 'agent', 'financier']
const NAZIV = { selling: 'Selling club', buying: 'Buying club', player: 'Player', agent: 'Agent', financier: 'Financier' }
// Talas 1: ekrani igrača, agenta i finansijera osim P1/A1/F1 su Stub ("Coming in the next build"). To je OČEKIVANO samo u talasu 1.
// Posle talasa 2 pokreni sa E2E_TALAS=2: tada svaki Stub na putu "Show me" obara test.
const TALAS = Number(process.env.E2E_TALAS ?? 2)
const OCEKIVANI_STUBOVI = TALAS >= 2 ? new Set() : new Set(['P2', 'P3', 'P5', 'P6', 'P8', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'F2', 'F7'])
const stubovi = new Set()
const NAPOMENA = 'Demo — illustrative only, not legal or financial advice'
const BAR = '[aria-label="Demo controls"]'

const model = {
  next: (p) => m.navigacija.ciljNext(p) ?? p,
  back: (p) => m.navigacija.ciljBack(p),
  skok: (p, k) => m.navigacija.ciljSkok(p, k),
  gradi: (p) => m.reducer.izgradiStanje(p),
}
const isto = (a, b) => a && b && a.korak === b.korak && a.odradjeno === b.odradjeno && a.grana === b.grana
const trenutna = async () => {
  const s = await F.uzmi()
  return s ? { korak: s.korak, odradjeno: s.odradjeno, grana: s.grana } : null
}
const zavrsen = (p) => p.odradjeno >= m.reducer.brojRadnji(p)

async function cisto() {
  await page.goto(BASE, { waitUntil: 'networkidle0' })
  await page.evaluate(() => sessionStorage.clear())
  await page.reload({ waitUntil: 'networkidle0' })
}
async function udji(uloga, rezim = 'guided') {
  await cisto()
  await page.click(`[data-uloga="${uloga}"]`)
  if (rezim === 'free') await F.klik('Free exploration')
  await page.click('[data-enter-demo]')
  await sleep(250)
}
async function kaoUloga(uloga) {
  await F.klik(NAZIV[uloga], { unutar: BAR })
  await sleep(150)
}
async function naslovTrake() {
  return page.evaluate(() => document.querySelector('[data-naslov-koraka]')?.textContent.replace(/\s+/g, ' ').trim() ?? '')
}
async function osnovnaPravila(opis) {
  // Na svakom ekranu: oznaka DEMO i pravna napomena
  const oznaka = await page.evaluate(() => {
    const el = document.querySelector('[data-oznaka-demo]')
    return el ? el.textContent.trim() : null
  })
  proveri(`${opis}: oznaka "DEMO — fictional data"`, oznaka === 'DEMO — fictional data', oznaka)
  const t = await F.tekst()
  proveri(`${opis}: pravna napomena`, t.includes(NAPOMENA))
}

// =================================================================================== C1
await cisto()
{
  proveri('C1: ekran ulaza', (await F.ekran()) === 'C1', await F.ekran())
  const kartice = await page.$$eval('.rolecard', (e) => e.map((x) => x.textContent))
  proveri('C1: 5 kartica uloga', kartice.length === 5, kartice.length)
  proveri('C1: "Selling club" je unapred izabran', await page.$eval('[data-uloga="selling"]', (e) => e.getAttribute('aria-pressed') === 'true'))
  const t = await F.tekst()
  proveri('C1: nema polja za lozinku', (await page.$$('input[type="password"]')).length === 0)
  proveri('C1: tekst "No password needed. All data is fictional."', t.includes('No password needed. All data is fictional.'))
  await osnovnaPravila('C1')
}

// =================================================================================== A: ručna priča (prodavac, kupac + ostali), Approved
await udji('selling')
proveri('Enter demo vodi na tablu prodavca (S1)', (await F.ekran()) === 'S1', await F.ekran())
proveri('stanje posle ulaza je 1/0 Approved', isto(await trenutna(), { korak: 1, odradjeno: 0, grana: 'approved' }))

let ocekivano = { korak: 1, odradjeno: 0, grana: 'approved' }
async function radnja(opis, uloga, ekranId, ruta, tekstDugmeta, { posle = null } = {}) {
  if (uloga !== null) await kaoUloga(uloga)
  if (ruta) await F.idi(ruta)
  else if ((await F.ekran()) !== ekranId && (await F.dugme('Show me'))?.aktivno) await F.klik('Show me')
  const e = await F.ekran()
  proveri(`${opis}: ekran ${ekranId}`, e === ekranId, e)
  const d = await F.dugme(tekstDugmeta)
  proveri(`${opis}: dugme "${tekstDugmeta}" postoji i aktivno`, d?.aktivno === true, JSON.stringify(d))
  if (!d?.aktivno) return
  await F.klik(tekstDugmeta, { pocekaj: 200 })
  ocekivano = { ...ocekivano, odradjeno: ocekivano.odradjeno + 1 }
  const p = await trenutna()
  proveri(`${opis}: stanje ${ocekivano.korak}/${ocekivano.odradjeno}`, isto(p, ocekivano), JSON.stringify(p))
  const t = await F.tekst()
  proveri(`${opis}: tiha poruka "Simulated action — nothing was sent"`, t.includes('Simulated action — nothing was sent'))
  if (posle) await posle()
}
async function sledeciKorak() {
  await F.klik('Next', { unutar: BAR })
  const p = await trenutna()
  // Next iz završnog stanja vodi u početno sledećeg koraka
  const n = m.reducer.brojRadnji(ocekivano)
  proveri(`Next iz ${ocekivano.korak}/${ocekivano.odradjeno} (korak ima ${n} radnji)`, ocekivano.odradjeno >= n ? isto(p, { korak: ocekivano.korak + 1, odradjeno: 0, grana: 'approved' }) : isto(p, { ...ocekivano, odradjeno: n }), JSON.stringify(p))
  ocekivano = p
}

// pravilo 1.6 na početku: kupac još ne sme da "Revise offer"
await kaoUloga('buying')
await F.klik('Show me')
{
  const d = await F.dugme('Send offer')
  proveri('B3 korak 1: "Send offer" je neaktivno ("Done")', d && d.aktivno === false, JSON.stringify(d))
  proveri('B3 korak 1: v1 je poslata, kupac čeka prodavca', (await F.tekst()).includes('Waiting for the selling club'))
}
await kaoUloga('selling')
await F.klik('Show me')
proveri('prodavac: "Accept" nije aktivno dok je v1 (van priče)', (await F.dugme('Accept'))?.aktivno === false)

// KORAK 1
await radnja('K1 prodavac šalje kontraponudu', null, 'S3', null, 'Send counter-offer')
await radnja('K1 kupac revidira', 'buying', 'B3', null, 'Revise offer')
await radnja('K1 prodavac prihvata', 'selling', 'S3', null, 'Accept', {
  posle: async () => proveri('K1 završen: traka javi "Step 1 complete"', (await F.tekst()).includes('Step 1 complete')),
})
await sledeciKorak()
// KORAK 2
await radnja('K2 agent potvrđuje uslove', 'agent', 'A3', null, 'Confirm agreed terms')
await radnja('K2 kupac potvrđuje uslove', 'buying', 'B4', null, 'Confirm terms')
await sledeciKorak()
// KORAK 3
await radnja('K3 provera pravila', 'selling', 'S5', null, 'Simulate: finish the checks')
proveri('S5: 6 of 6 checks passed', (await F.tekst()).includes('6 of 6 checks passed'))
await sledeciKorak()
// KORAK 4
await radnja('K4 prodavac potpisuje', 'selling', 'S6', null, 'Sign with qualified e-signature')
await radnja('K4 kupac potpisuje', 'buying', 'B6', null, 'Sign with qualified e-signature')
await radnja('K4 igrač potpisuje', 'player', 'P5', null, 'Sign with qualified e-signature')
await radnja('K4 agent potpisuje', 'agent', 'A5', null, 'Sign with qualified e-signature')
await sledeciKorak()
// KORAK 5
await radnja('K5 kupac šalje na odobrenje', 'buying', 'B7', null, 'Send for approval')
await F.klik('View account approvals')
await radnja('K5 Finance odobrava', null, 'B10', null, 'Approve as Finance')
await radnja('K5 Legal odobrava', null, 'B10', null, 'Approve as Legal')
await radnja('K5 uplata potvrđena', null, 'B7', '/buying/secure-funds', 'Simulate: escrow partner confirms the deposit')
await sledeciKorak()
// KORAK 6
await radnja('K6 kupac unosi u TMS', 'buying', 'B8', null, 'Mark as entered in the TMS')
await radnja('K6 prodavac potvrđuje unos', 'selling', 'S8', null, 'Mark as entered in the TMS')
await sledeciKorak()
// KORAK 7
await radnja('K7 isplata', 'selling', 'S9', null, 'Simulate: payout executes')
{
  const t = await F.tekst()
  proveri('S9: neto prodavca EUR 1,509,000', t.includes(m.format.eur(m.racun.isplata.prodavacNeto)))
  proveri('S9: provizija agenta se ne prikazuje prodavcu', !t.includes(m.format.eur(m.racun.provizijaAgenta)))
}
await sledeciKorak()
// KORAK 8
await radnja('K8 prodavac nudi potraživanje', 'selling', 'S11', '/selling/financing', 'Offer receivable')
await radnja('K8 finansijer šalje ponudu', 'financier', 'F4', '/financier/receivables/main/offer', 'Send offer')
await radnja('K8 prodavac prihvata ponudu', 'selling', 'S11', '/selling/financing', 'Accept')
proveri('S11: prikazana je ponuda EUR 2,535,000', (await F.tekst()).includes(m.format.eur(m.racun.avans)))
await radnja('K8 Finance odobrava', null, 'S12', '/selling/approvals', 'Approve as Finance')
await radnja('K8 Legal odobrava', null, 'S12', null, 'Approve as Legal')
await radnja('K8 kupac šalje ratu 2 na odobrenje', 'buying', 'B9', '/buying/payments', 'Fund installment 2 into escrow')
await F.klik('View account approvals')
await radnja('K8 rata 2: Finance odobrava', null, 'B10', null, 'Approve as Finance')
await radnja('K8 rata 2: Legal odobrava', null, 'B10', null, 'Approve as Legal')
await sledeciKorak() // 8 -> 9/0
await sledeciKorak() // 9/0 -> 9/završno
{
  const p = await trenutna()
  proveri('kraj priče: 9/završno', isto(p, { korak: 9, odradjeno: 1, grana: 'approved' }), JSON.stringify(p))
  const t = await F.tekst()
  proveri('kraj priče: "End of story — Restart or explore"', t.includes('End of story — Restart or explore'))
  const dn = await F.dugme('Next', { sel: `${BAR} button` })
  proveri('kraj priče: Next je isključen', dn && dn.aktivno === false, JSON.stringify(dn))
}

// =================================================================================== B: skok / Back / Next naspram modela
await udji('selling')
{
  let p = { korak: 1, odradjeno: 0, grana: 'approved' }
  const koraci = [['dot', 5], ['next'], ['back'], ['back'], ['dot', 8], ['next'], ['next'], ['back'], ['dot', 3], ['back'], ['back'], ['back'], ['dot', 9], ['next'], ['next'], ['back']]
  for (const [akcija, k] of koraci) {
    if (akcija === 'dot') { await F.klik(String(k), { unutar: BAR, sel: '.dots .d' }); p = model.gradi(model.skok(p, k)) }
    if (akcija === 'next') { if ((await F.dugme('Next', { sel: `${BAR} button` }))?.aktivno) await F.klik('Next', { unutar: BAR }); p = model.gradi(model.next(p)) }
    if (akcija === 'back') { if ((await F.dugme('Back', { sel: `${BAR} button` }))?.aktivno) await F.klik('Back', { unutar: BAR }); p = model.gradi(model.back(p)) }
    const ui = await trenutna()
    proveri(`skok/Next/Back: ${akcija}${k ? ' ' + k : ''} -> ${p.korak}/${p.odradjeno}`, isto(ui, p), JSON.stringify(ui))
  }
}

// =================================================================================== C: Next kroz svih 9 koraka, svaka uloga (Approved)
for (const uloga of ULOGE) {
  await udji(uloga)
  for (let k = 1; k <= 9; k++) {
    const pocetno = { korak: k, odradjeno: 0, grana: 'approved' }
    const n = m.reducer.brojRadnji(pocetno)
    const cel = m.matrica.celija(k, uloga, 'approved')
    // početno stanje + Show me
    await F.klik('Show me')
    await sleep(150)
    const e = await F.ekran()
    proveri(`${uloga} korak ${k}: Show me otvara ${cel.ekrani[0]}`, e === cel.ekrani[0], e)
    proveri(`${uloga} korak ${k}: ekran koraka nije "Not started yet"`, (await F.stanjeEkrana()) !== 'nije-pocelo', await F.stanjeEkrana())
    if (await page.evaluate(() => !!document.querySelector('[data-stub]'))) stubovi.add(e)
    const naslov = await naslovTrake()
    proveri(`${uloga} korak ${k}: traka "Step ${k} of 9"`, naslov.startsWith(`Step ${k} of 9 ·`), naslov)
    proveri(`${uloga} korak ${k}: demo datum ${m.datumi.demoDatum(k, 'approved', false)}`, naslov.includes(`Demo date: ${m.datumi.demoDatum(k, 'approved', false)}`), naslov)
    const nema = await F.dugme('You left the story screen', { sadrzi: true, sel: `${BAR} span` })
    proveri(`${uloga} korak ${k}: posle Show me nema "You left the story screen"`, nema === null)
    await osnovnaPravila(`${uloga} korak ${k}`)
    // Next -> završno
    await F.klik('Next', { unutar: BAR })
    const kraj = await trenutna()
    proveri(`${uloga} korak ${k}: Next daje završno stanje`, isto(kraj, { korak: k, odradjeno: n, grana: 'approved' }), JSON.stringify(kraj))
    const naslov2 = await naslovTrake()
    proveri(`${uloga} korak ${k}: završni datum ${m.datumi.demoDatum(k, 'approved', true)}`, naslov2.includes(`Demo date: ${m.datumi.demoDatum(k, 'approved', true)}`), naslov2)
    if (k < 9) await F.klik('Next', { unutar: BAR })
  }
}

{
  const neocekivani = [...stubovi].filter((e) => !OCEKIVANI_STUBOVI.has(e))
  proveri(`Stub ekrani na putu "Show me" su samo oni očekivani za talas ${TALAS} (nađeni: ${[...stubovi].join(', ') || 'nijedan'})`, neocekivani.length === 0, neocekivani.join(', '))
  if (TALAS === 1) console.log(`Napomena: talas 1, očekivani Stub ekrani: ${[...stubovi].join(', ')}`)
}

// =================================================================================== D: osvežavanje usred koraka
await udji('buying')
await F.klik('5', { unutar: BAR, sel: '.dots .d' })
await F.klik('Show me')
await F.klik('Send for approval')
{
  const pre = await trenutna()
  const rutaPre = await F.ruta()
  await page.reload({ waitUntil: 'networkidle0' })
  const posle = await trenutna()
  proveri('osvežavanje ne gubi mesto u priči', isto(pre, posle), JSON.stringify([pre, posle]))
  proveri('osvežavanje vraća isti ekran', (await F.ruta()) === rutaPre, await F.ruta())
  proveri('posle osvežavanja je i dalje kupac', (await F.ekran()) === 'B7', await F.ekran())
}

// =================================================================================== E: Restart sa potvrdom
{
  await F.klik('Restart demo', { unutar: BAR })
  await sleep(200)
  proveri('Restart traži potvrdu', await page.evaluate(() => !!document.querySelector('dialog[open]')))
  await F.klik('Cancel', { sel: 'dialog button' })
  await sleep(150)
  proveri('Cancel ne menja stanje', isto(await trenutna(), { korak: 5, odradjeno: 1, grana: 'approved' }), JSON.stringify(await trenutna()))
  await F.klik('Restart demo', { unutar: BAR })
  await sleep(200)
  await F.klik('Yes', { sel: 'dialog button' })
  await sleep(250)
  proveri('Restart vraća 1/početno', isto(await trenutna(), { korak: 1, odradjeno: 0, grana: 'approved' }), JSON.stringify(await trenutna()))
  proveri('posle Restart-a uloga ostaje ista (kupac)', (await F.ekran()) === 'B1', await F.ekran())
}

// =================================================================================== F: "Back to story"
{
  await F.klik('3', { unutar: BAR, sel: '.dots .d' })
  proveri('na tabli (izvan ekrana koraka) traka kaže "You left the story screen"', (await F.tekst()).includes('You left the story screen'))
  await F.klik('Back to story', { unutar: BAR })
  proveri('"Back to story" vraća na ekran koraka', (await F.ekran()) === 'B5', await F.ekran())
  proveri('oznaka "You left the story screen" nestaje', !(await F.tekst()).includes('You left the story screen'))
  await F.klik('Dashboard', { sel: '.sidenav a' })
  proveri('slobodno klikanje ne menja korak', isto(await trenutna(), { korak: 3, odradjeno: 0, grana: 'approved' }))
}

// =================================================================================== G: Guided / Free, pravilo 1.6 u slobodnom režimu
{
  await F.klik('Free', { unutar: BAR })
  await sleep(200)
  proveri('Free: red sa pričom nestaje', await page.evaluate(() => !document.querySelector('.demobar .story')))
  proveri('Free: ostaje "Step 3 of 9"', (await naslovTrake()).startsWith('Step 3 of 9'), await naslovTrake())
  const t = await F.tekst()
  proveri('Free: jednokratna poruka o slobodnom istraživanju', t.includes("You're now exploring freely"))
  await F.klik('Got it')
  proveri('poruka je jednokratna (nestaje)', !(await F.tekst()).includes("You're now exploring freely"))
  // pravilo 1.6: ekran budućeg koraka je "Not started yet", a dugme van koraka je neaktivno uz razlog
  await F.idi('/buying/signing')
  proveri('B6 u koraku 3: "Not started yet"', (await F.stanjeEkrana()) === 'nije-pocelo', await F.stanjeEkrana())
  proveri('prazno stanje kaže u kom koraku ekran nastaje', (await F.tekst()).includes('step 4'))
  await F.idi('/buying/offers')
  const d = await F.dugme('Revise offer')
  proveri('B3 u koraku 3: radnja iz prošlog koraka nije prikazana kao aktivna', !d || d.aktivno === false)
  await F.klik('Guided', { unutar: BAR })
}

// =================================================================================== H: nepoznata ruta
{
  await F.idi('/selling/nema-takve-strane')
  proveri('nepoznata ruta vodi na tablu uloge', (await F.ekran()) === 'S1', await F.ekran())
}

// =================================================================================== D2: ciljane provere stanja (dorada po nalazima kontrolora)
{
  // Postavlja stanje u sessionStorage, osvežava (aplikacija ga čita pri učitavanju), pa otvara rutu
  const postavi = async (korak, odr, rezim, uloga, ruta) => {
    await page.goto(BASE, { waitUntil: 'networkidle0' })
    await page.evaluate((k, kor, o, r) => sessionStorage.setItem(k, JSON.stringify({ verzija: 1, korak: kor, odradjeno: o, grana: 'approved', rezim: r, vidjenUvodFree: true })), KLJUC, korak, odr, rezim)
    await page.reload({ waitUntil: 'networkidle0' })
    await F.idi(ruta)
    await sleep(150)
    return F.tekst()
  }
  const eur = m.format.eur
  const R = m.racun
  // 1) pre prihvatanja ponude nema konačnih uslova v3 ni obaveza
  for (const [uloga, ruta] of [['selling', '/selling/dashboard'], ['buying', '/buying/dashboard'], ['selling', '/selling/deal'], ['buying', '/buying/deal']]) {
    for (const o of [0, 1, 2]) {
      const t = await postavi(1, o, 'guided', uloga, ruta)
      // uplata (1,641,000) i obaveze se ne znaju pre prihvatanja; konačni uslovi (v3) su samo predlog dok ne dođe "Accept"
      proveri(`pre prihvatanja (1/${o}) ${ruta}: nema uplate ni obaveza`, !t.includes(eur(R.uplataKupca)) && !/Amount you owe\s*EUR/.test(t), ruta)
      proveri(`pre prihvatanja (1/${o}) ${ruta}: piše da se pregovara`, /under negotiation/i.test(t), ruta)
      if (o < 2) proveri(`pre prihvatanja (1/${o}) ${ruta}: nema uslova verzije v3`, !t.includes(eur(R.fiksniUkupno)) && !t.includes('1,600,000'), ruta)
    }
  }
  {
    const t = await postavi(1, 0, 'guided', 'buying', '/buying/dashboard')
    proveri('B1 pre prihvatanja: "Under negotiation"', t.includes('Under negotiation') && t.includes('Not agreed yet'))
    const p = await postavi(1, 0, 'guided', 'player', '/player/home')
    proveri('P1 pre prihvatanja: udeo igrača još nije utvrđen', !p.includes(eur(R.udeoUkupno)) && p.includes('Not agreed yet'))
  }
  // 2) kupac, korak 9: rata 3 je nepodmirena; posle isplate nema "secured"
  {
    const t = await postavi(9, 0, 'guided', 'buying', '/buying/dashboard')
    proveri('B1 korak 9: rata 3 se računa kao nepodmirena (ne "Nothing due now")', !t.includes('Nothing due now') && /overdue 14 days/.test(t), t.slice(0, 200))
    const s = await postavi(9, 0, 'guided', 'selling', '/selling/dashboard')
    proveri('S1 korak 9: kašnjenje i "Open" se ne protivreče (rate ustupljene finansijeru)', /Overdue 14 days · assigned/.test(s) && s.includes(eur(0)), '')
    const p7 = await postavi(7, 1, 'guided', 'buying', '/buying/dashboard')
    proveri('B1 posle isplate: nema "secured", escrow je "Released"', !p7.includes(`${eur(R.uplataKupca)} secured`) && p7.includes('Released'))
  }
  // 5) rok na 8/završno je rata 3
  {
    const t = await postavi(8, 8, 'guided', 'selling', '/selling/deal')
    proveri('S2 na 8/završno: sledeći rok je rata 3', t.includes(m.datumi.DATUM.rata3), '')
  }
  // 10) "Guided story" se ne prikazuje u Free režimu
  {
    const t = await postavi(3, 0, 'free', 'selling', '/selling/dashboard')
    proveri('Free: nema čipa "Guided story"', !t.includes('Guided story'))
    const g = await postavi(3, 0, 'guided', 'selling', '/selling/dashboard')
    proveri('Guided: čip "Guided story" postoji', g.includes('Guided story'))
  }
  // 10) osvežavanje na #/about ne menja ulogu
  {
    await udji('buying')
    await F.klik('About this demo')
    proveri('/about je otvoren', (await F.ekran()) === 'C3', await F.ekran())
    await page.reload({ waitUntil: 'networkidle0' })
    const naslov = await page.evaluate(() => document.querySelector('.whoami')?.textContent ?? '')
    proveri('osvežavanje na #/about ne menja ulogu (ostaje Buying club)', naslov.includes('Buying club'), naslov)
  }
  // 10) panel na telefonu se zatvara kad prozor pređe 720 px
  {
    await page.setViewport({ width: 360, height: 640, deviceScaleFactor: 1, isMobile: true, hasTouch: true })
    await udji('selling')
    await page.click('[data-pocetak-panela]')
    await sleep(150)
    proveri('panel je otvoren na telefonu', !!(await page.$('.sheet')))
    await page.setViewport({ width: 1280, height: 900, deviceScaleFactor: 1 })
    await sleep(250)
    proveri('panel se zatvara kad prozor pređe 720 px', !(await page.$('.sheet')))
  }
  // 9) telefon: uloga i demo datum u zaglavlju
  {
    await page.setViewport({ width: 360, height: 640, deviceScaleFactor: 1, isMobile: true, hasTouch: true })
    const t = await postavi(4, 0, 'guided', 'player', '/player/home')
    const gore = await page.evaluate(() => document.querySelector('[data-uloga-zaglavlje]')?.getBoundingClientRect().bottom ?? 9999)
    proveri('telefon: uloga i demo datum vidljivi u zaglavlju', gore < 120 && t.includes(`Player · Demo date ${m.datumi.demoDatum(4, 'approved', false)}`), `${gore}`)
    await page.setViewport({ width: 1280, height: 900, deviceScaleFactor: 1 })
  }
}

// =================================================================================== D3: talas 2, finansijer živ kroz ceo korak 8, igrač i agent
{
  const postavi = async (korak, odr, uloga, ruta) => {
    await page.goto(BASE, { waitUntil: 'networkidle0' })
    await page.evaluate((k, kor, o) => sessionStorage.setItem(k, JSON.stringify({ verzija: 1, korak: kor, odradjeno: o, grana: 'approved', rezim: 'guided', vidjenUvodFree: true })), KLJUC, korak, odr)
    await page.reload({ waitUntil: 'networkidle0' })
    await F.idi(ruta)
    await sleep(150)
    return F.tekst()
  }
  const eur = m.format.eur
  const R = m.racun
  let t8 = await postavi(8, 0, 'financier', '/financier/receivables')
  proveri('F2 pre ponude: samo dva sporedna potraživanja', !(await page.$('[data-potrazivanje="glavno"]')) && t8.includes('Overview only'))
  t8 = await postavi(8, 0, 'financier', '/financier/receivables/main')
  proveri('F3 pre ponude: "Not offered yet"', t8.includes('Nothing for you at this step'))
  // posle ponude prodavca (8/1): F2 -> F3 -> F4 -> Send offer
  await postavi(8, 1, 'financier', '/financier/receivables')
  proveri('F2: glavno potraživanje je vidljivo, nominal ' + eur(R.potrazivanje), (await F.tekst()).includes(eur(R.potrazivanje)) && !!(await page.$('[data-potrazivanje="glavno"]')))
  await F.klik('FK Dunavac Novi Rad', { sel: 'a' })
  proveri('F2 -> F3 (detalj)', (await F.ekran()) === 'F3', await F.ekran())
  const t3 = await F.tekst()
  proveri('F3: rate 1,330,000, dužnik i "What you do not see"', t3.includes(eur(R.potrazivanjePoRati[0])) && t3.includes('Royal Verdane SC') && t3.includes('What you do not see'))
  await F.klik('Make an offer', { sel: 'a' })
  proveri('F3 -> F4', (await F.ekran()) === 'F4', await F.ekran())
  // vrednosti polja nisu deo innerText-a, pa se čitaju posebno
  const t4 = (await F.tekst()) + ' ' + (await page.$$eval('input', (e) => e.map((x) => x.value).join(' ')))
  proveri('F4: avans, popust i ilustrativan prinos', t4.includes(eur(R.avans)) && t4.includes(eur(R.popust)) && /8\.5% \(illustrative\)/.test(t4), t4.slice(0, 300))
  await F.klik('Send offer', { pocekaj: 200 })
  proveri('F4: Send offer pomera priču 8/2', isto(await trenutna(), { korak: 8, odradjeno: 2, grana: 'approved' }), JSON.stringify(await trenutna()))
  await F.klik('View offer status', { sel: 'a' })
  proveri('F5: ponuda poslata, čeka prodavca', (await F.ekran()) === 'F5' && (await F.tekst()).includes('Waiting for the seller to reply'))
  await postavi(8, 3, 'financier', '/financier/offers')
  proveri('F5 posle prihvatanja: odobrenja 0 of 2', (await F.tekst()).includes('0 of 2 approvals at the seller'))
  await postavi(8, 5, 'financier', '/financier/offers')
  proveri('F5 posle odobrenja: prihvaćeno i dodeljeno', (await F.tekst()).includes('funds sent from your account (simulated)'))
  await F.klik('View position', { sel: 'a' })
  proveri('F5 -> F6', (await F.ekran()) === 'F6', await F.ekran())
  const t6 = await F.tekst()
  proveri('F6: nominal, avans i razlika', t6.includes(eur(R.avans)) && t6.includes(eur(R.potrazivanje)) && t6.includes(eur(R.popust)))
  proveri('F6: rata A je Scheduled pre isplate', await page.evaluate(() => document.querySelector('[data-pozicija-rata="1"]')?.textContent.includes('Scheduled') ?? false))
  await postavi(8, 8, 'financier', '/financier/positions')
  proveri('F6: rata A je Paid posle finansiranja rate 2', await page.evaluate(() => document.querySelector('[data-pozicija-rata="1"]')?.textContent.includes('Paid') ?? false))
  await postavi(9, 0, 'financier', '/financier/preview')
  proveri('F7 korak 9: rata B kasni 14 dana', /overdue \(14 days\)/.test(await F.tekst()))
  await postavi(9, 1, 'financier', '/financier/preview')
  proveri('F7 završno: "Evidence pack (process step)"', (await F.tekst()).includes('Evidence pack (process step)'))
  // finansijer nikad ne vidi igrača (ni na novim ekranima)
  for (const r of ['/financier/receivables', '/financier/receivables/main', '/financier/receivables/main/offer', '/financier/offers', '/financier/positions', '/financier/preview']) {
    const tx = await postavi(9, 1, 'financier', r)
    proveri('finansijer ' + r + ': nema igrača ni agenta', !/Vranešević|Luka|Savić/.test(tx), r)
  }
  // igrač: udeo i rokovi, ne uslovi dogovora
  let tp = await postavi(8, 8, 'player', '/player/share')
  proveri('P3: udeo 220,000 i rate udela, bez uslova dogovora', tp.includes(eur(R.udeoUkupno)) && tp.includes(eur(R.udeoPoRati[1])) && !tp.includes(eur(R.fiksniUkupno)) && !tp.includes(eur(R.provizijaAgenta)))
  tp = await postavi(7, 1, 'player', '/player/receipt')
  proveri('P6: potvrda isplate i račun ••4821', tp.includes('Paid on ' + m.datumi.DATUM.isplata) && tp.includes('4821'))
  tp = await postavi(4, 0, 'player', '/player/documents')
  proveri('P5: 0 of 2 documents signed', tp.includes('0 of 2 documents signed'))
  tp = await postavi(9, 0, 'player', '/player/exception')
  proveri('P8: kašnjenje i što-ako primer', tp.includes('Installment 3 delayed') && tp.includes('What-if example'))
  tp = await postavi(2, 2, 'player', '/player/medical')
  proveri('P4: medicinski prošao', tp.includes('Passed'))
  // agent: provizija
  let ta = await postavi(7, 1, 'agent', '/agent/commission')
  proveri('A4: provizija ' + eur(R.provizijaAgenta) + ' isplaćena', ta.includes(eur(R.provizijaAgenta)) && ta.includes('Paid on ' + m.datumi.DATUM.isplata))
  ta = await postavi(5, 4, 'agent', '/agent/commission')
  proveri('A4: provizija je u escrow-u posle koraka 5', ta.includes('Deposited by Royal Verdane SC'))
  ta = await postavi(3, 1, 'agent', '/agent/licence')
  proveri('A6: provera licence završena', ta.includes('Licence check completed'))
  ta = await postavi(9, 1, 'agent', '/agent/exception')
  proveri('A7: što-ako primer', ta.includes('What-if example'))
}

// =================================================================================== R: talas 3, račva i cela grana Rejected
{
  const eur = m.format.eur
  const R = m.racun
  const rej = (k, o) => ({ korak: k, odradjeno: o, grana: 'rejected' })
  // --- račva na koraku 6, ručna radnja, povraćaj (kupac i prodavac)
  await udji('buying')
  await F.klik('5', { unutar: BAR, sel: '.dots .d' })
  proveri('račva: na koraku 5 nema prekidača "Registration result"', !(await page.$('[data-racva]')))
  await F.klik('6', { unutar: BAR, sel: '.dots .d' })
  proveri('račva: na koraku 6 postoji prekidač "Registration result"', !!(await page.$('[data-racva]')))
  proveri('račva: dugme koraka 6 ima oznaku račve', await page.evaluate(() => /what-if branch/.test([...document.querySelectorAll('.dots .d')].find((b) => b.textContent === '6')?.getAttribute('aria-label') ?? '')))
  await F.klik('Rejected', { unutar: BAR })
  proveri('račva: "Rejected" daje 6/0 u grani Rejected', isto(await trenutna(), rej(6, 0)), JSON.stringify(await trenutna()))
  proveri('grana Rejected: koraci 7-9 su "Replaced by refund", "Closed", "Refund confirmed"', await page.evaluate(() => ['Replaced by refund', 'Closed: no installments', 'Refund confirmed'].every((n) => [...document.querySelectorAll('.dots .d')].some((b) => (b.getAttribute('aria-label') ?? '').includes(n.replace(':', ' —')) || (b.getAttribute('title') ?? '').includes(n.replace(':', ' —'))))))
  await F.klik('Show me')
  ocekivano = rej(6, 0)
  await radnja('R6 kupac unosi u TMS', null, 'B8', null, 'Mark as entered in the TMS')
  await radnja('R6 prodavac potvrđuje unos', 'selling', 'S8', null, 'Mark as entered in the TMS')
  ocekivano = rej(6, 2)
  proveri('R6: ITC je odbijen ("ITC refused")', (await F.tekst()).includes('ITC refused'))
  await F.klik('Next', { unutar: BAR })
  proveri('R6: Next vodi na 7/početno u grani Rejected', isto(await trenutna(), rej(7, 0)), JSON.stringify(await trenutna()))
  await F.klik('Show me')
  proveri('R7: Show me prodavca otvara S13', (await F.ekran()) === 'S13', await F.ekran())
  let tx = await F.tekst()
  proveri('R7: S13 ne piše "No exceptions" (povraćaj je u toku)', !tx.includes('No exceptions') && tx.includes('Refund initiated'))
  proveri('R7: banner grane i dugme "Back to the main story" na ekranu', !!(await page.$('[data-racva-traka]')))
  await F.klik('Simulate: escrow partner returns the funds', { pocekaj: 200 })
  proveri('R7: povraćaj izvršen 7/1', isto(await trenutna(), rej(7, 1)), JSON.stringify(await trenutna()))
  proveri('R7: "Funds returned to the buyer"', (await F.tekst()).includes('Funds returned to the buyer'))
  await F.idi('/selling/security')
  proveri('R7: S7 kaže "Returned to the buyer"', (await F.tekst()).includes('Returned to the buyer'))
  await kaoUloga('buying')
  await F.idi('/buying/secure-funds')
  tx = await F.tekst()
  proveri('R7: B7 pokazuje povraćaj ' + eur(R.povracaj), tx.includes(eur(R.povracaj)) && tx.includes('Returned'))
  await F.klik('Next', { unutar: BAR })
  await F.klik('Show me')
  proveri('R8: kupac -> B2 "Closed"', (await F.ekran()) === 'B2' && (await F.tekst()).includes('no installments or bonuses'), await F.ekran())
  await F.klik('Next', { unutar: BAR })
  await F.klik('Next', { unutar: BAR })
  proveri('R9: završno stanje 9/1 u grani Rejected', isto(await trenutna(), rej(9, 1)), JSON.stringify(await trenutna()))
  // --- sve uloge kroz korake 6-9 grane Rejected (Show me, ekran po tabeli 4.0, bez Stub-a)
  for (const uloga of ULOGE) {
    // finansijer nema račvu: prezenter je bira iz druge uloge pa menja ulogu
    await udji(uloga === 'financier' ? 'selling' : uloga)
    await F.klik('6', { unutar: BAR, sel: '.dots .d' })
    await F.klik('Rejected', { unutar: BAR })
    if (uloga === 'financier') await F.klik('Financier', { unutar: BAR })
    for (let k = 6; k <= 9; k++) {
      const n = m.reducer.brojRadnji({ korak: k, grana: 'rejected' })
      const cel = m.matrica.celija(k, uloga, 'rejected')
      await F.klik('Show me')
      await sleep(120)
      const e = await F.ekran()
      proveri(`Rejected ${uloga} korak ${k}: Show me otvara ${cel.ekrani[0]}`, e === cel.ekrani[0], e)
      proveri(`Rejected ${uloga} korak ${k}: ekran nije Stub`, !(await page.evaluate(() => !!document.querySelector('[data-stub]'))))
      proveri(`Rejected ${uloga} korak ${k}: ekran nije "Not started yet"`, (await F.stanjeEkrana()) !== 'nije-pocelo', await F.stanjeEkrana())
      const naslov = await naslovTrake()
      proveri(`Rejected ${uloga} korak ${k}: demo datum ${m.datumi.demoDatum(k, 'rejected', false)}`, naslov.includes(`Demo date: ${m.datumi.demoDatum(k, 'rejected', false)}`), naslov)
      if (k >= 7 && (uloga === 'selling' || uloga === 'buying')) proveri(`Rejected ${uloga} korak ${k}: nema "No exceptions" tamo gde je povraćaj`, !(await F.tekst()).includes('No exceptions') || e === 'S2' || e === 'B2')
      await osnovnaPravila(`Rejected ${uloga} korak ${k}`)
      if (n === 0 && k < 9) await F.klik('Next', { unutar: BAR }) // korak bez radnji: početno je ujedno završno
      if (n > 0) {
        await F.klik('Next', { unutar: BAR })
        proveri(`Rejected ${uloga} korak ${k}: Next daje završno stanje`, isto(await trenutna(), rej(k, n)), JSON.stringify(await trenutna()))
        const naslov2 = await naslovTrake()
        proveri(`Rejected ${uloga} korak ${k}: završni datum ${m.datumi.demoDatum(k, 'rejected', true)}`, naslov2.includes(`Demo date: ${m.datumi.demoDatum(k, 'rejected', true)}`), naslov2)
        if (k < 9) await F.klik('Next', { unutar: BAR })
      }
    }
  }
  // --- igračeva i agentova linija u grani Rejected: tačka 4 "Not completed", 5 i 6 "Not applicable"
  {
    const postavi = async (uloga, k, o, ruta) => {
      await page.goto(BASE, { waitUntil: 'networkidle0' })
      await page.evaluate((key, kor, od) => sessionStorage.setItem(key, JSON.stringify({ verzija: 1, korak: kor, odradjeno: od, grana: 'rejected', rezim: 'guided', vidjenUvodFree: true })), KLJUC, k, o)
      await page.reload({ waitUntil: 'networkidle0' })
      await F.idi(ruta)
      await sleep(150)
      return F.tekst()
    }
    for (const ruta of ['/player/home', '/agent/deal']) {
      const t = await postavi('x', 8, 0, ruta)
      proveri(`${ruta} Rejected: tačka 4 "Not completed", tačke 5 i 6 "Not applicable"`, t.includes('Not completed') && (t.match(/Not applicable/g) ?? []).length >= 2, '')
    }
    const tp = await postavi('x', 7, 1, '/player/exception')
    proveri('P8 Rejected: "The transfer did not go through"', tp.includes('The transfer did not go through'))
    const ta = await postavi('x', 7, 1, '/agent/exception')
    proveri('A7 Rejected: "Commission not payable"', ta.includes('Commission not payable'))
    const tb = await postavi('x', 7, 1, '/buying/exceptions')
    proveri('B11 Rejected: povraćaj ' + eur(R.povracaj) + ' i bez naplate naknada', tb.includes(eur(R.povracaj)) && tb.includes('Platform fees would not be charged'))
    const tf = await postavi('x', 8, 0, '/financier/dashboard')
    proveri('F1 Rejected: neutralno, isti tekst kao u Approved, bez ishoda', tf.includes('No receivable has been offered to you yet') && !/refund|refus|rejected|what-if/i.test(tf))
    const t1 = await postavi('x', 8, 0, '/selling/dashboard')
    proveri('S1 Rejected: nema rata ni bonusa', t1.includes('Not applicable: registration refused'))
  }
  // --- skok pre koraka 6 vraća granu na neodlučenu; "Back to the main story"
  await udji('selling')
  await F.klik('6', { unutar: BAR, sel: '.dots .d' })
  await F.klik('Rejected', { unutar: BAR })
  await F.klik('8', { unutar: BAR, sel: '.dots .d' })
  proveri('skok na 8 u grani Rejected zadržava granu', isto(await trenutna(), rej(8, 0)), JSON.stringify(await trenutna()))
  await F.klik('Back to the main story', { unutar: BAR })
  proveri('"Back to the main story" vraća 6/0 u Approved', isto(await trenutna(), { korak: 6, odradjeno: 0, grana: 'approved' }), JSON.stringify(await trenutna()))
  await F.klik('Rejected', { unutar: BAR })
  await F.klik('1', { unutar: BAR, sel: '.dots .d' })
  proveri('skok na korak 1 vraća granu na neodlučenu (Approved)', isto(await trenutna(), { korak: 1, odradjeno: 0, grana: 'approved' }), JSON.stringify(await trenutna()))
  proveri('skok na korak 1 iz Rejected: poruka "Branch reset"', (await F.tekst()).includes('Branch reset: choose Approved or Rejected again at step 6'))
  // klik na već izabranu granu ne menja stanje
  await F.klik('6', { unutar: BAR, sel: '.dots .d' })
  await F.klik('Rejected', { unutar: BAR })
  const pre = JSON.stringify(await trenutna())
  await F.klik('Rejected', { unutar: BAR })
  proveri('klik na već izabranu granu ne menja stanje', JSON.stringify(await trenutna()) === pre, pre)
  // finansijer: nema račve, a pre koraka 8 ima dugme "Jump to step 8"
  await udji('financier')
  await F.klik('6', { unutar: BAR, sel: '.dots .d' })
  proveri('finansijer: nema prekidača "Registration result" na koraku 6', !(await page.$('[data-racva]')))
  proveri('finansijer na koraku 6: "Your part starts at step 8" u traci i na ekranu', (await F.tekst()).split('Your part starts at step 8').length >= 3)
  await F.klik('Jump to step 8', { unutar: BAR })
  proveri('finansijer: "Jump to step 8" vodi na korak 8', (await trenutna()).korak === 8, JSON.stringify(await trenutna()))
  await udji('selling')
  // --- Free režim i telefon: prekidač je dostupan
  await F.klik('6', { unutar: BAR, sel: '.dots .d' })
  await F.klik('Free', { unutar: BAR })
  proveri('Free: prekidač "Registration result" na koraku 6', !!(await page.$('[data-racva]')))
  await page.setViewport({ width: 360, height: 640, deviceScaleFactor: 1, isMobile: true, hasTouch: true })
  await page.click('.step-pill-top')
  await sleep(150)
  proveri('telefon: panel na koraku 6 ima prekidač "Registration result"', !!(await page.$('.sheet [data-racva]')))
  await F.klik('Rejected', { unutar: '.sheet' })
  await sleep(150)
  proveri('telefon: Rejected iz panela', isto(await trenutna(), rej(6, 0)), JSON.stringify(await trenutna()))
  await page.setViewport({ width: 1280, height: 900, deviceScaleFactor: 1 })
}

// =================================================================================== K: dostupnost klikom (bez kucanja adrese)
// Polazi se od table uloge i prati se SAMO linkovi koje ekran stvarno nudi (navigacija, kartice transfera, dugmad-linkovi, tabele).
// Svaki ekran uloge (49 + Club profile + C2) mora biti dostupan. Proba se u više stanja priče, jer neki linkovi zavise od stanja.
{
  const dostupniPoUlozi = {}
  for (const uloga of ULOGE) {
    const nadjeni = new Set()
    for (const [k, o, grana] of [[8, 1, 'approved'], [9, 1, 'approved'], [4, 2, 'approved'], [7, 1, 'rejected']]) {
      await page.goto(BASE, { waitUntil: 'networkidle0' })
      await page.evaluate((key, kor, od, g) => sessionStorage.setItem(key, JSON.stringify({ verzija: 1, korak: kor, odradjeno: od, grana: g, rezim: 'free', vidjenUvodFree: true })), KLJUC, k, o, grana)
      await page.reload({ waitUntil: 'networkidle0' })
      const pocetak = '/' + m.rute.meta(m.rute.TABLA[uloga]).putanja
      const red = [pocetak]
      const videno = new Set()
      while (red.length) {
        const r = red.pop()
        if (videno.has(r)) continue
        videno.add(r)
        await F.idi(r)
        const e = await F.ekran()
        if (e) nadjeni.add(e)
        const linkovi = await page.evaluate(() => [...document.querySelectorAll('a[href^="#/"]')].map((a) => a.getAttribute('href').slice(1)))
        for (const l of linkovi) if (l.startsWith('/' + uloga + '/') && !videno.has(l)) red.push(l)
      }
    }
    dostupniPoUlozi[uloga] = nadjeni
    const ocekivani = m.rute.EKRANI.filter((x) => x.uloga === uloga).map((x) => x.id)
    const fale = ocekivani.filter((id) => !nadjeni.has(id))
    proveri(`dostupnost klikom: ${uloga} stiže do svih ${ocekivani.length} ekrana bez direktnog URL-a`, fale.length === 0, 'nedostupno: ' + fale.join(', '))
    // ekrani iz tabele 4.0 (obe grane) moraju biti među dostupnima
    const izTabele = new Set(m.matrica.sveCelije().filter((x) => x.uloga === uloga).flatMap((x) => x.celija.ekrani))
    const faleTabela = [...izTabele].filter((id) => !nadjeni.has(id))
    proveri(`dostupnost klikom: ${uloga} stiže do svih ekrana iz tabele 4.0`, faleTabela.length === 0, faleTabela.join(', '))
  }
  proveri('dostupnost klikom: C2 (sporedni transferi) se otvara iz table prodavca i kupca', dostupniPoUlozi.selling.has('C2') && dostupniPoUlozi.buying.has('C2'))
}

// =================================================================================== I: telefon (360 x 640): spojena traka, panel od dole, Free
{
  await page.setViewport({ width: 360, height: 640, deviceScaleFactor: 1, isMobile: true, hasTouch: true })
  await udji('selling')
  const DOCK = '[data-traka="telefon"]'
  proveri('telefon: Guided ima spojenu traku (dock), nema donje navigacije', await page.evaluate(() => !!document.querySelector('.dock') && !document.querySelector('.bottomnav')))
  proveri('telefon: izvan ekrana koraka u traci je "Show me"', !!(await F.dugme('Show me', { sel: `${DOCK} button` })))
  await F.klik('Show me', { unutar: DOCK })
  proveri('telefon: Show me otvara S3', (await F.ekran()) === 'S3', await F.ekran())
  proveri('telefon: glavna akcija ekrana je u traci (jedan fiksni sloj)', !!(await F.dugme('Send counter-offer', { sel: `${DOCK} button` })))
  proveri('telefon: akcija nije duplirana u sadržaju', (await page.$$eval('button', (b) => b.filter((x) => x.textContent.trim() === 'Send counter-offer' && x.getClientRects().length > 0).length)) === 1)
  await F.klik('Send counter-offer', { unutar: DOCK, pocekaj: 200 })
  proveri('telefon: radnja iz trake menja stanje 1/1', isto(await trenutna(), { korak: 1, odradjeno: 1, grana: 'approved' }), JSON.stringify(await trenutna()))
  proveri('telefon: kad prodavac nema akciju, u traci je "Next"', !!(await F.dugme('Next', { sel: `${DOCK} .slot button` })))
  // panel od dole
  await page.click('[data-pocetak-panela]')
  await sleep(200)
  const visinaPanela = await page.evaluate(() => document.querySelector('.sheet')?.getBoundingClientRect().height / window.innerHeight)
  proveri('telefon: panel ne prelazi ~82% visine', visinaPanela > 0 && visinaPanela <= 0.83, visinaPanela)
  proveri('telefon: panel sadrži karticu priče, 9 koraka, View as, Guided/Free, Restart', await page.evaluate(() => {
    const s = document.querySelector('.sheet')?.innerText ?? ''
    return s.includes('Show me') && s.includes('All steps') && s.includes('View as') && s.includes('Guided') && s.includes('Restart demo') && s.includes('Exceptions')
  }))
  await F.klik('5Security (escrow)', { sadrzi: true, sel: '.sheet ol button' })
  await sleep(200)
  proveri('telefon: izbor koraka u panelu vodi na 5/0 i zatvara panel', isto(await trenutna(), { korak: 5, odradjeno: 0, grana: 'approved' }) && !(await page.$('.sheet')), JSON.stringify(await trenutna()))
  // meni "≡" u Guided režimu
  await page.click('.menu-btn')
  await sleep(150)
  proveri('telefon: meni "≡" sadrži navigaciju uloge', await page.evaluate(() => (document.querySelector('[data-meni]')?.innerText ?? '').includes('Approvals')))
  await F.klik('Close menu')
  // prelazak u Free: donja navigacija umesto trake, pločica koraka u zaglavlju
  await page.click('[data-pocetak-panela]')
  await sleep(150)
  await F.klik('Free', { unutar: '.sheet' })
  await sleep(250)
  proveri('telefon: Free ima donju navigaciju i nema spojene trake', await page.evaluate(() => !!document.querySelector('.bottomnav') && !document.querySelector('.dock')))
  proveri('telefon: u Free režimu je pločica koraka u zaglavlju', await page.evaluate(() => /Step 5\/9/.test(document.querySelector('.step-pill-top')?.textContent ?? '')))
  await page.click('.step-pill-top')
  await sleep(150)
  proveri('telefon: pločica koraka otvara isti panel', !!(await page.$('.sheet')))
  await page.keyboard.press('Escape')
  await sleep(120)
  proveri('telefon: Esc zatvara panel', !(await page.$('.sheet')))
  await page.setViewport({ width: 1280, height: 900, deviceScaleFactor: 1 })
}

await browser.close()
await zatvori()
const ok = izvestaj('e2e-prica', lista, problemi, spoljni)
process.exit(ok ? 0 : 1)
