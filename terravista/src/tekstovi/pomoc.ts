// POMOĆ (T29/T30/P16): šest pitanja i kratki odgovori bez pravnih tvrdnji (UX 5.2). Odgovor na „Kome pripada ovaj demo?“ je ceo tekst oznake demoa.
import { NEDOSTUPNO, OZNAKA_DEMOA } from '../podaci/stalni-tekstovi'

export type Pitanje = { id: string; pitanje: string; odgovor: string }

export const POMOC: readonly Pitanje[] = [
  { id: 'kako-se-pretplacujem', pitanje: 'Kako se pretplaćujem?', odgovor: 'Izabereš kanal ili paket, skeniraš kod telefonom i potvrdiš. Kanal se odmah otključava na televizoru. Pretplata je mesečna.' },
  { id: 'kako-otkazujem', pitanje: 'Kako otkazujem?', odgovor: 'Na televizoru otvoriš „Moje pretplate“ i izabereš „Otkaži“. Na telefonu je dugme za otkaz uvek vidljivo. Nema ponuda za zadržavanje i nema dodatnih pitanja.' },
  { id: 'sta-znaci-nedostupno', pitanje: 'Šta znači „nije dostupno“?', odgovor: NEDOSTUPNO },
  { id: 'sta-znace-reklame', pitanje: 'Šta znače reklame?', odgovor: 'Besplatni kanali se plaćaju reklamama. Svaka reklama je označena rečju „Reklama“. Plaćeni kanali rade bez reklamnih pauza u ovom demou.' },
  { id: 'kako-radi-na-putovanju', pitanje: 'Kako radi na putovanju?', odgovor: 'Pretplate rade kao kod kuće tamo gde su prava obezbeđena (primer). Gde nisu, kanal pokazuje poruku umesto programa.' },
  { id: 'kome-pripada-demo', pitanje: 'Kome pripada ovaj demo?', odgovor: OZNAKA_DEMOA },
]

export const imaPitanje = (id: string): boolean => POMOC.some((p) => p.id === id)
export function pitanje(id: string): Pitanje {
  const p = POMOC.find((x) => x.id === id)
  if (!p) throw new Error(`Nepoznato pitanje: ${id}`)
  return p
}
