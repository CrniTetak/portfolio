// E2E slobodnih tokova u pravom pregledaču (nad `npm run preview`): krstarenje, Monte Karlo (samo Royal Suite ima pun tok), događaj iz M8 i paketi iz S8
// (iskreno završavaju na "Quote requested"), konsijerž (savetnik šalje ponudu u V5), transport (izabrana usluga), članstvo; tragovi u T5/T7/V5/B2;
// odbijanje ponude; Restart; gost ("Enter demo as…") i savetnik ("Switch to Traveler to try this", proverava se KLIKOM).
// Provere su stvarni uslovi (nema uvek-tačnih), a stanje se prati kroz sessionStorage i tekst na ekranu.
import { BASE, KLJUC, izvestaj, otvori, proveravac, sleep } from './_zajednicko.mjs'

const { lista, proveri } = proveravac()
const { browser, page, problemi, spoljni } = await otvori({ sirina: 1280, visina: 900 })
let brojac = 0
const tekst = () => page.evaluate(() => document.body.innerText)
const ekran = () => page.evaluate(() => document.querySelector('[data-ekran]')?.getAttribute('data-ekran') ?? null)
const stanje = () => page.evaluate((k) => JSON.parse(sessionStorage.getItem(k) ?? 'null'), KLJUC)
const hash = () => page.evaluate(() => location.hash)
const ucitaj = async (h, rezim = 'free', tokovi = undefined) => {
  await page.goto(BASE + '?r=0#/', { waitUntil: 'load' })
  await page.evaluate((k, r, t) => sessionStorage.setItem(k, JSON.stringify({ v: 1, poz: { korak: 1, n: 0, ishod: 'A' }, rezim: r, potvrda18: true, poruke: { slobodno: true }, ...(t ? { tokovi: t } : {}) })), KLJUC, rezim, tokovi ?? null)
  await page.goto(`${BASE}?r=${++brojac}#${h}`, { waitUntil: 'load' })
  await sleep(150)
}
// prelazak na drugi ekran BEZ brisanja stanja (sessionStorage ostaje), da se vidi da novi zahtev ne prepisuje stari
const idiNa = async (h) => {
  await page.goto(`${BASE}?r=${++brojac}#${h}`, { waitUntil: 'load' })
  await sleep(150)
}
const norm = (x) => x.replace(/\s+/g, ' ').trim()
async function klik(t, { sel = 'button, a', n = 0, pocekaj = 150 } = {}) {
  const rez = await page.evaluate(
    (t, sel, n) => {
      const re = t.re ? new RegExp(t.re) : null
      const sve = [...document.querySelectorAll(sel)].filter((e) => e.getClientRects().length > 0 && [e.textContent || '', e.getAttribute('aria-label') || ''].map((x) => x.replace(/\s+/g, ' ').trim()).some((x) => (re ? re.test(x) : x === t.s)))
      const el = sve[n]
      if (!el) return 'nema'
      if (el.disabled) return 'neaktivno'
      el.click()
      return 'ok'
    },
    t instanceof RegExp ? { re: t.source } : { s: t },
    sel,
    n,
  )
  if (rez !== 'ok') throw new Error(`Dugme ${t} nije kliknuto (${rez}) na ${await hash()}`)
  await sleep(pocekaj)
}
// dugme unutar kartice čiji tekst sadrži naziv (npr. "View details" u kartici paketa)
async function klikUKartici(naziv, dugme) {
  const rez = await page.evaluate(
    (naziv, dugme) => {
      const re = new RegExp(naziv)
      const dugmad = [...document.querySelectorAll('button')].filter((b) => b.getClientRects().length > 0 && b.textContent.replace(/\s+/g, ' ').trim() === dugme)
      for (const b of dugmad) {
        let p = b.parentElement
        for (let i = 0; i < 6 && p; i++, p = p.parentElement) {
          if (p.classList.contains('card') || p.tagName === 'LI') {
            if (re.test(p.textContent)) {
              b.click()
              return 'ok'
            }
            break
          }
        }
      }
      return 'nema'
    },
    naziv.source,
    dugme,
  )
  if (rez !== 'ok') throw new Error(`Dugme "${dugme}" u kartici ${naziv} nije kliknuto na ${await hash()}`)
  await sleep(150)
}
async function stikliraj(re) {
  const rez = await page.evaluate((src) => {
    const r = new RegExp(src)
    const l = [...document.querySelectorAll('label')].find((x) => x.getClientRects().length > 0 && r.test(x.textContent))
    if (!l) return 'nema'
    l.click()
    return 'ok'
  }, re.source)
  if (rez !== 'ok') throw new Error(`Kvačica ${re} nije nađena na ${await hash()}`)
  await sleep(60)
}
const ima = async (re) => re.test(await tekst())
const dugmeAktivno = (naziv) => page.evaluate((n) => { const b = [...document.querySelectorAll('button')].find((x) => x.getClientRects().length > 0 && x.textContent.replace(/\s+/g, ' ').trim().startsWith(n)); return b ? !b.disabled : null }, naziv)
const bezPolja = () => page.evaluate(() => !document.querySelector('input:not([type=checkbox]):not([type=radio]), textarea, form'))
// svi redovi/kartice sa referencom (AA1-R-xxxx) u T5
const refovi = async () => page.evaluate(() => [...new Set((document.body.innerText.match(/AA1-[A-Z]+-[A-Z0-9-]+/g) ?? []))])

