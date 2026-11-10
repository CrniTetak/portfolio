// TEKSTOVI STRANICA (talas 3): uvod (U1), o ovom demou (U3), podrška (S1), kako radi SWAPIT (S3), pravni tekstovi (S4, NACRT) i kako ređamo oglase (P10).
// Brojke i rokovi u rečenicama dolaze iz cene.ts, prica.ts i poslovno.ts (jedan izvor), pa se ovde ne kucaju. Sve je izmišljeno za demo.
import { CENE, DANI_ISTICANJA, PAKETI_AUKCIJA, POCETNI_POENI, REKLAMA_DANA, ROK_ODGOVORA_DANA, ROK_PRIGOVORA_DANA } from './cene'
import { broj, din, poeni } from './format'
import { GODINE_PUNOLETSTVA } from './prica'
import { POENI_ISTICU_TEKST } from './poslovno'
import { PRUZALAC_USLUGE } from './strane'

// ---------------------------------------------------------------------------------------------------------------------
// U1 „Šta je ovo“ (UX 6.1)
// ---------------------------------------------------------------------------------------------------------------------
export const U1_NASLOV = 'SWAPIT — razmena bez novca'
export const U1_PODNASLOV = 'Razmeni stvari, usluge i ideje sa ljudima iz svog grada.'
export const U1_KORACI = [
  { naslov: 'Objavi', opis: 'Objavi stvar, uslugu ili ideju. Objava je besplatna.' },
  { naslov: 'Ponudi', opis: 'Izaberi šta nudiš za tuđi oglas, ili uzmi nešto „za poene“.' },
  { naslov: 'Razmeni', opis: 'Dogovorite predaju, obe strane potvrde prijem, pa ostavite recenziju.' },
]
export const U1_STA_JE_OVO = 'Ovo je klikabilni demo. Svi podaci su izmišljeni, ništa se ne šalje i ne naplaćuje; ono što uradiš pamti se samo dok je prozor otvoren.'
export const U1_STA_RESAVA = [
  'Lanac razmene: kad nemaš ono što on hoće, aplikacija spoji troje ljudi koji zajedno imaju ono što svako traži.',
  'Poeni: za stvar koju pokloniš ili predaš nekome ko je uzme za poene, SWAPIT ti dodeli poene kad primalac potvrdi prijem, a ti ih trošiš na nešto drugo (model u proveri).',
  'Lista želja: upišeš šta tražiš, a aplikacija ti javi kad se pojavi poklapanje u tvom gradu.',
]
export const U1_OD_CEGA_ZIVI = 'SWAPIT živi od plaćenog isticanja oglasa, paketa javnih aukcija i od firmi: poslovni nalog, akcije „staro za novo“, dostava i reklame. Razmena između građana je besplatna.'

// ---------------------------------------------------------------------------------------------------------------------
// U3 „O ovom demou“ (UX 6.1)
// ---------------------------------------------------------------------------------------------------------------------
export const U3_JESTE = ['Ilustrativan prikaz kako bi SWAPIT radio.', 'Svi podaci, imena i brojke su izmišljeni.', 'Ništa što uradiš ovde se ne šalje, a pamti se samo dok je prozor otvoren.']
export const U3_NIJE = ['Nije ponuda za prodaju ni za razmenu.', 'Ne naplaćuje ništa: plaćanje je lažni prikaz.', 'Nema pravih poruka, mape ni dostave.']
/** V1 (A): isti tekst svuda gde se crvena linija o podacima navodi (U1, U3, S3, S4). */
export const CRVENA_LINIJA_PODACI = 'Ne prikazuje javno telefon ni adresu građana; firme javno prikazuju (izmišljenu) adresu radnje. Na mapi je samo približna lokacija.'
/** V5: nazivi proizvoda u oglasima ostaju. */
export const CRVENA_LINIJA_PARTNERSTVA = 'Nema partnerstava ni reklama stvarnih marki; prodavnice, kurir i firme su izmišljeni. Nazivi proizvoda u oglasima opisuju ono što ljudi nude.'
/** V6: tačan opis šta se čuva (usklađeno sa demo/cuvanje.ts). */
export const CUVANJE_TEKST = 'Dok je prozor otvoren, pregledač pamti tvoje kretanje kroz demo (mesto u priči, tema, ono što si u demou objavio, ponudio ili izabrao). Ništa se ne šalje; zatvaranjem prozora sve se briše.'

