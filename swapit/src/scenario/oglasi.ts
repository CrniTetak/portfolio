// SVI OGLASI (UX 7.3): 225 u Beogradu + 22 u regionu, upisani RUČNO kao redovi tabele (nema slučajnog generisanja pri pokretanju).
// Brojke za kategorije, tipove razmene, poene i firme se NE upisuju nigde: izvode se iz ovih redova (svet.ts), a testovi
// (ocekivano.test.ts) proveravaju da se slažu sa UX 7.3. Promena jednog reda menja brojače svuda.
//
// Kratak zapis reda: [kod, naslov, vlasnik, stanje+oznake, dodatno]
//   kod = šta se nudi i šta se traži / način:
//     rr ru ri   roba za robu / uslugu / ideju          ur uu ui   usluga za robu* / uslugu / ideju      ir iu ii   ideja za robu / uslugu / ideju
//     p10 p25 p50 p100   roba „za poene“ (vrednost)      pk   roba „poklanjam“
//     (*) „ur“ = usluga za robu, kao u UX 7.3 (nudim → tražim).
//   vlasnik = ključ korisnika ('marko', 'luka'…) ili id firme ('zupcanik', 'pedala'…); opština oglasa je opština vlasnika.
//   stanje: N Novo · K Kao novo · D i U Korišćeno · Z Za opravku (N8: četiri stanja svuda) (bez slova = nije primenljivo);
//   oznake: I istaknuto (red na P1) · T „Top ponuda“ · P PREMIUM · A javna aukcija.
import { KORISNIK_PO_KLJUCU, REGION_PO_KLJUCU } from './korisnici'
import { FIRMA_PO_ID } from './firme'
import { imaKljuc } from './kljuc'
import type { OpstinaId } from './opstine'
import type { VrednostPoena } from './cene'
import { JAVNA_MESTA } from './strane'

export type Vrsta = 'roba' | 'usluga' | 'ideja'
export type Nacin = 'razmena' | 'poeni' | 'poklon'
export type Istaknuto = 'red' | 'top' | 'premium'
/** Kako se roba preuzima (S10): samo lično, ili lično i kurirom (u priči: Markov bicikl). Prikaz i opis oglasa čitaju ISTO polje. */
export type Preuzimanje = 'licno' | 'licno-kurir'

export type Oglas = {
  id: string
  naslov: string
  kat: string
  vrsta: Vrsta
  nacin: Nacin
  /** Vrednost kad je način „za poene“ (10/25/50/100). */
  poeni?: VrednostPoena
  /** Šta se traži za razmenu (tip razmene = vrsta → trazi). */
  trazi?: Vrsta
  /** Id korisnika (ana_zvz84…) ili id firme. */
  vlasnik: string
  firma: boolean
  grad: string
  opstina?: OpstinaId
  drzava?: string
  stanje?: string
  istaknuto?: Istaknuto
  aukcija?: boolean
  /** Način preuzimanja robe; bez polja važi „samo lično“. */
  preuzimanje?: Preuzimanje
  /** Predmeti priče: radnje na njima su aktivne samo u svom koraku (PLAN B5.1). */
  rezervisan?: boolean
  /** Vrednost u poenima kad se stvar uzima „za poene“ u račvi (UX 7.3, poslednja tačka). */
  vrednostPoena?: number
  opis: string
}

type Kod = 'rr' | 'ru' | 'ri' | 'ur' | 'uu' | 'ui' | 'ir' | 'iu' | 'ii' | 'p10' | 'p25' | 'p50' | 'p100' | 'pk'
type Dodatno = { id?: string; vrednostPoena?: number; rezervisan?: boolean; preuzimanje?: Preuzimanje }
type Red = [kod: Kod, naslov: string, vlasnik: string, oznake?: string, dodatno?: Dodatno]

const VRSTA: Record<string, Vrsta> = { r: 'roba', u: 'usluga', i: 'ideja' }
const STANJE: Record<string, string> = { N: 'Novo', K: 'Kao novo', D: 'Korišćeno', U: 'Korišćeno', Z: 'Za opravku' }

const bezKvacica = (s: string) =>
  s
    .toLowerCase()
    .replace(/[čć]/g, 'c')
    .replace(/š/g, 's')
    .replace(/ž/g, 'z')
    .replace(/đ/g, 'dj')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

