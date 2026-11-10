// Izmišljene strane u priči (UX.md 7.1). Sva imena su izmišljena.
// Ovde su samo imena i činjenice o stranama, bez glavnih iznosa. Iznosi su u uslovi.ts i racun.ts.

export const IGRAC = {
  ime: 'Luka Vranešević',
  kratko: 'L. Vranešević',
  ime1: 'Luka',
  godina: 19,
  rodjen: '12 Mar 2008',
  pozicija: 'Forward / winger',
  id: 'FCID-DEMO-0001',
  racunKraj: '4821',
} as const

export const PRODAVAC = {
  naziv: 'FK Dunavac Novi Rad',
  zemlja: 'Serbia (fictional)',
  osobe: {
    sporting: { uloga: 'Sporting director', ime: 'Dragan Lazić', inicijali: 'DL' },
    finance: { uloga: 'Finance', ime: 'Jelena Marković', inicijali: 'JM' },
    legal: { uloga: 'Legal', ime: 'Stevan Mirkov', inicijali: 'SM' },
  },
} as const

export const KUPAC = {
  naziv: 'Royal Verdane SC',
  zemlja: 'Western Europe (fictional)',
  osobe: {
    sporting: { uloga: 'Sporting director', ime: 'Anders Verheyen', inicijali: 'AV' },
    finance: { uloga: 'Finance', ime: 'Claire Dumont', inicijali: 'CD' },
    legal: { uloga: 'Legal', ime: 'Tomas Reinholt', inicijali: 'TR' },
  },
} as const

export const AGENT = {
  ime: 'Nikola Savić',
  licenca: 'AG-DEMO-3318',
  licencaVaziDo: '31 Dec 2028',
} as const

export const FINANSIJER = {
  naziv: 'Meridian Credit Partners',
  odeljenje: 'Credit desk',
  // Ostali finansijeri iz izbora na ekranu S11 (izmišljeni).
  ostali: ['Aldermoor Trade Finance', 'Brightwater Receivables Fund'],
} as const

export const ESCROW = {
  naziv: 'Northgate Custody Bank',
  napomena: 'fictional escrow partner',
  racunMaskiran: 'XX•• •••• •••• 7342',
  referencaBanke: 'NCB-DEMO-0001-27',
} as const

export const KLINIKA = { naziv: 'Riverside Sports Clinic (fictional)' } as const

// Sporedni transferi (C2). Iznosi su okvirni (UX 7.1). Tip: Permanent | Loan.
export type SmerTransfera = 'Outgoing' | 'Incoming'
export interface SporedniTransfer {
  id: string // deo rute: player-a
  igrac: string // "Player A"
  tip: 'Permanent' | 'Loan'
  smer: SmerTransfera
  protivStrana: string
  korak: number
  iznos: number // otvoreni iznos, celi evri
  rok: string // tekst roka
  zakasnelo?: boolean
}

// Strana prodavca (FK Dunavac): isti spisak kao u uzorku izgleda.
export const SPOREDNI_PRODAVAC: SporedniTransfer[] = [
  { id: 'player-a', igrac: 'Player A', tip: 'Loan', smer: 'Outgoing', protivStrana: 'Lakeside United', korak: 2, iznos: 300_000, rok: 'In 1 week' },
  { id: 'player-b', igrac: 'Player B', tip: 'Permanent', smer: 'Incoming', protivStrana: 'Kuzmin Sport Club', korak: 6, iznos: 1_200_000, rok: 'In 2 days' },
  { id: 'player-c', igrac: 'Player C', tip: 'Permanent', smer: 'Outgoing', protivStrana: 'Harbourline FC', korak: 8, iznos: 900_000, rok: 'Overdue 6 days', zakasnelo: true },
  { id: 'player-d', igrac: 'Player D', tip: 'Permanent', smer: 'Outgoing', protivStrana: 'Nordic Ironworks FC', korak: 1, iznos: 2_100_000, rok: 'In 3 days' },
]

// Strana kupca (Royal Verdane SC): UX.md ne navodi sporedne transfere kupca, pa su dodati po istom uzorku (odstupanje, vidi izveštaj).
export const SPOREDNI_KUPAC: SporedniTransfer[] = [
  { id: 'player-e', igrac: 'Player E', tip: 'Permanent', smer: 'Incoming', protivStrana: 'Harbourline FC', korak: 4, iznos: 1_800_000, rok: 'In 1 day' },
  { id: 'player-f', igrac: 'Player F', tip: 'Loan', smer: 'Outgoing', protivStrana: 'Nordic Ironworks FC', korak: 7, iznos: 250_000, rok: 'In 2 days' },
  { id: 'player-g', igrac: 'Player G', tip: 'Permanent', smer: 'Incoming', protivStrana: 'Kuzmin Sport Club', korak: 2, iznos: 3_200_000, rok: 'In 1 week' },
  { id: 'player-h', igrac: 'Player H', tip: 'Permanent', smer: 'Incoming', protivStrana: 'Lakeside United', korak: 8, iznos: 700_000, rok: 'Due in 6 days' },
]

// Sporedna potraživanja koja finansijer vidi samo kao pregled (F1/F2/F7).
export interface SporednoPotrazivanje {
  prodavac: string
  duznik: string
  nominal: number
  rokovi: string
}
export const SPOREDNA_POTRAZIVANJA: SporednoPotrazivanje[] = [
  { prodavac: 'Kuzmin Sport Club', duznik: 'Lakeside United', nominal: 1_800_000, rokovi: 'In 2 months and in 8 months' },
  { prodavac: 'Nordic Ironworks FC', duznik: 'Harbourline FC', nominal: 950_000, rokovi: 'In 3 months' },
]
