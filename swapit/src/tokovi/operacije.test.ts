// Slobodni tokovi talasa 3: čiste operacije (ponude, razmene, poeni, aukcije, dostava, poslovno, moderacija), provera oblika posle JSON „puta“
// (sessionStorage), i pravila koja moraju da važe u SVAKOM stanju: zbirovi, poeni nikad negativni, istorija poena = stanje poena (N-1).
import { describe, expect, it } from 'vitest'
import { POCETNO, proveri } from '../demo/cuvanje'
import { svePozicije } from '../scenario/pomocno'
import { istorijaPoena, svet, recenzijeKorisnika } from '../scenario/svet'
import { KATEGORIJE } from '../scenario/kategorije'
import { brojRecenzija } from '../scenario/korisnici'
import { ANA_ID, MARKO_ID } from '../scenario/korisnici'
import { ponudeAukcije } from '../scenario/slobodno'
import {
  dogovorZavrsen,
  izaberiPredaju,
  izmeniOglas,
  izmeniPoslovno,
  istakniOglas,
  kupiPaket,
  naruciDostavu,
  napraviOglas,
  nadjiRazmenu,
  objaviPricu,
  odgovoriNaPonudu,
  odlukaPrijaveAkcije,
  odluciPrijavu,
  oceniRazmenu,
  pokreniAukciju,
  pokreniRazmenu,
  ponudeZaOglas,
  posaljiPonudu,
  potvrdiPrijem,
  prebaciPratim,
  prijaviOglas,
  prijaviZaAkciju,
  sacuvajPretragu,
  sledecaFazaDostave,
  statusPonude,
  ukloniOglas,
  zatraziPoklon,
  dodajZelju,
  idPrijave,
} from './operacije'
import { POCETNI_TOKOVI, dodajNoviOglas, imaTokova, proveriTokove, type Tokovi } from './tokovi'

const NACRT = { primer: 'primer-solje', vrsta: 'roba' as const, kat: 'kucni-dekor', nacin: 'razmena' as const, trazi: 'roba' as const, stanje: 'Korišćeno', preuzimanje: 'licno' as const }

/** Bogato stanje: sve vrste tokova odjednom (koristi se za pravila koja važe u svakom stanju). */
function bogato(): Tokovi {
  let t = POCETNI_TOKOVI
  t = dodajNoviOglas(t, napraviOglas(t, ANA_ID, false, 'zvz', NACRT))
  t = dodajNoviOglas(t, napraviOglas(t, ANA_ID, false, 'zvz', { ...NACRT, primer: 'primer-cizme', kat: 'odeca', nacin: 'poklon' }))
  t = dodajNoviOglas(t, napraviOglas(t, MARKO_ID, false, 'voz', { ...NACRT, primer: 'primer-ranac', kat: 'kamping', nacin: 'poeni', poeni: 25 }))
  // Anina ponuda na Markovu jaknu, Marko prihvata, razmena ide do kraja
  const a = posaljiPonudu(t, { cilj: 'markova-jakna', od: ANA_ID, stvari: [{ naslov: 'Set šolja', vrsta: 'roba', oglas: 'moj-ana_zvz84-1' }] })
  t = a.tokovi
  t = pokreniRazmenu(odgovoriNaPonudu(t, a.id, 'prihvacena'), { id: a.id, tip: 'razmena', cilj: 'markova-jakna', naslov: 'Dečja jakna', vlasnik: MARKO_ID, od: ANA_ID, stvari: [{ naslov: 'Set šolja', vrsta: 'roba', oglas: 'moj-ana_zvz84-1' }] })
  t = dogovorZavrsen(t, a.id)
  t = potvrdiPrijem(t, a.id, ANA_ID)
  t = potvrdiPrijem(t, a.id, MARKO_ID)
  t = oceniRazmenu(t, a.id, ANA_ID, 4)
  t = oceniRazmenu(t, a.id, MARKO_ID, 5)
  // Ana uzima Markov ranac „za poene“ (V10: operacija sama odbija ako nema dovoljno poena, pa se prosleđuje stanje), pa Marko dobija poene tek posle potvrde
  t = pokreniRazmenu(t, { id: 'poeni-moj-marko_voz77-3', tip: 'poeni', cilj: 'moj-marko_voz77-3', naslov: 'Ranac za planinarenje', vlasnik: MARKO_ID, od: ANA_ID, stvari: [], poeni: 10, raspolozivo: 20 })
  t = dogovorZavrsen(t, 'poeni-moj-marko_voz77-3')
  t = potvrdiPrijem(t, 'poeni-moj-marko_voz77-3', ANA_ID)
  t = istakniOglas(t, 'moj-marko_voz77-3', 7)
  t = izmeniOglas(t, 'moj-ana_zvz84-2', { nacin: 'razmena' })
  t = kupiPaket(t, 3)
  t = pokreniAukciju(t, 'moj-ana_zvz84-1', 7)
  return t
}

