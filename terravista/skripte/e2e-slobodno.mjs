// E2E SLOBODNO (PLAN B4.4, talas 2): slobodni sloj, „Izgubio si se?“, efekat „Skenirano / Otvoreno na telefonu“, dostupnost po zemlji,
// dijalog Restarta, korak 7 u bilo kom redosledu, izbor zemlje na T25, parametri u adresi i raspored uspravnog telefona (QR vidljiv).
// Pokretanje (preview mora da radi): npm run e2e:slobodno
import { BASE, KLJUC, izvestaj, otvori, proveravac, sleep } from './_zajednicko.mjs'

const { proveri, lista } = proveravac()
const problemiSvi = []
const spoljniSvi = []

const seme = (page, z) => page.evaluate(([k, v]) => sessionStorage.setItem(k, JSON.stringify({ verzija: 1, kakoViđeno: true, ...v })), [KLJUC, z])
const poz = (page) => page.evaluate((k) => JSON.parse(sessionStorage.getItem(k)), KLJUC)
const ekran = (page, tel = false) => page.evaluate((t) => document.querySelector(t ? '[data-tel-platno] [data-ekran]' : '[data-tv-oblast] [data-ekran]')?.getAttribute('data-ekran') ?? null, tel)
const ode = async (page, hash) => {
  await page.goto(BASE + '?r=' + Math.random().toString(36).slice(2) + hash)
  await sleep(350)
}
const klikTrake = (page, tekst) =>
  page.evaluate((t) => [...document.querySelectorAll('[data-traka] button')].find((b) => (b.getAttribute('aria-label') ?? b.textContent).trim().startsWith(t))?.click(), tekst)

async function nova(opcije = {}, pocetak = {}) {
  const o = await otvori({ sirina: 1366, visina: 768, ...opcije })
  if (pocetak.podsetnikMs) await o.page.evaluateOnNewDocument((ms) => { window.__TV_PODSETNIK_MS = ms }, pocetak.podsetnikMs)
  await o.page.goto(BASE + '#/')
  return o
}
const zavrsi = async (o) => {
  const csp = await o.page.evaluate(() => window.__csp ?? [])
  proveri('0 prijava o kršenju CSP-a', csp.length === 0, csp.join(' | '))
  problemiSvi.push(...o.problemi)
  spoljniSvi.push(...o.spoljni)
  await o.browser.close()
}

// ---------------------------------------------------------------- 1. efekat „Skenirano“ (laptop) i „Otvoreno na telefonu“ (usko)
{
  const o = await nova()
  const { page } = o
  await seme(page, { korak: 4, p: 1, grana: 'grcka', rezim: 'vodjena' })
  await ode(page, '#/tv/qr/doma-tv')
  await page.click('[data-tv-oblast] [data-radnja="skeniraj"]')
  await sleep(150)
  const a = await page.evaluate(() => ({ sija: !!document.querySelector('.okvir-uredjaja--sija'), natpis: document.querySelector('.sija-natpis')?.textContent ?? null }))
  proveri('laptop: posle „Skeniraj“ okvir telefona zasvetli i piše „Skenirano“', a.sija && a.natpis === 'Skenirano', JSON.stringify(a))
  await sleep(2300)
  const b = await page.evaluate(() => !!document.querySelector('.okvir-uredjaja--sija'))
  proveri('laptop: svetljenje prestaje posle ~2 s', b === false)
  await zavrsi(o)
}
{
  const o = await nova({ sirina: 390, visina: 844, telefon: true })
  const { page } = o
  await seme(page, { korak: 4, p: 1, grana: 'grcka', rezim: 'vodjena' })
  await ode(page, '#/tv/qr/doma-tv')
  await page.click('[data-tv-oblast] [data-radnja="skeniraj"]')
  await sleep(200)
  const t = await page.evaluate(() => document.querySelector('.tel-poruka')?.textContent ?? '')
  proveri('uski telefon: posle „Skeniraj“ sam se prebacuje na telefon uz poruku („Skenirano“)', /Skenirano|Otvoreno na telefonu/.test(t), t)
  await zavrsi(o)
}

