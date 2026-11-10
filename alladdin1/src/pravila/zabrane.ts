// JEDAN SPISAK zabranjenih izraza i obrazaca (B7, UX 0/11). Koriste ga testovi (pravila/brave.test.ts) i e2e skripte.
// Spisak se dopunjuje, ne smanjuje.

/** Izrazi koji se ne smeju pojaviti ni u jednom tekstu na ekranu (poređenje bez obzira na veličinu slova, kao cela reč/fraza). */
export const ZABRANJENI_IZRAZI: string[] = [
  // obećanja i podsticaji koje demo ne sme da daje (UX 0, 12)
  'Secure payment',
  'Secure',
  'crypto',
  'Gaming Credits',
  'casino credit',
  'High Stakes',
  '24/7',
  'Pay now',
  // stvarni brendovi uklonjeni iz Figme (UX 11)
  'Visa',
  'Mastercard',
  'WhatsApp',
  'Viber',
  'Wynn',
  'Air Serbia',
  'Air Palace',
  'Mercedes',
  'BMW',
  'Maybach',
  'Michelin',
]

/**
 * Izuzeci: ove fraze se u UX.md namerno javljaju (npr. dugme "Pay now" na T6 kad je radnja aktivna, "Pay now" je tamo
 * odobreno). Prazno dok izrada ne dođe do tih ekrana; svaki izuzetak mora imati razlog.
 */
export const DOZVOLJENI_IZUZECI: { izraz: string; razlog: string }[] = []

/** Obrasci u IZVORNOM kodu (.tsx) koji se ne smeju pojaviti: nema obrazaca ni pravih polja za kucanje (A3 odluka 2, B7). */
export const ZABRANJENI_OBRASCI_U_KODU: { naziv: string; obrazac: RegExp }[] = [
  { naziv: '<form', obrazac: /<form[\s>]/i },
  { naziv: '<textarea', obrazac: /<textarea[\s>]/i },
  { naziv: 'type="password"', obrazac: /type\s*=\s*[{"']\s*["']?password/i },
  { naziv: 'type="text"/email/tel/number/search/url/date', obrazac: /type\s*=\s*[{"']\s*["']?(text|email|tel|number|search|url|date|datetime-local|month|week|time)\b/i },
  { naziv: '<input bez checkbox/radio', obrazac: /<input\b(?![^>]*type\s*=\s*["'{]\s*["']?(checkbox|radio)\b)[^>]*>/i },
  { naziv: 'contentEditable', obrazac: /contentEditable/i },
  { naziv: 'autoComplete', obrazac: /autoComplete\s*=/i },
  { naziv: 'atribut name na kontroli', obrazac: /<(input|select|button)\b[^>]*\sname\s*=/i },
  { naziv: 'onSubmit', obrazac: /onSubmit\s*=/i },
  { naziv: 'spoljni link (href koji ne počinje sa #)', obrazac: /href\s*=\s*["'{]\s*["']?(?!#)(https?:|\/\/|mailto:|tel:)/i },
  { naziv: 'type="submit"', obrazac: /type\s*=\s*["']submit["']/i },
  { naziv: 'klipbord', obrazac: /navigator\.clipboard/i },
  { naziv: 'mrežni poziv (fetch/XMLHttpRequest/WebSocket/sendBeacon)', obrazac: /\b(fetch\s*\(|XMLHttpRequest|new\s+WebSocket|sendBeacon)/ },
  { naziv: 'localStorage ili kolačići', obrazac: /\b(localStorage|document\.cookie|indexedDB)\b/ },
]

/** Goli brojevi od 2 ili više cifara u tekstu ekrana moraju doći iz scenario/. Izuzeci (svaki sa razlogom): */
export const DOZVOLJENI_BROJEVI: { obrazac: RegExp; razlog: string }[] = [
  { obrazac: /\b18\b/, razlog: 'granica uzrasta 18+ (propis, nije scenario)' },
]

/** Izrazi koji nisu poslovno pravilo i ne smeju se čitati kao obećanje ili programerski žargon na ekranu. */
export const ZABRANJENI_ZARGON: string[] = ['next build', 'not built', 'work in progress', 'TODO', 'placeholder']
