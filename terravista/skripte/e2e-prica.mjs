// E2E PRIČA (PLAN B8.2, talas 1): vođena priča gledaoca, koraci 1–7, obe grane (Grčka i Srbija), u tri načina unosa:
// (a) samo tastatura (TV) + klik (telefon), (b) daljinski na ekranu (TV) + klik (telefon), (c) sve klikom.
// Posle SVAKE radnje proverava poziciju (sessionStorage) i ekrane (televizor i telefon) prema matrici; plus Dalje/Nazad/skok =
// isto stanje kao ručno, osvežavanje usred koraka, prerane radnje (nikad „mrtve“), Restart, „Napustio si ekran priče“,
// uski telefon (automatska smena uređaja), pločice bez odsečenog teksta, tastatura posle klika na traku.
// Pokretanje (preview mora da radi): npm run e2e:prica    (opcija: BRZO=1 preskače po jedan način unosa)
import { BASE, izvestaj, otvori, proveravac, sleep, ucitajModule, KLJUC } from './_zajednicko.mjs'

const { m, zatvori } = await ucitajModule({
  matrica: '/src/prica/matrica.ts',
  ekrani: '/src/pravila/ekrani.ts',
  tekstovi: '/src/podaci/stalni-tekstovi.ts',
})
const { definicija, stanjeZa, duzina } = m.matrica
const { razresi } = m.ekrani
await zatvori()

const { proveri, lista } = proveravac()
const problemiSvi = []
const spoljniSvi = []

const idEkrana = (putanja, uredjaj) => razresi(uredjaj, putanja)?.ekran.id ?? null
const ocekivano = (korak, p, grana) => {
  const st = stanjeZa(korak, p, grana)
  const tv = st.tv.startsWith('/tv') ? idEkrana(st.tv, 'tv') : idEkrana(st.tv, 'strana')
  return { tv, tel: idEkrana(st.tel, 'tel'), tvPutanja: st.tv, fokus: st.fokus }
}

/** Šta se trenutno vidi i šta je sačuvano. */
const stanje = (page) =>
  page.evaluate((kljuc) => {
    const z = JSON.parse(sessionStorage.getItem(kljuc) ?? 'null')
    const tv = document.querySelector('[data-tv-oblast] [data-ekran]')?.getAttribute('data-ekran') ?? document.querySelector('.tabla[data-ekran], .strana[data-ekran]')?.getAttribute('data-ekran') ?? null
    const tel = document.querySelector('[data-tel-platno] [data-ekran]')?.getAttribute('data-ekran') ?? null
    const izabrani = document.querySelector('[data-tv-oblast] [data-izabran]')
    return {
      korak: z?.korak, p: z?.p, grana: z?.grana, rezim: z?.rezim,
      tv, tel,
      izabranId: izabrani?.getAttribute('data-tv-id') ?? null,
      izabranaRadnja: izabrani?.getAttribute('data-radnja') ?? null,
      hash: location.hash,
      uredjaj: new URLSearchParams(location.hash.split('?')[1] ?? '').get('uredjaj'),
      poruka: document.querySelector('.tv-toast')?.textContent ?? null,
    }
  }, KLJUC)

async function cekajEkran(page, tv, tel) {
  const t0 = Date.now()
  for (;;) {
    const s = await stanje(page)
    if ((tv === null || s.tv === tv) && (tel === null || s.tel === tel || s.uredjaj === 'tel' || s.uredjaj === 'tv')) return s
    if (Date.now() - t0 > 4000) return s
    await sleep(40)
  }
}

