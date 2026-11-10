// Dorada 2 kroz reducer: red opcija (A2), usluge (B1), otkazivanje vlasnika (B5), nalozi (B2), lokacije i preporuke (B4, B6),
// beleške, kalendar (B7) i dokumenti iz rezervacije (A5, A6). Sve ide kroz iste radnje kao dugmad na ekranima.
import { describe, expect, it } from 'vitest'
import { mozeLiOdobriti, fazaRezervacije } from '../logika/rezervacije'
import { jeZiva, pozicija, stanjeOpcije } from '../logika/opcije'
import { POLJA_TEHNICKOG } from '../podaci/lokacije'
import type { Akcija, NacrtLokacije } from './akcije'
import { adresaZaUlogu, podaciZaDokument, predracunZa, sveLokacije, zauzetiDani, zahteviDelte } from './izvedeno'
import { reducer } from './reducer'
import { pocetnoStanje, RADNJE_SCENARIJA } from './scenario'
import { stanjeZaSkok } from './skokovi-za-testove'
import { VERZIJA_STANJA, type Stanje, type Uloga } from './tipovi'
import { jeIspravnoStanje } from './validacija'
import { nadjiLokaciju } from '../podaci/lokacije'

const kao = (s: Stanje, uloga: Uloga) => reducer(s, { tip: 'PROMENI_ULOGU', uloga })
const sigmaLoft = (s: Stanje) => s.zahtevi.find((z) => z.produkcijaId === 'sigma' && z.lokacijaId === 'industrijski-loft')!
const odluka = (s: Stanje, zahtevId: string) => {
  const z = s.zahtevi.find((x) => x.id === zahtevId)!
  return mozeLiOdobriti(z, s.zahtevi, zauzetiDani(s, nadjiLokaciju(z.lokacijaId)!), s.sati, s.opcije)
}
const potvrdi = (s: Stanje, a: Akcija) => { const n = reducer(s, a); expect(n).not.toBe(s); return n }