// ---------------------------------------------------------------- 2. uski uspravni telefon: QR i dugmad su cela unutar televizora
{
  const o = await nova({ sirina: 390, visina: 844, telefon: true })
  const { page } = o
  await seme(page, { korak: 4, p: 1, grana: 'grcka', rezim: 'vodjena' })
  await ode(page, '#/tv/qr/doma-tv')
  const r = await page.evaluate(() => {
    const p = document.querySelector('[data-tv-platno]').getBoundingClientRect()
    const unutra = (s) => {
      const e = document.querySelector(`[data-tv-oblast] ${s}`)
      if (!e) return false
      const b = e.getBoundingClientRect()
      return b.left >= p.left - 1 && b.right <= p.right + 1 && b.top >= p.top - 1 && b.bottom <= p.bottom + 1
    }
    return { qr: unutra('.qr'), skeniraj: unutra('[data-radnja="skeniraj"]'), nazad: unutra('[data-tv-id="qr-nazad"]'), napomena: unutra('.qr-leva .tv-napomena') }
  })
  proveri('uspravni telefon, T13: QR, tekst ispod njega i obe dugmadi su cele u televizoru', r.qr && r.skeniraj && r.nazad && r.napomena, JSON.stringify(r))
  await ode(page, '#/tv/nedostupno/doma-tv')
  const naslov = await page.evaluate(() => {
    const p = document.querySelector('[data-tv-platno]').getBoundingClientRect()
    const b = document.querySelector('[data-tv-oblast] .tv-naslov-ekrana').getBoundingClientRect()
    return b.left >= p.left - 1 && b.right <= p.right + 1 && b.bottom <= p.bottom + 1
  })
  proveri('uspravni telefon, T12: naslov nije odsečen', naslov)
  await zavrsi(o)
}

// ---------------------------------------------------------------- 3. Srbija: nedostupni kanali ne izgledaju dostupno i ne puštaju se
{
  const o = await nova()
  const { page } = o
  await seme(page, { korak: 6, p: 1, grana: 'srbija', rezim: 'vodjena' })
  await ode(page, '#/tv/pocetna')
  const znacke = await page.evaluate(() => Object.fromEntries([...document.querySelectorAll('[data-tv-oblast] .kartica-kanala')].map((k) => [k.getAttribute('data-tv-id'), k.querySelector('.znacka')?.textContent.trim()])))
  proveri('Srbija, T2: CMC, Hayat TV i Doma TV nose „Nije dostupno“', ['besplatni-cmc', 'besplatni-hayat-tv', 'poizboru-doma-tv'].every((id) => znacke[id] === 'Nije dostupno'), JSON.stringify(znacke))
  proveri('Srbija, T2: Klasik je „Besplatno“, Arena Sport 1 ima cenu', znacke['besplatni-klasik-tv'] === 'Besplatno' && /mesečno/.test(znacke['poizboru-arena-sport-1'] ?? ''), JSON.stringify(znacke))
  await page.click('[data-tv-id="besplatni-cmc"]')
  await sleep(150)
  proveri('Srbija: klik na CMC vodi na stranicu kanala (T8), ne na gledanje', (await ekran(page)) === 'T8', String(await ekran(page)))
  await ode(page, '#/tv/gledaj/cmc')
  proveri('Srbija: adresa gledanja nedostupnog kanala prikazuje poruku (T12), ne pušta kanal', (await ekran(page)) === 'T12', String(await ekran(page)))
  await seme(page, { korak: 9, p: 0, grana: 'grcka', rezim: 'slobodno' })
  await ode(page, '#/tv/gledaj/rts-1')
  proveri('kanal iz paketa bez pretplate se ne pušta: T9 prikazuje stranicu kanala sa paketom i cenom', (await ekran(page)) === 'T8', String(await ekran(page)))
  const dugme = await page.evaluate(() => document.querySelector('[data-tv-id="kanal-glavno"]')?.textContent.trim())
  proveri('T8 kanala iz paketa: dugme „Pogledaj Paket …“ (ne „Gledaj“)', /^Pogledaj Paket/.test(dugme ?? ''), String(dugme))
  await page.click('[data-tv-id="kanal-glavno"]')
  await sleep(150)
  proveri('…na T16 (stranica paketa)', (await ekran(page)) === 'T16', String(await ekran(page)))
  await ode(page, '#/tv/qr/cmc')
  proveri('adresa T13 za besplatni kanal se odbija (nikad prazan ekran) → T2', (await ekran(page)) === 'T2', String(await ekran(page)))
  await ode(page, '#/tv/otkljucano/arena-sport-1')
  proveri('adresa T14 za kanal bez pretplate prikazuje T8 (ne „Taj ekran ne postoji“)', (await ekran(page)) === 'T8', String(await ekran(page)))
  await zavrsi(o)
}

