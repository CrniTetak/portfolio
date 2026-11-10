// Prelaz ekrana i ponašanje okvira (PLAN B8.2): naslov dokumenta prati ekran, fokus na h1 posle prelaza koji izaziva korisnik (a ne traka priče),
// skrol na vrh pri prelazu, scroll-padding za donju traku, toast (~7 s, pauza dok je miš iznad), meni profila (otkrivanje: Esc, klik van), tabele sa th scope.
// Pokretanje: npm run build ; npm run preview ; npm run e2e:prelaz
import { izvestaj, otvori, proveravac, sleep } from './_zajednicko.mjs'
import { otvaranje } from './_stanje.mjs'

const { lista, proveri } = proveravac()
const sviProblemi = []
const sviSpoljni = []
const aktivni = (page) =>
  page.evaluate(() => {
    const e = document.activeElement
    return { tag: e?.tagName, id: e?.id, tekst: (e?.textContent || e?.getAttribute('aria-label') || '').replace(/\s+/g, ' ').trim().slice(0, 50), uTraci: !!e?.closest('[data-traka-price], [data-traka-telefon], [data-panel-price]') }
  })
const h1 = (page) => page.evaluate(() => document.querySelector('main h1')?.textContent.trim())
const naslovOk = async (page) => {
  const n = await h1(page)
  const t = await page.title()
  return t === n || t === `${n} — SWAPIT demo`
}