describe('A2 kroz reducer: prednost prve opcije', () => {
  it('slučaj 1: posle osporavanja Sigmin zahtev ne može da se odobri ("još 24 h"), a reducer odbija i silom', () => {
    const s = stanjeZaSkok('osporavanje', false).stanje
    const zS = sigmaLoft(s)
    expect(odluka(s, zS.id)).toEqual({ moze: false, razlog: 'Čeka se odluka prve opcije (Produkcija Delta), još 24 h' })
    expect(reducer(s, { tip: 'ODOBRI_ZAHTEV', zahtevId: zS.id })).toBe(s)
  })
  it('slučaj 2: Sigmin zahtev je pokrenuo osporavanje Deltine prve opcije (rok 24 h)', () => {
    const s = stanjeZaSkok('osporavanje', false).stanje
    const delta = s.opcije.find((o) => o.lokacijaId === 'industrijski-loft' && o.produkcijaId === 'delta')!
    expect(stanjeOpcije(delta, s.sati)).toBe('osporena')
    expect(delta.osporavanje?.rok).toBe(24)
  })
  it('slučaj 3: Delta potvrdi → vlasnik odobri Deltu → Sigmin zahtev je automatski odbijen sa razlogom, a njena opcija otpuštena', () => {
    let s = stanjeZaSkok('zahtev', false).stanje
    const zS = sigmaLoft(s)
    const zD = zahteviDelte(s).find((z) => z.lokacijaId === 'industrijski-loft')!
    // dok Delta čeka odluku, Sigma i dalje ne može
    expect(odluka(s, zS.id).razlog).toContain('Prednost ima zahtev Produkcija Delta')
    s = potvrdi(s, { tip: 'ODOBRI_ZAHTEV', zahtevId: zD.id })
    const posle = s.zahtevi.find((z) => z.id === zS.id)!
    expect(posle.stanje).toBe('odbijen')
    expect(posle.razlog).toBe('Termin je potvrđen produkciji sa prvom opcijom')
    expect(s.opcije.filter((o) => o.produkcijaId === 'sigma' && o.lokacijaId === 'industrijski-loft').every((o) => !jeZiva(o, s.sati))).toBe(true)
    expect(s.dnevnik.some((d) => d.tekst.includes('automatski odbijen'))).toBe(true)
    // drugi pokušaj odobrenja druge produkcije ne menja stanje
    expect(reducer(s, { tip: 'ODOBRI_ZAHTEV', zahtevId: zS.id })).toBe(s)
  })
  it('slučaj 4a: Delta odustane (otpusti opciju) → Sigma je prva i vlasnik može da je odobri', () => {
    let s = stanjeZaSkok('osporavanje', false).stanje
    const delta = s.opcije.find((o) => o.lokacijaId === 'industrijski-loft' && o.produkcijaId === 'delta')!
    s = potvrdi(s, { tip: 'OTPUSTI_OPCIJU', opcijaId: delta.id })
    expect(odluka(s, sigmaLoft(s).id).moze).toBe(true)
    s = potvrdi(s, { tip: 'ODOBRI_ZAHTEV', zahtevId: sigmaLoft(s).id })
    expect(sigmaLoft(s).stanje).toBe('odobren')
  })
  it('slučaj 4b: PREMOTAJ 24 h bez potvrde → Deltina opcija je istekla, Sigma može (a na 23 h još ne)', () => {
    let s = stanjeZaSkok('osporavanje', false).stanje
    s = reducer(s, { tip: 'PREMOTAJ', sati: 23 })
    expect(odluka(s, sigmaLoft(s).id).moze).toBe(false)
    s = reducer(s, { tip: 'PREMOTAJ', sati: 1 })
    expect(odluka(s, sigmaLoft(s).id).moze).toBe(true)
    s = potvrdi(s, { tip: 'ODOBRI_ZAHTEV', zahtevId: sigmaLoft(s).id })
    expect(sigmaLoft(s).stanje).toBe('odobren')
  })
  it('Deltin zahtev za halu (Sigma ima prvu opciju) pokreće osporavanje Sigmine opcije; posle 24 h Delta je prva', () => {
    let s = stanjeZaSkok('opcija', false).stanje
    const hala = s.opcije.find((o) => o.lokacijaId === 'brutalisticka-hala' && o.produkcijaId === 'delta')!
    expect(pozicija(s.opcije, hala, s.sati)).toBe(2)
    s = potvrdi(s, { tip: 'POSALJI_ZAHTEV', lokacijaId: 'brutalisticka-hala', termin: hala.termin, razred: 'do30', prekovremeniSati: 0 })
    expect(s.opcije.find((o) => o.id === 'o-sigma-hala')?.osporavanje?.rok).toBe(24)
    const zD = zahteviDelte(s).find((z) => z.lokacijaId === 'brutalisticka-hala')!
    expect(odluka(s, zD.id).moze).toBe(false)
    s = reducer(s, { tip: 'PREMOTAJ', sati: 24 })
    expect(odluka(s, zD.id).moze).toBe(true)
  })
})

