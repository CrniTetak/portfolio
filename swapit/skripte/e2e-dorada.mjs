// Proba DORADE talasa 1 u pravom pregledaču: pravne oznake i značke na karticama, strelice karusela, kvačice pri „izvedi“ i „Nazad“,
// „sve troje“, traka priče bez odsecanja na 1024–1440 px (visina trake ista, tekst ceo), telefon 320×568 (bez vodoravnog skrola,
// „Dalje“ / „Pokaži mi“ cele), „Nema te stranice“, Restart (Roba), Uđi u demo (potvrda), levi stub / meni ugla, mapa (natpisi ≥ 11 px).
// Pokretanje: npm run build ; npm run preview ; npm run e2e:dorada   (SNIMCI=putanja = i snimci ključnih ispravki)
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { BASE, KLJUC, izvestaj, otvori, proveravac, sleep, ucitajModule } from './_zajednicko.mjs'

const SNIMCI = process.env.SNIMCI
if (SNIMCI) mkdirSync(SNIMCI, { recursive: true })
const { m, zatvori } = await ucitajModule({ rute: '/src/pravila/rute.ts', koraci: '/src/prica/koraci.ts', zabrane: '/src/pravila/zabrane.ts', pomocno: '/src/scenario/pomocno.ts' })
const { lista, proveri } = proveravac()
const svaProblemi = []
const sviSpoljni = []

const POCETNO = { v: 1, poz: { korak: 1, n: 0, grana: 'lanac' }, rezim: 'vodjena', tema: 'svetla', poruke: { slobodno: true }, saglasnosti: {}, tokovi: { noviOglasi: [], omiljeno: [] } }

/** Postavlja stanje u sessionStorage (posle prvog učitavanja, da ga aplikacija ne pregazi) i otvara rutu. */
async function otvoriRutu(page, ruta, stanje = {}) {
  await page.goto(BASE + '?r=0#/', { waitUntil: 'networkidle0' })
  await sleep(250)
  await page.evaluate((k, s) => sessionStorage.setItem(k, JSON.stringify(s)), KLJUC, { ...POCETNO, ...stanje })
  await page.goto(BASE + '?r=' + Math.random().toString(36).slice(2, 7) + '#' + ruta, { waitUntil: 'networkidle0' })
  await page.evaluate(() => document.fonts.ready)
  await sleep(250)
}
const stanjeIzSesije = (page) => page.evaluate((k) => JSON.parse(sessionStorage.getItem(k) ?? 'null'), KLJUC)
const klikniTekst = (page, selektor, tekst) =>
  page.evaluate(
    (sel, t) => {
      const el = [...document.querySelectorAll(sel)].find((x) => x.textContent?.replace(/\s+/g, ' ').trim().includes(t))
      if (!el) return false
      el.click()
      return true
    },
    selektor,
    tekst,
  )
const snimak = async (page, ime) => SNIMCI && (await page.screenshot({ path: join(SNIMCI, ime + '.png') }))

async function sesija(sirina, visina, telefon, f) {
  const o = await otvori({ sirina, visina, telefon })
  try {
    await f(o.page)
  } finally {
    svaProblemi.push(...o.problemi)
    sviSpoljni.push(...o.spoljni)
    await o.browser.close()
  }
}

// ---------------------------------------------------------------------------------------------------------------------
// 1) PRAVNE OZNAKE I ZNAČKE NA KARTICAMA + STRELICE KARUSELA (računar 1440, 1280, 1024; telefon 390 i 320)
// ---------------------------------------------------------------------------------------------------------------------
async function proveraKartica(sirina, visina, telefon, ime) {
  await sesija(sirina, visina, telefon, async (page) => {
    await otvoriRutu(page, '/ana/pocetna', { poz: { korak: 3, n: 0, grana: 'lanac' } })
    const d = await page.evaluate(() => {
      const izlaz = { kartica: 0, prekriva: [], odsecene: [], bezPravne: [], istaknutoBez: [], izvanKartice: [], horizontalniSkrol: document.documentElement.scrollWidth > innerWidth + 1 }
      for (const k of document.querySelectorAll('.ko')) {
        izlaz.kartica++
        const id = k.getAttribute('data-oglas')
        const rk = k.getBoundingClientRect()
        const slika = k.querySelector('.ko-slika').getBoundingClientRect()
        const pojas = k.querySelector('.ko-pojas')
        const rp = pojas.getBoundingClientRect()
        if (rp.top < slika.bottom - 0.5) izlaz.prekriva.push(id)
        const tekst = pojas.textContent ?? ''
        if (!/Građanin|Firma/.test(tekst)) izlaz.bezPravne.push(id)
        if (k.classList.contains('ko-istaknuto') && !tekst.includes('Istaknuto · plaćeno')) izlaz.istaknutoBez.push(id)
        for (const z of pojas.querySelectorAll('.znacka')) {
          const r = z.getBoundingClientRect()
          if (z.scrollWidth > z.clientWidth + 1 || z.scrollHeight > z.clientHeight + 1) izlaz.odsecene.push(`${id}: ${z.textContent}`)
          if (r.left < rk.left - 0.5 || r.right > rk.right + 0.5 || r.bottom > rk.bottom + 0.5) izlaz.izvanKartice.push(`${id}: ${z.textContent}`)
        }
      }
      return izlaz
    })
    const o = (opis) => `${ime}: ${opis}`
    proveri(o(`kartice na početnoj postoje (${d.kartica})`), d.kartica >= 10, d.kartica)
    proveri(o('značke ne prekrivaju sliku (stoje ispod nje)'), d.prekriva.length === 0, d.prekriva.join(', '))
    proveri(o('svaka kartica ima „Građanin“ ili „Firma“'), d.bezPravne.length === 0, d.bezPravne.join(', '))
    proveri(o('svaka istaknuta kartica ima „Istaknuto · plaćeno“'), d.istaknutoBez.length === 0, d.istaknutoBez.join(', '))
    proveri(o('nijedna značka nije odsečena (tekst ceo)'), d.odsecene.length === 0, d.odsecene.join(' | '))
    proveri(o('nijedna značka ne izlazi iz kartice'), d.izvanKartice.length === 0, d.izvanKartice.join(' | '))
    proveri(o('nema vodoravnog skrola strane'), !d.horizontalniSkrol)
    if (ime === 'racunar-1440') await snimak(page, 'p1-1440-redovi-kartica')

    if (!telefon) {
      // strelice stoje u sopstvenom razmaku: ne dodiruju niz, a nijedna značka prve/poslednje vidljive kartice nije prekrivena (elementFromPoint)
      const r = await page.evaluate(async () => {
        const izlaz = { redova: 0, sudar: [], prekrivene: [] }
        const proveriRed = (red, kada) => {
          const niz = red.querySelector('.red-kat-niz').getBoundingClientRect()
          for (const s of red.querySelectorAll('.red-strelica')) {
            const rs = s.getBoundingClientRect()
            if (rs.right > niz.left + 0.5 && rs.left < niz.right - 0.5) izlaz.sudar.push(`${red.dataset.red} ${kada}`)
          }
          const vidljive = [...red.querySelectorAll('.ko')].filter((k) => {
            const rk = k.getBoundingClientRect()
            return rk.left >= niz.left - 1 && rk.right <= niz.right + 1
          })
          for (const k of [vidljive[0], vidljive[vidljive.length - 1]].filter(Boolean))
            for (const z of k.querySelectorAll('.znacka')) {
              const rz = z.getBoundingClientRect()
              const tacka = document.elementFromPoint(rz.left + rz.width / 2, rz.top + rz.height / 2)
              // cela kartica je klikabilna (razvučen link), pa je bitno samo da značku ne prekriva strelica ili tuđa kartica
              if (!tacka || tacka.closest('.red-strelica') || tacka.closest('.ko') !== k) izlaz.prekrivene.push(`${red.dataset.red} ${kada}: ${z.textContent}`)
            }
        }
        for (const red of document.querySelectorAll('.red-kat')) {
          if (!red.querySelector('.red-strelica')) continue
          izlaz.redova++
          red.scrollIntoView({ block: 'center' })
          const niz = red.querySelector('.red-kat-niz')
          niz.scrollLeft = 0
          await new Promise((res) => setTimeout(res, 40))
          proveriRed(red, 'početak')
          niz.scrollLeft = niz.scrollWidth
          await new Promise((res) => setTimeout(res, 40))
          proveriRed(red, 'kraj')
        }
        return izlaz
      })
      proveri(o(`strelice karusela (${r.redova} redova): ne dodiruju niz kartica`), r.redova >= 5 && r.sudar.length === 0, r.sudar.join(', ') || r.redova)
      proveri(o('strelice ne prekrivaju značke prve i poslednje vidljive kartice (elementFromPoint)'), r.prekrivene.length === 0, r.prekrivene.join(' | '))
    }
  })
}
await proveraKartica(1440, 900, false, 'racunar-1440')
await proveraKartica(1280, 800, false, 'racunar-1280')
await proveraKartica(1024, 768, false, 'racunar-1024')
await proveraKartica(390, 844, true, 'telefon-390')
await proveraKartica(320, 568, true, 'telefon-320')

