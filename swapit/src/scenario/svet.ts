// IZVOD: stanje sveta za (pozicija priče, tokovi). Jedina funkcija iz koje ekrani čitaju oglase, brojače, poene i recenzije.
// Ulaz su fajlovi u scenario/ (oglasi, korisnici, firme…), izvod je svet(). Ekrani NE uvoze ulazne fajlove direktno (brava u testovima).
// Celi brojevi; prosek ocene se zaokružuje tek u prikazu (format.ts).
import { odradjene } from '../prica/koraci'
import type { Poz, Ugao } from '../prica/tipovi'
import type { Tokovi } from '../tokovi/tokovi'
import { POCETNI_TOKOVI } from '../tokovi/tokovi'
import { CENE, POCETNI_POENI, RAZMENJENO_STVARI_POCETAK, VREDNOSTI_POENA, type VrednostPoena } from './cene'
import { KATEGORIJE } from './kategorije'
import { imaKljuc, uzmi } from './kljuc'
import { ANA_ID, JOVANA_ID, KORISNICI, MARKO_ID, brojRecenzija, zbirOcena, type Ocene } from './korisnici'
import { ANIN_PS2, BICIKL_ID, OGLASI_BEOGRAD, OGLASI_REGION, PRIJAVLJENI_OGLAS, PS2_ID, UDZBENICI_ID, jeRezervisan, type Oglas } from './oglasi'
import { KOMENTAR_PO_OCENI, RECENZIJE_PRICE } from './prica'
import { poslednjeRecenzije, type Recenzija } from './recenzije'
import { DATUM_RANIJE_RAZMENE, demoDatum, type Datum } from './datumi'
import { PRIJAVE_AKCIJE, PRIJAVE_NA_CEKANJU, POENI_POCETNI_OPIS, POENI_RANIJE_OPIS, poklonDodelaOpis, potrosnjaOpis, predataStvarDodelaOpis, type StatusPrijave } from './poslovno'
import { OPSTINA_PO_ID, type OpstinaId } from './opstine'
import { FIRMA_PO_ID } from './firme'
import { AKCIJA, MODERACIJA, ZUPCANIK, ZUPCANIK_ID } from './tabla'
import { AUKCIJE_OGLASI } from './slobodno'

/** Vrednost u poenima: Anin PlayStation 2 (poklon) i Markov bicikl (za poene), UX 7.5. */
const POENI_PS2 = ANIN_PS2.vrednostPoena ?? 0
const BICIKL = OGLASI_BEOGRAD.find((o) => o.id === BICIKL_ID)
const POENI_BICIKL = BICIKL?.vrednostPoena ?? 0
const BICIKL_NASLOV = BICIKL?.naslov ?? ''

export type BrojPoVrsti = { ukupno: number; roba: number; usluge: number; ideje: number }

export type KorisnikSvet = {
  id: string
  verifikovan: boolean
  poeni: number
  razmene: number
  ocene: Ocene
  recenzije: number
  zbirOcena: number
}

export type RedAkcije = { korisnik: string; stvar: string; procena: string; status: StatusPrijave; /** Prvi red je red iz priče (radnja 9.primi). */ izPrice: boolean }

export type Svet = {
  /** Aktivni oglasi u Beogradu (priča + slobodni tokovi). */
  oglasi: Oglas[]
  /** Oglasi u regionu (ne ulaze u brojače Beograda). */
  region: Oglas[]
  poKategoriji: Record<string, BrojPoVrsti>
  ukupno: BrojPoVrsti
  nacin: { razmena: number; poeni: number; poklon: number }
  poeniPoVrednosti: Record<VrednostPoena, number>
  /** Tip razmene (nudim → tražim), samo oglasi „za razmenu“: ključevi rr, ru, ri, ur, uu, ui, ir, iu, ii. */
  tipovi: Record<string, number>
  gradjanin: number
  firma: number
  istaknuto: { red: number; top: number; premium: number; ukupno: number }
  aukcije: number
  korisnici: Record<string, KorisnikSvet>
  razmenjenoStvari: number
  znackaPaketa: { ana: number; marko: number }
  moderacija: { naCekanju: number; obradjeno: number; uklonjeno: number }
  zupcanik: typeof ZUPCANIK & { ctrDesetine: number; oglasa: number; plan: 'Majstor' | 'Radnja' }
  /** Akcija „staro za novo“: postoji od koraka 9 (priča) ili kad je prodavnica objavi u slobodnom toku. Redovi su isti izvor za A4 i A6. */
  akcija: null | { prijave: number; primljeno: number; cekaProcenu: number; odbijeno: number; izdatiPopusti: number; naknada: number; pregledi: number; redovi: RedAkcije[] }
  /** Oglasi koji su završeni kroz slobodnu razmenu (obavljena razmena, poklon, „za poene“); više nisu aktivni (O6 „Završeni“). */
  zavrseniSlobodno: string[]
}

