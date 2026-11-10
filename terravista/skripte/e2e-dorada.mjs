// E2E DORADA TALASA 2: ceo QR tok za drugi proizvod, provera parametara telefona, početni fokus (ne gornja traka),
// toast dugme tasterom, Srbija u vodiču i U3 na 390 px. Pokretanje (preview mora da radi): npm run e2e:dorada
import { BASE, KLJUC, izvestaj, otvori, proveravac, sleep } from './_zajednicko.mjs'

const { proveri, lista } = proveravac()
const problemi = []
const spoljni = []

const seme = (page, z) => page.evaluate(([k, v]) => sessionStorage.setItem(k, JSON.stringify({ verzija: 1, kakoViđeno: true, ...v })), [KLJUC, z])
const ode = async (page, hash) => {
  await page.goto(BASE + '?r=' + Math.random().toString(36).slice(2) + hash)
  await sleep(350)
}
const tvEkran = (page) => page.evaluate(() => document.querySelector('[data-tv-oblast] [data-ekran]')?.dataset.ekran ?? null)
const telEkran = (page) => page.evaluate(() => document.querySelector('[data-tel-platno] [data-ekran]')?.dataset.ekran ?? null)
const telTekst = (page) => page.evaluate(() => document.querySelector('[data-tel-platno]')?.innerText ?? '')
const klikTel = (page, radnja) => page.evaluate((r) => document.querySelector(`[data-tel-platno] [data-radnja="${r}"]`)?.click(), radnja)
const izabran = (page) => page.evaluate(() => document.querySelector('[data-tv-oblast] [data-izabran]')?.getAttribute('data-tv-id') ?? null)

async function nova(opcije = {}) {
  const o = await otvori({ sirina: 1366, visina: 768, ...opcije })
  await o.page.goto(BASE + '#/')
  return o
}
const zavrsi = async (o) => {
  problemi.push(...o.problemi)
  spoljni.push(...o.spoljni)
  await o.browser.close()
}

// ---------------------------------------------------------------- 1. ceo QR tok T13 → P2 → P3 → P4 → P5 za kanal i za paket (slobodno)
for (const [proizvod, naziv] of [['arena-sport-1', 'Arena Sport 1'], ['srbija', 'Paket Srbija']]) {
  const o = await nova()
  const { page } = o
  await seme(page, { korak: 1, p: 0, grana: 'grcka', rezim: 'slobodno' })
  await ode(page, `#/tv/qr/${proizvod}`)
  await page.click('[data-tv-oblast] [data-radnja="skeniraj"]')
  await sleep(250)
  proveri(`QR ${naziv}: posle „Skeniraj“ telefon je na P2`, (await telEkran(page)) === 'P2', String(await telEkran(page)))
  await klikTel(page, 'nastavi-kao-ana')
  await sleep(250)
  const p3 = await telTekst(page)
  proveri(`QR ${naziv}: P3 pominje taj proizvod`, (await telEkran(page)) === 'P3' && p3.includes(naziv), `${await telEkran(page)} | ${p3.slice(0, 120)}`)
  await page.evaluate(() => document.querySelector('[data-tel-platno] input[type=checkbox]')?.click())
  await sleep(100)
  await klikTel(page, 'na-placanje')
  await sleep(250)
  proveri(`QR ${naziv}: P4 pominje taj proizvod`, (await telEkran(page)) === 'P4' && (await telTekst(page)).includes(naziv), `${await telEkran(page)}`)
  await klikTel(page, 'plati')
  await sleep(300)
  proveri(`QR ${naziv}: P5 pominje taj proizvod`, (await telEkran(page)) === 'P5' && (await telTekst(page)).includes(naziv), `${await telEkran(page)}`)
  await klikTel(page, 'vrati-na-tv')
  await sleep(300)
  const pret = await page.evaluate((k) => JSON.stringify(JSON.parse(sessionStorage.getItem(k)).sloj.operacije), KLJUC)
  proveri(`QR ${naziv}: u slobodnom sloju je kupljen taj proizvod`, pret.includes(proizvod), pret)
  await zavrsi(o)
}

