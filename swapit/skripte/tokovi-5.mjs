// ZAVRŠNA DORADA (tehnicki-plan/DORADA-ZAVRSNA.md): K1, V3, V2, V8, V9, S6, S9, N6 u pravom pregledaču. Deo skripte e2e-tokovi.mjs.
import { sleep } from './_zajednicko.mjs'
import { ima, korak, nema, proveri, zdravo } from './_tokovi-zajednicko.mjs'
import { objaviOglas } from './tokovi-1.mjs'

const PREDMET = /Ovaj predmet je deo priče/

export async function tokZavrsna(S) {
  await korak(S, 'završna dorada', async () => {
    // ---- K1: predmet priče (Markov bicikl) se ne prijavljuje, ne ističe, ne uklanja; broj oglasa ostaje isti
    await S.ucitaj('/marko/pocetna')
    const pre = await S.stanje()
    await S.idi('/ana/prijavi/markov-bicikl')
    await zdravo(S, 'O5 na predmetu priče')
    ima(S, 'K1: O5 na biciklu kaže „Ovaj predmet je deo priče“', await S.glavni(), PREDMET)
    proveri(`${S.uredjaj.naziv} K1: O5 na biciklu nema „Pošalji prijavu“`, (await S.stanjeDugmeta('Pošalji prijavu')) === 'nema')
    await S.idi('/marko/isticanje/markov-bicikl')
    await zdravo(S, 'Z1 na predmetu priče')
    ima(S, 'K1: Z1 ne nudi bicikl za isticanje', await S.glavni(), /Nemaš oglas koji možeš da istakneš|Izaberi drugi oglas|Izaberi oglas koji ističeš/)
    await S.idi('/marko/moji-oglasi')
    await zdravo(S, 'O6 Marko')
    ima(S, 'K1: O6 pokazuje razlog uz Istakni/Ukloni predmeta priče', await S.glavni(), PREDMET)
    let greska = ''
    await S.klik('Ukloni').catch((e) => (greska = String(e.message)))
    await S.klik('Istakni').catch((e) => (greska += String(e.message)))
    await sleep(120)
    nema(S, 'K1: klik na „Ukloni“ ne otvara potvrdu', await S.glavni(), /Ukloniti oglas\?/)
    const posle = await S.stanje()
    proveri(`${S.uredjaj.naziv} K1: prijavi bicikl → ukloni → tokovi nepromenjeni (nema prijave, uklanjanja, isticanja)`, JSON.stringify(posle.tokovi.prijave ?? []) === JSON.stringify(pre.tokovi.prijave ?? []) && (posle.tokovi.uklonjeni ?? []).length === 0 && (posle.tokovi.istaknuti ?? []).length === 0, JSON.stringify(posle.tokovi).slice(0, 200))
    await S.idi('/moderacija/moderacija')
    nema(S, 'K1: na tabli moderacije nema prijave bicikla', await S.glavni(), /Dečji bicikl 20 inča/)

    // ---- V3: saglasnost važi za JEDNU kupovinu: druga kupovina paketa ima neštiklirenu kvačicu
    await S.ucitaj('/ana/paketi-aukcija')
    await S.klik('Kupi', { sel: 'main .red-dugmad button' })
    proveri(`${S.uredjaj.naziv} V3: Z2 → Z3`, (await S.ekran()) === 'Z3')
    await S.stikliraj('Želim da usluga počne odmah')
    await S.klik('Plati')
    await S.klik('Nastavi')
    await S.idi('/ana/paketi-aukcija')
    await S.klik('Kupi', { sel: 'main .red-dugmad button' })
    proveri(`${S.uredjaj.naziv} V3: kupi dva puta zaredom — druga kupovina ima neštikliranu kvačicu`, (await S.kvacicaStiklirana('Želim da usluga počne odmah')) === false)
    proveri(`${S.uredjaj.naziv} V3: „Plati“ je opet neaktivno`, (await S.stanjeDugmeta('Plati')) === 'neaktivno')

    // ---- V8: „Uredi“ za uslugu ima samo „Za razmenu“; za robu su sva tri načina
    await S.ucitaj('/ana/pocetna')
    await objaviOglas(S, 'ana', { naslovPrimera: 'Pomoć oko uređenja bašte' })
    await S.idi('/ana/moji-oglasi')
    await S.klik('Uredi', { sel: 'main a' })
    await zdravo(S, 'O2 Uredi usluga')
    ima(S, 'V8: usluga se uređuje samo „za razmenu“', await S.glavni(), /Usluge i ideje su samo „za razmenu“/)
    const poeniStanje = await S.page.evaluate(() => [...document.querySelectorAll('main [data-nacin-uredi] .pilula')].filter((e) => /poene|Poklanjam/i.test(e.textContent)).map((e) => e.disabled || e.getAttribute('aria-disabled') === 'true'))
    proveri(`${S.uredjaj.naziv} V8: „Za poene“ i „Poklanjam“ su onemogućeni`, poeniStanje.length === 2 && poeniStanje.every(Boolean), JSON.stringify(poeniStanje))

    // ---- V2: dve ponude na isti oglas — prihvatanje jedne zatvara drugu
    await S.ucitaj('/marko/primljene/markova-jakna')
    await zdravo(S, 'X4 jakna')
    ima(S, 'V2: dve unapred pripremljene ponude na čekanju', await S.glavni(), /jakna-irena|Primljene ponude \(2\)/)
    await S.klik('Prihvati ponudu', { sel: 'main button', i: 0 })
    await S.idi('/marko/primljene/markova-jakna')
    const stanja = await S.page.evaluate(() => [...document.querySelectorAll('main [data-ponuda]')].map((e) => e.getAttribute('data-status')))
    proveri(`${S.uredjaj.naziv} V2: jedna prihvaćena, druga odbijena (izabrana druga ponuda)`, stanja.filter((x) => x === 'prihvacena').length === 1 && stanja.filter((x) => x === 'odbijena').length === 1, JSON.stringify(stanja))
    ima(S, 'V2: razlog „izabrana druga ponuda“', await S.glavni(), /izabrana druga ponuda/)

    // ---- V9: lokalno stanje ekrana se resetuje pri promeni ugla (A2: Ana → Marko)
    const akcijaStanje = { v: 1, poz: { korak: 1, n: 3, grana: 'lanac' }, rezim: 'slobodno', tema: 'svetla', poruke: { slobodno: true }, saglasnosti: {}, tokovi: { noviOglasi: [], omiljeno: [], poslovno: { plan: null, nalog: false, otkazana: false, radnoVreme: 0, reklama: null, akcija: true } } }
    await S.ucitaj('/ana/akcija/staro-za-novo/prijava', akcijaStanje)
    await zdravo(S, 'A2 Ana')
    ima(S, 'V9: Ana na A2 ima svoj stari bicikl', await S.glavni(), /ćerkin/)
    await S.idi('/marko/akcija/staro-za-novo/prijava')
    await zdravo(S, 'A2 Marko')
    nema(S, 'V9: Marko na A2 NE nasleđuje Aninu stvar iz lokalnog stanja', await S.page.evaluate(() => document.querySelector('main .pilula[aria-pressed=true]')?.textContent ?? ''), /ćerkin/)

    // ---- S9: P2 ima stalan naziv „Tamna tema“ uz uključeno/isključeno
    await S.idi('/ana/prikaz')
    ima(S, 'S9: P2 „Tamna tema: isključeno“', await S.glavni(), /Tamna tema: isključeno/)
    await S.klik('Tamna tema', { sel: 'main button[role=switch]' }).catch(() => S.page.evaluate(() => document.querySelector('main button[role=switch]')?.click()))
    await sleep(150)
    ima(S, 'S9: posle prebacivanja naziv ostaje, piše „uključeno“', await S.glavni(), /Tamna tema: uključeno/)
    await S.page.evaluate(() => document.querySelector('main button[role=switch]')?.click())

    // ---- N6: S5 „Razmena nije obavljena“ traži izbor razmene; „Pošalji“ je neaktivno
    await S.idi('/ana/prijavi-problem')
    proveri(`${S.uredjaj.naziv} N6: S5 „Pošalji“ neaktivno dok razmena nije izabrana`, (await S.stanjeDugmeta('Pošalji')) === 'neaktivno')

    // ---- D7: X2 u slobodnom toku: druga ponuda zaredom ima neštikliranu kvačicu „Razumem“ i neaktivno „Pošalji ponudu“
    for (const pokusaj of [1, 2]) {
      await objaviOglas(S, 'ana') // nov oglas za svaku ponudu (već ponuđene stvari se ne nude ponovo)
      await S.idi('/ana/ponuda/markova-jakna/izaberi')
      await S.klik('Izaberi')
      await S.klik('Nastavi')
      proveri(`${S.uredjaj.naziv} D7: ${pokusaj}. ponuda: X2 „Razumem“ nije štiklirano`, (await S.ekran()) === 'X2' && !(await S.kvacicaStiklirana('Razumem')) && (await S.stanjeDugmeta('Pošalji ponudu')) === 'neaktivno')
      await S.stikliraj('Razumem')
      await S.klik('Pošalji ponudu')
      proveri(`${S.uredjaj.naziv} D7: ${pokusaj}. ponuda poslata (X3)`, (await S.ekran()) === 'X3')
    }
  })
}