/** Proverava da su pozicija i ekrani kao u matrici. `usko` = jedan uređaj: ekran onog drugog nije u DOM-u. */
async function proveriPoziciju(page, korak, p, grana, opis, { usko = false } = {}) {
  const o = ocekivano(korak, p, grana)
  const t0 = Date.now()
  let s
  do {
    s = await stanje(page)
    if (s.korak === korak && s.p === p && (s.tv === o.tv || (usko && s.uredjaj === 'tel')) && (usko || o.tv === 'V1' || o.tv === 'M1' || s.tel === o.tel)) break
    await sleep(40)
  } while (Date.now() - t0 < 4000)
  const tvOk = s.tv === o.tv || (usko && s.uredjaj === 'tel')
  const telOk = usko || o.tv === 'V1' || o.tv === 'M1' ? true : s.tel === o.tel
  proveri(`${opis}: pozicija ${korak}/${p}, TV ${o.tv}, telefon ${o.tel}`, s.korak === korak && s.p === p && tvOk && telOk, `stvarno: ${s.korak}/${s.p}, TV ${s.tv}, tel ${s.tel}, ${s.hash}`)
  return s
}

// ---------------------------------------------------------------- unos
const SMEROVI = { gore: 'ArrowUp', dole: 'ArrowDown', levo: 'ArrowLeft', desno: 'ArrowRight' }

async function mereIzabranog(page, selektor) {
  return page.evaluate((sel) => {
    const iz = document.querySelector('[data-tv-oblast] [data-izabran]')
    // ako je izabrani element već traženi (ima više kandidata, npr. tapeta i kartica), to je cilj
    const cilj = iz && iz.matches(sel) ? iz : document.querySelector(`[data-tv-oblast] ${sel}`)
    if (!iz || !cilj) return null
    const a = iz.getBoundingClientRect()
    const b = cilj.getBoundingClientRect()
    return { dx: b.left + b.width / 2 - (a.left + a.width / 2), dy: b.top + b.height / 2 - (a.top + a.height / 2), isti: iz === cilj }
  }, selektor)
}

/** Pomera izbor na televizoru ka elementu (tastaturom ili daljinskim) dok ga ne dostigne. */
async function doIzbora(page, selektor, nacin) {
  for (let i = 0; i < 40; i++) {
    const r = await mereIzabranog(page, selektor)
    if (!r) return false
    if (r.isti) return true
    const smer = Math.abs(r.dx) > Math.abs(r.dy) ? (r.dx > 0 ? 'desno' : 'levo') : r.dy > 0 ? 'dole' : 'gore'
    const alt = Math.abs(r.dx) > Math.abs(r.dy) ? (r.dy > 0 ? 'dole' : 'gore') : r.dx > 0 ? 'desno' : 'levo'
    const pre = await page.evaluate(() => document.querySelector('[data-tv-oblast] [data-izabran]')?.getAttribute('data-tv-id'))
    for (const s of [smer, alt]) {
      if (nacin === 'tastatura') await page.keyboard.press(SMEROVI[s])
      else await page.click(`[data-daljinski="${s}"]`)
      await sleep(20)
      const posle = await page.evaluate(() => document.querySelector('[data-tv-oblast] [data-izabran]')?.getAttribute('data-tv-id'))
      if (posle !== pre) break
    }
  }
  return false
}

/** Izvršava radnju priče: TV elementi tastaturom/daljinskim/klikom, telefonski uvek klikom (telefon se ne upravlja tastaturom). */
async function izvrsi(page, radnja, nacin, usko = false) {
  const sel = `[data-radnja="${radnja}"]`
  await page.waitForSelector(sel, { timeout: 4000 })
  await sleep(40)
  const naTelefonu = await page.evaluate((s) => !!document.querySelector(`[data-tel-platno] ${s}`) && !document.querySelector(`[data-tv-oblast] ${s}`), sel)
  if (naTelefonu) {
    if (usko) await page.evaluate(() => window.scrollTo(0, 0))
    await page.click(`[data-tel-platno] ${sel}`)
    return
  }
  if (nacin === 'klik') {
    await page.click(`[data-tv-oblast] ${sel}`)
    return
  }
  const stigao = await doIzbora(page, sel, nacin)
  if (!stigao) throw new Error(`nije stigao do ${radnja} (${nacin})`)
  if (nacin === 'tastatura') await page.keyboard.press('Enter')
  else await page.click('[data-daljinski="ok"]')
}

