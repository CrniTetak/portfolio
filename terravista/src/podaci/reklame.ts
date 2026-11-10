// REKLAME (PLAN B6.4, UX T10): izmišljeni proizvodi, bez pravih brendova. Uz svaku se vidi reč „Reklama“.

export type Reklama = {
  id: string
  /** Izmišljen proizvod. */
  proizvod: string
  slogan: string
  /** Ime Lucide ikonice (CSS ilustracija + ikonica; bez slika). */
  ikonica: 'coffee' | 'luggage'
  /** Ton pozadine (indeks gradijenta). */
  ton: number
}

export const REKLAME: readonly Reklama[] = [
  { id: 'reklama-1', proizvod: 'Kafa Jutarnja', slogan: 'Dan počinje mirno.', ikonica: 'coffee', ton: 0 },
  { id: 'reklama-2', proizvod: 'Torba Korak', slogan: 'Spremna za svaki put.', ikonica: 'luggage', ton: 1 },
]

export function reklama(id: string): Reklama {
  const r = REKLAME.find((x) => x.id === id)
  if (!r) throw new Error(`Nepoznata reklama: ${id}`)
  return r
}
export const imaReklamu = (id: string): boolean => REKLAME.some((r) => r.id === id)
