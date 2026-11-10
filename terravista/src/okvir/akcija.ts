import type { Grana } from '../podaci/svet'
import type { RadnjaId } from '../prica/matrica'
import { useDemo, type IzvorRadnje } from './stanje'

/**
 * Dugme koje je radnja priče: `akcija('plati', zamena, { proizvod })`. Ako je radnja na redu (i važi za proizvod priče), priča se pomera
 * (i ekrani prate poziciju); ako pripada budućem koraku (vođeni režim), pokazuje se poruka i ništa se ne dešava;
 * inače (radnja je prošla, drugi proizvod ili običan izbor) dugme radi kao u slobodnom klikanju — izvršava `zamena`.
 * `izvor` je uređaj na kome je dugme: efekat „Otvoreno na telefonu“ važi samo kad radnja sa televizora menja telefon.
 */
export function useAkcija(izvor: IzvorRadnje = 'tv') {
  const d = useDemo()
  return (id: RadnjaId, zamena: () => void, opcije: { grana?: Grana; proizvod?: string } = {}) => {
    if (d.radnja(id, opcije.grana, izvor, opcije.proizvod) === 'nije') zamena()
  }
}
