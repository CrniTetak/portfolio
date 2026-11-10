// KOMANDE — tastatura i daljinski idu kroz JEDNU komandu (PLAN B5.2). Čista funkcija, testirana.
export type Komanda = 'gore' | 'dole' | 'levo' | 'desno' | 'ok' | 'nazad' | 'pocetna'

export const SVE_KOMANDE: readonly Komanda[] = ['gore', 'dole', 'levo', 'desno', 'ok', 'nazad', 'pocetna']

type Dogadjaj = { key: string; keyCode?: number }

// Tasteri pravih daljinskih (PLAN B13): kodovi „Nazad“ na Samsung (10009) i LG (461) televizorima i imena iz specifikacije tastera.
// Kodovi su zapis iz opšteg znanja i mogu se promeniti; proveriti na pravom uređaju pre nego što se na njega osloni.
const KODOVI_NAZAD = new Set([8, 27, 10009, 461])
const KLJUCEVI_NAZAD = new Set(['Backspace', 'Escape', 'GoBack', 'BrowserBack', 'XF86Back'])

export function komandaIzTastera(e: Dogadjaj): Komanda | null {
  switch (e.key) {
    case 'ArrowUp':
      return 'gore'
    case 'ArrowDown':
      return 'dole'
    case 'ArrowLeft':
      return 'levo'
    case 'ArrowRight':
      return 'desno'
    case 'Enter':
      return 'ok'
    case 'Home':
    case 'BrowserHome':
      return 'pocetna'
  }
  if (KLJUCEVI_NAZAD.has(e.key)) return 'nazad'
  if (e.keyCode !== undefined && (e.key === 'Unidentified' || e.key === '') && KODOVI_NAZAD.has(e.keyCode)) return 'nazad'
  return null
}
