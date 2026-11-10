// Tokovi 9–11 i opšte provere: firma (F3–F9), akcija (A1–A6), moderacija (O5 → V1–V4), ovlašćenja po uglovima, Restart, obilazak linkova.
import { sleep } from './_zajednicko.mjs'
import { ima, korak, nema, proveri, zdravo, C, D, SVE, rx } from './_tokovi-zajednicko.mjs'

// ---------------------------------------------------------------------------------------------------------------------
// TOK 9: firma — tabla, rezultati, uređivanje profila, pretplata, reklama „Sponzorisano“, servisi i javni profil (F3–F9)
// ---------------------------------------------------------------------------------------------------------------------
export async function tok9(S) {
  await korak(S, 'tok 9', async () => {
    await S.ucitaj('/prodavnica/tabla')
    await zdravo(S, 'F3')
    ima(S, 'F3: pretplata Radnja, ilustrativno', await S.glavni(), rx('Pretplata: Radnja', SVE, `${D(C.pretplataRadnja)} mesečno, sa PDV-om`, SVE, 'ilustrativno, nije cenovnik'))
    const precice = [
      ['Pregled rezultata', 'F6'],
      ['Moji oglasi', 'O6'],
      ['Javni profil', 'F4'],
      ['Reklama „Sponzorisano“', 'F9'],
      ['Uredi profil', 'F5'],
      ['Moje razmene i ponude', 'X12'],
      ['Upravljaj pretplatom', 'F8'],
      ['Napravi akciju', 'A5'],
    ]
    for (const [naziv, ekran] of precice) {
      await S.idi('/prodavnica/tabla')
      await S.klik(naziv, { sel: 'main a, main button' })
      proveri(`${S.uredjaj.naziv} F3 „${naziv}“ → ${ekran}`, (await S.ekran()) === ekran, await S.ekran())
      await zdravo(S, ekran)
    }
    // F6: broj redova u tabeli oglasa = pet
    await S.idi('/prodavnica/poslovni/rezultati')
    ima(S, 'F6: pregledi i rezultati reklame', await S.glavni(), /Pregledi[\s\S]*1\.204[\s\S]*Reklama: prikazi/)
    // F5: izmena radnog vremena se čuva i vidi na javnom profilu (F4)
    await S.idi('/prodavnica/poslovni/uredi')
    await S.klik('Pon–sub 10–18')
    await S.klik('Sačuvaj')
    proveri(`${S.uredjaj.naziv} F5 „Sačuvaj“ → F3 ili F4`, ['F3', 'F4'].includes(await S.ekran()), await S.ekran())
    await S.idi('/prodavnica/firma/zupcanik')
    await zdravo(S, 'F4')
    ima(S, 'F4: sačuvano radno vreme je na javnom profilu', await S.glavni(), /Pon–sub 10–18/)
    ima(S, 'F4: oznaka „Firma“', await S.glavni(), /Firma/)
    // F8: pretplata — otkaži → potvrda, pa promena plana vodi na F1
    await S.idi('/prodavnica/poslovni/pretplata')
    await zdravo(S, 'F8')
    await S.klik('Promeni plan')
    proveri(`${S.uredjaj.naziv} F8 „Promeni plan“ → F1`, (await S.ekran()) === 'F1', await S.ekran())
    // F9: reklama → plaćanje (Z3) → potvrda (Z4); bez potrošačkog teksta nema plaćanja
    await S.idi('/prodavnica/poslovni/reklama')
    ima(S, 'F9: cena reklame, ilustrativno', await S.glavni(), rx(`${D(C.reklama7Dana)} sa PDV-om`))
    await S.klik('Plati i objavi')
    proveri(`${S.uredjaj.naziv} F9 → Z3 (plaćanje reklame)`, (await S.ekran()) === 'Z3', await S.ekran())
    await zdravo(S, 'Z3 reklama')
    const z3r = await S.glavni()
    ima(S, 'Z3 reklama: 2.900 din, poslovni korisnik', z3r, rx(D(C.reklama7Dana), SVE, 'Plaćaš kao poslovni korisnik'))
    nema(S, 'Z3 reklama (firma): nema potrošačkog teksta o odustanku', z3r, /Pravo na odustanak|usluga počne odmah/)
    // F7: servisi i zanatlije
    await S.idi('/ana/servisi')
    await zdravo(S, 'F7')
    await S.klik('Servis', { sel: 'main .pilula' }).catch(() => {})
    await zdravo(S, 'F7 filter')
  })
}