export const CRVENE_LINIJE = [
  'Ne prenosi novac između korisnika: nema doplate novcem ni plaćanja za stvari.',
  'Poeni nisu novac: poeni se ne kupuju, ne isplaćuju i ne prenose, i nemaju vrednost van SWAPIT-a.',
  'Ne posreduje u prometu nekretnina i vozila: prenos vlasništva se završava van aplikacije, kod notara odnosno u MUP-u.',
  'Ne dozvoljava zabranjene stvari (spisak je jedan, u pravilima zajednice).',
  'Ne prikazuje ništa plaćeno bez oznake: reklame, isticanje, javne aukcije, PREMIUM i „Top ponuda“ su uvek označeni.',
  'Ne objavljuje recenziju bez potvrđene razmene.',
  CRVENA_LINIJA_PODACI,
  'Ne koristi ekološke tvrdnje koje ne može da dokaže.',
  CRVENA_LINIJA_PARTNERSTVA,
]
export const U3_ILUSTRATIVNI_IZNOSI = `Pretplata, akcija, reklama i dostava su izmišljeni iznosi (${din(CENE.pretplataMajstor)}, ${din(CENE.pretplataRadnja)}, ${din(CENE.akcijaStaroZaNovo)}, ${din(CENE.reklama7Dana)}, ${din(CENE.dostavaMala)} i ${din(CENE.dostavaVelika)}) i nisu cenovnik. Cene isticanja i paketa aukcija su takođe predlog za demo. Sve cene su u dinarima sa PDV-om.`
export const U3_POENI = `Poeni (${poeni(POCETNI_POENI)} na početku) su model u proveri: pre pravog proizvoda traži se mišljenje advokata. Poene dodeljuje i oduzima SWAPIT, nikad korisnik korisniku, i to tek posle potvrđenog prijema.`
export const U3_MAPA = 'Mapa je ilustrativna, nacrtana za demo. Oblici opština su približni, bez ulica i adresa, a na oglasima je samo približna lokacija.'
export const U3_KAKO_JE_NAPRAVLJEN = [
  'Demo je statična stranica bez servera i baze podataka. Ništa se ne šalje na mrežu.',
  'Jedino polje u koje se kuca je pretraga; ona samo filtrira oglase u demou. Ostala polja su unapred popunjena.',
  'Sve brojke, imena i datumi dolaze iz jednog izvora, a automatski testovi proveravaju da se zbirovi slažu.',
  'Fotografije su sa Wikimedia Commons-a, sa proverenom licencom; navođenje autora je ispod.',
  CUVANJE_TEKST + ' „Restart demo“ sve vraća na početak.',
]

// ---------------------------------------------------------------------------------------------------------------------
// S1 „Podrška“
// ---------------------------------------------------------------------------------------------------------------------
export const S1_KARTICE: { naslov: string; opis: string; ekran: string; parametri?: Record<string, string> }[] = [
  { naslov: 'Pravila zajednice i zabranjene stvari', opis: 'Šta sme, a šta ne sme da se objavi.', ekran: 'S2' },
  { naslov: 'Kako radi SWAPIT', opis: 'Oglas, ponuda, razmena, poeni, lanci i aukcije u šest kratkih odeljaka.', ekran: 'S3' },
  { naslov: 'Pravni tekstovi', opis: 'Uslovi korišćenja, politika privatnosti i kolačića (nacrt).', ekran: 'S4', parametri: { tekst: 'uslovi' } },
  { naslov: 'Prijavi problem', opis: 'Razmena nije obavljena, stvar nije kao u opisu, prevara ili tehnički problem.', ekran: 'S5' },
  { naslov: 'Kako ređamo oglase', opis: 'Glavni parametri rangiranja i šta znače oznake plaćenog.', ekran: 'P10' },
]
export const S1_ODGOVOR = 'Podrška odgovara na poruke u demou samo kao prikaz; ništa se ne šalje.'