describe('B1: predračun sa uslugama (skok "Predračun sa uslugama")', () => {
  const s = stanjeZaSkok('usluge', false).stanje
  it('brief sa izborom van kataloga je napravio predračun od 50 € = 5.850,00 RSD, koji je admin potvrdio', () => {
    const izbor = s.predracuni.find((p) => p.vrsta === 'izbor-van-kataloga')!
    expect(izbor.ukupnoPara).toBe(585000)
    expect(izbor.uplataPotvrdjena).not.toBeNull()
    expect(izbor.kupacId).toBe('delta')
  })
  it('predračun rezervacije: 135 − 50 + 70 = 155,00 € = 18.135,00 RSD, sa redom "Uračunat izbor van kataloga" i domaćinom', () => {
    const p = s.predracuni.find((x) => x.vrsta === 'naknada')!
    expect(p.umanjenjeCenti).toBe(5000)
    expect(p.domacinCenti).toBe(7000)
    expect(p.ukupnoCenti).toBe(15500)
    expect(p.ukupnoPara).toBe(1813500)
    expect(p.kreditIzPredracunaId).toBe(s.predracuni.find((x) => x.vrsta === 'izbor-van-kataloga')!.id)
  })
  it('glavna priča ostaje bez usluga: 135,00 € / 15.795,00 RSD', () => {
    const p = stanjeZaSkok('odobrio', false).stanje.predracuni[0]
    expect(p.ukupnoCenti).toBe(13500)
    expect(p.ukupnoPara).toBe(1579500)
    expect(p.domacinCenti).toBe(0)
    expect(p.umanjenjeCenti).toBe(0)
  })
  it('izbor van kataloga NIJE uračunat ako 50 € nije plaćeno pre izdavanja predračuna rezervacije', () => {
    let n = pocetnoStanje()
    for (const r of [RADNJE_SCENARIJA.briefUsluge, RADNJE_SCENARIJA.izbor, RADNJE_SCENARIJA.opcijaLoft, RADNJE_SCENARIJA.opcijaHala,
      RADNJE_SCENARIJA.osporavanje, RADNJE_SCENARIJA.zahtevDomacin, RADNJE_SCENARIJA.odobri]) n = reducer(n, r(n))
    const p = n.predracuni.find((x) => x.vrsta === 'naknada')!
    expect(p.umanjenjeCenti).toBe(0)
    expect(p.ukupnoCenti).toBe(13500 + 7000) // 135 € + domaćin 70 €
  })
  it('fotografisanje: vlasnik dobija predračun od 75 € = 8.775,00 RSD, admin ga potvrđuje kao uslugu', () => {
    let n = kao(pocetnoStanje(), 'vlasnik')
    n = potvrdi(n, { tip: 'POSALJI_LOKACIJU', lokacija: nacrtLokacije({ fotografisanje: true }) })
    const p = n.predracuni.find((x) => x.vrsta === 'fotografisanje')!
    expect(p.kupacId).toBe('alfa')
    expect(p.prijavaId).toBe(n.prijaveLokacija[0].id)
    expect(p.ukupnoPara).toBe(877500)
    n = potvrdi(n, { tip: 'POTVRDI_UPLATU', predracunId: p.id })
    expect(n.predracuni.find((x) => x.id === p.id)?.uplataPotvrdjena).not.toBeNull()
    expect(reducer(n, { tip: 'POTVRDI_UPLATU', predracunId: p.id })).toBe(n) // drugi put ništa
  })
  it('domaćin nije deo osnovice za naknadu: naknada je ista sa i bez domaćina', () => {
    const bez = stanjeZaSkok('odobrio', false).stanje.predracuni[0]
    const sa = s.predracuni.find((x) => x.vrsta === 'naknada')!
    expect(sa.naknadaCenti).toBe(bez.naknadaCenti)
    expect(sa.osnovicaCenti).toBe(bez.osnovicaCenti)
  })
})

describe('B5: vlasnik otkazuje plaćenu rezervaciju', () => {
  const placeno = () => stanjeZaSkok('uplata', false).stanje
  it('rezervacija dobija stanje "otkazao vlasnik", naknada se vraća (izmišljeno), termin se oslobađa', () => {
    let s = placeno()
    const z = zahteviDelte(s)[0]
    expect(fazaRezervacije(z, predracunZa(s, z.id), s.sati)).toBe('placeno')
    s = potvrdi(s, { tip: 'OTKAZI_REZERVACIJU_VLASNIK', zahtevId: z.id })
    const posle = s.zahtevi.find((x) => x.id === z.id)!
    expect(posle.stanje).toBe('otkazao-vlasnik')
    expect(posle.otkazan).toBe(s.sati)
    expect(fazaRezervacije(posle, predracunZa(s, z.id), s.sati)).toBe('otkazao-vlasnik')
    expect(predracunZa(s, z.id)?.povracaj).toEqual({ sati: s.sati, iznosPara: 1579500 })
    // termin je ponovo slobodan za novi zahtev
    const nov = reducer(s, { tip: 'POSALJI_ZAHTEV', lokacijaId: 'industrijski-loft', termin: z.termin, razred: 'do30', prekovremeniSati: 0 })
    expect(nov).not.toBe(s)
  })
  it('adresa se ponovo zatvara za produkciju (i partnera), a vlasnik i admin je i dalje vide', () => {
    let s = placeno()
    expect(adresaZaUlogu(kao(s, 'produkcija'), 'industrijski-loft').nivo).toBe('sve')
    s = reducer(s, { tip: 'OTKAZI_REZERVACIJU_VLASNIK', zahtevId: zahteviDelte(s)[0].id })
    const p = adresaZaUlogu(kao(s, 'produkcija'), 'industrijski-loft')
    expect(p.nivo).toBe('zona')
    expect(p.razlog).toBe('Rezervacija je otkazana; adresa više nije dostupna.')
    expect(adresaZaUlogu(kao(s, 'partner'), 'industrijski-loft').nivo).toBe('zona')
    expect(adresaZaUlogu(kao(s, 'admin'), 'industrijski-loft').nivo).toBe('sve')
  })
  it('može samo jednom, samo plaćena i samo pre termina; neplaćena se ne otkazuje', () => {
    let s = placeno()
    const id = zahteviDelte(s)[0].id
    const odobrio = stanjeZaSkok('odobrio', false).stanje
    expect(reducer(odobrio, { tip: 'OTKAZI_REZERVACIJU_VLASNIK', zahtevId: zahteviDelte(odobrio)[0].id })).toBe(odobrio)
    const kasno = reducer(s, { tip: 'PREMOTAJ', sati: 14 * 24 })
    expect(reducer(kasno, { tip: 'OTKAZI_REZERVACIJU_VLASNIK', zahtevId: id })).toBe(kasno)
    s = potvrdi(s, { tip: 'OTKAZI_REZERVACIJU_VLASNIK', zahtevId: id })
    expect(reducer(s, { tip: 'OTKAZI_REZERVACIJU_VLASNIK', zahtevId: id })).toBe(s)
    expect(reducer(s, { tip: 'POTVRDI_UPLATU', predracunId: s.predracuni[0].id })).toBe(s)
  })
  it('skok "Vlasnik otkazao" daje isto stanje kao ručni put', () => {
    const skok = stanjeZaSkok('otkazao', false).stanje
    let s = placeno()
    s = reducer(s, { tip: 'OTKAZI_REZERVACIJU_VLASNIK', zahtevId: zahteviDelte(s)[0].id })
    expect(skok).toEqual({ ...s, uloga: 'produkcija' })
  })
})

