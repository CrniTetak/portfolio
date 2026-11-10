// Spisak SVIH radnji koje menjaju stanje. Dugmad na ekranima i "Skoči na…" koriste iste radnje.
import type { Razred, TipVlasnika } from '../logika/novac'
import type { CenovnikPrijave, Termin } from '../logika/tipovi'
import type { Brief, Stanje, TrajanjeLinka, Uloga } from './tipovi'

/** Ono što produkcija popuni u obrascu; ostalo (ID, vreme, izvor) dodaje reducer. */
export type NacrtBriefa = Omit<Brief, 'id' | 'produkcijaId' | 'poslat' | 'izborId' | 'izvor'>

export interface NacrtLokacije {
  naziv: string
  tip: string
  opstina: string
  kvadratura: number
  cenovnik: CenovnikPrijave
  /** vrednosti tehničkog lista (nikad adresa) */
  tehnicki: Record<string, string>
  brojFotografija: number
  dokaz: string
  fotografisanje: boolean
}

/** Preporuka partnera (B4): lokacija koju je partner upisao uz saglasnost vlasnika. */
export interface NacrtPreporuke {
  naziv: string
  tip: string
  opstina: string
  vlasnikNaziv: string
  saglasnostVlasnika: boolean
}

export type Akcija =
  | { tip: 'PROMENI_ULOGU'; uloga: Uloga }
  | { tip: 'PROMENI_PRIKAZ_VLASNIKA'; prikaz: TipVlasnika }
  | { tip: 'PREMOTAJ'; sati: number }
  | { tip: 'SAKRIJ_DEMO'; sakriven: boolean }
  | { tip: 'UCITAJ'; stanje: Stanje }
  | { tip: 'POSALJI_BRIEF'; brief: NacrtBriefa }
  | { tip: 'ADMIN_POSALJI_IZBOR'; briefId: string }
  | { tip: 'DODAJ_U_IZBOR'; lokacijaId: string }
  | { tip: 'UKLONI_IZ_IZBORA'; izborId: string; lokacijaId: string }
  | { tip: 'AZURIRAJ_IZBOR'; izborId: string; naziv?: string; zaKoga?: string; trajanje?: TrajanjeLinka }
  | { tip: 'NOVI_IZBOR' }
  | { tip: 'GLASAJ'; izborId: string; lokacijaId: string; ime: string; sud: 'da' | 'ne'; komentar: string }
  | { tip: 'KOMENTARISI'; izborId: string; lokacijaId: string; ime: string; komentar: string }
  | { tip: 'PREGLEDAN_PREDRACUN'; predracunId: string }
  | { tip: 'TRAZI_OPCIJU'; lokacijaId: string; termin: Termin }
  | { tip: 'OTPUSTI_OPCIJU'; opcijaId: string }
  | { tip: 'SIMULIRAJ_DRUGU_PRODUKCIJU'; lokacijaId: string }
  | { tip: 'POSALJI_ZAHTEV'; lokacijaId: string; termin: Termin; razred: Razred; prekovremeniSati: number; domacin?: boolean }
  | { tip: 'ODOBRI_ZAHTEV'; zahtevId: string }
  | { tip: 'ODBIJ_ZAHTEV'; zahtevId: string; razlog: string }
  | { tip: 'POTVRDI_UPLATU'; predracunId: string }
  | { tip: 'ZATRAZI_IZVIDJANJE'; lokacijaId: string; kada: number; osoba: string; brojLjudi: number }
  | { tip: 'POTVRDI_IZVIDJANJE'; id: string }
  | { tip: 'ODBIJ_IZVIDJANJE'; id: string }
  | { tip: 'POSALJI_LOKACIJU'; lokacija: NacrtLokacije }
  | { tip: 'OTKAZI_REZERVACIJU_VLASNIK'; zahtevId: string }
  | { tip: 'ODOBRI_NALOG'; nalogId: string }
  | { tip: 'ODBIJ_NALOG'; nalogId: string }
  | { tip: 'ODOBRI_OBJAVU'; prijavaId: string }
  | { tip: 'ODBIJ_PRIJAVU'; prijavaId: string }
  | { tip: 'POSALJI_PREPORUKU'; preporuka: NacrtPreporuke }
  | { tip: 'DODAJ_BELESKU'; zahtevId: string; tekst: string }
  | { tip: 'BLOKIRAJ_DAN'; lokacijaId: string; dan: string }
  | { tip: 'ODBLOKIRAJ_DAN'; lokacijaId: string; dan: string }