// PREMIUM: „Top ponuda“ ima tačno jednu karticu, aukcija nosi „Javna aukcija“, sve istaknuto je plaćeno oznako
await sesija(1440, 900, false, async (page) => {
  await otvoriRutu(page, '/ana/pocetna')
  const d = await page.evaluate(() => {
    const p = document.querySelector('[data-premium]')
    const podnaslovi = [...p.querySelectorAll('.premium-podnaslov')].map((x) => x.textContent)
    const kartice = [...p.querySelectorAll('.ko')]
    // kartice ispod naslova „Top ponuda“, do sledećeg podnaslova
    const top = p.querySelector('.premium-podnaslov:nth-of-type(2)')
    let n = 0
    for (let e = top?.nextElementSibling; e && !e.classList.contains('premium-podnaslov'); e = e.nextElementSibling) if (e.classList.contains('ko')) n++
    return { podnaslovi, kartica: kartice.length, topKartica: n, aukcija: kartice[0]?.textContent ?? '', tekst: p.textContent }
  })
  proveri('PREMIUM: „Top ponuda“ ima tačno jednu karticu', d.topKartica === 1, JSON.stringify(d.podnaslovi) + ' ' + d.topKartica)
  proveri('PREMIUM: kartica javne aukcije nosi „Javna aukcija“', /Javna aukcija/.test(d.aukcija) && d.podnaslovi[0] === 'Javna aukcija', d.aukcija)
  proveri('PREMIUM: istaknute kartice nose „Istaknuto · plaćeno“', (d.tekst.match(/Istaknuto · plaćeno/g) ?? []).length >= 3, d.tekst.slice(0, 200))
  await snimak(page, 'premium-desna-kolona')
})

