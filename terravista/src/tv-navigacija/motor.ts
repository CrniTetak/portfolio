// MOTOR FOKUSA televizora (PLAN B5.2): drži spisak izbornih elemenata, slojeve (ekran, prozori preko ekrana), izbor i pamćenje.
// Čist TypeScript, bez Reacta i bez DOM-a (element se vidi samo kroz funkcije `rect`, `aktiviraj`, `prikaziIzabran`), pa se testira u Node-u.
// Pravila: tačno JEDAN izabran element u aktivnom sloju (nikad 0, nikad 2); bez kruženja; fokus ne izlazi iz otvorenog prozora;
// pri povratku na ekran vraća se zapamćeni izbor; „Nazad“ prvo zatvara prozor.
import { sledeci, type Kandidat, type Pravougaonik, type Smer } from './geometrija'

export const SLOJ_EKRAN = 'ekran'

export type StavkaMotora = {
  id: string
  sloj: string
  red?: string
  indeks?: number
  gore?: string
  dole?: string
  levo?: string
  desno?: string
  onemogucen?: boolean
  /** Tekst za red „Izabrano: …“. */
  etiketa: string
  rect: () => Pravougaonik
  aktiviraj: () => void
  /** Postavlja/skida vidljiv izbor (i DOM fokus kad je `da`). */
  prikaziIzabran: (da: boolean) => void
}

export type PocetniIzbor = string | (() => string | undefined)

type Sloj = { id: string; onNazad?: () => void; pocetni?: PocetniIzbor }

export type MotorOpcije = {
  /** Strelica na ivici: izbor ostaje, ali UI može da pokaže kratak „udar“. */
  onUdar?: (smer: Smer) => void
  /** Promena izbora (id ili null) i njegova etiketa. */
  onPromena?: (id: string | null, etiketa: string) => void
}

export class FokusMotor {
  private stavke = new Map<string, StavkaMotora>()
  private slojevi: Sloj[] = [{ id: SLOJ_EKRAN }]
  private izabranoPoSloju = new Map<string, string>()
  private ekranKljuc = ''
  private pocetniEkrana: PocetniIzbor | undefined
  private zapamcenoEkrana = new Map<string, string>()
  private zapamcenRed = new Map<string, string>()
  private zakazano = false
  /** Id elementa čiji je izbor poslednji put prikazan u aktivnom sloju (da uskladi() ne javlja bez promene). */
  private poslednjePrikazan: string | null = null

  constructor(private opcije: MotorOpcije = {}) {}

  // ---------------------------------------------------------------- ekran i slojevi
  /** Poziva se pri svakom novom ekranu (ključ = ekran + parametar). Zapamćeni izbor tog ekrana ostaje sačuvan. */
  noviEkran(kljuc: string, pocetni?: PocetniIzbor): void {
    this.ekranKljuc = kljuc
    this.pocetniEkrana = pocetni
    this.izabranoPoSloju.delete(SLOJ_EKRAN)
    this.poslednjePrikazan = null
    this.zakazi()
  }

  otvoriSloj(id: string, opcije: { onNazad?: () => void; pocetni?: PocetniIzbor } = {}): void {
    this.slojevi = this.slojevi.filter((s) => s.id !== id)
    this.slojevi.push({ id, ...opcije })
    this.izabranoPoSloju.delete(id)
    this.poslednjePrikazan = null
    this.zakazi()
  }

  zatvoriSloj(id: string): void {
    if (id === SLOJ_EKRAN) return
    this.poslednjePrikazan = null // izbor ispod prozora se ponovo prikazuje
    this.slojevi = this.slojevi.filter((s) => s.id !== id)
    this.izabranoPoSloju.delete(id)
    this.zakazi()
  }

  azurirajSloj(id: string, onNazad: (() => void) | undefined): void {
    const s = this.slojevi.find((x) => x.id === id)
    if (s) s.onNazad = onNazad
  }

  /** Ima li registrovanih elemenata (televizor je na ekranu)? Bez njih TV komande se ignorišu. */
  imaStavki(): boolean {
    return this.stavke.size > 0
  }

  /** Je li otvoren prozor preko ekrana? */
  imaSloj(): boolean {
    return this.slojevi.length > 1
  }

  get aktivniSloj(): string {
    return this.slojevi[this.slojevi.length - 1].id
  }

  // ---------------------------------------------------------------- registracija
  registruj(stavka: StavkaMotora): () => void {
    // Dva elementa sa istim id-om bi pokvarila izbor: u razvoju je to greška (React StrictMode odjavljuje pre ponovne prijave, pa nije lažna uzbuna).
    if (this.stavke.has(stavka.id) && this.stavke.get(stavka.id) !== stavka) throw new Error(`Duplikat id-a elementa televizora: ${stavka.id}`)
    this.stavke.set(stavka.id, stavka)
    this.zakazi()
    return () => this.odjavi(stavka)
  }

  private odjavi(stavka: StavkaMotora): void {
    // Odjava starog zapisa ne sme da obriše noviji sa istim id-om (React ponovo registruje pri izmeni svojstava).
    if (this.stavke.get(stavka.id) !== stavka) return
    this.stavke.delete(stavka.id)
    if (this.izabranoPoSloju.get(stavka.sloj) === stavka.id) {
      this.izabranoPoSloju.delete(stavka.sloj)
      stavka.prikaziIzabran(false)
    }
    this.zakazi()
  }

  // ---------------------------------------------------------------- izbor
  private uSloju(sloj: string): StavkaMotora[] {
    return [...this.stavke.values()].filter((s) => s.sloj === sloj)
  }

  private moguc(s: StavkaMotora | undefined): s is StavkaMotora {
    return !!s && !s.onemogucen && s.sloj === this.aktivniSloj
  }