describe('B2: nalozi na čekanju', () => {
  it('početno stanje ima tri izmišljena naloga (firma, preduzetnik, vlasnik fizičko lice sa dokazom), PIB/MB su sve nule', () => {
    const { nalozi } = pocetnoStanje()
    expect(nalozi.map((n) => n.vrsta)).toEqual(['firma', 'preduzetnik', 'fizicko-vlasnik'])
    expect(nalozi[0].pib).toBe('000000000')
    expect(nalozi[0].mb).toBe('00000000')
    expect(nalozi[2].pib).toBeNull()
    expect(nalozi[2].dokaz).toBeTruthy()
    for (const n of nalozi) expect(n.prihvaceno.join(' ')).toContain('v0.1')
  })
  it('admin odobrava ili odbija samo nalog koji čeka; odluka se ne menja drugi put', () => {
    let s = pocetnoStanje()
    s = potvrdi(s, { tip: 'ODOBRI_NALOG', nalogId: 'n-firma' })
    s = potvrdi(s, { tip: 'ODBIJ_NALOG', nalogId: 'n-preduzetnik' })
    expect(s.nalozi.map((n) => n.stanje)).toEqual(['odobren', 'odbijen', 'ceka'])
    expect(reducer(s, { tip: 'ODBIJ_NALOG', nalogId: 'n-firma' })).toBe(s)
    expect(reducer(s, { tip: 'ODOBRI_NALOG', nalogId: 'n-preduzetnik' })).toBe(s)
    expect(reducer(s, { tip: 'ODOBRI_NALOG', nalogId: 'ne-postoji' })).toBe(s)
  })
})

const nacrtLokacije = (p: Partial<NacrtLokacije> = {}): NacrtLokacije => ({
  naziv: 'Probni podrum', tip: 'Studio', opstina: 'Vračar', kvadratura: 80,
  tehnicki: Object.fromEntries(POLJA_TEHNICKOG.map((f) => [f.kljuc, f.primer])),
  cenovnik: { do10: 20000, do30: 25000, preko30: null, satiDana: 10, pripremaCenti: 12500, prekovremeniCenti: 3000, najkrace: '1 snimajući dan', troskovi: '' },
  brojFotografija: 10, dokaz: 'dokaz-primer.pdf', fotografisanje: false, ...p,
})

