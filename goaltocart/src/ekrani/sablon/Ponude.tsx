// S3 / B3. Soba za pregovore: trenutna ponuda, istorija verzija v1 -> v3, odgovor strane koja je na redu.
// Pravilo vidljivosti: samo prodavac i kupac vide ponude ("Only the selling club sees this offer").
import type { ReactNode } from 'react'
import { Chip } from '../../komponente/Chip'
import { AkcijaDugme, DugmeVanPrice } from '../../komponente/Dugme'
import { Ekran } from '../../komponente/Ekran'
import { Kartica, Napomena, PlocicaPaznje } from '../../komponente/Kartica'
import { IstorijaVerzija, UsloviPonude } from '../../komponente/Ponuda'
import { usePrica } from '../../prica/PricaProvider'
import { gotovo, odbijeno } from '../../pravila/izvedeno'
import { pogled } from '../../pravila/vidljivost'
import { DATUM } from '../../scenario/datumi'
import { broj, eur, nizRata, pct } from '../../scenario/format'
import { IGRAC } from '../../scenario/strane'
import type { VerzijaJavna } from '../../pravila/vidljivost'

type Klub = 'selling' | 'buying'

function Polje({ id, naziv, vrednost, pomoc }: { id: string; naziv: string; vrednost: string; pomoc?: string }) {
  return (
    <div className="field">
      <label htmlFor={id}>{naziv}</label>
      <input id={id} className="num" value={vrednost} readOnly />
      {pomoc && <span className="help">{pomoc}</span>}
    </div>
  )
}

/** Obrazac sa unapred popunjenim vrednostima verzije (samo prikaz, ništa se ne kuca). */
function ObrazacPonude({ v, naslov, dugme }: { v: VerzijaJavna; naslov: string; dugme: ReactNode }) {
  return (
    <Kartica naslov={naslov} id="obrazac">
      <div className="stack-lg">
        <div className="fieldgrid">
          <Polje id={`f-fix-${v.broj}`} naziv="Fixed fee" vrednost={eur(v.fiksni)} />
          <Polje id={`f-rate-${v.broj}`} naziv="Installments (3)" vrednost={nizRata(v.rate)} />
          <Polje id={`f-bon-${v.broj}`} naziv="Bonuses (3)" vrednost={eur(v.bonusi)} />
          <Polje id={`f-sell-${v.broj}`} naziv="Sell-on" vrednost={pct(v.sellOnPct)} />
          <Polje id={`f-vazi-${v.broj}`} naziv="Offer valid until" vrednost={DATUM.ponudaIsticeVreme} pomoc="Pre-filled for the demo" />
        </div>
        <div className="btnrow">{dugme}</div>
      </div>
    </Kartica>
  )
}