// ---------------------------------------------------------------------------------------------------------------------
// 2) KVAČICE: izvedi (PK1) i Nazad (PK2) kroz pravi interfejs
// ---------------------------------------------------------------------------------------------------------------------
await sesija(1280, 800, false, async (page) => {
  // PK1: Marko dogovoreno (7.c2) → Ana D2 ima štiklirane kvačice
  await otvoriRutu(page, '/marko/dogovor/lanac', { poz: { korak: 7, n: 0, grana: 'lanac' } })
  await klikniTekst(page, 'main [data-radnja="7.x8"] button, main [data-radnja="7.x8"] a', 'Poruke')
  await sleep(300)
  await klikniTekst(page, 'main button', 'Dogovoreno')
  await sleep(300)
  const st = await stanjeIzSesije(page)
  proveri('PK1: posle „Dogovoreno“ (Marko) priča je na kraju koraka 7', st?.poz?.korak === 7 && st?.poz?.n === 6, JSON.stringify(st?.poz))
  proveri('PK1: zapis ima kvačice d2_uslovi i z3_odmah_dostava', st?.saglasnosti?.d2_uslovi === true && st?.saglasnosti?.z3_odmah_dostava === true, JSON.stringify(st?.saglasnosti))
  await page.goto(BASE + '?r=k1#/ana/dostava/pregled', { waitUntil: 'networkidle0' })
  await sleep(300)
  const d2 = await page.evaluate(() => ({ stiklirano: document.querySelector('[data-saglasnost="d2_uslovi"]')?.checked, h1: document.querySelector('main h1')?.textContent }))
  proveri('PK1: Ana na D2 vidi štikliranu kvačicu „Prihvatam uslove dostave“', d2.stiklirano === true, JSON.stringify(d2))
  await snimak(page, 'pk1-ana-d2-stiklirano')
})
await sesija(1280, 800, false, async (page) => {
  // PK2: Ana pošalje ponudu (4.x2), pa „Nazad“ na početak koraka 4 → „Razumem“ nije štiklirano, „Pošalji ponudu“ neaktivno
  await otvoriRutu(page, '/ana/ponuda/markov-bicikl/izaberi', { poz: { korak: 4, n: 0, grana: 'lanac' }, saglasnosti: { r3_punoletstvo: true, r3_uslovi: true } })
  await klikniTekst(page, 'main button', 'Izaberi')
  await sleep(200)
  await klikniTekst(page, 'main [data-radnja="4.x1"] button, main [data-radnja="4.x1"] a', 'Nastavi')
  await sleep(300)
  await page.evaluate(() => document.querySelector('[data-saglasnost="x2_razumem"]').click())
  await sleep(150)
  await klikniTekst(page, 'main [data-radnja="4.x2"] button', 'Pošalji ponudu')
  await sleep(300)
  const posle = await stanjeIzSesije(page)
  proveri('PK2: ponuda je poslata (4.x2), „Razumem“ je štiklirano', posle?.poz?.n === 2 && posle?.saglasnosti?.x2_razumem === true, JSON.stringify([posle?.poz, posle?.saglasnosti]))
  await klikniTekst(page, '[data-traka-price] button', 'Nazad') // Nazad: odmaklo → početak koraka 4
  await sleep(300)
  const nazad = await stanjeIzSesije(page)
  proveri('PK2: posle Nazad priča je na početku koraka 4', nazad?.poz?.korak === 4 && nazad?.poz?.n === 0, JSON.stringify(nazad?.poz))
  proveri('PK2: kvačice koraka 4 su skinute (x1_izbor, x2_razumem), korak 1 ostaje', !nazad?.saglasnosti?.x2_razumem && !nazad?.saglasnosti?.x1_izbor && nazad?.saglasnosti?.r3_uslovi === true, JSON.stringify(nazad?.saglasnosti))
  await page.goto(BASE + '?r=k2#/ana/ponuda/markov-bicikl/pregled', { waitUntil: 'networkidle0' })
  await sleep(300)
  const x2 = await page.evaluate(() => ({ razumem: document.querySelector('[data-saglasnost="x2_razumem"]')?.checked, dugme: (() => { const b = document.querySelector('[data-radnja="4.x2"] button, [data-radnja="4.x2"] a'); return b?.disabled || b?.getAttribute('aria-disabled') === 'true' })() }))
  proveri('PK2: „Pošalji ponudu“ je neaktivno bez „Razumem“', x2.razumem === false && x2.dugme === true, JSON.stringify(x2))
})

// ---------------------------------------------------------------------------------------------------------------------
// 3) „sve troje“, X13 (PK8, N9, S9), ostali tekstovi
// ---------------------------------------------------------------------------------------------------------------------
await sesija(1280, 800, false, async (page) => {
  await otvoriRutu(page, '/ana/lanac', { poz: { korak: 6, n: 0, grana: 'lanac' } })
  const t = await page.evaluate(() => document.querySelector('main').innerText)
  proveri('V2: X13 kaže „sve troje“ i nikad „svi troje“ ni „sva trojica“', /sve troje/.test(t) && !/svi troje|sva trojica/i.test(t), t.slice(0, 300))
  proveri('S9: X13 ima rečenicu o pravima potrošača kao u X2', /Prava potrošača ne važe\. Reklamacija i povraćaj se ne primenjuju kad je druga strana građanin, a ne trgovac\./.test(t))
  await klikniTekst(page, 'main button', 'Odbij')
  await sleep(250)
  const dijalog = await page.evaluate(() => document.querySelector('[role=dialog]')?.innerText ?? '')
  proveri('N9: „Odbij“ otvara dijalog „Lanac otkazan“ sa ishodom i dugmetom „Vrati“', /Lanac otkazan/.test(dijalog) && /sve troje prihvataju/.test(dijalog) && /Vrati/.test(dijalog), dijalog)
  await snimak(page, 'n9-odbij-dijalog')
  await klikniTekst(page, '[role=dialog] button', 'Vrati')
  await sleep(200)
  proveri('N9: „Vrati“ zatvara dijalog, priča se ne pomera', (await page.evaluate(() => !document.querySelector('[role=dialog]'))) && (await stanjeIzSesije(page))?.poz?.n === 0)
  // PK8: poruka pri prihvatanju lanca po uglu
  await klikniTekst(page, 'main button', 'Prihvati lanac')
  await sleep(300)
  const toastAna = await page.evaluate(() => document.querySelector('[data-toast]')?.textContent ?? '')
  proveri('PK8: Ana vidi „Marko i Jovana su prihvatili“', /Marko i Jovana su prihvatili/.test(toastAna), toastAna)
  await page.waitForFunction(() => /Lanac prihvaćen/.test(document.querySelector('main')?.innerText ?? ''), { timeout: 5000 }).catch(() => {})
  const x13 = await page.evaluate(() => document.querySelector('main').innerText)
  proveri('X13: posle sekvence piše „Lanac prihvaćen — sve troje“', /Lanac prihvaćen\s*—\s*sve troje/.test(x13), x13.slice(-300))
})
await sesija(1280, 800, false, async (page) => {
  await otvoriRutu(page, '/marko/lanac', { poz: { korak: 6, n: 0, grana: 'lanac' } })
  await klikniTekst(page, 'main button', 'Prihvati lanac')
  await sleep(300)
  const toastMarko = await page.evaluate(() => document.querySelector('[data-toast]')?.textContent ?? '')
  proveri('PK8: Marko vidi „Ana i Jovana su prihvatile“', /Ana i Jovana su prihvatile/.test(toastMarko), toastMarko)
})