try {
  // ---- krstarenje (K1–K6) kao putnik, klikom kroz meni
  await ucitaj('/traveler/home')
  await klik('Group travel', { sel: 'nav[aria-label="Main"] button' })
  await klik('Cruises', { sel: '[data-meni-lista] button' })
  proveri('K1 se stiže iz menija', (await ekran()) === 'K1')
  await klik('Book Your VIP Cruise')
  proveri('K1 → K2', (await ekran()) === 'K2')
  await klik('Find cruise')
  proveri('K2 → K3, 4 paketa, naslov "Cruise & Entertainment Packages"', (await ekran()) === 'K3' && (await ima(/Cruise & Entertainment Packages/)) && (await page.evaluate(() => [...document.querySelectorAll('button')].filter((b) => b.textContent.trim() === 'View details').length)) === 4)
  proveri('K3: nema starih naziva koji reklamiraju igru', !(await ima(/Jackpot|High-Roller|Blackjack & /)))
  await klikUKartici(/Iberian Peninsula/, 'View details')
  proveri('K3: Iberian vodi u K4', (await ekran()) === 'K4')
  proveri('K4: itinerer realan (5 dana / 4 noći, kazino zatvoren u luci, nema šestog dana)', (await ima(/5 days \/ 4 nights/)) && (await ima(/casino is closed in port/i)) && !(await ima(/Day 6/)))
  await klik('Book now')
  proveri('K4 → K5', (await ekran()) === 'K5')
  proveri('K5: nema polja za kucanje ni reči "Secure"', (await bezPolja()) && !/Secure/.test(await tekst()))
  proveri('K5: potvrde NISU unapred štiklirane, dugme neaktivno i kaže šta fali', (await dugmeAktivno('Confirm booking')) === false && (await ima(/Tick both confirmations|Confirm that|Tick the/)))
  await stikliraj(/terms and conditions/)
  await stikliraj(/18 or over/)
  proveri('K5: posle obe kvačice dugme je aktivno', (await dugmeAktivno('Confirm booking')) === true)
  await klik(/^Confirm booking & pay EUR/)
  proveri('K5 → K6 potvrda sa iznosom, kabinom i datumom', (await ekran()) === 'K6' && (await ima(/Your booking is confirmed!/)) && (await ima(/AA1-DEMO-IB-0001/)) && (await ima(/EUR 9,190/)) && (await ima(/Balcony/)) && (await ima(/26 Apr 2027/)))
  proveri('K6: red organizatora "Not an offer"', await ima(/Not an offer/))
  await klik('Download confirmation')
  proveri('K6: preuzimanje daje toast "Demo — no file is generated"', await ima(/Demo — no file is generated/))
  await klik('Manage my booking')
  proveri('K6 → T7: krstarenje Confirmed', (await ekran()) === 'T7' && (await ima(/Confirmed/)))

  // ---- Monte Karlo Royal Suite (M1–M7) - PUN tok; posle toga krstarenje NE sme da bude prepisano
  await idiNa('/traveler/monte-carlo')
  await klikUKartici(/Royal Suite Experience/, 'View details')
  proveri('M1 → M2 (Royal Suite)', (await ekran()) === 'M2')
  await klik('Request a quote')
  proveri('M2 → M3', (await ekran()) === 'M3')
  proveri('M3: potvrde nisu štiklirane, dugme neaktivno', (await dugmeAktivno('Request a quote')) === false)
  await stikliraj(/18 or over/)
  await stikliraj(/contacts me/)
  await klik('Request a quote', { sel: 'button', n: 0 })
  proveri('M3 → M4 "Request received"', (await ekran()) === 'M4' && (await ima(/Request received/)) && (await ima(/AA1-R-0301/)))
  await klik('Demo shortcut: advisor replies now')
  proveri('M4 → M5 ponuda', (await ekran()) === 'M5' && (await ima(/Quote validity/)) && (await ima(/EUR 50,000/)))
  await klik('Accept quote and pay deposit')
  proveri('M5 → M6 avans', (await ekran()) === 'M6')
  await klik('I have paid')
  proveri('M6 → M7 potvrda sa datumima Royal Suite', (await ekran()) === 'M7' && (await ima(/AA1-R-0301/)) && (await ima(/Royal Suite Experience/)))
  proveri('M7: nema "Confirm and pay", ima "Not an offer"', !(await ima(/Confirm and pay/)) && (await ima(/Not an offer/)))
  const posleRoyal = await stanje()
  proveri('posle Royal toka: krstarenje placeno, Monte Karlo potvrdjen', posleRoyal.tokovi.krstarenje === 'placeno' && posleRoyal.tokovi.monteKarlo === 'potvrdjeno')

  // ---- događaj iz M8 do kraja: NE vodi u ponudu Royal Suite, ne prepisuje potvrđeni Royal
  await idiNa('/traveler/monte-carlo/events')
  await klikUKartici(/Riviera Cup Weekend/, 'Request a quote')
  proveri('M8 → M3 preuzima događaj i prikazuje traku "partner casino · 18+"', (await ekran()) === 'M3' && (await ima(/Riviera Cup Weekend/)) && (await ima(/partner casino/i)) && (await ima(/18\+/)))
  await stikliraj(/18 or over/)
  await stikliraj(/contacts me/)
  await klik('Request a quote', { sel: 'button', n: 0 })
  proveri('M3 → M4: događaj završava na "Quote requested", bez ponude Royal Suite', (await ekran()) === 'M4' && (await ima(/Quote requested — your advisor prepares a tailored quote/)) && !(await ima(/Demo shortcut/)) && !(await ima(/EUR 50,000/)))
  proveri('M4: ima naziv događaja i datume događaja', (await ima(/Riviera Cup Weekend/)) && (await ima(/2 – 5 Jul 2027|2–5 Jul 2027|2 Jul/)))
  const posleDogadjaja = await stanje()
  proveri('događaj je poseban zahtev; Royal ostaje potvrđen', posleDogadjaja.tokovi.zahtevi.length === 1 && posleDogadjaja.tokovi.monteKarlo === 'potvrdjeno')

  // ---- S8 do kraja (slepa kartica): poseban zahtev, bez slike, bez Royal ponude
  await idiNa('/traveler/packages')
  await klikUKartici(/Harbour Lifestyle Escape/, 'View details')
  proveri('S5 → S8 za "slepu" karticu', (await ekran()) === 'S8' && (await ima(/not detailed in the demo/)))
  proveri('S8: nema fotografije (jedna slika ne sme uz različite pakete)', await page.evaluate(() => !document.querySelector('[data-ekran=S8] main img, [data-ekran=S8] img')))
  await klik('Request a quote')
  proveri('S8 → M4 sa nazivom paketa i tekstom "Quote requested"', (await ekran()) === 'M4' && (await ima(/Harbour Lifestyle Escape/)) && (await ima(/Quote requested — your advisor prepares a tailored quote/)) && !(await ima(/EUR 50,000/)))
  await idiNa('/traveler/packages')
  await klikUKartici(/Aegean Poker Odyssey/, 'View details')
  await klik('Request a quote')
  const posleS8 = await stanje()
  proveri('tri zahteva se ne prepisuju: događaj + Vegas + Aegean, Royal i krstarenje ostaju', posleS8.tokovi.zahtevi.length === 3 && new Set(posleS8.tokovi.zahtevi).size === 3 && posleS8.tokovi.monteKarlo === 'potvrdjeno' && posleS8.tokovi.krstarenje === 'placeno')
  await idiNa('/traveler/trips')
  const t5 = norm(await tekst())
  proveri('T5: svaki zahtev je poseban red, bez duplikata', ['Royal Suite Experience', 'Riviera Cup Weekend', 'Harbour Lifestyle Escape', 'Aegean Poker Odyssey', 'Iberian Peninsula'].every((n) => (t5.match(new RegExp(n, 'g')) ?? []).length === 1))
  proveri('T5: tipovi zahteva Cruise / Event / Monte Carlo', /Cruise · Ref/.test(t5) && /Event · Ref/.test(t5) && /Monte Carlo · Ref/.test(t5))
  const refTraveler = (await refovi()).filter((r) => /^AA1-R-04/.test(r))
  await idiNa('/advisor/desk/requests')
  const refAdvisor = (await refovi()).filter((r) => /^AA1-R-04/.test(r))
  proveri('V5: isti brojevi zahteva kao kod putnika (jedna referenca po zahtevu)', refTraveler.length === 3 && refTraveler.every((r) => refAdvisor.includes(r)), `${refTraveler} | ${refAdvisor}`)
  proveri('V5: tipovi Event / Cruise / Monte Carlo vidljivi', (await ima(/Event/)) && (await ima(/Cruise/)) && (await ima(/Monte Carlo/)))
  await idiNa('/traveler/trips/booking')
  proveri('T7: zahtev iz kataloga pokazuje "Quote requested" i traku sa jednom fazom', (await ima(/Ref AA1-R-04/)) && (await ima(/Quote requested/)))

  // ---- grupni paket iz S8 vodi u grupni upit (G1), ne u individualni zahtev
  await ucitaj('/traveler/packages')
  const tS5 = await tekst()
  proveri('S5: svaka cena "od" ima jedinicu (per person / for N guests)', (tS5.match(/from EUR [\d,]+/gi) ?? []).length >= 5 && (tS5.match(/from EUR [\d,]+(?![\d,])(?! (per person|for \d+ guests))/gi) ?? []).length === 0)
  await klikUKartici(/Las Vegas Poker Week/, 'View details')
  proveri('S8 grupni paket: dugme "Group inquiry" (ne "Request a quote")', (await ima(/group inquiry/i)) && !(await dugmeAktivno('Request a quote')))
  await klik('Group inquiry')
  proveri('"Group inquiry" vodi u G1', (await ekran()) === 'G1')

  // ---- konsijerž (Q1–Q6): savetnik šalje ponudu u V5; T7 prvo "Requested"
  await ucitaj('/traveler/concierge')
  proveri('Q1: nema filtera "Location" ni statusa "Available"', !(await ima(/Location/)) && !(await ima(/Available/)))
  await klik('View profile', { n: 0 })
  proveri('Q2 profil, ocene uz oznaku demoa, bez datuma', (await ekran()) === 'Q2' && (await ima(/Sample ratings and comments — demo/)))
  await klik('Request this advisor')
  proveri('Q2 → Q3', (await ekran()) === 'Q3')
  await klik('Send request')
  proveri('Q3 → Q4 "Waiting for your advisor\'s offer" (nema ponude pre savetnika)', (await ekran()) === 'Q4' && (await ima(/Waiting for your advisor's offer/)) && !(await ima(/Quote validity/)))
  await idiNa('/traveler/trips/booking')
  proveri('T7: konsijerž je prvo Requested', (await ima(/Luxury Gala Monte Carlo/)) && (await ima(/Requested/)) && (await ima(/AA1-R-0303/)))
  await idiNa('/advisor/desk/requests')
  proveri('V5: savetnik vidi isti broj AA1-R-0303 i "Send offer"', (await ima(/AA1-R-0303/)) && (await ima(/send offer/i)))
  await klik('Send offer')
  proveri('V5: posle "Send offer" tok je u ponudi', (await stanje()).tokovi.konsijerz === 'ponuda')
  await idiNa('/traveler/concierge/offer')
  proveri('Q4: ponuda sa razlaganjem "Gala package EUR 5,500" + "additional services & taxes EUR 1,760"', (await ima(/Gala package/)) && (await ima(/EUR 5,500/)) && (await ima(/EUR 1,760/)) && (await ima(/EUR 7,260/)))
  proveri('Q4: nema obećanog roka (24 sata)', !(await ima(/24 hours|within \d+ hours/i)))
  await klik('Accept offer')
  proveri('Q4 → Q5 plaćanje, bez "Secure"', (await ekran()) === 'Q5' && !/Secure/.test(await tekst()))
  await stikliraj(/payment terms/)
  await klik(/^Finalize payment — EUR/)
  proveri('Q5 → Q6 potvrda sa "Not an offer"', (await ekran()) === 'Q6' && (await ima(/Thank you — your reservation is confirmed!/)) && (await ima(/Not an offer/)))

  // ---- odbijanje ponude: stanje postaje "Declined" i ostaje tako
  await ucitaj('/traveler/monte-carlo/detail')
  await klik('Request a quote')
  await stikliraj(/18 or over/)
  await stikliraj(/contacts me/)
  await klik('Request a quote', { sel: 'button', n: 0 })
  await klik('Demo shortcut: advisor replies now')
  await klik('Decline')
  const odb = await stanje()
  proveri('M5: "Decline" menja tok u odbijeno i ekran kaže "Declined"', odb.tokovi.monteKarlo === 'odbijeno' && (await ima(/Declined/)))
  await idiNa('/traveler/trips')
  proveri('T5: odbijena ponuda je "Declined"', await ima(/Declined/))

  // ---- transport (L1–L4): izabrana jahta nosi svoju cenu i rutu; jahta ne polazi sa aerodroma
  await ucitaj('/traveler/transport')
  await klik('Explore luxury transport')
  await klikUKartici(/VIP Yacht Transfer/, 'Request a quote')
  proveri('L2 → L3 sa jahtom, polazak iz luke (ne sa aerodroma)', (await ekran()) === 'L3' && (await ima(/VIP Yacht Transfer/)) && (await ima(/Cannes harbour/)) && !(await ima(/Airport/)))
  proveri('L3: "Partner operators", bez obećanog roka', (await ima(/partner operators/i)) && !(await ima(/Licensed/i)))
  await klik('Send request')
  proveri('L3 → L4 sa jahtom', (await ekran()) === 'L4' && (await ima(/Request sent/)) && (await ima(/VIP Yacht Transfer/)))
  await idiNa('/advisor/desk/requests')
  proveri('V5: savetnik vidi zahtev za jahtu (Transport)', (await ima(/VIP Yacht Transfer/)) && (await ima(/Transport/)))
  await klik('Send quote')
  await idiNa('/traveler/trips/booking')
  proveri('T7: ponuda za jahtu sa cenom EUR 3,900 (ne helikopter)', (await ima(/EUR 3,900/)) && !(await ima(/Helicopter/)))
  await klik('Accept quote')
  proveri('T7: transport prihvaćen', (await stanje()).tokovi.transport === 'prihvaceno')
  await idiNa('/traveler/all-in/status')

  // ---- članstvo: prijava, "Application received", zatim broj REZERVISANIH putovanja
  await ucitaj('/traveler/all-in')
  proveri('B1: pragovi su "booked trips"', (await ima(/booked trip/)) && !(await ima(/completed/i)))
  await klik('Apply for membership')
  proveri('B1 → B2 posle prijave: "Application received"', (await ekran()) === 'B2' && (await ima(/Application received/)))

  // ---- prijava, registracija, V5, "o demou", odjava: sve klikom
  await ucitaj('/guest/home')
  await klik('Log in / Register')
  proveri('klik: gost "Log in / Register" → S3', (await ekran()) === 'S3')
  await klik('Register')
  proveri('klik: S3 → "Register" → S4', (await ekran()) === 'S4')
  await klik('Log in', { sel: 'button.btn-link-mini' })
  proveri('klik: S4 → "Log in" → S3', (await ekran()) === 'S3')
  await ucitaj('/advisor/desk')
  await klik('Requests', { sel: 'nav[aria-label="Account"] button' })
  proveri('klik: savetnik, traka naloga → "Requests" → V5', (await ekran()) === 'V5')
  await ucitaj('/traveler/trips')
  await klik(/Account menu|Marko/, { sel: 'button[data-nalog-dugme]' })
  await klik('About this demo', { sel: '[data-meni-lista] button' })
  proveri('klik: meni naloga → "About this demo" → S7', (await ekran()) === 'S7')
  await ucitaj('/traveler/trips')
  await klik(/Account menu|Marko/, { sel: 'button[data-nalog-dugme]' })
  await klik('Log out', { sel: '[data-meni-lista] button' })
  proveri('klik: "Log out" → S1', (await ekran()) === 'S1')

  // ---- S4 za prijavljenog: ne pravi nalog, ne menja članstvo
  await ucitaj('/traveler/register')
  await klik('Create account')
  proveri('S4 prijavljen: "You are already signed in as Marko Petrović", članstvo se ne menja', (await ima(/You are already signed in as Marko Petrović/)) && (await stanje()).tokovi.clanstvo === 'none')

  // ---- popunjeni podaci prate ulogu (organizator → Daniel Ferreira) i promena uloge nije tiha
  await ucitaj('/organizer/cruises/order')
  proveri('K5 kao organizator: kartica na ime Daniel Ferreira', await ima(/Daniel Ferreira/))
  await ucitaj('/organizer/monte-carlo/request')
  proveri('M3 kao organizator: Daniel Ferreira, ne Marko Petrović', (await ima(/Daniel Ferreira/)) && !(await ima(/Marko Petrović/)))
  await ucitaj('/organizer/register')
  proveri('S4 kao organizator: e-mail Daniela Ferreire', await ima(/daniel\.ferreira@example\.com/))
} catch (e) {
  proveri('skripta prekinuta greškom', false, e.message)
}

// ---- tragovi, članstvo i Restart: potpun scenario sa seed-om punih tokova
const PUNI = { krstarenje: 'placeno', monteKarlo: 'potvrdjeno', konsijerz: 'placeno', transport: 'prihvaceno', clanstvo: 'prijavljeno', mkDogadjaj: null, savetnik: 0, usluga: 1, s8Kljuc: null, zahtevi: [], poslednji: null }
try {
  await ucitaj('/traveler/trips', 'free', PUNI)
  const kartice = await page.evaluate(() => document.querySelectorAll('[data-ekran=T5] .card').length)
  proveri('T5: tragovi sva četiri toka', (await ima(/Iberian Peninsula/)) && (await ima(/Royal Suite/)) && (await ima(/Luxury Gala/)) && (await ima(/Helicopter/)) && kartice >= 4, String(kartice))
  await ucitaj('/traveler/all-in/status', 'free', PUNI)
  proveri('B2: broji četiri rezervisana putovanja i nivo Signature sa dodatnom pogodnošću', (await ima(/Signature/)) && (await ima(/4 of 4 trips/)) && (await ima(/booked/i)))
  await ucitaj('/traveler/all-in/status', 'free', { ...PUNI, krstarenje: 'none', monteKarlo: 'none', konsijerz: 'none', transport: 'none' })
  proveri('B2 pre prvog putovanja: "Application received"', (await ima(/Application received/)) && (await ima(/progress to member/i)))
  await ucitaj('/traveler/all-in/status', 'free', { ...PUNI, monteKarlo: 'none', konsijerz: 'none', transport: 'none' })
  proveri('B2 posle prve rezervacije: tekst se menja, pragovi dostižni', !(await ima(/Application received/)) && (await ima(/1 of 2 trips/)))
  await ucitaj('/advisor/desk/requests', 'free', PUNI)
  proveri('V5: zahtevi gledaoca na vrhu tabele', (await ima(/AA1-R-0301|AA1-R-0301/)) && (await ima(/AA1-R-0303/)))
  await ucitaj('/traveler/trips', 'free', PUNI)
  await klik('Restart demo')
  await klik('Yes')
  await sleep(200)
  const posle = await stanje()
  proveri('Restart briše sve slobodne tokove', posle.tokovi.krstarenje === 'none' && posle.tokovi.monteKarlo === 'none' && posle.tokovi.konsijerz === 'none' && posle.tokovi.transport === 'none' && posle.tokovi.clanstvo === 'none' && posle.tokovi.zahtevi.length === 0)
  proveri('posle Restarta T5 nema tragova slobodnih tokova', !(await ima(/Iberian Peninsula/)))

  // ---- savetnik: "Switch to Traveler to try this" se proverava KLIKOM; prebacivanje je vidljivo (toast) i stvarno (Marko)
  await ucitaj('/advisor/cruises/order')
  proveri('savetnik na K5: nudi "Switch to Traveler to try this"', await ima(/Switch to Traveler to try this/))
  await klik(/Switch to Traveler to try this/)
  await sleep(250)
  proveri('klik "Switch to Traveler": hash je /traveler, toast "Switched to the Traveler view", u zaglavlju Marko', (await hash()).startsWith('#/traveler') && (await ima(/Switched to the Traveler view/)) && (await ima(/Marko/)))

  // ---- gost: akcija → "Enter demo as…" → izvršena
  await ucitaj('/guest/cruises/order')
  await stikliraj(/terms and conditions/)
  await stikliraj(/18 or over/)
  await klik(/^Confirm booking & pay EUR/)
  proveri('gost: plaćanje otvara "Enter demo as…"', await ima(/Enter demo as…/))
  await klik('Traveler', { sel: '[role=dialog] button' })
  const g = await stanje()
  proveri('gost: posle izbora uloge krstarenje je plaćeno i otvoren K6', g.tokovi.krstarenje === 'placeno' && (await ekran()) === 'K6')
} catch (e) {
  proveri('skripta (tragovi/savetnik/gost) prekinuta greškom', false, e.message)
}

await browser.close()
const ok = izvestaj('e2e-tokovi', lista, problemi, spoljni)
process.exit(ok ? 0 : 1)
