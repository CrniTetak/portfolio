// Zahtev za rezervaciju → odobrenje/odbijanje/isticanje → predračun → uplata → (otkazivanje vlasnika).
import {
  CENA_IZBORA_VAN_KATALOGA_CENTI, DOMACIN_PO_DANU_CENTI, FOTOGRAFISANJE_CENTI, KURS_RSD, SATI_ZAHTEV_VLASNIKA,
} from './konstante'
import { eur, obracunPredracuna, uPare } from './novac'
import type { Razred } from './novac'
import { prednostZahteva } from './red'
import { daniTermina, proveriTermin } from './termini'
import type { Opcija, Predracun, Termin, Zahtev } from './tipovi'
import { istekao, satiZaDan } from './vreme'

export function noviZahtev(p: {
  id: string; lokacijaId: string; produkcijaId: string; briefId: string | null; termin: Termin
  razred: Razred; prekovremeniSati: number; osnovicaCenti: number; sada: number; domacin?: boolean; opcijaId?: string | null
}): Zahtev {
  return {
    id: p.id, lokacijaId: p.lokacijaId, produkcijaId: p.produkcijaId, briefId: p.briefId,
    termin: p.termin, razred: p.razred, prekovremeniSati: p.prekovremeniSati,
    osnovicaCenti: p.osnovicaCenti, domacin: p.domacin ?? false, kurs: KURS_RSD, opcijaId: p.opcijaId ?? null,
    poslat: p.sada, rok: p.sada + SATI_ZAHTEV_VLASNIKA,
    stanje: 'ceka', razlog: null, otkazan: null,
  }
}

export type PrikazStanjaZahteva = 'ceka' | 'istekao' | 'odobren' | 'odbijen' | 'otkazao-vlasnik'

/** "Istekao" se računa iz vremena: zahtev koji niko nije rešio do roka. */
export function stanjeZahteva(z: Zahtev, sada: number): PrikazStanjaZahteva {
  if (z.stanje === 'ceka' && istekao(z.rok, sada)) return 'istekao'
  return z.stanje
}

export interface Odluka { moze: boolean; razlog: string | null }

/**
 * Da li vlasnik sme da odobri: zahtev mora da čeka (neistekao), termin ne sme biti zauzet/blokiran/već potvrđen drugom,
 * i (A2) produkcija mora biti PRVA u redu za taj termin — dok je ispred nje živa opcija ili zahtev prve, "Odobri" je zaključano.
 */
export function mozeLiOdobriti(
  z: Zahtev, sviZahtevi: Zahtev[], zauzetiDaniLokacije: string[], sada: number, opcije: Opcija[],
): Odluka {
  const s = stanjeZahteva(z, sada)
  if (s === 'istekao') return { moze: false, razlog: 'Zahtev je istekao.' }
  if (s !== 'ceka') return { moze: false, razlog: 'Zahtev je već rešen.' }
  const t = proveriTermin(z.lokacijaId, z.termin, sviZahtevi, zauzetiDaniLokacije, z.id)
  if (!t.slobodan) return { moze: false, razlog: t.razlog }
  const prednost = prednostZahteva(z, opcije, sviZahtevi, sada)
  if (!prednost.moze) return { moze: false, razlog: prednost.razlog }
  return { moze: true, razlog: null }
}

// ---- Predračuni ----

/** Poziv na broj (izmišljen): redni broj predračuna u istoj seriji za sve vrste. */
function pozivNaBroj(redniBroj: number): string {
  return `97 NS-2026-${String(41 + redniBroj).padStart(4, '0')}`
}

/**
 * Već plaćen predračun za izbor van kataloga iz istog briefa, koji još nije uračunat ni u jedan predračun naknade
 * (odluka O5: umanjenje samo ako je 50 € plaćeno PRE izdavanja predračuna rezervacije i samo jednom po briefu).
 */