// ---------------------------------------------------------------------------------------------------------------------
// 4) PK11 (Uđi u demo usred priče), PK15 (Restart vraća Roba), T2-stub, S8, Nema te stranice
// ---------------------------------------------------------------------------------------------------------------------
await sesija(1280, 800, false, async (page) => {
  await otvoriRutu(page, '/ulaz', { poz: { korak: 1, n: 0, grana: 'lanac' } })
  await klikniTekst(page, 'main button', 'Uđi u demo')
  await sleep(300)
  proveri('PK11: prvi ulaz je bez potvrde (otvara se R2)', (await page.evaluate(() => location.hash)).includes('/nalog/korak-1') && !(await page.evaluate(() => !!document.querySelector('[role=dialog]'))))
  await otvoriRutu(page, '/ulaz', { poz: { korak: 5, n: 0, grana: 'lanac' }, saglasnosti: { r3_uslovi: true } })
  await klikniTekst(page, 'main button', 'Uđi u demo')
  await sleep(300)
  const dij = await page.evaluate(() => document.querySelector('[role=dialog]')?.innerText ?? '')
  proveri('PK11: usred priče „Uđi u demo“ traži potvrdu', /Početi demo iz početka\?/.test(dij), dij)
  proveri('PK11: dok nema potvrde priča se ne menja', (await stanjeIzSesije(page))?.poz?.korak === 5)
  await klikniTekst(page, '[role=dialog] button', 'Odustani')
  await sleep(200)
  proveri('PK11: „Odustani“ ne menja ništa', (await stanjeIzSesije(page))?.poz?.korak === 5)
  await klikniTekst(page, 'main button', 'Uđi u demo')
  await sleep(200)
  await klikniTekst(page, '[role=dialog] button', 'Da, počni iz početka')
  await sleep(400)
  const st = await stanjeIzSesije(page)
  proveri('PK11: posle potvrde priča je na koraku 1 i kvačice su obrisane', st?.poz?.korak === 1 && st?.poz?.n === 0 && Object.keys(st?.saglasnosti ?? {}).length === 0, JSON.stringify([st?.poz, st?.saglasnosti]))
})
await sesija(1440, 900, false, async (page) => {
  await otvoriRutu(page, '/ana/pocetna', { poz: { korak: 3, n: 0, grana: 'lanac' } })
  await klikniTekst(page, '.prekidac-vrste button[aria-label="Sledeća vrsta"]', '')
  await sleep(200)
  const pre = await page.evaluate(() => document.querySelector('[data-vrsta-stuba]')?.textContent)
  await klikniTekst(page, '[data-traka-price] button', 'Restart demo')
  await sleep(200)
  await klikniTekst(page, '[role=dialog] button', 'Da')
  await sleep(400)
  await page.goto(BASE + '?r=pk15#/ana/pocetna', { waitUntil: 'networkidle0' })
  await sleep(300)
  const posle = await page.evaluate(() => document.querySelector('[data-vrsta-stuba]')?.textContent)
  proveri('PK15: prekidač je bio „Usluge“, a posle Restarta je „Roba“', pre === 'Usluge' && posle === 'Roba', `${pre} → ${posle}`)
  proveri('PK15: Restart vraća priču na korak 1', (await stanjeIzSesije(page))?.poz?.korak === 1)
})
await sesija(1280, 800, false, async (page) => {
  // T2-stub: Prodavnica i Moderacija imaju meni ugla umesto kategorija, javni ekrani zadržavaju stub
  const meni = async (ruta, ocekivano, naziv) => {
    await otvoriRutu(page, ruta, { poz: { korak: 9, n: 6, grana: 'lanac' } })
    const d = await page.evaluate(() => ({ meni: document.querySelector('[data-meni-ugla]')?.innerText.split('\n').map((x) => x.trim()).filter(Boolean), kategorije: !!document.querySelector('.prekidac-vrste') }))
    proveri(`T2-stub: ${naziv} (${ruta}) ima meni ${JSON.stringify(ocekivano)} i nema kategorije`, JSON.stringify(d.meni) === JSON.stringify(ocekivano) && !d.kategorije, JSON.stringify(d))
  }
  const PRODAVNICA = ['Pregled', 'Moji oglasi', 'Profil firme', 'Rezultati', 'Akcije', 'Reklame', 'Pretplata']
  await meni('/prodavnica/tabla', PRODAVNICA, 'F3')
  await meni('/prodavnica/poslovni/rezultati', PRODAVNICA, 'F6')
  await meni('/prodavnica/akcije', PRODAVNICA, 'A4')
  await meni('/prodavnica/akcija/staro-za-novo/prijave', PRODAVNICA, 'A6')
  await meni('/moderacija/moderacija', ['Prijave', 'Odluke', 'Pravila'], 'V1')
  await otvoriRutu(page, '/prodavnica/akcija/staro-za-novo', { poz: { korak: 9, n: 6, grana: 'lanac' } })
  proveri('T2-stub: javna stranica akcije (A1) zadržava stub kategorija', await page.evaluate(() => !!document.querySelector('.prekidac-vrste') && !document.querySelector('[data-meni-ugla]')))
  await otvoriRutu(page, '/ana/pocetna')
  proveri('T2-stub: Početna (P1) zadržava stub kategorija', await page.evaluate(() => !!document.querySelector('.prekidac-vrste') && !document.querySelector('[data-meni-ugla]')))
  await otvoriRutu(page, '/prodavnica/tabla', { poz: { korak: 9, n: 6, grana: 'lanac' } })
  await snimak(page, 't2-stub-prodavnica-meni')
  // N3: tekst o levom stubu samo na računaru
  await otvoriRutu(page, '/ana/pocetna')
  proveri('N3: na računaru tekst o prekidaču u levom stubu se vidi', await page.evaluate(() => /levom stubu/.test(document.querySelector('[data-prikaz-vrste]').innerText)))
})
await sesija(390, 844, true, async (page) => {
  await otvoriRutu(page, '/ana/pocetna')
  proveri('N3: na telefonu tekst o levom stubu se NE vidi', await page.evaluate(() => !/levom stubu/.test(document.querySelector('[data-prikaz-vrste]').innerText)))
})
await sesija(1280, 800, false, async (page) => {
  // S8: ekran koji radi drugi ugao nikad nije prazan
  const poruka = async (ruta, ko, naslov) => {
    await otvoriRutu(page, ruta, { poz: { korak: 7, n: 6, grana: 'lanac' } })
    const d = await page.evaluate(() => ({ tekst: document.querySelector('main').innerText, ovo: document.querySelector('[data-ovo-radi]')?.getAttribute('data-ovo-radi') }))
    proveri(`S8: ${naslov} za pogrešan ugao kaže „Ovo radi ${ko}“ sa „Gledaj kao ${ko}“`, d.ovo === ko.toLowerCase() && new RegExp(`Ovo radi ${ko} — Gledaj kao ${ko}`).test(d.tekst) && d.tekst.trim().length > 60, d.tekst)
  }
  await poruka('/marko/dostava', 'Ana', 'D1')
  await poruka('/marko/dostava/pregled', 'Ana', 'D2')
  await poruka('/prodavnica/dostava/prati/SW-DEMO-0001', 'Ana', 'D3')
  await poruka('/ana/primljene/markov-bicikl', 'Marko', 'X4')
  await klikniTekst(page, 'main button', 'Gledaj kao Marko')
  await sleep(400)
  proveri('S8: „Gledaj kao Marko“ prebacuje ugao i ostaje na ekranu sa ponudama', (await page.evaluate(() => location.hash)).startsWith('#/marko/primljene/') && (await page.evaluate(() => /Primljene ponude/.test(document.querySelector('main h1')?.textContent ?? ''))))
})
await sesija(1280, 800, false, async (page) => {
  // Nema te stranice
  for (const ruta of ['/ana/ne-postoji', '/ne/postoji/uopste', '/marko/oglas', '/xyz']) {
    await otvoriRutu(page, ruta)
    const d = await page.evaluate(() => ({ h1: document.querySelector('main h1')?.textContent, dugme: [...document.querySelectorAll('main a')].map((a) => a.textContent.trim()), duzina: document.body.innerText.trim().length }))
    const nepoznata = ruta !== '/marko/oglas' // „/marko/oglas“ ima samo 2 segmenta, ali „oglas/:oglas“ traži 3
    proveri(`Nema te stranice: ${ruta}`, nepoznata ? d.h1 === 'Nema te stranice' && d.dugme.includes('Nazad na početnu') && d.duzina > 40 : d.duzina > 40, JSON.stringify(d))
  }
  await otvoriRutu(page, '/ana/ne-postoji')
  await klikniTekst(page, 'main a', 'Nazad na početnu')
  await sleep(300)
  proveri('Nema te stranice: „Nazad na početnu“ vodi na početnu ugla', (await page.evaluate(() => location.hash)) === '#/ana/pocetna')
  await snimak(page, 'nema-te-stranice')
})