describe('operacije: ponude i razmene', () => {
  it('ponuda se zamenjuje dok čeka, a odgovor se pamti samo jednom', () => {
    const a = posaljiPonudu(POCETNI_TOKOVI, { cilj: 'x', od: ANA_ID, stvari: [{ naslov: 'A', vrsta: 'roba' }] })
    const b = posaljiPonudu(a.tokovi, { cilj: 'x', od: ANA_ID, stvari: [{ naslov: 'B', vrsta: 'roba' }] })
    expect(b.id).toBe(a.id)
    expect(b.tokovi.ponude).toHaveLength(1)
    expect(b.tokovi.ponude[0].stvari[0].naslov).toBe('B')
    const odbijena = odgovoriNaPonudu(b.tokovi, a.id, 'odbijena', 'Ne treba mi')
    expect(statusPonude(odbijena, a.id)).toBe('odbijena')
    // posle odgovora se ne može ponovo odgovoriti
    expect(statusPonude(odgovoriNaPonudu(odbijena, a.id, 'prihvacena'), a.id)).toBe('odbijena')
  })
  it('ponude Irene i Stefana stoje uz dečju jaknu samo u slobodnom režimu; odgovor na njih se pamti u „odgovori“', () => {
    expect(ponudeZaOglas(POCETNI_TOKOVI, 'markova-jakna', true).map((p) => p.od)).toEqual(['irena_zem80', 'stefan_nbg93'])
    expect(ponudeZaOglas(POCETNI_TOKOVI, 'markova-jakna', false)).toEqual([])
    const t = odgovoriNaPonudu(POCETNI_TOKOVI, 'jakna-irena', 'prihvacena')
    expect(ponudeZaOglas(t, 'markova-jakna', true).find((p) => p.id === 'jakna-irena')?.status).toBe('prihvacena')
  })
  it('razmena ide napred: dogovor → primopredaja → obavljena; pomoćni korisnici potvrđuju sami', () => {
    let t = pokreniRazmenu(POCETNI_TOKOVI, { id: 'r1', tip: 'razmena', cilj: 'markova-jakna', naslov: 'Dečja jakna', vlasnik: MARKO_ID, od: 'irena_zem80', stvari: [{ naslov: 'Roleri', vrsta: 'roba' }] })
    expect(nadjiRazmenu(t, 'r1')?.faza).toBe(1)
    // pre dogovora ne može da se potvrdi prijem
    expect(potvrdiPrijem(t, 'r1', MARKO_ID)).toBe(t)
    t = izaberiPredaju(t, 'r1', 'kurir')
    t = dogovorZavrsen(t, 'r1')
    expect(nadjiRazmenu(t, 'r1')).toMatchObject({ faza: 2, predaja: 'kurir' })
    t = potvrdiPrijem(t, 'r1', MARKO_ID)
    expect(nadjiRazmenu(t, 'r1')?.faza).toBe(3) // Irena (pomoćni korisnik) potvrđuje sama
    // ocena samo posle obavljene razmene i samo jednom
    const ocenjena = oceniRazmenu(t, 'r1', MARKO_ID, 5)
    expect(oceniRazmenu(ocenjena, 'r1', MARKO_ID, 3)).toBe(ocenjena)
    expect(ocenjena.razmene[0].ocene).toEqual([{ autor: MARKO_ID, o: 'irena_zem80', ocena: 5 }])
  })
  it('N-1: „za poene“ — poeni se oduzimaju odmah, a vlasniku dodeljuju tek posle potvrđenog prijema', () => {
    let t = pokreniRazmenu(POCETNI_TOKOVI, { id: 'p1', tip: 'poeni', cilj: 'x', naslov: 'Ranac', vlasnik: MARKO_ID, od: ANA_ID, stvari: [], poeni: 25, raspolozivo: 30 })
    expect(t.poeni).toEqual([{ k: ANA_ID, vrsta: 'potroseno', naslov: 'Ranac', iznos: 25 }])
    t = dogovorZavrsen(t, 'p1')
    expect(t.poeni).toHaveLength(1)
    t = potvrdiPrijem(t, 'p1', ANA_ID)
    expect(t.poeni).toHaveLength(2)
    expect(t.poeni[1]).toEqual({ k: MARKO_ID, vrsta: 'predaja', naslov: 'Ranac', iznos: 25 })
  })
  it('N-1: poklon — poene dobija darodavac tek kad primalac potvrdi prijem (primalac je pomoćni korisnik, a darodavac potvrđuje predaju)', () => {
    let t = pokreniRazmenu(POCETNI_TOKOVI, { id: 'g1', tip: 'poklon', cilj: 'x', naslov: 'Čizme', vlasnik: ANA_ID, od: 'luka_zem89', stvari: [], poeni: 10 })
    expect(t.poeni).toHaveLength(0)
    t = dogovorZavrsen(t, 'g1')
    t = potvrdiPrijem(t, 'g1', ANA_ID)
    expect(nadjiRazmenu(t, 'g1')?.faza).toBe(3)
    expect(t.poeni).toEqual([{ k: ANA_ID, vrsta: 'poklon', naslov: 'Čizme', iznos: 10 }])
  })
  it('zahtev za poklon se ne dvostruko beleži', () => {
    const t = zatraziPoklon(zatraziPoklon(POCETNI_TOKOVI, 'x', ANA_ID), 'x', ANA_ID)
    expect(t.zahtevi).toHaveLength(1)
  })
})