const iskoriscenaImena = new Set<string>()
function noviId(naslov: string, trazeni?: string): string {
  const osnova = trazeni ?? bezKvacica(naslov)
  let id = osnova
  for (let i = 2; iskoriscenaImena.has(id); i++) id = `${osnova}-${i}`
  iskoriscenaImena.add(id)
  return id
}

/** Tekst načina preuzimanja iz podatka oglasa (isti za opis i za polje „Preuzimanje“). */
export function preuzimanjeTekst(o: Pick<Oglas, 'vrsta' | 'preuzimanje'>): string {
  if (o.vrsta === 'usluga') return 'Termin se dogovara posle prihvaćene ponude'
  if (o.vrsta === 'ideja') return 'Predaja uz licencu, dogovara se posle prihvaćene ponude'
  return o.preuzimanje === 'licno-kurir' ? `Lično, na preporučenom javnom mestu (${JAVNA_MESTA[0]}) ili dostava kurirom` : `Samo lično, na preporučenom javnom mestu (${JAVNA_MESTA[0]})`
}

function opisZa(vrsta: Vrsta, naslov: string, stanje: string | undefined, mesto: string, preuzimanje?: Preuzimanje): string {
  if (vrsta === 'roba') return `${naslov}.${stanje ? ` Stanje: ${stanje}.` : ''} Preuzimanje ${preuzimanje === 'licno-kurir' ? 'lično, na preporučenom javnom mestu, ili dostava kurirom' : `samo lično, na preporučenom javnom mestu (${mesto})`}.`
  if (vrsta === 'usluga') return `${naslov}. Termin se dogovara posle prihvaćene ponude.`
  return `${naslov}. Savet ili plan; ideja se predaje uz licencu.`
}

function napravi(kat: string, red: Red): Oglas {
  const [kod, naslov, vlasnikKljuc, oznake = '', dodatno = {}] = red
  const vrsta = VRSTA[kod[0]] ?? 'roba'
  const jePoeni = kod[0] === 'p' && kod !== 'pk'
  const nacin: Nacin = kod === 'pk' ? 'poklon' : jePoeni ? 'poeni' : 'razmena'
  const firma = imaKljuc(FIRMA_PO_ID, vlasnikKljuc)
  const korisnik = firma ? null : KORISNIK_PO_KLJUCU[vlasnikKljuc]
  if (!firma && !korisnik) throw new Error(`Nepoznat vlasnik oglasa: ${vlasnikKljuc}`)
  const opstina = (firma ? FIRMA_PO_ID[vlasnikKljuc].opstina : korisnik!.opstina) as OpstinaId
  const stanje = oznake && STANJE[oznake[0]] ? STANJE[oznake[0]] : undefined
  const o: Oglas = {
    id: noviId(naslov, dodatno.id),
    naslov,
    kat,
    vrsta,
    nacin,
    vlasnik: firma ? vlasnikKljuc : korisnik!.id,
    firma,
    grad: 'Beograd',
    opstina,
    opis: '',
  }
  if (nacin === 'razmena') o.trazi = VRSTA[kod[1]]
  if (jePoeni) o.poeni = Number(kod.slice(1)) as VrednostPoena
  if (stanje) o.stanje = stanje
  if (oznake.includes('I')) o.istaknuto = 'red'
  if (oznake.includes('T')) o.istaknuto = 'top'
  if (oznake.includes('P')) o.istaknuto = 'premium'
  if (oznake.includes('A')) o.aukcija = true
  if (dodatno.rezervisan) o.rezervisan = true
  if (vrsta === 'roba') o.preuzimanje = dodatno.preuzimanje ?? 'licno'
  if (dodatno.vrednostPoena) o.vrednostPoena = dodatno.vrednostPoena
  o.opis = opisZa(vrsta, naslov, stanje, 'Beograd', o.preuzimanje)
  return o
}

const blok = (kat: string, redovi: Red[]): Oglas[] => redovi.map((r) => napravi(kat, r))