// ---------------------------------------------------------------------------------------------------------------------
// 5) TRAKA PRIČE: visina ista, tekst ceo (1024–1440), pa telefon 320×568
// ---------------------------------------------------------------------------------------------------------------------
const UGLOVI = ['ana', 'marko', 'prodavnica', 'moderacija']
for (const sirina of [1024, 1100, 1280, 1366, 1440]) {
  await sesija(sirina, 800, false, async (page) => {
    const visine = new Set()
    const odsecenih = []
    let stanja = 0
    for (const ugao of UGLOVI)
      for (const grana of ['lanac', 'poeni']) {
        await otvoriRutu(page, `/${ugao}/${ugao === 'prodavnica' ? 'tabla' : ugao === 'moderacija' ? 'moderacija' : 'pocetna'}`, { poz: grana === 'poeni' ? { korak: 6, n: 0, grana: 'poeni' } : { korak: 1, n: 0, grana: 'lanac' } })
        for (let i = 0; i < 90; i++) {
          const d = await page.evaluate(() => {
            const traka = document.querySelector('[data-traka-price]')
            const p = document.querySelector('[data-tekst-price]')
            const sledece = document.querySelector('.pr-nav[aria-label="Dalje"]')
            return {
              visina: Math.round(traka.getBoundingClientRect().height * 10) / 10,
              ceo: p ? p.scrollHeight <= p.clientHeight + 1 && p.scrollWidth <= p.clientWidth + 1 : true,
              tekst: p?.textContent ?? '',
              naslov: document.querySelector('[data-naslov-koraka]')?.textContent ?? '',
              kraj: !!sledece?.disabled,
              pomeraj: document.documentElement.scrollWidth > innerWidth + 1,
            }
          })
          stanja++
          visine.add(d.visina)
          if (!d.ceo) odsecenih.push(`${ugao}/${grana} ${d.naslov}: ${d.tekst}`)
          if (d.pomeraj) odsecenih.push(`${ugao}/${grana} ${d.naslov}: strana se skroluje vodoravno`)
          if (d.kraj) break
          await page.evaluate(() => document.querySelector('.pr-nav[aria-label="Dalje"]').click())
          await sleep(25)
        }
      }
    proveri(`traka ${sirina}: visina je ista u svih ${stanja} stanja (uglovi × grane × koraci)`, visine.size === 1, [...visine].join(', '))
    proveri(`traka ${sirina}: opis priče je ceo (nije odsečen) u svim stanjima`, odsecenih.length === 0, odsecenih.slice(0, 4).join(' | '))
  })
}

const BRZA_STANJA = [
  { korak: 1, n: 0, grana: 'lanac' },
  { korak: 4, n: 2, grana: 'lanac' },
  { korak: 6, n: 0, grana: 'poeni' },
  { korak: 8, n: 3, grana: 'lanac' },
  { korak: 9, n: 6, grana: 'lanac' },
]
const GRADEVI = m.rute.RUTE.filter((r) => r.izgradjen)
const pocetniEkrani = { ana: 'P1', marko: 'P1', prodavnica: 'F3', moderacija: 'V1' }
await sesija(320, 568, true, async (page) => {
  const problemi320 = []
  let provereno = 0
  for (const ruta of GRADEVI)
    for (const ugao of ruta.uglovi)
      for (const stanje of [BRZA_STANJA[0], BRZA_STANJA[4]]) {
        const put = m.rute.link(ruta.id, ugao)
        await otvoriRutu(page, put, { poz: stanje })
        const d = await page.evaluate(() => {
          const out = { vodoravno: document.documentElement.scrollWidth > innerWidth + 1, krivci: [], traka: null }
          if (out.vodoravno)
            for (const e of document.querySelectorAll('main *')) {
              const r = e.getBoundingClientRect()
              if (r.right > innerWidth + 1 && r.width > 0) out.krivci.push(`${e.tagName.toLowerCase()}.${String(e.className).slice(0, 30)} (${Math.round(r.right)})`)
              if (out.krivci.length >= 3) break
            }
          const dock = document.querySelector('[data-traka-telefon]')
          if (dock) {
            const dugmad = [...dock.querySelectorAll('.pr-slot button, .pr-pill button')]
            out.traka = dugmad.map((b) => {
              const r = b.getBoundingClientRect()
              return { tekst: b.textContent.trim(), unutra: r.left >= -0.5 && r.right <= innerWidth + 0.5 && r.top >= -0.5 && r.bottom <= innerHeight + 0.5, ceo: b.scrollWidth <= b.clientWidth + 1 && b.scrollHeight <= b.clientHeight + 1 }
            })
            const slot = dock.querySelector('.pr-slot button')
            out.glavno = slot ? slot.textContent.trim() : null
          }
          return out
        })
        provereno++
        const kontekst = `${ruta.id}/${ugao}/${stanje.korak}.${stanje.n}`
        if (d.vodoravno) problemi320.push(`vodoravni skrol ${kontekst}: ${d.krivci.join('; ')}`)
        if (d.traka) {
          if (!d.traka.every((b) => b.unutra && b.ceo)) problemi320.push(`traka ${kontekst}: ${JSON.stringify(d.traka.filter((b) => !b.unutra || !b.ceo))}`)
          if (!/^(Dalje|Pokaži mi|Nazad na priču|Kraj priče)/.test(d.glavno ?? '')) problemi320.push(`glavno dugme ${kontekst}: ${d.glavno}`)
        }
      }
  await otvoriRutu(page, '/ana/lanac', { poz: { korak: 6, n: 0, grana: 'lanac' } })
  await snimak(page, 'telefon-320x568-x13-traka')
  await otvoriRutu(page, '/ana/pocetna', { poz: { korak: 3, n: 0, grana: 'lanac' } })
  await snimak(page, 'telefon-320x568-p1-traka')
  proveri(`telefon 320×568: ${provereno} ekrana (svi izgrađeni × uglovi × 2 stanja) bez vodoravnog skrola i sa celim „Dalje / Pokaži mi“`, problemi320.length === 0, problemi320.slice(0, 5).join(' | '))
})

