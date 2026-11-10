// Zajednička „sesija“ za e2e skripte slobodnih tokova: pregledač sa praćenjem grešaka i mrežnih zahteva, pomoćnici za klik po tekstu, izbor u padajućem
// polju, kucanje u polje pretrage (jedino pravo polje), čitanje stanja iz sessionStorage-a i prelazak na link. Isti obrazac kao e2e-prica.mjs.
import { BASE, KLJUC, otvori, sleep } from './_zajednicko.mjs'

export const POCETNO_STANJE = { v: 1, poz: { korak: 1, n: 3, grana: 'lanac' }, rezim: 'slobodno', tema: 'svetla', poruke: { slobodno: true }, saglasnosti: {}, tokovi: { noviOglasi: [], omiljeno: [] } }

export async function napraviSesiju(uredjaj, stanje = POCETNO_STANJE) {
  const o = await otvori({ sirina: uredjaj.sirina, visina: uredjaj.visina, telefon: uredjaj.telefon })
  const { page } = o
  let brojac = 0
  const stanjeSada = () => page.evaluate((k) => JSON.parse(sessionStorage.getItem(k) ?? 'null'), KLJUC)
  const ekran = () => page.evaluate(() => document.querySelector('main[data-ekran]')?.getAttribute('data-ekran') ?? null)
  const hash = () => page.evaluate(() => location.hash)
  const tekst = () => page.evaluate(() => document.body.innerText)
  const glavni = () => page.evaluate(() => document.querySelector('main')?.innerText ?? '')
  const ucitaj = async (ruta, s = stanje) => {
    await page.goto(BASE + '?r=0#/', { waitUntil: 'networkidle0' })
    await sleep(80)
    await page.evaluate((k, x) => sessionStorage.setItem(k, JSON.stringify(x)), KLJUC, s)
    await page.goto(BASE + '?r=' + ++brojac + '#' + ruta, { waitUntil: 'networkidle0' })
    await sleep(120)
  }
  // ekrani se učitavaju lenjo (talas 4): čeka se da nestane oznaka „Učitavam ekran“
  const cekajEkran = () => page.waitForFunction(() => !document.querySelector('[data-ucitava]'), { timeout: 5000 }).catch(() => {})
  const idi = async (h) => {
    await page.evaluate((x) => (location.hash = x), h)
    await sleep(220)
    await cekajEkran()
  }
  const osvezi = async () => {
    await page.reload({ waitUntil: 'load' })
    await page.waitForSelector('[data-ekran]', { timeout: 5000 }).catch(() => {})
    await cekajEkran()
    await sleep(150)
  }
  /** Klik na vidljivo dugme/link čiji tekst POČINJE ovako (u glavnom delu ekrana i u dijalogu). `i` = redni broj među podudarnim. */
  const klik = async (t, { sel = 'main button, main a, [role=dialog] button, [role=dialog] a', i = 0, pocekaj = 170 } = {}) => {
    const rez = await page.evaluate(
      (t, sel, i) => {
        const re = new RegExp('^' + t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
        const svi = [...document.querySelectorAll(sel)].filter((e) => e.getClientRects().length > 0 && re.test((e.textContent || e.getAttribute('aria-label') || '').replace(/\s+/g, ' ').trim()))
        const el = svi[i]
        if (!el) return 'nema'
        if (el.disabled || el.getAttribute('aria-disabled') === 'true') return 'neaktivno'
        el.click()
        return 'ok'
      },
      t,
      sel,
      i,
    )
    if (rez !== 'ok') throw new Error(`Dugme „${t}“ nije kliknuto (${rez}) na ${await hash()}`)
    await sleep(pocekaj)
    await cekajEkran()
  }
  /** Da li postoji vidljivo dugme/link sa ovim tekstom i da li je aktivno: 'nema' | 'neaktivno' | 'aktivno'. */
  const stanjeDugmeta = (t, sel = 'main button, main a, [role=dialog] button') =>
    page.evaluate(
      (t, sel) => {
        const re = new RegExp('^' + t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
        const el = [...document.querySelectorAll(sel)].filter((e) => e.getClientRects().length > 0).find((e) => re.test((e.textContent || e.getAttribute('aria-label') || '').replace(/\s+/g, ' ').trim()))
        return !el ? 'nema' : el.disabled || el.getAttribute('aria-disabled') === 'true' ? 'neaktivno' : 'aktivno'
      },
      t,
      sel,
    )
  /** Štiklira obaveznu kvačicu po oznaci (tekst počinje ovako). */
  const stikliraj = async (oznaka) => {
    const ok = await page.evaluate((t) => {
      const l = [...document.querySelectorAll('main label.kvacica')].find((x) => (x.textContent || '').replace(/\s+/g, ' ').trim().startsWith(t))
      const i = l?.querySelector('input')
      if (!i) return false
      if (!i.checked) i.click()
      return true
    }, oznaka)
    if (!ok) throw new Error(`Kvačica „${oznaka}“ nije nađena na ${await hash()}`)
    await sleep(80)
  }
  const kvacicaStiklirana = (oznaka) => page.evaluate((t) => !![...document.querySelectorAll('main label.kvacica')].find((x) => (x.textContent || '').replace(/\s+/g, ' ').trim().startsWith(t))?.querySelector('input')?.checked, oznaka)
  /** Izbor u padajućem polju (select) po oznaci polja; vrednost je tekst opcije. */
  const izaberi = async (oznaka, opcija) => {
    const ok = await page.evaluate(
      (oznaka, opcija) => {
        const grupa = [...document.querySelectorAll('main .grupa-polja')].find((g) => (g.querySelector('.polje-oznaka')?.textContent || '').trim().startsWith(oznaka))
        const s = grupa?.querySelector('select')
        if (!s) return false
        const o = [...s.options].find((x) => x.textContent.trim() === opcija)
        if (!o) return false
        const setter = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set
        setter.call(s, o.value)
        s.dispatchEvent(new Event('change', { bubbles: true }))
        return true
      },
      oznaka,
      opcija,
    )
    if (!ok) throw new Error(`Izbor „${oznaka}“ → „${opcija}“ nije uspeo na ${await hash()}`)
    await sleep(150)
  }
  /** Kucanje u jedino pravo polje (pretraga): prvo vidljivo polje, pa Enter. */
  const trazi = async (upit) => {
    const polje = await page.evaluateHandle(() => [...document.querySelectorAll('input[data-jedino-polje]')].find((i) => i.getClientRects().length > 0) ?? null)
    const el = polje.asElement()
    if (!el) throw new Error('Nema vidljivog polja pretrage na ' + (await hash()))
    await el.click({ clickCount: 3 })
    await page.keyboard.press('Backspace')
    await el.type(upit)
    await page.keyboard.press('Enter')
    await sleep(250)
  }
  const broji = (sel) => page.evaluate((s) => document.querySelectorAll(s).length, sel)
  return { ...o, uredjaj, stanje: stanjeSada, ekran, hash, tekst, glavni, ucitaj, idi, osvezi, klik, stanjeDugmeta, stikliraj, kvacicaStiklirana, izaberi, trazi, broji }
}