// ---------------------------------------------------------------------------------------------------------------------
// 225 oglasa u Beogradu, po kategorijama (redosled kao u UX 7.3)
// ---------------------------------------------------------------------------------------------------------------------
export const OGLASI_BEOGRAD: Oglas[] = [
  ...blok('bebe-i-deca', [
    ['rr', 'Dečja jakna', 'marko', 'D', { id: 'markova-jakna', vrednostPoena: 10, rezervisan: true }],
    ['rr', 'Školski ranac', 'jovana', 'K', { id: 'jovanin-ranac', vrednostPoena: 10, rezervisan: true }],
    ['rr', 'Autosedište do 18 kg', 'maja', 'K'],
    ['rr', 'Dečja stolica za hranjenje', 'luka', 'D'],
    ['rr', 'Nosiljka za bebe', 'tamara', 'D'],
    ['rr', 'Ljuljaška za bebe', 'ognjen', 'U'],
    ['ru', 'Kolica za bebe', 'vuk', 'D'],
    ['ri', 'Set za hranjenje beba', 'nina', 'K'],
    ['p10', 'Setić za kupanje bebe', 'petar', 'D'],
    ['p10', 'Dečje cipelice, broj 22', 'katarina', 'N'],
    ['p25', 'Dečja garderoba za dve godine (komplet)', 'milica', 'D'],
    ['pk', 'Igračke za bebe (komplet)', 'nikola', 'U'],
    ['pk', 'Dečja kapa i šal', 'sofija', 'K'],
    ['ir', 'Ideja: kako urediti sobu za bebu u malom stanu', 'teodora'],
  ]),
  ...blok('knjige', [
    ['rr', 'Udžbenici za 3. razred (komplet od 5)', 'jovana', 'D', { id: 'jovanini-udzbenici', vrednostPoena: 25, rezervisan: true }],
    ['rr', 'Dečje knjige — bajke (komplet)', 'jovana', 'D', { id: 'jovanine-knjige', vrednostPoena: 10, rezervisan: true }],
    ['rr', 'Romani Ive Andrića (komplet)', 'lazar', 'D'],
    ['rr', 'Enciklopedija za decu', 'lena', 'D'],
    ['rr', 'Kuvar domaće kuhinje', 'stevan', 'K'],
    ['rr', 'Udžbenici za 5. razred (komplet)', 'radovan', 'D'],
    ['rr', 'Strip albumi (komplet)', 'visnja', 'U'],
    ['ru', 'Rečnik engleskog jezika', 'djordje', 'D'],
    ['ri', 'Knjige o fotografiji', 'aleksa', 'D'],
    ['p10', 'Džepna izdanja romana', 'danica', 'U'],
    ['p10', 'Bojanke i slikovnice', 'mihailo', 'K'],
    ['p25', 'Školska lektira (komplet)', 'ivana', 'D'],
    ['pk', 'Stari časopisi o putovanjima', 'relja', 'U'],
    ['pk', 'Putopisi (tri knjige)', 'nenad', 'D'],
    ['pk', 'Priručnik za vozački ispit', 'bogdan', 'D'],
    ['pk', 'Knjige o vrtu i cveću', 'mina', 'D'],
  ]),
  ...blok('igre-i-konzole', [
    ['rr', 'Igre za PlayStation 4', 'veljko', 'D'],
    ['rr', 'Džojstik za konzolu', 'anja', 'D'],
    ['rr', 'Društvena igra Monopol', 'luka', 'K'],
    ['rr', 'Igre za Nintendo Switch', 'maja', 'K'],
    ['rr', 'Stoni fudbal', 'ognjen', 'D'],
    ['rr', 'Set društvenih igara', 'tamara', 'D'],
    ['ru', 'Xbox 360 sa dva džojstika', 'vuk', 'D'],
    ['ri', 'Retro konzola sa igrama', 'nina', 'DP'],
    ['p10', 'Slagalice od 1000 delova', 'petar', 'K'],
    ['p25', 'Igre za računar (komplet)', 'dusan', 'D'],
    ['p25', 'Volan za igrice', 'katarina', 'D'],
    ['p50', 'Nintendo Switch Lite', 'filip', 'K'],
    ['pk', 'Šah u drvenoj kutiji', 'milica', 'D'],
  ]),
  ...blok('sport-i-rekreacija', [
    ['rr', 'Set bučica 2×10 kg', 'zupcanik', 'NI'],
    ['rr', 'Strunjača za vežbanje', 'zupcanik', 'N'],
    ['rr', 'Fudbalska lopta', 'zupcanik', 'N'],
    ['rr', 'Teniski reket', 'nikola', 'D'],
    ['rr', 'Rolšue, broj 38', 'sofija', 'D'],
    ['rr', 'Kaciga za skijanje', 'uros', 'K'],
    ['ru', 'Orbitrek', 'teodora', 'D'],
    ['ri', 'Veslo za kajak', 'lazar', 'D'],
    ['p10', 'Set za stoni tenis', 'lena', 'D'],
    ['p25', 'Kopačke, broj 42', 'stevan', 'D'],
    ['p50', 'Sobni bicikl za vežbanje', 'radovan', 'D'],
    ['pk', 'Elastične trake za vežbanje', 'visnja', 'N'],
    ['ir', 'Program vežbanja za početnike', 'djordje'],
    ['iu', 'Plan trčanja za prvih pet kilometara', 'aleksa'],
  ]),
  ...blok('bicikli-i-trotineti', [
    ['rr', 'Gradski bicikl 28 inča', 'zupcanik', 'N'],
    ['rr', 'Dečji bicikl 16 inča', 'zupcanik', 'N'],
    ['rr', 'Dečji bicikl 20 inča', 'marko', 'D', { id: 'markov-bicikl', vrednostPoena: 50, rezervisan: true, preuzimanje: 'licno-kurir' }],
    ['rr', 'MTB bicikl STORM', 'mila', 'DA'],
    ['rr', 'Ženski bicikl sa korpom', 'irena', 'D'],
    ['ru', 'Trotinet za decu', 'bojan', 'D'],
    ['p50', 'Sklopivi bicikl', 'sanja', 'D'],
    ['p100', 'Električni trotinet', 'stefan', 'KI'],
    ['ur', 'Mali servis bicikla', 'pedala'],
    ['ur', 'Zamena guma i unutrašnjih guma', 'pedala'],
    ['ur', 'Podešavanje menjača i kočnica', 'pedala'],
    ['uu', 'Čišćenje i podmazivanje lanca', 'pedala'],
  ]),
  ...blok('namestaj', [
    ['rr', 'Crna ugaona garnitura', 'sanja', 'DI'],
    ['rr', 'Narandžasta fotelja', 'maja', 'D'],
    ['rr', 'Smeđi sto', 'ognjen', 'D'],
    ['rr', 'Beli ormar', 'tamara', 'DT'],
    ['rr', 'Komoda od hrastovine', 'vuk', 'D'],
    ['ru', 'Radni sto sa fiokama', 'nina', 'D'],
    ['ru', 'Trosed od štofa', 'petar', 'U'],
    ['ri', 'Polica za knjige', 'dusan', 'D'],
    ['p25', 'Noćni ormarić', 'katarina', 'D'],
    ['p50', 'Krevet 140×200 sa podnicom', 'filip', 'D'],
    ['p100', 'Trpezarijski sto sa šest stolica', 'milica', 'D'],
    ['pk', 'Drvena stolica', 'nikola', 'U'],
    ['ur', 'Restauracija starog nameštaja', 'hrast'],
    ['ur', 'Presvlačenje fotelja i stolica', 'hrast'],
  ]),
  ...blok('odeca', [
    ['rr', 'Zimska jakna, veličina M', 'uros', 'D'],
    ['rr', 'Farmerke, broj 32', 'teodora', 'K'],
    ['rr', 'Kožna jakna', 'lazar', 'D'],
    ['rr', 'Ženski kaput, veličina 40', 'lena', 'K'],
    ['ru', 'Svečano odelo', 'stevan', 'K'],
    ['p10', 'Majice (komplet od pet)', 'radovan', 'D'],
    ['p10', 'Šalovi i kape', 'visnja', 'D'],
    ['p25', 'Čizme, broj 39', 'djordje', 'D'],
    ['pk', 'Dečje majice (komplet)', 'aleksa', 'D'],
    ['pk', 'Kaiševi i tregeri', 'danica', 'D'],
    ['pk', 'Haljina, veličina 38', 'mihailo', 'D'],
    ['pk', 'Patike, broj 44', 'ivana', 'D'],
  ]),
  ...blok('sveze-voce-i-povrce', [
    ['rr', 'Krompir, 20 kg', 'relja'],
    ['rr', 'Jonatan jabuke, 10 kg', 'zorana', 'I'],
    ['rr', 'Kupus, 10 glavica', 'bogdan'],
    ['ru', 'Kruška abate fetel, 5 kg', 'mina'],
    ['p10', 'Grožđe, 5 kg', 'veljko'],
    ['p10', 'Šargarepa, 5 kg', 'anja'],
    ['pk', 'Jabuke iz sopstvenog voćnjaka', 'luka'],
    ['pk', 'Paradajz iz bašte', 'maja'],
  ]),
  ...blok('it-oprema', [
    ['rr', 'Crne slušalice', 'ognjen', 'D'],
    ['rr', 'Mrežni ruter', 'tamara', 'D'],
    ['rr', 'Eksterni hard disk, 1 TB', 'vuk', 'K'],
    ['ru', 'Monitor 24 inča', 'nina', 'D'],
    ['p25', 'Tastatura i miš', 'petar', 'D'],
    ['p50', 'Laserski štampač', 'dusan', 'D'],
    ['ir', 'Savet: kako složiti kućnu mrežu', 'katarina'],
    ['ii', 'Plan za pravljenje rezervnih kopija podataka', 'filip'],
  ]),
  ...blok('mobilni-telefoni', [
    ['rr', 'Samsung Galaxy A52', 'milica', 'DI'],
    ['rr', 'Punjač i kablovi (komplet)', 'nikola', 'K'],
    ['rr', 'Maska i zaštitno staklo', 'sofija', 'N'],
    ['ru', 'Pametni sat', 'uros', 'D'],
    ['p25', 'Bežične slušalice', 'teodora', 'D'],
    ['p50', 'Tablet 10 inča', 'lazar', 'D'],
    ['ur', 'Zamena ekrana na telefonu', 'bajt'],
    ['ui', 'Savet pri izboru telefona', 'bajt'],
  ]),
  ...blok('racunari-i-laptopovi', [
    ['rr', 'Retro laptop', 'lena', 'UA'],
    ['rr', 'Memorija RAM, 16 GB', 'stevan', 'K'],
    ['ru', 'Računar bez grafičke kartice', 'radovan', 'D'],
    ['p50', 'MSI grafička kartica', 'visnja', 'D'],
    ['p100', 'Laptop 15 inča', 'djordje', 'D'],
    ['ur', 'Servis i čišćenje računara', 'bajt'],
    ['ur', 'Instalacija operativnog sistema', 'bajt'],
    ['ui', 'Plan nadogradnje računara', 'bajt'],
  ]),
  ...blok('audio-i-video', [
    ['rr', 'Zvučnici 2.1', 'aleksa', 'D'],
    ['rr', 'Gramofon', 'danica', 'DA'],
    ['rr', 'Projektor', 'mihailo', 'D'],
    ['rr', 'Kućni bioskop', 'ivana', 'D'],
    ['ru', 'Radio-aparat', 'relja', 'U'],
    ['ri', 'Mikrofon za snimanje', 'zorana', 'K'],
    ['p10', 'Kablovi i adapteri', 'bogdan', 'D'],
    ['p25', 'Bluetooth zvučnik', 'mina', 'K'],
  ]),
  ...blok('alati-i-masine', [
    ['rr', 'Akumulatorska bušilica', 'veljko', 'D'],
    ['rr', 'Ugaona brusilica', 'anja', 'D'],
    ['ru', 'Cirkular testera', 'luka', 'D'],
    ['p10', 'Set odvijača', 'maja', 'K'],
    ['pk', 'Metar i libela', 'ognjen', 'D'],
    ['ur', 'Popravka električnih alata', 'cekic'],
    ['uu', 'Pomoć pri montaži polica i karniša', 'cekic'],
    ['ur', 'Oštrenje noževa i makaza', 'cekic'],
  ]),
  ...blok('igracke-i-hobiji', [
    ['rr', 'Lego kocke', 'tamara', 'D'],
    ['rr', 'Drvena kuhinja za decu', 'vuk', 'D'],
    ['rr', 'Plišane igračke', 'nina', 'D'],
    ['ru', 'Voz sa šinama', 'petar', 'D'],
    ['p10', 'Puzzle za decu', 'dusan', 'K'],
    ['p10', 'Bojice i farbe', 'katarina', 'N'],
    ['p25', 'Set za crtanje', 'filip', 'K'],
    ['pk', 'Kocke za slaganje', 'milica', 'D'],
  ]),
  ...blok('kucni-aparati', [
    ['rr', 'Usisivač', 'nikola', 'D'],
    ['ru', 'Veš mašina', 'sofija', 'D'],
    ['ri', 'Pegla sa parom', 'uros', 'D'],
    ['ur', 'Popravka veš mašina i frižidera', 'zavrtanj'],
    ['uu', 'Zamena grejača na mašini', 'zavrtanj'],
    ['ui', 'Savet pri kupovini kućnih aparata', 'zavrtanj'],
  ]),
  ...blok('kuhinjski-aparati', [
    ['rr', 'Blender', 'teodora', 'D'],
    ['rr', 'Toster', 'lazar', 'D'],
    ['rr', 'Mikser', 'lena', 'K'],
    ['ru', 'Aparat za kafu', 'stevan', 'D'],
    ['ri', 'Friteza na vrući vazduh', 'radovan', 'K'],
    ['pk', 'Sokovnik', 'visnja', 'D'],
  ]),
  ...blok('kucni-dekor', [
    ['rr', 'Dekorativna lampa', 'djordje', 'D'],
    ['ri', 'Keramička vaza', 'aleksa', 'D'],
    ['pk', 'Ramovi za slike', 'danica', 'D'],
    ['ir', 'Dizajn enterijera: savet za dnevnu sobu', 'mihailo'],
    ['ir', 'Plan za uređenje balkona', 'ivana'],
    ['iu', 'Ideja za zid sa fotografijama', 'relja'],
  ]),
  ...blok('muzika-i-instrumenti', [
    ['rr', 'Akustična gitara', 'zorana', 'DA'],
    ['rr', 'Klavijatura', 'bogdan', 'DA'],
    ['ru', 'Violina', 'mina', 'D'],
    ['ri', 'Ukulele', 'veljko', 'K'],
    ['p25', 'Mikrofon sa stalkom', 'anja', 'D'],
    ['ir', 'Plan vežbanja gitare za početnike', 'luka'],
  ]),
  ...blok('basta-i-biljke', [
    ['rr', 'Baštenski sto sa stolicama', 'maja', 'D'],
    ['ri', 'Saksije i žardinjere', 'ognjen', 'D'],
    ['pk', 'Sadnice cveća', 'tamara'],
    ['ur', 'Šišanje živice i košenje trave', 'vuk'],
    ['uu', 'Pomoć oko uređenja bašte', 'nina'],
    ['iu', 'Plan zasada povrtnjaka', 'petar'],
  ]),
  ...blok('kamping', [
    ['rr', 'Šator za četiri osobe', 'dusan', 'DP'],
    ['rr', 'Vreća za spavanje', 'katarina', 'D'],
    ['rr', 'Ranac za planinarenje', 'filip', 'D'],
    ['ru', 'Gasni rešo', 'milica', 'D'],
    ['pk', 'Baterijska lampa', 'nikola', 'D'],
    ['ir', 'Plan vikend ture za porodicu', 'sofija'],
  ]),
  ...blok('zdravlje-i-lepota', [
    ['rr', 'Mašinica za šišanje', 'uros', 'D'],
    ['ru', 'Fen za kosu', 'teodora', 'D'],
    ['pk', 'Masažer za vrat', 'lazar', 'K'],
  ]),
  ...blok('kancelarijska-oprema', [
    ['rr', 'Kancelarijska stolica', 'lena', 'D'],
    ['rr', 'Fascikle i registratori', 'stevan', 'N'],
    ['pk', 'Laminator', 'radovan', 'D'],
  ]),
  ...blok('kolekcionarstvo', [
    ['rr', 'Zbirka starih maraka', 'visnja', 'D'],
    ['rr', 'Stari novčići', 'djordje', 'D'],
    ['ru', 'Stare razglednice', 'aleksa', 'D'],
    ['ri', 'Antikvitetni sat', 'danica', 'DA'],
  ]),
  ...blok('ljubimci-oprema', [
    ['rr', 'Transporter za kućne ljubimce', 'mihailo', 'D'],
    ['ru', 'Ležaj za psa', 'ivana', 'K'],
    ['pk', 'Posude za hranu', 'relja', 'N'],
  ]),
  ...blok('foto-i-video', [
    ['rr', 'Foto-aparat', 'zorana', 'D'],
    ['rr', 'Stativ', 'bogdan', 'D'],
    ['p50', 'Objektiv 50 mm', 'mina', 'D'],
    ['pk', 'Torba za foto-opremu', 'veljko', 'D'],
  ]),
  ...blok('gradjevinski-materijal', [
    ['rr', 'Keramičke pločice (nekoliko kutija)', 'anja', 'N'],
    ['ur', 'Krečenje stanova', 'belizid'],
    ['uu', 'Gletovanje zidova', 'belizid'],
    ['ii', 'Savet za izbor boja za zidove', 'luka'],
  ]),
  ...blok('rasveta-i-elektrika', [
    ['rr', 'Plafonjerka', 'maja', 'D'],
    ['ru', 'LED reflektor', 'ognjen', 'D'],
    ['ur', 'Električne instalacije', 'dule'],
    ['uu', 'Zamena osigurača i utičnica', 'dule'],
    ['ui', 'Savet za rasvetu stana', 'dule'],
  ]),
  ...blok('nakit-i-satovi', [
    ['rr', 'Ručni sat', 'tamara', 'D'],
    ['ru', 'Srebrna narukvica', 'vuk', 'D'],
    ['p100', 'Zlatni lančić', 'nina', 'D'],
  ]),
  ...blok('poljoprivredne-masine', [
    ['rr', 'Motokultivator', 'petar', 'D'],
    ['rr', 'Leđna prskalica', 'dusan', 'D'],
    ['ru', 'Motorni trimer', 'katarina', 'D'],
  ]),
  ...blok('vozila', [
    ['rr', 'Yugo GV 1988', 'filip', 'U'],
    ['ru', 'Guma za automobil (komplet od četiri)', 'milica', 'D'],
    ['ri', 'Skuter od 50 kubika', 'sofija', 'D'],
  ]),
  ...blok('nekretnine', [
    ['rr', 'Garsonjera za zamenu za veći stan', 'uros'],
    ['ru', 'Vikendica', 'teodora'],
    ['ri', 'Plac', 'lazar'],
  ]),
]

