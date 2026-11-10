// Pristupačnost samo tastaturom (PLAN B8.2/B8.3): put kroz stranicu i traku priče, panel (telefon), meni ≡ (telefon), meni profila i dijaloge
// (Restart, „Odbij“, „Uđi u demo“): vidljiv fokus, fokus ostaje u dijalogu (Tab / Shift+Tab), Esc zatvara i vraća fokus, pozadina je inertna,
// oznake za čitač ekrana na kontrolama, skip linkovi. Sve u obe teme (fokus mora biti vidljiv i u tamnoj).
// Pokretanje: npm run build ; npm run preview ; npm run e2e:tastatura
import { izvestaj, otvori, proveravac, sleep } from './_zajednicko.mjs'
import { otvaranje } from './_stanje.mjs'

const { lista, proveri } = proveravac()
const sviProblemi = []
const sviSpoljni = []

const aktivni = (page) =>
  page.evaluate(() => {
    const e = document.activeElement
    return { tekst: (e?.getAttribute('aria-label') || e?.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 50), uDijalogu: !!e?.closest('[role=dialog]'), tag: e?.tagName, id: e?.id }
  })
const fokusiraj = (page, tekst, sel = 'button, a') =>
  page.evaluate(
    (t, sel) => {
      const b = [...document.querySelectorAll(sel)].find((x) => x.getClientRects().length > 0 && !x.closest('[inert]') && (x.getAttribute('aria-label') || x.textContent || '').replace(/\s+/g, ' ').trim().includes(t))
      b?.focus()
      return !!b
    },
    tekst,
    sel,
  )
const inertnoVani = (page) => page.evaluate(() => [...document.querySelectorAll('[inert]')].length > (window.__inertOsnova ?? 0))
const imaDijalog = (page) => page.$('[role=dialog]').then((x) => !!x)

async function dijalog(page, opis, otvoriF, oznakaPovratka) {
  await page.evaluate(() => (window.__inertOsnova = document.querySelectorAll('[inert]').length)) // stalni inert elementi (ako ih ima) ne računaju
  const otvoren = await otvoriF()
  await sleep(250)
  proveri(`${opis}: otvara se tastaturom`, otvoren && (await imaDijalog(page)))
  proveri(`${opis}: fokus je odmah u dijalogu`, (await aktivni(page)).uDijalogu, JSON.stringify(await aktivni(page)))
  let unutra = true
  for (let i = 0; i < 12; i++) {
    await page.keyboard.press('Tab')
    unutra = unutra && (await aktivni(page)).uDijalogu
  }
  for (let i = 0; i < 4; i++) {
    await page.keyboard.down('Shift')
    await page.keyboard.press('Tab')
    await page.keyboard.up('Shift')
    unutra = unutra && (await aktivni(page)).uDijalogu
  }
  proveri(`${opis}: Tab i Shift+Tab ostaju u dijalogu`, unutra)
  proveri(`${opis}: pozadina je inertna`, await inertnoVani(page))
  await page.keyboard.press('Escape')
  await sleep(250)
  proveri(`${opis}: Esc zatvara`, !(await imaDijalog(page)))
  const a = await aktivni(page)
  proveri(`${opis}: fokus se vraća na dugme koje je otvorilo dijalog`, oznakaPovratka ? a.tekst.includes(oznakaPovratka) : a.tag !== 'BODY', JSON.stringify(a))
  proveri(`${opis}: pozadina više nije inertna`, !(await inertnoVani(page)))
}

