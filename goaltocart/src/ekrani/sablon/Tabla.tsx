// S1 / B1. Kontrolna tabla kluba: pločica pažnje, pokazatelji, tabela 5 transfera, nadolazeća plaćanja.
// Jedan šablon, razlike po ulozi (prodavac prima, kupac duguje).
import { Link } from 'react-router'
import { Chip, ChipRate } from '../../komponente/Chip'
import { Ekran } from '../../komponente/Ekran'
import { DugmeLink } from '../../komponente/Dugme'
import { Kartica, KpiPlocica, PlocicaPaznje, Red } from '../../komponente/Kartica'
import { MiniLinijaFaze } from '../../komponente/Linije'
import { Ikona } from '../../komponente/Ikona'
import { fazaEscrow } from '../../komponente/Escrow'
import { usePrica } from '../../prica/PricaProvider'
import { nazivKoraka } from '../../prica/koraci'
import { sledecaRadnja } from '../../prica/reducer'
import { CEKA_ULOGU } from '../../tekstovi/prica'
import { brojVerzija, daniKasnjenja, fazaPovracaja, gotovo, jeZavrsen, nastupiB1, odbijeno, otvoreniKupca, otvoreniProdavca, ponudaPrihvacena, sledeciRok, statusRate } from '../../pravila/izvedeno'
import { putSporednog, putZa } from '../../pravila/rute'
import { pogled } from '../../pravila/vidljivost'
import { DATUM } from '../../scenario/datumi'
import { eur, pct } from '../../scenario/format'
import { IGRAC } from '../../scenario/strane'

type Klub = 'selling' | 'buying'

