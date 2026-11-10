// E2E priče u pravom pregledaču (nad `npm run preview`, port 4191): Čuvar 18+, Next/Show me za 3 uloge × 9 koraka (A, B, C),
// ručno klikanje svih radnji sa smenom uloga, osvežavanje usred koraka, Restart, "Back to story", račva, gost i "Switch to … to try this",
// i dolazak do ekrana KLIKOM kroz meni i prečice (ne samo preko "Show me").
import { BASE, KLJUC, izvestaj, otvori, proveravac, sleep, ucitajModule } from './_zajednicko.mjs'

const { m, zatvori } = await ucitajModule({
  matrica: '/src/pravila/matrica.ts',
  rute: '/src/pravila/rute.ts',
  koraci: '/src/prica/koraci.ts',
  datumi: '/src/scenario/datumi.ts',
  format: '/src/scenario/format.ts',
  racun: '/src/scenario/racun.ts',
})
const { lista, proveri } = proveravac()
const { browser, page, problemi, spoljni } = await otvori({ sirina: 1280, visina: 800 })

const ULOGE = ['organizer', 'traveler', 'advisor']
const stanje = () => page.evaluate((k) => JSON.parse(sessionStorage.getItem(k) ?? 'null'), KLJUC)
const ekran = () => page.evaluate(() => document.querySelector('[data-ekran]')?.getAttribute('data-ekran') ?? null)
const tekst = () => page.evaluate(() => document.body.innerText)
const hash = () => page.evaluate(() => location.hash)
const idi = async (h) => {
  await page.evaluate((x) => (location.hash = x), h)
  await sleep(200)
}
let brojUcitavanja = 0
const poc = (ishod = 'A') => ({ korak: 1, n: 0, ishod })
const seed = async (poz, rezim = 'guided', potvrda18 = true) => {
  await page.evaluate((k, s) => sessionStorage.setItem(k, JSON.stringify(s)), KLJUC, { v: 1, poz, rezim, potvrda18, poruke: { slobodno: true } })
}
const ucitaj = async (h, poz, rezim) => {
  await page.goto(BASE + '#/', { waitUntil: 'networkidle0' })
  await seed(poz, rezim)
  // pun novi dokument (upit se razlikuje), da stanje iz sessionStorage-a učita Provider, a ne da ga pregazi živa aplikacija
  await page.goto(BASE + '?r=' + ++brojUcitavanja + '#' + h, { waitUntil: 'networkidle0' })
  await sleep(150)
}
/** Klik na vidljivo dugme/link čiji tekst odgovara (string = tačno, RegExp = test). */
/** Gledalac sam štiklira obavezne kvačice (nijedna nije unapred štiklirana). */
async function stikliraj() {
  await page.evaluate(() => {
    for (const i of document.querySelectorAll('input[type=checkbox]:not(:checked):not(:disabled)')) if (i.closest('label')?.textContent.includes('(required)') && i.getClientRects().length > 0) i.click()
  })
  await sleep(60)
}
async function klik(t, { sel = 'button, a', pocekaj = 150 } = {}) {
  await stikliraj()
  const rez = await page.evaluate(
    (t, sel) => {
      const re = t.re ? new RegExp(t.re) : null
      const el = [...document.querySelectorAll(sel)].filter((e) => e.getClientRects().length > 0).find((e) => {
        const kandidati = [e.textContent || '', e.getAttribute('aria-label') || ''].map((x) => x.replace(/\s+/g, ' ').trim())
        return kandidati.some((x) => (re ? re.test(x) : x === t.s))
      })
      if (!el) return 'nema'
      if (el.disabled) return 'neaktivno'
      el.click()
      return 'ok'
    },
    t instanceof RegExp ? { re: t.source } : { s: t },
    sel,
  )
  if (rez !== 'ok') throw new Error(`Dugme ${t} nije kliknuto (${rez}) na ${await hash()}`)
  await sleep(pocekaj)
}
const dugme = (t) =>
  page.evaluate(
    (t) => {
      const re = t.re ? new RegExp(t.re) : null
      const el = [...document.querySelectorAll('button, a')].filter((e) => e.getClientRects().length > 0).find((e) => {
        const x = (e.textContent || '').replace(/\s+/g, ' ').trim()
        return re ? re.test(x) : x === t.s
      })
      return el ? { disabled: !!el.disabled } : null
    },
    t instanceof RegExp ? { re: t.source } : { s: t },
  )

