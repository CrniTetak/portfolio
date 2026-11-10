// F1. Financier Dashboard: tri pločice i tabela aktivnosti. Do koraka 8 glavno potraživanje se ne vidi.
// Finansijer NE vidi igrača, lične uslove, agenta ni bonuse.
import type { ReactElement } from 'react'
import { Chip } from '../../komponente/Chip'
import { DugmeLink } from '../../komponente/Dugme'
import { Ekran } from '../../komponente/Ekran'
import { Kartica, KpiPlocica, PlocicaPaznje } from '../../komponente/Kartica'
import { usePrica } from '../../prica/PricaProvider'
import { sledecaRadnja } from '../../prica/reducer'
import { daniKasnjenja, gotovo } from '../../pravila/izvedeno'
import { putZa } from '../../pravila/rute'
import { pogled } from '../../pravila/vidljivost'
import { eur } from '../../scenario/format'

export default function F1Tabla() {
  const { poz, skoci } = usePrica()
  const p = pogled('financier')
  const sl = sledecaRadnja(poz)
  const moja = sl && sl.uloga === 'financier' ? sl : undefined
  const vidljivo = gotovo(poz, 'f1') // prodavac je ponudio potraživanje
  const poslato = gotovo(poz, 'f2')
  const prihvaceno = gotovo(poz, 'f5') // ustupanje završeno
  const rata2 = gotovo(poz, 'f8')
  // isti broj kao na F2 (lista potraživanja): glavno potraživanje se računa čim je ponuđeno
  const dostupno = p.sporedna.length + (vidljivo ? 1 : 0)
  const kasnjenje = daniKasnjenja(poz)
  const pozicije = prihvaceno ? 1 : 0

  const aktivnosti: { kada: string; sta: string; iznos?: number; chip: ReactElement }[] = []
  if (vidljivo) {
    aktivnosti.push({
      kada: 'Newest',
      sta: `${p.prodavac}: receivable (debtor ${p.duznik})`,
      iznos: p.potrazivanje.nominal,
      chip: kasnjenje !== null && prihvaceno ? <Chip v="over" ikona="warn">Installment B overdue {kasnjenje} days</Chip> : rata2 ? <Chip v="paid" ikona="check">Installment A paid</Chip> : prihvaceno ? <Chip v="paid" ikona="check">Accepted</Chip> : poslato ? <Chip v="nego" ikona="clock">Offer sent</Chip> : <Chip v="sign" ikona="pen">Awaiting your offer</Chip>,
    })
  }
  for (const s of p.sporedna) {
    aktivnosti.push({ kada: s.rokovi, sta: `${s.prodavac}: receivable (debtor ${s.duznik})`, iznos: s.nominal, chip: <Chip v="neutral" ikona="eye">Overview only</Chip> })
  }

  return (
    <Ekran id="F1" naslov={`${p.finansijer.naziv} · ${p.finansijer.odeljenje}`} podnaslov="Financier dashboard">
      {moja ? (
        <PlocicaPaznje naslov="Needs your attention (1)" desno={<DugmeLink to={putZa('F3')} varijanta="primary" sm>Open</DugmeLink>}>
          <b>{moja.pazi}</b>
        </PlocicaPaznje>
      ) : !vidljivo ? (
        <PlocicaPaznje varijanta="info" naslov="Nothing for you at this step">
          {/* isti tekst u obe grane: finansijer ne sme da sazna ishod ove priče */}
          {poz.korak < 8 ? 'Your part starts at step 8. ' : 'No receivable has been offered to you yet. '}
          The receivables below belong to other clubs and are overview only.
          {poz.korak < 8 && (
            <div style={{ marginTop: 8 }}>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => skoci(8)}>Jump to step 8</button>
            </div>
          )}
        </PlocicaPaznje>
      ) : null}

      {kasnjenje !== null && prihvaceno && (
        <PlocicaPaznje naslov={`Installment B is overdue (${kasnjenje} days)`} ikona="warn" desno={<DugmeLink to={putZa('F7')} varijanta="primary" sm>Open</DugmeLink>}>
          <b>{eur(p.potrazivanje.rate[1].iznos)} was due on {p.potrazivanje.rate[1].datum}.</b>
        </PlocicaPaznje>
      )}

      <div className="grid g-3">
        <KpiPlocica oznaka="Receivables available" vrednost={dostupno} napomena={vidljivo ? 'Includes the receivable offered in this story' : "Other clubs' receivables, overview only"} />
        <KpiPlocica oznaka="My offers" vrednost={prihvaceno || poslato ? '1 sent' : vidljivo ? '1 draft' : '0'} napomena={prihvaceno ? 'Accepted by the seller' : poslato ? 'Waiting for the seller' : 'Drafts are not sent'} />
        <KpiPlocica oznaka="Active positions" vrednost={`${pozicije}`} napomena={prihvaceno ? 'Installments 2 and 3' : 'None yet'} />
      </div>

      <Kartica naslov="Recent activity" id="aktivnost" bezTela>
        <div className="tablewrap">
          <table className="t">
            <thead>
              <tr>
                <th>Receivable</th>
                <th>Due dates</th>
                <th className="r">Nominal amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {aktivnosti.length === 0 && (
                <tr>
                  <td colSpan={4} className="nolabel">Nothing yet.</td>
                </tr>
              )}
              {aktivnosti.map((a, i) => (
                <tr key={i} className={i === 0 && vidljivo ? 'story' : undefined}>
                  <td className="who" data-label="Receivable"><b>{a.sta}</b></td>
                  <td data-label="Due dates">{i === 0 && vidljivo ? `${p.potrazivanje.rate[0].datum}, ${p.potrazivanje.rate[1].datum}` : a.kada}</td>
                  <td data-label="Nominal amount" className="r num">{a.iznos ? eur(a.iznos) : ''}</td>
                  <td data-label="Status">{a.chip}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Kartica>
    </Ekran>
  )
}
