// A6. Licence: kartica sa izmišljenim brojem licence, važenjem i statusom provere (bez zvaničnih znakova).
import { Chip } from '../../komponente/Chip'
import { Ekran } from '../../komponente/Ekran'
import { Kartica, Napomena } from '../../komponente/Kartica'
import { usePrica } from '../../prica/PricaProvider'
import { gotovo } from '../../pravila/izvedeno'
import { pogled } from '../../pravila/vidljivost'

export default function A6Licenca() {
  const { poz } = usePrica()
  const p = pogled('agent')
  const proverena = gotovo(poz, 'r1')
  return (
    <Ekran
      id="A6"
      naslov="Licence"
      podnaslov={p.agent.ime}
      akcije={proverena ? <Chip v="paid" ikona="check">Licence check completed</Chip> : <Chip v="nego" ikona="clock">Licence check pending</Chip>}
    >
      <Kartica naslov="Your licence" id="licenca">
        <dl className="terms">
          <div><dt>Holder</dt><dd>{p.agent.ime}</dd></div>
          <div><dt>Licence number</dt><dd className="mono">{p.agent.licenca}</dd></div>
          <div><dt>Valid until</dt><dd className="num">{p.agent.licencaVaziDo}</dd></div>
          <div><dt>Check status</dt><dd>{proverena ? 'Completed' : poz.korak === 3 ? 'Running' : 'Not yet run'}</dd></div>
        </dl>
      </Kartica>
      <Napomena>In this illustration, an agent needs a valid licence to use the platform. The licence and its number are fictional and carry no official mark.</Napomena>
    </Ekran>
  )
}