// ---------------------------------------------------------------------------------------------------------------------
// 6) MAPA (S6), tabovi (N5), X8/X11 (S3, S7), D1 (S11), R2 (S1), U3 (PK4), O2 (N8), Z3/D2 (S9) na računaru i telefonu
// ---------------------------------------------------------------------------------------------------------------------
for (const [sirina, visina, telefon, ime] of [[1440, 900, false, 'racunar-1440'], [390, 844, true, 'telefon-390'], [320, 568, true, 'telefon-320']]) {
  await sesija(sirina, visina, telefon, async (page) => {
    await otvoriRutu(page, '/ana/mapa', { poz: { korak: 3, n: 0, grana: 'lanac' } })
    const mp = await page.evaluate(() => {
      const svg = document.querySelector('.mapa-svg')
      const skala = svg.clientWidth / svg.viewBox.baseVal.width
      const natpisi = [...document.querySelectorAll('.mapa-natpis')].map((t) => ({ id: t.dataset.natpis, px: parseFloat(t.getAttribute('font-size')) * skala, naziv: t.textContent, r: t.getBoundingClientRect() }))
      const krugovi = [...document.querySelectorAll('[data-krug]')].map((c) => c.getBoundingClientRect())
      const preseca = (a, b) => a.left < b.right - 1 && a.right > b.left + 1 && a.top < b.bottom - 1 && a.bottom > b.top + 1
      const naKrugu = natpisi.filter((n) => krugovi.some((k) => preseca(n.r, k))).map((n) => n.naziv)
      const naSvomKrugu = natpisi.filter((n) => [...document.querySelectorAll(`[data-krug="opstina:${n.id}"]`)].some((k) => preseca(n.r, k.getBoundingClientRect()))).map((n) => n.naziv)
      const jedanNaDrugom = []
      for (let i = 0; i < natpisi.length; i++) for (let j = i + 1; j < natpisi.length; j++) if (preseca(natpisi[i].r, natpisi[j].r)) jedanNaDrugom.push(natpisi[i].naziv + '/' + natpisi[j].naziv)
      return { n: natpisi.length, najmanje: Math.min(...natpisi.map((n) => n.px)), naKrugu, naSvomKrugu, jedanNaDrugom }
    })
    // D2: na telefonu se natpisi gustog središta (5) ne crtaju; ime izabranog područja piše ispod mape
    proveri(`mapa ${ime}: ${telefon ? '6 natpisa opština (5 iz gustog središta se ne crta)' : '11 natpisa opština'}, svaki ≥ 11 px (najmanji ${mp.najmanje.toFixed(1)} px)`, mp.n === (telefon ? 6 : 11) && mp.najmanje >= 10.95, JSON.stringify(mp))
    proveri(`mapa ${ime}: natpis opštine ne leži ni preko jednog kruga`, mp.naKrugu.length === 0, JSON.stringify(mp.naKrugu))
    proveri(`mapa ${ime}: natpisi se ne preklapaju međusobno`, mp.jedanNaDrugom.length === 0, JSON.stringify(mp.jedanNaDrugom))
    if (telefon) {
      await page.evaluate(() => document.querySelector('[data-meta="opstina:stg"]')?.dispatchEvent(new MouseEvent('click', { bubbles: true })))
      await sleep(150)
      proveri(`mapa ${ime}: izabrano područje gustog središta ima ime ispod mape`, await page.evaluate(() => /Stari grad/.test(document.querySelector('[data-mapa-izabrano-ime]')?.textContent ?? '')))
    }
    await snimak(page, `mapa-${ime}`)
    await otvoriRutu(page, '/ana/oglas/markov-bicikl', { poz: { korak: 3, n: 0, grana: 'lanac' } })
    proveri(`O1 ${ime}: mala mapa nema imena opština`, await page.evaluate(() => !!document.querySelector('.mala-mapa .mapa-svg') && document.querySelectorAll('.mala-mapa .mapa-natpis').length === 0))
  })
}
await sesija(390, 844, true, async (page) => {
  await otvoriRutu(page, '/ana/moje-razmene', { poz: { korak: 6, n: 3, grana: 'lanac' } })
  const t = await page.evaluate(() => {
    const el = document.querySelector('.tabovi')
    return { skrol: el.scrollWidth > el.clientWidth, pozadina: getComputedStyle(el).backgroundImage }
  })
  proveri('N5: tabovi se skroluju na telefonu i imaju senku na ivici', t.skrol && /radial-gradient/.test(t.pozadina), JSON.stringify(t))
  await snimak(page, 'n5-tabovi-telefon')
})
await sesija(1280, 800, false, async (page) => {
  await otvoriRutu(page, '/ana/nalog/korak-1')
  const r2 = await page.evaluate(() => ({ t: document.querySelector('main').innerText, napomena: document.querySelectorAll('[data-popunjeno-demo]').length, poljeIznad: (() => { const n = document.querySelector('[data-popunjeno-demo]'); const g = n?.closest('.grupa-polja'); return !!n && n.getBoundingClientRect().bottom <= g.querySelector('.polje-prikaz').getBoundingClientRect().top })() }))
  proveri('S1: R2 ima e-poštu i maskiran demo broj „06x xxx xx00 (demo)“', /E-pošta/.test(r2.t) && /06x xxx xx00 \(demo\)/.test(r2.t), r2.t)
  proveri('N6: „Popunjeno za demo“ stoji jednom, iznad polja', r2.napomena === 1 && r2.poljeIznad, JSON.stringify(r2))
  await otvoriRutu(page, '/ana/nalog/korak-3', { poz: { korak: 1, n: 2, grana: 'lanac' } })
  proveri('S1: R4 i dalje kaže „Poslali smo kod na tvoj broj“', await page.evaluate(() => /Poslali smo kod na tvoj broj/.test(document.querySelector('main').innerText)))
  // D1 (S11)
  await otvoriRutu(page, '/ana/dostava', { poz: { korak: 7, n: 0, grana: 'lanac' } })
  const d1 = await page.evaluate(() => ({ t: document.querySelector('main').innerText, pilule: [...document.querySelectorAll('.pilula')].map((p) => ({ t: p.textContent.trim(), disabled: p.disabled, pressed: p.getAttribute('aria-pressed') })), termini: [...document.querySelectorAll('main select option')].map((o) => o.textContent) }))
  const velika = d1.pilule.find((p) => p.t === 'Velika')
  const mala = d1.pilule.find((p) => /^Mala/.test(p.t))
  proveri('S11: D1 za bicikl je zaključan na „Velika“ (590 din)', velika?.pressed === 'true' && mala?.disabled === true && /590 din/.test(d1.t), JSON.stringify(d1.pilule))
  proveri('S11: termini „Prepodne“ i „Popodne“ su pisani velikim slovom', JSON.stringify(d1.termini) === JSON.stringify(['Prepodne', 'Popodne']), JSON.stringify(d1.termini))
  await snimak(page, 's11-d1-zakljucano')
  await otvoriRutu(page, '/ana/dostava/pregled', { poz: { korak: 7, n: 2, grana: 'lanac' } })
  proveri('S9: D2 kaže da naknadu prima platforma, a ne drugi korisnik', await page.evaluate(() => /Naknadu prima platforma za uslugu kurirske službe; ne ide drugom korisniku\./.test(document.querySelector('main').innerText)))
  await otvoriRutu(page, '/ana/placanje/dostava/SW-DEMO-0001', { poz: { korak: 7, n: 4, grana: 'lanac' } })
  proveri('S9: Z3 za dostavu: pružalac SWAPIT d.o.o. (demo), dostavu izvršava Dunavski kurir', await page.evaluate(() => /Pružalac usluge: SWAPIT d\.o\.o\. \(demo\), dostavu izvršava Dunavski kurir \(izmišljen\)/.test(document.querySelector('main').innerText)))
  await otvoriRutu(page, '/ana/placanje/akcija/SW-AKC-0001', { poz: { korak: 9, n: 1, grana: 'lanac' } })
  proveri('S9: Z3 za akciju ne pominje kurira', await page.evaluate(() => !/Dunavski kurir/.test(document.querySelector('main').innerText)))
  // X8 (S7), X11 (S3)
  await otvoriRutu(page, '/ana/dogovor/lanac', { poz: { korak: 7, n: 0, grana: 'lanac' } })
  const x8a = await page.evaluate(() => document.querySelector('main').innerText)
  proveri('S7: X8 kaže „svi“ (ne „oboje“) kad su troje', /ako se svi slažu/.test(x8a) && !/oboje/.test(x8a), x8a.slice(0, 400))
  await page.evaluate(() => document.querySelector('input[type=checkbox], [role=switch]')?.click())
  await sleep(200)
  const x8b = await page.evaluate(() => document.querySelector('main').innerText)
  proveri('S7: kad se telefon otkrije, piše „Telefon: Marko“ i „Telefon: Jovana“ po osobi', /Telefon: Marko/.test(x8b) && /Telefon: Jovana/.test(x8b) && !/Telefon: Ana/.test(x8b), x8b.slice(0, 500))
  await otvoriRutu(page, '/ana/razmena/lanac/ocena', { poz: { korak: 8, n: 4, grana: 'lanac' } })
  const x11 = await page.evaluate(() => ({ t: document.querySelector('main').innerText, onem: [...document.querySelectorAll('[role=radio]')].map((b) => [b.textContent.trim(), b.disabled]) }))
  proveri('S3: u vođenoj priči ocena je zaključana na 5 i tekst to objašnjava', x11.onem.every(([n, d]) => (n === '5') === !d) && /zaključana na 5/.test(x11.t), JSON.stringify(x11.onem))
  await otvoriRutu(page, '/ana/razmena/lanac/ocena', { poz: { korak: 8, n: 4, grana: 'lanac' }, rezim: 'slobodno' })
  await klikniTekst(page, '[role=radio]', '3')
  await sleep(150)
  const x11s = await page.evaluate(() => ({ polje: document.querySelector('[data-prikazno-polje]').textContent, dugme: (() => { const b = document.querySelector('[data-radnja] button'); return b?.disabled || b?.getAttribute('aria-disabled') === 'true' })(), t: document.querySelector('main').innerText }))
  proveri('S3: u slobodnom režimu tekst komentara zavisi od izabrane ocene', /Stvar je u redu, ali opis nije bio sasvim tačan/.test(x11s.polje) && x11s.dugme === true, JSON.stringify(x11s.polje))
  // U3 (PK4)
  await otvoriRutu(page, '/o-demou')
  const u3 = await page.evaluate(() => ({ h2: [...document.querySelectorAll('main h2')].map((h) => h.textContent), t: document.querySelector('[data-izvori-slika]')?.innerText ?? '' }))
  proveri('PK4: U3 ima odeljak „Izvori slika“ sa autorima i licencama', u3.h2.includes('Izvori slika') && /Autor: .+ · Delo: .+ · Licenca: CC/.test(u3.t) && /Creative Commons Imenovanje–Deliti pod istim uslovima/.test(u3.t), u3.t.slice(0, 300))
  await otvoriRutu(page, '/ana/oglas/smedji-sto', { poz: { korak: 3, n: 0, grana: 'lanac' } })
  const nav = await page.evaluate(() => document.querySelector('[data-navodjenje]')?.textContent ?? '')
  proveri('PK4: O1 ispod slike navodi autora i pun naziv licence', /Foto: .+ · .+ · CC BY-SA 4\.0 \(Creative Commons Imenovanje–Deliti pod istim uslovima 4\.0\) · Wikimedia Commons/.test(nav), nav)
  // N8 (O2): Nekretnine/Vozila → obaveštenje; stanja
  await otvoriRutu(page, '/ana/novi-oglas/1', { poz: { korak: 2, n: 0, grana: 'lanac' } })
  await page.evaluate(() => {
    const s = document.querySelector('main select')
    s.value = [...s.options].find((o) => /^Nekretnine/.test(o.textContent)).value
    s.dispatchEvent(new Event('change', { bubbles: true }))
  })
  await sleep(200)
  proveri('N8: izbor „Nekretnine“ u O2 prikazuje obaveštenje o notaru i MUP-u', await page.evaluate(() => /kod notara, odnosno u MUP-u/.test(document.querySelector('main').innerText)))
  await otvoriRutu(page, '/ana/novi-oglas/2', { poz: { korak: 2, n: 1, grana: 'lanac' } })
  proveri('N8: stanja u O3 su Novo, Kao novo, Korišćeno, Za opravku', await page.evaluate(() => JSON.stringify([...document.querySelectorAll('[aria-label="Stanje"] .pilula')].map((p) => p.textContent.trim())) === JSON.stringify(['Novo', 'Kao novo', 'Korišćeno', 'Za opravku'])))
})