const LABELE = {
  '1.pretraga': 'Find group packages',
  '1.zahtev': 'Request a group quote',
  '2.v1': 'Send quote v1',
  '3.izmene': 'Request changes',
  '3.v2': 'Send quote v2',
  '4.prihvati': 'Accept quote and get deposit details',
  '4.transfer': 'I have sent the transfer',
  '4.avans': 'Mark deposit received',
  '5.uvoz': /^Import \d+ passengers$/,
  '5.link': 'Send invitation e-mails',
  '5.upis1': 'Continue',
  '5.upis2': 'I agree and continue',
  '5.upis3': "Continue — I'll pay later",
  '6.rata2': /^Pay EUR/,
  '6.podsetnik': 'Send mass reminder',
  '7.sim': /^Simulate: the last \d+ seats are paid/,
  '7.potvrda': 'Confirm block with partners',
  '7.opcije': 'Send options to organizer',
  '7.izbor': 'Choose this option',
  '8.rata3': /^Pay EUR/,
  '8.sim': /^Simulate: all final payments arrive/,
  '8.povracaj': 'Confirm refunds',
  '9.paket': 'Send trip pack',
  '9.zatvori': 'Close the group',
}
const rutaZa = (id, uloga) => m.rute.link(id, uloga)

try {
// ---------------------------------------------------------------- A) Čuvar 18+ i ulaz
await page.goto(BASE + '#/', { waitUntil: 'networkidle0' })
await page.evaluate(() => sessionStorage.clear())
await page.goto(BASE + '?r=0#/organizer/account/overview', { waitUntil: 'networkidle0' })
await sleep(200)
proveri('Čuvar 18+: ruta bez potvrde vodi na S1', (await ekran()) === 'S1', `${await hash()} ${await ekran()}`)
proveri('Čuvar 18+: poruka o potvrdi', /confirm that you are 18/i.test(await tekst()))
proveri('S1: pravne strane i "o demou" su otvorene bez potvrde', await (async () => {
  await idi('#/legal/terms')
  const a = (await ekran()) === 'S6'
  await idi('#/about')
  return a && (await ekran()) === 'S7'
})())
await idi('#/')
proveri('S1: kvačica 18+ NIJE unapred štiklirana, a "Enter demo" je neaktivno dok je ne štiklira', await page.evaluate(() => !document.querySelector('input[type=checkbox]:checked') && [...document.querySelectorAll('button')].find((b) => b.textContent.trim() === 'Enter demo')?.disabled === true))
await klik('Enter demo')
proveri('S1: "Enter demo" vodi na kuću organizatora (G6) i vraća na traženi ekran', (await ekran()) === 'G6' && (await stanje())?.potvrda18 === true, `${await hash()}`)
proveri('S1: nema <form> ni polja za kucanje', await page.evaluate(() => !document.querySelector('form, textarea, input:not([type=checkbox]):not([type=radio])')))

// ---------------------------------------------------------------- B) Next / Show me kroz 9 koraka, 3 uloge × 3 ishoda
async function proveriPrikaz(uloga, poz, opis) {
  const cilj = m.matrica.ekranZaPoziciju(poz, uloga)
  proveri(`${opis}: ekran ${cilj}`, (await ekran()) === cilj, `${await ekran()} (${await hash()})`)
  const t = await tekst()
  proveri(`${opis}: nema "Coming soon" na izgrađenom ekranu`, !/Coming soon/.test(t))
  proveri(`${opis}: demo datum`, t.includes('Demo date: ' + m.format.datum(m.datumi.demoDatum(poz.korak, poz.n, poz.ishod))), '')
}

for (const ishod of ['A', 'B', 'C']) {
  for (const uloga of ULOGE) {
    await ucitaj(rutaZa(m.matrica.ekranZaPoziciju(poc(), uloga), uloga), poc(), 'guided')
    let poz = poc()
    // dolazak do 7. koraka na glavnom putu, pa račva
    for (let guard = 0; guard < 40; guard++) {
      if (poz.korak === 7 && poz.n === 0 && ishod !== 'A' && poz.ishod === 'A') {
        await klik(new RegExp(`^${ishod} · `))
        poz = { korak: 7, n: 0, ishod }
        const s = await stanje()
        proveri(`račva ${ishod} (${uloga}): ishod upisan u stanje`, s.poz.ishod === ishod && s.poz.korak === 7 && s.poz.n === 0, JSON.stringify(s.poz))
        await proveriPrikaz(uloga, poz, `Show me ${uloga} ${ishod} 7/početno`)
      }
      if (poz.korak === 9 && poz.n === m.koraci.brojRadnji(9, poz.ishod)) break
      await klik('Next')
      const s = await stanje()
      poz = s.poz
      await proveriPrikaz(uloga, poz, `Next ${uloga} ${ishod} ${poz.korak}/${poz.n}`)
    }
    const s = await stanje()
    proveri(`Next ${uloga} ${ishod}: stiglo do 9/završno`, s.poz.korak === 9 && s.poz.n === m.koraci.brojRadnji(9, s.poz.ishod), JSON.stringify(s.poz))
    proveri(`Next ${uloga} ${ishod}: na kraju je Next isključen`, (await dugme('Next'))?.disabled === true)
    proveri(`Next ${uloga} ${ishod}: "End of story"`, /End of story — Restart or explore/.test(await tekst()))
  }
}

// skok kroz tačke ("Show me" na POČETNO) za svaku ulogu i svaki korak (ishod A)
for (const uloga of ULOGE) {
  await ucitaj(rutaZa(m.matrica.ekranZaPoziciju(poc(), uloga), uloga), poc(), 'guided')
  for (let k = 1; k <= 9; k++) {
    await klik(new RegExp(`^Step ${k}: `), { sel: '[data-traka-price] .pr-d' })
    const s = await stanje()
    proveri(`tačka ${k} (${uloga}): početno stanje koraka`, s.poz.korak === k && s.poz.n === 0, JSON.stringify(s.poz))
    await proveriPrikaz(uloga, s.poz, `Show me ${uloga} korak ${k}`)
  }
}

// ---------------------------------------------------------------- C) Ručno klikanje svih radnji, sa smenom uloga
for (const ishod of ['A', 'B', 'C']) {
  await ucitaj(rutaZa('G1', 'organizer'), poc(), 'guided')
  for (let k = 1; k <= 9; k++) {
    if (k === 7 && ishod !== 'A') {
      await klik(new RegExp(`^${ishod} · `))
      await idi('#' + rutaZa('G15', 'organizer'))
    }
    const radnje = m.koraci.radnjeKoraka(k, ishod)
    for (const r of radnje) {
      const uloga = r.uloge === 'any' ? 'organizer' : r.uloge[0]
      await idi('#' + rutaZa(r.ekran, uloga))
      const prije = (await stanje()).poz
      try {
        await klik(LABELE[r.id])
      } catch (e) {
        proveri(`radnja ${r.id} (${ishod}) kliknuta`, false, e.message)
        continue
      }
      const posle = (await stanje()).poz
      proveri(`radnja ${r.id} (${ishod}) pomera poziciju`, posle.korak === prije.korak && posle.n === prije.n + 1, `${JSON.stringify(prije)} -> ${JSON.stringify(posle)}`)
    }
    if (k < 9) await klik('Next')
  }
  const s = await stanje()
  proveri(`ručno klikanje (${ishod}): kraj priče 9/završno`, s.poz.korak === 9 && s.poz.n === m.koraci.brojRadnji(9, ishod), JSON.stringify(s.poz))
}

// ---------------------------------------------------------------- D) KLIK kroz meni i prečice
await ucitaj(rutaZa('G6', 'organizer'), { korak: 6, n: 0, ishod: 'A' }, 'free')
await klik('Manage Group', { sel: 'button.btn-secondary' })
proveri('klik: G6 → "Manage Group" → G7', (await ekran()) === 'G7')
for (const [naziv, cilj] of [['Passengers', 'G8'], ['Finances', 'G13']]) {
  await klik(naziv, { sel: 'nav[aria-label="Account"] button' })
  proveri(`klik: druga traka naloga → ${naziv} → ${cilj}`, (await ekran()) === cilj)
}
await klik('Overview', { sel: 'nav[aria-label="Account"] button' })
await klik('Manage Group', { sel: 'button.btn-secondary' })
for (const [naziv, cilj] of [['Fill deadline', 'G15'], ['Trip pack', 'G16']]) {
  await klik(naziv, { sel: 'button' })
  proveri(`klik: prečica "${naziv}" → ${cilj}`, (await ekran()) === cilj)
  await klik('Overview', { sel: 'nav[aria-label="Account"] button' })
  await klik('Manage Group', { sel: 'button.btn-secondary' })
}
await klik('Group travel', { sel: 'nav[aria-label="Main"] button' })
await klik('Air Charter', { sel: '[data-meni-lista] button' })
proveri('klik: meni Group travel → Air Charter → G1', (await ekran()) === 'G1')
await klik('Home', { sel: 'nav[aria-label="Main"] button' })
proveri('klik: meni Home → S2', (await ekran()) === 'S2')
await klik('Search')
proveri('klik: S2 Search (Macau) → G1', (await ekran()) === 'G1')
// talas 2: novi ekrani se stiže klikom
await ucitaj(rutaZa('G8', 'organizer'), { korak: 6, n: 2, ishod: 'A' }, 'free')
await klik('Add passenger')
proveri('klik: G8 → "Add passenger" → G10', (await ekran()) === 'G10')
await ucitaj(rutaZa('G8', 'organizer'), { korak: 6, n: 2, ishod: 'A' }, 'free')
await klik('View profile / Edit')
proveri('klik: G8 → "View profile / Edit" → G12', (await ekran()) === 'G12')
await ucitaj(rutaZa('G13', 'organizer'), { korak: 8, n: 2, ishod: 'B' }, 'free')
await klik('Generate group statement')
proveri('klik: G13 → "Generate group statement" → G14', (await ekran()) === 'G14')
proveri('G14 u ishodu B: kreditna nota i traka "What-if"', /Credit note/.test(await tekst()) && (await page.evaluate(() => !!document.querySelector('[data-traka-grane]'))))
await ucitaj(rutaZa('G7', 'organizer'), { korak: 6, n: 0, ishod: 'A' }, 'free')
await klik('Advisor', { sel: 'button.btn-secondary' })
proveri('klik: G7 → "Advisor" → G17', (await ekran()) === 'G17')
await klik('Message')
proveri('G17: "Message" otvara prozor sa 3 gotove poruke', /Message your advisor/.test(await tekst()))
await klik('Cancel', { sel: '[role=dialog] button' })
await ucitaj(rutaZa('T5', 'traveler'), { korak: 9, n: 1, ishod: 'A' }, 'free')
await klik('Open messages')
proveri('klik: T5 → "Open messages" → T8, 3 poruke posle koraka 9', (await ekran()) === 'T8' && (await page.evaluate(() => document.querySelectorAll('[aria-label="Message list"] li').length)) === 3)
await ucitaj(rutaZa('T5', 'traveler'), { korak: 5, n: 5, ishod: 'A' }, 'free')
await klik('View my seat')
proveri('klik: T5 → "View my seat" → T6', (await ekran()) === 'T6')
await ucitaj(rutaZa('V1', 'advisor'), { korak: 4, n: 0, ishod: 'A' }, 'free')
await klik('Open the group tracker')
proveri('klik: V1 → V3', (await ekran()) === 'V3')
await ucitaj(rutaZa('V3', 'advisor'), { korak: 7, n: 0, ishod: 'A' }, 'free')
await klik('Open the fill deadline')
proveri('klik: V3 → "Open the fill deadline" → V4', (await ekran()) === 'V4')

// ---------------------------------------------------------------- E) osvežavanje, Restart, Back to story, gost, savetnik
await ucitaj(rutaZa('G8', 'organizer'), { korak: 5, n: 2, ishod: 'A' }, 'guided')
await page.reload({ waitUntil: 'networkidle0' })
const posleOsvezavanja = await stanje()
proveri('osvežavanje usred koraka čuva mesto i ekran', posleOsvezavanja.poz.korak === 5 && posleOsvezavanja.poz.n === 2 && (await ekran()) === 'G8')
await idi('#' + rutaZa('G6', 'organizer'))
proveri('van ekrana priče glavno dugme traka postaje "Back to story"', await page.evaluate(() => document.querySelector('[data-traka-price] [data-glavno-dugme]')?.textContent?.includes('Back to story')))
await klik('Back to story')
proveri('"Back to story" vraća na ekran stanja priče', (await ekran()) === m.matrica.ekranZaPoziciju({ korak: 5, n: 2, ishod: 'A' }, 'organizer'), await ekran())

await ucitaj(rutaZa('G15', 'organizer'), { korak: 7, n: 1, ishod: 'B' }, 'guided')
await klik(/^Switch to main path/)
proveri('"Switch to main path": ishod A, korak 7 početno', await (async () => { const s = (await stanje()).poz; return s.korak === 7 && s.n === 0 && s.ishod === 'A' })())
await ucitaj(rutaZa('G15', 'organizer'), { korak: 8, n: 0, ishod: 'B' }, 'guided')
await klik(/^Step 3: Refine/, { sel: '[data-traka-price] .pr-d' })
proveri('skok na korak 3 iz ishoda B vraća ishod A', (await stanje()).poz.ishod === 'A')
proveri('skok iz B na korak 3: poruka "Branch reset" je vidljiva', /Branch reset/.test(await tekst()))
await ucitaj(rutaZa('G15', 'organizer'), { korak: 7, n: 0, ishod: 'B' }, 'guided')
await klik('Back')
const posleBack = await stanje()
proveri('Back iz 7/početno u ishodu B vraća ishod A na korak 6', posleBack.poz.korak === 6 && posleBack.poz.ishod === 'A', JSON.stringify(posleBack.poz))
proveri('Back iz B/C: poruka "Branch reset" je vidljiva', /Branch reset/.test(await tekst()))
// upit se može poslati i bez prethodne pretrage paketa
await ucitaj(rutaZa('G2', 'organizer'), poc(), 'guided')
await klik('Request a group quote')
proveri('"Request a group quote" radi i bez pretrage (G3, korak 1 završen)', (await ekran()) === 'G3' && (await stanje()).poz.n === 2, `${await ekran()} ${JSON.stringify((await stanje()).poz)}`)
await ucitaj(rutaZa('G11', 'organizer'), { korak: 5, n: 0, ishod: 'A' }, 'guided')
proveri('neaktivno dugme objašnjava šta prvo ("First: …")', /First: Import the passenger list/.test(await tekst()), '')
await ucitaj(rutaZa('G6', 'organizer'), { korak: 3, n: 0, ishod: 'A' }, 'guided')

await klik('Restart demo')
proveri('Restart traži potvrdu', /Restart the demo from step 1\?/.test(await tekst()))
await klik('Cancel')
proveri('Restart: Cancel ne menja ništa', (await stanje()).poz.korak === 3)
await klik('Restart demo')
await klik('Yes')
const posleRestarta = await stanje()
proveri('Restart: korak 1/početno, ishod A, uloga i potvrda 18+ ostaju', posleRestarta.poz.korak === 1 && posleRestarta.poz.n === 0 && posleRestarta.poz.ishod === 'A' && posleRestarta.potvrda18 === true)
proveri('Restart otvara ekran koraka 1 za ulogu', (await ekran()) === m.matrica.ekranZaPoziciju(poc(), 'organizer'), await ekran())

// gost: akcija otvara "Enter demo as…", pa se izvrši
await ucitaj('/guest/charter/package', { korak: 1, n: 1, ishod: 'A' }, 'guided')
proveri('gost nema traku priče', !(await page.evaluate(() => !!document.querySelector('[data-traka-price]'))))
proveri('gost vidi pločicu "Demo · Enter as a role"', /Demo · Enter as a role/i.test(await tekst()))
await klik('Request a group quote')
proveri('gost: akcija otvara "Enter demo as…"', /Enter demo as…/.test(await tekst()))
await klik('Group organizer', { sel: '[role=dialog] button' })
const gostPosle = await stanje()
proveri('gost: posle izbora uloge radnja je izvršena (korak 1 završen) i otvoren G3', gostPosle.poz.n === 2 && (await ekran()) === 'G3', `${JSON.stringify(gostPosle.poz)} ${await ekran()}`)

// savetnik / putnik na javnoj strani: "Switch to … to try this"
await ucitaj('/advisor/charter/package', { korak: 1, n: 1, ishod: 'A' }, 'guided')
proveri('savetnik na javnoj strani: "Switch to Group organizer to try this"', /Switch to Group organizer to try this/.test(await tekst()))
await klik('Switch to Group organizer to try this')
proveri('savetnik: promena uloge ostaje na istoj javnoj strani', (await hash()).startsWith('#/organizer/charter/package'), await hash())

// ---------------------------------------------------------------- F) uloga u linku i nalog druge uloge
await ucitaj('/guest/account/overview', { korak: 1, n: 0, ishod: 'A' }, 'guided')
proveri('nalog druge uloge (gost na account/…) vodi na kuću te uloge', (await ekran()) === 'S2', await hash())
await ucitaj('/organizer/nema/ovoga', { korak: 1, n: 0, ishod: 'A' }, 'guided')
proveri('nepostojeća ruta vodi na kuću uloge', (await ekran()) === 'G6' || (await ekran()) === 'S2', await ekran())

} catch (e) {
  proveri("skripta prekinuta greškom", false, e.message)
}
await browser.close()
zatvori()
const ok = izvestaj('e2e-prica', lista, problemi, spoljni)
process.exit(ok ? 0 : 1)