for (const tema of ['svetla', 'tamna']) {
  // ---- računar
  {
    const { browser, page, problemi, spoljni } = await otvori({ sirina: 1280, visina: 800 })
    const otvoriRutu = otvaranje(page)
    const stanje = { tema, poz: { korak: 4, n: 0, grana: 'lanac' } }
    await otvoriRutu('/ana/pocetna', stanje)
    const videni = new Set()
    const bezFokusa = []
    await page.evaluate(() => document.activeElement?.blur())
    let stigaoDoKraja = false
    for (let i = 0; i < 700 && !(videni.size >= 8 && stigaoDoKraja); i++) {
      await page.keyboard.press('Tab')
      const r = await page.evaluate(() => {
        const e = document.activeElement
        if (!e || e === document.body) return null
        const cs = getComputedStyle(e)
        const prsten = (x) => x.outlineStyle !== 'none' && parseFloat(x.outlineWidth) > 0 && x.outlineColor !== 'rgba(0, 0, 0, 0)'
        // polje pretrage: prsten fokusa je na omotaču (:focus-within), a ne na samom polju
        const omotac = e.closest('.polje-pretrage')
        const vidljiv = prsten(cs) || (!!omotac && prsten(getComputedStyle(omotac)))
        const r = e.getBoundingClientRect()
        const ispodTrake = (() => {
          const traka = document.querySelector('[data-donji]')
          if (!traka || e.closest('[data-donji]')) return false
          return r.top >= traka.getBoundingClientRect().top - 1 && r.bottom > traka.getBoundingClientRect().top
        })()
        return { tekst: (e.getAttribute('aria-label') || e.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 30), traka: !!e.closest('[data-traka-price]'), vidljiv, ispodTrake, podnozje: !!e.closest('[data-podnozje]') }
      })
      if (!r) continue
      if (r.traka) videni.add(r.tekst)
      if (!r.vidljiv) bezFokusa.push(r.tekst)
      if (r.podnozje) stigaoDoKraja = true
      if (r.ispodTrake) bezFokusa.push('ispod trake: ' + r.tekst)
    }
    proveri(`računar ${tema}: tastaturom se stiže do trake priče (Nazad, koraci, Dalje, uglovi, Restart)`, videni.size >= 8, [...videni].join('|'))
    proveri(`računar ${tema}: svaki element u Tab redosledu ima vidljiv fokus i nije zaklonjen trakom`, bezFokusa.length === 0, bezFokusa.slice(0, 5).join('|'))
    proveri(`računar ${tema}: Tab stiže i do podnožja`, stigaoDoKraja)
    const bezOznake = await page.evaluate(() => [...document.querySelectorAll('[data-traka-price] button, [data-zaglavlje] button, [data-zaglavlje] a')].filter((b) => !(b.textContent || '').trim() && !b.getAttribute('aria-label') && !b.querySelector('svg[aria-label], img[alt]')).length)
    proveri(`računar ${tema}: dugmad bez teksta imaju aria-label`, bezOznake === 0, String(bezOznake))
    const tekuci = await page.evaluate(() => document.querySelectorAll('[data-traka-price] [aria-current=step]').length)
    proveri(`računar ${tema}: tekući korak je označen aria-current="step"`, tekuci === 1, String(tekuci))
    // skip linkovi
    await otvoriRutu('/ana/pocetna', stanje)
    await page.evaluate(() => document.activeElement?.blur())
    await page.keyboard.press('Tab')
    proveri(`računar ${tema}: prvi Tab je „Preskoči na sadržaj“`, (await aktivni(page)).tekst === 'Preskoči na sadržaj', JSON.stringify(await aktivni(page)))
    await page.keyboard.press('Tab')
    proveri(`računar ${tema}: drugi Tab je „Preskoči na kontrole priče“`, (await aktivni(page)).tekst === 'Preskoči na kontrole priče', JSON.stringify(await aktivni(page)))
    await page.keyboard.press('Enter')
    const traka = await page.evaluate(() => !!document.activeElement?.closest('[data-traka-price]'))
    proveri(`računar ${tema}: „Preskoči na kontrole priče“ prebacuje fokus u traku`, traka)
    await otvoriRutu('/ana/pocetna', stanje)
    await page.evaluate(() => document.activeElement?.blur())
    await page.keyboard.press('Tab')
    await page.keyboard.press('Enter')
    proveri(`računar ${tema}: „Preskoči na sadržaj“ prebacuje fokus na glavni sadržaj`, (await aktivni(page)).id === 'sadrzaj', JSON.stringify(await aktivni(page)))
    // priča samo tastaturom: Dalje u traci
    const mesto = () => page.evaluate((k) => { const p = JSON.parse(sessionStorage.getItem(k) ?? 'null')?.poz; return p ? `${p.korak}.${p.n}` : null }, 'swapit.demo.v1')
    const pre = await mesto()
    await fokusiraj(page, 'Dalje', '[data-traka-price] button')
    await page.keyboard.press('Enter')
    await sleep(400)
    const posle = await mesto()
    proveri(`računar ${tema}: Enter na „Dalje“ pomera priču (mesto u priči se menja)`, !!pre && !!posle && pre !== posle, `${pre} -> ${posle}`)
    proveri(`računar ${tema}: fokus ostaje u traci posle „Dalje“ (ne skače na h1)`, await page.evaluate(() => !!document.activeElement?.closest('[data-traka-price]')))

    // meni profila
    await otvoriRutu('/ana/pocetna', { ...stanje, rezim: 'slobodno' })
    await fokusiraj(page, 'Moj nalog')
    await page.keyboard.press('Enter')
    await sleep(150)
    proveri(`računar ${tema}: meni profila se otvara (aria-expanded=true)`, await page.evaluate(() => document.querySelector('[data-meni-profila] button')?.getAttribute('aria-expanded') === 'true'))
    await page.keyboard.press('Escape')
    await sleep(100)
    proveri(`računar ${tema}: Esc zatvara meni profila i vraća fokus na dugme`, await page.evaluate(() => document.querySelector('[data-meni-profila] button')?.getAttribute('aria-expanded') === 'false' && document.activeElement === document.querySelector('[data-meni-profila] button')))

    // dijalozi
    await otvoriRutu('/ana/pocetna', stanje)
    await dijalog(page, `Restart ${tema}`, async () => {
      await fokusiraj(page, 'Restart demo')
      await page.keyboard.press('Enter')
      return true
    }, 'Restart demo')
    await otvoriRutu('/ana/lanac', { ...stanje, poz: { korak: 6, n: 0, grana: 'lanac' } })
    await dijalog(page, `Odbij lanac ${tema}`, async () => {
      const ok = await fokusiraj(page, 'Odbij', 'main button')
      if (ok) await page.keyboard.press('Enter')
      return ok
    }, 'Odbij')
    await otvoriRutu('/ulaz', { ...stanje, poz: { korak: 5, n: 0, grana: 'lanac' }, saglasnosti: { r3_uslovi: true } })
    await dijalog(page, `Uđi u demo (potvrda) ${tema}`, async () => {
      const ok = await fokusiraj(page, 'Uđi u demo', 'main button')
      if (ok) await page.keyboard.press('Enter')
      return ok
    }, 'Uđi u demo')
    await browser.close()
    sviProblemi.push(...problemi)
    sviSpoljni.push(...spoljni)
  }

  // ---- telefon: panel priče i meni ≡
  {
    const { browser, page, problemi, spoljni } = await otvori({ sirina: 390, visina: 844, telefon: true })
    const otvoriRutu = otvaranje(page)
    const stanje = { tema, poz: { korak: 4, n: 0, grana: 'lanac' } }
    await otvoriRutu('/ana/pocetna', stanje)
    await dijalog(page, `Panel priče (telefon, vođena) ${tema}`, async () => {
      await fokusiraj(page, 'Otvori panel priče', '[data-traka-telefon] button')
      await page.keyboard.press('Enter')
      return true
    }, 'Otvori panel priče')
    await otvoriRutu('/ana/pocetna', { ...stanje, rezim: 'slobodno' })
    await dijalog(page, `Panel priče iz zaglavlja (telefon, slobodno) ${tema}`, async () => {
      await fokusiraj(page, 'Korak 4/9', '[data-pilula-koraka]')
      await page.keyboard.press('Enter')
      return true
    }, 'Korak 4/9')
    await dijalog(page, `Meni ≡ (telefon) ${tema}`, async () => {
      await fokusiraj(page, 'Meni', '[data-meni-dugme]')
      await page.keyboard.press('Enter')
      return true
    }, 'Meni')
    await browser.close()
    sviProblemi.push(...problemi)
    sviSpoljni.push(...spoljni)
  }
}
const ok = izvestaj('e2e-tastatura', lista, sviProblemi, sviSpoljni)
process.exit(ok ? 0 : 1)