// ---------------------------------------------------------------- 2. parametri telefona: loše adrese ne ruše prikaz
{
  const o = await nova()
  const { page } = o
  await seme(page, { korak: 1, p: 0, grana: 'grcka', rezim: 'slobodno' })
  for (const t of ['/paket/doma-tv', '/narudzba/klasik-tv', '/placanje/klasik-tv', '/aktivno/klasik-tv', '/prijava/klasik-tv']) {
    await ode(page, `#/tv/pocetna?tel=${t}`)
    const tv = await tvEkran(page)
    const tel = await telEkran(page)
    proveri(`adresa ?tel=${t}: televizor ostaje prikazan, telefon ne puca`, tv === 'T2' && !!tel && !['P2', 'P3', 'P4', 'P5', 'P7'].includes(tel), `${tv}/${tel}`)
  }
  await zavrsi(o)
}

// ---------------------------------------------------------------- 3. početni fokus nije gornja traka
{
  const o = await nova()
  const { page } = o
  await seme(page, { korak: 1, p: 0, grana: 'grcka', rezim: 'slobodno' })
  for (const [hash, naziv] of [
    ['#/tv/pretraga/sport', 'T18 rezultati'],
    ['#/tv/pretplate', 'T19 prazne pretplate'],
    ['#/tv/kanal/arena-sport-1', 'T8 kanal bez pretplate'],
    ['#/tv/kanal/doma-tv', 'T8 kanal'],
    ['#/tv/gledaj/klasik-tv', 'T9'],
  ]) {
    await ode(page, hash)
    const id = await izabran(page)
    proveri(`početni fokus ${naziv}: nije gornja traka (${id})`, !!id && !id.startsWith('nav-'), String(id))
  }
  await zavrsi(o)
}

// ---------------------------------------------------------------- 4. poruka „Idi na korak N“ NE preuzima tastaturu; dugme je dostupno u traci, klikom i Tab-om; traje ≥ 6 s
{
  const o = await nova()
  const { page } = o
  await seme(page, { korak: 2, p: 0, grana: 'grcka', rezim: 'vodjena' })
  await ode(page, '#/tv/qr/doma-tv')
  const pre = await izabran(page)
  await page.click('[data-tv-oblast] [data-radnja="skeniraj"]')
  await sleep(150)
  const uTraci = await page.evaluate(() => document.querySelector('[data-traka] .traka-poruka-dugme')?.textContent ?? null)
  proveri('poruka nudi „Idi na korak 4“ kao dugme u traci priče', uTraci === 'Idi na korak 4', String(uTraci))
  proveri('poruka NE uzima izbor televizora', (await izabran(page)) === pre, `${pre} → ${await izabran(page)}`)
  for (const t of ['ArrowDown', 'ArrowUp', 'ArrowRight', 'ArrowLeft']) {
    if ((await izabran(page)) !== pre) break
    await page.keyboard.press(t)
    await sleep(80)
  }
  proveri('strelica i dalje upravlja ekranom dok poruka traje', (await izabran(page)) !== pre && (await page.$('.tv-toast')) !== null, String(await izabran(page)))
  await sleep(4300)
  proveri('poruka traje najmanje 6 s', (await page.$('.tv-toast')) !== null)
  await page.focus('[data-traka] .traka-poruka-dugme')
  await page.keyboard.press('Enter')
  await sleep(250)
  const s = await page.evaluate((k) => JSON.parse(sessionStorage.getItem(k)).korak, KLJUC)
  proveri('Tab/Enter na dugmetu u traci vodi na korak 4', s === 4, String(s))
  await zavrsi(o)
}

// ---------------------------------------------------------------- 5. Srbija u vodiču označava nedostupne kanale
{
  const o = await nova()
  const { page } = o
  await seme(page, { korak: 1, p: 0, grana: 'srbija', rezim: 'slobodno', sloj: { operacije: [], titlovi: true, velicinaTitlova: 'srednji', roditeljska: false, uzrast: '12+', obavestenja: true, personalizovane: false, zemlja: 'RS' } })
  await ode(page, '#/tv/vodic')
  const t = await page.evaluate(() => document.querySelector('[data-tv-oblast]')?.innerText ?? '')
  proveri('T3 u Srbiji: nedostupni kanali su označeni „Nije dostupno“', /Nije dostupno/.test(t))
  await zavrsi(o)
}

