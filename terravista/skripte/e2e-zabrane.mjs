// E2E ZABRANE (PLAN B6.5): u pravom pregledaču, na svih 53 ekrana i na svakoj poziciji priče (obe grane):
// prikazani tekst nema zabranjen izraz (zakon, presuda, partner van oznake, garancija…) ni netačnu rečenicu o nedostupnosti;
// nema <form>, nema polja za kucanje (samo kvačice), sva dugmad type="button", svi linkovi počinju sa #; nijedan spoljni mrežni zahtev;
// 0 grešaka u konzoli i 0 CSP prijava. Pokretanje (preview mora da radi): npm run e2e:zabrane
import { BASE, KLJUC, izvestaj, otvori, proveravac, sleep, ucitajModule } from './_zajednicko.mjs'

const { m, zatvori } = await ucitajModule({
  ekrani: '/src/pravila/ekrani.ts',
  zabrane: '/src/pravila/zabrane.ts',
  matrica: '/src/prica/matrica.ts',
})
const { EKRANI, sastavi } = m.ekrani
const { nadjiZabranjeno, netacnaRecenicaONedostupnosti } = m.zabrane
const { stanjeZa, duzina } = m.matrica
await zatvori()

const { proveri, lista } = proveravac()
const { browser, page, problemi, spoljni } = await otvori({ sirina: 1366, visina: 768 })

const posebno = { T4: { id: 'klasik-tv-1' }, T10: { id: 'reklama-1' }, T16: { id: 'srbija' }, P7: { id: 'srbija' }, P10: { id: 'srbija' }, P13: { id: 'DEMO-0001' } }
const primer = { id: 'doma-tv', proizvod: 'doma-tv', upit: 'film', pitanje: 'kako-otkazujem' }
const parametriZa = (e) => posebno[e.id] ?? Object.fromEntries([...e.ruta.matchAll(/:(\w+)/g)].map(([, ime]) => [ime, primer[ime]]))

const postavi = (z) =>
  page.evaluate(([k, v]) => sessionStorage.setItem(k, JSON.stringify(v)), [KLJUC, { verzija: 1, ...z, kakoViđeno: true }])

/** Prikazani tekst i provere strukture trenutne stranice. */
const pregled = () =>
  page.evaluate(() => {
    const delovi = [...document.querySelectorAll('[data-tv-oblast], [data-tel-platno], .strana')]
    const tekst = delovi.map((d) => d.innerText).join('\n')
    const linkovi = [...document.querySelectorAll('a')].map((a) => a.getAttribute('href'))
    const polja = [...document.querySelectorAll('input, textarea, select, form, [contenteditable]')].filter((e) => !(e.tagName === 'INPUT' && e.type === 'checkbox'))
    const dugmad = [...document.querySelectorAll('button')].filter((b) => b.getAttribute('type') !== 'button').length
    return { tekst, losiLinkovi: linkovi.filter((h) => !h || !h.startsWith('#')), polja: polja.length, dugmad }
  })

const lose = []
let pregledano = 0
async function proveriStranicu(opis) {
  const p = await pregled()
  pregledano++
  const z = nadjiZabranjeno(p.tekst)
  if (z.length) lose.push(`${opis}: zabranjeno ${z.join(', ')}`)
  if (netacnaRecenicaONedostupnosti(p.tekst)) lose.push(`${opis}: netačna rečenica o nedostupnosti`)
  if (p.losiLinkovi.length) lose.push(`${opis}: spoljni/neispravan link ${p.losiLinkovi.join(',')}`)
  if (p.polja) lose.push(`${opis}: polja za kucanje/forma (${p.polja})`)
  if (p.dugmad) lose.push(`${opis}: dugme bez type="button" (${p.dugmad})`)
}

// 1. svih 53 ekrana (slobodno razgledanje: pozicija 5/0, Doma TV pretplaćen)
await page.goto(BASE + '#/')
await postavi({ korak: 5, p: 0, grana: 'grcka', rezim: 'slobodno' })
for (const e of EKRANI) {
  // T12 postoji samo u zemlji gde je kanal nedostupan (inače ga ruter preusmerava na T8): Srbija, korak 6
  await postavi(e.id === 'T12' ? { korak: 6, p: 1, grana: 'srbija', rezim: 'slobodno' } : { korak: 5, p: 0, grana: 'grcka', rezim: 'slobodno' })
  const p = sastavi(e.id, parametriZa(e))
  const hash = e.uredjaj === 'tel' ? `#/tv/pocetna?tel=${p}` : '#' + p
  // SPA bi pri promeni adrese još sa starim stanjem preusmerila T12 → zato svež ulazak na adresu
  await page.goto(BASE + '?r=' + e.id + hash)
  await page.waitForSelector(e.uredjaj === 'tel' ? `[data-tel-platno] [data-ekran="${e.id}"]` : `[data-ekran="${e.id}"]`, { timeout: 5000 }).catch(() => lose.push(`${e.id}: ekran se nije pojavio`))
  await sleep(60)
  await proveriStranicu(`ekran ${e.id}`)
}
proveri(`53 ekrana: zabranjeni izrazi, struktura, linkovi (pregledano ${pregledano})`, pregledano === 53 && lose.length === 0, lose.slice(0, 6).join(' | '))

// 2. svaka pozicija priče, obe grane (TV i telefon u istom stanju)
const pre = pregledano
for (const grana of ['grcka', 'srbija']) {
  for (let k = 1; k <= 9; k++) {
    for (let p = 0; p <= duzina(k, grana); p++) {
      const st = stanjeZa(k, p, grana)
      await postavi({ korak: k, p, grana, rezim: 'vodjena' })
      const hash = st.tv.startsWith('/tv') ? `#${st.tv}?tel=${st.tel}` : `#${st.tv}`
      await page.evaluate((h) => { location.hash = h }, hash)
      await page.reload()
      await sleep(120)
      await proveriStranicu(`priča ${grana} ${k}/${p}`)
    }
  }
}
proveri(`priča: ${pregledano - pre} pozicija (obe grane) bez zabranjenih izraza i bez prekršaja strukture`, pregledano - pre > 50 && lose.length === 0, lose.slice(0, 6).join(' | '))

const csp = await page.evaluate(() => window.__csp ?? [])
proveri('0 prijava o kršenju CSP-a', csp.length === 0, csp.join(' | '))
await browser.close()
process.exit(izvestaj('e2e-zabrane', lista, problemi, spoljni) ? 0 : 1)
