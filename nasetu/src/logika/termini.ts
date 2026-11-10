// Preklapanje termina i pravilo "isti termin ne može dva puta".
import type { Termin, Zahtev } from './tipovi'

export function daniTermina(t: Termin): string[] {
  return [...t.priprema, ...t.snimanje]
}

/** Dva termina se sudaraju ako dele ijedan dan (pripreme se računaju kao zauzet dan). */
export function preklapaju(a: Termin, b: Termin): boolean {
  const dani = new Set(daniTermina(a))
  return daniTermina(b).some((d) => dani.has(d))
}

/** Dani iz termina koji su u listi unapred zauzetih dana lokacije. */
export function zauzetiDaniUTerminu(t: Termin, zauzetiDani: string[]): string[] {
  const z = new Set(zauzetiDani)
  return daniTermina(t).filter((d) => z.has(d))
}

/**
 * Zahtev koji već blokira termin na lokaciji: samo ODOBREN zahtev (a plaćen je uvek prvo odobren)
 * drži termin. Zahtev koji tek čeka vlasnika ne blokira — inače bi Sigma i Delta
 * zaključavale jedna drugu pre nego što vlasnik išta odluči.
 */
export function blokirajuciZahtev(
  lokacijaId: string,
  termin: Termin,
  zahtevi: Zahtev[],
  ignorisiZahtevId?: string,
): Zahtev | undefined {
  return zahtevi.find(
    (z) =>
      z.id !== ignorisiZahtevId &&
      z.lokacijaId === lokacijaId &&
      z.stanje === 'odobren' &&
      preklapaju(z.termin, termin),
  )
}

export interface ProveraTermina {
  slobodan: boolean
  razlog: string | null
}

/** Jedina provera "da li je termin slobodan" — koriste je ekrani I reducer. */
export function proveriTermin(
  lokacijaId: string,
  termin: Termin,
  zahtevi: Zahtev[],
  zauzetiDaniLokacije: string[],
  ignorisiZahtevId?: string,
): ProveraTermina {
  if (zauzetiDaniUTerminu(termin, zauzetiDaniLokacije).length > 0) {
    return { slobodan: false, razlog: 'Termin je zauzet.' }
  }
  if (blokirajuciZahtev(lokacijaId, termin, zahtevi, ignorisiZahtevId)) {
    return { slobodan: false, razlog: 'Termin je već potvrđen za drugu rezervaciju.' }
  }
  return { slobodan: true, razlog: null }
}