// ---------------------------------------------------------------- 4. dijalog Restarta: TV komande se ignorišu, fokus ostaje u dijalogu
{
  const o = await nova()
  const { page } = o
  await seme(page, { korak: 9, p: 0, grana: 'grcka', rezim: 'slobodno' })
  await ode(page, '#/tv/pocetna')
  const pre = await page.evaluate(() => document.querySelector('[data-tv-oblast] [data-izabran]')?.getAttribute('data-tv-id'))
  await klikTrake(page, 'Restart')
  await page.waitForSelector('.dijalog')
  await page.keyboard.press('ArrowDown')
  await page.keyboard.press('ArrowRight')
  const posle = await page.evaluate(() => document.querySelector('[data-tv-oblast] [data-izabran]')?.getAttribute('data-tv-id'))
  proveri('dijalog Restarta otvoren: strelice ne pomeraju izbor na televizoru', pre === posle, `${pre} → ${posle}`)
  await page.click('.dijalog h2') // klik u dijalogu van dugmadi
  await sleep(100)
  const fokus = await page.evaluate(() => document.activeElement?.textContent.trim())
  proveri('klik van dijaloga ne odnosi fokus iz dijaloga (vraća se na „Odustani“)', fokus === 'Odustani', fokus)
  await page.keyboard.press('Escape')
  await sleep(100)
  await zavrsi(o)
}

// ---------------------------------------------------------------- 5. korak 7 u bilo kom redosledu i T19 → telefon
{
  const o = await nova()
  const { page } = o
  await seme(page, { korak: 7, p: 1, grana: 'grcka', rezim: 'vodjena' })
  await ode(page, '#/tv/otkazano/doma-tv?tel=/pretplate')
  await page.click('[data-tel-platno] [data-radnja="otkazi-ugovore"]')
  await sleep(150)
  let p = await poz(page)
  proveri('korak 7: „Verträge hier kündigen“ se prihvata i u 7/1 (preskače „U redu“) → 7/3, P9', p.korak === 7 && p.p === 3 && (await ekran(page, true)) === 'P9', JSON.stringify(p))
  await seme(page, { korak: 7, p: 0, grana: 'grcka', rezim: 'vodjena' })
  await ode(page, '#/tv/pretplate')
  await page.click('[data-tv-oblast] [data-tv-id^="pretplata-otkazi-"]')
  await sleep(200)
  const t = await page.evaluate(() => ({ tel: document.querySelector('[data-tel-platno] [data-ekran]')?.getAttribute('data-ekran'), natpis: document.querySelector('.sija-natpis')?.textContent ?? null }))
  proveri('T19: „Otkaži“ kod paketa otvara telefon na P8 uz „Otvoreno na telefonu“', t.tel === 'P8' && t.natpis === 'Otvoreno na telefonu', JSON.stringify(t))
  const napomena = await page.evaluate(() => document.querySelector('[data-tv-oblast] .tv-napomena')?.textContent)
  proveri('T19 napomena: kanal se otkazuje ovde, paket na telefonu', /Kanal otkazuješ jednim klikom ovde; paket na telefonu\. Bez dodatnih pitanja\./.test(napomena ?? ''), String(napomena))
  await zavrsi(o)
}

