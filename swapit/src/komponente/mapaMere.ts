// Mere natpisa na ilustrativnoj mapi (S6). Odvojeno od Mapa.tsx jer su to mere crteža, ne tekst ekrana.

/** S6: natpis opštine nikad nije manji od 11 px na ekranu (računa se iz stvarne širine mape), a stoji IZNAD kruga grupe oglasa, ne preko njega. */
export const NAJMANJE_PX_NATPISA = 11
export const OSNOVNA_VELIKOST = 18
/** Razmak natpisa iznad vrha kruga grupe (u jedinicama viewBox-a); krug grupe je 4,5 % ispod središta opštine. */
export const POMAK_GRUPE_Y = 4.5
export const POMAK_NATPISA = 8
/** U gustom središtu grada natpis ide ISPOD kruga (Vračar, Zvezdara) (Voždovac takođe), da se ne sudara sa susednim krugovima i natpisima. */
export const NATPIS_STRANA: Record<string, 'dole' | 'desno'> = { vra: 'dole', zvz: 'dole', voz: 'dole' }

/** D2: opštine gustog središta; na uskom ekranu (skala mape ispod UZANA_SKALA) njihovi natpisi se ne crtaju, a ime izabranog područja piše ispod mape. */
export const GUSTO_SREDISTE = ['stg', 'sav', 'vra', 'zvz', 'voz']
export const UZANA_SKALA = 0.6

/** D2: na uskom ekranu natpis Čukarice ide ispod kruga, da se ne sudara sa natpisom Rakovice (veća slova u odnosu na mapu). */
export const NATPIS_STRANA_UZANO: Record<string, 'dole' | 'desno'> = { cuk: 'dole' }
