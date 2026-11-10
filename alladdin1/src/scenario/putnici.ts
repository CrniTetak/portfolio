// Spisak putnika za G8 (UX 8.6): soba i poseban zahtev. Imena stoje u strane.ts; ovde su samo vezani podaci.
import { LJUDI } from './strane'

export type RedPutnika = { ime: string; soba: 'Standard' | 'VIP suite'; zahtev: string; marko: boolean }

export const SPISAK_PUTNIKA: RedPutnika[] = [
  { ime: LJUDI.putnik.ime, soba: 'VIP suite', zahtev: 'None', marko: true },
  { ime: LJUDI.putnici[0], soba: 'Standard', zahtev: 'Vegetarian meal', marko: false },
  { ime: LJUDI.putnici[1], soba: 'Standard', zahtev: 'None', marko: false },
  { ime: LJUDI.putnici[2], soba: 'Standard', zahtev: 'Allergy (nuts)', marko: false },
]
/** Teodora je jedina u uzorku koja nije među prvih 96 koji plaćaju ratu 2 (UX 8.6). */
export const NEPLACA_RATU_2 = LJUDI.putnici[0]