describe('B6/B4: lokacije na čekanju, objava i preporuke partnera', () => {
  it('vlasnikova prijava stiže adminu; "Odobri objavu" radi samo kad su ispunjena sva tri uslova; posle toga je lokacija u katalogu', () => {
    let s = kao(pocetnoStanje(), 'vlasnik')
    s = potvrdi(s, { tip: 'POSALJI_LOKACIJU', lokacija: nacrtLokacije({ brojFotografija: 4 }) })
    const id = s.prijaveLokacija[0].id
    expect(sveLokacije(s)).toHaveLength(10)
    expect(reducer(s, { tip: 'ODOBRI_OBJAVU', prijavaId: id })).toBe(s) // samo 4 fotografije
    s = potvrdi(s, { tip: 'POSALJI_LOKACIJU', lokacija: nacrtLokacije() })
    const ok = s.prijaveLokacija[1].id
    s = potvrdi(s, { tip: 'ODOBRI_OBJAVU', prijavaId: ok })
    expect(s.prijaveLokacija[1].stanje).toBe('objavljena')
    expect(sveLokacije(s)).toHaveLength(11)
    expect(sveLokacije(s).at(-1)?.nova).toBe(true)
    expect(reducer(s, { tip: 'ODOBRI_OBJAVU', prijavaId: ok })).toBe(s) // drugi put ništa
    s = potvrdi(s, { tip: 'ODBIJ_PRIJAVU', prijavaId: id })
    expect(s.prijaveLokacija[0].stanje).toBe('odbijena')
  })
  it('prijava ne čuva adresu ni nepoznata polja', () => {
    let s = kao(pocetnoStanje(), 'vlasnik')
    const nacrt = nacrtLokacije()
    nacrt.tehnicki = { ...nacrt.tehnicki, adresa: 'Ulica Primera 12', struja: 'Trofazna' }
    s = potvrdi(s, { tip: 'POSALJI_LOKACIJU', lokacija: nacrt })
    expect(Object.keys(s.prijaveLokacija[0].tehnicki)).not.toContain('adresa')
    expect(JSON.stringify(s)).not.toContain('Ulica Primera 12')
  })
  it('nevažeći cenovnik (bez ijedne cene) se odbija', () => {
    const s = kao(pocetnoStanje(), 'vlasnik')
    const prazno = nacrtLokacije({ cenovnik: { ...nacrtLokacije().cenovnik, do10: null, do30: null, preko30: null } })
    expect(reducer(s, { tip: 'POSALJI_LOKACIJU', lokacija: prazno })).toBe(s)
  })
  it('preporuka partnera se ne prima bez saglasnosti vlasnika; sa saglasnošću stiže adminu, ali ne može da se objavi dok vlasnik ne dopuni', () => {
    let s = kao(pocetnoStanje(), 'partner')
    const p = { naziv: 'Stara štamparija', tip: 'Hala', opstina: 'Palilula', vlasnikNaziv: 'Vlasnik (izmišljeno)', saglasnostVlasnika: false }
    expect(reducer(s, { tip: 'POSALJI_PREPORUKU', preporuka: p })).toBe(s)
    s = potvrdi(s, { tip: 'POSALJI_PREPORUKU', preporuka: { ...p, saglasnostVlasnika: true } })
    expect(s.prijaveLokacija[0]).toMatchObject({ izvor: 'partner', stanje: 'ceka', saglasnostVlasnika: true })
    expect(reducer(s, { tip: 'ODOBRI_OBJAVU', prijavaId: s.prijaveLokacija[0].id })).toBe(s)
    s = potvrdi(s, { tip: 'ODBIJ_PRIJAVU', prijavaId: s.prijaveLokacija[0].id })
    expect(s.prijaveLokacija[0].stanje).toBe('odbijena')
  })
})

describe('B6: beleške o sporovima', () => {
  it('beleška se čuva uz rezervaciju; prazna, preduga i za nepostojeću rezervaciju se odbijaju', () => {
    const s = stanjeZaSkok('uplata', false).stanje
    const id = zahteviDelte(s)[0].id
    const n = potvrdi(s, { tip: 'DODAJ_BELESKU', zahtevId: id, tekst: '  Poziv vlasniku  ' })
    expect(n.beleske).toEqual([expect.objectContaining({ zahtevId: id, tekst: 'Poziv vlasniku' })])
    expect(reducer(s, { tip: 'DODAJ_BELESKU', zahtevId: id, tekst: '   ' })).toBe(s)
    expect(reducer(s, { tip: 'DODAJ_BELESKU', zahtevId: id, tekst: 'x'.repeat(501) })).toBe(s)
    expect(reducer(s, { tip: 'DODAJ_BELESKU', zahtevId: 'z-nema', tekst: 'a' })).toBe(s)
    expect(reducer(s, { tip: 'DODAJ_BELESKU', zahtevId: id, tekst: 'x'.repeat(500) })).not.toBe(s)
  })
})