export default function Ponude({ uloga }: { uloga: Klub }) {
  const { poz } = usePrica()
  const prodavac = uloga === 'selling'
  const p = pogled(uloga)
  const o1 = gotovo(poz, 'o1')
  const o2 = gotovo(poz, 'o2')
  const o3 = gotovo(poz, 'o3')
  const n = 1 + (o1 ? 1 : 0) + (o2 ? 1 : 0) // broj poslatih verzija
  const v = p.verzije[n - 1]
  const prihvaceno = o3
  const neizvrseno = odbijeno(poz) // registracija odbijena: dogovoreni uslovi se ne izvršavaju
  // Na redu je prodavac kad je poslednja verzija od kupca (v1, v3), a kupac kad je od prodavca (v2)
  const naRedu: Klub = v.od === 'buyer' ? 'selling' : 'buying'
  const mojRed = !prihvaceno && naRedu === uloga

  const stanjeChip = neizvrseno ? (
    <Chip v="neutral" ikona="undo">Not carried out</Chip>
  ) : prihvaceno ? (
    <Chip v="paid" ikona="check">Agreed</Chip>
  ) : mojRed ? (
    <Chip v="nego" ikona="clock">Awaiting your reply</Chip>
  ) : (
    <Chip v="neutral" ikona="clock">Waiting for the {prodavac ? 'buying' : 'selling'} club</Chip>
  )

  const od = v.od === 'buyer' ? (prodavac ? p.protivStrana.naziv : p.klub.naziv) : prodavac ? p.klub.naziv : p.protivStrana.naziv
  const naslovKartice = neizvrseno
    ? 'Terms that were agreed (not carried out)'
    : prihvaceno
    ? `Agreed terms · v${v.broj}`
    : v.od === (prodavac ? 'seller' : 'buyer')
      ? `Your ${v.od === 'seller' ? 'counter-offer' : 'offer'} · v${v.broj}`
      : `Received from ${od} · v${v.broj}`

  return (
    <Ekran
      id={prodavac ? 'S3' : 'B3'}
      naslov={`${IGRAC.ime} → ${prodavac ? p.protivStrana.naziv : p.klub.naziv}`}
      crumb="Offers"
      transfer
      podnaslov={`Permanent transfer · Offer round ${n}`}
      akcije={neizvrseno ? <Chip v="neutral" ikona="undo">Not carried out</Chip> : prihvaceno ? <Chip v="paid" ikona="check">Agreed</Chip> : <Chip v="nego" ikona="pen">Negotiating</Chip>}
    >
      {!prihvaceno ? (
        <PlocicaPaznje varijanta="info" naslov={undefined} ikona="clock">
          <b>Current offer v{v.broj} expires {DATUM.ponudaIsticeVreme}</b> · {prodavac ? 'You only see offers addressed to your club.' : 'Only the selling club sees this offer.'}
        </PlocicaPaznje>
      ) : neizvrseno ? (
        <PlocicaPaznje varijanta="info" ikona="undo">
          <b>Offer v3 was accepted on {DATUM.prihvaceno}.</b> In this illustration, these terms are not carried out because the registration was refused.
        </PlocicaPaznje>
      ) : (
        <PlocicaPaznje varijanta="ok" ikona="check">
          <b>Offer v3 accepted on {DATUM.prihvaceno}.</b> The terms below are final. Next: personal terms and medical.
        </PlocicaPaznje>
      )}

      <div className="grid g-1-1">
        <div className="stack-lg">
          <Kartica naslov={naslovKartice} id="trenutna" desno={stanjeChip}>
            <div className="stack-lg">
              {neizvrseno ? (
                <dl className="terms">
                  <div><dt>Fixed fee</dt><dd className="num"><s>{eur(v.fiksni)}</s></dd></div>
                  <div><dt>Headline value</dt><dd className="num"><s>{eur(v.naslovna)}</s></dd></div>
                </dl>
              ) : (
                <UsloviPonude v={v} bonusiRaspis={prihvaceno ? p.dogovoreno.bonusi.map((b) => broj(b.iznos)).join(' + ') : undefined} />
              )}
              {mojRed && prodavac && (
                <div className="btnrow" aria-label="Reply to the offer">
                  {v.broj === 3 ? <AkcijaDugme radnja="o3" uloga="selling" ikona="check" /> : <DugmeVanPrice varijanta="primary">Accept</DugmeVanPrice>}
                  <DugmeVanPrice>Decline</DugmeVanPrice>
                </div>
              )}
              {mojRed && !prodavac && (
                <div className="btnrow" aria-label="Reply to the counter-offer">
                  <DugmeVanPrice varijanta="primary">Accept</DugmeVanPrice>
                  <DugmeVanPrice>Withdraw</DugmeVanPrice>
                </div>
              )}
              {!mojRed && !prihvaceno && <Napomena>Waiting for the {prodavac ? 'buying' : 'selling'} club to reply.</Napomena>}
            </div>
          </Kartica>

          {mojRed && prodavac && v.broj === 1 && (
            <ObrazacPonude
              v={p.verzije[1]}
              naslov="Your counter-offer (pre-filled)"
              dugme={<AkcijaDugme radnja="o1" uloga="selling" ikona="send" />}
            />
          )}
          {mojRed && !prodavac && v.broj === 2 && (
            <ObrazacPonude
              v={p.verzije[2]}
              naslov="Revise offer (pre-filled)"
              dugme={<AkcijaDugme radnja="o2" uloga="buying" ikona="send" />}
            />
          )}
          {!prodavac && n === 1 && (
            <Kartica naslov="Make an offer" id="make">
              <div className="stack">
                <p className="muted">Your offer v1 was sent on {DATUM.ponudaV1}. The form is pre-filled for the demo.</p>
                <div className="btnrow">
                  <DugmeVanPrice varijanta="primary" razlog="Done: offer v1 was sent">Send offer</DugmeVanPrice>
                </div>
              </div>
            </Kartica>
          )}
        </div>

        {!neizvrseno && <IstorijaVerzija verzije={p.verzije} razlike={p.razlike} trenutna={n} />}
      </div>
    </Ekran>
  )
}
