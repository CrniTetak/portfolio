// PRAVILO UX 3.1 u kodu: dugme radnje je aktivno samo ako je radnja SLEDEĆA i gledalac je u uglu koji je izvodi.
// Inače je vidljivo, ali neaktivno, uz razlog: „Urađeno“, „Dostupno u koraku N“, „Prvo: …“, „Čeka se …“, „Gledaj kao …“.
// Pregled (linkovi) radi uvek; ovo važi samo za dugmad koja pomeraju priču.
import { nadjiRadnju, sledecaRadnja } from '../prica/koraci'
import { mozeRadnja } from '../prica/reducer'
import { NAZIV_UGLA, type Poz, type Ugao } from '../prica/tipovi'
import { OPISI_RADNJI } from '../tekstovi/radnje'

export type StatusRadnje = {
  aktivno: boolean
  razlog?: string
  /** Ugao na koji gledalac može da pređe da bi probao radnju („Gledaj kao Marko“). */
  prebaci?: Ugao
}

export function statusRadnje(poz: Poz, ugao: Ugao, id: string): StatusRadnje {
  const nadjena = nadjiRadnju(id, poz.grana)
  if (!nadjena) return { aktivno: false, razlog: 'Nije deo ove grane priče' }
  if (mozeRadnja(poz, id, ugao)) return { aktivno: true }
  const { radnja, indeks } = nadjena
  if (poz.korak > radnja.korak || (poz.korak === radnja.korak && poz.n > indeks)) return { aktivno: false, razlog: 'Urađeno' }
  if (poz.korak < radnja.korak) return { aktivno: false, razlog: `Dostupno u koraku ${radnja.korak}` }
  const sl = sledecaRadnja(poz)
  if (sl && sl.id !== id) {
    if (sl.uloge.includes(ugao)) return { aktivno: false, razlog: `Prvo: ${OPISI_RADNJI[sl.id] ?? 'prethodni korak'}` }
    const prvi = sl.uloge[0]
    return prvi ? { aktivno: false, razlog: `Čeka se ${NAZIV_UGLA[prvi]}`, prebaci: prvi } : { aktivno: false, razlog: 'Čeka se Jovana' }
  }
  // sledeća je ova radnja, ali je izvodi drugi ugao
  const izvodjac = radnja.uloge[0]
  return izvodjac ? { aktivno: false, razlog: `Gledaj kao ${NAZIV_UGLA[izvodjac]}`, prebaci: izvodjac } : { aktivno: false, razlog: 'Odvija se samo' }
}
