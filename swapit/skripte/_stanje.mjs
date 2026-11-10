// Zajednički pomoćnik za provere talasa 4: otvaranje rute sa unapred zadatim stanjem demoa (poz, režim, tema) u sessionStorage-u.
// Isti obrazac kao e2e-dorada.mjs; stanje se upiše u već učitanu stranu, pa se ista kartica prebacuje na novu adresu.
import { BASE, KLJUC, sleep } from './_zajednicko.mjs'

export const POCETNO = { v: 1, poz: { korak: 1, n: 0, grana: 'lanac' }, rezim: 'vodjena', tema: 'svetla', poruke: { slobodno: true }, saglasnosti: {}, tokovi: { noviOglasi: [], omiljeno: [] } }
export const UGLOVI = ['ana', 'marko', 'prodavnica', 'moderacija']
export const KUCA = { ana: 'P1', marko: 'P1', prodavnica: 'F3', moderacija: 'V1' }

/** Vraća funkciju `otvoriRutu(ruta, stanje)`; prvo učitavanje pokreće aplikaciju, svako sledeće je sveže učitavanje sa upisanim stanjem. */
export function otvaranje(page) {
  let brojac = 0
  let pocelo = false
  return async function otvoriRutu(ruta, stanje = {}, { pauza = 120 } = {}) {
    if (!pocelo) {
      await page.goto(BASE + '?r=0#/', { waitUntil: 'load' })
      await sleep(150)
      pocelo = true
    }
    const zeljeno = { ...POCETNO, ...stanje }
    // stara strana (npr. posle promene veličine prozora) ume da upiše svoje stanje preko našeg tokom prelaska: zato se proveri i, ako treba, ponovi
    for (let pokusaj = 0; pokusaj < 3; pokusaj++) {
      await page.evaluate((k, s) => sessionStorage.setItem(k, JSON.stringify(s)), KLJUC, zeljeno)
      await page.goto(`${BASE}?r=${++brojac}#${ruta}`, { waitUntil: 'load' })
      const sada = await page.evaluate((k) => JSON.parse(sessionStorage.getItem(k) ?? 'null'), KLJUC)
      if (sada && sada.tema === zeljeno.tema && sada.rezim === zeljeno.rezim && sada.poz?.korak === zeljeno.poz.korak && sada.poz?.n === zeljeno.poz.n) break
    }
    await sleep(pauza)
  }
}

/** Čeka da se fontovi učitaju (merenja kontrasta i visina zavise od njih). */
export const fontovi = (page) => page.evaluate(() => document.fonts.ready)
