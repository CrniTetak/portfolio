// E2E OKVIR (PLAN B6.2, B8.2): oznaka demoa na SVAKOM od 53 ekrana, na laptopu i telefonu.
// Element postoji, tekst je TAČNO onaj iz stalni-tekstovi.ts, ceo je u vidljivom delu prozora, nije prekriven (elementFromPoint u više tačaka),
// nije odsečen, veličina slova ≥ 12 px; pilula „Demo“ u televizoru i u telefonu; traka priče na ekranima demoa; stranica se ne pomera;
// osvežavanje čuva ekran. Pokretanje (preview mora da radi): npm run e2e:okvir
import { BASE, KLJUC, izvestaj, otvori, proveravac, sleep, ucitajModule } from './_zajednicko.mjs'

const { m, zatvori } = await ucitajModule({ ekrani: '/src/pravila/ekrani.ts', tekstovi: '/src/podaci/stalni-tekstovi.ts' })
const { EKRANI, sastavi } = m.ekrani
const { OZNAKA_DEMOA } = m.tekstovi
await zatvori()

const primer = { id: 'doma-tv', proizvod: 'doma-tv', upit: 'film', pitanje: 'kako-otkazujem' }
// Ispravni parametri po ekranu (nepoznat id u adresi vodi na T2): kanal, paket, emisija, reklama
const posebno = { T4: { id: 'klasik-tv-1' }, T10: { id: 'reklama-1' }, T16: { id: 'srbija' }, P7: { id: 'srbija' }, P10: { id: 'srbija' }, P13: { id: 'DEMO-0001' } }
const parametriZa = (e) => posebno[e.id] ?? Object.fromEntries([...e.ruta.matchAll(/:(\w+)/g)].map(([, ime]) => [ime, primer[ime]]))

/** Hash za ekran: uvod/tabla/TV su obične rute; telefonski ekran ide u upitu uz televizor (laptop) ili sa uredjaj=tel (usko). */
function hashZa(e, usko) {
  const p = sastavi(e.id, parametriZa(e))
  if (e.uredjaj === 'tel') return `#/tv/pocetna?${usko ? 'uredjaj=tel&' : ''}tel=${p}`
  return '#' + p
}
const selektorEkrana = (e) => (e.uredjaj === 'tel' ? `[data-tel-platno] [data-ekran="${e.id}"]` : `[data-ekran="${e.id}"]`)

const { proveri, lista } = proveravac()
const sveProblemi = []
const sviSpoljni = []

async function proveriOznaku(page, opis) {
  return page.evaluate((tacanTekst) => {
    const el = document.querySelector('[data-oznaka-demoa]')
    if (!el) return { greska: 'oznaka ne postoji' }
    const r = el.getBoundingClientRect()
    const cs = getComputedStyle(el)
    const tekst = el.textContent.trim()
    const tacke = [0.02, 0.25, 0.5, 0.75, 0.98].flatMap((x) => [0.2, 0.8].map((y) => [r.left + r.width * x, r.top + r.height * y]))
    const prekrivena = tacke.filter(([x, y]) => {
      const gore = document.elementFromPoint(x, y)
      return !gore || !el.contains(gore)
    }).length
    return {
      tekstTacan: tekst === tacanTekst,
      tekst,
      uPrikazu: r.top >= 0 && r.left >= 0 && r.right <= innerWidth + 0.5 && r.bottom <= innerHeight && r.height > 10,
      prekrivena,
      odsecena: el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1,
      velicina: parseFloat(getComputedStyle(el.querySelector('span')).fontSize),
      vidljiva: cs.display !== 'none' && cs.visibility !== 'hidden' && cs.opacity !== '0',
      visina: r.height,
    }
  }, OZNAKA_DEMOA)
}