async function nova(opcije = {}) {
  const o = await otvori({ sirina: 1366, visina: 768, ...opcije })
  await o.page.goto(BASE + '#/')
  return o
}

async function udjiUDemo(page) {
  await page.click('a.strana-veza')
  await page.waitForSelector('[data-ekran="U2"]')
  await page.evaluate(() => [...document.querySelectorAll('button')].find((b) => b.textContent.trim() === 'Uđi u demo').click())
  await page.waitForSelector('[data-tv-oblast] [data-ekran="T1"]')
  await page.waitForSelector('[data-tv-id="kako-ok"]', { timeout: 3000 })
}

async function zatvoriKako(page) {
  await page.keyboard.press('Enter') // početni izbor „U redu“
  await page.waitForFunction(() => !document.querySelector('[data-tv-id="kako-ok"]'), { timeout: 3000 })
  await sleep(60)
}

const kliknuti = async (page, tekst, selektor = '[data-traka] button') =>
  page.evaluate(([t, s]) => {
    const b = [...document.querySelectorAll(s)].find((x) => (x.getAttribute('aria-label') ?? x.textContent).trim() === t || x.textContent.trim().startsWith(t))
    if (!b) return false
    b.click()
    return true
  }, [tekst, selektor])

// ---------------------------------------------------------------- 1. celi put u tri načina, obe grane
const NACINI = process.env.BRZO ? ['klik'] : ['tastatura', 'daljinski', 'klik']
for (const nacin of NACINI) {
  for (const grana of ['grcka', 'srbija']) {
    const { browser, page, problemi, spoljni } = await nova()
    const naziv = `put (${nacin}, ${grana})`
    try {
      await udjiUDemo(page)
      await proveriPoziciju(page, 1, 0, grana, `${naziv}: početak`)
      await zatvoriKako(page)
      for (let korak = 1; korak <= 7; korak++) {
        if (korak === 6) {
          // račva se bira prekidačem u kartici koraka (ili izborom na T25)
          const ok = await page.evaluate((g) => {
            const dugmad = [...document.querySelectorAll('[data-traka] [aria-label^="Račva"] button')]
            const ciljno = dugmad[g === 'grcka' ? 0 : 1]
            if (!ciljno) return false
            ciljno.click()
            return true
          }, grana)
          proveri(`${naziv}: prekidač račve u koraku 6`, ok)
        }
        const radnje = definicija(korak, grana).radnje
        for (let i = 0; i < radnje.length; i++) {
          await izvrsi(page, radnje[i], nacin)
          const s = await proveriPoziciju(page, korak, i + 1, grana, `${naziv}: radnja ${radnje[i]}`)
          if (!s) break
        }
        if (korak < 7) {
          await page.evaluate(() => [...document.querySelectorAll('[data-traka] button')].find((b) => b.textContent.trim().startsWith('Dalje'))?.click())
          await proveriPoziciju(page, korak + 1, 0, grana, `${naziv}: Dalje na početak koraka ${korak + 1}`)
        }
      }
    } catch (e) {
      proveri(`${naziv}: put je prošao bez greške`, false, e.message)
    }
    problemiSvi.push(...problemi)
    spoljniSvi.push(...spoljni)
    await browser.close()
  }
}