const TIPOVI = ['rr', 'ru', 'ri', 'ur', 'uu', 'ui', 'ir', 'iu', 'ii']
const slovo = (v: string) => (v === 'roba' ? 'r' : v === 'usluga' ? 'u' : 'i')

/** Tip razmene oglasa „za razmenu“ kao dvoslovni ključ (nudim → tražim). */
export const tipRazmene = (o: Oglas): string | null => (o.nacin === 'razmena' && o.trazi ? slovo(o.vrsta) + slovo(o.trazi) : null)

function oglasiPrice(poz: Poz, uradjeno: Set<string>): Oglas[] {
  let lista = OGLASI_BEOGRAD.slice()
  if (uradjeno.has('2.o3')) lista.push(ANIN_PS2)
  if (poz.grana === 'lanac') {
    // posle tri potvrde primopredaje tri stvari su „završene“ i izlaze iz aktivnih oglasa
    if (uradjeno.has('8.pot.jovana')) lista = lista.filter((o) => ![BICIKL_ID, PS2_ID, UDZBENICI_ID].includes(o.id))
    return lista
  }
  // račva „za poene“ (6R–8R)
  if (poz.korak >= 6) lista = lista.map((o) => (o.id === BICIKL_ID ? { ...o, nacin: 'poeni' as const, poeni: 50 as VrednostPoena, trazi: undefined } : o))
  if (uradjeno.has('7R.uredi')) lista = lista.map((o) => (o.id === PS2_ID ? { ...o, nacin: 'poklon' as const, trazi: undefined } : o))
  // N-1: poklon je gotov tek kad primalac potvrdi prijem (7R.prijem), ne kad ga Ana potvrdi
  if (uradjeno.has('7R.prijem')) lista = lista.filter((o) => o.id !== PS2_ID)
  if (uradjeno.has('8R.pot.marko')) lista = lista.filter((o) => o.id !== BICIKL_ID)
  return lista
}

/** Poeni, razmene i ocene jednog korisnika: priča + slobodni tokovi (N-1: poene dodeljuje i oduzima SWAPIT, nikad korisnik korisniku). */
function korisniciSveta(poz: Poz, u: Set<string>, tokovi: Tokovi): Record<string, KorisnikSvet> {
  const lanac = poz.grana === 'lanac'
  const izlaz: Record<string, KorisnikSvet> = {}
  for (const k of KORISNICI) {
    let poeni = k.poeni
    let razmene = k.razmene
    const ocene: Ocene = { ...k.ocene }
    let verifikovan = k.verifikovan
    if (k.id === ANA_ID) {
      verifikovan = u.has('1.r4')
      poeni = verifikovan ? POCETNI_POENI : 0
      if (u.has('7R.prijem')) {
        poeni += POENI_PS2
        razmene += 1
      }
      if (u.has('8R.uzmi')) poeni -= POENI_BICIKL
      if (u.has('8R.pot.marko')) razmene += 1
      if (lanac && u.has('8.pot.jovana')) razmene += 1
      if (lanac && u.has('8.x11')) ocene[5] += 1
    }
    if (k.id === MARKO_ID) {
      // SWAPIT dodeljuje poene Marku za predatu stvar tek kad Ana potvrdi prijem
      if (u.has('8R.pot.ana')) poeni += POENI_BICIKL
      if (u.has('8R.pot.marko')) razmene += 1
      if (u.has('8R.x11')) ocene[5] += 1
      if (lanac && u.has('8.pot.jovana')) razmene += 1
      if (lanac && u.has('8.x11')) ocene[5] += 1
    }
    if (k.id === JOVANA_ID) {
      if (u.has('7R.prijem')) razmene += 1
      if (lanac && u.has('8.pot.jovana')) razmene += 1
      if (lanac && u.has('8.x11')) ocene[5] += 1
    }
    izlaz[k.id] = { id: k.id, verifikovan, poeni, razmene, ocene, recenzije: 0, zbirOcena: 0 }
  }
  // slobodni tokovi: promene poena (potrošeno / dodela posle potvrđenog prijema), obavljene razmene i nove recenzije
  for (const e of tokovi.poeni) {
    const k = izlaz[e.k]
    if (k) k.poeni = Math.max(0, k.poeni + (e.vrsta === 'potroseno' ? -e.iznos : e.iznos)) // V10: poeni nikad negativni
  }
  for (const r of tokovi.razmene) {
    if (r.faza < 3) continue
    for (const id of [r.vlasnik, r.od]) if (izlaz[id]) izlaz[id].razmene += 1
    for (const o of r.ocene) if (izlaz[o.o]) izlaz[o.o].ocene[o.ocena] += 1
  }
  for (const k of Object.values(izlaz)) {
    k.recenzije = brojRecenzija(k.ocene)
    k.zbirOcena = zbirOcena(k.ocene)
  }
  return izlaz
}