  /** Trenutno izabrani element aktivnog sloja (ili undefined). */
  izabrani(): StavkaMotora | undefined {
    const id = this.izabranoPoSloju.get(this.aktivniSloj)
    const s = id ? this.stavke.get(id) : undefined
    return this.moguc(s) ? s : undefined
  }

  private kljucPamcenja(sloj: string): string | null {
    return sloj === SLOJ_EKRAN ? this.ekranKljuc : null
  }

  /** Izabira element (u aktivnom sloju). Vraća false ako ga nema ili je onemogućen. */
  izaberi(id: string): boolean {
    const s = this.stavke.get(id)
    if (!this.moguc(s)) return false
    const prethodni = this.izabranoPoSloju.get(s.sloj)
    if (prethodni && prethodni !== id) this.stavke.get(prethodni)?.prikaziIzabran(false)
    this.izabranoPoSloju.set(s.sloj, id)
    const k = this.kljucPamcenja(s.sloj)
    if (k !== null) {
      this.zapamcenoEkrana.set(k, id)
      if (s.red !== undefined) this.zapamcenRed.set(`${k}|${s.red}`, id)
    }
    s.prikaziIzabran(true)
    this.poslednjePrikazan = id
    this.opcije.onPromena?.(id, s.etiketa)
    return true
  }

  private pocetniId(): string | undefined {
    const sloj = this.slojevi[this.slojevi.length - 1]
    const kandidati: (string | undefined)[] = []
    if (sloj.id === SLOJ_EKRAN) {
      kandidati.push(this.zapamcenoEkrana.get(this.ekranKljuc))
      const p = this.pocetniEkrana
      kandidati.push(typeof p === 'function' ? p() : p)
    } else {
      const p = sloj.pocetni
      kandidati.push(typeof p === 'function' ? p() : p)
    }
    for (const id of kandidati) if (id !== undefined && this.moguc(this.stavke.get(id))) return id
    // Rezerva: prvi mogući element sloja po redosledu registracije — ekran nikad ne ostaje bez izbora.
    const mogucy = this.uSloju(sloj.id).filter((s) => !s.onemogucen)
    return (mogucy.find((s) => s.red !== 'nav') ?? mogucy[0])?.id
  }

  /**
   * Obezbeđuje pravilo „tačno jedan izabran“: ako izbor ne postoji (ili više nije moguć) bira početni;
   * svi ostali elementi (i iz nižih slojeva) gube oznaku izbora.
   */
  uskladi(): void {
    this.zakazano = false
    const postojeci = this.izabrani()
    if (postojeci === undefined) {
      const id = this.pocetniId()
      if (id !== undefined) this.izaberi(id)
      else this.opcije.onPromena?.(null, '')
    } else {
      // Izbor je ostao (npr. zatvoren je prozor preko ekrana): ponovo se prikazuje i javlja se etiketa.
      if (this.poslednjePrikazan !== postojeci.id) {
        postojeci.prikaziIzabran(true)
        this.opcije.onPromena?.(postojeci.id, postojeci.etiketa)
        this.poslednjePrikazan = postojeci.id
      }
    }
    const izabran = this.izabranoPoSloju.get(this.aktivniSloj)
    for (const s of this.stavke.values()) if (s.id !== izabran) s.prikaziIzabran(false)
  }

  /** Spajanje više registracija u jednu proveru (sve komponente ekrana se prvo upišu, pa se bira početni). */
  private zakazi(): void {
    if (this.zakazano) return
    this.zakazano = true
    queueMicrotask(() => {
      if (this.zakazano) this.uskladi()
    })
  }

  // ---------------------------------------------------------------- komande
  private kandidati(): Kandidat[] {
    return this.uSloju(this.aktivniSloj).map((s) => ({
      id: s.id,
      rect: s.rect(),
      red: s.red,
      indeks: s.indeks,
      gore: s.gore,
      dole: s.dole,
      levo: s.levo,
      desno: s.desno,
      onemogucen: s.onemogucen,
    }))
  }

  pomeri(smer: Smer): boolean {
    this.uskladi()
    const tr = this.izabrani()
    if (!tr) return false
    const svi = this.kandidati()
    const k = this.ekranKljuc
    const id = sledeci(svi.find((x) => x.id === tr.id)!, svi, smer, {
      zapamcenRed: (red) => (this.aktivniSloj === SLOJ_EKRAN ? this.zapamcenRed.get(`${k}|${red}`) : undefined),
    })
    if (id !== null && this.izaberi(id)) return true
    this.opcije.onUdar?.(smer)
    return false
  }

  /** OK na izabranom elementu. */
  ok(): void {
    this.uskladi()
    this.izabrani()?.aktiviraj()
  }

  /** Klik/dodir na element = izaberi + OK (klik u prazno ne briše izbor — to ovde ni ne stiže). */
  klik(id: string): void {
    if (this.izaberi(id)) this.stavke.get(id)!.aktiviraj()
  }

  /**
   * „Nazad“: ako je otvoren prozor, zatvara ga (poziva njegov onNazad) i vraća 'sloj'; inače vraća 'ekran'
   * i pozivalac vraća na prethodni ekran.
   */
  nazad(): 'sloj' | 'ekran' {
    if (this.slojevi.length > 1) {
      this.slojevi[this.slojevi.length - 1].onNazad?.()
      return 'sloj'
    }
    return 'ekran'
  }

  // ---------------------------------------------------------------- pamćenje izbora po ekranu i redu
  zaboraviSve(): void {
    this.zapamcenoEkrana.clear()
    this.zapamcenRed.clear()
  }

  /** Samo za testove i proveru: ID-ovi u sloju koji su trenutno označeni kao izabrani. */
  brojIzabranih(): number {
    return this.izabrani() ? 1 : 0
  }
}
