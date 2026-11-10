// JEDAN SPISAK zabranjenih izraza i obrazaca (PLAN B7, UX 0/12). Koriste ga testovi (pravila/brave.test.ts) i e2e skripte.
// Spisak se dopunjuje, ne smanjuje.

/** Izrazi koji se ne smeju pojaviti ni u jednom tekstu na ekranu (cele reči/fraze, bez obzira na veličinu slova). */
export const ZABRANJENI_IZRAZI: string[] = [
  // ekološke tvrdnje i zaštićeni pojmovi (UX 0, BREND.md): jabučica kaže „Iz sopstvene proizvodnje“
  'organski',
  'eco friendly',
  'eko-',
  'CO₂',
  'ušteđeno',
  // plaćanje: nikad „sigurno“ uz plaćanje (UX 0)
  'sigurno plaćanje',
  'sigurna uplata',
  'sigurno plati',
  // stvarne mreže kartica i brendovi uklonjeni iz Figme
  'Visa',
  'Mastercard',
  'Elan',
  // imena iz Figme zamenjena izmišljenim (UX 10) i engleske oznake iz Figme
  'PrettyWoman88',
  'Mickey',
  'Top offer',
  'PAID',
  'Verified',
  'Swap completed',
  // V2: troje ljudi je „sve troje“ (ne „svi troje“, ne „sva trojica“)
  'svi troje',
  'sva trojica',
]

/** Izuzeci od spiska (svaki sa razlogom). Prazno. */
export const DOZVOLJENI_IZUZECI: { izraz: string; razlog: string }[] = []

/** Obrasci u IZVORNOM kodu (.tsx) koji se ne smeju pojaviti: nema obrazaca ni pravih polja za kucanje (PLAN B7). Jedino polje je pretraga. */
export const ZABRANJENI_OBRASCI_U_KODU: { naziv: string; obrazac: RegExp }[] = [
  { naziv: '<form', obrazac: /<form[\s>]/i },
  { naziv: '<textarea', obrazac: /<textarea[\s>]/i },
  { naziv: 'type="password"', obrazac: /type\s*=\s*[{"']\s*["']?password/i },
  { naziv: 'type="text"/email/tel/number/url/date', obrazac: /type\s*=\s*[{"']\s*["']?(text|email|tel|number|url|date|datetime-local|month|week|time)\b/i },
  { naziv: '<input bez checkbox/radio/range/search', obrazac: /<input\b(?![^>]*type\s*=\s*["'{]\s*["']?(checkbox|radio|range|search)\b)[^>]*>/i },
  { naziv: 'contentEditable', obrazac: /contentEditable/i },
  { naziv: 'atribut name na kontroli', obrazac: /<(input|select|button|textarea)\b[^>]*\sname\s*=/i },
  { naziv: 'onSubmit', obrazac: /onSubmit\s*=/i },
  { naziv: 'spoljni link (href koji ne počinje sa #)', obrazac: /href\s*=\s*["'{]\s*["']?(?!#)(https?:|\/\/|mailto:|tel:)/i },
  { naziv: 'type="submit"', obrazac: /type\s*=\s*["']submit["']/i },
  { naziv: 'klipbord', obrazac: /navigator\.clipboard/i },
  { naziv: 'mrežni poziv (fetch/XMLHttpRequest/WebSocket/sendBeacon)', obrazac: /\b(fetch\s*\(|XMLHttpRequest|new\s+WebSocket|sendBeacon)/ },
  { naziv: 'localStorage ili kolačići', obrazac: /\b(localStorage|document\.cookie|indexedDB)\b/ },
]

/**
 * Jedino pravo polje u celom demou je pretraga (PoljePretrage). Ovaj fajl sme da ima type="search" i autocomplete="off";
 * nijedan drugi izvorni fajl ne sme.
 */
export const FAJL_SA_POLJEM_PRETRAGE = 'komponente/PoljePretrage.tsx'

/** Goli brojevi od 2 ili više cifara u tekstu ekrana moraju doći iz scenario/. Izuzeci (svaki sa razlogom): */
export const DOZVOLJENI_BROJEVI: { obrazac: RegExp; razlog: string }[] = []

/** Izrazi koji nisu poslovno pravilo i ne smeju se čitati kao programerski žargon na ekranu. */
export const ZABRANJENI_ZARGON: string[] = ['TODO', 'lorem ipsum', 'work in progress']