function razmenjenoStvari(poz: Poz, u: Set<string>, tokovi: Tokovi): number {
  let n = RAZMENJENO_STVARI_POCETAK
  if (poz.grana === 'lanac') {
    if (u.has('8.pot.jovana')) n += 3
  } else {
    if (u.has('7R.prijem')) n += 1
    if (u.has('8R.pot.marko')) n += 1
  }
  for (const r of tokovi.razmene) if (r.faza >= 3) n += 1 + r.stvari.length
  return n
}

/** Značka na paketu (broj stavki koje čekaju radnju). Marko: UX 7.4 / PLAN B5.10; Ana: izvedeno iz koraka 3 i 5. */
function znacke(poz: Poz, u: Set<string>): { ana: number; marko: number } {
  const marko = u.has('5.x6') ? 2 : u.has('4.x2') ? 3 : 2
  // paket čeka Anu dok ne prihvati lanac (6.ana) ili, u grani „poeni“, dok ne uzme bicikl za poene (6R.uzmi) — PK7
  const ana = (poz.korak >= 3 && !u.has('3.w4') ? 1 : 0) + (u.has('5.x6') && !u.has('6.ana') && !u.has('6R.uzmi') ? 1 : 0)
  return { ana, marko }
}

/** Prijave koje čekaju odluku: dve unapred pripremljene, „šljivovica“ (od koraka 4 do odluke) i prijave koje je gledalac poslao (O5). */
function moderacijaSveta(poz: Poz, u: Set<string>, tokovi: Tokovi): Svet['moderacija'] {
  const opste = PRIJAVE_NA_CEKANJU.filter((p) => !imaKljuc(tokovi.odluke, p.id)).length
  const sljivovica = poz.korak >= 4 && !u.has('5.v3') ? 1 : 0
  const svoje = tokovi.prijave.filter((p) => !imaKljuc(tokovi.odluke, p.id)).length
  const odluke = Object.values(tokovi.odluke)
  const uklonjeno = MODERACIJA.uklonjenoPocetak + (u.has('5.v3') ? 1 : 0) + odluke.filter((o) => o === 'ukloni').length
  return { naCekanju: opste + sljivovica + svoje, uklonjeno, obradjeno: uklonjeno + MODERACIJA.ostavljeno + odluke.filter((o) => o !== 'ukloni').length }
}

export type StavkaPoena = { opis: string; iznos: number; datum: Datum }

const PS2_KRATKO = 'PlayStation 2'

/**
 * Istorija poena korisnika (W1): zbir stavki je uvek jednak poenima iz svet(). Firme ne drže poene.
 * Opisi nikad ne sadrže korisničko ime kao izvor ni primaoca poena: poene dodeljuje i oduzima SWAPIT (N-1).
 */
