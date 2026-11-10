// Opcije: red čekanja ("prva/druga"), osporavanje i isticanje.
// "Prva/druga" znači MESTO U REDU za isti termin na istoj lokaciji (praksa branše).
// Ništa se ne čuva kao "istekla" ili "druga": sve se izračuna iz vremena postavljanja.
import { SATI_OPCIJA, SATI_OSPORAVANJE } from './konstante'
import { preklapaju } from './termini'
import type { Opcija, Termin } from './tipovi'
import { istekao } from './vreme'

/** Opcija ističe posle 72 h, ili posle roka osporavanja — šta nastupi ranije. */
export function efektivniRok(o: Opcija): number {
  return o.osporavanje ? Math.min(o.vaziDo, o.osporavanje.rok) : o.vaziDo
}

export function novaOpcija(
  id: string, lokacijaId: string, produkcijaId: string, termin: Termin, sada: number,
): Opcija {
  return {
    id, lokacijaId, produkcijaId, termin,
    postavljena: sada, vaziDo: sada + SATI_OPCIJA, osporavanje: null, stanje: 'aktivna',
  }
}

export type PrikazStanjaOpcije = 'aktivna' | 'osporena' | 'istekla' | 'otpustena' | 'pretvorena'

export function stanjeOpcije(o: Opcija, sada: number): PrikazStanjaOpcije {
  if (o.stanje === 'otpustena') return 'otpustena'
  if (o.stanje === 'pretvorena') return 'pretvorena'
  if (istekao(efektivniRok(o), sada)) return 'istekla'
  return o.osporavanje ? 'osporena' : 'aktivna'
}

export function jeZiva(o: Opcija, sada: number): boolean {
  const s = stanjeOpcije(o, sada)
  return s === 'aktivna' || s === 'osporena'
}

/** Živa opcija je ona koja drži termin: aktivna ili osporena, neistekla. */
export function redOpcija(opcije: Opcija[], lokacijaId: string, termin: Termin, sada: number): Opcija[] {
  return opcije
    .map((o, redosled) => ({ o, redosled }))
    .filter(({ o }) => o.lokacijaId === lokacijaId && jeZiva(o, sada) && preklapaju(o.termin, termin))
    // po vremenu postavljanja; ako je isto, ko je ranije unet
    .sort((a, b) => a.o.postavljena - b.o.postavljena || a.redosled - b.redosled)
    .map(({ o }) => o)
}

/** 1 = prva, 2 = druga...; null ako opcija više ne drži termin. */
export function pozicija(opcije: Opcija[], o: Opcija, sada: number): number | null {
  const i = redOpcija(opcije, o.lokacijaId, o.termin, sada).findIndex((x) => x.id === o.id)
  return i < 0 ? null : i + 1
}

/**
 * Druga produkcija u redu traži potvrdu: prva opcija dobija 24 h (rok osporavanja).
 * Ništa se ne menja ako nema tuđe prve opcije ili je već osporena.
 */
export function osporiPrvu(
  opcije: Opcija[], lokacijaId: string, termin: Termin, izazivacId: string, sada: number,
): Opcija[] {
  const prva = redOpcija(opcije, lokacijaId, termin, sada)[0]
  if (!prva || prva.produkcijaId === izazivacId || prva.osporavanje) return opcije
  return opcije.map((o) =>
    o.id === prva.id ? { ...o, osporavanje: { od: izazivacId, rok: sada + SATI_OSPORAVANJE } } : o,
  )
}
