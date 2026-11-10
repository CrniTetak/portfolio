// Koji ekrani „pripadaju priči“ za ugao na datoj poziciji (za dugme „Pokaži mi“ / „Nazad na priču“ u traci).
// Izvedeno iz matrice (UX 3.3): početni i završni ekran koraka plus ekrani radnji koje ugao izvodi.
import { ekranZaPoziciju, ekraniKoraka } from '../pravila/matrica'
import type { Poz, Ugao } from '../prica/tipovi'

export function ekraniPrice(poz: Poz, ugao: Ugao): string[] {
  return [...new Set<string>([ekranZaPoziciju(poz, ugao), ...ekraniKoraka(poz.korak, poz.grana, ugao)])]
}