export function kreditIzboraZaZahtev(z: Zahtev, predracuni: Predracun[]): { predracunId: string; centi: number } | null {
  if (!z.briefId) return null
  const izbor = predracuni.find(
    (p) => p.vrsta === 'izbor-van-kataloga' && p.briefId === z.briefId && p.uplataPotvrdjena !== null &&
      // kredit je iskorišćen samo dok ga drži predračun koji nije vraćen; kad vlasnik otkaže (povraćaj), kredit se OSLOBAĐA
      // i važi za zamensku rezervaciju iz istog briefa (odluka V-a)
      !predracuni.some((x) => x.kreditIzPredracunaId === p.id && x.povracaj === null))
  return izbor ? { predracunId: izbor.id, centi: izbor.uslugaCenti } : null
}

/** Predračun naknade nastaje automatski kad vlasnik odobri; sve se računa u evrima, pa preračunava po kursu. */
export function napraviPredracunNaknade(
  id: string, redniBroj: number, z: Zahtev, predracuni: Predracun[], sada: number,
): Predracun {
  const kredit = kreditIzboraZaZahtev(z, predracuni)
  const o = obracunPredracuna({
    osnovicaCenti: z.osnovicaCenti, kreditCenti: kredit?.centi ?? 0, snimajuciDani: z.termin.snimanje.length, domacin: z.domacin,
  })
  return {
    id, vrsta: 'naknada', kupacId: z.produkcijaId, zahtevId: z.id, briefId: null, prijavaId: null,
    osnovicaCenti: z.osnovicaCenti, naknadaCenti: o.naknadaCenti, primenjenMinimum: o.primenjenMinimum,
    umanjenjeCenti: o.umanjenjeCenti, kreditIzPredracunaId: kredit && o.umanjenjeCenti > 0 ? kredit.predracunId : null,
    nepokrivenKreditCenti: o.nepokrivenKreditCenti, domacinCenti: o.domacinCenti, uslugaCenti: 0,
    ukupnoCenti: o.ukupnoCenti, kurs: z.kurs, ukupnoPara: uPare(o.ukupnoCenti, z.kurs),
    pozivNaBroj: pozivNaBroj(redniBroj),
    izdat: sada, uplataPotvrdjena: null, pregledan: false, povracaj: null,
  }
}

/** Predračun za uslugu: izbor van kataloga (50 €, kupac produkcija) ili fotografisanje (75 €, kupac vlasnik). */
export function napraviPredracunUsluge(
  id: string, redniBroj: number, p: { vrsta: 'izbor-van-kataloga'; kupacId: string; briefId: string } | { vrsta: 'fotografisanje'; kupacId: string; prijavaId: string },
  sada: number,
): Predracun {
  const cena = p.vrsta === 'izbor-van-kataloga' ? CENA_IZBORA_VAN_KATALOGA_CENTI : FOTOGRAFISANJE_CENTI
  return {
    id, vrsta: p.vrsta, kupacId: p.kupacId,
    zahtevId: null, briefId: p.vrsta === 'izbor-van-kataloga' ? p.briefId : null, prijavaId: p.vrsta === 'fotografisanje' ? p.prijavaId : null,
    osnovicaCenti: 0, naknadaCenti: 0, primenjenMinimum: false, umanjenjeCenti: 0, kreditIzPredracunaId: null,
    nepokrivenKreditCenti: 0, domacinCenti: 0, uslugaCenti: cena,
    ukupnoCenti: cena, kurs: KURS_RSD, ukupnoPara: uPare(cena, KURS_RSD),
    pozivNaBroj: pozivNaBroj(redniBroj),
    izdat: sada, uplataPotvrdjena: null, pregledan: false, povracaj: null,
  }
}

export interface StavkaPredracuna {
  naziv: string
  iznosCenti: number
  /** info = ne plaća se ovde; ostalo ulazi u ukupno */
  tip: 'info' | 'naknada' | 'umanjenje' | 'domacin' | 'usluga'
  napomena?: string
}