/** Anin PlayStation 2 sa igrama: nije među 225; pojavljuje se kad Ana objavi oglas (korak 2). */
export const ANIN_PS2: Oglas = napravi('igre-i-konzole', ['rr', 'PlayStation 2 sa igrama', 'ana', 'U', { id: 'ana-ps2', vrednostPoena: 50, rezervisan: true }])

/** „Domaća šljivovica 5 l“: prijavljen oglas, zabranjen po pravilima; vidi se samo u uglu Moderacija (nije u brojačima). */
export const PRIJAVLJENI_OGLAS: Oglas = {
  ...napravi('sveze-voce-i-povrce', ['rr', 'Domaća šljivovica 5 l', 'nenad', '', { id: 'sljivovica', rezervisan: true }]),
  opis: 'Prijavljen oglas: pravila zabranjuju alkohol i prerađenu hranu.',
}

/** Id-jevi glavnih predmeta priče (jedan izvor; ekrani ih uvoze preko svet.ts umesto da ih pišu rukom). Test proverava da postoje u podacima. */
export const BICIKL_ID = 'markov-bicikl'
export const PS2_ID = 'ana-ps2'
export const UDZBENICI_ID = 'jovanini-udzbenici'
export const SLJIVOVICA_ID = 'sljivovica'

/** Id-jevi predmeta priče: rezervisani za priču (PLAN B5.1). Koristi ga test (sadrzaj.test.ts); talas 3 ga koristi da slobodni tokovi ne diraju predmete priče. */
export const REZERVISANI_IDOVI: string[] = [...OGLASI_BEOGRAD.filter((o) => o.rezervisan).map((o) => o.id), ANIN_PS2.id, PRIJAVLJENI_OGLAS.id]
const REZERVISANI_SKUP = new Set(REZERVISANI_IDOVI)