// ---------------------------------------------------------------------------------------------------------------------
// 7) Slike ključnih ispravki: X13, tabla akcija (A4 sa 6 / 3 / 18.000 din), V1 (moderacija na čekanju 3)
// ---------------------------------------------------------------------------------------------------------------------
await sesija(1280, 800, false, async (page) => {
  await otvoriRutu(page, '/prodavnica/akcije', { poz: { korak: 9, n: 5, grana: 'lanac' } })
  const pre = await page.evaluate(() => document.querySelector('main').innerText)
  proveri('T2-2: A4 pre „Primi“: primljeno 5, čeka procenu 4, izdati popusti 15.000 din', /Primljeno\s*5/.test(pre.replace(/\n/g, ' ')) && /Čeka procenu\s*4/.test(pre.replace(/\n/g, ' ')) && /15\.000 din/.test(pre), pre.slice(0, 400))
  await klikniTekst(page, 'main a, main button', 'Prijave na akciji')
  await sleep(300)
  await klikniTekst(page, 'main button', 'Primi')
  await sleep(300)
  await page.goto(BASE + '?r=a4#/prodavnica/akcije', { waitUntil: 'networkidle0' })
  await sleep(300)
  const posle = await page.evaluate(() => document.querySelector('main').innerText.replace(/\n/g, ' '))
  proveri('T2-2: A4 posle „Primi“: primljeno 6, čeka procenu 3, izdati popusti 18.000 din', /Primljeno\s*6/.test(posle) && /Čeka procenu\s*3/.test(posle) && /18\.000 din/.test(posle), posle.slice(0, 400))
  await snimak(page, 'a4-tabla-akcija-posle-primi')
  await otvoriRutu(page, '/moderacija/moderacija', { poz: { korak: 5, n: 0, grana: 'lanac' } })
  const v1 = await page.evaluate(() => document.querySelector('main').innerText.replace(/\n/g, ' '))
  proveri('PK13: V1 u koraku 5 (pre odluke) ima 3 prijave na čekanju', /Na čekanju\s*3/.test(v1), v1.slice(0, 300))
  await snimak(page, 'v1-moderacija-na-cekanju-3')
  await otvoriRutu(page, '/moderacija/moderacija', { poz: { korak: 5, n: 5, grana: 'lanac' } })
  proveri('PK13: V1 posle odluke (5.v3) ima 2 prijave na čekanju', await page.evaluate(() => /Na čekanju\s*2/.test(document.querySelector('main').innerText.replace(/\n/g, ' '))))
  await otvoriRutu(page, '/ana/lanac', { poz: { korak: 6, n: 3, grana: 'lanac' } })
  await sleep(2600)
  await snimak(page, 'x13-lanac-prihvacen')
})

