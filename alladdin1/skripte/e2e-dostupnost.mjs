// Dostupnost klikom (UX.md 5, "Gotovo je kad" talasa 3): pretraživač kreće od kuće svake uloge i KLIKOM prolazi kroz dugmad i linkove
// (meni, trake naloga, prečice, kartice, radnje), pa se sabira do kojih se ekrana stiglo. Cilj: svih 65 ekrana iz registra je dostupno klikom
// (bar u jednoj ulozi i jednom stanju). Pretraga je po širini: svaki ekran se otvara iznova (isto stanje), pa se klikne svaka različita kontrola.
import { BASE, KLJUC, izvestaj, otvori, proveravac, ucitajModule } from './_zajednicko.mjs'

const { m, zatvori } = await ucitajModule({ rute: '/src/pravila/rute.ts', tokovi: '/src/tokovi/tokovi.ts' })
const { lista, proveri } = proveravac()
const T0 = m.tokovi.POCETNI_TOKOVI
const STANJA = [
  { naziv: 'sredina', poz: { korak: 6, n: 2, ishod: 'A' }, tokovi: { ...T0, monteKarlo: 'zatrazeno', konsijerz: 'zatrazeno', transport: 'zatrazeno' } },
  { naziv: 'kraj', poz: { korak: 9, n: 1, ishod: 'A' }, tokovi: { ...T0, krstarenje: 'placeno', monteKarlo: 'potvrdjeno', konsijerz: 'placeno', transport: 'ponuda', clanstvo: 'prijavljeno' } },
  { naziv: 'ishodB', poz: { korak: 8, n: 2, ishod: 'B' }, tokovi: { ...T0, monteKarlo: 'ponuda', konsijerz: 'prihvaceno' } },
]
const ULOGE = ['organizer', 'traveler', 'advisor', 'guest']
const PRESKOCI = /^(Restart demo|Log out|Enter demo|Enter|Switch role|Cancel|Yes|Close|Open menu|Close menu|Back|Next|Show me|Back to story|Back to main story|\d+)$/
const posjeceno = new Set()
const ROK = Date.now() + Number(process.env.ROK_MIN ?? 9) * 60 * 1000
const UKUPNO = m.rute.RUTE.length
const KUCA = { organizer: '/organizer/account/overview', traveler: '/traveler/trips', advisor: '/advisor/desk', guest: '/guest/home' }

async function pokreni(uloga, stanje) {
  const { browser, page, problemi } = await otvori({ sirina: 1280, visina: 900 })
  const seed = { v: 1, poz: stanje.poz, rezim: 'free', potvrda18: true, poruke: { slobodno: true }, tokovi: stanje.tokovi }
  await page.goto(BASE + '?r=0#/', { waitUntil: 'domcontentloaded' })
  let brojac = 0
  // svako otvaranje ekrana kreće iz ISTOG stanja: stanje se upiše pa se strana učita iznova (jedno učitavanje)
  const ucitaj = async (h) => {
    await page.evaluate((k, s) => sessionStorage.setItem(k, JSON.stringify(s)), KLJUC, seed)
    await page.goto(`${BASE}?r=${++brojac}#${h}`, { waitUntil: 'domcontentloaded' })
    await page.waitForSelector('[data-ekran]', { timeout: 4000 }).catch(() => {})
  }
  const cilj = async () => page.evaluate(() => ({ id: document.querySelector('[data-ekran]')?.getAttribute('data-ekran') ?? null, h: location.hash.replace(/^#/, '') }))
  const obradjeno = new Set()
  const red = [KUCA[uloga]]
  while (red.length && posjeceno.size < UKUPNO && Date.now() < ROK) {
    const h = red.shift()
    if (obradjeno.has(h)) continue
    obradjeno.add(h)
    await ucitaj(h)
    const sad = await cilj()
    if (sad.id) posjeceno.add(sad.id)
    const kontrole = await page.evaluate((preskoci) => {
      const re = new RegExp(preskoci)
      const lista = [...document.querySelectorAll('button, a')].filter((e) => e.getClientRects().length > 0).map((e, i) => ({ i, t: ((e.getAttribute('aria-label') || e.textContent) ?? '').replace(/\s+/g, ' ').trim(), dis: !!e.disabled }))
      const vidjeno = new Set()
      return lista.filter((k) => !k.dis && k.t && !re.test(k.t) && !vidjeno.has(k.t) && vidjeno.add(k.t))
    }, PRESKOCI.source)
    for (const k of kontrole) {
      if (posjeceno.size >= UKUPNO || Date.now() > ROK) break
      await ucitaj(h)
      const ok = await page.evaluate((i) => {
        const el = [...document.querySelectorAll('button, a')].filter((e) => e.getClientRects().length > 0)[i]
        if (!el || el.disabled) return false
        el.click()
        return true
      }, k.i)
      if (!ok) continue
      await new Promise((r) => setTimeout(r, 70))
      const posle = await cilj()
      if (posle.id) posjeceno.add(posle.id)
      if (posle.id && posle.h !== h && !obradjeno.has(posle.h)) red.push(posle.h)
    }
  }
  await browser.close()
  return problemi
}

// uloge istovremeno (četiri pregledača), stanja redom; stajemo čim su svi ekrani viđeni klikom
const problemiSvi = []
for (const stanje of [...STANJA].reverse()) {
  if (posjeceno.size >= UKUPNO) break
  const rez = await Promise.all(ULOGE.map((u) => pokreni(u, stanje)))
  rez.forEach((r) => problemiSvi.push(...r))
  console.log(`stanje ${stanje.naziv}: do sada ${posjeceno.size}/${UKUPNO} ekrana; fale: ${m.rute.RUTE.map((r) => r.id).filter((id) => !posjeceno.has(id)).join(" ")}`)
}
const sviId = m.rute.RUTE.map((r) => r.id)
const fale = sviId.filter((id) => !posjeceno.has(id))
proveri(`svih ${sviId.length} ekrana je dostupno klikom`, fale.length === 0, `nedostupno: ${fale.join(', ')}`)
zatvori()
const ok = izvestaj('e2e-dostupnost', lista, problemiSvi, [])
process.exit(ok ? 0 : 1)