/**
 * K1: JEDNO pravilo „rezervisan za priču“ (jedna funkcija). Predmet priče se ne prijavljuje (O5), ne ističe (Z1/Z3), ne ide na aukciju, ne uređuje van koraka priče
 * i ne uklanja ni preko O6 ni preko moderacije (V2/V3). Jedini izuzetak je ponuda na Markovu dečju jaknu (primalac slobodnog toka, vidi ponude u Ponuda.tsx).
 * Prima oglas ili samo id.
 */
export const jeRezervisan = (oglasIliId: string | { id: string } | null | undefined): boolean => !!oglasIliId && REZERVISANI_SKUP.has(typeof oglasIliId === 'string' ? oglasIliId : oglasIliId.id)

// ---------------------------------------------------------------------------------------------------------------------
// 22 oglasa u regionu (po 2 u 11 gradova); vide se kad se u filteru promeni grad ili zemlja, ne ulaze u brojače Beograda
// ---------------------------------------------------------------------------------------------------------------------
type RegionRed = [kod: Kod, naslov: string, kat: string, grad: string, stanje?: string]

function regionOglas([kod, naslov, kat, kljucGrada, stanjeSlovo]: RegionRed): Oglas {
  const k = REGION_PO_KLJUCU[kljucGrada]
  const vrsta = VRSTA[kod[0]] ?? 'roba'
  const jePoeni = kod[0] === 'p' && kod !== 'pk'
  const nacin: Nacin = kod === 'pk' ? 'poklon' : jePoeni ? 'poeni' : 'razmena'
  const stanje = stanjeSlovo ? STANJE[stanjeSlovo] : undefined
  const o: Oglas = {
    id: noviId(`${naslov} ${k.grad}`),
    naslov,
    kat,
    vrsta,
    nacin,
    vlasnik: k.id,
    firma: false,
    grad: k.grad,
    drzava: k.drzava,
    opis: opisZa(vrsta, naslov, stanje, k.grad),
    ...(vrsta === 'roba' ? { preuzimanje: 'licno' as const } : {}),
  }
  if (nacin === 'razmena') o.trazi = VRSTA[kod[1]]
  if (jePoeni) o.poeni = Number(kod.slice(1)) as VrednostPoena
  if (stanje) o.stanje = stanje
  return o
}

