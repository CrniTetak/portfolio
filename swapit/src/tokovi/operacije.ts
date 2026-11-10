// PROMENE STANJA SLOBODNIH TOKOVA: čiste funkcije (isti ulaz = isti izlaz, ulaz se ne menja). Ekrani ih pozivaju preko demo.promeniTokove().
// Svaka operacija ima granice (najviše stavki) i ne dozvoljava dvostruko izvršenje, pa se tok ne može „pokvariti“ višestrukim klikom.
import { DANI_ISTICANJA, VREDNOST_POKLONA_SLOBODNO, type DaniIsticanja, type VrednostPoena } from '../scenario/cene'
import { imaKljuc, uzmi } from '../scenario/kljuc'
import { ANA_ID, MARKO_ID } from '../scenario/korisnici'
import { jeRezervisan, type Oglas } from '../scenario/oglasi'
import type { OpstinaId } from '../scenario/opstine'
import { BROJ_PONUDA_NOVE_AUKCIJE, JAKNA_ID, NAJVISE_NOVIH_PRICA, PONUDE_JAKNA, PORUKA_PONUDE_SLOBODNA, PRIMER_PO_ID, ponudeAukcije } from '../scenario/slobodno'
import { NAJVISE_PO_VRSTI, type IzmenaOglasa, type Nacin, type PoeniDogadjaj, type PonudaTok, type PoslovnoTok, type PrijavaAkcije, type RazmenaTok, type StvarZapis, type Tokovi, type Vrsta } from './tokovi'

/** Gledalac u uglu Ana ili Marko (ostali učesnici su „pomoćni“ korisnici čije radnje se odvijaju same). */
export const jeUgaoKorisnik = (id: string): boolean => id === ANA_ID || id === MARKO_ID

// ---------------------------------------------------------------------------------------------------------------------
// NOVI OGLAS (O2, O3) i izmene (O6)
// ---------------------------------------------------------------------------------------------------------------------
export type Nacrt = {
  primer: string
  vrsta: Vrsta
  kat: string
  nacin: Nacin
  poeni?: VrednostPoena
  trazi?: Vrsta
  stanje?: string
  preuzimanje: 'licno' | 'licno-kurir'
}

/** Id oglasa koji gledalac sledeći objavljuje (poznat unapred, da ekran zna kuda da ga vodi). */
export const idNovogOglasa = (t: Tokovi, vlasnik: string): string => `moj-${vlasnik}-${t.noviOglasi.length + 1}`

/** Pravi oglas iz nacrta; naslov i opis dolaze iz izabranog primera (ništa se ne kuca). */
export function napraviOglas(t: Tokovi, vlasnik: string, firma: boolean, opstina: OpstinaId, n: Nacrt): Oglas {
  const primer = uzmi(PRIMER_PO_ID, n.primer)
  const naslov = primer?.naslov ?? 'Novi oglas'
  const opis = primer && primer.vrsta === n.vrsta ? primer.opis : `${naslov}. Detalji se dogovaraju posle prihvaćene ponude.`
  const o: Oglas = {
    id: idNovogOglasa(t, vlasnik),
    naslov,
    kat: n.kat,
    vrsta: n.vrsta,
    nacin: firma ? 'razmena' : n.nacin,
    vlasnik,
    firma,
    grad: 'Beograd',
    opstina,
    opis,
  }
  if (o.nacin === 'razmena') o.trazi = n.trazi ?? 'roba'
  if (o.nacin === 'poeni') o.poeni = n.poeni ?? 25
  if (n.vrsta === 'roba') {
    o.stanje = n.stanje ?? 'Korišćeno'
    o.preuzimanje = n.preuzimanje
  }
  return o
}

export function ukloniOglas(t: Tokovi, id: string): Tokovi {
  return jeRezervisan(id) || t.uklonjeni.includes(id) || t.uklonjeni.length >= NAJVISE_PO_VRSTI ? t : { ...t, uklonjeni: [...t.uklonjeni, id] }
}

export function izmeniOglas(t: Tokovi, id: string, izmena: IzmenaOglasa): Tokovi {
  if (jeRezervisan(id)) return t // K1
  if (!imaKljuc(t.izmene, id) && Object.keys(t.izmene).length >= NAJVISE_PO_VRSTI) return t
  return { ...t, izmene: { ...t.izmene, [id]: izmena } }
}

