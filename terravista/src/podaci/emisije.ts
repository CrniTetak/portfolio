// EMISIJE i RASPORED (PLAN B3): izmišljene emisije; nazivi i uzrasti su na stavci kanala (kanali.ts), a vremena se IZVODE ovde.
// Vremena su fiksna demo vremena (nema pravog sata): „sada“ je uvek 20:00. Bez Date objekta.
import { KANALI, kanal, type Kanal } from './kanali'

/** „Sada“ u demou, u minutima od ponoći (20:00). */
export const SADA = 20 * 60

/** Prva emisija svakog kanala počinje ovoliko minuta pre „sada“ (različito po kanalu, da vodič ne bude pravilna rešetka). */
const POMACI = [-60, -45, -30, -15]
/** Trajanja tri emisije po obrascu; prva je uvek duža od pomaka, pa emisija „sada“ stvarno traje u 20:00. */
const OBRASCI: readonly (readonly [number, number, number])[] = [
  [75, 45, 45],
  [75, 30, 60],
  [90, 45, 30],
]
/** Mreža TV vodiča: od „sada“ minus 60 do „sada“ plus 180 minuta, u koracima od 15 (UX T3; ekran ne upisuje ove brojeve). */
export const POCETAK_MREZE = SADA - 60
export const KRAJ_MREZE = SADA + 180
export const KORAK_MREZE = 15
/** Trajanje reklamne pauze u vodiču (samo besplatni kanali); 30 min da pauza ima dovoljno mesta u mreži vodiča od 15 minuta. */
export const TRAJANJE_REKLAME = 30

export type Emisija = {
  id: string
  kanalId: string
  naziv: string
  uzrast: string
  /** Minuti od ponoći. */
  pocetak: number
  kraj: number
  /** Dostupno gledanje unazad (izvedeno iz kanala). */
  unazad: boolean
}

export type Slot = { tip: 'emisija'; emisija: Emisija } | { tip: 'reklama'; pocetak: number; kraj: number; kanalId: string }

function izvedi(k: Kanal, i: number): { emisije: Emisija[]; slotovi: Slot[] } {
  const obrazac = OBRASCI[i % OBRASCI.length]
  let t = SADA + POMACI[i % POMACI.length]
  const emisije: Emisija[] = []
  const slotovi: Slot[] = []
  k.emisije.forEach(([naziv, uzrast], n) => {
    const e: Emisija = { id: `${k.id}-${n + 1}`, kanalId: k.id, naziv, uzrast, pocetak: t, kraj: t + obrazac[n], unazad: k.gledanjeUnazad }
    emisije.push(e)
    slotovi.push({ tip: 'emisija', emisija: e })
    t = e.kraj
    // Posle prve emisije besplatnog kanala sledi označena reklamna pauza.
    if (n === 0 && k.deo === 'besplatni') {
      slotovi.push({ tip: 'reklama', pocetak: t, kraj: t + TRAJANJE_REKLAME, kanalId: k.id })
      t += TRAJANJE_REKLAME
    }
  })
  return { emisije, slotovi }
}

const izvedeno = KANALI.map((k, i) => izvedi(k, i))

export const EMISIJE: readonly Emisija[] = izvedeno.flatMap((x) => x.emisije)

/** Raspored jednog kanala za vodič (emisije i reklamne pauze po redu). */
export function rasporedKanala(kanalId: string): readonly Slot[] {
  const i = KANALI.findIndex((k) => k.id === kanalId)
  if (i < 0) throw new Error(`Nepoznat kanal: ${kanalId}`)
  return izvedeno[i].slotovi
}

export function emisija(id: string): Emisija {
  const e = EMISIJE.find((x) => x.id === id)
  if (!e) throw new Error(`Nepoznata emisija: ${id}`)
  return e
}
export const imaEmisiju = (id: string): boolean => EMISIJE.some((e) => e.id === id)

/** Emisija koja traje u 20:00 na kanalu. */
export function emisijaSada(kanalId: string): Emisija {
  const e = EMISIJE.find((x) => x.kanalId === kanalId && x.pocetak <= SADA && SADA < x.kraj)
  if (!e) throw new Error(`Nema emisije „sada“ za ${kanalId}`)
  return e
}

/** Opšti opis emisije po žanru kanala (izmišljen). */
export function opisEmisije(e: Emisija): string {
  return `${kanal(e.kanalId).opis} Prikaz emisije je izmišljen.`
}