export function istorijaPoena(poz: Poz, korisnikId: string, tokovi: Tokovi = POCETNI_TOKOVI): StavkaPoena[] {
  const u = odradjene(poz)
  const k = KORISNICI.find((x) => x.id === korisnikId)
  if (!k) return []
  const izlaz: StavkaPoena[] = []
  if (korisnikId === ANA_ID) {
    if (u.has('1.r4')) izlaz.push({ opis: POENI_POCETNI_OPIS, iznos: POCETNI_POENI, datum: demoDatum(1, true) })
    if (u.has('7R.prijem')) izlaz.push({ opis: poklonDodelaOpis(POENI_PS2, PS2_KRATKO), iznos: POENI_PS2, datum: demoDatum(7, false) })
    if (u.has('8R.uzmi')) izlaz.push({ opis: potrosnjaOpis(POENI_BICIKL, BICIKL_NASLOV), iznos: -POENI_BICIKL, datum: demoDatum(8, false) })
  } else {
    if (k.poeni > 0) izlaz.push({ opis: POENI_RANIJE_OPIS, iznos: k.poeni, datum: DATUM_RANIJE_RAZMENE })
    if (korisnikId === MARKO_ID && u.has('8R.pot.ana')) izlaz.push({ opis: predataStvarDodelaOpis(POENI_BICIKL), iznos: POENI_BICIKL, datum: demoDatum(8, false) })
  }
  const danas = demoDatum(poz.korak, true)
  for (const e of tokovi.poeni) {
    if (e.k !== korisnikId) continue
    if (e.vrsta === 'potroseno') izlaz.push({ opis: potrosnjaOpis(e.iznos, e.naslov), iznos: -e.iznos, datum: danas })
    else if (e.vrsta === 'poklon') izlaz.push({ opis: poklonDodelaOpis(e.iznos, e.naslov), iznos: e.iznos, datum: danas })
    else izlaz.push({ opis: predataStvarDodelaOpis(e.iznos), iznos: e.iznos, datum: danas })
  }
  return izlaz
}

const REDOVI_BAZA: RedAkcije[] = PRIJAVE_AKCIJE.map((p, i) => ({ korisnik: p.korisnik, stvar: p.stvar, procena: p.procena, status: p.status, izPrice: i === 0 }))

/** Redovi prijava na akciji: 12 iz podataka (prvi je red iz priče), prijave gledalaca odmah iza njega, pa odluke prodavnice (Primi / Odbij). */
function redoviAkcije(u: Set<string>, tokovi: Tokovi): RedAkcije[] {
  const svi: RedAkcije[] = [
    REDOVI_BAZA[0],
    ...tokovi.prijaveAkcije.map((p) => ({ korisnik: p.k, stvar: p.stvar, procena: p.procena, status: 'ceka' as StatusPrijave, izPrice: false })),
    ...REDOVI_BAZA.slice(1),
  ]
  return svi.map((r) => {
    if (r.izPrice && u.has('9.primi')) return { ...r, status: 'primljeno' as StatusPrijave }
    const odluka = uzmi(tokovi.statusiPrijava, r.korisnik)
    return r.status === 'ceka' && odluka ? { ...r, status: odluka } : r
  })
}