export function istakniOglas(t: Tokovi, oglas: string, dana: DaniIsticanja): Tokovi {
  if (jeRezervisan(oglas) || !(DANI_ISTICANJA as readonly number[]).includes(dana)) return t // K1
  const bez = t.istaknuti.filter((x) => x.oglas !== oglas)
  return bez.length >= NAJVISE_PO_VRSTI ? t : { ...t, istaknuti: [...bez, { oglas, dana }] }
}

// ---------------------------------------------------------------------------------------------------------------------
// PONUDE I RAZMENE (X1–X11)
// ---------------------------------------------------------------------------------------------------------------------
export const idPonude = (t: Tokovi): string => `ponuda-${t.ponude.length + 1}`

/** Gledalac šalje ponudu na tuđi oglas; ista ponuda istog korisnika na isti oglas se zamenjuje (dok čeka odgovor). */
export function posaljiPonudu(t: Tokovi, p: { cilj: string; od: string; stvari: StvarZapis[] }): { tokovi: Tokovi; id: string } {
  const postojeca = t.ponude.find((x) => x.cilj === p.cilj && x.od === p.od && x.status === 'ceka')
  if (postojeca) return { tokovi: { ...t, ponude: t.ponude.map((x) => (x === postojeca ? { ...x, stvari: p.stvari } : x)) }, id: postojeca.id }
  if (t.ponude.length >= NAJVISE_PO_VRSTI) return { tokovi: t, id: t.ponude[t.ponude.length - 1]?.id ?? '' }
  const id = idPonude(t)
  return { tokovi: { ...t, ponude: [...t.ponude, { id, cilj: p.cilj, od: p.od, stvari: p.stvari, status: 'ceka' }] }, id }
}

/** Status ponude: ponude gledaoca imaju svoj zapis, a unapred pripremljene (Irena, Stefan, aukcije) se pamte u `odgovori`. */
export function statusPonude(t: Tokovi, id: string): PonudaTok['status'] {
  const svoja = t.ponude.find((p) => p.id === id)
  if (svoja) return svoja.status
  return uzmi(t.odgovori, id)?.status ?? 'ceka'
}
export const razlogOdbijanja = (t: Tokovi, id: string): string | undefined => t.ponude.find((p) => p.id === id)?.razlog ?? uzmi(t.odgovori, id)?.razlog

export function odgovoriNaPonudu(t: Tokovi, id: string, status: 'odbijena' | 'prihvacena', razlog?: string): Tokovi {
  if (statusPonude(t, id) !== 'ceka') return t
  if (t.ponude.some((p) => p.id === id)) return { ...t, ponude: t.ponude.map((p) => (p.id === id ? { ...p, status, ...(razlog ? { razlog } : {}) } : p)) }
  if (Object.keys(t.odgovori).length >= NAJVISE_PO_VRSTI) return t
  return { ...t, odgovori: { ...t.odgovori, [id]: { status, ...(razlog ? { razlog } : {}) } } }
}

/**
 * V2: JEDNA stvar = najviše JEDNA razmena. Prihvatanje ponude (i izbor na aukciji J4) zatvara sve ostale ponude na istom oglasu
 * („odbijena — izabrana druga ponuda“). Ako za taj oglas već postoji razmena, prihvatanje se ne primenjuje.
 */
export const RAZLOG_DRUGA_PONUDA = 'izabrana druga ponuda'
export function prihvatiPonudu(t: Tokovi, id: string, cilj: string, slobodno = true): Tokovi {
  if (t.razmene.some((r) => r.cilj === cilj) || statusPonude(t, id) !== 'ceka') return t
  let sledece = odgovoriNaPonudu(t, id, 'prihvacena')
  for (const p of ponudeZaOglas(sledece, cilj, slobodno)) if (p.id !== id && p.status === 'ceka') sledece = odgovoriNaPonudu(sledece, p.id, 'odbijena', RAZLOG_DRUGA_PONUDA)
  return sledece
}

/**
 * D6: prihvatanje ponude i pokretanje razmene su JEDNA celina: ako razmena ne može da se pokrene, ponuda se NE prihvata
 * (stanje ostaje isto, a pozivalac to vidi po tome što razmena ne postoji).
 */
export function prihvatiPonuduIPokreni(t: Tokovi, ponudaId: string, cilj: string, razmena: Parameters<typeof pokreniRazmenu>[1], slobodno = true): Tokovi {
  const prihvacena = prihvatiPonudu(t, ponudaId, cilj, slobodno)
  if (prihvacena === t) return t
  const sa = pokreniRazmenu(prihvacena, razmena)
  return nadjiRazmenu(sa, razmena.id) ? sa : t
}

