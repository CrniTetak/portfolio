// PAKETI (PLAN B3): pet paketa po dva kanala; kanali paketa se IZVODE iz kanali.ts (kanal nosi `paket`), da nema dva izvora.
import { KANALI, type Kanal, type PaketId } from './kanali'

export type VrstaPaketa = 'zemlja' | 'zanr'

export type Paket = {
  id: PaketId
  naziv: string
  vrsta: VrstaPaketa
  /** Uloga u vođenoj priči: „Paket Srbija“ u koracima 5 i 7. */
  ulogaUPrici?: 'paket-price'
  kanali: readonly Kanal[]
}

const meta: readonly Omit<Paket, 'kanali'>[] = [
  { id: 'srbija', naziv: 'Paket Srbija', vrsta: 'zemlja', ulogaUPrici: 'paket-price' },
  { id: 'hrvatska', naziv: 'Paket Hrvatska', vrsta: 'zemlja' },
  { id: 'bih', naziv: 'Paket BiH', vrsta: 'zemlja' },
  { id: 'film', naziv: 'Paket Film', vrsta: 'zanr' },
  { id: 'deca', naziv: 'Paket Deca', vrsta: 'zanr' },
]

export const PAKETI: readonly Paket[] = meta.map((m) => ({ ...m, kanali: KANALI.filter((c) => c.paket === m.id) }))

export function paket(id: string): Paket {
  const p = PAKETI.find((x) => x.id === id)
  if (!p) throw new Error(`Nepoznat paket: ${id}`)
  return p
}
export const imaPaket = (id: string): boolean => PAKETI.some((p) => p.id === id)