// ---------------------------------------------------------------- 2. samo „Dalje“ i „Nazad“ kroz svih 9 koraka (obe grane), skok na korak
for (const grana of ['grcka', 'srbija']) {
  const { browser, page, problemi, spoljni } = await nova()
  await udjiUDemo(page)
  await zatvoriKako(page)
  const poz = []
  for (let k = 1; k <= 9; k++) {
    const n = duzina(k, grana)
    poz.push([k, 0])
    if (n > 0) poz.push([k, n])
  }
  // korak 6 račva: bira se prekidačem dok je gledalac u koraku 6
  let idx = 0
  let greske = 0
  for (const [k, p] of poz) {
    if (k === 6 && p === 0) {
      await page.evaluate((g) => document.querySelectorAll('[data-traka] [aria-label^="Račva"] button')[g === 'grcka' ? 0 : 1]?.click(), grana)
      await sleep(80)
    }
    const s = await stanje(page)
    const o = ocekivano(k, p, grana)
    if (!(s.korak === k && s.p === p && s.tv === o.tv && (s.tel === o.tel || o.tv === 'V1' || o.tv === 'M1'))) {
      const dobio = await proveriPoziciju(page, k, p, grana, `Dalje-samo (${grana})`)
      if (dobio.korak !== k) greske++
    }
    idx++
    if (idx < poz.length) await page.evaluate(() => [...document.querySelectorAll('[data-traka] button')].find((b) => b.textContent.trim().startsWith('Dalje'))?.click())
    await sleep(60)
  }
  proveri(`Dalje-samo (${grana}): ${poz.length} pozicija obiđeno, ekrani prate matricu`, greske === 0)
  const kraj = await stanje(page)
  proveri(`Dalje-samo (${grana}): na koraku 9 je tabla platforme i „Dalje“ je isključeno`, kraj.korak === 9 && (await page.evaluate(() => [...document.querySelectorAll('[data-traka] button')].find((b) => /Kraj/.test(b.textContent))?.disabled === true)))

  // Nazad do početka
  for (let i = 0; i < 20; i++) await page.evaluate(() => [...document.querySelectorAll('[data-traka] button')].find((b) => b.textContent.trim() === 'Nazad')?.click())
  await sleep(100)
  await proveriPoziciju(page, 1, 0, grana, `Nazad do početka (${grana})`)

  // skok na korak = isto kao početno stanje koraka
  for (const k of [7, 4, 2, 5, 3]) {
    await page.evaluate((n) => document.querySelectorAll('[data-traka] .tacka')[n - 1]?.click(), k)
    await proveriPoziciju(page, k, 0, grana, `skok na korak ${k} (${grana})`)
  }
  // skok na 7: obe pretplate vidljive na T19
  await page.evaluate(() => document.querySelectorAll('[data-traka] .tacka')[6]?.click())
  await sleep(150)
  const redova = await page.evaluate(() => document.querySelectorAll('.pretplata-red').length)
  proveri(`skok na korak 7 (${grana}): na T19 su obe pretplate (Doma TV i Paket Srbija)`, redova === 2, String(redova))
  await page.evaluate(() => document.querySelectorAll('[data-traka] .tacka')[3]?.click()) // korak 4
  await sleep(150)
  const kanalDugme = await page.evaluate(() => document.querySelector('[data-tv-id="kanal-glavno"]')?.textContent.trim())
  proveri(`skok na korak 4 (${grana}): T8 nudi „Pretplati se“`, /Pretplati se/.test(kanalDugme ?? ''), String(kanalDugme))
  // Dalje do završnog stanja koraka 4: kvačica „Razumem“ je štiklirana (P3 u pod-koraku 4/4 se vidi pri skoku na p=4 preko radnji)
  problemiSvi.push(...problemi)
  spoljniSvi.push(...spoljni)
  await browser.close()
}