// ---------------------------------------------------------------- 6. U3 na 390 px: nema vodoravnog skrola
{
  const o = await nova({ sirina: 390, visina: 844, telefon: true })
  const { page } = o
  await ode(page, '#/o-demou')
  const r = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }))
  proveri('U3 na 390 px: nema vodoravnog skrola', r.sw <= r.cw, JSON.stringify(r))
  await zavrsi(o)
}

// ---------------------------------------------------------------- 7. isto prikazano stanje: korak-po-korak „Dalje“ naspram skoka na tačku koraka
{
  const o = await nova()
  const { page } = o
  const prikaz = () =>
    page.evaluate(() => ({
      tv: document.querySelector('[data-tv-oblast] [data-ekran]')?.dataset.ekran,
      tel: document.querySelector('[data-tel-platno] [data-ekran]')?.dataset.ekran,
      traka: document.querySelector('[data-traka]')?.innerText.replace(/\s+/g, ' '),
      izabran: document.querySelector('[data-tv-oblast] [data-izabran]')?.dataset.tvId,
    }))
  const stanje = () => page.evaluate((k) => { const z = JSON.parse(sessionStorage.getItem(k)); return z.korak * 100 + z.p }, KLJUC)
  const dalje = () => page.evaluate(() => [...document.querySelectorAll('[data-traka] button')].find((b) => b.textContent.trim().startsWith('Dalje'))?.click())
  for (const grana of ['grcka', 'srbija']) {
    // prolaz „Dalje“: beleži prikaz na početku svakog koraka
    await seme(page, { korak: 1, p: 0, grana, rezim: 'vodjena' })
    await ode(page, '#/tv/pokretanje')
    const redom = {}
    for (let i = 0; i < 60; i++) {
      const z = await stanje()
      if (z % 100 === 0 && !redom[z / 100]) redom[z / 100] = await prikaz()
      await dalje()
      await sleep(70)
    }
    for (const k of Object.keys(redom)) {
      if (Number(k) === 1) continue
      await seme(page, { korak: 1, p: 0, grana, rezim: 'vodjena' })
      await ode(page, '#/tv/pokretanje')
      await page.evaluate((i) => document.querySelectorAll('[data-traka] .tacka')[i]?.click(), Number(k) - 1)
      await sleep(150)
      const skok = await prikaz()
      const a = JSON.stringify(redom[k])
      const b = JSON.stringify(skok)
      proveri(`${grana}, korak ${k}: prikaz posle „Dalje“ i posle skoka je isti`, a === b, a + ' <> ' + b)
    }
  }
  await zavrsi(o)
}

// ---------------------------------------------------------------- 8. vođena priča: telefonske kartice P11–P16 su dostižne preko jezička „Nalog“; računi prate priču
{
  const o = await nova()
  const { page } = o
  await seme(page, { korak: 5, p: 0, grana: 'srbija', rezim: 'vodjena' })
  await ode(page, '#/tv/pocetna')
  await page.evaluate(() => [...document.querySelectorAll('[data-tel-platno] button')].find((b) => b.textContent.trim() === 'Nalog')?.click())
  await sleep(200)
  proveri('vođena priča: jezičak „Nalog“ otvara P14', (await telEkran(page)) === 'P14', String(await telEkran(page)))
  const idi = async (tekst) => {
    await page.evaluate((t) => [...document.querySelectorAll('[data-tel-platno] button')].find((b) => b.textContent.includes(t))?.click(), tekst)
    await sleep(200)
    return telEkran(page)
  }
  proveri('iz P14 se stiže do P12 (Računi)', (await idi('Računi')) === 'P12')
  const racuni = await page.evaluate(() => document.querySelectorAll('[data-tel-platno] .tel-lista li').length)
  proveri('računi prate priču: prikazan je bar jedan račun kad postoji pretplata', racuni >= 1, String(racuni))
  await zavrsi(o)
}

