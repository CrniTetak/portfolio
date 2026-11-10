// Poslednja uloga viđena u linku (u memoriji): S6 i S7 nemaju ulogu u linku, pa zadržavaju ulogu iz koje je gledalac došao.
import type { Uloga } from '../prica/tipovi'

let zadnja: Uloga = 'guest'
export const zadnjaUloga = () => zadnja
export const postaviZadnjuUlogu = (u: Uloga) => {
  zadnja = u
}
