// Polje pretrage unutar ekrana (P4, P5, P6): na računaru ono već stoji u zaglavlju, pa se ne ponavlja (jedino pravo polje u demou je pretraga,
// i na ekranu ga ne sme biti dva); na telefonu zaglavlje ima samo lupu, pa polje stoji u sadržaju.
import { useTelefon } from '../okvir/useMedia'
import { PoljePretrage } from './PoljePretrage'

export function PoljeNaTelefonu() {
  return useTelefon() ? <PoljePretrage saDetaljima={false} /> : null
}
