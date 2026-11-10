// Spisak fotografija po lokaciji (izvori i licence: docs/FOTOGRAFIJE.md).
// fajl = osnova bez sufiksa, npr. '/slike/lokacije/industrijski-loft/01' (dodaje se '-800.webp' / '-1600.webp')
export interface Fotografija { fajl: string; alt: string }

export const FOTOGRAFIJE: Record<string, Fotografija[]> = {
  'industrijski-loft': [
    { fajl: '/slike/lokacije/industrijski-loft/01', alt: 'Prazan prostor pod drvenim krovnim gredama, sa staklenim zidom u dnu' },
    { fajl: '/slike/lokacije/industrijski-loft/02', alt: 'Velika prazna hala sa zidovima od cigle i debelim drvenim stubovima' },
    { fajl: '/slike/lokacije/industrijski-loft/03', alt: 'Duga hala sa betonskim plafonom, okruglim svetlima i visokim prozorima' },
    { fajl: '/slike/lokacije/industrijski-loft/04', alt: 'Galerija na spratu ispod drvene krovne konstrukcije' },
    { fajl: '/slike/lokacije/industrijski-loft/05', alt: 'Spoljni izgled zgrade od cigle sa velikim prozorima' },
    { fajl: '/slike/lokacije/industrijski-loft/06', alt: 'Hodnik sa drvenim gredama, ciglom i prozorima duž zida' },
  ],
  'vila-sa-bastom': [
    { fajl: '/slike/lokacije/vila-sa-bastom/01', alt: 'Kuća sa travnjakom, četinarima i natkrivenom terasom' },
    { fajl: '/slike/lokacije/vila-sa-bastom/02', alt: 'Fotelje uz stakleni zid sa pogledom na baštu' },
    { fajl: '/slike/lokacije/vila-sa-bastom/03', alt: 'Trpezarijski sto i kuhinja, kroz staklo se vidi bašta' },
    { fajl: '/slike/lokacije/vila-sa-bastom/04', alt: 'Dnevna soba sa sivim garniturama i visokim prozorima' },
    { fajl: '/slike/lokacije/vila-sa-bastom/05', alt: 'Svetla kuhinja sa drvenim stolom i stepeništem' },
    { fajl: '/slike/lokacije/vila-sa-bastom/06', alt: 'Spavaća soba u svetlim tonovima' },
  ],
  'brutalisticka-hala': [
    { fajl: '/slike/lokacije/brutalisticka-hala/01', alt: 'Betonski foaje sa stubovima i zaobljenim zidom' },
    { fajl: '/slike/lokacije/brutalisticka-hala/02', alt: 'Širok prazan foaje sa stepenicima i niskim betonskim plafonom' },
    { fajl: '/slike/lokacije/brutalisticka-hala/03', alt: 'Stepenice i prazan pod u betonskom foajeu' },
    { fajl: '/slike/lokacije/brutalisticka-hala/04', alt: 'Velika sala sa pozornicom i redovima sedišta' },
    { fajl: '/slike/lokacije/brutalisticka-hala/05', alt: 'Stari zidni telefon na betonskom stubu' },
  ],
  'kafic-retro': [
    { fajl: '/slike/lokacije/kafic-retro/01', alt: 'Stolovi sa čipkanim stolnjacima i police pune starina' },
    { fajl: '/slike/lokacije/kafic-retro/02', alt: 'Zid pun starih slika i sitnica, crvene stolice i pod na kocke' },
    { fajl: '/slike/lokacije/kafic-retro/03', alt: 'Ugao sa starinskom lampom, knjigama i predmetima' },
    { fajl: '/slike/lokacije/kafic-retro/04', alt: 'Mačka na stolu ispred zida sa starim slikama' },
  ],
  'napusteni-magacin': [
    { fajl: '/slike/lokacije/napusteni-magacin/01', alt: 'Duga napuštena hala sa krovnim prozorima' },
    { fajl: '/slike/lokacije/napusteni-magacin/02', alt: 'Veliki otvor na zidu magacina, pogled na drveće napolju' },
    { fajl: '/slike/lokacije/napusteni-magacin/03', alt: 'Zid od cigle sa grafitima i šut na podu' },
    { fajl: '/slike/lokacije/napusteni-magacin/04', alt: 'Prostrana mračna hala sa metalnim stubovima' },
    { fajl: '/slike/lokacije/napusteni-magacin/05', alt: 'Prolaz sa grafitima i dnevnim svetlom na podu' },
    { fajl: '/slike/lokacije/napusteni-magacin/06', alt: 'Široka hala sa ostacima opreme i šutom' },
  ],
  'moderna-kancelarija': [
    { fajl: '/slike/lokacije/moderna-kancelarija/01', alt: 'Otvorena kancelarija uz stakleni zid sa pogledom na grad' },
    { fajl: '/slike/lokacije/moderna-kancelarija/02', alt: 'Kancelarija pregrađena staklenim zidovima' },
    { fajl: '/slike/lokacije/moderna-kancelarija/03', alt: 'Otvoren prostor sa radnim stolovima i stolicama' },
    { fajl: '/slike/lokacije/moderna-kancelarija/04', alt: 'Dug niz radnih stolova uz prozore' },
    { fajl: '/slike/lokacije/moderna-kancelarija/05', alt: 'Radni stolovi sa pregradama, izbliza' },
    { fajl: '/slike/lokacije/moderna-kancelarija/06', alt: 'Kancelarijska stolica i fioke, detalj' },
  ],
  'foto-studio': [
    { fajl: '/slike/lokacije/foto-studio/01', alt: 'Studio sa pozadinom od papira, dva velika svetla, stolica i barska stolica' },
    { fajl: '/slike/lokacije/foto-studio/02', alt: 'Pozadina za snimanje sa svetlima na stalcima' },
    { fajl: '/slike/lokacije/foto-studio/03', alt: 'Studio sa dva svetla i stolicama na pozadini' },
    { fajl: '/slike/lokacije/foto-studio/04', alt: 'Postavka svetla i pozadine u studiju' },
    { fajl: '/slike/lokacije/foto-studio/05', alt: 'Stolica i barska stolica ispred pozadine, izbliza' },
    { fajl: '/slike/lokacije/foto-studio/06', alt: 'Narandžasta pozadina sa barskom stolicom' },
  ],
  'stan-sedamdesete': [
    { fajl: '/slike/lokacije/stan-sedamdesete/01', alt: 'Trpezarijski sto, zid od cigle i police u starinskom stanu' },
    { fajl: '/slike/lokacije/stan-sedamdesete/02', alt: 'Crveni ležaj, fotelja i drvene police' },
    { fajl: '/slike/lokacije/stan-sedamdesete/03', alt: 'Drvena komoda i stona lampa kraj prozora' },
    { fajl: '/slike/lokacije/stan-sedamdesete/04', alt: 'Ležaj u sunčevoj svetlosti i crveni tepih' },
    { fajl: '/slike/lokacije/stan-sedamdesete/05', alt: 'Sofa, lampa i uramljene fotografije na zidu' },
  ],
  'hotelski-lobi': [
    { fajl: '/slike/lokacije/hotelski-lobi/01', alt: 'Kutak lobija sa zaobljenom sofom i podnim lampama' },
    { fajl: '/slike/lokacije/hotelski-lobi/02', alt: 'Recepcija od crnog mermera sa zlatnim detaljima' },
    { fajl: '/slike/lokacije/hotelski-lobi/03', alt: 'Kolica za prtljag ispred tamnog zida sa šarama' },
  ],
  'stara-fabrika': [
    { fajl: '/slike/lokacije/stara-fabrika/01', alt: 'Visoki fabrički prozori i stubovi' },
    { fajl: '/slike/lokacije/stara-fabrika/02', alt: 'Hala sa galerijom i starim kontrolnim pločama' },
    { fajl: '/slike/lokacije/stara-fabrika/03', alt: 'Stare cevi i lanci na zidu fabričke hale' },
    { fajl: '/slike/lokacije/stara-fabrika/04', alt: 'Hala sa cevima, metalnim stepenicama i staklenom ogradom' },
    { fajl: '/slike/lokacije/stara-fabrika/05', alt: 'Stare mašine u fabričkoj radionici' },
    { fajl: '/slike/lokacije/stara-fabrika/06', alt: 'Fasada fabrike sa lučnim prozorima' },
  ],
}

export const HERO = { fajl: '/slike/hero', alt: 'Studio za snimanje sa reflektorima i belom pozadinom' }
