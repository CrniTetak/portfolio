// Registar komponenti ekrana: EkranId -> komponenta. Ekrani koji još nisu izgrađeni dobijaju uredno prazno stanje (Stub).
import type { ComponentType } from 'react'
import type { EkranId } from '../prica/tipovi'
import Stub from './zajednicki/Stub'
import C3ODemou from './zajednicki/C3ODemou'
import ProfilKluba from './zajednicki/ProfilKluba'
import Tabla from './sablon/Tabla'
import Pregled from './sablon/Pregled'
import Ponude from './sablon/Ponude'
import Pravila from './sablon/Pravila'
import Potpis from './sablon/Potpis'
import Registracija from './sablon/Registracija'
import Odobrenja from './sablon/Odobrenja'
import Izuzeci from './sablon/Izuzeci'
import S4LicniUslovi from './prodavac/S4LicniUslovi'
import S7Sigurnost from './prodavac/S7Sigurnost'
import S9Isplate from './prodavac/S9Isplate'
import S10Rate from './prodavac/S10Rate'
import S11Finansiranje from './prodavac/S11Finansiranje'
import B4LicniUslovi from './kupac/B4LicniUslovi'
import B7ObezbedenjeSredstava from './kupac/B7ObezbedenjeSredstava'
import B9Placanja from './kupac/B9Placanja'
import P1Pocetna from './igrac/P1Pocetna'
import P2Ugovor from './igrac/P2Ugovor'
import P3Udeo from './igrac/P3Udeo'
import P4Medicinski from './igrac/P4Medicinski'
import P5Dokumenta from './igrac/P5Dokumenta'
import P6Potvrda from './igrac/P6Potvrda'
import P7Privatnost from './igrac/P7Privatnost'
import P8Izuzetak from './igrac/P8Izuzetak'
import A1Pocetna from './agent/A1Pocetna'
import A2Posao from './agent/A2Posao'
import A3LicniUslovi from './agent/A3LicniUslovi'
import A4Provizija from './agent/A4Provizija'
import A5Dokumenta from './agent/A5Dokumenta'
import A6Licenca from './agent/A6Licenca'
import A7Izuzetak from './agent/A7Izuzetak'
import F1Tabla from './finansijer/F1Tabla'
import F2Potrazivanja from './finansijer/F2Potrazivanja'
import F3Detalj from './finansijer/F3Detalj'
import F4Ponuda from './finansijer/F4Ponuda'
import F5StatusPonude from './finansijer/F5StatusPonude'
import F6Pozicije from './finansijer/F6Pozicije'
import F7Pregled from './finansijer/F7Pregled'

const stubovi = new Map<EkranId, ComponentType>()
const stub = (id: EkranId): ComponentType => {
  if (!stubovi.has(id)) stubovi.set(id, () => <Stub id={id} />)
  return stubovi.get(id)!
}

export const KOMPONENTE: Partial<Record<EkranId, ComponentType>> = {
  C3: C3ODemou,
  // prodavac: svih 13 ekrana (+ Club profile)
  S1: () => <Tabla uloga="selling" />,
  S2: () => <Pregled uloga="selling" />,
  S3: () => <Ponude uloga="selling" />,
  S4: S4LicniUslovi,
  S5: () => <Pravila uloga="selling" />,
  S6: () => <Potpis uloga="selling" />,
  S7: S7Sigurnost,
  S8: () => <Registracija uloga="selling" />,
  S9: S9Isplate,
  S10: S10Rate,
  S11: S11Finansiranje,
  S12: () => <Odobrenja uloga="selling" />,
  S13: () => <Izuzeci uloga="selling" />,
  SP: () => <ProfilKluba uloga="selling" />,
  // kupac: svih 11 ekrana (+ Club profile)
  B1: () => <Tabla uloga="buying" />,
  B2: () => <Pregled uloga="buying" />,
  B3: () => <Ponude uloga="buying" />,
  B4: B4LicniUslovi,
  B5: () => <Pravila uloga="buying" />,
  B6: () => <Potpis uloga="buying" />,
  B7: B7ObezbedenjeSredstava,
  B8: () => <Registracija uloga="buying" />,
  B9: B9Placanja,
  B10: () => <Odobrenja uloga="buying" />,
  B11: () => <Izuzeci uloga="buying" />,
  BP: () => <ProfilKluba uloga="buying" />,
  // igrač (8), agent (7), finansijer (7): svi ekrani grane Approved (talas 2)
  P1: P1Pocetna, P2: P2Ugovor, P3: P3Udeo, P4: P4Medicinski, P5: P5Dokumenta, P6: P6Potvrda, P7: P7Privatnost, P8: P8Izuzetak,
  A1: A1Pocetna, A2: A2Posao, A3: A3LicniUslovi, A4: A4Provizija, A5: A5Dokumenta, A6: A6Licenca, A7: A7Izuzetak,
  F1: F1Tabla, F2: F2Potrazivanja, F3: F3Detalj, F4: F4Ponuda, F5: F5StatusPonude, F6: F6Pozicije, F7: F7Pregled,
}

export function komponentaZa(id: EkranId): ComponentType {
  return KOMPONENTE[id] ?? stub(id)
}