/** Učesnici koji moraju da potvrde prijem: kod razmene oba, kod „za poene“ i poklona onaj ko prima stvar. */
export const ucesnici = (r: Pick<RazmenaTok, 'tip' | 'vlasnik' | 'od'>): string[] => (r.tip === 'razmena' ? [r.vlasnik, r.od] : [r.od])
/** Sve strane razmene (za ocenjivanje i prikaz). */
export const strane = (r: Pick<RazmenaTok, 'vlasnik' | 'od'>): string[] => [r.vlasnik, r.od]
export const drugaStrana = (r: Pick<RazmenaTok, 'vlasnik' | 'od'>, ja: string): string => (r.vlasnik === ja ? r.od : r.vlasnik)

export function nadjiRazmenu(t: Tokovi, id: string): RazmenaTok | undefined {
  return t.razmene.find((r) => r.id === id)
}

const dodajDogadjaj = (t: Tokovi, d: PoeniDogadjaj): Tokovi => (t.poeni.length >= NAJVISE_PO_VRSTI ? t : { ...t, poeni: [...t.poeni, d] })

/** Početak razmene (prihvaćena ponuda, „Uzmi za poene“, poklon). „Za poene“: SWAPIT odmah oduzima poene onome ko uzima (N-1). */
export function pokreniRazmenu(t: Tokovi, r: { id: string; tip: Nacin; cilj: string; naslov: string; vlasnik: string; od: string; stvari: StvarZapis[]; poeni?: number; /** Poeni koje onaj ko uzima ima u ovom trenutku (iz svet()); obavezno za „za poene“. */ raspolozivo?: number }): Tokovi {
  // V10: poeni nikad negativni — zaštita je OVDE, u operaciji (ekran je samo prvi sloj): uzimanje „za poene“ bez dovoljno poena se ne izvršava
  if (r.tip === 'poeni' && (r.poeni ?? 0) > (r.raspolozivo ?? 0)) return t
  // jedan kap za razmene i događaje poena: razmena sa poenima mora da ima mesta za oba događaja (potrošeno + dodela), inače se ne izvršava (a ne tiho gubi događaj)
  if ((r.tip === 'poeni' || r.tip === 'poklon') && t.poeni.length + 2 > NAJVISE_PO_VRSTI) return t
  // V2: za istu stvar (cilj) ne postoji druga razmena
  if (nadjiRazmenu(t, r.id) || t.razmene.some((x) => x.cilj === r.cilj) || t.razmene.length >= NAJVISE_PO_VRSTI) return t
  const nova: RazmenaTok = { id: r.id, tip: r.tip, cilj: r.cilj, naslov: r.naslov, vlasnik: r.vlasnik, od: r.od, stvari: r.stvari, faza: 1, predaja: 'licno', potvrdili: [], ocene: [], ...(r.poeni ? { poeni: r.poeni } : {}) }
  const sa = { ...t, razmene: [...t.razmene, nova] }
  return r.tip === 'poeni' && r.poeni ? dodajDogadjaj(sa, { k: r.od, vrsta: 'potroseno', naslov: r.naslov, iznos: r.poeni }) : sa
}

export function izaberiPredaju(t: Tokovi, id: string, predaja: 'licno' | 'kurir'): Tokovi {
  const r = nadjiRazmenu(t, id)
  return !r || r.faza !== 1 ? t : { ...t, razmene: t.razmene.map((x) => (x.id === id ? { ...x, predaja } : x)) }
}

/** X8 „Dogovor završen“: razmena prelazi u primopredaju. */
export function dogovorZavrsen(t: Tokovi, id: string): Tokovi {
  const r = nadjiRazmenu(t, id)
  return !r || r.faza !== 1 ? t : { ...t, razmene: t.razmene.map((x) => (x.id === id ? { ...x, faza: 2 } : x)) }
}

/**
 * X9 „Primio/la sam“: gledalac potvrđuje prijem. Pomoćni korisnici potvrđuju sami. Kad potvrde svi, razmena je obavljena, a SWAPIT
 * dodeljuje poene (za predatu stvar „za poene“ i za poklon) — tek posle potvrđenog prijema (N-1).
 */