// ---------------------------------------------------------------------------------------------------------------------
// S3 „Kako radi SWAPIT“ (šest odeljaka)
// ---------------------------------------------------------------------------------------------------------------------
export const S3_ODELJCI: { naslov: string; tekst: string }[] = [
  { naslov: 'Oglas, ponuda, razmena', tekst: 'Oglas je ono što objaviš: stvar, uslugu ili ideju. Ponuda je ono što nudiš za tuđi oglas. Razmena je prihvaćena ponuda koju su obe strane potvrdile posle primopredaje.' },
  { naslov: 'Poeni — model u proveri', tekst: `Za stvari koje daješ „za poene“ ili poklanjaš SWAPIT ti dodeljuje poene tek kad primalac potvrdi prijem, a kad uzmeš stvar „za poene“ SWAPIT ti ih oduzima. Poeni se ne kupuju, ne isplaćuju i ne prenose; na početku imaš ${poeni(POCETNI_POENI)}. ${POENI_ISTICU_TEKST}` },
  { naslov: 'Lista želja', tekst: 'Upišeš šta tražiš, pa ti aplikacija javi kad se pojavi oglas koji odgovara. Radijus je u demou samo prikaz.' },
  { naslov: 'Lanci razmene', tekst: 'Kad nemaš ono što druga strana hoće, aplikacija može da predloži razmenu u krug: troje ljudi, svako daje jednu stvar, svako dobija jednu. Lanac nastaje samo ako svi prihvate.' },
  { naslov: 'Javne aukcije', tekst: 'Javno nadmetanje ponudama za jedan oglas, sa rokom. Vlasnik na kraju bira ponudu koja mu odgovara — ne mora biti najveća. Novac se ne razmenjuje; plaća se samo paket aukcija platformi.' },
  { naslov: 'Recenzije i cene', tekst: `Recenziju može da ostavi samo ko je obavio razmenu. Objava oglasa je besplatna; isticanje košta od ${din(CENE.isticanje[DANI_ISTICANJA[0]])} do ${din(CENE.isticanje[DANI_ISTICANJA[2]])}, a paketi aukcija od ${din(CENE.paketiAukcija[PAKETI_AUKCIJA[0]])}. Svi iznosi u demou su izmišljeni i nisu cenovnik.` },
]

// ---------------------------------------------------------------------------------------------------------------------
// P10 „Kako ređamo oglase“
// ---------------------------------------------------------------------------------------------------------------------
export const P10_PARAMETRI = [
  'Istaknuti plaćeni oglasi čiji naslov ili opis odgovara upitu idu prvi (najviše dva) i uvek su označeni oznakom „Istaknuto · plaćeno“.',
  'Blizina: oglasi bliže tebi dolaze pre onih koji su dalje.',
  'Novina: noviji oglasi dolaze pre starijih.',
  'Poklapanje sa tvojom listom želja: oglasi koji odgovaraju onome što tražiš dolaze pre ostalih.',
]
export const P10_SPONZORISANO = 'Reklame firmi su odvojene od rezultata i uvek nose oznaku „Sponzorisano“, sa podatkom ko oglašava.'
/** S3: javne aukcije i „Top ponuda“/PREMIUM su plaćena mesta i uvek su označeni. */
export const P10_AUKCIJE = 'Javna aukcija je plaćena usluga vlasnika oglasa (paket aukcija) i svaka kartica aukcije nosi oznaku „Javna aukcija · plaćeno“. Aukcija ne menja redosled običnih rezultata, a vlasnik bira ponudu koja mu odgovara.'
export const P10_PREMIUM = '„Top ponuda“ i PREMIUM su plaćeno mesto u desnoj koloni početne strane; takvi oglasi su uvek označeni oznakom „Istaknuto · plaćeno“.'
export const P10_OZNAKE = 'Oznaka „Građanin“ znači da oglas objavljuje privatno lice, a „Firma“ da ga objavljuje registrovani trgovac ili zanatlija; prava potrošača važe samo kad je druga strana firma.'
export const P10_RECENZIJE = 'Recenzije proveravamo tako što ih dozvoljavamo samo posle potvrđene razmene: obe strane potvrđuju primopredaju, tek tada se otključava ocenjivanje.'

// ---------------------------------------------------------------------------------------------------------------------
// S4 pravni tekstovi (NACRT — nije pravni dokument; pregleda advokat pre upotrebe)
// ---------------------------------------------------------------------------------------------------------------------
export const S4_UPOZORENJE = 'Tekst za demo — nije pravni dokument'
export const S4_NAPOMENA = 'Ovo je nacrt koji služi samo za prikaz u demou. Pre prave upotrebe mora ga pregledati advokat. Kratko obaveštenje: kad je druga strana građanin, a ne trgovac, prava potrošača (reklamacija, povraćaj) ne važe.'

export type PravniTekst = { id: 'uslovi' | 'privatnost' | 'kolacici'; naziv: string; odeljci: { /** Oznaka odeljka koji ekran dopunjuje (npr. spisak zabranjenih stvari); bira se po id-u, ne po početku naslova. */ id?: 'zabranjene'; naslov: string; tekst: string }[] }