// ---------------------------------------------------------------- 6. T25: izbor zemlje uvek postavlja granu i poziciju
{
  const o = await nova()
  const { page } = o
  await seme(page, { korak: 6, p: 0, grana: 'grcka', rezim: 'vodjena' })
  await ode(page, '#/tv/podesavanja/zemlja')
  const zemlja0 = await page.evaluate(() => document.querySelector('.tv-profil span')?.textContent ?? '')
  proveri('korak 6/0: zemlja u zaglavlju je Nemačka (porodica tek bira)', /Nemačka/.test(zemlja0), zemlja0)
  await page.click('[data-tv-id="zemlja-srbija"]')
  await sleep(200)
  let p = await poz(page)
  proveri('T25: Srbija sa granom Grčka prebacuje granu i poziciju (6/1, Srbija, T27)', p.korak === 6 && p.p === 1 && p.grana === 'srbija' && (await ekran(page)) === 'T27', JSON.stringify(p))
  await ode(page, '#/tv/podesavanja/zemlja')
  await page.click('[data-tv-id="zemlja-nemacka"]')
  await sleep(200)
  p = await poz(page)
  proveri('T25: Nemačka vraća poziciju 6/0 i vodi na T2', p.korak === 6 && p.p === 0 && (await ekran(page)) === 'T2', JSON.stringify(p))
  await zavrsi(o)
}

// ---------------------------------------------------------------- 7. slobodni sloj: pretplata van priče, brisanje stavki priče pri navigaciji priče
{
  const o = await nova()
  const { page } = o
  await seme(page, { korak: 9, p: 0, grana: 'grcka', rezim: 'slobodno' })
  await ode(page, '#/tv/pocetna?tel=/placanje/arena-sport-1')
  await page.click('[data-tel-platno] [data-radnja="plati"]')
  await sleep(200)
  const toast = await page.evaluate(() => document.querySelector('.tv-toast')?.textContent ?? document.querySelector('.tel-poruka')?.textContent ?? '')
  proveri('posle lažne pretplate javlja se „Simulirana radnja — ništa nije poslato ni naplaćeno“', /Simulirana radnja — ništa nije poslato ni naplaćeno/.test(toast), toast)
  await page.evaluate(() => (location.hash = '#/tv/pretplate'))
  await sleep(250)
  const redova = await page.evaluate(() => [...document.querySelectorAll('.pretplata-red .vodic-naziv')].map((e) => e.textContent))
  proveri('slobodni sloj: pretplata na Arena Sport 1 se vidi na T19', redova.length === 1 && /Arena/.test(redova[0]), JSON.stringify(redova))
  // pretplata na kanal iz priče pa navigacija priče: ostaje samo ono van priče
  await page.evaluate(() => (location.hash = '#/tv/pocetna?tel=/placanje/doma-tv'))
  await sleep(250)
  await page.click('[data-tel-platno] [data-radnja="plati"]')
  await sleep(200)
  await klikTrake(page, 'Nazad') // navigacija priče (9/0 → 8/0)
  await sleep(250)
  await page.evaluate(() => (location.hash = '#/tv/pretplate'))
  await sleep(250)
  const posle = await page.evaluate(() => [...document.querySelectorAll('.pretplata-red .vodic-naziv')].map((e) => e.textContent))
  proveri('navigacija priče briše pretplatu na kanal iz priče (Doma TV), a pretplata van priče ostaje', posle.length === 1 && /Arena/.test(posle[0]), JSON.stringify(posle))
  await zavrsi(o)
}

