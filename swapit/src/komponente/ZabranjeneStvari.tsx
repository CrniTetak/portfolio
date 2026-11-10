// Spisak zabranjenih stvari (S2): isti spisak koristi tabla moderacije, odluka (V3), obaveštenje korisniku (V4) i pravila zajednice.
import { Veza } from './Veza'
import { OGRANICENJA_NEKRETNINE, ZABRANJENE_STVARI } from '../scenario/poslovno'

export function ZabranjeneStvari({ sazeto = false, link = true }: { sazeto?: boolean; link?: boolean }) {
  return (
    <div className="stog-sm" data-zabranjene-stvari>
      <ul className="lista-pravila">
        {ZABRANJENE_STVARI.map((z) => (
          <li key={z.naziv}>
            <b>{z.naziv}</b>
            {!sazeto && <span className="pomocni-tekst"> — {z.napomena}</span>}
          </li>
        ))}
      </ul>
      {!sazeto && <p className="pomocni-tekst">{OGRANICENJA_NEKRETNINE}</p>}
      {link && (
        <Veza ekran="S2" className="dugme dugme-tekst self-start">
          Ceo spisak i pravila zajednice
        </Veza>
      )}
    </div>
  )
}