describe('operacije: ostali tokovi', () => {
  it('aukcija troši paket i ne može bez njega; ponude nove aukcije su unapred pripremljene', () => {
    const bez = pokreniAukciju(POCETNI_TOKOVI, 'x', 7)
    expect(bez).toBe(POCETNI_TOKOVI)
    const sa = pokreniAukciju(kupiPaket(POCETNI_TOKOVI, 3), 'x', 7)
    expect(sa.paketAukcija).toBe(2)
    expect(sa.aukcije).toEqual([{ oglas: 'x', dana: 7, korak: 1 }])
    expect(pokreniAukciju(sa, 'x', 7)).toBe(sa)
    expect(ponudeAukcije('mtb-bicikl-storm', 7)).toHaveLength(7)
  })
  it('dostava ide kroz faze do isporučeno i staje', () => {
    let t = naruciDostavu(POCETNI_TOKOVI, 'primer', 'mala', 1)
    for (let i = 0; i < 6; i++) t = sledecaFazaDostave(t)
    expect(t.dostava?.faza).toBe(3)
  })
  it('poslovno, akcija, moderacija, lista želja, pratim, pretrage i priče', () => {
    let t = izmeniPoslovno(POCETNI_TOKOVI, { plan: 'Majstor', otkazana: true })
    expect(t.poslovno).toMatchObject({ plan: 'Majstor', otkazana: true })
    t = prijaviZaAkciju(t, { k: ANA_ID, stvar: 'Bicikl', procena: 'Dobro', termin: 'utorak' })
    t = prijaviZaAkciju(t, { k: ANA_ID, stvar: 'Drugi bicikl', procena: 'Dobro', termin: 'sreda' })
    expect(t.prijaveAkcije).toHaveLength(1)
    t = odlukaPrijaveAkcije(t, 'luka_zem89', 'primljeno')
    t = prijaviOglas(prijaviOglas(t, 'retro-laptop', 'Prevara', ANA_ID), 'retro-laptop', 'Prevara', ANA_ID)
    expect(t.prijave).toHaveLength(1)
    t = odluciPrijavu(t, idPrijave('retro-laptop'), 'ukloni')
    t = dodajZelju(dodajZelju(t, ANA_ID, 'z-bicikl'), ANA_ID, 'z-bicikl')
    expect(t.zelje).toHaveLength(1)
    t = prebaciPratim(prebaciPratim(t, ANA_ID, 'marko_voz77'), ANA_ID, 'marko_voz77')
    expect(t.pratim).toHaveLength(0)
    t = sacuvajPretragu(t, ANA_ID, 'q=bicikl')
    t = objaviPricu(t, ANA_ID, 'Sutra delim jabuke.')
    t = ukloniOglas(t, 'retro-laptop')
    expect(proveriTokove(JSON.parse(JSON.stringify(t)))).toEqual(t)
  })
})