async function prodji(naziv, { sirina, visina, telefon, usko }) {
  const { browser, page, problemi, spoljni } = await otvori({ sirina, visina, telefon })
  // slobodno razgledanje na poziciji 5/0 (Doma TV pretplaćen, pa T14 važi), „Kako se upravlja“ već viđeno
  await page.evaluateOnNewDocument((k) => { if (!sessionStorage.getItem(k)) sessionStorage.setItem(k, JSON.stringify({ verzija: 1, korak: 5, p: 0, grana: 'grcka', rezim: 'slobodno', kakoViđeno: true })) }, KLJUC)
  await page.goto(BASE + '#/')
  const lose = []
  let tv = 0
  let tel = 0
  for (const e of EKRANI) {
    // T12 postoji samo u zemlji gde je kanal nedostupan (inače ga ruter preusmerava na T8): Srbija, korak 6; posle njega se vraća osnovno stanje
    if (e.id === 'T12') {
      await page.evaluate((k) => sessionStorage.setItem(k, JSON.stringify({ verzija: 1, korak: 6, p: 1, grana: 'srbija', rezim: 'slobodno', kakoViđeno: true })), KLJUC)
      await page.goto(BASE + '?r=' + e.id + hashZa(e, usko))
    } else if (e.id === 'T13') {
      await page.evaluate((k) => sessionStorage.setItem(k, JSON.stringify({ verzija: 1, korak: 5, p: 0, grana: 'grcka', rezim: 'slobodno', kakoViđeno: true })), KLJUC)
      await page.goto(BASE + '?r=' + e.id + hashZa(e, usko))
    }
    await page.evaluate((h) => { location.hash = h }, hashZa(e, usko))
    try {
      await page.waitForSelector(selektorEkrana(e), { timeout: 4000 })
    } catch {
      lose.push(`${e.id}: ekran se nije pojavio`)
      continue
    }
    await sleep(25)
    const o = await proveriOznaku(page)
    if (o.greska) lose.push(`${e.id}: ${o.greska}`)
    else {
      if (!o.tekstTacan) lose.push(`${e.id}: tekst oznake nije tačan: „${o.tekst}“`)
      if (!o.uPrikazu) lose.push(`${e.id}: oznaka nije u vidljivom delu prozora`)
      if (o.prekrivena) lose.push(`${e.id}: oznaka prekrivena u ${o.prekrivena} tačaka`)
      if (o.odsecena) lose.push(`${e.id}: oznaka odsečena`)
      if (o.velicina < 12) lose.push(`${e.id}: slova ${o.velicina}px < 12px`)
      if (!o.vidljiva) lose.push(`${e.id}: oznaka nije vidljiva`)
    }
    const stranica = await page.evaluate(() => ({
      uSirinu: document.documentElement.scrollWidth > innerWidth + 1,
      uVisinu: document.documentElement.scrollHeight > innerHeight + 1,
      traka: !!document.querySelector('[data-traka]'),
      pilulaTv: !!document.querySelector('[data-tv-platno] .tv-pilula-demo'),
      pilulaTel: !!document.querySelector('[data-tel-platno] .tel-pilula span'),
      tvOblast: !!document.querySelector('[data-tv-oblast]'),
    }))
    if (stranica.uSirinu) lose.push(`${e.id}: stranica se pomera u stranu`)
    if (stranica.uVisinu) lose.push(`${e.id}: stranica se pomera uspravno`)
    const uvod = ['U1', 'U2', 'U3'].includes(e.id)
    if (!uvod && !stranica.traka) lose.push(`${e.id}: nema trake priče`)
    if (e.uredjaj === 'tv') {
      tv++
      if (!stranica.pilulaTv) lose.push(`${e.id}: nema pilule „Demo“ u televizoru`)
    }
    if (e.uredjaj === 'tel') {
      tel++
      if (!stranica.pilulaTel) lose.push(`${e.id}: nema pilule „Demo“ u telefonu`)
    }
    if (!usko && e.uredjaj === 'tv' && !stranica.pilulaTel) lose.push(`${e.id}: na laptopu telefon mora da je na ekranu (pilula „Demo“)`)
  }
  proveri(`${naziv}: oznaka demoa i okvir na svih ${EKRANI.length} ekrana (TV ${tv}, telefon ${tel})`, EKRANI.length === 53 && lose.length === 0, lose.slice(0, 8).join(' | ') + (lose.length > 8 ? ` … (+${lose.length - 8})` : ''))

  // osvežavanje čuva ekran
  const ostali = []
  for (const id of ['T2', 'T3', 'T5', 'U2', 'V1']) {
    const e = EKRANI.find((x) => x.id === id)
    await page.evaluate((h) => { location.hash = h }, hashZa(e, usko))
    await page.waitForSelector(selektorEkrana(e), { timeout: 4000 })
    await page.reload()
    const ok = await page.waitForSelector(selektorEkrana(e), { timeout: 4000 }).then(() => true).catch(() => false)
    if (!ok) ostali.push(id)
  }
  proveri(`${naziv}: osvežavanje čuva ekran (T2, T3, T5, U2, V1)`, ostali.length === 0, ostali.join(', '))

  const csp = await page.evaluate(() => window.__csp ?? [])
  proveri(`${naziv}: 0 prijava o kršenju CSP-a`, csp.length === 0, csp.join(' | '))
  sveProblemi.push(...problemi)
  sviSpoljni.push(...spoljni)
  await browser.close()
}

await prodji('laptop 1366 × 768', { sirina: 1366, visina: 768 })
await prodji('laptop 1920 × 1080', { sirina: 1920, visina: 1080 })
await prodji('telefon uspravno 390 × 844', { sirina: 390, visina: 844, telefon: true, usko: true })
await prodji('telefon vodoravno 844 × 390', { sirina: 844, visina: 390, telefon: true, usko: true })
await prodji('mali telefon 320 × 568', { sirina: 320, visina: 568, telefon: true, usko: true })

process.exit(izvestaj('e2e-okvir', lista, sveProblemi, sviSpoljni) ? 0 : 1)