// ---------------------------------------------------------------------------------------------------------------------
// DORADA TALASA 2 (talas 3): L-3 male mape, L-4 pilula poena, V-3 plaćanje firme, N-4 jedan izvor zabranjenih stvari, N-8 profil firme
// ---------------------------------------------------------------------------------------------------------------------
await sesija(1280, 800, false, async (page) => {
  const glavni = () => page.evaluate(() => document.querySelector('main')?.innerText ?? '')
  const slobodno = { rezim: 'slobodno', poz: { korak: 1, n: 3, grana: 'lanac' } }
  await otvoriRutu(page, '/ana/oglas/markov-bicikl', slobodno)
  proveri('L-3: mala mapa na O1 nosi natpis „Ilustrativna mapa“', /Ilustrativna mapa/.test(await glavni()))
  await otvoriRutu(page, '/ana/poeni', slobodno)
  proveri('L-4: pilula poena u zaglavlju ima opis „model u proveri“ (aria-label)', await page.evaluate(() => [...document.querySelectorAll('header .poeni-pilula, header [aria-label]')].some((e) => /model u proveri/.test(e.getAttribute('aria-label') || e.title || ''))))
  proveri('L-4: na W1 stoji „model u proveri“', /model u proveri/.test(await glavni()))
  for (const [ruta, opis] of [['/ana/pravila', 'S2'], ['/moderacija/moderacija', 'V1'], ['/ana/prijavi/romani-ive-andrica-komplet', 'O5']]) {
    await otvoriRutu(page, ruta, slobodno)
    proveri(`N-4: ${opis} nosi isti spisak zabranjenih stvari (prerađena hrana, meso, mlečni proizvodi i alkohol)`, /Prerađena hrana iz domaće radinosti, meso, mlečni proizvodi i alkohol/.test(await glavni()))
  }
  await otvoriRutu(page, '/prodavnica/firma/zupcanik', slobodno)
  proveri('N-8: na sopstvenom profilu firme nema dugmeta „Poruka“', !(await page.evaluate(() => [...document.querySelectorAll('main button, main a')].some((e) => /^Poruka/.test(e.textContent.trim())))))
  proveri('N-8: na sopstvenom profilu firme stoji „Uredi profil“', /Uredi profil/.test(await glavni()))
  await otvoriRutu(page, '/prodavnica/placanje/akcija/SW-PLT-0001', slobodno)
  const pl = await glavni()
  proveri('V-3: plaćanje firme ima poseban tekst bez potrošačkog prava na odustanak', /Plaćaš kao poslovni korisnik/.test(pl) && !/Pravo na odustanak|usluga počne odmah/.test(pl))
})

const ok = izvestaj('e2e-dorada',lista, [...new Set(svaProblemi)].filter((p) => !/Failed to load resource.*404/.test(p)), sviSpoljni)
await zatvori()
process.exit(ok ? 0 : 1)
