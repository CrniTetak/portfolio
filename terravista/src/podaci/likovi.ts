// LIKOVI, UREĐAJI i DEMO KODOVI (PLAN B3). Sve je izmišljeno i očigledno lažno.
// Ekrani i tekstovi imena ne upisuju rukom (brava): koriste ove stavke kroz svet.ts / popuni().

export type Lik = { id: 'ana' | 'nikola' | 'sara' | 'vesna'; ime: string; prezime?: string; uloga: string }

export const LIKOVI: readonly Lik[] = [
  { id: 'ana', ime: 'Ana', prezime: 'Marković', uloga: 'glavni lik priče' },
  { id: 'nikola', ime: 'Nikola', prezime: 'Marković', uloga: 'Anin muž' },
  { id: 'sara', ime: 'Sara', prezime: 'Marković', uloga: 'Anina ćerka' },
  { id: 'vesna', ime: 'Vesna', uloga: 'urednica izmišljenog kanala (korak 8)' },
]

export function lik(id: Lik['id']): Lik {
  const l = LIKOVI.find((x) => x.id === id)
  if (!l) throw new Error(`Nepoznat lik: ${id}`)
  return l
}

/** Prezime porodice (naziv profila na televizoru). */
export const PREZIME_PORODICE = 'Marković'
export const GRAD_PORODICE = 'Minhen'
/** Lokativ („u Minhenu“) za kartice priče. */
export const GRAD_PORODICE_LOKATIV = 'Minhenu'

export type Uredjaj = { id: string; naziv: string; vrsta: 'televizor' | 'telefon' }
export const UREDJAJI: readonly Uredjaj[] = [
  { id: 'tv-dnevna-soba', naziv: 'Televizor u dnevnoj sobi', vrsta: 'televizor' },
  { id: 'telefon-ane', naziv: 'Telefon Ane', vrsta: 'telefon' },
]
export const NAZIV_TELEVIZORA_NA_TELEFONU = 'Dnevna soba (demo)'

/** Očigledno lažni brojevi i kodovi; svi nose oznaku demo. */
export const DEMO_KODOVI = {
  telefon: '060 000 0000 (demo)',
  tvKod: 'TV-0000 (demo)',
  adresaZaKod: 'terravista.example',
  kartica: 'Demo kartica •••• 0000',
  racuni: ['DEMO-0001', 'DEMO-0002', 'DEMO-0003'],
} as const

/** Servisi za besplatne kanale na tabli platforme: izmišljeni, bez stvarnih imena. */
export const SERVISI = ['Servis A', 'Servis B', 'Servis C'] as const
