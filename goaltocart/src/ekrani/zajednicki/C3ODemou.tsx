// C3. About this demo: šta demo jeste i šta nije. Bez brojki poslovnog modela.
import { Link } from 'react-router'
import { Ekran } from '../../komponente/Ekran'
import { Kartica, Napomena } from '../../komponente/Kartica'
import { usePrica } from '../../prica/PricaProvider'
import { TABLA, putZa } from '../../pravila/rute'
import { ESCROW } from '../../scenario/strane'

export default function C3ODemou() {
  const { uloga } = usePrica()
  return (
    <Ekran id="C3" naslov="About this demo" podnaslov="A click-through illustration of how one international transfer could be handled on one platform.">
      <div className="grid g-1-1">
        <Kartica naslov="What this demo is" id="jeste">
          <ul className="stack" style={{ margin: 0, paddingLeft: 18 }}>
            <li>An illustration. Every club, person, bank, amount and date is fictional.</li>
            <li>One story told from five points of view: selling club, buying club, player, agent and financier.</li>
            <li>A way to see what each side would see, and what it would not.</li>
          </ul>
        </Kartica>
        <Kartica naslov="What this demo is not" id="nije">
          <ul className="stack" style={{ margin: 0, paddingLeft: 18 }}>
            <li>Not legal or financial advice, and not a real service. Nothing is sent, signed or paid.</li>
            <li>Not a replacement for the transfer matching system (TMS) or the Clearing House. They are separate systems, and the platform does not replace them.</li>
            <li>Not a place to enter real data. Nothing is typed, and nothing leaves your browser.</li>
          </ul>
        </Kartica>
      </div>
      <Napomena>
        The escrow partner, {ESCROW.naziv}, is fictional. The roles and rules shown here are an illustration of a possible design, not a description of an existing product.
      </Napomena>
      <Kartica naslov="How your place is remembered" id="pamcenje">
        <p>Only your place in the story is kept, and only in this browser tab. When you close the tab, everything is forgotten and the next visit starts from the beginning.</p>
      </Kartica>
      <div>
        <Link className="btn btn-primary" to={putZa(TABLA[uloga])}>Back to the demo</Link>
      </div>
    </Ekran>
  )
}
