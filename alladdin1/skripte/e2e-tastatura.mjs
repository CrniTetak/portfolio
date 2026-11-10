// Ručna pristupačnost automatizovano: ceo put samo tastaturom kroz traku priče, panel (telefon) i dijaloge (Restart, Message, Enter demo as…):
// vidljiv fokus, fokus ostaje u dijalogu (Tab / Shift+Tab), Esc zatvara i vraća fokus, pozadina je inertna, oznake za čitač ekrana na kontrolama.
import { BASE, KLJUC, izvestaj, otvori, proveravac, sleep } from './_zajednicko.mjs'

const { lista, proveri } = proveravac()
const stanje = (rezim = 'guided') => ({ v: 1, poz: { korak: 4, n: 0, ishod: 'A' }, rezim, potvrda18: true, poruke: { slobodno: true } })
const ucitaj = async (page, h, rezim) => {
  await page.goto(BASE + '?r=0#/', { waitUntil: 'load' })
  await page.evaluate((k, s) => sessionStorage.setItem(k, JSON.stringify(s)), KLJUC, stanje(rezim))
  await page.goto(`${BASE}?r=${Math.random()}#${h}`, { waitUntil: 'load' })
  await sleep(250)
}
const aktivni = (page) => page.evaluate(() => { const e = document.activeElement; return { tekst: (e?.getAttribute('aria-label') || e?.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 40), uDijalogu: !!e?.closest('[role=dialog]'), tag: e?.tagName } })
const fokusiraj = (page, tekst) => page.evaluate((t) => { const b = [...document.querySelectorAll('button')].find((x) => x.getClientRects().length > 0 && (x.textContent || '').replace(/\s+/g, ' ').trim().includes(t)); b?.focus(); return !!b }, tekst)
const inertnoVani = (page) => page.evaluate(() => [...document.querySelectorAll('[inert]:not(.pr-rezervisano)')].length > 0)

async function dijalog(page, opis, otvori, oznakaPovratka) {
  const ima = await otvori()
  proveri(`${opis}: otvara se tastaturom`, ima && (await page.$('[role=dialog]')))
  await sleep(150)
  proveri(`${opis}: fokus je odmah u dijalogu`, (await aktivni(page)).uDijalogu, JSON.stringify(await aktivni(page)))
  let unutra = true
  for (let i = 0; i < 12; i++) { await page.keyboard.press('Tab'); unutra = unutra && (await aktivni(page)).uDijalogu }
  for (let i = 0; i < 4; i++) { await page.keyboard.down('Shift'); await page.keyboard.press('Tab'); await page.keyboard.up('Shift'); unutra = unutra && (await aktivni(page)).uDijalogu }
  proveri(`${opis}: Tab i Shift+Tab ostaju u dijalogu`, unutra)
  proveri(`${opis}: pozadina je inertna`, await inertnoVani(page))
  await page.keyboard.press('Escape')
  await sleep(200)
  proveri(`${opis}: Esc zatvara`, !(await page.$('[role=dialog]')))
  const a = await aktivni(page)
  proveri(`${opis}: fokus se vraća na dugme koje je otvorilo dijalog`, oznakaPovratka ? a.tekst.includes(oznakaPovratka) : a.tag !== 'BODY', JSON.stringify(a))
  proveri(`${opis}: pozadina više nije inertna`, !(await inertnoVani(page)))
}

// ---- računar
{
  const { browser, page, problemi, spoljni } = await otvori({ sirina: 1280, visina: 800 })
  await ucitaj(page, '/organizer/account/overview')
  // Tab kroz stranicu: svaki fokusiran element ima vidljiv fokus; traka priče je dostupna
  const videni = new Set()
  let bezFokusa = []
  await page.evaluate(() => document.activeElement?.blur())
  for (let i = 0; i < 70; i++) {
    await page.keyboard.press('Tab')
    const r = await page.evaluate(() => {
      const e = document.activeElement
      if (!e || e === document.body) return null
      const cs = getComputedStyle(e)
      const roditelj = e.parentElement ? getComputedStyle(e.parentElement) : null
      const vidljiv = (cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0) || cs.boxShadow !== 'none' || !!e.closest('label')?.querySelector(':focus-visible') || (roditelj && roditelj.boxShadow !== 'none')
      return { tekst: (e.getAttribute('aria-label') || e.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 30), traka: !!e.closest('[data-traka-price]'), vidljiv: !!vidljiv, fokusVidljiv: e.matches(':focus-visible') }
    })
    if (!r) continue
    if (r.traka) videni.add(r.tekst)
    if (!r.vidljiv) bezFokusa.push(r.tekst)
  }
  proveri('računar: tastaturom se stiže do trake priče (Back, koraci, Next, uloge, Restart)', videni.size >= 8, [...videni].join('|'))
  proveri('računar: svaki element u Tab redosledu ima vidljiv fokus', bezFokusa.length === 0, bezFokusa.join('|'))
  const oznake = await page.evaluate(() => [...document.querySelectorAll('[data-traka-price] button')].filter((b) => !(b.textContent || '').trim() && !b.getAttribute('aria-label')).length)
  proveri('računar: dugmad trake bez teksta imaju aria-label', oznake === 0, String(oznake))
  const tekuci = await page.evaluate(() => document.querySelectorAll('[data-traka-price] [aria-current=step]').length)
  proveri('računar: tekući korak je označen aria-current="step"', tekuci === 1, String(tekuci))

  await dijalog(page, 'Restart', async () => { await fokusiraj(page, 'Restart demo'); await page.keyboard.press('Enter'); return true }, 'Restart demo')
  await ucitaj(page, '/organizer/account/advisor')
  await dijalog(page, 'Message advisor', async () => { await fokusiraj(page, 'Message'); await page.keyboard.press('Enter'); return true }, 'Message')
  await ucitaj(page, '/guest/home')
  await dijalog(page, 'Enter demo as…', async () => { await fokusiraj(page, 'Enter'); await page.keyboard.press('Enter'); return true }, 'Enter')
  await browser.close()
  if (problemi.length || spoljni.length) proveri('računar: bez grešaka u konzoli i spoljnih zahteva', false, [...problemi, ...spoljni].join('; '))
}

// ---- telefon: panel priče
{
  const { browser, page } = await otvori({ sirina: 390, visina: 844, telefon: true })
  await ucitaj(page, '/organizer/account/overview')
  await dijalog(page, 'Panel priče (telefon)', async () => { await fokusiraj(page, 'Step 4/9'); await page.keyboard.press('Enter'); return true }, null)
  await ucitaj(page, '/organizer/account/overview', 'free')
  await dijalog(page, 'Panel priče iz zaglavlja (telefon, Free)', async () => { await fokusiraj(page, 'Step 4/9'); await page.keyboard.press('Enter'); return true }, 'Step 4/9')
  await browser.close()
}
const ok = izvestaj('e2e-tastatura', lista, [], [])
process.exit(ok ? 0 : 1)
