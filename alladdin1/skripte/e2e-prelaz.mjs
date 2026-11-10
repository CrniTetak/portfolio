// Prelaz ekrana i tastatura u okviru: naslov dokumenta, fokus na h1 (osim kad prelaz izaziva traka priče), skip linkovi, scroll-padding,
// zaglavlje kao obrazac otkrivanja (Esc, klik van), toast ~7 s sa pauzom, tabovi naloga na telefonu (aria-current), th scope=row.
import { BASE, KLJUC, izvestaj, otvori, proveravac, sleep } from './_zajednicko.mjs'

const { lista, proveri } = proveravac()
const stanje = (korak = 4) => ({ v: 1, poz: { korak, n: 0, ishod: 'A' }, rezim: 'guided', potvrda18: true, poruke: { slobodno: true } })
const ucitaj = async (page, h, korak) => {
  await page.goto(BASE + '?r=0#/', { waitUntil: 'load' })
  await page.evaluate((k, s) => sessionStorage.setItem(k, JSON.stringify(s)), KLJUC, stanje(korak))
  await page.goto(`${BASE}?r=${Math.random()}#${h}`, { waitUntil: 'load' })
  await sleep(300)
}
const aktivni = (page) =>
  page.evaluate(() => {
    const e = document.activeElement
    return { tag: e?.tagName, id: e?.id, tekst: (e?.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 50), uTraci: !!e?.closest('[data-traka-price], [data-traka-telefon]') }
  })
const h1 = (page) => page.evaluate(() => document.querySelector('main h1')?.textContent.trim())
const klik = (page, t, sel = 'button') =>
  page.evaluate(
    (t, sel) => {
      const b = [...document.querySelectorAll(sel)].find((x) => x.getClientRects().length > 0 && x.textContent.replace(/\s+/g, ' ').trim() === t)
      b?.click()
      return !!b
    },
    t,
    sel,
  )
const izlaz = (page) => page.evaluate(() => document.querySelector('[data-nalog-dugme]').getAttribute('aria-expanded'))

