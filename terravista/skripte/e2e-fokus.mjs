// E2E FOKUS (PLAN B8.2): prostorna navigacija televizora u pravom pregledaču (puppeteer-core + lokalni Chrome), na `npm run preview` (port 4193).
// Proverava: početni fokus = registar za SVAKI TV ekran; tačno jedan izabran; na ivicama strelica ne menja izbor (bez kruženja);
// determinisana „šetnja“ od 300 pritisaka po probnom ekranu (uvek jedan izabran, unutar televizora, prsten nije odsečen);
// povratak na ekran vraća zapamćen izbor; Backspace/Esc nikad ne napuštaju demo; klik u prazno ne briše izbor;
// daljinski na ekranu i dugmad trake ne kradu fokus tastaturi; prozor preko ekrana drži fokus i Nazad ga zatvara; vodič ostaje u istom vremenu.
import { BASE, KLJUC, izvestaj, otvori, proveravac, sleep, ucitajModule } from './_zajednicko.mjs'

const { m, zatvori } = await ucitajModule({ ekrani: '/src/pravila/ekrani.ts', tekstovi: '/src/podaci/stalni-tekstovi.ts' })
const { EKRANI, sastavi } = m.ekrani
const { POCETNI_EKRAN_PORUKA } = m.tekstovi
await zatvori()

const { proveri, lista } = proveravac()
const { browser, page, problemi, spoljni } = await otvori({ sirina: 1366, visina: 768 })
// Slobodno razgledanje: pozicija priče je 5/0 (Doma TV je pretplaćen, pa T14 važi; matrica ne zadaje početni izbor osim za T15), „Kako se upravlja“ je već viđeno.
await page.evaluateOnNewDocument((k) => { if (!sessionStorage.getItem(k)) sessionStorage.setItem(k, JSON.stringify({ verzija: 1, korak: 5, p: 0, grana: 'grcka', rezim: 'slobodno', kakoViđeno: true })) }, KLJUC)

const primer = { id: 'doma-tv', proizvod: 'doma-tv', upit: 'film', pitanje: 'kako-otkazujem' }
// Ispravni parametri po ekranu (nepoznat id u adresi vodi na T2): kanal, paket, emisija, reklama
const posebno = { T4: { id: 'klasik-tv-1' }, T10: { id: 'reklama-1' }, T16: { id: 'srbija' }, P7: { id: 'srbija' }, P10: { id: 'srbija' }, P13: { id: 'DEMO-0001' } }
const parametriZa = (e) => posebno[e.id] ?? Object.fromEntries([...e.ruta.matchAll(/:(\w+)/g)].map(([, ime]) => [ime, primer[ime]]))

/** Prelazak na hash u istoj stranici (SPA), pa čekanje da ekran i izbor postoje. */
let uSrbiji = false
async function idiNa(hash, ekranId) {
  // posle T12 (stanje Srbija) sledeći ekran ulazi svežim učitavanjem sa osnovnim stanjem
  if (ekranId === 'T12' || uSrbiji) {
    uSrbiji = ekranId === 'T12'
    return svez(hash, ekranId)
  }
  await page.evaluate((h) => { location.hash = h }, hash)
  await page.waitForSelector(`[data-tv-oblast] [data-ekran="${ekranId}"]`, { timeout: 5000 })
  await page.waitForSelector('[data-tv-oblast] [data-izabran]', { timeout: 5000 })
  await sleep(30)
}

/** Svež početak: ponovno učitavanje stranice briše zapamćene izbore (pamte se samo dok je prozor otvoren), pa ekran kreće od početnog izbora. */
async function svez(hash, ekranId) {
  // T12 postoji samo u zemlji gde je kanal nedostupan (inače ga ruter preusmerava na T8): Srbija, korak 6
  await page.evaluate(([k, t12]) => sessionStorage.setItem(k, JSON.stringify(t12 ? { verzija: 1, korak: 6, p: 1, grana: 'srbija', rezim: 'slobodno', kakoViđeno: true } : { verzija: 1, korak: 5, p: 0, grana: 'grcka', rezim: 'slobodno', kakoViđeno: true })), [KLJUC, ekranId === 'T12'])
  // svež ulazak na adresu (SPA bi još sa starim stanjem preusmerila T12)
  await page.goto(BASE + '?r=' + Math.random().toString(36).slice(2) + hash)
  await page.waitForSelector(`[data-tv-oblast] [data-ekran="${ekranId}"]`, { timeout: 5000 })
  await page.waitForSelector('[data-tv-oblast] [data-izabran]', { timeout: 5000 })
  await sleep(60)
}