/** Stanje sveta za poziciju priče i slobodne tokove. */
export function svet(poz: Poz, tokovi: Tokovi = POCETNI_TOKOVI): Svet {
  const u = odradjene(poz)
  const zavrseniSlobodno = [...new Set(tokovi.razmene.filter((r) => r.faza >= 3).flatMap((r) => [r.cilj, ...r.stvari.flatMap((s) => (s.oglas ? [s.oglas] : []))]))]
  // oglasi koje je moderacija uklonila (odluka „ukloni“ na prijavu koju je gledalac poslao)
  const uklonjeniModeracijom = tokovi.prijave.filter((p) => uzmi(tokovi.odluke, p.id) === 'ukloni').map((p) => p.oglas)
  // K1: predmet priče (jeRezervisan) se ne uklanja ručno ni moderacijom, ne ističe se i ne ide na aukciju, ni kad zapis tako kaže (priča i obavljena razmena ga i dalje završavaju)
  const nijeUklonjen = (o: Oglas) => !zavrseniSlobodno.includes(o.id) && (jeRezervisan(o) || (!tokovi.uklonjeni.includes(o.id) && !uklonjeniModeracijom.includes(o.id)))
  const aukcijeTok = tokovi.aukcije.filter((a) => !jeRezervisan(a.oglas)).map((a) => a.oglas)
  const oglasi = [...oglasiPrice(poz, u), ...tokovi.noviOglasi].filter(nijeUklonjen).map((o) => {
    let x = o
    const izmena = jeRezervisan(o) ? undefined : uzmi(tokovi.izmene, o.id)
    if (izmena) x = { ...x, nacin: izmena.nacin, poeni: izmena.nacin === 'poeni' ? (izmena.poeni as VrednostPoena) : undefined, trazi: izmena.nacin === 'razmena' ? (x.trazi ?? 'roba') : undefined }
    if (aukcijeTok.includes(x.id)) return { ...x, aukcija: true, istaknuto: undefined }
    if (!x.istaknuto && !jeRezervisan(x) && tokovi.istaknuti.some((i) => i.oglas === x.id)) x = { ...x, istaknuto: 'red' as const }
    return x
  })

  const poKategoriji: Record<string, BrojPoVrsti> = Object.fromEntries(KATEGORIJE.map((k) => [k.id, { ukupno: 0, roba: 0, usluge: 0, ideje: 0 }]))
  const ukupno: BrojPoVrsti = { ukupno: 0, roba: 0, usluge: 0, ideje: 0 }
  const nacin = { razmena: 0, poeni: 0, poklon: 0 }
  const poeniPoVrednosti = Object.fromEntries(VREDNOSTI_POENA.map((v) => [v, 0])) as Record<VrednostPoena, number>
  const tipovi: Record<string, number> = Object.fromEntries(TIPOVI.map((t) => [t, 0]))
  const istaknuto = { red: 0, top: 0, premium: 0, ukupno: 0 }
  let gradjanin = 0
  let firma = 0
  let aukcije = 0
  for (const o of oglasi) {
    const kat = poKategoriji[o.kat]
    if (!kat) continue // nepoznata kategorija (npr. pokvaren zapis) se ne računa nigde, umesto da sruši ekran (PK3)
    for (const b of [kat, ukupno]) {
      b.ukupno++
      if (o.vrsta === 'roba') b.roba++
      else if (o.vrsta === 'usluga') b.usluge++
      else b.ideje++
    }
    nacin[o.nacin]++
    if (o.nacin === 'poeni' && o.poeni) poeniPoVrednosti[o.poeni]++
    const t = tipRazmene(o)
    if (t) tipovi[t]++
    if (o.firma) firma++
    else gradjanin++
    if (o.istaknuto) {
      istaknuto[o.istaknuto]++
      istaknuto.ukupno++
    }
    if (o.aukcija) aukcije++
  }

  const zupcanikOglasa = oglasi.filter((o) => o.vlasnik === ZUPCANIK_ID).length
  const redovi = redoviAkcije(u, tokovi)
  const brojStatusa = (s: StatusPrijave) => redovi.filter((r) => r.status === s).length
  // T2-2: tabla akcija prati radnju i odluke — svaki „Primi“ povećava primljeno, a smanjuje čeka procenu; izdati popusti = primljeno × popust
  const primljeno = brojStatusa('primljeno')
  const akcijaAktivna = poz.korak >= 9 || tokovi.poslovno.akcija
  return {
    oglasi,
    region: OGLASI_REGION,
    poKategoriji,
    ukupno,
    nacin,
    poeniPoVrednosti,
    tipovi,
    gradjanin,
    firma,
    istaknuto,
    aukcije,
    korisnici: korisniciSveta(poz, u, tokovi),
    razmenjenoStvari: razmenjenoStvari(poz, u, tokovi),
    znackaPaketa: znacke(poz, u),
    moderacija: moderacijaSveta(poz, u, tokovi),
    zupcanik: { ...ZUPCANIK, ctrDesetine: Math.round((ZUPCANIK.reklamaKlikovi * 1000) / ZUPCANIK.reklamaPrikazi), oglasa: zupcanikOglasa, plan: tokovi.poslovno.plan ?? FIRMA_PO_ID[ZUPCANIK_ID].plan },
    akcija: akcijaAktivna
      ? { prijave: redovi.length, primljeno, cekaProcenu: brojStatusa('ceka'), odbijeno: brojStatusa('odbijeno'), izdatiPopusti: primljeno * CENE.popustPoStaromBiciklu, naknada: CENE.akcijaStaroZaNovo, pregledi: AKCIJA.pregledi, redovi }
      : null,
    zavrseniSlobodno,
  }
}

/** Korisnik koji odgovara uglu gledanja (Ana, Marko); Prodavnica i Moderacija nisu građani i nemaju poene. */
export function korisnikUgla(s: Svet, ugao: Ugao): KorisnikSvet | null {
  const id = ugao === 'ana' ? ANA_ID : ugao === 'marko' ? MARKO_ID : null
  return id ? s.korisnici[id] : null
}

/** Id vlasnika čije oglase i ponude gledalac vidi: Ana, Marko ili firma (Prodavnica). Moderacija nema svoje oglase. */
export function vlasnikUgla(ugao: Ugao): string | null {
  return ugao === 'ana' ? ANA_ID : ugao === 'marko' ? MARKO_ID : ugao === 'prodavnica' ? ZUPCANIK_ID : null
}

/** Položaj kruga oglasa na mapi (procenti) i naziv opštine: ekrani ih čitaju odavde, ne iz opstine.ts. */
export { polozajOglasa } from './opstine'
export const nazivOpstine = (id: OpstinaId): string => OPSTINA_PO_ID[id].naziv

