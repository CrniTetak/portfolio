// Desna plutajuća traka (računar) i ikonska traka (telefon, slobodni režim). Stavke su u stavke.ts.
import { link, RUTA_PO_ID } from '../pravila/rute'
import { useDemo } from '../demo/DemoProvider'
import { svet } from '../scenario/svet'
import { Ikona } from './Ikone'
import { DESNA_TRAKA, IKONSKA_TRAKA } from './stavke'
import { useEkran } from './kontekst'

export function DesnaTraka() {
  const { ugao } = useEkran()
  return (
    <nav className="desna-traka" aria-label="Brze prečice" data-desna-traka>
      {DESNA_TRAKA.filter((s) => RUTA_PO_ID[s.ekran].uglovi.includes(ugao)).map((s) => (
        <a key={s.ekran} className="ikona-dugme" href={`#${link(s.ekran, ugao)}`} aria-label={s.naziv}>
          <Ikona naziv={s.ikona} />
        </a>
      ))}
    </nav>
  )
}

/** Ikonska traka iz Figme: pri dnu telefona, samo u slobodnom režimu (u vođenom je zamenjena trakom priče, a ikone idu u meni ≡). */
export function IkonskaTraka() {
  const { ugao } = useEkran()
  const demo = useDemo()
  const s = svet(demo.poz, demo.tokovi)
  const znacka = ugao === 'ana' ? s.znackaPaketa.ana : ugao === 'marko' ? s.znackaPaketa.marko : 0
  return (
    <nav className="ikonska-traka" aria-label="Glavna navigacija" data-donji data-ikonska-traka>
      {IKONSKA_TRAKA.filter((i) => RUTA_PO_ID[i.ekran].uglovi.includes(ugao)).map((i) => (
        <a key={i.ekran} className="ikona-dugme" href={`#${link(i.ekran, ugao)}`} aria-label={i.naziv}>
          <Ikona naziv={i.ikona} />
          {i.ekran === 'X12' && znacka > 0 && <span className="broj-znacka">{znacka}</span>}
        </a>
      ))}
    </nav>
  )
}