describe('provera oblika (sessionStorage)', () => {
  it('bogato stanje prolazi kroz JSON put i ceo zapis ostaje ispravan', () => {
    const t = bogato()
    expect(proveriTokove(JSON.parse(JSON.stringify(t)))).toEqual(t)
    expect(proveri({ ...POCETNO, tokovi: JSON.parse(JSON.stringify(t)) })).not.toBeNull()
    expect(imaTokova(t)).toBe(true)
    expect(imaTokova(POCETNI_TOKOVI)).toBe(false)
  })
  it('stari zapis (samo noviOglasi i omiljeno) dobija početne vrednosti novih polja', () => {
    const t = proveriTokove({ noviOglasi: [], omiljeno: [] })
    expect(t).toEqual(POCETNI_TOKOVI)
  })
  it('pokvarena polja se odbacuju', () => {
    const dobro = JSON.parse(JSON.stringify(bogato()))
    const pokvareno: Record<string, unknown>[] = [
      { ponude: [{ id: 'p', cilj: 'x', od: 'nepoznat', stvari: [{ naslov: 'A', vrsta: 'roba' }], status: 'ceka' }] },
      { ponude: [{ id: 'p', cilj: 'x', od: ANA_ID, stvari: [], status: 'ceka' }] },
      { ponude: [{ id: 'p', cilj: 'x', od: ANA_ID, stvari: [{ naslov: 'A', vrsta: 'zivotinja' }], status: 'ceka' }] },
      { razmene: [{ ...dobro.razmene[0], faza: 9 }] },
      { razmene: [{ ...dobro.razmene[0], tip: 'kupovina' }] },
      { poeni: [{ k: ANA_ID, vrsta: 'poklon', naslov: 'x', iznos: 7 }] },
      { poeni: [{ k: 'nepoznat', vrsta: 'poklon', naslov: 'x', iznos: 10 }] },
      { istaknuti: [{ oglas: 'markov-bicikl', dana: 5 }] },
      { istaknuti: [{ oglas: 'nema-takvog', dana: 7 }] },
      { paketAukcija: -1 },
      { paketAukcija: 99 },
      { dostava: { razmena: 'x', velicina: 'ogromna', termin: 0, faza: 0 } },
      { dostava: { razmena: 'x', velicina: 'mala', termin: 0, faza: 9 } },
      { poslovno: { ...dobro.poslovno, plan: 'Premium' } },
      { poslovno: { ...dobro.poslovno, radnoVreme: 9 } },
      { odluke: { 'p-x': 'obrisi' } },
      { statusiPrijava: { luka: 'mozda' } },
      { zelje: [{ k: ANA_ID, id: 'nepoznata' }] },
      { price: [{ k: ANA_ID, tekst: 'x'.repeat(161) }] },
      { izmene: { 'markov-bicikl': { nacin: 'poeni' } } },
      { aukcije: [{ oglas: 'markov-bicikl', dana: 2 }] },
    ]
    for (const p of pokvareno) expect(proveriTokove({ ...dobro, ...p }), JSON.stringify(p).slice(0, 80)).toBeNull()
  })
})

