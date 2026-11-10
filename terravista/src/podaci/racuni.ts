// RAČUNI (P12, P13): izmišljeni, sa oznakom DEMO. Datumi su fiksni (nema pravog sata).
import { DEMO_KODOVI } from './likovi'

export type Racun = { id: string; proizvod: string; datum: string }

const [R1, R2, R3] = DEMO_KODOVI.racuni
export const RACUNI: readonly Racun[] = [
  { id: R1, proizvod: 'doma-tv', datum: '2026-08-14' },
  { id: R2, proizvod: 'srbija', datum: '2026-09-20' },
  { id: R3, proizvod: 'doma-tv', datum: '2026-09-14' },
]

export const imaRacun = (id: string): boolean => RACUNI.some((r) => r.id === id)
export function racun(id: string): Racun {
  const r = RACUNI.find((x) => x.id === id)
  if (!r) throw new Error(`Nepoznat račun: ${id}`)
  return r
}
