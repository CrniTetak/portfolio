// NAJVAŽNIJE PRAVILO PROTOTIPA: ko sme da vidi tačnu adresu i kontakt vlasnika.
//
// Ovo je JEDINO mesto u kodu koje sme da čita tačnu adresu (podaci/adrese-privatno.ts).
// Ekrani zovu prikazAdrese() i prikazuju samo ono što funkcija vrati.
//
// Pravila (UX.md, odeljak 5):
//  - Admin vidi sve.
//  - Vlasnik vidi adresu svojih lokacija; tuđih samo zonu.
//  - Produkcija vidi adresu + kontakt + dokumente samo za lokaciju na kojoj ima zahtev čiji je
//    predračun POTVRĐENO PLAĆEN.
//  - Posle otkazivanja rezervacije od strane vlasnika adresa se ponovo zatvara (zahtev više nije 'odobren').
//  - Imenovana osoba za POTVRĐENO izviđanje vidi samo adresu (bez kontakta vlasnika; kontakt je
//    Nasetu), od 24 h pre izviđanja.
//  - Partner, primalac linka i sve ostalo: samo opština i zona, uvek.
import { KONTAKT_NASETU, PRIVATNO } from '../podaci/adrese-privatno'
import { nadjiLokaciju } from '../podaci/lokacije'
import { SATI_ADRESA_POSLE_IZVIDJANJA, SATI_ADRESA_PRE_IZVIDJANJA } from './konstante'
import type { Izvidjanje, Predracun, Uloga, Zahtev } from './tipovi'

export type NivoAdrese = 'zona' | 'adresa' | 'sve'

export interface Posmatrac {
  uloga: Uloga | 'primalac'
  akterId: string
  /** samo za izviđanje: ime osobe kojoj je poruka namenjena */
  imenovanaOsoba?: string
}

export interface KontekstAdrese {
  zahtevi: Zahtev[]
  predracuni: Predracun[]
  izvidjanja: Izvidjanje[]
  sada: number
}

export interface PrikazAdrese {
  nivo: NivoAdrese
  /** uvek vidljivo: "Opština, zona" */
  zona: string
  adresa?: string
  kontaktOsoba?: string
  telefon?: string
  pristup?: string
  /** kratko objašnjenje za ekran */
  razlog: string
}

function zonaTekst(lokacijaId: string): string {
  const l = nadjiLokaciju(lokacijaId)
  return l ? `${l.opstina}, ${l.zona}` : ''
}

/** Da li produkcija ima PLAĆEN predračun za lokaciju. */
export function imaPlacenuRezervaciju(lokacijaId: string, produkcijaId: string, k: KontekstAdrese): boolean {
  return k.zahtevi.some(
    (z) =>
      z.lokacijaId === lokacijaId &&
      z.produkcijaId === produkcijaId &&
      z.stanje === 'odobren' &&
      k.predracuni.some((p) => p.zahtevId === z.id && p.uplataPotvrdjena !== null),
  )
}

/** Imenovana osoba dobija adresu od (izviđanje − 24 h) do (izviđanje + 24 h), samo za POTVRĐENO izviđanje. */
/** Vlasnik je otkazao rezervaciju te produkcije na toj lokaciji POSLE zahteva za izviđanje: izviđanje više ne važi (odluka V-b). */
function izvidjanjePonisteno(i: Izvidjanje, k: KontekstAdrese): boolean {
  return k.zahtevi.some(
    (z) => z.stanje === 'otkazao-vlasnik' && z.lokacijaId === i.lokacijaId && z.produkcijaId === i.produkcijaId &&
      (z.otkazan ?? 0) >= i.poslat)
}

export function imaOtvorenoIzvidjanje(lokacijaId: string, osoba: string, k: KontekstAdrese): boolean {
  return k.izvidjanja.some(
    (i) =>
      !izvidjanjePonisteno(i, k) &&
      i.lokacijaId === lokacijaId &&
      i.stanje === 'potvrdjeno' &&
      i.osoba.trim().toLowerCase() === osoba.trim().toLowerCase() &&
      k.sada >= i.kada - SATI_ADRESA_PRE_IZVIDJANJA &&
      k.sada < i.kada + SATI_ADRESA_POSLE_IZVIDJANJA,
  )
}

export function prikazAdrese(lokacijaId: string, p: Posmatrac, k: KontekstAdrese): PrikazAdrese {
  const zona = zonaTekst(lokacijaId)
  const privatno = PRIVATNO[lokacijaId]
  const zakljucano = (razlog: string): PrikazAdrese => ({ nivo: 'zona', zona, razlog })
  const sve = (razlog: string): PrikazAdrese => ({
    nivo: 'sve', zona, razlog,
    adresa: privatno?.adresa, kontaktOsoba: privatno?.kontaktOsoba, telefon: privatno?.telefon, pristup: privatno?.pristup,
  })

  if (!privatno) return zakljucano('Adresa za ovu lokaciju nije dostupna u prototipu.')

  if (p.uloga === 'admin') return sve('Admin vidi sve.')

  if (p.uloga === 'vlasnik') {
    return nadjiLokaciju(lokacijaId)?.vlasnikId === p.akterId
      ? sve('Ovo je vaša lokacija.')
      : zakljucano('Tuđa lokacija: vidi se samo zona.')
  }

  if (p.uloga === 'produkcija') {
    // Poruka za imenovanu osobu: važi SAMO pravilo izviđanja (adresa bez kontakta vlasnika).
    if (p.imenovanaOsoba) {
      if (!imaOtvorenoIzvidjanje(lokacijaId, p.imenovanaOsoba, k)) {
        return zakljucano('Adresa se otvara 24 h pre potvrđenog izviđanja.')
      }
      return {
        nivo: 'adresa', zona, razlog: 'Izviđanje je potvrđeno — adresa je otvorena samo imenovanoj osobi.',
        adresa: privatno.adresa, kontaktOsoba: 'Nasetu', telefon: KONTAKT_NASETU,
      }
    }
    if (imaPlacenuRezervaciju(lokacijaId, p.akterId, k)) return sve('Naknada je plaćena — adresa i kontakt su otvoreni.')
    // Vlasnik je otkazao plaćenu rezervaciju: zahtev više nije 'odobren', pa se adresa sama zatvara (odluka O11)
    const otkazana = k.zahtevi.some(
      (z) => z.lokacijaId === lokacijaId && z.produkcijaId === p.akterId && z.stanje === 'otkazao-vlasnik')
    return zakljucano(otkazana ? 'Rezervacija je otkazana; adresa više nije dostupna.' : 'Otvara se posle potvrđene uplate naknade.')
  }

  // partner i primalac linka: samo zona, uvek
  return zakljucano('Otvara se posle potvrđene uplate naknade.')
}