{
  const { browser, page, problemi, spoljni } = await otvori({ sirina: 1280, visina: 800 })
  await ucitaj(page, '/organizer/account/overview')
  const naslov0 = await h1(page)
  proveri('naslov dokumenta = naslov ekrana + " — AllAddIn1 demo"', (await page.title()) === `${naslov0} — AllAddIn1 demo`, await page.title())
  // prelaz izaziva korisnik (meni naloga): naslov se menja, fokus na h1
  await klik(page, 'Passengers', 'nav[aria-label=Account] button')
  await sleep(300)
  const naslov1 = await h1(page)
  proveri('prelaz preko menija: naslov dokumenta se promenio', naslov1 !== naslov0 && (await page.title()) === `${naslov1} — AllAddIn1 demo`, await page.title())
  const a1 = await aktivni(page)
  proveri('prelaz preko menija: fokus je na h1', a1.tag === 'H1', JSON.stringify(a1))
  // prelaz izaziva traka priče: fokus ostaje u traci
  await page.evaluate(() => [...document.querySelectorAll('[data-traka-price] button')].find((b) => /^Next/.test(b.textContent.trim()))?.focus())
  await page.keyboard.press('Enter')
  await sleep(400)
  const a2 = await aktivni(page)
  proveri('prelaz iz trake priče: fokus ostaje u traci (ne skače na h1)', a2.uTraci && a2.tag !== 'H1', JSON.stringify(a2))
  proveri('naslov dokumenta prati ekran i posle prelaza iz trake', (await page.title()) === `${await h1(page)} — AllAddIn1 demo`)
  // skip linkovi
  await ucitaj(page, '/organizer/account/overview')
  await page.evaluate(() => document.activeElement?.blur())
  await page.keyboard.press('Tab')
  const s1 = await aktivni(page)
  proveri('prvi Tab: "Skip to content"', s1.tekst === 'Skip to content', JSON.stringify(s1))
  await page.keyboard.press('Tab')
  const s2 = await aktivni(page)
  proveri('drugi Tab: "Skip to story controls"', s2.tekst === 'Skip to story controls', JSON.stringify(s2))
  proveri('skip link je vidljiv dok ima fokus', await page.evaluate(() => { const r = document.activeElement.getBoundingClientRect(); return r.top >= 0 && r.width > 0 }))
  await page.keyboard.press('Enter')
  const s3 = await aktivni(page)
  proveri('"Skip to story controls" prebacuje fokus u traku priče', s3.uTraci, JSON.stringify(s3))
  await ucitaj(page, '/organizer/account/overview')
  await page.evaluate(() => document.activeElement?.blur())
  await page.keyboard.press('Tab')
  await page.keyboard.press('Enter')
  const s4 = await aktivni(page)
  proveri('"Skip to content" prebacuje fokus na glavni sadržaj', s4.id === 'sadrzaj', JSON.stringify(s4))
  proveri('skip link ne menja rutu', (await page.evaluate(() => location.hash)).startsWith('#/organizer'))
  proveri('DOM redosled: skip linkovi su pre zaglavlja', await page.evaluate(() => { const k = document.querySelector('.skip-linkovi'); const z = document.querySelector('[data-zaglavlje]'); return !!k && !!z && !!(k.compareDocumentPosition(z) & Node.DOCUMENT_POSITION_FOLLOWING) }))
  // scroll-padding
  const sp = await page.evaluate(() => ({ pad: parseFloat(getComputedStyle(document.documentElement).scrollPaddingBottom), traka: document.querySelector('[data-donji]').getBoundingClientRect().height }))
  proveri('scroll-padding-bottom ≥ visina trake priče', sp.pad >= sp.traka, JSON.stringify(sp))
  // zaglavlje: obrazac otkrivanja
  await page.evaluate(() => window.scrollTo(0, 0))
  proveri('meni nema role=menu / menuitem / aria-haspopup=menu', await page.evaluate(() => !document.querySelector('[role=menu], [role=menuitem], [aria-haspopup=menu]')))
  await page.evaluate(() => document.querySelector('[data-nalog-dugme]').focus())
  await page.keyboard.press('Enter')
  proveri('meni naloga se otvara (aria-expanded=true)', (await izlaz(page)) === 'true')
  await page.keyboard.press('Escape')
  proveri('Esc zatvara meni i vraća fokus na dugme', (await izlaz(page)) === 'false' && (await page.evaluate(() => document.activeElement === document.querySelector('[data-nalog-dugme]'))))
  await page.click('[data-nalog-dugme]')
  await page.mouse.click(600, 500)
  await sleep(100)
  proveri('klik van menija ga zatvara', (await izlaz(page)) === 'false')
  // tabela: th scope=row i caption
  await ucitaj(page, '/organizer/account/passengers', 6)
  proveri('tabela ima sr-only caption i th scope=row', await page.evaluate(() => !!document.querySelector('table caption.sr-only') && !!document.querySelector('tbody th[scope=row]')))
  // toast: ~7 s, pauza dok je miš iznad
  await page.evaluate(() => [...document.querySelectorAll('button')].find((b) => /Send reminder|Send mass reminder/.test(b.textContent))?.click())
  await sleep(300)
  if (!(await page.evaluate(() => !!document.querySelector('[data-toast]')))) await klik(page, 'Upload passengers')
  await page.evaluate(() => [...document.querySelectorAll('button')].find((b) => b.textContent.trim() === 'Download template')?.click())
  await sleep(4800)
  const toast5 = await page.evaluate(() => !!document.querySelector('[data-toast]'))
  proveri('toast je još vidljiv posle ~5 s', toast5)
  if (toast5) {
    const r = await page.evaluate(() => { const b = document.querySelector('[data-toast]').getBoundingClientRect(); return { x: b.x + b.width / 2, y: b.y + b.height / 2 } })
    await page.mouse.move(r.x, r.y)
    await sleep(6000)
    proveri('toast ostaje dok je miš iznad', await page.evaluate(() => !!document.querySelector('[data-toast]')))
    await page.mouse.move(5, 5)
    await sleep(8000)
    proveri('toast nestaje kad miš ode (~7 s)', await page.evaluate(() => !document.querySelector('[data-toast]')))
  }
  await browser.close()
  if (problemi.length || spoljni.length) proveri('računar: bez grešaka u konzoli i spoljnih zahteva', false, [...problemi, ...spoljni].join('; '))
}
{
  const { browser, page } = await otvori({ sirina: 390, visina: 844, telefon: true })
  await ucitaj(page, '/organizer/account/overview')
  await sleep(700)
  proveri('telefon: tabovi naloga imaju aria-current="page"', await page.evaluate(() => !!document.querySelector('nav.traka-tabova [aria-current=page]')))
  const sp = await page.evaluate(() => ({ pad: parseFloat(getComputedStyle(document.documentElement).scrollPaddingBottom), traka: document.querySelector('[data-donji]').getBoundingClientRect().height }))
  proveri('telefon: scroll-padding-bottom ≥ visina trake', sp.pad >= sp.traka, JSON.stringify(sp))
  await page.evaluate(() => document.querySelector('[data-hamburger-dugme]').focus())
  await page.keyboard.press('Enter')
  const otv = await page.evaluate(() => !!document.querySelector('[data-hamburger]'))
  await page.keyboard.press('Escape')
  proveri('telefon: hamburger se otvara, Esc ga zatvara i vraća fokus', otv && (await page.evaluate(() => !document.querySelector('[data-hamburger]') && document.activeElement === document.querySelector('[data-hamburger-dugme]'))))
  await browser.close()
}
const ok = izvestaj('e2e-prelaz', lista, [], [])
process.exit(ok ? 0 : 1)
