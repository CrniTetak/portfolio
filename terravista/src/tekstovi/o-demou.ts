// TEKSTOVI za U3 „O ovom demou“ i P17 „Uslovi pretplate (nacrt)“. Imena, cene i kanali se ne kucaju ovde (ubacuju se iz podaci/).
// Bez pravnih tvrdnji: ovo su opisi namere i nacrt teksta koji čeka stručnu proveru.

export const DEMO_JESTE: readonly string[] = [
  'Ilustracija kako bi izgledala televizija bez ugovora.',
  'Svi podaci, cene, brojke, emisije i likovi su izmišljeni.',
  'Ništa se ne čuva, ne šalje i ne naplaćuje.',
]

export const DEMO_NIJE: readonly string[] = [
  'Nije ponuda ni cenovnik.',
  'Ne prenosi nijedan stvaran kanal ni program.',
  'Nazivi i logotipi kanala su samo prikaz, bez dogovora sa njima.',
  'Nema pravih naplata ni naloga.',
]

/** Šest linija koje platforma namerno ne prelazi (KONCEPT, „Šta platforma namerno NE radi“), bez tvrdnji o pravu. */
export const CRVENE_LINIJE: readonly string[] = [
  'Kanal koji nije dostupan u izabranoj zemlji se vidi u ponudi, ali se njegov program ne pušta.',
  'Nema piratskih izvora.',
  'Nikad se ne prikazuje dogovor koji ne postoji.',
  'Svaka reklama je jasno označena.',
  'Otkaz je jednako lak kao pretplata.',
  'Cilj nije da jedna platforma drži sve kanale.',
]

export const CENE_NAPOMENA = 'Cene su ilustracija, nisu cenovnik, i zavise od zemlje.'
export const LIKOVI_NAPOMENA = 'Porodica, urednica i kanal vlasnice su izmišljeni.'

export const USLOVI_NACRT_NAPOMENA = 'Nacrt teksta, nije pravni dokument; čeka stručnu proveru.'
export const USLOVI_ODELJCI: readonly { naslov: string; tekst: string }[] = [
  { naslov: 'Kako se pretplata naplaćuje', tekst: 'Pretplata se obnavlja mesečno, po ceni prikazanoj uz proizvod. Cena zavisi od zemlje (primer).' },
  { naslov: 'Kako se otkazuje', tekst: 'Otkaz je jednim klikom na televizoru ili preko dugmeta na telefonu. Gledaš do kraja plaćenog perioda (primer).' },
  { naslov: 'Odustanak', tekst: 'Pravila o odustanku su u izradi i čekaju stručnu proveru. U ovom demou ništa se ne naplaćuje.' },
  { naslov: 'Reklame', tekst: 'Besplatni kanali prikazuju reklame, uvek označene rečju „Reklama“.' },
]