/** Redovi predračuna za prikaz (jedno mesto, da isto vide produkcija, admin i vlasnik). */
export function stavkePredracuna(p: Predracun, opisCene = ''): StavkaPredracuna[] {
  if (p.vrsta === 'izbor-van-kataloga') {
    return [{ naziv: 'Izbor lokacija van kataloga (usluga)', iznosCenti: p.uslugaCenti, tip: 'usluga', napomena: 'Uračunava se u naknadu ako produkcija rezerviše lokaciju iz tog zahteva.' }]
  }
  if (p.vrsta === 'fotografisanje') {
    return [{ naziv: 'Profesionalno fotografisanje prostora (usluga)', iznosCenti: p.uslugaCenti, tip: 'usluga' }]
  }
  const redovi: StavkaPredracuna[] = [
    { naziv: `Cena lokacije${opisCene ? ` (${opisCene})` : ''} — ne plaća se ovde`, iznosCenti: p.osnovicaCenti, tip: 'info' },
    { naziv: 'Naknada Nasetua', iznosCenti: p.naknadaCenti, tip: 'naknada' },
  ]
  if (p.umanjenjeCenti > 0) {
    redovi.push({
      naziv: 'Uračunat izbor van kataloga', iznosCenti: -p.umanjenjeCenti, tip: 'umanjenje',
      napomena: p.nepokrivenKreditCenti > 0
        ? `Uplaćeni iznos pokriva celu naknadu; razlika od ${eur(p.nepokrivenKreditCenti)} se ne vraća.` : undefined,
    })
  }
  if (p.domacinCenti > 0) {
    const dana = Math.round(p.domacinCenti / DOMACIN_PO_DANU_CENTI)
    redovi.push({
      naziv: `Domaćin lokacije na snimanju: ${dana} ${dana === 1 ? 'dan' : 'dana'} × ${eur(DOMACIN_PO_DANU_CENTI)}`,
      iznosCenti: p.domacinCenti, tip: 'domacin', napomena: 'Nije deo osnovice za naknadu od 15% ni iznosa za vlasnika.',
    })
  }
  return redovi
}

/**
 * "Potvrdi uplatu": za naknadu samo kad je vlasnik odobrio (i nije otkazao); za usluge kad uplata još nije potvrđena.
 */
export function mozeLiPotvrditiUplatu(z: Zahtev | undefined, p: Predracun | undefined): Odluka {
  if (!p) return { moze: false, razlog: 'Predračun ne postoji.' }
  if (p.vrsta === 'naknada' && z?.stanje === 'otkazao-vlasnik') return { moze: false, razlog: 'Rezervacija je otkazana.' }
  if (p.vrsta === 'naknada' && (!z || z.stanje !== 'odobren')) return { moze: false, razlog: 'Vlasnik još nije odobrio.' }
  if (p.uplataPotvrdjena !== null) return { moze: false, razlog: 'Uplata je već potvrđena.' }
  return { moze: true, razlog: null }
}

// ---- Otkazivanje vlasnika (B5) ----

/** Vlasnik sme da otkaže samo PLAĆENU rezervaciju, samo pre prvog dana termina i samo jednom (odluka O13). */
export function mozeLiOtkazatiVlasnik(z: Zahtev | undefined, p: Predracun | undefined, sada: number): Odluka {
  if (!z || !p) return { moze: false, razlog: 'Rezervacija ne postoji.' }
  if (z.stanje === 'otkazao-vlasnik') return { moze: false, razlog: 'Rezervacija je već otkazana.' }
  if (z.stanje !== 'odobren' || p.uplataPotvrdjena === null) return { moze: false, razlog: 'Otkazuje se samo plaćena rezervacija.' }
  const prvi = [...daniTermina(z.termin)].sort()[0] // najraniji dan termina
  if (!prvi || sada >= satiZaDan(prvi, 0)) return { moze: false, razlog: 'Termin je već počeo.' }
  return { moze: true, razlog: null }
}

export type FazaRezervacije = 'ceka-vlasnika' | 'istekao' | 'odbijen' | 'ceka-uplatu' | 'placeno' | 'otkazao-vlasnik'

export function fazaRezervacije(z: Zahtev, p: Predracun | undefined, sada: number): FazaRezervacije {
  const s = stanjeZahteva(z, sada)
  if (s === 'istekao') return 'istekao'
  if (s === 'odbijen') return 'odbijen'
  if (s === 'otkazao-vlasnik') return 'otkazao-vlasnik'
  if (s === 'ceka') return 'ceka-vlasnika'
  return p?.uplataPotvrdjena != null ? 'placeno' : 'ceka-uplatu'
}