// ---------------------------------------------------------------- 9. T11 „Gledanje unazad“: direktna adresa ne pušta kanal bez pretplate / nedostupan u zemlji
{
  const o = await nova()
  const { page } = o
  await seme(page, { korak: 1, p: 0, grana: 'grcka', rezim: 'slobodno' })
  await ode(page, '#/tv/unazad/rts-1')
  proveri('T11 za kanal iz paketa bez pretplate vodi na stranicu kanala (T8)', (await tvEkran(page)) === 'T8', String(await tvEkran(page)))
  await ode(page, '#/tv/unazad/klasik-tv')
  proveri('T11 za besplatan kanal radi', (await tvEkran(page)) === 'T11', String(await tvEkran(page)))
  await seme(page, { korak: 1, p: 0, grana: 'srbija', rezim: 'slobodno', sloj: { operacije: [], titlovi: true, velicinaTitlova: 'srednji', roditeljska: false, uzrast: '12+', obavestenja: true, personalizovane: false, zemlja: 'RS' } })
  await ode(page, '#/tv/unazad/viasat-explore')
  const prvi = await page.evaluate(() => document.querySelector('[data-tv-oblast] .kartica-emisije')?.innerText ?? '')
  await page.evaluate(() => document.querySelector('[data-tv-id="unazad-dan-0"]')?.click())
  await sleep(150)
  const drugi = await page.evaluate(() => document.querySelector('[data-tv-oblast] .kartica-emisije')?.innerText ?? '')
  proveri('T11: drugi dan prikazuje drugačiji redosled emisija', prvi !== drugi, prvi.slice(0, 30) + ' / ' + drugi.slice(0, 30))
  await zavrsi(o)
}

// ---------------------------------------------------------------- 10. ErrorBoundary: namerno puknuće pri prikazu → poruka, oznaka demoa, „Vrati na početak“ radi
{
  const o = await nova()
  const { page } = o
  await seme(page, { korak: 3, p: 0, grana: 'grcka', rezim: 'vodjena' })
  await ode(page, '#/tv/pocetna')
  // prikaz sledeće promene baca grešku (padStart se koristi pri prikazu cena i vremena)
  await page.evaluate(() => {
    String.prototype.padStart = () => {
      throw new Error('namerna greška za proveru')
    }
  })
  await page.evaluate(() => [...document.querySelectorAll('[data-traka] button')].find((b) => b.textContent.trim().startsWith('Dalje'))?.click())
  await sleep(300)
  const t = await page.evaluate(() => document.querySelector('.greska-okvir')?.innerText ?? null)
  proveri('posle greške je prikazana poruka „Nešto nije u redu u demou“ (ne beli ekran)', !!t && t.includes('Nešto nije u redu u demou'), String(t))
  const oz = await page.evaluate(() => document.querySelector('[data-oznaka-demoa]')?.textContent ?? null)
  proveri('oznaka demoa je i dalje vidljiva na ekranu greške', !!oz && oz.includes('Demo'), String(oz))
  o.problemi.length = 0 // namerna greška se ne računa kao nalaz
  await page.evaluate(() => [...document.querySelectorAll('.greska-okvir button')].find((b) => b.textContent.includes('Vrati na početak'))?.click())
  await sleep(900)
  const posle = await page.evaluate(() => ({ hash: location.hash, ekran: document.querySelector('[data-ekran]')?.dataset.ekran, cuvanje: sessionStorage.getItem('terravista.demo.v1') }))
  proveri('„Vrati na početak“ vraća na uvodni ekran U1 sa čistim stanjem', posle.ekran === 'U1' && (posle.cuvanje === null || JSON.parse(posle.cuvanje).korak === 1), JSON.stringify(posle))
  await zavrsi(o)
}

