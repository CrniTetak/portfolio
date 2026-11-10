// P7. Privacy: "Who sees what", jednostavan tekst bez tabele.
import { Ekran } from '../../komponente/Ekran'
import { Kartica, Napomena } from '../../komponente/Kartica'
import { pogled } from '../../pravila/vidljivost'
import { pct } from '../../scenario/format'

export default function P7Privatnost() {
  const p = pogled('player')
  return (
    <Ekran id="P7" naslov="Privacy" podnaslov="Who sees what">
      <Kartica naslov="Who sees what" id="ko-vidi">
        <ul className="stack" style={{ margin: 0, paddingLeft: 18 }}>
          <li>Your club and the buying club see the transfer.</li>
          <li>You see only your own contract, your {pct(p.udeo.pct)} share and your deadlines.</li>
          <li>You do not see the offers between the clubs, the agent commission or the sell-on terms.</li>
          <li>Medical results are private: only the outcome is shared.</li>
        </ul>
      </Kartica>
      <Napomena ikona="lock">This describes how the platform is designed to work in this illustration. It is not a statement about any real service or data protection practice.</Napomena>
    </Ekran>
  )
}