// ---------------------------------------------------------------- 3. osvežavanje usred koraka, kvačica „Razumem“, prerane radnje
{
  const { browser, page, problemi, spoljni } = await nova()
  await udjiUDemo(page)
  await zatvoriKako(page)
  // do pod-koraka 4/3 (P3, kvačica nije štiklirana)
  for (const [k, radnje] of [[1, 1], [2, 3], [3, 1]]) {
    for (let i = 0; i < radnje; i++) await izvrsi(page, definicija(k, 'grcka').radnje[i], 'klik')
    await page.evaluate(() => [...document.querySelectorAll('[data-traka] button')].find((b) => b.textContent.trim().startsWith('Dalje'))?.click())
    await sleep(100)
  }
  for (const r of ['pretplati', 'skeniraj', 'nastavi-kao-ana']) await izvrsi(page, r, 'klik')
  await proveriPoziciju(page, 4, 3, 'grcka', 'pre osvežavanja')
  const pre = await page.evaluate(() => document.querySelector('[data-tel-platno] input[type=checkbox]')?.checked)
  proveri('P3 na početku: kvačica „Razumem“ NIJE unapred štiklirana', pre === false, String(pre))
  const dugmeOnemoguceno = await page.evaluate(() => document.querySelector('[data-tel-platno] [data-radnja="na-placanje"]')?.disabled)
  proveri('P3: „Nastavi na plaćanje“ je isključeno dok kvačica nije štiklirana', dugmeOnemoguceno === true)
  await page.reload()
  await page.waitForSelector('[data-tel-platno] [data-ekran="P3"]', { timeout: 5000 })
  await proveriPoziciju(page, 4, 3, 'grcka', 'posle F5 usred koraka 4')
  await izvrsi(page, 'razumem', 'klik')
  await proveriPoziciju(page, 4, 4, 'grcka', 'kvačica klikom')
  const posle = await page.evaluate(() => document.querySelector('[data-tel-platno] input[type=checkbox]')?.checked)
  proveri('posle klika kvačica je štiklirana', posle === true)
  await page.reload()
  await page.waitForSelector('[data-tel-platno] [data-ekran="P3"]', { timeout: 5000 })
  const posleF5 = await page.evaluate(() => document.querySelector('[data-tel-platno] input[type=checkbox]')?.checked)
  proveri('posle F5 pozicija 4/4 čuva štikliranu kvačicu', posleF5 === true)

  // preurađena radnja: na T13 dugme „Skeniraj“ dok je priča na 4/4 — radnja je prošla pa dugme radi kao slobodno (nije mrtvo)
  await kliknuti(page, 'Dalje')
  await sleep(100)
  // prerana radnja: skok na korak 2 pa „Skeniraj“ sa T13 (dolazi u koraku 4)
  await page.evaluate(() => document.querySelectorAll('[data-traka] .tacka')[1]?.click())
  await sleep(100)
  await page.evaluate(() => (location.hash = '#/tv/qr/doma-tv'))
  await page.waitForSelector('[data-tv-oblast] [data-ekran="T13"]')
  await sleep(100)
  await page.click('[data-tv-oblast] [data-radnja="skeniraj"]')
  await sleep(120)
  const s1 = await stanje(page)
  proveri('prerana radnja: priča ostaje na koraku 2, a poruka kaže „U priči ovo dolazi u koraku 4.“', s1.korak === 2 && s1.p === 0 && (s1.poruka ?? '').startsWith('U priči ovo dolazi u koraku 4.'), `${s1.korak}/${s1.p} | ${s1.poruka}`)
  const idiNaKorak4 = await page.evaluate(() => [...document.querySelectorAll('.tv-toast-dugme')].map((b) => b.textContent))
  proveri('poruka o prerano pritisnutoj radnji nudi dugme „Idi na korak 4“', idiNaKorak4.includes('Idi na korak 4'), JSON.stringify(idiNaKorak4))
  // „Napustio si ekran priče“ + „Nazad na priču“
  const napustio = await page.evaluate(() => document.querySelector('.traka-napustio')?.textContent ?? null)
  proveri('traka javlja „Napustio si ekran priče“ kad ekran nije iz koraka', !!napustio && /Napustio si ekran priče/.test(napustio), String(napustio))
  await page.evaluate(() => document.querySelector('.traka-napustio button')?.click())
  await proveriPoziciju(page, 2, 0, 'grcka', '„Nazad na priču“ vraća na početno stanje koraka')
  proveri('traka više ne javlja „Napustio si…“', (await page.$('.traka-napustio')) === null)
  // prva radnja sledećeg koraka se prihvata kad je trenutni završen
  await page.evaluate(() => [...document.querySelectorAll('[data-traka] button')].find((b) => b.textContent.trim().startsWith('Dalje'))?.click()) // 2/3 završno
  await sleep(100)
  await page.evaluate(() => (location.hash = '#/tv/kanali'))
  await page.waitForSelector('[data-tv-oblast] [data-ekran="T5"]')
  await sleep(100)
  await page.click('[data-tv-oblast] [data-tv-id="kanali-prekidac-poizboru"]')
  await sleep(100)
  await page.click('[data-tv-oblast] [data-radnja="otvori-kanal-price"]') // Doma TV (po izboru) — prva radnja koraka 3
  await sleep(100)
  await proveriPoziciju(page, 3, 1, 'grcka', 'prva radnja sledećeg koraka se prihvata (korak 2 je bio završen)')

  // Restart: podrazumevano „Odustani“, Backspace zatvara, „Da“ vraća na 1/0 i ponovo prikazuje „Kako se upravlja“
  await kliknuti(page, 'Restart demo')
  await page.waitForSelector('.dijalog')
  const fokusDijalog = await page.evaluate(() => document.activeElement?.textContent.trim())
  proveri('dijalog Restarta: podrazumevani izbor je „Odustani“', fokusDijalog === 'Odustani', fokusDijalog)
  await page.keyboard.press('Backspace')
  await sleep(80)
  proveri('Backspace zatvara dijalog Restarta', (await page.$('.dijalog')) === null)
  await kliknuti(page, 'Restart demo')
  await page.waitForSelector('.dijalog')
  await page.evaluate(() => document.querySelector('.dijalog-da')?.click())
  await proveriPoziciju(page, 1, 0, 'grcka', 'Restart: korak 1 početno')
  await page.waitForSelector('[data-tv-id="kako-ok"]', { timeout: 3000 }).then(() => proveri('Restart ponovo prikazuje „Kako se upravlja“', true)).catch(() => proveri('Restart ponovo prikazuje „Kako se upravlja“', false))

  // tastatura posle klika na traku (dugme „Dalje“) i na prekidač: TV reaguje (fokus ne beži)
  await zatvoriKako(page)
  await izvrsi(page, 'pocni', 'klik')
  await sleep(100)
  await kliknuti(page, 'Dalje') // 1/1 završno → početak koraka 2 (T2, fokus na Klasik)
  await sleep(150)
  const a = await stanje(page)
  await page.keyboard.press('ArrowRight')
  await sleep(40)
  const b = await stanje(page)
  proveri('posle klika na „Dalje“ strelica i dalje pomera izbor na televizoru', a.izabranId && b.izabranId && a.izabranId !== b.izabranId, `${a.izabranId} → ${b.izabranId}`)
  await page.evaluate(() => [...document.querySelectorAll('[data-traka] .segment button')].find((x) => x.textContent.trim() === 'Slobodno')?.click())
  await page.keyboard.press('ArrowLeft')
  await sleep(40)
  const c = await stanje(page)
  proveri('posle klika na prekidač režima strelica i dalje upravlja televizorom', c.izabranId === a.izabranId, `${a.izabranId} → ${c.izabranId}`)
  const korakTekst = await page.evaluate(() => document.querySelector('.traka-korak')?.textContent ?? '')
  proveri('slobodni režim zadržava „Korak N od 9 · naslov“', /Korak 2 od 9 · /.test(korakTekst), korakTekst)

  // pločice bez odsečenog teksta (T2 svi redovi, T15, T16 Paket Film, T3)
  const odsecene = []
  for (const hash of ['#/tv/pocetna', '#/tv/paketi', '#/tv/paket/film', '#/tv/vodic', '#/tv/kanali']) {
    await page.evaluate((h) => (location.hash = h), hash)
    await sleep(250)
    const lose = await page.evaluate(() =>
      [...document.querySelectorAll('[data-tv-oblast] .plocica, [data-tv-oblast] .kartica-paketa-naziv, [data-tv-oblast] .vodic-naziv')]
        .filter((e) => e.scrollHeight > e.clientHeight + 1 || (e.classList.contains('plocica') && e.scrollWidth > e.clientWidth + 1))
        .map((e) => `${e.className} ${e.textContent.trim() || e.getAttribute('aria-label') || e.innerHTML.slice(0, 60)} [${e.scrollWidth}x${e.scrollHeight} u ${e.clientWidth}x${e.clientHeight}]`),
    )
    // vodič namerno skraćuje naslove emisija trotačkom (text-overflow), ali visina ne sme da pukne
    odsecene.push(...lose.map((x) => `${hash}: ${x}`))
  }
  proveri('nijedna pločica ni naziv nema odsečen tekst (scrollHeight ≤ clientHeight)', odsecene.length === 0, odsecene.join(' | '))

  problemiSvi.push(...problemi)
  spoljniSvi.push(...spoljni)
  await browser.close()
}

