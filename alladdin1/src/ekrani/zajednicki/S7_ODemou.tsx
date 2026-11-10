// S7 About this demo (UX 7.1): šta demo jeste i nije; spisak izmišljenih imena. Bez brojki poslovnog modela.
import { Kartica } from '../../komponente/Kartica'
import { Strana } from '../../komponente/Strana'
import {
  HOTEL_MACAU,
  KLUB,
  LJUDI,
  ORGANIZATOR_PUTOVANJA,
  PAKET_GRAND_PRIX,
  PAKET_MACAU,
  PAKET_VEGAS,
  PREVOZNIK,
} from '../../scenario/strane'

export function S7ODemou() {
  const imena = [
    LJUDI.organizator.ime,
    KLUB,
    LJUDI.putnik.ime,
    ...LJUDI.putnici,
    LJUDI.savetnik.ime,
    HOTEL_MACAU,
    PREVOZNIK,
    PAKET_MACAU,
    PAKET_VEGAS,
    PAKET_GRAND_PRIX,
    ORGANIZATOR_PUTOVANJA,
  ]
  return (
    <Strana naslov="About this demo" stanje="o-demou">
      <div className="grid gap-6 md:grid-cols-2">
        <Kartica naslov="What this demo is">
          <ul className="flex flex-col gap-2 text-ink-2">
            <li>An illustrative, clickable walk-through of how a group booking could work, from first inquiry to confirmation.</li>
            <li>Built with fictional data only. Nothing you do is saved on a server or sent anywhere.</li>
            <li>Three points of view: the group organizer, the traveler and the advisor.</li>
          </ul>
        </Kartica>
        <Kartica naslov="What it is not">
          <ul className="flex flex-col gap-2 text-ink-2">
            <li>It is not an offer, and no booking or payment is made.</li>
            <li>
              The company and licence in "{ORGANIZATOR_PUTOVANJA}" are invented. They only show WHERE the licensed trip organizer, who is responsible for the package, would be named. AllAddIn1 does not operate games of chance and does not extend credit for play.
            </li>
            <li>Names, companies and cities are fictional or illustrative; no country of incorporation is implied. Hotels, carriers and casinos are invented. Casino content is always shown as an offer of the partner casino under its own licence and terms.</li>
          </ul>
        </Kartica>
      </div>
      <Kartica naslov="What this demo does not show" tiha>
        <ul className="flex flex-col gap-2 text-ink-2">
          <li>Where deposits and traveler payments are held.</li>
          <li>What the partners' terms are after the fill deadline.</li>
          <li>Real prices, availability or licences.</li>
        </ul>
      </Kartica>
      <Kartica naslov="Fictional names used in the demo" tiha>
        <ul className="grid gap-x-6 gap-y-1 text-ink-2 sm:grid-cols-2">
          {imena.map((i) => (
            <li key={i}>{i}</li>
          ))}
        </ul>
      </Kartica>
    </Strana>
  )
}