/** Stanje izbora u televizoru: broj izabranih, id, mera (stvarni pikseli) i da li je prsten ceo vidljiv u svim kontejnerima za skrol. */
const stanje = () =>
  page.evaluate(() => {
    const izabrani = [...document.querySelectorAll('[data-tv-oblast] [data-izabran]')]
    const el = izabrani[0]
    if (!el) return { broj: 0 }
    const r = el.getBoundingClientRect()
    const platno = document.querySelector('[data-tv-platno]')
    const s = platno.getBoundingClientRect().width / platno.offsetWidth
    const prsten = 11 * s
    const unutra = (k) => {
      const c = k.getBoundingClientRect()
      return r.left - prsten >= c.left - 1 && r.right + prsten <= c.right + 1 && r.top - prsten >= c.top - 1 && r.bottom + prsten <= c.bottom + 1
    }
    const kontejneri = []
    for (let k = el.parentElement; k; k = k.parentElement) if (k.dataset?.tvSkrol) kontejneri.push(k)
    const p = platno.getBoundingClientRect()
    return {
      broj: izabrani.length,
      id: el.dataset.tvId,
      x: r.left, y: r.top, w: r.width, h: r.height,
      uPlatnu: r.left >= p.left - 1 && r.right <= p.right + 1 && r.top >= p.top - 1 && r.bottom <= p.bottom + 1,
      prstenCeo: kontejneri.every(unutra),
      fokusUTelevizoru: !!document.activeElement?.closest?.('[data-tv-oblast]') || document.activeElement === document.body,
      aktivanId: document.activeElement?.dataset?.tvId ?? null,
      hash: location.hash,
    }
  })

const taster = async (k) => {
  await page.keyboard.press(k)
  await sleep(15)
}

// ---------------------------------------------------------------- 1. početni fokus za svih 31 TV ekrana
await page.goto(BASE + '#/tv/pocetna')
let tvEkrana = 0
let losi = []
for (const e of EKRANI.filter((x) => x.uredjaj === 'tv')) {
  tvEkrana++
  const hash = '#' + sastavi(e.id, parametriZa(e))
  await idiNa(hash, e.id)
  const s = await stanje()
  const dinamicki = ['T19', 'T18'].includes(e.id) // početni izbor prvog reda zavisi od pretplata (prazno stanje ima dugme „Kanali“)
  if (s.broj !== 1 || (!dinamicki && s.id !== e.pocetniFokus)) losi.push(`${e.id}: izabranih ${s.broj}, id ${s.id}, očekivano ${e.pocetniFokus}`)
}
proveri(`početni fokus = registar na svih ${tvEkrana} TV ekrana (tačno jedan izabran)`, tvEkrana === 31 && losi.length === 0, losi.join(' | '))

// ---------------------------------------------------------------- 2. ivice: strelica na ivici ne menja izbor
await svez('#/tv/pocetna', 'T2')
{
  const pre = await stanje()
  // desno i levo od jedinog dugmeta u tapeti: nema suseda u istom pojasu → ostaje (ne skače dijagonalno u traku)
  const a = await stanje()
  await taster('ArrowLeft')
  await taster('ArrowRight')
  const b = await stanje()
  proveri('T2: levo/desno od jedinog dugmeta tapete ne menja izbor (bez kruženja)', a.id === b.id && b.broj === 1, `${a.id} → ${b.id}`)
  proveri('T2: početni izbor je „Gledaj“', pre.id === 'tapeta-gledaj', pre.id)
}
// u redu: na kraju reda ostaje
await svez('#/tv/pocetna', 'T2')
await taster('ArrowDown') // nastavi gledanje
await taster('ArrowDown') // besplatni kanali (prva kartica)
{
  const pocetak = await stanje()
  proveri('T2: strelica dole dva puta ulazi u red „Besplatni kanali“', pocetak.id?.startsWith('besplatni-'), pocetak.id)
  for (let i = 0; i < 12; i++) await taster('ArrowRight')
  const kraj = await stanje()
  proveri('red „Besplatni kanali“: poslednja kartica je poslednja (bez kruženja) i prsten nije odsečen', kraj.id === 'besplatni-viasat-explore' && kraj.prstenCeo, `${kraj.id} prsten:${kraj.prstenCeo}`)
  for (let i = 0; i < 12; i++) await taster('ArrowLeft')
  const nazad = await stanje()
  proveri('red „Besplatni kanali“: levo do prve kartice (bez kruženja)', nazad.id === pocetak.id, nazad.id)
}