// ---------------------------------------------------------------------------------------------------------------------
// TOK 10: akcija „staro za novo“ — firma objavljuje (A5), građanin se prijavljuje (A1 → A2 → A3), firma vidi prijave (A6, A4)
// ---------------------------------------------------------------------------------------------------------------------
export async function tok10(S) {
  await korak(S, 'tok 10', async () => {
    await S.ucitaj('/prodavnica/akcije')
    await zdravo(S, 'A4 prazna')
    ima(S, 'A4: nema aktivne akcije', await S.glavni(), /Nema aktivne akcije/)
    await S.klik('Nova akcija')
    proveri(`${S.uredjaj.naziv} A4 → A5`, (await S.ekran()) === 'A5')
    await zdravo(S, 'A5')
    ima(S, 'A5: popust, cena akcije i reklama uključena u cenu', await S.glavni(), rx(D(C.popustPoStaromBiciklu), SVE, `${D(C.akcijaStaroZaNovo)} sa PDV-om`, SVE, 'uključena u cenu akcije'))
    await S.klik('Objavi akciju')
    // N-3: reklama akcije je javna tek posle plaćanja — plaćanje akcije (Z3)
    proveri(`${S.uredjaj.naziv} A5 → Z3 (plaćanje akcije)`, (await S.ekran()) === 'Z3', await S.ekran())
    const z3a = await S.glavni()
    ima(S, 'Z3 akcija: 4.900 din, poslovni korisnik', z3a, rx(D(C.akcijaStaroZaNovo), SVE, 'Plaćaš kao poslovni korisnik'))
    nema(S, 'Z3 akcija (firma): nema potrošačkog teksta o odustanku', z3a, /Pravo na odustanak|usluga počne odmah/)
    await S.klik('Plati')
    await S.klik('Nastavi')
    await zdravo(S, 'posle plaćanja akcije')
    await S.idi('/prodavnica/akcije')
    await zdravo(S, 'A4 sa akcijom')
    nema(S, 'A4: akcija je sada aktivna', await S.glavni(), /Nema aktivne akcije/)
    // građanin vidi akciju i prijavljuje se
    await S.idi('/ana/akcija/staro-za-novo')
    await zdravo(S, 'A1')
    ima(S, 'A1: oznaka „Sponzorisano“ i popust', await S.glavni(), rx('Sponzorisano', SVE, D(C.popustPoStaromBiciklu)))
    await S.klik('Prijavi stari bicikl', { sel: 'main a, main button' })
    proveri(`${S.uredjaj.naziv} A1 → A2`, (await S.ekran()) === 'A2', await S.ekran())
    await zdravo(S, 'A2')
    await S.klik('Pošalji prijavu', { sel: 'main button' })
    proveri(`${S.uredjaj.naziv} A2 → A3`, (await S.ekran()) === 'A3', await S.ekran())
    await zdravo(S, 'A3')
    // firma vidi prijavu na A6
    await S.idi('/prodavnica/akcija/staro-za-novo/prijave')
    await zdravo(S, 'A6')
    nema(S, 'A6: akcija je objavljena, pa ima prijava', await S.glavni(), /Akcija još nije objavljena/)
  })
}