describe('B7: blokiranje dana', () => {
  it('blokiran dan zatvara termin: ni opcija ni zahtev na taj dan; odblokiranje ga vraća', () => {
    let s = pocetnoStanje()
    const T = { priprema: [], snimanje: ['2026-11-18'] }
    s = potvrdi(s, { tip: 'BLOKIRAJ_DAN', lokacijaId: 'industrijski-loft', dan: '2026-11-18' })
    expect(s.blokiraniDani['industrijski-loft']).toEqual(['2026-11-18'])
    s = reducer(s, { tip: 'POSALJI_BRIEF', brief: stanjeZaSkok('izbor', false).stanje.briefovi.at(-1)! })
    expect(reducer(s, { tip: 'TRAZI_OPCIJU', lokacijaId: 'industrijski-loft', termin: T })).toBe(s)
    expect(reducer(s, { tip: 'POSALJI_ZAHTEV', lokacijaId: 'industrijski-loft', termin: T, razred: 'do30', prekovremeniSati: 0 })).toBe(s)
    s = potvrdi(s, { tip: 'ODBLOKIRAJ_DAN', lokacijaId: 'industrijski-loft', dan: '2026-11-18' })
    expect(reducer(s, { tip: 'TRAZI_OPCIJU', lokacijaId: 'industrijski-loft', termin: T })).not.toBe(s)
  })
  it('ne blokira se dan pod opcijom/zahtevom/rezervacijom, ni unapred zauzet dan; unapred zauzeti dan se ne odblokira', () => {
    const s = stanjeZaSkok('zahtev', false).stanje
    expect(reducer(s, { tip: 'BLOKIRAJ_DAN', lokacijaId: 'industrijski-loft', dan: '2026-11-17' })).toBe(s)
    expect(reducer(s, { tip: 'BLOKIRAJ_DAN', lokacijaId: 'industrijski-loft', dan: '2026-11-10' })).toBe(s)
    expect(reducer(s, { tip: 'ODBLOKIRAJ_DAN', lokacijaId: 'industrijski-loft', dan: '2026-11-10' })).toBe(s)
    expect(reducer(s, { tip: 'BLOKIRAJ_DAN', lokacijaId: 'industrijski-loft', dan: 'sutra' })).toBe(s)
  })
  it('blokiran dan važi i pri odobravanju zahteva koji je već stigao', () => {
    // zahtev za 17. 11. čeka, pa se (silom, kroz stanje) 17. 11. blokira: vlasnik ne može da odobri
    const s = stanjeZaSkok('zahtev', false).stanje
    const blokirano: Stanje = { ...s, blokiraniDani: { 'industrijski-loft': ['2026-11-17'] } }
    const zD = zahteviDelte(s)[0]
    expect(reducer(blokirano, { tip: 'ODOBRI_ZAHTEV', zahtevId: zD.id })).toBe(blokirano)
  })
})

