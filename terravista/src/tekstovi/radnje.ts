// Kratki opisi radnji priče za poruku „Prvo: …“ kad se pritisne radnja koja još nije na redu u istom koraku (B4.6.6).
// Imena se ubacuju iz podaci/ (popuni u podaci/svet.ts).
import type { RadnjaId } from '../prica/matrica'

export const PRVO_PRITISNI: Record<RadnjaId, string> = {
  pocni: 'pritisni Počni na televizoru',
  'gledaj-besplatni-film': 'pusti besplatni film na televizoru',
  'pokazi-reklamu': 'pokaži reklamnu pauzu na televizoru',
  'nastavi-program': 'pritisni Nastavi program na televizoru',
  'otvori-kanal-price': 'otvori kanal {glavniKanal} na televizoru',
  pretplati: 'pritisni Pretplati se na televizoru',
  skeniraj: 'pritisni Skeniraj telefonom na televizoru',
  'nastavi-kao-ana': 'pritisni Nastavi kao {ana} na telefonu',
  razumem: 'štikliraj Razumem na telefonu',
  'na-placanje': 'pritisni Nastavi na plaćanje na telefonu',
  plati: 'pritisni Pretplati se na telefonu',
  'vrati-na-tv': 'pritisni Vrati se na televizor na telefonu',
  'otvori-paket-price': 'otvori {paketPrice} na televizoru',
  'pretplati-paket': 'pritisni Pretplati se na paket na televizoru',
  'izaberi-grcku': 'izaberi zemlju na televizoru',
  'izaberi-srbiju': 'izaberi zemlju na televizoru',
  'pogledaj-nedostupan': 'pritisni Pogledaj {glavniKanal} na televizoru',
  'otkazi-kanal': 'otkaži kanal na televizoru',
  'u-redu': 'pritisni U redu na televizoru',
  'otkazi-ugovore': 'pritisni dugme za otkaz ugovora na telefonu',
  'jetzt-kundigen': 'potvrdi otkaz na telefonu',
}
