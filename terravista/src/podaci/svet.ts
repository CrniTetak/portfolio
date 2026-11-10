// SVET — jedina kapija ka podacima za ekrane, okvir i tekstove (PLAN B3). Ekrani čitaju podatke SAMO ovde (i prikazuju brojeve SAMO kroz format.ts).
// U fazi 0 izvod je pojednostavljen (pozicija = korak + da li je korak završen + grana); u talasu 1 se proširuje na „prvih N radnji“ i slobodni sloj.
import { KANALI, type Kanal } from './kanali'
import { PAKETI, type Paket } from './paketi'
import { CENE } from './cene'
import { cena } from './format'
import { MATICNA_ZEMLJA, ZEMLJE, zemlja, type KodZemlje } from './zemlje'
import { FILMSKA_RIZNICA } from './kanali'
import { GRAD_PORODICE, GRAD_PORODICE_LOKATIV, PREZIME_PORODICE, lik } from './likovi'
import { NEDOSTUPNO } from './stalni-tekstovi'
import { logotip } from './logotipi'
import { SLIKE } from './slike'
import { EMISIJE, type Emisija } from './emisije'
import { prikaziLogotipe } from './podesavanja'

// Sve što ekrani smeju da čitaju izlazi odavde (brava uvoza u pravila/brave.test.ts: .tsx uvozi iz podaci/ samo svet, format i stalni-tekstovi).
export { KANALI, PAKETI, ZEMLJE, CENE }
export { kanal, imaKanal, ZANROVI, FILMSKA_RIZNICA } from './kanali'
export type { Kanal, Zanr, Deo, PaketId } from './kanali'
export { paket, imaPaket } from './paketi'
export type { Paket } from './paketi'
export { cenaKanala, cenaPaketa } from './cene'
export { EMISIJE, SADA, POCETAK_MREZE, KRAJ_MREZE, KORAK_MREZE, TRAJANJE_REKLAME, rasporedKanala, emisija, imaEmisiju, emisijaSada, opisEmisije } from './emisije'
export type { Emisija, Slot } from './emisije'
export { REKLAME, reklama, imaReklamu } from './reklame'
export { lik, LIKOVI, UREDJAJI, DEMO_KODOVI, SERVISI, PREZIME_PORODICE, GRAD_PORODICE, NAZIV_TELEVIZORA_NA_TELEFONU } from './likovi'
export { GLEDANOST, PRIHOD_KANALA, PODELA_KANALA, PRAVA_KANALA, PRIHOD_PO_DELOVIMA, ukupniPrihod, udeo, matricaPrava, DELOVI, PLAN_TRZISTA, MERILA_PILOTA } from './brojke'
export { gradijentZa, SLIKE } from './slike'
export { LOGOTIPI } from './logotipi'
export { zemlja, KODOVI_ZEMALJA, MATICNA_ZEMLJA } from './zemlje'
export type { KodZemlje } from './zemlje'
export { vremePodsetnika, KLJUC_CUVANJA, prikaziLogotipe } from './podesavanja'

export type Grana = 'grcka' | 'srbija'
/** Pozicija priče: korak 1–9, da li je korak u završnom stanju, i izabrana grana račve (utiče od koraka 6). */
export type Pozicija = { korak: number; zavrseno: boolean; grana: Grana }

export function dostupan(k: Kanal, kod: KodZemlje): boolean {
  return !k.nedostupanU.includes(kod)
}

export function nedostupniU(kod: KodZemlje): readonly Kanal[] {
  return KANALI.filter((k) => !dostupan(k, kod))
}

/** Kanal ili paket sa ulogom u priči (uloge su polja na stavkama, ne posebna lista). */
export const KANAL_BESPLATNI_FILM: Kanal = KANALI.find((k) => k.ulogaUPrici === 'besplatni-film')!
export const KANAL_GLAVNI: Kanal = KANALI.find((k) => k.ulogaUPrici === 'glavni-po-izboru')!
export const PAKET_PRICE: Paket = PAKETI.find((p) => p.ulogaUPrici === 'paket-price')!