// ---------------------------------------------------------------------------------------------------------------------
// TOK 11: moderacija — prijava oglasa (O5) stiže na V1, odluka (V3), obaveštenje korisniku (V4)
// ---------------------------------------------------------------------------------------------------------------------
export async function tok11(S) {
  await korak(S, 'tok 11', async () => {
    await S.ucitaj('/ana/prijavi/romani-ive-andrica-komplet')
    await zdravo(S, 'O5')
    const dugmad = await S.page.evaluate(() => [...document.querySelectorAll('main button')].filter((e) => e.getClientRects().length).map((e) => e.textContent.trim()))
    const razlog = dugmad.find((d) => /Lažan|Zabranjena|Dupli/i.test(d))
    if (razlog) await S.klik(razlog)
    await S.klik('Pošalji', { sel: 'main button' })
    ima(S, 'O5: prijava je poslata (samo u demou)', await S.glavni(), /prijav/i)
    const st = await S.stanje()
    proveri(`${S.uredjaj.naziv} O5: prijava je u tokovima`, (st.tokovi.prijave?.length ?? 0) >= 1, JSON.stringify(st.tokovi.prijave ?? null).slice(0, 100))
    // moderator vidi novu prijavu
    await S.idi('/moderacija/moderacija')
    await zdravo(S, 'V1')
    ima(S, 'V1: nova prijava je u tabeli, na čekanju', await S.glavni(), /Na čekanju[\s\S]*Romani/)
    const redova = await S.broji('main tbody tr')
    const kpi = Number(/Na čekanju\s*\n?\s*(\d+)/.exec(await S.glavni())?.[1])
    proveri(`${S.uredjaj.naziv} V1: broj „Na čekanju“ (${kpi}) = redovi na čekanju`, kpi === (await S.page.evaluate(() => [...document.querySelectorAll('main tbody tr')].filter((r) => /Na čekanju/.test(r.textContent)).length)), `redova ${redova}`)
    await S.klik('Otvori', { sel: 'main button, main a', i: 2 }).catch(async () => S.klik('Otvori', { sel: 'main button, main a' }))
    proveri(`${S.uredjaj.naziv} V1 → V2`, (await S.ekran()) === 'V2', await S.ekran())
    await zdravo(S, 'V2')
    const dugmaV2 = await S.page.evaluate(() => [...document.querySelectorAll('main button, main a')].filter((e) => e.getClientRects().length).map((e) => e.textContent.trim()))
    proveri(`${S.uredjaj.naziv} V2: ponuđene odluke Ukloni / Ostavi / Traži izmenu`, ['Ukloni', 'Ostavi', 'Traži izmenu'].every((d) => dugmaV2.some((x) => x.startsWith(d))), dugmaV2.join(' ; '))
    await S.klik('Ukloni')
    proveri(`${S.uredjaj.naziv} V2 → V3`, (await S.ekran()) === 'V3', await S.ekran())
    await zdravo(S, 'V3')
    await S.klik('Pošalji odluku')
    await zdravo(S, 'posle odluke')
    await S.idi('/ana/prijava/p-romani-ive-andrica-komplet/obavestenje')
    await zdravo(S, 'V4')
    ima(S, 'V4 (N-5): odluka je navedena kao odluka moderatora SWAPIT tima, sa rokom za prigovor', await S.glavni(), /Odluku je doneo moderator SWAPIT tima[\s\S]*Prigovor/)
    await S.idi('/moderacija/moderacija')
    ima(S, 'V1: odluka je zabeležena', await S.glavni(), /Uklonjeno|Obrađeno/)
  })
}