// ---------------------------------------------------------------- 3. šetnja od 300 pritisaka po probnim ekranima
function rng(seme) {
  let a = seme
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const STRELICE = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']
for (const [ekran, hash, seme] of [['T2', '#/tv/pocetna', 1], ['T3', '#/tv/vodic', 2], ['T5', '#/tv/kanali', 3]]) {
  await svez(hash, ekran)
  const r = rng(seme)
  let lose = []
  let promena = 0
  let prethodni = (await stanje()).id
  for (let i = 0; i < 300; i++) {
    await taster(STRELICE[Math.floor(r() * 4)])
    const s = await stanje()
    if (s.broj !== 1) lose.push(`#${i}: izabranih ${s.broj}`)
    else {
      if (!s.uPlatnu) lose.push(`#${i}: ${s.id} van platna`)
      if (!s.prstenCeo) lose.push(`#${i}: ${s.id} prsten odsečen`)
      if (!s.fokusUTelevizoru) lose.push(`#${i}: DOM fokus izašao iz televizora`)
      if (s.id !== prethodni) promena++
      prethodni = s.id
    }
    if (lose.length > 5) break
  }
  proveri(`šetnja 300 pritisaka na ${ekran}: uvek jedan izabran, unutar platna, prsten ceo, fokus u televizoru (promena izbora ${promena}×)`, lose.length === 0 && promena > 60, lose.slice(0, 5).join(' | '))
}

// ---------------------------------------------------------------- 4. vodič: pri kretanju dole ostaje u istom vremenu (polja se preklapaju)
await svez('#/tv/vodic', 'T3')
{
  let preklopa = 0
  let koraka = 0
  let prethodni = await stanje()
  for (let i = 0; i < 8; i++) {
    await taster('ArrowDown')
    const s = await stanje()
    if (s.id === prethodni.id) break
    koraka++
    const preklop = Math.min(prethodni.x + prethodni.w, s.x + s.w) - Math.max(prethodni.x, s.x)
    if (preklop > 0) preklopa++
    prethodni = s
  }
  proveri(`vodič: dole kroz ${koraka} redova svako sledeće polje se vremenski preklapa sa prethodnim`, koraka >= 5 && preklopa === koraka, `koraka ${koraka}, preklopa ${preklopa}`)
}

// ---------------------------------------------------------------- 5. Enter → ekran, Backspace → nazad na isti izbor; Početna; poruka na T2
await svez('#/tv/pocetna', 'T2')
await taster('ArrowDown'); await taster('ArrowDown'); await taster('ArrowRight'); await taster('ArrowRight')
const pre = await stanje()
const duzinaIstorije = await page.evaluate(() => history.length)
await taster('Enter')
await page.waitForSelector('[data-tv-oblast] [data-ekran="T9"]', { timeout: 3000 }).catch(() => {})
{
  const s = await stanje()
  proveri('Enter na kartici besplatnog kanala otvara T9 (besplatni kanal se odmah pušta)', s.hash?.includes('/tv/gledaj/') && s.id?.startsWith('plejer-'), s.hash)
}
await taster('Backspace')
await page.waitForSelector('[data-tv-oblast] [data-ekran="T2"]', { timeout: 3000 })
await sleep(60)
{
  const s = await stanje()
  proveri('Backspace sa T9 vraća na T2 i na ISTU karticu (zapamćen izbor)', s.id === pre.id, `${pre.id} → ${s.id}`)
  const istorija = await page.evaluate(() => history.length)
  proveri('kretanje po televizoru ne dodaje unose u istoriju pregledača (replace)', istorija === duzinaIstorije, `${duzinaIstorije} → ${istorija}`)
}
await svez('#/tv/pocetna', 'T2')
await taster('Backspace')
await sleep(100)
{
  const s = await stanje()
  const toast = await page.evaluate(() => document.querySelector('.tv-toast')?.textContent ?? null)
  proveri('Backspace na početnom ekranu ne izlazi iz demoa: ostaje T2 i piše poruku', s.hash?.startsWith('#/tv/pocetna') && toast === POCETNI_EKRAN_PORUKA, `${s.hash} | ${toast}`)
}
await taster('Escape')
{
  const s = await stanje()
  proveri('Esc na početnom ekranu takođe ne napušta demo', s.hash?.startsWith('#/tv/pocetna'), s.hash)
}
// Početna (daljinski) sa dubljeg ekrana
await idiNa('#/tv/kanal/doma-tv', 'T8')
await page.click('[data-daljinski="pocetna"]')
await page.waitForSelector('[data-tv-oblast] [data-ekran="T2"]', { timeout: 3000 })
proveri('dugme „Početna“ na daljinskom vraća na T2', true)

// ---------------------------------------------------------------- 6. klik u prazno ne briše izbor; klik na element = izaberi + OK
await svez('#/tv/pocetna', 'T2')
{
  const a = await stanje()
  const platno = await page.$eval('[data-tv-platno]', (e) => { const r = e.getBoundingClientRect(); return { x: r.left + r.width * 0.5, y: r.top + r.height * 0.04 } })
  await page.mouse.click(platno.x, platno.y)
  const b = await stanje()
  proveri('klik u prazno (pozadina televizora) ne briše izbor', b.broj === 1 && b.id === a.id, `${a.id} → ${b.id} (${b.broj})`)
  await page.mouse.click(5, 300)
  const c = await stanje()
  proveri('klik van televizora ne briše vidljiv izbor', c.broj === 1 && c.id === a.id, `${c.id} (${c.broj})`)
}
{
  await svez('#/tv/pocetna', 'T2')
  const poz = await page.$eval('[data-tv-id="nav-T5"]', (e) => { const r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 } })
  await page.mouse.click(poz.x, poz.y)
  await page.waitForSelector('[data-tv-oblast] [data-ekran="T5"]', { timeout: 3000 })
  proveri('klik na stavku navigacije = izaberi + OK (otvara T5)', true)
}

