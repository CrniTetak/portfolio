// Zemlje demoa (PLAN B3). Jedino mesto gde se zemlje navode; ekrani ih čitaju kroz svet.ts.
// Nemačka, Austrija i Švajcarska su pilot (dijaspora); Grčka služi za prenosivost, Srbija za nedostupnost dela kanala (korak 6).

export type KodZemlje = 'DE' | 'AT' | 'CH' | 'GR' | 'RS'

export type Zemlja = {
  kod: KodZemlje
  naziv: string
  /** Lokativ („u Srbiji“) za rečenice: bez ručnog sklapanja padeža u ekranima. */
  lokativ: string
  /** Akuzativ („Dobrodošao u Srbiju“). */
  akuzativ: string
  /** Pilot tržište (dijaspora). */
  pilot: boolean
}

export const ZEMLJE: readonly Zemlja[] = [
  { kod: 'DE', naziv: 'Nemačka', lokativ: 'Nemačkoj', akuzativ: 'Nemačku', pilot: true },
  { kod: 'AT', naziv: 'Austrija', lokativ: 'Austriji', akuzativ: 'Austriju', pilot: true },
  { kod: 'CH', naziv: 'Švajcarska', lokativ: 'Švajcarskoj', akuzativ: 'Švajcarsku', pilot: true },
  { kod: 'GR', naziv: 'Grčka', lokativ: 'Grčkoj', akuzativ: 'Grčku', pilot: false },
  { kod: 'RS', naziv: 'Srbija', lokativ: 'Srbiji', akuzativ: 'Srbiju', pilot: false },
]

export const KODOVI_ZEMALJA: readonly KodZemlje[] = ZEMLJE.map((z) => z.kod)

export function zemlja(kod: KodZemlje): Zemlja {
  const z = ZEMLJE.find((x) => x.kod === kod)
  if (!z) throw new Error(`Nepoznata zemlja: ${kod}`)
  return z
}

/** Zemlja u kojoj porodica živi (pilot) i u koju se vraća. */
export const MATICNA_ZEMLJA: KodZemlje = 'DE'