export function potvrdiPrijem(t: Tokovi, id: string, ja: string): Tokovi {
  const r = nadjiRazmenu(t, id)
  if (!r || r.faza !== 2) return t
  const potrebni = ucesnici(r)
  // zaključano na stvarnog primaoca: potvrđuje strana razmene kojoj je potvrda potrebna; vlasnik poklona/predaje sme da potvrdi samo kad je primalac izmišljen (demo)
  if (!strane(r).includes(ja)) return t
  if (!potrebni.includes(ja) && !potrebni.every((u) => !jeUgaoKorisnik(u))) return t
  const potvrdili = [...new Set([...r.potvrdili, ...(potrebni.includes(ja) ? [ja] : []), ...potrebni.filter((u) => !jeUgaoKorisnik(u))])]
  const gotovo = potrebni.every((u) => potvrdili.includes(u))
  let sledece: Tokovi = { ...t, razmene: t.razmene.map((x) => (x.id === id ? { ...x, potvrdili, faza: gotovo ? 3 : 2 } : x)) }
  if (gotovo && r.poeni && r.tip === 'poeni') sledece = dodajDogadjaj(sledece, { k: r.vlasnik, vrsta: 'predaja', naslov: r.naslov, iznos: r.poeni })
  if (gotovo && r.poeni && r.tip === 'poklon') sledece = dodajDogadjaj(sledece, { k: r.vlasnik, vrsta: 'poklon', naslov: r.naslov, iznos: r.poeni })
  return sledece
}

/** X11: recenzija druge strane; moguća tek posle obavljene razmene i samo jednom po autoru. */
export function oceniRazmenu(t: Tokovi, id: string, autor: string, ocena: 3 | 4 | 5): Tokovi {
  const r = nadjiRazmenu(t, id)
  if (!r || r.faza !== 3 || !strane(r).includes(autor) || r.ocene.some((o) => o.autor === autor)) return t
  return { ...t, razmene: t.razmene.map((x) => (x.id === id ? { ...x, ocene: [...x.ocene, { autor, o: drugaStrana(r, autor), ocena }] } : x)) }
}

// ---------------------------------------------------------------------------------------------------------------------
// POENI I POKLON (W2, W5)
// ---------------------------------------------------------------------------------------------------------------------
export function zatraziPoklon(t: Tokovi, oglas: string, od: string): Tokovi {
  return t.zahtevi.some((z) => z.oglas === oglas && z.od === od) || t.zahtevi.length >= NAJVISE_PO_VRSTI ? t : { ...t, zahtevi: [...t.zahtevi, { oglas, od }] }
}
export const poklonVrednost = (vrednost?: number): number => vrednost ?? VREDNOST_POKLONA_SLOBODNO

// ---------------------------------------------------------------------------------------------------------------------
// LISTA ŽELJA, PRATIM, PRETRAGE, PRIČE
// ---------------------------------------------------------------------------------------------------------------------
export function dodajZelju(t: Tokovi, k: string, id: string): Tokovi {
  return t.zelje.some((z) => z.k === k && z.id === id) || t.zelje.length >= 8 ? t : { ...t, zelje: [...t.zelje, { k, id }] }
}
export function prebaciPratim(t: Tokovi, k: string, id: string): Tokovi {
  return t.pratim.some((z) => z.k === k && z.id === id)
    ? { ...t, pratim: t.pratim.filter((z) => !(z.k === k && z.id === id)) }
    : t.pratim.length >= NAJVISE_PO_VRSTI
      ? t
      : { ...t, pratim: [...t.pratim, { k, id }] }
}
export function sacuvajPretragu(t: Tokovi, k: string, q: string): Tokovi {
  const upit = q.slice(0, 200)
  return t.pretrage.some((p) => p.k === k && p.q === upit) || t.pretrage.length >= 10 ? t : { ...t, pretrage: [...t.pretrage, { k, q: upit }] }
}
export function objaviPricu(t: Tokovi, k: string, tekst: string): Tokovi {
  return t.price.length >= NAJVISE_NOVIH_PRICA ? t : { ...t, price: [...t.price, { k, tekst }] }
}

// ---------------------------------------------------------------------------------------------------------------------
// JAVNA AUKCIJA (J3), PAKETI (Z2)
// ---------------------------------------------------------------------------------------------------------------------
export function kupiPaket(t: Tokovi, broj: number): Tokovi {
  return { ...t, paketAukcija: Math.min(30, t.paketAukcija + broj) }
}
export function pokreniAukciju(t: Tokovi, oglas: string, dana: 3 | 7 | 14, korak = 1): Tokovi {
  if (jeRezervisan(oglas) || t.paketAukcija < 1 || t.aukcije.some((a) => a.oglas === oglas) || t.aukcije.length >= 10) return t
  return { ...t, paketAukcija: t.paketAukcija - 1, aukcije: [...t.aukcije, { oglas, dana, korak }] }
}

