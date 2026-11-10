// S10. Installments, bonuses, sell-on: tri tabele i pločica "Next payment".
import { Chip } from '../../komponente/Chip'
import { DugmeLink } from '../../komponente/Dugme'
import { Ekran, useStanjeEkrana } from '../../komponente/Ekran'
import { PlocicaPaznje, PraznoStanje } from '../../komponente/Kartica'
import { KarticaSellOn, TabelaBonusa, TabelaRata } from '../../komponente/TabelaRata'
import { usePrica } from '../../prica/PricaProvider'
import { daniKasnjenja, gotovo, nastupiB1, odbijeno, statusRate } from '../../pravila/izvedeno'
import { korakEkrana } from '../../pravila/stanjeEkrana'
import { putZa } from '../../pravila/rute'
import { pogled } from '../../pravila/vidljivost'
import { DATUM } from '../../scenario/datumi'
import { eur } from '../../scenario/format'

export default function S10Rate() {
  const { poz } = usePrica()
  const stanje = useStanjeEkrana('S10')
  const p = pogled('selling')
  if (stanje === 'nije-pocelo' && !odbijeno(poz)) {
    return (
      <Ekran id="S10" naslov="Installments, bonuses, sell-on" transfer crumb="Installments">
        <PraznoStanje opis="After the first payout, the remaining installments, the bonuses and the sell-on share are tracked here." korak={korakEkrana('S10', 'selling')} />
      </Ekran>
    )
  }
  // Grana Rejected (povraćaj kupcu): nema rata
  if (odbijeno(poz)) {
    return (
      <Ekran id="S10" naslov="Installments" transfer>
        <PlocicaPaznje varijanta="info" ikona="undo" naslov="Not applicable: registration refused">In this illustration, there are no installments or bonuses because the transfer did not go through.</PlocicaPaznje>
        <div>
          <DugmeLink to={putZa('S13')} varijanta="secondary">Open exceptions</DugmeLink>
        </div>
      </Ekran>
    )
  }
  const f = p.finansiranje
  const dospelo2 = statusRate(2, poz)
  const kasnjenje = daniKasnjenja(poz)
  const nastupiTren = nastupiB1(poz, p.bonusNapredak)

  let tile
  if (kasnjenje !== null) {
    tile = (
      <PlocicaPaznje naslov={`Installment 3 is overdue (${kasnjenje} days)`} ikona="warn">
        The installment was assigned to {f.finansijer}, so the financier has been notified. Open Exceptions for the timeline.
      </PlocicaPaznje>
    )
  } else if (dospelo2 === 'paid-financier') {
    tile = (
      <PlocicaPaznje varijanta="ok" naslov="Installment 2 paid to the financier">
        <b>Installment 2 was paid to {f.finansijer} on {DATUM.rata2}.</b> You received the advance of {eur(f.avans)} earlier. Installment 3 is next, due {DATUM.rata3}.
      </PlocicaPaznje>
    )
  } else if (dospelo2 === 'assigned') {
    tile = (
      <PlocicaPaznje varijanta="ok" naslov="Receivable assigned">
        <b>Installments 2 and 3 are assigned to {f.finansijer}.</b> You received {eur(f.avans)} on {DATUM.ponudaFinansijera}. Escrow pays the financier directly.
      </PlocicaPaznje>
    )
  } else {
    tile = (
      <PlocicaPaznje varijanta="info" naslov="Next payment">
        <b>Installment 2 · {eur(p.dogovoreno.rate[1])} on {DATUM.rata2}.</b> You can turn installments 2 and 3 into cash today.
      </PlocicaPaznje>
    )
  }

  return (
    <Ekran
      id="S10"
      naslov="Installments, bonuses, sell-on"
      transfer
      crumb="Installments"
      podnaslov={`${p.igrac.ime} → ${p.protivStrana.naziv}`}
      akcije={!gotovo(poz, 'f1') ? <DugmeLink to={putZa('S11')} varijanta="primary" ikona="bank">Offer receivable to financiers</DugmeLink> : <Chip v="info" ikona="check">Receivable offered</Chip>}
    >
      {tile}
      <TabelaRata podaci={{ rate: p.dogovoreno.rate, datumi: p.dogovoreno.datumiRata }} kupac={false} />
      <TabelaBonusa bonusi={p.dogovoreno.bonusi} ukupno={p.dogovoreno.bonusiUkupno} nastupi={{ trenutno: nastupiTren, ukupno: p.bonusNapredak.ukupno }} />
      <KarticaSellOn postotak={p.dogovoreno.sellOnPct} kupac={false} />
    </Ekran>
  )
}