// ---------------------------------------------------------------- 4. uski telefon: automatska smena uređaja
{
  const { browser, page, problemi, spoljni } = await nova({ sirina: 390, visina: 844, telefon: true })
  await page.click('a.strana-veza')
  await page.waitForSelector('[data-ekran="U2"]')
  await page.evaluate(() => [...document.querySelectorAll('button')].find((b) => b.textContent.trim() === 'Uđi u demo').click())
  await page.waitForSelector('[data-tv-oblast] [data-ekran="T1"]')
  await page.waitForSelector('[data-tv-id="kako-ok"]', { timeout: 3000 })
  await page.evaluate(() => document.querySelector('[data-tv-id="kako-ok"]').click())
  await sleep(100)
  const usko = true
  const klikTv = async (radnja) => page.click(`[data-tv-oblast] [data-radnja="${radnja}"]`)
  await klikTv('pocni')
  await kliknuti(page, 'Dalje')
  await sleep(100)
  await klikTv('gledaj-besplatni-film'); await sleep(100)
  await klikTv('pokazi-reklamu'); await sleep(100)
  await klikTv('nastavi-program'); await sleep(100)
  await kliknuti(page, 'Dalje'); await sleep(100)
  await kliknuti(page, 'Dalje'); await sleep(100) // korak 3 završno? ne: 3/0 → 3/1
  await proveriPoziciju(page, 3, 1, 'grcka', 'uski: korak 3 završno', { usko })
  await kliknuti(page, 'Dalje'); await sleep(100) // 4/0 (T8)
  await klikTv('pretplati'); await sleep(100)
  await klikTv('skeniraj'); await sleep(150)
  let s = await stanje(page)
  proveri('uski telefon: posle „Skeniraj“ ekran se sam prebacuje na telefon (uredjaj=tel, P2)', s.uredjaj === 'tel' && s.tel === 'P2', `${s.uredjaj} ${s.tel}`)
  await page.click('[data-tel-platno] [data-radnja="nastavi-kao-ana"]'); await sleep(100)
  await page.click('[data-tel-platno] [data-radnja="razumem"]'); await sleep(100)
  await page.click('[data-tel-platno] [data-radnja="na-placanje"]'); await sleep(100)
  await page.click('[data-tel-platno] [data-radnja="plati"]'); await sleep(100)
  await page.click('[data-tel-platno] [data-radnja="vrati-na-tv"]'); await sleep(150)
  s = await stanje(page)
  proveri('uski telefon: „Vrati se na televizor“ prebacuje na televizor (T14)', s.uredjaj !== 'tel' && s.tv === 'T14', `${s.uredjaj} ${s.tv}`)
  const horizontalniSkrol = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)
  proveri('uski telefon: nema skrola u stranu', !horizontalniSkrol)
  problemiSvi.push(...problemi)
  spoljniSvi.push(...spoljni)
  await browser.close()
}

process.exit(izvestaj('e2e-prica', lista, problemiSvi, spoljniSvi) ? 0 : 1)