// ---------------------------------------------------------------------------------------------------------------------
// DOSTAVA (D1–D3)
// ---------------------------------------------------------------------------------------------------------------------
export function naruciDostavu(t: Tokovi, razmena: string, velicina: 'mala' | 'velika', termin: 0 | 1): Tokovi {
  return { ...t, dostava: { razmena, velicina, termin, faza: 0 } }
}
export function sledecaFazaDostave(t: Tokovi): Tokovi {
  return t.dostava && t.dostava.faza < 3 ? { ...t, dostava: { ...t.dostava, faza: (t.dostava.faza + 1) as 1 | 2 | 3 } } : t
}

// ---------------------------------------------------------------------------------------------------------------------
// POSLOVNA STRANA (F1–F9), AKCIJA (A2–A6)
// ---------------------------------------------------------------------------------------------------------------------
export const izmeniPoslovno = (t: Tokovi, p: Partial<PoslovnoTok>): Tokovi => ({ ...t, poslovno: { ...t.poslovno, ...p } })

export function prijaviZaAkciju(t: Tokovi, p: PrijavaAkcije): Tokovi {
  const bez = t.prijaveAkcije.filter((x) => x.k !== p.k)
  return bez.length >= 10 ? t : { ...t, prijaveAkcije: [...bez, p] }
}
export function odlukaPrijaveAkcije(t: Tokovi, korisnik: string, status: 'primljeno' | 'odbijeno'): Tokovi {
  return imaKljuc(t.statusiPrijava, korisnik) || Object.keys(t.statusiPrijava).length >= 20 ? t : { ...t, statusiPrijava: { ...t.statusiPrijava, [korisnik]: status } }
}

// ---------------------------------------------------------------------------------------------------------------------
// MODERACIJA (O5, V1–V4)
// ---------------------------------------------------------------------------------------------------------------------
export const idPrijave = (oglas: string): string => `p-${oglas}`
export function prijaviOglas(t: Tokovi, oglas: string, razlog: string, od: string): Tokovi {
  const id = idPrijave(oglas)
  if (jeRezervisan(oglas)) return t // K1
  return t.prijave.some((p) => p.id === id) || t.prijave.length >= 10 ? t : { ...t, prijave: [...t.prijave, { id, oglas, razlog, od }] }
}
export function odluciPrijavu(t: Tokovi, id: string, odluka: 'ukloni' | 'izmena' | 'ostavi', korak = 1): Tokovi {
  return imaKljuc(t.odluke, id) || Object.keys(t.odluke).length >= 20 ? t : { ...t, odluke: { ...t.odluke, [id]: odluka }, korakOdluke: { ...t.korakOdluke, [id]: korak } }
}


// ---------------------------------------------------------------------------------------------------------------------
// PRIMLJENE PONUDE (X4–X7, J2, J4): unapred pripremljene ponude + ponude koje je poslao drugi građanin
// ---------------------------------------------------------------------------------------------------------------------
export type PonudaPrikaz = { id: string; od: string; stvari: StvarZapis[]; poruka: string; status: PonudaTok['status']; razlog?: string; seme: boolean }

/**
 * Ponude za jedan oglas. Unapred pripremljene: Irena i Stefan uz Markovu dečju jaknu (samo u slobodnom režimu, jer u priči stoje uz bicikl)
 * i ponude na aukciju koju je pokrenuo gledalac. Ostalo su ponude koje je poslao drugi građanin kroz X1–X3.
 */
export function ponudeZaOglas(t: Tokovi, oglasId: string, slobodno: boolean): PonudaPrikaz[] {
  const seme: { id: string; od: string; stvari: StvarZapis[]; poruka: string }[] = []
  if (oglasId === JAKNA_ID && slobodno) seme.push(...PONUDE_JAKNA)
  if (t.aukcije.some((a) => a.oglas === oglasId)) seme.push(...ponudeAukcije(oglasId, BROJ_PONUDA_NOVE_AUKCIJE))
  const izSemena = seme.map((p) => ({ ...p, status: statusPonude(t, p.id), razlog: razlogOdbijanja(t, p.id), seme: true }))
  const poslate = t.ponude.filter((p) => p.cilj === oglasId).map((p) => ({ id: p.id, od: p.od, stvari: p.stvari, poruka: PORUKA_PONUDE_SLOBODNA, status: p.status, razlog: p.razlog, seme: false }))
  return [...izSemena, ...poslate]
}