// ---------------------------------------------------------------- 8. „Izgubio si se?“: samo slobodno, jednom po ekranu
{
  const o = await nova({}, { podsetnikMs: 1200 })
  const { page } = o
  await seme(page, { korak: 3, p: 0, grana: 'grcka', rezim: 'vodjena' })
  await ode(page, '#/tv/pocetna')
  await sleep(1800)
  proveri('vođeni režim: „Izgubio si se?“ se NE pojavljuje', (await page.$('[data-izgubio-se]')) === null)
  await page.evaluate(() => [...document.querySelectorAll('[data-traka] .segment button')].find((b) => b.textContent.trim() === 'Slobodno')?.click())
  await sleep(1900)
  proveri('slobodni režim, mirovanje: pojavljuje se „Izgubio si se?“', (await page.$('[data-izgubio-se]')) !== null)
  await page.click('[data-izgubio-se] .izgubio-x')
  await sleep(1900)
  proveri('posle zatvaranja se na istom ekranu NE pojavljuje ponovo', (await page.$('[data-izgubio-se]')) === null)
  await page.evaluate(() => (location.hash = '#/tv/kanali'))
  await sleep(1900)
  proveri('na novom ekranu se pojavljuje ponovo (jednom po ekranu)', (await page.$('[data-izgubio-se]')) !== null)
  await page.evaluate(() => document.querySelector('[data-izgubio-se] button:not(.izgubio-x)')?.click())
  await sleep(300)
  const stanje = await poz(page)
  proveri('„Nazad na priču“ vraća u vođeni režim', stanje.rezim === 'vodjena', JSON.stringify(stanje))
  await zavrsi(o)
}

// ---------------------------------------------------------------- 9. Restart sa table čuva ugao
{
  const o = await nova()
  const { page } = o
  await seme(page, { korak: 8, p: 0, grana: 'grcka', rezim: 'vodjena' })
  await ode(page, '#/tabla/vesna')
  await klikTrake(page, 'Restart')
  await page.waitForSelector('.dijalog')
  await page.evaluate(() => document.querySelector('.dijalog-da')?.click())
  await sleep(300)
  const s = await page.evaluate(() => ({ hash: location.hash, tabla: !!document.querySelector('.tabla[data-ekran="V1"]') }))
  const p = await poz(page)
  proveri('Restart sa table: pozicija 1/0, a ugao (tabla) ostaje', p.korak === 1 && p.p === 0 && s.tabla, JSON.stringify({ p, s }))
  await zavrsi(o)
}

// ---------------------------------------------------------------- 10. vodič na krupnom platnu: lepljiva kolona kanala, izabrano polje nikad ispod nje
{
  const o = await nova({ sirina: 844, visina: 390, telefon: true })
  const { page } = o
  await seme(page, { korak: 9, p: 0, grana: 'grcka', rezim: 'slobodno' })
  await ode(page, '#/tv/vodic')
  const greske = []
  for (let i = 0; i < 14; i++) {
    await page.keyboard.press(i < 7 ? 'ArrowRight' : 'ArrowDown')
    await sleep(25)
    const r = await page.evaluate(() => {
      const iz = document.querySelector('[data-tv-oblast] [data-izabran]')
      if (!iz || !iz.classList.contains('vodic-polje')) return null
      const red = iz.style.gridRow
      const kanal = [...document.querySelectorAll('.vodic-kanal')].find((k) => k.style.gridRow === red)
      if (!kanal) return null
      return { polje: iz.getBoundingClientRect().left, kanalDesno: kanal.getBoundingClientRect().right }
    })
    if (r && r.polje < r.kanalDesno - 2) greske.push(`korak ${i}: polje ${Math.round(r.polje)} < kolona ${Math.round(r.kanalDesno)}`)
  }
  proveri('krupno platno: izabrano polje vodiča nikad nije ispod lepljive kolone kanala', greske.length === 0, greske.join(' | '))
  await zavrsi(o)
}

process.exit(izvestaj('e2e-slobodno', lista, problemiSvi, spoljniSvi) ? 0 : 1)