describe('svet() sa slobodnim tokovima: pravila koja uvek važe', () => {
  const t = bogato()
  // slobodni tokovi se probaju posle ulaska u demo (Ana je verifikovana: korak 1 završno ili kasnije)
  const stanja = svePozicije().filter((p, i) => i % 3 === 0 && (p.korak > 1 || p.n >= 3))
  it('zbirovi se slažu u svakom stanju priče uz bogate tokove', () => {
    for (const poz of stanja) {
      const s = svet(poz, t)
      expect(KATEGORIJE.reduce((z, k) => z + s.poKategoriji[k.id].ukupno, 0), `${poz.korak}.${poz.n}`).toBe(s.ukupno.ukupno)
      expect(s.nacin.razmena + s.nacin.poeni + s.nacin.poklon).toBe(s.ukupno.ukupno)
      expect(Object.values(s.tipovi).reduce((z, n) => z + n, 0)).toBe(s.nacin.razmena)
      expect(Object.values(s.poeniPoVrednosti).reduce((z, n) => z + n, 0)).toBe(s.nacin.poeni)
      expect(s.gradjanin + s.firma).toBe(s.ukupno.ukupno)
      expect(s.istaknuto.red + s.istaknuto.top + s.istaknuto.premium).toBe(s.istaknuto.ukupno)
      expect(s.oglasi.filter((o) => o.aukcija && o.istaknuto)).toHaveLength(0)
      expect(new Set(s.oglasi.map((o) => o.id)).size).toBe(s.oglasi.length)
    }
  })
  it('poeni nikad negativni, recenzije ≤ razmene i broj recenzija = zbir ocena, a istorija poena = stanje poena (svi korisnici)', () => {
    for (const poz of stanja) {
      const s = svet(poz, t)
      for (const k of Object.values(s.korisnici)) {
        expect(k.poeni, `${k.id} @ ${poz.korak}.${poz.n}`).toBeGreaterThanOrEqual(0)
        expect(k.recenzije).toBeLessThanOrEqual(k.razmene)
        expect(k.recenzije).toBe(brojRecenzija(k.ocene))
        expect(istorijaPoena(poz, k.id, t).reduce((z, x) => z + x.iznos, 0), `${k.id} @ ${poz.korak}.${poz.n}`).toBe(k.poeni)
      }
    }
  })
  it('obavljena razmena sklanja stvari iz aktivnih oglasa i povećava brojače; recenzija stoji na vrhu profila', () => {
    const poz = { korak: 1, n: 0, grana: 'lanac' as const }
    const bez = svet(poz, POCETNI_TOKOVI)
    const sa = svet(poz, t)
    expect(sa.oglasi.some((o) => o.id === 'markova-jakna')).toBe(false) // razmena obavljena
    expect(sa.razmenjenoStvari).toBe(bez.razmenjenoStvari + 2 + 1) // jakna + šolja, pa ranac „za poene“
    expect(sa.zavrseniSlobodno).toEqual(expect.arrayContaining(['markova-jakna', 'moj-ana_zvz84-1']))
    expect(recenzijeKorisnika(MARKO_ID, poz, 5, t)[0]).toMatchObject({ autor: ANA_ID, ocena: 4 })
    expect(recenzijeKorisnika(ANA_ID, poz, 5, t)[0]).toMatchObject({ autor: MARKO_ID, ocena: 5 })
  })
  it('isticanje i aukcija menjaju oznake oglasa, a uklonjeni oglas nestaje', () => {
    const ts = ukloniOglas(istakniOglas(kupiPaket(POCETNI_TOKOVI, 1), 'romani-ive-andrica-komplet', 14), 'strip-albumi-komplet')
    const s = svet({ korak: 1, n: 0, grana: 'lanac' }, pokreniAukciju(ts, 'rolsue-broj-38', 3))
    expect(s.oglasi.find((o) => o.id === 'romani-ive-andrica-komplet')?.istaknuto).toBe('red')
    expect(s.oglasi.find((o) => o.id === 'rolsue-broj-38')?.aukcija).toBe(true)
    expect(s.oglasi.some((o) => o.id === 'strip-albumi-komplet')).toBe(false)
    expect(s.aukcije).toBe(7)
  })
  it('moderacija: prijava koju je poslao gledalac čeka, pa se obrađuje (na čekanju − 1, obrađeno + 1)', () => {
    const poz = { korak: 1, n: 0, grana: 'lanac' as const }
    const prijavljena = prijaviOglas(POCETNI_TOKOVI, 'retro-laptop', 'Prevara', ANA_ID)
    expect(svet(poz, prijavljena).moderacija.naCekanju).toBe(svet(poz).moderacija.naCekanju + 1)
    const uklonjena = odluciPrijavu(prijavljena, idPrijave('retro-laptop'), 'ukloni')
    const m = svet(poz, uklonjena)
    expect(m.moderacija.naCekanju).toBe(svet(poz).moderacija.naCekanju)
    expect(m.moderacija.uklonjeno).toBe(svet(poz).moderacija.uklonjeno + 1)
    expect(m.oglasi.some((o) => o.id === 'retro-laptop')).toBe(false)
  })
  it('akcija u slobodnom toku: objavljena posle plaćanja, prijave se računaju iz redova (Primi / Odbij menjaju brojke)', () => {
    const poz = { korak: 1, n: 0, grana: 'lanac' as const }
    expect(svet(poz).akcija).toBeNull()
    let ts = izmeniPoslovno(POCETNI_TOKOVI, { akcija: true })
    const a0 = svet(poz, ts).akcija!
    expect([a0.prijave, a0.primljeno, a0.cekaProcenu, a0.odbijeno]).toEqual([12, 5, 4, 3])
    ts = odlukaPrijaveAkcije(odlukaPrijaveAkcije(prijaviZaAkciju(ts, { k: ANA_ID, stvar: 'Bicikl', procena: 'Dobro', termin: 'utorak' }), 'luka_zem89', 'primljeno'), 'vuk_vra86', 'odbijeno')
    const a1 = svet(poz, ts).akcija!
    expect([a1.prijave, a1.primljeno, a1.cekaProcenu, a1.odbijeno]).toEqual([13, 6, 3, 4])
    expect(a1.izdatiPopusti).toBe(a1.primljeno * 3000)
  })
  it('plan firme prati izbor u slobodnom toku', () => {
    expect(svet({ korak: 1, n: 0, grana: 'lanac' }).zupcanik.plan).toBe('Radnja')
    expect(svet({ korak: 1, n: 0, grana: 'lanac' }, izmeniPoslovno(POCETNI_TOKOVI, { plan: 'Majstor' })).zupcanik.plan).toBe('Majstor')
  })
})
