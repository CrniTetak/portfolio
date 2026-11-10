// A2. Client's deal: sažetak transfera SAMO iz ugla igrača (faza, linija od 6 tačaka, lični uslovi i medicinski).
// Agent NE vidi uslove dogovora između klubova (rate, sell-on, bonuse klubova).
import { Chip } from '../../komponente/Chip'
import { DugmeLink } from '../../komponente/Dugme'
import { putZa } from '../../pravila/rute'
import { Ekran } from '../../komponente/Ekran'
import { Kartica, Red } from '../../komponente/Kartica'
import { VremenskaLinija6 } from '../../komponente/Linije'
import { usePrica } from '../../prica/PricaProvider'
import { nazivKoraka } from '../../prica/koraci'
import { celija } from '../../pravila/matrica'
import { gotovo, fazaKoraka } from '../../pravila/izvedeno'
import { pogled } from '../../pravila/vidljivost'

export default function A2Posao() {
  const { poz, zavrsenKorak } = usePrica()
  const p = pogled('agent')
  const c = celija(poz.korak, 'agent', poz.grana)
  const t1 = gotovo(poz, 't1')
  const t2 = gotovo(poz, 't2')
  const faza2 = fazaKoraka(poz, 2)
  return (
    <Ekran
      id="A2"
      naslov={`${p.klijent.ime} → ${p.noviKlub}`}
      podnaslov="Your client's deal"
      akcije={<Chip v="story">Step {poz.korak} · {nazivKoraka(poz.korak, poz.grana, 'kratak')}</Chip>}
    >
      <VremenskaLinija6 poz={poz} />
      <Kartica naslov="Where it stands" id="stanje">
        <p><b>{zavrsenKorak ? c.zavrsni : c.pocetni}</b></p>
      </Kartica>
      <div className="btnrow">
        <DugmeLink to={putZa('A3')} varijanta="secondary">Personal terms</DugmeLink>
        <DugmeLink to={putZa('A7')} varijanta="secondary">Exceptions</DugmeLink>
      </div>
      <div className="grid g-1-1">
        <Kartica naslov="Personal terms" id="uslovi">
          <Red
            naziv="Contract terms"
            opis={`${p.ugovor.godina} years with ${p.noviKlub}`}
            desno={
              faza2 === 'buduci' ? <Chip v="neutral" ikona="clock">Not started yet</Chip>
              : t2 ? <Chip v="paid" ikona="check">Agreed</Chip>
              : t1 ? <Chip v="info" ikona="check">Confirmed by you</Chip>
              : <Chip v="nego" ikona="pen">In negotiation</Chip>
            }
          />
        </Kartica>
        <Kartica naslov="Medical" id="medicinski">
          <Red
            naziv="Medical examination"
            opis={p.klinika.termin}
            desno={t2 ? <Chip v="paid" ikona="check">Passed</Chip> : faza2 === 'buduci' ? <Chip v="neutral" ikona="clock">Not started yet</Chip> : <Chip v="neutral" ikona="clock">Scheduled</Chip>}
          />
        </Kartica>
      </div>
    </Ekran>
  )
}