// ---------------------------------------------------------------------------------------------------------------------
// FASADA ZA EKRANE: ekrani ne uvoze ulazne fajlove scenarija, pa sve što im treba izlazi odavde (brava u pravila/brave.ts).
// ---------------------------------------------------------------------------------------------------------------------
export { KATEGORIJE, KATEGORIJA_PO_ID, KATEGORIJA_JABUCICA, KATEGORIJE_SA_OBAVESTENJEM } from './kategorije'
export { FIRME, FIRMA_PO_ID } from './firme'
export { OPSTINE, OPSTINA_PO_ID } from './opstine'
export { ANA_ID, JOVANA_ID, MARKO_ID, KORISNICI, KORISNIK_PO_ID, REGION_KORISNICI } from './korisnici'
export { CENE, DANI_ISTICANJA, PAKETI_AUKCIJA, POCETNI_POENI, PODRAZUMEVANI_PAKET_AUKCIJA, PODRAZUMEVANO_ISTICANJE_DANA, REKLAMA_DANA, ROKOVI_AUKCIJE_DANA, VREDNOST_POKLONA_SLOBODNO, VREDNOSTI_POENA } from './cene'
export type { DaniIsticanja, PaketAukcija } from './cene'
export { POENI_PS2, POENI_BICIKL, AUKCIJE_OGLASI }
export { preuzimanjeTekst, jeRezervisan, BICIKL_ID, PS2_ID, UDZBENICI_ID, SLJIVOVICA_ID } from './oglasi'
export { ZUPCANIK_ID }
export type { Oglas } from './oglasi'
export type { Recenzija } from './recenzije'

const SVI_OGLASI: Oglas[] = [...OGLASI_BEOGRAD, ...OGLASI_REGION, ANIN_PS2, PRIJAVLJENI_OGLAS]
/** Oglas po id-u, i kad trenutno nije aktivan (npr. Anin PlayStation 2 pre koraka 2 ili stvari „završene“ posle koraka 8). */
export const oglasPoId = (id: string): Oglas | undefined => SVI_OGLASI.find((o) => o.id === id)
/** Oglas po id-u u datom svetu: prvo aktivni (uključujući one iz slobodnih tokova), pa svi poznati. */
export const nadjiOglas = (s: Svet, id: string, tokovi: Tokovi = POCETNI_TOKOVI): Oglas | undefined => s.oglasi.find((o) => o.id === id) ?? oglasPoId(id) ?? tokovi.noviOglasi.find((o) => o.id === id)

/**
 * Poslednjih `k` recenzija korisnika. Recenzije koje nastaju u koraku 8 (RECENZIJE_PRICE) i u slobodnim razmenama stoje na vrhu liste,
 * a ostale se računaju iz raspodele ocena BEZ njih, pa broj i prosek ostaju usklađeni sa onim što svet() kaže.
 */
export function recenzijeKorisnika(korisnikId: string, poz: Poz, k = 5, tokovi: Tokovi = POCETNI_TOKOVI): Recenzija[] {
  const u = odradjene(poz)
  const objavljene = RECENZIJE_PRICE.filter((r) => r.o === korisnikId && (poz.grana === 'lanac' ? u.has('8.x11') : r.autor === ANA_ID && u.has('8R.x11')))
  const izTokova = tokovi.razmene
    .flatMap((r) => (r.faza >= 3 ? r.ocene : []))
    .filter((o) => o.o === korisnikId)
    .reverse()
  const sve = korisniciSveta(poz, u, tokovi)[korisnikId]
  if (!sve) return []
  const osnova: Ocene = { ...sve.ocene }
  for (const r of objavljene) osnova[r.ocena] -= 1
  for (const o of izTokova) osnova[o.ocena] -= 1
  const nove: Recenzija[] = [...izTokova.map((o) => ({ autor: o.autor, ocena: o.ocena, tekst: KOMENTAR_PO_OCENI[o.ocena] })), ...objavljene.map((r) => ({ autor: r.autor, ocena: r.ocena, tekst: r.tekst }))]
  return [...nove, ...poslednjeRecenzije(korisnikId, osnova, Math.max(0, k - nove.length))].slice(0, k)
}

/** Sve recenzije korisnika (N4): isto kao poslednje, ali bez ograničenja na pet. */
export const sveRecenzije = (korisnikId: string, poz: Poz, tokovi: Tokovi = POCETNI_TOKOVI): Recenzija[] => recenzijeKorisnika(korisnikId, poz, 200, tokovi)