export const OGLASI_REGION: Oglas[] = (
  [
    ['rr', 'Dečja kolica', 'bebe-i-deca', 'nis', 'D'],
    ['ru', 'Gitara za početnike', 'muzika-i-instrumenti', 'nis', 'D'],
    ['rr', 'Gradski bicikl', 'bicikli-i-trotineti', 'ns', 'D'],
    ['pk', 'Knjige za osnovnu školu', 'knjige', 'ns', 'D'],
    ['rr', 'Ormar sa ogledalom', 'namestaj', 'som', 'D'],
    ['p25', 'Baštenski alat', 'alati-i-masine', 'som', 'K'],
    ['rr', 'Foto-aparat', 'foto-i-video', 'sar', 'D'],
    ['ri', 'Set šolja i tanjira', 'kucni-dekor', 'sar', 'N'],
    ['rr', 'Zimska jakna', 'odeca', 'zen', 'D'],
    ['ru', 'Mikser', 'kuhinjski-aparati', 'zen', 'K'],
    ['rr', 'Slagalice i društvene igre', 'igracke-i-hobiji', 'zag', 'D'],
    ['p10', 'Dečje knjige', 'knjige', 'zag', 'D'],
    ['rr', 'Kajak veslo', 'sport-i-rekreacija', 'zad', 'D'],
    ['pk', 'Dečja stolica', 'bebe-i-deca', 'zad', 'D'],
    ['rr', 'Ronilačka maska', 'sport-i-rekreacija', 'dub', 'K'],
    ['ru', 'Radio-aparat', 'audio-i-video', 'dub', 'U'],
    ['rr', 'Laptop', 'racunari-i-laptopovi', 'sko', 'D'],
    ['p50', 'Tablet', 'mobilni-telefoni', 'sko', 'D'],
    ['rr', 'Šator za dve osobe', 'kamping', 'kum', 'D'],
    ['pk', 'Saksije', 'basta-i-biljke', 'kum', 'N'],
    ['rr', 'Gramofonske ploče', 'muzika-i-instrumenti', 'tir', 'D'],
    ['ri', 'Ručni sat', 'nakit-i-satovi', 'tir', 'D'],
  ] as RegionRed[]
).map(regionOglas)
