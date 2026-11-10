// Opštine Beograda (11, sa Surčinom) i njihov položaj na ilustrativnoj mapi.
// x i y su PROCENTI širine i visine SVG-a (viewBox fiksan, vidi komponente/Mapa.tsx), pa krugovi ne zavise od podloge (B6.5).
// Oblici opština u Mapa.tsx su približni i nacrtani za demo; ovo su samo središta za natpis i krugove.

export type OpstinaId = 'zem' | 'nbg' | 'stg' | 'sav' | 'vra' | 'zvz' | 'voz' | 'pal' | 'cuk' | 'rak' | 'sur'

export type Opstina = { id: OpstinaId; naziv: string; x: number; y: number }

export const OPSTINE: Opstina[] = [
  { id: 'zem', naziv: 'Zemun', x: 40, y: 23 },
  { id: 'nbg', naziv: 'Novi Beograd', x: 35, y: 46 },
  { id: 'stg', naziv: 'Stari grad', x: 55.5, y: 55 },
  { id: 'sav', naziv: 'Savski venac', x: 45, y: 60 },
  { id: 'vra', naziv: 'Vračar', x: 55.5, y: 67 },
  { id: 'zvz', naziv: 'Zvezdara', x: 68, y: 70 },
  { id: 'voz', naziv: 'Voždovac', x: 57, y: 84 },
  { id: 'pal', naziv: 'Palilula', x: 78, y: 40 },
  { id: 'cuk', naziv: 'Čukarica', x: 25, y: 81 },
  { id: 'rak', naziv: 'Rakovica', x: 41, y: 83 },
  { id: 'sur', naziv: 'Surčin', x: 13, y: 43 },
]

export const OPSTINA_PO_ID: Record<OpstinaId, Opstina> = Object.fromEntries(OPSTINE.map((o) => [o.id, o])) as Record<OpstinaId, Opstina>

/** Najveći pomak kruga od središta opštine (u procentima), da se krugovi u istoj opštini ne poklope. */
export const NAJVECI_POMAK_PROCENATA = 3

const round1 = (n: number) => Math.round(n * 10) / 10

/** Mali deterministički pomak po id-u oglasa (bez slučajnosti pri pokretanju). Vraća procente. */
export function polozajOglasa(opstina: OpstinaId, idOglasa: string): { x: number; y: number } {
  let h = 0
  for (const c of idOglasa) h = (h * 31 + c.charCodeAt(0)) % 9973
  const px = ((h % 61) - 30) / 30 // -1 .. 1
  const py = (((Math.floor(h / 61) + 7) % 61) - 30) / 30
  const o = OPSTINA_PO_ID[opstina]
  return { x: round1(o.x + px * NAJVECI_POMAK_PROCENATA), y: round1(o.y + py * NAJVECI_POMAK_PROCENATA) }
}