export default function Tabla({ uloga }: { uloga: Klub }) {
  const { poz, rezim } = usePrica()
  const prodavac = uloga === 'selling'
  const ps = prodavac ? pogled('selling') : null
  const pk = prodavac ? null : pogled('buying')
  const p = (ps ?? pk)!
  const ekranId = prodavac ? 'S1' : 'B1'
  const sl = sledecaRadnja(poz)
  const moja = sl && sl.uloga === uloga ? sl : undefined
  const kasnjenje = daniKasnjenja(poz)
  const zavrsen = jeZavrsen(poz, poz.korak)
  const sporedni = p.sporedni
  const rate = p.dogovoreno.rate
  const datumi = p.dogovoreno.datumiRata

  // Pokazatelji
  const otvoreno = prodavac ? otvoreniProdavca(poz) : otvoreniKupca(poz)
  // nepodmirena je i rata koja kasni (overdue)
  const sledecaRataIdx = ([1, 2, 3] as const).findIndex((n) => ['scheduled', 'secured', 'overdue'].includes(statusRate(n, poz)))
  const uEscrowu = gotovo(poz, 'e4') && !gotovo(poz, 'p1')
  const prihvaceno = ponudaPrihvacena(poz)
  const v = p.verzije[brojVerzija(poz) - 1] // tekuća ponuda: do prihvatanja to je jedino što se zna
  const faza = fazaEscrow(poz)
  const ustupljeno = prodavac && gotovo(poz, 'f5')
  const bonus1 = p.dogovoreno.bonusi[0]
  // grana Rejected od koraka 7: povraćaj kupcu, nema rata ni bonusa
  const povrat = odbijeno(poz)
  const fp = fazaPovracaja(poz)
  const vraceno = fp === 'vracen' || fp === 'potvrdjen' || fp === 'arhiviran'

  const imeTransfera = `${p.igrac.ime}`
  const brojTransfera = 1 + sporedni.length

  return (
    <Ekran
      id={ekranId}
      naslov={p.klub.naziv}
      podnaslov={`Sporting director view · ${brojTransfera} transfers`}
      akcije={rezim === 'guided' ? <Chip v="story" ikona="info">Guided story: Step {poz.korak} · {nazivKoraka(poz.korak, poz.grana, 'kratak')}</Chip> : undefined}
    >
      {moja ? (
        <PlocicaPaznje
          naslov="Needs your attention (1)"
          desno={<DugmeLink to={putZa(moja.ekran)} varijanta="primary" sm>Open</DugmeLink>}
        >
          <b>{moja.pazi}</b>
        </PlocicaPaznje>
      ) : (
        <PlocicaPaznje varijanta="info" ikona="clock" naslov="Needs your attention (0)">
          {sl ? (sl.uloga === 'sustav' ? sl.ceka : CEKA_ULOGU[sl.uloga]) + '. Open the transfer to follow what happens next.' : 'Nothing is waiting for you at this step.'}
        </PlocicaPaznje>
      )}

      {povrat && (
        <div className="grid g-3" data-povrat="da">
          {prodavac ? (
            <>
              <KpiPlocica oznaka="Open fixed fee" vrednost="Not applicable" napomena="Registration refused" />
              <KpiPlocica oznaka="Next payment in" vrednost="Nothing due" napomena="Registration refused" />
              <KpiPlocica
                oznaka="Escrow"
                vrednost={vraceno ? 'Returned' : fp === 'pokrenut' ? 'Refund initiated' : 'Refund to follow'}
                napomena={vraceno ? 'Funds returned to the buyer' : 'In this illustration, funds go back to the buyer'}
              />
            </>
          ) : (
            <>
              <KpiPlocica oznaka="Amount you owe" vrednost="Not applicable" napomena="Registration refused" />
              <KpiPlocica oznaka="Next payment you owe" vrednost="Nothing due" napomena="Registration refused" />
              <KpiPlocica
                oznaka="Escrow deposit"
                vrednost={vraceno ? 'Returned' : fp === 'pokrenut' ? 'Refund initiated' : 'Refund to follow'}
                napomena={vraceno ? `${eur(pk!.povracaj)} returned to your account` : `In this illustration, ${eur(pk!.povracaj)} goes back to you`}
              />
            </>
          )}
        </div>
      )}
      {!povrat && (
      <div className="grid g-3">
        {prodavac ? (
          <>
            {prihvaceno ? (
              <KpiPlocica
                oznaka="Open fixed fee"
                vrednost={eur(otvoreno)}
                napomena={ustupljeno ? `Installments 2 and 3 are assigned to ${ps!.finansiranje.finansijer}` : `${imeTransfera}, ${rate.length} installments`}
              />
            ) : (
              <KpiPlocica oznaka="Offer on the table" vrednost={eur(v.fiksni)} napomena={`Fixed fee in offer v${v.broj} · under negotiation`} />
            )}
            {prihvaceno ? (
              <KpiPlocica
                oznaka="Next payment in"
                vrednost={sledecaRataIdx >= 0 && !ustupljeno ? eur(rate[sledecaRataIdx]) : eur(0)}
                napomena={sledecaRataIdx >= 0 && !ustupljeno ? `Installment ${sledecaRataIdx + 1} · ${datumi[sledecaRataIdx]}` : 'Remaining installments are assigned'}
              />
            ) : (
              <KpiPlocica oznaka="Next payment in" vrednost="Not agreed yet" napomena="Installments are set when the offer is accepted" />
            )}
            <KpiPlocica
              oznaka="Held in escrow"
              vrednost={eur(uEscrowu ? ps!.escrow.iznos : 0)}
              napomena={uEscrowu ? 'Waiting for registration' : faza === 'isplaceno' ? 'Released on registration' : `Buyer deposit due ${DATUM.escrowRok}`}
            />
          </>
        ) : (
          <>
            {prihvaceno ? (
              <KpiPlocica oznaka="Amount you owe" vrednost={eur(otvoreno)} napomena={`${imeTransfera}, ${rate.length} installments`} />
            ) : (
              <KpiPlocica oznaka="Offer on the table" vrednost={eur(v.fiksni)} napomena={`Fixed fee in offer v${v.broj} · under negotiation`} />
            )}
            {prihvaceno ? (
              <KpiPlocica
                oznaka="Next payment you owe"
                vrednost={!gotovo(poz, 'e4') ? eur(pk!.uplata.ukupno) : sledecaRataIdx > 0 ? eur(rate[sledecaRataIdx]) : eur(0)}
                napomena={
                  !gotovo(poz, 'e4')
                    ? `Escrow deposit · due ${DATUM.escrowRok}`
                    : sledecaRataIdx > 0
                      ? `Installment ${sledecaRataIdx + 1} · ${kasnjenje !== null ? `overdue ${kasnjenje} days` : datumi[sledecaRataIdx]}`
                      : 'Nothing due now'
                }
              />
            ) : (
              <KpiPlocica oznaka="Next payment you owe" vrednost="Not agreed yet" napomena="The escrow deposit is calculated when the offer is accepted" />
            )}
            <KpiPlocica
              oznaka="Escrow deposit"
              vrednost={faza === 'isplaceno' ? 'Released' : faza === 'obezbedjeno' ? 'Confirmed' : 'Not yet'}
              napomena={
                faza === 'isplaceno'
                  ? `Released at registration on ${DATUM.isplata}`
                  : faza === 'obezbedjeno'
                    ? `${eur(pk!.uplata.ukupno)} secured`
                    : prihvaceno ? `Due by ${DATUM.escrowRok}` : 'After the offer is accepted'
              }
            />
          </>
        )}
      </div>
      )}

      <div className="grid g-2-1">
        <Kartica naslov={`Your transfers (${brojTransfera})`} id="transferi" bezTela desno={<DugmeLink to={putZa(prodavac ? 'S2' : 'B2')} varijanta="ghost" sm>View main transfer</DugmeLink>}>
          <div className="tablewrap">
            <table className="t">
              <thead>
                <tr>
                  <th>Player</th>
                  <th>Counterparty</th>
                  <th>Phase</th>
                  <th>Next deadline</th>
                  <th className="r">{prodavac ? 'Open amount' : 'Amount you owe'}</th>
                </tr>
              </thead>
              <tbody>
                <tr className="story">
                  <td className="who" data-label="Player">
                    <Link className="rowlink" to={putZa(prodavac ? 'S2' : 'B2')}>{p.igrac.ime}</Link>
                    <small>{rezim === 'guided' ? <Chip v="story">Guided story</Chip> : 'Main transfer'}</small>
                  </td>
                  <td data-label="Counterparty">{p.protivStrana.naziv}</td>
                  <td data-label="Phase">
                    <MiniLinijaFaze korak={poz.korak} zavrsen={zavrsen} zakasnelo={kasnjenje !== null} tekst={`Step ${poz.korak} · ${nazivKoraka(poz.korak, poz.grana, 'kratak')}`} />
                  </td>
                  <td data-label="Next deadline" className="num">{sledeciRok(poz)}</td>
                  <td data-label={prodavac ? 'Open amount' : 'Amount you owe'} className="r num"><b>{povrat ? '—' : prihvaceno ? eur(otvoreno) : eur(v.fiksni)}</b>{!prihvaceno && <small className="muted" style={{ display: 'block', fontWeight: 400 }}>Under negotiation</small>}</td>
                </tr>
                {sporedni.map((t) => (
                  <tr key={t.id}>
                    <td className="who" data-label="Player">
                      <Link className="rowlink" to={putSporednog(uloga, t.id)}>{t.igrac}</Link>
                      <small>{t.tip === 'Loan' ? 'Loan' : t.smer}</small>
                    </td>
                    <td data-label="Counterparty">{t.protivStrana}</td>
                    <td data-label="Phase">
                      <MiniLinijaFaze korak={t.korak} zakasnelo={!!t.zakasnelo} tekst={`Step ${t.korak} · ${nazivKoraka(t.korak, 'approved', 'kratak')}`} />
                      {t.zakasnelo && <Chip v="over" ikona="warn">Installment overdue</Chip>}
                    </td>
                    <td data-label="Next deadline" className="num" style={t.zakasnelo ? { color: 'var(--money-over)', fontWeight: 600 } : undefined}>{t.rok}</td>
                    <td data-label={prodavac ? 'Open amount' : 'Amount you owe'} className="r num">{eur(t.iznos)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Kartica>

        <div className="grid" style={{ alignContent: 'start' }}>
          <Kartica naslov={prodavac ? 'Upcoming payments' : 'Upcoming payments you owe'} id="nadolazeca">
            {povrat && <p className="muted">Not applicable: registration refused.</p>}
            {!prihvaceno && !povrat && <p className="muted">Under negotiation: the installments are set once the offer is accepted. Offer v{v.broj} proposes {eur(v.fiksni)} fixed.</p>}
            {prihvaceno && !povrat && !prodavac && (
              <Red
                naziv="Escrow deposit"
                opis={`${DATUM.escrowRok} · installment 1, commission and fee`}
                desno={
                  <span style={{ textAlign: 'right' }}>
                    <b className="num">{eur(pk!.uplata.ukupno)}</b>
                    <br />
                    <ChipRate status={statusRate(1, poz)} kupac />
                  </span>
                }
              />
            )}
            {prihvaceno && !povrat && ([1, 2, 3] as const).filter((n) => prodavac || n > 1).map((n) => (
              <Red
                key={n}
                naziv={`Installment ${n}`}
                opis={`${datumi[n - 1]}${n === 1 ? ' · after registration' : ''}`}
                desno={
                  <span style={{ textAlign: 'right' }}>
                    <b className="num">{eur(rate[n - 1])}</b>
                    <br />
                    <ChipRate status={statusRate(n, poz)} kupac={!prodavac} kasnjenje={n === 3 ? kasnjenje : null} />
                  </span>
                }
              />
            ))}
          </Kartica>
          {prodavac ? (
            <Kartica naslov={povrat ? 'Bonuses' : 'Bonuses & sell-on watch'} id="bonusi">
              {povrat ? (
                <p className="muted">Not applicable: registration refused.</p>
              ) : (
                <>
              <Red
                naziv={`${bonus1.id} · ${bonus1.opis}`}
                opis={bonus1.izvor}
                desno={<Chip v="neutral" ikona="clock">{nastupiB1(poz, ps!.bonusNapredak)} / {ps!.bonusNapredak.ukupno}</Chip>}
              />
              <Red naziv={prihvaceno ? `Sell-on ${pct(p.dogovoreno.sellOnPct)}` : `Sell-on ${pct(v.sellOnPct)} (proposed)`} opis="of net profit on a future sale" desno={<Chip v="neutral">None recorded</Chip>} />
            </>
              )}
            </Kartica>
          ) : (
            <Kartica naslov="FX cost estimate" id="fx">
              <p>
                <Ikona ime="check" sm /> Payment in EUR — no conversion cost.
              </p>
              <p className="muted">{povrat ? 'In this illustration, platform fees would not be charged when the transfer is replaced by a refund.' : prihvaceno ? `Fees for this transfer: platform fee, your half ${eur(p.naknada.pola)} (${p.naknada.pct}).` : 'The platform fee is calculated once the offer is accepted.'}</p>
            </Kartica>
          )}
        </div>
      </div>
    </Ekran>
  )
}
