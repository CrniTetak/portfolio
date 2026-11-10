// Zajednički tipovi priče (PLAN B4).
/** Četiri ugla gledanja (UX 1.1). Jovana nema ugao: njene radnje su automatske. */
export type Ugao = 'ana' | 'marko' | 'prodavnica' | 'moderacija'
/** Grana priče od koraka 6: glavni tok (lanac razmene) ili „za poene“ (račva 6R–8R). */
export type Grana = 'lanac' | 'poeni'
/** „Vođena priča“ (kartica otvorena) ili „Slobodno“ (kartica sažeta). */
export type Rezim = 'vodjena' | 'slobodno'
/** Tema izgleda (UI 2.1 i 2.2). */
export type Tema = 'svetla' | 'tamna'
/** ID ekrana iz UX.md 5 (U1, R3, P6, O1, X13, C2, W4, J2, Z3, N1, D3, S4, F7, A6, V3). */
export type EkranId = string

/** Pozicija u priči: korak 1–9 i broj odrađenih radnji u njemu. n = 0 je POČETNO, n = broj radnji koraka je ZAVRŠNO. */
export type Poz = { korak: number; n: number; grana: Grana }

/**
 * Jedna radnja priče: ko je izvodi (kojim uglom) i na kom ekranu je dugme.
 * `auto` = radnja se odigra sama kad je gledalac u uglu koji je ne izvodi (npr. Jovana, Markovo prihvatanje kad gleda Ana).
 * Jovana nema ugao, pa je njena radnja `uloge: []` i `auto: true`.
 */
export type Radnja = { id: string; korak: number; uloge: Ugao[]; ekran: EkranId; auto?: boolean }

export const UGLOVI: Ugao[] = ['ana', 'marko', 'prodavnica', 'moderacija']
export const NAZIV_UGLA: Record<Ugao, string> = { ana: 'Ana', marko: 'Marko', prodavnica: 'Prodavnica', moderacija: 'Moderacija' }