// ---------------------------------------------------------------- 7. daljinski i traka ne kradu fokus tastaturi
await svez('#/tv/pocetna', 'T2')
{
  await page.click('[data-daljinski="dole"]')
  await page.click('[data-daljinski="dole"]')
  const a = await stanje()
  proveri('daljinski na ekranu (klik mišem) pomera izbor', a.id !== 'tapeta-gledaj' && a.broj === 1, a.id)
  proveri('posle klika na daljinski DOM fokus je i dalje u televizoru (ne na dugmetu daljinskog)', a.fokusUTelevizoru && a.aktivanId === a.id, `aktivan: ${a.aktivanId}`)
  await taster('ArrowDown')
  const b = await stanje()
  proveri('tastatura posle klika na daljinski i dalje upravlja televizorom', b.id !== a.id, `${a.id} → ${b.id}`)
  await page.click('[data-traka] button[aria-label="Koraci priče"], [data-traka] .tacka')
  await taster('ArrowDown')
  const c = await stanje()
  proveri('tastatura posle klika na dugme trake priče i dalje upravlja televizorom', c.broj === 1 && c.fokusUTelevizoru, c.id)
}

// ---------------------------------------------------------------- 8. prozor preko ekrana (kartica „Kako se upravlja“)
await svez('#/tv/pocetna', 'T2')
await taster('ArrowDown')
const iza = await stanje()
await page.click('[data-traka] button[aria-label="Uputstvo: kako se upravlja"]')
await page.waitForSelector('[data-tv-id="kako-ok"]', { timeout: 3000 })
await sleep(60)
{
  const s = await stanje()
  proveri('prozor „Kako se upravlja“: izbor je na „U redu“ i tačno jedan je izabran', s.id === 'kako-ok' && s.broj === 1, `${s.id} (${s.broj})`)
  for (const k of STRELICE) await taster(k)
  const t = await stanje()
  proveri('fokus ne izlazi iz prozora (četiri strelice ostaju na „U redu“)', t.id === 'kako-ok' && t.broj === 1, t.id)
  await taster('Backspace')
  await sleep(80)
  const z = await stanje()
  const ima = await page.$('[data-tv-id="kako-ok"]')
  proveri('Nazad zatvara prozor i vraća izbor na prethodni element ekrana', !ima && z.id === iza.id && z.broj === 1, `${iza.id} → ${z.id}`)
}

// ---------------------------------------------------------------- 9. Tab ne šeta po televizoru; Esc vraća fokus televizoru
await svez('#/tv/pocetna', 'T2')
{
  await page.keyboard.press('Tab')
  const a = await page.evaluate(() => ({ unutra: !!document.activeElement?.closest?.('[data-tv-oblast]'), tag: document.activeElement?.tagName }))
  proveri('Tab ne ulazi u elemente televizora (tabIndex −1; stiže do trake/daljinskog)', !a.unutra, JSON.stringify(a))
  await page.keyboard.press('Escape')
  const b = await stanje()
  proveri('Esc vraća DOM fokus televizoru', b.fokusUTelevizoru && b.aktivanId === b.id && b.broj === 1, `${b.id} aktivan ${b.aktivanId}`)
}

// ---------------------------------------------------------------- 10. nepoznata ruta → T2 uz poruku
await page.evaluate(() => { location.hash = '#/tv/ne-postoji' })
await page.waitForSelector('[data-tv-oblast] [data-ekran="T2"]', { timeout: 3000 })
proveri('nepoznata ruta vodi na T2 (nikad prazan ekran)', true)

{
  const csp = await page.evaluate(() => window.__csp ?? [])
  proveri('0 prijava o kršenju CSP-a (securitypolicyviolation)', csp.length === 0, csp.join(' | '))
}
await page.evaluate(() => { location.hash = '#/tv/kanal/xyz' })
await page.waitForSelector('[data-tv-oblast] [data-ekran="T2"]', { timeout: 3000 })
proveri('nepoznat id u adresi (#/tv/kanal/xyz) vodi na T2 (nikad prazan ekran)', true)
await browser.close()
process.exit(izvestaj('e2e-fokus', lista, problemi, spoljni) ? 0 : 1)
