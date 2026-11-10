// C2. Pregled tuđeg ("neživog") transfera. Šablon za 4 sporedna transfera po ulozi (prodavac, kupac).
import { useParams } from 'react-router'
import { Chip } from '../../komponente/Chip'
import { Ekran } from '../../komponente/Ekran'
import { DugmeLink } from '../../komponente/Dugme'
import { Kartica, Napomena, PlocicaPaznje, Red } from '../../komponente/Kartica'
import { LinijaKoraka } from '../../komponente/Linije'
import { KORACI } from '../../prica/koraci'
import { putZa } from '../../pravila/rute'
import { pogled } from '../../pravila/vidljivost'
import { eur } from '../../scenario/format'
import { PRODAVAC, KUPAC } from '../../scenario/strane'
import { Navigate } from 'react-router'

export default function C2PregledTransfera({ uloga }: { uloga: 'selling' | 'buying' }) {
  const { id } = useParams()
  const p = pogled(uloga)
  const t = p.sporedni.find((x) => x.id === id)
  if (!t) return <Navigate to={putZa(uloga === 'selling' ? 'S1' : 'B1')} replace />
  const mojKlub = uloga === 'selling' ? PRODAVAC.naziv : KUPAC.naziv
  const naziv = t.smer === 'Outgoing' ? `${t.igrac} → ${t.protivStrana}` : `${t.igrac} ← ${t.protivStrana}`
  const koraka = KORACI[t.korak - 1]
  return (
    <Ekran id="C2" naslov={naziv} podnaslov={`${t.tip} transfer · ${t.smer === 'Outgoing' ? 'Outgoing' : 'Incoming'}`}
      akcije={<><Chip v="neutral" ikona="eye">Overview only</Chip><Chip v="story">Step {t.korak} · {koraka.kratak}</Chip></>}>
      <PlocicaPaznje varijanta="info" ikona="info" naslov="Overview only">
        This transfer is not part of the guided story. You can see where it stands, but its steps do not move with the story bar.
      </PlocicaPaznje>
      <LinijaKoraka korak={t.korak} zakasnelo={t.zakasnelo} />
      <div className="grid g-1-1">
        <Kartica naslov="Parties" id="strane">
          <Red naziv="Your club" opis={mojKlub} />
          <Red naziv="Counterparty" opis={t.protivStrana} />
          <Red naziv="Type" opis={t.tip} />
        </Kartica>
        <Kartica naslov="Key terms" id="uslovi">
          <Red naziv="Open amount (approximate)" opis="Illustrative figure" desno={<b className="num">{eur(t.iznos)}</b>} />
          <Red naziv="Next deadline" desno={<b className="num" style={t.zakasnelo ? { color: 'var(--money-over)' } : undefined}>{t.rok}</b>} />
          <Red naziv="Phase" desno={<Chip v={t.zakasnelo ? 'over' : 'info'} ikona={t.zakasnelo ? 'warn' : 'clock'}>{t.zakasnelo ? 'Installment overdue' : `Step ${t.korak} · ${koraka.naziv}`}</Chip>} />
        </Kartica>
      </div>
      <Napomena>Detailed terms of this transfer are not part of the demo.</Napomena>
      <div>
        <DugmeLink to={putZa(uloga === 'selling' ? 'S2' : 'B2')} varijanta="primary">Open the main transfer instead</DugmeLink>
      </div>
    </Ekran>
  )
}
