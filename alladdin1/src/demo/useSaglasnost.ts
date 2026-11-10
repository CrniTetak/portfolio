// Stanje kvačica saglasnosti (NIJEDNA nije unapred štiklirana). Živi u DemoProvider-u, pa traka priče ("Next", skok) može da ih vizuelno štiklira
// kad izvede korak umesto gledaoca. Opcione saglasnosti (alergije, marketing) ostaju prazne i nisu uslov.
import { useDemo } from './DemoProvider'

/** Obavezne kvačice koje traka priče štiklira kad izvede korak (ključ = ekran + saglasnost). */
export const OBAVEZNE_SAGLASNOSTI = ['g4-vip', 'g4-gala', 'g5-uslovi', 'g5-18', 't2-uslovi', 't2-pasos', 't2-18', 't3-6.rata2', 't3-8.rata3'] as const

export function useSaglasnost(kljuc: string): [boolean, (v: boolean) => void] {
  const demo = useDemo()
  return [!!demo.saglasnosti[kljuc], (v) => demo.postaviSaglasnost(kljuc, v)]
}
