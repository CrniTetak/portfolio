// MERE okvira (PLAN B4.5, B6.3). Televizor je platno u „TV jedinicama“ umanjeno jednim faktorom; telefon isto.
export type Velicina = { sirina: number; visina: number }

/** Laptop: televizor 1920 × 1080 (mere iz UI.md). */
export const TV_PUNO: Velicina = { sirina: 1920, visina: 1080 }
/** Telefon (vodoravno i uspravno): krupno platno 960 × 540 — iste TV jedinice, pa je tekst relativno duplo krupniji (PLAN B6.3). */
export const TV_KRUPNO: Velicina = { sirina: 960, visina: 540 }
/** Telefon (uređaj u okviru, laptop): 360 × 760. */
export const TELEFON: Velicina = { sirina: 360, visina: 760 }

/** „Široko“ = laptop raspored (PLAN B4.5): širina ≥ 1000 px i odnos ≥ 1,2. */
export const UPIT_SIROKO = '(min-width: 1000px) and (min-aspect-ratio: 6/5)'
/** Niska visina prozora (npr. laptop sa Chrome trakama, ~650 px): daljinski prelazi sa dna u uspravnu kolonu pored televizora, da platno ostane što veće. */
export const UPIT_NISKO = '(max-height: 780px)'
export const UPIT_VODORAVNO = '(orientation: landscape)'

/** Zbir debljine okvira i unutrašnjeg razmaka uređaja (sa obe strane), u pikselima: ram TV 2 + 8, telefon 2 + 10. */
export const RAM_TV = 20
export const RAM_TELEFON = 24

// Trajanja (milisekunde). Ovde su da u .tsx fajlovima ne stoje „brojevi sa tri cifre“ (brava pravila/brave.test.ts).
/** Prikaz pritiska na daljinskom (UI 8). */
export const TRAJANJE_PRITISKA_MS = 120
/** Kratak „udar“ na ivici (izabrani element se pomeri i vrati). */
export const TRAJANJE_UDARA_MS = 140
/** Koliko dugo se vidi poruka (toast). */
export const NAJMANJE_TRAJANJE_PORUKE_MS = 6000
/** Pomak „udara“ u TV jedinicama. */
export const POMAK_UDARA = 10
/** Koliko dugo okvir telefona „svetli“ posle automatske radnje (Skenirano / Otvoreno na telefonu). */
export const TRAJANJE_SIJE_MS = 1800

/** Širina lepljive kolone kanala u vodiču (TV jedinice): 300 + razmak; element vodiča ne sme da ostane ispod nje. */
export const LEPLJIVA_KOLONA = 304
/** Poruka sa dugmetom (npr. „Idi na korak N“) ostaje duže, da stigne da se dostigne tastaturom. */
export const OSNOVA_TRAJANJA_PORUKE_MS = 2000
export const TRAJANJE_PO_ZNAKU_MS = 55
