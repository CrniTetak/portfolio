// B9. Payments schedule (kupac): rate, bonusi, sell-on; pločica "Next payment you owe"; "Fund installment 2 into escrow".
import { Chip } from '../../komponente/Chip'
import { AkcijaDugme, DugmeLink } from '../../komponente/Dugme'
import { putZa } from '../../pravila/rute'
import { Ekran, useStanjeEkrana } from '../../komponente/Ekran'
import { Napomena, PlocicaPaznje, PraznoStanje } from '../../komponente/Kartica'
import { KarticaSellOn, TabelaBonusa, TabelaRata } from '../../komponente/TabelaRata'
import { usePrica } from '../../prica/PricaProvider'
import { daniKasnjenja, gotovo, nastupiB1, odbijeno, statusRate } from '../../pravila/izvedeno'
import { korakEkrana } from '../../pravila/stanjeEkrana'
import { pogled } from '../../pravila/vidljivost'
import { DATUM } from '../../scenario/datumi'
import { eur } from '../../scenario/format'

export default function B9Placanja() {
  const { poz } = usePrica()
  const stanje = useStanjeEkrana('B9')
  const p = pogled('buying')
  if (stanje === 'nije-pocelo') {
    return (
      <Ekran id="B9" naslov="Payments" transfer>
        <PraznoStanje opis="Once registration is confirmed, installment 1 is paid out and the schedule of what you owe is tracked here." korak={korakEkrana('B9', 'buying')} />
      </Ekran>
    )
  }
  // Grana Rejected (povraćaj kupcu): nema isplate
  if (odbijeno(poz)) {
    return (
      <Ekran id="B9" naslov="Payments" transfer>
        <PlocicaPaznje varijanta="info" ikona="undo" naslov="Nothing due">In this illustration, no installments are owed because the transfer did not go through.</PlocicaPaznje>
        <div>
          <DugmeLink to={putZa('B11')} varijanta="secondary">Open exceptions</DugmeLink>
        </div>
      </Ekran>
    )
  }
  const r = p.dogovoreno.rate
  const kasnjenje = daniKasnjenja(poz)
  const placeno1 = gotovo(poz, 'p1')
  const funded2 = gotovo(poz, 'f8')
  const poslato2 = gotovo(poz, 'f6')

  let tile
  if (kasnjenje !== null) {
    tile = (
      <PlocicaPaznje naslov={`Installment 3 is overdue (${kasnjenje} days)`} ikona="warn">
        <b>{eur(r[2])} was due on {DATUM.rata3}.</b> Reminders have been sent. See Exceptions.
      </PlocicaPaznje>
    )
  } else if (funded2) {
    tile = (
      <PlocicaPaznje varijanta="ok" naslov="Installment 2 funded">
        <b>{eur(r[1])} was funded and paid out.</b> Next payment you owe: installment 3, {eur(r[2])} on {DATUM.rata3}.
      </PlocicaPaznje>
    )
  } else if (placeno1 && poz.korak >= 8) {
    tile = (
      <PlocicaPaznje varijanta="warn" naslov="Next payment you owe">
        <b>{eur(r[1])} on {DATUM.rata2}</b>: installment 2, due in {p.rata2UMesecima} months.
      </PlocicaPaznje>
    )
  } else {
    tile = (
      <PlocicaPaznje varijanta="info" naslov="Next payment you owe">
        <b>Installment 1 · {eur(r[0])}</b> is paid out from escrow on {DATUM.isplata}. Then {eur(r[1])} on {DATUM.rata2}.
      </PlocicaPaznje>
    )
  }

  return (
    <Ekran
      id="B9"
      naslov="Payments"
      transfer
      podnaslov={`${p.igrac.ime} → ${p.protivStrana.naziv}`}
      akcije={placeno1 ? <Chip v="paid" ikona="check">Installment 1 paid out</Chip> : <Chip v="neutral" ikona="clock">Installment 1 scheduled</Chip>}
    >
      {tile}
      <TabelaRata podaci={{ rate: r, datumi: p.dogovoreno.datumiRata }} kupac />
      <div className="btnrow">
        {!placeno1 && <AkcijaDugme radnja="p1" uloga="buying" />}
        {placeno1 && poz.korak >= 8 && !poslato2 && <AkcijaDugme radnja="f6" uloga="buying" ikona="wallet">Fund installment 2 into escrow</AkcijaDugme>}
        {poslato2 && !funded2 && <DugmeLink to={putZa('B10')} varijanta="primary">View account approvals</DugmeLink>}
      </div>
      {poslato2 && !funded2 && <Napomena>Funding of installment 2 was sent for approval. Two people approve it, as with the first deposit.</Napomena>}
      <TabelaBonusa bonusi={p.dogovoreno.bonusi} ukupno={p.dogovoreno.bonusiUkupno} nastupi={{ trenutno: nastupiB1(poz, p.bonusNapredak), ukupno: p.bonusNapredak.ukupno }} />
      <KarticaSellOn postotak={p.dogovoreno.sellOnPct} kupac />
      <Napomena>Fixed installments are paid through escrow. Bonuses are triggered by official data, and you are notified before anything falls due.</Napomena>
    </Ekran>
  )
}