for (const tema of ['svetla', 'tamna']) {
  {
    const { browser, page, problemi, spoljni } = await otvori({ sirina: 1280, visina: 800 })
    const otvoriRutu = otvaranje(page)
    const stanje = { tema, poz: { korak: 3, n: 0, grana: 'lanac' }, rezim: 'vodjena' }
    await otvoriRutu('/ana/pocetna', stanje)
    proveri(`${tema}: naslov dokumenta = naslov ekrana (+ „ — SWAPIT demo“)`, await naslovOk(page), await page.title())
    const naslov0 = await h1(page)
    // prelaz izaziva korisnik: klik na link kartice oglasa (posle skrolovanja nadole)
    await page.evaluate(() => window.scrollTo(0, 700))
    await sleep(100)
    const cilj = await page.evaluate(() => {
      const a = [...document.querySelectorAll('main a[href^="#/"]')].find((x) => x.getClientRects().length > 0 && /\/oglas\//.test(x.getAttribute('href')))
      if (!a) return null
      a.click()
      return a.getAttribute('href')
    })
    await sleep(500)
    proveri(`${tema}: link kartice oglasa otvara drugi ekran`, !!cilj && (await h1(page)) !== naslov0, String(cilj))
    proveri(`${tema}: posle prelaza naslov dokumenta prati novi ekran`, await naslovOk(page), await page.title())
    proveri(`${tema}: posle prelaza strana je skrolovana na vrh`, (await page.evaluate(() => window.scrollY)) <= 1, String(await page.evaluate(() => window.scrollY)))
    const a1 = await aktivni(page)
    proveri(`${tema}: prelaz koji izaziva korisnik premešta fokus na h1`, a1.tag === 'H1', JSON.stringify(a1))
    // prelaz izaziva traka priče: fokus ostaje u traci
    await page.evaluate(() => [...document.querySelectorAll('[data-traka-price] button')].find((b) => b.getAttribute('aria-label') === 'Dalje')?.focus())
    await page.keyboard.press('Enter')
    await sleep(500)
    const a2 = await aktivni(page)
    proveri(`${tema}: prelaz iz trake priče: fokus ostaje u traci (ne skače na h1)`, a2.uTraci && a2.tag !== 'H1', JSON.stringify(a2))
    proveri(`${tema}: naslov dokumenta prati ekran i posle prelaza iz trake`, await naslovOk(page), await page.title())
    // scroll-padding
    const sp = await page.evaluate(() => ({ pad: parseFloat(getComputedStyle(document.documentElement).scrollPaddingBottom), traka: document.querySelector('[data-donji]').getBoundingClientRect().height }))
    proveri(`${tema}: scroll-padding-bottom ≥ visina donje trake`, sp.pad >= sp.traka, JSON.stringify(sp))
    // meni profila: obrazac otkrivanja
    await otvoriRutu('/ana/pocetna', { ...stanje, rezim: 'slobodno' })
    proveri(`${tema}: meni nema role=menu / menuitem`, await page.evaluate(() => !document.querySelector('[role=menu], [role=menuitem]')))
    const izlaz = () => page.evaluate(() => document.querySelector('[data-meni-profila] button').getAttribute('aria-expanded'))
    await page.evaluate(() => document.querySelector('[data-meni-profila] button').focus())
    await page.keyboard.press('Enter')
    proveri(`${tema}: meni profila se otvara (aria-expanded=true)`, (await izlaz()) === 'true')
    await page.keyboard.press('Escape')
    proveri(`${tema}: Esc zatvara meni i vraća fokus na dugme`, (await izlaz()) === 'false' && (await page.evaluate(() => document.activeElement === document.querySelector('[data-meni-profila] button'))))
    await page.click('[data-meni-profila] button')
    await page.mouse.click(640, 560)
    await sleep(120)
    proveri(`${tema}: klik van menija ga zatvara`, (await izlaz()) === 'false')
    // tabela: th scope=row i caption na ekranu sa tabelom (tabla firme)
    await otvoriRutu('/prodavnica/tabla', { ...stanje, poz: { korak: 9, n: 3, grana: 'lanac' } })
    const tab = await page.evaluate(() => {
      const t = [...document.querySelectorAll('main table')].filter((x) => x.getClientRects().length > 0)
      return { n: t.length, caption: t.every((x) => !!x.querySelector('caption')), scope: t.every((x) => !x.querySelector('tbody th') || !!x.querySelector('tbody th[scope=row]')) }
    })
    proveri(`${tema}: tabele imaju caption, a zaglavlja redova scope=row`, tab.n === 0 || (tab.caption && tab.scope), JSON.stringify(tab))
    // toast: izbor drugog jezika prikazuje poruku ~7 s; pauza dok je miš iznad
    await otvoriRutu('/ana/pocetna', { ...stanje, rezim: 'slobodno' })
    await page.evaluate(() => {
      const s = document.querySelector('select[data-jezik]')
      const o = [...s.options].find((x) => x.value !== s.value)
      const set = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set
      set.call(s, o.value)
      s.dispatchEvent(new Event('change', { bubbles: true }))
    })
    await sleep(400)
    proveri(`${tema}: toast se pojavljuje`, await page.evaluate(() => !!document.querySelector('[data-toast]')))
    proveri(`${tema}: toast je u aria-live oblasti`, await page.evaluate(() => !!document.querySelector('[data-toast-regija][aria-live=polite] [data-toast]')))
    await sleep(4400)
    const toast5 = await page.evaluate(() => !!document.querySelector('[data-toast]'))
    proveri(`${tema}: toast je još vidljiv posle ~5 s`, toast5)
    if (toast5) {
      const r = await page.evaluate(() => {
        const b = document.querySelector('[data-toast]').getBoundingClientRect()
        return { x: b.x + b.width / 2, y: b.y + b.height / 2 }
      })
      await page.mouse.move(r.x, r.y)
      await sleep(5000)
      proveri(`${tema}: toast ostaje dok je miš iznad`, await page.evaluate(() => !!document.querySelector('[data-toast]')))
      await page.mouse.move(5, 5)
      await sleep(8200)
      proveri(`${tema}: toast nestaje kad miš ode (~7 s)`, await page.evaluate(() => !document.querySelector('[data-toast]')))
    }
    sviProblemi.push(...problemi)
    sviSpoljni.push(...spoljni)
    await browser.close()
  }
  // telefon
  {
    const { browser, page } = await otvori({ sirina: 390, visina: 844, telefon: true })
    const otvoriRutu = otvaranje(page)
    await otvoriRutu('/ana/pocetna', { tema, poz: { korak: 3, n: 0, grana: 'lanac' } })
    await sleep(500)
    const sp = await page.evaluate(() => ({ pad: parseFloat(getComputedStyle(document.documentElement).scrollPaddingBottom), traka: document.querySelector('[data-donji]').getBoundingClientRect().height }))
    proveri(`telefon ${tema}: scroll-padding-bottom ≥ visina donje trake`, sp.pad >= sp.traka, JSON.stringify(sp))
    // prava tastatura (programski klik ne beleži „interakciju iz trake“): fokus na dugme pa Enter
    await page.evaluate(() => document.querySelector('[data-traka-telefon] button[aria-label="Sledeći korak"]')?.focus())
    await page.keyboard.press('Enter')
    await sleep(600)
    const a = await aktivni(page)
    proveri(`telefon ${tema}: prelaz iz trake ne krade fokus (ostaje u traci ili na dugmetu)`, a.tag !== 'H1', JSON.stringify(a))
    proveri(`telefon ${tema}: naslov dokumenta prati ekran`, await naslovOk(page), await page.title())
    await browser.close()
  }
}
const ok = izvestaj('e2e-prelaz', lista, sviProblemi, sviSpoljni)
process.exit(ok ? 0 : 1)