// ---------------------------------------------------------------- 11. završna dorada: preusmeravanja, povratak u vođenu priču, sr-only, dno table, kartica u traci, „Reklama“
{
  const o = await nova()
  const { page } = o
  // T14 / T12 preusmeravaju (ne ugrađuju tuđu komponentu)
  await seme(page, { korak: 1, p: 0, grana: 'grcka', rezim: 'slobodno' })
  await ode(page, '#/tv/otkljucano/doma-tv')
  proveri('T14 za kanal bez pretplate: adresa se menja na T8', (await tvEkran(page)) === 'T8' && (await page.evaluate(() => location.hash.includes('/tv/kanal/doma-tv'))), String(await tvEkran(page)))
  await ode(page, '#/tv/nedostupno/doma-tv')
  proveri('T12 ručnom adresom za kanal koji JE dostupan: adresa se menja na T8', (await tvEkran(page)) === 'T8', String(await tvEkran(page)))
  await ode(page, '#/tv/gledaj/rts-1')
  proveri('T9 za kanal iz paketa bez pretplate: T8', (await tvEkran(page)) === 'T8', String(await tvEkran(page)))
  // slobodno → vođena briše ručnu zemlju i operacije nad stavkama priče
  await seme(page, { korak: 3, p: 0, grana: 'grcka', rezim: 'slobodno', sloj: { operacije: [{ tip: 'pretplati', proizvod: 'doma-tv' }], titlovi: false, velicinaTitlova: 'srednji', roditeljska: false, uzrast: '12+', obavestenja: true, personalizovane: false, zemlja: 'AT' } })
  await ode(page, '#/tv/pocetna')
  await page.evaluate(() => [...document.querySelectorAll('[data-traka] .segment button')].find((b) => b.textContent.trim() === 'Vođena')?.click())
  await sleep(200)
  const sloj = await page.evaluate((k) => JSON.parse(sessionStorage.getItem(k)).sloj, KLJUC)
  proveri('povratak u „Vođena“: ručna zemlja i operacije nad stavkom priče su obrisane, ostala podešavanja ostaju', sloj.zemlja === null && sloj.operacije.length === 0 && sloj.titlovi === false, JSON.stringify(sloj))
  // V1 Srbija: „—“ ima tekst za čitač; dno table je dostižno skrolom i nije ispod trake
  await seme(page, { korak: 8, p: 0, grana: 'grcka', rezim: 'vodjena' })
  await ode(page, '#/tabla/vesna')
  const sr = await page.evaluate(() => [...document.querySelectorAll('.sr-only')].map((e) => e.textContent).join(' | '))
  proveri('V1: „—“ za Srbiju ima sr-only objašnjenje o pravima', /Nema gledanosti/.test(sr) && /nisu obezbeđena/.test(sr), sr)
  for (const hash of ['#/tabla/vesna', '#/tabla/platforma']) {
    await ode(page, hash)
    const r = await page.evaluate(() => {
      const t = document.querySelector('.tabla')
      t.scrollTop = t.scrollHeight
      const zadnji = [...t.querySelectorAll('*')].filter((e) => e.getBoundingClientRect().height > 0).pop()
      const traka = document.querySelector('[data-traka]').getBoundingClientRect().top
      return { dno: Math.round(zadnji.getBoundingClientRect().bottom), traka: Math.round(traka) }
    })
    proveri(`${hash}: kad se skroluje do kraja, sadržaj nije ispod trake priče`, r.dno <= r.traka + 1, JSON.stringify(r))
  }
  await zavrsi(o)
}
{
  // „Reklama“ u vodiču nikad odsečena
  const o = await nova()
  const { page } = o
  await seme(page, { korak: 1, p: 0, grana: 'grcka', rezim: 'slobodno' })
  await ode(page, '#/tv/vodic')
  const odsecena = await page.evaluate(() => [...document.querySelectorAll('.vodic-polje--reklama .znacka')].filter((z) => z.scrollWidth > z.clientWidth + 1 || z.parentElement.clientWidth < z.scrollWidth).length)
  proveri('TV vodič: nijedna oznaka „Reklama“ nije odsečena', odsecena === 0, String(odsecena))
  await zavrsi(o)
}
{
  // uska traka: dodir kartice otvara ceo tekst
  const o = await nova({ sirina: 390, visina: 844, telefon: true })
  const { page } = o
  await seme(page, { korak: 3, p: 0, grana: 'grcka', rezim: 'vodjena' })
  await ode(page, '#/tv/pocetna')
  const pre = await page.evaluate(() => document.querySelector('.traka-kartica-red').getBoundingClientRect().height)
  await page.evaluate(() => document.querySelector('.traka-kartica-red').click())
  await sleep(150)
  const posle = await page.evaluate(() => ({ h: document.querySelector('.traka-kartica-red').getBoundingClientRect().height, ex: document.querySelector('.traka-kartica-red').getAttribute('aria-expanded') }))
  proveri('uska traka: dodir kartice otvara ceo tekst (viša kartica, aria-expanded)', posle.ex === 'true' && posle.h > pre, `${pre} → ${posle.h}`)
  await zavrsi(o)
}

process.exit(izvestaj('e2e-dorada', lista, problemi, spoljni) ? 0 : 1)
