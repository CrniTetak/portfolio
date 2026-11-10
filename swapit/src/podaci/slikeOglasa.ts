// Koja fotografija ide uz koji oglas (PLAN B6.2, PK6). Slika je vezana za oglas STABILNIM KLJUČEM (id oglasa), ne za mesto u listi:
//  1) fotografija čiji je id isti kao id oglasa (predmeti priče i, od talasa 4, većina robe koja ima fotografiju);
//  2) izričit spisak SLIKA_PO_OGLASU: fotografija kategorije se daje samo oglasu koji joj stvarno odgovara
//     (jabuke uz jabuke, bučice uz bučice…), nikad „prvom oglasu u kategoriji“;
//  3) ko nema fotografiju dobija ilustraciju, a gde proizvodi iste kategorije moraju da se razlikuju (voće i povrće),
//     ikonicu po proizvodu (IKONICA_PO_OGLASU). Komponenta: komponente/SlikaOglasa.tsx.
import { FOTOGRAFIJE } from './fotografije'

const IDOVI = new Set(FOTOGRAFIJE.map((f) => f.id))

/** Oglas → fotografija koja pokazuje baš tu vrstu stvari. Novi oglas ovde dobija sliku tek kad se izričito upiše. */
export const SLIKA_PO_OGLASU: Record<string, string> = {
  'drvena-stolica': 'kat-namestaj',
  'monitor-24-inca': 'kat-it-oprema',
  'jonatan-jabuke-10-kg': 'kat-sveze-voce-i-povrce',
  'jabuke-iz-sopstvenog-vocnjaka': 'kat-sveze-voce-i-povrce',
}

/** Ikonica po proizvodu kad nema fotografije (S12: krompir nije jabuka). */
export const IKONICA_PO_OGLASU: Record<string, string> = {
  'krompir-20-kg': 'sprout',
  'kupus-10-glavica': 'leafy-green',
  'kruska-abate-fetel-5-kg': 'apple',
  'grozdje-5-kg': 'grape',
  'sargarepa-5-kg': 'carrot',
  'paradajz-iz-baste': 'cherry',
}

/** Id fotografije za oglas ili null. */
export function slikaOglasa(oglasId: string): string | null {
  const id = IDOVI.has(oglasId) ? oglasId : SLIKA_PO_OGLASU[oglasId]
  return id && IDOVI.has(id) ? id : null
}

