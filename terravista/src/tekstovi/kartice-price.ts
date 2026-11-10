// ŠABLONI KARTICA PRIČE (UX 3.2). Imena, kanali i cene se UBACUJU iz podaci/ (popuni u podaci/svet.ts): u tekstu stoje samo mesta tipa {ana}.
// Zato ovaj fajl prolazi bravu „bez ručnog upisa“ (pravila/brave.test.ts). Jedna kartica po koraku, redom od prvog do devetog.
export const SABLONI_KARTICA: readonly string[] = [
  '{ana} uključuje televizor u {gradLokativ}. TerraVista se otvara bez prijave i bez ugovora.',
  '{ana} otvara besplatni film. Posle nekog vremena dolazi pauza sa reklamom, jasno označenom.',
  '{ana} bira kanal domaćih serija: {glavniKanal}, {cenaKanala} mesečno, otkaz bilo kad. Stranica kanala pokazuje i u kojim zemljama radi.',
  'Na televizoru je QR kod. {ana} ga skenira telefonom, potvrđuje (lažni prikaz) i kanal se odmah otključava.',
  '{ana} uzima „{paketPrice}“ za {cenaPaketa} mesečno. Gledanje unazad radi samo tamo gde to dozvoljavaju prava.',
  'Porodica putuje. U Grčkoj sve radi kao kod kuće. U Srbiji deo kanala nije dostupan. {nedostupno}',
  '{ana} otkazuje kanal {glavniKanal} jednim klikom na televizoru, a „{paketPrice}“ preko dugmeta na telefonu — bez ponuda za zadržavanje. Porodica se vratila u {maticnaAkuzativ}.',
  '{vesna}, urednica izmišljenog kanala „{izmisljenKanal}“, vidi gledanost po zemljama i prihod od reklama.',
  'Tim platforme vidi prihode po delovima, pregled prava po zemljama i plan širenja: pilot pa nova tržišta.',
]
