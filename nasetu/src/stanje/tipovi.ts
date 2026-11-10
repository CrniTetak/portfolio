// Oblik celog stanja prototipa. Sve se čuva u JEDNOM objektu (sessionStorage), pa nestaje zatvaranjem prozora.
import type { Oznaka } from '../podaci/lokacije'
import type { Razred, TipVlasnika } from '../logika/novac'
import type { StanjePrice } from '../prica/tipovi'
import type { Beleska, Izvidjanje, Nalog, Opcija, PrijavaLokacije, Predracun, Termin, Uloga, Zahtev } from '../logika/tipovi'

export type { Beleska, Nalog, PrijavaLokacije, Uloga } from '../logika/tipovi'

/** Povećava se kad se oblik stanja promeni, da stari sačuvani podaci ne sruše aplikaciju. */
export const VERZIJA_STANJA = 4
export const KLJUC_SESIJE = 'nasetu.prototip.v1'

export interface Brief {
  id: string
  produkcijaId: string
  vrsta: string
  grad: string
  zone: string[]
  termin: Termin
  razred: Razred
  tipovi: string[]
  stilovi: string[]
  uslovi: Oznaka[]
  budzetOd: number
  budzetDo: number
  napomena: string
  /** "Treba mi i traženje van kataloga": posle slanja nastaje predračun od 50 € (u dinarima) koji admin potvrđuje */
  vanKataloga: boolean
  /** "Treba mi pomoć oko dozvola (cena po dogovoru)": admin vidi oznaku uz zahtev, bez iznosa */
  pomocDozvole: boolean
  izvor: string
  poslat: number
  /** izbor koji je admin poslao za ovaj brief; null dok se priprema */
  izborId: string | null
}

export type TrajanjeLinka = 24 | 48 | 168

export interface Izbor {
  id: string
  /** ko ga deli: produkcija ili partner */
  akterId: string
  uloga: 'produkcija' | 'partner'
  naziv: string
  zaKoga: string
  briefId: string | null
  lokacijaIds: string[]
  /** "zašto je u izboru" po lokaciji */
  zasto: Record<string, string>
  trajanje: TrajanjeLinka
  /** od kada teče trajanje linka (simulirani sati) */
  linkOd: number
  /** kada je admin poslao izbor produkciji; null dok je u pripremi */
  poslatProdukciji: number | null
}

export interface Glas {
  izborId: string
  lokacijaId: string
  ime: string
  /** null = samo komentar, bez glasa */
  sud: 'da' | 'ne' | null
  komentar: string
  vreme: number
}

export interface Dogadjaj {
  sati: number
  tekst: string
  /** ID predračuna na koji se zapis odnosi (za istoriju na ekranu predračuna) */
  ref?: string
}

export interface Stanje {
  verzija: number
  uloga: Uloga
  prikazVlasnika: TipVlasnika
  /** simulirani sati od početka scenarija */
  sati: number
  demoSakriven: boolean
  /** vođena priča (dorada 3): režim, mesto u priči, odstupanje u slobodnom režimu */
  prica: StanjePrice
  briefovi: Brief[]
  izbori: Izbor[]
  glasovi: Glas[]
  opcije: Opcija[]
  zahtevi: Zahtev[]
  predracuni: Predracun[]
  izvidjanja: Izvidjanje[]
  prijaveLokacija: PrijavaLokacije[]
  /** nalozi na čekanju (B2), izmišljeni */
  nalozi: Nalog[]
  /** beleške o sporovima (B6), vidi ih samo admin */
  beleske: Beleska[]
  /** dani koje je vlasnik blokirao u kalendaru: lokacijaId → ISO dani (B7) */
  blokiraniDani: Record<string, string[]>
  dnevnik: Dogadjaj[]
  /** brojač za nove ID-jeve (deterministički, bez slučajnih brojeva) */
  brojac: number
}
