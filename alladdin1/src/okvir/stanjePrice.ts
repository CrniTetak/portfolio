// Koji ekrani "pripadaju priči" za ulogu na datoj poziciji (za pilulu "You left the story screen · Back to story").
import { celija } from '../pravila/matrica'
import { radnjeKoraka } from '../prica/koraci'
import type { Poz, Uloga } from '../prica/tipovi'

export function PRIKAZ_PRICE_EKRANI(poz: Poz, uloga: Uloga): string[] {
  const c = celija(poz.korak, uloga, poz.ishod)
  if (!c) return []
  const ekrani = new Set<string>([c.pocetno.ekran, c.zavrsno.ekran])
  for (const r of radnjeKoraka(poz.korak, poz.ishod)) if (r.uloge === 'any' || r.uloge.includes(uloga)) ekrani.add(r.ekran)
  // putnik prolazi T1–T4 kroz upis, organizator G4/G5 kroz ponudu: susedni ekrani istog toka
  if (uloga === 'traveler' && poz.korak === 5) ['T1', 'T2', 'T3', 'T4'].forEach((e) => ekrani.add(e))
  if (uloga === 'organizer' && poz.korak <= 4) ['G1', 'G2', 'G3', 'G4', 'G5'].forEach((e) => poz.korak === 1 ? ekrani.add(e) : e >= 'G4' && ekrani.add(e))
  return [...ekrani]
}
