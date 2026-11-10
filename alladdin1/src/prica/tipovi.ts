// Zajednički tipovi priče (B4).
export type Uloga = 'organizer' | 'traveler' | 'advisor' | 'guest'
export type Ishod = 'A' | 'B' | 'C'
export type Rezim = 'guided' | 'free'
/** ID ekrana iz UX.md 5 (S1, G4, T6, V3 ...). */
export type EkranId = string

/** Pozicija u priči: korak 1–9 i broj odrađenih radnji u njemu. n = 0 je POČETNO, n = broj radnji koraka je ZAVRŠNO. */
export type Poz = { korak: number; n: number; ishod: Ishod }

/** Jedna radnja priče: ko je izvodi i na kom ekranu. 'any' = događaj bez izvođača ("Simulate: …"). */
export type Radnja = { id: string; korak: number; uloge: Uloga[] | 'any'; ekran: EkranId }

/** Događaji koje reducer prima. */
export type Dogadjaj = { t: 'radnja'; id: string; uloga: Uloga } | { t: 'sledeciKorak' } | { t: 'ishod'; ishod: Ishod }