describe('A5/A6: dokumenti iz rezervacije — pravo posmatrača', () => {
  const placeno = () => stanjeZaSkok('uplata', false).stanje
  it('pre uplate nema popunjenih podataka ni za produkciju', () => {
    const s = stanjeZaSkok('odobrio', false).stanje
    expect(podaciZaDokument(s, zahteviDelte(s)[0].id)).toBeNull()
  })
  it('posle uplate: produkcija, vlasnik te lokacije i admin dobijaju podatke; partner i drugi vlasnik ne', () => {
    const s = placeno()
    const id = zahteviDelte(s)[0].id
    expect(podaciZaDokument(kao(s, 'produkcija'), id)?.lokacijaNaziv).toBe('Industrijski loft')
    expect(podaciZaDokument(kao(s, 'admin'), id)).not.toBeNull()
    const alfa = reducer(kao(s, 'vlasnik'), { tip: 'PROMENI_PRIKAZ_VLASNIKA', prikaz: 'pravno' })
    expect(podaciZaDokument(alfa, id)).not.toBeNull()
    const ivan = reducer(kao(s, 'vlasnik'), { tip: 'PROMENI_PRIKAZ_VLASNIKA', prikaz: 'fizicko' })
    expect(podaciZaDokument(ivan, id)).toBeNull()
    expect(podaciZaDokument(kao(s, 'partner'), id)).toBeNull()
  })
  it('tuđa rezervacija i nepostojeći ID daju null', () => {
    const s = placeno()
    expect(podaciZaDokument(kao(s, 'produkcija'), sigmaLoft(s).id)).toBeNull()
    expect(podaciZaDokument(s, 'z-nema')).toBeNull()
    expect(podaciZaDokument(s, null)).toBeNull()
  })
  it('posle otkazivanja vlasnika dokumenti se vraćaju na opšti primer', () => {
    let s = placeno()
    const id = zahteviDelte(s)[0].id
    s = reducer(s, { tip: 'OTKAZI_REZERVACIJU_VLASNIK', zahtevId: id })
    expect(podaciZaDokument(kao(s, 'produkcija'), id)).toBeNull()
  })
})

describe('validacija sačuvanog stanja (verzija 4)', () => {
  it('početno stanje je ispravno i nosi verziju 3', () => {
    expect(VERZIJA_STANJA).toBe(4)
    expect(jeIspravnoStanje(pocetnoStanje())).toBe(true)
  })
  it('stanje stare verzije 2 se odbacuje (učitava se početni scenario)', () => {
    expect(jeIspravnoStanje({ ...pocetnoStanje(), verzija: 3 })).toBe(false)
  })
  it('pokvaren "blokiraniDani" se odbija', () => {
    expect(jeIspravnoStanje({ ...pocetnoStanje(), blokiraniDani: [] })).toBe(false)
    expect(jeIspravnoStanje({ ...pocetnoStanje(), blokiraniDani: { x: 'nije-niz' } })).toBe(false)
    expect(jeIspravnoStanje({ ...pocetnoStanje(), blokiraniDani: { x: ['danas'] } })).toBe(false)
    expect(jeIspravnoStanje({ ...pocetnoStanje(), blokiraniDani: undefined })).toBe(false)
    expect(jeIspravnoStanje({ ...pocetnoStanje(), blokiraniDani: { x: ['2026-11-18'] } })).toBe(true)
  })
  it('nedostaju novi nizovi ili predračun bez dozvoljene vrste/iznosa u parama → odbija se', () => {
    expect(jeIspravnoStanje({ ...pocetnoStanje(), nalozi: undefined })).toBe(false)
    expect(jeIspravnoStanje({ ...pocetnoStanje(), beleske: 'x' })).toBe(false)
    const s = stanjeZaSkok('odobrio', false).stanje
    expect(jeIspravnoStanje(s)).toBe(true)
    expect(jeIspravnoStanje({ ...s, predracuni: [{ ...s.predracuni[0], vrsta: 'nesto' }] })).toBe(false)
    expect(jeIspravnoStanje({ ...s, predracuni: [{ ...s.predracuni[0], ukupnoPara: 'x' }] })).toBe(false)
  })
  it('svaki skok daje ispravno stanje i ispravan link', () => {
    for (const id of ['pocetak', 'izbor', 'opcija', 'osporavanje', 'zahtev', 'odobrio', 'uplata', 'usluge', 'otkazao']) {
      const { stanje, ruta } = stanjeZaSkok(id, false)
      expect(jeIspravnoStanje(stanje), id).toBe(true)
      expect(ruta, id).not.toContain('undefined')
    }
  })
  it('na svakom skoku pre uplate (i posle otkazivanja) adresa je zatvorena za produkciju i partnera', () => {
    for (const id of ['pocetak', 'izbor', 'opcija', 'osporavanje', 'zahtev', 'odobrio', 'usluge', 'otkazao']) {
      const { stanje } = stanjeZaSkok(id, false)
      for (const u of ['produkcija', 'partner'] as const) {
        for (const l of ['industrijski-loft', 'brutalisticka-hala', 'foto-studio']) expect(adresaZaUlogu(kao(stanje, u), l).nivo, `${id}/${u}/${l}`).toBe('zona')
      }
    }
  })
})
