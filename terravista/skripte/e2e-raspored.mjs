// E2E RASPORED (PLAN B6.3, B8.2): čitljivost televizora i smeštaj u PRAVOM prozoru (Chrome sa trakama: ~1366×650, ~1536×740 pri Windows 125 %).
// Najmanji TV tekst (24 TV jedinice × faktor umanjenja) ≥ 11 px na laptopu; stranica se ne pomera; fokus ne beži posle klika na traku/prekidač
// u širokom i uskom prikazu (683×390 i 390×844). Pokretanje (preview mora da radi): npm run e2e:raspored
import { BASE, izvestaj, otvori, proveravac, sleep } from './_zajednicko.mjs'

const { proveri, lista } = proveravac()
const probleme = []
const spoljni = []
const NAJMANJE_PX = 11

for (const [w, h] of [[1366, 650], [1280, 640], [1536, 740], [1366, 768], [1280, 720], [1440, 900], [1920, 950], [1920, 1080]]) {
  const o = await otvori({ sirina: w, visina: h })
  await o.page.goto(BASE + '#/tv/pocetna')
  await sleep(250)
  const r = await o.page.evaluate(() => {
    const s = parseFloat(document.querySelector('[data-tv-oblast]').dataset.skala)
    const traka = document.querySelector('[data-traka]').getBoundingClientRect()
    const tv = document.querySelector('[data-tv-oblast]').getBoundingClientRect()
    return { s, najmanji: +(24 * s).toFixed(1), skrol: document.documentElement.scrollHeight - innerHeight, traka: tv.bottom > traka.top + 1 }
  })
  proveri(`${w}×${h}: najmanji TV tekst ${r.najmanji} px (≥ ${NAJMANJE_PX}), bez skrola stranice, televizor ne ulazi u traku`, r.najmanji >= NAJMANJE_PX && r.skrol <= 0 && !r.traka, JSON.stringify(r))
  probleme.push(...o.problemi)
  spoljni.push(...o.spoljni)
  await o.browser.close()
}

// telefon u laptop okviru: stvarni najmanji tekst (font × umanjenje okvira) ≥ 10 px na više ekrana telefona
const TELEFONI = ['/pocetna', '/paketi', '/paket/film', '/narudzba/doma-tv', '/placanje/doma-tv', '/pretplate', '/racuni', '/nalog', '/pomoc', '/uslovi/doma-tv']
for (const [w, h] of [[1366, 650], [1366, 768], [1440, 900]]) {
  const o = await otvori({ sirina: w, visina: h })
  const lose = []
  for (const t of TELEFONI) {
    await o.page.goto(BASE + '?r=' + Math.random().toString(36).slice(2) + '#/tv/pocetna?tel=' + t)
    await sleep(250)
    const r = await o.page.evaluate(() => {
      const okvir = document.querySelector('.okvir-uredjaja--tel')
      const s = parseFloat(okvir.dataset.skala)
      let najmanji = 99
      let gde = ''
      const hodaj = document.createTreeWalker(document.querySelector('[data-tel-platno]'), NodeFilter.SHOW_TEXT)
      for (let n = hodaj.nextNode(); n; n = hodaj.nextNode()) {
        if (!n.textContent.trim() || !n.parentElement.checkVisibility()) continue
        const px = parseFloat(getComputedStyle(n.parentElement).fontSize) * s
        if (px < najmanji) { najmanji = px; gde = n.textContent.trim().slice(0, 30) }
      }
      return { najmanji: +najmanji.toFixed(1), gde, s: +s.toFixed(2) }
    })
    if (r.najmanji < 11) lose.push(`${t}: ${r.najmanji} px (${r.gde}), skala ${r.s}`)
  }
  proveri(`${w}×${h}: najmanji tekst u telefonu ≥ 11 px na ${TELEFONI.length} ekrana`, lose.length === 0, lose.join(' | '))
  probleme.push(...o.problemi)
  spoljni.push(...o.spoljni)
  await o.browser.close()
}

// fokus ne beži: klik na „Dalje“ i na prekidač, pa strelica
for (const [w, h, telefon, naziv] of [[1366, 650, false, 'široki prikaz'], [683, 390, true, 'uski vodoravni 683×390'], [390, 844, true, 'uski uspravni 390×844']]) {
  const o = await otvori({ sirina: w, visina: h, telefon })
  const { page } = o
  await page.goto(BASE + '#/tv/pocetna')
  await sleep(200)
  // pozicija 2/0 (T2, izbor na prvoj besplatnoj kartici): „Dalje“ dva puta
  const klik = async (tekst) =>
    page.evaluate((t) => [...document.querySelectorAll('[data-traka] button')].find((b) => (b.getAttribute('aria-label') ?? b.textContent).trim().startsWith(t))?.click(), tekst)
  // sa T2 (1/0 je T1 u priči; ovde je rezim slobodan link) — dovoljno je biti na T2 sa izabranom karticom
  await page.evaluate(() => { location.hash = '#/tv/pocetna' })
  await klik('Dalje')
  await sleep(120)
  const izabran = () => page.evaluate(() => document.querySelector('[data-tv-oblast] [data-izabran]')?.getAttribute('data-tv-id'))
  const a = await izabran()
  await page.keyboard.press('ArrowDown')
  await sleep(40)
  const b = await izabran()
  proveri(`${naziv}: posle klika na „Dalje“ strelica upravlja televizorom`, !!a && !!b && a !== b, `${a} → ${b}`)
  if (telefon) {
    await klik('Meni demoa')
    await sleep(60)
    await page.evaluate(() => [...document.querySelectorAll('.meni-telefona .segment button')].find((x) => x.textContent.trim() === 'Slobodno')?.click())
    await sleep(60)
    await page.evaluate(() => document.querySelector('.meni-telefona')?.remove?.())
    await page.keyboard.press('ArrowDown')
    await sleep(40)
    const c = await izabran()
    proveri(`${naziv}: posle klika u meniju „≡“ (režim) strelica i dalje upravlja televizorom`, !!c && c !== b, `${b} → ${c}`)
  } else {
    await page.evaluate(() => [...document.querySelectorAll('[data-traka] .segment button')].find((x) => x.textContent.trim() === 'Slobodno')?.click())
    await page.keyboard.press('ArrowDown')
    await sleep(40)
    const c = await izabran()
    proveri(`${naziv}: posle klika na prekidač režima strelica i dalje upravlja televizorom`, !!c && c !== b, `${b} → ${c}`)
  }
  if (w === 683) {
    const mini = await page.evaluate(() => !!document.querySelector('.mini-daljinski'))
    proveri('uski vodoravni: televizor ima mali „Nazad“/„Početna“ (put nazad dodirom)', mini)
  }
  probleme.push(...o.problemi)
  spoljni.push(...o.spoljni)
  await o.browser.close()
}
process.exit(izvestaj('e2e-raspored', lista, probleme, spoljni) ? 0 : 1)
