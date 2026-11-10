// SNIMCI EKRANA talasa 2 (slobodno razgledanje, pozicija 5/0): table, U3, TV ekrani i telefonski ekrani; laptop 1366×768 i telefon 390×844.
// Piše u _snimci/ (van git-a). Pokretanje (preview mora da radi): MSYS_NO_PATHCONV=1 node skripte/snimci-ekrani.mjs [prefiks]
import { mkdirSync } from 'node:fs'
import { BASE, KLJUC, izvestaj, otvori, proveravac, sleep } from './_zajednicko.mjs'

const IZLAZ = new URL('../_snimci/', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')
mkdirSync(IZLAZ, { recursive: true })
const prefiks = process.argv[2] ?? 'talas2'

const STRANICE = [
  ['v1-tabla-vlasnice', '#/tabla/vesna'],
  ['m1-tabla-platforme', '#/tabla/platforma'],
  ['u3-o-demou', '#/o-demou'],
  ['t4-emisija', '#/tv/emisija/klasik-tv-1'],
  ['t6-zanr', '#/tv/kanali/zanr'],
  ['t7-zemlja', '#/tv/kanali/zemlja'],
  ['t11-unazad', '#/tv/unazad/klasik-tv'],
  ['t17-pretraga', '#/tv/pretraga'],
  ['t18-rezultati', '#/tv/pretraga/film'],
  ['t21-podesavanja', '#/tv/podesavanja'],
  ['t23-titlovi', '#/tv/podesavanja/titlovi'],
  ['t24-roditeljska', '#/tv/podesavanja/roditeljska'],
  ['t28-nalog', '#/tv/podesavanja/nalog'],
  ['t29-pomoc', '#/tv/pomoc'],
  ['t30-odgovor', '#/tv/pomoc/kome-pripada-demo'],
  ['t31-reklame', '#/tv/reklama-zasto'],
  ['t3-vodic', '#/tv/vodic'],
  ['p6-paketi', '#/tv/pocetna?tel=/paketi'],
  ['p7-paket', '#/tv/pocetna?tel=/paket/film'],
  ['p12-racuni', '#/tv/pocetna?tel=/racuni'],
  ['p13-racun', '#/tv/pocetna?tel=/racun/DEMO-0001'],
  ['p14-nalog', '#/tv/pocetna?tel=/nalog'],
  ['p16-pomoc', '#/tv/pocetna?tel=/pomoc'],
  ['p17-uslovi', '#/tv/pocetna?tel=/uslovi/doma-tv'],
  ['t8-paketni-kanal', '#/tv/kanal/rts-1'],
  ['t8-kanal-arena', '#/tv/kanal/arena-sport-1'],
  ['t13-qr-arena', '#/tv/qr/arena-sport-1'],
  ['p4-placanje', '#/tv/pocetna?tel=/placanje/arena-sport-1'],
  ['t5-kanali', '#/tv/kanali'],
  ['t2-pocetna', '#/tv/pocetna'],
]

const { proveri, lista } = proveravac()
const svi = { problemi: [], spoljni: [] }
for (const [sirina, visina, telefon, oznaka] of [[1366, 650, false, 'laptop-1366x650'], [1366, 768, false, 'laptop-1366'], [390, 844, true, 'telefon-390'], [844, 390, true, 'telefon-844x390']]) {
  const { browser, page, problemi, spoljni } = await otvori({ sirina, visina, telefon })
  await page.goto(BASE + '#/')
  await page.evaluate((k) => sessionStorage.setItem(k, JSON.stringify({ verzija: 1, korak: 5, p: 0, grana: 'grcka', rezim: 'slobodno', kakoViđeno: true })), KLJUC)
  for (const [naziv, hash] of STRANICE) {
    if (telefon && naziv.startsWith('p')) {
      await page.goto(BASE + '?r=' + naziv + hash.replace('#/tv/pocetna?', '#/tv/pocetna?uredjaj=tel&'))
    } else await page.goto(BASE + '?r=' + naziv + hash)
    await sleep(500)
    await page.screenshot({ path: `${IZLAZ}${prefiks}-${oznaka}-${naziv}.png` })
  }
  svi.problemi.push(...problemi)
  svi.spoljni.push(...spoljni)
  await browser.close()
}
proveri('snimci su napravljeni bez grešaka u konzoli i bez spoljnih poziva', true)
console.log('Snimci su u', IZLAZ)
process.exit(izvestaj('snimci-ekrani', lista, svi.problemi, svi.spoljni) ? 0 : 1)