export const PRAVNI_TEKSTOVI: PravniTekst[] = [
  {
    id: 'uslovi',
    naziv: 'Uslovi korišćenja',
    odeljci: [
      { naslov: '1. O usluzi', tekst: `SWAPIT je oglasnik za razmenu stvari, usluga i ideja. Uslugu pruža ${PRUZALAC_USLUGE}. Platforma ne učestvuje u razmeni i ne prenosi novac između korisnika.` },
      { naslov: '2. Ko može da koristi', tekst: `Nalog mogu da otvore lica koja imaju ${GODINE_PUNOLETSTVA} ili više godina. Korisnik odgovara za tačnost podataka koje unese.` },
      { id: 'zabranjene', naslov: '3. Oglasi i zabranjene stvari', tekst: 'Korisnik sme da objavi samo ono što zaista ima i što sme da razmeni. Zabranjene stvari su navedene u spisku ispod, koji je isti kao u pravilima zajednice. Nekretnine i vozila se oglašavaju samo uz obaveštenje o notaru i MUP-u.' },
      { naslov: '4. Razmena i prava potrošača', tekst: 'Razmena se dogovara između korisnika. Kad je druga strana građanin, a ne trgovac, prava potrošača (reklamacija, povraćaj) ne važe. Kad je druga strana firma, važe pravila koja se na firmu odnose.' },
      { naslov: '5. Poeni (model u proveri)', tekst: `Poeni nisu novac: ne kupuju se, ne isplaćuju i ne prenose između korisnika. Poene dodeljuje i oduzima SWAPIT, tek posle potvrđenog prijema. ${POENI_ISTICU_TEKST}` },
      { naslov: '6. Plaćene usluge', tekst: `Platformi se plaća isticanje oglasa, paketi javnih aukcija, poslovni nalog, akcije, reklame (${broj(REKLAMA_DANA)} dana) i dostava. Iznosi u demou su izmišljeni i nisu cenovnik. Za usluge koje počinju odmah, pravo na odustanak (nacrt) se gubi kad se usluga izvrši; firma plaća kao poslovni korisnik.` },
      { naslov: '7. Moderacija i prigovor', tekst: `Moderacija uklanja oglase koji krše pravila, uz obrazloženje. Prigovor se ulaže u roku od ${ROK_PRIGOVORA_DANA} dana, a odgovor stiže u roku od ${ROK_ODGOVORA_DANA} dana (demo).` },
      { naslov: '8. Odgovornost', tekst: 'Platforma ne odgovara za sadržaj oglasa dok ne sazna da je nezakonit, a tada ga odmah uklanja. Korisnik odgovara za svoje oglase i dogovore.' },
      { naslov: '9. Izmene uslova', tekst: 'O izmenama uslova korisnici se obaveštavaju pre nego što počnu da važe.' },
    ],
  },
  {
    id: 'privatnost',
    naziv: 'Politika privatnosti',
    odeljci: [
      { naslov: '1. Koje podatke skupljamo', tekst: 'Korisničko ime, e-poštu ili broj telefona, grad i podatke o oglasima i razmenama. Ne tražimo pol, ulicu ni datum rođenja.' },
      { naslov: '2. Čemu služe', tekst: 'Za rad naloga, objavu oglasa, spajanje ponuda i želja, potvrdu telefona i bezbednost zajednice.' },
      { naslov: '3. Telefon i adresa građana nisu javni', tekst: 'Telefon građanina se otkriva tek posle prihvaćene ponude, a adresa građanina nikad; firme javno prikazuju (izmišljenu) adresu radnje. Na mapi je samo približna lokacija.' },
      { naslov: '4. Deljenje podataka', tekst: 'Podatke ne prodajemo. Kuriru se prosleđuje samo ono što je potrebno za dostavu.' },
      { naslov: '5. Vaša prava', tekst: 'Imate pravo uvida, ispravke i brisanja podataka, u skladu sa zakonom o zaštiti podataka o ličnosti.' },
      { naslov: '6. Ovaj demo', tekst: `U ovom demou se ne prikuplja nikakav podatak: sve je izmišljeno, a jedino polje je pretraga, koja se ne šalje nigde. ${CUVANJE_TEKST}` },
    ],
  },
  {
    id: 'kolacici',
    naziv: 'Politika kolačića',
    odeljci: [
      { naslov: '1. Šta su kolačići', tekst: 'Mali zapisi koje sajt ostavlja u pregledaču radi rada, pamćenja izbora i merenja.' },
      { naslov: '2. Koje bi koristio pravi proizvod', tekst: 'Neophodne (prijava, bezbednost) i, uz saglasnost korisnika, funkcionalne (tema, jezik). Reklamni kolačići ne bi se koristili bez saglasnosti.' },
      { naslov: '3. Ovaj demo', tekst: `Ovaj demo ne koristi kolačiće. ${CUVANJE_TEKST}` },
    ],
  },
]