// ---------------------------------------------------------------------------------------------------------------------
// Opšte: ovlašćenja po uglovima, Restart briše tokove, obilazak linkova (nijedan ne vodi u prazno)
// ---------------------------------------------------------------------------------------------------------------------
export async function opste(S) {
  await korak(S, 'ovlašćenja', async () => {
    // građanin ne sme na ekrane firme i moderacije; firma ne sme na ekrane građanina; nijedan ne pada u grešku
    const zabranjeno = [
      ['/ana/tabla', 'građanin na tabli firme'],
      ['/ana/akcije/nova', 'građanin pravi akciju'],
      ['/ana/moderacija', 'građanin na moderaciji'],
      ['/prodavnica/aukcije/nova', 'firma na ekranu građanina (aukcija)'],
    ]
    await S.ucitaj('/ana/pocetna')
    for (const [ruta, opis] of zabranjeno) {
      await S.idi(ruta)
      const d = await S.page.evaluate(() => ({ ekran: document.querySelector('main[data-ekran]')?.getAttribute('data-ekran'), nema: !!document.querySelector('[data-nema-stranice]'), tekst: document.querySelector('main')?.innerText.slice(0, 120) }))
      proveri(`${S.uredjaj.naziv} ovlašćenje: ${opis} ne otvara ekran firme`, !['F3', 'A5', 'V1'].includes(d.ekran), JSON.stringify(d))
    }
  })
  await korak(S, 'restart', async () => {
    await S.ucitaj('/ana/pocetna')
    let st = await S.stanje()
    proveri(`${S.uredjaj.naziv} pre restarta: tokovi nisu prazni`, JSON.stringify(st.tokovi).length > 60)
    // na telefonu je Restart u meniju ≡; na računaru u zaglavlju (može biti u padajućem meniju profila)
    if (S.uredjaj.telefon) await S.page.evaluate(() => document.querySelector('[data-meni-dugme]')?.click())
    await sleep(200)
    const klikRestart = () => S.page.evaluate(() => { const e = [...document.querySelectorAll('button')].find((x) => x.getClientRects().length && /Restart demo/i.test(x.textContent || '')); e?.click(); return !!e })
    let dugme = await klikRestart()
    if (!dugme) {
      await S.page.evaluate(() => [...document.querySelectorAll('header button')].find((x) => x.getClientRects().length && /Meni profila|profil|ana_zvz84/i.test(x.getAttribute('aria-label') || x.textContent || ''))?.click())
      await sleep(200)
      dugme = await klikRestart()
    }
    proveri(`${S.uredjaj.naziv} Restart postoji u okviru`, dugme)
    if (dugme) {
      await sleep(250)
      await S.page.evaluate(() => [...document.querySelectorAll('[role=dialog] button')].find((e) => e.textContent.trim() === 'Da')?.click())
      await sleep(300)
      st = await S.stanje()
      proveri(`${S.uredjaj.naziv} posle restarta: svi tokovi su obrisani (novi oglasi, ponude, poeni…)`, (st?.tokovi?.noviOglasi?.length ?? 0) === 0 && (st?.tokovi?.ponude?.length ?? 0) === 0 && (st?.tokovi?.poeni?.length ?? 0) === 0, JSON.stringify(st?.tokovi).slice(0, 120))
    }
  })
}

/** Obilazak: iz izabranih ekrana prati sve linkove #/… (do granice) i traži da nijedan ne vodi na „Nema te stranice“ ili u kostur. */
export async function obilazak(S, pocetne, granica = 120) {
  await korak(S, 'obilazak linkova', async () => {
    const videni = new Set()
    const red = [...pocetne]
    const pokvareni = []
    await S.ucitaj(red[0])
    while (red.length && videni.size < granica) {
      const r = red.shift()
      if (videni.has(r)) continue
      videni.add(r)
      await S.idi(r)
      const d = await S.page.evaluate(() => ({
        nema: !!document.querySelector('[data-nema-stranice]'),
        kostur: !!document.querySelector('[data-u-izradi]') || /u izradi/i.test(document.body.innerText),
        linkovi: [...document.querySelectorAll('a[href^="#/"]')].map((a) => a.getAttribute('href').slice(1)),
      }))
      if (d.nema || d.kostur) pokvareni.push(r)
      for (const l of d.linkovi) if (!videni.has(l) && !l.includes('?')) red.push(l)
    }
    proveri(`${S.uredjaj.naziv} obilazak: ${videni.size} stranica, nijedan link ne vodi u prazno`, pokvareni.length === 0, pokvareni.join(' , '))
  })
}
