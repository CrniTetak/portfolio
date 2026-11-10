// Osnovni tipovi priče. Čist TypeScript, bez React-a.

export type Uloga = 'selling' | 'buying' | 'player' | 'agent' | 'financier'
export const ULOGE: Uloga[] = ['selling', 'buying', 'player', 'agent', 'financier']

export type Grana = 'approved' | 'rejected'
export type Rezim = 'guided' | 'free'

/** Stanje priče: korak 1-9, broj odrađenih pod-koraka u tom koraku, grana. Uloga i režim NISU deo stanja. */
export interface Pozicija {
  korak: number
  odradjeno: number
  grana: Grana
}

// Identifikatori ekrana prate UX.md (C = zajednički, S = prodavac, B = kupac, P = igrač, A = agent, F = finansijer).
export type EkranId =
  | 'C1' | 'C2' | 'C3'
  | 'S1' | 'S2' | 'S3' | 'S4' | 'S5' | 'S6' | 'S7' | 'S8' | 'S9' | 'S10' | 'S11' | 'S12' | 'S13'
  | 'B1' | 'B2' | 'B3' | 'B4' | 'B5' | 'B6' | 'B7' | 'B8' | 'B9' | 'B10' | 'B11'
  | 'P1' | 'P2' | 'P3' | 'P4' | 'P5' | 'P6' | 'P7' | 'P8'
  | 'A1' | 'A2' | 'A3' | 'A4' | 'A5' | 'A6' | 'A7'
  | 'F1' | 'F2' | 'F3' | 'F4' | 'F5' | 'F6' | 'F7'
  // Dodatno (nije među 49 ekrana): stavka "Club profile" iz navigacije
  | 'SP' | 'BP'

export const BROJ_KORAKA = 9

/** Radnja u priči. "sustav" = događaj koji ne izvodi nijedna strana (npr. banka potvrđuje uplatu). */
export interface RadnjaDef {
  id: string
  uloga: Uloga | 'sustav'
  /** Ekran na kom stoji dugme. Za "sustav" radnje: ekran kom pripada, a dugmad "Simulate" su u `simulira`. */
  ekran: EkranId
  /** Tekst dugmeta (engleski). */
  tekst: string
  /** Za odobrenja: koja uloga u klubu odobrava ("Act as"). */
  odobrava?: 'finance' | 'legal'
  /** Gde se (za "sustav" radnje) prikazuje dugme "Simulate: ...". */
  simulira?: { uloga: Uloga; ekran: EkranId }[]
  /** Razlog kad čeka "sustav" (npr. banka). Za ljudske radnje razlog se izvodi iz izvođača. */
  ceka?: string
  /** Red za "Needs your attention" izvođaču radnje. */
  pazi: string
  /** Kratak događaj za "Activity" (kad je radnja odrađena). */
  aktivnost: string
  /** Ko sme da vidi ovaj događaj u "Activity" (S2/B2). Podrazumevano obe strane (prodavac i kupac). */
  za?: Uloga[]
}

export interface KorakDef {
  broj: number
  /** Kratak naziv za vremensku liniju. */
  kratak: string
  /** Puni naziv za traku i panel. */
  naziv: string
  radnje: Record<Grana, RadnjaDef[]>
}