/** Vrednosti za mesta u šablonima kartica priče i drugih tekstova: „{ana} uključuje televizor u {grad}.“ */
const MESTA: Record<string, string> = {
  ana: lik('ana').ime,
  vesna: lik('vesna').ime,
  prezime: PREZIME_PORODICE,
  grad: GRAD_PORODICE,
  gradLokativ: GRAD_PORODICE_LOKATIV,
  glavniKanal: KANAL_GLAVNI.naziv,
  cenaKanala: cena(CENE.kanalPoIzboru),
  paketPrice: PAKET_PRICE.naziv,
  cenaPaketa: cena(CENE.paketZemlja),
  izmisljenKanal: FILMSKA_RIZNICA.naziv,
  nedostupno: NEDOSTUPNO,
  zemljaGrcka: zemlja('GR').naziv,
  zemljaSrbija: zemlja('RS').naziv,
  maticnaAkuzativ: zemlja(MATICNA_ZEMLJA).akuzativ,
}

/** Ubacuje podatke u šablon; nepoznato mesto je greška (da se tipfeler odmah vidi). */
export function popuni(sablon: string): string {
  return sablon.replace(/\{(\w+)\}/g, (_, ime: string) => {
    const v = MESTA[ime]
    if (v === undefined) throw new Error(`Nepoznato mesto u šablonu: {${ime}}`)
    return v
  })
}

// ---- logotipi: prikaz čita samo ovde; prekidač prikaziLogotipe gasi SVE logotipe odjednom (PLAN B7.1)

export type PrikazLogotipa = { adresa: string; nazivIspod: boolean } | null

/** Pravi logotip kanala (sa evidencijom i fajlom) ili null — tada se prikazuje neutralna pločica sa nazivom. */
export function logotipSlika(k: Kanal): PrikazLogotipa {
  if (!prikaziLogotipe || !k.logotip) return null
  const l = logotip(k.logotip)
  if (!l || !l.evidencija) return null // nikad pokvarena slika: bez preuzetog i evidentiranog fajla ostaje pločica
  return { adresa: `./logotipi/${l.fajl}`, nazivIspod: !!l.nazivIspod }
}

// ---- proizvod (kanal po izboru ili paket) za narudžbu, plaćanje i pretplate
import { cenaPaketa as _cenaPaketa, cenaKanala as _cenaKanala, pdvUCeni } from './cene'
import { imaKanal as _imaKanal, kanal as _kanal } from './kanali'
import { imaPaket as _imaPaket, paket as _paket } from './paketi'

export { pdvUCeni }

export type Proizvod = { id: string; vrsta: 'kanal' | 'paket'; naziv: string; cena: number; kanali: readonly Kanal[] }

/** Proizvod po id-u: kanal po izboru ili paket (cena u centima sa PDV-om). Nepoznat id → undefined. */
export function proizvod(id: string): Proizvod | undefined {
  if (_imaPaket(id)) {
    const p = _paket(id)
    return { id, vrsta: 'paket', naziv: p.naziv, cena: _cenaPaketa(p), kanali: p.kanali }
  }
  if (_imaKanal(id)) {
    const k = _kanal(id)
    return { id, vrsta: 'kanal', naziv: k.naziv, cena: _cenaKanala(k) ?? 0, kanali: [k] }
  }
  return undefined
}

/** Emisije jednog kanala po redu. */
export function emisijeKanala(kanalId: string): readonly Emisija[] {
  return EMISIJE.filter((e) => e.kanalId === kanalId)
}

export type PrikazSlike = { adresa: string; alt: string; autor: string; licenca: string }
/** Prava slika programa (samo sa bele liste licenci) za emisiju, ili undefined — tada se prikazuje gradijent. */
export function slikaProgramaZa(emisijaId: string): PrikazSlike | undefined {
  const s = SLIKE.find((x) => x.emisije.includes(emisijaId))
  return s ? { adresa: `./slike/${s.fajl}`, alt: s.alt, autor: s.autor, licenca: s.licenca } : undefined
}

// ---- pretraga, računi, mapiranje zemlje porekla na paket
export { UPITI, imaUpit, kanaliZaUpit, emisijeZaUpit } from './pretraga'
export { RACUNI, racun, imaRacun } from './racuni'
export { ZANROVI as SPISAK_ZANROVA } from './kanali'

/** Paket po zemlji za izabranu zemlju porekla kanala (ili undefined, npr. za „Regionalni“). */
export function paketZaZemljuPorekla(zemljaPorekla: string): Paket | undefined {
  return PAKETI.find((p) => p.vrsta === 'zemlja' && p.kanali.every((k) => k.zemljaPorekla === zemljaPorekla))
}

/** Zemlje porekla kanala u redosledu pojavljivanja (T7). */
export const ZEMLJE_POREKLA: readonly string[] = ['Srbija', 'Hrvatska', 'Bosna i Hercegovina', 'Regionalni'].filter((z) => KANALI.some((k) => k.zemljaPorekla === z))
